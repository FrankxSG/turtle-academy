# Mathematics content pool (P2-P3)

Independent public-source research and original findings: [research audit](content-review/MATHEMATICS_RESEARCH_AUDIT.md) (2026-10-16). The review disposition below records subsequent corrections; the historical audit remains evidence, not batch approval.

**Review disposition — 17 October 2026:** Independent re-review of `cba8714` closes the encoded-external-reference SVG finding. Decoded attribute checks reject the original decimal/hex-encoded URL, style, protocol, data-URI and CSS-escape probes; literal or encoded same-file references remain allowed. All six shared test methods and the subject validator pass. Questions and diagrams are unchanged from the prior content review. No open blocker from this correction remains for merging preparation work; this is not owner merge authorization or approved shipping content. MA3's source-complete inventory and known mental two-digit addition/subtraction gap remain pending, together with full item QA, owner disputed-item review/random 20% sample, batch sign-off and coverage approval. P3 Mathematics remains locked in the Pilot.

**Review proposal · 16 October 2026 · generic/public content pool**

Original P2 and P3 Mathematics questions for the public (generic) version of Turtle Academy, mapped to the Singapore primary syllabus with public sources cited. P2 content is open in the Pilot; **P3 content is authored now but stays locked in the Pilot app** until the post-Pilot Mathematics teaching flow exists (Functional Design §1). This document does not authorize implementation, release, merge or deployment.

## 1. What is in this pool

- `content/mathematics/curriculum.json`: 29 topic records with scope and Pilot status, 111 leaf records (assessed ability, representation, scope, MOE page reference) and cited sources.
- `content/mathematics/pool-001.json` (batch version 3): 321 original questions (P2 165, P3 156), 0 materials, 107 three-stage repair sets (exact → similar → generic).
- `content/mathematics/assets/`: 65 original SVG diagrams referenced by items or materials (no scripts, links, images or external references; titles and alt text describe the picture without giving the answer).
- `scripts/validate_subject_content.py`: structural checks (IDs, keys, 4+ distinct options, topic/source/leaf references, complete repair sets with one leaf mapping, repair routes for every non-repair question when leaves are declared, diagrams present for visual leaves, knowledge-point links and acyclic prerequisites, SVG safety, hints that do not state the answer).

Every question is newly written for this project. No question, passage or figure was copied from any past paper, school document or commercial resource. Status: **author-checked, pending independent review and owner sign-off**; not a content release.

## 2. Sources cited

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

