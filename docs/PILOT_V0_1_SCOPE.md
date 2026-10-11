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

**This is the authoritative Pilot decision register, including the owner's Pilot-only backup conflict decision A (2026-10-11).** Other sections specify acceptance checks or link here rather than duplicate policy. The approval covers documentation only; it does not approve merge, code, Supabase configuration, deployment, real learner imports or spending.

- **Audience:** One pre-provisioned **Registered parent** and **one Child Profile** (nickname only; no real name, birth date or school), with future-proof Family → Child → Learning Records ownership, server authorization and RLS. **No Guest Mode or public sign-up in Pilot**. Both Guest and multi-child management remain in the **long-term** feature scope. Invitation codes are Pilot-exempt; Google login plus email/password fallback and pre-provisioned identity linkage require a staging test before reliance. First use online; subsequent cached lessons work offline. If staging cannot safely link Google to the pre-provisioned identity with public sign-up disabled, Pilot uses email/password only and defers Google login to the later invitation flow.
- **Subject order:** Chinese Character & Word Repair → Science Living & Non-living Things → Mathematics Fractions → English Mystery in the Forest. All four remain Pilot requirements; the **first internal Chinese release includes the small playable hub/companion, Chinese learning loop and safe cloud backup**. Subsequent releases add the remaining reviewed units.
- **Adventure:** A small explorable 2D hub with movable avatar, one companion, interactive quest locations, and visible nonpunitive world changes, not the full long-term 2.5D world/economy.
- **Mistake Bank:** Registered-private entries include verified, uncertain and catalogue-unmatched targets, associated evidence, source and repeated observations; catalogue mapping is separate. Only verified, catalogue-matched targets trigger prescribed remedial practice; voluntary generic learning remains available to uncertain targets. A later parent review may move an uncertain entry to verified or rejected, preserving private review provenance; rejected entries do not prescribe practice, and verified unmatched entries remain pending content. Keep unmatched targets as pending content; never silently discard them. Objective mistakes do not automatically prove knowledge misconceptions.
- **Worksheet intake:** Repeated parent-initiated use of private external ChatGPT/Claude on cropped/redacted worksheet images (redaction does **not** guarantee anonymity to the provider), extraction to draft structured candidates, parent verification of each item, then parent-only paste-in review/import. Original scans never enter Pilot app/backend or public repo. **No runtime AI/OCR**.
- **Practice and review priority (owner-confirmed Pilot follow-up):** Nonpunitive approximately day 1/3/7/14 baseline spaced review, prioritising independently repeated **verified, catalogue-matched** errors and weak subsequent review performance. Count occurrences across independent occasions; multiple wrong responses within one worksheet/session do not independently prove recurring misunderstanding. Gradually reduce frequency after sustained success, impose reasonable per-session practice limits and no missed-day penalty. Use independently reviewed varied examples for immediate understanding and delayed retention; specific thresholds and scheduling algorithms require implementation review. Keep objective correctness, ungraded responses, child self-review, parent review and game completion separate.
- **Provisional mastery (owner-confirmed Pilot follow-up):** Provisional mastery requires independent correct performance on different days, varied tasks/contexts and delayed retention evidence—not single-task correctness, memorising an identical question or quest completion. Keep low-frequency review available; new verified errors or poor delayed retention reopen review priority. Do not claim permanent mastery or automatically grade open writing/explanations.
- **Tracing:** Simple ungraded Chinese tracing with finger/stylus and appropriate palm handling, no stroke scoring, **discard strokes on exit** and exclude entirely from cloud backups.
- **Cloud backup:** IndexedDB is the offline working copy; authenticated Supabase versioned JSON snapshots are **automatic backups, not multi-device sync**. The Pilot assumes one primary device and one server-authoritative linear snapshot head. Persist pending uploads across restarts; first, duplicate and interrupted uploads must be idempotent. Follow this recovery procedure:

  1. On stale-base rejection, **stop upload**, preserve local changes and show **“backup paused — action needed”** alongside the last successful backup. Never silently rebase, replay the rejected upload or overwrite the cloud head.
  2. When a cloud head exists, this device or a second device can recover only by explicitly parent-approved restore of the **current cloud head**, after parent password reauthentication and successfully saving a private local safety copy, including pending local changes. Validate schema, size and content version; restore atomically. Cancellation or any failure preserves the working copy and leaves uploads paused.
  3. After successful restore, use that head as the upload base for subsequent work. If the head advances meanwhile, reject the stale upload and repeat recovery. Never silently discard local changes or roll back newer local data. **“Keep this device” overwrite/rebase is deferred.**
  4. **No-cloud-head exception:** On first use or after authorised deletion of all snapshots, the parent may explicitly confirm creation of a new first snapshot from the local working copy. Require parent reauthentication and a server-authorised, atomic check that the child has no committed head; an empty client cache, failed request or denied read is not proof. Only this case permits an upload without a matching base. Start a new history and do not replay the old pending upload; if a concurrent operation creates a head, reject the new-history attempt and use the existing-head recovery rule. After deletion, uploads remain paused until the parent deliberately confirms resuming backup; do not silently recreate deleted backups.

  No encrypted manual file export is included. **Safety-copy implementation gate:** Before the backup implementation PR, specify private local storage, lifetime, parent access/recovery/deletion controls and eviction limitations. Reopening a safety copy must not authorise overwriting an existing cloud head; keep uploads paused until the applicable recovery rule succeeds. Resolve this together with the data-protection gate in TDD §9; do not claim a safety copy is recoverable until its recovery path is implemented and tested.

