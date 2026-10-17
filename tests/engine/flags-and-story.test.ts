// F15–F18, F22, F29, F36: flags and recalculation, story checkpoints, rest days, content versions, course locks.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CatalogueRelease } from '../../src/catalogue/adapter.ts'
import { courseAccess } from '../../src/engine/policy.ts'
import { chineseRelease, englishRelease, item, mathematicsRelease, scienceRelease } from './fixtures/catalogue.ts'
import { correctResponse, harness, progressOf, registryWith, reload, runTask, startTask, type Harness } from './helpers.ts'

async function bankMath(h: Harness) {
  const t = await startTask(h.engine, 'mathematics')
  let first = true
  await runTask(h.engine, t.id, () => { const ok = !first; first = false; return ok })
  return h.engine.state.targets[0]
}

test('F22: flagging an answered repair question removes its evidence and count, replaces it, and recalculates', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await bankMath(h)
  const day1Completion = structuredClone(h.engine.state.completions)
  for (const c of h.engine.pendingCheckpoints()) await h.engine.deliverCheckpoint(c.id)
  const delivered = structuredClone(h.engine.state.story.checkpoints)
  h.clock.sgt('2027-03-02')
  const t = await startTask(h.engine, 'mathematics')
  const s1 = await h.engine.next(t.id)
  if (s1.kind !== 'question') throw new Error('expected question')
  await h.engine.answer(s1.presentation.id, correctResponse(s1.item))
  assert.equal(progressOf(h.engine, target.id).stage, 'similar', 'cleared before the flag')
  await h.engine.flag(s1.presentation.id, 'answer_looks_wrong')
  await h.engine.flag(s1.presentation.id, 'answer_looks_wrong') // repeated flag is idempotent
  assert.equal(h.engine.state.flags.length, 1)
  assert.equal(progressOf(h.engine, target.id).stage, 'exact', 'the flagged evidence no longer counts')
  assert.equal(h.engine.answeredCount(h.engine.task(t.id)), 0)
  const rep = await h.engine.next(t.id)
  if (rep.kind !== 'question') throw new Error('expected question')
  assert.equal(rep.presentation.position, s1.presentation.position)
  assert.equal(rep.presentation.role, 'replacement')
  assert.notEqual(rep.item.id, s1.item.id, 'a suspended version is not served again to this child')
  assert.equal(rep.presentation.target_ref, target.id)
  // Reload keeps flag, suspension and replacement.
  const e = await reload(h)
  const again = await e.next(t.id)
  assert.equal(again.kind === 'question' && again.presentation.id, rep.presentation.id)
  assert.equal(e.state.suspensions.filter((x) => x.restored_at === null).length, 1)
  const r = await runTask(e, t.id)
  assert.equal(r.done?.completion.answered, 10)
  assert.deepEqual(e.state.completions.filter((c) => c.local_date === '2027-03-01'), day1Completion, 'past daily completion kept')
  for (const c of delivered) assert.deepEqual(e.state.story.checkpoints.find((x) => x.id === c.id), c, 'delivered story kept')
})

test('F22: parent restore re-enables the item and its other evidence; disable keeps it suspended; both are amendments', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await bankMath(h)
  h.clock.sgt('2027-03-02')
  const t = await startTask(h.engine, 'mathematics')
  const s1 = await h.engine.next(t.id)
  if (s1.kind !== 'question') throw new Error('expected question')
  await h.engine.flag(s1.presentation.id, 'question_unclear')
  const s2 = await h.engine.next(t.id)
  if (s2.kind !== 'question') throw new Error('expected question')
  await h.engine.flag(s2.presentation.id, 'too_hard') // flag the replacement as well
  await runTask(h.engine, t.id)
  await h.engine.decideFlag(s1.item.id, s1.item.version, 'restored')
  await h.engine.decideFlag(s2.item.id, s2.item.version, 'disabled')
  const active = h.engine.state.suspensions.filter((x) => x.restored_at === null).map((x) => x.item_id)
  assert.deepEqual(active, [s2.item.id])
  assert.deepEqual(h.engine.state.amendments.map((a) => a.kind), ['restore_item', 'disable_item'])
  assert.deepEqual(h.engine.state.flags.map((f) => f.status), ['restored', 'disabled'])
  // The flagged presentation itself stays replaced (no double count after a restore).
  assert.equal(h.engine.state.presentations.find((p) => p.id === s1.presentation.id)?.status, 'flagged_replaced')
})

