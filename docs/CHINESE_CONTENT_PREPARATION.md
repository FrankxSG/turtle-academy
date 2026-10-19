# Chinese content

| File | What it holds | Status |
| --- | --- | --- |
| `content/chinese/curriculum.json` | P2/P3 Chinese and Higher Chinese outcomes, 46 skill targets, 1,796 characters, MOE sources | Leaf list approved by the owner (18 Oct 2026) |
| `content/chinese/batches/starter-001.json` | v10: 357 questions, 19 passages | Approved |
| `content/chinese/batches/starter-002.json` | v3: 38 questions, 1 passage | Approved |
| `content/chinese/batches/starter-003.json` | v2: 117 questions (P1 review characters and textbook extras) | Approved |
| `content/chinese/review-characters.json` | P1 review and textbook-extra characters | Approved |

- Sources: 2024 MOE Primary Chinese syllabus and the CL/HCL character lists (links and checksums in `curriculum.json`). Higher Chinese writing lists are not supersets of Chinese lists (`source-audit.json`).
- All questions are original. School papers informed question types only; no text was copied.
- Listening, speaking, handwriting and free writing are outside the app.

```sh
python3 scripts/validate_chinese_content.py
python3 scripts/test_chinese_content_contracts.py
python3 scripts/chinese_release_inventory.py   # prints coverage
```
