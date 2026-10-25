// TEST-ONLY browser harness: bundled by tests/storage.spec.ts at test time and injected into a blank page on
// the preview origin. Never imported by the app, so nothing here reaches a release bundle.
import { CatalogueRegistry } from '../../src/catalogue/adapter.ts'
import { LearningEngine } from '../../src/engine/engine.ts'
import { inspectLegacy } from '../../src/engine/legacy.ts'
import { WriteQueue } from '../../src/engine/persistence.ts'
import { DexieRecordStore, makeLegacyGuestReader, openPilotDb, startPilotStorage } from '../../src/storage.ts'
import { DexiePrivateStore } from '../../src/mistakes/storage.ts'
import { mathematicsRelease } from '../engine/fixtures/catalogue.ts'

const harness = {
  CatalogueRegistry, LearningEngine, inspectLegacy, WriteQueue, DexieRecordStore, makeLegacyGuestReader, openPilotDb,
  startPilotStorage, mathematicsRelease, checkPendingKeys,
}
;(globalThis as unknown as { TurtleStorageHarness: typeof harness }).TurtleStorageHarness = harness

// Exercise the actual Dexie stores with WebKit's empty unique-cursor failure injected at the native boundary.
// The same contract runs locally with fake-indexeddb and in browser CI with real IndexedDB.
async function checkPendingKeys(stream: 'records' | 'pack') {
  const name = `ta-test-pending-${stream}`
  const pilot = stream === 'records' ? openPilotDb(name) : null
  const pack = stream === 'pack' ? new DexiePrivateStore(name) : null
  if (pack) await pack.open()
  const store = pilot ? new DexieRecordStore(pilot) : pack!
  // Test setup accesses the store's database only to seed synthetic outbox rows, never application records.
  const db = pilot ?? (pack as unknown as { db: ReturnType<typeof openPilotDb> }).db
  await store.meta()
  const original = IDBIndex.prototype.openKeyCursor
  let uniqueCalls = 0
  IDBIndex.prototype.openKeyCursor = function (range, direction) {
    if (this.name === 'keys' && (direction === 'nextunique' || direction === 'prevunique')) {
      uniqueCalls++
      throw new DOMException('Synthetic WebKit empty unique cursor failure', 'UnknownError')
    }
    return original.call(this, range, direction)
  }
  try {
    const empty = [...await store.pendingKeys()]
    const stamp = { t: 1, c: 0, d: 'synthetic-device' }
    await db.outbox.bulkAdd([
      { seq: 1, op_id: 'synthetic-op-1', keys: ['task|one', 'presentation|one'], state: 'pending' },
      { seq: 2, op_id: 'synthetic-op-2', keys: ['task|one'], state: 'pending' },
      { seq: 3, op_id: 'synthetic-op-3', keys: ['target|held'], state: 'rejected', code: 'local:invalid_change' },
    ] as never[])
    const queued = [...await store.pendingKeys()].sort()
    await store.acknowledge([{ op_id: 'synthetic-op-1', stamp }, { op_id: 'synthetic-op-2', stamp }], '2027-03-01T01:00:00Z')
    const refused = [...await store.pendingKeys()]
    await store.acknowledge([{ op_id: 'synthetic-op-3', stamp }], '2027-03-01T01:00:00Z')
    const drained = [...await store.pendingKeys()]
    return { empty, queued, refused, drained, uniqueCalls }
  } finally {
    IDBIndex.prototype.openKeyCursor = original
    pilot?.close()
    pack?.close()
  }
}
