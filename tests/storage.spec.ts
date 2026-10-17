// Issue #17 AC1 in a real browser: the Dexie learner store and the legacy guest boundary on real IndexedDB.
// Synthetic data only. Each test uses its own database names and a blank page on the preview origin.
import { expect, test, type Page } from '@playwright/test'
import { build } from 'vite'

let bundle = ''

test.beforeAll(async () => {
  const out = await build({
    configFile: false,
    logLevel: 'silent',
    build: { write: false, minify: false, emptyOutDir: false, lib: { entry: 'tests/browser/storage-harness.ts', formats: ['iife'], name: 'TurtleStorageHarnessBundle' } },
  })
  const result = Array.isArray(out) ? out[0] : out
  const chunk = 'output' in result ? result.output.find((o) => o.type === 'chunk') : undefined
  if (!chunk || chunk.type !== 'chunk') throw new Error('harness bundle missing')
  bundle = chunk.code
})

async function open(page: Page) {
  // A blank document on the app's origin, so the app itself never runs (and never opens the guest database).
  await page.route('**/storage-harness.html', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>harness</title>' }))
  await page.goto('/storage-harness.html')
  await page.addScriptTag({ content: bundle })
}

type H = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const ev = (id: string, correct = true) => ({ id, presentation_id: 'p-1', local_seq: 0, phase: 'first', assistance: 'none', response: { kind: 'single', option_ids: ['a'], pairs: [] }, correct, at: '2027-03-01T01:00:00.000Z' })

test('Dexie store: commits survive reopen, repeats apply once, a conflicting event rolls back the whole mutation', async ({ page }) => {
  await open(page)
  const r = await page.evaluate(async (e) => {
    const H = (globalThis as unknown as { TurtleStorageHarness: H }).TurtleStorageHarness
    const db = H.openPilotDb('ta-test-commit')
    const store = new H.DexieRecordStore(db)
    const m1 = { id: 'm1', order: 0, puts: [{ table: 'settings', key: 'settings', value: { v: 1 } }], events: [e.ok] }
    await store.commit(m1)
    await store.commit(m1)
    let conflict = ''
    try {
      await store.commit({ id: 'm2', order: 1, puts: [{ table: 'tasks', key: 't1', value: { v: 2 } }], events: [e.bad] })
    } catch (err) { conflict = (err as Error).message }
    db.close()
    const reopened = H.openPilotDb('ta-test-commit')
    const loaded = await new H.DexieRecordStore(reopened).load()
    const result = {
      conflict,
      records: loaded.records.map((x: { table: string; key: string }) => `${x.table}:${x.key}`),
      events: loaded.events.map((x: { id: string; correct: boolean }) => `${x.id}:${x.correct}`),
      mutations: await reopened.table('mutations').count(),
    }
    reopened.close()
    return result
  }, { ok: ev('ev-1'), bad: ev('ev-1', false) })
  expect(r.conflict).toContain('append-only')
  expect(r.records).toEqual(['settings:settings'])
  expect(r.events).toEqual(['ev-1:true'])
  expect(r.mutations).toBe(1)
})

test('engine on Dexie: answers and frozen tasks survive a restart and the task resumes without a new first attempt', async ({ page }) => {
  await open(page)
  const r = await page.evaluate(async () => {
    const H = (globalThis as unknown as { TurtleStorageHarness: H }).TurtleStorageHarness
    let t = Date.parse('2027-03-01T09:00:00+08:00')
    const now = () => new Date(t).toISOString()
    let n = 0
    const newId = () => `id-${++n}`
    const registry = new H.CatalogueRegistry()
    registry.install(H.mathematicsRelease())
    const first = await H.startPilotStorage(now(), 'ta-test-engine', 'ta-test-engine-guest')
    const engine = H.LearningEngine.fresh('Asia/Singapore', { registry, now, newId, writer: new H.WriteQueue(first.store) })
    const start = await engine.startOrResume('mathematics')
    const step1 = await engine.next(start.task.id)
    await engine.answer(step1.presentation.id, step1.item.key)
    t += 30_000
    const step2 = await engine.next(start.task.id)
    await engine.answer(step2.presentation.id, { kind: 'single', option_ids: ['b'], pairs: [] })
    first.close()
    const second = await H.startPilotStorage(now(), 'ta-test-engine', 'ta-test-engine-guest')
    const restored = await H.LearningEngine.load(second.store, 'Asia/Singapore', { registry, now, newId, writer: new H.WriteQueue(second.store) })
    const resumed = await restored.next(start.task.id)
    const out = {
      events: restored.state.events.length,
      tasks: restored.state.tasks.length,
      x: restored.state.tasks[0].x,
      resumedSame: resumed.presentation.id === step2.presentation.id,
      awaiting: resumed.awaiting,
      targets: restored.state.targets.length,
      marker: second.marker,
    }
    second.close()
    return out
  })
  expect(r).toEqual({ events: 2, tasks: 1, x: 10, resumedSame: true, awaiting: 'retry', targets: 1, marker: { status: 'absent', first_seen_at: '2027-03-01T01:00:00.000Z', migrated: false } })
})

async function seedGuest(page: Page, name: string, version: number, store: string, row: unknown) {
  await page.evaluate(({ name, version, store, row }) => new Promise<void>((resolve, reject) => {
    const req = indexedDB.open(name, version)
    req.onupgradeneeded = () => { req.result.createObjectStore(store, { keyPath: 'id' }) }
    req.onsuccess = () => {
      const tx = req.result.transaction(store, 'readwrite')
      tx.objectStore(store).put(row)
      tx.oncomplete = () => { req.result.close(); resolve() }
      tx.onerror = () => reject(tx.error)
    }
    req.onerror = () => reject(req.error)
  }), { name, version, store, row })
}

async function readGuest(page: Page, name: string, store: string) {
  return page.evaluate(({ name, store }) => new Promise<{ version: number; stores: string[]; rows: unknown[] }>((resolve, reject) => {
    const req = indexedDB.open(name)
    req.onsuccess = () => {
      const db = req.result
      const get = db.transaction(store, 'readonly').objectStore(store).getAll()
      get.onsuccess = () => { const out = { version: db.version, stores: [...db.objectStoreNames], rows: get.result }; db.close(); resolve(out) }
      get.onerror = () => reject(get.error)
    }
    req.onerror = () => reject(req.error)
  }), { name, store })
}

const startup = (page: Page, now: string, pilot: string, guest: string) => page.evaluate(async ({ now, pilot, guest }) => {
  const H = (globalThis as unknown as { TurtleStorageHarness: H }).TurtleStorageHarness
  const s = await H.startPilotStorage(now, pilot, guest)
  const loaded = await s.store.load()
  s.close()
  return { marker: s.marker, records: loaded.records.length, events: loaded.events.length }
}, { now, pilot, guest })

test('legacy guest data: a valid sample is labelled only, never altered, upgraded or migrated; repeat startup is stable', async ({ page }) => {
  await open(page)
  const sample = { id: 'sample', schemaVersion: 1, attempts: 4, lastAnswer: 'turtle' }
  await seedGuest(page, 'ta-g-valid', 10, 'checkpoints', sample)
  const a = await startup(page, '2027-03-01T00:00:00.000Z', 'ta-p-valid', 'ta-g-valid')
  const b = await startup(page, '2027-03-09T00:00:00.000Z', 'ta-p-valid', 'ta-g-valid')
  expect(a.marker).toEqual({ status: 'guest_sample', first_seen_at: '2027-03-01T00:00:00.000Z', migrated: false })
  expect(b.marker).toEqual(a.marker)
  expect(a.records + a.events + b.records + b.events).toBe(0) // nothing is copied into the learner store
  expect(await readGuest(page, 'ta-g-valid', 'checkpoints')).toEqual({ version: 10, stores: ['checkpoints'], rows: [sample] })
})

test('legacy guest data: corrupt rows and unknown layouts are preserved untouched', async ({ page }) => {
  await open(page)
  const corrupt = { id: 'sample', schemaVersion: 1, attempts: -5, lastAnswer: 'dragon', extra: 'x' }
  await seedGuest(page, 'ta-g-corrupt', 10, 'checkpoints', corrupt)
  expect((await startup(page, '2027-03-01T00:00:00.000Z', 'ta-p-corrupt', 'ta-g-corrupt')).marker.status).toBe('unrecognised')
  expect(await readGuest(page, 'ta-g-corrupt', 'checkpoints')).toEqual({ version: 10, stores: ['checkpoints'], rows: [corrupt] })
  const future = { id: 'k', anything: true }
  await seedGuest(page, 'ta-g-future', 50, 'other', future)
  expect((await startup(page, '2027-03-01T00:00:00.000Z', 'ta-p-future', 'ta-g-future')).marker.status).toBe('unrecognised')
  expect(await readGuest(page, 'ta-g-future', 'other')).toEqual({ version: 50, stores: ['other'], rows: [future] })
})

test('legacy guest data: an absent guest database is not created by the inspection', async ({ page }) => {
  await open(page)
  const r = await startup(page, '2027-03-01T00:00:00.000Z', 'ta-p-absent', 'ta-g-absent')
  expect(r.marker.status).toBe('absent')
  const names = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name))
  expect(names).toContain('ta-p-absent')
  expect(names).not.toContain('ta-g-absent')
})

