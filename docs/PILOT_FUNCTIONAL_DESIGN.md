# Turtle Academy Pilot v0.1 — Functional Design

**Status:** Complete functional-design package for documentation review, 2026-10-14. Owner decisions were confirmed through 2026-10-13. Not implementation, merge, deployment, real-data or spending authorization. This PR supersedes the earlier Chinese-only three-consecutive-answer design; until merged, main remains unchanged.

**Read with:** [Learning Engine and Acceptance](PILOT_LEARNING_ENGINE_SPEC.md). This file owns product behavior; that file owns concrete engineering proposals, field checks and acceptance definitions. [Pilot Scope](PILOT_V0_1_SCOPE.md) retains delivery/security gates; [Full Feature Scope](FEATURE_SCOPE.md) preserves long-term capabilities. No learner-specific data belongs in these files.

## 1. Scope and capability boundaries

Parent completes setup; child learns independently with occasional help. Initial delivery is Chinese first, followed by Science, Mathematics and English. This is release sequencing, not a compulsory child subject order. When all four are available, all four have required daily tasks.

| Subject | Pilot content requirement | Learning entry | Explicit capability limits |
| --- | --- | --- | --- |
| Chinese | P2 Chinese and Higher Chinese character recognition, language use, reading and sentence organisation | Previously learned content and privately imported mistakes; general practice if none | Complete writing, handwriting and oral practice outside app; listening deferred |
| Science | Living/non-living things and classification of living things | Guided observation and short teaching before independent tests; mistakes then enter repair | Formal answers all objective; free explanations and actual-experiment assessment deferred |
| Mathematics | All P2 knowledge points represented in objective practice | Imported mistakes and general practice | No typed answers or automatic scoring of free workings; method selection is not independent written method production |
| English | P2 textual/visual practice across the eight families below | Imported mistakes and general practice | Complete writing and oral practice outside app; listening and independent typed spelling production deferred |

Broad coverage is a delivery requirement, not a claim that the reviewed bank already exists or that objective selection measures every curriculum capability. Full-version omissions are not cancellations. The exact grade/course inventory needs the source and release gates in the engine specification.

No runtime AI/OCR, in-app worksheet image intake, tracing, automatic handwriting/open-writing scoring, PDF generation or mandatory paper-practice backfill. External private ChatGPT/Claude preparation is parent-initiated and reviewed; developing its extraction skill is later work, not code authorized here.

## 2. Setup, daily entry and task completion

One persistent parent setting **X: integer 6–19**, default **10**, shared across subjects. This is the literal interpretation of the owner's `5 < X < 20`; it supersedes 1–30. No fixed five-target quota. No three-consecutive-answer requirement. Changes apply to subsequently created tasks, not an active task's frozen configuration.

UI, navigation and story language selectable Chinese/English. Chinese academic content stays Chinese; Science, Mathematics and English stay English. Parent setup does not recur every day. On a normal day's first entry, recommend a subject from pending review needs; child may change subject or resume paused work. Once all available required subjects are complete, exploration unlocks. Reopening that day allows exploration or optional further practice. No missed-day debt or score-based gate.

Parent PIN is required for routine settings, import, records and amendments, including offline. Exiting parent mode locks it. Sensitive restore/logout/delete retain existing online account-password reauthentication requirements; PIN is not server authorization.

Parent can select **Today is a rest day**: direct exploration, X/progress/unfinished tasks preserved, no fabricated learning-completion or learning-story credit. Next day resumes normal requirements. No Pilot weekly timetable or daily manual setup.

Pause/resume preserves responses, formal count, current question/material, assistance/correction state and aggregation. Finishing yesterday's unfinished subject task satisfies today's requirement for that subject without another X. Other subjects retain their own daily completion status. Do not create historical catch-up tasks for missed days.

X counts formal **main questions**, not teaching, observation, retries or correction. A flagged/invalid question does not count and gets a replacement. Science/Mathematics normally finish at X after correction; incomplete stages remain for later work. Science may use the approved shorter completion when no eligible content remains (section 5).

Task opening gives a brief reminder to observe and check. No per-question self-check entry or forced confirmation. Child can edit before submission. Do not infer attention, diagnose disorders, penalise rechecking or promise classroom transfer.

## 3. Chinese and English whole-material tasks

Each language task requires **at least ceil(X/5) complete materials AND at least X main questions**. A reading passage, visual text or cloze passage is one material; rotate types across tasks. Count each independent reading question/cloze blank separately; a complete ordering response is one main question. Reading the stimulus is not an extra question.

| X | Minimum complete materials per language |
| --- | --- |
| 6–10 | 2 |
| 11–15 | 3 |
| 16–19 | 4 |

Prioritise complete materials that cover eligible due/repair targets. Use short questions for targets not appropriately covered by materials, and supplement if the total is below X. Do not mechanically stack X short repair questions plus the material quota. Unselected targets remain pending; clearing the whole bank today is not required. Whole-material completion can make actual question total exceed X; parent settings/summary must make that clear. Daily work is not exactly 4X, and Science also has uncounted learning activities.

