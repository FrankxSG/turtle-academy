# English content

| File | What it holds | Status |
| --- | --- | --- |
| `content/english/curriculum.json` | 35 topics, 96 leaves, sources | Draft |
| `content/english/pool-001.json` | v4: 364 questions (P2 187, P3 177), 19 passages, 91 repair sets | Author-checked; awaiting owner review |
| `content/english/assets/` | 4 original SVG diagrams | — |

- Source: MOE English Language syllabus 2020 (primary) plus public school documents; links in `curriculum.json`.
- All questions and passages are original. Open school formats are presented as choices, so they test recognition, not production. Free writing, oral and listening stay outside the app.

```sh
python3 scripts/validate_subject_content.py english
```
