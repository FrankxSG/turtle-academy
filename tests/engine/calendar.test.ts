// F12, F13, F14, F19, F37, F38: whole-task aggregation and calendar rules.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { localDate } from '../../src/engine/calendar.ts'
import type { Target } from '../../src/engine/types.ts'
import { harness, progressOf, runTask, startTask, type Harness } from './helpers.ts'

async function bank(h: Harness, subject: 'mathematics' | 'chinese'): Promise<Target> {
  const t = await startTask(h.engine, subject)
  let first = true
  await runTask(h.engine, t.id, () => { const ok = !first; first = false; return ok })
  const banked = h.engine.state.targets.filter((x) => x.observations.length > 0)
  assert.equal(banked.length, 1)
  return banked[0]
}

async function chineseWithTarget() {
  const h = harness({ subjects: ['chinese'] })
  await h.engine.setX('chinese', 6)
  const target = await bank(h, 'chinese')
  h.clock.sgt('2027-03-02')
  const t = await startTask(h.engine, 'chinese')
  const related = t.plan.slots.filter((s) => s.target_ref === target.id)
  const materials = [...new Set(related.map((s) => s.material_ref))]
  return { h, target, task: t, related, materials }
}

test('F12/F13 setup: the target is assessed by whole materials (not short questions) in two materials', async () => {
  const { related, materials } = await chineseWithTarget()
  assert.ok(related.length >= 2)
  assert.ok(related.every((s) => s.kind === 'material_question'))
  assert.equal(materials.length, 2)
})

test('F12: correct in one material but wrong in another keeps the starting stage; eligible the next day', async () => {
  const { h, target, task, materials } = await chineseWithTarget()
  await runTask(h.engine, task.id, (s) => !(s.presentation.target_ref === target.id && s.presentation.material_ref === materials[1]))
  const pr = progressOf(h.engine, target.id)
  assert.equal(pr.stage, 'exact')
  assert.equal(pr.clearances.length, 0)
  assert.equal(pr.notBefore, '2027-03-03')
  const agg = h.engine.derived().aggregates.get(task.id)?.find((a) => a.target_ref === target.id)
  assert.equal(agg?.route, 'whole_task')
  assert.equal(agg?.outcome, 'retained')
  assert.ok((agg?.high_option_success_ids.length ?? 0) > 0, 'earlier success is recorded but cannot pass the aggregate')
})

test('F13: all related first responses correct advance the target exactly once, at task finalisation', async () => {
  const { h, target, task } = await chineseWithTarget()
  let midTaskStage: string | undefined
  let count = 0
  await runTask(h.engine, task.id, () => {
    if (++count === 4) midTaskStage = progressOf(h.engine, target.id).stage
    return true
  })
  assert.equal(midTaskStage, 'exact', 'no partial pass after the first material')
  const pr = progressOf(h.engine, target.id)
  assert.equal(pr.stage, 'similar')
  assert.equal(pr.clearances.length, 1)
  // The newly unlocked stage was not assessed later in the same task.
  assert.ok(h.engine.state.presentations.filter((p) => p.task_id === task.id && p.target_ref === target.id).every((p) => p.stage === 'exact'))
})

test('F14: a task spanning midnight keeps its evidence, satisfies the new day once and sets cooldown from finalisation', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await bank(h, 'mathematics')
  h.clock.set('2027-03-02T23:50:00+08:00')
  const t = await startTask(h.engine, 'mathematics')
  await runTask(h.engine, t.id, (s) => s.presentation.target_ref !== target.id, { stopAfter: 6 })
  const halfwayBefore = h.engine.state.story.checkpoints.filter((c) => c.task_id === t.id && c.kind === 'halfway').length
  h.clock.set('2027-03-03T00:10:00+08:00')
  const r = await runTask(h.engine, t.id)
  assert.equal(r.done?.completion.answered, 10)
  assert.equal(r.done?.completion.local_date, '2027-03-03')
  assert.equal(h.engine.task(t.id).local_date, '2027-03-02')
  const status = h.engine.dailyStatus()
  assert.equal(status.subjects.find((s) => s.subject === 'mathematics')?.complete, true)
  assert.equal(h.engine.state.completions.filter((c) => c.local_date === '2027-03-02' && c.subject === 'mathematics').length, 0)
  assert.equal(progressOf(h.engine, target.id).notBefore, '2027-03-04', 'eligible tomorrow, not today')
  assert.equal(halfwayBefore, 1)
  assert.equal(h.engine.state.story.checkpoints.filter((c) => c.task_id === t.id && c.kind === 'halfway').length, 1)
  assert.equal(h.engine.state.story.checkpoints.filter((c) => c.task_id === t.id && c.kind === 'completion').length, 1)
})

