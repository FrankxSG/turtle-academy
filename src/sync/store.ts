// Local sync stores. Two streams, one per local database: `records` (the engine working copy) and `pack` (the
// private mistake pack, its case links and parent-observed production events). Each stream has its own outbox and
// ordering, written in the same local transaction as the change itself. The two databases are never written
// atomically together; the import steps that span them are idempotent and resumed on the next open (see
// MistakeProgram), and `records` always uploads before `pack`, so case links reach the server after their targets.
import { MemoryRecordStore, type Mutation, type Put } from '../engine/persistence.ts'
import { emptyState } from '../engine/records.ts'
import { SUBJECTS } from '../engine/policy.ts'
import type { CrosswalkRow } from '../mistakes/intake.ts'
import type { PrivatePack } from '../mistakes/pack.ts'
import type { ProductionEvent } from '../mistakes/production.ts'
import { MemoryPrivateStore } from '../mistakes/program.ts'
import { eventChange, recordChanges, stateChanges, type RemoteRecord } from './changes.ts'
import { makeOps, newMeta, observe, type OutboxOp, type Owner, type SyncMeta } from './outbox.ts'
import { caseLinkChanges, packChanges, productionChange, syncablePack, usablePackVersion, withLocalWrongForms } from './pack.ts'
import type { Change, Stamp } from './validate.ts'

export type Stream = 'records' | 'pack'

export interface Ack { op_id: string; stamp: Stamp }

export interface SyncStore {
  readonly stream: Stream
  meta(): Promise<SyncMeta>
  /**
   * Bind this local store to the signed-in registered family/child. With `backfill`, every record already held is
   * queued for upload in the same transaction. Records are only ever bound to the family resolved for the same
   * signed-in identity that owns this local database; a different family/child later is refused.
   */
  bind(owner: Owner, opts: { backfill: boolean; now: string }): Promise<'bound' | 'already'>
  /** Unacknowledged operations in order, including a rejected one that stops the queue. */
  outbox(limit: number): Promise<OutboxOp[]>
  counts(): Promise<{ pending: number; rejected: number }>
  acknowledge(acks: Ack[], at: string): Promise<void>
  reject(opId: string, code: string): Promise<void>
  /** Make server-refused operations pending again ("Sync now"). Operations refused here (`local:`) stay. */
  reoffer(): Promise<void>
  /** `kind|key` of every record with unacknowledged local work. */
  pendingKeys(): Promise<Set<string>>
  /** Whether learning records exist (decides restore versus upload of existing records on first binding). */
  hasLearningRecords(): Promise<boolean>
  setLastSync(at: string): Promise<void>
}

/** The records stream also holds the download checkpoint and the restartable restore staging area. */
export interface RecordsSyncStore extends SyncStore {
  setCursor(cursor: number): Promise<void>
  stage(records: RemoteRecord[], recoveryCursor: number): Promise<void>
  staged(): Promise<RemoteRecord[]>
  startRecovery(at: string): Promise<void>
  /** Discard a staged download that could not be applied, so the next attempt downloads afresh. */
  resetRecovery(): Promise<void>
  finishRecovery(cursor: number): Promise<void>
}

const now = () => ({ iso: new Date().toISOString(), ms: Date.now() })
const at = (iso: string) => ({ iso, ms: Date.parse(iso) })

/** Shared in-memory outbox (tests). */
class MemoryOutbox {
  meta: SyncMeta = newMeta()
  ops: OutboxOp[] = []

  queue(changes: Change[], when = now()) {
    if (!this.meta.owner) return
    this.ops.push(...makeOps(this.meta, changes, when))
  }

  bindOwner(owner: Owner, backfill: () => Change[], when: string): 'bound' | 'already' {
    if (this.meta.owner) {
      if (this.meta.owner.family_id !== owner.family_id || this.meta.owner.child_id !== owner.child_id) throw new Error('binding_mismatch')
      return 'already'
    }
    this.meta.owner = { ...owner }
    this.queue(backfill(), at(when))
    return 'bound'
  }

