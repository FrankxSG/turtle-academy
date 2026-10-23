// Local persistence contract (Learning Engine §6, F27).
// The engine emits ordered, idempotent mutations. Answer events are add-only; other records are keyed puts.
// If a commit fails, the mutation is retried once at once; if that also fails, it stays in memory, the
// learner may continue with an honest warning, and ordered background retries run with backoff while the
// app is alive and on foreground return. Memory cannot survive a reload: that limitation is reported,
// never hidden. Failed local saves are never bypassed with direct cloud writes.
import type { EngineState } from './types.ts'

export type Table =
  | 'settings' | 'targets' | 'presentations' | 'tasks' | 'completions' | 'rest_days' | 'story'
  | 'flags' | 'suspensions' | 'amendments' | 'exposure' | 'guards' | 'content_versions' | 'meta'

export interface Put { table: Table; key: string; value: unknown }
export interface Mutation {
  /** Unique id; a store that has applied it ignores repeats. */
  id: string
  /** Strictly increasing per engine instance; the queue never commits out of order. */
  order: number
  puts: Put[]
  /** Append-only answer events (keyed by event id; re-adding an identical id is a no-op). */
  events: EngineState['events']
  /**
   * Set for records downloaded from the server. They are saved locally like any other change but never queued
   * for upload again, so a download cannot start an upload loop.
   */
  remote?: true
  /** Records removed by a downloaded deletion (tombstone). Only set on remote mutations. */
  deletes?: { table: Table; key: string }[]
}

export interface StoredRecords {
  records: Put[]
  events: EngineState['events']
}

/** Implemented by the Dexie store (src/storage.ts) and by the in-memory test store. */
export interface RecordStore {
  commit(m: Mutation): Promise<void>
  load(): Promise<StoredRecords>
}

export type SaveStatus = {
  /** Mutations held only in memory. */
  pending: number
  /** Set while anything is unsaved: data could be lost if the app reloads or is closed. */
  warning: 'unsaved_changes_may_be_lost_on_reload' | null
  lastError: string | null
}

export interface Timers {
  setTimeout(fn: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
}

const BACKOFF_MS = [2_000, 5_000, 15_000, 30_000, 60_000]

export class WriteQueue {
  private queue: Mutation[] = []
  private timer: unknown = null
  private attempt = 0
  private draining: Promise<void> | null = null
  private lastError: string | null = null
  private listeners = new Set<(s: SaveStatus) => void>()

  private readonly store: RecordStore
  private readonly timers: Timers

  constructor(store: RecordStore, timers: Timers = globalThis as unknown as Timers) {
    this.store = store
    this.timers = timers
  }

  status(): SaveStatus {
    return {
      pending: this.queue.length,
      warning: this.queue.length > 0 ? 'unsaved_changes_may_be_lost_on_reload' : null,
      lastError: this.queue.length > 0 ? this.lastError : null,
    }
  }

  onStatus(fn: (s: SaveStatus) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  /**
   * Queue a mutation and try to commit everything pending, in order.
   * Resolves once the mutation is either committed or held in memory (never rejects), so the caller can
   * reveal help only after the first response is committed or queued.
   */
  async enqueue(m: Mutation): Promise<SaveStatus> {
    this.queue.push(m)
    await this.drain(2)
    return this.status()
  }

  /** Called when the app returns to the foreground. */
  async onForeground(): Promise<SaveStatus> {
    await this.drain(1)
    return this.status()
  }

  private drain(triesPerMutation: number): Promise<void> {
    // Serialise drains so mutations can never commit out of order.
    const run = async () => {
      while (this.queue.length > 0) {
        const head = this.queue[0]
        let ok = false
        for (let i = 0; i < triesPerMutation && !ok; i++) {
          try {
            await this.store.commit(head)
            ok = true
          } catch (e) {
            this.lastError = e instanceof Error ? e.name : 'commit_failed'
          }
        }
        if (!ok) break
        this.queue.shift()
        this.attempt = 0
      }
      this.emit()
      if (this.queue.length > 0) this.schedule()
      else this.cancel()
    }
    const previous = this.draining ?? Promise.resolve()
    const next = previous.then(run, run)
    this.draining = next.finally(() => { if (this.draining === next) this.draining = null })
    return next
  }

  private schedule() {
    if (this.timer !== null) return
    const delay = BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)]
    this.attempt += 1
    this.timer = this.timers.setTimeout(() => {
      this.timer = null
      void this.drain(1)
    }, delay)
  }

  private cancel() {
    if (this.timer !== null) this.timers.clearTimeout(this.timer)
    this.timer = null
  }

  private emit() {
    const s = this.status()
    for (const l of this.listeners) l(s)
  }

  /** Stop background retries (e.g. on sign-out); pending memory is reported as unsaved. */
  dispose() {
    this.cancel()
  }
}

/** In-memory store used by tests; supports injected failures and models idempotent commits. */
export class MemoryRecordStore implements RecordStore {
  readonly records = new Map<string, Put>()
  readonly events = new Map<string, EngineState['events'][number]>()
  readonly applied = new Set<string>()
  readonly commitOrder: number[] = []
  /** Number of upcoming commits that should fail. */
  failNext = 0
  failAll = false

  async commit(m: Mutation): Promise<void> {
    if (this.failAll || this.failNext > 0) {
      if (this.failNext > 0) this.failNext -= 1
      const err = new Error('simulated storage failure')
      err.name = 'QuotaExceededError'
      throw err
    }
    if (this.applied.has(m.id)) return
    for (const d of m.deletes ?? []) this.records.delete(`${d.table}\u0000${d.key}`)
    for (const p of m.puts) this.records.set(`${p.table}\u0000${p.key}`, structuredClone(p))
    for (const e of m.events) {
      const existing = this.events.get(e.id)
      if (existing && JSON.stringify(existing) !== JSON.stringify(e)) throw new Error('append-only event conflict')
      if (!existing) this.events.set(e.id, structuredClone(e))
    }
    this.applied.add(m.id)
    this.commitOrder.push(m.order)
  }

  async load(): Promise<StoredRecords> {
    return { records: [...this.records.values()].map((p) => structuredClone(p)), events: [...this.events.values()].map((e) => structuredClone(e)) }
  }
}
