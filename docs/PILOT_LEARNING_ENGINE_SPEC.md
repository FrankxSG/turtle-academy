# Turtle Academy Pilot v0.1 — Learning Engine and Acceptance

**Status:** Consolidated specification, 2026-10-15; no implementation or merge authorization.
**Authority:** [Functional design](PILOT_FUNCTIONAL_DESIGN.md) owns confirmed behavior. This document proposes implementable contracts and verification criteria. [Pilot scope](PILOT_V0_1_SCOPE.md) preserves security and release gates. Concrete field names, bounds and implementation algorithms below are review proposals, not an already implemented schema.

## 1. Separation of responsibilities

| Component | Responsibility | Prohibited shortcut |
| --- | --- | --- |
| Reviewed catalogue | Versioned objective exercises, materials, teaching, prerequisites and target mappings | Runtime AI generation or private learner content in public bundles |
| Subject adapter | Judge selected responses against reviewed keys; classify assistance | Infer a cause from a wrong final answer or grade free writing |
| Private event store | Preserve first responses, retries, correction, amendments and ordering | Overwrite first answers or turn reload into a new first attempt |
| Evidence reducer | Derive stage, due date and dependency state from compatible evidence | Permanent mastered flag or story credit as learning evidence |
| Planner | Eligibility, priority, whole-material quota, capacity and exposure history | Force every target into today's task or violate next-day failure eligibility |
| Adventure adapter | Idempotent structured checkpoints and shared story state | Correctness-dependent rewards |
| Persistence adapter | Local commits, retry queue and authorized snapshot recovery | Silent multi-device merge or direct cloud bypass on failed local save |

Evaluation and planning should accept explicit policy/content versions and an injectable clock. Maintain separate outcomes for objective correctness, independent stage clearance, assisted correction, task completion and adventure completion.

## 2. Catalogue and task contracts

Catalogue records require stable IDs/versions, subject/course/outcome references, assessed skill, task family, format class (4+ option MCQ/matching/ordering versus true-false/2–3 option MCQ), objective selected-answer key, hint/correction assets, approved QA/rights status and offline asset references. Materials contain an ordered complete set of formal questions. Science adds short teaching, two distinct-context acquisition tests and an acyclic prerequisite graph. Target mappings identify original-error, similar and generic practice pools.

Context/equivalence metadata must distinguish actual transfer from cosmetic number/image/option-order changes. Reuse is permitted but recorded as exposure, never automatically called novel evidence. No fixed three-question stock requirement remains. Supply must support mapped stages, varied application, delayed checks, replacements and whole-material scheduling.

| Private record | Proposed essential fields |
| --- | --- |
| Target | Opaque ID; subject/course; normalized target; assessed skill; supported error type or unknown cause; mapping/version; verification and amendment lineage |
| Observation | Target; controlled source type; observation date; app-generated source-instance/batch references; actual recurrence versus duplicate; internal app_practice source for app evidence |
| Task | ID; creation/finalisation dates; frozen subject-specific X; subject; content/policy version; planned materials and actual total; cursor; eligible target starting stages; completion/exemption reason; per-subject practice-time events |
| Presentation | Stable ID; task/item/version; role; target/stage; first-response eligibility; prior exposure |
| Attempt | Event ID; presentation; first/retry ordinal; selected answer IDs; outcome; assistance; timestamp/local sequence |
| Target assessment | Related task question IDs; format classes; eligible distinct first-success references; first-response outcomes; starting stage; aggregate finalized once; stage-clearance date and final-stage not-before date |
| Checkpoint | Stable task milestone claim; shared story sequence; delivery state |
| Amendment | Actor authorization context; invalidated/replaced record references; structured reason; reducer revision |

Family/child ownership comes from authenticated app context, not imported JSON. Use opaque random references, not worksheet-content hashes. Store public item references rather than original worksheet prompts. Do not merge visually similar characters or convert scripts automatically; normalize Unicode NFC and boundary whitespace without removing meaningful distinctions.

First-response history must be committed or queued before revealing help. Assistance/correction never overwrites it. Replayed event IDs are idempotent; an interrupted task resumes its presentation rather than manufacturing a new first attempt. Known assistance makes evidence practice-only; the system cannot detect all unobserved adult assistance.

