// Live-sync lifecycle for one signed-in identity's local working copy (Pilot Scope §3; Learning Engine §6).
//
// A run: check the session (refreshing it when needed), bind the local stores to the family's child, finish any
// restore, upload queued operations in order, then download everything changed since the checkpoint. Runs start on
// open, foreground, reconnection, shortly after local changes and on "Sync now". Nothing depends on background
// execution: a suspended app simply resumes on its next run.
//
// Practice never waits for sync. An expired or missing session only stops uploads (they stay queued) and asks the
// parent to sign in. Every network response is checked against the run's generation and the signed-in identity
// before it is used, so a response that arrives after sign-out or an account change is discarded.
import type { AuthClient } from '../auth/client.ts'
import type { LearningEngine } from '../engine/engine.ts'
import type { Put } from '../engine/persistence.ts'
import { toRecords } from '../engine/records.ts'
import type { MistakeProgram } from '../mistakes/program.ts'
import type { PrivatePack } from '../mistakes/pack.ts'
import type { ProductionEvent } from '../mistakes/production.ts'
import { isEngineKind, toLocal, type RemoteRecord } from './changes.ts'
import { changeKey, toWire, type OutboxOp, type Owner } from './outbox.ts'
import type { PackSyncStore, RecordsSyncStore, SyncStore } from './store.ts'
import { TransportError, type SyncTransport } from './transport.ts'
import { check, hasKind, LIMITS, SYNC_SCHEMA, type SyncKind } from './validate.ts'

export type SyncState = 'idle' | 'syncing' | 'restoring' | 'offline' | 'sign_in_required' | 'failed'

export interface SyncStatus {
  state: SyncState
  /** Existing local practice or a completed bootstrap; remains false across failed/interrupted recovery. */
  practiceReady: boolean
  /** Last run that finished with every queued change acknowledged and downloads caught up. */
  lastSyncAt: string | null
  /** Locally saved changes not yet acknowledged by the server. */
  waiting: number
  /** Changes that cannot upload (refused here or by the server); they stay on this device. */
  refused: number
  /** Short code for failed / sign-in states; never content. */
  code: string | null
  /** The device clock differs from the server by more than five minutes. */
  clockWarning: boolean
  /** The current pack cannot sync (for example a field over its bound). */
  packIssue: string | null
}

type Auth = Pick<AuthClient, 'getStoredSession' | 'refreshSession' | 'isExpired'>

export interface SyncDeps {
  transport: SyncTransport
  auth: Auth
  /** The local identity key this working copy belongs to (hash of the parent's user id). */
  identity: string
  identityOf: (userId: string) => Promise<string>
  records: RecordsSyncStore
  pack: PackSyncStore | null
  engine: LearningEngine
  program?: () => MistakeProgram | null
  online?: () => boolean
  now?: () => number
  timers?: { setTimeout(fn: () => void, ms: number): unknown; clearTimeout(h: unknown): void }
  /** Delay before a run after local changes. */
  soonMs?: number
}

const BACKOFF_MS = [2_000, 5_000, 15_000, 30_000, 60_000, 300_000]
const CLOCK_TOLERANCE_MS = 5 * 60_000
const MAX_BATCHES = 40

class Stale extends Error {}
class Stop extends Error {
  readonly state: SyncState
  readonly code: string
  constructor(state: SyncState, code: string) {
    super(code)
    this.state = state
    this.code = code
  }
}

export class SyncManager {
  private readonly d: SyncDeps
  private generation = 0
  private controller = new AbortController()
  private running: Promise<SyncStatus> | null = null
  private again = false
  private retryTimer: unknown = null
  private soonTimer: unknown = null
  private attempt = 0
  private verified: Owner | null = null
  private refreshSeq = 0
  private current: SyncStatus = { state: 'idle', practiceReady: false, lastSyncAt: null, waiting: 0, refused: 0, code: null, clockWarning: false, packIssue: null }
  private readonly listeners = new Set<(s: SyncStatus) => void>()
  private readonly offPack: (() => void) | undefined

