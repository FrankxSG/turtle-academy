# Chinese curriculum, contracts and first content batch

**Review proposal · 15 October 2026 · Issue #10**

This is one review entry point for curriculum preparation and authoring contracts. It does not authorize an app build, private-data processing feature, content release, merge or deployment. The functional authority remains [Pilot Functional Design](PILOT_FUNCTIONAL_DESIGN.md), with [engine rules](PILOT_LEARNING_ENGINE_SPEC.md) and [QA gates](CONTENT_QA.md). No confirmed product decision is changed here.

## 1. What is ready to inspect

| Artifact | Purpose | Current state |
| --- | --- | --- |
| [Curriculum manifest](../content/chinese/curriculum.json) | Four course identities, official references, 104 course-specific outcome records and 1,796 character records | Source-based working inventory; independent grade/denominator audit pending |
| [Contract schema](../contracts/chinese/1.schema.json) | Curriculum, original catalogue, frozen synthetic task plan, minimal Chinese intake and answer-event shapes | Proposed engineering contract; no app integration |
| [Starter batch](../content/chinese/batches/starter-001.json) | Five original materials, 25 material questions and nine short repair questions | Author checked; independent review and owner sign-off pending |
| [Task fixtures](../content/chinese/fixtures/) | Complete P2 examples for X=6, 10, 12 and 19 | Synthetic, deterministic validation examples; no learner data |
| [Validator](../scripts/validate_chinese_content.py) and [boundary checks](../scripts/test_chinese_content_contracts.py) | Structural integrity and cross-file rejection cases | Standard-library authoring tools; not learning-engine implementation |

The starter contains four P2 materials (two readings, one notice and one cloze), usable by both P2 courses subject to their own QA. One additional P3 reading is a sample for both P3 courses, not a complete P3 daily task or release bank. Shared course labels mean candidate applicability, not identical course coverage or an HCL-specific depth claim.

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

### Private preparation evidence

Private worksheet review informs the comparison of exercise formats with the official map. Public assets use original generic content. No source pages, identifying details, actual errors, private target IDs or worksheet-derived answer history belong in this branch or its review discussion. Recognition exercises adapted from a production skill must retain the capability limitation. A visual survey is not a verified transcription of every handwritten response; uncertain handwriting never establishes a diagnosed error type.

Before building the real importer, complete the private target-to-available-content comparison and record the owner's proceed decision under the existing Issue #3 gates. This draft does not satisfy that gate by publishing private evidence.

Starter selection provenance: 座、晴、住 were selected as generic character/meaning examples from the official P2 recognition list (PDF page 3 for each course), not extracted from a private learner-error list. The author had already viewed private material, so this is not a blind selection and does not certify absence of coincidental overlap. No public target is presented as evidence that a particular learner made that mistake. No private scan or private error list is a public content source.

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

Review/rights/content/coverage states are controlled enums, separate from record shape. The validator rejects an `approved` batch with inconsistent review/rights states or unresolved disputed IDs, and rejects an approved manifest with pending coverage. These are consistency checks, not proof that a human reviewed or approved anything. This batch records the received changes-requested review; version 2 still needs review and owner sign-off. Sampled/disputed IDs must exist in the batch.

Blanks and pinyin are structured: text contains `{{blank-1}}` or `{{pinyin-1}}`; each text owner declares its own `blanks` and `annotations`. A blank explicitly names its question ID; the question's `blank_ref` links back. Pinyin records hold `text` and `pinyin` separately. All placeholder IDs must occur exactly once in that owner's text, with no orphan annotation or question link. The later renderer must display blanks as answer slots, not literal tokens, and pinyin as an annotation beside its linked text. Do not parse full-width parentheses to infer purpose. The readable tables below substitute these declarations for review only, not an implementation of the app renderer.

For pending intake, `knowledge_point_ref` is JSON null; an unknown cause is `unknown_cause`, not a guessed misconception. The validator enforces an empty list for `no_errors_found`; **parent verification is a separate app-owned preview/confirmation obligation**, absent from the external payload and not established by this check. `incomplete` is distinct and never means mistake-free. Character target/wrong-form values are limited to one code point; words to eight; other kinds to 64. A mapped character's value must equal the referenced character record and course; a word/language/reading target cannot borrow a character ID. Other semantic classifications still require human review. A known manifest string is not release authorization: mapped intake requires approved manifest/coverage state and an app-owned approved-version allowlist. That allowlist is empty for this proposal. `observed_wrong_form` stays device-local and must be absent from cloud snapshots. Privacy and actual parent verification remain required.

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

