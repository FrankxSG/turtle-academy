import Dexie, { type EntityTable, type Table, liveQuery } from 'dexie'
import type { PrivatePack } from './pack.ts'
import type { CrosswalkRow } from './intake.ts'
import type { ProductionEvent } from './production.ts'
import type { PrivateStore, StoredBuild } from './program.ts'
import type { RemoteRecord } from '../sync/changes.ts'
import { makeOps, newMeta, observe, type OutboxOp, type Owner, type SyncMeta } from '../sync/outbox.ts'
import { caseLinkChanges, packChanges, productionChange, syncablePack, usablePackVersion, withLocalWrongForms } from '../sync/pack.ts'
import type { Ack, PackSyncStore } from '../sync/store.ts'
import type { Change } from '../sync/validate.ts'

// ---------------------------------------------------------------------------------------------------
// Private mistake programme store (src/mistakes). Separate database per identity: packs, crosswalk,
// parent-observed production events and kept content builds. Never part of the engine records or snapshot.
//
// Live sync (version 2): each pack, case-link or production write queues its upload operation in the same
// transaction (this database's own outbox). The pack is queued stripped of wrong forms and authoring notes.
// Downloaded pack versions are kept (`versions`) so a task pinned to an earlier version can be rebuilt.

type PrivateDb = Dexie & {
  packs: EntityTable<PrivatePack, 'pack_id'>
  kv: Table<{ key: string; value: unknown }, string>
  production: EntityTable<ProductionEvent, 'id'>
  builds: EntityTable<StoredBuild, 'version'>
  outbox: EntityTable<OutboxOp, 'seq'>
  sync: EntityTable<SyncMeta, 'id'>
  versions: Table<{ ref: string; pack: PrivatePack }, string>
}

const now = () => new Date().toISOString()

/** Sync bookkeeping for the current pack, kept in the sync table so it never shares a write with case links (kv). */
interface PackState { id: 'pack'; ref: string | null; issue: string | null }

export class DexiePrivateStore implements PrivateStore, PackSyncStore {
  readonly stream = 'pack' as const
  private readonly db: PrivateDb
  constructor(name: string) {
    this.db = new Dexie(name) as PrivateDb
    this.db.version(1).stores({ packs: 'pack_id', kv: 'key', production: 'id', builds: 'version' })
    this.db.version(2).stores({ outbox: 'seq, &op_id, *keys', sync: 'id', versions: 'ref' })
  }
  async open() { await this.db.open() }
  close() { this.db.close() }
  async packs() { return this.db.packs.toArray() }
  onChange(fn: () => void): () => void {
    // Observe durable commits, including production-only writes which never touch the engine writer.
    const subscription = liveQuery(() => this.db.outbox.toArray()).subscribe({ next: () => fn(), error: () => fn() })
    return () => subscription.unsubscribe()
  }

  /** Queue changes in the current transaction when this store is bound to a family. */
  private async queue(changes: Change[]) {
    const meta = await this.db.sync.get('meta')
    if (!meta?.owner || changes.length === 0) return
    const iso = now()
    await this.db.outbox.bulkAdd(makeOps(meta, changes, { iso, ms: Date.parse(iso) }))
    await this.db.sync.put(meta)
  }

  /** Stripped form and its changes, computed before the transaction (hashing is asynchronous). */
  private async prepare(p: PrivatePack): Promise<{ changes: Change[]; issue: string | null; version: { ref: string; pack: PrivatePack } | null }> {
    const s = await syncablePack(p)
    return s.ok ? { changes: packChanges(s.ref, s.stripped), issue: null, version: { ref: s.ref, pack: s.stripped } } : { changes: [], issue: s.code, version: null }
  }

  /** The current pack replaces any earlier one; tasks pinned to earlier content keep it through stored builds. */
  async putPack(p: PrivatePack) {
    const prepared = await this.prepare(p)
    await this.db.transaction('rw', [this.db.packs, this.db.outbox, this.db.sync, this.db.versions], async () => {
      await this.db.packs.clear()
      await this.db.packs.put(p)
      await this.putPackState({ id: 'pack', ref: prepared.version?.ref ?? null, issue: prepared.issue })
      if (prepared.version) await this.db.versions.put(prepared.version)
      await this.queue(prepared.changes)
    })
  }
  async crosswalk() { return ((await this.db.kv.get('crosswalk'))?.value as CrosswalkRow[] | undefined) ?? [] }
  async putCrosswalk(rows: CrosswalkRow[]) {
    await this.db.transaction('rw', [this.db.kv, this.db.outbox, this.db.sync], async () => {
      const previous = ((await this.db.kv.get('crosswalk'))?.value as CrosswalkRow[] | undefined) ?? []
      await this.db.kv.put({ key: 'crosswalk', value: rows })
      await this.queue(caseLinkChanges(previous, rows))
    })
  }
  async production() { return this.db.production.toArray() }
  async addProduction(e: ProductionEvent) {
    // Add-only: a repeated id (double tap, re-sync) is ignored, never overwritten.
    await this.db.transaction('rw', [this.db.production, this.db.outbox, this.db.sync], async () => {
      if (await this.db.production.get(e.id)) return
      await this.db.production.add(e)
      await this.queue([productionChange(e)])
    })
  }
  async releases() { return this.db.builds.toArray() }
  async putRelease(b: StoredBuild) { await this.db.builds.put(b) }
  async deleteRelease(version: string) { await this.db.builds.delete(version) }
  async packVersions() { return (await this.db.versions.toArray()).map((v) => v.pack) }

  // ------------------------------------------------------------------------------------------------- sync

