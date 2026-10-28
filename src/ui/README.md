# Synthetic Pilot UI (#18)

`App` is the entry and navigation coordinator. `runtime.ts` owns an identity-partitioned engine/store/queue and a single-writer Web Lock. `development.ts` contains original fixed presentation fixtures and development-only releases. `Answer` renders click/tap/keyboard selection, word bank, ordering and matching controls. `Practice` displays complete materials and withholds correctness until all their first responses are recorded. Engine calls remain the authority for counts, correction, safe checkpoint boundaries and learning dates.

**Enabled practice subjects.** `src/practice-subjects.ts` is the one release setting for which subjects can be started or resumed, count toward the day's requirement and unlock exploration, and appear in the parent's X settings. Set it at build time with `VITE_PRACTICE_SUBJECTS`: unset or empty is the current release (Chinese only), `all` enables every subject (development; the synthetic browser build), `none` enables nothing, and a comma list such as `chinese,mathematics` enables those; an unknown name fails the build. Installed catalogues alone never make a subject required. A disabled subject's records stay as they are (history in the parent area, X, targets, unfinished tasks and story checkpoints) and its unfinished task resumes when it is enabled again. With nothing enabled, practice and exploration stay closed; a rest day still opens exploration without credit.

**Content labels.** Each subject card and question is labelled by the content actually shown: *synthetic development content* for development fixtures (including a task still pinned to them), *reviewed* only for questions whose batch is `approved`, otherwise *not yet reviewed* (for example a private corrective batch pending review, or a build cached before review state was recorded).

Parent protection is separate from engine records in `parent/device.ts`. The PIN uses WebCrypto PBKDF2-HMAC-SHA-256 (600,000 iterations, random 16-byte salt, 256-bit output), with versioned salt/hash and persistent failure state in a separate IndexedDB database. A Web Lock serializes verification across tabs. Back-off doubles from 1 second to a 3,600-second cap; blocked attempts do not hash or reset it. Storage failures fail closed; exit, reload and backgrounding lock parent mode. Copied storage permits offline guessing. PIN/hash never enter engine records, snapshots, logs or telemetry. The UI never treats a PIN as server authorization. Password reset reauthentication is ephemeral and restricted to the initialized identity. No backup or restore is implemented.

Checkpoints are marked delivered and locally saved before presentation (at-most-once across reload); a crash between the durable marker and painting can skip that interaction rather than replay it. Four original story scenes share one global sequence across subjects; later checkpoints give short companion interactions. World state persists when the story ends. Rest-day UI opens exploration while preserving unfinished tasks and disables practice for that day, so no learning/story credit is fabricated.

UI/story language is independent from the fixed academic presentation language. All assets/fonts are local/system resources. Normal zoom remains enabled; no trial touch restrictions are inherited. This does not establish real-device accessibility acceptance.

## Local checks

Use Node 22.21.1 and the locked dependencies. For the mocked browser suite, build with public **synthetic** configuration only:

```sh
VITE_SUPABASE_URL=http://127.0.0.1:4173 VITE_SUPABASE_ANON_KEY=synthetic-test-only npm run build
npm run test:e2e
npm run test:engine
npm run test:ui
python3 scripts/privacy_guard.py
```

Playwright intercepts every Auth call in signed-in tests. No service or real account is used. A plain build with no Auth configuration shows the parent setup instructions and disables sign-in. It has no fake-login path. Tests and their browser harnesses are not app entry points and are never imported by the app.

The PR must pass the new browser acceptance cases, existing storage/trial regressions, build and privacy checks, and receive independent review. No subject release, real-record readiness or deployment follows from a passing synthetic suite.

**Private pack intake.** Selecting a pack validates and previews every case without saving it. Cancel or leaving parent mode discards the preview. One confirmation imports the pack through the existing idempotent save/recovery path; confirmation revalidates against current records. Invalid packs are rejected as a whole.
