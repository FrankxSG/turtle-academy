# Chinese content guide

Read with the [common](../skills/question-authoring/SKILL.md) and [Chinese](../skills/chinese-question-authoring/SKILL.md) authoring skills. Sources, checksums and limitations are in `content/chinese/curriculum.json`.

## Files and status

| File | Holds | Status |
| --- | --- | --- |
| `curriculum.json` (`zh-2024-p2p3-draft.2`) | Four courses, 132 outcome records (incl. language-use leaves), 46 skill targets, 1,796 character records | Approved as the coverage denominator (18 Oct 2026); name kept so batches stay pinned |
| `batches/starter-001.json` v10 | 357 questions: 19 materials (95 questions), 12 repair groups, 58 general practice | Approved, rights cleared |
| `batches/starter-002.json` v3 | 38 P2 questions: 1 material, 4 repair groups | Approved, rights cleared |
| `batches/starter-003.json` v2 | 117 repair questions: P1 review characters, P2 look-alike set 3, P2 textbook words | Approved |
| `review-characters.json` (`zh-2024-p1-review.3`) | 547 P1 review records and 14 textbook extras per P2 course | Practice targets only; never P2 outcomes or coverage |
| `source-audit.json` | CL vs HCL character-set differences | — |
| `fixtures/task-x6/x10/x12/x19.json` | Synthetic task plans | — |
| `contracts/chinese/1.schema.json` | Curriculum, batch, task plan, import and attempt shapes | — |

Approved coverage (18 Oct 2026): P2 Chinese and Higher Chinese each 13 of 16 leaves (81%). Run `python3 scripts/chinese_release_inventory.py` for current numbers, missing leaves and thin routes.

## Official sources

- 2024 Primary Chinese syllabus (rolled out to P2 in 2025, P3 in 2026): six language domains, graded course matrix (PDF pp23–34; implementation p36). Printed page = PDF page − 2.
- CL and HCL character lists P1–P3: P1 PDF pp1–2, P2 pp3–4, P3 pp5–6. Separate recognition and writing lists.
- The lists are finite **character** inventories, not a list of all words, grammar or test questions. Coverage is measured against approved assessable outcomes, not question counts.

| Course | Recognition | Writing | Union |
| --- | ---: | ---: | ---: |
| P2 Chinese | 382 | 183 | 477 |
| P2 Higher Chinese | 382 | 233 | 468 |
| P3 Chinese | 285 | 219 | 430 |
| P3 Higher Chinese | 285 | 269 | 421 |

- Counts are distinct characters in that grade's pages, not cumulative totals. A writing-list character may have appeared earlier in recognition.
- HCL writing lists are **not** supersets of CL lists (P2: 27 CL-only / 77 HCL-only writing; P3: 47 / 97). All CL-only characters appear in earlier HCL writing lists, so this is not an extraction error. Keep both lists with their grade and mode.
- Selecting a writing-list character assesses recognition/meaning, never handwriting.
- Reproduce the extraction: download both PDFs outside the checkout, then `python3 scripts/audit_chinese_character_sources.py --cl-pdf <cl.pdf> --hcl-pdf <hcl.pdf> --report /tmp/report.json` (needs `PyMuPDF==1.26.6`; checksum-matching PDFs only). The P1 pages (review characters) are not yet in that script.

## Domains and grade boundaries

| Domain | In the app | Boundary |
| --- | --- | --- |
| Listening | None | Deferred; no stem narration |
| Speaking, oral interaction | None | External; choosing a polite sentence is not speaking |
| Reading | Character/word recognition, explicit information, support cues, grade-appropriate rows below | No oral fluency claim; one error is not a misconception |
| Writing | Sentence organisation, punctuation choice, limited idea selection | Partial only; handwriting and composition external |
| Written interaction | Choosing purpose/format or response | Partial; composing a message is external |

Read the matrix (PDF p29) row by row:

| Reading capability | CL starts | HCL starts | Use |
| --- | --- | --- | --- |
| Explicit retrieval | P1 | P1 | Core in P2/P3 |
| Title/picture prediction | P3 | P3 | Not P2; needs a pre-reading phase (body hidden) to count |
| Infer word/sentence meaning | P3 | P3 | P3 context meaning |
| Infer developments from causes/processes | P4 | P3 | P3 HCL only |
| Compare characters/events | P5 | P4 | Not P2/P3 core |
| Main idea/theme; implicit meaning | P5 | P4 | Not P2/P3 core |

- A reason **stated** in the text is explicit retrieval. Calculating a duration, fine or total, or comparing prices, is applying information (later grade).
- Text-type classification, central theme, author intent, critique, full description and independent revision are outside P2/P3.
- Culture and dispositions are context, not scored targets. Classifiers, collocation, word choice and sentence patterns are authoring facets under the relevant outcome; a word target outside the character list needs a real outcome mapping, never a made-up character ID.

## School formats → app question types

Public school documents and past papers inform question **types** only; no wording is reused.

