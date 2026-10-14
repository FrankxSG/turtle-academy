# Turtle Academy — Pilot v0.1 Scope

**Status:** Consolidated owner decisions through 2026-10-15. Documentation only; not implementation, merge, deployment, real imports or spending authorization.

## 1. Objective and success criteria

Pilot is **a usable daily-practice tool for one family, with full scoped coverage as the goal**. Success is assessed through these questions:

- Can the parent set up each subject's X once, import reviewed minimal mistakes, inspect progress and safely correct records?
- Can the child independently complete or resume meaningful daily practice, receive help after mistakes and explore the small world afterward?
- Do stage/review decisions reflect independent evidence, preserve learning across pauses and avoid unsupported mastery claims?
- Do released subjects have sufficient reviewed coverage and variety for actual use, with missing content and workload visible?
- Do cached learning, local-save failure, private backup/recovery and device access behave safely under the release gates?

Scope, [Functional Design](PILOT_FUNCTIONAL_DESIGN.md) and [Learning Engine and Acceptance](PILOT_LEARNING_ENGINE_SPEC.md) **together define the committed delivery slice**. Scope owns the objective, boundary/index and protected release gates; Functional Design owns behavior; the engine owns proposed contracts and acceptance definitions. [Technical Decisions](TECHNICAL_DESIGN_DECISIONS.md) retains security authority, and [Full Feature Scope](FEATURE_SCOPE.md) retains long-term commitments.

## 2. Delivery boundary and P0 index

Chinese first, then Science, Mathematics and English is delivery sequencing, not compulsory child subject order. Each subject releases separately; all available subjects have daily tasks. Each subject has persistent X=6–19, default 10.

| Included in Pilot | Excluded or later |
| --- | --- |
| P2 + P3 Chinese/Higher Chinese, Mathematics and English scoped objective practice | Typed learning answers, complete writing/oral assessment, listening |
| Seven selected P3 Science topic areas; authored chapters unlock progressively | P2 Science course, unreviewed teaching, scored free explanations |
| Private parent-reviewed minimal imports and app-caught general errors | In-app scans/OCR/runtime AI, original worksheet archive |
| Routine offline parent PIN, records, per-subject X/time and today-rest action | Multi-child/Guest, public signup, weekly timetable |
| Movable small 2D hub, one companion, shared scripted story and a few interactions | Full economy, large game/portfolio, open chat |
| Cached app content updates, local working copy and protected snapshot backup | Tracing/PDF generation, parent generic-bank importer, live multi-device sync |

| ID | Required delivery capability | Detailed authority and acceptance |
| --- | --- | --- |
| P0-01 | Reviewed curriculum and source inventory | Engine coverage acceptance; §4–5 below |
| P0-02 | Complete daily objective practice | Functional §2–6; Engine F01–F13 |
| P0-03 | Grade-readable academic language and accessibility | Functional §1/6; Engine F25/F26; §5 device gate |
| P0-04 | Deterministic independent/assisted evidence | Functional §4; Engine §2–4 and F03/F04/F32 |
| P0-05 | Guided Science learning and prerequisite chapters | Functional §5; Engine F05–F09/F35 |
| P0-06 | Local persistence and warned retry | Functional §9; Engine F27 |
| P0-07 | Derived stage/due/unlock history and preserved rewards | Engine §2–4, F14/F19/F23 |
| P0-08 | Private bank, recurrence and delayed review | Functional §4/8; Engine F20/F21/F24 |
| P0-09 | Parent summary, answers and actual subject time | Functional §2/8; Engine task contract |
| P0-10 | Bounded shared adventure | Functional §7; Engine F15–F18/F30 |
| P0-11 | Cached offline readiness and content versions | Functional §9; Engine F29; §5 offline gate |
| P0-12 | Privacy, IP and educational QA | CONTENT_QA; §4–5; no coverage override of these gates |
| P0-13 | Provisioned parent/child authentication | §3/5; staging identity/linking and reauthentication |
| P0-14 | Family/child authorization and RLS | Technical Decisions §8; §5 negative access tests |
| P0-15 | Idempotent snapshot backup and protected restore | §3/5; Engine F28 |
| P0-16 | Validated private paste-in intake | Engine §5/F34; private coverage/proceed gate in §4 |
| P0-17 | Offline PIN controls and online reset (replaces withdrawn tracing) | Functional §2; Engine F31 |
| P0-18 | Format-sensitive stages and delayed generic checks | Functional §4; Engine F03/F19/F32 |
| P0-19 | Landscape phone/tablet and real-device acceptance | §5; no automatic device-readiness claim |

