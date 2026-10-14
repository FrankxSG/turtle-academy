# Turtle Academy Pilot v0.1 — Learning Engine and Acceptance

**Status:** Documentation-review draft, 2026-10-14; no implementation or merge authorization.
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

Catalogue records require stable IDs/versions, subject/course/outcome references, assessed skill, task family, objective selected-answer key, hint/correction assets, approved QA/rights status and offline asset references. Materials contain an ordered complete set of formal questions. Science adds short teaching, two distinct-context acquisition tests and an acyclic prerequisite graph. Target mappings identify original-error, similar and generic practice pools.

Context/equivalence metadata must distinguish actual transfer from cosmetic number/image/option-order changes. Reuse is permitted but recorded as exposure, never automatically called novel evidence. No fixed three-question stock requirement remains. Supply must support mapped stages, varied application, delayed checks, replacements and whole-material scheduling.

| Private record | Proposed essential fields |
| --- | --- |
| Target | Opaque ID; subject/course; normalized target; assessed skill; supported error type or unknown cause; mapping/version; verification and amendment lineage |
| Observation | Target; controlled source type; observation date; app-generated source-instance/batch references; actual recurrence versus duplicate |
| Task | ID; day; frozen X; subject; content/policy version; planned materials and actual total; cursor; eligible target starting stages; completion/exemption reason |
| Presentation | Stable ID; task/item/version; role; target/stage; first-response eligibility; prior exposure |
| Attempt | Event ID; presentation; first/retry ordinal; selected answer IDs; outcome; assistance; timestamp/local sequence |
| Target assessment | Related task question IDs; first-response outcomes; starting stage; aggregate finalized once |
| Checkpoint | Stable task milestone claim; shared story sequence; delivery state |
| Amendment | Actor authorization context; invalidated/replaced record references; structured reason; reducer revision |

Family/child ownership comes from authenticated app context, not imported JSON. Use opaque random references, not worksheet-content hashes. Store public item references rather than original worksheet prompts. Do not merge visually similar characters or convert scripts automatically; normalize Unicode NFC and boundary whitespace without removing meaningful distinctions.

First-response history must be committed or queued before revealing help. Assistance/correction never overwrites it. Replayed event IDs are idempotent; an interrupted task resumes its presentation rather than manufacturing a new first attempt. Known assistance makes evidence practice-only; the system cannot detect all unobserved adult assistance.

## 3. Eligibility and task planning

1. Exclude invalid/suspended/unmapped evidence and targets not yet eligible.
2. Arrange due generic reviews before incomplete repair, then general practice; independent recurrence and actual history break ties, not fabricated diagnostics.
3. New imports and wrong-target further prescribed practice become eligible no earlier than next calendar day.
4. Chinese/English choose whole materials covering eligible targets first, meet ceil(X/5) complete materials and at least X formal questions, then fill necessary short slots. Rotate material families.
5. Science reserves two formal positions for eligible initial-learning tests when review and acquisition coexist; teaching uses no position. Remaining single capacity can preserve the second independent test for another task.
6. Freeze the task's X, content version, material structure and actual formal total. Unstarted Chinese short-only slots can select the newly unlocked stage within that capacity; freeze the question when presented.
7. A target assessed in any material uses whole-task aggregation, including related short questions. No mixed immediate/aggregate route for the same target.

Scheduled material questions are completed even if an earlier first response was wrong; they are existing assessment, not newly inserted same-day repair. All first answers in each material precede feedback. Finalize a target only at task completion: every related first answer correct advances once, any wrong retains starting stage and next-day eligibility. Pauses preserve unfinished aggregation; invalidations trigger replay, not an early pass.

General correct answers do not skip an existing repair stage just because they incidentally test the same skill. Role assignment is explicit before presentation. General wrong answers create or update a private target automatically. Science formative observation and supported correction create no formal error evidence.

## 4. Repair, intervals and Science dependencies

Independent first-correct prescribed repair advances one stage; assistance never advances. Chinese short-only practice can use the next stage in a remaining slot. Passage-assessed targets wait for a subsequent task. Failure prompts one retry then correction if still wrong, moves to another eligible target, and prohibits newly scheduled same-target practice until next day.