## 3. Eligibility and task planning

1. Exclude invalid/suspended/unmapped evidence and targets not yet eligible.
2. Arrange due generic reviews before incomplete repair, then general practice; independent recurrence and actual history break ties, not fabricated diagnostics.
3. New imports become eligible the day after actual import. Failed-target further prescribed practice becomes eligible the day after the originating task finalises, not the earlier wrong-response date.
4. Chinese/English choose whole materials covering eligible targets first, meet ceil(X/5) complete materials and at least X formal questions, then fill necessary short slots. Rotate material families.
5. Science reserves two formal positions for eligible initial-learning tests when review and acquisition coexist; teaching uses no position. Remaining single capacity can preserve the second independent test for another task.
6. Freeze the task's subject-specific X, content version, material structure and actual formal total. Unstarted short-only repair slots in all subjects can select an unlocked stage within capacity; freeze the question when presented. Final transfer is eligible only on a later calendar day than stage 2 clearance; at most two stage clearances per target per day, across tasks.
7. A target assessed in any material uses whole-task aggregation, including related short questions. No mixed immediate/aggregate route for the same target.

Scheduled material questions are completed even if an earlier first response was wrong; they are existing assessment, not newly inserted same-day repair. All first answers in each material precede feedback. Finalize a target only at task completion: every related first answer correct is necessary for advancement once; the format-sensitive threshold also applies. Any wrong retains starting stage and becomes eligible the day after task finalisation. Pauses preserve unfinished aggregation; invalidations trigger replay, not an early pass.

General correct answers do not skip an existing repair stage just because they incidentally test the same skill. Role assignment is explicit before presentation. General wrong answers create or update a private target automatically using internal source `app_practice`. New targets join planning and target aggregation from a subsequent task, no earlier than the day after the originating task finalises; do not retroactively reinterpret the creating task's general responses as repair. Same-day app repeats are one observation. Recurrence is a first-try general error on a different calendar day or a genuinely independent import. Repair and delayed-review failures are attempts, not recurrence. Science formative observation and supported correction create no formal error evidence.

## 4. Repair, intervals and Science dependencies

Prescribed repair uses one independent first-correct response for 4+ option MCQ, matching and ordering; true/false and 2–3-option MCQ require two independent first-correct responses on different questions at the stage. Assistance never advances. Keep distinct-success evidence across pauses without manufacturing new first attempts. Mixed-format aggregation and an intervening wrong response remain unresolved (section 8).

Short-only repair in all four subjects can advance within remaining slots. Final new-context/transfer work starts only on a later calendar day than stage 2 clearance, even if another task starts that day; at most two stages clear per target per day. Passage-assessed targets also wait for a subsequent task and must satisfy this later-day final-stage gate. Failure prompts one retry then correction if still wrong, moves to another target and sets further practice eligibility to the day after task finalisation.

Three stages complete into generic delayed checks, not permanent mastery. Correct checks schedule 1, 3, 7, 14, 30 days, then recurring 30 days, measured from actual response dates. Wrong generic checks keep generic stage, reset interval sequence and become eligible the day after task finalisation; next independent success schedules one day. Late attendance shifts from actual answering date without missed-day debt.

Science acquisition needs two distinct-context independent first-correct tests. Failed acquisition enters three-stage repair; dependent new learning waits for that repair, unrelated learning can continue. Later generic failure preserves existing unlocks. Proposed safety interpretation: answer-revealing help after the first acquisition failure cannot be followed by a same-day second test treated as independent acquisition success.

Science fallback can reuse only items not presented in the last seven days. An earlier due date does not make a blocked item eligible; keep the review pending and use fresh suitable content or shorter completion. If Science has no eligible review/repair, unlocked acquisition or learned general practice, finish at actual count with a parent-visible reason. Proposed zero-question exemption awards no learning-story checkpoint. A shortened task with actual work receives its completion interaction at a safe boundary, deduplicated against any delivered halfway checkpoint. Exhausted valid replacements use this actual-count completion rule in every subject; no endless replenishment loop.