| School format | App item |
| --- | --- |
| 辨字测验 | Look-alike/sound-alike character groups |
| 词语选择, 词语搭配 | Word-choice and collocation items |
| 句子变变变, 组句成段 | Sentence order and 把/被/question transformation (selection only) |
| Cloze, 阅读理解 | Materials (passages, notices, cards) |
| 选字组词, 看图写话 (P2) | Character choice; picture writing stays external |
| Composition, listening, oral | External or deferred |

Past-paper findings (2021–2026, format only; per-paper notes in the resources repo):
- P2 CL papers mix pinyin, character choice and writing, vocabulary, sentence completion, cloze and reading; reading sets of four to six questions; both selected and open responses. Five-question sets are one pattern, not the rule.
- P3 CL adds picture words, collocation, word insertion, sentence expansion/combining with connectors and two comprehension materials (often three questions each, open questions requiring evidence). Both comprehension and language-use repair pools are needed.
- HCL papers carry richer language work: pinyin/confusables, classifiers, four-blank cloze, word ordering, paragraph ordering (up to six sentences), sentence rewriting, picture sentences and reading with prediction/evidence. HCL coverage cannot be inferred from character totals or shared items.
- 2024–2026 enrichment samples (eZhishi) confirm course differences: P2 CL pinyin completion, character discrimination, vocabulary; P2 HCL syllable choice, character writing, picture sentences; P3 HCL pinyin, sentence completion, paragraph ordering, picture words, collocation, sentence combining. Format evidence only.
- Some public packets are misfiled (a "CL 2021" packet is HCL; a "2022 ACS" file is Rulang). Check covers before citing.
- Reading strategies schools teach: circle question words, find the answer in the text; dictionary skills 部首/笔画/音序.

## Content contract essentials

- Objects reject unknown keys. IDs are stable ASCII, course-qualified; versions are positive integers and tasks pin them. Target text is separate from IDs; visually similar characters are never merged.
- Current items are 4+ option single choice. Matching, ordering and low-option formats are product requirements but need their own contract before authoring.
- Materials own ordered, complete question lists. Every item has course/outcome refs, key, hint, explanation, rationale, rights status and asset refs.
- **Repair groups:** each declares its targets and members; every target needs a complete exact/similar/generic pool; every repair item belongs to exactly one group; every non-repair question declares a complete route for each of its courses.
- **Skill targets:** collocation and word choice are `language_point`; word/character in context are `reading_skill`. They are abilities: repair uses other words, and progress is reported for the ability, never "紧张 repaired". `kind=word` is reserved for a concrete word with its own pool. Language-use items never borrow a character ID.
- A route target must sit under one of the question's outcomes, or the pair must be listed in `route_compatibility` (empty).
- Blanks and pinyin are structured: `{{blank-1}}` / `{{pinyin-1}}` placeholders, each declared once, with question `blank_ref` links. The renderer shows blanks as slots and pinyin as annotations.
- Import subset: P2 CL/HCL only (P3 rejected); mapped items name a character record or skill target, matching its kind and assessed skill; character values 1 code point, words ≤8, others ≤64.
- Character groups are reported separately from skill-leaf coverage, never merged.

## Owner decisions

- Coverage is counted on finer skill leaves, including explicit language-use leaves (量词, 搭配, 选词, 关联词, 排列成句, 句式转换); character-group coverage is reported separately (16 Oct).
- The full official character lists are kept in the repo as data with page references (16 Oct).
- `w-ideas` (选取写作材料, P5) removed; `r-word-context` (P3 CL), `r-infer-cause` (P3 HCL) and P3 `r-radical` kept (18 Oct).
- P2 learners may practise P1 characters they still get wrong and 14 textbook extras not on any P1/P2 list (兽 喷 塘 密 察 橡 烛 瓶 胶 蜡 警 酒 魔 喂); practice only, never coverage (18 Oct).
- 这座桥 accepted: 座 is the standard classifier for a bridge.
- New content goes in a new batch; approved batches are never extended.

## Content rules learnt

- Process passages must be physically accurate: the `zh-m16` pinwheel folds along both diagonals, cuts from the corners towards an uncut centre and is pinned loosely so it turns. Revise all dependent blanks, hints and explanations together.
- A prediction item needs the body hidden first; asked after reading, it is explicit retrieval.
- Reading questions assess what the passage states, not an inferred moral or trait, under an explicit-retrieval leaf.
- Balance option lengths: incomplete or unsupported reasons make good distractors for complete-reason questions; when every option has two parts, the hint asks which two things the text states.
- Child-facing explanations carry no author notes; vocabulary stays simple.

## Known gaps

- Empty P2 leaves: 借助图文和拼音理解 (needs reviewed images), 使用阅读辅助工具, 完整句子组织. P3 HCL 根据起因和过程推断发展 has no items; title prediction is unfilled.
- Most repair routes have one item per stage (thin stock).
- About five days (P2) and four days (P3) of materials at X=10 before reuse.
- No HCL-specific depth evidence yet.

## Validation

```sh
python3 scripts/validate_chinese_content.py
python3 -m unittest discover -s scripts -p "test_*.py"
python3 scripts/chinese_release_inventory.py
```
