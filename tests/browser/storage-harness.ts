// TEST-ONLY browser harness: bundled by tests/storage.spec.ts at test time and injected into a blank page on
// the preview origin. Never imported by the app, so nothing here reaches a release bundle.
import { CatalogueRegistry } from '../../src/catalogue/adapter.ts'
import { LearningEngine } from '../../src/engine/engine.ts'
import { inspectLegacy } from '../../src/engine/legacy.ts'
import { WriteQueue } from '../../src/engine/persistence.ts'
import { DexieRecordStore, makeLegacyGuestReader, openPilotDb, startPilotStorage } from '../../src/storage.ts'
import { mathematicsRelease } from '../engine/fixtures/catalogue.ts'

const harness = {
  CatalogueRegistry, LearningEngine, inspectLegacy, WriteQueue, DexieRecordStore, makeLegacyGuestReader, openPilotDb,
  startPilotStorage, mathematicsRelease,
}
;(globalThis as unknown as { TurtleStorageHarness: typeof harness }).TurtleStorageHarness = harness
