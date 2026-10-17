// PR #20 review finding 2 (F22): frozen material plans must honour suspensions made after planning.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CatalogueRelease } from '../../src/catalogue/adapter.ts'
import { chineseRelease } from './fixtures/catalogue.ts'
import { correctResponse, harness, progressOf, registryWith, runTask, startTask, wrongResponse, type Harness } from './helpers.ts'

/** Chinese with only two materials (so day 2 re-plans the same questions) and general items on one point. */
function twoMaterials(): CatalogueRelease {
  const r = chineseRelease()
  r.materials = r.materials.filter((m) => m.ref === 'zh-mat1' || m.ref === 'zh-mat2')
  r.items = r.items.filter((i) => (i.material_ref === null ? !i.pools.includes('general') || i.knowledge_point_ref === 'zh-kp3' : ['zh-mat1', 'zh-mat2'].includes(i.material_ref)))
  return r
}

const presentationOf = (h: Harness, taskId: string, itemId: string) =>
  h.engine.state.presentations.find((p) => p.task_id === taskId && p.item_id === itemId)

test('reviewer reproduction: a planned, unshown material question suspended after planning is replaced in place', async () => {
  const h = harness({ registry: registryWith(twoMaterials()) })
  await h.engine.setX('chinese', 6)
  const t1 = await startTask(h.engine, 'chinese')
  await runTask(h.engine, t1.id)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'chinese')
  const firstSlot = t2.plan.slots[0]
  assert.equal(firstSlot.item_id, 'zh-mat1-q1')
  await h.engine.flag(presentationOf(h, t1.id, 'zh-mat1-q1')!.id, 'answer_looks_wrong') // flag yesterday's question
  const s = await h.engine.next(t2.id)
  if (s.kind !== 'question') throw new Error('expected question')
  assert.notEqual(s.item.id, 'zh-mat1-q1', 'the suspended version is not served')
  assert.equal(s.presentation.position, firstSlot.position)
  assert.equal(s.presentation.role, 'replacement')
  assert.equal(s.presentation.material_ref, 'zh-mat1', 'the replacement stays inside the material')
  assert.equal(s.feedbackWithheld, true)
  const res = await h.engine.answer(s.presentation.id, wrongResponse(s.item))
  assert.equal(res.correct, null, 'material feedback is still withheld for the replacement')
  const r = await runTask(h.engine, t2.id)
  assert.equal(r.done?.completion.reason, 'full')
  assert.equal(r.done?.completion.answered, t2.planned_total, 'actual count preserved')
})

test('an already-shown, unanswered presentation is withdrawn and replaced when its version is suspended', async () => {
  const h = harness({ registry: registryWith(twoMaterials()) })
  await h.engine.setX('chinese', 6)
  const t1 = await startTask(h.engine, 'chinese')
  await runTask(h.engine, t1.id)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'chinese')
  const shown = await h.engine.next(t2.id)
  if (shown.kind !== 'question') throw new Error('expected question')
  assert.equal(shown.item.id, 'zh-mat1-q1')
  await h.engine.pause(t2.id)
  await h.engine.flag(presentationOf(h, t1.id, 'zh-mat1-q1')!.id, 'question_unclear')
  await h.engine.resume(t2.id)
  const again = await h.engine.next(t2.id)
  if (again.kind !== 'question') throw new Error('expected question')
  assert.notEqual(again.presentation.id, shown.presentation.id)
  assert.notEqual(again.item.id, 'zh-mat1-q1')
  assert.equal(h.engine.state.presentations.find((p) => p.id === shown.presentation.id)?.status, 'invalidated')
  await assert.rejects(h.engine.answer(shown.presentation.id, correctResponse(shown.item)), /replaced/)
  const r = await runTask(h.engine, t2.id)
  assert.equal(r.done?.completion.reason, 'full')
  assert.equal(r.done?.completion.answered, t2.planned_total)
})

test('a replacement for a target-assessed material question keeps whole-task aggregation', async () => {
  const h = harness({ registry: registryWith(twoMaterials()) })
  await h.engine.setX('chinese', 7)
  const t1 = await startTask(h.engine, 'chinese')
  await runTask(h.engine, t1.id, (s) => s.presentation.material_ref !== null) // the one short (kp3) question wrong
  const target = h.engine.state.targets[0]
  assert.equal(target.knowledge_point_ref, 'zh-kp3')
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'chinese')
  const attached = t2.plan.slots.filter((x) => x.target_ref === target.id)
  assert.ok(attached.length >= 2 && attached.every((x) => x.kind === 'material_question'))
  const victim = attached[0]
  await h.engine.flag(presentationOf(h, t1.id, victim.item_id!)!.id, 'answer_looks_wrong')
  const r = await runTask(h.engine, t2.id)
  const rep = r.seen.find((x) => x.presentation.position === victim.position)
  assert.equal(rep?.presentation.role, 'replacement')
  assert.equal(rep?.presentation.target_ref, target.id)
  assert.equal(rep?.presentation.material_ref, victim.material_ref)
  const agg = h.engine.derived().aggregates.get(t2.id)?.find((a) => a.target_ref === target.id)
  assert.equal(agg?.route, 'whole_task')
  assert.ok(agg?.related_presentation_ids.includes(rep!.presentation.id))
  assert.equal(progressOf(h.engine, target.id).stage, 'similar', 'advanced once at finalisation')
})

test('an answered presentation whose version is suspended later still counts as done work, without evidence', async () => {
  const h = harness({ registry: registryWith(twoMaterials()) })
  await h.engine.setX('chinese', 6)
  const t1 = await startTask(h.engine, 'chinese')
  await runTask(h.engine, t1.id)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'chinese')
  const s = await h.engine.next(t2.id)
  if (s.kind !== 'question') throw new Error('expected question')
  await h.engine.answer(s.presentation.id, correctResponse(s.item))
  await h.engine.flag(presentationOf(h, t1.id, s.item.id)!.id, 'other')
  const r = await runTask(h.engine, t2.id)
  assert.equal(h.engine.state.presentations.find((p) => p.id === s.presentation.id)?.status, 'answered')
  assert.equal(r.done?.completion.answered, t2.planned_total)
})
