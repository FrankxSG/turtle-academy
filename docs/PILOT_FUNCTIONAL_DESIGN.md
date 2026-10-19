# Pilot: daily learning for one family

Confirmed behavior, not an implementation report. Chinese releases first, then Science, Mathematics and English; each releases separately. [README](../README.md) describes current code. [Technical decisions](TECHNICAL_DESIGN_DECISIONS.md) owns architecture/privacy; [full scope](FEATURE_SCOPE.md) retains later capabilities.

## 1. Scope

| Subject | Pilot |
| --- | --- |
| Chinese / Higher Chinese | P2 mistakes/general practice; P3 general practice from first release; P3 mistake imports later |
| Mathematics | P2 objective practice; P3 stays locked until a later teaching flow |
| English | P2 mistakes/general practice; P3 general practice from first release, imports later; grammar, vocabulary, cloze, spelling/editing, sentence order, visual text, comprehension, writing foundations |
| Science | P3 living/non-living diversity, living classification, materials, plant/animal life cycles, magnets' properties and making/using magnets |

One provisioned parent and nickname-only child; no Guest, public signup or multi-child UI. No runtime AI/OCR, worksheet scans in the app, typed formal answers, automated handwriting/free-writing/oral assessment, listening, tracing, PDF generation or weekly timetable. Writing/speaking production stays external and cannot be certified by recognition answers.

Full coverage remains the aim. Release guideline: 75% of P2 in-scope outcomes per language/Maths; Science initially its first two topics, later topics progressively. Show grade/course, denominator and missing areas; Chinese/Higher Chinese separately. Owner may override coverage in the release PR; never QA, rights, privacy or safety.

## 2. Daily use

- Per-subject X: integer 6–19, default 10; Chinese may reach 20. A changed X applies to new tasks, not paused ones. X counts formal first questions, not teaching, retry or correction.
- Suggest a subject with due work; child can choose another. Complete all available subjects before exploration. Optional extra practice earns no duplicate daily/story credit.
- Pause/resume preserves answers, help, task/version and progress. Finalizing yesterday's task satisfies today's subject requirement. No missed-day debt or punitive streaks.
- Rest day opens exploration, preserves progress/tasks/X and grants no fabricated learning credit. Active subject time includes teaching, stops on background/pause or two minutes idle.
- UI/story toggle Chinese/English; Chinese academic text stays Chinese, other subjects English. Objective choice/matching/word-bank/ordering only; click/tap alternatives to drag.
- Parent PIN: 4–6 digits, salted slow hash and increasing failed-attempt backoff, device-only; reset needs online same-account password reauthentication. New device sets its own PIN. Sensitive cloud restore/deletion requires online parent reauthentication.
- Parent-controlled timezone changes preserve day/checkpoint identities and eligibility bounds: no extra daily credit or earlier reviews.

## 3. Tasks and feedback

Language tasks contain at least ceil(X/5) complete materials AND at least X questions; rotate reading, visual text and cloze. Never cut a passage to meet X. Whole materials can exceed X; show actual size.

Short reviews/repairs for targets not covered by materials come first, capped at max(X − material questions, ceil(X/2)); due reviews precede repair, each repair target gets one slot before a second. Pending targets need not all fit today.

Collect all first answers in a material before feedback. A passage-assessed target aggregates its relevant answers across the entire task: all independently first-correct plus the stage threshold are required, advancement occurs once, and its next stage waits for another task. Do not mix immediate short-question advancement with that aggregate.

After a wrong first answer: hint, one retry, then supported correction/explanation. Assisted answers never advance. Preserve first responses before revealing help. Incorrect or flagged questions do not fabricate learning evidence. Exhausted replacements end at actual work with a visible reason, not an endless loop.

## 4. Repair and review

- Targets identify the actual character/word/skill/concept or Maths relationship/method; unknown cause stays unknown. Use verified compatible mappings; unmatched targets remain private `pending_content`.
- Stages: exact error → similar → new context. One independent first-correct 4+ option/matching/ordering answer OR two distinct low-option first-correct answers clears a stage; a wrong first answer resets low-option partial successes. A retry is never a new independent attempt.
- Short-only targets may advance within task capacity; at most two clearances per target/day. Final transfer always waits until a later day than stage 2. Failed-target practice waits until the day AFTER its task finalizes, not merely after its wrong answer.
- After repair, generic delayed checks use 1 → 3 → 7 → 14 → 30 → recurring 30 days, from actual responses. Failure stays generic; after the cooldown, the next independent success restarts the one-day interval. No permanent-mastery claim.
- Priority: due review → repair → general practice. General first-wrong answers create/update bank entries for a subsequent eligible task, never reinterpret the creating task as repair. Recurrence means a different-day general error or independent import; same-source retries and repair/review failures are not new recurrence.
- Reuse suitable older items when necessary; record exposure and never call cosmetic/repeated success novel transfer. General first-correct answers do not skip a repair stage.

