// PR #20 re-review: exhausted material replacements (F22) and skill/pool-compatible target credit.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CatalogueRelease } from '../../src/catalogue/adapter.ts'
import { compatibleItem } from '../../src/engine/planner.ts'
import type { Target } from '../../src/engine/types.ts'
import { chineseRelease, item } from './fixtures/catalogue.ts'
import { correctResponse, harness, registryWith, reload, runTask, startTask, wrongResponse, type Harness } from './helpers.ts'

/** Material questions only: a withdrawn material question has no standalone replacement. */
function materialsOnly(): CatalogueRelease {
  const r = chineseRelease()
  r.items = r.items.filter((i) => i.material_ref !== null)
  return r
}

/** Drive a task with every first response wrong except as given, retrying wrong and selecting the correction. */
async function finish(h: Harness, taskId: string) {
  for (let i = 0; i < 200; i++) {
    const s = await h.engine.next(taskId)
    if (s.kind === 'done') return s.completion
    if (s.kind !== 'question') continue
    if (s.awaiting === 'first') await h.engine.answer(s.presentation.id, wrongResponse(s.item))
    else if (s.awaiting === 'retry') await h.engine.retry(s.presentation.id, wrongResponse(s.item))
    else await h.engine.correct(s.presentation.id, correctResponse(s.item))
  }
  throw new Error('task did not finish (stuck)')
}

test('reviewer reproduction: a flagged material question with no replacement no longer blocks help or completion', async () => {
  const h = harness({ registry: registryWith(materialsOnly()) })
  await h.engine.setX('chinese', 6)
  const t = await startTask(h.engine, 'chinese')
  const first = await h.engine.next(t.id)
  if (first.kind !== 'question') throw new Error('expected question')
  await h.engine.flag(first.presentation.id, 'answer_looks_wrong')
  // The two surviving questions in the material: both wrong.
  const answered: string[] = []
  for (let i = 0; i < 2; i++) {
    const s = await h.engine.next(t.id)
    if (s.kind !== 'question') throw new Error('expected question')
    assert.equal(s.awaiting, 'first')
    assert.equal(s.feedbackWithheld, true)
    await h.engine.answer(s.presentation.id, wrongResponse(s.item))
    answered.push(s.presentation.id)
  }
  const help = await h.engine.next(t.id)
  assert.equal(help.kind === 'question' && help.awaiting, 'retry', 'help for the surviving answers is offered')
  assert.equal(help.kind === 'question' && help.presentation.id, answered[0])
  if (help.kind === 'question') await h.engine.retry(help.presentation.id, wrongResponse(help.item)) // no 'withheld' error
  // Reload mid-way, then finish: no loop, the actual count and a parent-visible reason.
  const e = await reload(h)
  h.engine = e
  const completion = await finish(h, t.id)
  assert.equal(completion.reason, 'replacements_exhausted')
  assert.equal(completion.answered, 5)
  assert.equal(e.task(t.id).planned_total, 6)
  const cps = () => e.state.story.checkpoints.filter((c) => c.task_id === t.id).map((c) => c.kind)
  assert.deepEqual(cps(), ['completion'], 'shortened at the final boundary: one completion interaction')
  const again = await reload(h)
  assert.equal((await again.next(t.id)).kind, 'done')
  assert.deepEqual(again.state.story.checkpoints.filter((c) => c.task_id === t.id).map((c) => c.kind), ['completion'], 'idempotent after reload')
})

test('a late suspension with no replacement inside a frozen material plan also finalises safely', async () => {
  const r = materialsOnly()
  r.materials = r.materials.filter((m) => m.ref === 'zh-mat1' || m.ref === 'zh-mat2') // day 2 re-plans day 1's questions
  r.items = r.items.filter((i) => i.material_ref === 'zh-mat1' || i.material_ref === 'zh-mat2')
  const h = harness({ registry: registryWith(r) })
  await h.engine.setX('chinese', 6)
  const t1 = await startTask(h.engine, 'chinese')
  await runTask(h.engine, t1.id)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'chinese')
  const firstItem = t2.plan.slots[0].item_id
  const old = h.engine.state.presentations.find((p) => p.task_id === t1.id && p.item_id === firstItem)
  assert.ok(old)
  await h.engine.flag(old.id, 'question_unclear') // suspends the version after day 2 was planned
  const completion = await finish(h, t2.id)
  assert.equal(completion.reason, 'replacements_exhausted')
  assert.equal(completion.answered, t2.planned_total - 1)
  assert.ok(h.engine.state.presentations.every((p) => p.task_id !== t2.id || p.item_id !== firstItem), 'never served')
})

