# Chinese curriculum, contracts and first content batch

**Current content state:** use the [canonical curriculum](../content/chinese/curriculum.json), [batch review logs](../content/chinese/batches/) and [generated release inventory](content-review/CHINESE_RELEASE_INVENTORY.md). They record approved Chinese content and the denominator; exact sampled/disputed versions and rights decisions remain in their review records. Approval does not establish subject-release or real-record readiness.

Independent public-source research and original findings: [research audit](#research-audit) (2026-10-16). The review disposition below records subsequent corrections; the historical audit remains evidence, not batch approval.

Current behavior comes from [Functional Design](PILOT_FUNCTIONAL_DESIGN.md); implementation boundaries are in the [README](../README.md). [Content QA](CONTENT_QA.md) and the authoring skills define review requirements.

## 1. What is ready to inspect

| Canonical artifact | Use it for |
| --- | --- |
| [Curriculum](../content/chinese/curriculum.json) and [review characters](../content/chinese/review-characters.json) | Version-pinned course/leaf/character records, source evidence and approval metadata |
| [Batches](../content/chinese/batches/) and [generated release inventory](content-review/CHINESE_RELEASE_INVENTORY.md) | Current versions, counts, coverage, stock limits and per-batch review/rights state |
| [Contract schema](../contracts/chinese/1.schema.json), [fixtures](../content/chinese/fixtures/) and [validator](../scripts/validate_chinese_content.py) | Authoring shapes and synthetic contract checks; not proof of runtime or educational correctness |
| [Common](../skills/question-authoring/SKILL.md) and [Chinese](../skills/chinese-question-authoring/SKILL.md) skills | Current per-item authoring lessons and the linked PR23 case log |

## Current findings and next work

| Finding | Disposition / invariant | Retained evidence |
| --- | --- | --- |
| ZH1–ZH2 | Leaf denominator has recorded approval; keep character coverage separate and shared CL/HCL availability distinct from HCL depth. Grade-chart dispositions remain binding. | [Version-10 decisions](#current-review--batch-version-10), manifest and generated inventory |
| ZH3 | Non-character routes are authored; report ability-level progress accurately. A target without a concrete compatible reviewed pool stays pending_content. Thin stock and empty leaves remain visible in the inventory. | [Version-7 route fixes](#review-response--16-october-2026-batch-version-7) and canonical target/route records |
| ZH4 | Windmill text was corrected, then its cloze was retagged with compatible routes. No closed finding becomes a new approval requirement. | [Audit response](#audit-response-revision--16-october-2026-batch-version-6) and version-7 response |

Content approval is separate from usable daily supply, import/private-proceed gates, device acceptance and real-record readiness. Review/textbook-extra targets never add P2 outcomes. Current counters come from the generated inventory; historical snapshots below are fixed evidence.

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

Compare that report with the checked-in report. Reproducible extraction and author spot checks do not replace independent source/grade review. The recorded grade-chart dispositions below apply to the current denominator.

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

This source-derived mapping is not an official MOE endorsement. Following the visual grade audit and recorded dispositions, the owner approved the current leaf list as the coverage denominator on 2026-10-18. Import implementation and its release gates remain separate.

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
| `curriculum` | Source/outcome/character catalogue only. This manifest now has `status=approved` and `coverage_status=approved`; its pinned version name remains `zh-2024-p2p3-draft.2`. Source references and per-course identity are required. `unfilled` means no approved complete mapping. Approval does not implement imports or populate an app-owned manifest allowlist. |
| `batch` | Original materials own ordered, complete question lists. Each item has course/outcome references, answer key, hint, explanation, rationale, rights status and asset references. Correct option must exist; duplicate IDs/options and orphan material questions fail. No runtime AI. |
| `task_plan` | Synthetic frozen queue pins batch, manifest, item versions, course, X, material structure, role and starting stage before presentation. Main count includes formal questions only. At least ceil(X/5) complete materials AND X questions. No interleaving a short question into a material. |
| `import` | Chinese subset of `pilot-mistakes/1`; P2 CL/HCL only. P3 import rejected even with null mapping. Parent/app ownership, source IDs, stages and due dates cannot come from payload. At most 1 MiB decoded JSON, 1,000 candidates; NFC/boundary normalization and inert rendering remain app-boundary work. |
| `attempt` | Private event shape with opaque app-created IDs, pinned public item/version, selected option, phase, assistance, local day, sequence and idempotency key. First means no assistance; retry means hint; correction means revealed explanation. The app derives correctness from the pinned key; imported mastery/correctness is never trusted. |

The schema is Draft 2020-12 shaped. The lightweight validator implements **only the keywords used in this file**, rejecting unsupported keywords; it is not a general JSON Schema library or an app input endpoint. Its CLI reads public fixtures only. A production importer additionally needs byte limits before parsing, depth/resource limits, authorization, all-entry preview, cancellation/atomic commit, deduplication and private diagnostics. Bounded text is not proof of anonymization.

**Repair groups (version 4).** The batch declares `groups`: each has an ID, version, Chinese and English topic labels, courses, the full list of target character IDs and the full list of member item IDs. The validator rejects a group with a missing or extra member, a declared target without a complete exact/similar/generic pool, an item whose target or courses fall outside its group, and any repair item that does not belong to exactly one group. Deleting a whole pool's items therefore fails (`group_missing_item`), and removing a pool from the group declaration while its items remain also fails (`repair_item_group_membership`). Groups in version 4: `zh-group-p2-confusable` (12 targets), `zh-group-p2-radicals` (10), `zh-group-p3-confusable` (15), `zh-group-p3-radicals` (8).

Review/rights/content/coverage states are controlled enums, separate from record shape. The validator rejects an `approved` batch with inconsistent review/rights states or unresolved disputed IDs, and rejects an approved manifest with pending coverage. These are consistency checks, not proof that a human reviewed or approved anything. Both current batches record completed review and owner sign-off; earlier changes-requested states remain in their review histories. Sampled/disputed IDs must exist in the batch.

Blanks and pinyin are structured: text contains `{{blank-1}}` or `{{pinyin-1}}`; each text owner declares its own `blanks` and `annotations`. A blank explicitly names its question ID; the question's `blank_ref` links back. Pinyin records hold `text` and `pinyin` separately. All placeholder IDs must occur exactly once in that owner's text, with no orphan annotation or question link. The later renderer must display blanks as answer slots, not literal tokens, and pinyin as an annotation beside its linked text. Do not parse full-width parentheses to infer purpose. The readable tables below substitute these declarations for review only, not an implementation of the app renderer.

For pending intake, `knowledge_point_ref` is JSON null; an unknown cause is `unknown_cause`, not a guessed misconception. The validator enforces an empty list for `no_errors_found`; **parent verification is a separate app-owned preview/confirmation obligation**, absent from the external payload and not established by this check. `incomplete` is distinct and never means mistake-free. Character target/wrong-form values are limited to one code point; words to eight; other kinds to 64. A mapped entry must name an explicitly typed repair target — a character record or a `skill_targets` record — never a raw outcome. A mapped character's value must equal the referenced character record and course, with `character_recognition` as the assessed skill. Any other entry must match the target's `kind` and reviewed `assessed_skill`; a `kind=word` target also carries its one concrete word, which must equal the value. A word/language/reading target cannot borrow a character ID. Other semantic classifications still require human review. A known manifest string is not release authorization: mapped intake requires approved manifest/coverage state and an app-owned approved-version allowlist. That allowlist is empty for this proposal. `observed_wrong_form` stays device-local and must be absent from cloud snapshots. Privacy and actual parent verification remain required.

The material quota is intentionally a **minimum**, as required by Functional Design §3. No maximum material count or new workload cap is introduced here. X=6 with four complete materials can be structurally valid; that is not a recommendation to schedule unnecessary work. Planner workload suitability remains a later implementation/review concern. Source checks now enforce syllabus printed page = PDF page −2 and character source/course/grade pages (P2 3–4; P3 5–6). Every course listed by a targeted item must have a corresponding target reference, and each referenced target must have all three draft stages.

### Engine integration invariants to preserve

These are acceptance obligations for a later engine PR, not claims that the authoring tool implements learning progression.

1. Freeze X per subject/task (integer 6–19, default 10; Chinese up to 20 in the first pilot by owner decision 2026-10-18); do not reinterpret a paused queue after a setting/content update. Planned total is actual full-material count, not X.
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

These authoring fixtures test material/count contracts, not simulated learner progress. `halfway_safe_boundary_count` is the static expected question boundary for the synthetic fixture; the validator rejects 8 for X=12 and expects 10. It does not simulate completion of corrections or story delivery. Later engine tests must cover one target right in material A then wrong in B, success with a hint, reload before final aggregation, final-stage same-day rejection, duplicate event delivery and changed-key invalidation. Do not report authoring tests as passing those runtime journeys; use current engine/UI evidence in the README and task/PR.

## 5. Validation and next boundary

Run `python3 scripts/content_review.py --check` for current schema/reference/key and inventory checks. The content workflow also runs the existing boundary/regression suites; the original PDF audit remains separate and requires its source files. Passing these mechanical checks does not establish educational quality or app/browser/backend acceptance.

For current batch/leaf approvals use the canonical JSON and generated release inventory; the preparation PR's old draft status is not an ongoing task requirement. [Content QA](CONTENT_QA.md) and the [Pilot scope](PILOT_V0_1_SCOPE.md) retain the applicable release, private coverage/proceed and real-record protection requirements.

## 6. Starter content review

Run `python3 scripts/content_review.py` and open `reports/content/index.html` for all current Chinese batches, complete material context, every option/key/help field, blanks, pinyin and full versioned source records. This replaces the embedded starter-001 copy; the JSON questions are unchanged. Read the rendered questions under the common and Chinese authoring skills. This author review page does not establish app/device rendering acceptance.

## Historical corrections and review evidence

## 4. Coverage and first-batch QA

**Historical preparation record:** the following paragraphs describe versions 2–6 before the later audit, sample reviews and approvals. For current coverage and decisions, use the status above, the generated inventory and the current review sections below.

No percentage is claimed. The release denominator is the independently verified, approved P2 **in-app scoped leaf inventory for each course**, with partially assessed capabilities explicitly bounded. Review must decide whether each proposed leaf needs finer splitting and reconcile character-specific mappings with skill leaves without double counting. Keep character inventory completion visible separately; adding hundreds of character records must not conceal missing reading or language capabilities. P3 general practice has separate available-content accounting; its imports remain deferred.

**Owner decision (2026-10-16) — coverage counting:** the 75% guideline is measured against **finer skill leaves**, not the current broad rows. Before freezing IDs, the independent source audit must (1) split broad in-app/partial leaves (for example character form/meaning, punctuation/sentence meaning, explicit-information retrieval) into separately reviewable leaves, and (2) add explicit **language-use leaves** — classifiers (量词), collocation (搭配), sentence patterns (句型) and word choice — each mapped to a verified syllabus page rather than folded into character recognition. **Character-group coverage is reported separately alongside** the skill percentage, never merged into it. New leaves need real source page references from the official PDFs; none are invented in this revision.

A covered mapping needs reviewed questions for its required stages, valid keys/help, suitable objective interactions, rights/QA sign-off and usable offline assets. Empty leaves remain in the denominator. A single general passage item does not make an entire reading outcome covered. Version 4 has two complete P2 character groups (22 pools) and two complete P3 groups (23 pools); it is not a 75% release bank. Version 6 maps language-use items (量词, 词语搭配, 词语选择, 关联词, sentence order and transformation, punctuation) to explicit language-use leaves and gives them non-character repair targets (`skill_targets`), so a lexical target never borrows a character ID. These leaves use the page of their parent outcome and still need the independent page audit above. No fixed per-stage authoring quota is introduced.

Author review checked keys against each stimulus, plausible single-answer interpretation, hint-before-retry ordering, explanations, basic readability and source applicability. All four options are available in the generated review pages. The supplied changes-requested review covered the review document, schemas, validator and three initial fixtures, but explicitly excluded the raw data, test file and full source audit. It is not full content agreement or owner sign-off. Version 2 removes author scoping notes from child explanations, simplifies vocabulary, changes the general 晴 cloze to 放晴 while retaining a different 晴天 repair context, and replaces the disputed 座位/坐位 item with 这座桥. No dictionary/educator ruling about the removed wording is claimed; its replacement was later accepted by the owner (below). Version 3 (owner-directed review revision) replaces the three standalone repair pools with one twelve-character P2 look-alike/sound-alike group renamed by topic (`zh-p2-confusable-*`); gives the 晴 related-use item a new 晴朗 context so it no longer duplicates the 放晴 general cloze; removes the 座 cue from a 住 item; replaces 按住 with 抓住 and 一楼小室 with 一楼活动室; and uses look-alike distractors (永/木/禾) for the 水 cloze. Owner decision (2026-10-16): the 这座桥 item is accepted as written, because 座 is the standard classifier for a bridge, and it is removed from `disputed_item_ids`. Version 4 addresses the follow-up review on `a0b2b55`: the 已 related-use hint no longer shows 已经; 请低声一点 becomes 请把声音放低一点; the author-check date is updated; and repair groups are declared and validated (above). It also adds a P2 radicals group, P3 look-alike/sound-alike and radicals groups, six P2 and eight P3 materials, and language-use practice. No artwork/audio assets are used.

**Character lists — owner decision (2026-10-16):** `curriculum.json` reproduces the official P2/P3 Chinese and Higher Chinese character lists in full as data (1,796 records with page references). The owner decided to keep the full lists in the repository, cited to the MOE source PDFs with page references. This decision covers only the character lists. Rights evidence is original authoring, with final owner rights review pending; official sources establish curriculum facts and do not license copied school questions.

Review procedure and educator escalation are defined once in [CONTENT_QA](CONTENT_QA.md). Actual disputed/sample IDs and outcomes remain in the batch review log and review packs; target-device glyph/readability and offline app acceptance remain separate.

### Historical PR11 review overview

**Historical PR11 review disposition — 17 October 2026:** Independent re-review of `a02199b` closed the raw-outcome import, word/ability identity, repair-route compatibility and tracked-bytecode findings. The windmill retagging and empty compatibility list are accepted for this batch. The 25 contract tests and catalogue validator pass. The material counts below have been reconciled with the catalogue. No open blocker from that targeted revision remains for merging this preparation work; this is not owner merge authorization or approved content for shipping. The source-complete curriculum denominator, full item QA, owner disputed-item review/random 20% sample, batch sign-off and rights review remain pending. Ability reporting must not claim a specific word was repaired; unmatched word imports remain pending. Existing private-data and release gates are unchanged.

**Review proposal · 15 October 2026 · Issue #10**

This is one review entry point for curriculum preparation and authoring contracts. It does not authorize an app build, private-data processing feature, content release, merge or deployment. The functional authority remains [Pilot Functional Design](PILOT_FUNCTIONAL_DESIGN.md), with [engine rules](PILOT_LEARNING_ENGINE_SPEC.md) and [QA gates](CONTENT_QA.md). No confirmed product decision is changed here.

### Historical inventory snapshot — starter-001 v10 / starter-002 v3

**Current status — 18 October 2026:** the leaf curriculum list, `zh-starter-001` v10, `zh-starter-002` v3, `zh-starter-003` v2 and review-character list `zh-2024-p1-review.3` are approved in their canonical JSON records. Batch review, sampled/disputed item IDs and rights decisions remain there; pending states below describe earlier revisions. Use the generated [release inventory](content-review/CHINESE_RELEASE_INVENTORY.md) for coverage rather than historical counts. Review/textbook-extra targets do not add P2 outcomes; shared CL/HCL items show availability, not HCL depth. Content approval does not establish app-release or real-record readiness.

| Artifact | Purpose | Current state |
| --- | --- | --- |
| [Curriculum manifest](../content/chinese/curriculum.json) | Four course identities, official references, 132 course-specific outcome records (including language-use leaves), 46 word/language-point/reading-skill repair targets and 1,796 character records | Leaf list approved by the owner as the coverage denominator (2026-10-18); manifest name `draft.2` kept so existing batches and fixtures stay pinned. Approval does not authorize real-record imports; README describes current app/pack capabilities and the data-protection gates remain |
| [Contract schema](../contracts/chinese/1.schema.json) | Curriculum, original catalogue, frozen synthetic task plan, minimal Chinese intake and answer-event shapes | Proposed engineering contract; no app integration |
| [Starter batch](../content/chinese/batches/starter-001.json) | Version 10: 357 original items — 19 materials (95 questions), 12 declared repair groups (45 character pools and 23 skill pools; 204 questions), and 58 further general-practice items; every non-repair question declares a repair route | Batch and manifest denominator approved by the owner 2026-10-18; rights cleared |
| [Second batch](../content/chinese/batches/starter-002.json) | Version 3: 38 original P2 items — 1 material (4 questions), 4 repair groups (5 character pools and 3 skill pools; 24 questions) and 10 further general-practice items | Approved by the owner 2026-10-18 (rights cleared): ChatGPT cross-reviewed v1, Claude re-reviewed the six corrections and edited three hints (v3; re-review waived by the owner), and the owner accepted the six corrections and the seven-item sample ([review pack](content-review/CHINESE_REVIEW_PACK_STARTER_002.md)) |
| [Task fixtures](../content/chinese/fixtures/) | Complete P2 examples for X=6, 10, 12 and 19 | Synthetic, deterministic validation examples; no learner data |
| [Validator](../scripts/validate_chinese_content.py) and [boundary checks](../scripts/test_chinese_content_contracts.py) | Structural integrity and cross-file rejection cases | Standard-library authoring tools; not learning-engine implementation |

The starter contains ten P2 materials (five readings, three visual texts and two cloze passages) and nine P3 materials (six readings, one visual text and two cloze passages). Each grade's materials are shared by Chinese and Higher Chinese subject to course-specific QA. This is an authored inventory, not an approved daily-task supply or release bank. Shared course labels mean candidate applicability, not identical course coverage or an HCL-specific depth claim.

The dated revisions below retain source interpretations, defect fixes and exact review/owner dispositions. Their old versions, counts and pending states are historical. Current authority is the canonical JSON and generated release inventory; the [research audit](#research-audit), review packs and authoring case log remain intact.

## Correction revision — 16 October 2026

Version 5 corrects seven items: sentence order, the fishing stimulus, explicit honesty vocabulary and four reading questions. The reading replacements assess information stated in the passages rather than inferring a moral or character trait under an explicit-retrieval mapping. Revised item versions are incremented; all four synthetic plans now pin batch version 5. The MOE character inventory and course mappings are unchanged. Revised IDs remain in `review_log.disputed_item_ids` for independent re-review; the older outstanding dispute is retained. Source-year evidence, the finer skill denominator, language-use repair mappings and owner sign-off remain open.

These are proposed corrections, not independent approval. Existing task/history must retain earlier pinned versions; this authoring revision does not implement evidence migration or retroactive regrading.


## Audit-response revision — 16 October 2026 (batch version 6)

Responds to [CHINESE_RESEARCH_AUDIT.md](#research-audit) ZH1–ZH4. Author revision only: every revised or new item remains pending independent re-review and owner sign-off. Mapping-only changes keep item versions (so the four synthetic plans still pin their items); content changes increment them. The plans now pin batch version 6.

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

**Owner decisions 2026-10-18:** all 24 disputed items and all 67 sampled items accepted, batch approved and rights cleared by the owner. The owner also confirmed the three v10 refinements and waived their ChatGPT re-review, so the batch status is `approved`. The completed visual grade audit and denominator decisions are recorded below; app release gates remain separate.

**Owner approval of the leaf list (2026-10-18):** the owner approved the current leaf list (P2: 16 leaves per course; P3 lists as they stand) as the coverage denominator. `status` and `coverage_status` are now `approved`. HCL shares the CL leaves and questions; approval makes no HCL-depth claim.

**Owner decisions on the grade-chart audit (2026-10-18):** `w-ideas` (选择与积累表达素材, which maps to the syllabus row 选取写作材料, first shaded at P5 on PDF p30) is removed from all four courses. It had no questions. P2 now has 16 approved leaves, with 13 covered by approved content (81%). The owner kept the other three findings as they are: `zh.p3_chinese.r-word-context` (推断词句意思), `zh.p3_higher_chinese.r-infer-cause` (推断原因) and P3 `r-radical` (偏旁部首) stay in P3.

See [review pack v10](content-review/CHINESE_REVIEW_PACK_V10.md) for the ten item corrections, the 24 owner dispositions, the reproducible 67-of-333 owner sample and complete material context. ChatGPT desk-reviewed the 357-item v8 input; Claude re-reviewed its corrections and made three v10 refinements, which the owner accepted with a re-review waiver. Source fingerprints match the register. The visual grade audit, denominator approval, rights clearance and owner sign-off are complete. The earlier v8 pack and prior dispositions above retain their historical version scope.

The inventory now uses leaf-specific repair stages and per-route thin-stock counts. Its material supply is an upper bound on complete tasks without reuse, not a scheduling prediction. No app files, import allowlists or learner-data gates change.

## Second batch — zh-starter-002 v3 (18 October 2026)

New P2 content is published as a separate batch, so the owner's approval of `zh-starter-001` v10 is unchanged and covers only its own items. Each batch carries its own review state. The validator checks every file in `content/chinese/batches/` on its own and rejects an item, material or group ID used in two batches. The release inventory combines the batches for counting and names the open gates of each batch.

ChatGPT cross-reviewed all 38 v1 items and `zh-m20` at `619c7c3`. V2 revises six items: four complete-reason questions now balance option lengths using incomplete or unsupported reasons; the 记 explanation distinguishes recording from remembering; the 欺负 explanation uses deliberate hurtful actions as examples. All keys and mappings are retained. Claude re-reviewed the six corrections and accepted them; in v3 three hints now ask which two things the text states, because every option has two parts (common check 7). Owner acceptance of the original seven-item sample is retained against v1; its two revised questions received fresh owner decisions on their current versions. The accepted v2 draw is 7 of 32 unchanged agreed items, excluding all six corrected IDs. Rights remain cleared. On 2026-10-18 the owner accepted the six corrections and the seven-item sample, waived re-review of Claude's three v3 hint edits, and approved the batch. See the review pack for both draws and exact versions.

The batch adds four topic sets, each with a complete exact/similar/generic pool: look-alike and sound-alike characters (远 完 捉 带 记), character sounds and written pinyin, word choice (它 for animals and things, 把/给, 呢, 乖 and 欺负), and finding the whole reason in a short text. P2 school exercise formats were reviewed privately to choose question types; no worksheet, textbook or past-paper wording, answer or learner information is used. As with every public group, the targets are generic curriculum content and not a record of any learner's errors. Items, disputes, the owner sample and the author checks are in the [review pack](content-review/CHINESE_REVIEW_PACK_STARTER_002.md).

## P1 review characters, textbook extras and zh-starter-003 v1 (18 October 2026)

Current records: review-character list `zh-2024-p1-review.3` is approved; `zh-starter-003` v2 is approved after cross-review, owner review of 21 revised items and the 20-item seeded sample, and rights clearance. See the JSON review log for the exact decision and versions. The v1 description and pending checks below are historical preparation evidence; they do not override current approval.

**Owner decisions (2026-10-18):** P2 learners may practise P1 characters they still get wrong, and a short owner-approved list of characters that P2 textbook lessons use but that appear on no P1 or P2 official list. Both are practice targets only. They are never P2 outcomes and never count toward P2 coverage.

- **List file.** [`content/chinese/review-characters.json`](../content/chinese/review-characters.json), version `zh-2024-p1-review.3`, status `approved`. It is separate from the approved manifest, so the approved P2/P3 records, leaf list and batches are unchanged. It holds 547 P1 review records (269 Chinese, 278 Higher Chinese): the official P1 recognition and writing lists, PDF pages 1–2 of the same checksum-pinned character-list files, for each P2 course, minus characters already in that course's P2 records. It also holds 14 textbook extras for each P2 course (兽 喷 塘 密 察 橡 烛 瓶 胶 蜡 警 酒 魔, plus 喂 added by owner decision 2026-10-18), each with an example word and whether it appears on a P3 list (喷 and 瓶 do).
- **Source check.** The P1 records were built from a text extract of the pinned PDFs; that extract reproduces all 1,796 existing P2/P3 records exactly. `scripts/audit_p1_review_characters.py --cl CL.pdf --hcl HCL.pdf` reads PDF pages 1–2 with `pdftotext -bbox` using the same column bounds, first reproducing each course's P2 records from pages 3–4 as a control. Run 2026-10-18 on the owner-supplied, checksum-matching PDFs (both 6 pages, 539 × 737 pt): all 547 records match (CL 364 P1 characters, 95 already on the P2 list, 269 records; HCL 364, 86, 278) in ID, source grade, recognition/writing pages and source, as do the counts; swapping the two files is rejected on checksum. Visual spot-check of CL 一上 lesson 10 and HCL 一下 lesson 11, including recognise-only characters (雷 旧; 甲 丁 周 末), matched. The PDFs are not committed; the audit needs them supplied locally.
- **Contract.** `review_characters` in the schema; a batch that uses one of these targets must declare `review_characters_version` matching the file. A mapped import to a review or extra target needs the list approved. Batches may now hold repair groups without a reading material (`materials` minItems 0). Contract tests cover wrong pages, courses, IDs, sources, counts, duplicates of grade characters, extras on an official list, and version pinning.
- **Inventory.** Review and extra pools are reported in their own row and excluded from leaf routes and character-group coverage (regression test added).
- **Batch `zh-starter-003` v1** adds 117 repair questions in three groups, each target with a complete exact/similar/generic pool: P1 review look-alike/sound-alike characters (16 targets), P2 look-alike/sound-alike set 3 (10 targets) and P2 textbook words beyond the official lists (13 targets). Status: author-checked, pending independent cross-review, the owner's 24-item sample, rights and sign-off. See the [review pack](content-review/CHINESE_REVIEW_PACK_STARTER_003.md).

P2 school exercise formats and textbook vocabulary were reviewed privately to choose question types and the extras list. No worksheet, textbook or past-paper wording, answer or learner information is used. As with every public group, the targets are generic curriculum content and not a record of any learner's errors.

<a id="research-audit"></a>

## Research audit — 2026-10-16

Historical source evidence and findings, retained in full below. The preparation/review dispositions above record later corrections; this audit's old verdict and counts are not current approval status. The identifier `CHINESE_RESEARCH_AUDIT` is retained for existing source references.

### Chinese — independent public-source research and content audit

Audit date: **2026-10-16**. PR **#11**, reviewed head `0b7cd24c4bdb02068b8b4c3814008c25be923a58`; base `main` at `dc3ed51c5da07e3b2cec69eeacaac69e23daa1c8`. Research/evidence revision only; no content approval, implementation, merge or deployment authorization.

**Verdict: changes required before content approval.** The official character records reproduce correctly, and the P2/P3 volume is present. The bank does not yet establish complete CL/HCL skill coverage: its 75 standalone language-use questions have an unsuitable broad writing-ideas mapping, and repair coverage concentrates on 45 character targets. Keep all review/sign-off gates pending.

Snapshot: 300 unique questions (150 P2 + 150 P3), shared across CL/HCL; 18 complete materials / 90 questions; 135 repair questions for 45 character targets; 75 other language-use questions. Shared course tagging does not create 600 independently authored questions or prove HCL depth.

#### Method and evidence limits

[Shared audit method and limits](CONTENT_QA.md#audit-method-1).

[Shared audit method and limits](CONTENT_QA.md#audit-method-2).

#### Content findings

##### ZH1 — Correct assessed-skill mapping and course depth (blocking for coverage claims)

The 75 standalone language-use questions (for example `zh-p2-measure.q1`–`.q15`) predominantly map to `w-ideas`. Choosing a classifier/collocation is not evidence that a child can generate/select writing ideas. Create explicit language-use/word-meaning/sentence-organisation leaves and map the actual response demand. Do not count recognising a well-written sentence as demonstrated writing production.

The 104 broad outcome records remain a working inventory. All CL/HCL course tags need independent grade-and-capability evidence. Common questions can serve both courses where appropriate, but duplicate tags and character-list counts cannot certify HCL-specific depth or complete word knowledge. Character-list records are not a finite vocabulary syllabus or complete language curriculum.

##### ZH2 — Use the actual CL/HCL progression matrix (blocking for denominator accuracy)

The upright original matrix was inspected by course and grade, not inferred from flattened PDF text. Key distinctions on PDF p29 / printed27:

| Reading capability | CL start | HCL start | Implication |
| --- | --- | --- | --- |
| Explicit retrieval | P1 | P1 | Appropriate retained foundation in P2/P3 |
| Title/picture prediction | P3 | P3 | Do not count as required P2 evidence |
| Infer word/sentence meaning | P3 | P3 | P3 context-meaning practice has a direct basis |
| Infer developments from causes/processes | P4 | P3 | Different P3 CL/HCL requirements |
| Compare characters/events | P5 | P4 | Do not count this later requirement as P2/P3 core |
| Main idea/theme; implicit meaning | P5 | P4 | Distinguish from explicit retrieval and simple context meaning |

This table concerns these particular matrix rows, not a blanket ban on all inference or discussion before those grades. Earlier foundations may be revisited; an optional challenge must be labelled rather than inflating required coverage. PDF pp30–32 distinguish generating/organising/expression and written interaction; generic `w-ideas` tags erase those distinctions.

`zh-m11.q1` is labelled title prediction, but its material supplies the whole body and has no pre-reading visibility phase. Add presentation evidence or remap the capability; answering after reading the body does not demonstrate prediction.

##### ZH3 — Fill non-character repair routes (blocking before full mistake-import use)

45 character targets have one item per stage. Reading questions and language-use items do not declare complete skill/error repair routes across new materials. The import model allows word, language-point and reading-skill targets, but those capabilities need reviewed catalogue mappings and pools. Prioritise whole materials covering eligible targets; do not assume every imported skill is covered because its source paper exists online.

##### ZH4 — Correct the process described in `zh-m16` (content revision)

The windmill cloze describes cutting the square into triangles and gluing all corners, then claims the product spins in wind. It omits leaving the centre uncut and a mounting/rotation mechanism. Rewrite it as an accurate, age-readable process or choose a simpler original event sequence; review all five dependent blanks and explanations together. This audit records the issue without silently approving or replacing the source batch.

#### Official and public-school sources

[Shared audit method and limits](CONTENT_QA.md#audit-method-3).

- [MOE Chinese syllabus 2024](https://www.moe.gov.sg/api/media/f41062a6-3a90-4ed1-bf93-2f1aaabeec43/CL-Syllabus-Pri-2024.pdf). Actual PDF retrieved and inspected: PDF pp28–32 (printed26–30), especially course/grade reading progression p29. SHA-256: `6c58e38740ca135fbd8b31c655fe9dcccdcd9b83a2ae430671f41ef7db757973`.
- [MOE CL character list](https://www.moe.gov.sg/media/files/primary/syllabus/99b31d48-7f90-420a-a748-f64167c45746.pdf). Actual PDF retrieved and inspected: PDF pp3–4 P2; pp5–6 P3; pp1–2 earlier-grade comparison. SHA-256: `d833e9a4e4e632fb633a04b6471e9e6465a0097c7ea07a43e70913956942c145`.
- [MOE HCL character list](https://www.moe.gov.sg/media/files/primary/syllabus/701b25fd-b254-4821-b384-e011bfe191af.pdf). Actual PDF retrieved and inspected: PDF pp3–4 P2; pp5–6 P3; pp1–2 earlier-grade comparison. SHA-256: `461f131f3508e346de0aa5e9dc26298a9bfb8cacad67b7e3cc147a387d287914`.

| School document | Pages examined / use | SHA-256 |
| --- | --- | --- |
| [ws-p2-2026-1](https://isomer-user-content.by.gov.sg/817/9640d1a3-ffdc-47ae-9b2d-e97f1bf0cbe2/02_2026_P2_MTL_Curriculum_Briefing.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p2/) | 6–8, 12: MTL teaching includes comprehension and writing; assessment rotates listening, oracy, language use and writing. Public resource list points to Chinese magazines. Not a CL/HCL leaf map. | `879741761796103a7052f6112d1a88aa66be48e57b46cb2e1e3fef763e692331` |
| [ws-p3-2026-1](https://isomer-user-content.by.gov.sg/817/92b8e3b0-02aa-456d-8182-5daef0fc0ead/02_2026_P3_MTL_Curriculum_Briefing.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p3/) | 6–9, 11: Integrated language skills; language paper plus composition/listening/oral in the school plan. App’s deliberate external/deferred components must remain explicit. | `a36d7b79285e5c802b30469c028be7773eab79f74306b256b6ed7be0968c26a1` |
| [tn-p2-2026-2](https://isomer-user-content.by.gov.sg/884/36eef8c1-4166-45e2-9c67-c5de273bf42b/SOW_Outline_2026_P2_CL_MT.pdf); [school navigation](https://www.tampinesnorthpri.moe.edu.sg/for-parents/parents-portal/primary-2-2026/) | 1: P2 Chinese textbook unit sequence; thematic titles alone do not establish assessed-language skill coverage. | `fb5f94d025c8cb5231e4b26728bbdf07037144912738f4e28bc32ecb2cfd8b5d` |

[Shared audit method and limits](CONTENT_QA.md#audit-method-4).

Additional public programme context: [Anderson Chinese programmes](https://www.andersonpri.moe.edu.sg/our-education/departments/chinese-language/programmes/) distinguishes the HCL programme from CL. It is programme evidence, not an exhaustive skill list. A Keming page labelled 2025 linked a slide deck with an October 2024 cover; that page label was not accepted as a 2025 content date.

#### Character-list verification and coverage evidence

The existing checksum-pinned extraction was rerun against freshly checked official PDFs: all **1,796 course-character records and count rows match**. Source text columns and selected rendered pages were inspected. This reproduces extraction, not a completed human audit of every table cell or the 104 outcome assignments.

| Grade/course | Recognition list | Writing list | Union | Interpretation |
| --- | --- | --- | --- | --- |
| P2 CL | 382 | 183 | 477 | Unique characters in that grade’s lists |
| P2 HCL | 382 | 233 | 468 | Not the cumulative HCL inventory |
| P3 CL | 285 | 219 | 430 | Unique characters in that grade’s lists |
| P3 HCL | 285 | 269 | 421 | Not the cumulative HCL inventory |

The recognition sets match by grade, but same-grade HCL writing is **not** a superset of CL writing. Independent earlier-grade checking found all 27 P2 CL-only union characters in HCL P1 writing, and all 47 P3 CL-only union characters in HCL P1/P2 writing. The nine-character union gap therefore does not establish an extraction error or a less demanding HCL course. Preserve both official lists and their grade/mode provenance.

Reproduce using `python scripts/audit_chinese_character_sources.py --cl-pdf <downloaded-cl.pdf> --hcl-pdf <downloaded-hcl.pdf>`. Only checksum-matching official PDFs are accepted. To independently check the earlier-grade explanation, extract HCL writing cells from PDF pp1–2 (P1) / pp3–4 (P2) using the inspected column layout, then compare each CL-minus-HCL grade union with those earlier writing sets.

| Capability / catalogue area | Present evidence | Remaining acceptance requirement |
| --- | --- | --- |
| Character discrimination | 45 three-stage targets, 135 questions, explicit CL/HCL refs | Expand reviewed target stock; decide support from actual error evidence, not guessed causes |
| Word meaning, collocation, classifiers | 75 standalone language-use questions | Correct leaf mappings and add stage routes; words are not exhausted by a character list |
| Reading / cloze / applied text | 18 materials, 90 questions | Course/grade skill mapping and new-material repair pools; whole-material feedback rules |
| Sentence organisation / punctuation | Selected-answer samples | Mark recognition versus production; course-specific leaf evidence |
| Handwriting, full writing, oral | External by agreed Pilot scope | Do not award in-app mastery for these abilities |
| Listening | Deferred | Explicit exclusion from app-complete claims |

No defensible “full P2/P3 CL/HCL coverage” percentage is established by this batch.

#### Actual paper research, 2021–2026

[Shared audit method and limits](CONTENT_QA.md#audit-method-5).

| Course | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
| --- | --- | --- | --- | --- | --- | --- |
| p2 chinese | Retrieved | Retrieved¹ | Retrieved¹ | Retrieved¹ | Retrieved | Not retrieved |
| p2 higher chinese | Retrieved | Retrieved¹ | Not retrieved | Not retrieved | Retrieved | Not retrieved |
| p3 chinese | Retrieved | Retrieved¹ | Retrieved¹ | Retrieved¹ | Retrieved | Not retrieved |
| p3 higher chinese | Retrieved | Retrieved¹ | Retrieved¹ | Retrieved¹ | Retrieved | Not retrieved |

[Shared audit method and limits](CONTENT_QA.md#audit-method-6).

P2 HCL 2022 and P3 HCL 2022 were recovered from SGTestPaper after the first index had no listing. Targeted SGExam/SGTestPaper/Learning Space and public search checks did not yield verified P2 HCL 2023–2024 downloads; paid bundle listings are not counted. The mislabelled CL 2021 packet is excluded from CL availability and replaced by the Rosyth CL packet.

##### p2_chinese-2021

- Identity/date: Catalogued CL; internally Red Swastika P2 HCL, 2021.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2021-p2-chinese-mini-test-1-to-4-red-swastika-pdf/); 26 PDF pages.
- Analysis page anchors: 1–5, 7, 13, 19. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: RECLASSIFY AS HCL. Four 高级华文 review covers contradict the CL category. Pinyin, confusables, collocation, cloze and sentence work; not CL 2021 evidence.
- SHA-256: `368af3730e699ea317f627bb88825afb71ff1ccadaff8ee87c80d43f04f7e3d0`.

##### p2_chinese-2022

- Identity/date: Rulang, CL SA2; catalogue 2022, answer sheet names school.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2022-p2-chinese-semestral-assessment-2-rulang-pdf/); 12 PDF pages.
- Analysis page anchors: 1, 3–10. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Pinyin, vocabulary and character writing; first reading has four questions, second six. Do not misattribute this file to ACS Primary.
- SHA-256: `5b5fcb22039ce7edf93c553a15805af74e65c1647c30dc98658497a0e85e13cb`.

##### p2_chinese-2023

- Identity/date: Nanyang as catalogued, CL practice; year not certified internally.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2023-p2-chinese-comprehension-1-nanyang-pdf/); 16 PDF pages.
- Analysis page anchors: 1–10. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Pinyin, character selection/writing, vocabulary, sentence completion, cloze and reading. Selected and open responses both occur; five-question sets are one pattern.
- SHA-256: `20c163a43384d6413fa48acec4cba930ee4a44d14000e8f0d102f1a050eb273d`.

##### p2_chinese-2024

- Identity/date: Raffles Girls’, CL unit reviews; catalogue 2024.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2024-p2-chinese-quiz-1_2_3-raffles-girls-pdf/); 20 PDF pages.
- Analysis page anchors: 1–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Character writing from pinyin, vocabulary and language-use reviews. Unit packets do not constitute complete curriculum evidence.
- SHA-256: `ac25b4c38206325d321f1741882dcad659b35a227f424291f9bb8505222677d0`.

##### p2_chinese-2025

- Identity/date: St Hilda’s, CL practice; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2025-p2-chinese-practice-1-st-hilda-pdf/); 12 PDF pages.
- Analysis page anchors: 1–5, 7–10. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Pinyin/pictures, collocation, vocabulary and character writing. Some abilities are intentionally outside the app’s recognition-only scoring.
- SHA-256: `9ece590d950d01079aa0a2a3f7fca2cc9dbe3804db1e31aa4e9e9a058b4a4ec8`.

##### p3_chinese-2021

- Identity/date: Henry Park, CL Term Review 2; cover 2021.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2021-p3-chinese-weighted-assessment-2-henry-park-pdf/); 12 PDF pages.
- Analysis page anchors: 1–7. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Character recognition, vocabulary, collocation and reading. Term scope explicitly limited to selected textbook lessons.
- SHA-256: `01c16cae4481901d8bc9d4c25af4a2e038c7c7f89dd033994898b669c380e220`.

##### p3_chinese-2022

- Identity/date: ACS Primary, CL EOY weighted assessment; catalogue 2022.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2022-p3-chinese-semestral-assessment-2-acs-primary-pdf/); 10 PDF pages.
- Analysis page anchors: 1, 4–7. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Vocabulary, modelling/expanding sentences and three-question open comprehension. School title and components are visible; not a whole-year national question template.
- SHA-256: `7a2bb4edd695f4035b3360cf5e6416236d7f57d19b5a0552b3f0f395a6876846`.

##### p3_chinese-2023

- Identity/date: ACS Primary, CL EOY; cover 2023.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2023-p3-chinese-end-of-year-exam-acsp-pdf/); 16 PDF pages.
- Analysis page anchors: 1, 4–8, 10–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Vocabulary, picture words, collocation, word insertion, sentence combining and reading. Both comprehension and language-use repair pools are needed.
- SHA-256: `67a7fa09d70560c2993c526e115839d3f0ed12e04bca009d7e56f0aebf62c99c`.

##### p3_chinese-2024

- Identity/date: Henry Park as catalogued, CL EOY; cover 2024.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2024-p3-chinese-end-of-year-exam-henry-park-pdf/); 15 PDF pages.
- Analysis page anchors: 1, 3–6, 10–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Recognition, picture words, collocation, vocabulary and two comprehension materials, three numbered questions each.
- SHA-256: `da2c4963634e54c578dd6206346785459d64dfeeaf09d7e7b0480343fe9a08f8`.

##### p3_chinese-2025

- Identity/date: ACS Junior, CL EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2025-p3-chinese-end-of-year-exam-acs-junior-pdf/); 14 PDF pages.
- Analysis page anchors: 1, 7–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Expansion/combining sentences with connectors; comprehension one has three MCQs, comprehension two three open questions requiring evidence.
- SHA-256: `ea300bcf5a68a5332666391baebc255f0d108bf598ed149bc43bfead0efc56a3`.

##### p2_higher_chinese-2021

- Identity/date: Red Swastika, HCL topical review; cover 2021.
- Source: [public paper listing](https://sgexam.com/level/primary-2/2021-p2-higher-chinese-topical-revision-1-red-swastika-pdf/); 5 PDF pages.
- Analysis page anchors: 1–5. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Same opening review as the misclassified CL packet, not an independent school sample. Collocation and reading, including a three-question set.
- SHA-256: `469e549ba4a931fca4546a29da4f2bb364b23157f3e3a1c077bab37c5c522e64`.

##### p2_higher_chinese-2025

- Identity/date: Nanyang, HCL checkpoints; cover 2025.
- Source: [public paper listing](https://sgexam.com/level/primary-2/2025-p2-higher-chinese-quiz-1-and-2-nanyang-pdf/); 18 PDF pages.
- Analysis page anchors: 1–6, 8–13. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Character recognition, vocabulary/cloze, sentence completion, writing characters and reading; richer language work than a single confusable-character pool.
- SHA-256: `02e7b9f508d6983134203de7af3f3d2e97f40da8f3345c802e82996c2eec549d`.

##### p3_higher_chinese-2021

- Identity/date: Nan Hua, HCL EOY revision; cover 2021.
- Source: [public paper listing](https://sgexam.com/level/primary-3/2021-p3-higher-chinese-end-of-year-exam-nan-hua-pdf/); 15 PDF pages.
- Analysis page anchors: 1, 3, 5–7, 9–11. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Vocabulary/cloze/collocation, expansion and two readings, three and four numbered questions. Revision packet, not authenticated exam administration.
- SHA-256: `afc7ac9ce41bcc058c65abeeef28130d994d8665c13a8908ff99579c88415943`.

##### p3_higher_chinese-2023

- Identity/date: Catholic High, HCL; catalogue 2023.
- Source: [public paper listing](https://sgexam.com/level/primary-3/2023-p3-higher-chinese-end-of-year-exam-catholic-high-pdf/); 12 PDF pages.
- Analysis page anchors: 1, 4, 6, 8, 10. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Vocabulary, collocation, sentence sequencing and two three-question comprehension sets. App’s HCL mapping needs course-specific evidence, not duplicate counts.
- SHA-256: `2e1461b664fe85123f851bf0e2e2fbf5ea6bbdb68690392e8ae1c1fee13de4e7`.

##### p3_higher_chinese-2024

- Identity/date: Catholic High, HCL EOY; cover 2024.
- Source: [public paper listing](https://sgexam.com/level/primary-3/2024-p3-higher-chinese-end-of-year-exam-catholic-high-pdf/); 18 PDF pages.
- Analysis page anchors: 1–3, 8–14. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Listening, vocabulary, reading, picture words, collocation, word insertion and paragraph ordering. Listening remains deferred in Pilot.
- SHA-256: `d2ea06195be3eb7bf3e8e182ca1bad34cb512300135742878a795d18b811e306`.

##### p3_higher_chinese-2025

- Identity/date: Ai Tong, HCL EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/level/primary-3/2025-p3-higher-chinese-end-of-year-exam-ai-tong-pdf/); 16 PDF pages.
- Analysis page anchors: 1, 3, 5, 7–14. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Paragraph writing, vocabulary, reading, picture words/collocation, sentence expansion/connectors and six-sentence paragraph ordering. Three open reading questions at the end include reasoning.
- SHA-256: `9b6c24e53e60c41e3f41e20037de167e2e5a5560ca9f988c8cbdf76e782b8076`.

##### p2_chinese-2021-extra-rosyth

- Identity/date: Rosyth, CL practices; internal 2021 cover on p9.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2021-p2-chinese-practice-paper-1234-rosyth-pdf/); 18 PDF pages.
- Analysis page anchors: 1–8, 9–15. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Pinyin, character choice, vocabulary, cloze, reading and picture sentences. Reading on pp13–14 has four questions; replaces the misclassified CL source.
- SHA-256: `743379cda116ac9e606d6024748daaf50c27358a8654797c9c8f51b7afc57e38`.

##### p2_higher_chinese-2022-sgtestpaper

- Identity/date: Red Swastika, HCL supplementary work; covers 2022.
- Source: [public paper listing](https://www.sgtestpaper.com/primary/download_2022/y22_P2_HChinese_RedSwastika_PT15_test_paper.html); 22 PDF pages.
- Analysis page anchors: 1–20. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Five lesson packets: pinyin/confusables, vocabulary/collocation, four-blank cloze, ordering words, picture sentences and mixed selected/open reading. HCL coverage cannot be inferred from character totals alone.
- SHA-256: `6921c06be4a4c9f9f13279ba86700ec9dc9b5ea11764899679efd72bdfe905a5`.

##### p3_higher_chinese-2022-sgtestpaper

- Identity/date: Nan Hua, HCL EOY packet; catalogue 2022.
- Source: [public paper listing](https://www.sgtestpaper.com/primary/download_2022/y22_P3_Hchinese_NanHua_EOY_test_paper.html); 20 PDF pages.
- Analysis page anchors: 1–3, 5–18. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Listening precedes paper two; character/vocabulary, four-blank cloze, collocation, sentence rewriting, paragraph ordering, three-question applied reading and four-question comprehension with evidence/prediction.
- SHA-256: `7976f064fb6ef68771ccd68e17e583cebe744b3a1736db9b40fb90c419aa8c42`.

#### Dated enrichment research, 2024–2026

| Public source | Date evidence | What was actually retrieved | Use / limit | SHA-256 |
| --- | --- | --- | --- | --- |
| [chinese-2024](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2024 issue04, printed on PDF | Public one-page answer sheet, P1/P2 CL/HCL | Visible section labels include P2 pinyin/character/punctuation and HCL classifiers/confusables. Full stems/images/passages not retrieved; cannot validate their keys from the answer sheet alone. | `4f15526123d18219a0963afc56f20eee7a43f133b8cfc482899b9986c5252c96` |
| [chinese-2025](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2025 issue18, printed on PDF | Public one-page answer sheet, P1/P2 CL/HCL | P2 vocabulary/sentence completion and HCL pinyin/character/confusable work. Confirms format variety only; no exercises copied. | `e9b75b3f4a310f0da60bd4cd55980d455c6b948614a258f96ed53afcfa652d82` |
| [chinese-2026](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2026 issue09, printed on PDF | Public one-page answer sheet, P1/P2 CL/HCL | P2 character discrimination/reading and HCL pinyin/vocabulary; includes model writing answers. Not evidence of the unseen question set’s correctness. | `d98a63142ae57b0d1c2e8ee3790584ec75640807d2b9edfc98042f1afcd022be` |
| [chinese-p3-enrichment-2024](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2024 issue04, printed on PDF | Public one-page answer sheet, P3/P4 CL/HCL | P3 CL character/vocabulary/reading labels and HCL picture words/character completion/paragraph ordering. Some native text encoding is damaged; section/issue labels are readable, unseen exercises are not audited. | `55abdff1d2b08ce9b3a2e877bd11d9b2963721f24ece53c1a70207a9d1883b58` |
| [chinese-p3-enrichment-2025](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2025 issue18, printed on PDF | Public one-page answer sheet, P3/P4 CL/HCL | P3 HCL word ordering and sentence completion; CL character/vocabulary/collocation/paragraph sequencing. Use format evidence only. | `94d6afb2b528c386caf849e7e9f7d8ad08017c4c954b012a31ae2edd51738aec` |
| [chinese-p3-enrichment-2026](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2026 issue09, printed on PDF | Public one-page answer sheet, P3/P4 CL/HCL | P3 HCL cloze and rewriting direct speech; CL picture words/collocation/paragraph ordering. Full questions remain unavailable in this retrieval. | `e9f3ec9286ef3549ba1c4f9d101865d3b248fff6404400a432917e0410b1def2` |

Citation revision (2026-10-16): these answer sheets are cited through the publisher’s public sample page, not direct file links; the issue number, year and SHA-256 identify each file examined. These six dated answer PDFs are real retrieved enrichment material, **not six reviewed full magazines**. Their unseen distractors/passages/images are not audited, and model answers are not imported into the app. An additional public 2026 sample was retrieved separately, as recorded below.

##### Additional 2026 publisher samples with actual questions

The [public eZhishi sample page](https://www.ezhishi.com/AssessmentMagazineSample.html) embeds [New Friends P1/P2](https://www.ezhishi.com/resources/magazine/samples/magazine/xpy/index.html) and [New World P3/P4](https://www.ezhishi.com/resources/magazine/samples/magazine/xtd/index.html). Their covers were visually checked as 2026; individual exercise footers mix issues 01/02. Treat them as **2026 combined samples**, not two complete issue01 magazines. Publicly declared sample page images 1–15 were retrieved (pages2–15 OCR processed); the viewer declares16 pages, and page16 was not inspected.

Actual P2 CL page9 has pinyin completion, character discrimination and vocabulary selection; P2 HCL page10 has syllable selection, character writing and picture-based sentences. Actual P3 CL page7 has character/vocabulary selection; P3 HCL page6 includes pinyin, sentence completion and paragraph ordering, while page8 adds picture-word selection, collocation and sentence combining. These exercise pages and both covers were visually inspected. They provide concrete examples of course/response-demand differences supporting ZH1; do not copy them or count their production exercises as app-assessed skills. This is a format/skill sample, not a validation of all publisher answers.

| Public sample image | SHA-256 |
| --- | --- |
| xpy page1 (via the [New Friends sample viewer](https://www.ezhishi.com/resources/magazine/samples/magazine/xpy/index.html)) | `2877dec070923f2cad1b0889cda5ca4fdc584e1c0029aa3e7261b4d302125236` |
| xpy page9 (via the [New Friends sample viewer](https://www.ezhishi.com/resources/magazine/samples/magazine/xpy/index.html)) | `eeceb34b13b2a2b84f4f7f3cbe19b9b5155cb1a56b3668b19e48ab289090af84` |
| xpy page10 (via the [New Friends sample viewer](https://www.ezhishi.com/resources/magazine/samples/magazine/xpy/index.html)) | `88c54dd90f91b3b6063a3c568e23716d6eb1b1f90a8efae23eabf9a862885eb9` |
| xtd page1 (via the [New World sample viewer](https://www.ezhishi.com/resources/magazine/samples/magazine/xtd/index.html)) | `368f826048b134c1fb8bf8cf01fd4c51c7854dd9f8f0c21fb9fc7ddd6c536052` |
| xtd page6 (via the [New World sample viewer](https://www.ezhishi.com/resources/magazine/samples/magazine/xtd/index.html)) | `18b0e7e1d3af321deef99ad0e9a2e2f52ae94009ad2f1ed4c09f9dde85c5f6d8` |
| xtd page7 (via the [New World sample viewer](https://www.ezhishi.com/resources/magazine/samples/magazine/xtd/index.html)) | `5d842aa123a69def10fa17de611c5aa8f57ca97732c1c3eaf92ed8e3e6ca93f8` |
| xtd page8 (via the [New World sample viewer](https://www.ezhishi.com/resources/magazine/samples/magazine/xtd/index.html)) | `ae51a83c09d872e397be4a82b03111fc1dd3fa4987a456307a7216c6f96d9696` |

#### Originality, rights and reproducibility

The app content is labelled original author draft. A bounded exact-overlap check compared every app material body and question stem against the retrieved same-subject paper OCR/text: 19 text files, 24 consecutive Han characters. **No threshold-length exact match was found.** This can miss paraphrases, OCR errors, shorter copying, images and sources outside the sample. It is not proof of originality, permission or copyright clearance. Common grammar/number templates are not by themselves evidence of copying. Retain pending rights/independent review/owner sign-off until the project’s review gates are satisfied.

[Shared audit method and limits](CONTENT_QA.md#audit-method-8).

#### Disposition and next revision

[Shared audit method and limits](CONTENT_QA.md#audit-method-9).

[Shared audit method and limits](CONTENT_QA.md#audit-method-10).