- **Snapshot retention and deletion:** The authorised owner manually initiates pruning through the backend dashboard using an owner-only operation that enforces retention, retaining the **newest ten recoverable committed snapshots** (or all if fewer); ordinary clients have no delete permission. The latest snapshot is the server-authoritative committed head, not a client timestamp, an uncommitted upload or whichever row happens to remain last after pruning. Pruning must preserve that head and its ability to accept the next upload even if older ancestors are removed; reject unsafe pruning. Before the backup implementation PR, specify owner-only database operations for pruning and child-scoped all-snapshot deletion, protecting the head and newest ten during pruning and coordinating with concurrent uploads; do not rely on ad hoc row deletes or client RLS to enforce owner actions. Automated cleanup is deferred. On an authenticated parent request, the authorised owner manually initiates deletion of **all** that child's cloud snapshots through a separate owner-only operation in the backend dashboard; this explicit deletion request is an exception to ten-snapshot retention. Confirm the affected child and consequences privately and keep uploads paused until the parent deliberately resumes backup, so deletion is not silently undone. Deleting cloud backups does not itself erase local working/safety copies; their retention and deletion must be explained before implementation (see TDD §9).
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
| Chinese errors | Registered-private verified/uncertain/unmatched mistake bank, observations, paste-in parent import and spaced review | Private worksheet upload/storage; OCR and automatic handwriting grading remain prohibited |
| Parent | Reviewed intake, backup status/restore, light progress summary, real re-authentication for sensitive actions | Full dashboard, multi-child oversight, letters and time controls |
| Game | Small movable 2D hub, one companion, interactive quests and nonpunitive world progress | Full 2.5D world, inventory, economy, garden and ten companions |
| Tracing | Ephemeral finger/stylus Chinese tracing, discarded on exit | Selected private portfolio storage; handwriting remains ungraded |
| AI | No runtime AI; owner-authorised private external preparation | No runtime AI planned |
| Data privacy | Private records only in authorised learner storage, synthetic public assets/tests | Expanded registered private portfolios |

**Important:** A public URL is not access control. Public lesson bundles, fixtures, PRs and CI remain synthetic/generic, even when the private Pilot uses authenticated learner data.

## 4. P0 implementation checklist