Calendar policy proposal: retain a stable profile timezone initialized at setup; use that timezone for eligibility and actual response dates. Travel or clock anomalies must not manufacture delayed evidence or duplicate daily rewards. Exact timezone-change controls remain an engineering-review question, not a newly confirmed parent feature.

## 5. External preparation and import envelope

This is a proposed shared contract for a future private ChatGPT/Claude extraction skill and app validator. It is not a skill delivered by this PR. Parent semantically verifies each candidate outside the app, then confirms one in-app preview. Never send original scans to the app/backend or commit them.

| Envelope field | Proposed validation |
| --- | --- |
| schema_version | Exact `pilot-mistakes/1`; reject unsupported versions |
| subject | One supported subject per batch; course must match |
| course | One supported grade/course ID from the course register below |
| curriculum_manifest_version | Known published manifest version for mapped items; JSON null when no manifest is used and all items are pending_content |
| extraction_result | `errors_found`, `no_errors_found` or `incomplete` |
| items | Array; nonempty for errors_found; empty for verified no_errors_found; incomplete is not a clean no-error result |

### Course register and curriculum IDs

These proposed stable course IDs are the external skill's accepted course list; they are curriculum references, not learner identifiers.

| subject | course IDs |
| --- | --- |
| chinese | p2_chinese, p2_higher_chinese, p3_chinese, p3_higher_chinese |
| mathematics | p2_mathematics, p3_mathematics |
| english | p2_english, p3_english |
| science | p3_science |

The approved public content release must publish a versioned **curriculum manifest** containing every accepted knowledge_point_ref with subject, course, grade, outcome/source and mapping status. Extraction and app validation use the same manifest version; add envelope curriculum_manifest_version when mapping to a released manifest. With no approved manifest, set that field to JSON null and emit pending_content candidates with knowledge_point_ref null. Do not fabricate a complete leaf-ID list in this design draft. The actual source-verified inventory/IDs are unfinished content work, required before mapped extraction/import is usable. Structural ID syntax alone is not proof of a valid mapping.

Proposed safety bounds: at most 1 MiB decoded JSON and 1,000 candidates; these are intake limits, not question or learning quotas. Reject malformed/oversized/version-incompatible envelopes before mutation. Unknown keys are rejected rather than retained. Markdown wrappers, executable markup and arbitrary nested attachments are not part of the format. Render accepted text inertly.

| Candidate field | Meaning and checks |
| --- | --- |
| candidate_ref | Optional batch-local reference, maximum 64 characters; no identity or authorization meaning |
| mapping_status | Exact mapped or pending_content |
| knowledge_point_ref | For mapped: known ID in the approved versioned curriculum manifest, matching subject/course. For pending_content: JSON null, not a guessed ID or free-text label |
| target_kind | Controlled character/word/language point/reading skill, Science concept, Mathematics relationship/method, or English vocabulary/grammar/reading skill |
| target_value | Necessary correct target; proposed maximum 8 Unicode code points for Chinese character/word kinds, 64 for other kinds; no full question/passage or context summary |
| assessed_skill | Controlled skill where applicable; explicit not-applicable where legitimate |
| error_type | Supported controlled type; unknown cause if evidence does not justify classification |
| observed_wrong_form | Optional necessary bounded form; same proposed per-kind limits as target_value; device-local only, excluded from snapshots. No full source question or meaningless option-number-only record |
| observation_date | Valid ISO calendar date provided/verified by parent; future dates require correction; do not silently infer from upload time |
| source_type | Fixed list: schoolwork, home_practice, external_assessment, other_reviewed_work |

No learner name, school/teacher identifiers, worksheet titles, free source descriptions, original images/text, stage/mastery/due fields or foreign ownership IDs. Structural validation cannot guarantee anonymization or semantic correctness. A bounded string can still be sensitive; privacy review remains required. Do not log raw invalid payloads in public diagnostics.

At preview distinguish valid mapped, valid pending-content and invalid candidates. Parent can confirm the displayed valid subset once while excluded items remain explicitly unresolved; do not silently drop them or partially mutate before confirmation. Cancellation leaves records unchanged. No-error extraction enters general practice only after parent verification; incomplete extraction never implies a mistake-free worksheet.

