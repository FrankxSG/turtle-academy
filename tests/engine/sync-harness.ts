// A simulated device for live-sync tests (synthetic data only): engine working copy, private pack programme and
// the sync manager, wired as the app wires them. The transport and auth are injected, so the same device runs
// against the in-memory fake server (engine CI) or the real PostgreSQL functions (supabase/tests/test_sync.py).
import { CatalogueRegistry } from '../../src/catalogue/adapter.ts'
import { LearningEngine, type Step } from '../../src/engine/engine.ts'
import { WriteQueue } from '../../src/engine/persistence.ts'
import { MistakeProgram } from '../../src/mistakes/program.ts'
import { SyncManager } from '../../src/sync/manager.ts'
import { MemorySyncPrivateStore, MemorySyncRecordStore } from '../../src/sync/store.ts'
import type { SyncTransport } from '../../src/sync/transport.ts'
import type { AuthClient, AuthResult, Session } from '../../src/auth/client.ts'
import { Clock, ids, ManualTimers, correctResponse, wrongResponse } from './helpers.ts'
import { publicChinese } from './fixtures/public-chinese.ts'

export type Q = Extract<Step, { kind: 'question' }>

/** Minimal auth for tests: a stored session that can expire, and a refresh that the test controls. */
export class TestAuth {
  session: Session | null
  refreshWith: (() => Promise<AuthResult>) | null = null
  refreshes = 0
  constructor(session: Session | null) { this.session = session }
  getStoredSession = () => this.session
  isExpired = (s: Session) => s.expiresAt * 1000 <= Date.now()
  refreshSession = async (): Promise<AuthResult> => {
    this.refreshes++
    if (!this.refreshWith) return { ok: false, error: 'invalid_credentials' }
    const r = await this.refreshWith()
    if (r.ok) this.session = r.session
    return r
  }
}

export const identityOf = async (userId: string) => `key-${userId}`

export interface DeviceOpts {
  transport: SyncTransport
  auth: Pick<AuthClient, 'getStoredSession' | 'refreshSession' | 'isExpired'>
  userId: string
  clock?: Clock
  records?: MemorySyncRecordStore
  pack?: MemorySyncPrivateStore
}

export class Device {
  clock: Clock
  registry!: CatalogueRegistry
  records: MemorySyncRecordStore
  pack: MemorySyncPrivateStore
  timers = new ManualTimers()
  syncTimers = new ManualTimers()
  writer!: WriteQueue
  engine!: LearningEngine
  program!: MistakeProgram
  manager!: SyncManager
  newId = ids()
  private readonly opts: DeviceOpts
  readonly publicContent = publicChinese()

  constructor(opts: DeviceOpts) {
    this.opts = opts
    this.clock = opts.clock ?? new Clock('2027-03-01T09:00:00+08:00')
    this.records = opts.records ?? new MemorySyncRecordStore()
    this.pack = opts.pack ?? new MemorySyncPrivateStore()
    this.records.clock = this.clock.now
    this.pack.clock = this.clock.now
    this.newId = ((prefix) => { let n = 0; return () => `${prefix}-${(++n).toString().padStart(5, '0')}` })(opts.userId.slice(0, 6).replace(/[^a-z0-9]/g, 'x') + Math.random().toString(36).slice(2, 6))
  }

  /** Open (or reopen after a restart) from the local stores, as the app does. */
  async open(): Promise<this> {
    this.manager?.dispose()
    this.registry = new CatalogueRegistry()
    this.writer = new WriteQueue(this.records, this.timers)
    this.engine = await LearningEngine.load(this.records, 'Asia/Singapore', { registry: this.registry, now: this.clock.now, newId: this.newId, writer: this.writer })
    this.program = await MistakeProgram.open({ engine: this.engine, registry: this.registry, publicContent: this.publicContent, store: this.pack, now: this.clock.now, newId: this.newId })
    await this.engine.flush()
    this.manager = new SyncManager({
      transport: this.opts.transport, auth: this.opts.auth, identity: `key-${this.opts.userId}`, identityOf,
      records: this.records, pack: this.pack, engine: this.engine, program: () => this.program,
      online: () => true, now: () => this.clock.t, timers: this.syncTimers,
    })
    return this
  }

  sync() { return this.manager.syncNow('manual') }

  /** Answer the next `n` first responses of a subject's task (or all when n is undefined). */
  async practise(n?: number, decide: (q: Q) => boolean = () => true) {
    const r = await this.engine.startOrResume('chinese', { optional: true })
    if (r.kind !== 'task') return null
    let answered = 0
    for (let i = 0; i < 400; i++) {
      const step = await this.engine.next(r.task.id)
      if (step.kind === 'done') return { task: r.task, done: true }
      if (step.kind !== 'question') throw new Error('unexpected teaching')
      if (step.awaiting === 'first') {
        if (n !== undefined && answered >= n) { await this.engine.pause(r.task.id); return { task: r.task, done: false } }
        answered++
        await this.engine.answer(step.presentation.id, decide(step) ? correctResponse(step.item) : wrongResponse(step.item))
      } else if (step.awaiting === 'retry') await this.engine.retry(step.presentation.id, wrongResponse(step.item))
      else await this.engine.correct(step.presentation.id, correctResponse(step.item))
    }
    throw new Error('task did not finish')
  }

  /** Deliver every pending story checkpoint (as the app does before showing it). */
  async deliverStory() {
    for (const c of this.engine.pendingCheckpoints()) await this.engine.deliverCheckpoint(c.id)
  }

  async outboxIds() {
    return [...(await this.records.outbox(10_000)), ...(await this.pack.outbox(10_000))].map((o) => o.op_id)
  }
}

export const session = (userId: string, token: string, expiresInSeconds = 3600): Session => ({
  accessToken: token, refreshToken: `${token}-refresh`, expiresAt: Math.floor(Date.now() / 1000) + expiresInSeconds, userId,
})