test('interrupted startup: a failed marker write leaves no partial marker, and the next start completes once', async ({ page }) => {
  await open(page)
  await seedGuest(page, 'ta-g-int', 10, 'checkpoints', { id: 'sample', schemaVersion: 1, attempts: 1, lastAnswer: null })
  const r = await page.evaluate(async () => {
    const H = (globalThis as unknown as { TurtleStorageHarness: H }).TurtleStorageHarness
    const db = H.openPilotDb('ta-p-int')
    const store = new H.DexieRecordStore(db)
    const failing = { getMarker: () => store.getMarker(), putMarker: async () => { throw new Error('interrupted') } }
    let interrupted = false
    try { await H.inspectLegacy(H.makeLegacyGuestReader('ta-g-int'), failing, '2027-03-01T00:00:00.000Z') } catch { interrupted = true }
    const afterFailure = await store.getMarker()
    db.close()
    const s = await H.startPilotStorage('2027-03-02T00:00:00.000Z', 'ta-p-int', 'ta-g-int')
    const again = await H.startPilotStorage('2027-03-03T00:00:00.000Z', 'ta-p-int', 'ta-g-int')
    s.close()
    again.close()
    return { interrupted, afterFailure: afterFailure ?? null, marker: s.marker, again: again.marker }
  })
  expect(r.interrupted).toBe(true)
  expect(r.afterFailure).toBeNull()
  expect(r.marker).toEqual({ status: 'guest_sample', first_seen_at: '2027-03-02T00:00:00.000Z', migrated: false })
  expect(r.again).toEqual(r.marker)
})