  outbox(limit: number) { return structuredClone(this.ops.slice(0, limit)) }
  counts() {
    return { pending: this.ops.filter((o) => o.state === 'pending').length, rejected: this.ops.filter((o) => o.state === 'rejected').length }
  }
  acknowledge(acks: Ack[], _when: string) {
    const done = new Set(acks.map((a) => a.op_id))
    for (const a of acks) observe(this.meta, a.stamp)
    this.ops = this.ops.filter((o) => !done.has(o.op_id))
  }
  reject(opId: string, code: string) {
    const op = this.ops.find((o) => o.op_id === opId)
    if (op) { op.state = 'rejected'; op.code = code }
  }
  reoffer() {
    for (const o of this.ops) if (o.state === 'rejected' && !o.code?.startsWith('local:')) { o.state = 'pending'; o.code = null }
  }
  pendingKeys() { return new Set(this.ops.flatMap((o) => o.keys)) }
}

const LEARNING_TABLES = new Set(['tasks', 'presentations', 'targets', 'completions', 'amendments'])

/** In-memory engine store with an outbox: mirrors DexieRecordStore for Node tests. */
export class MemorySyncRecordStore extends MemoryRecordStore implements RecordsSyncStore {
  readonly stream = 'records' as const
  readonly box = new MemoryOutbox()
  readonly stagedRecords = new Map<string, RemoteRecord>()
  clock: () => string = () => new Date().toISOString()

  override async commit(m: Mutation): Promise<void> {
    if (this.failAll || this.failNext > 0) return super.commit(m) // simulated storage failure: nothing is written
    if (this.applied.has(m.id)) return
    const changes: Change[] = []
    if (!m.remote && this.box.meta.owner) {
      for (const p of m.puts) changes.push(...recordChanges(p, this.records.get(`${p.table}\u0000${p.key}`)?.value))
      for (const e of m.events) if (!this.events.has(e.id)) changes.push(eventChange(e))
    }
    await super.commit(m)
    this.box.queue(changes, at(this.clock()))
  }

  async meta() { return structuredClone(this.box.meta) }
  async bind(owner: Owner, opts: { backfill: boolean; now: string }) {
    return this.box.bindOwner(owner, () => (opts.backfill ? stateChanges([...this.records.values()], [...this.events.values()]) : []), opts.now)
  }
  async outbox(limit: number) { return this.box.outbox(limit) }
  async counts() { return this.box.counts() }
  async acknowledge(acks: Ack[], when: string) { this.box.acknowledge(acks, when) }
  async reject(opId: string, code: string) { this.box.reject(opId, code) }
  async reoffer() { this.box.reoffer() }
  async pendingKeys() { return this.box.pendingKeys() }
  async hasLearningRecords() { return this.events.size > 0 || [...this.records.values()].some((p) => LEARNING_TABLES.has(p.table)) }
  async setLastSync(when: string) { this.box.meta.last_sync_at = when }
  async setCursor(cursor: number) { this.box.meta.cursor = cursor }
  async stage(records: RemoteRecord[], recoveryCursor: number) {
    for (const r of records) this.stagedRecords.set(`${r.kind}|${r.key}`, structuredClone(r))
    if (this.box.meta.recovery) this.box.meta.recovery.cursor = recoveryCursor
  }
  async staged() { return [...this.stagedRecords.values()].map((r) => structuredClone(r)) }
  async startRecovery(when: string) {
    if (!this.box.meta.recovery) this.box.meta.recovery = { started_at: when, cursor: 0, done: false }
  }
  async resetRecovery() {
    if (this.box.meta.recovery) this.box.meta.recovery.cursor = 0
    this.stagedRecords.clear()
  }
  async finishRecovery(cursor: number) {
    this.box.meta.cursor = cursor
    if (this.box.meta.recovery) { this.box.meta.recovery.done = true; this.box.meta.recovery.cursor = cursor }
    this.stagedRecords.clear()
  }
}

/** Local pack store operations the sync layer needs, beyond the program's PrivateStore. */
export interface PackSyncStore extends SyncStore {
  /** Local pack/production commits also need automatic sync, even when the engine writer is idle. */
  onChange(fn: () => void): () => void
  /** Apply downloaded pack records without queuing them for upload. */
  /** Returns whether anything the mistake programme uses changed (so it reloads only then). */
  applyRemote(r: { versions: { ref: string; pack: PrivatePack }[]; active: string | null; links: RemoteRecord[]; production: ProductionEvent[] }): Promise<boolean>
  /** Issue recorded when the current pack cannot sync (for example a field over its bound). */
  issue(): Promise<string | null>
  /** Whether a downloaded pack version fits this app version. */
  usable(value: unknown): boolean
}

