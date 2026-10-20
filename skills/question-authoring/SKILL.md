---
name: question-authoring
description: Use when drafting, revising or reviewing Turtle Academy objective questions, repair pools or coverage reports in any subject, or when cross-reviewing another assistant's content. Common working method and per-item checks; read the subject skill next for that subject's additions.
---

# Question authoring and review — common to all subjects

This is the shared base for content work in `content/<subject>/`. Read it first, then the subject skill, which adds checks on top of these and never removes one.

| Subject | Subject skill | Research and scope guide |
| --- | --- | --- |
| Chinese | [chinese-question-authoring](../chinese-question-authoring/SKILL.md) | [Chinese guide](../../docs/CHINESE_CONTENT_PREPARATION.md) |
| Mathematics | Not written yet | [Mathematics guide](../../docs/MATHEMATICS_CONTENT_PREPARATION.md) |
| English | Not written yet | [English guide](../../docs/ENGLISH_CONTENT_PREPARATION.md) |
| Science | Not written yet | [Science guide](../../docs/SCIENCE_CONTENT_PREPARATION.md) |

Read the subject guide before drafting: it holds the syllabus boundaries, past-paper findings, distractor traps and known gaps. Until a subject skill exists, use this skill alone and record new lessons as described in "Updating these skills".

## What every question needs

- Stable versioned ID, objective/outcome and source reference, task type and format class (4+ option MCQ, matching, ordering vs true/false or 2–3 options).
- Reviewed key, hint, explanation and pedagogical rationale; original or licensed provenance and rights status.
- Repair items in complete exact → similar → generic sets; new-context items must change the context, not just numbers or option order.
- Diagrams original, with titles/alt text that describe the picture without giving the answer. AI-drafted artwork needs a provenance note (tool, terms, human edits, no third-party IP).
- Never reproduce teacher worksheets, textbook passages or past-paper questions; papers inform question types only. Before hand-over, compare new stems and passages with the past-paper text in the resources repo: no run of 12 consecutive words (24 Han characters) may match.

## How to work

Every error in the [PR 23 case log](../chinese-question-authoring/references/pr23-lessons.md) passed the validator and the contract tests. They came from how the work was done. Work in this order:

1. **Draft in small sets.** One topic group at a time, about ten questions, not a whole batch in one pass.
2. **Read every finished question as the child sees it**, one at a time, with blanks, annotations and materials rendered. A script may write the data; it does not count as reading the questions.
3. **Run the full checklist on new and old questions alike.** Questions written earlier in the same session get no lighter treatment.
4. **Turn every fix into a check.** When a defect is found, search the whole bank for the same pattern and record it here or in the subject skill (or as a validator rule), not only as a one-off edit.
5. **Keep drafting and reviewing as separate passes.** Finish drafting, then review against the checklist, then hand over.
6. **Do not call work reviewed until the other assistant has checked it.** An author's own recheck is recorded as a recheck, in the PR and in the batch review log.

## Per-item checks

Run these on the rendered question. Subject skills add checks; they may say how a check applies in that subject, but never drop one.

1. **Read it as the child.** Read the stem, then each option. Every instruction word must suit the grade (the subject skill defines the reference list or reading level). Anything harder needs support that does not reveal the answer.
2. **Substitute every distractor.** Put each wrong option in the answer's place. If one is also correct *and* defensible from the stem, the item has two answers. Test meaning, not only form.
3. **Check the key against an authoritative source, not a friendly paraphrase.** Simplified wording must stay true. Find one familiar counter-example before accepting a definition or a category.
4. **Do not turn a convention into a rule.** If something is typical rather than required, the key must not teach it as required. Ask whether a teacher would mark a different correct answer wrong because of this key.
5. **Keep the answer out of the stem and hint.** Search both for the key text and for any feature only the key has. A hint may point to the reasoning; it may not name the distinguishing feature of the answer.
6. **Read all questions in a material together.** First answers for a whole material are collected before feedback, so one question's options can answer another.
7. **Match the hint to what actually separates the options.** Avoid everyday words that are also technical terms in the skill being tested.
8. **Verify every answer against a source.** Never write a fact, number, spelling or reading from memory and move on. The subject skill says how (a dictionary, the syllabus, running the arithmetic).
9. **Map to the demand, not the topic.** Tag the outcome the child must actually use. If a question needs a skill from a later grade (calculating, comparing, applying information where only retrieval is in scope), rewrite it rather than remap it.
10. **Keep the key from standing out.** Options similar in length and specificity; the key is not the longest or most qualified one.
11. **Use neutral, original names and content.** No franchise characters, no worksheet or textbook wording.
12. **Check real-world facts for the learner's locale.** A stem that states or models everyday behaviour must be true where the child lives. Singapore traffic drives on the left, so a road-crossing item must not teach "look left first" ([case](../chinese-question-authoring/references/pr23-lessons.md#zh-starter-003-author-draft)).

## Reports and scripts

- Add a regression test for each counting rule before trusting a report; plausible numbers can still be wrong.
- Derive expected numbers in tests from the data or fixture the test builds, never from today's totals.
- State only what the code computes. An upper bound is not a prediction.
- After changing data, search the docs for every count and version the change affects and update them in the same commit.

## Review and hand-over

- Record who drafted each item and who reviewed it.
- Cross-review runs both ways: the reviewer's corrections get the same checks as the original.
- Any change to an item removes it from the agreed sample pool. Prefer refining items already disputed; if a pooled item must change, redraw the sample with a recorded seed before the owner starts.
- Never add items to an approved batch: its approval covers only the items the owner saw. Put new content in a new batch with its own review state, and keep IDs unique across batches ([case](../chinese-question-authoring/references/pr23-lessons.md#found-while-drafting-zh-starter-002)).
- Owner QA per batch: every disputed item plus a random 20% of AI-agreed items (seeded, recorded), then batch sign-off. Escalate to a qualified educator if the owner can't resolve an item. Validators and AI agreement prove structure, not correctness.
- An AI recommendation is never an owner decision. Leave owner, rights and independent-review states unchanged until the decision is recorded.
- In the hand-over comment, list which questions were read rendered, which checks were run, and what remains unverified.

## Updating these skills

- **A lesson that would apply in another subject** goes here, as a new check or a sharper wording, with a link to the case that taught it. Add it at the end of the list so existing references keep their numbers.
- **A lesson specific to one subject** (its notation, reference lists, syllabus boundaries) goes in that subject's skill. A new subject creates `skills/<subject>-question-authoring/SKILL.md` that starts by pointing back here.
- Keep a case log beside the subject skill (`references/`) for each review round that finds errors: what was wrong, why it happened, and which check now catches it.
- Change these files in the PR where the lesson was learned, so the evidence travels with it.
