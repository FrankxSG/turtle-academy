# Turtle Academy — Technical Design Decisions

**Document type:** Long-term architecture, privacy, security and engineering decision record  
**Status:** Confirmed design requirements, not a claim that the infrastructure or features are deployed  
**Last consolidated:** 2026-10-15 (Pilot decision alignment; technical protections retained)

## 1. Decision hierarchy

- This document is the primary authority for **technical architecture, data protection, security and deployment governance**.
- [`FEATURE_SCOPE.md`](FEATURE_SCOPE.md) defines the full long-term product and educational feature scope. Features listed there are not automatically included in the next release.
- [`PILOT_V0_1_SCOPE.md`](PILOT_V0_1_SCOPE.md), [`PILOT_FUNCTIONAL_DESIGN.md`](PILOT_FUNCTIONAL_DESIGN.md) and [`PILOT_LEARNING_ENGINE_SPEC.md`](PILOT_LEARNING_ENGINE_SPEC.md) together define the committed Pilot delivery slice: a usable daily-practice tool for one family, with full scoped coverage as the goal. Subject sequencing is a delivery choice, not cancellation of long-term scope.
- Explicitly confirmed later decisions supersede earlier conflicting proposals. Implementation evidence and acceptance tests must be recorded separately; an architectural decision is not proof of implementation.
- The numbered cross-subject design sequence ended at **#202**. English E1–E12 and Mathematics M1–M12 are separate confirmed curriculum decisions recorded in the full feature scope.

## 2. Application and learning architecture

| Domain | Long-term direction | Implementation expectation |
|---|---|---|
| Product | Original, child-friendly, fantasy-adventure **progressive web app (PWA)** with a 2.5D visual direction | Responsive on tablets, desktop and landscape mobile devices; no native app-store dependency for core delivery |
| Frontend | **React + Vite + TypeScript** foundation | Modular UI and lesson engine; verify browser and deployment compatibility before release |
| Offline storage | **IndexedDB**; Dexie is a preferred implementation library | Persist drafts, local progress and offline events reliably; handle unavailable or evicted browser storage |
| Offline app assets | Versioned service worker and application/lesson caching; Workbox is an implementation option | Previously loaded required content remains usable without network; controlled updates do not discard learning records |
| Lessons | Reviewed, declarative and versioned content with stable IDs, answer keys, explanations and prerequisites | Content changes must preserve or explicitly migrate progress and mastery evidence |
| Evaluation | Deterministic checking only when answers are objectively verifiable | Never present completion, hint use or unsupervised open writing as verified mastery |
| Game | Narrative quests, companions, home, journals and progress are separate from curriculum and learner-data layers | A rich game experience is a later target; a bounded movable Pilot 2D hub is defined in the Pilot scope |
| AI | **No in-app/runtime AI** | No LLM calls, AI-generated lessons, AI grading, AI OCR, automated voice evaluation or in-app transmission of learner data to AI services; private owner-authorised external worksheet preparation is allowed subject to data handling controls |
| IP | Original characters, visual design, stories and learning assets | Do not reproduce protected franchise assets, teacher worksheets or third-party educational materials without permission |

Science and Chinese were the initial pedagogical priorities; **English and Mathematics are also confirmed long-term subjects**, not optional placeholder tabs. Their complete curriculum decisions are recorded in `FEATURE_SCOPE.md`.

## 3. Long-term identities, authentication and privacy

### Registered family accounts (Pilot subset in §8)

- Parent-controlled, invitation-only onboarding using unique expiring invitation codes; email/password login with **optional Google sign-in** where supported. Google sign-in must never be the sole way to access offline learning, especially in environments where Google services are unavailable.
- Parents can manage multiple child profiles without requiring a child email. Parent-only actions use appropriate re-authentication or a parent PIN.
- **Supabase Auth + PostgreSQL + private object storage** is the planned registered-user backend. Enforce ownership in server-side authorization and **Row Level Security (RLS)** for every private record and object. Frontend UI restrictions alone are insufficient.
- Keep staging and production isolated, with separate credentials, data and access controls. Use only synthetic or properly anonymized development fixtures. Verify available quotas and cost before creating resources.
- Migrating guest records into a registered account requires explicit review and selection. Never silently attach another person's device-local data to an account.

### Data classification and handling

- **Public/repository content:** generic application source, original approved game assets, general educational content, synthetic examples, architecture documents, and least-privilege CI workflows.
- **Private learner content:** learner identity, work samples, handwriting and drawings, authentic worksheets, error banks, answer history, progress, observations, portfolios, personal messages and parent notes. Keep these out of public Git, deployment bundles, public APIs, screenshots, CI artifacts and logs.
- Original worksheets and teacher-provided materials belong in private storage or separate private preparation workflows. Owner-initiated private external AI preparation of worksheet images is allowed, with the AI filtering identifying detail out of its outputs (owner decision 2026-10-18, replacing parent cropping), provider privacy considerations and mandatory human verification; filtering does not guarantee anonymity. No such images or records in public files. Human-reviewed structured learning records may be imported only into authorised learner storage. Copyright permission is required before republishing educational materials.
- Draft writing/drawings should autosave locally, have a clear deletion/retention policy and allow intentional preservation of selected finished work in private authenticated storage when that feature is enabled. Voice input, if added, must follow a transient/minimised retention model rather than automatic recording archives.
- An unauthenticated static deployment must contain no real learner information and no privileged backend credentials. Public access to a site URL is **not** access control.

