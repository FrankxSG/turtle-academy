# Science content pool (P3)

Independent public-source research and current content findings: [research audit](content-review/SCIENCE_RESEARCH_AUDIT.md) (2026-10-16; changes required). This evidence supplements the authoring source register and does not approve the batch.

**Review proposal · 16 October 2026 · generic/public content pool**

Original P3 Science content for the public (generic) version of Turtle Academy, covering the seven P3 topics of the 2023 MOE Primary Science syllabus, with public sources cited. Primary Science starts at P3, so there is no P2 pool. This document does not authorize implementation, release, merge or deployment.

## 1. What is in this pool

- `content/science/curriculum.json`: 10 topic records with scope (in-app / partial / external / deferred), Pilot status and cited sources.
- `content/science/pool-001.json`: 180 original questions (P3 180), 36 materials, 36 three-stage repair sets (exact → similar → generic).
- `scripts/validate_subject_content.py`: structural checks (unique IDs, answer key present, 4+ distinct options, topic and source references, complete repair sets, material membership, hints that do not state the answer).

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

Pictures and short animations named in the design are not yet authored; the teaching text is written so an illustrator can add visuals later.

## 4. Assessment formats observed (public school documents)

- Weighted assessment: 8 MCQ at 2 marks each plus 4-5 open-ended questions (`cedar-p3-2025`); EOY: 21 MCQ at 2 marks and 9-10 open-ended (`cedar-p3-2025`), or 15 MCQ / 30 marks and 6-7 open-ended / 20 marks (`jwps-p3-2025`).
- A practical test (observing, measuring, classifying) is used by some schools (`jwps-p3-2025`); kept external.
- Open-ended answers use Claim-Evidence-Reasoning (`bpps-sc-p3-2026`); written explanations stay external, but the objective items ask pupils to pick the claim plus reason.

## 5. Past-year paper survey (2021-2026)

SmileTutor lists P3 Science papers, with 2022 the only year in range (`smiletutor-papers`); it asserts copyright and states no reuse licence, so **no paper or question is reproduced**. The survey informed question styles only: classifying organisms by observable features, choosing materials for a purpose, interpreting simple fair-test set-ups (germination, magnet strength) and identifying the next or missing life-cycle stage.

## 6. Misconceptions targeted

- Attraction does not prove an object is a magnet; only repulsion does (`junyuan-sc-p3-2026`, `bpps-sc-p3-2026`) — dedicated knowledge point `test-magnet`.
- "All metals are magnetic" (aluminium and copper distractors).
- Light or soil being needed for germination; fire or robots being living; bats and whales not being mammals; spiders being insects; penguins not being birds.

## 7. Enrichment context (2024-2026)

Schools encourage visits and hands-on programmes such as Science Centre Singapore (`junyuan-sc-p3-2026`, `scs-zooms`) and community classes (`onepa-sc-p34`). Cited for context only; no enrichment content is copied.

## Topic coverage in this pool

| Topic | Grade | Scope | Pilot | Repair sets | Questions |
| --- | --- | --- | --- | ---: | ---: |
| Diversity of living and non-living things: characteristics of living things (`sc.p3.living-nonliving`) | P3 | in_app | open | 4 | 20 |
| Classification of living things: plants (flowering/non-flowering), animals, fungi, bacteria (`sc.p3.classification`) | P3 | in_app | open | 7 | 35 |
| Diversity of materials: types and properties (strength, hardness, flexibility, waterproof, transparency, floating) (`sc.p3.materials`) | P3 | in_app | open | 6 | 30 |
| Life cycles of plants: stages, germination conditions, seed parts (`sc.p3.plant-life-cycle`) | P3 | in_app | open | 4 | 20 |
| Life cycles of animals: three- and four-stage cycles, frog, mosquito control (`sc.p3.animal-life-cycle`) | P3 | in_app | open | 5 | 25 |
| Properties of magnets: magnetic materials, poles, attraction and repulsion, force through materials (`sc.p3.magnets-properties`) | P3 | in_app | open | 6 | 30 |
| Making and using magnets: stroke and electrical methods, temporary/permanent magnets, uses (`sc.p3.making-magnets`) | P3 | in_app | open | 4 | 20 |
| Open-ended explanations using claim, evidence and reasoning (`sc.p3.open-ended-cer`) | P3 | external | open | 0 | 0 |
| Practical test: observing, measuring, classifying with real materials (`sc.p3.practical`) | P3 | external | open | 0 | 0 |
| P4 lower-block topics (plant and human systems, matter, light, heat) (`sc.p3.p4-topics`) | P3 | deferred | open | 0 | 0 |

## Correction revision — 16 October 2026

Batch version 2 corrects six items and two teaching cards. The flexibility question now supplies equal strip dimensions, the same load and measured bending without breakage; the conclusion no longer depends on which strip breaks first. Nickel/cobalt recall is removed from the teaching card and affected options. The induced-paper-clip acquisition question is replaced by an observed on/off electromagnet example; the related permanent-magnet distractor no longer relies on induction. These changes follow the exclusions on PDF p63 / printed p62 of the [official syllabus updated January 2026](https://www.moe.gov.sg/api/media/ba3562d3-5b31-4459-8693-45cde7b97273/Primary-Science-Syllabus-2023.pdf); electrical magnet-making remains included. A hint that directly named steel is also replaced. Revised item/material versions are incremented and revised item IDs remain listed for re-review. The explicit learning-unit/acquisition-to-repair links, prerequisite graph, observation activities/assets, complete curriculum/source audit and owner sign-off remain open.

These are proposed corrections, not independent approval. Existing task/history must retain earlier pinned versions; this authoring revision does not implement evidence migration or retroactive regrading.

## Validation

```sh
python3 scripts/validate_subject_content.py science
python3 scripts/privacy_guard.py
```

Passing validation proves structure only. Remaining before release: independent review of every item, random 20% sample of agreed items, owner batch sign-off, verification of topic boundaries against the official MOE syllabus PDF, and the existing Pilot coverage, data-protection and device gates. No learner data is used or implied by any item.
