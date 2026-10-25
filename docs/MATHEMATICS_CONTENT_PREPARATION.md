# Mathematics content pool (P2-P3)

**Current working state:** use the [canonical pool](../content/mathematics/pool-001.json) review log and [curriculum](../content/mathematics/curriculum.json) limitations for current status. Full item QA, owner disputed-item review/random 20% sample, rights and batch sign-off remain pending. A targeted preparation re-review is not a subject release. The [README](../README.md) distinguishes implemented app behavior from these authored pools.

## Current findings and next work

| Finding | Disposition / remaining work | Retained evidence |
| --- | --- | --- |
| MA1 | Grade/time/money corrections authored; full item QA/sign-off remains pending. | [Correction response](#audit-response-revision--16-october-2026-batch-version-3) |
| MA2 | Visual stimuli supplied; production/drawing capabilities stay partial/external. Independent diagram/item review remains required. | Same response and canonical leaf limitations |
| MA3 | Source-complete leaf denominator and mental two-digit addition/subtraction gap remain open; authored targets are not the denominator. P3 stays locked. | [Re-review/open work](#re-review-corrections--17-october-2026) |

Historical research: [source audit](#research-audit). Shared review method: [Content QA](CONTENT_QA.md), [authoring skill](../skills/question-authoring/SKILL.md) and [review command](../README.md#content-preparation).

## 1. What is in this pool

- [Curriculum and source records](../content/mathematics/curriculum.json): topic/leaf mapping, source metadata, scope and limitations.
- [Original content pool](../content/mathematics/pool-001.json) and [assets](../content/mathematics/assets/): canonical item/material versions, keys, repair routes and review state.
- [Shared validator](../scripts/validate_subject_content.py): schema, IDs/keys/references, complete stage routes, visual assets, knowledge-point links/prerequisite cycles, SVG safety and non-answer-revealing hints.

Use the [content-review command](../README.md#content-preparation) for current counts, source records and complete rendered items. This is original authoring; no paper/school/commercial question, passage or figure is copied. The pool remains author-checked with full item QA, independent review and owner sign-off pending; authored mappings are not approved coverage.

## 2. Sources cited

Historical authoring citations (16 October); the **direct-retrieval failures in their notes are author-stage results**. Later independent retrievals and file fingerprints are in the [research audit](#research-audit). Current machine-readable metadata is in the curriculum JSON; neither a later retrieval nor a count establishes complete leaf verification.

| ID | Type | Source | Used for |
| --- | --- | --- | --- |
| `moe-ma-2021` | MOE official | [MOE 2021 Primary Mathematics Syllabus P1-P6 (updated October 2025)](https://www.moe.gov.sg/api/media/92bff26d-b2b4-4535-b868-b8415c744b91/2021-Primary-Mathematics-Syllabus-P1-to-P6-Updated-October-2025.pdf) (accessed 2026-10-16) | Authoritative P2/P3 topic and outcome boundaries. _Official MOE file; direct retrieval was blocked from the authoring environment, so content was cross-checked against school documents that follow it. Verify against the PDF during inventory audit._ |
| `tnps-ma-p2-2026` | School (public) | [Tampines North Primary: P2 Mathematics Scheme of Work Outline 2026](https://www.tampinesnorthpri.moe.edu.sg/files/MA_SOW_Outline_2026_P2.pdf) (accessed 2026-10-16) | P2 topic list and teaching order by term. |
| `pvps-ma-p2p3-2026` | School (public) | [Parkview Primary: 2026 P2 & P3 Mathematics Briefing](https://parkviewpri.moe.edu.sg/files/2026%20MTP/2026_P2__P3_2026_Briefing_Math.pdf) (accessed 2026-10-16) | P2 learning outcomes; P3 paper format (MCQ/SAQ/structured); common misconceptions (fractions ordering, word problems); problem-solving steps. |
| `edgefield-p2-2025` | School (public) | [Edgefield Primary: 2025 P2 Learning Outcomes letter](https://www.edgefieldpri.moe.edu.sg/files/2025_Assessment_Letter_to_Parents___P2_Learning_Outcomes.pdf) (accessed 2026-10-16) | P2 learning outcomes per semester (Maths, English, Chinese); no weighted assessments at P2. |
| `amkps-ma-p3-2026` | School (public) | [Ang Mo Kio Primary: 2026 P3 Mathematics parent briefing](https://www.angmokiopri.moe.edu.sg/files/3__2026_P3_PTM_Mathematics.pdf) (accessed 2026-10-16) | P3 topic list by term; EYE format; checking routine and model-drawing tips. |
| `jwps-p3-2025` | School (public) | [Jurong West Primary: 2025 P3 Assessment Overview, Topics and Components](https://www.jurongwestpri.moe.edu.sg/files/JWPS_2025_P3_Assessment_Overview__Topics_and_Components_.pdf) (accessed 2026-10-16) | P3 chapter list and EOY component counts (MCQ 15 / SAQ 6 / LAQ 5). |
| `cedar-p3-2025` | School (public) | [Cedar Primary: P3 Curriculum Briefing 2025](https://www.cedarpri.moe.edu.sg/files/Parent%20Engagement/2025%20P3%20Engagement/3__14_mar_p3_curriculum_briefing_2025.pdf) (accessed 2026-10-16) | P3 topic strands and assessment weighting. |
| `geniebook-p2-papers` | Past-paper index | [Geniebook: Primary 2 sample papers index (2021-2023 listed)](https://geniebook.com/exam-preparation/sample-papers/primary-2) (accessed 2026-10-16) | Format survey of P2 topical/holistic reviews; no questions copied. _Hosted papers have no stated reuse licence; used for format analysis only._ |
| `smiletutor-papers` | Past-paper index | [SmileTutor: primary school exam papers index](https://smiletutor.sg/free-test-papers-download/primary-school-exam-papers/) (accessed 2026-10-16) | Format survey of P2/P3 papers (2022 within range); no questions copied. _Site states copyright; used for format analysis only._ |
| `koobits-math` | Enrichment | [KooBits Math (Singapore primary maths practice platform)](https://koobits.com/math) (accessed 2026-10-16) | Enrichment context: daily short practice, cited in school briefings (AMK 2026). |
| `moe-sls` | Enrichment | [MOE Student Learning Space (SLS)](https://www.learning.moe.edu.sg/) (accessed 2026-10-16) | Enrichment context: school-assigned online practice referenced by AMK 2026 briefing. |

## 3. Assessment formats observed (public school documents)

- **P2:** no weighted assessments or examinations at P2; schools use topical reviews, performance tasks, investigations and journals (`edgefield-p2-2025`, `pvps-ma-p2p3-2026`). Learning outcomes: numbers to 1000, addition/subtraction, multiplication and division within tables, shapes, time to the minute, length/mass/volume, picture graphs with scales, fractions.
- **P3:** weighted assessments plus an end-of-year paper. Reported formats: 1 h 15 min, 25-30 questions mixing MCQ, short-answer and 3-5 long-answer items (`amkps-ma-p3-2026`); 26 questions / 50 marks as 15 MCQ, 6 SAQ, 5 LAQ (`jwps-p3-2025`); 28 questions / 50 marks as 10 MCQ, 15 SAQ, 3 structured (`pvps-ma-p2p3-2026`); 10 MCQ, 11 SAQ, 5 LAQ (`cedar-p3-2025`).
- **Implication for the app:** the app uses objective selection only, so SAQ/LAQ skills are represented by worked multi-step word problems with a selected final answer. Written workings remain external (`ma.p3.long-answer-workings` is marked partial).

## 4. Past-year paper survey (2021-2026)

Public paper indexes were surveyed for format only: Geniebook lists P2 topical reviews, holistic assessments and English SA papers for 2021-2023 (`geniebook-p2-papers`); SmileTutor lists P2/P3 papers with 2022 the only year in range (`smiletutor-papers`). None of these sites states a reuse licence and one asserts copyright, so **no paper or question is reproduced**. What the survey informed:

- Question styles: bare computation, missing-number sentences, unit selection, reading scales/clocks/graphs, and 1-2 step word problems (P2) or up to 3-step problems with comparison models (P3).
- Typical traps modelled as distractors: no regrouping, subtracting the smaller digit from the larger in each column, wrong unit (cm vs m, kg vs g, cm vs cm²), reading the start mark of a ruler as 0, mixing a.m./p.m., adding denominators of fractions, and confusing area with perimeter.

## 5. Misconceptions and teaching notes used

- Comparing and ordering fractions and multi-step word problems are named as common difficulties (`pvps-ma-p2p3-2026`); both have dedicated repair sets.
- Model drawing and a check-your-answer routine are recommended (`pvps-ma-p2p3-2026`, `amkps-ma-p3-2026`); hints point to the next step (draw units, find the total first, change units first) without stating the answer.
- Each repair set follows the Pilot ladder: **exact** (bare skill), **similar** (same skill, different numbers or representation), **generic** (new context, usually a word problem).

## 6. Enrichment context (2024-2026)

Schools reference short daily practice and online platforms such as KooBits and SLS (`amkps-ma-p3-2026`, `koobits-math`, `moe-sls`). These are cited as context for practice style only; no enrichment content is copied.

## Topic coverage in this pool

Current inventory and review pages: [README content preparation](../README.md#content-preparation).

## Historical corrections

## Historical authoring and review overview

Independent public-source research and original findings: [research audit](#research-audit) (2026-10-16). The review disposition below records subsequent corrections; the historical audit remains evidence, not batch approval.

**Review disposition — 17 October 2026:** Independent re-review of `cba8714` closes the encoded-external-reference SVG finding. Decoded attribute checks reject the original decimal/hex-encoded URL, style, protocol, data-URI and CSS-escape probes; literal or encoded same-file references remain allowed. All six shared test methods and the subject validator pass. Questions and diagrams are unchanged from the prior content review. No open blocker from this correction remains for merging preparation work; this is not owner merge authorization or approved shipping content. MA3's source-complete inventory and known mental two-digit addition/subtraction gap remain pending, together with full item QA, owner disputed-item review/random 20% sample, batch sign-off and coverage approval. P3 Mathematics remains locked in the Pilot.

**Review proposal · 16 October 2026 · generic/public content pool**

Original P2 and P3 Mathematics questions for the public (generic) version of Turtle Academy, mapped to the Singapore primary syllabus with public sources cited. P2 content is open in the Pilot; **P3 content is authored now but stays locked in the Pilot app** until the post-Pilot Mathematics teaching flow exists (Functional Design §1). This document does not authorize implementation, release, merge or deployment.

The dated revisions below retain the defects, source interpretations and dispositions that inform authoring. Their old counts, pending states and implementation claims apply to those revisions, not current capabilities; use the current JSON and [README](../README.md). Shared human QA requirements are in [CONTENT_QA](CONTENT_QA.md).

## Correction revision — 16 October 2026

Batch version 2 corrects `ma-p2-fraction-subtract.q3`: both fractions now refer to the full tank, so the keyed 6/12 follows by like-fraction subtraction. Its hint and explanation use that same whole. The item version is incremented and remains listed for independent re-review. Counts remain P2 153/P3 150; every P3 topic remains locked. The separate time-curriculum gaps (P2 minute reading and P3 24-hour clock), official leaf audit and dated paper/enrichment evidence remain open; this item correction does not resolve those findings.

Existing tasks retain their pinned versions; these authoring revisions do not implement evidence migration or retroactive regrading.

## Audit-response revision — 16 October 2026 (batch version 3)

Responds to [MATHEMATICS_RESEARCH_AUDIT.md](#research-audit) MA1–MA3. Author revision only: every revised or new item is pending independent re-review and owner sign-off.

| Finding | Change in this batch | Still open |
| --- | --- | --- |
| **MA1** P2 odd/even (§1.6) | New target `ma.p2.odd-even` (3 items). P3 odd/even is kept as retained revision (topic note). | Independent review |
| **MA1** P2 dollars ↔ cents (§1.4) | New targets `ma.p2.money-to-cents` and `ma.p2.cents-to-dollars` (both directions, 3 items each). | Independent review |
| **MA1** P2 time to the minute (§2.1) | Topic label corrected from "5 minutes" to "the minute". `ma.p2.time-read` now uses drawn clocks at 4.17, 7.43 and 12.38. | Confirm clock-reading distractors |
| **MA1** P3 24-hour clock (§2.3) | New targets `ma.p3.time-24h` (conversion) and `ma.p3.time-24h-duration` (context). P3 stays locked. | Reviewer to confirm the 24-hour notation schools use (this batch writes `15:45`) |
| **MA2** representations | 65 original SVG diagrams replace word descriptions: ruler, dial scales, measuring container (new `ma.p2.volume-read`), clocks, picture graphs, fraction diagrams, 2D/3D shapes, composing figures, angles, line pairs, letters, rectangles, bar graphs (including missing/incorrect bars), 1-cm grids and composite figures. Stems no longer disclose the measured value. The validator rejects any item mapped to a visual leaf without a diagram. | Visual check of every diagram by an independent reviewer |
| **MA2** drawing | Drawing perpendicular/parallel lines and drawing bars are recorded as `production` leaves with `partial` scope; in-app items check recognition only. | — |
| **MA3** leaf denominator | `curriculum.json` now has `leaves`: one per repair target (assessed ability, text/visual representation, MOE page range) plus production/external leaves. Every item has `leaf_refs`. | This is an **author working map** derived from the targets, not an independent page-by-page leaf audit. MOE leaves that have no target yet are therefore not listed; independent verification must add them before any coverage percentage is computed. |

Not changed: three questions per target remains thin initial stock (MA3); no question was copied from any paper.

## Re-review corrections — 17 October 2026

Responds to the independent re-review of `280dd4d`. No questions or diagrams changed.
- **Shared SVG guard.** Attribute values are now checked after XML decoding. Encoded `url(` and `https`, protocol-relative values, `data:` and CSS escapes are rejected, while same-file `url(#id)` stays allowed (the re-review accepted that policy). The re-review's encoded probes are failing tests. The validator and tests are identical in #13, #14 and #15.

Still open: the MA3 source-complete inventory, deferred to the next round. That includes the known gap in mental addition and subtraction of two 2-digit numbers, which will be filled with new questions. Also open: item QA, the 20% sample and owner sign-off. P3 Mathematics stays locked in the Pilot.


<a id="research-audit"></a>

## Research audit — 2026-10-16

Historical source evidence and findings, retained in full below. The preparation/review dispositions above record later corrections; this audit's old verdict and counts are not current approval status. The identifier `MATHEMATICS_RESEARCH_AUDIT` is retained for existing source references.

### Mathematics — independent public-source research and content audit

Audit date: **2026-10-16**. PR **#13**, reviewed head `6f53167cdc4b17b8b40dd5328262588849fc8f5b`; base `main` at `dc3ed51c5da07e3b2cec69eeacaac69e23daa1c8`. Research/evidence revision only; no content approval, implementation, merge or deployment authorization.

**Verdict: changes required before content approval.** Quantity and the P3 lock are correct, but the source-to-leaf map misses current P2/P3 requirements and the bank does not assess important visual interpretation. The previous arithmetic correction does not resolve these coverage issues.

Snapshot: 303 questions (153 P2 + 150 P3), 101 three-question target sets, all four-option MCQ, no material/diagram assets. All P3 curriculum topics remain `pilot: locked`; retain that boundary.

#### Method and evidence limits

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-1).

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-2).

#### Content findings

##### MA1 — Correct the current grade-level inventory and add missing checks (blocking)

MOE pp33–36 were actually retrieved, not inferred from a school index. Required corrections:

| Official leaf | Current bank evidence | Required next revision |
| --- | --- | --- |
| P2 odd/even, p33 §1.6 | No P2 odd/even target; only `ma.p3.odd-even` | Add a P2 target/pool; P3 may retain revision |
| P2 decimal money ↔ cents, p33 §1.4 | Counting, notation and comparison exist; `money-notation.q3` only splits dollars/cents, not conversion to total cents | Add both conversion directions and map the leaf explicitly |
| P2 clock reading to the minute, p34 §2.1 | Manifest says five minutes; `ma.p2.time-read` uses 15/45/30 minutes | Correct label; add non-five-minute clock stimuli and keys |
| P3 24-hour clock, p36 §2.3 | Absent from `ma.p3.time*` targets | Add conversion/reading and contextual checks, keep P3 locked |

Do not silently treat old paper/enrichment conventions as the updated syllabus. School topic headings do not settle these finer requirements.

##### MA2 — Restore the representation that the skill requires (blocking for coverage claims)

`ma-p2-mass-scale.q1` states the pointer value; `ma-p2-length-ruler` gives endpoints in words; `ma-p3-bar-read.q1` states the bar height. These can check arithmetic, but cannot establish reading an unseen scale, ruler or graph. Clock hands, angle/line diagrams, 3D shape views and scaled picture/bar graphs need reviewed stimuli. Text may validly render a representation, but it must actually present it rather than disclose the measured value. No asset/diagram records currently supply this evidence.

MOE requires drawing perpendicular/parallel lines. Objective selection can assess recognition/error checking; it cannot certify the drawing skill. Record drawing as external/partial in the leaf map, consistent with the Pilot’s selected-answer constraint. Do not reopen input/drawing implementation to conceal the gap.

##### MA3 — Replace topic-level completion with leaf evidence (blocking for release calculation)

29 topic records, of which 27 have question pools, are not 29 equally weighted MOE outcomes. Split each official leaf, distinguish retained earlier skills/enrichment, and attach assessed representation, course, stage pools and review status. Three questions on a target provide thin initial stock, not three sufficiently varied pools for arbitrary imported mistakes. Prefer fresh alternatives and record reuse; do not claim comprehensive transfer evidence from a numeric reskin alone.

The prior numeric/semantic corrections remain useful; no new question edits or runtime changes are made by this audit. All answers and explanations still require a final signed content review, particularly visuals once authored.

#### Official and public-school sources

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-3).

- [MOE Mathematics, updated October 2025](https://www.moe.gov.sg/api/media/92bff26d-b2b4-4535-b868-b8415c744b91/2021-Primary-Mathematics-Syllabus-P1-to-P6-Updated-October-2025.pdf). Actual PDF retrieved and inspected: P2 PDF/printed pp33–34; P3 pp35–36. SHA-256: `e8f77fe10d768e2ad5266dfc39a8821674be7eb1c81bc545ba4b841b12ae70e1`.

| School document | Pages examined / use | SHA-256 |
| --- | --- | --- |
| [ws-p2-2026-2](https://isomer-user-content.by.gov.sg/817/de41114b-6ca4-4934-bca0-b5657080dd85/03_2026_Curriculum_Briefing_Mathematics_P2.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p2/) | 4, 8: P2 yearly topics and concrete real-world measurement/fraction activities. Fine official limits must still come from MOE. | `13c980dab0708a1e0f9c08332c8514b85d7f57d6de7f72518d207c28a7b5b767` |
| [ws-p3-2026-2](https://isomer-user-content.by.gov.sg/817/f9d67595-5d02-4a98-bbd1-f0a7ffa2e782/03_2026_Curriculum_Briefing_Mathematics_P3.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p3/) | 3–4: P3 topics and activity-based teaching. The slide’s truncated addition/subtraction range is not a substitute for MOE’s 10,000 limit. | `d356de25d1218465d41a0bd88731c96c7386b8139929bae246a0424fc824a88f` |

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-4).

#### Curriculum-to-bank inventory

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

#### Actual paper research, 2021–2026

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-5).

| Course | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
| --- | --- | --- | --- | --- | --- | --- |
| p2 maths | Retrieved | Retrieved | Retrieved | Retrieved¹ | Retrieved | Not retrieved |
| p3 maths | Retrieved | Retrieved | Retrieved | Retrieved¹ | Retrieved | Not retrieved |

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-6).

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-7).

##### p2_maths-2021

- Identity/date: ACS Junior, non-weighted BA2; cover 2021.
- Source: [public paper listing](https://sgexam.com/subject/maths/2021-p2-maths-bite-sized-assessment-2-acsj-pdf/); 9 PDF pages.
- Analysis page anchors: 1–2, 4, 7. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Multiplication/division and addition/subtraction word problems; MCQ and short/structured responses. Assessment is a subset of yearly scope.
- SHA-256: `530607f50707ed0c48b72ed851a5452473028856d8b0cee11c2f2d1f4616cf54`.

##### p2_maths-2022

- Identity/date: Tao Nan, Review 2; cover and answer-sheet 2022.
- Source: [public paper listing](https://sgexam.com/subject/maths/2022-p2-maths-holistic-assessment-2-tao-nan-pdf/); 16 PDF pages.
- Analysis page anchors: 1–2, 5–7, 11–16. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Selected/short responses, scaled measurement, time and multi-step problems. Answer sheet names Tao Nan; not Raffles Girls’. Public scans are not authenticated school releases.
- SHA-256: `c7b50e8bd60a952b3295416e47649966afa70681fc5bbc3610545e00ceefef83`.

##### p2_maths-2023

- Identity/date: Pei Hwa Presbyterian, SA2; catalogue 2023.
- Source: [public paper listing](https://sgexam.com/subject/maths/2023-p2-maths-semestral-assessment-2-pei-hwa-pdf/); 24 PDF pages.
- Analysis page anchors: 1, 3–9, 15–20. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: MCQ, short responses and structured word problems; models and diagrams are substantive stimuli, not optional decoration.
- SHA-256: `95b189f233ae4b8e2fc2aa7d0b453c41399e7d1171c15ee627700f513defc3b1`.

##### p2_maths-2024

- Identity/date: Raffles Girls’, supplementary worksheets; catalogue 2024.
- Source: [public paper listing](https://sgexam.com/subject/maths/2024-p2-maths-quiz-1-and-2-raffles-girls-pdf/); 28 PDF pages.
- Analysis page anchors: 1–4, 9–12. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Cover is a volume worksheet, not the advertised quiz cover. No internal year established; use as format evidence only, not a certified 2024 exam.
- SHA-256: `14b23a1c7e3a49276f0d03c4b00ef33002eaac4dbd2ef60c8ae150975d106acb`.

##### p2_maths-2025

- Identity/date: Henry Park, Quiz 2; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/maths/2025-p2-maths-quiz-2-henry-park-pdf/); 12 PDF pages.
- Analysis page anchors: 1–8. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Multiplication/division representations, missing quantities and word problems; mixed selected/short responses. This single quiz cannot establish all P2 outcomes.
- SHA-256: `c2e299d5765d3748e6593f92b70b79baf31935b3fb654a23e48acd1d85d4faa8`.

##### p3_maths-2021

- Identity/date: ACS Junior, BA2; cover 2021.
- Source: [public paper listing](https://sgexam.com/subject/maths/2021-p3-maths-bite-sized-assessment-2-acsj-pdf/); 9 PDF pages.
- Analysis page anchors: 1–7. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Short assessment combining MCQ, short answers and structured problems; not complete yearly coverage.
- SHA-256: `38343744049dd69d2e44c3ef9fdab1c5cd2b6b819a35b1ef58cf59a19a46edaa`.

##### p3_maths-2022

- Identity/date: ACS Junior, SA2; cover 2022.
- Source: [public paper listing](https://sgexam.com/subject/maths/2022-p3-maths-semestral-assessment-2-acs-junior-pdf/); 26 PDF pages.
- Analysis page anchors: 1, 3–10, 18–22. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: MCQ and short/structured responses across number, measurement and problem solving; visual representations recur.
- SHA-256: `6832cf8b120645a6aff53844e14c60def0c2c1602f6df5ea1e7948416e10cf6c`.

##### p3_maths-2023

- Identity/date: ACS Primary, EOY; cover 2023.
- Source: [public paper listing](https://sgexam.com/subject/maths/2023-p3-maths-end-of-year-exam-acsp-pdf/); 26 PDF pages.
- Analysis page anchors: 1, 3, 9, 18–21. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: MCQ, short answers and structured problems; course-level labels alone do not prove the current leaf-outcome inventory.
- SHA-256: `217f1207a1110dc57f27ebbd7ff3016cc02268359beb5528f260d07a2bc1f218`.

##### p3_maths-2024

- Identity/date: ACS Junior, BA2; catalogue 2024.
- Source: [public paper listing](https://sgexam.com/subject/maths/2024-p3-maths-bite-sized-assessment-2-acs-junior-pdf/); 11 PDF pages.
- Analysis page anchors: 1–8. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Cover has no legible printed year. Thirteen-question assessment, not a full syllabus census; retain advertised-year uncertainty.
- SHA-256: `a3ad73ba7df759bb139f79f0d6ee438b7e878ed772e90448cb83e6662fe183cb`.

##### p3_maths-2025

- Identity/date: ACS Junior as catalogued, EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/maths/2025-p3-maths-end-of-year-exam-acs-junior-pdf/); 20 PDF pages.
- Analysis page anchors: 1, 4, 10, 14. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: PDF p4 Q4 uses 24-hour time; p10 Q19 requires a parallel line through a point. Geometry, clock and graph interpretation need actual representations in the app.
- SHA-256: `deb8c632c9ff8116f340b212aecc86e60119f6c0515da1891b69a5a995f592f8`.

##### p3_maths-2025-extra-tao-nan

- Identity/date: Tao Nan, EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/maths/2025-p3-maths-end-of-year-exam-tao-nan-pdf/); 16 PDF pages.
- Analysis page anchors: 1–13. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: 25 questions: 10 MCQ, 10 short, five structured. Scales, angles, parallel-line drawing, equivalent fractions, duration and composite area/perimeter provide independent corroboration.
- SHA-256: `cd6117a595870657771b785fea3b1890c40d7da3e6d5541450747f975e0c4f79`.

##### Second-host 2022 bundle — mathematics

[SmileTutor public listing](https://smiletutor.sg/free-test-papers-download/primary-school-exam-papers/): 53 pages downloaded; **only PDF pp1–8 inspected/OCR processed**. The first packet is Maha Bodhi Review 1. PDF pp3–8 show place value, missing numbers, model choice, cube counting and structured comparison problems. Distinguish reading a supplied model from calculating values disclosed in prose.

SHA-256: `cffdaa012c6840dab0e1efbdf387384ee5832c4c3ccfc6780f0a985f23ec6d0d`. Full bundle content/keys were not audited.

#### Dated enrichment research, 2024–2026

| Public source | Date evidence | What was actually retrieved | Use / limit | SHA-256 |
| --- | --- | --- | --- | --- |
| [maths-2024](https://www.agrader.sg/post/5-top-mistakes-to-avoid-in-math-primary-2-mass-and-length-topics) | 2024-06-09 published; 2026 modification | Public instructional article | Length/mass unit and scale-reading errors support the need for actual measurement representations. | `a6572948993efa9e178e6cda255da24305307883e94f35950e895ac49347b7db` |
| [maths-2025](https://www.agrader.sg/post/area-and-perimeter-tips-and-tricks-for-primary-3-students-to-excel) | 2025-05-29 | Public instructional article/examples | P3 area/perimeter teaching includes visual composite reasoning; do not imply that arithmetic with stated dimensions covers all diagram skills. | `a2c53a78a998b9554ae7cb289a3ce17b90d5291fcbad7044ca4dc097702240e0` |
| [maths-2026](https://practicle.sg/primary-2-math/) | 2026-01-05 metadata; page explicitly labelled 2026 | Public guide/examples | P2 topic guide includes time to the minute, agreeing with the current official syllabus. Vendor alignment claims are not independently sufficient. | `9e74af650f15555ee9adebaee7324669288ad0075365d776f41425dbac77c605` |

Rejected as current-scope authority: [Gifted Questions P2 page](https://www.giftedquestions.com/primary-2-maths-worksheets/) (displayed June 2024) retains an older five-minute time description and links older product material. It was not counted as a retrieved current question set. This illustrates why date alone is insufficient.

#### Originality, rights and reproducibility

The app content is labelled original author draft. A bounded exact-overlap check compared every app material body and question stem against the retrieved same-subject paper OCR/text: 12 text files, 12 consecutive alphabetic words, case/punctuation normalised. **No threshold-length exact match was found.** This can miss paraphrases, OCR errors, shorter copying, images and sources outside the sample. It is not proof of originality, permission or copyright clearance. Common grammar/number templates are not by themselves evidence of copying. Retain pending rights/independent review/owner sign-off until the project’s review gates are satisfied.

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-8).

#### Disposition and next revision

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-9).

[Shared audit method and limits](RESEARCH_METHOD_2026-10-16.md#audit-method-10).