Pre-arrange the material structure and actual question total. Do not end a material because X is reached. User interruption remains resumable, not a system-imposed split. Finish **all first responses in a material before correctness feedback or correction**. Then address incorrect answers with the subject's hint, one retry and correction if necessary.

For a passage-assessed target, combine its relevant questions across **the entire task**, including related short questions: all must be independently first-correct to advance **once**; any wrong first response retains the starting stage and earliest further prescribed practice is next day. Preserve aggregate evidence across pauses; do not grant a partial pass after the first material. Subsequent assistance cannot turn the earlier failure into independent success.

The newly unlocked stage of a passage-assessed target waits until the **next task**, not later in the same task. Complete already arranged materials but do not add new repair for a failed target today. Chinese **short-only** targets retain the earlier immediate next-stage workflow when another formal slot remains. A target assessed in a passage cannot also use this immediate route; the whole-task aggregate takes precedence. The engine identifies both routes explicitly.

## 4. Targets, repair and delayed review

| Subject | Independent progress unit | Three repair stages |
| --- | --- | --- |
| Chinese | Character/word, language point or reading skill plus supported error type; word-related types grouped visually, separate progress | Address original error → related confusion → broader application |
| Science | Knowledge point plus principal assessed skill and supported error type | Original concept/error → similar problem → new context |
| Mathematics | Knowledge point plus quantity relationship/method; error subdivision only with evidence | Original error → same relationship/method, different numbers → new situation with independent method selection |
| English | Specific vocabulary, grammar point or reading skill plus supported error type | Original error → new question for same point/skill → new-context transfer; later reading stages use new materials |

Stage 1 targets the recorded error, **not necessarily the original worksheet question**. No original worksheet text is required in the app. Record unknown cause rather than diagnose carelessness or a misconception from a final answer. A parent-verified actual error with known target can be practised without inventing its cause; ambiguous/unverified targets still await review and unmatched targets await content.

For single-question repair, one independent first-correct response advances the stage; immediate next-stage work is allowed within remaining slots except passage deferral. A wrong first answer receives hint/retry/correction and moves to another eligible target; earliest new prescribed practice of the wrong target is next calendar day. Hint-assisted correctness does not advance. Stage clearance, task completion, story progression and delayed evidence remain distinct; no permanent-mastery claim.

| Subject | Wrong-response help |
| --- | --- |
| Chinese | Brief targeted hint, one retry; if still wrong, concise distinction/explanation and correction for learned content |
| Science | Hint/retry; if still wrong, revisit relevant picture/observation, briefly explain why, correct |
| Mathematics | Prewritten relationship/diagram/calculation-check hint; if still wrong, short worked steps and one supported key-step selection |
| English | Generic recheck prompt and one retry; if still wrong, answer/explanation, including textual evidence for reading |

Supported correction is not independent evidence and does not count toward X. No formal learning-answer keyboard input in any subject; parent PIN, configuration and paste-in import are unaffected.

All subjects use correct-response review intervals **1 → 3 → 7 → 14 → 30 days, then every 30 days**, anchored to actual answering date. Completing the three stages starts delayed generic checks. Wrong delayed review retains generic stage, resets interval progression, and is eligible next day. After the next independent success, schedule a one-day interval again, then lengthen. No rollback to exact/similar after completed repair; no missed-day debt.

Select due review before incomplete repair before general practice, considering actual history and independent recurring errors. New imports start no earlier than the **day after app import**. Re-importing a same-type error preserves stage, appends genuinely independent observations and creates next-day priority; completed targets remain generic with reset interval. Same-source re-import/retries are not independent recurrence and are deduplicated.

General-practice first wrong responses receive help and **automatically enter the private bank**, without parent confirmation, for next-day repair. Existing targets receive observations rather than duplicates; completed targets remain generic and reset interval. General first-correct practice does not invent a private mistake or skip an unassessed repair stage.

Prefer suitable unseen exercises. If fresh content is insufficient, permit later spaced reuse of old questions/materials, retain exposure records and distinguish repeated-item from new-context evidence. Repeated-item success alone is not proof of novel-context mastery. No runtime question generation. Preserve private pending-content fallback rather than silently discarding unmatched targets.

## 5. Science initial learning

Science starts with learning, not an assumed imported error bank. Introduce **one small knowledge point** using pictures/short animation and guided selection/comparison/classification, then concise teaching, then **two different-context independent objective tests**. Formative observation/teaching is neither X nor an error-bank event. All Science text/feedback is English.

Both tests first-correct enter spaced review without creating a mistake. Either wrong triggers repair. Preserve partial successful testing across tasks when only one formal slot remains. Proposed safety clarification: after a wrong first test and revealing help, do not use a second same-target test that day to claim independent acquisition success; defer same-target testing into next-day repair.

