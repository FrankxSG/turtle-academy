# Foundation setup register

Updated: 2026-10-11. Implementation evidence only; architecture and feature decisions remain in their authoritative documents.

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

- Only Pilot v0.1 (`docs/PILOT_V0_1_SCOPE.md`) is committed; later phases are provisional.
- Pilot Auth/RLS, snapshot recovery and real-device acceptance remain unimplemented/unverified. The [Pilot decision register](PILOT_V0_1_SCOPE.md#conditionally-ratified-pilot-v01-decisions-2026-10-11-issue-3) owns the Google fallback and snapshot conflict/retention/deletion policy; [Pilot §7](PILOT_V0_1_SCOPE.md#7-testing-and-release-gates) lists acceptance tests. Private catalogue coverage and [data protection](TECHNICAL_DESIGN_DECISIONS.md#9-validation-status-and-open-questions) remain pre-implementation gates. Guest import, complete multi-device sync and full service-worker recovery remain longer-term work.

## 2026-10-11 conditional Pilot ratification

Owner approved documentation-only changes in Issue #3, not backend, code or deployment. Pilot calls for Registered-only one parent/child, Auth/RLS, IndexedDB plus Supabase snapshots, private reviewed mistake intake, Chinese-first four-subject sequence and explorable hub. The 2026-10-14 functional-design package supersedes tracing and earlier narrow-unit assumptions; see PILOT_FUNCTIONAL_DESIGN.md. The current foundation remains an earlier local-only prototype, not evidence these functions work. The owner reports personally verifying dedicated staging and production environments; this integration has **not independently verified them**, and no new service change was made. Refer to PILOT_V0_1_SCOPE.md and CONTENT_QA.md. No actual learner data or credentials are committed.
