# Turtle Academy Pilot v0.1 — Functional Design

**Status:** Consolidated owner decisions through 2026-10-15, incorporating the recorded PR #7 review decisions. This is a specification, not implementation, merge, deployment, real-data or spending authorization.

**Read with:** [Learning Engine and Acceptance](PILOT_LEARNING_ENGINE_SPEC.md). This file owns product behavior; that file owns concrete engineering proposals, field checks and acceptance definitions. [Pilot Scope](PILOT_V0_1_SCOPE.md) retains delivery/security gates; [Full Feature Scope](FEATURE_SCOPE.md) preserves long-term capabilities. No learner-specific data belongs in these files.

## 1. Scope and capability boundaries

Parent completes setup; child learns independently with occasional help. Initial delivery is Chinese first, followed by Science, Mathematics and English. This is release sequencing, not a compulsory child subject order. When all four are available, all four have required daily tasks.

| Subject | Pilot content requirement | Learning entry | Explicit capability limits |
| --- | --- | --- | --- |
| Chinese | P2 + P3 Chinese and Higher Chinese character recognition, language use, reading and sentence organisation | P2 imported mistakes/general practice; P3 general practice unlocked from the start, P3 mistake imports later | Complete writing, handwriting and oral practice outside app; listening deferred |
| Science | Seven selected P3 topic areas listed in section 5 | Guided observation and short teaching before independent tests; mistakes then enter repair | Formal answers all objective; free explanations and actual-experiment assessment deferred |
| Mathematics | All P2 knowledge points represented in objective practice; P3 locked in Pilot, with no P3 content-authoring requirement | Imported mistakes and general practice | No typed answers or automatic scoring of free workings; method selection is not independent written method production |
| English | P2 + P3 textual/visual practice across the eight families below | P2 imported mistakes/general practice; P3 general practice unlocked from the start, P3 mistake imports later | Complete writing and oral practice outside app; listening and independent typed spelling production deferred |

The objective is a usable daily-practice tool for one family, with full scoped coverage as the goal. Subjects release separately. Chinese, Mathematics and English use 75% of their P2 scoped outcomes as the release guideline. Chinese (including Higher Chinese) and English have P3 general practice unlocked from their first subject release, using reviewed available content; P3 mistake imports follow later. Mathematics stays P2-only in Pilot. Science releases when its first two topics (Diversity of living and non-living things; Classification of living things) meet the 75% guideline; the other five topics unlock in syllabus order as authored and reviewed. A recorded owner proceed decision in Issue #3 can override the coverage guideline either way, without waiving security, privacy or content QA. Reviewed coverage is not claimed delivered; objective selection does not measure every curriculum capability. Full-version omissions are not cancellations.

Post-Pilot Mathematics phase: build a teaching flow, then open P3 Mathematics. This is not a Pilot content requirement or implementation authorization.

No runtime AI/OCR, in-app worksheet image intake, tracing, automatic handwriting/open-writing scoring, PDF generation or mandatory paper-practice backfill. External private ChatGPT/Claude preparation is parent-initiated and reviewed; developing its extraction skill is later work, not code authorized here.

## 2. Setup, daily entry and task completion

Each subject has its own persistent parent setting **X: integer 6–19**, default **10**. No shared X, fixed five-target quota or three-consecutive-answer requirement. Changes apply to subsequently created tasks of that subject, not an active task's frozen configuration. Quotas and checkpoints use that subject's X. Record actual practice time per subject; the owner reviews defaults after each subject release. Count active time only while the subject screen is open and in use; teaching counts. Stop on pause, backgrounding or two or more minutes of inactivity. Do not describe planned workload estimates as measured daily duration.

Profile timezone is set at setup and can be changed by the parent in a PIN-protected setting. A timezone change must not create extra learning days, duplicate daily completion/story credit or bring review/target eligibility forward. Preserve completed-day and not-before evidence across the change; the engine specifies required tests.

UI, navigation and story language selectable Chinese/English. Chinese academic content stays Chinese; Science, Mathematics and English stay English. Parent setup does not recur every day. On a normal day's first entry, recommend a subject from pending review needs; child may change subject or resume paused work. Once all available required subjects are complete, exploration unlocks. Reopening that day allows exploration or optional further practice. No missed-day debt or score-based gate.

