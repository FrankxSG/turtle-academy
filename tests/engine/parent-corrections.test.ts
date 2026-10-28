// F23 / F51 (engine side): parent amendments and invalidations are add-only records with provenance; replay
// recomputes stages, due dates and unlocks from the remaining evidence, and never revokes past daily completions
// or delivered story checkpoints. Synthetic fixtures only.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Target } from '../../src/engine/types.ts'
import { harness, progressOf, reload, runTask, startTask } from './helpers.ts'

type H = ReturnType<typeof harness>

/** An imported Mathematics mistake on ma-kp1 (schoolwork), recorded today. */
async function importTarget(h: H, id = 'imp-1', kp = 'ma-kp1', obs = [{ id: 'obs-1' }]): Promise<Target> {
  const date = h.engine.today()
  const t: Target = {
    id, subject: 'mathematics', course: 'p2_mathematics', target_kind: 'math_relationship', knowledge_point_ref: kp,
    target_value: null, assessed_skill: null, error_type: 'unknown_cause', mapping_status: 'mapped', verification: 'verified',
    status: 'active', verified_at: h.clock.now(), replaces: null,
    observations: obs.map((o) => ({
      id: o.id, source_type: 'schoolwork' as const, observed_on: date, recorded_on: date, instance_ref: 'import:test', batch_ref: null,
      recurrence: 'first' as const, invalidated: false,
    })),
  }
  await h.engine.upsertTargets([t])
  return h.engine.state.targets.find((x) => x.id === id) as Target
}

/** Day 2: a Mathematics task whose repair first answers are all correct (clears the imported target's exact stage). */
async function practiseRepairCorrect(h: H, targetId: string) {
  h.clock.sgt('2027-03-02')
  const t = await startTask(h.engine, 'mathematics')
  assert.ok(t.plan.slots.some((s) => s.target_ref === targetId), 'the imported target is scheduled the next day')
  await runTask(h.engine, t.id)
  for (const c of h.engine.pendingCheckpoints()) await h.engine.deliverCheckpoint(c.id)
  return t
}

const credit = (h: H) => JSON.stringify({ completions: h.engine.state.completions, story: h.engine.state.story })

test('F23: amending an imported target keeps the original, starts the replacement afresh and keeps past credit', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const original = await importTarget(h)
  const before = structuredClone(original)
  await practiseRepairCorrect(h, original.id)
  assert.notEqual(progressOf(h.engine, original.id).stage, 'exact', 'the original target advanced on day 2')
  const kept = credit(h)

  const { id } = await h.engine.amendTarget(original.id, { error_type: 'confused_form' }, 'wrong_error_type')

  // Add-only: the original record is untouched; the replacement points back to it and keeps its provenance.
  assert.deepEqual(h.engine.state.targets.find((t) => t.id === original.id), before)
  const replacement = h.engine.state.targets.find((t) => t.id === id) as Target
  assert.equal(replacement.replaces, original.id)
  assert.equal(replacement.error_type, 'confused_form')
  assert.deepEqual(replacement.observations.map((o) => [o.id, o.source_type, o.observed_on, o.instance_ref]),
    before.observations.map((o) => [o.id, o.source_type, o.observed_on, o.instance_ref]))
  const amendment = h.engine.state.amendments.at(-1)
  assert.equal(amendment?.kind, 'amend_target')
  assert.deepEqual(amendment?.refs, [original.id])
  assert.equal(amendment?.replacement_ref, id)
  assert.equal(amendment?.reason, 'wrong_error_type')

  // Replay: the original is no longer planned; the changed target inherits no success and waits a day.
  assert.equal(h.engine.derived().progress.has(original.id), false)
  const pr = progressOf(h.engine, id)
  assert.equal(pr.stage, 'exact')
  assert.deepEqual(pr.clearances, [])
  assert.equal(pr.notBefore, '2027-03-03')
  assert.equal(credit(h), kept, 'past daily completions and delivered story checkpoints are kept')

  // The answer events behind the original success are still there.
  assert.ok(h.engine.state.presentations.some((p) => p.target_ref === original.id))

  // Restart replays to the same result.
  const e = await reload(h)
  assert.equal(e.derived().progress.has(original.id), false)
  assert.equal(progressOf(e, id).stage, 'exact')
  assert.equal(credit(h), kept)
})

