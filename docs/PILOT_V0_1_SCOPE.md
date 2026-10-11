# Turtle Academy — Learning Pilot v0.1 Scope

**Document type:** Confirmed initial delivery slice  
**Audience:** Private one-family Registered-only trial; no public beta/sign-up  
**Status:** Scope confirmed; implementation and real-device acceptance must be verified separately  
**Decision date:** 2026-10-10; updated Pilot conditional ratification 2026-10-11

## 1. Position within the project

Turtle Academy is a long-term, four-subject learning and adventure product. **Pilot v0.1 is intentionally only a small subset of that complete design**, created to test whether the instructional approaches are usable, engaging and educationally valuable before investing in full game and family-management systems.

Read this document together with:

- [`TECHNICAL_DESIGN_DECISIONS.md`](TECHNICAL_DESIGN_DECISIONS.md) — authoritative engineering, privacy, security and publication requirements.
- [`FEATURE_SCOPE.md`](FEATURE_SCOPE.md) — complete confirmed four-subject product and educational scope, including English E1–E12 and Mathematics M1–M12. Features omitted from the Pilot **remain in the target scope**, subject to later release prioritisation.

The numbered cross-subject decision sequence ended at **#202**; separately confirmed English and Mathematics decisions use **E1–E12** and **M1–M12**, respectively. Decision identifiers are not a total feature or question count.

## Conditionally ratified Pilot v0.1 decisions (2026-10-11, Issue #3)

**This is the current Pilot decision register.** The approval covers documentation only; it does not approve merge, code, Supabase configuration, deployment, real learner imports or spending.

- **Audience:** One pre-provisioned **Registered parent** and **one Child Profile** (nickname only; no real name, birth date or school), with future-proof Family → Child → Learning Records ownership, server authorization and RLS. **No Guest Mode or public sign-up in Pilot**. Both Guest and multi-child management remain in the **long-term** feature scope. Invitation codes are Pilot-exempt; Google login plus email/password fallback and pre-provisioned identity linkage require a staging test before reliance. First use online; subsequent cached lessons work offline. If staging cannot safely link Google to the pre-provisioned identity with public sign-up disabled, Pilot uses email/password only and defers Google login to the later invitation flow.
- **Subject order:** Chinese Character & Word Repair → Science Living & Non-living Things → Mathematics Fractions → English Mystery in the Forest. All four remain Pilot requirements; the **first internal Chinese release includes the small playable hub/companion, Chinese learning loop and safe cloud backup**. Subsequent releases add the remaining reviewed units.
- **Adventure:** A small explorable 2D hub with movable avatar, one companion, interactive quest locations, and visible nonpunitive world changes, not the full long-term 2.5D world/economy.
- **Mistake Bank:** Registered-private entries include verified, uncertain and catalogue-unmatched targets, associated evidence, source and repeated observations; catalogue mapping is separate. Only verified, catalogue-matched targets trigger prescribed remedial practice; voluntary generic learning remains available to uncertain targets. Keep unmatched targets as pending content; never silently discard them. Objective mistakes do not automatically prove knowledge misconceptions.
- **Worksheet intake:** Repeated parent-initiated use of private external ChatGPT/Claude on cropped/redacted worksheet images (redaction does **not** guarantee anonymity to the provider), extraction to draft structured candidates, parent verification of each item, then parent-only paste-in review/import. Original scans never enter Pilot app/backend or public repo. **No runtime AI/OCR**.
- **Practice:** Nonpunitive approximately day 1/3/7/14 spaced review, independently reviewed examples for immediate understanding and later retention; separate objective correctness, ungraded, child self-review, parent review and game completion. No unsupported efficacy or mastery claims.
- **Tracing:** Simple ungraded Chinese tracing with finger/stylus and appropriate palm handling, no stroke scoring, **discard strokes on exit** and exclude entirely from cloud backups.
- **Cloud backup:** IndexedDB is the offline working copy; authenticated Supabase versioned JSON snapshots are **automatic backups, not multi-device sync**. Pending upload survives restart/retries idempotently, protect against stale overwrite, validate and explicitly confirm restore with parent re-authentication, show last successful backup, and retain **last 10** safely recoverable versions by parent manual pruning during Pilot (client has no delete permission). Never prune the latest recoverable head. No encrypted manual file export in Pilot.
- **Educational QA:** Human-reviewed, versioned original/licensed educational catalogue; development-time AI cross-review plus owner approval; owner reviews every disputed item and randomly audits **1 in 5 AI-agreed items** per batch; escalate when needed to a qualified educator. Follow [CONTENT_QA.md](CONTENT_QA.md).
- **Hard release gates:** independently verify dedicated staging/production identities before any service write; closed-signup Google/password identity linking, parent/child Auth and synthetic cross-family RLS denial, backup retry/collision/restore integrity, offline behavior after first login, landscape tablet/phone Safari/WebKit/PWA, Chinese glyph `lang="zh-Hans"` rendering and tracing input. **No actual learner data until security gates pass.** Mainland China online availability is not verified.
- **Full scope protected:** Registered + Guest architecture, invitations, multi-child, full private worksheet storage, genuine per-record multi-device sync, complete 2.5D game and full four-subject curriculum remain future targets.

