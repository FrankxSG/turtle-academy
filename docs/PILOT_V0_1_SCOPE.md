# Turtle Academy — Pilot v0.1 Scope

**Status:** Confirmed Pilot delivery requirements. Current implementation evidence is in the README and relevant PRs.

## 1. Objective and success criteria

Pilot is **a usable daily-practice tool for one family, with full scoped coverage as the goal**. Success is assessed through these questions:

- Can the parent set up each subject's X once, import reviewed minimal mistakes, inspect progress and safely correct records?
- Can the child independently complete or resume meaningful daily practice, receive help after mistakes and explore the small world afterward?
- Do stage/review decisions reflect independent evidence, preserve learning across pauses and avoid unsupported mastery claims?
- Do released subjects have sufficient reviewed coverage and variety for actual use, with missing content and workload visible?
- Do cached learning, local-save failure, live sync, backup/recovery and device access behave safely under the release gates?

Scope, [Functional Design](PILOT_FUNCTIONAL_DESIGN.md) and [Learning Engine and Acceptance](PILOT_LEARNING_ENGINE_SPEC.md) **together define the committed delivery slice**. Scope owns the objective, boundary and protected release gates; Functional Design owns behavior; the engine owns proposed contracts and acceptance definitions. [Technical Decisions](TECHNICAL_DESIGN_DECISIONS.md) retains security authority, and [Full Feature Scope](FEATURE_SCOPE.md) retains long-term commitments.

## 2. Delivery boundary

Chinese first, then Science, Mathematics and English is delivery sequencing, not compulsory child subject order. Each subject releases separately; all available subjects have daily tasks. Each subject has persistent X=6–19, default 10. Owner decision 2026-10-18: in the first pilot Chinese may go up to 20 (other subjects stay 6–19).

| Included in Pilot | Excluded or later |
| --- | --- |
| P2 + P3 Chinese/Higher Chinese and English; P2 Mathematics objective practice | P3 Mathematics in Pilot, typed answers, complete writing/oral assessment, listening |
| Seven selected P3 Science topic areas; authored chapters unlock progressively | P2 Science course, unreviewed teaching, scored free explanations |
| Private parent-reviewed minimal imports and app-caught general errors | In-app scans/OCR/runtime AI, original worksheet archive |
| Routine offline parent PIN, records, per-subject X/active time, guarded timezone changes and today-rest action | Multi-child/Guest, public signup, weekly timetable |
| Movable small 2D hub, one companion, shared scripted story and a few interactions | Full economy, large game/portfolio, open chat |
| Cached app content updates, offline working copy, live sync across the family's devices and snapshot history | Tracing/PDF generation, parent generic-bank importer |

