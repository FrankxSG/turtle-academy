# Technical Design Decisions

| Area | Decision |
| --- | --- |
| App | Installable PWA (React, Vite, TypeScript) for tablet, desktop and landscape phone |
| Offline | IndexedDB via Dexie; service worker caches the app and content; practice works offline after first sign-in |
| Backend | Supabase Auth and Postgres; every private row protected by row-level security on family and child |
| Content | Reviewed, versioned JSON with stable IDs, answer keys, hints and explanations; tasks pin the version they started with |
| Answers | Checked deterministically; open writing is never auto-graded |
| AI | No AI inside the app. AI is used only by the developers and the parent, outside the app |
| Records | Answers are append-only events; stages, due dates and unlocks are derived from them |
| Cost | No paid services without the owner's approval |

## Privacy

1. Real learner material (worksheets, answers, mistakes, name, school) stays in the private resources repo, the Claude Project or the app's database, never in this public repo.
2. No secrets in git. `scripts/privacy_guard.py` runs on every PR.
3. App data is visible only to the signed-in family.
