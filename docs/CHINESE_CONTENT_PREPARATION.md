# Chinese curriculum, contracts and first content batch

Independent public-source research and original findings: [research audit](content-review/CHINESE_RESEARCH_AUDIT.md) (2026-10-16). The review disposition below records subsequent corrections; the historical audit remains evidence, not batch approval.

**Historical PR11 review disposition — 17 October 2026:** Independent re-review of `a02199b` closed the raw-outcome import, word/ability identity, repair-route compatibility and tracked-bytecode findings. The windmill retagging and empty compatibility list are accepted for this batch. The 25 contract tests and catalogue validator pass. The material counts below have been reconciled with the catalogue. No open blocker from that targeted revision remains for merging this preparation work; this is not owner merge authorization or approved content for shipping. The source-complete curriculum denominator, full item QA, owner disputed-item review/random 20% sample, batch sign-off and rights review remain pending. Ability reporting must not claim a specific word was repaired; unmatched word imports remain pending. Existing private-data and release gates are unchanged.

**Review proposal · 15 October 2026 · Issue #10**

This is one review entry point for curriculum preparation and authoring contracts. It does not authorize an app build, private-data processing feature, content release, merge or deployment. The functional authority remains [Pilot Functional Design](PILOT_FUNCTIONAL_DESIGN.md), with [engine rules](PILOT_LEARNING_ENGINE_SPEC.md) and [QA gates](CONTENT_QA.md). No confirmed product decision is changed here.

## 1. What is ready to inspect

| Artifact | Purpose | Current state |
| --- | --- | --- |
| [Curriculum manifest](../content/chinese/curriculum.json) | Four course identities, official references, 132 course-specific outcome records (including language-use leaves), 46 word/language-point/reading-skill repair targets and 1,796 character records | Source-based working inventory (draft.2 adds finer leaves); independent grade/denominator audit pending |
| [Contract schema](../contracts/chinese/1.schema.json) | Curriculum, original catalogue, frozen synthetic task plan, minimal Chinese intake and answer-event shapes | Proposed engineering contract; no app integration |
| [Starter batch](../content/chinese/batches/starter-001.json) | Version 10: 357 original items — 19 materials (95 questions), 12 declared repair groups (45 character pools and 23 skill pools; 204 questions), and 58 further general-practice items; every non-repair question declares a repair route | Batch approved by the owner 2026-10-18 (rights cleared); manifest denominator still proposed |
| [Second batch](../content/chinese/batches/starter-002.json) | Version 1: 38 new original P2 items — 1 material (4 questions), 4 repair groups (5 character pools and 3 skill pools; 24 questions) and 10 further general-practice items | Author draft; independent cross-review, owner review of 4 disputes and a 7-item sample, and rights review pending ([review pack](content-review/CHINESE_REVIEW_PACK_STARTER_002.md)) |
| [Task fixtures](../content/chinese/fixtures/) | Complete P2 examples for X=6, 10, 12 and 19 | Synthetic, deterministic validation examples; no learner data |
| [Validator](../scripts/validate_chinese_content.py) and [boundary checks](../scripts/test_chinese_content_contracts.py) | Structural integrity and cross-file rejection cases | Standard-library authoring tools; not learning-engine implementation |

The starter contains ten P2 materials (five readings, three visual texts and two cloze passages) and nine P3 materials (six readings, one visual text and two cloze passages). Each grade's materials are shared by Chinese and Higher Chinese subject to course-specific QA. This is an authored inventory, not an approved daily-task supply or release bank. Shared course labels mean candidate applicability, not identical course coverage or an HCL-specific depth claim.

## 2. Official source baseline

Retrieved directly from MOE on 2026-10-15. Exact URLs, SHA-256 checksums, page counts and retrieval dates are in the manifest. Original PDFs are references, not redistributed assets.