A covered mapping needs reviewed questions for its required stages, valid keys/help, suitable objective interactions, rights/QA sign-off and usable offline assets. Empty leaves remain in the denominator. A single general passage item does not make an entire reading outcome covered. The first batch has only three complete draft character repair pools per P2 course; it is not a 75% release bank. No fixed per-stage authoring quota is introduced.

Author review checked keys against each stimulus, plausible single-answer interpretation, hint-before-retry ordering, explanations, basic readability and source applicability. All four options are visible for inspection below. The supplied changes-requested review covered the review document, schemas, validator and three initial fixtures, but explicitly excluded the raw data, test file and full source audit. It is not full content agreement or owner sign-off. Version 2 removes author scoping notes from child explanations, simplifies vocabulary, changes the general 晴 cloze to 放晴 while retaining a different 晴天 repair context, and replaces the disputed 座位/坐位 item with 这座桥. No dictionary/educator ruling about the removed wording is claimed; its replacement remains flagged for revision review. No artwork/audio assets are used. Rights evidence is original authoring, with final owner rights review pending; official sources establish curriculum facts and do not license copied school questions.

Review sequence: independently review the revised source/content; resolve every disputed/ambiguous item (qualified educator if the owner cannot resolve it); record the random 20% sample of AI-agreed items and its outcomes; owner signs off the batch. There is no recorded AI-agreed pool yet, so sampled IDs are currently empty. Record actual IDs/outcomes in the batch log after that review, not invented approvals. Target-device glyph/readability and offline rendering QA wait for a later authorized UI build.

## 5. Validation and next boundary

Run from repository root:

```sh
python3 scripts/validate_chinese_content.py
python3 -m unittest discover -s scripts -p test_chinese_content_contracts.py -v
python3 scripts/privacy_guard.py
```

Current authoring evidence: schema/reference/key checks and 18 boundary test methods pass; the optional PDF source audit reproduces all character records and counts. Additional rejection cases include nonpositive versions, stale item pins, ID/hash trailing newlines, inconsistent approval states, invalid review IDs, wrong grade/source pages, incomplete target course coverage, wrong mapped character values, broken blank/annotation links and a premature X=12 halfway boundary. Existing X/material/import/assistance checks remain. No app/browser/backend tests are claimed; application files and dependencies are unchanged.

Before building Chinese: approve the independently audited source map/leaf boundaries and contracts; complete content QA and private coverage/proceed gates; resolve the existing data-protection gates for real records. Then authorize a focused synthetic-only implementation slice separately. This preparation PR must remain draft until review is resolved, and must not merge or deploy without the owner's explicit authorization.

## 6. Starter content review

Version 2. These are newly drafted generic examples, not extracted learner targets or copied passages. `[空1]` is a readable substitute for a linked blank token; annotation text and pinyin are combined for this review view only. App rendering remains unimplemented.

### zh-m01 · 种豆子

Courses: p2_chinese, p2_higher_chinese.

> 星期六早上，小安和姐姐在家种豆子。姐姐拿来两个小盆，小安把泥土放进盆里。他们把豆子放进泥土，再浇一点水。最后，他们把小盆放在窗边。小安说：“我明天还要来看！”

| ID / stage | Question and options | Key | Hint | Explanation |
| --- | --- | --- | --- | --- |
| zh-m01.q1 | 他们什么时候种豆子？<br>1 星期六早上；2 星期六晚上；3 星期天早上；4 星期天晚上 | 星期六早上 | 找一找第一句的时间。 | 第一句写明是星期六早上。 |
| zh-m01.q2 | 谁拿来小盆？<br>1 小安；2 姐姐；3 爸爸；4 奶奶 | 姐姐 | 看看“拿来”前面写的是谁。 | 短文说是姐姐拿来两个小盆。 |
| zh-m01.q3 | 姐姐拿来几个小盆？<br>1 一个；2 三个；3 四个；4 两个 | 两个 | 再读姐姐拿小盆的那一句。 | 姐姐拿来两个小盆。 |
| zh-m01.q4 | 放好豆子后，他们接着做什么？<br>1 拿来小盆；2 放泥土；3 浇一点水；4 收起小盆 | 浇一点水 | 找“再”后面的动作。 | 放好豆子后，他们再浇一点水。 |
| zh-m01.q5 | 最后，小盆放在哪里？<br>1 桌下；2 门外；3 床边；4 窗边 | 窗边 | 找“最后”后面写的地方。 | 短文说最后把小盆放在窗边。 |