| ID | Deliverable | Acceptance boundary |
|---|---|---|
| P0-01 | Four-subject quest navigation | Each of Chinese, Science, Mathematics and English opens a real reviewed lesson; first internal release includes Chinese and the playable hub. |
| P0-02 | Shared learning interactions | Essential choice, matching, ordering and structured-response controls, plus fraction manipulation and text-evidence selection required by the units, with accessible alternatives. |
| P0-03 | Versioned reviewed content | Stable IDs and objective tags, reviewed explanations, answers and variants, source/IP evidence, hints and validation in CONTENT_QA.md. |
| P0-04 | Deterministic evaluation | Auto-check only objective responses; writing and creative explanations remain ungraded/self-reviewed. |
| P0-05 | Guided lesson stages | Save and resume unfinished learning, without full adaptive planner. |
| P0-06 | IndexedDB persistence | Save attempts, state and pending uploads crash-safely; no silent replacement on app updates or storage failure. |
| P0-07 | Learning evidence | Separate incorrect objective attempts, uncertain cause, parent review, story completion and learning evidence. |
| P0-08 | Chinese private review | Registered mistake entries including verified, uncertain and unmatched targets; parent review can verify/reject uncertain entries; reviewed matching, nonpunitive day 1/3/7/14 baseline, independently repeated-error prioritisation and provisional mastery supported by varied delayed evidence; no unreviewed dynamic generation. |
| P0-09 | Parent learning summary | Objective outcomes, review queue, last successful backup and explicit “backup paused — action needed” state, without unsupported mastery claims. |
| P0-10 | Bounded 2D adventure | Movable avatar (tap-to-move acceptable), single companion, location-triggered Chinese quests and nonpunitive visible world changes. |
| P0-11 | Offline readiness | Once logged in and content cached, lessons, local saves and imports function despite network/auth expiry; retries wait safely. |
| P0-12 | Privacy/IP/content QA | Only synthetic CI/public content, no privileged credentials or real mistakes; owner signs off each QA batch. |
| P0-13 | Parent Auth/provisioning | One pre-created parent, one nickname-only child, closed signup, Google + password fallback verified in staging; use password only if safe linking fails; re-auth for restore/logout/delete. |
| P0-14 | Family ownership/RLS | Family → Child ownership; anonymous, other-family and spoofed-child operations denied in synthetic tests before real records. |
| P0-15 | Cloud backup and restore | Idempotent automatic post-lesson/import uploads, persisted pending work, linear head and stale-base rejection, parent-approved cloud-head recovery after password reauthentication and a local safety copy; parent-confirmed new history only when the server has no head; “keep this device” deferred. Test first snapshot, duplicate/interrupted retries, stale rejection, restore then successful upload, head selection after pruning, and new-history recovery after deletion (§7.3); retention/deletion follow the decision register. |
| P0-16 | Worksheet paste-in and mistake bank | Parent reviews every extracted candidate; import handles duplicate/malformed/unmatched entries and keeps uncertain/pending records child-private. Parent may later verify/reject uncertain entries. Before implementation, satisfy the private catalogue-coverage gate in §5 Chinese; no in-app image/OCR/AI. |
| P0-17 | Chinese tracing | Finger/stylus and palm behavior tested; ungraded, no stroke-order inference, nothing persisted after exit. |
| P0-18 | Delayed-retention visit | Use distinct reviewed examples on different days/contexts for immediate and delayed returns; evaluate only provisional mastery, keep low-frequency review, reopen priority on new verified errors and do not claim causal efficacy. |
| P0-19 | Device acceptance | Landscape tablet and phone Safari/WebKit PWA, Chinese simplified glyph/pinyin checks, offline reload, cache update and safe recovery. |

## 5. Exactly four first instructional units (ordered Chinese → Science → Mathematics → English)

### Science — Living & Non-living Things

- The **first Science World unit** is *Living & Non-living Things*; *Magnets* is not the Pilot's first unit.
- Provide a compact **Discover → Investigate → Understand → Apply → Master** sequence using classification, observable evidence, key scientific language, contrasted cases and explanation scaffolds.
- Include objectively checkable questions and a light self-reviewed explanation or observation record. Distinguish observations from inferences and avoid automatic scoring of open responses.
- Verify curriculum alignment before presenting a specific learning objective as belonging to a particular lower-primary syllabus chapter; do not invent experiment observations.

### Chinese — Character & Word Repair