## 5. Science

Each point has guided observation/short teaching and two independent tests in distinct contexts. Both first-correct enter review; either failure enters repair. After revealing help, a same-day second test cannot certify independent acquisition. Reserve two formal positions for acquisition when due work and learning coexist; preserve partial testing if capacity runs out.

Initial prerequisite failure blocks only dependent new learning until repair completes; later generic failure does not revoke existing unlocks. Filler excludes the previous seven calendar days (day eight eligible); due review may reuse the least-recently presented suitable item. No eligible content: shorten with a reason; zero questions still satisfies the subject but grants no story checkpoint.

## 6. Adventure and parent view

Small 2D island, movable avatar, one companion, shared scripted story and a few interactions. Deliver halfway/completion checkpoints at safe material/correction boundaries, combine coincident milestones and deduplicate across reload/devices. Shortened work grants its interaction once; after the story ends retain the world and use brief companion interactions. No correctness-based reward, scores, leaderboards or paid currency.

Parent summary shows per-subject actual time, stages/due dates, answers/retries/help and shorter-task reasons; expand detail as needed. Parent can amend/invalidate records; recompute evidence without inheriting success for a different target or revoking delivered story/past daily credit. Child can flag/skip a question for replacement; parent restore/disable is child/version-scoped, never a global bank rewrite.

## 7. Intake

External private ChatGPT/Claude preparation may receive full worksheet images; filtering identifying detail does not guarantee anonymity. Parent verifies extraction, previews once and confirms the valid subset. Invalid/uncertain/unmatched items stay explicit; cancel changes nothing. Verified no-error results allow general practice; failed/incomplete extraction never proves no mistakes.

Use the versioned curriculum manifest and existing validators; no imported identity, ownership, stage/mastery/due overrides, source text/images or school details. Wrong forms stay device-only. Dates use written work date, then nearest dated same-lesson work, otherwise processing date; disclose estimates. Historical dates never bypass day-after-import eligibility. Deduplicate same-source reimports; independent observations preserve stage and schedule priority from the next day.

Before enabling new mapped imports, privately compare verified targets to reviewed practice groups and record only a rough aggregate and owner proceed decision in the existing release record. Missing coverage remains pending; public content is original curriculum-level material, never a disclosed learner error set.

## 8. Release checks

Review shipped keys, hints, age suitability, sources and rights. Owner checks every disputed item and a random 20% of AI-agreed items per batch, then signs off that batch; validators/AI agreement do not prove educational quality. Generate inventories/review views from JSON rather than committing duplicate listings.

For each subject demonstrate the usable loop, honest learning evidence, resume and bounded workload with reviewed content. Use synthetic fixtures for ownership isolation, retries and recovery; test the actual landscape device/PWA offline, storage denial/eviction and safe updates. Keep synthetic acceptance identities separate from real use. Record evidence and unresolved checks in the release PR; merging docs passes none of these.

## 9. Offline, sync and recovery

After initial online setup, cached practice and ordinary PIN controls work without an offline time limit, including expired sessions. Re-sign-in is needed to sync, not to practise. Persist locally first; retry ordered failures with backoff. Distinguish memory-only unsaved answers (lost on reload) from durable changes waiting to upload (lost if the device is wiped). Warn honestly; never bypass failed local saves with direct cloud writes.

Owner-selected live sync (19 October) is not built yet:
- Sync learning records and the private pack under family/child authorization. Append-only answers/production events/amendments retain all evidence; derive stages/dates/unlocks from merged history. Preserve daily/story completion once.
- Share daily task identity per child/subject/day; retain presentations/answers from both offline devices and earlier pack/content versions needed by pinned tasks.
- Settings merge deterministically per field, retaining replaced values. Document clock-skew uncertainty: disconnected devices cannot guarantee true wall-clock edit order. Targets use traceable amendments, not silent overwrite.
- New/reset devices recover synced records/pack. Never attach another identity's local records. Wrong forms (including pack `observed`), PIN/hash, original worksheets and unbounded free descriptions never enter uploads/snapshots/logs; other devices repair from correct targets.
- Server-made snapshots: at most one/day plus before restore; keep newest ten. Parent password-confirmed restore reinstates settings/pack as new edits across devices, preserving answers/progress. Exclude bad practice through synchronized invalidations. Keep creation/restore/pruning/deletion auditable and family-scoped; clients cannot prune snapshots. Old client `upload_snapshot` is not the new sync contract.
- Deletion reaches offline devices and cannot resurrect erased family data from pending writes. Explain local-copy clearing. Synthetic tests must cover interruption/duplicate retry, two offline devices, reset recovery, identity isolation, excluded fields, restore/invalidation and deletion.

Generic content ships in app updates; pin active versions, preserve pending work and retain usable cached content after failed downloads. Real-record release conditions are in [technical decisions](TECHNICAL_DESIGN_DECISIONS.md#data-and-release); synthetic implementation does not wait for a separate policy-writing cycle.