App generates private source/batch IDs. Parent identifies a new source or the same earlier source; same-source target/error reimports are deduplicated. Independent new source observations preserve stage and create next-day priority; generic-stage recurrence resets intervals, not repair stage. Historical observation dates never bypass day-after-import eligibility. Known target with unknown cause can practise; unknown target must not be silently guessed.

Amendments preserve provenance, invalidate affected evidence and recompute derived state. Changed target/skill cannot inherit unrelated success. Replay recomputes learning stages, due dates and dependent unlocks, but never revokes already delivered story checkpoints or past daily completions. Marking an invalid app question removes its count/evidence and replaces it; suspensions are child/version scoped pending parent action, not global catalogue rewrites.

## 6. Persistence, updates and protected operations

Ordered idempotent local commands and in-memory pending writes support warning-and-continue after retry failure. Retry with backoff while alive and on foreground return. Unsaved memory can be lost on reload/process termination; disclose that limitation. Do not claim background survival or guaranteed preservation.

Backup failure alone permits locally saved learning and shows parent status. Snapshots include minimal target/event history, task cursors/aggregation, per-subject X and practice time, rest-day status, delivered/pending checkpoints and shared story state, question flags/suspensions, exposure history, amendment lineage and safe pending-upload metadata. Exclude `observed_wrong_form`, PIN/hash, original worksheets and free source descriptions. Correct targets alone support restored repair. Preserve the remaining snapshot protection policy, linear-head conflict pause, authenticated ownership, online password reauthentication, current-head restore, validated atomic replacement and successfully saved private safety copy. Retain server-authorized no-head exception and newest-ten owner-managed retention. No keep-device overwrite/rebase or automatic recreation after deletion.

Actual-target storage protection and safety-copy recovery/lifetime remain unresolved gates under technical decisions; this specification does not choose plaintext or authorize real uploads. Offline PIN is not server authorization. Parent chooses 4–6 digits; persist only a salted slow hash on device, never snapshots/logs. Growing wrong-attempt back-off and online account-password reset are required. Specify the exact slow-hash parameters and persistent back-off behavior before implementation; do not claim encryption of learner records from hashing the PIN.

Content is centrally reviewed and released with app updates. Active tasks pin cached versions and assets; updates apply safely between tasks. Changed/retired keys require explicit compatibility/invalidation rules, not retroactive silent grading. Failed downloads preserve usable cached content. No parent generic-bank importer.

## 7. Behavioral acceptance cases

These are **required future tests**, not executed app tests. Fixtures must be synthetic and publication-safe.