/** In-memory private store with an outbox: mirrors DexiePrivateStore for Node tests. */
export class MemorySyncPrivateStore extends MemoryPrivateStore implements PackSyncStore {
  readonly stream = 'pack' as const
  readonly box = new MemoryOutbox()
  versions = new Map<string, PrivatePack>()
  packIssue: string | null = null
  clock: () => string = () => new Date().toISOString()

  private readonly listeners = new Set<() => void>()
  onChange(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  private changed() { for (const fn of this.listeners) fn() }

  private async packOps(p: PrivatePack): Promise<Change[]> {
    const s = await syncablePack(p)
    if (!s.ok) { this.packIssue = s.code; return [] }
    this.packIssue = null
    this.versions.set(s.ref, s.stripped)
    this.activeRef = s.ref
    return packChanges(s.ref, s.stripped)
  }

  override async putPack(p: PrivatePack) {
    const changes = await this.packOps(p)
    await super.putPack(p)
    this.box.queue(changes, at(this.clock()))
    this.changed()
  }
  override async putCrosswalk(rows: CrosswalkRow[]) {
    const changes = caseLinkChanges(this.rows, rows)
    await super.putCrosswalk(rows)
    this.box.queue(changes, at(this.clock()))
    if (changes.length > 0) this.changed()
  }
  override async addProduction(e: ProductionEvent) {
    const fresh = !this.events.has(e.id)
    await super.addProduction(e)
    if (fresh) this.box.queue([productionChange(e)], at(this.clock()))
    if (fresh) this.changed()
  }
  override async packVersions() { return [...this.versions.values()].map((p) => structuredClone(p)) }

  async meta() { return structuredClone(this.box.meta) }
  async bind(owner: Owner, opts: { backfill: boolean; now: string }) {
    const pack = this.packList[0] ?? null
    const packChanges = opts.backfill && pack && !this.box.meta.owner ? await this.packOps(pack) : []
    return this.box.bindOwner(owner, () => (opts.backfill
      ? [...packChanges, ...caseLinkChanges([], this.rows), ...[...this.events.values()].map(productionChange)]
      : []), opts.now)
  }
  async outbox(limit: number) { return this.box.outbox(limit) }
  async counts() { return this.box.counts() }
  async acknowledge(acks: Ack[], when: string) { this.box.acknowledge(acks, when) }
  async reject(opId: string, code: string) { this.box.reject(opId, code) }
  async reoffer() { this.box.reoffer() }
  async pendingKeys() { return this.box.pendingKeys() }
  async hasLearningRecords() { return this.packList.length > 0 || this.events.size > 0 || this.rows.length > 0 }
  async setLastSync(when: string) { this.box.meta.last_sync_at = when }
  async issue() { return this.packIssue }
  usable(value: unknown) { return usablePackVersion(value) }
  activeRef: string | null = null
  async applyRemote(r: { versions: { ref: string; pack: PrivatePack }[]; active: string | null; links: RemoteRecord[]; production: ProductionEvent[] }) {
    let changed = false
    for (const v of r.versions) if (!this.versions.has(v.ref)) this.versions.set(v.ref, structuredClone(v.pack))
    if (r.active && r.active !== this.activeRef) {
      const pack = this.versions.get(r.active)
      if (pack) { this.packList = [withLocalWrongForms(pack, this.packList[0] ?? null)]; this.activeRef = r.active; changed = true }
    }
    const rows = new Map(this.rows.map((x) => [x.case_id, x]))
    for (const l of r.links) {
      const before = JSON.stringify(rows.get(l.key) ?? null)
      if (l.deleted || !l.value) rows.delete(l.key)
      else rows.set(l.key, structuredClone(l.value) as unknown as CrosswalkRow)
      if (JSON.stringify(rows.get(l.key) ?? null) !== before) changed = true
    }
    this.rows = [...rows.values()].sort((a, b) => a.case_id.localeCompare(b.case_id))
    for (const e of r.production) if (!this.events.has(e.id)) { this.events.set(e.id, structuredClone(e)); changed = true }
    return changed
  }
}

/** The empty engine defaults that downloaded settings and story fold into. */
export const engineDefaults = (timezone: string) => {
  const s = emptyState(timezone, SUBJECTS)
  return { settings: s.settings, story: s.story }
}

export type { Put }