Parent chooses a **4–6 digit PIN** at setup for routine settings, import, records and amendments, including offline. Store only a salted slow hash on device; neither PIN nor hash enters snapshots or logs. Repeated wrong attempts cause growing back-off (for example, after five wrong attempts: one, two, then four minutes). Exiting parent mode locks it. Reset requires online account-password reauthentication; a new device configures its own local PIN. Sensitive restore/logout/delete retain online account-password reauthentication. PIN is not server authorization.

Parent can select **Today is a rest day**: direct exploration, X/progress/unfinished tasks preserved, no fabricated learning-completion or learning-story credit. Next day resumes normal requirements. No Pilot weekly timetable or daily manual setup.

Pause/resume preserves responses, formal count, current question/material, assistance/correction state and aggregation. Finishing yesterday's unfinished subject task satisfies today's requirement for that subject without another X. Other subjects retain their own daily completion status. Do not create historical catch-up tasks for missed days.

X counts formal **main questions**, not teaching, observation, retries or correction. A flagged/invalid question does not count and gets a replacement. Science/Mathematics normally finish at X after correction; incomplete stages remain for later work. Science may use shorter completion when no eligible content remains (section 5). Any subject with exhausted valid replacements ends at actual answered count and counts complete for the day, with a parent-visible reason; use the shorter-completion checkpoint rule.

Task opening gives a brief reminder to observe and check. No per-question self-check entry or forced confirmation. Child can edit before submission. Do not infer attention, diagnose disorders, penalise rechecking or promise classroom transfer.

## 3. Chinese and English whole-material tasks

Each language task requires **at least ceil(X/5) complete materials AND at least X main questions**. A reading passage, visual text or cloze passage is one material; rotate types across tasks. Count each independent reading question/cloze blank separately; a complete ordering response is one main question. Reading the stimulus is not an extra question.

| X | Minimum complete materials per language |
| --- | --- |
| 6–10 | 2 |
| 11–15 | 3 |
| 16–19 | 4 |

Prioritise complete materials that cover eligible due/repair targets. Use short questions for targets not appropriately covered by materials, and supplement if the total is below X. Do not mechanically stack X short repair questions plus the material quota. Unselected targets remain pending; clearing the whole bank today is not required. Whole-material completion can make actual question total exceed X; parent settings/summary must make that clear. Daily work is not exactly the sum of four X values: language tasks can exceed their X, and Science also has uncounted learning activities.

Pre-arrange the material structure and actual question total. Do not end a material because X is reached. User interruption remains resumable, not a system-imposed split. Finish **all first responses in a material before correctness feedback or correction**. Then address incorrect answers with the subject's hint, one retry and correction if necessary.

For a passage-assessed target, combine its relevant questions across **the entire task**, including related short questions: all must be independently first-correct to advance **once**, and the format-sensitive threshold in section 4 must also be met. Any wrong first response retains the starting stage; further prescribed practice starts no earlier than the day after task finalisation, not the earlier wrong-answer date. Preserve aggregate evidence across pauses; do not grant a partial pass after the first material. Subsequent assistance cannot turn the earlier failure into independent success.

The newly unlocked stage of a passage-assessed target waits until the **next task**, not later in the same task. Complete already arranged materials but do not add new repair for a failed target today. **Short-only** repair targets in all four subjects can advance when another formal slot remains, but the final new-context/transfer stage is always on a later calendar day than stage 2 clearance. The later-day final-stage gate also applies to passage-assessed targets; starting another task today does not override it. A target clears at most two stages per day across all tasks. A target assessed in a passage cannot also use this immediate route; the whole-task aggregate takes precedence. The engine identifies both routes explicitly.

## 4. Targets, repair and delayed review

| Subject | Independent progress unit | Three repair stages |
| --- | --- | --- |
| Chinese | Character/word, language point or reading skill plus supported error type; word-related types grouped visually, separate progress | Address original error → related confusion → broader application |
| Science | Knowledge point plus principal assessed skill and supported error type | Original concept/error → similar problem → new context |
| Mathematics | Knowledge point plus quantity relationship/method; error subdivision only with evidence | Original error → same relationship/method, different numbers → new situation with independent method selection |
| English | Specific vocabulary, grammar point or reading skill plus supported error type | Original error → new question for same point/skill → new-context transfer; later reading stages use new materials |

