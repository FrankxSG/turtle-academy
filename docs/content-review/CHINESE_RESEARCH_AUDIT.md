# Chinese — independent public-source research and content audit

Audit date: **2026-10-16**. PR **#11**, reviewed head `0b7cd24c4bdb02068b8b4c3814008c25be923a58`; base `main` at `dc3ed51c5da07e3b2cec69eeacaac69e23daa1c8`. Research/evidence revision only; no content approval, implementation, merge or deployment authorization.

**Verdict: changes required before content approval.** The official character records reproduce correctly, and the P2/P3 volume is present. The bank does not yet establish complete CL/HCL skill coverage: its 75 standalone language-use questions have an unsuitable broad writing-ideas mapping, and repair coverage concentrates on 45 character targets. Keep all review/sign-off gates pending.

Snapshot: 300 unique questions (150 P2 + 150 P3), shared across CL/HCL; 18 complete materials / 90 questions; 135 repair questions for 45 character targets; 75 other language-use questions. Shared course tagging does not create 600 independently authored questions or prove HCL depth.

## Method and evidence limits

The reviewer independently retrieved public official PDFs, navigated current public school sources, downloaded actual historical paper packets, and examined dated enrichment. This is additional research beyond the previous targeted key corrections and the PR author’s source list. Paper text/OCR was processed across the individual packets; representative question pages, headings and selected rendered pages were examined for skills, response demand and date/course identity. External answer schemes were not assumed correct. The work is a source/scope/coverage audit with targeted item findings, not a second human marking of every external question or signed educator approval of every app key.

The four audits together use **50 retrieved paper/bundle files**: 47 individual/combined packets and three second-host bundles. Files/hosts may overlap in underlying papers. Only eight pages of each large second-host bundle were examined; there is no claim to have manually audited the complete bundles. Public hosting is not a reuse licence or authentication of a school-issued paper. No source scans, passages, question text, images or answer sheets are added to the repository. No private worksheets or learner data were used.

## Content findings

### ZH1 — Correct assessed-skill mapping and course depth (blocking for coverage claims)

The 75 standalone language-use questions (for example `zh-p2-measure.q1`–`.q15`) predominantly map to `w-ideas`. Choosing a classifier/collocation is not evidence that a child can generate/select writing ideas. Create explicit language-use/word-meaning/sentence-organisation leaves and map the actual response demand. Do not count recognising a well-written sentence as demonstrated writing production.

The 104 broad outcome records remain a working inventory. All CL/HCL course tags need independent grade-and-capability evidence. Common questions can serve both courses where appropriate, but duplicate tags and character-list counts cannot certify HCL-specific depth or complete word knowledge. Character-list records are not a finite vocabulary syllabus or complete language curriculum.

### ZH2 — Use the actual CL/HCL progression matrix (blocking for denominator accuracy)

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

### ZH3 — Fill non-character repair routes (blocking before full mistake-import use)

45 character targets have one item per stage. Reading questions and language-use items do not declare complete skill/error repair routes across new materials. The import model allows word, language-point and reading-skill targets, but those capabilities need reviewed catalogue mappings and pools. Prioritise whole materials covering eligible targets; do not assume every imported skill is covered because its source paper exists online.

### ZH4 — Correct the process described in `zh-m16` (content revision)

The windmill cloze describes cutting the square into triangles and gluing all corners, then claims the product spins in wind. It omits leaving the centre uncut and a mounting/rotation mechanism. Rewrite it as an accurate, age-readable process or choose a simpler original event sequence; review all five dependent blanks and explanations together. This audit records the issue without silently approving or replacing the source batch.

## Official and public-school sources

Official sources define scope; school sources corroborate local sequence/assessment, and hosted past papers/enrichment describe practice. Lower-authority sources do not override current MOE requirements. All page numbers below are PDF pages unless explicitly called printed pages. All sources accessed 2026-10-16.