  constructor(deps: SyncDeps) {
    this.d = deps
    // The observer also fires for acknowledgements and on subscribing; schedule a run only when work is waiting,
    // so each finished upload does not trigger one more empty round trip.
    this.offPack = deps.pack?.onChange(() => {
      void this.refresh().catch(() => undefined)
      // Read the queue directly: a refresh overtaken by a newer one returns the older status.
      void deps.pack?.counts().then((c) => { if (c.pending > 0) this.soon() }, () => undefined)
    })
  }

  private get timers() { return this.d.timers ?? (globalThis as unknown as NonNullable<SyncDeps['timers']>) }
  private online() { return this.d.online ? this.d.online() : (globalThis.navigator?.onLine ?? true) }
  private nowIso() { return new Date(this.d.now ? this.d.now() : Date.now()).toISOString() }
  private streams(): SyncStore[] { return this.d.pack ? [this.d.records, this.d.pack] : [this.d.records] }

  status(): SyncStatus { return { ...this.current } }

  onStatus(fn: (s: SyncStatus) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(patch: Partial<SyncStatus>) {
    this.current = { ...this.current, ...patch }
    const s = this.status()
    for (const l of this.listeners) l(s)
  }

  /** Refresh counts and last-sync time from the stores (e.g. after local changes). */
  async refresh(): Promise<SyncStatus> {
    const seq = ++this.refreshSeq
    const gen = this.generation
    const meta = await this.d.records.meta()
    let waiting = 0
    let refused = 0
    for (const s of this.streams()) {
      const c = await s.counts()
      waiting += c.pending + c.rejected
      refused += c.rejected
    }
    const practiceReady = meta.recovery ? meta.recovery.done
      : (await this.d.records.hasLearningRecords()) || (this.d.pack ? await this.d.pack.hasLearningRecords() : false)
    const packIssue = this.d.pack ? await this.d.pack.issue() : null
    // Older IndexedDB reads may finish after a newer refresh (e.g. bootstrap finishing); never publish them.
    if (seq !== this.refreshSeq || gen !== this.generation || gen < 0) return this.status()
    this.emit({ waiting, refused, practiceReady, lastSyncAt: meta.last_sync_at, packIssue })
    return this.status()
  }

  /** Run shortly after local changes (debounced). */
  soon() {
    if (this.generation < 0) return
    if (this.soonTimer !== null) this.timers.clearTimeout(this.soonTimer)
    this.soonTimer = this.timers.setTimeout(() => {
      this.soonTimer = null
      void this.syncNow('change')
    }, this.d.soonMs ?? 3_000)
  }

  /**
   * Run now. Single-flight: a call during a run schedules one more run afterwards. `manual` (Sync now) also
   * re-offers operations the server refused, in case the refusal was due to a since-fixed condition; operations
   * refused on this device by the allow-list are never sent.
   */
  syncNow(reason: 'open' | 'foreground' | 'online' | 'change' | 'manual' | 'sign_in' | 'retry' = 'manual'): Promise<SyncStatus> {
    if (this.generation < 0) return Promise.resolve(this.status())
    if (this.running) {
      this.again = true
      return this.running
    }
    const gen = this.generation
    const run = (async () => {
      try {
        if (reason === 'manual') await this.reoffer()
        await this.run(gen)
        this.attempt = 0
      } catch (e) {
        if (e instanceof Stale || gen !== this.generation) return this.status()
        if (e instanceof Stop) {
          this.emit({ state: e.state, code: e.code })
          if (e.state === 'offline') this.retryLater()
        } else if (e instanceof TransportError) {
          if (e.kind === 'offline' || e.kind === 'timeout' || e.kind === 'server' || e.kind === 'bad_response') {
            this.emit({ state: e.kind === 'offline' ? 'offline' : 'failed', code: e.kind === 'offline' ? null : e.code })
            this.retryLater()
          } else if (e.kind === 'unauthorized') this.emit({ state: 'sign_in_required', code: 'session_expired' })
          else if (e.kind !== 'aborted') this.emit({ state: 'failed', code: e.code })
        } else {
          this.emit({ state: 'failed', code: e instanceof Error && /^[a-z_:]{3,60}$/.test(e.message) ? e.message : 'sync_error' })
        }
      } finally {
        if (gen === this.generation) await this.refresh().catch(() => undefined)
      }
      return this.status()
    })()
    this.running = run.finally(() => {
      this.running = null
      if (this.again && gen === this.generation) {
        this.again = false
        void this.syncNow('retry')
      }
    })
    return this.running
  }

  /** Stop: cancel timers, abort requests and discard any response still in flight (sign-out, account change). */
  dispose() {
    this.generation = -1
    this.offPack?.()
    this.controller.abort()
    if (this.retryTimer !== null) this.timers.clearTimeout(this.retryTimer)
    if (this.soonTimer !== null) this.timers.clearTimeout(this.soonTimer)
    this.retryTimer = null
    this.soonTimer = null
    this.listeners.clear()
  }

  private retryLater() {
    if (this.generation < 0 || this.retryTimer !== null) return
    const delay = BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)]
    this.attempt += 1
    this.retryTimer = this.timers.setTimeout(() => {
      this.retryTimer = null
      if (this.online()) void this.syncNow('retry')
    }, delay)
  }

  private guard(gen: number) {
    if (gen !== this.generation) throw new Stale()
  }

  private async reoffer() {
    for (const s of this.streams()) await s.reoffer()
  }

  /** A usable access token for the identity that owns this working copy. */
  private async token(gen: number): Promise<string> {
    const session = this.d.auth.getStoredSession()
    if (!session) throw new Stop('sign_in_required', 'signed_out')
    if ((await this.d.identityOf(session.userId)) !== this.d.identity) throw new Stop('sign_in_required', 'different_account')
    this.guard(gen)
    const soon = { ...session, expiresAt: session.expiresAt - 60 }
    if (!this.d.auth.isExpired(soon)) return session.accessToken
    if (!this.online()) throw new Stop('offline', 'offline')
    const r = await this.d.auth.refreshSession()
    this.guard(gen)
    if (!r.ok) {
      if (r.error === 'network') throw new Stop('offline', 'offline')
      if (r.error === 'superseded') throw new Stale()
      if (r.error === 'invalid_credentials') throw new Stop('sign_in_required', 'session_expired')
      throw new Stop('failed', r.error)
    }
    if ((await this.d.identityOf(r.session.userId)) !== this.d.identity) throw new Stop('sign_in_required', 'different_account')
    this.guard(gen)
    return r.session.accessToken
  }

  /** Call the server with a fresh token; one refresh-and-retry on an expired token. */
  private async call<T>(gen: number, fn: (token: string, signal: AbortSignal) => Promise<T>): Promise<T> {
    let token = await this.token(gen)
    try {
      const r = await fn(token, this.controller.signal)
      this.guard(gen)
      return r
    } catch (e) {
      this.guard(gen)
      if (!(e instanceof TransportError) || e.kind !== 'unauthorized') throw e
      const r = await this.d.auth.refreshSession()
      this.guard(gen)
      if (!r.ok) throw new Stop(r.error === 'network' ? 'offline' : 'sign_in_required', r.error === 'network' ? 'offline' : 'session_expired')
      if ((await this.d.identityOf(r.session.userId)) !== this.d.identity) throw new Stop('sign_in_required', 'different_account')
      token = r.session.accessToken
      const again = await fn(token, this.controller.signal)
      this.guard(gen)
      return again
    }
  }

  private async run(gen: number) {
    if (!this.online()) throw new Stop('offline', 'offline')
    this.emit({ state: 'syncing', code: null })
    const owner = await this.owner(gen)
    const meta = await this.d.records.meta()
    if (meta.recovery && !meta.recovery.done) {
      this.emit({ state: 'restoring' })
      await this.restore(gen, owner)
      this.emit({ state: 'syncing' })
    }
    for (const store of this.streams()) await this.upload(gen, owner, store)
    await this.download(gen, owner)
    // Success only after every queued change was acknowledged and downloads caught up.
    let left = 0
    for (const s of this.streams()) left += (await s.counts()).pending
    if (left > 0) {
      this.again = true
      this.emit({ state: 'syncing' })
      return
    }
    const at = this.nowIso()
    for (const s of this.streams()) await s.setLastSync(at)
    this.guard(gen)
    this.emit({ state: 'idle', code: null, lastSyncAt: at })
  }

  /** Resolve and bind the family/child for this identity (once per session), uploading existing records once. */
  private async owner(gen: number): Promise<Owner> {
    const meta = await this.d.records.meta()
    if (meta.owner && this.verified && this.verified.child_id === meta.owner.child_id) return meta.owner
    const members = await this.call(gen, (t, s) => this.d.transport.whoami(t, s))
    if (members.length === 0) throw new Stop('failed', 'no_child_profile')
    if (members.length > 1) throw new Stop('failed', 'multiple_child_profiles')
    const owner: Owner = { family_id: members[0].family_id, child_id: members[0].child_id }
    if (meta.owner && (meta.owner.family_id !== owner.family_id || meta.owner.child_id !== owner.child_id)) throw new Stop('failed', 'binding_mismatch')
    const now = this.nowIso()
    if (!meta.owner) {
      // An empty (new or reset) device restores from the server; records already on this device are uploaded once.
      const learning = (await this.d.records.hasLearningRecords()) || (this.d.pack ? await this.d.pack.hasLearningRecords() : false)
      this.guard(gen)
      if (learning) {
        await this.d.records.bind(owner, { backfill: true, now })
        if (this.d.pack) await this.d.pack.bind(owner, { backfill: true, now })
      } else {
        // Persist the recovery intent BEFORE binding. A crash after either store binds must not turn a reset
        // device into an ordinary incremental client on its next open.
        await this.d.records.startRecovery(now)
        await this.d.records.bind(owner, { backfill: false, now })
        if (this.d.pack) await this.d.pack.bind(owner, { backfill: false, now })
      }
    } else if (this.d.pack && !(await this.d.pack.meta()).owner) {
      // The pack store was created after the records store was bound (e.g. first private-build open).
      await this.d.pack.bind(owner, { backfill: true, now })
    }
    this.guard(gen)
    this.verified = owner
    return owner
  }

  private async upload(gen: number, owner: Owner, store: SyncStore) {
    for (let batch = 0; batch < MAX_BATCHES; batch++) {
      const ops = await store.outbox(LIMITS.ops_per_request)
      if (ops.length === 0) return
      if (ops[0].state === 'rejected') throw new Stop('failed', ops[0].code?.replace(/^local:/, '') || 'change_refused')
      const send: OutboxOp[] = []
      let bytes = 64
      for (const op of ops) {
        if (op.state !== 'pending') break
        if (op.owner.child_id !== owner.child_id || op.owner.family_id !== owner.family_id) throw new Stop('failed', 'binding_mismatch')
        const size = new TextEncoder().encode(JSON.stringify(toWire(op))).length
        if (send.length > 0 && bytes + size > LIMITS.request_bytes) break
        send.push(op)
        bytes += size
      }
      const result = await this.call(gen, (t, s) => this.d.transport.push(t, owner.child_id, send.map(toWire), s))
      this.checkClock(result.server_time_ms)
      const acks = []
      for (const r of result.results) {
        if (r.status === 'rejected') {
          const op = send.find((o) => o.op_id === r.op_id) ?? send[acks.length]
          if (acks.length > 0) await store.acknowledge(acks, this.nowIso())
          this.guard(gen)
          if (op) await store.reject(op.op_id, r.code)
          throw new Stop('failed', r.code)
        }
        acks.push({ op_id: r.op_id, stamp: r.stamp })
      }
      if (acks.length === 0) throw new Stop('failed', 'no_acknowledgement')
      await store.acknowledge(acks, this.nowIso())
      this.guard(gen)
    }
    this.again = true
  }

  private checkClock(serverMs: number) {
    if (typeof serverMs !== 'number') return
    const local = this.d.now ? this.d.now() : Date.now()
    this.emit({ clockWarning: Math.abs(local - serverMs) > CLOCK_TOLERANCE_MS })
  }

  /** Restore (new or reset device): download everything into staging, then apply once complete. Restartable. */
  private async restore(gen: number, owner: Owner) {
    let cursor = (await this.d.records.meta()).recovery?.cursor ?? 0
    for (;;) {
      const page = await this.call(gen, (t, s) => this.d.transport.pull(t, owner.child_id, cursor, LIMITS.pull_page, s))
      this.checkClock(page.server_time_ms)
      await this.d.records.stage(page.changes.map(strip), page.cursor)
      this.guard(gen)
      cursor = page.cursor
      if (!page.more) break
    }
    const staged = await this.d.records.staged()
    // Incompatible data stops here with a clear code before anything is applied, so existing local records are
    // untouched. The staged copy is discarded so the next attempt (after an app or server fix) downloads afresh.
    const compatible = staged.every((r) => {
      if (r.deleted || r.value === null || !hasKind(r.kind)) return true // e.g. pack records in the public build
      if (r.kind === 'pack_version') return this.d.pack ? this.d.pack.usable(r.value) : true
      return check(SYNC_SCHEMA.kinds[r.kind].value, r.value)
    })
    if (!compatible) {
      await this.d.records.resetRecovery()
      throw new Stop('failed', 'restore_incompatible')
    }
    await this.apply(gen, staged)
    await this.d.records.finishRecovery(cursor)
    this.guard(gen)
  }

  private async download(gen: number, owner: Owner) {
    let cursor = (await this.d.records.meta()).cursor
    for (let page = 0; page < MAX_BATCHES; page++) {
      const p = await this.call(gen, (t, s) => this.d.transport.pull(t, owner.child_id, cursor, LIMITS.pull_page, s))
      this.checkClock(p.server_time_ms)
      await this.apply(gen, p.changes.map(strip))
      await this.d.records.setCursor(p.cursor)
      this.guard(gen)
      cursor = p.cursor
      if (!p.more) return
    }
    this.again = true
  }

  /**
   * Apply downloaded records. Records with unacknowledged local work are skipped: the server's merged value comes
   * back after that work is acknowledged (every upload re-issues the touched records). Unchanged records are not
   * rewritten. Engine records go through the engine's ordered writer, marked remote, so they never upload again.
   */
  private async apply(gen: number, remote: RemoteRecord[]) {
    if (remote.length === 0) return
    const pending = new Set<string>()
    for (const s of this.streams()) for (const k of await s.pendingKeys()) pending.add(k)
    const incoming = remote.filter((r) => !pending.has(changeKey(r)) && hasKind(r.kind))
    const engine = this.d.engine
    const local = toLocal(incoming.filter((r) => isEngineKind(r.kind)), { settings: engine.state.settings, story: engine.state.story })
    const current = new Map(toRecords(engine.state).map((p) => [`${p.table}\u0000${p.key}`, JSON.stringify(p.value)]))
    const puts: Put[] = local.puts.filter((p) => current.get(`${p.table}\u0000${p.key}`) !== JSON.stringify(p.value))
    const deletes = local.deletes.filter((p) => current.has(`${p.table}\u0000${p.key}`)).map((p) => ({ table: p.table, key: p.key }))
    this.guard(gen)
    const saved = await engine.applyRemote(puts, local.events, deletes)
    this.guard(gen)
    if (saved?.warning) throw new Stop('failed', 'local_save_failed')
    const pack = incoming.filter((r) => !isEngineKind(r.kind))
    if (this.d.pack && pack.length > 0) {
      const versions = pack.filter((r) => r.kind === 'pack_version' && r.value)
        .map((r) => ({ ref: r.key, pack: (r.value as { pack: PrivatePack }).pack }))
      const active = pack.filter((r) => r.kind === 'active_pack' && r.value).map((r) => String((r.value as { version_ref: string }).version_ref)).pop() ?? null
      const links = pack.filter((r) => r.kind === 'case_link')
      const production = pack.filter((r) => r.kind === 'production_event' && r.value).map((r) => r.value as unknown as ProductionEvent)
      const changed = await this.d.pack.applyRemote({ versions, active, links, production })
      this.guard(gen)
      if (changed) await this.d.program?.()?.reload()
      this.guard(gen)
    }
  }
}

const strip = (r: RemoteRecord & { seq?: number }): RemoteRecord => ({ kind: r.kind as SyncKind, key: r.key, value: r.value, deleted: r.deleted })