| Topic | Grade | Scope | Pilot | Leaves | Repair sets | Questions |
| --- | --- | --- | --- | ---: | ---: | ---: |
| Numbers to 1000: place value, reading/writing, comparing, ordering, patterns, odd and even (`ma.p2.numbers-1000`) | P2 | in_app | open | 6 | 6 | 18 |
| Addition and subtraction within 1000, including regrouping and missing numbers (`ma.p2.add-sub-1000`) | P2 | in_app | open | 4 | 4 | 12 |
| Multiplication and division: equal groups, repeated addition, sharing and grouping (`ma.p2.multiplication-division`) | P2 | in_app | open | 4 | 4 | 12 |
| Multiplication tables of 2, 5 and 10 (`ma.p2.tables-2-5-10`) | P2 | in_app | open | 3 | 3 | 9 |
| Multiplication tables of 3 and 4 (`ma.p2.tables-3-4`) | P2 | in_app | open | 2 | 2 | 6 |
| Word problems (up to 2 steps) for the four operations (`ma.p2.word-problems`) | P2 | in_app | open | 3 | 3 | 9 |
| Fractions: part of a whole, comparing/ordering unit and like fractions, adding/subtracting like fractions within one whole (`ma.p2.fractions`) | P2 | in_app | open | 6 | 6 | 18 |
| Money: counting, decimal notation, converting between dollars and cents, adding/subtracting in dollars only or cents only (`ma.p2.money`) | P2 | in_app | open | 6 | 6 | 18 |
| Length in m and cm: measuring, comparing, word problems (`ma.p2.length`) | P2 | in_app | open | 4 | 4 | 12 |
| Mass in kg and g: measuring, comparing, word problems (`ma.p2.mass`) | P2 | in_app | open | 4 | 4 | 12 |
| Volume of liquid in litres: measuring, comparing, word problems (`ma.p2.volume`) | P2 | in_app | open | 3 | 3 | 9 |
| Time: telling time to the minute, a.m./p.m., hours and minutes, duration (`ma.p2.time`) | P2 | in_app | open | 4 | 4 | 12 |
| 2D shapes (incl. semicircle, quarter circle), 3D shapes, patterns, composing figures (`ma.p2.shapes`) | P2 | in_app | open | 4 | 4 | 12 |
| Picture graphs with scales (`ma.p2.picture-graphs`) | P2 | in_app | open | 2 | 2 | 6 |
| Numbers to 10 000: place value, comparing, ordering, patterns, odd and even (`ma.p3.numbers-10000`) | P3 | in_app | locked | 5 | 5 | 15 |
| Addition and subtraction within 10 000 (`ma.p3.add-sub-10000`) | P3 | in_app | locked | 2 | 2 | 6 |
| Multiplication tables of 6, 7, 8 and 9 and related division (`ma.p3.tables-6-9`) | P3 | in_app | locked | 6 | 6 | 18 |
| Multiplication and division up to 3 digits by 1 digit, with remainder (`ma.p3.multiplication-division`) | P3 | in_app | locked | 4 | 4 | 12 |
| Word problems with the four operations, including comparison models (`ma.p3.word-problems`) | P3 | in_app | locked | 3 | 3 | 9 |
| Money in decimal notation: adding, subtracting, word problems (`ma.p3.money`) | P3 | in_app | locked | 3 | 3 | 9 |
| Equivalent fractions; comparing/ordering unlike fractions; adding/subtracting related fractions within one whole (`ma.p3.fractions`) | P3 | in_app | locked | 5 | 5 | 15 |
| Length (km, m, cm), mass (kg, g), volume (l, ml): compound units and conversion (`ma.p3.length-mass-volume`) | P3 | in_app | locked | 4 | 4 | 12 |
| Time: seconds, 24-hour clock, duration, start and end times, conversion (`ma.p3.time`) | P3 | in_app | locked | 6 | 6 | 18 |
| Area and perimeter: square units, rectangles and squares (`ma.p3.area-perimeter`) | P3 | in_app | locked | 6 | 6 | 18 |
| Angles: right angles, comparing angles (`ma.p3.angles`) | P3 | in_app | locked | 3 | 3 | 9 |
| Perpendicular and parallel lines (`ma.p3.perpendicular-parallel`) | P3 | in_app | locked | 3 | 2 | 6 |
| Bar graphs: reading, interpreting, completing (`ma.p3.bar-graphs`) | P3 | in_app | locked | 4 | 3 | 9 |
| Performance tasks, investigations, journals and explaining reasoning in words (`ma.p2.investigation`) | P2 | external | open | 1 | 0 | 0 |
| Structured/long-answer questions with full written workings (`ma.p3.long-answer-workings`) | P3 | partial | locked | 1 | 0 | 0 |

## Correction revision — 16 October 2026

Batch version 2 corrects `ma-p2-fraction-subtract.q3`: both fractions now refer to the full tank, so the keyed 6/12 follows by like-fraction subtraction. Its hint and explanation use that same whole. The item version is incremented and remains listed for independent re-review. Counts remain P2 153/P3 150; every P3 topic remains locked. The separate time-curriculum gaps (P2 minute reading and P3 24-hour clock), official leaf audit and dated paper/enrichment evidence remain open; this item correction does not resolve those findings.

These are proposed corrections, not independent approval. Existing task/history must retain earlier pinned versions; this authoring revision does not implement evidence migration or retroactive regrading.

## Audit-response revision — 16 October 2026 (batch version 3)

Responds to [MATHEMATICS_RESEARCH_AUDIT.md](content-review/MATHEMATICS_RESEARCH_AUDIT.md) MA1–MA3. Author revision only: every revised or new item is pending independent re-review and owner sign-off.

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

## Validation

```sh
python3 scripts/validate_subject_content.py mathematics
python3 scripts/privacy_guard.py
```

Passing validation proves structure only. Remaining before release: independent review of every item, random 20% sample of agreed items, owner batch sign-off, verification of topic boundaries against the official MOE syllabus PDF, and the existing Pilot coverage, data-protection and device gates. No learner data is used or implied by any item.

## Re-review corrections — 17 October 2026

Responds to the independent re-review of `280dd4d`. No questions or diagrams changed.
- **Shared SVG guard.** Attribute values are now checked after XML decoding. Encoded `url(` and `https`, protocol-relative values, `data:` and CSS escapes are rejected, while same-file `url(#id)` stays allowed (the re-review accepted that policy). The re-review's encoded probes are failing tests. The validator and tests are identical in #13, #14 and #15.

Still open: the MA3 source-complete inventory, deferred to the next round. That includes the known gap in mental addition and subtraction of two 2-digit numbers, which will be filled with new questions. Also open: item QA, the 20% sample and owner sign-off. P3 Mathematics stays locked in the Pilot.
