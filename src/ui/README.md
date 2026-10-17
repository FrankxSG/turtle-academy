# Synthetic Pilot UI (#18)

`App` is the entry and navigation coordinator. `runtime.ts` owns an identity-partitioned engine/store/queue and a single-writer Web Lock. `development.ts` contains original fixed presentation fixtures and development-only releases. `Answer` renders click/tap/keyboard selection, word bank, ordering and matching controls. `Practice` displays complete materials and withholds correctness until all their first responses are recorded. Engine calls remain the authority for counts, correction, safe checkpoint boundaries and learning dates.

Parent protection is separate from engine records in `parent/device.ts`. See the Foundation register for PIN parameters and limits. The UI never treats a PIN as server authorization. Password reset reauthentication is ephemeral and restricted to the initialized identity. No backup or restore is implemented.

Checkpoints are marked delivered and locally saved before presentation (at-most-once across reload); a crash between the durable marker and painting can skip that interaction rather than replay it. Four original story scenes share one global sequence across subjects; later checkpoints give short companion interactions. World state persists when the story ends. Rest-day UI opens exploration while preserving unfinished tasks and disables practice for that day, so no learning/story credit is fabricated.

UI/story language is independent from the fixed academic presentation language. All assets/fonts are local/system resources. Normal zoom remains enabled; no trial touch restrictions are inherited. This does not establish real-device accessibility acceptance.

## Local checks

Use Node 22.21.1 and the locked dependencies. For the mocked browser suite, build with public **synthetic** configuration only:

```sh
VITE_SUPABASE_URL=http://127.0.0.1:4173 VITE_SUPABASE_ANON_KEY=synthetic-test-only npm run build
npm run test:e2e
npm run test:engine
python3 scripts/privacy_guard.py
```

Playwright intercepts every Auth call in signed-in tests. No service or real account is used. A plain build with no Auth configuration shows the parent setup instructions and disables sign-in. It has no fake-login path. Tests and their browser harnesses are not app entry points and are never imported by the app.

The PR must pass the new browser acceptance cases, existing storage/trial regressions, build and privacy checks, and receive independent review. No subject release, real-record readiness or deployment follows from a passing synthetic suite.