## 2. Pilot objective and success conditions

Build the **lowest-cost genuinely playable four-subject learning trial**. Each subject needs an instructional loop, not just a subject button or static demonstration. Evaluate:

1. Whether the learner can independently start and finish meaningful lessons across four subjects.
2. Whether guided explanation, practice, objective feedback and a short review are useful and understandable.
3. Whether the four subject-specific teaching approaches warrant deeper content investment.
4. Whether progress and drafts persist reliably and all bundled content works offline after initial installation/caching.

Pilot success does **not** require full game engagement systems, long-term growth analytics, public account registration or proof of educational impact from a short trial. Any observations of learning should be framed conservatively.

## 3. Pilot delivery boundaries

| Area | Pilot v0.1 | Deferred, not cancelled |
|---|---|---|
| Users | Registered-only: one provisioned parent, one nickname-only child profile; Family → Child → Learning Records | Guest, multi-child management, public sign-up and invitation codes |
| Authentication | First online login; Google and email/password fallback subject to staging identity-link verification; otherwise email/password-only | Full invitation onboarding and broader family controls |
| Storage | IndexedDB offline working copy and authenticated Supabase automatic versioned snapshot backup/parent-approved restore | Full bidirectional per-record sync, private scanned worksheet storage, encrypted manual export |
| Hosting | Cached PWA, no privileged browser credentials | Downloadable content packs and broader account-aware services |
| Learning | Four human-reviewed units, deterministic objective feedback, independent/delayed retention | Larger curricula, extensive adaptivity and causal diagnosis |
| Chinese errors | Registered-private verified/uncertain/unmatched mistake bank, observations, paste-in parent import and spaced review | In-app worksheet OCR/upload and handwriting auto-scoring |
| Parent | Reviewed intake, backup status/restore, light progress summary, real re-authentication for sensitive actions | Full dashboard, multi-child oversight, letters and time controls |
| Game | Small movable 2D hub, one companion, interactive quests and nonpunitive world progress | Full 2.5D world, inventory, economy, garden and ten companions |
| Tracing | Ephemeral finger/stylus Chinese tracing, discarded on exit | Recognised/graded handwriting and selected portfolio storage |
| AI | No runtime AI; owner-authorised private external preparation | No runtime AI planned |
| Data privacy | Private records only in authorised learner storage, synthetic public assets/tests | Expanded registered private portfolios |

**Important:** A public URL is not access control. Public lesson bundles, fixtures, PRs and CI remain synthetic/generic, even when the private Pilot uses authenticated learner data.

## 4. P0 implementation checklist

