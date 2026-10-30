// Parent-area views of mistakes and flagged questions (src/parent/progress.ts). Synthetic fixtures only.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Target } from '../../src/engine/types.ts'
import type { TargetProgress } from '../../src/engine/evidence.ts'
import { canInvalidateAnswer, flagGroups, nextPractice, productionByMistake, progressRows } from '../../src/parent/progress.ts'
import type { CrosswalkRow } from '../../src/mistakes/intake.ts'
import { harness, runTask, startTask, wrongResponse } from '../engine/helpers.ts'

type H = ReturnType<typeof harness>
const rows = (h: H, subject: 'mathematics' | 'chinese' = 'mathematics', held: string[] = []) =>
  progressRows({ state: h.engine.state, derived: h.engine.derived(), today: h.engine.today(), subject, held: new Set(held) })

function imported(h: H, id: string, kp: string, cases: string[], mapping: Target['mapping_status'] = 'mapped'): Target {
  const date = h.engine.today()
  return {
    id, subject: 'mathematics', course: 'p2_mathematics', target_kind: 'math_relationship', knowledge_point_ref: kp, target_value: null,
    assessed_skill: null, error_type: 'unknown_cause', mapping_status: mapping, verification: 'verified', status: 'active', verified_at: null,
    replaces: null, observations: cases.map((c) => ({ id: `case:${c}`, source_type: 'schoolwork', observed_on: date, recorded_on: date,
      instance_ref: 'import:test', batch_ref: null, recurrence: 'independent', invalidated: false })),
  }
}

test('one row per target: cases sharing a target are counted, not repeated; states and next dates are explicit', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await h.engine.upsertTargets([imported(h, 'imp-shared', 'ma-kp1', ['o901', 'o902']), imported(h, 'imp-pending', 'ma-kp2', ['o903'], 'pending_content'),
    imported(h, 'imp-held', 'ma-kp3', ['o904'])])
  const r = rows(h, 'mathematics', ['imp-held'])
  assert.deepEqual(r.map((x) => [x.target.id, x.state, x.importedCases]), [
    ['imp-shared', 'repair', 2], ['imp-pending', 'pending_content', 1], ['imp-held', 'held', 1],
  ])
  const shared = r[0]
  assert.equal(shared.repairStep, 1)
  assert.deepEqual(shared.next, { kind: 'date', date: '2027-03-02' }, 'imports wait for the next day')
  assert.deepEqual(r[1].next, { kind: 'none' })
  assert.ok(r.every((x) => x.imported))
})

test('app-caught mistakes show repair stage, assistance and the wait until after the task', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  // Answer the first question wrong (it is banked), leave the task unfinished.
  const step = await h.engine.next(t.id)
  if (step.kind !== 'question') throw new Error('expected a question')
  await h.engine.answer(step.presentation.id, wrongResponse(step.item))
  const [row] = rows(h)
  assert.equal(row.state, 'repair')
  assert.deepEqual(row.next, { kind: 'after_task' }, 'blocked until the originating task finalises')
  assert.equal(row.appDays, 1)
  assert.equal(row.imported, false)
  await runTask(h.engine, t.id)
  const [after] = rows(h)
  assert.deepEqual(after.next, { kind: 'date', date: '2027-03-02' })
  // Day 2: repair with one wrong first answer (hint retry + correction), then a repeated item later.
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'mathematics')
  await runTask(h.engine, t2.id, (q) => q.presentation.target_ref !== row.target.id)
  const [day2] = rows(h)
  assert.ok(day2.recognition.firstWrong >= 1)
  assert.ok(day2.recognition.hintRetries >= 1, 'hint-assisted retries are shown separately')
  assert.ok(day2.recognition.corrections >= 1, 'supported corrections are shown separately')
  assert.equal(day2.recognition.independentCorrect, 0)
  assert.equal(day2.recognition.lastPractisedOn, '2027-03-02')
  assert.equal(day2.stage, 'exact')
})

test('a mistake caught only on a flagged question is suspended until the parent decides; restore and disable both replay', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  const step = await h.engine.next(t.id)
  if (step.kind !== 'question') throw new Error('expected a question')
  await h.engine.answer(step.presentation.id, wrongResponse(step.item))
  await h.engine.flag(step.presentation.id, 'answer_looks_wrong')
  assert.deepEqual(rows(h).map((r) => r.state), ['suspended'])
  const [group] = flagGroups(h.engine.state)
  assert.equal(group.status, 'open')
  assert.equal(group.item_id, step.item.id)
  assert.equal(group.flags[0].firstAnswer?.correct, false, 'the child’s answer is shown with the flag')
  assert.equal(group.flags[0].contentVersion, t.content_version)
  await h.engine.decideFlag(step.item.id, step.item.version, 'disabled')
  assert.deepEqual(rows(h), [], 'a disabled question leaves no mistake')
  assert.equal(flagGroups(h.engine.state)[0].status, 'disabled')
})

