// F05–F09, F24, F39, F40: Science acquisition, prerequisites, filler exposure and shortened completion.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CatalogueRelease } from '../../src/catalogue/adapter.ts'
import { scienceRelease } from './fixtures/catalogue.ts'
import { harness, registryWith, reload, runTask, startTask, type Harness } from './helpers.ts'

const sciTarget = (h: Harness, kp: string) => {
  const pr = [...h.engine.derived().progress.values()].find((p) => p.target.knowledge_point_ref === kp && p.target.error_type === 'none')
  if (!pr) throw new Error(`no acquisition target for ${kp}`)
  return pr
}

function onlyKps(r: CatalogueRelease, keep: string[]): CatalogueRelease {
  r.knowledge_points = r.knowledge_points.filter((k) => keep.includes(k.ref))
  r.items = r.items.filter((i) => keep.includes(i.knowledge_point_ref))
  return r
}

test('F05: teaching (uncounted) then two different-context first-correct tests enter delayed review without a mistake', async () => {
  const h = harness({ subjects: ['science'] })
  await h.engine.setX('science', 6)
  const t = await startTask(h.engine, 'science')
  assert.deepEqual(t.plan.slots.slice(0, 3).map((s) => s.role), ['teaching', 'acquisition_test', 'acquisition_test'])
  const r = await runTask(h.engine, t.id)
  assert.equal(r.teaching, 2, 'two small knowledge points were taught (sci-1 and the unrelated sci-3)')
  assert.equal(r.done?.completion.answered, 6, 'teaching is not counted toward X')
  const pr = sciTarget(h, 'sci-1')
  assert.equal(pr.stage, 'delayed_review')
  assert.equal(pr.dueOn, '2027-03-02')
  assert.equal(pr.target.observations.length, 0, 'no mistake record')
  const tests = r.seen.filter((s) => s.presentation.role === 'acquisition_test' && s.item.knowledge_point_ref === 'sci-1')
  assert.equal(tests.length, 2)
  assert.notEqual(tests[0].item.context_ref, tests[1].item.context_ref)
  assert.ok(tests.every((s) => s.presentation.novel_context))
  assert.ok(r.seen.filter((s) => s.presentation.role === 'general_practice').every((s) => ['sci-1', 'sci-3'].includes(s.item.knowledge_point_ref)),
    'filler only from taught knowledge points')
})

test('F06/F39: initial prerequisite failure blocks only dependents; same-day second test is not acquisition evidence; repair unlocks', async () => {
  const h = harness({ subjects: ['science'] })
  await h.engine.setX('science', 6)
  const t1 = await startTask(h.engine, 'science')
  const r1 = await runTask(h.engine, t1.id, (s) => !(s.presentation.role === 'acquisition_test' && s.item.knowledge_point_ref === 'sci-1'))
  let pr = sciTarget(h, 'sci-1')
  assert.equal(pr.stage, 'exact')
  assert.equal(pr.notBefore, '2027-03-02')
  // F39: after the answer-revealing help, the planned second test slot did not test sci-1 again.
  assert.equal(r1.seen.filter((s) => s.presentation.role === 'acquisition_test' && s.item.knowledge_point_ref === 'sci-1').length, 1)
  assert.equal(r1.seen.some((s) => s.item.knowledge_point_ref === 'sci-3' && s.presentation.role === 'acquisition_test'), true, 'unrelated sci-3 still taught')
  assert.equal(sciTarget(h, 'sci-3').stage, 'delayed_review')
  // Day 2: repair exact and similar; sci-2 is still locked.
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'science')
  assert.ok(!t2.plan.slots.some((s) => s.role === 'teaching'), 'dependent sci-2 is not taught yet')
  await runTask(h.engine, t2.id)
  assert.equal(sciTarget(h, 'sci-1').stage, 'generic')
  // Day 3: transfer stage completes the repair; dependent learning unlocks without waiting for delayed checks.
  h.clock.sgt('2027-03-03')
  await runTask(h.engine, (await startTask(h.engine, 'science')).id)
  pr = sciTarget(h, 'sci-1')
  assert.equal(pr.stage, 'delayed_review')
  h.clock.sgt('2027-03-04')
  const t4 = await startTask(h.engine, 'science')
  const r4 = await runTask(h.engine, t4.id)
  assert.ok(r4.seen.some((s) => s.presentation.role === 'acquisition_test' && s.item.knowledge_point_ref === 'sci-2'))
})

