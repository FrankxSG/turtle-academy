// F23 / F51 (engine side): parent amendments and invalidations are add-only records with provenance; replay
// recomputes stages, due dates and unlocks from the remaining evidence, and never revokes past daily completions
// or delivered story checkpoints. Synthetic fixtures only.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { amendmentView, observationInvalid, targetsById, validObservations } from '../../src/engine/amendments.ts'
import { completedKnowledgePoints, derive } from '../../src/engine/evidence.ts'
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

test('replay changes only the corrected evidence: other targets keep their progress exactly', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h, 'imp-1', 'ma-kp1', [{ id: 'obs-1' }])
  await importTarget(h, 'imp-2', 'ma-kp2', [{ id: 'obs-2' }])
  await practiseRepairCorrect(h, 'imp-1')
  const other = (id: string) => JSON.stringify(progressOf(h.engine, id), (k, v) => (k === 'target' || v instanceof Set ? undefined : v))
  const before = other('imp-2')
  await h.engine.amendTarget('imp-1', { error_type: 'confused_form' }, 'wrong_error_type')
  assert.equal(other('imp-2'), before)
  const answered = h.engine.state.presentations.find((p) => p.target_ref === 'imp-1' && h.engine.state.events.some((e) => e.presentation_id === p.id))!
  await h.engine.invalidatePresentation(answered.id, 'not_a_mistake')
  assert.equal(other('imp-2'), before)
})

test('dependent unlocks are recomputed: excluding the answers that completed a prerequisite locks its dependants again', async () => {
  const h = harness({ subjects: ['science'] })
  await h.engine.setX('science', 6)
  const t = await startTask(h.engine, 'science')
  await runTask(h.engine, t.id)
  const unlocked = () => completedKnowledgePoints(h.engine.derived().progress)
  assert.ok(unlocked().has('sci-1'), 'sci-1 acquisition completed, so sci-2 may be learned')
  const kept = credit(h)
  const tests = h.engine.state.presentations.filter((p) => p.role === 'acquisition_test' && h.registry.current('science')?.items.find((i) => i.id === p.item_id)?.knowledge_point_ref === 'sci-1')
  assert.equal(tests.length, 2)
  await h.engine.invalidatePresentation(tests[0].id, 'not_a_mistake')
  assert.equal(unlocked().has('sci-1'), false, 'one remaining test is not acquisition')
  assert.equal(credit(h), kept)
})

test('concurrent corrections converge whatever order they arrive in; one mistake keeps one schedule', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h, 'imp-1', 'ma-kp1', [{ id: 'obs-1' }, { id: 'obs-2' }])
  const start = structuredClone(h.engine.state)
  // Device A corrects the error type. Device B, from the same starting records, marks obs-2 a duplicate on the
  // original and then (later) corrects the knowledge point. Records are add-only, so both sets meet in any order.
  const a = await h.engine.amendTarget('imp-1', { error_type: 'confused_form' }, 'wrong_error_type')
  const fromA = { targets: h.engine.state.targets.filter((t) => !start.targets.some((x) => x.id === t.id)), amendments: h.engine.state.amendments.slice(start.amendments.length) }
  h.engine.state = structuredClone(start)
  h.clock.advance(60)
  await h.engine.invalidateObservation('imp-1', 'obs-2', 'duplicate')
  const b = await h.engine.amendTarget('imp-1', { knowledge_point_ref: 'ma-kp2' }, 'wrong_target')
  const fromB = { targets: h.engine.state.targets.filter((t) => !start.targets.some((x) => x.id === t.id)), amendments: h.engine.state.amendments.slice(start.amendments.length) }
  const merged = (first: typeof fromA, second: typeof fromA) => {
    const state = structuredClone(start)
    state.targets.push(...structuredClone(first.targets), ...structuredClone(second.targets))
    state.amendments.push(...structuredClone(first.amendments), ...structuredClone(second.amendments))
    return state
  }
  const results = [merged(fromA, fromB), merged(fromB, fromA)].map((state) => {
    const progress = [...derive(state).progress.values()]
    return JSON.stringify(progress.map((p) => [p.target.id, p.stage, p.notBefore, p.target.knowledge_point_ref,
      p.target.observations.filter((o) => !observationInvalid(p.target, o, amendmentView(state))).map((o) => o.id)]))
  })
  assert.equal(results[0], results[1], 'the same result in either arrival order')
  const [only, ...rest] = JSON.parse(results[0]) as [string, string, string, string, string[]][]
  assert.equal(rest.length, 0, 'one mistake has one schedule')
  assert.equal(only[0], b.id, 'the later correction holds the mistake')
  assert.notEqual(only[0], a.id)
  // A's replacement was made without knowing about B's duplicate mark; the mark still applies to the mistake.
  const view = amendmentView(merged(fromA, fromB))
  const replacementA = fromA.targets[0]
  assert.deepEqual(replacementA.observations.map((o) => o.id), ['obs-1', 'obs-2'])
  assert.equal(observationInvalid(replacementA, replacementA.observations[1], view), true)
  assert.deepEqual(only[4], ['obs-1'])
})