- [MOE Chinese syllabus 2024](https://www.moe.gov.sg/api/media/f41062a6-3a90-4ed1-bf93-2f1aaabeec43/CL-Syllabus-Pri-2024.pdf). Actual PDF retrieved and inspected: PDF pp28–32 (printed26–30), especially course/grade reading progression p29. SHA-256: `6c58e38740ca135fbd8b31c655fe9dcccdcd9b83a2ae430671f41ef7db757973`.
- [MOE CL character list](https://www.moe.gov.sg/media/files/primary/syllabus/99b31d48-7f90-420a-a748-f64167c45746.pdf). Actual PDF retrieved and inspected: PDF pp3–4 P2; pp5–6 P3; pp1–2 earlier-grade comparison. SHA-256: `d833e9a4e4e632fb633a04b6471e9e6465a0097c7ea07a43e70913956942c145`.
- [MOE HCL character list](https://www.moe.gov.sg/media/files/primary/syllabus/701b25fd-b254-4821-b384-e011bfe191af.pdf). Actual PDF retrieved and inspected: PDF pp3–4 P2; pp5–6 P3; pp1–2 earlier-grade comparison. SHA-256: `461f131f3508e346de0aa5e9dc26298a9bfb8cacad67b7e3cc147a387d287914`.

| School document | Pages examined / use | SHA-256 |
| --- | --- | --- |
| [ws-p2-2026-1](https://isomer-user-content.by.gov.sg/817/9640d1a3-ffdc-47ae-9b2d-e97f1bf0cbe2/02_2026_P2_MTL_Curriculum_Briefing.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p2/) | 6–8, 12: MTL teaching includes comprehension and writing; assessment rotates listening, oracy, language use and writing. Public resource list points to Chinese magazines. Not a CL/HCL leaf map. | `879741761796103a7052f6112d1a88aa66be48e57b46cb2e1e3fef763e692331` |
| [ws-p3-2026-1](https://isomer-user-content.by.gov.sg/817/92b8e3b0-02aa-456d-8182-5daef0fc0ead/02_2026_P3_MTL_Curriculum_Briefing.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p3/) | 6–9, 11: Integrated language skills; language paper plus composition/listening/oral in the school plan. App’s deliberate external/deferred components must remain explicit. | `a36d7b79285e5c802b30469c028be7773eab79f74306b256b6ed7be0968c26a1` |
| [tn-p2-2026-2](https://isomer-user-content.by.gov.sg/884/36eef8c1-4166-45e2-9c67-c5de273bf42b/SOW_Outline_2026_P2_CL_MT.pdf); [school navigation](https://www.tampinesnorthpri.moe.edu.sg/for-parents/parents-portal/primary-2-2026/) | 1: P2 Chinese textbook unit sequence; thematic titles alone do not establish assessed-language skill coverage. | `fb5f94d025c8cb5231e4b26728bbdf07037144912738f4e28bc32ecb2cfd8b5d` |

The school PDFs were reached through current school navigation; moved legacy file links were not silently counted as retrieved. They are public curriculum documents, not any learner’s school/worksheet information.

Additional public programme context: [Anderson Chinese programmes](https://www.andersonpri.moe.edu.sg/our-education/departments/chinese-language/programmes/) distinguishes the HCL programme from CL. It is programme evidence, not an exhaustive skill list. A Keming page labelled 2025 linked a slide deck with an October 2024 cover; that page label was not accepted as a 2025 content date.

## Character-list verification and coverage evidence

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

## Actual paper research, 2021–2026

Citation revision (2026-10-16): third-party past papers are linked through public listing pages only. School/year/type, analysis pages and original file hashes still identify the copies examined; this citation format does not establish reuse rights.

| Course | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
| --- | --- | --- | --- | --- | --- | --- |
| p2 chinese | Retrieved | Retrieved¹ | Retrieved¹ | Retrieved¹ | Retrieved | Not retrieved |
| p2 higher chinese | Retrieved | Retrieved¹ | Not retrieved | Not retrieved | Retrieved | Not retrieved |
| p3 chinese | Retrieved | Retrieved¹ | Retrieved¹ | Retrieved¹ | Retrieved | Not retrieved |
| p3 higher chinese | Retrieved | Retrieved¹ | Retrieved¹ | Retrieved¹ | Retrieved | Not retrieved |

“Retrieved” means a public PDF packet was downloaded and its content examined, not that a direct school release was authenticated. ¹ Catalogue year is not internally established for every packet; retain the per-file qualifications below. This was a bounded multi-host survey, not an exhaustive census. No verified 2026 paper was retrieved as of 2026-10-16; a website’s 2026 title/footer was not treated as the year printed on a paper.

P2 HCL 2022 and P3 HCL 2022 were recovered from SGTestPaper after the first index had no listing. Targeted SGExam/SGTestPaper/Learning Space and public search checks did not yield verified P2 HCL 2023–2024 downloads; paid bundle listings are not counted. The mislabelled CL 2021 packet is excluded from CL availability and replaced by the Rosyth CL packet.

### p2_chinese-2021

- Identity/date: Catalogued CL; internally Red Swastika P2 HCL, 2021.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2021-p2-chinese-mini-test-1-to-4-red-swastika-pdf/); 26 PDF pages.
- Analysis page anchors: 1–5, 7, 13, 19. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: RECLASSIFY AS HCL. Four 高级华文 review covers contradict the CL category. Pinyin, confusables, collocation, cloze and sentence work; not CL 2021 evidence.
- SHA-256: `368af3730e699ea317f627bb88825afb71ff1ccadaff8ee87c80d43f04f7e3d0`.

### p2_chinese-2022

- Identity/date: Rulang, CL SA2; catalogue 2022, answer sheet names school.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2022-p2-chinese-semestral-assessment-2-rulang-pdf/); 12 PDF pages.
- Analysis page anchors: 1, 3–10. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Pinyin, vocabulary and character writing; first reading has four questions, second six. Do not misattribute this file to ACS Primary.
- SHA-256: `5b5fcb22039ce7edf93c553a15805af74e65c1647c30dc98658497a0e85e13cb`.

### p2_chinese-2023

- Identity/date: Nanyang as catalogued, CL practice; year not certified internally.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2023-p2-chinese-comprehension-1-nanyang-pdf/); 16 PDF pages.
- Analysis page anchors: 1–10. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Pinyin, character selection/writing, vocabulary, sentence completion, cloze and reading. Selected and open responses both occur; five-question sets are one pattern.
- SHA-256: `20c163a43384d6413fa48acec4cba930ee4a44d14000e8f0d102f1a050eb273d`.

### p2_chinese-2024

- Identity/date: Raffles Girls’, CL unit reviews; catalogue 2024.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2024-p2-chinese-quiz-1_2_3-raffles-girls-pdf/); 20 PDF pages.
- Analysis page anchors: 1–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Character writing from pinyin, vocabulary and language-use reviews. Unit packets do not constitute complete curriculum evidence.
- SHA-256: `ac25b4c38206325d321f1741882dcad659b35a227f424291f9bb8505222677d0`.

### p2_chinese-2025

- Identity/date: St Hilda’s, CL practice; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2025-p2-chinese-practice-1-st-hilda-pdf/); 12 PDF pages.
- Analysis page anchors: 1–5, 7–10. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Pinyin/pictures, collocation, vocabulary and character writing. Some abilities are intentionally outside the app’s recognition-only scoring.
- SHA-256: `9ece590d950d01079aa0a2a3f7fca2cc9dbe3804db1e31aa4e9e9a058b4a4ec8`.

### p3_chinese-2021

- Identity/date: Henry Park, CL Term Review 2; cover 2021.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2021-p3-chinese-weighted-assessment-2-henry-park-pdf/); 12 PDF pages.
- Analysis page anchors: 1–7. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Character recognition, vocabulary, collocation and reading. Term scope explicitly limited to selected textbook lessons.
- SHA-256: `01c16cae4481901d8bc9d4c25af4a2e038c7c7f89dd033994898b669c380e220`.

### p3_chinese-2022

- Identity/date: ACS Primary, CL EOY weighted assessment; catalogue 2022.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2022-p3-chinese-semestral-assessment-2-acs-primary-pdf/); 10 PDF pages.
- Analysis page anchors: 1, 4–7. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Vocabulary, modelling/expanding sentences and three-question open comprehension. School title and components are visible; not a whole-year national question template.
- SHA-256: `7a2bb4edd695f4035b3360cf5e6416236d7f57d19b5a0552b3f0f395a6876846`.