Stage 1 targets the recorded error, **not necessarily the original worksheet question**. No original worksheet text is required in the app. Record unknown cause rather than diagnose carelessness or a misconception from a final answer. A parent-verified actual error with known target can be practised without inventing its cause; ambiguous/unverified targets still await review and unmatched targets await content.

For short-question repair, **4+ option MCQ, matching and ordering require one independent first-correct response**; **true/false and 2–3-option MCQ require two independent first-correct responses on different questions at that stage**. Preserve evidence across pauses; a retry is not a new question. The threshold is OR: one qualifying high-option/matching/ordering success clears the stage without needing a second low-option success, or two distinct low-option successes clear it. Any wrong first response at that stage clears accumulated low-option partial successes; the low-option route then needs two fresh successes. Retries never count. Passage goals additionally require all task-related first responses correct; a high-option success cannot override a wrong response elsewhere in that aggregate. Immediate advancement applies to all four subjects within capacity, except passage deferral and the later-day final-stage gate. A wrong first answer receives hint/retry/correction and moves to another target. Further prescribed practice starts no earlier than the day after task finalisation. Hint-assisted correctness does not advance. Stage clearance, task completion, story progression and delayed evidence remain distinct; no permanent-mastery claim.

| Subject | Wrong-response help |
| --- | --- |
| Chinese | Brief targeted hint, one retry; if still wrong, concise distinction/explanation and correction for learned content |
| Science | Hint/retry; if still wrong, revisit relevant picture/observation, briefly explain why, correct |
| Mathematics | Prewritten relationship/diagram/calculation-check hint; if still wrong, short worked steps and one supported key-step selection |
| English | Generic recheck prompt and one retry; if still wrong, answer/explanation, including textual evidence for reading |

Supported correction is not independent evidence and does not count toward X. No formal learning-answer keyboard input in any subject; parent PIN, configuration and paste-in import are unaffected.

All subjects use correct-response review intervals **1 → 3 → 7 → 14 → 30 days, then every 30 days**, anchored to actual answering date. Completing the three stages starts delayed generic checks. Wrong delayed review retains generic stage, resets interval progression, and is eligible the day after task finalisation. After the next independent success, schedule a one-day interval again, then lengthen. No rollback to exact/similar after completed repair; no missed-day debt.

Select due review before incomplete repair before general practice, considering actual history and independent recurring errors. New imports start no earlier than the **day after app import**. Re-importing a same-type error preserves stage, appends genuinely independent observations and creates next-day priority; completed targets remain generic with reset interval. Same-source re-import/retries are not independent recurrence and are deduplicated.

General-practice first wrong responses receive help and **automatically enter the private bank**, without parent confirmation. Use internal source `app_practice`, never an import-facing value. A newly created target joins planning/aggregation from the next task, and no earlier than the day after the originating task finalises. Existing targets receive observations rather than duplicates; completed targets remain generic and reset interval. Recurrence is a general-practice first wrong response on a different calendar day, or a new independent import. Same-day app repeats are one observation; repair-stage and delayed-review failures remain attempt history and do not increment recurrence. General first-correct practice does not invent a mistake or skip an unassessed stage.

Prefer suitable unseen exercises. If fresh content is insufficient, permit later spaced reuse of old questions/materials, retain exposure records and distinguish repeated-item from new-context evidence. Repeated-item success alone is not proof of novel-context mastery. No runtime question generation. Preserve private pending-content fallback rather than silently discarding unmatched targets.

## 5. Science initial learning

Science covers the owner-selected P3 topics: **Diversity of living and non-living things; Classification of living things; Diversity of materials; Life cycles of plants; Life cycles of animals; Properties of magnets; Making and using magnets.** The first two form chapter 1; later chapters unlock in syllabus order as authored and reviewed, subject to prerequisites. Official inventory verification must confirm grade placement and exact outcomes before coverage claims; school sequencing may differ. There is no P2 Science course in this Pilot.