test('a correction made on one device and "not a mistake" on another: the mistake stays invalidated', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h)
  const { id } = await h.engine.amendTarget('imp-1', { error_type: 'confused_form' }, 'wrong_error_type')
  const state = structuredClone(h.engine.state)
  state.amendments.push({ id: 'zz-remote', at: '2027-03-01T00:00:00.000Z', actor: 'parent', kind: 'invalidate_target', refs: ['imp-1'], replacement_ref: null, reason: 'not_a_mistake', reducer_revision: 2 })
  const progress = derive(state).progress
  assert.equal(progress.has('imp-1'), false)
  assert.equal(progress.has(id), false)
})

test('a correction cannot give a mistake a second schedule: moving it onto an existing mistake is refused', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h, 'imp-a', 'ma-kp1', [{ id: 'obs-a' }])
  await importTarget(h, 'imp-b', 'ma-kp2', [{ id: 'obs-b' }])
  const snapshot = JSON.stringify(h.engine.state)
  await assert.rejects(() => h.engine.amendTarget('imp-a', { knowledge_point_ref: 'ma-kp2' }, 'wrong_target'), (e: Error) => e.message === 'target_exists')
  assert.equal(JSON.stringify(h.engine.state), snapshot)
  const kp2 = [...h.engine.derived().progress.values()].filter((p) => p.target.knowledge_point_ref === 'ma-kp2')
  assert.equal(kp2.length, 1)
})

test('a mistake recorded on the original by a device that had not seen the correction joins the replacement', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h, 'imp-1', 'ma-kp1', [{ id: 'obs-1' }])
  const { id } = await h.engine.amendTarget('imp-1', { error_type: 'confused_form' }, 'wrong_error_type')
  // Device B (not yet synced) added an independent import to the original on 5 March; its record arrives later.
  h.clock.sgt('2027-03-05')
  const original = h.engine.state.targets.find((t) => t.id === 'imp-1')!
  original.observations.push({ id: 'obs-late', source_type: 'home_practice', observed_on: '2027-03-05', recorded_on: '2027-03-05',
    instance_ref: 'import:other-device', batch_ref: null, recurrence: 'independent', invalidated: false })
  const pr = derive(h.engine.state).progress.get(id)!
  assert.equal(pr.notBefore, '2027-03-06', 'the late observation counts on the replacement (next-day eligibility)')
  assert.equal(derive(h.engine.state).progress.has('imp-1'), false, 'still one schedule')
  // It can also be marked a duplicate from the replacement, and the last observation is never removed as a duplicate.
  await h.engine.invalidateObservation(id, 'obs-late', 'duplicate')
  assert.equal(progressOf(h.engine, id).notBefore, '2027-03-02')
  await assert.rejects(() => h.engine.invalidateObservation(id, 'obs-1', 'duplicate'), (e: Error) => e.message === 'last_observation')
})

test('two devices each marking the other case a duplicate keep one observation: the mistake does not vanish', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h, 'imp-1', 'ma-kp1', [{ id: 'obs-1' }, { id: 'obs-2' }])
  await h.engine.invalidateObservation('imp-1', 'obs-1', 'duplicate')
  // The other device's mark (made before it saw this one) arrives.
  h.engine.state.amendments.push({ id: 'zz-remote', at: h.clock.now(), actor: 'parent', kind: 'invalidate_observation', refs: ['imp-1', 'obs-2'],
    replacement_ref: null, reason: 'duplicate', reducer_revision: 2 })
  const kept = derive(h.engine.state).progress.get('imp-1')
  assert.ok(kept, 'duplicates of each other are still one mistake')
  assert.deepEqual(validObservations(kept.target, amendmentView(h.engine.state), targetsById(h.engine.state)).map((o) => o.id), ['obs-1'])
  // "Not a mistake" on either case, or on the target, still removes it.
  const withNotAMistake = structuredClone(h.engine.state)
  withNotAMistake.amendments.push({ id: 'zz-remote-2', at: h.clock.now(), actor: 'parent', kind: 'invalidate_observation', refs: ['imp-1', 'obs-1'],
    replacement_ref: null, reason: 'not_a_mistake', reducer_revision: 2 })
  assert.equal(derive(withNotAMistake).progress.has('imp-1'), false)
  const withTarget = structuredClone(h.engine.state)
  withTarget.amendments.push({ id: 'zz-remote-3', at: h.clock.now(), actor: 'parent', kind: 'invalidate_target', refs: ['imp-1'],
    replacement_ref: null, reason: 'not_a_mistake', reducer_revision: 2 })
  assert.equal(derive(withTarget).progress.has('imp-1'), false)
})

