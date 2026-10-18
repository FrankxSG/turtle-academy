import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validatePack } from '../../src/mistakes/pack.ts'
import { syntheticPack } from './fixtures/private-pack.ts'
const fresh = () => syntheticPack({ pendingRef: 'zh.p2_higher_chinese.char.u4e11' }) as any

test('nested identity fields are rejected throughout a pack, not only in case headers', () => {
  for (const [field, locate] of [
    ['parent_name', (p: any) => p.register.cases[0].route.stages],
    ['school_id', (p: any) => p.corrective_batches[0].items[0].options[0]],
    ['deviceId', (p: any) => p.private_targets[0]],
    ['class_name', (p: any) => p.register.cases[0].production_followup.stages.exact],
    ['email', (p: any) => p.corrective_batches[0]],
  ] as const) {
    const p = fresh(); locate(p)[field] = 'synthetic'
    assert.throws(() => validatePack(p), /pack_identity_field/)
  }
})

test('unknown nested metadata and malformed content cannot ride along into stored packs', () => {
  for (const mutate of [
    (p: any) => { p.corrective_batches[0].items[0].options[0].unapproved = 'extra' },
    (p: any) => { p.register.cases[0].route.stages.exact = [{ item_id: 'x', version: '1' }] },
    (p: any) => { p.corrective_batches[0].items[0].options = null },
    (p: any) => { p.corrective_batches[0].items[0].correct_option_id = 'missing' },
    (p: any) => { p.register.review_complete = false },
    (p: any) => { p.register.cases[0].source_interpretation_uncertain = 'false' },
    (p: any) => { p.private_targets.push(p.private_targets[0]) },
    (p: any) => { p.register.policy = 'person@example.invalid' },
    (p: any) => { p.register.cases[1].production_followup.stages.exact.prompt = 'different' },
  ]) {
    const p = fresh(); mutate(p); assert.throws(() => validatePack(p))
  }
  assert.equal(validatePack(fresh()).register.cases.length, 6)
})
