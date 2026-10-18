# PR24 cross-review — 2026-10-18

Reviewed head: `69c97c40bd617dbf1d62b3f54983e4ef90727e99`.

## Fixed

- High: approval validation allowed a batch referencing a proposed P1 list to become approved. Approval now requires the target list to be approved too; regression fixture covers rejection and later approval.
- High: approved inventory discarded P1/textbook-extra classification and could count those repair questions as general grade-leaf coverage. The approved view now preserves the list and excludes batches depending on a proposed list; regression fixture covers both states.
- Medium: 21 content revisions remove overgeneralizations and unsupported context assumptions (cloud colour, seeds/soil, school/learning, reading aloud, wild-animal habitat, density, 那天), improve awkward wording and keep the 九 task focused on Chinese recognition. Batch v2 and per-item v2 revisions invalidate earlier sampled wording. All revised items remain disputed pending recheck.

## Recheck of the 21 revisions (Claude)

All 21 were read rendered, with every distractor substituted into the blank and hints checked for the key. All pass. Keys and target IDs are unchanged. The disputes are cleared and the review log is updated (`independent_review: passed`). Two non-blocking notes are kept for a later round:
- `u571f.q2`: the hint says seeds 要 go in the ground; 可以 would be more accurate.
- `u767d.q1` and `q2` share the 像牛奶 cue across the exact and similar stages.

## Official P1 source audit (Claude, 2026-10-18)

The owner supplied both official MOE character-list PDFs. Their SHA-256 values match the pinned sources exactly:
- CL `d833e9a4…c145`;
- HCL `461f131f…7914`.

Both are 6 pages at 539 × 737 pt.

Pages 1–2 (P1 一上 and 一下) use the same table layout as the audited P2 pages: lesson column, then 识读字 and 识写字 columns. `scripts/audit_p1_review_characters.py` extracts them with `pdftotext -bbox`, using the same column bounds as the existing audit. As a control it first reproduces each course's P2 records from pages 3–4.

**Result: all 547 review records match.**
- CL: 364 P1 characters; 95 are already on the P2 list, leaving 269 records.
- HCL: 364 P1 characters; 86 are already on the P2 list, leaving 278 records.
- Each record's ID, source grade, recognition pages, writing pages and source match, as do the summary counts.
- Swapping the two files is rejected on checksum.

Visual spot-check: two rows were compared by eye with the extracted records, and both match, including the recognise-only characters (雷 旧; 甲 丁 周 末):
- CL 一上 lesson 10;
- HCL 一下 lesson 11.

The PDFs are not committed. The audit needs them supplied locally.

## Still required before release

- Owner target-list, rights and batch decisions are complete as recorded below.
- Real catalogue/intake wiring and end-to-end priority/repair evidence: implemented in draft PR #25, which is stacked on this PR.

No owner or rights approval is inferred from passing structural checks. No deployment or merge performed.


## Owner approval — 2026-10-18

The owner approved the full practice target list in chat, then signed the batch-v2 receipt at `2026-10-18T14:14:53.948Z`: all 20 seeded sample items and 21 revisions reviewed; content approved for 117 items; rights/public use approved. The receipt binds source head `1aa0e39ac6ae0a2c140b27d541e755f42a0427e0` and pre-approval batch SHA-256 `a393c21fc90ab87a6fd55a2d1dfa4e1528ef16599994eb0780b974918a0e85d6`. The list and batch approval metadata are updated; no item content changed. This does not authorize merge, deployment, real-data use, or approve the separate private bank.
