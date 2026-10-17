---
name: chinese-question-authoring
description: Use when drafting, revising or reviewing Turtle Academy Chinese objective questions, repair pools or coverage reports, or when cross-reviewing another assistant's Chinese content. Gives the per-item checks that caught real errors in PR 23, so they are run before review rather than found in it.
---

# Chinese question authoring and review

This skill is for any assistant or person writing or reviewing Chinese content in `content/chinese/`. It does not replace [CONTENT_QA](../../docs/CONTENT_QA.md) or the [preparation record](../../docs/CHINESE_CONTENT_PREPARATION.md); it is the working checklist that applies them to one question at a time.

It exists because a draft that passed every structural check still had a wrong pinyin tone, a second defensible answer, a hint that gave away the key and three over-narrow definitions. The cross-review in PR 23 found them; [the case log](references/pr23-lessons.md) records each one, why it happened and which check below now catches it.

## Why structural checks are not enough

`validate_chinese_content.py`, the contract tests and a character-list script check shape, links, keys that exist and characters that appear in the official lists. None of them reads the question the way a P2 child does. Every error in the case log passed all of them. Run the checks below on **every** item, including items you wrote minutes ago in the same pass. In PR 23 the same defect class was fixed in 33 old hints and then reintroduced in new items, because the fix was applied as a batch edit, not as a check.

## Per-item checks

Do these on the rendered question (blanks and pinyin expanded), not on JSON.

1. **Read it as the child.** Read the stem, then each option, aloud in your head. Is every instruction character on the grade's cumulative list (P1–P2 for P2), or annotated with pinyin that does not reveal the answer?
2. **Substitute every distractor.** Put each wrong option into the blank or answer the stem with it. If any one is grammatical *and* defensible from the stem, the item has two answers. Test meaning, not only form: 舌 is not a 言字旁 character, but it is related to speaking, so "哪个字和说话有关" had two answers.
3. **Check the key against a dictionary sense, not a child-friendly paraphrase.** A simplified key must stay true. 晴 allows a few clouds, so "没有云" is wrong. 女字旁 relates to women and girls, so neither 女孩子 (leaves out 妈) nor 女的家人 (only family) is right. Find one counter-example from a familiar word before accepting a category.
4. **Do not turn a convention into a rule.** A punctuation mark, a card layout or a word choice is often typical, not required. ！ shows strong feeling or emphasis, not happiness. A name and date tell the reader who wrote the card and when; they are not "always at the bottom". Ask: would a teacher mark a different but correct child answer wrong because of this key?
5. **The stem and hint must not contain the answer or its giveaway feature.** Search the stem and hint for the key text, the key character, and the name of any radical or component that only the key has (口字旁 when 口 is the key; 足字旁 when only 踢 has 足; 跑来（　）去 with 跑 as the key). A hint may name the meaning the radical carries ("哪个偏旁和脚有关？"); it may not name the radical.
6. **Check other questions in the same material.** First answers for a whole material are collected before feedback, so an option in question 1 can answer question 5 (戴着圆眼镜 in `zh-m12`). Read every key in a material together.
7. **Match the hint to what actually separates the options.** If options differ in initials and tones, a hint about initials alone misleads. Avoid words that are also technical terms in the skill being tested: 轻声 means "softly" and also the neutral tone, so "轻声读" is confusing in a tone question; say 小声读.
8. **Verify every pinyin syllable and tone.** Never type pinyin from memory and move on. Check each annotation and pinyin option against a dictionary (or a pinyin library where one installs, then still check heteronyms by hand). 冒号 is mào hào, not máo hào. For a polyphonic character (着, 长, 还, 乐, 好), never present one reading as *the* reading; say which word the reading belongs to.
9. **Map to the demand, not the topic.** A question that needs a calculation or comparison (lesson length, a two-day fine, cheapest item, total fare) is not explicit retrieval; applying information is a later-grade leaf. A punctuation *choice* is writing (`w-punctuation`); reading *through* punctuation is `r-punctuation`. If the demand belongs to a leaf outside the course, rewrite the question rather than remap it.
10. **Keep the key from standing out.** Make options similar in length and specificity. A key that is the longest, most qualified option is a test-taking cue.
11. **Use neutral, original names.** No franchise characters (超人 → 演员), no worksheet or textbook wording.

## Reports and scripts

- Add a regression test for each counting rule before trusting a report. In PR 23 the inventory assembled one route from stages tagged to different leaves and marked a whole leaf thin because one route was thin; both looked plausible in the output.
- Tests must derive expected numbers from the data or the fixture they build, never from today's totals; a hard-coded `35 | 34` breaks the first time content is added.
- State only what the code computes. "At most N complete tasks without reusing a material" is computed; "about N days before a material repeats" is a scheduling prediction the code does not make.
- After changing data, search the docs for every count and version you changed (`grep -n "Version [0-9]\|materials" docs/`) and update them in the same commit.

## Review process

- Say who drafted each item and who reviewed it. An author's own recheck is not independent cross-review; record it as a recheck.
- Do not draft new content and review old content in one undivided pass. Draft, then review the new items with this checklist as strictly as the old ones, then hand them to the other assistant.
- Cross-review runs both ways. The reviewer's corrections need the same checks: in PR 23 a correct fix for 女孩子 (女的家人) still narrowed the category, and a correct fix for the ！ item compared four sentences with 更强 instead of 最强.
- Any change to an item moves it out of the agreed sample pool. Prefer refining items already in the dispute list; if a pooled item must change, redraw the sample with a recorded seed before the owner starts.
- An AI recommendation is never an owner decision. Leave `owner_signoff`, `rights_status` and `independent_review` as they are until the actual decision is recorded.

## Checks to run before handing over

```sh
python3 scripts/validate_chinese_content.py
python3 -m unittest discover -s scripts -p "test_*.py"
python3 scripts/chinese_release_inventory.py --check
python3 scripts/privacy_guard.py
git diff --check
```

Then the per-item checks above on every new or changed item, read in rendered form, and one note per item in the review pack saying what was checked.