When review and new/uncompleted acquisition coexist, review first but reserve two formal test positions for acquisition. All supported X values are at least six; the one-question-task conflict was removed by the owner's new X range. If no review is eligible and capacity remains, continue another small unlocked point with teaching plus two tests. If none is available, use suitable learned general practice, not untaught filler.

Content authors define prerequisites. Initial prerequisite failure blocks only dependent new knowledge, not unrelated learning. Completing the corresponding three-stage repair unlocks dependent learning without waiting for delayed intervals. Later generic-review failure does **not** re-lock already unlocked content.

If no eligible review/repair, unlocked acquisition or learned general practice remains, **end at actual count and count Science complete**; preserve next-day review and show parent the shortfall reason. This is not knowledge mastery. Proposed zero-item clarification: an empty eligible-content exemption has no learning-story credit. Shorter completion after actual work receives its safe stopping-point completion interaction without duplicated halfway events.

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

Imports retain **knowledge point, assessed skill, supported error type and necessary bounded wrong form**; choose practice from reviewed generic content. No original scans, complete question/passage text, free context summaries, worksheet titles, teacher/school details or free source descriptions. Source provenance uses controlled source type/date and opaque app-generated source/batch references. The engine specifies validation and deduplication.

Parent dashboard defaults to summary, with expandable app-question first answers, retries, assistance and correction; show stages, due dates, material/question counts, shorter completion reason and backup status. These are app exercises, not a hidden original-worksheet archive. Parent can amend imports or invalidate records, retaining provenance and replaying derived progress. A changed target cannot inherit unrelated success. No manual permanent-mastered switch.

Child can flag a suspected problem question, skip and receive a replacement. Flagged evidence/count is excluded; temporarily suspend that version for the child. Parent reviews and decides restore/disable; traceable recalculation follows. One child's flag cannot silently rewrite public content or other families' history. Exhausted replacements require a safe exceptional exit, not an endless loop.

## 9. Offline and protection boundaries

After initial online setup, cached lessons and ordinary PIN-protected local review/config/import work offline. Backup failure does not block locally saved learning; distinguish last successful backup, pending/paused uploads, and unsaved answers.

Local save failure: preserve answer in memory and retry; if retry still fails, allow warned continuation, with ordered idempotent background retries while the app is alive and on foreground return. Backoff, not a hot loop. Memory cannot survive reload/process termination; disclose possible loss. Do not bypass local-save/conflict rules with direct cloud writes.

Keep existing IndexedDB working copy, authenticated versioned snapshot backup (not live multi-device sync), linear head and stale-upload pause, password reauthentication, current-head restore with private local safety copy, idempotence, newest-ten retention and server-confirmed no-head exception. Existing data-protection/safety-copy gates remain unresolved; this design does not approve plaintext actual-target storage or real uploads.

Generic content/teaching updates are centrally prepared and reviewed and distributed with app content updates, then cached offline. No parent generic-question-bank importer or content-pack management screen in Pilot. Stable versions protect paused tasks and historical evidence; failed downloads preserve usable cached content.

## 10. Review status and consistency appendix

The owner decisions are recorded above; bounds, exact JSON field taxonomy, timezone handling and corner-case presentation in the engine are **proposals for documentation/engineering review**. These do not change confirmed behavior or authorize implementation.

| Former inconsistency | Resolution |
| --- | --- |
| Five targets / three consecutive successes / X=1–30 | No fixed target quota; one first-correct stage rule, with language aggregate exception; common X=6–19 |
| Language planned stages versus immediate Chinese progress | Passage targets aggregate/defer; short-only targets can advance within fixed available slots |
| Same target correct in first material, wrong later | Whole-task aggregate uses starting stage; no early pass |
| Hint-assisted acquisition | Two independent Science checks; safety clarification prevents post-answer assistance becoming acquisition success |
| Old Fractions/Mystery-only units, tracing/free writing | Expanded scoped content; objective answers only; paper/oral/full writing external, listening deferred |
| Exact 4X workload versus whole passages | Language minimum materials can exceed X; avoid stacking a full short-question quota |
| Original question archive versus minimal imports | Original worksheets remain outside app; target-based generic matching |
| Later prerequisite failure versus progress rollback | Keep generic stage and already unlocked content |
| Full-capability claim from objective question formats | Source-mapped scoped coverage with explicit assessment limits |

Complete curriculum inventories, reviewed content/answer keys, bilingual story/UI and prerequisite graphs remain **delivery work**, not delivered features. [Coverage acceptance](PILOT_LEARNING_ENGINE_SPEC.md#curriculum-coverage-acceptance) defines how to verify them. Existing privacy/security/device/data-protection gates remain before implementation acceptance.

Claude should review this entire package at the PR head, post ranked actionable findings and the reviewed SHA, and distinguish owner decisions from concrete proposals and unverified delivery. No independent review is claimed to have occurred. Keep the PR Draft; favorable documentation review is not merge or coding permission.