test('restoring a flagged question lifts its suspension; the flagged answer itself stays replaced', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  const step = await h.engine.next(t.id)
  if (step.kind !== 'question') throw new Error('expected a question')
  await h.engine.answer(step.presentation.id, wrongResponse(step.item))
  await h.engine.flag(step.presentation.id, 'question_unclear')
  await h.engine.decideFlag(step.item.id, step.item.version, 'restored')
  assert.equal(flagGroups(h.engine.state)[0].status, 'restored')
  assert.ok(h.engine.state.suspensions.every((x) => x.restored_at !== null), 'the version can be practised again')
  // Engine rule (src/engine/README.md, Flags): a restore re-includes other presentations of the version, never the
  // replaced one, so the mistake that only that answer produced is not shown again.
  assert.deepEqual(rows(h), [])
})

test('parent corrections remove superseded and invalidated targets from the view; answers are invalidatable only once finished', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await h.engine.upsertTargets([imported(h, 'imp-a', 'ma-kp1', ['o901']), imported(h, 'imp-b', 'ma-kp2', ['o902', 'o903'])])
  const { id } = await h.engine.amendTarget('imp-a', { error_type: 'confused_form' }, 'wrong_error_type')
  await h.engine.invalidateObservation('imp-b', 'case:o903', 'duplicate')
  const r = rows(h)
  assert.deepEqual(r.map((x) => [x.target.id, x.importedCases]), [[id, 1], ['imp-b', 1]].sort((a, b) => String(a[0]).localeCompare(String(b[0]))))
  await h.engine.invalidateTarget('imp-b', 'not_a_mistake')
  assert.deepEqual(rows(h).map((x) => x.target.id), [id])
  const t = await startTask(h.engine, 'mathematics')
  const step = await h.engine.next(t.id)
  if (step.kind !== 'question') throw new Error('expected a question')
  await h.engine.answer(step.presentation.id, step.item.key)
  assert.equal(canInvalidateAnswer(h.engine.state, step.presentation), false)
  await runTask(h.engine, t.id)
  assert.equal(canInvalidateAnswer(h.engine.state, step.presentation), true)
  await h.engine.invalidatePresentation(step.presentation.id, 'not_a_mistake')
  assert.equal(canInvalidateAnswer(h.engine.state, h.engine.state.presentations.find((p) => p.id === step.presentation.id)!), false)
})

test('a version restored once and disabled after a later flag is shown as disabled (its evidence stays excluded)', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const base = { presentation_id: null, item_id: 'ma-kp1-gen-1', item_version: 1, reason: 'too_hard' as const }
  h.engine.state.flags.push({ ...base, flagged_at: '2027-03-01T01:00:00.000Z', status: 'restored', decided_at: '2027-03-01T02:00:00.000Z' })
  h.engine.state.flags.push({ ...base, flagged_at: '2027-03-02T01:00:00.000Z', status: 'disabled', decided_at: '2027-03-02T02:00:00.000Z' })
  assert.equal(flagGroups(h.engine.state)[0].status, 'disabled')
  h.engine.state.flags.push({ ...base, flagged_at: '2027-03-03T01:00:00.000Z', status: 'open', decided_at: null })
  assert.equal(flagGroups(h.engine.state)[0].status, 'open')
})

test('next practice applies every eligibility gate, never a date that has already passed', () => {
  const pr = (o: Partial<TargetProgress>): TargetProgress => ({
    target: {} as never, stage: 'exact', lowSuccessItems: [], acquisitionSuccessItems: [], notBefore: null, notBeforeReason: null,
    blockedByTask: null, finalStageNotBefore: null, clearances: [], dueOn: null, reviewIndex: 0, everReachedDelayedReview: false,
    lastIndependentObservationOn: null, wholeTaskRoutes: new Set(), ...o,
  })
  const mapped = { id: 't', mapping_status: 'mapped', verification: 'verified' } as never
  assert.deepEqual(nextPractice(pr({ target: mapped }), '2027-03-05'), { kind: 'now' })
  assert.deepEqual(nextPractice(pr({ target: mapped, blockedByTask: 'x' }), '2027-03-05'), { kind: 'after_task' })
  assert.deepEqual(nextPractice(pr({ target: mapped, notBefore: '2027-03-07' }), '2027-03-05'), { kind: 'date', date: '2027-03-07' })
  // Two clearances today: tomorrow, even though the earliest-practice date has passed.
  const two = [{ stage: 'exact' as const, cleared_on: '2027-03-05' }, { stage: 'similar' as const, cleared_on: '2027-03-05' }]
  assert.deepEqual(nextPractice(pr({ target: mapped, stage: 'generic', notBefore: '2027-03-01', clearances: two }), '2027-03-05'), { kind: 'date', date: '2027-03-06' })
  // Final stage waits for its later-day gate.
  assert.deepEqual(nextPractice(pr({ target: mapped, stage: 'generic', finalStageNotBefore: '2027-03-06' }), '2027-03-05'), { kind: 'date', date: '2027-03-06' })
  // Delayed checks use the due date.
  assert.deepEqual(nextPractice(pr({ target: mapped, stage: 'delayed_review', dueOn: '2027-03-12' }), '2027-03-05'), { kind: 'date', date: '2027-03-12' })
})