**Hard release gates:** Each released subject needs a usable learning loop, reviewed shipped content/keys/media, scoped coverage report and recorded owner proceed decision as required, objective/evidence acceptance, child/parent resume and story behavior, offline/local-save resilience, privacy/IP QA and real-device acceptance. Independently verify dedicated staging/production identities **before any service write**; pass synthetic Auth/RLS, snapshot/recovery and data-protection gates before real records. Coverage permission does not authorize implementation, services, deployment, spending or merge.

## 3. Identity and protected backup policy

- **Audience:** One pre-provisioned **Registered parent** and **one Child Profile** (nickname only; no real name, birth date or school), with future-proof Family → Child → Learning Records ownership, server authorization and RLS. **No Guest Mode or public sign-up in Pilot**. Both Guest and multi-child management remain in the **long-term** feature scope. Invitation codes are Pilot-exempt; Google login plus email/password fallback and pre-provisioned identity linkage require a staging test before reliance. First use online; subsequent cached lessons work offline. If staging cannot safely link Google to the pre-provisioned identity with public sign-up disabled, Pilot uses email/password only and defers Google login to the later invitation flow.

- **Cloud backup:** IndexedDB is the offline working copy; authenticated Supabase versioned JSON snapshots are **automatic backups, not multi-device sync**. The Pilot assumes one primary device and one server-authoritative linear snapshot head. Persist pending uploads across restarts; first, duplicate and interrupted uploads must be idempotent. **Snapshot minimisation and protection gate:** Child-scoped snapshots may contain only minimal structured correct targets/statuses, controlled source type/date/opaque source-instance and batch references, parent review/amendment provenance, dated first/retry/correction and review events, active task cursors/target aggregates, structured completion, per-subject X/settings and practice-time records, rest-day state, checkpoint/shared story state, question flags/suspensions, exposure history and safe pending-upload metadata. Exclude `observed_wrong_form` (device-local only), parent PIN/hash, original worksheet images/text, copied source questions, free source descriptions, school/teacher details and local safety copies. Restore must retain suspension, exposure and checkpoint idempotence; repair falls back to the correct target alone if a wrong form is absent. Derive learning stages, due dates and dependent unlocks from compatible event history without revoking delivered story or past daily completions. Since snapshots now include **actual verified error targets** rather than catalogue IDs alone, the previously considered plain-JSON storage decision must be **re-evaluated under the unresolved TDD §9 data-protection gate before implementing or uploading real records**; this change does not pre-approve storing those targets in plaintext. Verify schema minimisation and privacy with synthetic fixtures. Follow this recovery procedure:

  1. On stale-base rejection, **stop upload**, preserve local changes and show **“backup paused — action needed”** alongside the last successful backup. Never silently rebase, replay the rejected upload or overwrite the cloud head.
  2. When a cloud head exists, this device or a second device can recover only by explicitly parent-approved restore of the **current cloud head**, after parent password reauthentication and successfully saving a private local safety copy, including pending local changes. Validate schema, size and content version; restore atomically. Cancellation or any failure preserves the working copy and leaves uploads paused.
  3. After successful restore, use that head as the upload base for subsequent work. If the head advances meanwhile, reject the stale upload and repeat recovery. Never silently discard local changes or roll back newer local data. **“Keep this device” overwrite/rebase is deferred.**
  4. **No-cloud-head exception:** On first use or after authorised deletion of all snapshots, the parent may explicitly confirm creation of a new first snapshot from the local working copy. Require parent reauthentication and a server-authorised, atomic check that the child has no committed head; an empty client cache, failed request or denied read is not proof. Only this case permits an upload without a matching base. Start a new history and do not replay the old pending upload; if a concurrent operation creates a head, reject the new-history attempt and use the existing-head recovery rule. After deletion, uploads remain paused until the parent deliberately confirms resuming backup; do not silently recreate deleted backups.

  No encrypted manual file export is included. **Safety-copy implementation gate:** Before the backup implementation PR, specify private local storage, lifetime, parent access/recovery/deletion controls and eviction limitations. Reopening a safety copy must not authorise overwriting an existing cloud head; keep uploads paused until the applicable recovery rule succeeds. Resolve this together with the data-protection gate in TDD §9; do not claim a safety copy is recoverable until its recovery path is implemented and tested.

