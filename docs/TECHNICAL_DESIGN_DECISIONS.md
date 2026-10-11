# Turtle Academy — Technical Design Decisions

**Document type:** Long-term architecture, privacy, security and engineering decision record  
**Status:** Confirmed design requirements, not a claim that the infrastructure or features are deployed  
**Last consolidated:** 2026-10-11 (Pilot-only conditional ratification)

## 1. Decision hierarchy

- This document is the primary authority for **technical architecture, data protection, security and deployment governance**.
- [`FEATURE_SCOPE.md`](FEATURE_SCOPE.md) defines the full long-term product and educational feature scope. Features listed there are not automatically included in the next release.
- [`PILOT_V0_1_SCOPE.md`](PILOT_V0_1_SCOPE.md) specifies the initial, minimal **single-household learning trial**. Its reduced implementation is a staged delivery choice, **not a reversal** of long-term account, cloud storage, content, safety or curriculum decisions.
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
| Game | Narrative quests, companions, home, journals and progress are separate from curriculum and learner-data layers | A rich game experience is a later target; minimal Pilot story framing is sufficient at first |
| AI | **No in-app/runtime AI** | No LLM calls, AI-generated lessons, AI grading, AI OCR, automated voice evaluation or in-app transmission of learner data to AI services; private owner-authorised external worksheet preparation is allowed subject to data handling controls |
| IP | Original characters, visual design, stories and learning assets | Do not reproduce protected franchise assets, teacher worksheets or third-party educational materials without permission |

Science and Chinese were the initial pedagogical priorities; **English and Mathematics are also confirmed long-term subjects**, not optional placeholder tabs. Their complete curriculum decisions are recorded in `FEATURE_SCOPE.md`.

## 3. Long-term identities, authentication and privacy

### Registered family accounts (narrow registered-only Pilot exception documented below)

- Parent-controlled, invitation-only onboarding using unique expiring invitation codes; email/password login with **optional Google sign-in** where supported. Google sign-in must never be the sole way to access offline learning, especially in environments where Google services are unavailable.
- Parents can manage multiple child profiles without requiring a child email. Parent-only actions use appropriate re-authentication or a parent PIN.
- **Supabase Auth + PostgreSQL + private object storage** is the planned registered-user backend. Enforce ownership in server-side authorization and **Row Level Security (RLS)** for every private record and object. Frontend UI restrictions alone are insufficient.
- Keep staging and production isolated, with separate credentials, data and access controls. Use only synthetic or properly anonymized development fixtures. Verify available quotas and cost before creating resources.
- Migrating guest records into a registered account requires explicit review and selection. Never silently attach another person's device-local data to an account.

### Data classification and handling

- **Public/repository content:** generic application source, original approved game assets, general educational content, synthetic examples, architecture documents, and least-privilege CI workflows.
- **Private learner content:** learner identity, work samples, handwriting and drawings, authentic worksheets, error banks, answer history, progress, observations, portfolios, personal messages and parent notes. Keep these out of public Git, deployment bundles, public APIs, screenshots, CI artifacts and logs.
- Original worksheets and teacher-provided materials belong in private storage or separate private preparation workflows. Owner-initiated private external AI preparation of cropped/redacted worksheet images is allowed, with provider privacy considerations and mandatory human verification; cropping does not guarantee anonymity. No such images or records in public files. Human-reviewed structured learning records may be imported only into authorised learner storage. Copyright permission is required before republishing educational materials.
- Draft writing/drawings should autosave locally, have a clear deletion/retention policy and allow intentional preservation of selected finished work in private authenticated storage when that feature is enabled. Voice input, if added, must follow a transient/minimised retention model rather than automatic recording archives.
- An unauthenticated static deployment must contain no real learner information and no privileged backend credentials. Public access to a site URL is **not** access control.

## 4. Offline-first and regional connectivity

- The core lesson experience should work **after successful installation or precaching**, without remote fonts, images, scripts, authentication checks or network requests needed for cached lessons.
- Long-term lesson packs support explicit downloads, offline readiness indicators, reliable updates and clear recovery from incomplete caches.
- Registered-user learning uses a local-first event queue with unique/idempotent event identifiers, crash-safe persistence, retries, reconciliation of conflicting changes and deduplication of rewards and completed tasks. Naive last-write-wins is not acceptable for learning evidence.
- A session or service-worker update must not erase active lessons, drafts or pending events. Validate device storage eviction, airplane-mode reload, and offline/online recovery.
- **Mainland China accessibility cannot be guaranteed** merely by selecting an overseas provider. Test with real networks and target devices; support offline use after content download. Google OAuth reachability must not be assumed. Offline authentication recovery needs its own validation when registered accounts are implemented.
- Pilot v0.1 only requires a self-contained locally cached course set and IndexedDB; it does **not** require a cloud reconciliation engine or a downloaded lesson-pack manager.

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

### CI and cost controls

- Prefer standard GitHub-hosted runners under the current applicable public-repository terms. Avoid unnecessary matrices, duplicate push/PR builds and redundant tests; use path-aware changes, concurrency cancellation, short timeouts and targeted checks.
- Keep required PR security/privacy checks reliable. Do not configure mandatory checks that are skipped and remain indefinitely pending; use a lightweight always-reporting gate if appropriate.
- Use minimum workflow permissions (typically `contents: read`), pinned trusted Actions, no ordinary-job production secrets and approval for untrusted fork changes. Do not use production data in tests, artifacts, logs or demo screenshots.
- Trigger costly end-to-end/browser or full-build jobs only when relevant code changes require them. Documentation-only changes should avoid the expensive test matrix but still receive necessary publication/privacy checks.
- No additional paid infrastructure or plan upgrade without explicit approval. GitHub runner terms do not determine separate hosting, database, email, storage, bandwidth or egress costs.
- Treat merge, publishing and deployment as separate controlled operations; a public repository does not by itself authorise a public learner-data deployment.

