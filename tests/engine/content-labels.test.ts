// Child-facing content labels follow the content actually shown: synthetic fixtures, reviewed (approved batch)
// questions, or questions not known to be reviewed. Real public Chinese content; synthetic private pack.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CatalogueRegistry } from '../../src/catalogue/adapter.ts'
import { buildChineseContent, poolSizes } from '../../src/catalogue/chinese.ts'
import { installPublicBuilds, type CachedPublicBuild } from '../../src/catalogue/public-install.ts'
import { LearningEngine } from '../../src/engine/engine.ts'
import { MemoryRecordStore, WriteQueue } from '../../src/engine/persistence.ts'
import { MemoryPrivateStore, MistakeProgram } from '../../src/mistakes/program.ts'
import { contentKind } from '../../src/ui/content.ts'
import { developmentRegistry } from '../../src/ui/development.ts'
import { Clock, ids, ManualTimers, runTask } from './helpers.ts'
import { publicChinese } from './fixtures/public-chinese.ts'
import { syntheticPack } from './fixtures/private-pack.ts'

const memoryStore = () => {
  const saved = new Map<string, CachedPublicBuild>()
  return { saved, all: async () => [...saved.values()], put: async (b: CachedPublicBuild) => { saved.set(b.version, structuredClone(b)) } }
}

test('approved public Chinese is labelled reviewed; synthetic fixtures stay synthetic', async () => {
  const registry = developmentRegistry(['science'])
  await installPublicBuilds(registry, memoryStore(), new Set(), publicChinese())
  const release = registry.current('chinese')!
  assert.ok(publicChinese().batches.every((b) => b.status === 'approved'), 'fixture assumption: public batches approved')
  assert.equal(contentKind(release), 'reviewed')
  assert.equal(contentKind(release, release.items[0].id), 'reviewed')
  assert.equal(contentKind(registry.current('science')!), 'synthetic')
})

test('a pinned build cached without review state is never labelled reviewed', async () => {
  const content = publicChinese()
  const older = structuredClone(content)
  older.batches[0].version += 100 // a distinct, never-installed version
  const built = buildChineseContent({ courses: ['p2_higher_chinese', 'p3_higher_chinese'], ...older })
  const store = memoryStore()
  // Shape written by earlier app versions: no itemBatch.
  await store.put({ version: built.release.version, release: built.release, exercises: [...built.exercises], materials: [...built.materials] })
  const registry = new CatalogueRegistry()
  await installPublicBuilds(registry, store, new Set([built.release.version]), content)
  const pinned = registry.release('chinese', built.release.version)
  assert.equal(contentKind(pinned), 'unreviewed')
  assert.equal(contentKind(pinned, pinned.items[0].id), 'unreviewed')
  assert.equal(contentKind(registry.current('chinese')!), 'reviewed')
  assert.ok(store.saved.get(registry.current('chinese')!.version)?.itemBatch?.length, 'new cache entries keep review state')
})

test('private corrective questions pending review are labelled not yet reviewed', async () => {
  const clock = new Clock('2027-03-01T09:00:00+08:00')
  const registry = new CatalogueRegistry()
  const store = new MemoryRecordStore()
  const newId = ids()
  const engine = LearningEngine.fresh('Asia/Singapore', { registry, now: clock.now, newId, writer: new WriteQueue(store, new ManualTimers()), subjects: ['chinese'] })
  const publicContent = publicChinese()
  const program = await MistakeProgram.open({ engine, registry, publicContent, store: new MemoryPrivateStore(), now: clock.now, newId })
  const base = registry.current('chinese')!
  const pendingRef = publicContent.lists.characters.find((c) => c.course === 'p2_higher_chinese'
    && Object.values(poolSizes(base, c.id)).every((n) => n === 0))!.id
  const pack = syntheticPack({ pendingRef })
  assert.ok(pack.corrective_batches.every((b) => b.status !== 'approved'), 'fixture assumption: corrective batch pending')
  await program.installPack(pack)
  const release = registry.current('chinese')!
  assert.notEqual(release.version, base.version)
  const privateIds = new Set(pack.corrective_batches.flatMap((b) => b.items.map((i) => i.id)))
  const privateItem = release.items.find((i) => privateIds.has(i.id))!
  const publicItem = release.items.find((i) => !privateIds.has(i.id))!
  assert.equal(contentKind(release, privateItem.id), 'unreviewed')
  assert.equal(contentKind(release, publicItem.id), 'reviewed')
  assert.equal(contentKind(release), 'unreviewed', 'a release with pending questions is not called reviewed')
})

test('a Chinese task pinned to synthetic content keeps the synthetic label after reviewed content installs', async () => {
  const clock = new Clock('2027-03-01T09:00:00+08:00')
  const registry = developmentRegistry(['chinese'])
  const store = new MemoryRecordStore()
  const timers = new ManualTimers()
  const engine = LearningEngine.fresh('Asia/Singapore', { registry, now: clock.now, newId: ids(), writer: new WriteQueue(store, timers), subjects: ['chinese'] })
  await engine.setX('chinese', 6)
  const started = await engine.startOrResume('chinese')
  assert.equal(started.kind, 'task')
  const task = started.kind === 'task' ? started.task : null!
  await runTask(engine, task.id, () => true, { stopAfter: 1 })
  await engine.pause(task.id)
  await installPublicBuilds(registry, memoryStore(), new Set([task.content_version]), publicChinese())
  assert.equal(contentKind(registry.current('chinese')!), 'reviewed')
  assert.equal(contentKind(engine.contentRelease('chinese')!), 'synthetic', 'hub card follows the unfinished task')
  assert.equal(contentKind(engine.taskRelease(task.id)), 'synthetic')
  const resumed = await engine.startOrResume('chinese')
  assert.equal(resumed.kind === 'task' && resumed.task.id, task.id)
  assert.equal(contentKind(engine.taskRelease(task.id)), 'synthetic', 'still synthetic after resume')
  await runTask(engine, task.id)
  assert.equal(contentKind(engine.contentRelease('chinese')!), 'reviewed', 'next task uses reviewed content')
})
