# Turtle Academy — Technical Handoff

Updated: 2026-10-10. Audience: Claude, ChatGPT and the project owner.
This repository is prepared for public publication. Keep account names, project identifiers and any real learner information out of this document.

This is an onboarding summary and dated implementation snapshot. Confirmed requirements live in `TECHNICAL_DESIGN_DECISIONS.md`, `FEATURE_SCOPE.md` and `PILOT_V0_1_SCOPE.md`. Current code, commits, PRs and check results establish implementation status. This document does not convert planned capabilities into delivered features or select an MVP.

## 1. Start here: source of truth

Read these repository files, using the latest `main` unless a task explicitly targets another branch:

| Source | Authority |
| --- | --- |
| `docs/AI_COLLABORATION.md` | Shared working protocol for Claude and ChatGPT |
| `docs/TECHNICAL_DESIGN_DECISIONS.md` | Confirmed technical requirements and architecture constraints |
| `docs/FEATURE_SCOPE.md` | Full long-term product and curriculum scope |
| `docs/PILOT_V0_1_SCOPE.md` | The committed first delivery slice (Pilot v0.1) |
| `docs/TECHNICAL_HANDOFF.md` | Onboarding summary and dated implementation snapshot |
| `docs/FOUNDATION_SETUP.md` | Setup evidence; check its branch and update date |
| Code, migrations, PRs and Actions runs | What exists, what is proposed, and what was tested |

GitHub is the shared record. Chats are working conversations, not a second untracked architecture register. A later explicit owner decision supersedes an older decision; record it in the relevant GitHub document before relying on it in subsequent work. If a new chat instruction is not yet recorded, identify the discrepancy rather than silently treating the older file as current. Both assistants must read the repository again at each task start.

Use the name Turtle Academy. Earlier planning chats may mention other working names, repositories or files (for example `docs/MVP_FEATURE_DECISIONS.md`); those are not part of this repository, so do not invent their contents.

## 2. Baseline on 2026-10-10

| Item | State |
| --- | --- |
| Repository | Public; default branch `main`; started from a sanitized, history-free snapshot of earlier private working files. Earlier private branches, PRs and CI runs are not published |
| `main` | Planning documents, collaboration protocol, privacy guard, automatic pull-request privacy check, manual full CI and the frontend foundation shell |
| Frontend validation | Identical code, lockfile and tests passed all checks before the move; a first public run of the manual workflow is still to be recorded |
| Supabase | Separate staging and production projects reported by the owner; no Turtle Academy schema, invitation flow, RLS, private buckets or sync implemented or verified |
| Vercel | Existing account reported by the owner; import, deployment, plan suitability and deployment controls not verified |
| GitHub settings | Owner-only security settings for a public repository still to be confirmed (see `FOUNDATION_SETUP.md`) |

Never provision, query or modify a backend project merely because a connected tool lists it; verify identity from service metadata first.

## 3. Confirmed product and architectural boundaries

- Original fantasy-adventure educational PWA, with a target 2.5D game presentation. Tablet, desktop and landscape phone are core targets. The current shell does not implement the full game renderer or world.
- Four long-term subjects: Science, Chinese, English and Mathematics. Pilot v0.1 delivers one reviewed unit in each (see `PILOT_V0_1_SCOPE.md`). Curriculum/source verification and editorial review remain necessary.
- No runtime AI: no LLM calls, AI questions, AI grading, OCR grading, AI image interpretation or AI voice processing in the learning app. Claude and ChatGPT are development assistants outside the product runtime.
- Curated, human-reviewed content and deterministic feedback. Free explanations receive curated hints and reference answers after an initial attempt; do not automatically declare them correct.
- Separate story completion, task submission, verified concept mastery and subjective assessments. Attempt counts, finished quests and parent confirmations are not interchangeable with mastery.
- Guest and Registered pathways must be designed together, preserving their distinct data and capability boundaries. The current guest-only spike is not a decision to defer Registered scope indefinitely.
- The full feature scope is not a build list. Only Pilot v0.1 is committed; do not invent phase allocations for anything else.
- Zero incremental paid infrastructure. Separate this budget requirement from any assumptions about free hosting, database, storage, email or bandwidth allowances.
- Keep this project independent from all other applications and their accounts, projects and repositories.

## 4. Target system structure

This diagram describes the intended architecture, not a deployed backend:

