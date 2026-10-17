import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mathematicsRelease } from './fixtures/catalogue.ts'
import { correctResponse, harness, registryWith, reload, startTask } from './helpers.ts'

test('F29: conflicting content under an existing release version cannot change a paused task key', async () => {
  const original = mathematicsRelease('syn-1')
  const h = harness({ registry: registryWith(original) })
  const task = await startTask(h.engine, 'mathematics')
  const question = await h.engine.next(task.id)
  if (question.kind !== 'question') throw new Error('expected question')
  await h.engine.pause(task.id)
  const replacement = structuredClone(original)
  replacement.items.find((i) => i.id === question.item.id)!.key.option_ids = ['c']
  assert.deepEqual(h.registry.install(replacement), { ok: false, reason: 'version_conflict' })
  assert.equal(h.registry.currentVersion('mathematics'), 'syn-1')
  const engine = await reload(h)
  assert.equal((await engine.answer(question.presentation.id, correctResponse(question.item))).correct, true)
  assert.deepEqual(h.registry.install(original), { ok: true }, 'identical retry is idempotent')
})

test('F29: loader and reader references cannot mutate installed catalogue content', () => {
  const original = mathematicsRelease('syn-1')
  const registry = registryWith(original)
  original.items[0].key.option_ids = ['b']
  const read = registry.release('mathematics', 'syn-1')
  assert.deepEqual(read.items[0].key.option_ids, ['a'])
  read.items[0].key.option_ids = ['c']
  assert.deepEqual(registry.release('mathematics', 'syn-1').items[0].key.option_ids, ['a'])
})