- **Snapshot retention and deletion:** The authorised owner manually initiates pruning through the backend dashboard using an owner-only operation that enforces retention, retaining the **newest ten recoverable committed snapshots** (or all if fewer); ordinary clients have no delete permission. The latest snapshot is the server-authoritative committed head, not a client timestamp, an uncommitted upload or whichever row happens to remain last after pruning. Pruning must preserve that head and its ability to accept the next upload even if older ancestors are removed; reject unsafe pruning. Before the backup implementation PR, specify owner-only database operations for pruning and child-scoped all-snapshot deletion, protecting the head and newest ten during pruning and coordinating with concurrent uploads; do not rely on ad hoc row deletes or client RLS to enforce owner actions. Automated cleanup is deferred. On an authenticated parent request, the authorised owner manually initiates deletion of **all** that child's cloud snapshots through a separate owner-only operation in the backend dashboard; this explicit deletion request is an exception to ten-snapshot retention. Confirm the affected child and consequences privately and keep uploads paused until the parent deliberately resumes backup, so deletion is not silently undone. Deleting cloud backups does not itself erase local working/safety copies; their retention and deletion must be explained before implementation (see TDD §9).

Routine parent PIN, its device-only protection and reset are defined in Functional Design §2. It is never server authorization.

## 4. Content coverage and private proceed gates

Full scoped coverage is the goal. Chinese, Mathematics and English use **75% of their P2 in-scope outcomes** as the separate-subject release guideline; P3 chapters unlock progressively as authored and reviewed. Science uses **75% of its selected P3 inventory**. The owner's recorded proceed decision in Issue #3 may override coverage either way. Report grade/course, inventory version, numerator/denominator and missing areas. Keep Chinese/Higher Chinese coverage visible separately. Unmatched targets remain private pending_content. This guideline does not waive QA, source/rights checks, privacy, security, backup, device or data-protection requirements.

- **Pre-import, privacy-preserving group-coverage review (owner-confirmed):** The private list of verified individual character/word errors determines **which complete curriculum-level groups are authored first**, not a public one-to-one set of exercises for individual learner mistakes. Each published group is a coherent, original/rights-cleared set of reviewed exact-contrast, similar-error and generic-context material, named by curriculum topic only; public commits, PRs, fixtures and bundles must not name or tailor content to individual learner mistakes; author complete groups together to reduce inference from publication timing, without claiming to eliminate all aggregate inference. The runtime uses private verified targets to select exercises from these generic groups in the exact → similar → generic ladder. Before building paste-in import, privately compare distinct verified targets (not repeat occurrences) with reviewed group coverage, publish only a **rough aggregate** in Issue #3, and record the owner's **explicit proceed decision** there. This is a **procedural gate, not a numeric pass threshold**. Near-100% coverage is a long-term **content-building aim**, not a condition that every real mistake be covered before the Pilot can proceed. If coverage is weak, prioritise expanding complete groups without leaking which private target is absent; unmatched targets remain private `pending_content` until a reviewed group is available. Keep actual targets, error/context details, individual comparisons and learner outcomes out of GitHub and development artifacts. Batch sizing and reviewed-item counts per ladder step belong to release planning, not this Pilot decision.

