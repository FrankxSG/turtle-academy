import Dexie, { type EntityTable, type Table, liveQuery } from 'dexie'
import type { Mutation, RecordStore, StoredRecords, Put } from './engine/persistence.ts'
import { eventChange, recordChanges, stateChanges, type RemoteRecord } from './sync/changes.ts'
import { makeOps, newMeta, observe, type OutboxOp, type Owner, type SyncMeta } from './sync/outbox.ts'
import type { Ack, RecordsSyncStore } from './sync/store.ts'
import type { Change } from './sync/validate.ts'
import type { AnswerEvent } from './engine/types.ts'
import { inspectLegacy, type LegacyMarker, type LegacyReader, type MarkerStore } from './engine/legacy.ts'

export type SampleAnswer = 'turtle' | 'stone' | 'chair'
export interface GuestCheckpoint {
  id: 'sample'
  schemaVersion: 1
  attempts: number
  lastAnswer: SampleAnswer | null
}
const db = new Dexie('turtle-academy-guest-v1') as Dexie & {
  checkpoints: EntityTable<GuestCheckpoint, 'id'>
}
db.version(1).stores({ checkpoints: 'id' })

const emptyCheckpoint = (): GuestCheckpoint => ({
  id: 'sample', schemaVersion: 1, attempts: 0, lastAnswer: null,
})
function validate(value: GuestCheckpoint | undefined): GuestCheckpoint {
  if (!value) return emptyCheckpoint()
  if (value.schemaVersion !== 1 || value.id !== 'sample'
    || !Number.isSafeInteger(value.attempts) || value.attempts < 0
    || ![null, 'turtle', 'stone', 'chair'].includes(value.lastAnswer)) {
    // Preserve unfamiliar records instead of overwriting them.
    throw new Error('Unsupported guest checkpoint')
  }
  return value
}
export function observeCheckpoint() {
  return liveQuery(async () => validate(await db.checkpoints.get('sample')))
}
export async function saveSampleAnswer(answer: SampleAnswer) {
  // Atomic read/write also prevents lost increments from a second tab.
  await db.transaction('rw', db.checkpoints, async () => {
    const previous = validate(await db.checkpoints.get('sample'))
    await db.checkpoints.put({ ...previous, attempts: previous.attempts + 1, lastAnswer: answer })
  })
}

export async function openGuestStorage() {
  // liveQuery does not emit errors when IndexedDB is missing; open explicitly first.
  await db.open()
}

// ---------------------------------------------------------------------------------------------------
// Pilot learner store (Issue #17). A separate database: the guest database above is never upgraded,
// modified or deleted by the Pilot, and its contents never become child evidence (src/engine/legacy.ts).
// Records are keyed puts; answer events are add-only; every mutation is applied at most once.

export const PILOT_DB_NAME = 'turtle-academy-pilot-v1'

type PilotDb = Dexie & {
  records: Table<Put, [string, string]>
  events: EntityTable<AnswerEvent, 'id'>
  mutations: EntityTable<{ id: string; order: number }, 'id'>
  legacy: EntityTable<LegacyMarker & { id: 'guest' }, 'id'>
  // Live sync (version 2): durable upload queue, sync metadata and the restartable restore staging area.
  outbox: EntityTable<OutboxOp, 'seq'>
  sync: EntityTable<SyncMeta, 'id'>
  staging: Table<RemoteRecord & { id: string }, string>
}

export function openPilotDb(name = PILOT_DB_NAME): PilotDb {
  const pilot = new Dexie(name) as PilotDb
  pilot.version(1).stores({ records: '[table+key]', events: 'id', mutations: 'id', legacy: 'id' })
  // Adds tables only: existing records, events and markers are untouched by the upgrade.
  pilot.version(2).stores({ outbox: 'seq, &op_id, *keys', sync: 'id', staging: 'id' })
  return pilot
}

const LEARNING_TABLES = ['tasks', 'presentations', 'targets', 'completions', 'amendments']

export class DexieRecordStore implements RecordStore, MarkerStore, RecordsSyncStore {
  readonly stream = 'records' as const
  private readonly pilot: PilotDb
  private readonly clock: () => string
  constructor(pilot: PilotDb, clock: () => string = () => new Date().toISOString()) {
    this.pilot = pilot
    this.clock = clock
  }