test('an app-caught error on the original after a knowledge-point correction stays with its own point', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h, 'imp-1', 'ma-kp1', [{ id: 'obs-1' }])
  const moved = await h.engine.amendTarget('imp-1', { knowledge_point_ref: 'ma-kp2' }, 'wrong_target')
  // A device that had not seen the correction banked an app-caught ma-kp1 error on the original.
  const state = structuredClone(h.engine.state)
  state.targets.find((t) => t.id === 'imp-1')!.observations.push({ id: 'app-late', source_type: 'app_practice', observed_on: '2027-03-05',
    recorded_on: '2027-03-05', instance_ref: 'task-x', batch_ref: null, recurrence: 'independent', invalidated: false })
  const view = amendmentView(state)
  const head = state.targets.find((t) => t.id === moved.id)!
  assert.deepEqual(validObservations(head, view, targetsById(state)).map((o) => o.id), ['obs-1'], 'a ma-kp1 error never schedules ma-kp2')
  // An error-type-only correction keeps the same point, so such an error does belong to it.
  const h2 = harness({ subjects: ['mathematics'] })
  await importTarget(h2, 'imp-1', 'ma-kp1', [{ id: 'obs-1' }])
  const typed = await h2.engine.amendTarget('imp-1', { error_type: 'confused_form' }, 'wrong_error_type')
  const s2 = structuredClone(h2.engine.state)
  s2.targets.find((t) => t.id === 'imp-1')!.observations.push({ id: 'app-late', source_type: 'app_practice', observed_on: '2027-03-05',
    recorded_on: '2027-03-05', instance_ref: 'task-x', batch_ref: null, recurrence: 'independent', invalidated: false })
  assert.deepEqual(validObservations(s2.targets.find((t) => t.id === typed.id)!, amendmentView(s2), targetsById(s2)).map((o) => o.id).sort(), ['app-late', 'obs-1'])
})

test('"not a mistake" outranks "duplicate" in either arrival order, also when marked on an ancestor before a correction', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h, 'imp-1', 'ma-kp1', [{ id: 'obs-1' }, { id: 'obs-2' }])
  const mark = (id: string, obs: string, reason: 'duplicate' | 'not_a_mistake', at: string) =>
    ({ id, at, actor: 'parent' as const, kind: 'invalidate_observation' as const, refs: ['imp-1', obs], replacement_ref: null, reason, reducer_revision: 2 })
  for (const order of [['a', 'b'], ['b', 'a']]) {
    const state = structuredClone(h.engine.state)
    const marks = { a: mark('m-a', 'obs-1', 'duplicate', '2027-03-01T02:00:00.000Z'), b: mark('m-b', 'obs-1', 'not_a_mistake', '2027-03-01T01:00:00.000Z') }
    state.amendments.push(...order.map((k) => marks[k as 'a' | 'b']), mark('m-c', 'obs-2', 'duplicate', '2027-03-01T03:00:00.000Z'))
    assert.equal(derive(state).progress.has('imp-1'), false, `order ${order.join('')}: obs-1 is not a mistake, so obs-2 duplicates nothing`)
  }
  // A duplicate marked on the original, then a correction: the mark still applies to the replacement.
  await h.engine.invalidateObservation('imp-1', 'obs-2', 'duplicate')
  const { id } = await h.engine.amendTarget('imp-1', { error_type: 'confused_form' }, 'wrong_error_type')
  assert.deepEqual(validObservations(h.engine.state.targets.find((t) => t.id === id)!, amendmentView(h.engine.state), targetsById(h.engine.state)).map((o) => o.id), ['obs-1'])
})

test('a duplicate mark plus a flagged app-caught error does not make an imported mistake vanish', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  const step = await h.engine.next(t.id)
  if (step.kind !== 'question') throw new Error('expected a question')
  await h.engine.answer(step.presentation.id, { kind: 'single', option_ids: ['b'], pairs: [] })
  const banked = h.engine.state.targets.find((x) => x.observations.some((o) => o.source_type === 'app_practice'))!
  // An import of the same mistake joins it; the parent marks the import a duplicate of the app-caught error.
  const d = h.engine.today()
  await h.engine.upsertTargets([{ ...structuredClone(banked), observations: [{ id: 'case-x', source_type: 'schoolwork', observed_on: d, recorded_on: d,
    instance_ref: 'import:x', batch_ref: null, recurrence: 'independent', invalidated: false }] }])
  await h.engine.invalidateObservation(banked.id, 'case-x', 'duplicate')
  // The child then flags the question that produced the app-caught error.
  await h.engine.flag(step.presentation.id, 'answer_looks_wrong')
  assert.equal(h.engine.derived().progress.has(banked.id), true, 'the imported case still stands')
})

