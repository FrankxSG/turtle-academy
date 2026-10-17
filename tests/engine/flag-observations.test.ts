// PR #20 review finding 1 (F21/F22): an invalid question must not create a mistake, recurrence or cooldown.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mathematicsRelease } from './fixtures/catalogue.ts'
import { correctResponse, harness, registryWith, reload, runTask, startTask, wrongResponse } from './helpers.ts'

test('reviewer reproduction: a flagged general question creates no mistake, cooldown or recurrence', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  const s = await h.engine.next(t.id)
  if (s.kind !== 'question') throw new Error('expected question')
  await h.engine.answer(s.presentation.id, wrongResponse(s.item))
  assert.equal(h.engine.derived().progress.size, 1, 'banked while the question was valid')
  await h.engine.flag(s.presentation.id, 'answer_looks_wrong')
  await runTask(h.engine, t.id)
  assert.equal(h.engine.derived().progress.size, 0, 'no mistake from an invalid question')
  const e = await reload(h)
  assert.equal(e.derived().progress.size, 0, 'still none after reload')
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(e, 'mathematics')
  assert.ok(t2.plan.slots.every((x) => x.role === 'general_practice'), 'nothing to repair the next day')
  // The record remains as private history: the observation keeps its provenance.
  const obs = e.state.targets[0].observations[0]
  assert.equal(obs.batch_ref, s.presentation.id)
  assert.equal(obs.instance_ref, t.id)
})

test('flagging one same-day error keeps another legitimate one from the same day', async () => {
  const r = mathematicsRelease()
  r.items = r.items.filter((i) => !i.pools.includes('general') || ['ma-kp1-gen-1', 'ma-kp1-gen-2', 'ma-kp2-gen-1', 'ma-kp2-gen-2', 'ma-kp3-gen-1', 'ma-kp3-gen-2'].includes(i.id))
  const h = harness({ registry: registryWith(r) })
  await h.engine.setX('mathematics', 6)
  const t = await startTask(h.engine, 'mathematics')
  const wrongOnKp1: string[] = []
  for (let i = 0; i < 50; i++) {
    const s = await h.engine.next(t.id)
    if (s.kind === 'done') break
    if (s.kind !== 'question') continue
    if (s.awaiting === 'first') {
      const wrong = s.item.knowledge_point_ref === 'ma-kp1'
      if (wrong) wrongOnKp1.push(s.presentation.id)
      await h.engine.answer(s.presentation.id, wrong ? wrongResponse(s.item) : correctResponse(s.item))
    } else if (s.awaiting === 'retry') await h.engine.retry(s.presentation.id, correctResponse(s.item))
    else await h.engine.correct(s.presentation.id, correctResponse(s.item))
  }
  assert.equal(wrongOnKp1.length, 2)
  const target = h.engine.state.targets[0]
  assert.deepEqual(target.observations.map((o) => o.recurrence), ['first', 'duplicate'])
  await h.engine.flag(wrongOnKp1[0], 'answer_looks_wrong')
  const pr = h.engine.derived().progress.get(target.id)
  assert.ok(pr, 'the second legitimate error still makes it a mistake')
  assert.equal(pr?.notBefore, '2027-03-02')
  assert.equal(pr?.lastIndependentObservationOn, '2027-03-01')
})

test('a later flag on the same item version suspends the earlier mistake; parent restore brings it back, disable keeps it out', async () => {
  const r = mathematicsRelease()
  r.items = r.items.filter((i) => !i.pools.includes('general') || ['ma-kp1-gen-1', 'ma-kp1-gen-2'].includes(i.id))
  r.knowledge_points = r.knowledge_points.filter((k) => k.ref === 'ma-kp1')
  r.items = r.items.filter((i) => i.knowledge_point_ref === 'ma-kp1')
  const run = async (decision: 'restored' | 'disabled') => {
    const h = harness({ registry: registryWith(structuredClone(r)) })
    await h.engine.setX('mathematics', 6)
    const t1 = await startTask(h.engine, 'mathematics')
    let first = true
    await runTask(h.engine, t1.id, () => { const ok = !first; first = false; return ok })
    const target = h.engine.state.targets[0]
    const sourceItem = h.engine.state.presentations.find((p) => p.id === target.observations[0].batch_ref)?.item_id
    assert.equal(sourceItem, 'ma-kp1-gen-1')
    // Day 2: the same item version appears again and the child flags it (a different presentation).
    h.clock.sgt('2027-03-02')
    const t2 = await startTask(h.engine, 'mathematics')
    let flagged = false
    for (let i = 0; i < 60 && !flagged; i++) {
      const s = await h.engine.next(t2.id)
      if (s.kind !== 'question') break
      if (s.item.id === 'ma-kp1-gen-1' && s.awaiting === 'first') { await h.engine.flag(s.presentation.id, 'answer_looks_wrong'); flagged = true; break }
      if (s.awaiting === 'first') await h.engine.answer(s.presentation.id, correctResponse(s.item))
      else if (s.awaiting === 'retry') await h.engine.retry(s.presentation.id, correctResponse(s.item))
      else await h.engine.correct(s.presentation.id, correctResponse(s.item))
    }
    assert.ok(flagged)
    assert.equal(h.engine.derived().progress.has(target.id), false, 'suspended while the flag is open')
    await h.engine.decideFlag('ma-kp1-gen-1', 1, decision)
    const e = await reload(h)
    return e.derived().progress.has(target.id)
  }
  assert.equal(await run('restored'), true, 'restore re-includes the earlier legitimate observation')
  assert.equal(await run('disabled'), false, 'disable keeps the invalid question out of the bank')
})