test('F23: invalidating a mistaken answer replays the target to its earlier stage and keeps the completion', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await importTarget(h)
  const task = await practiseRepairCorrect(h, target.id)
  const stageAfter = progressOf(h.engine, target.id).stage
  assert.notEqual(stageAfter, 'exact')
  const kept = credit(h)
  const repairs = h.engine.state.presentations.filter((p) => p.task_id === task.id && p.target_ref === target.id)
  assert.ok(repairs.length > 0)
  for (const p of repairs) await h.engine.invalidatePresentation(p.id, 'not_a_mistake')

  assert.ok(repairs.every((p) => h.engine.state.presentations.find((x) => x.id === p.id)?.status === 'invalidated'))
  assert.deepEqual(h.engine.state.amendments.filter((a) => a.kind === 'invalidate_presentation').map((a) => a.refs), repairs.map((p) => [p.id]))
  const pr = progressOf(h.engine, target.id)
  assert.equal(pr.stage, 'exact', 'stage recomputed from the remaining evidence')
  assert.deepEqual(pr.clearances, [])
  assert.equal(credit(h), kept)
  // Events stay; reload keeps the replay.
  assert.ok(h.engine.state.events.some((ev) => ev.presentation_id === repairs[0].id))
  assert.equal(progressOf(await reload(h), target.id).stage, 'exact')
})

test('F23: an app-caught target can be marked not a mistake; it is never planned again and the answer stays', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  let first = true
  await runTask(h.engine, t.id, () => { const ok = !first; first = false; return ok })
  const banked = h.engine.state.targets.find((x) => x.observations.some((o) => o.source_type === 'app_practice')) as Target
  const events = h.engine.state.events.length
  await h.engine.invalidateTarget(banked.id, 'not_a_mistake')
  assert.equal(h.engine.derived().progress.has(banked.id), false)
  assert.equal(h.engine.state.amendments.at(-1)?.kind, 'invalidate_target')
  assert.equal(h.engine.state.events.length, events)
  h.clock.sgt('2027-03-02')
  const next = await startTask(h.engine, 'mathematics')
  assert.ok(next.plan.slots.every((s) => s.target_ref !== banked.id))
  // A new first-wrong answer on the same skill later is a new mistake, not attached to the invalidated record.
  await runTask(h.engine, next.id, () => false)
  const after = h.engine.state.targets.find((x) => x.id === banked.id) as Target
  assert.equal(after.observations.length, banked.observations.length, 'nothing is added to the invalidated target')
})

test('F23: invalidating one imported observation recomputes eligibility from the remaining one', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h, 'imp-1', 'ma-kp1', [{ id: 'obs-1' }])
  h.clock.sgt('2027-03-05')
  // A later import of the same target (independent observation) moves its earliest practice to 6 March.
  const date = h.engine.today()
  await h.engine.upsertTargets([{ ...h.engine.state.targets[0], observations: [{
    id: 'obs-2', source_type: 'home_practice', observed_on: date, recorded_on: date, instance_ref: 'import:test-2', batch_ref: null,
    recurrence: 'independent', invalidated: false,
  }] }])
  assert.equal(progressOf(h.engine, 'imp-1').notBefore, '2027-03-06')
  await h.engine.invalidateObservation('imp-1', 'obs-2', 'duplicate')
  assert.equal(progressOf(h.engine, 'imp-1').notBefore, '2027-03-02')
  assert.deepEqual(h.engine.state.amendments.at(-1)?.refs, ['imp-1', 'obs-2'])
  // Invalidating the last observation leaves no mistake to practise.
  await h.engine.invalidateObservation('imp-1', 'obs-1', 'not_a_mistake')
  assert.equal(h.engine.derived().progress.has('imp-1'), false)
})