### zh-m02 · 图书角通知

Courses: p2_chinese, p2_higher_chinese.

> 【图书角通知】
> 星期三下午三点，图书角开放。
> 地点：一楼小室。
> 请带借书卡，每人可借两本书。
> 请在下个星期三还书。

| ID / stage | Question and options | Key | Hint | Explanation |
| --- | --- | --- | --- | --- |
| zh-m02.q1 | 图书角哪一天开放？<br>1 星期一；2 星期二；3 星期三；4 星期四 | 星期三 | 看通知中的开放时间。 | 通知写明星期三开放。 |
| zh-m02.q2 | 图书角几点开放？<br>1 上午三点；2 下午三点；3 下午四点；4 上午四点 | 下午三点 | 注意“上午”和“下午”。 | 通知写明下午三点。 |
| zh-m02.q3 | 图书角在哪里？<br>1 一楼小室；2 二楼小室；3 一楼大室；4 二楼大室 | 一楼小室 | 找“地点”一栏。 | 地点一栏写的是一楼小室。 |
| zh-m02.q4 | 借书时要带什么？<br>1 水杯；2 画纸；3 球；4 借书卡 | 借书卡 | 找“请带”后面的东西。 | 通知要求带借书卡。 |
| zh-m02.q5 | 每人可借几本书？<br>1 一本；2 两本；3 三本；4 四本 | 两本 | 找“每人可借”后面的数目。 | 通知写明每人可借两本书。 |

### zh-m03 · 公园里的早晨

Courses: p2_chinese, p2_higher_chinese.

> 早上，我和妈妈到公园。雨停了，天放[空1]了。小鸟在树上[空2]。妈妈坐在长椅上，我沿 (yán)着小路慢慢地[空3]。走累了，我喝了几口[空4]。回家前，我们把空瓶放进垃圾[空5]。

| ID / stage | Question and options | Key | Hint | Explanation |
| --- | --- | --- | --- | --- |
| zh-m03.q1 | 第1空选哪个字？<br>1 晴；2 睛；3 请；4 情 | 晴 | 这里写的是雨后的天气。 | “放晴”是说天不再下雨，太阳出来了。 |
| zh-m03.q2 | 第2空选哪个词？<br>1 写字；2 洗澡；3 唱歌；4 看书 | 唱歌 | 看看做这个动作的是谁。 | 这段话写小鸟在树上唱歌。 |
| zh-m03.q3 | 第3空选哪个词？<br>1 游泳；2 走路；3 睡觉；4 吃饭 | 走路 | 留意“小路”和后面的“走累了”。 | 小路和“走累了”告诉我们，这里应选“走路”。 |
| zh-m03.q4 | 第4空选哪个字？<br>1 沙；2 风；3 石；4 水 | 水 | 想想“喝了几口”后面可以接什么。 | 水可以喝，另外三个选项不合适。 |
| zh-m03.q5 | 第5空选哪个字？<br>1 桶；2 桥；3 床；4 窗 | 桶 | 想想放垃圾的容器叫什么。 | 空瓶要放进垃圾桶，这里选“桶”。 |

### zh-m04 · 找雨伞

Courses: p2_chinese, p2_higher_chinese.

> 放学时下雨了。小文打开书包，发现没有带伞。老师借给他一把蓝伞。小文向老师道谢，撑着蓝伞回家。第二天早上，小文把伞擦干，放回老师的桌上。

| ID / stage | Question and options | Key | Hint | Explanation |
| --- | --- | --- | --- | --- |
| zh-m04.q1 | 什么时候下雨了？<br>1 上课时；2 吃饭时；3 睡觉时；4 放学时 | 放学时 | 看第一句。 | 第一句写明放学时下雨了。 |
| zh-m04.q2 | 小文在书包里没有找到什么？<br>1 书；2 伞；3 笔；4 水杯 | 伞 | 找“没有带”后面的东西。 | 小文发现没有带伞。 |
| zh-m04.q3 | 谁借伞给小文？<br>1 老师；2 同学；3 妈妈；4 姐姐 | 老师 | 找“借给他”前面的人。 | 短文说老师借给他一把蓝伞。 |
| zh-m04.q4 | 借来的伞是什么颜色？<br>1 红色；2 黄色；3 蓝色；4 绿色 | 蓝色 | 看看老师借出的是什么伞。 | 短文写的是蓝伞。 |
| zh-m04.q5 | 第二天早上，小文把伞放在哪里？<br>1 书包里；2 门边；3 椅子上；4 老师的桌上 | 老师的桌上 | 看最后一句。 | 最后一句写明把伞放回老师的桌上。 |