### p3_chinese-2023

- Identity/date: ACS Primary, CL EOY; cover 2023.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2023-p3-chinese-end-of-year-exam-acsp-pdf/); 16 PDF pages.
- Analysis page anchors: 1, 4–8, 10–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Vocabulary, picture words, collocation, word insertion, sentence combining and reading. Both comprehension and language-use repair pools are needed.
- SHA-256: `67a7fa09d70560c2993c526e115839d3f0ed12e04bca009d7e56f0aebf62c99c`.

### p3_chinese-2024

- Identity/date: Henry Park as catalogued, CL EOY; cover 2024.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2024-p3-chinese-end-of-year-exam-henry-park-pdf/); 15 PDF pages.
- Analysis page anchors: 1, 3–6, 10–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Recognition, picture words, collocation, vocabulary and two comprehension materials, three numbered questions each.
- SHA-256: `da2c4963634e54c578dd6206346785459d64dfeeaf09d7e7b0480343fe9a08f8`.

### p3_chinese-2025

- Identity/date: ACS Junior, CL EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2025-p3-chinese-end-of-year-exam-acs-junior-pdf/); 14 PDF pages.
- Analysis page anchors: 1, 7–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Expansion/combining sentences with connectors; comprehension one has three MCQs, comprehension two three open questions requiring evidence.
- SHA-256: `ea300bcf5a68a5332666391baebc255f0d108bf598ed149bc43bfead0efc56a3`.