test('correcting the point of a mistake leaves its app-caught errors behind; an error-type-only correction keeps them', async () => {
  for (const [change, expected] of [[{ knowledge_point_ref: 'ma-kp2' }, ['obs-1']], [{ error_type: 'confused_form' }, ['app-early', 'obs-1']]] as const) {
    const h = harness({ subjects: ['mathematics'] })
    await importTarget(h, 'imp-1', 'ma-kp1', [{ id: 'obs-1' }])
    h.engine.state.targets[0].observations.push({ id: 'app-early', source_type: 'app_practice', observed_on: '2027-03-01', recorded_on: '2027-03-01',
      instance_ref: 'task-x', batch_ref: null, recurrence: 'independent', invalidated: false })
    const { id } = await h.engine.amendTarget('imp-1', change, 'knowledge_point_ref' in change ? 'wrong_target' : 'wrong_error_type')
    assert.deepEqual(h.engine.state.targets.find((t) => t.id === id)!.observations.map((o) => o.id).sort(), [...expected])
  }
})

test('a correction that would carry no imported case is refused (cases marked duplicates on two devices, one app-caught error left)', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h, 'imp-1', 'ma-kp1', [{ id: 'obs-1' }, { id: 'obs-2' }])
  h.engine.state.targets[0].observations.push({ id: 'app-early', source_type: 'app_practice', observed_on: '2027-03-01', recorded_on: '2027-03-01',
    instance_ref: 'task-x', batch_ref: null, recurrence: 'independent', invalidated: false })
  // Device A marked obs-1 a duplicate, device B obs-2; both marks arrive.
  for (const [id, obs] of [['m-a', 'obs-1'], ['m-b', 'obs-2']]) h.engine.state.amendments.push({ id, at: h.clock.now(), actor: 'parent', kind: 'invalidate_observation',
    refs: ['imp-1', obs], replacement_ref: null, reason: 'duplicate', reducer_revision: 2 })
  h.engine.state = structuredClone(h.engine.state)
  const snapshot = JSON.stringify(h.engine.state)
  await assert.rejects(() => h.engine.amendTarget('imp-1', { knowledge_point_ref: 'ma-kp2' }, 'wrong_target'), (e: Error) => e.message === 'amend_requires_import')
  assert.equal(JSON.stringify(h.engine.state), snapshot)
})

test('a mistake kept by an imported case marked duplicate of a disabled question’s error can still be corrected', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  const step = await h.engine.next(t.id)
  if (step.kind !== 'question') throw new Error('expected a question')
  await h.engine.answer(step.presentation.id, { kind: 'single', option_ids: ['b'], pairs: [] })
  const banked = h.engine.state.targets.find((x) => x.observations.some((o) => o.source_type === 'app_practice'))!
  const d = h.engine.today()
  await h.engine.upsertTargets([{ ...structuredClone(banked), observations: [{ id: 'case-x', source_type: 'schoolwork', observed_on: d, recorded_on: d,
    instance_ref: 'import:x', batch_ref: null, recurrence: 'independent', invalidated: false }] }])
  await h.engine.invalidateObservation(banked.id, 'case-x', 'duplicate')
  await h.engine.flag(step.presentation.id, 'answer_looks_wrong')
  await h.engine.decideFlag(step.item.id, step.item.version, 'disabled')
  const { id } = await h.engine.amendTarget(banked.id, { error_type: 'unknown_cause' === banked.error_type ? 'confused_form' : 'unknown_cause' }, 'wrong_error_type')
  assert.deepEqual(h.engine.state.targets.find((x) => x.id === id)!.observations.map((o) => o.id), ['case-x'])
  assert.ok(h.engine.derived().progress.has(id))
})

test('sequential corrections retain causality when the clock goes backwards', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await importTarget(h)
  h.clock.sgt('2027-03-03')
  const first = await h.engine.amendTarget('imp-1', { knowledge_point_ref: 'ma-kp2' }, 'wrong_target')
  h.clock.sgt('2027-03-02')
  const last = await h.engine.amendTarget(first.id, { knowledge_point_ref: 'ma-kp1' }, 'wrong_target')
  assert.deepEqual([...h.engine.derived().progress.keys()], [last.id])
  h.engine.state.amendments.reverse()
  assert.deepEqual([...h.engine.derived().progress.keys()], [last.id])
})