test('F22: a flagged material question is excluded from the whole-task aggregate, which can then pass', async () => {
  const h = harness({ subjects: ['chinese'] })
  await h.engine.setX('chinese', 6)
  const t1 = await startTask(h.engine, 'chinese')
  let first = true
  await runTask(h.engine, t1.id, () => { const ok = !first; first = false; return ok })
  const target = h.engine.state.targets[0]
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'chinese')
  let wrongOnce = false
  let flaggedId = ''
  for (let i = 0; i < 200; i++) {
    const s = await h.engine.next(t2.id)
    if (s.kind === 'done') break
    if (s.kind !== 'question') continue
    if (s.awaiting === 'first') {
      const wrong = !wrongOnce && s.presentation.target_ref === target.id
      if (wrong) { wrongOnce = true; flaggedId = s.presentation.id }
      await h.engine.answer(s.presentation.id, wrong ? { kind: 'single', option_ids: ['b'], pairs: [] } : correctResponse(s.item))
      if (wrong) await h.engine.flag(s.presentation.id, 'answer_looks_wrong')
    } else if (s.awaiting === 'retry') await h.engine.retry(s.presentation.id, correctResponse(s.item))
    else await h.engine.correct(s.presentation.id, correctResponse(s.item))
  }
  assert.ok(flaggedId)
  const agg = h.engine.derived().aggregates.get(t2.id)?.find((a) => a.target_ref === target.id)
  assert.ok(agg && !agg.related_presentation_ids.includes(flaggedId))
  assert.equal(progressOf(h.engine, target.id).stage, 'similar')
})

test('F22: exhausted replacements end the subject at the actual count with a parent-visible reason', async () => {
  const r = mathematicsRelease()
  r.items = r.items.filter((i) => i.knowledge_point_ref === 'ma-kp1' && i.pools.includes('general')).slice(0, 7)
  r.knowledge_points = r.knowledge_points.filter((k) => k.ref === 'ma-kp1')
  const h = harness({ registry: registryWith(r) })
  await h.engine.setX('mathematics', 6)
  const t = await startTask(h.engine, 'mathematics')
  let flagged = 0
  for (let i = 0; i < 100; i++) {
    const s = await h.engine.next(t.id)
    if (s.kind === 'done') {
      assert.equal(s.completion.reason, 'replacements_exhausted')
      assert.equal(s.completion.answered, 5)
      break
    }
    if (s.kind !== 'question') continue
    if (s.presentation.position === 5 && s.awaiting === 'first') { await h.engine.flag(s.presentation.id, 'other'); flagged++; continue }
    await h.engine.answer(s.presentation.id, correctResponse(s.item))
  }
  assert.equal(flagged, 2, 'the slot was replaced until no valid item remained, without an endless loop')
  assert.equal(h.engine.dailyStatus().subjects[0].complete, true)
})

