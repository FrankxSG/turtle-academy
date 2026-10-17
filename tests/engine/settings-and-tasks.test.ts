// F01, F02, F10, F11, F15, F25 (engine side): per-subject X, frozen task configuration, whole materials.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { minMaterials } from '../../src/engine/policy.ts'
import { correctResponse, harness, reload, runTask, startTask, wrongResponse } from './helpers.ts'

test('F01: distinct X per subject persists across days and reloads without daily setup', async () => {
  const h = harness()
  await h.engine.setX('chinese', 7)
  await h.engine.setX('mathematics', 19)
  await h.engine.setX('science', 6)
  h.clock.sgt('2027-03-05')
  const e = await reload(h)
  assert.equal(e.xFor('chinese'), 7)
  assert.equal(e.xFor('mathematics'), 19)
  assert.equal(e.xFor('science'), 6)
  assert.equal(e.xFor('english'), 10, 'untouched subject keeps the default')
})

test('F10: X outside 6–19 or non-integer is rejected; boundaries accepted', async () => {
  const h = harness()
  for (const bad of [5, 20, 10.5, Number.NaN, 0, -1]) await assert.rejects(h.engine.setX('english', bad), RangeError)
  await h.engine.setX('english', 6)
  await h.engine.setX('english', 19)
  assert.equal(h.engine.xFor('english'), 19)
})

test('F02: changing X during a paused task keeps the task frozen; next task and other subjects use their own X', async () => {
  const h = harness()
  await h.engine.setX('mathematics', 8)
  const task = await startTask(h.engine, 'mathematics')
  await runTask(h.engine, task.id, () => true, { stopAfter: 3 })
  await h.engine.pause(task.id)
  await h.engine.setX('mathematics', 12)
  const resumed = await h.engine.startOrResume('mathematics')
  assert.equal(resumed.kind, 'task')
  assert.equal(resumed.kind === 'task' && resumed.task.id, task.id)
  assert.equal(h.engine.task(task.id).x, 8)
  const r = await runTask(h.engine, task.id)
  assert.equal(r.done?.completion.answered, 8)
  assert.equal(h.engine.xFor('chinese'), 10)
  h.clock.sgt('2027-03-02')
  const next = await startTask(h.engine, 'mathematics')
  assert.equal(next.x, 12)
  assert.equal(next.planned_total, 12)
})

test('F10: language tasks use ceil(X/5) complete materials and at least X questions, per subject', async () => {
  for (const [x, materials] of [[6, 2], [10, 2], [11, 3], [15, 3], [16, 4], [19, 4]] as const) {
    const h = harness({ subjects: ['chinese', 'english'] })
    await h.engine.setX('chinese', x)
    await h.engine.setX('english', x === 6 ? 19 : 6)
    const t = await startTask(h.engine, 'chinese')
    assert.equal(minMaterials(x), materials)
    assert.ok(t.plan.materials.length >= materials, `X=${x}: ${t.plan.materials.length} materials`)
    assert.ok(t.planned_total >= x)
    // Every material is complete: all its questions are planned.
    for (const m of t.plan.materials) {
      assert.equal(t.plan.slots.filter((s) => s.material_ref === m.material_ref).length, m.question_count)
    }
    const en = await startTask(h.engine, 'english')
    assert.ok(en.plan.materials.length >= minMaterials(x === 6 ? 19 : 6), 'English uses its own X')
  }
})

test('F10/F15: material families rotate within a task and the actual total can exceed X', async () => {
  const h = harness({ subjects: ['chinese'] })
  await h.engine.setX('chinese', 16)
  const t = await startTask(h.engine, 'chinese')
  const families = t.plan.materials.map((m) => m.family)
  assert.ok(new Set(families).size >= 3, `families ${families}`)
  await h.engine.setX('chinese', 7)
  await runTask(h.engine, t.id)
  h.clock.sgt('2027-03-02')
  const t2 = await startTask(h.engine, 'chinese')
  assert.equal(t2.plan.materials.length, 2)
  assert.ok(t2.planned_total >= 7)
  // Two complete three-question materials (6) plus one short question reach X=7 without stacking a quota.
  assert.equal(t2.planned_total, 7)
})

test('F11: all first responses in a material precede any feedback or help', async () => {
  const h = harness({ subjects: ['chinese'] })
  const t = await startTask(h.engine, 'chinese')
  const firstMaterial = t.plan.slots[0].material_ref
  const order: string[] = []
  for (let i = 0; i < 3; i++) {
    const s = await h.engine.next(t.id)
    assert.equal(s.kind, 'question')
    if (s.kind !== 'question') return
    assert.equal(s.awaiting, 'first')
    assert.equal(s.feedbackWithheld, true)
    assert.equal(s.presentation.material_ref, firstMaterial)
    const res = await h.engine.answer(s.presentation.id, wrongResponse(s.item))
    assert.equal(res.correct, null, 'no correctness revealed mid-material')
    // A retry is refused while other first responses in the material are outstanding.
    if (i < 2) await assert.rejects(h.engine.retry(s.presentation.id, correctResponse(s.item)))
    order.push(s.presentation.id)
  }
  const help = await h.engine.next(t.id)
  assert.equal(help.kind === 'question' && help.awaiting, 'retry')
  assert.equal(help.kind === 'question' && help.presentation.id, order[0])
})

test('F25: all formal responses are selections, ordering or matching; judged against the reviewed key', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  const r = await runTask(h.engine, t.id)
  for (const s of r.seen) assert.ok(['single', 'ordered', 'matching', 'word_bank'].includes(s.item.response_kind))
  assert.ok(h.engine.state.events.every((e) => ['single', 'ordered', 'matching', 'word_bank'].includes(e.response.kind)))
})

test('a first response is never re-recorded after reload; the presentation resumes', async () => {
  const h = harness({ subjects: ['mathematics'] })
  const t = await startTask(h.engine, 'mathematics')
  const s = await h.engine.next(t.id)
  assert.equal(s.kind, 'question')
  if (s.kind !== 'question') return
  await h.engine.answer(s.presentation.id, wrongResponse(s.item))
  const e = await reload(h)
  await assert.rejects(e.answer(s.presentation.id, correctResponse(s.item)), /already recorded/)
  const again = await e.next(t.id)
  assert.equal(again.kind === 'question' && again.presentation.id, s.presentation.id)
  assert.equal(again.kind === 'question' && again.awaiting, 'retry')
  assert.equal(e.state.events.filter((x) => x.phase === 'first').length, 1)
})
