// Test-only module, never imported by the application.
import * as device from '../../src/parent/device.ts'
import { createAuthClient } from '../../src/auth/client.ts'
import { LearningEngine } from '../../src/engine/engine.ts'
import { buildSnapshot } from '../../src/engine/snapshot.ts'
import { developmentRegistry } from '../../src/ui/development.ts'
Object.assign(globalThis, {
  ParentHarness: {
    ...device,
    createAuthClient,
    LearningEngine,
    buildSnapshot,
    developmentRegistry,
  },
})