```mermaid
flowchart TD
  C["Curated versioned content and assets"] --> P["PWA UI and deterministic lesson engine"]
  P --> L["IndexedDB: local records and drafts"]
  P --> W["Service worker: shell and lesson packs"]
  L --> Q["Registered-only authenticated sync"]
  Q --> D["Supabase Auth and Postgres with RLS"]
  Q --> S["Private storage: selected works"]
```

Guest records stop at the local layer. Supabase sync and storage arrows are future implementation. The service-worker cache stores downloadable app/content files, not a substitute for ownership-controlled learner storage.

| Layer | Responsibility | Current implementation |
| --- | --- | --- |
| React UI and game presentation | Navigation, subject worlds, quests, accessible input, parent views | Small React shell |
| Lesson/content engine | Stable content IDs and versions; concepts, prerequisites, answers, hints and reviewed explanations | One hard-coded generic Science question; no modular engine yet |
| Progress and assessment | Distinct story/submission/mastery evidence; rule-based review scheduling | No domain progress model yet |
| Local persistence | Guest records, active drafts, registered pending work, safe schema changes | One Dexie guest checkpoint |
| Offline delivery | App shell, versioned lesson packs, readiness/download/recovery state | Workbox shell precaching only |
| Sync and server authorization | Authenticated registered event sync, ownership enforcement and deduplication | Not implemented |
| Private backend and storage | Family-owned records, selected portfolios, parent notes | Not implemented |
| Hosting and CI | Static build delivery, checks and controlled releases | GitHub: automatic privacy check on pull requests, manual full CI; proposed Vercel configuration |

Module boundaries above summarize responsibilities; they do not prescribe an unimplemented directory layout. Do not invent committed migrations, APIs, database tables or server functions.

## 5. Frontend foundation: what Claude can run

```sh
git clone <this repository's URL>
cd turtle-academy
# Use Node 22.21.1 from .nvmrc, with your existing Node manager.
npm ci
npm run dev
```

Pushing branches requires write access granted by the owner; never transfer credentials through chats, Issues or documents.

Versions below describe the current foundation, not a permanent upgrade policy. Always read `package.json`, `.nvmrc` and `package-lock.json` on the branch being worked on.

| Dependency | Pin |
| --- | --- |
| Node | 22.21.1; package engines require Node >=22.12.0 and <23 |
| React / React DOM | 19.3.0 |
| Vite | 8.3.4 |
| TypeScript | 7.0.2 |
| Dexie | 4.4.6 |
| vite-plugin-pwa | 2.0.0 |
| Playwright | 1.64.0 |

Read `src/App.tsx`, `src/storage.ts`, `vite.config.ts`, `tests/foundation.spec.ts`, `vercel.json` and `.github/workflows/foundation.yml` first.

The app has one living/non-living Science example, a Chinese placeholder and original turtle art. Dexie database `turtle-academy-guest-v1` contains a single `checkpoints` store with a `sample` record: schema version, attempt count and last selected answer. Writes use a read/write transaction. Unrecognized records are rejected rather than overwritten. This is a storage spike, not a persistent personalized guest mistake bank.

Database opening is explicit: Dexie `liveQuery` alone may wait without emitting an error when IndexedDB is missing. Preserve the tested unavailable-storage path. The app displays an error and disables answer buttons when saved progress cannot be opened.

Workbox precaches the built shell, uses a navigation fallback and waits for a deliberate update action. Answer saving/storage errors disable that update action. This does not establish safety for every multi-tab update, cache failure or production lesson-pack migration.

Production/offline verification commands:

```sh
python3 scripts/privacy_guard.py
npm audit --audit-level=high
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

Linux CI installs browser system dependencies too. The Vite development server is not the offline acceptance environment; tests use the production build and preview server.

The pre-move validation reported zero dependency vulnerabilities at that time, a 12-entry precache (~335 KiB) and six passing Chromium checks: offline reload/write/reconnection persistence, missing IndexedDB, denied database opening, and three overflow checks (1024×768, 844×390, 390×844). These are not visual acceptance, real-device, Safari or China-network tests.

## 6. Identity, privacy and imports

Registered accounts are invitation-only, with unique expiring codes; parent email/password and optional Google sign-in where reachable. Parents own multiple child profiles; no child email is necessary. A parent PIN gates adult UI, but a PIN alone is not server authorization. Backend access must enforce authenticated parent/child ownership and RLS.

Guest mode is device-only, with restricted personalization. No cloud sync, persistent personal mistake bank, parent letters or registered-only analytics. Conversion requires parent-reviewed selective import; never silently merge all guest data into an account.

Original worksheets and identifiable handwriting/photos remain outside Git, including ignored folders. A private preparation workflow may produce structured correction candidates; parent/human verification precedes secure import into the authenticated learner bank. Do not bundle private mistake entries into generic lesson JSON. No privileged backend key belongs in browser variables, public PR workflows, test logs or previews.

Raw handwriting/drawing drafts autosave locally, with retention and cleanup notice still to specify. Learning outcomes sync for registered accounts; selected finished works may be explicitly preserved in private storage. Raw strokes stay local by default. Voice practice is transient and erased on task exit; no voice archive.

Science journals must distinguish simulated values, actual observations and inferences. Corrections preserve original values, reason and time. Attention/instruction activities cannot diagnose disorders, claim measured attention or guarantee classroom transfer.

## 7. Offline and sync acceptance requirements

Core lessons must run offline after installation/download without external runtime fonts, scripts, images or mandatory APIs. Show pack readiness, sizes and incomplete-download recovery. Guest storage can be evicted; communicate that limitation.

Registered sync requires stable event IDs, transactional persistence, idempotent retries, duplicate detection and reconciliation. Do not use naive last-write-wins for mastery, progress or rewards. Reward issuance must not duplicate during retries. Detailed event schema, account-switch isolation, offline-auth recovery and conflict rules remain design/implementation work.

Test interrupted writes, repeated requests, multi-device conflicts, logout/account switching, stale packs, service-worker replacement, iOS Home Screen and storage eviction before claiming robust offline support. Do not claim indefinite offline authentication validity.

Mainland China connectivity is unverified. Google login and overseas endpoints may be unreachable. Prepare course packs before travel and test actual Chinese networks. An older chat mentioned Cloudflare; the later setup selected Vercel for evaluation. Neither history establishes a deployed China-accessible host or authorizes a second hosting stack.

## 8. CI, deployment and public repository

The `Privacy guard` workflow runs automatically on pull requests and only executes the privacy script. The `Foundation checks` workflow is manual: locked installation, privacy guard, dependency audit, build and Chromium tests, with read-only contents permissions, concurrency cancellation, a timeout and no deployment, secrets or artifacts. A documentation change does not justify rerunning the full browser suite or adding a matrix. Fork PRs must never receive secrets.

Proposed Vercel settings: Vite, repository root, `npm run build`, output `dist`, Node 22. The synthetic shell requires no environment variables. Verify plan suitability, Git auto-deploy controls, preview access, HTTPS, routes, service-worker updates and logs before release. A merge and a deployment are separate actions.

Supabase staging and production are separate projects, not renamed versions of one project. Before accessing either, verify the account, project identity, region and environment from actual service metadata, and keep those details out of this repository. Never reuse another application's resources. Quotas, email recovery, retention/deletion, RLS and cross-family isolation require verification before real users.

This repository is prepared for public publication. Every commit, Issue, PR description, comment and CI log can be published and cannot be reliably withdrawn. Keep sensitive originals outside Git, use synthetic fixtures, and review each diff as published material. If anything private is pushed, rotate affected credentials immediately and tell the owner.

## 9. Suggested first Claude task

Start with an independent technical review of the frontend foundation and this handoff against the two confirmed planning documents. Report findings tied to files/commits and distinguish bugs from unimplemented planned features. Do not rewrite the app or merge/deploy as part of onboarding.

Next, create a scoped GitHub issue for the next jointly agreed task, with acceptance criteria for both Guest and Registered paths where relevant. Establish identity/security and sync contracts alongside local engine work. This is a suggested working sequence, not an owner-approved MVP allocation.

Still open: post-Pilot phase allocation, curriculum verification, content/pack and event schemas, secure imports/invitations, RLS/storage tests, registered sync, retention, device acceptance and hosting validation. Recheck the live repository before treating this list as current.

## 10. Evidence and maintenance

This summary combines the two confirmed design documents, earlier setup work and the pre-move validation run. Infrastructure project creation is owner-reported; it is not a direct verification of service configuration. No real learner records are included.

After each merged implementation change, update the setup evidence and any affected handoff sections with the commit/PR/run. Change confirmed architecture and feature scope separately, and only when the owner explicitly changes a decision. Keep dates and branch distinctions visible so a later assistant does not inherit stale claims.
