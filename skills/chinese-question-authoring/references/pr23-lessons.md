# PR 23 case log — errors, causes and the check that now catches them

Batch `zh-starter-001`. Claude drafted batch v8 (including 39 new P2 items) at `9d4357a`. ChatGPT cross-reviewed it and corrected ten items and three inventory rules at `3e5255f` (v9). Claude re-reviewed those corrections and refined three of them at `a1cd2ba` (v10). Generic original content only; no learner data.

Check references: plain numbers are the common checks in [question-authoring](../../question-authoring/SKILL.md); ZH numbers are the Chinese checks in [chinese-question-authoring](../SKILL.md). "Reports" and "How to work" are sections of the common skill.

## Claude errors found by ChatGPT

| Item or file | What was wrong | Why it happened | Check |
| --- | --- | --- | --- |
| `zh-p2-punctread.q1` | 冒号 annotated máo hào; correct is mào hào | Pinyin typed from memory. Character-list membership was checked by script; pinyin was never checked at all | 8, ZH2 |
| `zh-p2-radmeaning.q1` | Distractor 舌 is also "related to speaking", so the item had two defensible answers | Distractors were chosen for shared form (舌 inside 活/适/话) without testing their meaning against the stem's criterion | 2, ZH3 |
| `zh-p2-radmeaning.q4` | Stem said 口字旁 while 口 was the key | The "hint names the unique radical" defect had just been fixed in 33 old hints as a batch edit, but new items were not run through the same check | 5, ZH3; How to work 3–4 |
| `zh-p2-radmeaning-repair.q3` | Key 女孩子 for 女字旁 excludes 妈 | Picked a child-friendly word without testing it against the item's own examples | 3, ZH3 |
| `zh-p2-punctread-repair.q3` | "哪一句说话的人很高兴" keyed to ！; ！ shows strong feeling, not happiness | Taught a typical use of a mark as a one-to-one rule | 4 |
| `zh-p2-card-repair.q3` | Taught "name and date go at the bottom" as a universal card rule | Generalised one common layout into a requirement | 4 |
| `zh-p2-meaning.q4` | 晴 defined as 没有云 | Simplified definition no longer true; no dictionary check | 3 |
| `zh-p2-sound.q5` | Hint pointed only to initials; options also differ in tone | Hint written from the key's feature, not from what separates all four options | 7 |
| `zh-p2-sound.q7` | Explanation gave 着 a single reading (zhe) | Polyphonic character treated as monophonic | 8, ZH2 |
| `zh-p3-wordchoice.q5` | After the v8 fix, 害怕地承认了错误 was still coherent | Removed one ambiguity (double cue) without substituting every distractor | 2 |
| Inventory `analyse()` | A route could be "complete" from stages tagged to another leaf | Completeness checked per target globally, not per leaf; no tests, output only eyeballed | Reports |
| Inventory thin stock | One thin route made every route in the leaf count as thin | Used the leaf's minimum stock for every route | Reports |
| Inventory wording | "About N days before a material repeats" | Reported a prediction the code does not compute | Reports |
| Preparation doc | Material and batch counts left at the old values | Data changed without searching the docs for the numbers it affects | Reports |
| v8 preparation note | Called all three out-of-list items "outside the P1–P3 lists", though two are P2 items whose bound is P1–P2 | Grade bound not stated per item | 1, ZH1 |

## ChatGPT corrections refined by Claude

| Item or file | Refinement | Lesson |
| --- | --- | --- |
| `zh-p2-radmeaning-repair.q3` | 女的家人 still narrowed 女字旁 (to family); now 女人和女孩 | A fix needs the same counter-example test as the original |
| `zh-p2-punctread-repair.q3` | "语气更强" across four options; now 最强 | Read the stem's grammar against the number of options |
| `zh-p2-sound.q5` | New hint used 轻声读, which is also the neutral-tone term; now 小声读 | Avoid everyday words that are technical terms in the skill tested (7) |
| `test_chinese_release_inventory.py` | Hard-coded route totals; now derived from the data | Tests must survive new content |

## Found in Claude's self-check of the skills

| File | What was wrong | Lesson |
| --- | --- | --- |
| `chinese-question-authoring` ZH1 | Required every instruction *and passage* character to be on the cumulative list. Most of the bank's passages use common words beyond the lists, so the rule taught a convention as a requirement | A skill's own rules need check 4 too. ZH1 now separates tested characters, instruction words and passage vocabulary |

## Found while drafting zh-starter-002

| File | What was wrong | Lesson |
| --- | --- | --- |
| Batch layout | Batch v10 was approved, so adding 38 new items to it would have put unseen items under the owner's approval | New content goes in a new batch with its own review state (common skill, "Review and hand-over") |
| `starter-002.json` | Three new IDs (`zh-p2-wordchoice2.q1`–`q3`) already existed in `starter-001`; nothing checked IDs across files | The validator now checks every batch and rejects an ID used in two batches |
| Draft hints and explanations | 表示, 意思, 领着, 剩 and 通 were beyond the P1–P2 lists in text the child reads | Run the character-list check on hints and explanations as well as stems and options (ZH1) |
| Inventory tests | Three tests assumed one item per stage, so new stock broke them | Tests build the stock they need instead of relying on today's catalogue (Reports) |

