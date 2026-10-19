# Learning engine

Runs on the device with no backend calls. Behaviour: [Pilot functional design](../../docs/PILOT_FUNCTIONAL_DESIGN.md).

| Module | Responsibility |
| --- | --- |
| `types.ts` | Record types mirroring the closed `pilot-snapshot/1` allow-list. Wrong forms and the PIN/hash have no field. |
| `policy.ts` | Confirmed constants: X 6–19 (default 10; Chinese up to 20 in the first pilot), review intervals 1/3/7/14/30/30, two clearances per target per day, Science 7-day filler exclusion, 2-minute idle, course locks. |
| `calendar.ts` | Learning dates in the profile timezone, with timezone-change guards. |
| `evidence.ts` | Reducer: stages, due dates, eligibility and unlocks are re-derived from the append-only events on every change. |
| `planner.ts` | Frozen task plans (X, content and policy versions, materials, formal total) and slot resolution when a question is shown. |
| `engine.ts` | Task flow, first response → hint/retry → correction, flags, story checkpoints, active time, local saving. |
| `persistence.ts` | Ordered, idempotent mutations, the save-failure queue and an in-memory store for tests. The Dexie store is in `src/storage.ts`. |
| `snapshot.ts` | Local-only export; nothing is uploaded. |
| `legacy.ts` | Inspection of the old guest checkpoint, which never becomes child evidence. The native reader in `src/storage.ts` never creates, upgrades or writes the guest database. |
| `../catalogue/adapter.ts` | The content interface, versioned releases and objective judging. |