test('the progress view counts the same observations as the engine when a duplicate mark meets a disabled question', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  const step = await h.engine.next(t.id)
  if (step.kind !== 'question') throw new Error('expected a question')
  await h.engine.answer(step.presentation.id, wrongResponse(step.item))
  const banked = h.engine.state.targets.find((x) => x.observations.some((o) => o.source_type === 'app_practice'))!
  const d = h.engine.today()
  await h.engine.upsertTargets([{ ...structuredClone(banked), observations: [{ id: 'case:x1', source_type: 'schoolwork', observed_on: d, recorded_on: d,
    instance_ref: 'import:x', batch_ref: null, recurrence: 'independent', invalidated: false }] }])
  await h.engine.invalidateObservation(banked.id, 'case:x1', 'duplicate')
  await h.engine.flag(step.presentation.id, 'answer_looks_wrong')
  await h.engine.decideFlag(step.item.id, step.item.version, 'disabled')
  assert.equal(h.engine.derived().progress.has(banked.id), true, 'the engine keeps the imported case')
  const [row] = rows(h)
  assert.equal(row.target.id, banked.id)
  assert.equal(row.importedCases, 1, 'the case keeping the mistake is shown')
  assert.equal(row.appDays, 0, 'the disabled question’s error is not')
  assert.deepEqual(row.observations.map((o) => o.id), ['case:x1'])
})

test('a mistake recorded under two targets (two devices) is one row with both records’ sources and answers', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  const step = await h.engine.next(t.id)
  if (step.kind !== 'question') throw new Error('expected a question')
  await h.engine.answer(step.presentation.id, wrongResponse(step.item))
  await runTask(h.engine, t.id)
  const original = h.engine.state.targets.find((x) => x.observations.some((o) => o.source_type === 'app_practice'))!
  // The other device's record of the same mistake, caught on the next day.
  h.engine.state.targets.push({ ...structuredClone(original), id: 'zz-other-device', observations: [{ ...original.observations[0], id: 'obs-other',
    observed_on: '2027-03-02', recorded_on: '2027-03-02', batch_ref: null, instance_ref: 'task-other' }] })
  h.engine.state = structuredClone(h.engine.state)
  const r = rows(h)
  assert.equal(r.length, 1, 'one row per mistake')
  assert.equal(r[0].target.id, [original.id, 'zz-other-device'].sort()[0])
  assert.equal(r[0].appDays, 2, 'both devices’ observations')
})

test('writing/speaking plans show on the mistake’s row even when the case is held by another record of it, and once per plan', async () => {
  const h = harness({ subjects: ['mathematics'] })
  // Two devices' records of one mistake: the case is held by the record that does not lead the group.
  const leader = imported(h, 'aa-app-caught', 'ma-kp1', [])
  leader.observations = [{ id: 'obs-app', source_type: 'app_practice', observed_on: h.engine.today(), recorded_on: h.engine.today(),
    instance_ref: 'task-1', batch_ref: null, recurrence: 'first', invalidated: false }]
  await h.engine.upsertTargets([leader, imported(h, 'zz-import', 'ma-kp1', ['o901', 'o902'])])
  const crosswalk: CrosswalkRow[] = [
    { case_id: 'O901', mode: 'objective', target_ref: 'ma-kp1', engine_target_id: 'zz-import', plan_id: 'P1', shared_with: ['O902'] },
    // A link stored by another device that names the leader: same mistake, same plan, listed once.
    { case_id: 'O902', mode: 'objective', target_ref: 'ma-kp1', engine_target_id: 'aa-app-caught', plan_id: 'P1', shared_with: ['O901'] },
  ]
  const r = rows(h)
  assert.deepEqual(r.map((x) => x.target.id), ['aa-app-caught'], 'one row, on the group leader')
  const prod = productionByMistake(h.engine.state, crosswalk, [])
  assert.deepEqual([...prod.keys()], ['aa-app-caught'], 'keyed by the row’s target')
  assert.equal(prod.get('aa-app-caught')!.length, 1, 'a plan shared by two cases is listed once')
  // A stale link naming a record that no longer holds anything still resolves from the holders.
  const stale = productionByMistake(h.engine.state, [{ ...crosswalk[0], engine_target_id: 'gone-record' }], [])
  assert.deepEqual([...stale.keys()], ['aa-app-caught'])
})
