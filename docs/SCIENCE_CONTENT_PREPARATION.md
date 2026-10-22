# Science content pool (P3)

Independent public-source research and original findings: [research audit](#research-audit) (2026-10-16). The review disposition below records subsequent corrections; the historical audit remains evidence, not batch approval.

**Review disposition — 17 October 2026:** Independent re-review of `6babcfa` closes the encoded-external-reference SVG and stale-version findings. The plant-stage explanation is item v3, the corrected fungi asset is v2, the timeline question's copy cleanup is v3, and the pool is v4; the readable item review agrees. The earlier scientific corrections remain accepted. All six shared test methods and the subject validator pass. No open blocker from this correction remains for merging preparation work; this is not owner merge authorization or approved shipping content. SC4's source-complete inventory, full item QA, owner disputed-item review/random 20% sample, batch sign-off and coverage approval remain pending. The guided-observation/teaching/two-independent-tests flow still requires application acceptance testing.

**Review proposal · 16 October 2026 · generic/public content pool**

Original P3 Science content for the public (generic) version of Turtle Academy, covering the seven P3 topics of the 2023 MOE Primary Science syllabus, with public sources cited. Primary Science starts at P3, so there is no P2 pool. This document does not authorize implementation, release, merge or deployment.

## 1. What is in this pool

- `content/science/curriculum.json`: 10 topic records with scope and Pilot status, 41 leaf records (assessed ability, representation, scope, MOE page reference) and cited sources.
- `content/science/pool-001.json` (batch version 4): 180 original questions (P3 180), 36 materials, 36 three-stage repair sets (exact → similar → generic), 72 non-repair questions with a declared repair route, 36 knowledge points.
- `content/science/assets/`: 51 original SVG diagrams referenced by items or materials (no scripts, links, images or external references; titles and alt text describe the picture without giving the answer).
- `scripts/validate_subject_content.py`: structural checks (IDs, keys, 4+ distinct options, topic/source/leaf references, complete repair sets with one leaf mapping, repair routes for every non-repair question when leaves are declared, diagrams present for visual leaves, knowledge-point links and acyclic prerequisites, SVG safety, hints that do not state the answer).

Every question is newly written for this project. No question, passage or figure was copied from any past paper, school document or commercial resource. Status: **author-checked, pending independent review and owner sign-off**; not a content release.

## 2. Sources cited

| ID | Type | Source | Used for |
| --- | --- | --- | --- |
| `moe-sc-2023` | MOE official | [MOE Primary Science Syllabus 2023 (May 2024 revision)](https://www.moe.gov.sg/-/media/files/primary/syllabus/primary-science-syllabus-2023_may24.pdf) (accessed 2026-10-16) | Authoritative P3 themes, topics and learning outcomes. _Official MOE file; direct retrieval was blocked from the authoring environment, so content was cross-checked against school documents that follow it. Verify against the PDF during inventory audit._ |
| `junyuan-sc-p3-2026` | School (public) | [Jun Yuan Primary: 2026 P3 Science briefing](https://www.junyuanpri.moe.edu.sg/files/2026_P3_SCI.pdf) (accessed 2026-10-16) | P3 topic list under the 2023 syllabus; magnet repulsion test as key concept. |
| `rivervale-sc-p34-2025` | School (public) | [Rivervale Primary: 2025 P3/P4 Science subject sharing](https://rivervalepri.moe.edu.sg/files/6__2025_P34_subject_sharing_SC.pdf) (accessed 2026-10-16) | P3 vs P4 topic split by theme. |
| `tnps-sc-p3-2026` | School (public) | [Tampines North Primary: 2026 P3 Science Scheme of Work Outline](https://www.tampinesnorthpri.moe.edu.sg/files/2026_P3_Science_SOW_Outline.pdf) (accessed 2026-10-16) | P3 topic order by term. |
| `bpps-sc-p3-2026` | School (public) | [Bukit Panjang Primary: Meet & Greet P3 Science Sharing 2026](https://www.bukitpanjangpri.moe.edu.sg/files/Meet___Greet_P3_Science_Sharing_with_Parents_2026.pdf) (accessed 2026-10-16) | Common misconceptions (magnet attraction vs repulsion); Claim-Evidence-Reasoning answering. |
| `cedar-p3-2025` | School (public) | [Cedar Primary: P3 Curriculum Briefing 2025](https://www.cedarpri.moe.edu.sg/files/Parent%20Engagement/2025%20P3%20Engagement/3__14_mar_p3_curriculum_briefing_2025.pdf) (accessed 2026-10-16) | P3 topic order by term; WA and EOY format (MCQ 2 marks each, open-ended). |
| `jwps-p3-2025` | School (public) | [Jurong West Primary: 2025 P3 Assessment Overview, Topics and Components](https://www.jurongwestpri.moe.edu.sg/files/JWPS_2025_P3_Assessment_Overview__Topics_and_Components_.pdf) (accessed 2026-10-16) | P3 EOY themes and practical-test process skills. |
| `smiletutor-papers` | Past-paper index | [SmileTutor: primary school exam papers index](https://smiletutor.sg/free-test-papers-download/primary-school-exam-papers/) (accessed 2026-10-16) | Format survey of P3 Science papers (2022 within range); no questions copied. _Site states copyright; used for format analysis only._ |
| `scs-zooms` | Enrichment | [Science Centre Singapore: SCS Zooms to School programme](https://www.science.edu.sg/for-schools/specialized-programmes/scs-zooms-to-school) (accessed 2026-10-16) | Enrichment context: hands-on science programmes for schools. |
| `onepa-sc-p34` | Enrichment | [OnePA: Science for Primary 3/4 community courses](https://www.onepa.gov.sg/courses/science-for-primary-3-4-c027241447) (accessed 2026-10-16) | Enrichment context: community P3/P4 science classes. |

## 3. Structure: learn, test, repair

Each knowledge point follows the Pilot Science flow (Functional Design §5):

1. **Teaching card** (`*-learn` material): a short explanation of one small knowledge point. Teaching does not count toward X and creates no error-bank evidence.
2. **Two acquisition tests** (the card's two questions) in different contexts. Both first-correct enter spaced review; either wrong triggers repair. No same-day pass after answer-revealing help.
3. **Three-stage repair set** (exact → similar → generic) used when an acquisition test or later review is wrong.

The current pool includes the SVG diagrams referenced below. Short animations remain unimplemented; authoring illustrations does not establish application acceptance.

## 4. Assessment formats observed (public school documents)

- Weighted assessment: 8 MCQ at 2 marks each plus 4-5 open-ended questions (`cedar-p3-2025`); EOY: 21 MCQ at 2 marks and 9-10 open-ended (`cedar-p3-2025`), or 15 MCQ / 30 marks and 6-7 open-ended / 20 marks (`jwps-p3-2025`).
- A practical test (observing, measuring, classifying) is used by some schools (`jwps-p3-2025`); kept external.
- Open-ended answers use Claim-Evidence-Reasoning (`bpps-sc-p3-2026`); written explanations stay external, but the objective items ask pupils to pick the claim plus reason.

## 5. Past-year paper survey (2021-2026)

SmileTutor lists P3 Science papers, with 2022 the only year in range (`smiletutor-papers`); it asserts copyright and states no reuse licence, so **no paper or question is reproduced**. The survey informed question styles only: classifying organisms by observable features, choosing materials for a purpose, interpreting simple fair-test set-ups (germination, magnet strength) and identifying the next or missing life-cycle stage.

## 6. Misconceptions targeted

- Attraction does not prove an object is a magnet; only repulsion does (`junyuan-sc-p3-2026`, `bpps-sc-p3-2026`) — dedicated knowledge point `test-magnet`.
- "All metals are magnetic" (aluminium and copper distractors).
- Fire or robots being living; bats and whales not being mammals; spiders being insects; penguins not being birds.

## 7. Enrichment context (2024-2026)

Schools encourage visits and hands-on programmes such as Science Centre Singapore (`junyuan-sc-p3-2026`, `scs-zooms`) and community classes (`onepa-sc-p34`). Cited for context only; no enrichment content is copied.

## Topic coverage in this pool

Generate the current topic/leaf/repair counts and complete item/material view with `python3 scripts/content_review.py`; open `reports/content/index.html`. The JSON's version, status, review log, sources and limitations are included in each report. Authored mappings are not approved coverage.

## Historical corrections

The dated revisions below retain the defects, source interpretations and dispositions that inform authoring. Their old counts, pending states and implementation claims apply to those revisions, not current capabilities; use the current JSON and [README](../README.md). Shared human QA requirements are in [CONTENT_QA](CONTENT_QA.md).

## Correction revision — 16 October 2026

Batch version 2 corrects six items and two teaching cards. The flexibility question now supplies equal strip dimensions, the same load and measured bending without breakage; the conclusion no longer depends on which strip breaks first. Nickel/cobalt recall is removed from the teaching card and affected options. The induced-paper-clip acquisition question is replaced by an observed on/off electromagnet example; the related permanent-magnet distractor no longer relies on induction. These changes follow the exclusions on PDF p63 / printed p62 of the [official syllabus updated January 2026](https://www.moe.gov.sg/api/media/ba3562d3-5b31-4459-8693-45cde7b97273/Primary-Science-Syllabus-2023.pdf); electrical magnet-making remains included. A hint that directly named steel is also replaced. Revised item/material versions are incremented and revised item IDs remain listed for re-review. The explicit learning-unit/acquisition-to-repair links, prerequisite graph, observation activities/assets, complete curriculum/source audit and owner sign-off remain open.

Existing tasks retain their pinned versions; these authoring revisions do not implement evidence migration or retroactive regrading.

## Audit-response revision — 16 October 2026 (batch version 3)

Responds to [SCIENCE_RESEARCH_AUDIT.md](#research-audit) SC1–SC4. Author revision only: every revised or new item is pending independent re-review and owner sign-off. Counts are unchanged at 180 questions and 36 knowledge points.

| Finding | Change in this batch | Still open |
| --- | --- | --- |
| **SC1** germination and seed parts (P5) | Owner decision: replace. The `germination` and `seed-parts` knowledge points (10 questions and 2 cards) are removed. They are replaced by two P3 observation points: `plant-growth-observe` (reading height and leaf records) and `plant-cycles-timeline` (comparing when stages appear). The plant-stages card now treats a seedling as an early young plant, uses the three broad stages and is observation-based. Two remaining distractors that used P5 or non-core terms were replaced. A `deferred` leaf records the P5 content. | Independent review of the new items |
| **SC2** hardness | Owner decision: replace. `strength-hardness` becomes `strength` (card, 2 acquisition tests and 3 repair items). All test strength through a fair, same-size strip test. A `deferred` leaf records hardness as outside the listed P3 properties. | — |
| **SC3** observation, links and prerequisites | Every one of the 36 teaching cards (now `kind: teaching`) has an original observation diagram or table: feature tables, life-cycle diagrams, insect and spider body plans, plant stages, and strength, bending, water, light, floating and magnet set-ups. Seven classification items that relied on recalling a named species now ask learners to classify from a feature table. `knowledge_points` link each card to its two acquisition tests, its repair target and its prerequisites (acyclic, checked by the validator). Every acquisition item has a `repair_target_id`. | Short animations are still not authored. The diagrams need an independent visual check. |
| **SC4** release denominator | `curriculum.json` has one leaf per knowledge point, plus deferred or external leaves (germination/reproduction, hardness, written CER, practical, P4). The first two topics have 4 + 7 in-app leaves. Magnet making by stroking and by electricity stays in P3 (PDF p63). | This is an author working map. It needs independent page verification before the 75% guideline is computed. |

## Re-review corrections — 17 October 2026 (batch version 4)

Responds to the independent re-review of `7889eb3`, which accepted the fungi, plant-stage and related wording fixes.
- **Version identities.** Every changed record now has a new version. `sc-p3-plant-stages.q1` is v3, because its explanation changed in the previous round. The corrected fungi card asset is v2. `sc-p3-plant-cycles-timeline-learn.q2` is v3. The pool is version 4.
- **Wording.** The timeline question's last option now reads "none of these", matching its observation wording.
- **Shared SVG guard.** Attribute values are now checked after XML decoding. Encoded `url(` and `https`, protocol-relative values, `data:` and CSS escapes are rejected, while same-file `url(#id)` stays allowed. The re-review's encoded probes are failing tests.

Still open: the source-complete inventory (deferred to the next round), item QA, the 20% sample and owner sign-off.


<a id="research-audit"></a>

## Research audit — 2026-10-16

Historical source evidence and findings, retained in full below. The preparation/review dispositions above record later corrections; this audit's old verdict and counts are not current approval status. The identifier `SCIENCE_RESEARCH_AUDIT` is retained for existing source references.

### Science — independent public-source research and content audit

Audit date: **2026-10-16**. PR **#14**, reviewed head `4dee7c44d83c0f3e4d25f059163034e15daed1c8`; base `main` at `dc3ed51c5da07e3b2cec69eeacaac69e23daa1c8`. Research/evidence revision only; no content approval, implementation, merge or deployment authorization.

**Verdict: changes required before content approval.** The seven selected P3 areas are represented broadly, but the current official syllabus contradicts treating germination processes as P3 core. The bank also needs observable evidence, actual acquisition/repair mappings and prerequisites before it can drive the agreed learning flow.

Snapshot: 180 P3 questions, 36 text teaching cards, 72 acquisition questions (two per card), 108 repair questions (36 targets × three stages). No P2 Science is invented. Initial-release coverage concerns the first two selected topics; writing 180 questions across seven broad areas does not demonstrate that release threshold.

#### Method and evidence limits

The reviewer independently retrieved public official PDFs, navigated current public school sources, downloaded actual historical paper packets, and examined dated enrichment. This is additional research beyond the previous targeted key corrections and the PR author’s source list. Paper text/OCR was processed across the individual packets; representative question pages, headings and selected rendered pages were examined for skills, response demand and date/course identity. External answer schemes were not assumed correct. The work is a source/scope/coverage audit with targeted item findings, not a second human marking of every external question or signed educator approval of every app key.

The four audits together use **50 retrieved paper/bundle files**: 47 individual/combined packets and three second-host bundles. Files/hosts may overlap in underlying papers. Only eight pages of each large second-host bundle were examined; there is no claim to have manually audited the complete bundles. Public hosting is not a reuse licence or authentication of a school-issued paper. No source scans, passages, question text, images or answer sheets are added to the repository. No private worksheets or learner data were used.

#### Content findings

##### SC1 — Remove unqualified later-grade requirements from P3 core (blocking)

MOE PDF p43 / printed42 explicitly locates plant reproduction processes, including germination, in P5; P3 focuses on observing and comparing seed → young plant → adult plant stages. PDF p44 confirms the P5 reproduction area. The five `sc-p3-germination*` items require conditions, stored food or germination experiments. The five `sc-p3-seed-parts*` items require seed coat/seed leaves/root details without an established current P3 core basis. Reclassify or replace these ten questions and related teaching; do not let them count towards P3 core coverage or gate dependent core learning. Observing a growing seed is still appropriate P3 activity; the issue is the knowledge required to pass.

`sc-p3-plant-stages-learn.q1` presents seedling and young plant as separate compulsory stages, while the syllabus uses three broad stages. Clarify seedling as an early young plant; review `plant-stages-learn.q2` / `plant-stages.q2` for observation versus required reproduction knowledge. This is not a claim that fruit/seeds cannot be observed in P3.

Some internally labelled P3 papers include germination, including the 2025 sample. That is evidence of school exam practice, not permission to override the current official core boundary. Older 2022 papers also include current P4 systems topics.

##### SC2 — Separate required properties from extensions (blocking for scope accuracy)

MOE PDF pp40–41 lists strength, flexibility, float/sink, waterproofing and light transmission. Hardness is not one of these required properties. `sc-p3-strength-hardness-learn.q2`, `.q1` and `.q3` of the repair target assess hardness. Separate them from core strength and remove the mixed target’s false appearance of a complete three-stage core pool. Strength questions about supported load remain in scope. Likewise, scientific terminology or enrichment facts may be offered only as labelled extension, not counted as required P3 evidence.

##### SC3 — Supply observable evidence and formal learning links (blocking before engine use)

The 36 cards are explanatory text with immediate selected questions, not the agreed picture/short-animation observation, comparison or classification activity. Most acquisition items have `target_id: null`; matching a card ID prefix to a repair target is an undocumented inference. There is no explicit knowledge-point graph, prerequisite edge set or assessed-ability/error-type model in this batch. Add/compile these contracts, two distinct-context independent tests and reviewed observation assets before using acquisition success/failure to unlock learning. Teaching and supported formative choices remain outside X.

For classification, MOE PDF p39 says recall of individual species and their characteristic facts is not required. Provide features/pictures/tables to infer groups; do not use memorised animal facts as the sole evidence of the classification outcome. Selected answers can assess evidence use and fair-test decisions without introducing free-text scoring.

##### SC4 — Rebuild the release denominator (blocking for release claims)

The seven broad areas are a workable organisation, not a leaf-outcome denominator. Map core ideas and practices separately; show reviewed observation/test/repair evidence for the first two areas before computing their 75% guideline. Later five areas need their own reviewed order and prerequisites. Keep P4 topics deferred, no P2 course, and retain magnet making by both stroke and electrical methods: MOE PDF p63 places these in P3. Nickel/cobalt recall, shielding and induction are not required. This audit does not undo the earlier corrections that removed those unsupported demands.

#### Official and public-school sources

Official sources define scope; school sources corroborate local sequence/assessment, and hosted past papers/enrichment describe practice. Lower-authority sources do not override current MOE requirements. All page numbers below are PDF pages unless explicitly called printed pages. All sources accessed 2026-10-16.

- [MOE Primary Science 2023, updated January 2026](https://www.moe.gov.sg/api/media/ba3562d3-5b31-4459-8693-45cde7b97273/Primary-Science-Syllabus-2023.pdf). Actual PDF retrieved and inspected: PDF pp39–41 (printed38–40), p43 (printed42), p63 (printed62); P5 reproduction PDFp44. SHA-256: `0556023ceb55fe80de75ae044011b8c77ea7ea494a1873d2b224a9b2b8083ab0`.

| School document | Pages examined / use | SHA-256 |
| --- | --- | --- |
| [ws-p3-2026-3](https://isomer-user-content.by.gov.sg/817/aaa9cff4-0168-4842-9ed2-45b681e1d54a/04_2026_Curriculum_Briefing_Science_P3.pdf); [school navigation](https://www.westspringpri.moe.edu.sg/curriculum-briefing-2026/cb2026p3/) | 4, 7–8: Seven selected P3 topic areas; inquiry and performance work. Magnet making is taught in P3 but this school defers its weighted assessment to P4 WA1: teaching sequence and test schedule differ. | `542cb152c7929898fb187504e923fb97a3f4e66f9badda34839b99988fc4164e` |

The school PDFs were reached through current school navigation; moved legacy file links were not silently counted as retrieved. They are public curriculum documents, not any learner’s school/worksheet information.

#### Curriculum-to-bank inventory

Current MOE core and observable practices are the acceptance authority. Broad area counts are not a reviewed outcome percentage.

| Working topic | Current label | Questions / repair targets | Audit qualification |
| --- | --- | --- | --- |
| sc.p3.living-nonliving | Diversity of living and non-living things: characteristics of living things | 20 / 4 | in_app; observation/mapping/prerequisite gap SC3 |
| sc.p3.classification | Classification of living things: plants (flowering/non-flowering), animals, fungi, bacteria | 35 / 7 | in_app; observation/mapping/prerequisite gap SC3 |
| sc.p3.materials | Diversity of materials: types and properties (strength, hardness, flexibility, waterproof, transparency, floating) | 30 / 6 | in_app; hardness extension SC2 |
| sc.p3.plant-life-cycle | Life cycles of plants: stages, germination conditions, seed parts | 20 / 4 | in_app; scope mismatch SC1 |
| sc.p3.animal-life-cycle | Life cycles of animals: three- and four-stage cycles, frog, mosquito control | 25 / 5 | in_app; observation/mapping/prerequisite gap SC3 |
| sc.p3.magnets-properties | Properties of magnets: magnetic materials, poles, attraction and repulsion, force through materials | 30 / 6 | in_app; observation/mapping/prerequisite gap SC3 |
| sc.p3.making-magnets | Making and using magnets: stroke and electrical methods, temporary/permanent magnets, uses | 20 / 4 | in_app; observation/mapping/prerequisite gap SC3 |
| sc.p3.open-ended-cer | Open-ended explanations using claim, evidence and reasoning | 0 / 0 | external |
| sc.p3.practical | Practical test: observing, measuring, classifying with real materials | 0 / 0 | external |
| sc.p3.p4-topics | P4 lower-block topics (plant and human systems, matter, light, heat) | 0 / 0 | deferred |

#### Actual paper research, 2021–2026

Citation revision (2026-10-16): third-party past papers are linked through public listing pages only. School/year/type, analysis pages and original file hashes still identify the copies examined; this citation format does not establish reuse rights.

| Course | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
| --- | --- | --- | --- | --- | --- | --- |
| p3 science | Retrieved | Retrieved | Retrieved | Retrieved¹ | Retrieved | Not retrieved |

“Retrieved” means a public PDF packet was downloaded and its content examined, not that a direct school release was authenticated. ¹ Catalogue year is not internally established for every packet; retain the per-file qualifications below. This was a bounded multi-host survey, not an exhaustive census. No verified 2026 paper was retrieved as of 2026-10-16; a website’s 2026 title/footer was not treated as the year printed on a paper.

SGExam/SGTestPaper/SmileTutor and public web searches were checked. The second-host bundle below was actually sampled, not counted from an index alone. Multiple hosts can contain the same underlying paper; downloads are not a count of independent schools.

##### p3_science-2021

- Identity/date: ACS Junior, BA2; cover 2021.
- Source: [public paper listing](https://sgexam.com/subject/science/2021-p3-science-bite-sized-assessment-2-acsj-pdf/); 13 PDF pages.
- Analysis page anchors: 1–2, 8, 10. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Classification, fungi/bacteria and mould investigation; a short assessment cannot represent the whole P3 programme.
- SHA-256: `62a7c43f943fff96c31567bda65f4e04607481eb352ede938c7f3f314d6aad3c`.

##### p3_science-2022

- Identity/date: ACS Primary, SA2; cover 2022.
- Source: [public paper listing](https://sgexam.com/subject/science/2022-p3-science-semestral-assessment-2-acs-primary-pdf/); 34 PDF pages.
- Analysis page anchors: 1–2, 7–9, 13–16, 24. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Classification, material-property tables and magnet testing. Human/plant systems also occur under an earlier cohort: exclude these from the current P3 denominator.
- SHA-256: `f3da7c5b89aa8119c282fd64bb27e127b0e6ef4a0460330284535dcf687bd881`.

##### p3_science-2023

- Identity/date: ACS Primary, EOY; cover 2023.
- Source: [public paper listing](https://sgexam.com/subject/science/2023-p3-science-end-of-year-exam-acsp-pdf/); 32 PDF pages.
- Analysis page anchors: 1, 5, 7–8, 11–12, 22, 24. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Flowcharts, life-cycle comparisons, property decision trees and fair tests. Diagrams/data drive the reasoning; merely recalling labels is narrower.
- SHA-256: `fe6dad03f3e5f5b0402d05f28aee57b19db1a931f0ffa2ec74e450de0c63a342`.

##### p3_science-2024

- Identity/date: ACS Junior, BA2; catalogue 2024.
- Source: [public paper listing](https://sgexam.com/subject/science/2024-p3-science-bite-sized-assessment-2-acs-junior-pdf/); 15 PDF pages.
- Analysis page anchors: 1–10. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Classification and investigation questions; cover does not establish the printed year. Additional EOY source below gives broader corroboration.
- SHA-256: `928650e704ade1634b50c0fc3bed7fdf89b55ce1b536a08951de75baf5ede53f`.

##### p3_science-2025

- Identity/date: ACS Junior as catalogued, EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/science/2025-p3-science-end-of-year-exam-acs-junior-pdf/); 30 PDF pages.
- Analysis page anchors: 1, 3, 6, 9–14, 18, 22. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: Classification charts, controlled comparisons, material data and electromagnet tests. Also includes germination conditions beyond the current MOE P3 core; an exam does not override the official grade boundary.
- SHA-256: `5949c6a037929fc94b47b8a42c5c752f5bde66e08c1e4f47e651e33c67473e0b`.

##### p3_science-2025-extra-tao-nan

- Identity/date: Tao Nan, EOY; cover 2025.
- Source: [public paper listing](https://sgexam.com/subject/science/2025-p3-science-end-of-year-exam-tao-nan-pdf/); 34 PDF pages.
- Analysis page anchors: 1, 3, 5, 7–8, 18–29. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: 18 MCQs plus structured questions 19–26; controlled living-needs tests, feature tables, life-cycle diagrams, magnetic strength and waterproofing fair tests. Distinguish observing growth from teaching reproduction processes.
- SHA-256: `ab6e21803d77c00aa438cd8d33787c6c885c964f109c041b70a92f242e853939`.

##### p3_science-2024-extra-catholic-high

- Identity/date: Catholic High, EOY; cover 2024.
- Source: [public paper listing](https://sgexam.com/subject/science/2024-p3-science-end-of-year-exam-catholic-high-pdf/); 32 PDF pages.
- Analysis page anchors: 1, 3–17, 19–29. All pages were text/OCR processed; these are the principal sections examined, not a claim that every external answer key was independently marked.
- Finding: 24 MCQs and ten structured questions: observable-feature classification, materials/load tests, cycle diagrams and magnet strength. PDF p24 asks for a conclusion from an experimental table; p29 electrical magnets.
- SHA-256: `0866dd7c9866e23635f1425c4b38c2e452c0949af66b54000eb54bb9dd23c091`.

##### Second-host 2022 bundle — science

[SmileTutor public listing](https://smiletutor.sg/free-test-papers-download/primary-school-exam-papers/): 448 pages downloaded; **only PDF pp1–8 inspected/OCR processed**. The first packet is ACS Junior BA3. PDF pp3–8 show material classification, property choices for purpose, a flowchart and matching practical tests to properties. This corroborates the need for observations/representations, not only explanation paragraphs.

SHA-256: `59e712a1a6d28ba5fc01be937fac0bf248981faf03cbfaca7ea2008a8e3ec735`. Full bundle content/keys were not audited.

#### Dated enrichment research, 2024–2026

| Public source | Date evidence | What was actually retrieved | Use / limit | SHA-256 |
| --- | --- | --- | --- | --- |
| [science-2024](https://www.agrader.sg/post/understanding-diversity-of-materials-in-primary-science) | 2024-02-20 published; 2026 modification | Public instructional article | Materials explained through comparing properties and choosing a material for a use; corroborates core application rather than unsupported hardness expansion. | `358f83e9ac6910464d0a40d3205c6371ada51f544a37bc3784b94146163bc105` |
| [science-2025](https://www.ntu.edu.sg/nie/news-events/news/detail/primary-school-science-lessons-sparkle-with-refreshed-syllabus-and-new-resource-kits) | 2025-07-24 | NIE/NTU public programme report | Describes Sparkle inquiry resources for P3–6. Kits/lesson materials themselves were not retrieved; do not count a news report as a reviewed content bank. | `538b20b7db5c5bbfcea7b2b880d695ba6a0e201326714127bec969c85661a306` |
| [science-2026](https://www.uplabs.sg/post/p3-science-topical-notes-new-syllabus) | Self-labelled updated 2026-01-20; other header dates conflict | Public topical notes, date qualification required | Living-things/materials notes provide examples, but detailed animal facts and broad bacteria claims are not core authority. Use MOE boundaries and independently check each scientific claim. | `0caf22e37e2dbeb23f3cb0b3b81ebab6cf1cc8b1d2c1624e452af98a79cfb9f8` |

Additional 2025 public teaching was read through indexed page text: [The Pique Lab — mould on cheese](https://thepiquelab.com/blog/fungi-bacteria-how-does-mould-grow-on-cheese/) (14 March 2025) explains a comparison of storage conditions step by step. Unlike the NIE programme report, it contains a worked instructional example. It analyses a 2018 question, so it is **2025 enrichment**, not an added 2021–2026 paper. Direct HTML retrieval returned 403 and the embedded question images were not independently checked. Use its response-demand discussion only; derive current scope from MOE and independently review scientific assumptions. No question/image is copied.

#### Originality, rights and reproducibility

The app content is labelled original author draft. A bounded exact-overlap check compared every app material body and question stem against the retrieved same-subject paper OCR/text: 8 text files, 12 consecutive alphabetic words, case/punctuation normalised. **No threshold-length exact match was found.** This can miss paraphrases, OCR errors, shorter copying, images and sources outside the sample. It is not proof of originality, permission or copyright clearance. Common grammar/number templates are not by themselves evidence of copying. Retain pending rights/independent review/owner sign-off until the project’s review gates are satisfied.

For past papers, start at the cited public listing, identify the recorded grade/course, year and assessment, and obtain the matching file under the host’s current access conditions. Compare its `sha256sum` with the recorded hash; a mismatch may mean the host replaced the file. Official and other source snapshots are likewise identified by their cited URLs and hashes. For paper structure, extract native PDF text and OCR scans (PyMuPDF + Tesseract English / Simplified Chinese), then inspect the stated PDF pages and course/year covers visually where OCR is ambiguous. HTML hashes identify the fetched snapshot, not an immutable future webpage. The documented overlaps used only stems/material bodies, not keys/explanations or character catalogues. Source retrieval and OCR happened outside the public repository; no signed download tokens or private files are required to follow these citations.

#### Disposition and next revision

1. Resolve the numbered findings above and update the leaf-level map and affected content/metadata together. Keep the agreed Pilot exclusions and locks.
2. Review original questions, distractors, keys, hints, explanations and any new assets as a coherent batch; increment affected content versions and preserve prior pinned attempts. The earlier correction commit is not approval of unchanged or newly added content.
3. Re-run schema/content checks and the public-data guard. Validators check structure and references, not curriculum truth, unambiguous meaning, complete transfer pools or educational quality.
4. Calculate release coverage only from the reviewed in-scope leaf denominator, with explicit omissions. Independent review and owner sign-off remain pending; no percentage or question count authorises implementation/merge.

Validation for this evidence-only revision: public-source link/hash and report consistency checks; subject content validator rerun without content/schema changes; privacy guard and whitespace diff check. The PR comment records the published evidence revision and exact results.
