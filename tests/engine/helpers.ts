// Test harness for the learning engine (synthetic data only).
import { CatalogueRegistry, type CatalogueItem, type CatalogueRelease } from '../../src/catalogue/adapter.ts'
import { LearningEngine, type Step } from '../../src/engine/engine.ts'
import { MemoryRecordStore, WriteQueue, type Timers } from '../../src/engine/persistence.ts'
import type { Response, Subject } from '../../src/engine/types.ts'
import { chineseRelease, englishRelease, mathematicsRelease, scienceRelease } from './fixtures/catalogue.ts'

export class Clock {
  t: number
  constructor(iso: string) { this.t = Date.parse(iso) }
  now = () => new Date(this.t).toISOString()
  set(iso: string) { this.t = Date.parse(iso) }
  advance(seconds: number) { this.t += seconds * 1000 }
  /** Move to a wall-clock time on a later day (Singapore time, UTC+8). */
  sgt(date: string, time = '09:00:00') { this.set(`${date}T${time}+08:00`) }
}

export function ids() {
  let n = 0
  return () => `id-${(++n).toString().padStart(5, '0')}`
}

export class ManualTimers implements Timers {
  queue: { fn: () => void; at: number; id: number }[] = []
  private n = 0
  setTimeout(fn: () => void, ms: number) { const id = ++this.n; this.queue.push({ fn, at: ms, id }); return id }
  clearTimeout(h: unknown) { this.queue = this.queue.filter((q) => q.id !== h) }
  async runAll() { const q = this.queue; this.queue = []; for (const x of q) x.fn(); await new Promise((r) => setTimeout(r, 0)) }
}

export interface Harness {
  engine: LearningEngine
  clock: Clock
  store: MemoryRecordStore
  writer: WriteQueue
  registry: CatalogueRegistry
  timers: ManualTimers
  newId: () => string
}

export function registryWith(...releases: CatalogueRelease[]): CatalogueRegistry {
  const r = new CatalogueRegistry()
  for (const rel of releases) {
    const res = r.install(rel)
    if (!res.ok) throw new Error(`fixture install failed: ${res.reason}`)
  }
  return r
}

export function harness(opts: { start?: string; subjects?: Subject[]; registry?: CatalogueRegistry; timezone?: string } = {}): Harness {
  const clock = new Clock(opts.start ?? '2027-03-01T09:00:00+08:00')
  const all: Record<Subject, () => CatalogueRelease> = { chinese: chineseRelease, english: englishRelease, mathematics: mathematicsRelease, science: scienceRelease }
  const registry = opts.registry ?? registryWith(...(opts.subjects ?? ['chinese', 'english', 'mathematics', 'science']).map((s) => all[s]()))
  const store = new MemoryRecordStore()
  const timers = new ManualTimers()
  const writer = new WriteQueue(store, timers)
  const newId = ids()
  const engine = LearningEngine.fresh(opts.timezone ?? 'Asia/Singapore', { registry, now: clock.now, newId, writer })
  return { engine, clock, store, writer, registry, timers, newId }
}

/** Reload the engine from the local store, as after an app restart. */
export async function reload(h: Harness): Promise<LearningEngine> {
  const writer = new WriteQueue(h.store, h.timers)
  h.writer = writer
  h.engine = await LearningEngine.load(h.store, 'Asia/Singapore', { registry: h.registry, now: h.clock.now, newId: h.newId, writer })
  return h.engine
}

export function correctResponse(item: CatalogueItem): Response {
  return structuredClone(item.key)
}

export function wrongResponse(item: CatalogueItem): Response {
  if (item.response_kind === 'matching') return { kind: 'matching', option_ids: [], pairs: [{ left: 'l1', right: 'r2' }, { left: 'l2', right: 'r1' }] }
  if (item.response_kind === 'ordered') return { kind: 'ordered', option_ids: [...item.key.option_ids].reverse(), pairs: [] }
  return { kind: item.response_kind, option_ids: [item.format_class === 'high_option' ? 'b' : 'f'], pairs: [] }
}

export type Policy = (step: Extract<Step, { kind: 'question' }>) => boolean

/**
 * Drive a task to completion. `firstCorrect` decides each first response; retries are wrong then the
 * correction is selected (help never counts). Returns the steps seen.
 */
export async function runTask(engine: LearningEngine, taskId: string, firstCorrect: Policy = () => true, opts: { stopAfter?: number } = {}) {
  const seen: Extract<Step, { kind: 'question' }>[] = []
  let teaching = 0
  for (let guard = 0; guard < 500; guard++) {
    const step = await engine.next(taskId)
    if (step.kind === 'done') return { done: step, seen, teaching }
    if (step.kind === 'teaching') { teaching++; await engine.completeTeaching(taskId); continue }
    if (step.awaiting === 'first') {
      if (opts.stopAfter !== undefined && seen.length >= opts.stopAfter) return { done: null, seen, teaching }
      seen.push(step)
      const ok = firstCorrect(step)
      await engine.answer(step.presentation.id, ok ? correctResponse(step.item) : wrongResponse(step.item))
    } else if (step.awaiting === 'retry') {
      await engine.retry(step.presentation.id, wrongResponse(step.item))
    } else {
      await engine.correct(step.presentation.id, correctResponse(step.item))
    }
  }
  throw new Error('task did not finish')
}

export async function startTask(engine: LearningEngine, subject: Subject) {
  const r = await engine.startOrResume(subject)
  if (r.kind !== 'task') throw new Error(`expected a task, got ${r.kind}`)
  return r.task
}

/** Create an active app-practice target directly (as if banked from an earlier general-practice error). */
export function progressOf(engine: LearningEngine, targetId: string) {
  const pr = engine.derived().progress.get(targetId)
  if (!pr) throw new Error('no progress')
  return pr
}
