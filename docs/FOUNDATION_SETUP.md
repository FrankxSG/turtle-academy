# Foundation setup register

> Dated setup and validation evidence. Earlier prototype descriptions are historical, not a current capability inventory. Consult the current [README](../README.md), code and relevant PR/CI evidence; use this register for its specific setup history.

Updated: 2026-10-16. Implementation evidence only; architecture and feature decisions remain in their authoritative documents.

This repository is public (since 2026-10-10). Record evidence here without account names, project identifiers, regions, dashboard URLs, environment variable values or anything about real learners.

## Baseline

This repository starts from a sanitized, history-free snapshot of earlier private working files. The snapshot contains the planning documents, collaboration protocol, privacy guard, automatic pull-request privacy check, manual full CI workflow and the frontend foundation shell described below. Earlier private branches, PRs and CI runs are not published and are not linked from here.

## Accounts and infrastructure

| Item | Current evidence | Remaining verification |
| --- | --- | --- |
| GitHub | Public since 2026-10-10; squash-only merging and automatic head branch deletion. protect-main ruleset: PR required, zero required approvals, privacy-guard required, force-push/deletion blocked, code-owner review off. Actions permissions read-only; external fork PR workflows require approval (owner-confirmed); Secret Protection and push protection enabled (owner-confirmed) | Settings recorded as verified by Claude API on 2026-10-10 unless owner-confirmed above; recheck before relying on enforcement |
| Supabase | Separate staging and production projects reported by the owner; not verified through a connector | Verify the correct account and project identities from service metadata before any use; no schema, auth policy or storage configured |
| Vercel | Existing account reported by the owner; not imported or deployed | Plan suitability, deployment approval, Git auto-deploy controls, preview access |

Never reuse another application's backend projects or hosting resources, even if a connected tool lists them.

## Frontend foundation

React/Vite/TypeScript shell with exact dependency versions and a committed npm lockfile, Workbox-generated precaching and a Dexie guest checkpoint.

The Science sample has one generic question. Its attempt count and last answer demonstrate persistence, not mastery, lesson coverage, rewards, submitted work or MVP scope. Chinese is a placeholder. No backend, runtime AI, analytics, external font or production credentials are used.

Checks exercise the built application in Chromium: reload persistence, an offline reload followed by an offline write and an online reload, unavailable IndexedDB, denied database opening, and horizontal overflow at tablet, phone portrait and phone landscape sizes. These checks do not establish iOS/Safari compatibility, full visual quality, safe recovery from all service-worker update failures, or mainland China connectivity.

Validation history: the identical application, dependencies and tests passed locked installation, the tracked-file privacy guard, dependency audit, TypeScript/production build and all Chromium checks on 2026-10-10 before the move to this repository (offline precache: 12 entries, approximately 335 KiB). Public baseline: `Foundation checks` run #1 on `main` at `30eef37` reported successful by Claude's 2026-10-10 review.

The service worker precaches only application files. New worker activation waits for an explicit update action, disabled while an answer is saving or a storage error is present. Guest data stays on the device and can be evicted or cleared. Malformed existing checkpoints are rejected without silently overwriting them.

## GitHub checks and privacy

The `Privacy guard` workflow runs automatically on every pull request (read-only permissions, no secrets, a few seconds). It only runs `scripts/privacy_guard.py`, and a pull request can change that script, so changes under `scripts/` and `.github/` always need careful human review. The heavier `Foundation checks` workflow is manual (`workflow_dispatch`), uses read-only contents permissions, pinned actions, no deployment, no repository secrets and no artifacts. It installs from the lockfile and runs the privacy guard, dependency audit, production build and Chromium checks without a matrix.

`scripts/privacy_guard.py` checks tracked working-tree paths, raw document formats and selected credential patterns. It prints rule names and paths, never matched values. It does not scan history, artifacts, all personal details or all secrets, so human review of every diff and native GitHub secret scanning remain necessary.

## Next setup steps

