# Pilot: daily learning for one family

The Pilot is a usable daily-practice tool for one family, with full scoped coverage as the goal. Chinese releases first, then Science, Mathematics and English; each subject releases separately, and every available subject has a daily task. Architecture and privacy: [technical decisions](TECHNICAL_DESIGN_DECISIONS.md). Long-term capabilities: [full scope](FEATURE_SCOPE.md). Test cases F01–F40 are listed in §12.

## 1. Scope

| Subject | Content | Entry | Limits |
| --- | --- | --- | --- |
| Chinese / Higher Chinese | P2 + P3 character recognition, language use, reading and sentence organisation | P2 imported mistakes and general practice; P3 general practice from first release; P3 mistake imports later | Handwriting, writing and oral practice outside the app; listening deferred |
| Science | Seven P3 topics (§5) | Guided observation and teaching before two independent tests; mistakes then enter repair | All formal answers objective; free explanations and real-experiment assessment deferred |
| Mathematics | All P2 knowledge points in objective practice | Imported mistakes and general practice | No typed answers or scoring of written workings; P3 locked until a post-Pilot teaching flow is built |
| English | P2 + P3 across eight families: grammar, vocabulary, grammar/vocabulary cloze, spelling/editing recognition (incl. punctuation), word order/sentence organisation, visual text, short-passage comprehension, writing foundations | P2 imported mistakes and general practice; P3 general practice from first release; P3 imports later | Full writing and oral outside the app; listening and typed spelling deferred |

Course IDs: `p2_chinese`, `p2_higher_chinese`, `p3_chinese`, `p3_higher_chinese`, `p2_mathematics`, `p2_english`, `p3_english`, `p3_science`. P3 language imports are rejected explicitly (not stored as pending). P3 Mathematics practice and import are disabled.

**Accounts:** one pre-provisioned parent and one child profile (nickname only), under Family → Child → Learning Records. No Guest, public sign-up or multi-child in the Pilot. Email/password sign-in; Google sign-in only after its link test passes.

**Not in the Pilot:** runtime AI/OCR, in-app worksheet scans, tracing, PDF generation, scoring of handwriting or open writing, mandatory paper practice, weekly timetable, parent generic-question importer, content-pack manager, large economy or open chat.

**Release guideline:** 75% of a subject's P2 in-scope outcomes (Chinese, Mathematics, English); Science 75% of the outcomes in its first two topics. The owner may override coverage either way; the override never waives answer-key, rights or privacy checks.

## 2. Setup and daily use

- **X per subject:** integer 6–19, default 10; Chinese up to 20. Set once, kept every day. A change applies to the next task, not a paused one. X counts formal main questions, not teaching, observation, retries or correction. A flagged question doesn't count and is replaced.
- **Daily entry:** recommend a subject from pending reviews; the child may choose another or resume paused work. When all available subjects are done, exploration opens; reopening that day allows exploration or optional extra practice (no extra daily or story credit). No missed-day debt, catch-up tasks or score gate.
- **Pause/resume** keeps answers, formal count, current question/material, help state and aggregation. Finishing yesterday's unfinished task satisfies today for that subject without another X.
- **Rest day** (parent): opens exploration, keeps X, progress and unfinished tasks, gives no learning or story credit. Normal requirements resume the next day.
- **Active time** per subject counts only while the subject screen is in use, including teaching; it stops on pause, backgrounding or two minutes idle, and resumes without double counting.
- **Timezone** is set at setup and changed only behind the parent PIN. A change never creates extra learning days, duplicate daily/story credit or earlier reviews.
- **Language:** UI, navigation and story in Chinese or English. Chinese content stays Chinese; Science, Mathematics and English content stays English.
- **Parent PIN:** 4–6 digits, chosen at setup, protects settings, import, records and amendments, including offline. Only a salted slow hash is stored on the device, never in backups or logs. Wrong attempts cause growing back-off (e.g. after five: 1, 2, then 4 minutes). Leaving parent mode locks it. Reset needs online account-password sign-in; a new device sets its own PIN. Restore, logout and deletion need the account password. The PIN is not server authorisation.
- **Task opening** gives a brief reminder to observe and check. No per-question self-check, no forced confirmation; the child can change an answer before submitting. No inferences about attention.

## 3. Tasks and feedback

