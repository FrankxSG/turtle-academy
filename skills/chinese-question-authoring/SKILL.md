---
name: chinese-question-authoring
description: Use for Turtle Academy Chinese and Higher Chinese questions, repair pools and coverage reports, together with the common question-authoring skill. Adds Chinese checks for character lists, pinyin, radicals and leaf mapping.
---

# Chinese question authoring — on top of the common skill

**Read [question-authoring](../question-authoring/SKILL.md) first.** Its working method and its checks 1–11 apply to every Chinese item. This file adds Chinese-specific checks (ZH1–ZH5) and says how some common checks apply in Chinese. It never removes a common check.

Sources: [Chinese content](../../docs/CHINESE_CONTENT_PREPARATION.md) and `content/chinese/curriculum.json`. Evidence for every rule here is in the [PR 23 case log](references/pr23-lessons.md).

## How common checks apply in Chinese

| Common check | In Chinese |
| --- | --- |
| 1 Read it as the child | Use the cumulative character lists (ZH1). |
| 3 Authoritative source | Use a standard dictionary sense. 晴 allows a few clouds, so 没有云 is wrong. |
| 4 Convention, not rule | ！ shows strong feeling or emphasis, not happiness. A card's name and date tell the reader who wrote it and when; they are not "always at the bottom". |
| 5 Answer not in stem or hint | Includes the answer's character inside the stem (跑来（　）去 with 跑 as key) and the name of a radical only the key has (ZH3). |
| 6 Questions in one material | `zh-m12`: an option in question 1 (戴着圆眼镜) answered question 5. |
| 7 Hint matches the difference | 轻声 means "softly" and is also the neutral tone; in a tone question say 小声读. |
| 8 Verify against a source | Pinyin and readings (ZH2). |
| 9 Map to the demand | See ZH4. |

## Chinese checks

**ZH1 — Character lists.** The bound is the grade's cumulative official list: P1–P2 for P2 items, P1–P3 for P3 items. State it per item.
- A *tested* character (the answer in a character, cloze or radical item) outside the bound is an owner decision, not an author's call; add it to the dispute list.
- Instruction words (the part of the stem that tells the child what to do) stay within the bound, or carry pinyin that does not reveal the answer.
- The child reads hints and explanations too. Run the list check on them and prefer list words (就是 rather than 表示); flag any word left outside the lists in the hand-over.
- Passage and context vocabulary may go beyond the lists when the context makes it clear, as real texts do. Do not rewrite passages only to fit the lists; flag a beyond-list word only when the child needs it to answer.

**ZH2 — Pinyin and readings.** Check every pinyin syllable and tone in annotations and options against a dictionary before hand-over (a pinyin library can help where it installs; still check readings that depend on the word by hand). 冒号 is mào hào. For a character with more than one reading (着, 长, 还, 乐, 好), never present one reading as *the* reading; name the word it belongs to. Pinyin items assess written pinyin recognition only, not speaking or listening.

**ZH3 — Radicals and components.**
- A hint may name the meaning a radical carries (哪个偏旁和脚有关？). It may not name the radical when only the key has it (选足字旁的字).
- Distractors that share a component with the key can still match the stem's meaning: 舌 sits inside 活, 适 and 话, and is itself related to speaking.
- A category answer must fit every example and the radical's general meaning. 女字旁 relates to women and girls, so 女孩子 (leaves out 妈) and 女的家人 (only family) are both wrong.

**ZH4 — Leaf mapping.**
- Choosing a punctuation mark is writing (`w-punctuation`). Understanding a sentence through its punctuation is reading (`r-punctuation`).
- Explicit retrieval asks only for what the text states. Calculating a duration, a fine or a total, or comparing prices, applies information, which is a later-grade row of the matrix (syllabus PDF p29).
- Language-use items map to their language-use leaf, not to writing ideas.
- Shared CL/HCL items show availability, not HCL depth; no HCL coverage claim rests on a shared item.

**ZH5 — Original and local.** Use generic Singapore contexts (组屋, 巴士, 食堂) and original passages. Never adapt school worksheet, textbook or past-paper wording; papers inform question types only.

## Chinese commands before hand-over

```sh
python3 scripts/validate_chinese_content.py
python3 -m unittest discover -s scripts -p "test_*.py"
python3 scripts/chinese_release_inventory.py --check
python3 scripts/privacy_guard.py
git diff --check
```

Then list every pinyin syllable in new or changed items and confirm each against the dictionary (ZH2), and record in the hand-over comment which items were read rendered.

## Updating this skill

Chinese-only lessons go here as ZH6 onwards, with a case-log entry. A lesson that would apply in other subjects goes in [question-authoring](../question-authoring/SKILL.md) instead.