Science starts with learning, not an assumed imported error bank. Introduce **one small knowledge point** using pictures/short animation and guided selection/comparison/classification, then concise teaching, then **two different-context independent objective tests**. Formative observation/teaching is neither X nor an error-bank event. All Science text/feedback is English.

Both tests first-correct enter spaced review without creating a mistake. Either wrong triggers repair. Preserve partial successful testing across tasks when only one formal slot remains. After a wrong first test and answer-revealing help, a same-day second test cannot count as independent acquisition success; defer same-target testing to repair no earlier than the day after task finalisation.

When review and new/uncompleted acquisition coexist, review first but reserve two formal test positions for acquisition. All supported X values are at least six; the one-question-task conflict was removed by the owner's new X range. If no review is eligible and capacity remains, continue another small unlocked point with teaching plus two tests. If none is available, use suitable learned general practice, not untaught filler. For Science filler/general practice only, exclude items presented on any of the previous seven calendar days; if no eligible filler remains, end shorter. Due reviews are not subject to this restriction: prefer fresh suitable questions; if none exist, reuse the suitable item presented longest ago so review stays on time, recording repeated-item exposure rather than claiming novel transfer.

Content authors define prerequisites. Initial prerequisite failure blocks only dependent new knowledge, not unrelated learning. Completing the corresponding three-stage repair unlocks dependent learning without waiting for delayed intervals. Later generic-review failure does **not** re-lock already unlocked content.

If no eligible review/repair, unlocked acquisition or learned general practice remains, **end at actual count and count Science complete**; preserve next-day review and show parent the shortfall reason. This is not knowledge mastery. A Science day with zero eligible questions counts complete with a parent-visible reason and no story checkpoint. Shorter completion after actual work receives its safe stopping-point completion interaction without duplicated halfway events.

## 6. Exercise families and external practice

Chinese objective tasks cover recognition, language use, reading and sentence organisation. Use grade-readable instructions; optional pinyin for unavoidable difficult words only if it does not reveal the tested answer. No stem audio. Complete handwriting/writing/oral practice is parent-arranged externally; no app PDF, tracing, mandatory recording or progression dependency. Listening deferred.

Mathematics uses number/fraction **options**, matching and other objective interactions; no typed numerical responses. A worked correction uses selection, not scored free workings. An application question may assess solving through the final choice without claiming the app observed every step or independently verified method production.

English's approved exercise families are grammar, vocabulary, grammar/vocabulary cloze, spelling/editing recognition including punctuation, word order/sentence organisation, visual-text comprehension, short-passage comprehension, and writing foundations. Use choice, matching, word-bank selection and click-to-order; provide click alternatives to drag. Spelling recognition is not independent spelling production. Full writing/oral work remains external; listening deferred. Earlier input-tolerance preferences are future scope only.

## 7. Adventure and child feedback

Small explorable 2D hub, movable avatar, one companion, scripted dialogue and a few interactable objects. No expanded economy, open chat or mini-game catalogue. Four subjects share **one adventure mainline**, independent of subject order and correctness.

Language checkpoints use the **pre-arranged actual total**, halfway rounded up and completion, shown only after a material and its corrections finish. Other normal tasks use ceil(X/2) and X, after applicable correction. If checkpoints coincide at a safe boundary, combine presentation. Completion waits for actual task conditions, not merely reaching X midway through language materials. Story events are idempotent across pause/reload. Finite story ending preserves world changes and uses companion short interactions afterward, not endless new plots.

Child sees completion and learning progress, not overall score/accuracy. Rest-day exemption creates no learning-story credit. Question mistakes do not reduce story rewards. No punitive streaks, public leaderboards, gambling, paid virtual currency or diagnostic/efficacy claims.

## 8. Parent preparation, records and question issues

External ChatGPT/Claude preparation follows one versioned minimal contract. Parent verifies meaning outside the app, previews all entries inside it and confirms once; invalid entries are separately handled. Successful no-error extraction leads to general practice for previously learned subjects; failed extraction is not evidence of no mistakes. Science can learn without imports.