## Root causes in Claude's process

### Second-batch cross-review — 2026-10-18

ChatGPT read all 38 `zh-starter-002` v1 questions and `zh-m20` at `619c7c3`. All keys were correct; six items needed revision. ChatGPT's v2 corrections require Claude re-review.

| Items | Finding and correction | Existing check |
| --- | --- | --- |
| `zh-m20.q2`, `zh-p2-reason-repair.q1`–`.q3` | The key was uniquely longest in every question, including all three repair stages. This was disclosed as a limitation but allowed a length-only strategy to pass the whole sequence. V2 uses similarly sized partial reasons and unsupported details; wrong options can also have two clauses. Disclosure does not resolve an assessment shortcut. | 2, 5, 10 |
| `zh-p2-confusable2-u8bb0.q3` | “写下来，不会忘” conflated recording with remembering and promised an outcome. V2 says the words are written down and can be read again. | 3, 4 |
| `zh-p2-wordchoice-b.q2` | “欺负就是对别人不好” was too broad to distinguish deliberate mistreatment from accidents. V2 gives deliberate hurtful actions as examples. | 3 |
| `zh-m20.q2`, `zh-p2-reason-repair.q1`–`.q2` (Claude re-review, v3) | After v2 every option had two parts, but the hints still asked how many things the reason has, which no longer separated the options. V3 hints ask which two things the text states. A fix that changes the options must recheck the hint and explanation. | 7 |
| Owner review provenance | Two revised items had already been sampled and accepted at v1. Keep those acceptances with v1; queue the v2 versions for a new decision. Draw the new sample from the 32 unchanged agreed items and retain both recipes. | Review and hand-over |

Source checks used dictionary entries for the tested senses and pinyin readings. The corrected reason questions retain explicit retrieval as their response demand; inventing a plausible but unsupported reason remains wrong. The current review pack lists the six revisions and exact sample history.

The fixes for these are the "How to work" steps in the common skill.

1. **Bulk authoring by script.** Items were generated in Python and validated structurally. They were not re-read rendered, one at a time, as a child would see them. (How to work 1–2)
2. **Uneven checks.** Old items got a careful defect sweep; new items written in the same session got only the structural validator and a character-list check. (How to work 3–4)
3. **Proxies taken for quality.** Passing the validator, the contract tests and the character-list script felt like a quality check. None of them tests meaning, distractor validity, pinyin or rule overreach.
4. **No independent check before handover.** Claude drafted 293 of the 318 reviewed items and all 39 new ones, so its own review was an author recheck. The disclosure was accurate, but the errors still reached the PR. (How to work 5–6)
5. **Reports without tests.** The inventory script's counting rules were not tested against adversarial fixtures, so plausible-looking wrong numbers passed. (Reports)
6. **Simplifying for children by narrowing meaning.** Child-friendly wording (女孩子, 没有云, 很高兴) was chosen without checking it remained true. (Check 3)

## zh-starter-003 author draft

Found by Claude while drafting the 117 items, before any review. Each was fixed in the draft and is recorded so the check catches it next time.

| Defect | Cause | Check that now catches it |
| --- | --- | --- |
| A left/right item said 过马路的时候，先看左边，再看右边. In Singapore traffic comes from the right first. | A stock sentence pattern was used without checking it against the learner's locale. Replaced with a two-hands sentence. | Common check 12 |
| 场 offered for a 工（　） blank; 工场 is also a word. | The sound-alike that a learner confuses is not always a safe distractor. The exact item now asks which sentence is written correctly (工厂 vs 足球场). | Common check 2 |
| Hints that contained the key character (学 in “学东西”, 天 in “今天”, 牛 in “牛身上”, 午 in “中午”). | Natural explanations reuse the target word. A script now flags any single-character key found in its hint. | Common check 5 |
| Words outside the P1–P2 lists in hints and explanations (数, 慢, 另, 交, 千, 春 and others). | Everyday words feel easy but are not on the lists. A script checked every text field against the cumulative lists. | ZH1 |

## Still to apply

- `zh-p2-sound-repair.q3` hint also says 轻声读; change it at the next content revision and redraw the sample, because it is in the agreed pool.
- `zh-p2-meaning.q4` key is the longest, most qualified option; balance option length at the next revision.
- A small lint in the validator could catch common checks 5 (key, key character or unique radical name in stem or hint) and 6 (one option in a material containing another question's key). It needs its own reviewed change.


## PR24 cross-review: context is not a definition

Read all 117 v1 items on 2026-10-18; 21 revised items require recheck. Several explanations turned one scene into a rule: clouds are white, seeds need soil to grow, learning means reading at school, wild animals live in forests. Other explanations equated reading with reading aloud or treated 那天 as necessarily past. The 喷 scene used unnatural wording, and a 九 recognition item also required addition.

Why missed: substituting distractors checked the keyed sentence but did not test the explanation against a counterexample. Common checks 3–4 must include a true counterexample to any general definition. Keep an explanation bounded to this sentence when it is only a scene; use an accurate dictionary meaning when defining a word. Recognition tasks should not require an unrelated subject skill. New wording needs the same grade-language scan as the original wording.