## Conditionally ratified Pilot v0.1 decisions (2026-10-11, Issue #3)

**This section supersedes inconsistent earlier Pilot-only statements in this document.** The approval covers documentation only; it does not approve merge, code, Supabase configuration, deployment, real learner imports or spending.

- **Audience:** One pre-provisioned **Registered parent** and **one Child Profile**, with future-proof Family → Child → Learning Records ownership, server authorization and RLS. **No Guest Mode or public sign-up in Pilot**. Both Guest and multi-child management remain in the **long-term** feature scope. Invitation codes are Pilot-exempt; Google login plus email/password fallback and pre-provisioned identity linkage require a staging test before reliance. First use online; subsequent cached lessons work offline.
- **Subject order:** Chinese Character & Word Repair → Science Living & Non-living Things → Mathematics Fractions → English Mystery in the Forest. All four remain Pilot requirements; the **first internal Chinese release includes the small playable hub/companion, Chinese learning loop and safe cloud backup**. Subsequent releases add the remaining reviewed units.
- **Adventure:** A small explorable 2D hub with movable avatar, one companion, interactive quest locations, and visible nonpunitive world changes, not the full long-term 2.5D world/economy.
- **Mistake Bank:** Registered-private entries include verified, uncertain and catalogue-unmatched targets, associated evidence, source and repeated observations; catalogue mapping is separate. Only verified, catalogue-matched targets generate reviewed personalised practice. Keep unmatched targets as pending content; never silently discard them. Objective mistakes do not automatically prove knowledge misconceptions.
- **Worksheet intake:** Repeated parent-initiated use of private external ChatGPT/Claude on cropped/redacted worksheet images (redaction does **not** guarantee anonymity to the provider), extraction to draft structured candidates, parent verification of each item, then parent-only paste-in review/import. Original scans never enter Pilot app/backend or public repo. **No runtime AI/OCR**.
- **Practice:** Nonpunitive approximately day 1/3/7/14 spaced review, independently reviewed examples for immediate understanding and later retention; separate objective correctness, ungraded, child self-review, parent review and game completion. No unsupported efficacy or mastery claims.
- **Tracing:** Simple ungraded Chinese tracing with finger/stylus and appropriate palm handling, no stroke scoring, **discard strokes on exit** and exclude entirely from cloud backups.
- **Cloud backup:** IndexedDB is the offline working copy; authenticated Supabase versioned JSON snapshots are **automatic backups, not multi-device sync**. Pending upload survives restart/retries idempotently, protect against stale overwrite, validate and explicitly confirm restore with parent re-authentication, show last successful backup, and retain **last 10** safely recoverable versions. No encrypted manual file export in Pilot.
- **Educational QA:** Human-reviewed, versioned original/licensed educational catalogue; development-time AI cross-review plus owner approval; owner reviews every disputed item and randomly audits **1 in 5 AI-agreed items** per batch; escalate when needed to a qualified educator. Follow [CONTENT_QA.md](CONTENT_QA.md).
- **Hard release gates:** independently verify dedicated staging/production identities before any service write; closed-signup Google/password identity linking, parent/child Auth and synthetic cross-family RLS denial, backup retry/collision/restore integrity, offline behavior after first login, landscape tablet/phone Safari/WebKit/PWA, Chinese glyph `lang="zh-Hans"` rendering and tracing input. **No actual learner data until security gates pass.** Mainland China online availability is not verified.
- **Full scope protected:** Registered + Guest architecture, invitations, multi-child, full private worksheet storage, genuine per-record multi-device sync, complete 2.5D game and full four-subject curriculum remain future targets.

## 8. Original Pilot v0.1 engineering subset (historical; replaced where inconsistent by 2026-10-11 decisions)

For the first **single-household, single-device** learning trial:

- Four reviewed learning units: Science **Living & Non-living Things**; Chinese **Character & Word Repair**; English **Mystery in the Forest**; Mathematics **Fractions**.
- No mandatory login, multi-user management, private backend API or cross-device sync. **Google sign-in remains optional later**, not a Pilot dependency.
- Serve the application as a simple static PWA with all Pilot lessons precached; store progress, objective attempts, minimal error replay and unfinished drafts in IndexedDB.
- Show basic local learning results and light adventure guidance. No complete parent-control suite, economy, ten-companion system, full user mistake-bank ingestion or automatic handwriting assessment.
- Keep all committed course examples and automated tests **synthetic or original**. Do not bake real family data into any bundle or public path; local device data remains subject to browser storage loss.
- The pilot is a **subset, not a replacement**, of registered-user architecture and the complete long-term curriculum/game feature scope.

## 9. Validation status and open questions

Conditional ratification is **documentation-only**, not code/configuration/deployment approval. These are requirements, **not assertions of completed implementation**: registered-user RLS, invite flow, private storage, cross-device merge, mainland connectivity, offline auth recovery, real-device accessibility, retention/deletion, production-scale capacity and full publication audit. Verification must be documented separately before claiming readiness or making a repository public.