| Source | What it establishes | Relevant PDF pages |
| --- | --- | --- |
| [2024 Primary Chinese syllabus](https://www.moe.gov.sg/api/media/f41062a6-3a90-4ed1-bf93-2f1aaabeec43/CL-Syllabus-Pri-2024.pdf) | Six language domains, graded course matrix, culture/dispositions and implementation sequence | 23–34; implementation 36 |
| [Chinese character list, P1–P3](https://www.moe.gov.sg/media/files/primary/syllabus/99b31d48-7f90-420a-a748-f64167c45746.pdf) | Separate recognition/writing lists | P2: 3–4; P3: 5–6 |
| [Higher Chinese character list, P1–P3](https://www.moe.gov.sg/media/files/primary/syllabus/701b25fd-b254-4821-b384-e011bfe191af.pdf) | Course-specific recognition/writing lists | P2: 3–4; P3: 5–6 |

The 2024 syllabus rollout reaches P2 in 2025 and P3 in 2026. This inventory therefore uses that syllabus and its linked lists, rather than assuming an older school paper defines the current curriculum. PDF page references are one-based; syllabus printed pages are two lower.

The official lists are finite **character** inventories. They do not establish a closed list of all possible words, grammar exercises, text contexts or school test questions. Full scoped coverage must be defined against approved assessable outcomes; a large question count cannot establish it.

### Character inventory facts

Counts are distinct characters appearing in each grade's two source pages, deduplicated within each mode. They are not cumulative end-of-grade proficiency totals. A writing-list character may have appeared in an earlier grade's recognition list; do not require this grade's writing set to be a subset of its recognition set.

| Course | Recognition-list characters | Writing-list characters | Union |
| --- | ---: | ---: | ---: |
| P2 Chinese | 382 | 183 | 477 |
| P2 Higher Chinese | 382 | 233 | 468 |
| P3 Chinese | 285 | 219 | 430 |
| P3 Higher Chinese | 285 | 269 | 421 |

Character IDs encode course and Unicode code point, not an invented teaching sequence. Records retain recognition-list and writing-list page references separately. Selection practice can assess recognition/meaning, never independent handwriting merely because a character is in the writing column.

The HCL writing lists are **not supersets** of the CL lists. Explicit source extraction yields these differences:

| Grade | Recognition-set difference | Writing: CL only / HCL only | Union: CL only / HCL only | Net HCL union difference |
| --- | --- | ---: | ---: | ---: |
| P2 | None | 27 / 77 | 27 / 18 | −9 |
| P3 | None | 47 / 97 | 47 / 38 | −9 |

See the [complete public set-difference report](../content/chinese/source-audit.json), including the actual differing character sets. Visual spot checks of the official writing columns confirm examples: P2 CL has 兄 and 云 where corresponding HCL rows omit them; P3 CL has 帮 and 梦 where corresponding HCL rows omit them. This checks the disputed subset assumption, not every outcome/character row independently.

To reproduce, download the two character-list PDFs from the URLs above **outside the checkout**. The [source-audit script](../scripts/audit_chinese_character_sources.py) requires the exact manifest checksums and six-page layout before reading the columns. It compares all extracted records and counts to the manifest, then generates the set report. Preparation dependency: `PyMuPDF==1.26.6`, the version used for this run; install in a separate preparation environment if needed. It is not an app dependency and does not modify the manifest.

```sh
python3 scripts/audit_chinese_character_sources.py --cl-pdf /path/outside-checkout/cl.pdf --hcl-pdf /path/outside-checkout/hcl.pdf --report /tmp/chinese-source-audit.json
```

Compare that report with the checked-in report. Extraction is now reproducible; a reproducible extraction and author spot checks do not replace the independent source/grade audit still required.

### Six-domain mapping and boundaries

| Domain | Pilot evidence | Boundary |
| --- | --- | --- |
| Listening | None | Deferred; no stem narration or hearing-comprehension claim |
| Speaking | None | External parent-arranged practice |
| Oral interaction | None | External; choosing a polite sentence is not speaking assessment |
| Reading | Character/word recognition, explicit information, suitable support cues; grade-appropriate additional outcomes below | No claim of oral reading fluency; no automatic inference of a misconception from one error |
| Writing | Objective sentence organisation, punctuation choices and limited idea selection | Partial evidence only; handwriting, full compositions and independent text production external |
| Written interaction | Choosing appropriate purposes/formats or responses when grade-appropriate | Partial evidence only; composing an independent message remains external |

Culture and learning dispositions are contextual, not scored mastery targets. Word-choice, classifiers, collocations and sentence patterns are authoring facets under the relevant recognition/meaning or sentence outcome, not a claim that MOE published an exhaustive grammar checklist. A lexical target outside the character list still requires a defensible outcome mapping and reviewed practice; it must not acquire a fabricated character ID.

The matrix must be read row by row. For example, prediction from titles/images begins in P3 for both courses; word/sentence inference begins in P3 HCL but later in standard Chinese. Text-type classification, central theme, implicit information and predictive causal inference start later than the P2/P3 bands used here. They are therefore not fabricated P2/P3 release leaves. A question asking for a reason **explicitly stated** in a text remains explicit-information retrieval. Later-grade-only comparison, interpretation of author intent, critique, full descriptive writing and independent revision are also outside this inventory. Earlier skills remain relevant after their initial teaching band.

This is a working source-derived mapping, not an official MOE endorsement or an approved coverage denominator. Independent review must check the coloured grade matrix against every proposed leaf, split any overbroad leaf and identify omissions before freezing IDs for imports.

### Public school formats and past-paper survey (2021-2026)

Public school documents show what P2/P3 Chinese practice looks like; they inform question **types**, never question text:

- **P3 Paper (one school, 2025 EOY):** 辨字测验, 词语选择, 阅读理解（一）, 词语搭配, 句子变变变, 组句成段, 阅读理解（二）; plus composition, listening and oral components ([Jurong West Primary 2025 P3 assessment overview](https://www.jurongwestpri.moe.edu.sg/files/JWPS_2025_P3_Assessment_Overview__Topics_and_Components_.pdf), accessed 2026-10-16).
- **P3 MTL EOY format:** MCQ, cloze passage and open-ended comprehension in Language Use and Comprehension; picture composition, listening and oral separately ([Cedar Primary P3 curriculum briefing 2025](https://www.cedarpri.moe.edu.sg/files/Parent%20Engagement/2025%20P3%20Engagement/3__14_mar_p3_curriculum_briefing_2025.pdf), accessed 2026-10-16).
- **P2 formats:** 选字组词, 看图写话 and short-passage comprehension; reading strategies such as circling question words and finding the answer in the text ([Shuqun Primary P2 Chinese Language Handbook](https://www.shuqunpri.moe.edu.sg/files/P2_Chinese_Language_Handbook.pdf), accessed 2026-10-16).
- **P2 learning outcomes:** recognise P2 characters, read P2 texts aloud, identify details with guidance, write words and simple sentences ([Edgefield Primary 2025 P2 learning outcomes](https://www.edgefieldpri.moe.edu.sg/files/2025_Assessment_Letter_to_Parents___P2_Learning_Outcomes.pdf), accessed 2026-10-16).
- **Past-paper index:** SmileTutor lists P2/P3 Chinese and Higher Chinese papers, with 2022 the only year in range ([SmileTutor exam papers index](https://smiletutor.sg/free-test-papers-download/primary-school-exam-papers/), accessed 2026-10-16). The site asserts copyright and states no reuse licence, so **no paper or question is reproduced**; the survey informed item styles only.
- **Enrichment context (2024-2026):** school reading programmes and dictionary-skill support (部首/笔画/音序检字) described in the Shuqun handbook, and NLB reading recommendations ([NLB booklists](https://www.nlb.gov.sg/main/site/discovereads/children/reading-recommendations/booklists), accessed 2026-10-16). Cited for context only.

Version 4 maps these formats to objective items: 辨字 → character groups; 词语选择 and 词语搭配 → word-choice and collocation items; 句子变变变 and 组句成段 → sentence-order and 把/被/question transformation items (selection only); cloze and comprehension → materials. Writing, oral and listening stay external or deferred.

### Private preparation evidence

Private worksheet review informs the comparison of exercise formats with the official map. Public assets use original generic content. No source pages, identifying details, actual errors, private target IDs or worksheet-derived answer history belong in this branch or its review discussion. Recognition exercises adapted from a production skill must retain the capability limitation. A visual survey is not a verified transcription of every handwritten response; uncertain handwriting never establishes a diagnosed error type.

Before building the real importer, complete the private target-to-available-content comparison and record the owner's proceed decision under the existing Issue #3 gates. This draft does not satisfy that gate by publishing private evidence.

Repair content is published as complete curriculum-level groups named by topic, authored together, per the Pilot Scope §4 rule. The starter group is "P2 look-alike and sound-alike characters": twelve characters from the official P2 recognition list, each contrasted with common look-alike or sound-alike distractors. Public groups are generic curriculum content; no public target, group composition or publication timing is evidence of any learner's errors. No private scan or private error list is a public content source.

## 3. Proposed engineering contracts

All JSON objects reject unknown keys. Public catalogue IDs are stable, ASCII, course-qualified where curricular; versions are pinned by each task. Unicode target text is separate from IDs. Do not normalize visually similar characters into one target. This first authoring contract uses 4+ option single-selection items; matching, ordering and low-option formats remain valid product requirements but need their own payload definitions and checks before being authored or integrated. This is a declared contract subset, not a cancellation of those formats.

Content and pinned versions are positive integers, including v2 and later. Opaque event/task/idempotency IDs have a separate 1–128 character ASCII definition allowing digit-leading UUID/hex values; they are not curriculum IDs. String patterns have strict end assertions, and the UTF-8-reading validator uses `re.fullmatch` to reject trailing newlines. Version 2 of this batch changes text and structured fields; the previous keys/text remain recoverable from the earlier Git revision. The authoring tool checks current pins, not historical app replay or key invalidation.

| Contract | Ownership and required invariants |
| --- | --- |
| `curriculum` | Source/outcome/character catalogue only. This manifest remains `proposed_not_import_enabled`; source references and per-course identity required. `unfilled` means no approved complete mapping, even when draft questions exist. Schema permits later approval states without a schema rewrite; approval still requires actual review and an app-owned manifest allowlist. |
| `batch` | Original materials own ordered, complete question lists. Each item has course/outcome references, answer key, hint, explanation, rationale, rights status and asset references. Correct option must exist; duplicate IDs/options and orphan material questions fail. No runtime AI. |
| `task_plan` | Synthetic frozen queue pins batch, manifest, item versions, course, X, material structure, role and starting stage before presentation. Main count includes formal questions only. At least ceil(X/5) complete materials AND X questions. No interleaving a short question into a material. |
| `import` | Chinese subset of `pilot-mistakes/1`; P2 CL/HCL only. P3 import rejected even with null mapping. Parent/app ownership, source IDs, stages and due dates cannot come from payload. At most 1 MiB decoded JSON, 1,000 candidates; NFC/boundary normalization and inert rendering remain app-boundary work. |
| `attempt` | Private event shape with opaque app-created IDs, pinned public item/version, selected option, phase, assistance, local day, sequence and idempotency key. First means no assistance; retry means hint; correction means revealed explanation. The app derives correctness from the pinned key; imported mastery/correctness is never trusted. |

The schema is Draft 2020-12 shaped. The lightweight validator implements **only the keywords used in this file**, rejecting unsupported keywords; it is not a general JSON Schema library or an app input endpoint. Its CLI reads public fixtures only. A production importer additionally needs byte limits before parsing, depth/resource limits, authorization, all-entry preview, cancellation/atomic commit, deduplication and private diagnostics. Bounded text is not proof of anonymization.

**Repair groups (version 4).** The batch declares `groups`: each has an ID, version, Chinese and English topic labels, courses, the full list of target character IDs and the full list of member item IDs. The validator rejects a group with a missing or extra member, a declared target without a complete exact/similar/generic pool, an item whose target or courses fall outside its group, and any repair item that does not belong to exactly one group. Deleting a whole pool's items therefore fails (`group_missing_item`), and removing a pool from the group declaration while its items remain also fails (`repair_item_group_membership`). Groups in version 4: `zh-group-p2-confusable` (12 targets), `zh-group-p2-radicals` (10), `zh-group-p3-confusable` (15), `zh-group-p3-radicals` (8).

Review/rights/content/coverage states are controlled enums, separate from record shape. The validator rejects an `approved` batch with inconsistent review/rights states or unresolved disputed IDs, and rejects an approved manifest with pending coverage. These are consistency checks, not proof that a human reviewed or approved anything. This batch records the received changes-requested review; version 2 still needs review and owner sign-off. Sampled/disputed IDs must exist in the batch.

Blanks and pinyin are structured: text contains `{{blank-1}}` or `{{pinyin-1}}`; each text owner declares its own `blanks` and `annotations`. A blank explicitly names its question ID; the question's `blank_ref` links back. Pinyin records hold `text` and `pinyin` separately. All placeholder IDs must occur exactly once in that owner's text, with no orphan annotation or question link. The later renderer must display blanks as answer slots, not literal tokens, and pinyin as an annotation beside its linked text. Do not parse full-width parentheses to infer purpose. The readable tables below substitute these declarations for review only, not an implementation of the app renderer.

For pending intake, `knowledge_point_ref` is JSON null; an unknown cause is `unknown_cause`, not a guessed misconception. The validator enforces an empty list for `no_errors_found`; **parent verification is a separate app-owned preview/confirmation obligation**, absent from the external payload and not established by this check. `incomplete` is distinct and never means mistake-free. Character target/wrong-form values are limited to one code point; words to eight; other kinds to 64. A mapped entry must name an explicitly typed repair target — a character record or a `skill_targets` record — never a raw outcome. A mapped character's value must equal the referenced character record and course, with `character_recognition` as the assessed skill. Any other entry must match the target's `kind` and reviewed `assessed_skill`; a `kind=word` target also carries its one concrete word, which must equal the value. A word/language/reading target cannot borrow a character ID. Other semantic classifications still require human review. A known manifest string is not release authorization: mapped intake requires approved manifest/coverage state and an app-owned approved-version allowlist. That allowlist is empty for this proposal. `observed_wrong_form` stays device-local and must be absent from cloud snapshots. Privacy and actual parent verification remain required.

The material quota is intentionally a **minimum**, as required by Functional Design §3. No maximum material count or new workload cap is introduced here. X=6 with four complete materials can be structurally valid; that is not a recommendation to schedule unnecessary work. Planner workload suitability remains a later implementation/review concern. Source checks now enforce syllabus printed page = PDF page −2 and character source/course/grade pages (P2 3–4; P3 5–6). Every course listed by a targeted item must have a corresponding target reference, and each referenced target must have all three draft stages.

### Engine integration invariants to preserve

These are acceptance obligations for a later engine PR, not claims that the authoring tool implements learning progression.

1. Freeze X per subject/task (integer 6–19, default 10); do not reinterpret a paused queue after a setting/content update. Planned total is actual full-material count, not X.
2. Collect every first response in a material before any correctness, hint or correction. Preserve first answers, retry, assistance and correction separately across pause/reload.
3. For a passage-assessed target, aggregate every relevant task question, including related short questions. Any first wrong answer retains the task's starting stage. All correct may clear only once, after the full aggregate and format threshold. No early pass after the first passage.
4. The high-option/matching/ordering route needs one independent first success OR the low-option route needs two distinct first successes; a wrong answer resets low-option partial evidence. An assisted response never clears a stage. A high-option pass cannot override a passage-aggregate failure.
5. A passage target's newly unlocked stage waits until the next task. Short-only targets can progress within spare slots. Final transfer always waits until a later calendar day than stage 2; at most two stage clears per day across tasks.
6. Failed prescribed practice next becomes eligible the day after **task finalisation**. New imports wait until the day after import. General first errors create private targets for a subsequent task and no earlier than the day after originating-task finalisation. General correct answers do not skip repair stages.
7. Delayed review stays generic: 1→3→7→14→30 days, then 30; failure resets intervals without stage rollback. Recurrence from independent general-practice days/imports is distinct from retry or repair failure history.
8. Halfway is ceil(actual total/2). Story presentation waits for a complete material and its corrections; completion waits for all formal work/help. Delivered checkpoints are idempotent and separate from learning evidence. Flags suspend content and require replacements or an explicit shorter-completion reason.
9. Public content updates never rewrite old answer evidence silently. Active tasks use cached pinned assets/versions; changed keys require explicit migration/invalidation. Offline event ordering, replay, local save failures, backup ownership and restore safety remain separate engineering work under the existing design.

### Meaningful examples

| Fixture | X | Whole materials | Formal questions | Halfway threshold | Safe halfway display |
| --- | ---: | ---: | ---: | ---: | --- |
| `task-x6` | 6 | 2 | 10 | 5 | After first five-question material and corrections |
| `task-x10` | 10 | 2 | 10 | 5 | After first five-question material and corrections |
| `task-x12` | 12 | 3 | 15 | 8 | After question 10, when second material and corrections finish |
| `task-x19` | 19 | 4 | 20 | 10 | After second five-question material and corrections |

These general-practice fixtures test material/count contracts, not simulated learner progress. `halfway_safe_boundary_count` is the static expected question boundary for the synthetic fixture; the validator rejects 8 for X=12 and expects 10. It does not simulate completion of corrections or story delivery. Later engine tests must cover one target right in material A then wrong in B, success with a hint, reload before final aggregation, final-stage same-day rejection, duplicate event delivery and changed-key invalidation. Do not report the authoring tests as passing those unimplemented journeys.

## 4. Coverage and first-batch QA

No percentage is claimed. The release denominator is the independently verified, approved P2 **in-app scoped leaf inventory for each course**, with partially assessed capabilities explicitly bounded. Review must decide whether each proposed leaf needs finer splitting and reconcile character-specific mappings with skill leaves without double counting. Keep character inventory completion visible separately; adding hundreds of character records must not conceal missing reading or language capabilities. P3 general practice has separate available-content accounting; its imports remain deferred.

**Owner decision (2026-10-16) — coverage counting:** the 75% guideline is measured against **finer skill leaves**, not the current broad rows. Before freezing IDs, the independent source audit must (1) split broad in-app/partial leaves (for example character form/meaning, punctuation/sentence meaning, explicit-information retrieval) into separately reviewable leaves, and (2) add explicit **language-use leaves** — classifiers (量词), collocation (搭配), sentence patterns (句型) and word choice — each mapped to a verified syllabus page rather than folded into character recognition. **Character-group coverage is reported separately alongside** the skill percentage, never merged into it. New leaves need real source page references from the official PDFs; none are invented in this revision.

A covered mapping needs reviewed questions for its required stages, valid keys/help, suitable objective interactions, rights/QA sign-off and usable offline assets. Empty leaves remain in the denominator. A single general passage item does not make an entire reading outcome covered. Version 4 has two complete P2 character groups (22 pools) and two complete P3 groups (23 pools); it is not a 75% release bank. Version 6 maps language-use items (量词, 词语搭配, 词语选择, 关联词, sentence order and transformation, punctuation) to explicit language-use leaves and gives them non-character repair targets (`skill_targets`), so a lexical target never borrows a character ID. These leaves use the page of their parent outcome and still need the independent page audit above. No fixed per-stage authoring quota is introduced.

Author review checked keys against each stimulus, plausible single-answer interpretation, hint-before-retry ordering, explanations, basic readability and source applicability. All four options are visible for inspection below. The supplied changes-requested review covered the review document, schemas, validator and three initial fixtures, but explicitly excluded the raw data, test file and full source audit. It is not full content agreement or owner sign-off. Version 2 removes author scoping notes from child explanations, simplifies vocabulary, changes the general 晴 cloze to 放晴 while retaining a different 晴天 repair context, and replaces the disputed 座位/坐位 item with 这座桥. No dictionary/educator ruling about the removed wording is claimed; its replacement was later accepted by the owner (below). Version 3 (owner-directed review revision) replaces the three standalone repair pools with one twelve-character P2 look-alike/sound-alike group renamed by topic (`zh-p2-confusable-*`); gives the 晴 related-use item a new 晴朗 context so it no longer duplicates the 放晴 general cloze; removes the 座 cue from a 住 item; replaces 按住 with 抓住 and 一楼小室 with 一楼活动室; and uses look-alike distractors (永/木/禾) for the 水 cloze. Owner decision (2026-10-16): the 这座桥 item is accepted as written, because 座 is the standard classifier for a bridge, and it is removed from `disputed_item_ids`. Version 4 addresses the follow-up review on `a0b2b55`: the 已 related-use hint no longer shows 已经; 请低声一点 becomes 请把声音放低一点; the author-check date is updated; and repair groups are declared and validated (above). It also adds a P2 radicals group, P3 look-alike/sound-alike and radicals groups, six P2 and eight P3 materials, and language-use practice. No artwork/audio assets are used.

**Character lists — owner decision (2026-10-16):** `curriculum.json` reproduces the official P2/P3 Chinese and Higher Chinese character lists in full as data (1,796 records with page references). The owner decided to keep the full lists in the repository, cited to the MOE source PDFs with page references. This decision covers only the character lists. Rights evidence is original authoring, with final owner rights review pending; official sources establish curriculum facts and do not license copied school questions.

Review sequence: independently review the revised source/content; resolve every disputed/ambiguous item (qualified educator if the owner cannot resolve it); record the random 20% sample of AI-agreed items and its outcomes; owner signs off the batch. There is no recorded AI-agreed pool yet, so sampled IDs are currently empty. Record actual IDs/outcomes in the batch log after that review, not invented approvals. Target-device glyph/readability and offline rendering QA wait for a later authorized UI build.

## 5. Validation and next boundary

Run from repository root:

```sh
python3 scripts/validate_chinese_content.py
python3 -m unittest discover -s scripts -p test_chinese_content_contracts.py -v
python3 scripts/privacy_guard.py
```

Current authoring evidence: schema/reference/key checks pass for every batch, and the boundary test methods pass (including whole-pool deletion and undeclared repair items); the optional PDF source audit reproduces all character records and counts. Additional rejection cases include nonpositive versions, stale item pins, ID/hash trailing newlines, inconsistent approval states, invalid review IDs, wrong grade/source pages, incomplete target course coverage, wrong mapped character values, broken blank/annotation links and a premature X=12 halfway boundary. Existing X/material/import/assistance checks remain. No app/browser/backend tests are claimed; application files and dependencies are unchanged.

Before building Chinese: approve the independently audited source map/leaf boundaries and contracts; complete content QA and private coverage/proceed gates; resolve the existing data-protection gates for real records. Then authorize a focused synthetic-only implementation slice separately. This preparation PR must remain draft until review is resolved, and must not merge or deploy without the owner's explicit authorization.

## Correction revision — 16 October 2026

Version 5 corrects seven items: sentence order, the fishing stimulus, explicit honesty vocabulary and four reading questions. The reading replacements assess information stated in the passages rather than inferring a moral or character trait under an explicit-retrieval mapping. Revised item versions are incremented; all four synthetic plans now pin batch version 5. The MOE character inventory and course mappings are unchanged. Revised IDs remain in `review_log.disputed_item_ids` for independent re-review; the older outstanding dispute is retained. Source-year evidence, the finer skill denominator, language-use repair mappings and owner sign-off remain open.

These are proposed corrections, not independent approval. Existing task/history must retain earlier pinned versions; this authoring revision does not implement evidence migration or retroactive regrading.


## Audit-response revision — 16 October 2026 (batch version 6)

Responds to [CHINESE_RESEARCH_AUDIT.md](content-review/CHINESE_RESEARCH_AUDIT.md) ZH1–ZH4. Author revision only: every revised or new item remains pending independent re-review and owner sign-off. Mapping-only changes keep item versions (so the four synthetic plans still pin their items); content changes increment them. The plans now pin batch version 6.

| Finding | Change in this batch | Still open |
| --- | --- | --- |
| **ZH1** skill mapping and course depth | 18 language-use outcome records are added: 量词运用, 词语搭配 and 排列词语成句 for all four courses; 根据句意选择词语 for P2; 关联词 and 句式转换 for P3. No language-use item maps to `w-ideas` any more. Each leaf uses its parent outcome's page (完整句子组织, PDF p31), as recorded in `grade_basis`. | Independent page audit of the language-use leaves; HCL-specific depth evidence (shared CL/HCL tags still do not prove HCL depth; recorded in `limitations`) |
| **ZH2** progression matrix | The audit's matrix rows are applied: P3 CL now has 根据语境理解字词和句子 (`zh.p3_chinese.r-word-context`). P3 HCL has 根据起因和过程推断发展 (`zh.p3_higher_chinese.r-infer-cause`, no items yet, so it stays in the denominator). `zh-m11.q1` cannot test prediction once the body is shown, so it is now an explicit-retrieval question; title prediction remains an unfilled P3 leaf. Later rows (comparison; main idea and implicit meaning) are not P2/P3 core. | A pre-reading phase would be needed before any prediction item counts |
| **ZH3** non-character repair routes | The contract adds `skill_targets` (word, language point or reading skill, each under an in-scope outcome of the same course) and `repair_target_refs`. The validator now requires every non-repair question to declare a complete route for each of its courses, and repair items may not declare one. 18 skill pools are added in four new groups. Twelve are built from existing language-use items; six are new (P2/P3 explicit information, notices and character-in-context; 18 new items). Reading and notice questions route to the reading-skill pools. Cloze blanks route to the character's own pool when one exists, otherwise to character-in-context or word-choice. Mistake import may now map words, language points and reading skills (`mapped_target_kind` is checked). | Pools are one item per stage, which is thin stock. Repair is chosen by skill, not by a guessed error cause. |
| **ZH4** windmill process | `zh-m16` now describes an accurate pinwheel: fold along both diagonals, cut from the corners towards the centre leaving the middle uncut, bring one corner of each triangle to the centre, and pin it loosely to a stick so it can turn. All five blanks, hints and explanations were revised together. | Independent review |

Citation follow-up (owner decision): the dated enrichment table and the 2026 sample images now cite the publisher's public sample and listing pages instead of direct PDF and PNG file links. Hashes and page numbers are kept.

## Review response — 16 October 2026 (batch version 7)

Responds to the independent re-review of `86bedc5`. Item content is unchanged except the four `zh-m16` cloze blanks' routes and outcome, whose versions increase (as do the synthetic plan pins).

| Finding | Change | Still open |
| --- | --- | --- |
| **P1** mapped imports could use a raw outcome as a word target | `check_import` accepts only a character record or a skill target as `knowledge_point_ref`. Kind and assessed skill must match the target's reviewed values, and a `kind=word` target must carry the same concrete word. New negative tests cover the two review probes (`苹果` → reading outcome; `苹果` → collocation). | Word-level targets do not exist yet, so word imports stay `pending_content`. |
| **P1** abilities typed as individual words | **Owner decision:** these are abilities. Collocation and word choice are now `language_point`; word in context and character in context are `reading_skill`. Every skill target declares its reviewed `assessed_skill`. Progress is reported for the ability (for example 根据句意选择词语), never as "紧张 repaired". `kind=word` is reserved for a future target with its own word and matching pool (`skill_target_word_identity`). | Ability-level reporting must be honoured by the engine and parent view when built. |
| **P2** route guard did not check skill fit | Each route target must sit under one of the question's outcomes (a character target under the course's character outcome), or the pair must be listed in the new, reviewed `route_compatibility` list. The list is empty in this batch. The review's wrong-skill probe (explicit information → punctuation) is now a failing test case. Data fix: `zh-m16` blanks 1, 2 and 5 choose verbs or adjectives by meaning and now repair through word in context; blank 3 (转/砖/软/传, similar-looking characters) is retagged to the character outcome and keeps character in context. | Same-outcome fit is still a review judgement; the guard blocks only cross-outcome drift. |
| **P2** tracked `__pycache__` files | Removed; Python caches are ignored. | — |

## Historical v8 inventory preparation — 17 October 2026 (manifest draft.2)

Author revision and review preparation only. Nothing here approves content, the leaf denominator or a release.

- **Coverage reports.** [Chinese release inventory](content-review/CHINESE_RELEASE_INVENTORY.md) is generated by `scripts/chinese_release_inventory.py` from the public catalogue. It reports P2 Chinese and P2 Higher Chinese separately, a P3 general-practice inventory, missing leaves and incomplete or thin repair routes. Approved coverage is 0 until owner sign-off. Draft v8 has 13 of 17 proposed P2 leaves authored with general practice and a complete repair route for both P2 courses (76%, pending review). Character-group coverage stays separate (22 P2 characters with complete pools). HCL shares every question, so HCL figures show availability, not HCL depth.
- **Finer leaves (owner decision 2026-10-16).** Draft.2 adds 辨识字音 and 理解字义 beside the character-form leaf and splits practical-text retrieval (notices, cards) from passage retrieval, under the same PDF pages as their parents. Punctuation-choice items move to 正确使用标点符号 (`w-punctuation`); 借助标点理解 (`r-punctuation`) now has its own items. These splits are a proposal for the independent page/grade audit; the coloured grade bands cannot be read from flattened PDF text.
- **Item review.** Claude reviewed all 318 v7 items. Claude drafted 293 of them, so for those this is an author recheck, not independent AI cross-review. Findings fixed in v8: an answer given away by another question's option (`zh-m12.q5`), a stem containing its key, a double-cue stem, four calculation questions mapped as explicit retrieval (applying information is a later-grade skill), 33 hints that named the radical only the answer has, ten P2 instructions reworded within the P1–P2 character lists, one franchise character name and one misleading hint. Three tested characters outside the official P1–P3 lists (`zh-m18.q2`, `zh-m18.q4`, `zh-m15.q5`) are disputed for an owner ruling.
- **New content (39 items).** P2 字音 (10), 字义 (7), 偏旁表义 general practice and route (7), 借助标点理解 (7), and a 生日卡 visual text with a 贺卡/便条 format route (8), in four new topic groups. Pinyin items assess written pinyin recognition only. New items need independent cross-review before they join a sample pool.
- **Review pack.** [Review pack v8](content-review/CHINESE_REVIEW_PACK_V8.md): 15 disputed items, 39 new items, 44 wording-only changes and a seeded random 20% sample (52 of 259 unchanged agreed items, recorded in `review_log.sampled_item_ids`). Owner decisions are recorded on the tracking PR, not in this file.
- **Still open.** Four empty P2 leaves (借助图文和拼音理解 needs reviewed images; 使用阅读辅助工具, 选择与积累表达素材, 完整句子组织); every complete route has one item per stage; ten P2 and nine P3 materials give about five and four days of material before repetition at X=10; matching, ordering and low-option formats have no contract; independent cross-review, owner sign-off, rights review and the source/grade audit remain pending.

Validation: `python3 scripts/validate_chinese_content.py`, the contract tests, `python3 scripts/chinese_release_inventory.py --check` and the privacy guard.

## Current review — batch version 10

Before drafting or reviewing Chinese items, read the common [question authoring skill](../skills/question-authoring/SKILL.md), then the [Chinese layer](../skills/chinese-question-authoring/SKILL.md) on top of it. The [PR 23 case log](../skills/chinese-question-authoring/references/pr23-lessons.md) records each error found in cross-review, its cause and the check that now catches it.

**Owner decisions 2026-10-18:** all 24 disputed items and all 67 sampled items accepted, batch approved and rights cleared by the owner. The owner also confirmed the three v10 refinements and waived their ChatGPT re-review, so the batch status is `approved`. The manifest denominator, visual grade audit and release gates are unchanged.

**Owner decisions on the grade-chart audit (2026-10-18):** `w-ideas` (选择与积累表达素材, which maps to the syllabus row 选取写作材料, first shaded at P5 on PDF p30) is removed from all four courses. It had no questions. P2 now has 16 proposed leaves, with 13 authored (81%). The owner kept the other three findings as they are: `zh.p3_chinese.r-word-context` (推断词句意思), `zh.p3_higher_chinese.r-infer-cause` (推断原因) and P3 `r-radical` (偏旁部首) stay in P3.

See [review pack v10](content-review/CHINESE_REVIEW_PACK_V10.md) for the ten item corrections, the 24 owner dispositions, the reproducible 67-of-333 owner sample and complete material context. ChatGPT desk-reviewed the 357-item v8 input; its own ten edits require Claude re-review. Source fingerprints match the register, but the independent visual grade audit, denominator approval, rights clearance and owner sign-off remain open. The earlier v8 pack and prior disposition above are historical evidence, not approval of this head.

The inventory now uses leaf-specific repair stages and per-route thin-stock counts. Its material supply is an upper bound on complete tasks without reuse, not a scheduling prediction. No app files, import allowlists or learner-data gates change.

## Second batch — zh-starter-002 v1 (18 October 2026)

New P2 content is published as a separate batch, so the owner's approval of `zh-starter-001` v10 is unchanged and covers only its own items. Each batch carries its own review state. The validator checks every file in `content/chinese/batches/` on its own and rejects an item, material or group ID used in two batches. The release inventory combines the batches for counting and names the open gates of each batch.

The batch adds four topic sets, each with a complete exact/similar/generic pool: look-alike and sound-alike characters (远 完 捉 带 记), character sounds and written pinyin, word choice (它 for animals and things, 把/给, 呢, 乖 and 欺负), and finding the whole reason in a short text. P2 school exercise formats were reviewed privately to choose question types; no worksheet, textbook or past-paper wording, answer or learner information is used. As with every public group, the targets are generic curriculum content and not a record of any learner's errors. Items, disputes, the owner sample and the author checks are in the [review pack](content-review/CHINESE_REVIEW_PACK_STARTER_002.md).

## 6. Starter content review

Version 10. Original generic drafts, not learner targets or copied passages. `[空n]` denotes a linked blank, with pinyin annotations expanded for this review view. Keys are review aids, not shipping approval. No application rendering validation is claimed here.

### zh-m01 · 种豆子 (v2)

Courses: p2_chinese, p2_higher_chinese. Kind: reading.

> 星期六早上，小安和姐姐在家种豆子。姐姐拿来两个小盆，小安把泥土放进盆里。他们把豆子放进泥土，再浇一点水。最后，他们把小盆放在窗边。小安说：“我明天还要来看！”

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m01.q1 v2 / general | 他们什么时候种豆子？<br>1 星期六早上；2 星期六晚上；3 星期天早上；4 星期天晚上 | 星期六早上 | 找一找第一句的时间。 | 第一句写明是星期六早上。 | 找出短文中明示的信息 |
| zh-m01.q2 v2 / general | 谁拿来小盆？<br>1 小安；2 姐姐；3 爸爸；4 奶奶 | 姐姐 | 看看“拿来”前面写的是谁。 | 短文说是姐姐拿来两个小盆。 | 找出短文中明示的信息 |
| zh-m01.q3 v2 / general | 姐姐拿来几个小盆？<br>1 一个；2 三个；3 四个；4 两个 | 两个 | 再读姐姐拿小盆的那一句。 | 姐姐拿来两个小盆。 | 找出短文中明示的信息 |
| zh-m01.q4 v2 / general | 放好豆子后，他们接着做什么？<br>1 拿来小盆；2 放泥土；3 浇一点水；4 收起小盆 | 浇一点水 | 找“再”后面的动作。 | 放好豆子后，他们再浇一点水。 | 找出短文中明示的信息 |
| zh-m01.q5 v2 / general | 最后，小盆放在哪里？<br>1 桌下；2 门外；3 床边；4 窗边 | 窗边 | 找“最后”后面写的地方。 | 短文说最后把小盆放在窗边。 | 找出短文中明示的信息 |

### zh-m02 · 图书角通知 (v3)

Courses: p2_chinese, p2_higher_chinese. Kind: visual_text.

> 【图书角通知】
> 星期三下午三点，图书角开放。
> 地点：一楼活动室。
> 请带借书卡，每人可借两本书。
> 请在下个星期三还书。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m02.q1 v2 / general | 图书角哪一天开放？<br>1 星期一；2 星期二；3 星期三；4 星期四 | 星期三 | 看通知中的开放时间。 | 通知写明星期三开放。 | 从通知、告示中找信息 |
| zh-m02.q2 v2 / general | 图书角几点开放？<br>1 上午三点；2 下午三点；3 下午四点；4 上午四点 | 下午三点 | 注意“上午”和“下午”。 | 通知写明下午三点。 | 从通知、告示中找信息 |
| zh-m02.q3 v3 / general | 图书角在哪里？<br>1 一楼活动室；2 二楼活动室；3 一楼音乐室；4 二楼音乐室 | 一楼活动室 | 找“地点”一栏。 | 地点一栏写的是一楼活动室。 | 从通知、告示中找信息 |
| zh-m02.q4 v2 / general | 借书时要带什么？<br>1 水杯；2 画纸；3 球；4 借书卡 | 借书卡 | 找“请带”后面的东西。 | 通知要求带借书卡。 | 从通知、告示中找信息 |
| zh-m02.q5 v2 / general | 每人可借几本书？<br>1 一本；2 两本；3 三本；4 四本 | 两本 | 找“每人可借”后面的数目。 | 通知写明每人可借两本书。 | 从通知、告示中找信息 |

### zh-m03 · 公园里的早晨 (v2)

Courses: p2_chinese, p2_higher_chinese. Kind: cloze.

> 早上，我和妈妈到公园。雨停了，天放[空1]了。小鸟在树上[空2]。妈妈坐在长椅上，我沿(yán)着小路慢慢地[空3]。走累了，我喝了几口[空4]。回家前，我们把空瓶放进垃圾[空5]。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m03.q1 v2 / general | 第1空选哪个字？<br>1 晴；2 睛；3 请；4 情 | 晴 | 这里写的是雨后的天气。 | “放晴”是说天不再下雨，太阳出来了。 | zh.p2_chinese.char.u6674; zh.p2_higher_chinese.char.u6674 |
| zh-m03.q2 v2 / general | 第2空选哪个词？<br>1 写字；2 洗澡；3 唱歌；4 看书 | 唱歌 | 看看做这个动作的是谁。 | 这段话写小鸟在树上唱歌。 | 根据句意选择词语 |
| zh-m03.q3 v2 / general | 第3空选哪个词？<br>1 游泳；2 走路；3 睡觉；4 吃饭 | 走路 | 留意“小路”和后面的“走累了”。 | 小路和“走累了”告诉我们，这里应选“走路”。 | 根据句意选择词语 |
| zh-m03.q4 v3 / general | 第4空选哪个字？<br>1 永；2 水；3 木；4 禾 | 水 | 想想“喝了几口”后面可以接什么。 | “水”可以喝。“永”和“水”样子很像，要看清楚。 | 根据句意选字 |
| zh-m03.q5 v2 / general | 第5空选哪个字？<br>1 桶；2 桥；3 床；4 窗 | 桶 | 想想放垃圾的容器叫什么。 | 空瓶要放进垃圾桶，这里选“桶”。 | 根据句意选字 |

### zh-m04 · 找雨伞 (v2)

Courses: p2_chinese, p2_higher_chinese. Kind: reading.

> 放学时下雨了。小文打开书包，发现没有带伞。老师借给他一把蓝伞。小文向老师道谢，撑着蓝伞回家。第二天早上，小文把伞擦干，放回老师的桌上。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m04.q1 v2 / general | 什么时候下雨了？<br>1 上课时；2 吃饭时；3 睡觉时；4 放学时 | 放学时 | 看第一句。 | 第一句写明放学时下雨了。 | 找出短文中明示的信息 |
| zh-m04.q2 v2 / general | 小文在书包里没有找到什么？<br>1 书；2 伞；3 笔；4 水杯 | 伞 | 找“没有带”后面的东西。 | 小文发现没有带伞。 | 找出短文中明示的信息 |
| zh-m04.q3 v2 / general | 谁借伞给小文？<br>1 老师；2 同学；3 妈妈；4 姐姐 | 老师 | 找“借给他”前面的人。 | 短文说老师借给他一把蓝伞。 | 找出短文中明示的信息 |
| zh-m04.q4 v2 / general | 借来的伞是什么颜色？<br>1 红色；2 黄色；3 蓝色；4 绿色 | 蓝色 | 看看老师借出的是什么伞。 | 短文写的是蓝伞。 | 找出短文中明示的信息 |
| zh-m04.q5 v2 / general | 第二天早上，小文把伞放在哪里？<br>1 书包里；2 门边；3 椅子上；4 老师的桌上 | 老师的桌上 | 看最后一句。 | 最后一句写明把伞放回老师的桌上。 | 找出短文中明示的信息 |

### zh-m05 · 换一个办法 (v2)

Courses: p3_chinese, p3_higher_chinese. Kind: reading.

> 学校的图书角要增加一个放书的地方。小宁想用纸盒做书架，可是大纸盒太软，放进几本书就倒了。她和伙伴把书拿出来，在盒子里加了两块硬纸板，再把较重的书放在下面。这次，纸盒站稳了。伙伴说：“先试一试，再改一改，真有用！”

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m05.q1 v2 / general | 他们想增加什么地方？<br>1 放球的地方；2 放书的地方；3 放伞的地方；4 放鞋的地方 | 放书的地方 | 先读第一句。 | 第一句明确写明要增加放书的地方。 | 找出短文中明示的信息 |
| zh-m05.q2 v2 / general | 小宁最初准备用什么做书架？<br>1 木板；2 塑料箱；3 纸盒；4 铁架 | 纸盒 | 找“小宁想用”后面的材料。 | 短文说小宁想用纸盒做书架。 | 找出短文中明示的信息 |
| zh-m05.q3 v2 / general | 纸盒开始为什么倒了？<br>1 纸盒太软；2 书太少；3 地上有水；4 没有伙伴 | 纸盒太软 | 找“可是”后面明说的情况。 | 短文说大纸盒太软，所以放进书后就倒了。 | 找出短文中明示的信息 |
| zh-m05.q4 v2 / general | 他们加了几块硬纸板？<br>1 一块；2 三块；3 四块；4 两块 | 两块 | 找“硬纸板”前面的数目。 | 他们加了两块硬纸板。 | 找出短文中明示的信息 |
| zh-m05.q5 v2 / general | 较重的书后来放在哪里？<br>1 盒子旁边；2 下面；3 上面；4 桌子底下 | 下面 | 找“较重的书”后面的地方。 | 文中写明把较重的书放在下面。 | 找出短文中明示的信息 |

### zh-m06 · 帮奶奶 (v1)

Courses: p2_chinese, p2_higher_chinese. Kind: reading.

> 星期天，我去奶奶家。奶奶的腿不好，走路很慢。我帮奶奶扫地，还帮她把晒干的衣服收进来。中午，奶奶给我做了我最爱吃的鸡蛋面。吃完饭，我和奶奶一起看照片。奶奶说：“你长大了，真是一个好孩子！”我听了，心里很高兴。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m06.q1 v1 / general | 我什么时候去奶奶家？<br>1 星期一；2 星期六；3 放学后；4 星期天 | 星期天 | 看第一句。 | 第一句写明是星期天。 | 找出短文中明示的信息 |
| zh-m06.q2 v1 / general | 奶奶走路为什么很慢？<br>1 路太远了；2 外面下雨了；3 奶奶太累了；4 奶奶的腿不好 | 奶奶的腿不好 | 找写奶奶走路的句子。 | 短文说奶奶的腿不好，走路很慢。 | 找出短文中明示的信息 |
| zh-m06.q3 v1 / general | 我帮奶奶做了哪件事？<br>1 洗碗；2 扫地；3 买菜；4 做饭 | 扫地 | 找“我帮奶奶”后面的话。 | 我帮奶奶扫地，还把衣服收进来。 | 找出短文中明示的信息 |
| zh-m06.q4 v1 / general | 中午奶奶给我做了什么？<br>1 鸡汤；2 炒饭；3 鸡蛋面；4 面包 | 鸡蛋面 | 找“中午”那一句。 | 奶奶做了鸡蛋面。 | 找出短文中明示的信息 |
| zh-m06.q5 v1 / general | 听了奶奶的话，我心里觉得怎样？<br>1 生气；2 难过；3 高兴；4 害怕 | 高兴 | 看最后一句。 | 最后一句写我心里很高兴。 | 找出短文中明示的信息 |

### zh-m07 · 小蚂蚁搬家 (v1)

Courses: p2_chinese, p2_higher_chinese. Kind: reading.

> 天空乌云密布，小蚂蚁们排着长长的队伍，一只接一只地往高处搬。它们有的搬米粒，有的搬面包屑。一只小蚂蚁搬不动一块大饼干，旁边的两只蚂蚁马上过来帮忙。不久，大雨哗哗地下起来了，这时蚂蚁们已经住进了新家。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m07.q1 v1 / general | 故事开始时，天空是什么样子？<br>1 下着大雪；2 阳光很好；3 乌云密布；4 出现彩虹 | 乌云密布 | 看第一句。 | 第一句写天空乌云密布。 | 找出短文中明示的信息 |
| zh-m07.q2 v1 / general | 蚂蚁们往哪里搬？<br>1 往低处搬；2 往河里搬；3 往高处搬；4 往树洞里搬 | 往高处搬 | 找“往”后面的词。 | 蚂蚁们往高处搬。 | 找出短文中明示的信息 |
| zh-m07.q3 v1 / general | 小蚂蚁搬不动什么？<br>1 一块大饼干；2 一片叶子；3 一点面包屑；4 一粒米 | 一块大饼干 | 找“搬不动”。 | 小蚂蚁搬不动一块大饼干。 | 找出短文中明示的信息 |
| zh-m07.q4 v1 / general | 谁来帮小蚂蚁？<br>1 一只小鸟；2 蚂蚁妈妈；3 没有人；4 旁边的两只蚂蚁 | 旁边的两只蚂蚁 | 找“帮忙”前面的词。 | 旁边的两只蚂蚁马上过来帮忙。 | 找出短文中明示的信息 |
| zh-m07.q5 v2 / general | 下大雨时，小蚂蚁们已经住进了哪里？<br>1 新家；2 河里；3 树顶；4 饼干下面 | 新家 | 再读故事的最后一句。 | 最后一句说，蚂蚁们已经住进了新家。 | 找出短文中明示的信息 |

### zh-m08 · 游泳班报名 (v1)

Courses: p2_chinese, p2_higher_chinese. Kind: visual_text.

> 【游泳班报名】
> 对象：二年级学生
> 时间：每星期二下午三点到四点
> 地点：学校游泳池
> 费用：每人二十元
> 请在三月五日以前把报名表交给林老师。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m08.q1 v1 / general | 谁可以报名参加游泳班？<br>1 家长；2 二年级学生；3 所有老师；4 一年级学生 | 二年级学生 | 看“对象”。 | 对象是二年级学生。 | 从通知、告示中找信息 |
| zh-m08.q2 v1 / general | 游泳班在星期几上课？<br>1 星期一；2 星期二；3 星期六；4 星期三 | 星期二 | 看“时间”。 | 时间是每星期二。 | 从通知、告示中找信息 |
| zh-m08.q3 v2 / general | 游泳班几点开始上课？<br>1 下午两点；2 上午三点；3 下午三点；4 下午四点 | 下午三点 | 看“时间”一行。 | “时间”一行写明下午三点到四点，所以三点开始。 | 从通知、告示中找信息 |
| zh-m08.q4 v1 / general | 报名表要交给谁？<br>1 游泳教练；2 校长；3 班长；4 林老师 | 林老师 | 看最后一句。 | 报名表交给林老师。 | 从通知、告示中找信息 |
| zh-m08.q5 v1 / general | 最迟要在什么时候交报名表？<br>1 每星期二；2 三月五日以后；3 三月五日以前；4 下午四点以后 | 三月五日以前 | 找“以前”。 | 要在三月五日以前交。 | 从通知、告示中找信息 |

### zh-m09 · 过春节 (v1)

Courses: p2_chinese, p2_higher_chinese. Kind: reading.

> 春节是华人最重要的节日。过年前，大家把家里打扫干净，贴上红红的春联。除夕晚上，一家人围在一起吃团圆饭。大年初一，孩子们穿上新衣服，向长辈拜年，还会收到红包。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m09.q1 v1 / general | 过年前大家会做什么？<br>1 打扫家里；2 种很多树；3 去海边游泳；4 搬新家 | 打扫家里 | 看第二句。 | 过年前大家把家里打扫干净。 | 找出短文中明示的信息 |
| zh-m09.q2 v1 / general | 春联是什么颜色的？<br>1 白色；2 红色；3 蓝色；4 绿色 | 红色 | 找“春联”前面的词。 | 短文说“红红的春联”。 | 找出短文中明示的信息 |
| zh-m09.q3 v1 / general | 除夕晚上一家人做什么？<br>1 出门旅行；2 早早睡觉；3 去看电影；4 吃团圆饭 | 吃团圆饭 | 找“除夕晚上”。 | 除夕晚上一家人吃团圆饭。 | 找出短文中明示的信息 |
| zh-m09.q4 v1 / general | 大年初一孩子们会穿什么？<br>1 雨衣；2 睡衣；3 校服；4 新衣服 | 新衣服 | 找“大年初一”。 | 孩子们穿上新衣服。 | 找出短文中明示的信息 |
| zh-m09.q5 v1 / general | 孩子们拜年时会收到什么？<br>1 玩具车；2 书包；3 红包；4 蛋糕 | 红包 | 看最后一句。 | 孩子们会收到红包。 | 找出短文中明示的信息 |

### zh-m18 · 我的一天 (v1)

Courses: p2_chinese, p2_higher_chinese. Kind: cloze.

> 早上六点半，我[空1]床了。我刷牙、洗脸，然后吃早饭。七点，我[空2]着书包去上学。在学校里，我认真上课，下课时和同学们一起[空3]游戏。放学回家后，我先做功课，再帮妈妈摆碗筷。晚上九点，我[空4]时上床睡觉。我觉得这一天过得很[空5]。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m18.q1 v1 / general | 第1空选哪个字？<br>1 走；2 赶；3 起；4 超 | 起 | 早上醒来以后，要从床上怎样？ | “起床”表示醒来后离开床。 | 根据句意选字 |
| zh-m18.q2 v1 / general | 第2空选哪个字？<br>1 倍；2 北；3 背；4 被 | 背 | 书包放在身后，用肩膀带着。 | 书包要“背”着。 | 根据句意选字 |
| zh-m18.q3 v1 / general | 第3空选哪个字？<br>1 完；2 园；3 玩；4 远 | 玩 | 和同学们一起做游戏。 | “玩游戏”的“玩”是王字旁。 | 根据句意选字 |
| zh-m18.q4 v1 / general | 第4空选哪个字？<br>1 案；2 按；3 安；4 暗 | 按 | 照着规定的时间去做。 | “按时”表示照着规定的时间。 | 根据句意选字 |
| zh-m18.q5 v1 / general | 第5空选哪个词？<br>1 可怕；2 难过；3 无聊；4 充实 | 充实 | 一天里做了很多有意义的事。 | 做了很多事，一天过得很充实。 | 根据句意选择词语 |

### zh-m19 · 生日卡 (v1)

Courses: p2_chinese, p2_higher_chinese. Kind: visual_text.

> 【生日贺卡(hè kǎ)】
> 亲爱的小美：
> 祝你生日快乐！
> 也祝你天天开心，身体健康。
> 你的好朋友 小文
> 十月八日

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m19.q1 v1 / general | 这张卡是写给谁的？<br>1 小文；2 小美；3 妈妈；4 老师 | 小美 | 看第一行“亲爱的”后面的名字。 | 第一行写着“亲爱的小美”，卡是写给小美的。 | 认识贺卡、便条的格式（称呼、祝福语、写的人、日期） |
| zh-m19.q2 v1 / general | 这张卡是谁写的？<br>1 小美；2 老师；3 小文；4 妈妈 | 小文 | 看卡的下面写的名字。 | 卡的下面写着“你的好朋友 小文”。 | 认识贺卡、便条的格式（称呼、祝福语、写的人、日期） |
| zh-m19.q3 v1 / general | 这张卡是哪一天写的？<br>1 十月八日；2 八月十日；3 十月一日；4 八月八日 | 十月八日 | 看卡最下面的日期。 | 最下面写着十月八日。 | 认识贺卡、便条的格式（称呼、祝福语、写的人、日期） |
| zh-m19.q4 v1 / general | 小文祝小美什么？<br>1 新年快乐；2 生日快乐；3 学习进步；4 节日快乐 | 生日快乐 | 看“祝你”后面的话。 | 卡里写着“祝你生日快乐”。 | 认识贺卡、便条的格式（称呼、祝福语、写的人、日期） |
| zh-m19.q5 v1 / general | 卡的最下面写的是什么？<br>1 祝你的话；2 收卡的人；3 写卡的人和日期；4 送的礼物 | 写卡的人和日期 | 看看最后两行写了什么。 | 最后两行写的是写卡的人“小文”和日期“十月八日”。 | 认识贺卡、便条的格式（称呼、祝福语、写的人、日期） |

### zh-m10 · 小熊开店 (v1)

Courses: p3_chinese, p3_higher_chinese. Kind: reading.

> 小熊在森林里开了一家面包店。开业第一天，它做了很多面包，可是来买的动物很少。小熊很着急，就去问猫头鹰。猫头鹰说：“你的店在树林深处，大家都找不到。”小熊想了想，在路口挂了一块写着“香香面包店”的牌子，还送面包给路过的动物试吃。第二天，店里挤满了客人。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m10.q1 v1 / general | 小熊开了一家什么店？<br>1 书店；2 花店；3 水果店；4 面包店 | 面包店 | 看第一句。 | 小熊开了一家面包店。 | 找出短文中明示的信息 |
| zh-m10.q2 v1 / general | 第一天为什么来买面包的动物很少？<br>1 价钱太贵；2 店在树林深处，大家找不到；3 那天下大雨；4 面包不好吃 | 店在树林深处，大家找不到 | 猫头鹰说了什么？ | 猫头鹰说店在树林深处，大家都找不到。 | 找出短文中明示的信息 |
| zh-m10.q3 v1 / general | 小熊去问谁？<br>1 小兔；2 猫头鹰；3 狐狸；4 大象 | 猫头鹰 | 找“去问”。 | 小熊去问猫头鹰。 | 找出短文中明示的信息 |
| zh-m10.q4 v1 / general | 小熊想到了什么办法？<br>1 挂牌子，还送面包给大家试吃；2 把面包卖得更贵；3 搬到河边；4 把店关了 | 挂牌子，还送面包给大家试吃 | 找“小熊想了想”后面的话。 | 它挂了牌子，还送面包试吃。 | 找出短文中明示的信息 |
| zh-m10.q5 v2 / general | 第二天，面包店里有什么变化？<br>1 面包全都不见了；2 店里没有客人；3 店搬到了路口；4 店里挤满了客人 | 店里挤满了客人 | 找一找写“第二天”的那一句。 | 最后一句说，第二天店里挤满了客人。 | 找出短文中明示的信息 |

### zh-m11 · 垃圾分类 (v2)

Courses: p3_chinese, p3_higher_chinese. Kind: reading.

> 垃圾可以分成可回收的和不可回收的。纸张、塑料瓶和铁罐都可以回收，回收后能做成新的东西。剩饭剩菜和用过的纸巾不能放进回收箱。如果大家都做好分类，就能减少垃圾，保护我们的环境。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m11.q1 v2 / general | 短文说垃圾可以分成哪两类？<br>1 大的和小的；2 可回收的和不可回收的；3 新的和旧的；4 干的和湿的 | 可回收的和不可回收的 | 读第一句。 | 第一句写明垃圾可以分成可回收的和不可回收的。 | 找出短文中明示的信息 |
| zh-m11.q2 v1 / general | 下面哪样东西可以回收？<br>1 塑料瓶；2 剩饭；3 剩菜；4 用过的纸巾 | 塑料瓶 | 找“可以回收”。 | 纸张、塑料瓶和铁罐可以回收。 | 找出短文中明示的信息 |
| zh-m11.q3 v1 / general | 下面哪样东西不能放进回收箱？<br>1 用过的纸巾；2 纸张；3 塑料瓶；4 铁罐 | 用过的纸巾 | 找“不能放进回收箱”。 | 用过的纸巾不能回收。 | 找出短文中明示的信息 |
| zh-m11.q4 v1 / general | 回收的东西可以怎样？<br>1 做成新的东西；2 扔进大海；3 全部烧掉；4 埋进土里 | 做成新的东西 | 找“回收后”。 | 回收后能做成新的东西。 | 找出短文中明示的信息 |
| zh-m11.q5 v1 / general | 做好垃圾分类有什么好处？<br>1 减少垃圾，保护环境；2 让天气变热；3 让垃圾变多；4 让食物更好吃 | 减少垃圾，保护环境 | 看最后一句。 | 可以减少垃圾，保护环境。 | 找出短文中明示的信息 |

### zh-m12 · 我的好朋友 (v1)

Courses: p3_chinese, p3_higher_chinese. Kind: reading.

> 我的好朋友叫小美。她个子不高，戴着一副圆圆的眼镜。小美很爱看书，每次下课都在图书角看书。有一次，我的铅笔盒掉在地上，铅笔撒了一地，小美马上蹲下来帮我捡。她还常常教我做数学题。有这样的好朋友，我觉得很幸福。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m12.q1 v1 / general | 小美长什么样子？<br>1 很瘦，穿着红裙子；2 很胖，戴着帽子；3 个子不高，戴着圆眼镜；4 个子很高，留着长发 | 个子不高，戴着圆眼镜 | 看第二句。 | 小美个子不高，戴着一副圆圆的眼镜。 | 找出短文中明示的信息 |
| zh-m12.q2 v1 / general | 下课时，小美常常做什么？<br>1 在操场打球；2 在图书角看书；3 在食堂吃东西；4 在课室睡觉 | 在图书角看书 | 找“每次下课”。 | 每次下课她都在图书角看书。 | 找出短文中明示的信息 |
| zh-m12.q3 v1 / general | 我的铅笔盒掉了，小美怎么做？<br>1 马上蹲下来帮我捡铅笔；2 去告诉老师；3 走开了；4 笑我不小心 | 马上蹲下来帮我捡铅笔 | 找“有一次”那几句。 | 小美马上蹲下来帮我捡。 | 找出短文中明示的信息 |
| zh-m12.q4 v1 / general | 小美还常常帮我做什么？<br>1 教我做数学题；2 帮我写作文；3 帮我买午餐；4 帮我打扫课室 | 教我做数学题 | 找“她还常常”。 | 她常常教我做数学题。 | 找出短文中明示的信息 |
| zh-m12.q5 v3 / general | 有了这样的好朋友，“我”觉得怎样？<br>1 很害怕；2 很幸福；3 很生气；4 很无聊 | 很幸福 | 看最后一句。 | 最后一句写明：有这样的好朋友，我觉得很幸福。 | 找出短文中明示的信息 |

### zh-m13 · 中秋节 (v1)

Courses: p3_chinese, p3_higher_chinese. Kind: reading.

> 农历八月十五是中秋节。晚上，月亮又大又圆。家家户户都会吃月饼，孩子们提着各种各样的灯笼在公园里玩。奶奶告诉我，月亮圆了，一家人也要团团圆圆。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m13.q1 v1 / general | 中秋节是哪一天？<br>1 农历五月五日；2 农历十二月三十日；3 农历八月十五；4 农历一月一日 | 农历八月十五 | 看第一句。 | 农历八月十五是中秋节。 | 找出短文中明示的信息 |
| zh-m13.q2 v1 / general | 中秋节晚上的月亮是什么样子的？<br>1 是红色的；2 又大又圆；3 看不见；4 又小又弯 | 又大又圆 | 看第二句。 | 月亮又大又圆。 | 找出短文中明示的信息 |
| zh-m13.q3 v1 / general | 中秋节大家会吃什么？<br>1 年糕；2 粽子；3 月饼；4 汤圆 | 月饼 | 找“都会吃”。 | 家家户户都会吃月饼。 | 找出短文中明示的信息 |
| zh-m13.q4 v1 / general | 孩子们在公园里提着什么玩？<br>1 灯笼；2 雨伞；3 气球；4 风筝 | 灯笼 | 找“孩子们提着”。 | 孩子们提着灯笼玩。 | 找出短文中明示的信息 |
| zh-m13.q5 v1 / general | 奶奶说月亮圆了，代表什么？<br>1 要多吃月饼；2 要早点睡觉；3 一家人要团圆；4 明天会下雨 | 一家人要团圆 | 看最后一句。 | 月亮圆了，一家人也要团团圆圆。 | 找出短文中明示的信息 |

### zh-m14 · 学飞的小鸟 (v1)

Courses: p3_chinese, p3_higher_chinese. Kind: reading.

> 小鸟第一次学飞，它站在树枝上，看着下面，心里有点害怕。妈妈说：“别怕，张开翅膀，用力拍！”小鸟试了一次，摔到了草地上。它没有哭，爬起来又飞了一次、两次……到了傍晚，它终于飞上了天空。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m14.q1 v1 / general | 小鸟第一次学什么？<br>1 学游泳；2 学找虫子；3 学飞；4 学唱歌 | 学飞 | 看第一句。 | 小鸟第一次学飞。 | 找出短文中明示的信息 |
| zh-m14.q2 v1 / general | 小鸟站在树枝上时，心里觉得怎样？<br>1 很生气；2 有点害怕；3 非常开心；4 很想睡觉 | 有点害怕 | 找“心里”。 | 它心里有点害怕。 | 找出短文中明示的信息 |
| zh-m14.q3 v1 / general | 小鸟摔到草地上以后，怎么做？<br>1 在草地上睡觉；2 爬起来再飞；3 不再学飞；4 哭着回家 | 爬起来再飞 | 找“它没有哭”。 | 它爬起来又飞了一次、两次。 | 找出短文中明示的信息 |
| zh-m14.q4 v1 / general | 小鸟什么时候终于飞上天空？<br>1 半夜；2 早上；3 傍晚；4 中午 | 傍晚 | 找“终于”。 | 到了傍晚，它终于飞上了天空。 | 找出短文中明示的信息 |
| zh-m14.q5 v2 / general | 妈妈叫小鸟张开什么？<br>1 嘴巴；2 翅膀；3 尾巴；4 爪子 | 翅膀 | 再读妈妈对小鸟说的话。 | 妈妈说：“张开翅膀，用力拍！” | 找出短文中明示的信息 |

### zh-m15 · 去动物园 (v1)

Courses: p3_chinese, p3_higher_chinese. Kind: cloze.

> 星期六，爸爸带我去动物园。我们先去看猴子，它们在树上爬上爬下，真[空1]爱。接着，我们看到一只大象正在用长鼻子[空2]水。吃完午饭[空3]后，我们去看企鹅。企鹅走路一[空4]一摆的，大家都笑了。这真是[空5]快的一天。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m15.q1 v1 / general | 第1空选哪个字？<br>1 哥；2 河；3 何；4 可 | 可 | 组成一个形容猴子的词。 | “可爱”是形容猴子的词。 | 根据句意选字 |
| zh-m15.q2 v1 / general | 第2空选哪个字？<br>1 跑；2 喷；3 唱；4 睡 | 喷 | 大象用鼻子把水怎样？ | 大象用鼻子“喷水”。 | 根据句意选字 |
| zh-m15.q3 v1 / general | 第3空选哪个字？<br>1 以；2 心；3 比；4 已 | 以 | 组成表示时间先后的词。 | “以后”表示时间在后面。 | 根据句意选字 |
| zh-m15.q4 v2 / general | 第4空选哪个字？<br>1 瑶；2 摇；3 谣；4 遥 | 摇 | 企鹅走路时，身体会左右怎样动？ | “一摇一摆”是说身体左右晃动。“摇”是提手旁，要和“瑶、谣、遥”分清楚。 | 根据句意选字 |
| zh-m15.q5 v1 / general | 第5空选哪个字？<br>1 偷；2 榆；3 输；4 愉 | 愉 | 组成表示开心的词。 | “愉快”表示开心，竖心旁。 | 根据句意选字 |

### zh-m16 · 做纸风车 (v2)

Courses: p3_chinese, p3_higher_chinese. Kind: cloze.

> 今天美术课，老师教我们做纸风车。我先把一张正方形的纸沿着两条对角线对[空1]，压出折痕。再从四个角往中心剪，中间留一小块不剪。接着，我把每个三角形的一个角[空2]到中心，叠在一起，用一枚图钉把中心钉在一根小木棍上，不要钉得太紧。风车做好了！风一吹，风车就[空3]了起来。我[空4]地拿给妈妈看，妈妈[空5]我做得很好。

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m16.q1 v3 / general | 第1空选哪个字？<br>1 跳；2 折；3 吃；4 拆 | 折 | 把纸对齐压出一条线，这个动作叫什么？ | “对折”是把纸对齐折起来，才能压出折痕。 | 根据语境理解和选择词语 |
| zh-m16.q2 v3 / general | 第2空选哪个字？<br>1 跑；2 拉；3 唱；4 吃 | 拉 | 要把纸角移到中心，用手怎么做？ | 把纸角“拉”到中心，四个角才能叠在一起。 | 根据语境理解和选择词语 |
| zh-m16.q3 v3 / general | 第3空选哪个字？<br>1 转；2 砖；3 软；4 传 | 转 | 风车被风吹时会怎样动？ | 风车被风吹，会一圈一圈地“转”起来。这几个字字形相近，要看部首和意思。 | 根据句意选字 |
| zh-m16.q4 v2 / general | 第4空选哪个词？<br>1 生气；2 难过；3 高兴；4 害怕 | 高兴 | 风车做好了，“我”的心情会怎样？ | 自己做好了风车，所以很高兴地拿给妈妈看。 | 根据语境理解和选择词语 |
| zh-m16.q5 v3 / general | 第5空选哪个字？<br>1 叫；2 夸；3 骂；4 问 | 夸 | 妈妈说“我”做得很好，是在做什么？ | 说别人做得好，就是“夸”别人。 | 根据语境理解和选择词语 |

### zh-m17 · 图书馆借书须知 (v1)

Courses: p3_chinese, p3_higher_chinese. Kind: visual_text.

> 【借书须知】
> 1. 每人每次最多可借三本书。
> 2. 借书期限为两个星期。
> 3. 请爱护图书，不要在书上画画。
> 4. 逾期(yú qī)还书，每本每天罚款十分钱。
> 开放时间：星期一至星期五，上午七点半到下午四点

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-m17.q1 v1 / general | 每人每次最多可以借几本书？<br>1 五本；2 一本；3 两本；4 三本 | 三本 | 看第1条。 | 每人每次最多可借三本书。 | 从通知、告示中找信息 |
| zh-m17.q2 v1 / general | 借书可以借多久？<br>1 两个星期；2 三天；3 一个星期；4 一个月 | 两个星期 | 看第2条。 | 借书期限为两个星期。 | 从通知、告示中找信息 |
| zh-m17.q3 v1 / general | 下面哪种做法是不对的？<br>1 星期一来借书；2 按时还书；3 在书上画画；4 爱护图书 | 在书上画画 | 看第3条。 | 须知说不要在书上画画。 | 从通知、告示中找信息 |
| zh-m17.q4 v1 / general | 星期六可以去图书馆借书吗？<br>1 可以；2 只能上午去；3 只能下午去；4 不可以 | 不可以 | 看开放时间。 | 图书馆只在星期一至星期五开放。 | 从通知、告示中找信息 |
| zh-m17.q5 v2 / general | 书迟还了，每本书每天要罚多少钱？<br>1 二十分钱；2 十分钱；3 五十分钱；4 一元 | 十分钱 | 看第4条。 | 第4条写明逾期还书每本每天罚款十分钱。 | 从通知、告示中找信息 |

### Standalone repair and general-practice items

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-p2-confusable-u5ea7.q1 v3 / exact | 一[空1]大山<br>1 座；2 坐；3 作；4 做 | 座 | 想一想，表示山的数量时用哪个字？ | “一座大山”用“座”表示山的数量。 | zh.p2_chinese.char.u5ea7; zh.p2_higher_chinese.char.u5ea7 |
| zh-p2-confusable-u5ea7.q2 v3 / similar | 这[空1]桥很长。<br>1 坐；2 作；3 座；4 做 | 座 | 这里要选表示桥的数量的字。 | 说一座桥、这座桥，都用“座”。 | zh.p2_chinese.char.u5ea7; zh.p2_higher_chinese.char.u5ea7 |
| zh-p2-confusable-u5ea7.q3 v3 / generic | 车上没有空[空1]了，只能站着。<br>1 做；2 座；3 作；4 坐 | 座 | 这里缺的是表示可以坐下的位置的字。 | 可以坐下的位置是“座”。有空座，才有地方坐。 | zh.p2_chinese.char.u5ea7; zh.p2_higher_chinese.char.u5ea7 |
| zh-p2-confusable-u6674.q1 v3 / exact | 天空没有云，今天是[空1]天。<br>1 睛；2 情；3 请；4 晴 | 晴 | 想一想，哪个字用来写天气？ | 没有云、天气好，可以说“晴天”。 | zh.p2_chinese.char.u6674; zh.p2_higher_chinese.char.u6674 |
| zh-p2-confusable-u6674.q2 v3 / similar | 今天天气[空1]朗，我们去海边玩。<br>1 晴；2 请；3 情；4 睛 | 晴 | 看看哪个字和天气有关。 | “晴朗”表示天上没有云，阳光很好。 | zh.p2_chinese.char.u6674; zh.p2_higher_chinese.char.u6674 |
| zh-p2-confusable-u6674.q3 v3 / generic | 天气预报(yù bào)说，明天[空1]，可以到公园走走。<br>1 请；2 睛；3 晴；4 情 | 晴 | 注意“天气预报”。 | 这里说的是明天的天气，应选“晴”。 | zh.p2_chinese.char.u6674; zh.p2_higher_chinese.char.u6674 |
| zh-p2-confusable-u4f4f.q1 v3 / exact | 我们一家人[空1]在组(zǔ)屋里。<br>1 往；2 住；3 主；4 注 | 住 | 这里说的是居住的地方。 | “住在”表示居住在某个地方。 | zh.p2_chinese.char.u4f4f; zh.p2_higher_chinese.char.u4f4f |
| zh-p2-confusable-u4f4f.q2 v3 / similar | 出门时，我记[空1]了妈妈的话。<br>1 主；2 往；3 注；4 住 | 住 | 这里要组成表示牢记的词。 | “记住”表示把事情牢牢记在心里。 | zh.p2_chinese.char.u4f4f; zh.p2_higher_chinese.char.u4f4f |
| zh-p2-confusable-u4f4f.q3 v3 / generic | 上车后，请抓[空1]扶手。<br>1 住；2 注；3 往；4 主 | 住 | 想一想，“抓”后面加哪个字，表示拿着不放开？ | “抓住”表示用手牢牢拿着，不放开。 | zh.p2_chinese.char.u4f4f; zh.p2_higher_chinese.char.u4f4f |
| zh-p2-confusable-u6e05.q1 v3 / exact | 河水很[空1]，可以看见小鱼。<br>1 请；2 清；3 情；4 晴 | 清 | 想一想，哪个字和水有关？ | “清”有三点水。“水很清”就是水很干净，能看到底。 | zh.p2_chinese.char.u6e05; zh.p2_higher_chinese.char.u6e05 |
| zh-p2-confusable-u6e05.q2 v3 / similar | 老师讲得很[空1]楚，我们都听懂了。<br>1 晴；2 情；3 清；4 请 | 清 | 这里要组成一个表示明白、不模糊的词。 | “清楚”表示明白、不模糊。 | zh.p2_chinese.char.u6e05; zh.p2_higher_chinese.char.u6e05 |
| zh-p2-confusable-u6e05.q3 v3 / generic | 吃饭前，我用[空1]水把手洗干净。<br>1 情；2 清；3 请；4 晴 | 清 | 想想洗手用的是什么样的水。 | “清水”是干净的水。“清”有三点水，和水有关。 | zh.p2_chinese.char.u6e05; zh.p2_higher_chinese.char.u6e05 |
| zh-p2-confusable-u5df2.q1 v3 / exact | 我[空1]经做完功课了。<br>1 己；2 已；3 以；4 乙 | 已 | 这里说的是事情做完了。 | “已经”表示事情做完了。“已”的左上角封了一半，“自己”的“己”不封口。 | zh.p2_chinese.char.u5df2; zh.p2_higher_chinese.char.u5df2 |
| zh-p2-confusable-u5df2.q2 v4 / similar | 天[空1]经黑了，我们回家吧。<br>1 以；2 己；3 已；4 乙 | 已 | 天不是刚要变黑，现在外面是什么样的？ | “已经”表示事情已经发生了。 | zh.p2_chinese.char.u5df2; zh.p2_higher_chinese.char.u5df2 |
| zh-p2-confusable-u5df2.q3 v3 / generic | 我们到的时候，电影[空1]经开始了。<br>1 乙；2 以；3 己；4 已 | 已 | 电影是在我们到之前开始的。 | 电影在我们到之前就开始了，所以用“已经”。 | zh.p2_chinese.char.u5df2; zh.p2_higher_chinese.char.u5df2 |
| zh-p2-confusable-u5356.q1 v3 / exact | 小贩在路边[空1]水果，一个苹果一块钱。<br>1 买；2 卖；3 实；4 读 | 卖 | 小贩把水果给别人，还收钱。 | 把东西给别人、收钱是“卖”；付钱拿东西是“买”。“卖”比“买”上面多一个“十”。 | zh.p2_chinese.char.u5356; zh.p2_higher_chinese.char.u5356 |
| zh-p2-confusable-u5356.q2 v3 / similar | 小贩大声叫：“[空1]西瓜啦，又大又甜！”<br>1 实；2 买；3 卖；4 读 | 卖 | 小贩想让别人来买他的西瓜。 | 小贩是在“卖”西瓜，想请别人来买。 | zh.p2_chinese.char.u5356; zh.p2_higher_chinese.char.u5356 |
| zh-p2-confusable-u5356.q3 v3 / generic | 姐姐把旧玩具[空1]了，得到十块钱。<br>1 卖；2 读；3 买；4 实 | 卖 | 想一想，得到钱的人是在买还是卖？ | 把东西给别人、得到钱，是“卖”。 | zh.p2_chinese.char.u5356; zh.p2_higher_chinese.char.u5356 |
| zh-p2-confusable-u5019.q1 v3 / exact | 放学的时[空1]，下起了大雨。<br>1 侯；2 候；3 猴；4 喉 | 候 | 这里要组成表示时间的词。 | “时候”表示时间。“候”中间有一短竖，“侯”没有。 | zh.p2_chinese.char.u5019; zh.p2_higher_chinese.char.u5019 |
| zh-p2-confusable-u5019.q2 v3 / similar | 我们在车站等[空1]巴士。<br>1 猴；2 侯；3 候；4 喉 | 候 | 这里要组成一个和“等”意思差不多的词。 | “等候”就是等。“候”中间有一短竖。 | zh.p2_chinese.char.u5019; zh.p2_higher_chinese.char.u5019 |
| zh-p2-confusable-u5019.q3 v3 / generic | 见到老师，我们要向老师问[空1]。<br>1 候；2 侯；3 猴；4 喉 | 候 | 这里说的是见面时打招呼。 | “问候”是见面时向别人打招呼、表示关心。 | zh.p2_chinese.char.u5019; zh.p2_higher_chinese.char.u5019 |
| zh-p2-confusable-u6839.q1 v3 / exact | 我用一[空1]绳子跳绳。<br>1 跟；2 根；3 很；4 银 | 根 | 这里要选一个数东西的字。 | 长长的东西可以用“一根”来数。“根”是木字旁。 | zh.p2_chinese.char.u6839; zh.p2_higher_chinese.char.u6839 |
| zh-p2-confusable-u6839.q2 v3 / similar | 大树的[空1]长在泥土里。<br>1 很；2 跟；3 银；4 根 | 根 | 想想大树哪一部分在泥土下面。 | 树在泥土下面的部分叫“根”。“根”是木字旁，和树木有关。 | zh.p2_chinese.char.u6839; zh.p2_higher_chinese.char.u6839 |
| zh-p2-confusable-u6839.q3 v3 / generic | 桌上有三[空1]筷子。<br>1 根；2 跟；3 很；4 恨 | 根 | 想一想，筷子可以怎么数？ | 细长的东西可以用“根”来数，比如一根筷子。 | zh.p2_chinese.char.u6839; zh.p2_higher_chinese.char.u6839 |
| zh-p2-confusable-u64cd.q1 v3 / exact | 早上，我们在礼堂做早[空1]。<br>1 澡；2 操；3 燥；4 躁 | 操 | 想一想，早上大家一起做的运动叫什么？ | “早操”是早上做的运动。做操要用手，所以“操”是提手旁。 | zh.p2_chinese.char.u64cd; zh.p2_higher_chinese.char.u64cd |
| zh-p2-confusable-u64cd.q2 v3 / similar | 下课了，同学们在[空1]场上跑步。<br>1 澡；2 燥；3 操；4 躁 | 操 | 想一想，学校里跑步的地方叫什么？ | “操场”是学校里运动的地方，写“操”。 | zh.p2_chinese.char.u64cd; zh.p2_higher_chinese.char.u64cd |
| zh-p2-confusable-u64cd.q3 v3 / generic | 姐姐喜欢学体[空1]，她会翻跟头。<br>1 躁；2 操；3 澡；4 燥 | 操 | 这里说的是一种运动。 | “体操”是一种运动。“操”是提手旁，和用手做动作有关。 | zh.p2_chinese.char.u64cd; zh.p2_higher_chinese.char.u64cd |
| zh-p2-confusable-u4e4c.q1 v3 / exact | 天上飘来一片[空1]云，快要下雨了。<br>1 鸟；2 乌；3 马；4 岛 | 乌 | 想一想，快下雨时，云是什么颜色？ | “乌云”是黑色的云。“乌”比“鸟”少一点。 | zh.p2_chinese.char.u4e4c; zh.p2_higher_chinese.char.u4e4c |
| zh-p2-confusable-u4e4c.q2 v3 / similar | 树上有一只[空1]鸦(yā)。<br>1 鸟；2 马；3 乌；4 岛 | 乌 | 这是一种黑色的鸟的名字。 | “乌鸦”是一种全身黑色的鸟，写“乌”，没有那一点。 | zh.p2_chinese.char.u4e4c; zh.p2_higher_chinese.char.u4e4c |
| zh-p2-confusable-u4e4c.q3 v3 / generic | 她的头发[空1]黑发亮。<br>1 岛；2 乌；3 鸟；4 马 | 乌 | 这里要组成一个表示很黑的词。 | “乌黑”就是很黑。 | zh.p2_chinese.char.u4e4c; zh.p2_higher_chinese.char.u4e4c |
| zh-p2-confusable-u6e34.q1 v3 / exact | 跑完步，我口[空1]了，想喝水。<br>1 喝；2 渴；3 揭；4 歇 | 渴 | 想一想，想喝水时是什么感觉？ | 想喝水的感觉叫“口渴”。“渴”是三点水，因为身体缺水。 | zh.p2_chinese.char.u6e34; zh.p2_higher_chinese.char.u6e34 |
| zh-p2-confusable-u6e34.q2 v3 / similar | 很久没下雨，小树也[空1]得低下了头。<br>1 歇；2 喝；3 渴；4 揭 | 渴 | 小树很久没有喝到水了。 | 小树缺水，所以说它“渴”了。 | zh.p2_chinese.char.u6e34; zh.p2_higher_chinese.char.u6e34 |
| zh-p2-confusable-u6e34.q3 v3 / generic | 小狗[空1]了，我给它倒了一碗水。<br>1 渴；2 揭；3 喝；4 歇 | 渴 | 为什么要给小狗倒水？ | 小狗想喝水，是因为它“渴”了。 | zh.p2_chinese.char.u6e34; zh.p2_higher_chinese.char.u6e34 |
| zh-p2-confusable-u4f4e.q1 v3 / exact | 这张桌子太[空1]了，弟弟要弯着腰写字。<br>1 底；2 低；3 抵；4 纸 | 低 | 想一想“高”的反义词。 | “低”和“高”意思相反。“低”是单人旁，“底”的上面是“广”字头。 | zh.p2_chinese.char.u4f4e; zh.p2_higher_chinese.char.u4f4e |
| zh-p2-confusable-u4f4e.q2 v4 / similar | 说话时，请把声音放[空1]一点，别吵醒弟弟。<br>1 纸；2 底；3 低；4 抵 | 低 | 想一想，声音小一点，要把声音怎么样？ | “放低”声音就是让声音小一点。 | zh.p2_chinese.char.u4f4e; zh.p2_higher_chinese.char.u4f4e |
| zh-p2-confusable-u4f4e.q3 v3 / generic | 小鸟飞得很[空1]，快碰到草地了。<br>1 抵；2 纸；3 底；4 低 | 低 | 快碰到草地，说明小鸟飞得高还是不高？ | 离地面很近，说明飞得“低”。 | zh.p2_chinese.char.u4f4e; zh.p2_higher_chinese.char.u4f4e |
| zh-p2-radical-u8e22.q1 v2 / exact | 弟弟用脚[空1]球。<br>1 踢；2 惕；3 题；4 提 | 踢 | 这是用脚做的动作。想一想，哪个偏旁和脚有关？ | 用脚的动作写“踢”，足字旁表示和脚有关。 | zh.p2_chinese.char.u8e22; zh.p2_higher_chinese.char.u8e22 |
| zh-p2-radical-u8e22.q2 v2 / similar | 小明把石子[空1]到草地上。<br>1 提；2 踢；3 题；4 惕 | 踢 | 石子是用脚弄走的。想一想，哪个偏旁和脚有关？ | “踢”是足字旁，和脚有关。 | zh.p2_chinese.char.u8e22; zh.p2_higher_chinese.char.u8e22 |
| zh-p2-radical-u8e22.q3 v1 / generic | 马生气时会用后腿[空1]人，要小心。<br>1 提；2 题；3 惕；4 踢 | 踢 | 马用腿做的动作，想想偏旁。 | 用腿脚的动作写“踢”。 | zh.p2_chinese.char.u8e22; zh.p2_higher_chinese.char.u8e22 |
| zh-p2-radical-u63a8.q1 v2 / exact | 请帮我[空1]开这扇门。<br>1 堆；2 维；3 推；4 谁 | 推 | 开门要用手。想一想，哪个偏旁和手有关？ | 用手的动作写“推”，提手旁和手有关。 | zh.p2_chinese.char.u63a8; zh.p2_higher_chinese.char.u63a8 |
| zh-p2-radical-u63a8.q2 v1 / similar | 大家一起把车[空1]到路边。<br>1 谁；2 堆；3 维；4 推 | 推 | 这是用手用力的动作。 | “推”是提手旁，表示用手。 | zh.p2_chinese.char.u63a8; zh.p2_higher_chinese.char.u63a8 |
| zh-p2-radical-u63a8.q3 v1 / generic | 他用手轻轻一[空1]，秋千就荡起来了。<br>1 推；2 堆；3 维；4 谁 | 推 | 用手让秋千动起来，想想偏旁。 | 用手让秋千动起来是“推”。 | zh.p2_chinese.char.u63a8; zh.p2_higher_chinese.char.u63a8 |
| zh-p2-radical-u5439.q1 v1 / exact | 风一[空1]，树叶就沙沙响。<br>1 吹；2 欢；3 炊；4 饮 | 吹 | 风会怎样？选和嘴巴、出气有关的字。 | “吹”是口字旁，和用嘴出气有关。 | zh.p2_chinese.char.u5439; zh.p2_higher_chinese.char.u5439 |
| zh-p2-radical-u5439.q2 v1 / similar | 生日时，我们一起[空1]蜡烛。<br>1 炊；2 饮；3 吹；4 欢 | 吹 | 用嘴巴对着蜡烛做的动作。 | 用嘴出气灭蜡烛写“吹”。 | zh.p2_chinese.char.u5439; zh.p2_higher_chinese.char.u5439 |
| zh-p2-radical-u5439.q3 v2 / generic | 小朋友对着蒲公英用力一[空1]，种子就飞走了。<br>1 欢；2 吹；3 炊；4 饮 | 吹 | 用嘴巴出气。想一想，哪个偏旁和嘴巴有关？ | 用嘴出气是“吹”。 | zh.p2_chinese.char.u5439; zh.p2_higher_chinese.char.u5439 |
| zh-p2-radical-u7092.q1 v2 / exact | 妈妈在厨房[空1]菜。<br>1 秒；2 炒；3 抄；4 吵 | 炒 | 做菜要用火。想一想，哪个偏旁和火有关？ | “炒”是火字旁，和用火做菜有关。 | zh.p2_chinese.char.u7092; zh.p2_higher_chinese.char.u7092 |
| zh-p2-radical-u7092.q2 v1 / similar | 这盘[空1]饭又香又好吃。<br>1 秒；2 抄；3 炒；4 吵 | 炒 | 这种饭是在锅里用火做的。 | 用火在锅里翻着做的饭是“炒饭”。 | zh.p2_chinese.char.u7092; zh.p2_higher_chinese.char.u7092 |
| zh-p2-radical-u7092.q3 v1 / generic | 爸爸把青菜放进锅里，用大火[空1]熟了。<br>1 吵；2 抄；3 炒；4 秒 | 炒 | 用大火做菜，选和火有关的字。 | 用火做菜写“炒”。 | zh.p2_chinese.char.u7092; zh.p2_higher_chinese.char.u7092 |
| zh-p2-radical-u6c60.q1 v1 / exact | 公园里有一个小水[空1]。<br>1 他；2 驰；3 池；4 地 | 池 | 装水的地方，选三点水的字。 | “池”是三点水，和水有关。 | zh.p2_chinese.char.u6c60; zh.p2_higher_chinese.char.u6c60 |
| zh-p2-radical-u6c60.q2 v1 / similar | 我们在游泳[空1]里学游泳。<br>1 驰；2 池；3 他；4 地 | 池 | 游泳的地方有很多水。 | 有水的地方写“池”。 | zh.p2_chinese.char.u6c60; zh.p2_higher_chinese.char.u6c60 |
| zh-p2-radical-u6c60.q3 v1 / generic | 这个[空1]塘里有许多鱼。<br>1 驰；2 他；3 池；4 地 | 池 | 鱼住在有水的地方。 | “池塘”是有水的地方，三点水。 | zh.p2_chinese.char.u6c60; zh.p2_higher_chinese.char.u6c60 |
| zh-p2-radical-u7761.q1 v2 / exact | 晚上九点，我上床[空1]觉。<br>1 睡；2 捶；3 垂；4 锤 | 睡 | 闭上眼睛休息。想一想，哪个偏旁和眼睛有关？ | “睡”是目字旁，和眼睛有关。 | zh.p2_chinese.char.u7761; zh.p2_higher_chinese.char.u7761 |
| zh-p2-radical-u7761.q2 v1 / similar | 小猫在沙发上[空1]得很香。<br>1 锤；2 垂；3 捶；4 睡 | 睡 | 小猫闭上眼睛休息。 | 闭眼休息写“睡”。 | zh.p2_chinese.char.u7761; zh.p2_higher_chinese.char.u7761 |
| zh-p2-radical-u7761.q3 v1 / generic | 弟弟太累了，一坐上车就[空1]着了。<br>1 锤；2 垂；3 捶；4 睡 | 睡 | 太累了会怎样？想想和眼睛有关的偏旁。 | 累了就会睡着，写“睡”。 | zh.p2_chinese.char.u7761; zh.p2_higher_chinese.char.u7761 |
| zh-p2-radical-u996e.q1 v2 / exact | 这家店卖各种[空1]料。<br>1 吹；2 软；3 欢；4 饮 | 饮 | 可以喝的东西。想一想，哪个偏旁和吃喝有关？ | “饮”是食字旁，和吃喝有关。 | zh.p2_chinese.char.u996e; zh.p2_higher_chinese.char.u996e |
| zh-p2-radical-u996e.q2 v1 / similar | 学校走廊有一台[空1]水机。<br>1 软；2 欢；3 吹；4 饮 | 饮 | 这台机器给大家喝水用。 | 喝水用的机器是“饮水机”。 | zh.p2_chinese.char.u996e; zh.p2_higher_chinese.char.u996e |
| zh-p2-radical-u996e.q3 v2 / generic | [空1]食要均衡，身体才会健康。<br>1 欢；2 饮；3 吹；4 软 | 饮 | 想一想，哪个偏旁和吃喝有关？ | “饮食”指吃的和喝的。 | zh.p2_chinese.char.u996e; zh.p2_higher_chinese.char.u996e |
| zh-p2-radical-u6811.q1 v2 / exact | 公园里有很多大[空1]。<br>1 村；2 树；3 封；4 对 | 树 | 长得高高大大、有绿叶的植物。想一想，哪个偏旁和树木有关？ | “树”是木字旁，和树木有关。 | zh.p2_chinese.char.u6811; zh.p2_higher_chinese.char.u6811 |
| zh-p2-radical-u6811.q2 v1 / similar | 小鸟在[空1]上唱歌。<br>1 树；2 对；3 村；4 封 | 树 | 小鸟常常站在哪里？ | 小鸟在树上，木字旁。 | zh.p2_chinese.char.u6811; zh.p2_higher_chinese.char.u6811 |
| zh-p2-radical-u6811.q3 v1 / generic | 我们一起在校园里种了一棵小[空1]。<br>1 对；2 封；3 村；4 树 | 树 | 种下去会慢慢长大的植物。 | 种的是小树，写“树”。 | zh.p2_chinese.char.u6811; zh.p2_higher_chinese.char.u6811 |
| zh-p2-radical-u6697.q1 v2 / exact | 房间里没有开灯，很[空1]。<br>1 部；2 音；3 暗；4 意 | 暗 | 没有光。想一想，哪个偏旁和太阳或光线有关？ | “暗”是日字旁，和光线有关。 | zh.p2_chinese.char.u6697; zh.p2_higher_chinese.char.u6697 |
| zh-p2-radical-u6697.q2 v1 / similar | 天色越来越[空1]，快要下雨了。<br>1 音；2 部；3 意；4 暗 | 暗 | 乌云来了，光线变少。 | 光线少就是“暗”。 | zh.p2_chinese.char.u6697; zh.p2_higher_chinese.char.u6697 |
| zh-p2-radical-u6697.q3 v1 / generic | 电影院里很[空1]，走路要小心。<br>1 意；2 音；3 部；4 暗 | 暗 | 电影院里的灯光很少。 | 光线不足写“暗”。 | zh.p2_chinese.char.u6697; zh.p2_higher_chinese.char.u6697 |
| zh-p2-radical-u8df3.q1 v2 / exact | 青蛙[空1]进了池塘。<br>1 挑；2 桃；3 逃；4 跳 | 跳 | 青蛙用腿做的动作。想一想，哪个偏旁和脚有关？ | “跳”是足字旁，和脚有关。 | zh.p2_chinese.char.u8df3; zh.p2_higher_chinese.char.u8df3 |
| zh-p2-radical-u8df3.q2 v1 / similar | 我们在操场上[空1]绳。<br>1 挑；2 逃；3 跳；4 桃 | 跳 | 这项运动要用脚。 | 用脚的运动写“跳绳”。 | zh.p2_chinese.char.u8df3; zh.p2_higher_chinese.char.u8df3 |
| zh-p2-radical-u8df3.q3 v1 / generic | 听到好消息，妹妹高兴得[空1]了起来。<br>1 跳；2 桃；3 挑；4 逃 | 跳 | 高兴时脚会离开地面。 | 高兴得跳起来，足字旁。 | zh.p2_chinese.char.u8df3; zh.p2_higher_chinese.char.u8df3 |
| zh-p2-measure.q1 v1 / exact | 妈妈给我买了一[空1]故事书。<br>1 张；2 只；3 本；4 条 | 本 | 书一般怎么数？ | 书用“本”来数：一本书。 | 量词运用 |
| zh-p2-measure.q2 v1 / similar | 河里游着一[空1]小鱼。<br>1 条；2 张；3 块；4 本 | 条 | 鱼的身体长长的。 | 鱼用“条”来数。 | 量词运用 |
| zh-p2-measure.q3 v1 / generic | 请给我一[空1]白纸。<br>1 条；2 本；3 只；4 张 | 张 | 纸是薄薄平平的。 | 纸用“张”来数。 | 量词运用 |
| zh-p2-measure.q4 v1 / general | 门口坐着一[空1]小狗。<br>1 本；2 张；3 块；4 只 | 只 | 小动物常常怎么数？ | 小狗可以说“一只小狗”。 | 量词运用 |
| zh-p2-measure.q5 v1 / general | 路边停着一[空1]汽车。<br>1 本；2 张；3 只；4 辆 | 辆 | 车子用哪个量词？ | 车用“辆”来数。 | 量词运用 |
| zh-p2-measure.q6 v1 / general | 姐姐穿了一[空1]新衣服。<br>1 件；2 张；3 只；4 本 | 件 | 衣服怎么数？ | 衣服用“件”来数。 | 量词运用 |
| zh-p2-measure.q7 v1 / general | 花园里开了一[空1]红花。<br>1 张；2 朵；3 辆；4 本 | 朵 | 花怎么数？ | 花用“朵”来数。 | 量词运用 |
| zh-p2-measure.q8 v1 / general | 下雨了，我带了一[空1]雨伞。<br>1 只；2 张；3 把；4 本 | 把 | 有柄可以拿着的东西。 | 伞用“把”来数。 | 量词运用 |
| zh-p2-measure.q9 v1 / general | 妹妹吃了一[空1]蛋糕。<br>1 本；2 块；3 件；4 辆 | 块 | 切下来的一小份。 | 切下的一份蛋糕是“一块蛋糕”。 | 量词运用 |
| zh-p2-measure.q10 v1 / general | 学校门口有一[空1]大树。<br>1 本；2 张；3 棵；4 辆 | 棵 | 树怎么数？ | 树用“棵”来数。 | 量词运用 |
| zh-p2-collocation.q1 v1 / exact | 我们在草地上[空1]风筝。<br>1 放；2 洗；3 踢；4 打 | 放 | 风筝要飞上天空。 | 风筝要“放”：放风筝。 | 词语搭配 |
| zh-p2-collocation.q2 v1 / similar | 妹妹在家里[空1]钢琴。<br>1 打；2 拍；3 弹；4 踢 | 弹 | 钢琴要用手指在琴键上按。 | 钢琴要“弹”：弹钢琴。 | 词语搭配 |
| zh-p2-collocation.q3 v1 / generic | 爸爸在球场上[空1]篮球。<br>1 踢；2 打；3 弹；4 放 | 打 | 篮球用手玩。 | 篮球要“打”：打篮球。 | 词语搭配 |
| zh-p2-collocation.q4 v1 / general | 奶奶在厨房[空1]饭。<br>1 踢；2 弹；3 煮；4 放 | 煮 | 做饭要用锅和火。 | 做饭可以说“煮饭”。 | 词语搭配 |
| zh-p2-collocation.q5 v1 / general | 我每天早上都[空1]牙。<br>1 踢；2 放；3 打；4 刷 | 刷 | 用牙刷做的事。 | 用牙刷“刷牙”。 | 词语搭配 |
| zh-p2-collocation.q6 v1 / general | 老师在白板上[空1]字。<br>1 放；2 弹；3 写；4 踢 | 写 | 用笔做的事。 | 用笔“写字”。 | 词语搭配 |
| zh-p2-collocation.q7 v1 / general | 音乐课上，我们一起[空1]歌。<br>1 唱；2 放；3 踢；4 打 | 唱 | 用声音做的事。 | 用嘴“唱歌”。 | 词语搭配 |
| zh-p2-collocation.q8 v2 / general | 哥哥拿着鱼竿在河边[空1]鱼。<br>1 钓；2 放；3 踢；4 弹 | 钓 | 想一想用鱼竿做什么。 | 哥哥用鱼竿钓鱼，所以选“钓”。 | 词语搭配 |
| zh-p2-wordchoice.q1 v1 / exact | 天气太[空1]了，我们都出了很多汗。<br>1 热；2 黑；3 亮；4 冷 | 热 | 出汗是因为什么？ | 天气热会出汗。 | 根据句意选择词语 |
| zh-p2-wordchoice.q2 v1 / similar | 妹妹找不到妈妈，[空1]得哭了起来。<br>1 高；2 急；3 笑；4 饱 | 急 | 找不到妈妈时心里会怎样？ | 心里着急，“急得哭了”。 | 根据句意选择词语 |
| zh-p2-wordchoice.q3 v1 / generic | 这条路很[空1]，我们走了很久。<br>1 短；2 长；3 新；4 甜 | 长 | 走了很久说明路怎么样？ | 路长才要走很久。 | 根据句意选择词语 |
| zh-p2-wordchoice.q4 v1 / general | 图书馆里很[空1]，大家都在看书。<br>1 忙乱；2 吵闹；3 热闹；4 安静 | 安静 | 看书的地方需要怎样？ | 图书馆里要安静。 | 根据句意选择词语 |
| zh-p2-wordchoice.q5 v1 / general | 他每天都很早起床，从来不[空1]到。<br>1 迟；2 先；3 早；4 快 | 迟 | 早起床就不会怎样？ | 早起床就不会迟到。 | 根据句意选择词语 |
| zh-p2-wordchoice.q6 v1 / general | 小明不小心打[空1]了杯子。<br>1 长；2 高；3 红；4 破 | 破 | 杯子掉下去会怎样？ | 杯子“打破”了。 | 根据句意选择词语 |
| zh-p2-wordchoice.q7 v1 / general | 这个西瓜又大又[空1]。<br>1 辣；2 苦；3 甜；4 臭 | 甜 | 好吃的西瓜是什么味道？ | 西瓜又大又甜。 | 根据句意选择词语 |
| zh-p2-wordchoice.q8 v1 / general | 下雨了，地上很[空1]，走路要小心。<br>1 干；2 热；3 湿；4 亮 | 湿 | 下雨后地上会怎样？ | 下雨后地上是湿的。 | 根据句意选择词语 |
| zh-p2-order.q1 v2 / exact | 哪个句子排得对？（我 / 上学 / 每天 / 走路）<br>1 每天走路我上学。；2 我每天走路上学。；3 走路我每天上学。；4 我上学每天走路。 | 我每天走路上学。 | 先说谁，再说什么时候，最后说做什么。 | 正确的句子是“我每天走路上学。” | 排列词语成句 |
| zh-p2-order.q2 v3 / general | 哪个句子排得对？（妈妈 / 在厨房 / 做饭 / 正）<br>1 妈妈正在做饭厨房。；2 在厨房妈妈做饭正。；3 正妈妈在厨房做饭。；4 妈妈正在厨房做饭。 | 妈妈正在厨房做饭。 | 先找出谁在做什么，再看看地点放在哪里。 | 妈妈在厨房里做饭，所以选“妈妈正在厨房做饭。” | 排列词语成句 |
| zh-p2-order.q3 v2 / similar | 哪个句子排得对？（小狗 / 在草地上 / 开心地 / 跑）<br>1 小狗在草地上跑开心地。；2 开心地小狗跑在草地上。；3 在草地上小狗跑开心地。；4 小狗开心地在草地上跑。 | 小狗开心地在草地上跑。 | “开心地”要放在动作前面。 | “小狗开心地在草地上跑。” | 排列词语成句 |
| zh-p2-order.q4 v2 / generic | 哪个句子排得对？（星期天 / 我们 / 去公园 / 玩）<br>1 星期天我们去公园玩。；2 玩星期天我们去公园。；3 我们去公园星期天玩。；4 去公园玩我们星期天。 | 星期天我们去公园玩。 | 时间可以放在句子开头。 | “星期天我们去公园玩。” | 排列词语成句 |
| zh-p2-order.q5 v2 / general | 哪个句子排得对？（老师 / 讲故事 / 给我们 / 听）<br>1 老师给我们听讲故事。；2 讲故事老师听给我们。；3 给我们老师听讲故事。；4 老师讲故事给我们听。 | 老师讲故事给我们听。 | 谁做了什么，给谁听？ | “老师讲故事给我们听。” | 排列词语成句 |
| zh-p2-order.q6 v2 / general | 哪个句子排得对？（弟弟 / 把玩具 / 收好 / 了）<br>1 把玩具弟弟了收好。；2 弟弟把玩具收好了。；3 弟弟收好了把玩具。；4 收好弟弟把玩具了。 | 弟弟把玩具收好了。 | “把”后面先说东西，再说做了什么。 | “弟弟把玩具收好了。” | 排列词语成句 |
| zh-p2-punct.q1 v2 / exact | 选一个标点(biāo diǎn)：你今天想去哪里[空1]<br>1 ？；2 、；3 。；4 ！ | ？ | 这句话在问别人。 | 问句用问号“？”。 | 标点选择 |
| zh-p2-punct.q2 v2 / similar | 选一个标点(biāo diǎn)：这里的风景真美[空1]<br>1 、；2 ！；3 ？；4 ： | ！ | 这句话表示很强的感情。 | 表示赞叹用感叹号“！”。 | 标点选择 |
| zh-p2-punct.q3 v2 / generic | 选一个标点(biāo diǎn)：我喜欢苹果[空1]香蕉和葡萄。<br>1 ！；2 、；3 。；4 ？ | 、 | 几样东西排在一起时用什么隔开？ | 并列的词语之间用顿号“、”。 | 标点选择 |
| zh-p2-punct.q4 v2 / general | 选一个标点(biāo diǎn)：老师说[空1]“明天要带水壶。”<br>1 ：；2 、；3 ？；4 ！ | ： | 说话的内容前面用什么标点？ | 引出说的话要用冒号“：”。 | 标点选择 |
| zh-p2-wordchoice2.q1 v1 / general | 小明考试前很[空1]，手心都出汗了。<br>1 紧张；2 安静；3 舒服；4 开心 | 紧张 | 手心出汗是什么感觉？ | 考试前手心出汗，说明很紧张。 | 根据句意选择词语 |
| zh-p2-wordchoice2.q2 v1 / general | 弟弟[空1]地把玩具借给了好朋友。<br>1 小气；2 难过；3 大方；4 生气 | 大方 | 愿意把东西借给别人的人是怎样的？ | 愿意分享就是“大方”。 | 根据句意选择词语 |
| zh-p2-wordchoice2.q3 v1 / general | 外面的雷声很大，小猫吓得[空1]到床底下。<br>1 笑；2 跳；3 躲；4 唱 | 躲 | 害怕时会去藏起来。 | 害怕时会“躲”起来。 | 根据句意选择词语 |
| zh-p2-sound-repair.q1 v1 / exact | “晴天”的“晴”怎么读？<br>1 qīng；2 qíng；3 jīng；4 qǐng | qíng | “晴”和天气有关，想一想“晴天”怎么读。 | “晴”读 qíng，第二声。“清”读 qīng，“请”读 qǐng。 | 辨识字音（字与拼音、多音字） |
| zh-p2-sound-repair.q2 v1 / similar | “请坐”的“请”怎么读？<br>1 qíng；2 jìng；3 qǐng；4 qīng | qǐng | 说“请”的时候，声音先降后升。 | “请”读 qǐng，第三声。 | 辨识字音（字与拼音、多音字） |
| zh-p2-sound-repair.q3 v1 / generic | “小鸟在树上唱歌。”句子里“唱”的拼音是哪一个？<br>1 cháng；2 zhàng；3 chàng；4 chuàng | chàng | 先轻声读一读“唱歌”，再看看哪个拼音的声调对。 | “唱”读 chàng，第四声。 | 辨识字音（字与拼音、多音字） |
| zh-p2-sound.q1 v1 / general | “我长大了。”这里的“长”怎么读？<br>1 cháng；2 zhǎng；3 zhāng；4 chǎng | zhǎng | 这里的“长”是说人变大了，不是说东西很长。 | “长大”的“长”读 zhǎng。说东西很长时读 cháng。 | 辨识字音（字与拼音、多音字） |
| zh-p2-sound.q2 v1 / general | “这条路很长。”这里的“长”怎么读？<br>1 zhǎng；2 zhàng；3 cháng；4 chāng | cháng | 这里说的是路的长短。 | 说长短的“长”读 cháng。 | 辨识字音（字与拼音、多音字） |
| zh-p2-sound.q3 v1 / general | “我要去图书馆还书。”这里的“还”怎么读？<br>1 hái；2 huán；3 huàn；4 hāi | huán | 这里是把借来的书送回去。 | 把东西送回去的“还”读 huán，“还有”的“还”读 hái。 | 辨识字音（字与拼音、多音字） |
| zh-p2-sound.q4 v1 / general | “妹妹睡着了。”这里的“着”怎么读？<br>1 zhe；2 zhuó；3 zháo；4 zhāo | zháo | “睡着了”是说已经睡了，不是“看着”的“着”。 | “睡着”的“着”读 zháo，“看着”的“着”读 zhe。 | 辨识字音（字与拼音、多音字） |
| zh-p2-sound.q5 v3 / general | 拼音“pǎo”是哪个字？<br>1 抱；2 跑；3 泡；4 饱 | 跑 | 小声读一读每个字，再比较声母和声调。 | “跑”读 pǎo。“抱”读 bào，“泡”读 pào，“饱”读 bǎo。 | 辨识字音（字与拼音、多音字） |
| zh-p2-sound.q6 v1 / general | “快乐”的“乐”怎么读？<br>1 yuè；2 lè；3 lèi；4 luò | lè | “快乐”是说心里高兴。 | “快乐”的“乐”读 lè，“音乐”的“乐”读 yuè。 | 辨识字音（字与拼音、多音字） |
| zh-p2-sound.q7 v2 / general | 拼音“kàn”是哪个字？<br>1 着；2 手；3 看；4 目 | 看 | 这个字和眼睛有关。 | “看”读 kàn。“手”读 shǒu，“目”读 mù。“着”有不同读音，如“看着”的 zhe、“睡着”的 zháo，都不是 kàn。 | 辨识字音（字与拼音、多音字） |
| zh-p2-card-repair.q1 v1 / exact | 读一读：【便条(biàn tiáo)】<br>妈妈：<br>我去图书馆借书，下午五点回家。<br>小安<br>十月九日<br>这张便条(biàn tiáo)是谁写的？<br>1 妈妈；2 小安；3 老师；4 图书馆 | 小安 | 写的人的名字写在哪里？看看下面。 | 便条下面写着“小安”，是小安写给妈妈的。 | 认识贺卡、便条的格式（称呼、祝福语、写的人、日期） |
| zh-p2-card-repair.q2 v1 / similar | 读一读：<br>亲爱的奶奶：<br>祝您新年快乐，身体健康！<br>小红<br>一月一日<br>这张卡是写给谁的？<br>1 小红；2 妈妈；3 奶奶；4 老师 | 奶奶 | 看第一行“亲爱的”后面写的是谁。 | 第一行写着“亲爱的奶奶”，这张卡是写给奶奶的。 | 认识贺卡、便条的格式（称呼、祝福语、写的人、日期） |
| zh-p2-card-repair.q3 v2 / generic | 写生日卡时，写上自己的名字和日期，主要是让朋友知道什么？<br>1 今天的天气；2 礼物的价钱；3 学校的地址；4 谁写的、哪一天写的 | 谁写的、哪一天写的 | 想一想，名字和日期分别告诉别人什么。 | 名字告诉朋友是谁写的，日期告诉朋友是哪一天写的。 | 认识贺卡、便条的格式（称呼、祝福语、写的人、日期） |
| zh-p2-meaning-repair.q1 v1 / exact | “我口渴了。”“渴”是说什么？<br>1 很想睡觉；2 很想喝水；3 很想吃东西；4 很想出去玩 | 很想喝水 | 口渴的时候，会想要什么？ | “渴”是很想喝水。“渴”是三点水，和水有关。 | 理解字在词语中的意思 |
| zh-p2-meaning-repair.q2 v1 / similar | “我饿了。”“饿”是说什么？<br>1 很想喝水；2 吃得太多了；3 很想吃东西；4 很想睡觉 | 很想吃东西 | 饿了以后，会想做什么？ | “饿”是很想吃东西。“饿”是食字旁，和吃有关。 | 理解字在词语中的意思 |
| zh-p2-meaning-repair.q3 v1 / generic | “这碗面很香。”“香”是说什么？<br>1 看起来很大；2 吃起来很甜；3 闻起来很好；4 听起来很好听 | 闻起来很好 | “香”要用鼻子去闻。 | “香”是说闻起来的味道很好。 | 理解字在词语中的意思 |
| zh-p2-meaning.q1 v1 / general | “我吃饱了。”“饱”是说什么？<br>1 很想吃东西；2 跑得很快；3 很想喝水；4 吃了很多，不想再吃了 | 吃了很多，不想再吃了 | 吃了很多东西以后，还想吃吗？ | “饱”是吃够了，不想再吃了。“饿”才是很想吃东西。 | 理解字在词语中的意思 |
| zh-p2-meaning.q2 v1 / general | “早”和哪个字相反？<br>1 晚；2 日；3 十；4 草 | 晚 | 想一想，一天开始的时候和快结束的时候。 | “早”和“晚”相反。“日、十、草”只是字形和“早”有些像。 | 理解字在词语中的意思 |
| zh-p2-meaning.q3 v1 / general | “热”和哪个字相反？<br>1 高；2 冷；3 亮；4 多 | 冷 | 想一想，下雪的时候是什么感觉。 | “热”和“冷”相反。 | 理解字在词语中的意思 |
| zh-p2-meaning.q4 v2 / general | “今天是晴天。”“晴”是说什么？<br>1 下着大雨；2 天上有很多乌云；3 天空明亮，云很少或没有云；4 刮着大风 | 天空明亮，云很少或没有云 | 想想晴天和阴天、雨天有什么不同。 | “晴”表示天空明亮，云很少或没有云；晴天也可能有少量的云。 | 理解字在词语中的意思 |
| zh-p2-radmeaning-repair.q1 v1 / exact | 下面哪个字和水有关？<br>1 何；2 河；3 可；4 哥 | 河 | 看看每个字的左边。 | “河”是三点水，河里有水。其他三个字都有“可”，但和水没有关系。 | 根据偏旁推想字和什么有关 |
| zh-p2-radmeaning-repair.q2 v1 / similar | 下面哪个字和火有关？<br>1 打；2 钉；3 灯；4 盯 | 灯 | 以前的灯要点火才会亮。看看每个字的左边。 | “灯”是火字旁，和火、和光有关。 | 根据偏旁推想字和什么有关 |
| zh-p2-radmeaning-repair.q3 v3 / generic | “妈、姐、妹”都有同一个偏旁(piān páng)。这个偏旁和什么有关？<br>1 女人和女孩；2 马；3 树木；4 嘴巴 | 女人和女孩 | 这三个字说的都是家里的什么人？ | 女字旁的字常和女人、女孩有关。“妈、姐、妹”都是家里的女人或女孩。 | 根据偏旁推想字和什么有关 |
| zh-p2-radmeaning.q1 v2 / general | 看看偏旁，下面哪个字和说话有关？<br>1 活；2 恬；3 话；4 适 | 话 | 看看每个字的左边，哪个偏旁和说话有关？ | “话”是言字旁，和说话有关。 | 根据偏旁推想字和什么有关 |
| zh-p2-radmeaning.q2 v1 / general | “跑、跳、踢”都和身体的哪里有关？<br>1 手；2 眼睛；3 口；4 脚 | 脚 | 看看这三个字左边都一样的地方。 | “跑、跳、踢”都是足字旁，都是用脚做的动作。 | 根据偏旁推想字和什么有关 |
| zh-p2-radmeaning.q3 v1 / general | 下面哪个字和手有关？<br>1 白；2 拍；3 伯；4 怕 | 拍 | 看看每个字的左边，哪个偏旁和手有关？ | “拍”是提手旁，拍手、拍球都要用手。 | 根据偏旁推想字和什么有关 |
| zh-p2-radmeaning.q4 v2 / general | “吃、喝、唱”的左边都一样。它们都和什么有关？<br>1 眼睛；2 口；3 脚；4 耳朵 | 口 | 吃东西、喝水、唱歌，都要用到哪里？ | “吃、喝、唱”都要用口，所以都是口字旁。 | 根据偏旁推想字和什么有关 |
| zh-p2-punctread-repair.q1 v1 / exact | 哪一句是在问别人？<br>1 我们去公园。；2 我们去公园吗？；3 我们去公园！；4 我们去公园了。 | 我们去公园吗？ | 看看每一句最后的标点。 | 句子最后是问号“？”，又有“吗”，是在问别人。 | 借助标点理解句子 |
| zh-p2-punctread-repair.q2 v1 / similar | “今天会下雨吗？”说这句话的人在做什么？<br>1 告诉别人一件事；2 问别人；3 请别人帮忙；4 说自己很高兴 | 问别人 | 看看句子最后的标点。 | 句子最后是问号“？”，说话的人在问别人今天会不会下雨。 | 借助标点理解句子 |
| zh-p2-punctread-repair.q3 v3 / generic | 哪一句读起来语气最强？<br>1 妈妈回来了吗？；2 妈妈回来了。；3 妈妈回来了！；4 妈妈回来了没有？ | 妈妈回来了！ | 比较句子最后的标点，想想读的时候语气有什么不同。 | “妈妈回来了！”用感叹号，读起来语气更强。感叹号可以表示高兴、惊讶等不同感情，不能只凭它判断心情。 | 借助标点理解句子 |
| zh-p2-punctread.q1 v2 / general | 老师说：“请大家坐好。”冒号(mào hào)“：”后面写的是什么？<br>1 老师是谁；2 同学说的话；3 老师说的话；4 上课的时间 | 老师说的话 | 看看“：”前面写着“老师说”。 | 冒号“：”后面引号里的，是老师说的话。 | 借助标点理解句子 |
| zh-p2-punctread.q2 v1 / general | “我喜欢红色、黄色和蓝色。”这句话说到几种颜色？<br>1 一种；2 两种；3 三种；4 四种 | 三种 | “、”和“和”把颜色分开了，一个一个数。 | 红色、黄色和蓝色，一共三种颜色。 | 借助标点理解句子 |
| zh-p2-punctread.q3 v1 / general | 哪一句是在说一件事，不是在问别人？<br>1 小明在家吗？；2 小明在家。；3 小明去哪里了？；4 小明在家没有？ | 小明在家。 | 找一找最后不是问号的句子。 | “小明在家。”最后是句号，是在说一件事。其他三句都在问人。 | 借助标点理解句子 |
| zh-p2-punctread.q4 v1 / general | “谁在门外？”这句话最后为什么用“？”<br>1 因为很高兴；2 因为话说完了；3 因为在问别人；4 因为要说很多东西 | 因为在问别人 | 说这句话的人知道门外是谁吗？ | 说话的人不知道门外是谁，在问别人，所以用问号。 | 借助标点理解句子 |
| zh-p3-confusable-u6e56.q1 v1 / exact | 我们在[空1]边散步。<br>1 蝴；2 湖；3 胡；4 糊 | 湖 | 和水有关的地方，注意偏旁。 | 有很多水的地方是“湖”，三点水。 | zh.p3_chinese.char.u6e56; zh.p3_higher_chinese.char.u6e56 |
| zh-p3-confusable-u6e56.q2 v1 / similar | [空1]水很清，可以看见小鱼。<br>1 胡；2 蝴；3 糊；4 湖 | 湖 | 这里的水是哪里的水？选三点水的字。 | “湖水”的“湖”是三点水。 | zh.p3_chinese.char.u6e56; zh.p3_higher_chinese.char.u6e56 |
| zh-p3-confusable-u6e56.q3 v1 / generic | 小船在平静的[空1]面上慢慢地划。<br>1 胡；2 糊；3 蝴；4 湖 | 湖 | 小船在哪里划？ | 小船在湖面上划，三点水。 | zh.p3_chinese.char.u6e56; zh.p3_higher_chinese.char.u6e56 |
| zh-p3-confusable-u7bee.q1 v1 / exact | 哥哥喜欢打[空1]球。<br>1 篮；2 栏；3 蓝；4 监 | 篮 | 这种球要投进用竹子编的筐里，注意上面的部首。 | “篮球”的“篮”是竹字头。 | zh.p3_chinese.char.u7bee; zh.p3_higher_chinese.char.u7bee |
| zh-p3-confusable-u7bee.q2 v2 / similar | 妈妈提着菜[空1]去市场。<br>1 监；2 蓝；3 篮；4 栏 | 篮 | 装菜的东西。想一想，哪个偏旁和竹子有关？ | 装东西的“篮子”是竹字头。 | zh.p3_chinese.char.u7bee; zh.p3_higher_chinese.char.u7bee |
| zh-p3-confusable-u7bee.q3 v1 / generic | 奶奶把洗好的水果放进竹[空1]里。<br>1 篮；2 蓝；3 栏；4 监 | 篮 | 竹子编的东西，注意部首。 | “竹篮”的“篮”是竹字头；“蓝”是颜色。 | zh.p3_chinese.char.u7bee; zh.p3_higher_chinese.char.u7bee |
| zh-p3-confusable-u7ba1.q1 v2 / exact | 水[空1]破了，水流了一地。<br>1 官；2 关；3 管；4 馆 | 管 | 水从这条长长的东西里流过。想一想，哪个偏旁和竹子有关？ | “水管”的“管”是竹字头。 | zh.p3_chinese.char.u7ba1; zh.p3_higher_chinese.char.u7ba1 |
| zh-p3-confusable-u7ba1.q2 v1 / similar | 妈妈让我[空1]好自己的东西。<br>1 馆；2 关；3 管；4 官 | 管 | 意思是照顾、负责。 | “管好”表示负责照顾好。 | zh.p3_chinese.char.u7ba1; zh.p3_higher_chinese.char.u7ba1 |
| zh-p3-confusable-u7ba1.q3 v1 / generic | 这根吸[空1]是用纸做的。<br>1 管；2 馆；3 关；4 官 | 管 | 喝饮料用的细长东西。 | “吸管”的“管”是竹字头。 | zh.p3_chinese.char.u7ba1; zh.p3_higher_chinese.char.u7ba1 |
| zh-p3-confusable-u72fc.q1 v1 / exact | 大灰[空1]想吃小羊。<br>1 郎；2 朗；3 狼；4 浪 | 狼 | 这是一种动物，看偏旁。 | 动物“狼”是反犬旁。 | zh.p3_chinese.char.u72fc; zh.p3_higher_chinese.char.u72fc |
| zh-p3-confusable-u72fc.q2 v2 / similar | 夜里，一只[空1]在山上嚎叫。<br>1 郎；2 狼；3 朗；4 浪 | 狼 | 会嚎叫的动物。想一想，哪个偏旁和动物有关？ | 会嚎叫的动物是“狼”。 | zh.p3_chinese.char.u72fc; zh.p3_higher_chinese.char.u72fc |
| zh-p3-confusable-u72fc.q3 v1 / generic | 森林里住着一只又饿又凶的[空1]。<br>1 朗；2 狼；3 郎；4 浪 | 狼 | 森林里的凶猛动物，注意偏旁。 | 反犬旁的“狼”是动物。 | zh.p3_chinese.char.u72fc; zh.p3_higher_chinese.char.u72fc |
| zh-p3-confusable-u6162.q1 v1 / exact | 乌龟爬得很[空1]。<br>1 馒；2 漫；3 曼；4 慢 | 慢 | 乌龟爬行的速度怎么样？看偏旁。 | 速度不快写“慢”，竖心旁。 | zh.p3_chinese.char.u6162; zh.p3_higher_chinese.char.u6162 |
| zh-p3-confusable-u6162.q2 v2 / similar | 请你说得[空1]一点，我听不清楚。<br>1 曼；2 慢；3 馒；4 漫 | 慢 | 要说得不快一点。想一想，哪个偏旁和心里的感觉有关？ | 说话不快是“慢”。 | zh.p3_chinese.char.u6162; zh.p3_higher_chinese.char.u6162 |
| zh-p3-confusable-u6162.q3 v1 / generic | 车子开得太[空1]，我们迟到了。<br>1 慢；2 漫；3 馒；4 曼 | 慢 | 迟到可能是因为车子不够快。 | 车子不快写“慢”。 | zh.p3_chinese.char.u6162; zh.p3_higher_chinese.char.u6162 |
| zh-p3-confusable-u9493.q1 v2 / exact | 爸爸带我去河边[空1]鱼。<br>1 钓；2 钩；3 约；4 的 | 钓 | 用鱼竿抓鱼。想一想，哪个偏旁和金属有关？ | “钓鱼”的“钓”是金字旁。 | zh.p3_chinese.char.u9493; zh.p3_higher_chinese.char.u9493 |
| zh-p3-confusable-u9493.q2 v1 / similar | 小猫也想学[空1]鱼。<br>1 的；2 钓；3 钩；4 约 | 钓 | 用鱼竿等鱼上来。 | “钓鱼”的“钓”和鱼钩有关，金字旁。 | zh.p3_chinese.char.u9493; zh.p3_higher_chinese.char.u9493 |
| zh-p3-confusable-u9493.q3 v1 / generic | 他拿着长长的[空1]竿坐在湖边。<br>1 钓；2 的；3 约；4 钩 | 钓 | 这根竿子是用来做什么的？ | “钓竿”是钓鱼用的竿子。 | zh.p3_chinese.char.u9493; zh.p3_higher_chinese.char.u9493 |
| zh-p3-confusable-u8eba.q1 v2 / exact | 我[空1]在床上看书。<br>1 尚；2 淌；3 趟；4 躺 | 躺 | 身体平平地放着。想一想，哪个偏旁和身体有关？ | “躺”是身字旁，和身体有关。 | zh.p3_chinese.char.u8eba; zh.p3_higher_chinese.char.u8eba |
| zh-p3-confusable-u8eba.q2 v1 / similar | 小猫[空1]在沙发上晒太阳。<br>1 淌；2 尚；3 躺；4 趟 | 躺 | 小猫的身体平放在沙发上。 | 身体平放写“躺”。 | zh.p3_chinese.char.u8eba; zh.p3_higher_chinese.char.u8eba |
| zh-p3-confusable-u8eba.q3 v1 / generic | 他累得一回家就[空1]下了。<br>1 淌；2 尚；3 趟；4 躺 | 躺 | 累了，身体平放休息。 | “躺下”是身字旁的“躺”。 | zh.p3_chinese.char.u8eba; zh.p3_higher_chinese.char.u8eba |
| zh-p3-confusable-u788e.q1 v2 / exact | 杯子掉在地上，摔[空1]了。<br>1 醉；2 卒；3 翠；4 碎 | 碎 | 杯子变成很多小块。想一想，哪个偏旁和石头有关？ | “摔碎”的“碎”是石字旁。 | zh.p3_chinese.char.u788e; zh.p3_higher_chinese.char.u788e |
| zh-p3-confusable-u788e.q2 v1 / similar | 窗户的玻璃被球打[空1]了。<br>1 碎；2 翠；3 卒；4 醉 | 碎 | 玻璃变成很多小片。 | 变成小块小片写“碎”。 | zh.p3_chinese.char.u788e; zh.p3_higher_chinese.char.u788e |
| zh-p3-confusable-u788e.q3 v2 / generic | 妈妈把饼干压成[空1]片。<br>1 卒；2 碎；3 翠；4 醉 | 碎 | 很小很小的片。想一想，哪个偏旁和石头有关？ | “碎片”的“碎”是石字旁。 | zh.p3_chinese.char.u788e; zh.p3_higher_chinese.char.u788e |
| zh-p3-confusable-u5077.q1 v2 / exact | 小猴子[空1]吃了桃子。<br>1 愉；2 偷；3 榆；4 输 | 偷 | 没有问过别人就拿去吃。想一想，哪个偏旁和人有关？ | “偷”是单人旁，指人做的事。 | zh.p3_chinese.char.u5077; zh.p3_higher_chinese.char.u5077 |
| zh-p3-confusable-u5077.q2 v1 / similar | 有人[空1]走了他的钱包。<br>1 愉；2 偷；3 榆；4 输 | 偷 | 不经允许拿走别人的东西。 | 不经允许拿走是“偷”。 | zh.p3_chinese.char.u5077; zh.p3_higher_chinese.char.u5077 |
| zh-p3-confusable-u5077.q3 v1 / generic | 不能[空1]看别人的考卷。<br>1 榆；2 偷；3 愉；4 输 | 偷 | 不让别人知道地看，这是不对的。 | “偷看”是不对的行为，单人旁。 | zh.p3_chinese.char.u5077; zh.p3_higher_chinese.char.u5077 |
| zh-p3-confusable-u6652.q1 v2 / exact | 奶奶把衣服拿到外面去[空1]。<br>1 酒；2 西；3 洒；4 晒 | 晒 | 衣服要在太阳下变干。想一想，哪个偏旁和太阳或光线有关？ | “晒”是日字旁，和太阳有关。 | zh.p3_chinese.char.u6652; zh.p3_higher_chinese.char.u6652 |
| zh-p3-confusable-u6652.q2 v1 / similar | 小猫躺在阳光下[空1]太阳。<br>1 洒；2 西；3 晒；4 酒 | 晒 | 在阳光下取暖，看偏旁。 | “晒太阳”的“晒”是日字旁。 | zh.p3_chinese.char.u6652; zh.p3_higher_chinese.char.u6652 |
| zh-p3-confusable-u6652.q3 v1 / generic | 雨停了，妈妈把湿鞋子放在窗台上[空1]干。<br>1 晒；2 酒；3 洒；4 西 | 晒 | 让太阳把鞋子变干。 | 用太阳弄干写“晒干”。 | zh.p3_chinese.char.u6652; zh.p3_higher_chinese.char.u6652 |
| zh-p3-confusable-u60ca.q1 v2 / exact | 听到这个消息，大家都吃了一[空1]。<br>1 京；2 惊；3 凉；4 景 | 惊 | 这是心里突然的感觉。想一想，哪个偏旁和心里的感觉有关？ | “吃了一惊”的“惊”是竖心旁。 | zh.p3_chinese.char.u60ca; zh.p3_higher_chinese.char.u60ca |
| zh-p3-confusable-u60ca.q2 v1 / similar | 小鸟受到[空1]吓，飞走了。<br>1 凉；2 京；3 惊；4 景 | 惊 | 小鸟被吓到了。 | “惊吓”的“惊”是竖心旁。 | zh.p3_chinese.char.u60ca; zh.p3_higher_chinese.char.u60ca |
| zh-p3-confusable-u60ca.q3 v1 / generic | 看到一只大老虎，他[空1]讶地张大了嘴。<br>1 凉；2 惊；3 景；4 京 | 惊 | 突然看到老虎时的感觉。 | “惊讶”表示非常意外，竖心旁。 | zh.p3_chinese.char.u60ca; zh.p3_higher_chinese.char.u60ca |
| zh-p3-confusable-u7bc7.q1 v2 / exact | 我写了一[空1]作文。<br>1 篇；2 骗；3 偏；4 遍 | 篇 | 数文章用的量词。想一想，哪个偏旁和竹子有关？ | 文章用“篇”来数，竹字头。 | zh.p3_chinese.char.u7bc7; zh.p3_higher_chinese.char.u7bc7 |
| zh-p3-confusable-u7bc7.q2 v2 / similar | 这[空1]文章很有趣。<br>1 篇；2 偏；3 遍；4 骗 | 篇 | 文章的量词。想一想，哪个偏旁和竹子有关？ | “这篇文章”用“篇”。 | zh.p3_chinese.char.u7bc7; zh.p3_higher_chinese.char.u7bc7 |
| zh-p3-confusable-u7bc7.q3 v1 / generic | 图书馆里有一[空1]介绍恐龙的文章。<br>1 偏；2 遍；3 骗；4 篇 | 篇 | 数文章用哪个量词？ | 数文章用“篇”。 | zh.p3_chinese.char.u7bc7; zh.p3_higher_chinese.char.u7bc7 |
| zh-p3-confusable-u6b49.q1 v1 / exact | 他打破了花瓶，向妈妈道[空1]。<br>1 嫌；2 谦；3 兼；4 歉 | 歉 | 做错事后要向人认错，注意右边的部件。 | “道歉”的“歉”右边是“欠”。 | zh.p3_chinese.char.u6b49; zh.p3_higher_chinese.char.u6b49 |
| zh-p3-confusable-u6b49.q2 v1 / similar | 我很抱[空1]，我来晚了。<br>1 歉；2 谦；3 兼；4 嫌 | 歉 | 说对不起时可以用这个词。 | “抱歉”表示对不起。 | zh.p3_chinese.char.u6b49; zh.p3_higher_chinese.char.u6b49 |
| zh-p3-confusable-u6b49.q3 v1 / generic | 踩到别人的脚，要马上说对不起，表示[空1]意。<br>1 嫌；2 谦；3 歉；4 兼 | 歉 | 表示自己做错了的意思。 | “歉意”指认错、对不起的意思。 | zh.p3_chinese.char.u6b49; zh.p3_higher_chinese.char.u6b49 |
| zh-p3-confusable-u8d5b.q1 v1 / exact | 学校举行跑步比[空1]。<br>1 塞；2 寨；3 寒；4 赛 | 赛 | 大家比一比谁跑得快，注意下面的部件。 | “比赛”的“赛”下面是“贝”。 | zh.p3_chinese.char.u8d5b; zh.p3_higher_chinese.char.u8d5b |
| zh-p3-confusable-u8d5b.q2 v1 / similar | 我们班在拔河[空1]中得了第一名。<br>1 赛；2 寒；3 寨；4 塞 | 赛 | 大家比一比，看哪一班最厉害。 | “拔河赛”的“赛”下面是“贝”。 | zh.p3_chinese.char.u8d5b; zh.p3_higher_chinese.char.u8d5b |
| zh-p3-confusable-u8d5b.q3 v1 / generic | 球[空1]结束后，大家都很开心。<br>1 寒；2 塞；3 赛；4 寨 | 赛 | 球队之间的比一比。 | “球赛”的“赛”下面是“贝”。 | zh.p3_chinese.char.u8d5b; zh.p3_higher_chinese.char.u8d5b |
| zh-p3-confusable-u62ab.q1 v2 / exact | 天冷了，妈妈给我[空1]上外套。<br>1 披；2 坡；3 波；4 被 | 披 | 把衣服搭在肩上。想一想，哪个偏旁和手有关？ | “披”是提手旁，用手把衣服搭在身上。 | zh.p3_chinese.char.u62ab; zh.p3_higher_chinese.char.u62ab |
| zh-p3-confusable-u62ab.q2 v1 / similar | 她[空1]着长长的头发。<br>1 被；2 坡；3 波；4 披 | 披 | 头发散在肩上。 | 头发散在肩上叫“披着头发”。 | zh.p3_chinese.char.u62ab; zh.p3_higher_chinese.char.u62ab |
| zh-p3-confusable-u62ab.q3 v2 / generic | 演员[空1]着一件红色的斗篷。<br>1 披；2 波；3 被；4 坡 | 披 | 斗篷搭在肩上。 | 斗篷搭在肩上用“披”。 | zh.p3_chinese.char.u62ab; zh.p3_higher_chinese.char.u62ab |
| zh-p3-radical-u8e29.q1 v2 / exact | 小心，不要[空1]到地上的花。<br>1 彩；2 踩；3 睬；4 采 | 踩 | 用脚做的动作。想一想，哪个偏旁和脚有关？ | “踩”是足字旁，和脚有关。 | zh.p3_chinese.char.u8e29; zh.p3_higher_chinese.char.u8e29 |
| zh-p3-radical-u8e29.q2 v1 / similar | 他一不小心[空1]进了水坑。<br>1 彩；2 踩；3 睬；4 采 | 踩 | 脚走进了水坑。 | 脚踏进去是“踩”。 | zh.p3_chinese.char.u8e29; zh.p3_higher_chinese.char.u8e29 |
| zh-p3-radical-u8e29.q3 v1 / generic | 我们在沙滩上[空1]出一个个脚印。<br>1 睬；2 采；3 踩；4 彩 | 踩 | 留下脚印的动作。 | 用脚踏出脚印写“踩”。 | zh.p3_chinese.char.u8e29; zh.p3_higher_chinese.char.u8e29 |
| zh-p3-radical-u642c.q1 v2 / exact | 我们帮老师[空1]椅子。<br>1 盘；2 船；3 般；4 搬 | 搬 | 用手移动东西。想一想，哪个偏旁和手有关？ | “搬”是提手旁，和手有关。 | zh.p3_chinese.char.u642c; zh.p3_higher_chinese.char.u642c |
| zh-p3-radical-u642c.q2 v1 / similar | 蚂蚁在[空1]家。<br>1 般；2 搬；3 船；4 盘 | 搬 | 把东西从一个地方移到另一个地方。 | “搬家”的“搬”是提手旁。 | zh.p3_chinese.char.u642c; zh.p3_higher_chinese.char.u642c |
| zh-p3-radical-u642c.q3 v1 / generic | 这箱书太重了，我一个人[空1]不动。<br>1 盘；2 般；3 搬；4 船 | 搬 | 重东西要用手抬起来移动。 | 移动重物写“搬”。 | zh.p3_chinese.char.u642c; zh.p3_higher_chinese.char.u642c |
| zh-p3-radical-u558a.q1 v2 / exact | 他大声[空1]妈妈。<br>1 减；2 碱；3 喊；4 感 | 喊 | 用嘴发出大声。想一想，哪个偏旁和嘴巴有关？ | “喊”是口字旁，和用嘴有关。 | zh.p3_chinese.char.u558a; zh.p3_higher_chinese.char.u558a |
| zh-p3-radical-u558a.q2 v1 / similar | 比赛时，大家为选手大声[空1]加油。<br>1 感；2 喊；3 减；4 碱 | 喊 | 用嘴发出声音为人打气。 | 用嘴大声叫写“喊”。 | zh.p3_chinese.char.u558a; zh.p3_higher_chinese.char.u558a |
| zh-p3-radical-u558a.q3 v1 / generic | 我在山上大[空1]一声，听到了回音。<br>1 碱；2 喊；3 减；4 感 | 喊 | 大声发出声音，看偏旁。 | 大声叫是“喊”，口字旁。 | zh.p3_chinese.char.u558a; zh.p3_higher_chinese.char.u558a |
| zh-p3-radical-u6ed1.q1 v1 / exact | 下雨后地很[空1]，要小心。<br>1 话；2 猾；3 滑；4 骨 | 滑 | 地上有水，脚站不稳，选三点水的字。 | “滑”是三点水，和水有关。 | zh.p3_chinese.char.u6ed1; zh.p3_higher_chinese.char.u6ed1 |
| zh-p3-radical-u6ed1.q2 v1 / similar | 小朋友在公园玩[空1]梯。<br>1 猾；2 滑；3 话；4 骨 | 滑 | 从上面顺着溜下来的游戏器材。 | “滑梯”的“滑”是三点水。 | zh.p3_chinese.char.u6ed1; zh.p3_higher_chinese.char.u6ed1 |
| zh-p3-radical-u6ed1.q3 v1 / generic | 冬天，人们在结冰的湖上[空1]冰。<br>1 骨；2 滑；3 话；4 猾 | 滑 | 在冰上溜着走。 | “滑冰”的“滑”是三点水。 | zh.p3_chinese.char.u6ed1; zh.p3_higher_chinese.char.u6ed1 |
| zh-p3-radical-u88d9.q1 v2 / exact | 妹妹穿着一条红[空1]子。<br>1 裙；2 群；3 郡；4 君 | 裙 | 这是一种衣服。想一想，哪个偏旁和衣服有关？ | “裙”是衣字旁，和衣服有关。 | zh.p3_chinese.char.u88d9; zh.p3_higher_chinese.char.u88d9 |
| zh-p3-radical-u88d9.q2 v1 / similar | 姐姐的校服是一条蓝色的[空1]子。<br>1 郡；2 裙；3 群；4 君 | 裙 | 女生穿的衣服。 | 衣服写衣字旁的“裙”。 | zh.p3_chinese.char.u88d9; zh.p3_higher_chinese.char.u88d9 |
| zh-p3-radical-u88d9.q3 v1 / generic | 跳舞时，她的长[空1]转成了一朵花。<br>1 裙；2 群；3 君；4 郡 | 裙 | 跳舞时会转起来的衣服。 | “长裙”的“裙”是衣字旁。 | zh.p3_chinese.char.u88d9; zh.p3_higher_chinese.char.u88d9 |
| zh-p3-radical-u817f.q1 v2 / exact | 他跑步时摔伤了[空1]。<br>1 腿；2 退；3 推；4 褪 | 腿 | 身体的一个部位。想一想，哪个偏旁和身体有关？ | “腿”是月字旁，和身体有关。 | zh.p3_chinese.char.u817f; zh.p3_higher_chinese.char.u817f |
| zh-p3-radical-u817f.q2 v1 / similar | 小狗有四条[空1]。<br>1 腿；2 褪；3 推；4 退 | 腿 | 小狗用来走路的部位。 | 走路用“腿”，月字旁。 | zh.p3_chinese.char.u817f; zh.p3_higher_chinese.char.u817f |
| zh-p3-radical-u817f.q3 v1 / generic | 长颈鹿的[空1]又细又长。<br>1 褪；2 退；3 腿；4 推 | 腿 | 长颈鹿身体的哪个部分又细又长？ | 身体部位“腿”是月字旁。 | zh.p3_chinese.char.u817f; zh.p3_higher_chinese.char.u817f |
| zh-p3-radical-u949f.q1 v2 / exact | 墙上的[空1]走得很准。<br>1 钟；2 肿；3 种；4 冲 | 钟 | 看时间用的东西。想一想，哪个偏旁和金属有关？ | “钟”是金字旁，和金属有关。 | zh.p3_chinese.char.u949f; zh.p3_higher_chinese.char.u949f |
| zh-p3-radical-u949f.q2 v1 / similar | 现在是下午三点[空1]。<br>1 冲；2 钟；3 肿；4 种 | 钟 | 说时间时用的词。 | 说时间用“点钟”。 | zh.p3_chinese.char.u949f; zh.p3_higher_chinese.char.u949f |
| zh-p3-radical-u949f.q3 v1 / generic | 学校的[空1]声响了，大家进课室。<br>1 钟；2 肿；3 冲；4 种 | 钟 | 会响的金属东西。 | “钟声”的“钟”是金字旁。 | zh.p3_chinese.char.u949f; zh.p3_higher_chinese.char.u949f |
| zh-p3-radical-u94f6.q1 v2 / exact | 奶奶有一个[空1]色的手镯。<br>1 根；2 银；3 很；4 跟 | 银 | 一种金属的颜色。想一想，哪个偏旁和金属有关？ | “银”是金字旁，是一种金属。 | zh.p3_chinese.char.u94f6; zh.p3_higher_chinese.char.u94f6 |
| zh-p3-radical-u94f6.q2 v1 / similar | 月光照在河上，像一条[空1]带。<br>1 银；2 跟；3 很；4 根 | 银 | 月光是白亮白亮的。 | 白亮的颜色可以说“银色”。 | zh.p3_chinese.char.u94f6; zh.p3_higher_chinese.char.u94f6 |
| zh-p3-radical-u94f6.q3 v2 / generic | [空1]行可以帮我们存钱。<br>1 银；2 跟；3 根；4 很 | 银 | 存钱的地方。想一想，哪个偏旁和金属有关？ | “银行”的“银”是金字旁。 | zh.p3_chinese.char.u94f6; zh.p3_higher_chinese.char.u94f6 |
| zh-p3-measure.q1 v1 / exact | 墙上挂着一[空1]镜子。<br>1 面；2 张；3 只；4 本 | 面 | 镜子是平平的一片。 | 镜子用“面”来数。 | 量词运用 |
| zh-p3-measure.q2 v1 / similar | 我买了一[空1]牙膏。<br>1 只；2 张；3 块；4 支 | 支 | 牙膏是细长的。 | 牙膏用“支”来数。 | 量词运用 |
| zh-p3-measure.q3 v1 / generic | 爷爷戴着一[空1]眼镜。<br>1 本；2 张；3 副；4 只 | 副 | 眼镜有两片镜片，是一套。 | 眼镜用“副”来数。 | 量词运用 |
| zh-p3-measure.q4 v1 / general | 他们住在一[空1]小房子里。<br>1 条；2 间；3 双；4 本 | 间 | 房子怎么数？ | 房子可以说“一间房子”。 | 量词运用 |
| zh-p3-measure.q5 v1 / general | 妈妈给我买了一[空1]新鞋子。<br>1 双；2 头；3 本；4 张 | 双 | 鞋子是两只一起的。 | 成对的鞋子用“双”。 | 量词运用 |
| zh-p3-measure.q6 v1 / general | 农场里有一[空1]大黄牛。<br>1 头；2 辆；3 张；4 本 | 头 | 牛这样的大动物怎么数？ | 牛可以说“一头牛”。 | 量词运用 |
| zh-p3-measure.q7 v1 / general | 我给外婆写了一[空1]信。<br>1 本；2 块；3 封；4 条 | 封 | 信装在信封里。 | 信用“封”来数。 | 量词运用 |
| zh-p3-measure.q8 v1 / general | 雨后，天上出现了一[空1]彩虹。<br>1 只；2 本；3 辆；4 道 | 道 | 彩虹是长长的弧线。 | 彩虹可以说“一道彩虹”。 | 量词运用 |
| zh-p3-collocation.q1 v1 / exact | 我报名[空1]了学校的歌唱比赛。<br>1 参观；2 观察；3 打开；4 参加 | 参加 | 加入比赛用哪个词？ | “参加比赛”表示加入比赛。 | 词语搭配 |
| zh-p3-collocation.q2 v1 / similar | 老师带我们去[空1]博物馆。<br>1 参观；2 参加；3 穿上；4 修理 | 参观 | 到一个地方去看看。 | “参观博物馆”表示去看展览。 | 词语搭配 |
| zh-p3-collocation.q3 v1 / generic | 上课时，他举手[空1]老师的问题。<br>1 回答；2 吃；3 穿；4 唱 | 回答 | 老师问了问题，学生要怎样？ | “回答问题”。 | 词语搭配 |
| zh-p3-collocation.q4 v1 / general | 我们要爱护地球，保护[空1]。<br>1 饭菜；2 环境；3 时间；4 声音 | 环境 | 地球上的空气、水和树木。 | “保护环境”。 | 词语搭配 |
| zh-p3-collocation.q5 v1 / general | 早睡早起是一个好[空1]。<br>1 天气；2 衣服；3 颜色；4 习惯 | 习惯 | 每天都会这样做的事。 | “好习惯”。 | 词语搭配 |
| zh-p3-collocation.q6 v1 / general | 过马路时要遵守交通[空1]。<br>1 树叶；2 书包；3 规则；4 汽车 | 规则 | 大家都要遵守的要求。 | “遵守规则”。 | 词语搭配 |
| zh-p3-collocation.q7 v1 / general | 大家一起想办法，终于解决了这个[空1]。<br>1 窗户；2 蛋糕；3 鞋子；4 问题 | 问题 | 想办法要解决的是什么？ | “解决问题”。 | 词语搭配 |
| zh-p3-collocation.q8 v1 / general | 学校下个月要举行[空1]。<br>1 书包；2 树叶；3 运动会；4 铅笔 | 运动会 | 学校会举办的活动。 | “举行运动会”。 | 词语搭配 |
| zh-p3-wordchoice.q1 v1 / exact | 这次考试他得了满分，大家都很[空1]他。<br>1 担心；2 害怕；3 讨厌；4 佩服 | 佩服 | 别人做得很好时，我们心里会怎样？ | “佩服”表示觉得别人很了不起。 | 根据语境理解和选择词语 |
| zh-p3-wordchoice.q2 v1 / similar | 弟弟把房间弄得乱七八糟，妈妈很[空1]。<br>1 感谢；2 骄傲；3 生气；4 开心 | 生气 | 房间被弄乱了，妈妈会有什么感觉？ | 房间被弄乱，妈妈很生气。 | 根据语境理解和选择词语 |
| zh-p3-wordchoice.q3 v1 / generic | 这道数学题太[空1]了，我想了很久也不会做。<br>1 容易；2 快；3 简单；4 难 | 难 | 想了很久也不会做，说明题目怎样？ | 题目难才会想很久。 | 根据语境理解和选择词语 |
| zh-p3-wordchoice.q4 v1 / general | 他做事很[空1]，从来不会忘记带东西。<br>1 随便；2 马虎；3 细心；4 粗心 | 细心 | 从不忘记东西的人是怎样的？ | 细心的人不会忘记东西。 | 根据语境理解和选择词语 |
| zh-p3-wordchoice.q5 v4 / general | 小明从来不说谎，大家都说他是个[空1]的孩子。<br>1 生气；2 诚实；3 骄傲；4 害怕 | 诚实 | 不说谎、说实话的人是怎样的？ | 从来不说谎、总是说实话，是“诚实”的表现。这里用“诚实”形容小明。 | 根据语境理解和选择词语 |
| zh-p3-wordchoice.q6 v1 / exact | 练习了很多次，我们班[空1]得了第一名。<br>1 从来；2 不但；3 终于；4 虽然 | 终于 | 经过很多努力后的结果。 | “终于”表示经过努力后得到结果。 | 关联词 |
| zh-p3-wordchoice.q7 v1 / similar | 雨下得很大，[空1]我们还是去上学了。<br>1 因为；2 而且；3 但是；4 所以 | 但是 | 前后意思相反。 | 前后意思相反用“但是”。 | 关联词 |
| zh-p3-wordchoice.q8 v1 / generic | [空1]下大雨，所以比赛取消了。<br>1 虽然；2 如果；3 但是；4 因为 | 因为 | 后面有“所以”。 | “因为……所以……”说明原因和结果。 | 关联词 |
| zh-p3-sentence.q1 v1 / exact | 哪个句子排列正确？（小鸟 / 在树上 / 快乐地 / 唱歌）<br>1 小鸟唱歌在树上快乐地。；2 在树上唱歌小鸟快乐地。；3 快乐地小鸟唱歌在树上。；4 小鸟在树上快乐地唱歌。 | 小鸟在树上快乐地唱歌。 | 谁在哪里怎样做什么？ | “小鸟在树上快乐地唱歌。” | 排列词语成句 |
| zh-p3-sentence.q2 v1 / similar | 哪个句子排列正确？（我们 / 把 / 打扫干净 / 教室 / 了）<br>1 教室把我们打扫干净了。；2 我们把教室打扫干净了。；3 把教室我们了打扫干净。；4 我们打扫干净把教室了。 | 我们把教室打扫干净了。 | “把”后面先说东西，再说做了什么。 | “我们把教室打扫干净了。” | 排列词语成句 |
| zh-p3-sentence.q3 v1 / generic | 哪个句子排列正确？（因为 / 下大雨 / 运动会 / 改期了）<br>1 运动会因为改期了，下大雨。；2 改期了因为运动会下大雨。；3 因为下大雨，运动会改期了。；4 下大雨因为，运动会改期了。 | 因为下大雨，运动会改期了。 | 先说原因，再说结果。 | “因为下大雨，运动会改期了。” | 排列词语成句 |
| zh-p3-sentence.q4 v1 / exact | 用“被”改写：“小猫打翻了花瓶。”<br>1 被小猫花瓶打翻了。；2 花瓶被小猫打翻了。；3 花瓶把小猫打翻了。；4 小猫被花瓶打翻了。 | 花瓶被小猫打翻了。 | “被”前面是受到动作的东西。 | 受到动作的是花瓶，所以“花瓶被小猫打翻了。” | 句式转换 |
| zh-p3-sentence.q5 v1 / similar | 用“把”改写：“弟弟吃完了饼干。”<br>1 弟弟吃完了把饼干。；2 弟弟把饼干吃完了。；3 饼干把弟弟吃完了。；4 把弟弟饼干吃完了。 | 弟弟把饼干吃完了。 | “把”后面是被处理的东西。 | “弟弟把饼干吃完了。” | 句式转换 |
| zh-p3-sentence.q6 v1 / generic | 把“妈妈买了一个蛋糕。”改成问句，哪一句正确？<br>1 一个蛋糕买了妈妈。；2 妈妈买了什么？；3 妈妈买了一个蛋糕！；4 妈妈为什么蛋糕？ | 妈妈买了什么？ | 问句要问出“蛋糕”这部分。 | 问买了什么东西：“妈妈买了什么？” | 句式转换 |
| zh-p3-punct.q1 v1 / exact | 选出正确的标点：你喜欢吃苹果还是香蕉[空1]<br>1 、；2 ！；3 。；4 ？ | ？ | 这句话在问人选择。 | 问句用问号。 | 标点选择 |
| zh-p3-punct.q2 v1 / similar | 选出正确的标点：哇[空1]这里的风景真美！<br>1 、；2 。；3 ？；4 ！ | ！ | “哇”表示很惊喜。 | 表示强烈感情的叹词后面用感叹号。 | 标点选择 |
| zh-p3-punct.q3 v1 / generic | 选出正确的标点：老师说[空1]“明天去郊游。”<br>1 ？；2 ：；3 、；4 ！ | ： | 说的话前面用什么标点？ | 引出说的话用冒号。 | 标点选择 |
| zh-p3-punct.q4 v1 / general | 选出正确的标点：他买了铅笔[空1]橡皮和尺子。<br>1 ！；2 ：；3 。；4 、 | 、 | 几样东西并列时用什么隔开？ | 并列词语之间用顿号。 | 标点选择 |
| zh-p3-punct.q5 v1 / general | 选出正确的标点：妈妈问：[空1]你吃饭了吗？”<br>1 （；2 ”；3 “；4 《 | “ | 说的话开始时用什么标点？ | 说话内容开始用前引号“。 | 标点选择 |
| zh-p3-punct.q6 v1 / general | 选出正确的标点：我最喜欢读[空1]西游记》这本书。<br>1 、；2 “；3 《；4 （ | 《 | 书名要用什么符号括起来？ | 书名用书名号《》。 | 标点选择 |
| zh-p2-read-repair.q1 v1 / exact | 读一读：星期五下午，小林和爸爸去海边放风筝。风很大，他们的风筝飞得又高又远。<br>小林和谁去海边？<br>1 哥哥；2 爸爸；3 妈妈；4 老师 | 爸爸 | 找一找第一句里和小林一起去的人。 | 第一句写明小林和爸爸去海边。 | 找出短文中明示的信息 |
| zh-p2-read-repair.q2 v1 / similar | 读一读：小红每天早上七点起床。她先刷牙洗脸，再吃早饭，然后和哥哥一起走路上学。<br>小红每天几点起床？<br>1 六点；2 八点；3 九点；4 七点 | 七点 | 找一找“起床”前面的时间。 | 第一句写明小红每天早上七点起床。 | 找出短文中明示的信息 |
| zh-p2-read-repair.q3 v1 / generic | 读一读：学校的花园里种了很多花，有红花、黄花，还有白花。放学后，同学们轮流去浇水。<br>花园里有哪几种颜色的花？<br>1 只有白色；2 黄色和紫色；3 红色、黄色和白色；4 红色和蓝色 | 红色、黄色和白色 | 把短文里说到的颜色都找出来。 | 短文写了红花、黄花和白花。 | 找出短文中明示的信息 |
| zh-p2-notice-repair.q1 v1 / exact | 读一读：【美术比赛】<br>时间：五月八日上午九点<br>地点：二楼美术室<br>请自己带彩色笔。<br>比赛在哪里举行？<br>1 学校礼堂；2 二楼美术室；3 一楼美术室；4 二楼音乐室 | 二楼美术室 | 找一找“地点”这一行。 | 通知写明地点是二楼美术室。 | 从通知、告示中找信息 |
| zh-p2-notice-repair.q2 v1 / similar | 读一读：【失物招领】<br>捡到一个红色水壶。<br>请到办公室找陈老师领取。<br>要到哪里领取水壶？<br>1 操场；2 食堂；3 办公室；4 图书馆 | 办公室 | 读最后一行。 | 通知请大家到办公室找陈老师领取。 | 从通知、告示中找信息 |
| zh-p2-notice-repair.q3 v2 / generic | 读一读：【食堂今日午餐】<br>鸡饭：两元<br>炒面：一元五角<br>苹果：五角<br>炒面多少钱？<br>1 两元；2 五角；3 一元五角；4 一元 | 一元五角 | 找一找“炒面”这一行。 | 告示写明炒面一元五角。 | 从通知、告示中找信息 |
| zh-p2-charctx-repair.q1 v1 / exact | 天黑了，请把灯打[空1]。<br>1 闭；2 开；3 门；4 并 | 开 | 想一想，天黑了要让灯怎么样。 | “打开”灯，房间才会亮。 | 根据句意选字 |
| zh-p2-charctx-repair.q2 v2 / similar | 我吃得很[空1]，一口也吃不下了。<br>1 跑；2 抱；3 泡；4 饱 | 饱 | 吃了很多东西以后，会觉得怎样？ | 吃够了叫“饱”。“饱”是食字旁，和吃有关。 | 根据句意选字 |
| zh-p2-charctx-repair.q3 v1 / generic | 妈妈给我买了一个新书[空1]。<br>1 包；2 抱；3 跑；4 饱 | 包 | 上学时用来装书的东西叫什么？ | 装书的是“书包”。 | 根据句意选字 |
| zh-p3-read-repair.q1 v1 / exact | 读一读：一年一度的书展在星期六开幕。小华和同学一早就到了会场。他们先去童书区看漫画，然后去科学区买了一本介绍恐龙的书。<br>小华在科学区买了什么书？<br>1 介绍太空的书；2 介绍恐龙的书；3 漫画书；4 故事书 | 介绍恐龙的书 | 找一找“科学区”后面写了什么。 | 短文写明他们在科学区买了一本介绍恐龙的书。 | 找出短文中明示的信息 |
| zh-p3-read-repair.q2 v1 / similar | 读一读：这次远足，我们沿着河边走了两个小时。路上，老师教我们认识了三种不同的鸟，还提醒大家不要乱丢垃圾。<br>老师提醒大家什么？<br>1 不要大声说话；2 要走快一点；3 不要乱丢垃圾；4 要多喝水 | 不要乱丢垃圾 | 找一找“提醒”后面的话。 | 短文写明老师提醒大家不要乱丢垃圾。 | 找出短文中明示的信息 |
| zh-p3-read-repair.q3 v1 / generic | 读一读：哥哥参加了学校的乐队，他负责打鼓。每个星期二和星期四放学后，乐队都要练习一个半小时。<br>乐队每次练习多长时间？<br>1 一个半小时；2 一个小时；3 半个小时；4 两个小时 | 一个半小时 | 找一找“练习”后面的时间。 | 短文写明乐队每次练习一个半小时。 | 找出短文中明示的信息 |
| zh-p3-notice-repair.q1 v1 / exact | 读一读：【游泳池开放时间】<br>星期二至星期日：上午八点到晚上九点<br>星期一：休息<br>十二岁以下儿童须由大人陪同。<br>哪一天游泳池不开放？<br>1 星期六；2 星期日；3 星期二；4 星期一 | 星期一 | 找一找写着“休息”的那一天。 | 告示写明星期一休息，所以那天不开放。 | 从通知、告示中找信息 |
| zh-p3-notice-repair.q2 v1 / similar | 读一读：【环保手工比赛】<br>参加者：三年级学生<br>作品要用旧报纸、旧瓶子等旧材料制作。<br>交件日期：十月二十日以前<br>作品要用什么材料制作？<br>1 新买的彩纸；2 布和珠子；3 木头和铁；4 旧报纸、旧瓶子等旧材料 | 旧报纸、旧瓶子等旧材料 | 找一找“材料”这两个字。 | 告示写明作品要用旧报纸、旧瓶子等旧材料制作。 | 从通知、告示中找信息 |
| zh-p3-notice-repair.q3 v2 / generic | 读一读：【巴士车费】<br>大人：一元五角<br>小学生：五角<br>小学生坐巴士要付多少钱？<br>1 一元五角；2 五角；3 两元；4 一元 | 五角 | 找一找“小学生”这一行。 | 告示写明小学生的车费是五角。 | 从通知、告示中找信息 |
| zh-p3-charctx-repair.q1 v1 / exact | 他做事很认真，从来不[空1]虎。<br>1 马；2 妈；3 吗；4 码 | 马 | “不认真”可以说成哪个词？ | “马虎”是不认真的意思，句子说他从来不马虎。 | 根据句意选字 |
| zh-p3-charctx-repair.q2 v1 / similar | 外面下大雨，我们只好在屋子里[空1]棋。<br>1 上；2 下；3 卡；4 不 | 下 | 玩棋的时候，我们说“……棋”。 | 玩棋叫“下棋”。 | 根据句意选字 |
| zh-p3-charctx-repair.q3 v1 / generic | 冬天，北方很冷，河面都结[空1]了。<br>1 永；2 求；3 水；4 冰 | 冰 | 水很冷的时候会变成什么？ | 水冷到一定程度会结冰。 | 根据句意选字 |