- **Language tasks** (Chinese, English): at least ceil(X/5) complete materials (X 6–10: 2; 11–15: 3; 16–20: 4) and at least X main questions. A reading passage, visual text or cloze passage is one material; rotate types. Each reading question or cloze blank counts; a complete ordering response counts once.
- Short review/repair questions for targets the materials don't cover come first, up to max(X − material questions, ceil(X/2)). Due reviews before repair; each repair target gets one slot before any gets a second. Unselected targets wait. Materials covering due/repair targets are chosen first. Whole materials can push the total above X; the parent view shows the real size.
- The material plan and total are fixed when the task starts. A material is never cut short to meet X.
- **All first answers in a material come before any feedback.** Then wrong answers get the subject's help (below).
- **Passage-assessed targets:** combine all related first answers across the whole task, including related short questions. Advance once only if all are first-correct and the stage threshold (§4) is met; the next stage waits for the next task. A target assessed in a passage never uses the immediate short-question route.
- Science and Mathematics normally finish at X after correction. Any subject whose valid replacements run out ends at the actual count, counts as done, and shows the parent why.

| Subject | Help after a wrong first answer |
| --- | --- |
| Chinese | Brief targeted hint, one retry; if still wrong, a short distinction/explanation and correction |
| Science | Hint and retry; if still wrong, revisit the picture/observation, explain briefly, correct |
| Mathematics | Prewritten relationship/diagram/calculation-check hint; if still wrong, short worked steps and one supported key-step selection |
| English | Recheck prompt and one retry; if still wrong, the answer and explanation, with text evidence for reading |

Supported correction is never independent evidence and doesn't count towards X. First answers are saved before help is shown and never overwritten; a reload resumes the same question rather than creating a new first attempt.

## 4. Targets, repair and review

| Subject | Progress unit | Three repair stages |
| --- | --- | --- |
| Chinese | Character/word, language point or reading skill + supported error type (word types grouped visually, progress separate) | Original error → related confusion → broader application |
| Science | Knowledge point + assessed skill + error type | Original concept/error → similar problem → new context |
| Mathematics | Knowledge point + quantity relationship/method; finer error types only with evidence | Original error → same relationship, different numbers → new situation with independent method choice |
| English | Vocabulary, grammar point or reading skill + error type | Original error → new question, same point → new-context transfer; later reading stages use new materials |

- Stage 1 targets the recorded error, not the original worksheet question. Unknown causes are recorded as unknown, never diagnosed as carelessness or a misconception. A verified target with known content can be practised without a cause.
- **Stage clearance:** one independent first-correct answer on a 4+ option MCQ, matching or ordering question, **or** two on different true/false or 2–3 option questions. A wrong first answer at that stage resets the low-option count. Retries and hint-assisted answers never count.
- Short-only targets (all subjects) may advance within the same task while slots remain. At most two stage clears per target per day. The final new-context stage is always on a later calendar day than stage 2.
- After a failure, further practice on that target starts the day after the task finalises.
- **Delayed review:** after the three stages, generic checks at 1 → 3 → 7 → 14 → 30 days, then every 30, from actual answer dates. A wrong check keeps the generic stage, restarts at one day after the next independent success, and is eligible the day after the task finalises. No return to earlier stages; no permanent "mastered" flag.
- **Priority:** due review → incomplete repair → general practice, using actual history and independent recurrences.
- **Imports** start the day after import. A re-import of the same error type keeps the stage, adds genuinely independent observations and gets next-day priority; completed targets stay generic with their interval reset. Same-source re-imports are deduplicated.
- **App-caught mistakes:** a first wrong answer in general practice gets help and enters the private bank automatically (source `app_practice`), joining planning from the next task, no earlier than the next day. Existing targets get an observation, not a duplicate. A recurrence is a general-practice first wrong answer on a different day, or a new independent import; same-day repeats are one observation; repair and review failures are attempt history, not recurrence. A correct general answer never skips a repair stage.
- **Reuse:** prefer unseen questions. If fresh content runs out, reuse older ones later and record exposure; repeated-item success is not new-context evidence. No runtime question generation. Targets without content stay private as `pending_content`.

## 5. Science

Topics: **Diversity of living and non-living things; Classification of living things** (chapter 1); then Diversity of materials; Life cycles of plants; Life cycles of animals; Properties of magnets; Making and using magnets, unlocking in syllabus order as authored and reviewed. No P2 Science.

- Each small knowledge point: pictures/short animation and guided selection, comparison or classification, then concise teaching, then **two independent tests in different contexts**. Teaching is neither X nor mistake evidence. All Science text and feedback is in English.
- Both tests first-correct → spaced review, no mistake recorded. Either wrong → repair. Partial success is kept across tasks when only one slot remains. After a wrong first test and answer-revealing help, a same-day second test cannot count; repair starts the day after the task finalises.
- When review and new learning both apply, review comes first but two formal slots are kept for new learning. If nothing is due and capacity remains, continue with another unlocked point; otherwise use learned general practice, never untaught filler.
- **Filler** excludes items shown on any of the previous seven calendar days (day eight is eligible). Due reviews may reuse the suitable item shown longest ago, recorded as repeated exposure.
- **Prerequisites** (set by content authors): an initial failure blocks only dependent new knowledge; completing its three-stage repair unlocks it without waiting for delayed reviews. Later review failure never re-locks.
- Nothing eligible: end at the actual count, count Science done, show the reason. A zero-question day counts done with no story checkpoint.

