// Parent-area views of mistakes and flagged questions (src/parent/progress.ts). Synthetic fixtures only.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Target } from '../../src/engine/types.ts'
import type { TargetProgress } from '../../src/engine/evidence.ts'
import { canInvalidateAnswer, flagGroups, nextPractice, progressRows } from '../../src/parent/progress.ts'
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