test('F19: delayed checks follow 1/3/7/14/30/30 days from actual answer dates; failure resets to one day; no missed-day debt', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await bank(h, 'mathematics')
  const day = async (date: string, correct = true) => {
    h.clock.sgt(date)
    const t = await startTask(h.engine, 'mathematics')
    await runTask(h.engine, t.id, (s) => correct || s.presentation.target_ref !== target.id)
    return progressOf(h.engine, target.id)
  }
  await day('2027-03-02')
  let pr = await day('2027-03-03')
  assert.equal(pr.stage, 'delayed_review')
  assert.equal(pr.dueOn, '2027-03-04')
  pr = await day('2027-03-04'); assert.equal(pr.dueOn, '2027-03-07')
  pr = await day('2027-03-07'); assert.equal(pr.dueOn, '2027-03-14')
  pr = await day('2027-03-14'); assert.equal(pr.dueOn, '2027-03-28')
  pr = await day('2027-03-28'); assert.equal(pr.dueOn, '2027-04-27')
  pr = await day('2027-04-27'); assert.equal(pr.dueOn, '2027-05-27')
  // Late attendance: the next interval counts from the actual answering date, with no catch-up debt.
  pr = await day('2027-06-05'); assert.equal(pr.dueOn, '2027-07-05')
  // A wrong check keeps the generic stage and becomes eligible the day after the task finalises.
  pr = await day('2027-07-05', false)
  assert.equal(pr.stage, 'delayed_review')
  assert.equal(pr.dueOn, '2027-07-06')
  pr = await day('2027-07-06')
  assert.equal(pr.dueOn, '2027-07-07', 'the next success schedules one day, then lengthens')
  pr = await day('2027-07-07'); assert.equal(pr.dueOn, '2027-07-10')
})

test('F37: a timezone change eastward across midnight gives no extra day, story or early eligibility', async () => {
  const h = harness({ subjects: ['mathematics'], timezone: 'Europe/London', start: '2027-03-01T09:00:00Z' })
  const target = await bank(h, 'mathematics')
  h.clock.set('2027-03-02T19:00:00Z')
  const t = await startTask(h.engine, 'mathematics')
  await runTask(h.engine, t.id, (s) => s.presentation.target_ref !== target.id)
  assert.equal(progressOf(h.engine, target.id).notBefore, '2027-03-03')
  const checkpoints = h.engine.state.story.checkpoints.length
  h.clock.set('2027-03-02T20:30:00Z')
  await h.engine.setTimezone('Pacific/Auckland') // already 3 March there
  assert.equal(localDate(h.clock.now(), 'Pacific/Auckland'), '2027-03-03')
  assert.equal(h.engine.today(), '2027-03-02')
  assert.equal((await h.engine.startOrResume('mathematics')).kind, 'already_complete')
  assert.equal(h.engine.state.story.checkpoints.length, checkpoints)
  // Later the same night, still within the old zone's day: no new day, target still not due.
  h.clock.set('2027-03-02T23:30:00Z')
  assert.equal(h.engine.today(), '2027-03-02')
  // Once the old zone's next day begins, normal requirements resume.
  h.clock.set('2027-03-03T08:00:00Z')
  assert.equal(h.engine.today(), '2027-03-03')
  const next = await startTask(h.engine, 'mathematics')
  assert.ok(next.plan.slots.some((s) => s.target_ref === target.id))
})

test('F37: a timezone change westward never repeats a learning day or re-grants credit; pause/resume is safe', async () => {
  const h = harness({ subjects: ['mathematics'] })
  h.clock.set('2027-03-02T07:00:00+08:00')
  const t = await startTask(h.engine, 'mathematics')
  await runTask(h.engine, t.id, () => true, { stopAfter: 4 })
  await h.engine.pause(t.id)
  await h.engine.setTimezone('America/Los_Angeles') // still 1 March there
  assert.equal(h.engine.today(), '2027-03-02')
  const r = await h.engine.startOrResume('mathematics')
  assert.equal(r.kind === 'task' && r.resumed, true)
  await runTask(h.engine, t.id)
  assert.equal(h.engine.state.completions.length, 1)
  assert.equal(h.engine.state.completions[0].local_date, '2027-03-02')
  assert.equal((await h.engine.startOrResume('mathematics')).kind, 'already_complete')
  const ids = h.engine.state.story.checkpoints.map((c) => c.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(h.engine.state.settings.timezone_history.map((x) => [x.from_timezone, x.timezone]), [['Asia/Singapore', 'America/Los_Angeles']])
})

test('F38: active time counts use and teaching; stops on pause, background or two idle minutes; no double counting', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  const answerOne = async () => {
    const s = await h.engine.next(t.id)
    if (s.kind !== 'question') throw new Error('expected question')
    await h.engine.answer(s.presentation.id, structuredClone(s.item.key))
  }
  h.clock.advance(30); await answerOne() // 30
  h.clock.advance(30); await answerOne() // 60
  h.clock.advance(300); await answerOne() // idle gap: not counted
  h.clock.advance(20); await answerOne() // 80
  await h.engine.pause(t.id)
  h.clock.advance(600)
  await h.engine.resume(t.id)
  h.clock.advance(10); await answerOne() // 90
  await h.engine.background(t.id)
  h.clock.advance(900)
  h.clock.advance(5); await answerOne() // returns from background: new active span, 0 counted
  h.clock.advance(15); await answerOne() // 105
  const task = h.engine.task(t.id)
  assert.equal(task.active_seconds, 105)
  const states = task.activity.map((a) => a.state)
  for (const s of ['idle', 'paused', 'backgrounded']) assert.ok(states.includes(s as never), `${s} recorded`)
  assert.notEqual(task.active_seconds, (h.clock.t - Date.parse(task.created_at)) / 1000, 'elapsed task age is not practice time')
})