Behavior and acceptance are specified directly in [Functional Design](PILOT_FUNCTIONAL_DESIGN.md) and [the engine acceptance cases](PILOT_LEARNING_ENGINE_SPEC.md#7-behavioral-acceptance-cases).

**Hard release gates:** Each released subject needs a usable learning loop, reviewed shipped content/keys/media, scoped coverage report and recorded owner proceed decision as required, objective/evidence acceptance, child/parent resume and story behavior, offline/local-save resilience, privacy/IP QA and real-device acceptance. Independently verify dedicated staging/production identities **before any service write**; pass synthetic Auth/RLS, sync/snapshot/recovery and data-protection gates before real records. Coverage permission does not authorize implementation, services, deployment, spending or merge.

## 3. Identity, live sync and backup policy

Owner decisions 2026-10-19 replace the earlier one-device snapshot-backup design: Supabase is the live database for the child's records, every signed-in family device stays in step, and the app keeps working offline. The rules below follow common offline-first sync practice.

- **Audience:** One pre-provisioned **Registered parent** and **one Child Profile** (nickname only; no real name, birth date or school), with future-proof Family → Child → Learning Records ownership, server authorization and RLS. The parent enters the child's nickname in the app at first setup. **No Guest Mode or public sign-up in Pilot**. Both Guest and multi-child management remain in the **long-term** feature scope. Invitation codes are Pilot-exempt. Google sign-in stays off until a staging test shows it links safely to the pre-provisioned identity with public sign-up disabled; until then, and if it cannot, Pilot uses email/password only and defers Google login to the later invitation flow. First use online; subsequent cached lessons work offline.

- **What syncs:** the learning records (settings, tasks, answer events, targets and their evidence, completions, rest days, story/checkpoint state, question flags/suspensions, exposure, amendments, timezone history and calendar guards, per-subject active practice time, and source references limited to controlled source type/date and opaque source/batch ids) **and** the private mistake pack (anonymous case register, corrective batches, private targets, case links and parent-observed production events). Each device rebuilds its practice content from the synced pack, so the corrective batches' practice text (questions, options, hints, explanations, materials and production prompts) syncs within per-field length limits. The pack's descriptive fields (`cause`, `correction_status` and the register `policy`) sync only as fixed values or short bounded text; anything else is rejected before upload, so no free description leaves the device. **Never synced:** the observed wrong form (`observed_wrong_form`, and the pack's `observed` case field, which is removed before upload and kept only on the device that loaded the pack), the authoring notes on pack items and materials (`rationale` and `provenance`, removed before upload because practice does not use them), the parent PIN and its hash, original worksheet images or text, copied source questions, free source descriptions and school/teacher details. Repair works from the correct target alone when the wrong form is absent; the parent's case table shows wrong forms only on the device that loaded the pack. Records that describe only the device (for example local schema metadata and cached content builds) stay local.

- **How it syncs:** every change is saved on the device first, then queued with a unique id and uploaded in order when online; repeats are ignored. The app syncs when it opens, when the connection returns and shortly after each change; no constant polling. Each device downloads everything changed since its last checkpoint. The server is the source of truth: clients write only through checked server functions that validate the allow-list above, and RLS limits reads to the parent's own family. Deletions are recorded as flags so offline devices learn about them.

- **When two devices change the same thing:**
  1. Answer events and parent-observed production events are add-only: every device's events are kept and duplicates are ignored.
  2. Learning stages, due dates and unlocks are derived from the merged event history on each device; they are never copied between devices. Daily completions and delivered story checkpoints only move forward and are never revoked by sync.
  3. A daily task has one id per child, subject and day, so two offline devices share it. Its frozen plan is the first version the server accepts. Questions the other device presented for that task are kept as well (presentations are add-only), so every answer still counts; the day is credited once.
  4. Editable records (settings, X, rest days, suspensions, nickname): select the winning edit **per field** by the server-accepted hybrid logical stamp (device time, counter, device id), after the bounded future-time check in Engine §6; ties resolve by device id. This is deterministic conflict ordering, not guaranteed true wall-clock order between disconnected devices. Fast or slow clocks can misorder edits: an earlier fast-clock edit uploaded later can still win when clamped at receipt. Warn about large clock differences and retain the replaced value in server-side history.
  5. Changes to mistake targets are never merged by latest edit: they are add-only amendments with provenance, and affected evidence is recomputed (Engine §2).
  6. Mistake pack: when two devices load different packs, the load with the higher server-accepted stamp (rule 4) becomes active on every device; earlier pack versions stay available so tasks pinned to them still work.

- **Offline and sign-in:** no offline time limit. Practice, PIN-protected parent actions and imports keep working offline or with an expired session; signing in is needed only to sync. The parent area shows the last successful sync and how many changes are waiting.

- **New or reset device:** after sign-in, the device downloads the family's synced records and pack, rebuilds its local copy and then syncs normally. Changes not yet uploaded are lost if the device is wiped first, so the app warns while changes are waiting. Records already on a device when it first signs in are uploaded and merged only if they were created under the same family; guest data and another account's data are never uploaded or attached (TDD §3).

- **Snapshot history:** in addition to live sync, the server automatically keeps versioned snapshots made from the live data: at most one per day, plus one taken immediately before any restore. Snapshots are kept in the same Supabase project in tables only server functions can write; the family's parent can list them. Snapshot creation, restore, pruning and deletion are recorded in an audit log. The authorised owner prunes them through an owner-only operation that keeps the **newest ten** (or all if fewer); clients cannot delete them. The parent can restore an earlier snapshot after online password reauthentication and explicit confirmation. Restore writes the snapshot's editable records and pack back as new edits, which every device then follows; answer events are never removed, so progress derived from them is kept. Restore does not roll back progress (owner decision 2026-10-19). To exclude bad practice, the parent invalidates the specific records instead (Functional Design §8); the invalidation syncs as an add-only amendment and progress is recalculated on every device. The earlier client snapshot upload (`upload_snapshot` and its single linear head) is retired.

- **Deletion:** synced records, pack data, edit history and snapshots are owned by the family and child and are deleted with them. On an authenticated parent request, the authorised owner deletes the child's data through an owner-only operation; other children are untouched. Deleting cloud data does not erase a device's local copy; the parent clears that in browser settings.

- **Data protection:** synced records include actual verified error targets and the pack's contents. Storing them in Supabase is covered by the unresolved [TDD §9](TECHNICAL_DESIGN_DECISIONS.md#9-validation-status-and-open-questions) data-protection gate and the owner's private policy sign-off; no real records are uploaded before that and before the synthetic tests in §5.3 pass.

Routine parent PIN, its device-only protection and reset are defined in Functional Design §2. It is never server authorization.

## 4. Content coverage and private proceed gates

Full scoped coverage is the goal. Chinese, Mathematics and English use **75% of their P2 in-scope outcomes** as the separate-subject release guideline. P3 Chinese/Higher Chinese and English general practice is unlocked from each subject's first release using reviewed available content; P3 mistake imports follow later. Mathematics is P2-only in Pilot, with P3 locked and no P3 content-authoring requirement. Science's initial release uses **75% of the in-scope outcomes in its first two topics** (Diversity of living and non-living things; Classification of living things); the other five topics unlock in syllabus order as authored and reviewed. The owner's recorded proceed decision in Issue #3 may override coverage either way. Report grade/course, inventory version, numerator/denominator and missing areas. Keep Chinese/Higher Chinese coverage visible separately. Unmatched targets remain private pending_content. This guideline does not waive QA, source/rights checks, privacy, security, backup, device or data-protection requirements.

- **Pre-import, privacy-preserving group-coverage review (owner-confirmed):** The private list of verified individual character/word errors determines **which complete curriculum-level groups are authored first**, not a public one-to-one set of exercises for individual learner mistakes. Each published group is a coherent, original/rights-cleared set of reviewed exact-contrast, similar-error and generic-context material, named by curriculum topic only; public commits, PRs, fixtures and bundles must not name or tailor content to individual learner mistakes; author complete groups together to reduce inference from publication timing, without claiming to eliminate all aggregate inference. The runtime uses private verified targets to select exercises from these generic groups in the exact → similar → generic ladder. Before building paste-in import, privately compare distinct verified targets (not repeat occurrences) with reviewed group coverage, publish only a **rough aggregate** in Issue #3, and record the owner's **explicit proceed decision** there. This is a **procedural gate, not a numeric pass threshold**. Near-100% coverage is a long-term **content-building aim**, not a condition that every real mistake be covered before the Pilot can proceed. If coverage is weak, prioritise expanding complete groups without leaking which private target is absent; unmatched targets remain private `pending_content` until a reviewed group is available. Keep actual targets, error/context details, individual comparisons and learner outcomes out of GitHub and development artifacts. Batch sizing and reviewed-item counts per ladder step belong to release planning, not this Pilot decision.

Use original/rights-cleared generic curriculum groups, not learner-specific public exercises. Parent verifies external extraction before one in-app preview confirmation. App general-practice errors are recorded automatically. No original worksheet archive; unknown cause is not a fabricated misconception.

[Content QA](CONTENT_QA.md) retains all-disputed-item review, random 20% sampling of AI-agreed items and batch sign-off. A schema check does not attest educational quality. The source-verified leaf curriculum manifest is required before mapped extraction/import; the specification's course ID register is not a completed inventory.

## 5. Testing and release gates

1. **Learning:** Each subject has usable instructions, a complete content loop, feedback and short review. A learner can complete and revisit each released subject loop; later subjects need not ship simultaneously.
2. **Offline:** After initial online login, test cached app, refresh, answer/import, expired session, delayed review and return visit on real landscape phone/tablet; no network should block cached lessons.
3. **Resilience:** Follow the live sync, conflict, snapshot, retention and deletion policy in §3. Handle IndexedDB denial/eviction; snapshots are rollback history, not independent provider disaster recovery. Before implementation acceptance, use synthetic data and at least two devices to test:
   - Duplicate and interrupted uploads (including restart and a lost response after commit) neither duplicate records nor lose queued changes.
   - Practice offline on two devices, then reconnect both: every answer from both is kept, derived stages/due dates match on both, and no daily completion or delivered story checkpoint is lost or duplicated.
   - Two offline devices start the same day's task: both share one task, every answer from both counts, and the day is credited once.
   - Same-field offline edits converge by server-accepted stamp, preserving replaced values in history; changes to different fields are both kept. Test an earlier fast-clock offline edit uploaded after a later normally timed edit: the earlier edit may win, but all devices converge and both values remain in history. Retrying an acknowledged edit cannot assign it a new stamp. Large clock differences show a warning.
   - Target changes made on two devices are both kept as amendments, and evidence is recomputed.
   - A deletion made on one device reaches a device that was offline when it happened.
   - A reset or new device signs in and gets back all synced records and the pack (without wrong forms), and repair practice works from the correct targets. Guest or other-account records on a device are never uploaded.
   - An expired session never blocks offline practice; changes queue and sync after sign-in.
   - Snapshot restore requires password reauthentication and explicit confirmation, reaches every device and keeps all answer events. A parent invalidation of specific answers made on one device reaches every device and recalculates progress there. Pruning keeps the newest ten; clients cannot delete snapshots.
   - Wrong forms, the pack's `observed`, `rationale` and `provenance` fields, free text outside the allow-list and the PIN/hash never appear in uploads, server tables, snapshots or logs.
   - Anonymous, other-family and spoofed-child reads and writes are refused, and every write path rejects data outside the allow-list.
   - Deleting the family or child removes its synced records, pack data, edit history and snapshots, and leaves other children untouched.
   These are required future tests, not tests run by this documentation PR.
4. **Accuracy:** Review every answer key, pedagogical explanation, source licence and syllabus claim. Pilot formal responses are objective only; external writing is not scored.
5. **Privacy:** No real worksheets, names, school information, handwriting samples, personal history, credentials or production exports in repository files, bundles, CI artifacts, PR comments, screenshot fixtures or preview outputs.
6. **Security (Pilot):** Independently verify dedicated staging and production account/project identities from service metadata **before any service write**. Verify identity, staging Auth and cross-family/child RLS, sync conflict/restore behavior, OAuth account linkage and key separation with synthetic data **before** transmitting any real learner data.
7. **Budget:** No unapproved paid plan or service. Avoid unnecessary CI triggers, duplicate jobs and costly cross-browser matrices in the Pilot.
8. **Data protection:** Resolve the pre-implementation open gate in [TDD §9](TECHNICAL_DESIGN_DECISIONS.md#9-validation-status-and-open-questions) before building real-record handling.
9. **Publication:** These Markdown specifications may be included in a public repository after document-level review. **Making any repository that has held private material public requires its own full history/secrets/refs/preview audit** under `TECHNICAL_DESIGN_DECISIONS.md`, or a new clean repository.

Pilot omissions remain in the full product scope. The private coverage/proceed and data-protection requirements need their recorded checks and decisions before they can be considered complete.