## 4. Offline-first and regional connectivity

- The core lesson experience should work **after successful installation or precaching**, without remote fonts, images, scripts, authentication checks or network requests needed for cached lessons.
- Long-term lesson packs support explicit downloads, offline readiness indicators, reliable updates and clear recovery from incomplete caches.
- Registered-user learning uses a local-first event queue with unique/idempotent event identifiers, crash-safe persistence, retries, reconciliation of conflicting changes and deduplication of rewards and completed tasks. Naive last-write-wins is not acceptable for learning evidence.
- A session or service-worker update must not erase active lessons, drafts or pending events. Validate device storage eviction, airplane-mode reload, and offline/online recovery.
- **Mainland China accessibility cannot be guaranteed** merely by selecting an overseas provider. Test with real networks and target devices; support offline use after content download. Google OAuth reachability must not be assumed. Offline authentication recovery needs its own validation when registered accounts are implemented.
- Pilot v0.1 uses cached lessons, IndexedDB and authenticated cloud snapshots for backup/restore; it does **not** require a cloud reconciliation engine or a downloaded lesson-pack manager.

## 5. Pedagogical and assessment integrity

- Track **separate states** for adventure completion, lesson completion, submitted attempt, validated objective correctness, evidence of independent mastery and subjective self-reflection. Do not conflate them.
- Adaptation may use repeated verifiable learner performance, prerequisites and review history; it must not invent confidence scores or make diagnostic claims from isolated errors.
- Science uses **Discover → Investigate → Understand → Apply → Master**, with observation, inference, fair testing, scientific vocabulary, evidence, age-appropriate safety and explicit distinction between simulation and real observation.
- For scientific explanations, progress from keywords and sentence scaffolds to independent writing, with curated hints and references only after an initial attempt; preserve revision history. No automated grading of unstructured science explanations.
- Science Discovery Journal supports activity-specific structured templates, guided/free entry, text, drawing and simple quantitative records or charts. Any simulated measurements and child-observed results must be clearly labelled, not invented as real observations.
- Chinese support is grounded in **human-verified** knowledge errors and writing observations, with targeted and spaced practice. A possible slip or untidy form does not automatically demonstrate a knowledge misconception. No automatic handwriting grading or OCR.
- English integrates reading, reasoning, language craft, writing and model-based revision without automatic free-writing scores.
- Mathematics combines CPA models, inquiry, problem-solving strategies, conceptual reasoning, staged understanding/application/transfer and evidence-based diagnostic review; no automatic scoring of open mathematical proof or reasoning.
- Attention and multi-step-direction skills can be integrated into learning tasks (#201–202), but the product must not diagnose attention disorders or promise transfer into classroom behaviour.

## 6. Long-term child experience and parent safeguards

- The full product may include ten original animal companions, fantasy subject worlds, museum, portfolios, decorative garden, separate scientifically meaningful growing lab, rewards and side quests. Avoid punitive absence mechanics, monetised virtual rewards or manipulative engagement loops.
- Parent functions include child-profile oversight, progress and review summaries, private encouragement, learning priorities, weekly habits and controlled screen-time allowances. Parents may propose activities without fabricating verified mastery.
- Support accessible alternatives to drag, replayable audio/instructions, appropriate interaction speed and device-specific input accommodations. Learners should not need to race timers to demonstrate understanding.
- Full game, parent dashboard, multi-account and elaborate adaptive systems remain in full scope but **are not prerequisites for the initial Pilot**.

## 7. Public repository governance and minimum-cost CI

### Publication gate — required before making any repository public

1. Audit every tracked file and **all reachable Git history**, including branches, tags, pull-request refs, releases and prior commits; check for deleted-but-recoverable private materials and credentials.
2. Review PR conversations, review attachments, Actions logs/artifacts, build outputs, screenshots and previews for personal data or secrets.
3. Confirm no authentic learner worksheets, identifiable handwriting, school records, parent or child identity, private progress, source documents, production exports or unlicensed third-party assets are exposed.
4. Review secrets, tokens, workflow permissions, forked-PR execution policies, secret scanning/push protection, branch protection and repository access controls. Never run untrusted PR code with production privileges.
5. Verify hosting preview/production visibility, environment variables, APIs, storage permissions and logs. If learner cloud features exist, verify authenticated isolation including RLS and object policies using synthetic cross-family tests.
6. Prefer a **new clean public repository** if sensitive contents exist in prior Git history; deleting them from the current tip is insufficient. Do not make a repository public until the gate passes.

This repository used the sanitized, history-free clean-baseline publication route on 2026-10-10, as recorded in [FOUNDATION_SETUP.md](FOUNDATION_SETUP.md). This dated record does not certify future backend or preview safety.

### CI and cost controls

- Prefer standard GitHub-hosted runners under the current applicable public-repository terms. Avoid unnecessary matrices, duplicate push/PR builds and redundant tests; use path-aware changes, concurrency cancellation, short timeouts and targeted checks.
- Keep required PR security/privacy checks reliable. Do not configure mandatory checks that are skipped and remain indefinitely pending; use a lightweight always-reporting gate if appropriate.
- Use minimum workflow permissions (typically `contents: read`), pinned trusted Actions, no ordinary-job production secrets and approval for untrusted fork changes. Do not use production data in tests, artifacts, logs or demo screenshots.
- Trigger costly end-to-end/browser or full-build jobs only when relevant code changes require them. Documentation-only changes should avoid the expensive test matrix but still receive necessary publication/privacy checks.
- No additional paid infrastructure or plan upgrade without explicit approval. GitHub runner terms do not determine separate hosting, database, email, storage, bandwidth or egress costs.
- Treat merge, publishing and deployment as separate controlled operations; a public repository does not by itself authorise a public learner-data deployment.

## 8. Pilot v0.1 technical subset (conditionally ratified 2026-10-11)

The authoritative Pilot delivery slice is defined by [Scope](PILOT_V0_1_SCOPE.md), [Functional Design](PILOT_FUNCTIONAL_DESIGN.md) and [Learning Engine and Acceptance](PILOT_LEARNING_ENGINE_SPEC.md) together. This technical subset does not change the full Registered + Guest architecture.

- Pilot provides **one pre-provisioned Registered parent** and one nickname-only Child Profile under **Family → Child → Learning Records** ownership. Public sign-up and invitation redemption are deferred for Pilot. Google login plus password fallback is planned; first verify closed-signup account linking with synthetic users in staging. If unsafe/unavailable, use email/password only in Pilot and revisit Google with invitation onboarding later.
- Use Supabase Auth and child/family-scoped **RLS**, with synthetic negative tests for anonymous, other-family and spoofed-child reads/writes. A child operating in the parent's authenticated session is not separately authorised as a parent: destructive and restore operations require parent re-authentication.
- IndexedDB stays the offline **working copy**; authenticated automatic versioned JSON snapshots provide backup/restore, not per-record bidirectional sync. The [Pilot decision register](PILOT_V0_1_SCOPE.md#3-identity-and-protected-backup-policy) is authoritative for conflict decision A, head selection, retention and owner-mediated deletion. Stale-base rejection stops upload; when a cloud head exists, only parent-approved cloud-head restore after password reauthentication and a local safety copy allows recovery. Only a server-confirmed absent head permits an explicitly parent-confirmed new first snapshot under the Pilot register's no-head exception. Never silently discard local changes; defer “keep this device”. Required synthetic first/retry/conflict/restore-then-upload and head-after-pruning and post-deletion new-history tests are in [Pilot §5.3](PILOT_V0_1_SCOPE.md#5-testing-and-release-gates); none is verified by this PR.
- Snapshot minimisation includes the structured state required for target evidence, per-subject settings, story/checkpoint idempotence, suspensions, exposure and amendments as listed in Scope §3. Wrong forms and PIN/hash are device-local only; they never enter snapshots. Replay may change learning stages/dates/unlocks but preserves delivered story and past daily completions. The actual-target storage and safety-copy gates remain unresolved.
- One online first login is accepted. Afterwards cached lessons/local saves must function even when offline or auth expires. Upload waits/retries; never claim indefinite authentication validity or mainland network availability.
- Independently verify dedicated staging and production account/project identities from service metadata before any service write. Real learner data is prohibited until dedicated environment identity is independently verified and synthetic Auth/RLS, backup/recovery and real-device privacy gates have passed. No service-role key in frontend, PR checks or previews; no unapproved paid services. **No runtime AI**; private external worksheet preparation requires parent verification and complies with publication boundaries.

This is a **documentation decision only**, not evidence of implementation or authorisation to modify code, services, merge or deploy.

## 9. Validation status and open questions

Conditional ratification is **documentation-only**, not code/configuration/deployment approval. These are requirements, **not assertions of completed implementation**: registered-user RLS, invite flow, private storage, cross-device merge, mainland connectivity, offline auth recovery, real-device accessibility, retention/deletion, production-scale capacity and full publication audit. Verification must be documented separately before claiming readiness or making a repository public.

- **Pre-implementation data-protection gate (OPEN):** Before implementing handling of real children's records, resolve applicable data-protection obligations, parental consent/notices, provider handling and cross-border transfers, data minimisation, access, retention and deletion (including local safety copies and cloud backups). Record the operational policy and owner sign-off privately as appropriate; obtain qualified advice where needed. This gate is unresolved, not a legal compliance claim, and must be revisited before any use outside the family.
