// F03, F04, F12, F13, F21, F32: format-sensitive repair ladder, assistance never counts, whole-task aggregation.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CatalogueRelease } from '../../src/catalogue/adapter.ts'
import type { Target } from '../../src/engine/types.ts'
import { item, mathematicsRelease } from './fixtures/catalogue.ts'
import { harness, progressOf, registryWith, runTask, startTask } from './helpers.ts'

/** Day 1: one general-practice first-wrong answer banks a Mathematics target (F21). */
async function bankMathTarget(h: ReturnType<typeof harness>): Promise<Target> {
  const t = await startTask(h.engine, 'mathematics')
  let first = true
  await runTask(h.engine, t.id, () => { const ok = !first; first = false; return ok })
  const banked = h.engine.state.targets.filter((x) => x.observations.some((o) => o.source_type === 'app_practice'))
  assert.equal(banked.length, 1)
  return banked[0]
}

/** A Mathematics release whose kp1 exact pool is replaced by the given items (to control format order). */
function mathWithExact(...exact: { id: string; low: boolean }[]): CatalogueRelease {
  const r = mathematicsRelease()
  r.items = r.items.filter((i) => !(i.knowledge_point_ref === 'ma-kp1' && i.pools.includes('exact')))
  for (const e of exact) r.items.push(item('mathematics', 'p2_mathematics', 'ma-kp1', e.id, { pools: ['exact'], format: e.low ? 'low_option' : 'high_option' }))
  return r
}

test('F21: a general-practice first wrong answer auto-creates a private target (app_practice) that joins a later task only', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await bankMathTarget(h)
  assert.equal(target.observations[0].source_type, 'app_practice')
  assert.equal(target.observations[0].recurrence, 'first')
  assert.equal(target.error_type, 'confused_form', 'controlled error type from the reviewed wrong option')
  const pr = progressOf(h.engine, target.id)
  assert.equal(pr.stage, 'exact')
  assert.equal(pr.notBefore, '2027-03-02', 'eligible from the day after the originating task finalised')
  // A second task the same day (optional practice) does not schedule it.
  const again = await h.engine.startOrResume('mathematics', { optional: true })
  assert.equal(again.kind, 'task')
  if (again.kind === 'task') assert.ok(again.task.plan.slots.every((s) => s.target_ref !== target.id))
})

test('F21: same-day repeats are one observation; a different day is an independent recurrence', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await bankMathTarget(h)
  // Same day, optional task, the same general item family answered wrong again.
  const opt = await h.engine.startOrResume('mathematics', { optional: true })
  if (opt.kind !== 'task') throw new Error('expected task')
  await runTask(h.engine, opt.task.id, (s) => s.item.knowledge_point_ref !== 'ma-kp1' || s.presentation.role !== 'general_practice')
  const sameDay = h.engine.state.targets.find((t) => t.id === target.id)?.observations ?? []
  assert.equal(sameDay.filter((o) => o.recurrence !== 'duplicate').length, 1, 'same-day repeats are one observation')
  assert.equal(progressOf(h.engine, target.id).lastIndependentObservationOn, '2027-03-01')
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'mathematics')
  await runTask(h.engine, t2.id, (s) => !(s.presentation.role === 'general_practice' && s.item.knowledge_point_ref === 'ma-kp1'))
  const obs = h.engine.state.targets.find((t) => t.id === target.id)?.observations ?? []
  assert.equal(obs.filter((o) => o.recurrence === 'independent').length, 1)
  // Repair-stage failures are attempts, never recurrence.
  assert.ok(obs.every((o) => o.source_type === 'app_practice'))
})

test('F03: short-only repair clears stages 1→2 the same day, transfer waits for a later day, at most two per day', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await bankMathTarget(h)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'mathematics')
  const r = await runTask(h.engine, t2.id)
  const repairs = r.seen.filter((s) => s.presentation.target_ref === target.id)
  assert.deepEqual(repairs.map((s) => s.presentation.stage), ['exact', 'similar'])
  let pr = progressOf(h.engine, target.id)
  assert.equal(pr.stage, 'generic')
  assert.deepEqual(pr.clearances.map((c) => c.cleared_on), ['2027-03-02', '2027-03-02'])
  assert.equal(pr.finalStageNotBefore, '2027-03-03')
  // Another task the same day does not offer the transfer stage.
  const opt = await h.engine.startOrResume('mathematics', { optional: true })
  if (opt.kind !== 'task') throw new Error('expected task')
  const ro = await runTask(h.engine, opt.task.id)
  assert.ok(ro.seen.every((s) => s.presentation.target_ref !== target.id))
  h.clock.sgt('2027-03-03')
  const t3 = await startTask(h.engine, 'mathematics')
  const r3 = await runTask(h.engine, t3.id)
  assert.deepEqual(r3.seen.filter((s) => s.presentation.target_ref === target.id).map((s) => s.presentation.stage), ['generic'])
  pr = progressOf(h.engine, target.id)
  assert.equal(pr.stage, 'delayed_review')
  assert.equal(pr.dueOn, '2027-03-04')
})