Use original/rights-cleared generic curriculum groups, not learner-specific public exercises. Parent verifies external extraction before one in-app preview confirmation. App general-practice errors are recorded automatically. No original worksheet archive; unknown cause is not a fabricated misconception.

[Content QA](CONTENT_QA.md) retains all-disputed-item review, random 20% sampling of AI-agreed items and batch sign-off. A schema check does not attest educational quality. The source-verified leaf curriculum manifest is required before mapped extraction/import; the specification's course ID register is not a completed inventory.

## 5. Testing and release gates

1. **Learning:** Each subject has usable instructions, a complete content loop, feedback and short review. A learner can complete and revisit each released subject loop; later subjects need not ship simultaneously.
2. **Offline:** After initial online login, test cached app, refresh, answer/import, expired session, delayed review and return visit on real landscape phone/tablet; no network should block cached lessons.
3. **Resilience:** Follow the preserved cloud backup, conflict recovery, retention and deletion policy. Handle IndexedDB denial/eviction; backups are not multi-device sync or independent provider disaster recovery. Before implementation acceptance, use synthetic data to test:
   - First snapshot establishes exactly one head; duplicate/interrupted retries (including restart and a lost response after commit) neither duplicate snapshots nor lose pending work.
   - Competing/stale-base writes are rejected without moving the head; rejected devices stop uploads and retain local changes. A second device follows the cloud-restore-only policy.
   - Restore requires password reauthentication, explicit parent confirmation, a successful local safety copy and schema/size/content-version validation. Cancellation and every failure preserve local data and keep conflict uploads paused; no silent rollback.
   - Successful atomic cloud-head restore followed by new local work uploads successfully against that restored head. “Keep this device” is unavailable.
   - Pruning more than ten snapshots preserves the newest ten and the same authoritative head; head selection and the next upload still work after older ancestors are removed. Test fewer than ten and attempted head deletion; do not infer latest from client clocks or missing ancestry.
   - After authorised deletion of all snapshots, an existing device can resume with parent reauthentication and explicit confirmation of a new first snapshot, without stale-base deadlock. First-use and post-deletion creation atomically establish only one head; concurrent creation cannot replace an existing head. Failed/denied reads cannot enable new-history creation, and deletion is not silently undone.
   - Ordinary clients cannot delete snapshots; authorised manual pruning respects retention. Explicit parent-requested deletion removes all targeted child snapshots, leaves other children untouched and does not silently recreate backups. Local-copy handling follows the separately resolved data-protection gate.
   These are required future tests, not tests run by this documentation PR.
4. **Accuracy:** Review every answer key, pedagogical explanation, source licence and syllabus claim. Pilot formal responses are objective only; external writing is not scored.
5. **Privacy:** No real worksheets, names, school information, handwriting samples, personal history, credentials or production exports in repository files, bundles, CI artifacts, PR comments, screenshot fixtures or preview outputs.
6. **Security (Pilot):** Independently verify dedicated staging and production account/project identities from service metadata **before any service write**. Verify identity, staging Auth and cross-family/child RLS, backup collision/restore behavior, OAuth account linkage and key separation with synthetic data **before** transmitting any real learner data.
7. **Budget:** No unapproved paid plan or service. Avoid unnecessary CI triggers, duplicate jobs and costly cross-browser matrices in the Pilot.
8. **Data protection:** Resolve the pre-implementation open gate in [TDD §9](TECHNICAL_DESIGN_DECISIONS.md#9-validation-status-and-open-questions) before building real-record handling.
9. **Publication:** These Markdown specifications may be included in a public repository after document-level review. **Making any repository that has held private material public requires its own full history/secrets/refs/preview audit** under `TECHNICAL_DESIGN_DECISIONS.md`, or a new clean repository.

## 6. Change control

Pilot omissions do not cancel the full product. Coding and merge require separate authorization. The private coverage/proceed, data-protection and safety-copy gates remain unresolved until their actual checks and decisions are recorded. A documentation revision cannot mark them passed.