test('F15: language checkpoints use the planned actual total and material boundaries when it exceeds X', async () => {
  const h = harness({ subjects: ['chinese'] })
  await h.engine.setX('chinese', 6)
  await runTask(h.engine, (await startTask(h.engine, 'chinese')).id, () => false)
  await h.engine.setX('chinese', 7)
  h.clock.sgt('2027-03-02')
  const t = await startTask(h.engine, 'chinese')
  assert.ok(t.planned_total > 7, `planned ${t.planned_total}`)
  const halfway = Math.ceil(t.planned_total / 2)
  let answered = 0
  let halfwayAt = -1
  for (let i = 0; i < 300; i++) {
    const s = await h.engine.next(t.id)
    if (s.kind === 'done') break
    if (halfwayAt < 0 && h.engine.state.story.checkpoints.some((c) => c.task_id === t.id && c.kind === 'halfway')) halfwayAt = answered
    if (s.kind !== 'question') continue
    if (s.awaiting === 'first') { answered++; await h.engine.answer(s.presentation.id, correctResponse(s.item)) }
  }
  assert.ok(halfwayAt >= halfway, `halfway emitted after ${halfwayAt} answers (threshold ${halfway})`)
  assert.equal(halfwayAt % 3, 0, 'only at a material boundary, never mid-material')
  assert.equal(h.engine.state.story.checkpoints.filter((c) => c.task_id === t.id).length, 2)
})

test('F16: coinciding halfway and completion are combined once, and never repeat on reload', async () => {
  const r: CatalogueRelease = chineseRelease()
  // A one-question material followed by a five-question material: halfway (3) is first reached at the end.
  r.materials = [
    { ref: 'zh-a-tiny', version: 1, subject: 'chinese', course: 'p2_chinese', family: 'visual', question_ids: ['zh-a-tiny-q1'] },
    { ref: 'zh-b-long', version: 1, subject: 'chinese', course: 'p2_chinese', family: 'passage', question_ids: [1, 2, 3, 4, 5].map((n) => `zh-b-long-q${n}`) },
  ]
  r.items = r.items.filter((i) => i.material_ref === null)
  r.items.push(item('chinese', 'p2_chinese', 'zh-kp1', 'zh-a-tiny-q1', { pools: ['general'], material: 'zh-a-tiny' }))
  for (let n = 1; n <= 5; n++) r.items.push(item('chinese', 'p2_chinese', 'zh-kp2', `zh-b-long-q${n}`, { pools: ['general'], material: 'zh-b-long' }))
  const h = harness({ registry: registryWith(r) })
  await h.engine.setX('chinese', 6)
  const t = await startTask(h.engine, 'chinese')
  assert.equal(t.planned_total, 6)
  await runTask(h.engine, t.id)
  const mine = () => h.engine.state.story.checkpoints.filter((c) => c.task_id === t.id)
  assert.deepEqual(mine().map((c) => c.kind), ['combined'])
  await h.engine.deliverCheckpoint(mine()[0].id)
  const e = await reload(h)
  await e.next(t.id)
  assert.equal(e.state.story.checkpoints.filter((c) => c.task_id === t.id).length, 1)
  assert.equal(e.pendingCheckpoints().length, 0)
})

test('F17: one shared adventure whatever the subject order; exploration waits for every available subject', async () => {
  const orders = [['chinese', 'science', 'mathematics', 'english'], ['english', 'mathematics', 'science', 'chinese']] as const
  const sequences: number[][] = []
  for (const order of orders) {
    const h = harness()
    for (const s of order) await h.engine.setX(s, 6)
    for (const [i, s] of order.entries()) {
      assert.equal(h.engine.dailyStatus().explorationUnlocked, false, `locked before subject ${i + 1}`)
      await runTask(h.engine, (await startTask(h.engine, s)).id)
    }
    assert.equal(h.engine.dailyStatus().explorationUnlocked, true)
    sequences.push(h.engine.state.story.checkpoints.map((c) => c.story_seq))
  }
  assert.deepEqual(sequences[0], [0, 1, 2, 3, 4, 5, 6, 7])
  assert.deepEqual(sequences[1], sequences[0], 'the shared mainline advances the same way in any subject order')
})

