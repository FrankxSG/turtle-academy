# Science content

| File | What it holds | Status |
| --- | --- | --- |
| `content/science/curriculum.json` | 10 topics, 41 leaves, sources | Draft |
| `content/science/pool-001.json` | v4: 180 P3 questions, 36 teaching cards, 36 knowledge points, 36 repair sets | Author-checked; awaiting owner review |
| `content/science/assets/` | 51 original SVG diagrams | — |

- Source: MOE Primary Science syllabus 2023 (May 2024 revision) plus public school documents; links in `curriculum.json`.
- Each knowledge point: teaching card, two tests in different contexts, then a three-stage repair set.
- All questions are original. Written explanations and practical tests stay outside the app.

```sh
python3 scripts/validate_subject_content.py science
```