## 6. Exercise types and external practice

- All formal answers are objective: choice, matching, word-bank selection or click-to-order, with click alternatives to drag. No keyboard answers in any subject (PIN, settings and paste-in import are unaffected).
- Chinese: grade-readable instructions; optional pinyin only for unavoidable hard words and only if it doesn't reveal the answer. No stem audio.
- Mathematics: number/fraction options and matching; a worked correction uses selection. A word problem assesses the final choice without claiming the app saw every step.
- English: spelling recognition is not spelling production.
- Handwriting, full writing and oral practice are arranged by the parent outside the app, with no PDF, tracing or recording requirement.

## 7. Adventure and child feedback

- Small explorable 2D island, movable avatar, one companion, scripted dialogue and a few interactive objects. One shared storyline across all four subjects, independent of subject order and correctness.
- Checkpoints: language tasks at halfway (rounded up) and completion of the planned total, shown after a material and its corrections finish; other tasks at ceil(X/2) and X after correction. Coinciding checkpoints combine. Story events happen once, even across pause and reload. A shortened task gets its completion interaction once.
- When the story ends, the world stays and the companion offers short interactions instead of new plot.
- The child sees completion and learning progress, not scores or accuracy. Mistakes never reduce story rewards. No punitive streaks, leaderboards, gambling or paid currency.

## 8. Parent view, records and question flags

- Summary by default: actual practice time per subject, stages, due dates, material/question counts, shorter-task reasons and backup status. Expand to see app questions with first answers, retries, help and correction. These are app exercises, not a worksheet archive.
- The parent can amend imports or invalidate records, keeping provenance. A changed target never inherits unrelated success. Recalculation changes stages, due dates and unlocks only; delivered story checkpoints and past daily completions stay. No manual "mastered" switch.
- The child can flag a suspected bad question, skip it and get a replacement. Flagged evidence is excluded and that version is suspended for this child until the parent restores or disables it. One child's flag never changes public content.

## 9. Importing mistakes

- The parent gives worksheet images to a private Claude or ChatGPT chat. The AI filters names, school, class, teacher comments and photos out of its output; the provider still sees the full image. The parent checks every item before import. Worksheets never enter the app.
- Imports keep only the knowledge point, assessed skill, supported error type and a necessary bounded wrong form. The wrong form stays on the device. Choose practice from reviewed generic content.
- **Private pack (built):** the private repo builds a pack of accepted anonymous cases and corrective questions; the parent loads it in the parent area. Re-loading adds nothing; cases become practice the next day.
- **Paste-in import (planned contract, `pilot-mistakes/1`):** one subject and course per batch; `curriculum_manifest_version` (or null when every item is pending); `extraction_result` = `errors_found`, `no_errors_found` or `incomplete`; at most 1 MiB and 1,000 items; unknown keys rejected.

| Item field | Rule |
| --- | --- |
| `candidate_ref` | Optional batch-local reference, ≤64 characters |
| `mapping_status` | `mapped` or `pending_content` |
| `knowledge_point_ref` | Known ID in that manifest version and course; null when pending |
| `target_kind` | Controlled kind per subject (character/word, language point, reading skill, concept, relationship/method, vocabulary/grammar) |
| `target_value` | The correct target; ≤8 code points for Chinese characters/words, ≤64 otherwise |
| `assessed_skill`, `error_type` | Controlled values; `unknown` when the evidence doesn't support a cause |
| `observed_wrong_form` | Optional, same length limits, device-only |
| `observation_date` | ISO date, not in the future: the date written on the work, else the nearest dated work on the same lesson, else the processing date; estimated dates are shown as estimated |
| `source_type` | `schoolwork`, `home_practice`, `external_assessment` or `other_reviewed_work` |

- Preview separates valid mapped, valid pending and invalid items. The parent confirms the valid subset once; excluded items stay visible; cancelling changes nothing. A verified no-error result allows general practice; an incomplete extraction never means "no mistakes". Ownership, stage, mastery or due fields in an import are rejected.
- Public content is original, curriculum-level material named by topic; the private pack holds the corrective questions for her actual mistakes.

## 10. Offline, saving, updates and sync

