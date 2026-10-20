# Technical design decisions

| Area | Decision |
| --- | --- |
| App | Installable PWA (React, Vite, TypeScript) for tablet, desktop and landscape phone |
| Offline | Dexie (IndexedDB) on the device; service worker caches app and content; practice works after sign-in expires |
| Backend | Supabase Auth and Postgres; every private row protected by row-level security on family and child |
| Content | Original, reviewed JSON with stable IDs and versions, keys, hints and explanations |
| Learning | Answers checked deterministically and stored append-only; stages, due dates and unlocks derived from them |
| AI | No AI inside the app; AI is used only by developers and the parent, outside the app |
| Sync | Live sync of records and the private pack ([Pilot §8](PILOT_FUNCTIONAL_DESIGN.md#8-offline-and-sync)); not built |
| Cost | No paid services without the owner's approval |

## Privacy

1. Real learner material (worksheets, answers, mistakes, name, school) stays in the private resources repo, the Claude Project or the app's database, never in this public repo.
2. No secrets in git. `scripts/privacy_guard.py` runs on every PR.
3. App data is visible only to the signed-in family.