| ID | Deliverable | Acceptance boundary |
|---|---|---|
| P0-01 | Four-subject quest navigation | Each of Chinese, Science, Mathematics and English opens a real reviewed lesson; first internal release includes Chinese and the playable hub. |
| P0-02 | Shared learning interactions | Only essential choice, matching, ordering and short structured-response controls, with accessible alternatives. |
| P0-03 | Versioned reviewed content | Stable IDs and objective tags, reviewed explanations, answers and variants, source/IP evidence, hints and validation in CONTENT_QA.md. |
| P0-04 | Deterministic evaluation | Auto-check only objective responses; writing and creative explanations remain ungraded/self-reviewed. |
| P0-05 | Guided lesson stages | Save and resume unfinished learning, without full adaptive planner. |
| P0-06 | IndexedDB persistence | Save attempts, state and pending uploads crash-safely; no silent replacement on app updates or storage failure. |
| P0-07 | Learning evidence | Separate incorrect objective attempts, uncertain cause, parent review, story completion and learning evidence. |
| P0-08 | Chinese private review | Registered mistake entries including verified, uncertain and unmatched targets; reviewed matching and day 1/3/7/14 practice; no unreviewed dynamic generation. |
| P0-09 | Parent learning summary | Objective outcomes, review queue and last successful backup, without unsupported mastery claims. |
| P0-10 | Bounded 2D adventure | Movable avatar (tap-to-move acceptable), single companion, interactive subject quests and nonpunitive visible world changes. |
| P0-11 | Offline readiness | Once logged in and content cached, lessons, local saves and imports function despite network/auth expiry; retries wait safely. |
| P0-12 | Privacy/IP/content QA | Only synthetic CI/public content, no privileged credentials or real mistakes; owner signs off each QA batch. |
| P0-13 | Parent Auth/provisioning | One pre-created parent, one nickname-only child, closed signup, Google + password fallback verified in staging; use password only if safe linking fails; re-auth for restore/logout/delete. |
| P0-14 | Family ownership/RLS | Family → Child ownership; anonymous, other-family and spoofed-child operations denied in synthetic tests before real records. |
| P0-15 | Cloud backup and restore | Idempotent automatic post-lesson/import uploads, persisted pending work, linear head and stale-base rejection, atomic validation/restore with safety copy and re-auth; newest 10 manually retained. |
| P0-16 | Worksheet paste-in and mistake bank | Parent reviews every extracted candidate; import handles duplicate/malformed/unmatched entries and keeps uncertain/pending records child-private. No in-app image/OCR/AI. |
| P0-17 | Chinese tracing | Finger/stylus and palm behavior tested; ungraded, no stroke-order inference, nothing persisted after exit. |
| P0-18 | Delayed-retention visit | Use distinct reviewed examples for immediate and delayed returns; label whether examples repeated or new, and do not claim causal efficacy. |
| P0-19 | Device acceptance | Landscape tablet and phone Safari/WebKit PWA, Chinese simplified glyph/pinyin checks, offline reload, cache update and safe recovery. |

## 5. Exactly four first instructional units (ordered Chinese → Science → Mathematics → English)

### Science — Living & Non-living Things

- The **first Science World unit** is *Living & Non-living Things*; *Magnets* is not the Pilot's first unit.
- Provide a compact **Discover → Investigate → Understand → Apply → Master** sequence using classification, observable evidence, key scientific language, contrasted cases and explanation scaffolds.
- Include objectively checkable questions and a light self-reviewed explanation or observation record. Distinguish observations from inferences and avoid automatic scoring of open responses.
- Verify curriculum alignment before presenting a specific learning objective as belonging to a particular lower-primary syllabus chapter; do not invent experiment observations.

### Chinese — Character & Word Repair

- Provide a small, original/reviewed bank of approximately **10–15 example target characters or words** for recognition, meaning, character distinctions, collocations and sentence context. This number is a content planning guide, not permission to fabricate real learner errors.
- Store verified, uncertain and unmatched mistakes in the Registered child's private learning bank, with deduplicated targets and observation history; only verified catalogue-matched targets prescribe remedial practice. Public course/examples remain synthetic and general.
- **In Pilot:** parent-verified paste-in import of structured worksheet extracts prepared privately outside the app, catalogue matching with unmatched targets retained, and non-graded temporary Chinese tracing. **Out of Pilot:** worksheet photo upload within the app, OCR, AI grading and handwriting recognition.

### English — Mystery in the Forest