Three stages complete into generic delayed checks, not permanent mastery. Correct checks schedule 1, 3, 7, 14, 30 days, then recurring 30 days, measured from actual response dates. Wrong generic checks keep generic stage, reset interval sequence and become eligible next day; next independent success schedules one day. Late attendance shifts from actual answering date without missed-day debt.

Science acquisition needs two distinct-context independent first-correct tests. Failed acquisition enters three-stage repair; dependent new learning waits for that repair, unrelated learning can continue. Later generic failure preserves existing unlocks. Proposed safety interpretation: answer-revealing help after the first acquisition failure cannot be followed by a same-day second test treated as independent acquisition success.

If Science has no eligible review/repair, unlocked acquisition or learned general practice, finish at actual count with a parent-visible reason. Proposed zero-question exemption awards no learning-story checkpoint. A shortened task with actual work receives its completion interaction at a safe boundary, deduplicated against any delivered halfway checkpoint.

Calendar policy proposal: retain a stable profile timezone initialized at setup; use that timezone for eligibility and actual response dates. Travel or clock anomalies must not manufacture delayed evidence or duplicate daily rewards. Exact timezone-change controls remain an engineering-review question, not a newly confirmed parent feature.

## 5. External preparation and import envelope

This is a proposed shared contract for a future private ChatGPT/Claude extraction skill and app validator. It is not a skill delivered by this PR. Parent semantically verifies each candidate outside the app, then confirms one in-app preview. Never send original scans to the app/backend or commit them.

| Envelope field | Proposed validation |
| --- | --- |
| schema_version | Exact `pilot-mistakes/1`; reject unsupported versions |
| subject | One supported subject per batch; course must match |
| extraction_result | `errors_found`, `no_errors_found` or `incomplete` |
| items | Array; nonempty for errors_found; empty for verified no_errors_found; incomplete is not a clean no-error result |
| candidate_ref | Optional batch-local bounded reference, not identity or authorization |

Proposed safety bounds: at most 1 MiB decoded JSON and 1,000 candidates; these are intake limits, not question or learning quotas. Reject malformed/oversized/version-incompatible envelopes before mutation. Unknown keys are rejected rather than retained. Markdown wrappers, executable markup and arbitrary nested attachments are not part of the format. Render accepted text inertly.

| Candidate field | Meaning and checks |
| --- | --- |
| knowledge_point_ref | Reviewed public curriculum reference or explicit pending mapping; subject/course compatible |
| target_kind | Controlled character/word/language point/reading skill, Science concept, Mathematics relationship/method, or English vocabulary/grammar/reading skill |
| target_value | Necessary correct target, proposed maximum 64 characters; no original full question/passage or context summary |
| assessed_skill | Controlled skill where applicable; explicit not-applicable where legitimate |
| error_type | Supported controlled type; unknown cause if evidence does not justify classification |
| observed_wrong_form | Optional necessary bounded form, proposed maximum 64 characters; no full source question or meaningless option-number-only record |
| observation_date | Valid ISO calendar date provided/verified by parent; future dates require correction; do not silently infer from upload time |
| source_type | Fixed list: schoolwork, home_practice, external_assessment, other_reviewed_work |

No learner name, school/teacher identifiers, worksheet titles, free source descriptions, original images/text, stage/mastery/due fields or foreign ownership IDs. Structural validation cannot guarantee anonymization or semantic correctness. A bounded string can still be sensitive; privacy review remains required. Do not log raw invalid payloads in public diagnostics.

At preview distinguish valid mapped, valid pending-content and invalid candidates. Parent can confirm the displayed valid subset once while excluded items remain explicitly unresolved; do not silently drop them or partially mutate before confirmation. Cancellation leaves records unchanged. No-error extraction enters general practice only after parent verification; incomplete extraction never implies a mistake-free worksheet.

App generates private source/batch IDs. Parent identifies a new source or the same earlier source; same-source target/error reimports are deduplicated. Independent new source observations preserve stage and create next-day priority; generic-stage recurrence resets intervals, not repair stage. Historical observation dates never bypass day-after-import eligibility. Known target with unknown cause can practise; unknown target must not be silently guessed.

Amendments preserve provenance, invalidate affected evidence and recompute derived state. Changed target/skill cannot inherit unrelated success. Marking an invalid app question removes its count/evidence and replaces it; suspensions are child/version scoped pending parent action, not global catalogue rewrites.