  async commit(m: Mutation): Promise<void> {
    const { records, events, mutations, outbox, sync } = this.pilot
    await this.pilot.transaction('rw', [records, events, mutations, outbox, sync], async () => {
      if (await mutations.get(m.id)) return
      // The upload operation is written in this same transaction: a committed change is never left without its
      // queued upload, and a failed local save queues nothing (no direct cloud write bypasses local saving).
      const meta = m.remote ? undefined : await sync.get('meta')
      const changes: Change[] = []
      if (meta?.owner) {
        for (const p of m.puts) {
          const previous = p.table === 'settings' || p.table === 'story' ? (await records.get([p.table, p.key]))?.value : undefined
          changes.push(...recordChanges(p, previous))
        }
      }
      for (const d of m.deletes ?? []) await records.delete([d.table, d.key])
      if (m.puts.length > 0) await records.bulkPut(m.puts)
      for (const e of m.events) {
        const existing = await events.get(e.id)
        if (existing && JSON.stringify(existing) !== JSON.stringify(e)) throw new Error('append-only event conflict')
        if (!existing) {
          await events.add(e)
          if (meta?.owner) changes.push(eventChange(e))
        }
      }
      await mutations.put({ id: m.id, order: m.order })
      if (meta?.owner && changes.length > 0) {
        const iso = this.clock()
        await outbox.bulkAdd(makeOps(meta, changes, { iso, ms: Date.parse(iso) }))
        await sync.put(meta)
      }
    })
  }

  async load(): Promise<StoredRecords> {
    return { records: await this.pilot.records.toArray(), events: await this.pilot.events.toArray() }
  }

  async getMarker(): Promise<LegacyMarker | undefined> {
    const row = await this.pilot.legacy.get('guest')
    if (!row) return undefined
    return { status: row.status, first_seen_at: row.first_seen_at, migrated: false }
  }

  async putMarker(m: LegacyMarker): Promise<void> {
    await this.pilot.legacy.put({ id: 'guest', ...m })
  }

  // ------------------------------------------------------------------------------------------------- sync

  private async ensureMeta(): Promise<SyncMeta> {
    const { sync } = this.pilot
    return this.pilot.transaction('rw', sync, async () => {
      const existing = await sync.get('meta')
      if (existing) return existing
      const meta = newMeta()
      await sync.put(meta)
      return meta
    })
  }

  async meta(): Promise<SyncMeta> { return this.ensureMeta() }

  async bind(owner: Owner, opts: { backfill: boolean; now: string }): Promise<'bound' | 'already'> {
    await this.ensureMeta()
    const { records, events, outbox, sync } = this.pilot
    return this.pilot.transaction('rw', [records, events, outbox, sync], async () => {
      const meta = (await sync.get('meta')) as SyncMeta
      if (meta.owner) {
        if (meta.owner.family_id !== owner.family_id || meta.owner.child_id !== owner.child_id) throw new Error('binding_mismatch')
        return 'already'
      }
      meta.owner = { ...owner }
      if (opts.backfill) {
        // Records already in this identity's local store, uploaded once under the verified family/child.
        const ops = makeOps(meta, stateChanges(await records.toArray(), await events.toArray()), { iso: opts.now, ms: Date.parse(opts.now) })
        await outbox.bulkAdd(ops)
      }
      await sync.put(meta)
      return 'bound'
    })
  }

  async outbox(limit: number): Promise<OutboxOp[]> { return this.pilot.outbox.orderBy('seq').limit(limit).toArray() }

  async counts() {
    const all = await this.pilot.outbox.toArray()
    return { pending: all.filter((o) => o.state === 'pending').length, rejected: all.filter((o) => o.state === 'rejected').length }
  }

  async acknowledge(acks: Ack[], at: string): Promise<void> {
    const { outbox, sync } = this.pilot
    await this.pilot.transaction('rw', [outbox, sync], async () => {
      const meta = (await sync.get('meta')) as SyncMeta
      for (const a of acks) {
        observe(meta, a.stamp)
        await outbox.where('op_id').equals(a.op_id).delete()
      }
      meta.last_sync_at = at
      await sync.put(meta)
    })
  }

  async reject(opId: string, code: string): Promise<void> {
    await this.pilot.outbox.where('op_id').equals(opId).modify({ state: 'rejected', code })
  }

  async reoffer(): Promise<void> {
    await this.pilot.outbox.filter((o) => o.state === 'rejected' && !o.code?.startsWith('local:')).modify({ state: 'pending', code: null })
  }

  async pendingKeys(): Promise<Set<string>> {
    return new Set(await this.pilot.outbox.orderBy('keys').uniqueKeys() as string[])
  }

