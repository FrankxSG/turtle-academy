// The real public Chinese batches build a valid engine release for a Higher Chinese learner.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkRelease } from '../../src/catalogue/adapter.ts'
import { buildChineseContent, poolSizes } from '../../src/catalogue/chinese.ts'
import { publicChinese } from './fixtures/public-chinese.ts'

test('public batches build a valid Higher Chinese release', () => {
  const { lists, batches } = publicChinese()
  const built = buildChineseContent({ courses: ['p2_higher_chinese', 'p3_higher_chinese'], lists, batches })
  assert.equal(checkRelease(built.release), null)
  assert.ok(built.release.items.length > 400)
  assert.ok(built.release.items.every((i) => built.exercises.has(i.id)))
  for (const m of built.release.materials) assert.ok(built.materials.has(m.ref))
  // Every repair target that has a pool in the release has all three stages.
  const refs = new Set(built.release.items.filter((i) => !i.pools.includes('general')).map((i) => i.knowledge_point_ref))
  for (const ref of refs) {
    const s = poolSizes(built.release, ref)
    assert.ok(s.exact > 0 && s.similar > 0 && s.generic > 0, ref)
  }
  // No Chinese-only course item leaks into a Higher Chinese release.
  assert.ok(built.release.items.every((i) => i.course === 'p2_higher_chinese' || i.course === 'p3_higher_chinese'))
})

test('blanks and pinyin render as the child sees them', () => {
  const { lists, batches } = publicChinese()
  const built = buildChineseContent({ courses: ['p2_higher_chinese'], lists, batches })
  const q = built.exercises.get('zh-p2-confusable-u6674.q3')!
  assert.match(q.stem, /预报（yù bào）/)
  assert.match(q.stem, /（　）/)
  assert.doesNotMatch(q.stem, /\{\{/)
  for (const m of built.materials.values()) assert.doesNotMatch(m.text, /\{\{/)
})