### zh-m05 · 换一个办法

Courses: p3_chinese, p3_higher_chinese.

> 学校的图书角要增加一个放书的地方。小宁想用纸盒做书架，可是大纸盒太软，放进几本书就倒了。她和伙伴把书拿出来，在盒子里加了两块硬纸板，再把较重的书放在下面。这次，纸盒站稳了。伙伴说：“先试一试，再改一改，真有用！”

| ID / stage | Question and options | Key | Hint | Explanation |
| --- | --- | --- | --- | --- |
| zh-m05.q1 | 他们想增加什么地方？<br>1 放球的地方；2 放书的地方；3 放伞的地方；4 放鞋的地方 | 放书的地方 | 先读第一句。 | 第一句明确写明要增加放书的地方。 |
| zh-m05.q2 | 小宁最初准备用什么做书架？<br>1 木板；2 塑料箱；3 纸盒；4 铁架 | 纸盒 | 找“小宁想用”后面的材料。 | 短文说小宁想用纸盒做书架。 |
| zh-m05.q3 | 纸盒开始为什么倒了？<br>1 纸盒太软；2 书太少；3 地上有水；4 没有伙伴 | 纸盒太软 | 找“可是”后面明说的情况。 | 短文说大纸盒太软，所以放进书后就倒了。 |
| zh-m05.q4 | 他们加了几块硬纸板？<br>1 一块；2 三块；3 四块；4 两块 | 两块 | 找“硬纸板”前面的数目。 | 他们加了两块硬纸板。 |
| zh-m05.q5 | 较重的书后来放在哪里？<br>1 盒子旁边；2 下面；3 上面；4 桌子底下 | 下面 | 找“较重的书”后面的地方。 | 文中写明把较重的书放在下面。 |

### Short character repair pools

Each pool has one targeted item, one related use and one broader application. This small supply demonstrates mappings; it is not evidence of varied production-bank capacity. All questions are 4+ option recognition, not independent spelling or handwriting.

| ID / stage | Question and options | Key | Hint | Explanation |
| --- | --- | --- | --- | --- |
| zh-short-u5ea7.q1 / exact | 一[空1]大山<br>1 座；2 坐；3 作；4 做 | 座 | 想一想，表示山的数量时用哪个字？ | “一座大山”用“座”表示山的数量。 |
| zh-short-u5ea7.q2 / similar | 这[空1]桥很长。<br>1 坐；2 作；3 座；4 做 | 座 | 这里要选表示桥的数量的字。 | 说一座桥、这座桥，都用“座”。 |
| zh-short-u5ea7.q3 / generic | 车上没有空[空1]了，只能站着。<br>1 做；2 座；3 作；4 坐 | 座 | 这里缺的是表示可以坐下的位置的字。 | 可以坐下的位置是“座”。有空座，才有地方坐。 |
| zh-short-u6674.q1 / exact | 天空没有云，今天是[空1]天。<br>1 睛；2 情；3 请；4 晴 | 晴 | 想一想，哪个字用来写天气？ | 没有云、天气好，可以说“晴天”。 |
| zh-short-u6674.q2 / similar | 雨停了，天也放[空1]了。<br>1 晴；2 请；3 情；4 睛 | 晴 | 看看哪个字与天气有关。 | “放晴”表示雨后天空变晴。 |
| zh-short-u6674.q3 / generic | 天气预报 (yù bào)说，明天[空1]，可以到公园走走。<br>1 请；2 睛；3 晴；4 情 | 晴 | 注意“天气预报”。 | 这里说的是明天的天气，应选“晴”。 |
| zh-short-u4f4f.q1 / exact | 我[空1]在这座组 (zǔ)屋。<br>1 往；2 住；3 主；4 注 | 住 | 这里说的是居住的地方。 | “住在”表示居住在某个地方。 |
| zh-short-u4f4f.q2 / similar | 出门时，我记[空1]了妈妈的话。<br>1 主；2 往；3 注；4 住 | 住 | 这里要组成表示牢记的词。 | “记住”表示把事情牢牢记在心里。 |
| zh-short-u4f4f.q3 / generic | 风太大了，请把门按[空1]，别让它关上。<br>1 住；2 注；3 往；4 主 | 住 | 这里表示保持门的位置。 | “按住”表示用力按着，让它保持原来的位置。 |