test('F18: a rest day opens exploration and preserves X, stages and unfinished work, with no learning credit', async () => {
  const h = harness({ subjects: ['mathematics'] })
  await bankMath(h)
  await h.engine.setX('mathematics', 9)
  h.clock.sgt('2027-03-02')
  const t = await startTask(h.engine, 'mathematics')
  await runTask(h.engine, t.id, () => true, { stopAfter: 2 })
  await h.engine.pause(t.id)
  const stagesBefore = [...h.engine.derived().progress.values()].map((p) => p.stage)
  const checkpointsBefore = h.engine.state.story.checkpoints.length
  await h.engine.setRestDay()
  const status = h.engine.dailyStatus()
  assert.equal(status.rest, true)
  assert.equal(status.explorationUnlocked, true)
  assert.equal(status.subjects[0].complete, false, 'no fabricated completion')
  assert.equal(h.engine.state.story.checkpoints.length, checkpointsBefore)
  assert.deepEqual([...h.engine.derived().progress.values()].map((p) => p.stage), stagesBefore)
  assert.equal(h.engine.xFor('mathematics'), 9)
  h.clock.sgt('2027-03-03')
  assert.equal(h.engine.dailyStatus().explorationUnlocked, false, 'normal requirements resume next day')
  const resumed = await h.engine.startOrResume('mathematics')
  assert.equal(resumed.kind === 'task' && resumed.task.id, t.id)
})

test('F29: a paused task keeps its pinned content version and key across an update; failed updates keep usable content', async () => {
  const v1 = mathematicsRelease('syn-1')
  const h = harness({ registry: registryWith(v1) })
  const t = await startTask(h.engine, 'mathematics')
  const s1 = await h.engine.next(t.id)
  if (s1.kind !== 'question') throw new Error('expected question')
  await h.engine.pause(t.id)
  // Version 2 changes the key of the item currently on screen.
  const v2 = mathematicsRelease('syn-2')
  const changed = v2.items.find((i) => i.id === s1.item.id)
  if (!changed) throw new Error('item missing')
  changed.version = 2
  changed.key = { kind: 'single', option_ids: ['c'], pairs: [] }
  assert.equal(h.registry.install(v2).ok, true)
  // Failed update attempts: a broken release and a failed download.
  const broken = mathematicsRelease('syn-3')
  broken.items[0].key = { kind: 'single', option_ids: [], pairs: [] }
  assert.deepEqual(h.registry.install(broken), { ok: false, reason: `empty_key:${broken.items[0].id}` })
  assert.deepEqual(await h.registry.installFrom(async () => { throw new Error('offline') }), { ok: false, reason: 'download_failed' })
  assert.equal(h.registry.currentVersion('mathematics'), 'syn-2')
  const e = await reload(h)
  await e.resume(t.id)
  const again = await e.next(t.id)
  if (again.kind !== 'question') throw new Error('expected question')
  assert.equal(again.item.version, 1, 'the paused task still uses version 1')
  const res = await e.answer(again.presentation.id, { kind: 'single', option_ids: ['a'], pairs: [] })
  assert.equal(res.correct, true, 'judged against the pinned key, not retroactively by the new one')
  await runTask(e, t.id)
  assert.equal(e.task(t.id).content_version, 'syn-1')
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(e, 'mathematics')
  assert.equal(t2.content_version, 'syn-2')
  assert.equal(t2.policy_version, 'pilot-policy-1')
})