| ID | Scenario and required outcome |
| --- | --- |
| F01 | Set distinct X values per subject once; subsequent days retain each value without daily setup; no shared-setting overwrite |
| F02 | Change one subject's X during its paused task; active task keeps frozen X, its next task uses new X, other subjects unchanged |
| F03 | All subjects' short-only repair meets format threshold; stages 1→2 may occur today, stage 3 must wait a later day; max two stage clearances per target/day |
| F04 | Hint/retry/correction succeeds; stage does not advance and retry is not counted |
| F05 | Science teaching plus two new-context first-correct tests; teaching uncounted, delayed review scheduled without error |
| F06 | Initial prerequisite fails; dependent learning blocked, unrelated learning available; three-stage repair unlocks |
| F07 | Later prerequisite generic failure preserves already unlocked content and resets interval |
| F08 | Science final single slot/pause preserves partial acquisition and resumes without duplicate first attempt |
| F09 | Science eligible content exhausted; shorter completion counts subject, reason shown, next-day targets retained |
| F10 | Each language uses its own X=6/10/19 for 2/2/4 complete materials and checkpoints; independently reject X=5/20 and nonintegers |
| F11 | Whole material first answers collected before hints/answers; no premature clue disclosure |
| F12 | Same goal correct in one material, wrong in another; retain starting stage and next-day eligibility |
| F13 | All task-related goal questions first-correct; advance once, next stage waits next task |
| F14 | Task spans midnight: preserve count/evidence; finalise today, satisfy today's subject requirement; failed target eligible tomorrow, not today; no duplicated checkpoint |
| F15 | Language actual total exceeds X; checkpoints use planned actual total and material/correction boundaries |
| F16 | Half/full checkpoints coincide; combined presentation and no duplicate story on resume/reload |
| F17 | Different subject orders share one adventure; exploration waits for all available required subjects |
| F18 | Today rest preserves X, stages and unfinished tasks; exploration allowed, no fabricated learning credit |
| F19 | Actual-date 1/3/7/14/30/30 review; failure stays generic, retry after task-finalisation day and one-day restart; no missed-day debt |
| F20 | Same-source reimport deduplicates; independent import preserves stage; app recurrence only across different-day general errors, never repair/review failures |
| F21 | General first-wrong auto-creates/updates bank using internal app_practice; new target joins a later eligible task, not current aggregation; completed goal remains generic |
| F22 | Child flags item: exclude count/evidence and replace; exhausted replacements finish subject at actual count with reason; child/version suspension, parent restore/disable |
| F23 | Parent changes/invalidates import: replay learning evidence, no unrelated inherited clearance; delivered story and past daily completion retained |
| F24 | Fresh content exhausted: Science reuse excludes last-seven-day presentations; review remains pending if no eligible item; shorter completion, exposure recorded |
| F25 | All formal subject answers objective selection/matching/ordering; no answer keyboard; click alternative to drag |
| F26 | UI/story language toggle; Chinese academic Chinese and other academic English unchanged |
| F27 | Local save fails repeatedly; retain memory, warn and continue, ordered background retry, honest reload-loss warning |
| F28 | Backup failure/stale head permits saved learning; restore state includes checkpoints/suspensions/exposure, excludes wrong forms/PIN; target-only repair works |
| F29 | Update during paused task; pinned version usable, key changes explicit, failed download preserves cache |
| F30 | Preset story ends; world preserved and short companion interaction replaces further new plot |
| F31 | PIN accepts only 4–6 digits; offline verification/back-off; no PIN/hash in logs/snapshots; reset needs online account-password reauthentication |
| F32 | One distinct first-correct for 4+ MCQ/matching/ordering; two for true-false/2–3 MCQ; retries do not count; passage all-first-correct remains required |
| F33 | Subject-specific 75% guideline and recorded coverage override; QA/security/privacy gates never waived; P3 chapters reviewed before unlocking |
| F34 | Course/manifest/candidate-level reference and mapped-versus-null-pending contract validated; reject foreign-course IDs or invented mappings |
| F35 | Science has only P3 course and seven scoped topic areas; first chapter and later authored chapters follow verified sequence/prerequisites |

Field checks must additionally cover unsupported version, unknown fields, wrong subject/course, oversize payload, malformed date, future date, old observation with current import, correct no-error versus incomplete result, cancellation, valid-subset confirmation, duplicate batch retries, unauthorized imported ownership/stage fields, bounded wrong-form privacy and unknown-cause/pending-target separation.

## Curriculum coverage acceptance

Coverage means all verified **in-app scoped outcomes**, not every curriculum capability. Reviewers must approve a versioned leaf-outcome inventory with source/page, grade/course, knowledge point, assessed ability, interaction family, reviewed content IDs, stage mappings, hint/correction, offline media, rights/QA sign-off and explicit limitations.

- Chinese: P2 + P3 Chinese plus Higher Chinese scoped recognition, language use, reading and sentence organisation.
- Mathematics: all P2 + P3 knowledge points, objective assessment limits labeled; no independent free-working claim.
- English: all P2 + P3 in-app textual/visual outcomes across the eight approved families; listening deferred and full writing/oral external.
- Science: the seven selected P3 topic areas in Functional Design §5; teaching, two-context testing, chapter order, prerequisites and three-stage repair reviewed. No P2 Science.

**Full scoped coverage is the goal, not a whole-Pilot simultaneous-release prerequisite.** Subjects release separately. Chinese, Mathematics and English use 75% of their P2 in-scope outcomes as the guideline; P3 chapters then unlock as authored and reviewed. Science uses 75% of its scoped P3 outcomes as the guideline. The owner's explicit proceed decision recorded in Issue #3 can override coverage either way, specifying subject, grade, inventory version, achieved coverage and missing areas.