test('F07: a later generic failure of a prerequisite keeps dependent content unlocked and resets the interval', async () => {
  const h = harness({ subjects: ['science'] })
  await h.engine.setX('science', 6)
  await runTask(h.engine, (await startTask(h.engine, 'science')).id)
  h.clock.sgt('2027-03-02')
  // sci-1's first delayed check fails.
  const t2 = await startTask(h.engine, 'science')
  const r2 = await runTask(h.engine, t2.id, (s) => !(s.presentation.role === 'delayed_review' && s.item.knowledge_point_ref === 'sci-1'))
  assert.ok(r2.seen.some((s) => s.presentation.role === 'acquisition_test' && s.item.knowledge_point_ref === 'sci-2'), 'sci-2 already unlocked by acquisition')
  const pr = sciTarget(h, 'sci-1')
  assert.equal(pr.stage, 'delayed_review')
  assert.equal(pr.reviewIndex, -1)
  assert.equal(pr.dueOn, '2027-03-03')
  h.clock.sgt('2027-03-03')
  const t3 = await startTask(h.engine, 'science')
  const r3 = await runTask(h.engine, t3.id)
  assert.ok(r3.seen.some((s) => s.item.knowledge_point_ref === 'sci-4' && s.presentation.role === 'acquisition_test') || sciTarget(h, 'sci-2').stage !== 'acquisition',
    'dependents of sci-1 are never re-locked')
})

test('F08: a pause or reload between the two tests preserves partial acquisition without duplicate first attempts', async () => {
  const h = harness({ subjects: ['science'] })
  await h.engine.setX('science', 6)
  const t = await startTask(h.engine, 'science')
  await runTask(h.engine, t.id, () => true, { stopAfter: 1 })
  assert.deepEqual(sciTarget(h, 'sci-1').acquisitionSuccessItems.length, 1)
  await h.engine.pause(t.id)
  const e = await reload(h)
  const r = await runTask(e, t.id)
  assert.equal(e.state.events.filter((x) => x.phase === 'first').length, r.done?.completion.answered)
  assert.equal(sciTarget(h, 'sci-1').stage, 'delayed_review')
})

test('F08: when the second test cannot be given, the partial success carries to a later task (one more test, no re-teaching)', async () => {
  const base = scienceRelease()
  base.items = base.items.filter((i) => i.id !== 'sci-1-acq-3') // only two acquisition contexts for sci-1
  const h = harness({ registry: registryWith(base) })
  await h.engine.setX('science', 6)
  const t = await startTask(h.engine, 'science')
  // First test correct; the child flags the second test, and no alternative test exists today.
  let step = await h.engine.next(t.id)
  if (step.kind === 'teaching') { await h.engine.completeTeaching(t.id); step = await h.engine.next(t.id) }
  if (step.kind !== 'question') throw new Error('expected question')
  await h.engine.answer(step.presentation.id, structuredClone(step.item.key))
  const second = await h.engine.next(t.id)
  if (second.kind !== 'question') throw new Error('expected question')
  assert.equal(second.item.id, 'sci-1-acq-2')
  await h.engine.flag(second.presentation.id, 'question_unclear')
  await runTask(h.engine, t.id)
  assert.equal(sciTarget(h, 'sci-1').stage, 'acquisition')
  assert.equal(sciTarget(h, 'sci-1').acquisitionSuccessItems.length, 1)
  await h.engine.decideFlag('sci-1-acq-2', 1, 'restored')
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'science')
  const sci1Slots = t2.plan.slots.filter((s) => s.target_ref === sciTarget(h, 'sci-1').target.id)
  assert.deepEqual(sci1Slots.map((s) => s.role), ['acquisition_test'], 'one remaining test and no repeated teaching')
  await runTask(h.engine, t2.id)
  assert.equal(sciTarget(h, 'sci-1').stage, 'delayed_review')
})

test('F09/F40: exhausted Science content ends at the actual count with a reason; the halfway event is not duplicated', async () => {
  const h = harness({ registry: registryWith(scienceRelease('syn-1', 0)) })
  await h.engine.setX('science', 19)
  const t = await startTask(h.engine, 'science')
  const r = await runTask(h.engine, t.id)
  assert.equal(r.done?.completion.reason, 'shortened_no_eligible_content')
  assert.equal(r.done?.completion.answered, 4)
  assert.equal(h.engine.dailyStatus().subjects[0].complete, true)
  const cps = h.engine.state.story.checkpoints.filter((c) => c.task_id === t.id).map((c) => c.kind)
  assert.deepEqual(cps, ['completion'], 'below the halfway point: one completion interaction only')
  // Next-day review targets are retained.
  assert.equal(sciTarget(h, 'sci-1').dueOn, '2027-03-02')
})