  async hasLearningRecords(): Promise<boolean> {
    if ((await this.pilot.events.count()) > 0) return true
    for (const t of LEARNING_TABLES) if ((await this.pilot.records.where('[table+key]').between([t, Dexie.minKey], [t, Dexie.maxKey]).count()) > 0) return true
    return false
  }

  private async patchMeta(fn: (m: SyncMeta) => void) {
    await this.ensureMeta()
    const { sync } = this.pilot
    await this.pilot.transaction('rw', sync, async () => {
      const meta = (await sync.get('meta')) as SyncMeta
      fn(meta)
      await sync.put(meta)
    })
  }

  async setLastSync(at: string) { await this.patchMeta((m) => { m.last_sync_at = at }) }
  async setCursor(cursor: number) { await this.patchMeta((m) => { m.cursor = cursor }) }
  async startRecovery(at: string) { await this.patchMeta((m) => { m.recovery ??= { started_at: at, cursor: 0, done: false } }) }

  async stage(rows: RemoteRecord[], recoveryCursor: number): Promise<void> {
    const { staging, sync } = this.pilot
    await this.pilot.transaction('rw', [staging, sync], async () => {
      await staging.bulkPut(rows.map((r) => ({ ...r, id: `${r.kind}|${r.key}` })))
      const meta = (await sync.get('meta')) as SyncMeta
      if (meta.recovery) meta.recovery.cursor = recoveryCursor
      await sync.put(meta)
    })
  }

  async staged(): Promise<RemoteRecord[]> {
    return (await this.pilot.staging.toArray()).map(({ id: _id, ...r }) => r)
  }

  async resetRecovery(): Promise<void> {
    const { staging, sync } = this.pilot
    await this.pilot.transaction('rw', [staging, sync], async () => {
      const meta = (await sync.get('meta')) as SyncMeta
      if (meta.recovery) meta.recovery.cursor = 0
      await sync.put(meta)
      await staging.clear()
    })
  }

  async finishRecovery(cursor: number): Promise<void> {
    const { staging, sync } = this.pilot
    await this.pilot.transaction('rw', [staging, sync], async () => {
      const meta = (await sync.get('meta')) as SyncMeta
      meta.cursor = cursor
      if (meta.recovery) { meta.recovery.done = true; meta.recovery.cursor = cursor }
      await sync.put(meta)
      await staging.clear()
    })
  }
}

export const GUEST_DB_NAME = 'turtle-academy-guest-v1'

/**
 * Read-only view of the legacy guest checkpoint through the native IndexedDB API.
 * It opens without a version, so an existing database is never upgraded; if the database does not exist,
 * the creation is aborted, so inspection never creates it; it only ever starts readonly transactions.
 * A database with an unexpected layout is reported as such and left exactly as it is.
 */
export function makeLegacyGuestReader(name = GUEST_DB_NAME, idb: IDBFactory = indexedDB): LegacyReader {
  return {
    readSample: () => new Promise<unknown>((resolve, reject) => {
      let absent = false
      const req = idb.open(name)
      req.onupgradeneeded = () => {
        absent = true
        req.transaction?.abort()
      }
      req.onerror = (e) => {
        if (absent) {
          e.preventDefault()
          resolve(undefined)
        } else reject(req.error)
      }
      req.onblocked = () => reject(new Error('legacy database blocked'))
      req.onsuccess = () => {
        const legacy = req.result
        const done = (fn: () => void) => { legacy.close(); fn() }
        try {
          if (!legacy.objectStoreNames.contains('checkpoints')) {
            done(() => resolve({ unexpected_layout: true }))
            return
          }
          const get = legacy.transaction('checkpoints', 'readonly').objectStore('checkpoints').get('sample')
          get.onsuccess = () => done(() => resolve(get.result))
          get.onerror = () => done(() => reject(get.error))
        } catch (e) {
          done(() => reject(e))
        }
      }
    }),
  }
}

/** Kept for callers that use the default guest database. */
export const legacyGuestReader: LegacyReader = { readSample: () => makeLegacyGuestReader().readSample() }

/**
 * Pilot startup: open (or create) the learner database and record, once, what legacy guest data exists.
 * Idempotent across restarts; an interrupted run simply repeats on the next start.
 */
export async function startPilotStorage(now: string, name = PILOT_DB_NAME, legacyName = GUEST_DB_NAME) {
  const pilot = openPilotDb(name)
  await pilot.open()
  const store = new DexieRecordStore(pilot)
  const marker = await inspectLegacy(makeLegacyGuestReader(legacyName), store, now)
  return { store, marker, close: () => pilot.close() }
}