- After the first online sign-in, cached practice and PIN-protected parent functions work offline with no time limit, including after the session expires. Sign-in is needed only to sync.
- **Local save failure:** keep the answer in memory and retry; if it still fails, warn and allow continuing, with ordered background retries (with back-off) while the app is open and on return. Memory is lost on reload; say so. Never bypass a failed local save with a direct cloud write.
- **Content updates** are reviewed centrally and ship with app updates, then cached. Active tasks keep their content version; changed keys need explicit compatibility rules; failed downloads keep usable cached content.
- **Live sync (owner decision, 19 Oct 2026; not built):** learning records and the private mistake pack sync to every signed-in device under family/child authorisation.
  - Answers, production events and amendments are add-only; stages, dates and unlocks are recalculated from the merged history; completions and story only move forward.
  - A daily task has one ID per child, subject and day; every answer counts and the day is credited once.
  - Settings keep the latest edit per field (hybrid logical clock), keeping the replaced value; the app warns about large clock differences. Deletes are flags.
  - Never leave the device: wrong-answer text (including the pack's `observed` field), PIN/hash, worksheets, unbounded free text.
  - A new or reset device gets everything back after sign-in. Guest or other-account data is never uploaded.
  - Server-made snapshots, newest ten kept. A restore needs the password, brings back settings and the pack, and never removes answers; bad practice is excluded by invalidating specific records.

## 11. Content coverage and QA

- Coverage means reviewed, fully mapped in-app outcomes ÷ the verified in-scope inventory for that grade/course. Report grade/course, inventory version, numerator, denominator and missing areas; Chinese and Higher Chinese separately. A mapping counts only when its three stages, help and delayed checks are reviewed. Missing content stays in the denominator.
- Every shipped question needs a stable versioned ID, objective and source, format class, reviewed key, hint, explanation and original/licensed provenance.
- Owner QA per batch: check every disputed item and a random 20% of AI-agreed items, then sign off. AI agreement and validators don't prove educational quality.

## 12. Test cases

| ID | Required outcome |
| --- | --- |
| F01 | Distinct X per subject kept across days without daily setup |
| F02 | X changed during a paused task: that task keeps its X; the next task uses the new one |
| F03 | Short-only repair threshold, low-option reset, stage 1→2 today, transfer later, max two clears a day |
| F04 | Hint/retry success doesn't advance or count |
| F05 | Science teaching + two first-correct tests: teaching uncounted, review scheduled, no mistake |
| F06 | Prerequisite failure blocks dependent learning only; repair unlocks |
| F07 | Later review failure keeps unlocks, resets interval |
| F08 | Science single slot/pause keeps partial acquisition without duplicate first attempt |
| F09 | Science content exhausted: shorter completion with reason, targets kept |
| F10 | Language X=6/10/19 gives 2/2/4 materials; X=5/20 (non-Chinese) and non-integers rejected |
| F11 | All first answers in a material before any hint/answer |
| F12 | Same target right in one material, wrong in another: starting stage kept, eligible next day |
| F13 | All related first answers right: advance once, next stage next task |
| F14 | Task across midnight: count/evidence kept, credited once to the finalising day, failed target eligible tomorrow |
| F15 | Language total above X: checkpoints use planned total and safe boundaries |
| F16 | Coinciding checkpoints combine; no duplicate on reload |
| F17 | Any subject order shares one story; exploration after all subjects |
| F18 | Rest day keeps X, stages, tasks; no learning credit |
| F19 | Review intervals 1/3/7/14/30/30 from actual dates; failure handling; no missed-day debt |
| F20 | Same-source reimport deduplicated; independent import keeps stage; recurrence rules |
| F21 | General wrong answer creates/updates bank (`app_practice`), joins a later task |
| F22 | Flag: count/evidence excluded, replaced; exhausted replacements end at actual count; parent restore/disable |
| F23 | Amendment replay: no inherited success; story and past credit kept |
| F24 | Science due review reuse vs 7-day filler exclusion (day 7 excluded, day 8 eligible) |
| F25 | Objective answers only; click alternative to drag |
| F26 | UI/story language toggle leaves academic language unchanged |
| F27 | Repeated local save failure: warn, continue, ordered retry, honest reload warning |
| F28 | Backup failure doesn't block saved learning; restore keeps checkpoints/flags/exposure, excludes wrong forms/PIN |
| F29 | Update during a paused task: pinned version usable; failed download keeps cache |
| F30 | Story end keeps the world; companion interactions continue |
| F31 | PIN 4–6 digits, offline check and back-off, never logged; reset needs online password |
| F32 | High-option OR two low-option successes; reset rules; passage aggregate still required |
| F33 | 75% guideline uses P2 language/Maths outcomes and Science's first two topics |
| F34 | Import course/manifest/mapping validation; foreign IDs and invented mappings rejected |
| F35 | Seven Science topics; later five unlock in order with prerequisites |
| F36 | P3 language practice open, P3 language imports rejected, P3 Maths disabled |
| F37 | Timezone changes: no extra day, duplicate story or early review |
| F38 | Active time includes teaching, stops on pause/background/2 min idle, no double counting |
| F39 | Science wrong first test + help: same-day second test doesn't count |
| F40 | Zero-question Science day counts done without checkpoint; shortened task completion once |
