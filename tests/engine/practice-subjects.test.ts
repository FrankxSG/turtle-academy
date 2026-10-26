// Enabled practice subjects (the build's release configuration) decide what is required each day. Installing a
// subject's catalogue alone never makes it required. Synthetic fixtures only.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { LearningEngine } from '../../src/engine/engine.ts'
import type { Subject } from '../../src/engine/types.ts'
import { harness, reload, runTask, startTask } from './helpers.ts'

const ALL: Subject[] = ['chinese', 'english', 'mathematics', 'science']

async function finish(engine: LearningEngine, subject: Subject) {
  const t = await startTask(engine, subject)
  const r = await runTask(engine, t.id)
  assert.ok(r.done, `${subject} task finished`)
  return t
}

const creditsToday = (e: LearningEngine, subject: Subject) =>
  e.state.completions.filter((c) => c.subject === subject && c.local_date === e.today()).length

test('Chinese-only: finishing Chinese opens exploration although other catalogues are installed', async () => {
  const h = harness({ subjects: ALL, enabled: ['chinese'] })
  await h.engine.setX('chinese', 6)
  assert.deepEqual(h.engine.dailyStatus().subjects.map((s) => s.subject), ['chinese'])
  assert.equal(h.engine.dailyStatus().explorationUnlocked, false)
  await finish(h.engine, 'chinese')
  assert.equal(h.engine.dailyStatus().explorationUnlocked, true)
  // Same result after a restart (records only; derived state is recomputed).
  const e = await reload(h)
  assert.equal(e.dailyStatus().explorationUnlocked, true)
  assert.deepEqual(e.availableSubjects(), ['chinese'])
})

test('several enabled subjects all remain required', async () => {
  const h = harness({ subjects: ALL, enabled: ['chinese', 'mathematics'] })
  for (const s of ['chinese', 'mathematics'] as const) await h.engine.setX(s, 6)
  await finish(h.engine, 'chinese')
  assert.equal(h.engine.dailyStatus().explorationUnlocked, false, 'Mathematics is still required')
  await finish(h.engine, 'mathematics')
  assert.equal(h.engine.dailyStatus().explorationUnlocked, true)
  assert.deepEqual(h.engine.dailyStatus().subjects.map((s) => s.subject), ['chinese', 'mathematics'])
})

test('the default (no configuration passed) keeps every installed subject required', async () => {
  const h = harness({ subjects: ALL })
  for (const s of ALL) await h.engine.setX(s, 6)
  for (const [i, s] of ALL.entries()) {
    await finish(h.engine, s)
    assert.equal(h.engine.dailyStatus().explorationUnlocked, i === ALL.length - 1)
  }
})

test('an enabled subject without installed content is not fabricated as complete or required', async () => {
  const h = harness({ subjects: ['chinese'], enabled: ['chinese', 'english'] })
  await h.engine.setX('chinese', 6)
  assert.deepEqual(h.engine.availableSubjects(), ['chinese'])
  await finish(h.engine, 'chinese')
  assert.equal(h.engine.dailyStatus().explorationUnlocked, true)
  assert.equal(creditsToday(h.engine, 'english'), 0)
})

test('an empty configuration never unlocks exploration or fabricates completion; a rest day still opens it', async () => {
  const h = harness({ subjects: ALL, enabled: [] })
  const status = h.engine.dailyStatus()
  assert.deepEqual(status.subjects, [])
  assert.equal(status.explorationUnlocked, false)
  await assert.rejects(h.engine.startOrResume('chinese'), /subject_disabled/)
  assert.equal(h.engine.state.completions.length, 0)
  assert.equal(h.engine.state.tasks.length, 0)
  await h.engine.setRestDay()
  assert.equal(h.engine.dailyStatus().explorationUnlocked, true)
  assert.equal(h.engine.state.completions.length, 0, 'rest gives no learning credit')
})

test('disabling a subject keeps its unfinished work untouched; re-enabling resumes it once', async () => {
  const h = harness({ subjects: ALL, enabled: ALL })
  for (const s of ALL) await h.engine.setX(s, 6)
  const english = await startTask(h.engine, 'english')
  await runTask(h.engine, english.id, () => true, { stopAfter: 3 })
  await h.engine.pause(english.id)
  const before = structuredClone({
    task: h.engine.task(english.id),
    events: h.engine.state.events.filter((ev) => h.engine.state.presentations.some((p) => p.id === ev.presentation_id && p.task_id === english.id)),
    targets: h.engine.state.targets,
    checkpoints: h.engine.state.story.checkpoints,
    x: h.engine.xFor('english'),
  })

  // Release configuration changes to Chinese only (app update / restart).
  h.enabled = ['chinese']
  let e = await reload(h)
  await assert.rejects(e.startOrResume('english'), /subject_disabled/)
  assert.deepEqual(e.dailyStatus().subjects.map((s) => s.subject), ['chinese'])
  await finish(e, 'chinese')
  assert.equal(e.dailyStatus().explorationUnlocked, true)
  assert.deepEqual(e.task(english.id), before.task, 'disabled task neither erased nor completed')
  assert.equal(creditsToday(e, 'english'), 0)
  assert.equal(e.xFor('english'), before.x, 'disabled subject keeps its X')
  for (const t of before.targets) assert.ok(e.state.targets.some((x) => x.id === t.id), 'targets kept')
  for (const c of before.checkpoints) assert.ok(e.state.story.checkpoints.some((x) => x.id === c.id), 'checkpoints kept')

  // Re-enabled: the same task resumes from where it stopped and earns credit once.
  h.enabled = ALL
  e = await reload(h)
  assert.equal(e.dailyStatus().explorationUnlocked, false, 'English is required again')
  const resumed = await e.startOrResume('english')
  assert.equal(resumed.kind, 'task')
  assert.equal(resumed.kind === 'task' && resumed.task.id, english.id)
  assert.equal(resumed.kind === 'task' && resumed.resumed, true)
  const answeredBefore = before.events.filter((ev) => ev.phase === 'first').length
  assert.equal(e.answeredCount(e.task(english.id)), answeredBefore, 'earlier answers kept')
  await runTask(e, english.id)
  assert.equal(creditsToday(e, 'english'), 1)
  const englishStory = e.state.story.checkpoints.filter((c) => c.task_id === english.id)
  assert.equal(new Set(englishStory.map((c) => c.id)).size, englishStory.length, 'no duplicate story credit')
  assert.ok(englishStory.some((c) => c.kind === 'completion' || c.kind === 'combined'))
})

test('pause, reload and finish (as offline: local records only) give one completion and one story credit', async () => {
  const h = harness({ subjects: ALL, enabled: ['chinese'] })
  await h.engine.setX('chinese', 6)
  const t = await startTask(h.engine, 'chinese')
  await runTask(h.engine, t.id, () => true, { stopAfter: 2 })
  await h.engine.pause(t.id)
  let e = await reload(h)
  assert.equal(e.dailyStatus().explorationUnlocked, false)
  const again = await e.startOrResume('chinese')
  assert.equal(again.kind === 'task' && again.task.id, t.id)
  await runTask(e, t.id)
  e = await reload(h)
  assert.equal(e.dailyStatus().explorationUnlocked, true)
  assert.equal(creditsToday(e, 'chinese'), 1)
  const story = e.state.story.checkpoints.filter((c) => c.task_id === t.id)
  assert.equal(story.filter((c) => c.kind === 'completion' || c.kind === 'combined').length, 1)
  // A second start the same day is optional practice and never a second daily credit.
  assert.equal((await e.startOrResume('chinese')).kind, 'already_complete')
})