Imports retain **knowledge point, assessed skill, supported error type and necessary bounded wrong form**. `observed_wrong_form` stays device-local, never in snapshots; restored repair uses the correct target alone when the form is absent. Choose practice from reviewed generic content. No original scans, complete question/passage text, free context summaries, worksheet titles, teacher/school details or free source descriptions. Source provenance uses controlled source type/date and opaque app-generated source/batch references. The engine specifies validation and deduplication.

Parent dashboard defaults to summary, including actual practice time per subject, with expandable app-question first answers, retries, assistance and correction; show stages, due dates, material/question counts, shorter completion reason and backup status. These are app exercises, not a hidden original-worksheet archive. Parent can amend imports or invalidate records, retaining provenance and replaying derived progress. A changed target cannot inherit unrelated success. Replay recomputes learning stages, due dates and dependent unlocks only; already delivered story checkpoints and past daily completions are kept. No manual permanent-mastered switch.

Child can flag a suspected problem question, skip and receive a replacement. Flagged evidence/count is excluded; temporarily suspend that version for the child. Parent reviews and decides restore/disable; traceable recalculation follows. One child's flag cannot silently rewrite public content or other families' history. Exhausted replacements require a safe exceptional exit, not an endless loop.

## 9. Offline and protection boundaries

After initial online setup, cached lessons and ordinary PIN-protected local review/config/import work offline. Backup failure does not block locally saved learning; distinguish last successful backup, pending/paused uploads, and unsaved answers.

Local save failure: preserve answer in memory and retry; if retry still fails, allow warned continuation, with ordered idempotent background retries while the app is alive and on foreground return. Backoff, not a hot loop. Memory cannot survive reload/process termination; disclose possible loss. Do not bypass local-save/conflict rules with direct cloud writes.

Snapshots include the minimal task, settings/rest-day, timing, checkpoint/story, question flag/suspension, exposure and amendment state needed for recovery, in addition to learning events and targets. Exclude local wrong forms, PIN/hash and original worksheets. Keep existing IndexedDB working copy, authenticated versioned snapshot backup (not live multi-device sync), linear head and stale-upload pause, password reauthentication, current-head restore with private local safety copy, idempotence, newest-ten retention and server-confirmed no-head exception. Existing data-protection/safety-copy gates remain unresolved; this design does not approve plaintext actual-target storage or real uploads.

Generic content/teaching updates are centrally prepared and reviewed and distributed with app content updates, then cached offline. No parent generic-question-bank importer or content-pack management screen in Pilot. Stable versions protect paused tasks and historical evidence; failed downloads preserve usable cached content.

## 10. Decision consistency appendix

The owner decisions are recorded above; exact JSON taxonomy and implementation algorithms in the engine remain **engineering proposals**; the recorded active-time, timezone, evidence-reset and zero-item rules are confirmed behavior. These do not change confirmed behavior or authorize implementation.

| Former inconsistency | Resolution |
| --- | --- |
| Five targets / three consecutive successes / X=1–30 | No fixed target quota; format-sensitive independent evidence with language aggregate exception; per-subject X=6–19 |
| Language planned stages versus immediate Chinese progress | Passage targets aggregate/defer; short-only repair in all four subjects can advance within capacity, with final transfer on a later day |
| Same target correct in first material, wrong later | Whole-task aggregate uses starting stage; no early pass |
| Hint-assisted acquisition | Two independent Science checks; safety clarification prevents post-answer assistance becoming acquisition success |
| Old Fractions/Mystery-only units, tracing/free writing | P2 + P3 language practice, P2 Mathematics and seven selected P3 Science topics; objective answers only; paper/oral/full writing external, listening deferred |
| Exact 4X workload versus whole passages | Language minimum materials can exceed X; avoid stacking a full short-question quota |
| Original question archive versus minimal imports | Original worksheets remain outside app; target-based generic matching |
| Later prerequisite failure versus progress rollback | Keep generic stage and already unlocked content |
| Full-capability claim from objective question formats | Source-mapped scoped coverage with explicit assessment limits |

Complete curriculum inventories, reviewed content/answer keys, bilingual story/UI and prerequisite graphs remain **delivery work**, not delivered features. [Coverage acceptance](PILOT_LEARNING_ENGINE_SPEC.md#curriculum-coverage-acceptance) defines how to verify them. Existing privacy/security/device/data-protection gates remain before implementation acceptance.