test('F40: shortened task after the halfway point gets halfway then completion once; a zero-eligible day completes with no checkpoint', async () => {
  const h = harness({ registry: registryWith(onlyKps(scienceRelease('syn-1', 0), ['sci-1', 'sci-3'])) })
  await h.engine.setX('science', 6)
  const t = await startTask(h.engine, 'science')
  await runTask(h.engine, t.id)
  assert.deepEqual(h.engine.state.story.checkpoints.filter((c) => c.task_id === t.id).map((c) => c.kind), ['halfway', 'completion'])
  h.clock.sgt('2027-03-02')
  await runTask(h.engine, (await startTask(h.engine, 'science')).id) // the two due reviews
  const before = h.engine.state.story.checkpoints.length
  h.clock.sgt('2027-03-03')
  const z = await h.engine.startOrResume('science')
  assert.equal(z.kind, 'zero_eligible')
  assert.equal(h.engine.state.completions.at(-1)?.reason, 'zero_eligible')
  assert.equal(h.engine.state.completions.at(-1)?.task_id, null)
  assert.equal(h.engine.dailyStatus().subjects[0].complete, true)
  assert.equal(h.engine.state.story.checkpoints.length, before, 'no story checkpoint for a zero-question day')
})

test('F24: filler excludes items presented in the previous seven calendar days (day 7 excluded, day 8 eligible)', async () => {
  const h = harness({ registry: registryWith(onlyKps(scienceRelease('syn-1', 1), ['sci-1', 'sci-3'])) })
  await h.engine.setX('science', 6)
  const r1 = await runTask(h.engine, (await startTask(h.engine, 'science')).id)
  const filler1 = r1.seen.filter((s) => s.presentation.role === 'general_practice').map((s) => s.item.id).sort()
  assert.deepEqual(filler1, ['sci-1-gen-1', 'sci-3-gen-1'])
  const fillerOn = async (date: string) => {
    h.clock.sgt(date)
    const s = await h.engine.startOrResume('science', { optional: true })
    if (s.kind !== 'task') return []
    const r = await runTask(h.engine, s.task.id)
    return r.seen.filter((x) => x.presentation.role === 'general_practice').map((x) => x.item.id)
  }
  assert.deepEqual(await fillerOn('2027-03-08'), [], 'presented seven calendar days ago: still excluded')
  assert.deepEqual((await fillerOn('2027-03-09')).sort(), ['sci-1-gen-1', 'sci-3-gen-1'], 'eighth day: eligible again')
})

test('F24: a due review reuses the least recently presented item even within seven days, recorded as repeated exposure', async () => {
  const r = onlyKps(scienceRelease('syn-1', 0), ['sci-1'])
  r.items = r.items.filter((i) => !(i.pools.includes('generic') && i.id !== 'sci-1-generic-h1'))
  const h = harness({ registry: registryWith(r) })
  await h.engine.setX('science', 6)
  await runTask(h.engine, (await startTask(h.engine, 'science')).id)
  h.clock.sgt('2027-03-02')
  const d2 = await runTask(h.engine, (await startTask(h.engine, 'science')).id)
  const rev2 = d2.seen.find((s) => s.presentation.role === 'delayed_review')
  assert.equal(rev2?.item.id, 'sci-1-generic-h1')
  assert.equal(rev2?.presentation.prior_exposures, 0)
  h.clock.sgt('2027-03-05') // due again (+3), only four days later
  const d5 = await runTask(h.engine, (await startTask(h.engine, 'science')).id)
  const rev5 = d5.seen.find((s) => s.presentation.role === 'delayed_review')
  assert.equal(rev5?.item.id, 'sci-1-generic-h1', 'review stays on time with the repeated item')
  assert.equal(rev5?.presentation.prior_exposures, 1)
  assert.equal(rev5?.presentation.novel_context, false, 'repeated-item success is not novel-context evidence')
  assert.equal(sciTarget(h, 'sci-1').dueOn, '2027-03-12')
})