### p2_higher_chinese-2021

- Identity/date: Red Swastika, HCL topical review; cover 2021.
- Source: [public paper listing](https://sgexam.com/level/primary-2/2021-p2-higher-chinese-topical-revision-1-red-swastika-pdf/); 5 PDF pages.
- Analysis page anchors: 1–5. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Same opening review as the misclassified CL packet, not an independent school sample. Collocation and reading, including a three-question set.
- SHA-256: `469e549ba4a931fca4546a29da4f2bb364b23157f3e3a1c077bab37c5c522e64`.

### p2_higher_chinese-2025

- Identity/date: Nanyang, HCL checkpoints; cover 2025.
- Source: [public paper listing](https://sgexam.com/level/primary-2/2025-p2-higher-chinese-quiz-1-and-2-nanyang-pdf/); 18 PDF pages.
- Analysis page anchors: 1–6, 8–13. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Character recognition, vocabulary/cloze, sentence completion, writing characters and reading; richer language work than a single confusable-character pool.
- SHA-256: `02e7b9f508d6983134203de7af3f3d2e97f40da8f3345c802e82996c2eec549d`.

### p3_higher_chinese-2021

- Identity/date: Nan Hua, HCL EOY revision; cover 2021.
- Source: [public paper listing](https://sgexam.com/level/primary-3/2021-p3-higher-chinese-end-of-year-exam-nan-hua-pdf/); 15 PDF pages.
- Analysis page anchors: 1, 3, 5–7, 9–11. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Vocabulary/cloze/collocation, expansion and two readings, three and four numbered questions. Revision packet, not authenticated exam administration.
- SHA-256: `afc7ac9ce41bcc058c65abeeef28130d994d8665c13a8908ff99579c88415943`.

### p3_higher_chinese-2023

- Identity/date: Catholic High, HCL; catalogue 2023.
- Source: [public paper listing](https://sgexam.com/level/primary-3/2023-p3-higher-chinese-end-of-year-exam-catholic-high-pdf/); 12 PDF pages.
- Analysis page anchors: 1, 4, 6, 8, 10. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Vocabulary, collocation, sentence sequencing and two three-question comprehension sets. App’s HCL mapping needs course-specific evidence, not duplicate counts.
- SHA-256: `2e1461b664fe85123f851bf0e2e2fbf5ea6bbdb68690392e8ae1c1fee13de4e7`.

### p3_higher_chinese-2024

- Identity/date: Catholic High, HCL EOY; cover 2024.
- Source: [public paper listing](https://sgexam.com/level/primary-3/2024-p3-higher-chinese-end-of-year-exam-catholic-high-pdf/); 18 PDF pages.
- Analysis page anchors: 1–3, 8–14. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Listening, vocabulary, reading, picture words, collocation, word insertion and paragraph ordering. Listening remains deferred in Pilot.
- SHA-256: `d2ea06195be3eb7bf3e8e182ca1bad34cb512300135742878a795d18b811e306`.

### p3_higher_chinese-2025

- Identity/date: Ai Tong, HCL EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/level/primary-3/2025-p3-higher-chinese-end-of-year-exam-ai-tong-pdf/); 16 PDF pages.
- Analysis page anchors: 1, 3, 5, 7–14. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Paragraph writing, vocabulary, reading, picture words/collocation, sentence expansion/connectors and six-sentence paragraph ordering. Three open reading questions at the end include reasoning.
- SHA-256: `9b6c24e53e60c41e3f41e20037de167e2e5a5560ca9f988c8cbdf76e782b8076`.

### p2_chinese-2021-extra-rosyth

- Identity/date: Rosyth, CL practices; internal 2021 cover on p9.
- Source: [public paper listing](https://sgexam.com/subject/chinese/2021-p2-chinese-practice-paper-1234-rosyth-pdf/); 18 PDF pages.
- Analysis page anchors: 1–8, 9–15. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Pinyin, character choice, vocabulary, cloze, reading and picture sentences. Reading on pp13–14 has four questions; replaces the misclassified CL source.
- SHA-256: `743379cda116ac9e606d6024748daaf50c27358a8654797c9c8f51b7afc57e38`.

### p2_higher_chinese-2022-sgtestpaper

- Identity/date: Red Swastika, HCL supplementary work; covers 2022.
- Source: [public paper listing](https://www.sgtestpaper.com/primary/download_2022/y22_P2_HChinese_RedSwastika_PT15_test_paper.html); 22 PDF pages.
- Analysis page anchors: 1–20. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Five lesson packets: pinyin/confusables, vocabulary/collocation, four-blank cloze, ordering words, picture sentences and mixed selected/open reading. HCL coverage cannot be inferred from character totals alone.
- SHA-256: `6921c06be4a4c9f9f13279ba86700ec9dc9b5ea11764899679efd72bdfe905a5`.

### p3_higher_chinese-2022-sgtestpaper

- Identity/date: Nan Hua, HCL EOY packet; catalogue 2022.
- Source: [public paper listing](https://www.sgtestpaper.com/primary/download_2022/y22_P3_Hchinese_NanHua_EOY_test_paper.html); 20 PDF pages.
- Analysis page anchors: 1–3, 5–18. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Listening precedes paper two; character/vocabulary, four-blank cloze, collocation, sentence rewriting, paragraph ordering, three-question applied reading and four-question comprehension with evidence/prediction.
- SHA-256: `7976f064fb6ef68771ccd68e17e583cebe744b3a1736db9b40fb90c419aa8c42`.

## Dated enrichment research, 2024–2026

| Public source | Date evidence | What was actually retrieved | Use / limit | SHA-256 |
| --- | --- | --- | --- | --- |
| [chinese-2024](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2024 issue04, printed on PDF | Public one-page answer sheet, P1/P2 CL/HCL | Visible section labels include P2 pinyin/character/punctuation and HCL classifiers/confusables. Full stems/images/passages not retrieved; cannot validate their keys from the answer sheet alone. | `4f15526123d18219a0963afc56f20eee7a43f133b8cfc482899b9986c5252c96` |
| [chinese-2025](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2025 issue18, printed on PDF | Public one-page answer sheet, P1/P2 CL/HCL | P2 vocabulary/sentence completion and HCL pinyin/character/confusable work. Confirms format variety only; no exercises copied. | `e9b75b3f4a310f0da60bd4cd55980d455c6b948614a258f96ed53afcfa652d82` |
| [chinese-2026](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2026 issue09, printed on PDF | Public one-page answer sheet, P1/P2 CL/HCL | P2 character discrimination/reading and HCL pinyin/vocabulary; includes model writing answers. Not evidence of the unseen question set’s correctness. | `d98a63142ae57b0d1c2e8ee3790584ec75640807d2b9edfc98042f1afcd022be` |
| [chinese-p3-enrichment-2024](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2024 issue04, printed on PDF | Public one-page answer sheet, P3/P4 CL/HCL | P3 CL character/vocabulary/reading labels and HCL picture words/character completion/paragraph ordering. Some native text encoding is damaged; section/issue labels are readable, unseen exercises are not audited. | `55abdff1d2b08ce9b3a2e877bd11d9b2963721f24ece53c1a70207a9d1883b58` |
| [chinese-p3-enrichment-2025](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2025 issue18, printed on PDF | Public one-page answer sheet, P3/P4 CL/HCL | P3 HCL word ordering and sentence completion; CL character/vocabulary/collocation/paragraph sequencing. Use format evidence only. | `94d6afb2b528c386caf849e7e9f7d8ad08017c4c954b012a31ae2edd51738aec` |
| [chinese-p3-enrichment-2026](https://www.ezhishi.com/AssessmentMagazineSample.html) | 2026 issue09, printed on PDF | Public one-page answer sheet, P3/P4 CL/HCL | P3 HCL cloze and rewriting direct speech; CL picture words/collocation/paragraph ordering. Full questions remain unavailable in this retrieval. | `e9f3ec9286ef3549ba1c4f9d101865d3b248fff6404400a432917e0410b1def2` |

Citation revision (2026-10-16): these answer sheets are cited through the publisher’s public sample page, not direct file links; the issue number, year and SHA-256 identify each file examined. These six dated answer PDFs are real retrieved enrichment material, **not six reviewed full magazines**. Their unseen distractors/passages/images are not audited, and model answers are not imported into the app. An additional public 2026 sample was retrieved separately, as recorded below.

### Additional 2026 publisher samples with actual questions

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

## Originality, rights and reproducibility

The app content is labelled original author draft. A bounded exact-overlap check compared every app material body and question stem against the retrieved same-subject paper OCR/text: 19 text files, 24 consecutive Han characters. **No threshold-length exact match was found.** This can miss paraphrases, OCR errors, shorter copying, images and sources outside the sample. It is not proof of originality, permission or copyright clearance. Common grammar/number templates are not by themselves evidence of copying. Retain pending rights/independent review/owner sign-off until the project’s review gates are satisfied.

For past papers, start at the cited public listing, identify the recorded grade/course, year and assessment, and obtain the matching file under the host’s current access conditions. Compare its `sha256sum` with the recorded hash; a mismatch may mean the host replaced the file. Official and other source snapshots are likewise identified by their cited URLs and hashes. For paper structure, extract native PDF text and OCR scans (PyMuPDF + Tesseract English / Simplified Chinese), then inspect the stated PDF pages and course/year covers visually where OCR is ambiguous. HTML hashes identify the fetched snapshot, not an immutable future webpage. The documented overlaps used only stems/material bodies, not keys/explanations or character catalogues. Source retrieval and OCR happened outside the public repository; no signed download tokens or private files are required to follow these citations.

## Disposition and next revision

1. Resolve the numbered findings above and update the leaf-level map and affected content/metadata together. Keep the agreed Pilot exclusions and locks.
2. Review original questions, distractors, keys, hints, explanations and any new assets as a coherent batch; increment affected content versions and preserve prior pinned attempts. The earlier correction commit is not approval of unchanged or newly added content.
3. Re-run schema/content checks and the public-data guard. Validators check structure and references, not curriculum truth, unambiguous meaning, complete transfer pools or educational quality.
4. Calculate release coverage only from the reviewed in-scope leaf denominator, with explicit omissions. Independent review and owner sign-off remain pending; no percentage or question count authorises implementation/merge.

Validation for this evidence-only revision: public-source link/hash and report consistency checks; subject content validator rerun without content/schema changes; privacy guard and whitespace diff check. The PR comment records the published evidence revision and exact results.