/** Two materials; standalone kp3 items assess skill-a, the material kp3 questions assess skill-b. */
function splitSkills(materialSkill: string | null, materialPools?: ('exact' | 'similar' | 'generic' | 'general')[]): CatalogueRelease {
  const r = chineseRelease()
  r.materials = r.materials.filter((m) => m.ref === 'zh-mat1' || m.ref === 'zh-mat2')
  r.items = r.items
    .filter((i) => (i.material_ref === null ? !i.pools.includes('general') || i.knowledge_point_ref === 'zh-kp3' : ['zh-mat1', 'zh-mat2'].includes(i.material_ref)))
    .map((i) => {
      if (i.knowledge_point_ref !== 'zh-kp3') return i
      if (i.material_ref === null) return { ...i, assessed_skill: 'skill-a' }
      return { ...i, assessed_skill: materialSkill, pools: materialPools ?? i.pools }
    })
  return r
}

async function bankKp3(h: Harness): Promise<Target> {
  await h.engine.setX('chinese', 7)
  const t1 = await startTask(h.engine, 'chinese')
  await runTask(h.engine, t1.id, (s) => s.presentation.material_ref !== null) // the standalone kp3 question wrong
  const target = h.engine.state.targets[0]
  assert.equal(target.knowledge_point_ref, 'zh-kp3')
  assert.equal(target.assessed_skill, 'skill-a')
  return target
}

test('reviewer reproduction: material questions on the same point but a different skill never credit the target', async () => {
  const h = harness({ registry: registryWith(splitSkills('skill-b')) })
  const target = await bankKp3(h)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'chinese')
  assert.ok(t2.plan.slots.filter((s) => s.kind === 'material_question').every((s) => s.target_ref !== target.id), 'no skill-b question attached')
  const repairSlots = t2.plan.slots.filter((s) => s.target_ref === target.id)
  assert.ok(repairSlots.length >= 1 && repairSlots.every((s) => s.kind === 'short'), 'valid repair planning is not suppressed')
  // Answer every material question correctly and the repair question wrong: no advance may come from skill-b.
  await runTask(h.engine, t2.id, (s) => s.presentation.target_ref !== target.id)
  assert.equal(h.engine.derived().progress.get(target.id)?.stage, 'exact')
  const credited = h.engine.state.presentations.filter((p) => p.target_ref === target.id)
  const release = h.registry.current('chinese')!
  assert.ok(credited.every((p) => release.items.find((i) => i.id === p.item_id)?.assessed_skill === 'skill-a'))
})

test('a compatible-skill material question in the wrong pool is not attached at that stage', async () => {
  const h = harness({ registry: registryWith(splitSkills('skill-a', ['general'])) })
  const target = await bankKp3(h)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'chinese')
  assert.ok(t2.plan.slots.filter((s) => s.kind === 'material_question').every((s) => s.target_ref !== target.id))
  assert.ok(t2.plan.slots.some((s) => s.target_ref === target.id && s.kind === 'short'))
})

test('a compatible material question (same point, skill and pool) is still attached and aggregated', async () => {
  const h = harness({ registry: registryWith(splitSkills('skill-a')) })
  const target = await bankKp3(h)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'chinese')
  assert.ok(t2.plan.slots.some((s) => s.kind === 'material_question' && s.target_ref === target.id))
  await runTask(h.engine, t2.id)
  assert.equal(h.engine.derived().progress.get(target.id)?.stage, 'similar')
})

test('compatibility rule: missing skill is not a wildcard; course, point and stage pool must all match', () => {
  const t: Target = {
    id: 'tg', subject: 'chinese', course: 'p2_chinese', target_kind: 'word', knowledge_point_ref: 'zh-kp1', target_value: null,
    assessed_skill: 'skill-a', error_type: 'unknown_cause', mapping_status: 'mapped', verification: 'verified', status: 'active',
    verified_at: null, replaces: null, observations: [],
  }
  const base = item('chinese', 'p2_chinese', 'zh-kp1', 'x1', { pools: ['exact', 'generic'], skill: 'skill-a' })
  assert.equal(compatibleItem(t, 'exact', base), true)
  assert.equal(compatibleItem(t, 'similar', base), false, 'wrong pool for the stage')
  assert.equal(compatibleItem(t, 'delayed_review', base), true, 'delayed checks use the generic pool')
  assert.equal(compatibleItem(t, 'exact', { ...base, assessed_skill: null }), false, 'missing item skill is not a wildcard')
  assert.equal(compatibleItem({ ...t, assessed_skill: null }, 'exact', base), false, 'missing target skill is not a wildcard')
  assert.equal(compatibleItem(t, 'exact', { ...base, assessed_skill: 'skill-b' }), false)
  assert.equal(compatibleItem(t, 'exact', { ...base, knowledge_point_ref: 'zh-kp2' }), false)
  assert.equal(compatibleItem(t, 'exact', { ...base, course: 'p3_chinese' }), false)
})