test('F36: P3 language practice open from the start, P3 language imports deferred, P3 Mathematics locked', async () => {
  assert.deepEqual(courseAccess('p3_chinese'), { practice: true, import: 'deferred' })
  assert.deepEqual(courseAccess('p3_higher_chinese'), { practice: true, import: 'deferred' })
  assert.deepEqual(courseAccess('p3_english'), { practice: true, import: 'deferred' })
  assert.deepEqual(courseAccess('p2_chinese'), { practice: true, import: 'enabled' })
  assert.deepEqual(courseAccess('p3_science'), { practice: true, import: 'enabled' })
  assert.deepEqual(courseAccess('p3_mathematics'), { practice: false, import: 'locked' })
  // P3 language material is planned for general practice.
  for (const rel of [chineseRelease(), englishRelease()]) {
    // Keep only P3 content, so every question served is P3 general practice.
    rel.materials = rel.materials.filter((m) => m.course.startsWith('p3_'))
    rel.items = rel.items.filter((i) => i.course.startsWith('p3_'))
    rel.knowledge_points = rel.knowledge_points.filter((k) => k.course.startsWith('p3_'))
    const h = harness({ registry: registryWith(rel) })
    const t = await startTask(h.engine, rel.subject)
    assert.ok(t.plan.materials.length > 0, `${rel.subject} P3 material available`)
    await runTask(h.engine, t.id, () => false)
    assert.ok(h.engine.state.targets.every((x) => x.course.startsWith('p3_')), 'app-caught P3 errors stay in the private bank')
  }
  // P3 Mathematics content is never served, even when it is the only content.
  const m = mathematicsRelease()
  m.items = m.items.filter((i) => i.course === 'p3_mathematics')
  m.knowledge_points = m.knowledge_points.filter((k) => k.course === 'p3_mathematics')
  const h = harness({ registry: registryWith(m) })
  assert.equal((await h.engine.startOrResume('mathematics')).kind, 'zero_eligible')
  // And Science, which has no P2 course, is untouched by the lock.
  const hs = harness({ registry: registryWith(scienceRelease()) })
  assert.equal((await hs.engine.startOrResume('science')).kind, 'task')
})

test('F22: after a parent restore, the replaced presentation itself still never counts (no double evidence)', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const target = await bankMath(h)
  h.clock.sgt('2027-03-02')
  const t = await startTask(h.engine, 'mathematics')
  const s1 = await h.engine.next(t.id)
  if (s1.kind !== 'question') throw new Error('expected question')
  await h.engine.answer(s1.presentation.id, correctResponse(s1.item)) // clears exact
  await h.engine.flag(s1.presentation.id, 'answer_looks_wrong')
  const rep = await h.engine.next(t.id)
  if (rep.kind !== 'question') throw new Error('expected question')
  await h.engine.answer(rep.presentation.id, { kind: 'single', option_ids: ['b'], pairs: [] }) // replacement wrong
  await h.engine.decideFlag(s1.item.id, s1.item.version, 'restored')
  assert.equal(progressOf(h.engine, target.id).stage, 'exact')
})

test('F15: language halfway uses the planned actual total, not X (materials of 3 and 4 questions, X = 6)', async () => {
  const r: CatalogueRelease = chineseRelease()
  r.materials = [
    { ref: 'zh-a-three', version: 1, subject: 'chinese', course: 'p2_chinese', family: 'visual', question_ids: [1, 2, 3].map((n) => `zh-a-three-q${n}`) },
    { ref: 'zh-b-four', version: 1, subject: 'chinese', course: 'p2_chinese', family: 'passage', question_ids: [1, 2, 3, 4].map((n) => `zh-b-four-q${n}`) },
  ]
  r.items = r.items.filter((i) => i.material_ref === null)
  for (let n = 1; n <= 3; n++) r.items.push(item('chinese', 'p2_chinese', 'zh-kp1', `zh-a-three-q${n}`, { pools: ['general'], material: 'zh-a-three' }))
  for (let n = 1; n <= 4; n++) r.items.push(item('chinese', 'p2_chinese', 'zh-kp2', `zh-b-four-q${n}`, { pools: ['general'], material: 'zh-b-four' }))
  const h = harness({ registry: registryWith(r) })
  await h.engine.setX('chinese', 6)
  const t = await startTask(h.engine, 'chinese')
  assert.equal(t.planned_total, 7, 'whole materials make the actual total exceed X')
  await runTask(h.engine, t.id)
  // Halfway of 7 is 4: first reached at the final boundary, so one combined interaction (not halfway after 3).
  assert.deepEqual(h.engine.state.story.checkpoints.filter((c) => c.task_id === t.id).map((c) => c.kind), ['combined'])
})
