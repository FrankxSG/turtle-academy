import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CatalogueRegistry } from '../../src/catalogue/adapter.ts'
import { installPublicBuilds, type CachedPublicBuild } from '../../src/catalogue/public-install.ts'
import { exercise, material } from '../../src/ui/content.ts'
import { publicChinese } from './fixtures/public-chinese.ts'

test('public content update and restart retain the pinned key, wording and option labels', async () => {
  const saved = new Map<string, CachedPublicBuild>()
  const store = { all: async () => [...saved.values()], put: async (b: CachedPublicBuild) => { saved.set(b.version, structuredClone(b)) } }
  const original = publicChinese()
  const registry = new CatalogueRegistry()
  await installPublicBuilds(registry, store, new Set(), original)
  const firstVersion = registry.current('chinese')!.version
  const question = original.batches[0].items.find((i) => i.courses.includes('p2_higher_chinese'))!
  const originalText = structuredClone(exercise(question.id, firstVersion))
  const revised = structuredClone(original)
  const changed = revised.batches[0].items.find((i) => i.id === question.id)!
  revised.batches[0].version++
  changed.version++; changed.stem = 'Synthetic revised prompt'
  changed.options.reverse(); changed.options[0].text = 'Synthetic revised option'
  changed.correct_option_id = changed.options[0].id
  const body = revised.batches[0].materials[0]
  body.version++; body.body = 'Synthetic revised material'
  const oldBody = structuredClone(material(body.id, firstVersion))
  const restarted = new CatalogueRegistry()
  await installPublicBuilds(restarted, store, new Set([firstVersion]), revised)
  const nextVersion = restarted.current('chinese')!.version
  assert.notEqual(nextVersion, firstVersion)
  assert.deepEqual(exercise(question.id, firstVersion), originalText)
  assert.deepEqual(material(body.id, firstVersion), oldBody)
  assert.equal(exercise(question.id, nextVersion).stem, changed.stem)
  assert.equal(restarted.release('chinese', firstVersion)!.items.find((i) => i.id === question.id)!.key.option_ids[0], question.correct_option_id)
  assert.equal(restarted.release('chinese', nextVersion)!.items.find((i) => i.id === question.id)!.key.option_ids[0], changed.correct_option_id)
})
