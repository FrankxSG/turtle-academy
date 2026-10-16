# Foundation setup register

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

All four findings are addressed on the same branch; the tested head is recorded on the PR.
- **Snapshot contract (P1):** `pilot-snapshot/1` now represents the recoverable engine state: structured ordered, matching and word-bank responses; presentations with roles; frozen task plans with `policy_version` and finalisation time; per-target aggregates; observation history with recurrence versus duplicate; assessed skill and error type; eligibility bounds; amendment lineage; checkpoint pending/delivered state. Still closed, bounded and free-text-free. A test proves the fixture populates every declared field and array; the database test round-trips it unchanged through `upload_snapshot` and the RLS read path. 34 shared rejection cases (was 23).
- **Closed sign-up check (P1):** passes only on the documented refusal codes; invalid key, address, CAPTCHA, rate-limit, route and server errors are `INCONCLUSIVE` (exit 3). Tested by running the real script against a local mock Auth server.
- **Google link check (P2):** `--expect refused` passes only on `signup_disabled`; cancellation, token-exchange and network failures are inconclusive, with negative tests.
- **Sign-out (P2):** clears the client at once, overwrites the stored token if removal fails, and returns `storage_unavailable` when neither works, so callers cannot claim a durable sign-out; the reload boundary is tested. A throwing `localStorage` getter is tolerated.

Local evidence for this round: `test_database.py` **18 pass** (PostgreSQL 16); client and owner-check suites **30 pass** (Node 22); strict type-check of the changed modules passes (global TypeScript 6); privacy guard passes. `npm ci` crashed in the authoring environment, so `npm run build` was not rerun here. Hosted owner checks remain **pending**.

