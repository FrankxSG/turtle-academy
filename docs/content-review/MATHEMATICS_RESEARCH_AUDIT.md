# Mathematics — independent public-source research and content audit

Audit date: **2026-10-16**. PR **#13**, reviewed head `6f53167cdc4b17b8b40dd5328262588849fc8f5b`; base `main` at `dc3ed51c5da07e3b2cec69eeacaac69e23daa1c8`. Research/evidence revision only; no content approval, implementation, merge or deployment authorization.

**Verdict: changes required before content approval.** Quantity and the P3 lock are correct, but the source-to-leaf map misses current P2/P3 requirements and the bank does not assess important visual interpretation. The previous arithmetic correction does not resolve these coverage issues.

Snapshot: 303 questions (153 P2 + 150 P3), 101 three-question target sets, all four-option MCQ, no material/diagram assets. All P3 curriculum topics remain `pilot: locked`; retain that boundary.

## Method and evidence limits

The reviewer independently retrieved public official PDFs, navigated current public school sources, downloaded actual historical paper packets, and examined dated enrichment. This is additional research beyond the previous targeted key corrections and the PR author’s source list. Paper text/OCR was processed across the individual packets; representative question pages, headings and selected rendered pages were examined for skills, response demand and date/course identity. External answer schemes were not assumed correct. The work is a source/scope/coverage audit with targeted item findings, not a second human marking of every external question or signed educator approval of every app key.

The four audits together use **50 retrieved paper/bundle files**: 47 individual/combined packets and three second-host bundles. Files/hosts may overlap in underlying papers. Only eight pages of each large second-host bundle were examined; there is no claim to have manually audited the complete bundles. Public hosting is not a reuse licence or authentication of a school-issued paper. No source scans, passages, question text, images or answer sheets are added to the repository. No private worksheets or learner data were used.

## Content findings

### MA1 — Correct the current grade-level inventory and add missing checks (blocking)

MOE pp33–36 were actually retrieved, not inferred from a school index. Required corrections:

| Official leaf | Current bank evidence | Required next revision |
| --- | --- | --- |
| P2 odd/even, p33 §1.6 | No P2 odd/even target; only `ma.p3.odd-even` | Add a P2 target/pool; P3 may retain revision |
| P2 decimal money ↔ cents, p33 §1.4 | Counting, notation and comparison exist; `money-notation.q3` only splits dollars/cents, not conversion to total cents | Add both conversion directions and map the leaf explicitly |
| P2 clock reading to the minute, p34 §2.1 | Manifest says five minutes; `ma.p2.time-read` uses 15/45/30 minutes | Correct label; add non-five-minute clock stimuli and keys |
| P3 24-hour clock, p36 §2.3 | Absent from `ma.p3.time*` targets | Add conversion/reading and contextual checks, keep P3 locked |

Do not silently treat old paper/enrichment conventions as the updated syllabus. School topic headings do not settle these finer requirements.

### MA2 — Restore the representation that the skill requires (blocking for coverage claims)

`ma-p2-mass-scale.q1` states the pointer value; `ma-p2-length-ruler` gives endpoints in words; `ma-p3-bar-read.q1` states the bar height. These can check arithmetic, but cannot establish reading an unseen scale, ruler or graph. Clock hands, angle/line diagrams, 3D shape views and scaled picture/bar graphs need reviewed stimuli. Text may validly render a representation, but it must actually present it rather than disclose the measured value. No asset/diagram records currently supply this evidence.

MOE requires drawing perpendicular/parallel lines. Objective selection can assess recognition/error checking; it cannot certify the drawing skill. Record drawing as external/partial in the leaf map, consistent with the Pilot’s selected-answer constraint. Do not reopen input/drawing implementation to conceal the gap.

### MA3 — Replace topic-level completion with leaf evidence (blocking for release calculation)

29 topic records, of which 27 have question pools, are not 29 equally weighted MOE outcomes. Split each official leaf, distinguish retained earlier skills/enrichment, and attach assessed representation, course, stage pools and review status. Three questions on a target provide thin initial stock, not three sufficiently varied pools for arbitrary imported mistakes. Prefer fresh alternatives and record reuse; do not claim comprehensive transfer evidence from a numeric reskin alone.

The prior numeric/semantic corrections remain useful; no new question edits or runtime changes are made by this audit. All answers and explanations still require a final signed content review, particularly visuals once authored.

## Official and public-school sources

