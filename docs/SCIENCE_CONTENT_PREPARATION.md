# Science content guide

Read with the [common authoring skill](../skills/question-authoring/SKILL.md). Topics, leaves, sources and limitations are in `content/science/curriculum.json`. Primary Science starts at P3; there is no P2 pool.

## Files and status

| File | Holds | Status |
| --- | --- | --- |
| `curriculum.json` | 10 topics, 41 leaves (incl. deferred/external), sources | Author working map; needs page verification before the 75% guideline is computed |
| `pool-001.json` v4 | 180 P3 questions, 36 teaching cards, 36 knowledge points, 36 repair sets | Author-checked; awaiting independent review and owner sign-off |
| `assets/` | 51 original SVG diagrams | Need an independent visual check |

## Structure: learn, test, repair

1. **Teaching card** (`kind: teaching`) for one small knowledge point, with an original observation diagram or table. Not counted in X; no mistake evidence.
2. **Two acquisition tests** in different contexts.
3. **Three-stage repair set** (exact → similar → generic) for a wrong test or later review.

`knowledge_points` link each card to its two tests, its repair target and its prerequisites (acyclic, validated). Short animations are not yet authored.

## Assessment formats observed

- Weighted assessment: 8 MCQ (2 marks each) plus 4–5 open-ended. EOY: 21 MCQ plus 9–10 open-ended, or 15 MCQ / 30 marks plus 6–7 open-ended / 20 marks.
- Some schools run a practical test (observing, measuring, classifying); external.
- Open answers use Claim–Evidence–Reasoning; written explanations stay external, but objective items ask for the claim plus reason.

## Past-paper findings (2021–2026, format only)

- Styles: classifying organisms by observable features, choosing materials for a purpose, interpreting fair-test set-ups (germination, magnet strength), identifying the next or missing life-cycle stage.
- Flowcharts, classification charts, feature tables, life-cycle diagrams, property decision trees and fair tests drive the reasoning; recalling labels alone is narrower. Some papers ask for a conclusion from an experimental table.
- Some P3 papers include germination conditions or (2022) P4 systems topics. An exam doesn't override the MOE grade boundary.
- Enrichment: material choice for a use supports core application; detailed animal facts and broad bacteria claims are not core authority; check each scientific claim against MOE.

## Scope rules (MOE 2023 syllabus)

- **Plants:** P3 observes and compares seed → young plant → adult plant. Germination conditions, seed parts and reproduction are P5 (PDF p43–44). A seedling is an early young plant, not a separate stage.
- **Materials:** required properties are strength, flexibility, floating/sinking, waterproof/absorbent and allowing light through (PDF pp40–41). Hardness is not required; strength is tested with a fair same-size strip test.
- **Classification:** recall of individual species facts is not required (PDF p39). Give features, pictures or tables to classify from.
- **Magnets:** making magnets by stroking and by electricity is P3 (PDF p63). Nickel/cobalt recall, shielding and induction are not required.
- P4 topics (plant and human systems, matter, light, heat) are deferred.

## Misconceptions targeted

- Attraction doesn't prove an object is a magnet; only repulsion does (knowledge point `test-magnet`).
- "All metals are magnetic" (aluminium, copper distractors).
- Fire or robots as living; bats and whales not mammals; spiders as insects; penguins not birds.

## Content rules learnt

- Fair-test items state equal sizes, the same load and the measured result; conclusions don't depend on which strip breaks first.
- Electromagnet examples use observed on/off behaviour, not induced paper clips.
- Hints must not name the answer material (e.g. "steel").

## Validation

```sh
python3 scripts/validate_subject_content.py science
```
