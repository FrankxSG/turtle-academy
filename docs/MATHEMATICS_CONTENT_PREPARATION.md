# Mathematics content guide

Read with the [common authoring skill](../skills/question-authoring/SKILL.md). Topics, leaves, sources and limitations are in `content/mathematics/curriculum.json`.

## Files and status

| File | Holds | Status |
| --- | --- | --- |
| `curriculum.json` | 29 topics, 111 leaves (ability, representation, scope, MOE page), sources | Author working map; needs page-by-page leaf audit |
| `pool-001.json` v3 | 321 original questions (P2 165, P3 156), 107 three-stage repair sets | Author-checked; awaiting independent review and owner sign-off |
| `assets/` | 65 original SVG diagrams | Need an independent visual check |

P3 is authored but locked in the Pilot.

## Assessment formats observed

- **P2:** no weighted exams; topical reviews, performance tasks, investigations and journals. Outcomes: numbers to 1000, +/− , ×/÷ within tables, shapes, time to the minute, length/mass/volume, picture graphs with scales, fractions.
- **P3:** weighted assessments plus an end-of-year paper, about 75 minutes, 25–30 questions mixing MCQ, short answer and 3–5 long-answer items (e.g. 15 MCQ / 6 SAQ / 5 LAQ; 10 MCQ / 15 SAQ / 3 structured).
- The app uses objective selection only, so SAQ/LAQ skills appear as worked multi-step word problems with a selected final answer. Written workings stay external.

## Past-paper findings (2021–2026, format only)

- Styles: bare computation, missing-number sentences, unit selection, reading scales/clocks/graphs, 1–2 step word problems (P2), up to 3-step problems with comparison models (P3).
- Models and diagrams are substantive stimuli, not decoration: scales, angles, parallel lines, clocks, graphs, composite area/perimeter all recur. A question that states the measured value tests arithmetic, not reading the representation.
- P3 2025 papers use 24-hour time and ask for a parallel line through a point. A 2025 P3 EOY: 25 questions (10 MCQ, 10 short, 5 structured).
- Single quizzes and reviews cover a subset of the year; they never establish all outcomes. Some public scans are misfiled or undated.
- Enrichment (2024–2026): length/mass unit and scale-reading errors are common; P3 area/perimeter needs visual composite reasoning; a 2026 P2 guide confirms time to the minute. A June 2024 site still describing five-minute time is outdated, so date alone doesn't make a source current.

## Distractor traps

No regrouping; subtracting the smaller digit in each column; wrong unit (cm vs m, kg vs g, cm vs cm²); reading a ruler's start mark as 0; mixing a.m./p.m.; adding denominators; confusing area with perimeter.

## Teaching notes

- Comparing/ordering fractions and multi-step word problems are named difficulties; both have dedicated repair sets.
- Schools recommend model drawing and a check-your-answer routine. Hints point to the next step (draw units, find the total first, change units first) without stating the answer.
- Repair ladder: **exact** (bare skill) → **similar** (same skill, different numbers or representation) → **generic** (new context, usually a word problem).

## Scope findings

- P2 odd/even (§1.6), dollars ↔ cents both ways (§1.4) and time to the minute (§2.1) are P2 leaves; P3 adds the 24-hour clock (§2.3). All now have targets; clocks use non-five-minute times (4.17, 7.43, 12.38).
- Measurement, clock, graph, angle, line and 3D items need a real diagram; the validator rejects a visual leaf without one.
- Drawing perpendicular/parallel lines and drawing bars are production skills: recorded as partial; in-app items check recognition only.
- Topics are not equal outcomes; coverage uses leaves. Three questions per target is thin starting stock; a numeric reskin is not transfer evidence.

## Known gaps

- Mental addition and subtraction of two 2-digit numbers has no questions yet.
- Leaf map not yet verified page by page; MOE leaves without a target are missing from it.
- Confirm the 24-hour notation schools use (the pool writes `15:45`) and the clock-reading distractors.

## Validation

```sh
python3 scripts/validate_subject_content.py mathematics
```

The validator checks structure (IDs, keys, 4+ distinct options, references, complete repair sets, routes, diagrams for visual leaves, prerequisites, SVG safety, hints that don't state the answer), not educational quality.