test('F04: a hint-assisted retry or correction never advances a stage and never counts toward X', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await bankMathTarget(h)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'mathematics')
  // First repair response wrong; the harness then retries (wrong) and selects the correction.
  const r = await runTask(h.engine, t2.id, (s) => s.presentation.target_ref !== target.id)
  assert.equal(r.done?.completion.answered, 10, 'retries and corrections are not formal questions')
  const pr = progressOf(h.engine, target.id)
  assert.equal(pr.stage, 'exact')
  assert.equal(pr.clearances.length, 0)
  assert.equal(pr.notBefore, '2027-03-03', 'further prescribed practice starts the day after the task finalised')
  // The failed target moved aside: only one presentation for it today.
  assert.equal(r.seen.filter((s) => s.presentation.target_ref === target.id).length, 1)
  const kinds = h.engine.state.events.filter((e) => e.phase !== 'first').map((e) => e.assistance)
  assert.ok(kinds.includes('hint') && kinds.includes('worked_steps'), 'Mathematics help: hint, then worked steps')
})

test('F04: a correct retry after a hint is still not independent evidence', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await bankMathTarget(h)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'mathematics')
  const s = await h.engine.next(t2.id)
  if (s.kind !== 'question') throw new Error('expected question')
  assert.equal(s.presentation.target_ref, target.id)
  await h.engine.answer(s.presentation.id, { kind: 'single', option_ids: ['b'], pairs: [] })
  const res = await h.engine.retry(s.presentation.id, structuredClone(s.item.key))
  assert.equal(res.correct, true)
  assert.equal(progressOf(h.engine, target.id).stage, 'exact')
})

test('F32: two distinct low-option successes clear a stage; a wrong first response resets the low count', async () => {
  const h = harness({ registry: registryWith(mathWithExact({ id: 'ma-kp1-exact-l1', low: true }, { id: 'ma-kp1-exact-l2', low: true }, { id: 'ma-kp1-exact-l3', low: true })) })
  const target = await bankMathTarget(h)
  h.clock.sgt('2027-03-02')
  // Low success, then a wrong first response at the same stage.
  const t2 = await startTask(h.engine, 'mathematics')
  let n = 0
  await runTask(h.engine, t2.id, (s) => (s.presentation.target_ref === target.id ? n++ === 0 : true))
  let pr = progressOf(h.engine, target.id)
  assert.equal(pr.stage, 'exact')
  assert.deepEqual(pr.lowSuccessItems, [], 'the wrong response cleared the partial low-option success')
  h.clock.sgt('2027-03-03')
  // Next eligible day: one fresh low success alone is not enough...
  const t3 = await startTask(h.engine, 'mathematics')
  const seen: string[] = []
  await runTask(h.engine, t3.id, (s) => { if (s.presentation.target_ref === target.id) seen.push(s.presentation.item_id); return true })
  pr = progressOf(h.engine, target.id)
  assert.equal(seen.length >= 2, true)
  assert.notEqual(seen[0], seen[1], 'two different questions')
  assert.equal(pr.clearances[0]?.stage, 'exact', '...two fresh distinct low-option successes clear it')
})

test('F32: one high-option (or matching/ordering) success clears a stage even after a partial low success', async () => {
  const h = harness({ registry: registryWith(mathWithExact({ id: 'ma-kp1-exact-l1', low: true }, { id: 'ma-kp1-exact-z9', low: false })) })
  const target = await bankMathTarget(h)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'mathematics')
  const r = await runTask(h.engine, t2.id)
  const exactSeen = r.seen.filter((s) => s.presentation.target_ref === target.id && s.presentation.stage === 'exact')
  assert.deepEqual(exactSeen.map((s) => s.presentation.format_class), ['low_option', 'high_option'])
  assert.equal(progressOf(h.engine, target.id).clearances[0].stage, 'exact')
})

test('F04: a first response recorded with known assistance (e.g. adult help) is practice only, never independent evidence', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await bankMathTarget(h)
  h.clock.sgt('2027-03-02')
  await runTask(h.engine, (await startTask(h.engine, 'mathematics')).id)
  assert.equal(progressOf(h.engine, target.id).stage, 'generic')
  // Re-derive from the same history with the repair first responses marked as assisted.
  const state = structuredClone(h.engine.state)
  const repairIds = new Set(state.presentations.filter((p) => p.target_ref === target.id).map((p) => p.id))
  for (const e of state.events) if (repairIds.has(e.presentation_id) && e.phase === 'first') e.assistance = 'hint'
  const { derive } = await import('../../src/engine/evidence.ts')
  assert.equal(derive(state).progress.get(target.id)?.stage, 'exact')
})