  async meta(): Promise<SyncMeta> {
    return this.db.transaction('rw', this.db.sync, async () => {
      const existing = await this.db.sync.get('meta')
      if (existing) return existing
      const meta = newMeta()
      await this.db.sync.put(meta)
      return meta
    })
  }

  async bind(owner: Owner, opts: { backfill: boolean; now: string }): Promise<'bound' | 'already'> {
    await this.meta()
    const current = (await this.db.packs.toArray())[0] ?? null
    const prepared = opts.backfill && current ? await this.prepare(current) : null
    const tables = [this.db.packs, this.db.kv, this.db.production, this.db.outbox, this.db.sync, this.db.versions]
    return this.db.transaction('rw', tables, async () => {
      const meta = (await this.db.sync.get('meta')) as SyncMeta
      if (meta.owner) {
        if (meta.owner.family_id !== owner.family_id || meta.owner.child_id !== owner.child_id) throw new Error('binding_mismatch')
        return 'already'
      }
      meta.owner = { ...owner }
      if (opts.backfill) {
        const still = (await this.db.packs.toArray())[0] ?? null
        const changes: Change[] = []
        if (prepared && still && JSON.stringify(still) === JSON.stringify(current)) {
          changes.push(...prepared.changes)
          await this.putPackState({ id: 'pack', ref: prepared.version?.ref ?? null, issue: prepared.issue })
          if (prepared.version) await this.db.versions.put(prepared.version)
        }
        changes.push(...caseLinkChanges([], ((await this.db.kv.get('crosswalk'))?.value as CrosswalkRow[] | undefined) ?? []))
        changes.push(...(await this.db.production.toArray()).map(productionChange))
        await this.db.outbox.bulkAdd(makeOps(meta, changes, { iso: opts.now, ms: Date.parse(opts.now) }))
      }
      await this.db.sync.put(meta)
      return 'bound'
    })
  }

  async outbox(limit: number) { return this.db.outbox.orderBy('seq').limit(limit).toArray() }
  async counts() {
    const all = await this.db.outbox.toArray()
    return { pending: all.filter((o) => o.state === 'pending').length, rejected: all.filter((o) => o.state === 'rejected').length }
  }
  async acknowledge(acks: Ack[], _at: string) {
    await this.db.transaction('rw', [this.db.outbox, this.db.sync], async () => {
      const meta = (await this.db.sync.get('meta')) as SyncMeta
      for (const a of acks) {
        observe(meta, a.stamp)
        await this.db.outbox.where('op_id').equals(a.op_id).delete()
      }
      await this.db.sync.put(meta)
    })
  }
  async reject(opId: string, code: string) { await this.db.outbox.where('op_id').equals(opId).modify({ state: 'rejected', code }) }
  async reoffer() {
    await this.db.outbox.filter((o) => o.state === 'rejected' && !o.code?.startsWith('local:')).modify({ state: 'pending', code: null })
  }
  // As in DexieRecordStore, avoid WebKit's empty nextunique cursor failure; Set deduplicates the keys.
  async pendingKeys() { return new Set(await this.db.outbox.orderBy('keys').keys() as string[]) }
  async hasLearningRecords() {
    return (await this.db.packs.count()) > 0 || (await this.db.production.count()) > 0 || (await this.crosswalk()).length > 0
  }
  async setLastSync(at: string) {
    await this.meta()
    await this.db.sync.update('meta', { last_sync_at: at })
  }
  private async packState(): Promise<PackState | undefined> {
    return (await this.db.sync.get('pack' as never)) as unknown as PackState | undefined
  }
  private async putPackState(state: PackState) { await this.db.sync.put(state as unknown as SyncMeta) }
  async issue() { return (await this.packState())?.issue ?? null }
  usable(value: unknown) { return usablePackVersion(value) }

  /** Downloaded pack records. Saved without queuing; this device's own wrong forms for the same cases are kept. */
  async applyRemote(r: { versions: { ref: string; pack: PrivatePack }[]; active: string | null; links: RemoteRecord[]; production: ProductionEvent[] }): Promise<boolean> {
    const tables = [this.db.packs, this.db.kv, this.db.production, this.db.versions, this.db.sync]
    return this.db.transaction('rw', tables, async () => {
      let changed = false
      for (const v of r.versions) if (!(await this.db.versions.get(v.ref))) await this.db.versions.put({ ref: v.ref, pack: v.pack })
      const currentRef = (await this.packState())?.ref ?? null
      if (r.active && r.active !== currentRef) {
        const version = await this.db.versions.get(r.active)
        if (version) {
          const local = (await this.db.packs.toArray())[0] ?? null
          await this.db.packs.clear()
          await this.db.packs.put(withLocalWrongForms(version.pack, local))
          await this.putPackState({ id: 'pack', ref: r.active, issue: null })
          changed = true
        }
      }
      if (r.links.length > 0) {
        const before = ((await this.db.kv.get('crosswalk'))?.value as CrosswalkRow[] | undefined) ?? []
        const rows = new Map(before.map((x) => [x.case_id, x]))
        for (const l of r.links) {
          if (l.deleted || !l.value) rows.delete(l.key)
          else rows.set(l.key, l.value as unknown as CrosswalkRow)
        }
        const next = [...rows.values()].sort((a, b) => a.case_id.localeCompare(b.case_id))
        if (JSON.stringify(next) !== JSON.stringify([...before].sort((a, b) => a.case_id.localeCompare(b.case_id)))) {
          await this.db.kv.put({ key: 'crosswalk', value: next })
          changed = true
        }
      }
      for (const e of r.production) {
        if (!(await this.db.production.get(e.id))) { await this.db.production.add(e); changed = true }
      }
      return changed
    })
  }
}