## 6. Persistence, updates and protected operations

Ordered idempotent local commands and in-memory pending writes support warning-and-continue after retry failure. Retry with backoff while alive and on foreground return. Unsaved memory can be lost on reload/process termination; disclose that limitation. Do not claim background survival or guaranteed preservation.

Backup failure alone permits locally saved learning and shows parent status. Preserve existing snapshot allowlist, linear-head conflict pause, authenticated ownership, online password reauthentication, current-head restore, validated atomic replacement and successfully saved private safety copy. Retain server-authorized no-head exception and newest-ten owner-managed retention. No keep-device overwrite/rebase or automatic recreation after deletion.

Actual-target storage protection and safety-copy recovery/lifetime remain unresolved gates under technical decisions; this specification does not choose plaintext or authorize real uploads. Offline PIN is not server authorization.

Content is centrally reviewed and released with app updates. Active tasks pin cached versions and assets; updates apply safely between tasks. Changed/retired keys require explicit compatibility/invalidation rules, not retroactive silent grading. Failed downloads preserve usable cached content. No parent generic-bank importer.

## 7. Behavioral acceptance cases

These are **required future tests**, not executed app tests. Fixtures must be synthetic and publication-safe.

| ID | Scenario and required outcome |
| --- | --- |
| F01 | Set X=10 once; subsequent days and all subjects inherit it without daily setup |
| F02 | Change X during paused task; active task keeps its configuration, new task uses new X |
| F03 | Chinese short-only first-correct advances; remaining slot can use next stage; first-wrong moves on |
| F04 | Hint/retry/correction succeeds; stage does not advance and retry is not counted |
| F05 | Science teaching plus two new-context first-correct tests; teaching uncounted, delayed review scheduled without error |
| F06 | Initial prerequisite fails; dependent learning blocked, unrelated learning available; three-stage repair unlocks |
| F07 | Later prerequisite generic failure preserves already unlocked content and resets interval |
| F08 | Science final single slot/pause preserves partial acquisition and resumes without duplicate first attempt |
| F09 | Science eligible content exhausted; shorter completion counts subject, reason shown, next-day targets retained |
| F10 | X=6/10/19 requires 2/2/4 complete language materials; reject X=5/20 and nonintegers |
| F11 | Whole material first answers collected before hints/answers; no premature clue disclosure |
| F12 | Same goal correct in one material, wrong in another; retain starting stage and next-day eligibility |
| F13 | All task-related goal questions first-correct; advance once, next stage waits next task |
| F14 | Resume yesterday's material; preserve counts/evidence, completion satisfies today's subject requirement |
| F15 | Language actual total exceeds X; checkpoints use planned actual total and material/correction boundaries |
| F16 | Half/full checkpoints coincide; combined presentation and no duplicate story on resume/reload |
| F17 | Different subject orders share one adventure; exploration waits for all available required subjects |
| F18 | Today rest preserves X, stages and unfinished tasks; exploration allowed, no fabricated learning credit |
| F19 | Actual-date 1/3/7/14/30/30 review; failure stays generic, next-day retry and one-day restart; no missed-day debt |
| F20 | Same-source reimport deduplicates; independent new observation preserves stage and starts no earlier than tomorrow |
| F21 | General first-wrong auto-creates/updates bank; completed goal stays generic, reset interval; no parent confirmation |
| F22 | Child flags item; exclude count/evidence, replace, child/version suspension, parent restore/disable |
| F23 | Parent changes/invalidate import; replay affected evidence, no unrelated inherited clearance |
| F24 | Suitable fresh content exhausted; later old material permitted, exposure and repeated evidence recorded |
| F25 | All formal subject answers objective selection/matching/ordering; no answer keyboard; click alternative to drag |
| F26 | UI/story language toggle; Chinese academic Chinese and other academic English unchanged |
| F27 | Local save fails repeatedly; retain memory, warn and continue, ordered background retry, honest reload-loss warning |
| F28 | Backup fails/stale head; saved learning continues, parent status shown, protected restore policy unchanged |
| F29 | Update during paused task; pinned version usable, key changes explicit, failed download preserves cache |
| F30 | Preset story ends; world preserved and short companion interaction replaces further new plot |

