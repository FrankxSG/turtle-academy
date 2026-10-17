// Integration of the shipped DEVELOPMENT fixtures, engine and closed snapshot contract.
// No real content, browser data, account, PIN or backend is involved.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LearningEngine } from '../../src/engine/engine.ts'
import { exportSnapshot } from '../../src/engine/snapshot.ts'
import type { Response } from '../../src/engine/types.ts'
import {
  developmentRegistry,
  exercise,
  subjects,
} from '../../src/ui/development.ts'
import { deliverStory, canPresentStory } from '../../src/ui/story.ts'

const now = () => '2027-03-01T01:00:00.000Z'
const child = '00000000-0000-4000-8000-000000000001'
async function finish(engine: LearningEngine, id: string, mistakes: boolean) {
  for (let guard = 0; guard < 100; guard++) {
    const step = await engine.next(id)
    if (step.kind === 'done') return
    if (step.kind === 'teaching') {
      await engine.completeTeaching(id)
      continue
    }
    const e = exercise(step.item.id)
    const wrong: Response =
      e.key.kind === 'matching'
        ? {
            kind: 'matching',
            option_ids: [],
            pairs: [
              { left: 'l1', right: 'r2' },
              { left: 'l2', right: 'r1' },
            ],
          }
        : e.key.kind === 'ordered'
          ? {
              kind: 'ordered',
              option_ids: [...e.key.option_ids].reverse(),
              pairs: [],
            }
          : {
              kind: e.key.kind,
              option_ids: [
                e.options.find((o) => !e.key.option_ids.includes(o.id))!.id,
              ],
              pairs: [],
            }
    if (step.awaiting === 'first')
      await engine.answer(step.presentation.id, mistakes ? wrong : e.key)
    else if (step.awaiting === 'retry')
      await engine.retry(step.presentation.id, wrong)
    else await engine.correct(step.presentation.id, e.key)
  }
  throw new Error('development task did not finish')
}

test('every supported X and development subject remains presentable and snapshot-compatible, including banked errors and assisted corrections', async () => {
  for (let x = 6; x <= 19; x++)
    for (const subject of subjects) {
      const registry = developmentRegistry()
      const engine = LearningEngine.fresh('Asia/Singapore', { registry, now })
      await engine.setX(subject, x)
      for (const item of registry.current(subject)!.items) {
        const e = exercise(item.id)
        assert.deepEqual(e.key, item.key)
        assert.ok(
          e.key.option_ids.every((id) => e.options.some((o) => o.id === id)),
        )
        assert.ok(
          e.key.pairs.every(
            (p) =>
              e.left?.some((l) => l.id === p.left) &&
              e.options.some((o) => o.id === p.right),
          ),
        )
      }
      const start = await engine.startOrResume(subject)
      assert.equal(start.kind, 'task')
      if (start.kind !== 'task') return
      await finish(engine, start.task.id, x % 2 === 0)
      for (const checkpoint of engine.pendingCheckpoints())
        await deliverStory(engine, checkpoint)
      const { check } = exportSnapshot(
        engine.state,
        engine.derived(),
        child,
        now(),
      )
      assert.equal(check.ok, true, `${subject}, X=${x}: snapshot contract`)
      assert.ok(engine.state.tasks[0].status === 'finalised')
    }
})

test('finite shared story preserves a valid world flag and is idempotent across re-delivery', async () => {
  const engine = LearningEngine.fresh('Asia/Singapore', {
    registry: developmentRegistry(),
    now,
  })
  for (const subject of subjects) {
    await engine.setX(subject, 6)
    const start = await engine.startOrResume(subject)
    if (start.kind !== 'task') throw new Error('expected task')
    await finish(engine, start.task.id, false)
    for (const c of engine.pendingCheckpoints()) {
      await deliverStory(engine, c)
      await deliverStory(engine, c)
    }
  }
  assert.equal(engine.state.story.ended, true)
  assert.deepEqual(engine.state.story.world_flags, ['lantern_lit'])
  assert.equal(engine.state.story.chapter, 4)
  assert.equal(
    exportSnapshot(engine.state, engine.derived(), child, now()).check.ok,
    true,
  )
})

test('a pending story delayed by a save failure cannot interrupt a material or its corrections', async () => {
  const engine = LearningEngine.fresh('Asia/Singapore', {
    registry: developmentRegistry(),
    now,
  })
  await engine.setX('chinese', 6)
  const start = await engine.startOrResume('chinese')
  if (start.kind !== 'task') throw new Error('expected task')
  for (let n = 0; n < 3; n++) {
    const step = await engine.next(start.task.id)
    if (step.kind !== 'question') throw new Error('expected question')
    await engine.answer(step.presentation.id, exercise(step.item.id).key)
  }
  const boundary = await engine.next(start.task.id)
  assert.equal(engine.pendingCheckpoints().length, 1)
  assert.equal(canPresentStory(engine, boundary), true)
  if (boundary.kind !== 'question') throw new Error('expected question')
  await engine.answer(boundary.presentation.id, exercise(boundary.item.id).key)
  const inside = await engine.next(start.task.id)
  assert.equal(canPresentStory(engine, inside), false)
  if (inside.kind !== 'question') throw new Error('expected question')
  await engine.answer(inside.presentation.id, {
    kind: 'single',
    option_ids: ['wrong'],
    pairs: [],
  })
  const last = await engine.next(start.task.id)
  if (last.kind !== 'question') throw new Error('expected question')
  await engine.answer(last.presentation.id, exercise(last.item.id).key)
  const retry = await engine.next(start.task.id)
  assert.equal(canPresentStory(engine, retry), false)
  if (retry.kind !== 'question') throw new Error('expected retry')
  await engine.retry(retry.presentation.id, exercise(retry.item.id).key)
  assert.equal(canPresentStory(engine, await engine.next(start.task.id)), true)
})