- Provide a small, original/reviewed bank of approximately **10–15 example target characters or words** for recognition, meaning, character distinctions, collocations and sentence context. This is only an initial estimate, not a fixed catalogue cap or permission to fabricate real learner errors; revise after the private coverage comparison.
- **Pre-import mistake-first catalogue-coverage gate (owner-confirmed Pilot follow-up):** Build initial Chinese practice around privately verified individual character/word mistakes, not a broad generic Primary 2 catalogue. Before implementing paste-in import, the owner privately compares distinct verified targets (not concepts or repeated observations) against reviewed, usable exercises. **Aim to cover as close to 100% of verified targets as practicable**; the previously proposed 75% is **not** a stopping target or a ratified release threshold. Prioritise independently recurring errors and clear knowledge errors; distinguish possible slips/handwriting observations. If coverage is incomplete, expand original/rights-cleared reviewed exercises where pedagogically warranted; preserve unmatched targets privately as `pending_content` rather than forcing low-quality exercises. A limited initial batch can be trialled without declaring universal error coverage, subject to owner review of its coverage and educational usefulness. Privately retain the item-level comparison; GitHub may receive only a rough aggregate estimate (e.g. “about half”), with no real characters, entries, worksheets, outcomes or source materials. Record coverage evidence and any future quantitative pass threshold separately, before implementation; do not assert that coverage is already measured or passed.
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
3. **Resilience:** Follow the decision register's cloud backup, conflict recovery, retention and deletion policy. Handle IndexedDB denial/eviction; backups are not multi-device sync or independent provider disaster recovery. Before implementation acceptance, use synthetic data to test:
   - First snapshot establishes exactly one head; duplicate/interrupted retries (including restart and a lost response after commit) neither duplicate snapshots nor lose pending work.
   - Competing/stale-base writes are rejected without moving the head; rejected devices stop uploads and retain local changes. A second device follows the cloud-restore-only policy.
   - Restore requires password reauthentication, explicit parent confirmation, a successful local safety copy and schema/size/content-version validation. Cancellation and every failure preserve local data and keep conflict uploads paused; no silent rollback.
   - Successful atomic cloud-head restore followed by new local work uploads successfully against that restored head. “Keep this device” is unavailable.
   - Pruning more than ten snapshots preserves the newest ten and the same authoritative head; head selection and the next upload still work after older ancestors are removed. Test fewer than ten and attempted head deletion; do not infer latest from client clocks or missing ancestry.
   - After authorised deletion of all snapshots, an existing device can resume with parent reauthentication and explicit confirmation of a new first snapshot, without stale-base deadlock. First-use and post-deletion creation atomically establish only one head; concurrent creation cannot replace an existing head. Failed/denied reads cannot enable new-history creation, and deletion is not silently undone.
   - Ordinary clients cannot delete snapshots; authorised manual pruning respects retention. Explicit parent-requested deletion removes all targeted child snapshots, leaves other children untouched and does not silently recreate backups. Local-copy handling follows the separately resolved data-protection gate.
   These are required future tests, not tests run by this documentation PR.
4. **Accuracy:** Review every answer key, pedagogical explanation, source licence and syllabus claim. Treat unscored writing as unscored.
5. **Privacy:** No real worksheets, names, school information, handwriting samples, personal history, credentials or production exports in repository files, bundles, CI artifacts, PR comments, screenshot fixtures or preview outputs.
6. **Security (Pilot):** Verify identity, staging Auth and cross-family/child RLS, backup collision/restore behavior, OAuth account linkage and key separation with synthetic data **before** transmitting any real learner data.
7. **Budget:** No unapproved paid plan or service. Avoid unnecessary CI triggers, duplicate jobs and costly cross-browser matrices in the Pilot.
8. **Data protection:** Resolve the pre-implementation open gate in [TDD §9](TECHNICAL_DESIGN_DECISIONS.md#9-validation-status-and-open-questions) before building real-record handling.
9. **Publication:** These Markdown specifications may be included in a public repository after document-level review. **Making any repository that has held private material public requires its own full history/secrets/refs/preview audit** under `TECHNICAL_DESIGN_DECISIONS.md`, or a new clean repository.

## 8. Change-control rule

Pilot v0.1 is a deliberately restricted **delivery subset** of Turtle Academy. It does not remove the full Science and Chinese teaching scope, English E1–E12, Mathematics M1–M12, authenticated architecture, privacy controls, parent functions or future adventure-game requirements. Any proposal to change a confirmed long-term decision must be recorded explicitly; mere omission from Pilot does not constitute cancellation.
