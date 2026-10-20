# Technical design decisions

Confirmed long-term architecture. The [Pilot](PILOT_FUNCTIONAL_DESIGN.md) builds a subset of it.

## Application and learning

| Area | Decision |
| --- | --- |
| Product | Original, child-friendly fantasy-adventure PWA with a 2.5D visual direction; tablet, desktop and landscape phone; no app-store dependency |
| Frontend | React, Vite, TypeScript; modular UI and lesson engine |
| Offline storage | IndexedDB via Dexie for drafts, progress and offline events; handle unavailable or evicted storage |
| Offline assets | Versioned service worker caching app and lessons; cached lessons need no network, fonts or auth check; updates never discard records |
| Lessons | Reviewed, declarative, versioned content with stable IDs, answer keys, explanations and prerequisites; content changes migrate or preserve progress |
| Evaluation | Deterministic checking only for objectively checkable answers; completion, hint use or open writing never count as mastery |
| Game | Story, companions, home and progress kept separate from curriculum and learner data |
| AI | No AI in the app: no LLM calls, generated lessons, AI grading, OCR, voice evaluation or sending learner data to AI. Private, owner-run worksheet preparation outside the app is allowed, with human verification |
| IP | Original characters, art, stories and learning assets; no franchise assets, teacher worksheets or third-party materials without permission |
| Cost | No paid infrastructure without the owner's approval |

## Accounts and data

- **Registered families:** parent-controlled, invitation-only onboarding with expiring codes; email/password with optional Google sign-in (never the only route, since Google may be unreachable). Parents manage several child profiles without child emails. Parent-only actions need re-authentication or the parent PIN.
- **Guest:** local-only, restricted personalisation, no cloud mistake bank. Moving guest records into an account needs explicit parent review and selection; another person's device data is never attached silently.
- **Backend:** Supabase Auth, Postgres and private storage. Ownership is enforced server-side with row-level security on every private record and object; UI checks alone are not enough. Staging and production stay separate.
- **Public content:** generic code, original assets, general educational content and synthetic examples.
- **Private learner content:** identity, work samples, handwriting, drawings, worksheets, mistakes, answers, progress, portfolios and parent notes. It never goes into public Git, builds, APIs, screenshots, CI or logs.
- Drafts autosave locally with clear retention; selected finished work can be kept in private storage. Voice input, if added, is transient.
- A public site URL is not access control; static deployments carry no learner data and no privileged keys.

## Offline and sync

- Lessons work after installation or precaching with no network requests. Long-term: explicit lesson-pack downloads, offline-readiness indicators and recovery from incomplete caches.
- Learning uses a local-first event queue with unique, idempotent event IDs, crash-safe saving, retries and deduplication of rewards and completed tasks. Naive last-write-wins is never used for learning evidence.
- Live sync of records and the private pack is the chosen direction ([Pilot §10](PILOT_FUNCTIONAL_DESIGN.md#10-offline-saving-updates-and-sync)).
- Mainland China access is not assumed: test on real networks and devices, support offline use after download, and don't rely on Google OAuth.

## Pedagogy

- Track separately: adventure completion, lesson completion, submitted attempt, objective correctness, independent mastery evidence and self-reflection.
- Adapt only from repeated verifiable performance, prerequisites and review history; no invented confidence scores or diagnoses from single errors.
- Science: **Discover → Investigate → Understand → Apply → Master**; observation, inference, fair testing, vocabulary, evidence and safety; simulations are labelled as simulations. Explanations progress from keywords and sentence scaffolds to independent writing, with hints and reference answers after a first attempt; no automatic grading of free explanations.
- Chinese: built on human-verified knowledge errors and writing observations; a slip or untidy form is not a misconception; no handwriting grading or OCR.
- English: reading, reasoning, language craft, writing and model-based revision; no automatic free-writing scores.
- Mathematics: CPA models, inquiry, problem-solving strategies, reasoning and evidence-based diagnostic review; no automatic scoring of open reasoning.
- Attention and multi-step directions can be practised inside tasks, without diagnosing attention disorders or promising classroom transfer.
- Child experience: no punitive absence mechanics, monetised rewards or manipulative engagement loops; accessible alternatives to drag, replayable instructions, adjustable pace, no racing timers.

## Privacy rules for this repo

1. Real learner material (worksheets, answers, mistakes, name, school) stays in the private resources repo, the Claude Project or the app's database, never in this public repo.
2. No secrets in git. `scripts/privacy_guard.py` runs on every PR.
3. App data is visible only to the signed-in family.