- One **original narrative** Integrated Literacy unit: **Read → Think → Learn → Write → Improve**.
- Include reading comprehension, textual evidence and inference, precise vocabulary, sentence revision and one short paragraph or guided story-writing opportunity.
- Provide human-written examples and focused self-review; save drafts locally. Never claim the app automatically scored original writing for quality or creativity.
- Additional nonfiction units, deeper E1–E12 pathways and full writing portfolio remain part of `FEATURE_SCOPE.md`, not Pilot P0.

### Mathematics — Fractions

- One introductory **CPA (Concrete–Pictorial–Abstract)** learning sequence, including manipulable/visual fractions, part–whole meaning, comparison and appropriate equivalence examples.
- Use the compact **Understand → Apply → Reason** learning structure, objective checks and an age-appropriate explanation/reasoning challenge.
- Provide simple retry/verification but no automated grading of free-form reasoning or mathematical proof.
- Whole lower-primary coverage, larger heuristic libraries, the five applied maths environments and full M1–M12 depth stay in long-term scope.

**Content rule:** One substantial, coherent, reviewed unit per subject. Avoid implementing a generic authoring system or inflating item counts simply to look complete.

## 6. Provisional post-Pilot priorities

**P1 — Usable family version (not yet committed):** Add further units, expanded parent oversight, Guest/multi-child support as prioritised later, and eventual per-record multi-device reconciliation. **Pilot already includes** minimum registered identity, RLS, private Chinese mistake bank and cloud snapshot backup.

**Phase 2 candidates — deeper learning:** Broader Singapore lower-primary curriculum, advanced Science journal and experimentation, Chinese customised repair, English nonfiction/creative-writing sequence, Mathematics modelling and strategy banks, evidence-based diagnostics, more advanced spaced review, adaptive progression and parent learning plans.

**Phase 3 candidates — expanded adventure and portfolio:** More animal companions and story worlds, garden/museum, sustained research activities, richer learner portfolios and longer-term performance views.

**Backlog:** Optional cosmetic depth, hidden side quests, large content-authoring systems and other low-priority embellishments. **Only Pilot P0 is committed in this document; later phase assignment is indicative, not a change to the full confirmed feature scope.**

## 7. Testing and release gates

1. **Learning:** Each subject has usable instructions, a complete content loop, feedback and short review. A learner can complete and revisit all four units.
2. **Offline:** After initial online login, test cached app, refresh, answer/import, expired session, delayed review and return visit on real landscape phone/tablet; no network should block cached lessons.
3. **Resilience:** Handle IndexedDB denial/eviction and interrupted uploads; cloud snapshots are not multi-device sync or independent provider disaster recovery. Maintain a single linear snapshot head, reject stale-base writes, idempotently handle first/duplicate/interrupted uploads, keep local safety copy before explicitly approved restore and never silently replace newer data. Parent manually prunes older versions while keeping newest 10; show last successful backup.
4. **Accuracy:** Review every answer key, pedagogical explanation, source licence and syllabus claim. Treat unscored writing as unscored.
5. **Privacy:** No real worksheets, names, school information, handwriting samples, personal history, credentials or production exports in repository files, bundles, CI artifacts, PR comments, screenshot fixtures or preview outputs.
6. **Security (Pilot):** Verify identity, staging Auth and cross-family/child RLS, backup collision/restore behavior, OAuth account linkage and key separation with synthetic data **before** transmitting any real learner data.
7. **Budget:** No unapproved paid plan or service. Avoid unnecessary CI triggers, duplicate jobs and costly cross-browser matrices in the Pilot.
8. **Publication:** These Markdown specifications may be included in a public repository after document-level review. **Making any repository that has held private material public requires its own full history/secrets/refs/preview audit** under `TECHNICAL_DESIGN_DECISIONS.md`, or a new clean repository.

## 8. Change-control rule

Pilot v0.1 is a deliberately restricted **delivery subset** of Turtle Academy. It does not remove the full Science and Chinese teaching scope, English E1–E12, Mathematics M1–M12, authenticated architecture, privacy controls, parent functions or future adventure-game requirements. Any proposal to change a confirmed long-term decision must be recorded explicitly; mere omission from Pilot does not constitute cancellation.