test('amendment commands are validated and change nothing when refused', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const imported = await importTarget(h)
  const t = await startTask(h.engine, 'mathematics')
  let first = true
  await runTask(h.engine, t.id, () => { const ok = !first; first = false; return ok })
  const appOnly = h.engine.state.targets.find((x) => x.observations.some((o) => o.source_type === 'app_practice')) as Target
  const snapshot = JSON.stringify(h.engine.state)
  const refuse = async (fn: () => Promise<unknown>, code: string) => {
    await assert.rejects(fn, (e: Error) => e.message === code)
    assert.equal(JSON.stringify(h.engine.state), snapshot, `${code} changed nothing`)
  }
  await refuse(() => h.engine.amendTarget('missing', { error_type: 'confused_form' }, 'wrong_error_type'), 'unknown_target')
  await refuse(() => h.engine.amendTarget(appOnly.id, { error_type: 'confused_form' }, 'wrong_error_type'), 'amend_requires_import')
  await refuse(() => h.engine.amendTarget(imported.id, { error_type: 'unknown_cause' }, 'wrong_error_type'), 'no_change')
  await refuse(() => h.engine.amendTarget(imported.id, { error_type: 'Bogus type' }, 'wrong_error_type'), 'unknown_error_type')
  await refuse(() => h.engine.amendTarget(imported.id, { knowledge_point_ref: 'zz-none' }, 'wrong_target'), 'unknown_knowledge_point')
  await refuse(() => h.engine.amendTarget(imported.id, { knowledge_point_ref: 'ma-p3-kp1' }, 'wrong_target'), 'unknown_knowledge_point')
  await refuse(() => h.engine.invalidateObservation(imported.id, 'missing', 'duplicate'), 'unknown_observation')
  await refuse(() => h.engine.invalidatePresentation('missing', 'not_a_mistake'), 'unknown_presentation')
  // An unfinished task's answers are corrected by flagging, not by parent invalidation.
  h.clock.sgt('2027-03-02')
  const open = await startTask(h.engine, 'mathematics')
  const step = await h.engine.next(open.id)
  if (step.kind !== 'question') throw new Error('expected a question')
  await h.engine.answer(step.presentation.id, step.item.key)
  const snap2 = JSON.stringify(h.engine.state)
  await assert.rejects(() => h.engine.invalidatePresentation(step.presentation.id, 'not_a_mistake'), (e: Error) => e.message === 'task_not_finished')
  assert.equal(JSON.stringify(h.engine.state), snap2)
  // A superseded target cannot be amended again; its replacement can.
  const { id } = await h.engine.amendTarget(imported.id, { knowledge_point_ref: 'ma-kp2' }, 'wrong_target')
  await assert.rejects(() => h.engine.amendTarget(imported.id, { error_type: 'confused_form' }, 'wrong_error_type'), (e: Error) => e.message === 'target_not_active')
  await assert.rejects(() => h.engine.invalidateTarget(imported.id, 'duplicate'), (e: Error) => e.message === 'target_not_active')
  await h.engine.amendTarget(id, { error_type: 'confused_form' }, 'wrong_error_type')
})

test('a changed knowledge point does not inherit success and is scheduled on the new point', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const original = await importTarget(h)
  await practiseRepairCorrect(h, original.id)
  const { id } = await h.engine.amendTarget(original.id, { knowledge_point_ref: 'ma-kp2' }, 'wrong_target')
  const pr = progressOf(h.engine, id)
  assert.equal(pr.target.knowledge_point_ref, 'ma-kp2')
  assert.equal(pr.stage, 'exact')
  h.clock.sgt('2027-03-03')
  const t = await startTask(h.engine, 'mathematics')
  const slots = t.plan.slots.filter((s) => s.target_ref === id)
  assert.ok(slots.length > 0, 'the replacement is planned the next day')
  assert.ok(t.plan.slots.every((s) => s.target_ref !== original.id))
  await runTask(h.engine, t.id)
  const shown = h.engine.state.presentations.filter((p) => p.task_id === t.id && p.target_ref === id)
  assert.ok(shown.length > 0 && shown.every((p) => h.registry.current('mathematics')?.items.find((i) => i.id === p.item_id)?.knowledge_point_ref === 'ma-kp2'))
})