1. Recheck current repository protections and confirm Actions secrets and hosting link state before any implementation/deployment; the `privacy-guard` required check and successful foundation baseline are already recorded above.
2. Confirm Vercel plan and manual deployment controls before importing. Use the repository root, Vite preset, `npm run build`, output `dist`, Node 22 and the committed lockfile. This shell requires no environment variables.
3. Deploy a synthetic preview only after approval. Verify HTTPS, assets, SPA routing, offline use, update behavior, preview access and logs.
4. Verify the correct dedicated Supabase projects independently before writes. For Pilot implement provisioned parent authentication (Google linking subject to staging test; email/password fallback), family/child ownership, RLS and authenticated versioned snapshot backup, using synthetic cross-family tests before real data. Invitation redemption and private original worksheet storage remain later full-scope features.
5. Verify free quotas, email delivery/recovery, retention/deletion and production/staging separation before real learner use.

Do not link production credentials to PR workflows or previews; in a public repository, fork PRs must never receive secrets. Do not merge or deploy merely because checks pass.

## Open product and recovery work

- Pilot Scope + Functional Design + Learning Engine together define the delivery slice; later phases are provisional. The design is not evidence of implementation.
- Pilot Auth/RLS, snapshot recovery and real-device acceptance remain unimplemented/unverified. The [Pilot decision register](PILOT_V0_1_SCOPE.md#3-identity-and-protected-backup-policy) owns the Google fallback and snapshot conflict/retention/deletion policy; [Pilot §5](PILOT_V0_1_SCOPE.md#5-testing-and-release-gates) lists acceptance tests. Private catalogue coverage and [data protection](TECHNICAL_DESIGN_DECISIONS.md#9-validation-status-and-open-questions) remain pre-implementation gates. Guest import, complete multi-device sync and full service-worker recovery remain longer-term work.

## 2026-10-11 conditional Pilot ratification

Owner approved documentation-only changes in Issue #3, not backend, code or deployment. Pilot calls for Registered-only one parent/child, Auth/RLS, IndexedDB plus Supabase snapshots, private reviewed mistake intake, Chinese-first four-subject sequence and explorable hub. The 2026-10-14 functional-design package supersedes tracing and earlier narrow-unit assumptions; see PILOT_FUNCTIONAL_DESIGN.md. The current foundation remains an earlier local-only prototype, not evidence these functions work. The owner reports personally verifying dedicated staging and production environments; this integration has **not independently verified them**, and no new service change was made. Refer to PILOT_V0_1_SCOPE.md and CONTENT_QA.md. No actual learner data or credentials are committed.

## 2026-10-15 documentation alignment

The consolidated decision revision changes scope, per-subject X, evidence rules, PIN and snapshot allowlist requirements only. No application, service configuration or infrastructure verification is delivered. Private wrong forms and PIN/hash are excluded from snapshots; security/data-protection/safety-copy gates remain open. Preserve the dated foundation test evidence above.

## 2026-10-16 Pilot identity and snapshot contract (Issue #16, synthetic only)

Branch `claude/pilot-identity-foundation`, based on `main` at `dc3ed51`. This adds the first Supabase migration (family/parent/child ownership, read-only RLS for clients, the guarded `upload_snapshot` function, a server-side closed snapshot allow-list and owner-only provisioning). It also adds the client snapshot validator and the email/password-only sign-in module. See `supabase/README.md`.

Local evidence (no services touched):
- `python3 supabase/tests/test_database.py`: **17 tests pass** on a throwaway PostgreSQL 16 cluster running the Supabase role/auth stub. The tests run as `anon`/`authenticated`/`service_role`, never as the owner. They cover read isolation, denied direct writes and ownership bypasses, spoofed children, the linear head, retry identity, minimisation (23 shared rejection cases), size limits, and two genuinely concurrent races on separate connections.
- Mutation check: seven deliberate weakenings of the migration (no row lock, service-role upload, open membership reads, no child binding, open objects, leftover insert grant, no stale-base check) were each caught.
- `node --experimental-strip-types --test supabase/tests/client/client.test.mjs`: **12 tests pass**. The client validator agrees with the server on every shared fixture. The auth module has no sign-up or anonymous path, and its Google sign-in (PKCE) is off by default and refuses to start or complete until switched on after the owner's staging link test (`scripts/check-google-link.mjs`).
- The new client modules type-check under strict settings. The repository's own `npm run build` is not rerun here because package installation was unavailable in the authoring environment. The new PR workflow `Database contract` runs both suites in CI.

**Pending owner steps:** closed sign-up and anonymous sign-in in the hosted Auth settings, applying the migration to the test project, `scripts/check-hosted-auth.mjs` results, and synthetic provisioning. Until the owner records these here (pass/fail only, no identifiers), nothing about the hosted project is verified. No real learner record may be stored until the data-protection gate (Technical Decisions §9) is resolved.

### 2026-10-16 review corrections (PR #19, ChatGPT review at `a352900`)

All four findings are addressed on the same branch. Tested code head: `c91be06`.
- **Snapshot contract (P1):** `pilot-snapshot/1` now represents the recoverable engine state: structured ordered, matching and word-bank responses; presentations with roles; frozen task plans with `policy_version` and finalisation time; per-target aggregates; observation history with recurrence versus duplicate; assessed skill and error type; eligibility bounds; amendment lineage; checkpoint pending/delivered state. Still closed, bounded and free-text-free. A test proves the fixture populates every declared field and array; the database test round-trips it unchanged through `upload_snapshot` and the RLS read path. 34 shared rejection cases (was 23).
- **Closed sign-up check (P1):** passes only on the documented refusal codes; invalid key, address, CAPTCHA, rate-limit, route and server errors are `INCONCLUSIVE` (exit 3). Tested by running the real script against a local mock Auth server.
- **Google link check (P2):** `--expect refused` passes only on `signup_disabled`; cancellation, token-exchange and network failures are inconclusive, with negative tests.
- **Sign-out (P2):** clears the client at once, overwrites the stored token if removal fails, and returns `storage_unavailable` when neither works, so callers cannot claim a durable sign-out; the reload boundary is tested. A throwing `localStorage` getter is tolerated.

Local evidence for this round: `test_database.py` **18 pass** (PostgreSQL 16); client and owner-check suites **30 pass** (Node 22); strict type-check of the changed modules passes (global TypeScript 6); privacy guard passes. `npm ci` crashed in the authoring environment, so `npm run build` was not run locally; GitHub CI at `c91be06` passed `foundation` (`npm ci`, `npm audit`, `npm run build`, end-to-end tests), `db-contract` and `privacy-guard`. Hosted owner checks remain **pending**.

### 2026-10-17 owner decision: first backup needs a recent sign-in

Owner decision (2026-10-17): the database enforces the Pilot Scope §3 reauthentication rule for the no-cloud-head exception, not only the later backup screens. `upload_snapshot` accepts a base-less first snapshot only if the token's `amr` records a password or Google (`oauth`) sign-in within the last 5 minutes; otherwise `PT403 reauthentication_required`, with nothing written. Refreshing a token keeps the original sign-in time, so an old session does not qualify. Later uploads on the head and identical retries of the first are unaffected. Local evidence: `test_database.py` **19 pass**; removing the check makes the new test fail.

### 2026-10-17 re-review correction (PR #19, ChatGPT re-review at `ef5f129`)

- **Sign-in/refresh race after sign-out (P2):** the auth client keeps an identity generation. Sign-out and every sign-in start advance it, and a successful sign-in advances it again. A sign-in, Google completion or refresh that answers late is `superseded`: its tokens are neither stored nor returned, and its session is revoked on the server best effort (`scope=local`, so other sessions are untouched). Deterministic deferred-response tests cover refresh → sign-out → late success (memory, storage and a reloaded client stay signed out; a later sign-in still works), late password and PKCE completions, and an old refresh against a newer sign-in in both completion orders. Each of four deliberate weakenings of the guard was caught by these tests.

Local evidence for this round (on top of the recent-sign-in change): `test_database.py` **19 pass** (PostgreSQL 16); client and owner-check suites **36 pass** (Node 22); strict type-check of the changed modules passes (TypeScript 6); privacy guard and `git diff --check` pass. The build is evidenced by GitHub CI on the pushed head. Hosted owner checks remain **pending**.

### 2026-10-17 ChatGPT review and pending-Google cancellation fix

Reviewed `d75d89d`, including the recent-authentication requirement for a first snapshot and the identity-generation race fix. The prior late-refresh finding is resolved. Independently checked successful Database contract CI run `38986828246` and Foundation run `38986879839` (including build and e2e) at that head. The new first-snapshot SQL and its tests are unchanged by this correction; local PostgreSQL is unavailable in the review environment, so database evidence is CI-only.

An additional synthetic reproduction found that start-Google → sign-out → delayed OAuth callback could still sign in, because the PKCE verifier remained stored. The review correction clears that verifier on sign-out (with overwrite fallback and an explicit storage failure result) and guards asynchronous PKCE generation with the identity generation. Three regression tests cover a callback after logout/reload, logout during verifier generation, and failed verifier removal/overwrite. A deliberate new Google flow remains available.

Validation of the correction: 39 client/owner-check tests, repository TypeScript check, tracked-file privacy guard and whitespace checks pass locally (Node 24.19; CI supplies Node 22 validation). No dependency, workflow, schema or backend changes. Hosted Auth/Google checks remain pending owner. No merge or deployment authorization is inferred.

### 2026-10-17 review of the pending-Google correction (`d75d89d..e3d2dd8`)

No blocking findings. The verifier is cleared on sign-out (empty-value overwrite when removal fails; an empty verifier can never be exchanged), and the identity generation now also covers PKCE generation. Each of four deliberate weakenings (skipping the verifier cleanup, the PKCE generation check, the overwrite fallback, or reporting a stuck verifier) fails at least one regression test, and a reload after the overwrite fallback was confirmed not to complete a stale callback. Local evidence: `test_database.py` **19 pass** (PostgreSQL 16); client and owner-check suites **39 pass** (Node 22); strict type-check of the changed modules, privacy guard and `git diff --check` pass. The build is evidenced by GitHub CI on the pushed head.

## 2026-10-17 Pilot learning engine (Issue #17, synthetic only)

Branch `claude/pilot-learning-engine`, based on `main` at `266a2ba`, PR #20. Adds the on-device engine (`src/engine/`), the catalogue adapter (`src/catalogue/`) and a separate Dexie learner store (`turtle-academy-pilot-v1`; the guest database is never changed). Synthetic fixtures only, under `tests/engine/`. No backend calls, uploads or real data. Design and engineering proposals: `src/engine/README.md`.

Evidence at tested code head `70c1eaf`:
- `npm run test:engine` (`node --test tests/engine/*.test.ts`): **51 pass** locally (Node 22). It covers the #17 acceptance cases: F01–F19, F21, F22, F24, F25, F27, F29, F32, F36–F40, legacy guest isolation, and a populated snapshot that passes the #16 validator pinned to `pilot-snapshot/1`.
- Strict type check of the engine, catalogue, snapshot and test modules passes locally (TypeScript 6). Twenty of 22 deliberate rule weakenings fail at least one test; the two others are redundant second guards (see PR #20).
- GitHub CI at `70c1eaf`: `foundation` passed (`npm ci`, `npm audit`, `npm run build` including the TypeScript 7 type check of the Dexie store, and the end-to-end tests); `engine` and `privacy-guard` passed.
- Not yet executed: the Dexie store against IndexedDB (needs a pinned `fake-indexeddb` lockfile change or a browser test), and browser or service-worker update acceptance.

### 2026-10-17 ChatGPT independent review of PR #20 (`3ca9a0e`)

Reviewed against `main` at `266a2ba`. Fixed F29 catalogue version pinning: conflicting installs under an existing subject/version are rejected, identical retries remain idempotent, and loader/reader references cannot mutate installed content. Two synthetic regression tests cover a paused task across reload and reference mutation. This correction needs independent re-review.

Remaining blockers recorded on PR #20: general-practice mistake observations survive flagging of their source question; frozen material plans can serve an item version suspended after planning; and Issue #17 AC1 still lacks executable IndexedDB transaction/restart tests. These are not accepted limitations or merge approval.

Review environment: Node 24.21.0; dependency installation and local app build unavailable. Focused catalogue/story suite: 14 pass. Broader engine results and CI for the resulting head are recorded on the PR. Local source materialization omits the release content directory, so its release-path isolation test requires CI's complete checkout. Existing head `3ca9a0e` has successful Learning engine and Privacy guard CI. No backend, deployment, real content release or real learner data action.

### 2026-10-17 response to the PR #20 review (`9d59192` → `3377d73`)

- **Catalogue correction (`9d59192`) re-reviewed:** correct. Installed releases are now deep-frozen copies returned without per-read cloning (the engine reads the release several times per question); a mutation attempt throws. Its two regression tests pass, one updated to expect the read-only error.
- **[P1] Flagged general questions:** fixed. App-caught observations record their source presentation; the reducer counts them only while that question is valid evidence, collapses same-day repeats, and replays on parent restore or disable. Tests: the review's reproduction, same-day errors with one flagged, a later flag on the same item version with restore and disable, and reload.
- **[P2] Frozen plans and later suspensions:** fixed. Unshown and shown-but-unanswered suspended questions are replaced in place inside the material (feedback still withheld, whole-task aggregation kept); answered work keeps its count. Tests: the review's reproduction, a shown question, a target-assessed replacement, and an answered question.
- **[P2] AC1 on real IndexedDB:** six Playwright tests on Chromium exercise the actual Dexie store (reopen, idempotent and conflicting commits with full rollback, the engine restarting on Dexie) and the legacy boundary (valid, corrupt and unknown-layout guest data preserved byte-for-byte, an absent guest database not created, interrupted and repeated startup). The legacy reader now uses native IndexedDB read-only.

Evidence at tested code head `3377d73`: `npm run test:engine` **60 pass** locally (Node 22); strict type check of the engine and tests passes (TypeScript 6). Deliberate weakenings: 23 of 26 caught, including each new fix; the three not caught are redundant second guards (daily clearance cap, checkpoint de-duplication, same-day collapse). GitHub CI at `3377d73`: `foundation` passed (`npm ci`, `npm audit`, `npm run build`, Playwright **65 passed**, up from 59 with the six new storage tests); `engine` and `privacy-guard` passed.

### 2026-10-17 response to the PR #20 re-review (`2bb3f38` → `0855be5`)

- **[P1] Exhausted material replacements:** fixed. A withdrawn material slot with no replacement (flagged before an answer, or suspended after planning) no longer holds back help for the surviving answers. The task finalises at the actual count with `replacements_exhausted`; checkpoints stay idempotent across reload.
- **[P1] Skill and pool compatibility:** fixed. One shared rule decides whether a question can credit a target: same subject, course and knowledge point, the exact assessed skill (a missing skill on either side is not a wildcard), and a pool for the target's stage. It is used for material coverage, attachment, short repair and replacements, and re-checked when a question is shown. Incompatible questions stay general practice and the target keeps its own repair slot.

Evidence at tested code head `0855be5`: `npm run test:engine` **66 pass** locally (Node 22), including both reproductions from the re-review; strict type check passes (TypeScript 6). Deliberate weakenings: 29 of 33 caught, including each new fix; the four not caught are redundant second guards (daily clearance cap, checkpoint de-duplication, same-day collapse, compatibility re-check when shown). GitHub CI at `0855be5`: `foundation` passed (`npm ci`, `npm audit`, `npm run build`, Playwright **65 passed**); `engine` and `privacy-guard` passed.

## 2026-10-17 Pilot child UI (Issue #18, synthetic only)

ChatGPT implementation, branch `chatgpt/pilot-child-ui`, base `8b932a0`.
The owner explicitly transferred implementation to this session; Claude is the pending independent reviewer.

- Replaces the old guest sample entry with pre-provisioned password sign-in, online first-device setup, a bounded movable island/companion, four clearly labelled development subject entries, objective practice, finite bilingual story and local parent controls.
- Reuses the merged auth client and learning engine. Initialized local practice never refreshes or validates token expiry before opening; initialization and each working copy are partitioned by a digest of the authenticated identity. A Web Lock prevents simultaneous working-copy writers in two tabs. Unsupported locking fails closed.
- Original, fixed shape fixtures are under `src/ui/development.ts`; these are synthetic UI exercises, not curriculum coverage or a subject release. Repeated fixtures share context identities. No release `content/` imports.
- PIN policy: WebCrypto PBKDF2-HMAC-SHA-256, 600,000 iterations, random 16-byte salt, 256-bit output. A separate IndexedDB database stores the versioned salt/hash and persistent failed-attempt state. A Web Lock serializes read/verify/write across tabs. Back-off after each failed attempt is 1, 2, 4… seconds, capped at 3,600 seconds; blocked attempts do not hash or reset the wait. Storage errors fail closed. Exit, reload and backgrounding lock parent mode. The PIN is a casual-access control, not encryption or server authorization; copied storage permits offline guessing.
- Reset uses a separate, nonpersistent instance of the existing password auth client, requires online success for the same identity, and revokes only that ephemeral session. Offline/failure/wrong-account paths preserve the existing PIN. PIN/hash never enter the engine, snapshot schema, logs or app telemetry; none is added.
- Local-save failures use the engine's ordered retry queue and an explicit possible-loss warning. No backup exists. Parent summaries distinguish first answers/retries/supported corrections and measured active time. X/timezone/rest settings sit behind the PIN.
- The existing manual Foundation workflow also runs once for UI-affecting PR paths. Its build uses a public loopback synthetic Auth configuration intercepted by Playwright; it contacts no hosted service and uses no secret. Ordinary builds require their own public test Auth configuration; no built-in fake login or Guest bypass is provided.

Local evidence so far: locked install, TypeScript/production build, all **66 engine tests** pass (Node 24.19.0). Chromium/Playwright and privacy results are recorded on the PR at the tested head. Local browser launch is blocked by the environment's socket restrictions; no local browser run is claimed; final CI images are inspected below. Hosted Auth, real devices, content sign-off, imports, cloud backup, real data, service changes and deployment remain outside this milestone. The existing data-protection, private coverage/proceed and safety-copy gates remain open.

### Final implementation evidence — code `cf3211f`

- [Foundation run 39030792875](https://github.com/FrankxSG/turtle-academy/actions/runs/39030792875) passes at code head `cf3211f5a320ade975d6733e85b5053a98e99db4`: Node **22.21.1**, locked installation, audit (**zero vulnerabilities**), TypeScript/production build, **3 UI integration tests** and **80 Chromium browser tests**, zero failures/skips. The new Node suites are excluded from Playwright collection and run through their dedicated command.
- [Privacy guard run 39030792870](https://github.com/FrankxSG/turtle-academy/actions/runs/39030792870) passes at that head. Local whitespace and tracked-file privacy checks pass. No dependency versions or lockfile were changed.
- The unchanged **66 engine tests** passed locally (Node 24.19.0). UI integration additionally covers all **56 subject/X combinations** with errors, retries, supported corrections and valid populated snapshots. Development fixture skill/world-state IDs use the closed snapshot contract's controlled tokens.
- Browser coverage includes mocked sign-in; initialized expired-session offline reload/write/local PIN controls; online-only same-account PIN reset with offline, failed-password and wrong-account rejection; salted-hash/back-off/reload/concurrency/storage-failure behavior; every answer format; first/retry/correction preservation; whole-material feedback; checkpoint idempotence and combined boundaries; both subject orders, finite story and exploration gating; rest-day preservation and next-day resume; measured background/idle time; settings freezes; single-writer tabs; local-save warning/retry; and a deferred checkpoint after save recovery waiting for the next complete material boundary. Existing storage and separate trial regressions remain green.
- Visually inspected the final run's three synthetic, post-setup/post-unlock PNGs (hub, Chinese practice and parent summary) at 1024px width: readable text, complete material layout, aligned controls and no overlap. Browser overflow checks pass at **1024×768**, **844×390** and **390×844**. Images contain no credential/PIN screen and are retained for one day only, not committed.
- A queued checkpoint is presented only at a safe boundary after durable saving recovers; it cannot interrupt a material's first answers, retries or corrections. Checkpoint markers are saved before rendering, choosing at-most-once delivery across reload; a crash between save and paint can skip that scene. The finite story and its world change persist without inventing mastery or learning credit.

[PR #21](https://github.com/FrankxSG/turtle-academy/pull/21) is implementation-complete within #18's synthetic-only boundary and **awaiting independent Claude review**. Issue #18 stays open until acceptance/merge. No real-device, hosted-Auth/Google-link, service-worker-update, curriculum-release, backup/import or real-record readiness is claimed. No service configuration, main merge or explicit deployment action was performed. Existing data-protection, private coverage/proceed and safety-copy gates remain open.
