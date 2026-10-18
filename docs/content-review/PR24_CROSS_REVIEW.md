# PR24 cross-review — 2026-10-18

Reviewed head: `69c97c40bd617dbf1d62b3f54983e4ef90727e99`.

## Fixed

- High: approval validation allowed a batch referencing a proposed P1 list to become approved. Approval now requires the target list to be approved too; regression fixture covers rejection and later approval.
- High: approved inventory discarded P1/textbook-extra classification and could count those repair questions as general grade-leaf coverage. The approved view now preserves the list and excludes batches depending on a proposed list; regression fixture covers both states.
- Medium: 21 content revisions remove overgeneralizations and unsupported context assumptions (cloud colour, seeds/soil, school/learning, reading aloud, wild-animal habitat, density, 那天), improve awkward wording and keep the 九 task focused on Chinese recognition. Batch v2 and per-item v2 revisions invalidate earlier sampled wording. All revised items remain disputed pending recheck.

## Still required before release

- Claude independently rechecks the 21 revised items and resolves the review log.
- Official P1 PDF checksum/layout audit and visual spot-check. Matching existing P2/P3 extracts does not verify the newly added P1 pages.
- Owner target-list, rights and batch decisions, using the refreshed owner sample and disputed-item review.
- Real catalogue/intake wiring and end-to-end priority/repair evidence. These data changes alone do not connect the runtime to this catalogue.

No owner or rights approval is inferred from passing structural checks. No deployment or merge performed.