Official sources define scope; school sources corroborate local sequence/assessment, and hosted past papers/enrichment describe practice. Lower-authority sources do not override current MOE requirements. All page numbers below are PDF pages unless explicitly called printed pages. All sources accessed 2026-10-16.

- [MOE Mathematics, updated October 2025](https://www.moe.gov.sg/api/media/92bff26d-b2b4-4535-b868-b8415c744b91/2021-Primary-Mathematics-Syllabus-P1-to-P6-Updated-October-2025.pdf). Actual PDF retrieved and inspected: P2 PDF/printed pp33–34; P3 pp35–36. SHA-256: `e8f77fe10d768e2ad5266dfc39a8821674be7eb1c81bc545ba4b841b12ae70e1`.

| School document | Pages examined / use | SHA-256 |
| --- | --- | --- |
| [ws-p2-2026-2](https://isomer-user-content.by.gov.sg/817/de41114b-6ca4-4934-bca0-b5657080dd85/03_2026_Curriculum_Briefing_Mathematics_P2.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p2/) | 4, 8: P2 yearly topics and concrete real-world measurement/fraction activities. Fine official limits must still come from MOE. | `13c980dab0708a1e0f9c08332c8514b85d7f57d6de7f72518d207c28a7b5b767` |
| [ws-p3-2026-2](https://isomer-user-content.by.gov.sg/817/f9d67595-5d02-4a98-bbd1-f0a7ffa2e782/03_2026_Curriculum_Briefing_Mathematics_P3.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p3/) | 3–4: P3 topics and activity-based teaching. The slide’s truncated addition/subtraction range is not a substitute for MOE’s 10,000 limit. | `d356de25d1218465d41a0bd88731c96c7386b8139929bae246a0424fc824a88f` |

The school PDFs were reached through current school navigation; moved legacy file links were not silently counted as retrieved. They are public curriculum documents, not any learner’s school/worksheet information.

## Curriculum-to-bank inventory

This is a broad-strand cross-check, not a substitute for the finer leaf inventory requested in MA3. Counts are unique questions in this PR; “present” does not mean educator-approved.

| Working topic | Current label | Questions / repair targets | Audit qualification |
| --- | --- | --- | --- |
| ma.p2.numbers-1000 | Numbers to 1000: place value, reading/writing, comparing, ordering, patterns | 15 / 5 | in_app; see MA1 leaf check |
| ma.p2.add-sub-1000 | Addition and subtraction within 1000, including regrouping and missing numbers | 12 / 4 | in_app |
| ma.p2.multiplication-division | Multiplication and division: equal groups, repeated addition, sharing and grouping | 12 / 4 | in_app |
| ma.p2.tables-2-5-10 | Multiplication tables of 2, 5 and 10 | 9 / 3 | in_app |
| ma.p2.tables-3-4 | Multiplication tables of 3 and 4 | 6 / 2 | in_app |
| ma.p2.word-problems | Word problems (up to 2 steps) for the four operations | 9 / 3 | in_app |
| ma.p2.fractions | Fractions: part of a whole, comparing/ordering unit and like fractions, adding/subtracting like fractions within one whole | 18 / 6 | in_app |
| ma.p2.money | Money: counting, decimal notation, adding/subtracting in dollars only or cents only | 12 / 4 | in_app; see MA1 leaf check |
| ma.p2.length | Length in m and cm: measuring, comparing, word problems | 12 / 4 | in_app; representation/drawing limits MA2 |
| ma.p2.mass | Mass in kg and g: measuring, comparing, word problems | 12 / 4 | in_app; representation/drawing limits MA2 |
| ma.p2.volume | Volume of liquid in litres | 6 / 2 | in_app; representation/drawing limits MA2 |
| ma.p2.time | Time: telling time to 5 minutes, a.m./p.m., hours and minutes, duration | 12 / 4 | in_app; see MA1 leaf check |
| ma.p2.shapes | 2D shapes (incl. semicircle, quarter circle), 3D shapes, patterns, composing figures | 12 / 4 | in_app; representation/drawing limits MA2 |
| ma.p2.picture-graphs | Picture graphs with scales | 6 / 2 | in_app; representation/drawing limits MA2 |
| ma.p3.numbers-10000 | Numbers to 10 000: place value, comparing, ordering, patterns, odd and even | 15 / 5 | in_app; see MA1 leaf check; Pilot locked |
| ma.p3.add-sub-10000 | Addition and subtraction within 10 000 | 6 / 2 | in_app; Pilot locked |
| ma.p3.tables-6-9 | Multiplication tables of 6, 7, 8 and 9 and related division | 18 / 6 | in_app; Pilot locked |
| ma.p3.multiplication-division | Multiplication and division up to 3 digits by 1 digit, with remainder | 12 / 4 | in_app; Pilot locked |
| ma.p3.word-problems | Word problems with the four operations, including comparison models | 9 / 3 | in_app; Pilot locked |
| ma.p3.money | Money in decimal notation: adding, subtracting, word problems | 9 / 3 | in_app; see MA1 leaf check; Pilot locked |
| ma.p3.fractions | Equivalent fractions; comparing/ordering unlike fractions; adding/subtracting related fractions within one whole | 15 / 5 | in_app; Pilot locked |
| ma.p3.length-mass-volume | Length (km, m, cm), mass (kg, g), volume (l, ml): compound units and conversion | 12 / 4 | in_app; representation/drawing limits MA2; Pilot locked |
| ma.p3.time | Time: seconds, duration, start and end times, conversion | 12 / 4 | in_app; see MA1 leaf check; Pilot locked |
| ma.p3.area-perimeter | Area and perimeter: square units, rectangles and squares | 18 / 6 | in_app; Pilot locked |
| ma.p3.angles | Angles: right angles, comparing angles | 9 / 3 | in_app; representation/drawing limits MA2; Pilot locked |
| ma.p3.perpendicular-parallel | Perpendicular and parallel lines | 6 / 2 | in_app; representation/drawing limits MA2; Pilot locked |
| ma.p3.bar-graphs | Bar graphs: reading, interpreting, completing | 9 / 3 | in_app; representation/drawing limits MA2; Pilot locked |
| ma.p2.investigation | Performance tasks, investigations, journals and explaining reasoning in words | 0 / 0 | external |
| ma.p3.long-answer-workings | Structured/long-answer questions with full written workings | 0 / 0 | partial; Pilot locked |

## Actual paper research, 2021–2026

Citation revision (2026-10-16): third-party past papers are linked through public listing pages only. School/year/type, analysis pages and original file hashes still identify the copies examined; this citation format does not establish reuse rights.

| Course | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
| --- | --- | --- | --- | --- | --- | --- |
| p2 maths | Retrieved | Retrieved | Retrieved | Retrieved¹ | Retrieved | Not retrieved |
| p3 maths | Retrieved | Retrieved | Retrieved | Retrieved¹ | Retrieved | Not retrieved |

“Retrieved” means a public PDF packet was downloaded and its content examined, not that a direct school release was authenticated. ¹ Catalogue year is not internally established for every packet; retain the per-file qualifications below. This was a bounded multi-host survey, not an exhaustive census. No verified 2026 paper was retrieved as of 2026-10-16; a website’s 2026 title/footer was not treated as the year printed on a paper.

SGExam/SGTestPaper/SmileTutor and public web searches were checked. The second-host bundle below was actually sampled, not counted from an index alone. Multiple hosts can contain the same underlying paper; downloads are not a count of independent schools.

### p2_maths-2021

- Identity/date: ACS Junior, non-weighted BA2; cover 2021.
- Source: [public paper listing](https://sgexam.com/subject/maths/2021-p2-maths-bite-sized-assessment-2-acsj-pdf/); 9 PDF pages.
- Analysis page anchors: 1–2, 4, 7. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Multiplication/division and addition/subtraction word problems; MCQ and short/structured responses. Assessment is a subset of yearly scope.
- SHA-256: `530607f50707ed0c48b72ed851a5452473028856d8b0cee11c2f2d1f4616cf54`.

### p2_maths-2022

- Identity/date: Tao Nan, Review 2; cover and answer-sheet 2022.
- Source: [public paper listing](https://sgexam.com/subject/maths/2022-p2-maths-holistic-assessment-2-tao-nan-pdf/); 16 PDF pages.
- Analysis page anchors: 1–2, 5–7, 11–16. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Selected/short responses, scaled measurement, time and multi-step problems. Answer sheet names Tao Nan; not Raffles Girls’. Public scans are not authenticated school releases.
- SHA-256: `c7b50e8bd60a952b3295416e47649966afa70681fc5bbc3610545e00ceefef83`.

### p2_maths-2023

- Identity/date: Pei Hwa Presbyterian, SA2; catalogue 2023.
- Source: [public paper listing](https://sgexam.com/subject/maths/2023-p2-maths-semestral-assessment-2-pei-hwa-pdf/); 24 PDF pages.
- Analysis page anchors: 1, 3–9, 15–20. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: MCQ, short responses and structured word problems; models and diagrams are substantive stimuli, not optional decoration.
- SHA-256: `95b189f233ae4b8e2fc2aa7d0b453c41399e7d1171c15ee627700f513defc3b1`.

### p2_maths-2024

- Identity/date: Raffles Girls’, supplementary worksheets; catalogue 2024.
- Source: [public paper listing](https://sgexam.com/subject/maths/2024-p2-maths-quiz-1-and-2-raffles-girls-pdf/); 28 PDF pages.
- Analysis page anchors: 1–4, 9–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Cover is a volume worksheet, not the advertised quiz cover. No internal year established; use as format evidence only, not a certified 2024 exam.
- SHA-256: `14b23a1c7e3a49276f0d03c4b00ef33002eaac4dbd2ef60c8ae150975d106acb`.

### p2_maths-2025

- Identity/date: Henry Park, Quiz 2; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/maths/2025-p2-maths-quiz-2-henry-park-pdf/); 12 PDF pages.
- Analysis page anchors: 1–8. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Multiplication/division representations, missing quantities and word problems; mixed selected/short responses. This single quiz cannot establish all P2 outcomes.
- SHA-256: `c2e299d5765d3748e6593f92b70b79baf31935b3fb654a23e48acd1d85d4faa8`.

### p3_maths-2021

- Identity/date: ACS Junior, BA2; cover 2021.
- Source: [public paper listing](https://sgexam.com/subject/maths/2021-p3-maths-bite-sized-assessment-2-acsj-pdf/); 9 PDF pages.
- Analysis page anchors: 1–7. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Short assessment combining MCQ, short answers and structured problems; not complete yearly coverage.
- SHA-256: `38343744049dd69d2e44c3ef9fdab1c5cd2b6b819a35b1ef58cf59a19a46edaa`.

### p3_maths-2022

- Identity/date: ACS Junior, SA2; cover 2022.
- Source: [public paper listing](https://sgexam.com/subject/maths/2022-p3-maths-semestral-assessment-2-acs-junior-pdf/); 26 PDF pages.
- Analysis page anchors: 1, 3–10, 18–22. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: MCQ and short/structured responses across number, measurement and problem solving; visual representations recur.
- SHA-256: `6832cf8b120645a6aff53844e14c60def0c2c1602f6df5ea1e7948416e10cf6c`.

### p3_maths-2023

- Identity/date: ACS Primary, EOY; cover 2023.
- Source: [public paper listing](https://sgexam.com/subject/maths/2023-p3-maths-end-of-year-exam-acsp-pdf/); 26 PDF pages.
- Analysis page anchors: 1, 3, 9, 18–21. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: MCQ, short answers and structured problems; course-level labels alone do not prove the current leaf-outcome inventory.
- SHA-256: `217f1207a1110dc57f27ebbd7ff3016cc02268359beb5528f260d07a2bc1f218`.

### p3_maths-2024

- Identity/date: ACS Junior, BA2; catalogue 2024.
- Source: [public paper listing](https://sgexam.com/subject/maths/2024-p3-maths-bite-sized-assessment-2-acs-junior-pdf/); 11 PDF pages.
- Analysis page anchors: 1–8. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Cover has no legible printed year. Thirteen-question assessment, not a full syllabus census; retain advertised-year uncertainty.
- SHA-256: `a3ad73ba7df759bb139f79f0d6ee438b7e878ed772e90448cb83e6662fe183cb`.

### p3_maths-2025

- Identity/date: ACS Junior as catalogued, EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/maths/2025-p3-maths-end-of-year-exam-acs-junior-pdf/); 20 PDF pages.
- Analysis page anchors: 1, 4, 10, 14. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: PDF p4 Q4 uses 24-hour time; p10 Q19 requires a parallel line through a point. Geometry, clock and graph interpretation need actual representations in the app.
- SHA-256: `deb8c632c9ff8116f340b212aecc86e60119f6c0515da1891b69a5a995f592f8`.

### p3_maths-2025-extra-tao-nan

- Identity/date: Tao Nan, EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/maths/2025-p3-maths-end-of-year-exam-tao-nan-pdf/); 16 PDF pages.
- Analysis page anchors: 1–13. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: 25 questions: 10 MCQ, 10 short, five structured. Scales, angles, parallel-line drawing, equivalent fractions, duration and composite area/perimeter provide independent corroboration.
- SHA-256: `cd6117a595870657771b785fea3b1890c40d7da3e6d5541450747f975e0c4f79`.

### Second-host 2022 bundle — mathematics

[SmileTutor public listing](https://smiletutor.sg/free-test-papers-download/primary-school-exam-papers/): 53 pages downloaded; **only PDF pp1–8 inspected/OCR processed**. The first packet is Maha Bodhi Review 1. PDF pp3–8 show place value, missing numbers, model choice, cube counting and structured comparison problems. Distinguish reading a supplied model from calculating values disclosed in prose.

SHA-256: `cffdaa012c6840dab0e1efbdf387384ee5832c4c3ccfc6780f0a985f23ec6d0d`. Full bundle content/keys were not audited.

## Dated enrichment research, 2024–2026

| Public source | Date evidence | What was actually retrieved | Use / limit | SHA-256 |
| --- | --- | --- | --- | --- |
| [maths-2024](https://www.agrader.sg/post/5-top-mistakes-to-avoid-in-math-primary-2-mass-and-length-topics) | 2024-06-09 published; 2026 modification | Public instructional article | Length/mass unit and scale-reading errors support the need for actual measurement representations. | `a6572948993efa9e178e6cda255da24305307883e94f35950e895ac49347b7db` |
| [maths-2025](https://www.agrader.sg/post/area-and-perimeter-tips-and-tricks-for-primary-3-students-to-excel) | 2025-05-29 | Public instructional article/examples | P3 area/perimeter teaching includes visual composite reasoning; do not imply that arithmetic with stated dimensions covers all diagram skills. | `a2c53a78a998b9554ae7cb289a3ce17b90d5291fcbad7044ca4dc097702240e0` |
| [maths-2026](https://practicle.sg/primary-2-math/) | 2026-01-05 metadata; page explicitly labelled 2026 | Public guide/examples | P2 topic guide includes time to the minute, agreeing with the current official syllabus. Vendor alignment claims are not independently sufficient. | `9e74af650f15555ee9adebaee7324669288ad0075365d776f41425dbac77c605` |

Rejected as current-scope authority: [Gifted Questions P2 page](https://www.giftedquestions.com/primary-2-maths-worksheets/) (displayed June 2024) retains an older five-minute time description and links older product material. It was not counted as a retrieved current question set. This illustrates why date alone is insufficient.

## Originality, rights and reproducibility

The app content is labelled original author draft. A bounded exact-overlap check compared every app material body and question stem against the retrieved same-subject paper OCR/text: 12 text files, 12 consecutive alphabetic words, case/punctuation normalised. **No threshold-length exact match was found.** This can miss paraphrases, OCR errors, shorter copying, images and sources outside the sample. It is not proof of originality, permission or copyright clearance. Common grammar/number templates are not by themselves evidence of copying. Retain pending rights/independent review/owner sign-off until the project’s review gates are satisfied.

For past papers, start at the cited public listing, identify the recorded grade/course, year and assessment, and obtain the matching file under the host’s current access conditions. Compare its `sha256sum` with the recorded hash; a mismatch may mean the host replaced the file. Official and other source snapshots are likewise identified by their cited URLs and hashes. For paper structure, extract native PDF text and OCR scans (PyMuPDF + Tesseract English / Simplified Chinese), then inspect the stated PDF pages and course/year covers visually where OCR is ambiguous. HTML hashes identify the fetched snapshot, not an immutable future webpage. The documented overlaps used only stems/material bodies, not keys/explanations or character catalogues. Source retrieval and OCR happened outside the public repository; no signed download tokens or private files are required to follow these citations.

## Disposition and next revision

1. Resolve the numbered findings above and update the leaf-level map and affected content/metadata together. Keep the agreed Pilot exclusions and locks.
2. Review original questions, distractors, keys, hints, explanations and any new assets as a coherent batch; increment affected content versions and preserve prior pinned attempts. The earlier correction commit is not approval of unchanged or newly added content.
3. Re-run schema/content checks and the public-data guard. Validators check structure and references, not curriculum truth, unambiguous meaning, complete transfer pools or educational quality.
4. Calculate release coverage only from the reviewed in-scope leaf denominator, with explicit omissions. Independent review and owner sign-off remain pending; no percentage or question count authorises implementation/merge.

Validation for this evidence-only revision: public-source link/hash and report consistency checks; subject content validator rerun without content/schema changes; privacy guard and whitespace diff check. The PR comment records the published evidence revision and exact results.