Field checks must additionally cover unsupported version, unknown fields, wrong subject/course, oversize payload, malformed date, future date, old observation with current import, correct no-error versus incomplete result, cancellation, valid-subset confirmation, duplicate batch retries, unauthorized imported ownership/stage fields, bounded wrong-form privacy and unknown-cause/pending-target separation.

## Curriculum coverage acceptance

Coverage means all verified **in-app scoped outcomes**, not every curriculum capability. Reviewers must approve a versioned leaf-outcome inventory with source/page, grade/course, knowledge point, assessed ability, interaction family, reviewed content IDs, stage mappings, hint/correction, offline media, rights/QA sign-off and explicit limitations.

- Chinese: P2 Chinese plus Higher Chinese scoped recognition, language use, reading and sentence organisation.
- Mathematics: all P2 knowledge points, objective assessment limits labeled; no independent free-working claim.
- English: all P2 in-app textual/visual outcomes across the eight approved families; listening deferred and full writing/oral external.
- Science: only Living/non-living and living-things classification; teaching, two-context testing, prerequisites and three-stage repair reviewed.

Release requires 100% mapped verified in-scope leaf outcomes; zero unreviewed mappings, missing in-scope outcomes, rights/privacy blockers or unlabeled capability gaps. Missing content cannot be removed from the denominator to claim completion. Exact item counts are planning, not a new owner quota. A checklist validates references but does not prove educational quality or MOE alignment.

Every mapped repair target needs reviewed original-error/similar/generic variations and delayed checks that assess its actual skill rather than a recognition shortcut. Language material and replacement supply must support the approved task quotas without habitual short-question stacking. Do not claim the current repository bank satisfies coverage: the full leaf inventory and reviewed content are not yet delivered.

### Curriculum/source audit register

References to be verified during inventory authoring; official source availability is not a completed coverage audit. Direct MOE retrieval was blocked in prior research, so secondary official school material must not be treated as complete substitute syllabuses.

| Area | Official reference to verify | Audit status |
| --- | --- | --- |
| Chinese | [Primary Chinese syllabus 2024](https://www.moe.gov.sg/-/media/files/primary/cl-syllabus-pri-2024.pdf) | Confirm P2 cohort/course applicability and HCL mapping |
| Mathematics | [2021 Primary Mathematics, updated October 2025](https://www.moe.gov.sg/api/media/92bff26d-b2b4-4535-b868-b8415c744b91/2021-Primary-Mathematics-Syllabus-P1-to-P6-Updated-October-2025.pdf) | Verify P2 leaf outcomes against source |
| English | [Primary English 2020](https://www.moe.gov.sg/-/media/files/primary/2020-english-language-primary.ashx), [official school curriculum](https://www.acspri.moe.edu.sg/our-curriculum/english-language/) | Textual/visual scope and deferred abilities must remain explicit |
| Science | [Primary Science 2023, May 2024 revision](https://www.moe.gov.sg/-/media/files/primary/syllabus/primary-science-syllabus-2023_may24.pdf), [official school sharing](https://www.rivervalepri.moe.edu.sg/files/6__2025_P34_subject_sharing_SC.pdf) | Verify selected introductory points; not all primary Science |

Public exam questions can inform format analysis but cannot establish syllabus completeness or grant reuse rights. Published bank size is not evidence of approved coverage. Use original/rights-cleared generic content; never real learner fixtures.

## 8. Claude documentation-review brief

Review both specifications and their aligned supporting docs **as one package**. Record reviewed head SHA and rank concrete findings: blocker, major, minor. For each finding cite file/section, conflicting requirement or failure sequence, and a suggested resolution.

Prioritize whole-task versus short-only progress; role/assistance evidence; same-day failure bans versus already planned materials; Science pair/prerequisite handling; actual language workload; source deduplication; amendment replay; field/privacy boundaries; scoped coverage and protected backup gates. Challenge unnecessary Pilot expansion and unsupported learning claims.

Separate confirmed owner decisions from proposed schema/timezone/zero-item details and unfinished delivery. Do not replace owner choices silently. Do not implement, approve merge, alter backend, upload real records or create topic-by-topic GitHub design threads. Return one consolidated review. Favorable review is not implementation authorization.