Coverage percentage is reviewed and fully mapped leaf outcomes divided by the verified in-scope inventory for that release grade/course. Track Chinese and Higher Chinese courses separately; report denominators rather than hiding omissions in an aggregate. A target mapping counts only when its required stages/help and usable content are reviewed. Missing content remains in the denominator and unmatched targets remain private pending_content. Zero unreviewed shipped mappings, rights/privacy blockers or unlabeled limitations remains mandatory. Coverage override does not waive QA, security, data-protection, backup or device gates. Exact item counts are planning, not a new owner quota. A checklist validates references but does not prove educational quality or MOE alignment.

Every mapped repair target needs reviewed original-error/similar/generic variations and delayed checks that assess its actual skill rather than a recognition shortcut. Language material and replacement supply must support the approved task quotas without habitual short-question stacking. Do not claim the current repository bank satisfies coverage: the full leaf inventory and reviewed content are not yet delivered.

### Curriculum/source audit register

References to be verified during inventory authoring; official source availability is not a completed coverage audit. Direct MOE retrieval was blocked in prior research, so secondary official school material must not be treated as complete substitute syllabuses.

| Area | Official reference to verify | Audit status |
| --- | --- | --- |
| Chinese | [Primary Chinese syllabus 2024](https://www.moe.gov.sg/-/media/files/primary/cl-syllabus-pri-2024.pdf) | Confirm P2/P3 cohort/course applicability and HCL mapping |
| Mathematics | [2021 Primary Mathematics, updated October 2025](https://www.moe.gov.sg/api/media/92bff26d-b2b4-4535-b868-b8415c744b91/2021-Primary-Mathematics-Syllabus-P1-to-P6-Updated-October-2025.pdf) | Verify P2/P3 leaf outcomes against source |
| English | [Primary English 2020](https://www.moe.gov.sg/-/media/files/primary/2020-english-language-primary.ashx), [official school curriculum](https://www.acspri.moe.edu.sg/our-curriculum/english-language/) | Textual/visual scope and deferred abilities must remain explicit |
| Science | [Primary Science 2023, May 2024 revision](https://www.moe.gov.sg/-/media/files/primary/syllabus/primary-science-syllabus-2023_may24.pdf), [official school sharing](https://www.rivervalepri.moe.edu.sg/files/6__2025_P34_subject_sharing_SC.pdf) | Verify the seven selected P3 topic areas and sequencing against MOE; not all primary Science |

Public exam questions can inform format analysis but cannot establish syllabus completeness or grant reuse rights. Published bank size is not evidence of approved coverage. Use original/rights-cleared generic content; never real learner fixtures.

## 8. Open engineering discussion points

Confirmed owner decisions are not reopened by these questions. Resolve these interactions before implementing their dependent logic:

1. Format-sensitive evidence: how should mixed high-option/low-option questions combine, and does a wrong response discard a prior partial two-success count? Whole-task all-first-correct remains necessary for passage goals; retries never count.
2. Science seven-day reuse restriction: define the exact calendar boundary and fallback tests for 1/3-day due reviews. Pending due review cannot be silently counted complete by an ineligible item.
3. Proposed Science safety clarification: no same-day independent acquisition claim after revealing help. It was endorsed as sound in review, but not separately marked an owner decision; retain proposal status.
4. Publish the verified leaf curriculum manifest before mapped extraction. Course IDs above are defined; leaf inventories and media are not delivered by documentation.
5. Define active per-subject time (pauses/background/teaching), exact timezone-change behavior, and zero-item/shorter checkpoint presentation. No punitive timer or efficacy claim.
6. P3 chapter availability is authored/reviewed progression, but the child's entry into P3 general practice for Chinese, Mathematics and English still needs a readiness/course-selection rule. Do not silently assume that every published P3 outcome has already been taught; Science's initial-teaching workflow does not automatically define other subjects' teaching.

The unresolved data-protection, actual-target storage and private safety-copy gates remain in Technical Decisions and Pilot Scope, separate from these engineering questions.
