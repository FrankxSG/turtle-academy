# Chinese review pack — batch zh-starter-001 v10

**Review history:** batch and denominator approval were completed on 2026-10-18; see the current [batch record](../../content/chinese/batches/starter-001.json) and [preparation disposition](../CHINESE_CONTENT_PREPARATION.md#current-review--batch-version-10). Earlier pending states below describe the reviewed revisions, not new work to repeat. The sampled versions, recipes and owner decisions are retained.

Inputs reviewed: `9d4357a` (ChatGPT pass, batch v9) and `3e5255f` (Claude re-review, batch v10). This pack replaces v8 and v9 for current review; v8 is historical. Manifest remains `zh-2024-p2p3-draft.2`, proposed and import-disabled. No content, rights, grade map or release is approved.

## Review performed and limits

ChatGPT desk-reviewed all 357 v8 questions and all 19 materials: stems, four options and keys, help text, response demands, material context and repair-route reporting. This is independent cross-review for Claude-authored content; the 25 originally ChatGPT-authored items are an author recheck here, with the prior Claude cross-review recorded in v8. Ten corrected item versions are ChatGPT edits and require Claude re-review. `independent_review` therefore remains `changes_requested`, and owner/rights approval remains pending.

All three source fingerprints match the current register. The saved MOE syllabus text does not retain the coloured grade bands; the live official PDF returned a browser challenge. Source wording/page anchoring is not a completed independent visual grade audit. Keep that audit open for PDF pp28–32, and retain the full denominator as proposed. No private-library text is reproduced here.

## Claude re-review of the v9 corrections (batch v10)

Claude re-reviewed all ten ChatGPT corrections at `3e5255f`, the inventory algorithm changes and the four regression tests, and confirmed the v9 sample reproduces from the stated seed. All ten corrections are accepted in substance. Three still-disputed items get a further wording refinement in v10, so they need ChatGPT re-review before the owner rules:

| Item | v10 refinement |
| --- | --- |
| `zh-p2-radmeaning-repair.q3` v3 | 女的家人 still narrows 女字旁 (to family). Key is now 女人和女孩; explanation says 女字旁 characters often relate to women and girls. |
| `zh-p2-punctread-repair.q3` v3 | Four sentences are compared, so the stem asks for 最强 rather than 更强. |
| `zh-p2-sound.q5` v3 | Hint said 轻声读; children also learn 轻声 as the neutral tone, which is confusing in a tone question. Now 小声读. |

Inventory test fix: the thin-stock regression no longer hard-codes 35/34 routes, so adding content does not break it. Non-blocking notes, no change made: `zh-p2-meaning.q4`'s key is now the longest and most qualified option, a mild test-taking cue; `zh-p2-sound-repair.q3` (in the agreed pool) also says 轻声读 in its hint and should get the same wording at the next content revision, which will move it out of the pool and require a redraw. Pool membership did not change in v10, so the v9 draw below still stands.

## A. Corrections from the v9 pass (10)

| Item | Finding / correction |
| --- | --- |
| `zh-p2-punctread.q1` v2 | 冒号 pinyin had the wrong tone on 冒 (máo → mào). |
| `zh-p2-radmeaning.q1` v2 | 舌 is also related to speaking; replace the ambiguous distractor and explicitly assess the radical cue. |
| `zh-p2-radmeaning.q4` v2 | The stem named 口字旁 while 口 was the key. |
| `zh-p2-radmeaning-repair.q3` v2→v3 | 女字旁 includes adult women; 女孩子 incorrectly narrows the category. |
| `zh-p2-punctread-repair.q3` v2→v3 | An exclamation mark signals strong feeling or emphasis, not necessarily happiness. |
| `zh-p2-card-repair.q3` v2 | Do not teach a particular card layout as a universal compulsory rule. |
| `zh-p2-meaning.q4` v2 | 晴 does not require a completely cloudless sky. |
| `zh-p2-sound.q5` v2→v3 | The options differ in both initials and tones; the old hint directed attention to initials alone. |
| `zh-p2-sound.q7` v2 | 着 is polyphonic; do not present zhe as its only pronunciation. |
| `zh-p3-wordchoice.q5` v4 | 害怕地承认错误 was also coherent; revised context specifically asks for the trait demonstrated by never lying. |

Inventory fixes also require review: route completion uses stages under the same leaf; thin stock is counted per route; material quota arithmetic is an upper bound on complete tasks without reuse, not a prediction of days. Four regression cases are in `scripts/test_chinese_release_inventory.py`.

## B. Owner disposition queue (24)

**Owner decisions recorded 2026-10-18:** all 24 accepted as written in their v10 versions, with no notes. They are cleared from `review_log.disputed_item_ids`; the decision record is in `review_log.author_checks`. Earlier text below is kept as the review history.

All 15 prior disputed IDs were pending owner disposition. Nine newly corrected IDs were added; the tenth correction was already disputed. An AI recommendation is not an owner decision.

- `zh-m18.q2`, `zh-m18.q4`, `zh-m15.q5`: decide whether the out-of-list tested vocabulary is acceptable at the tagged course/grade, needs pinyin/support, or should be replaced. The old v8 note conflated P1–P2 and P1–P3 list bounds; this pass does not certify a new exhaustive character-list audit.
- Other IDs: review the revised wording/key/help and explicitly accept or request revision. The three empty-decision columns below remain blank until the owner rules.

| Item | Owner decision | Reason / required follow-up |
| --- | --- | --- |
| `zh-p2-order.q2` v3 | accepted 2026-10-18 | none |
| `zh-p2-collocation.q8` v2 | accepted 2026-10-18 | none |
| `zh-p3-wordchoice.q5` v4 | accepted 2026-10-18 | none |
| `zh-m07.q5` v2 | accepted 2026-10-18 | none |
| `zh-m10.q5` v2 | accepted 2026-10-18 | none |
| `zh-m12.q5` v3 | accepted 2026-10-18 | none |
| `zh-m14.q5` v2 | accepted 2026-10-18 | none |
| `zh-m18.q2` v1 | accepted 2026-10-18 | none |
| `zh-m18.q4` v1 | accepted 2026-10-18 | none |
| `zh-m15.q5` v1 | accepted 2026-10-18 | none |
| `zh-p2-charctx-repair.q2` v2 | accepted 2026-10-18 | none |
| `zh-m08.q3` v2 | accepted 2026-10-18 | none |
| `zh-m17.q5` v2 | accepted 2026-10-18 | none |
| `zh-p2-notice-repair.q3` v2 | accepted 2026-10-18 | none |
| `zh-p3-notice-repair.q3` v2 | accepted 2026-10-18 | none |
| `zh-p2-punctread.q1` v2 | accepted 2026-10-18 | none |
| `zh-p2-radmeaning.q1` v2 | accepted 2026-10-18 | none |
| `zh-p2-radmeaning.q4` v2 | accepted 2026-10-18 | none |
| `zh-p2-radmeaning-repair.q3` v3 | accepted 2026-10-18 | none |
| `zh-p2-punctread-repair.q3` v3 | accepted 2026-10-18 | none |
| `zh-p2-card-repair.q3` v2 | accepted 2026-10-18 | none |
| `zh-p2-meaning.q4` v2 | accepted 2026-10-18 | none |
| `zh-p2-sound.q5` v3 | accepted 2026-10-18 | none |
| `zh-p2-sound.q7` v2 | accepted 2026-10-18 | none |

- `zh-p2-order.q2` v3 (lu-sentence-order, general)
  - 哪个句子排得对？（妈妈 / 在厨房 / 做饭 / 正）
  - Options: 妈妈正在做饭厨房。 · 在厨房妈妈做饭正。 · 正妈妈在厨房做饭。 · **妈妈正在厨房做饭。**
  - Hint: 先找出谁在做什么，再看看地点放在哪里。 · Explanation: 妈妈在厨房里做饭，所以选“妈妈正在厨房做饭。”

- `zh-p2-collocation.q8` v2 (lu-collocation, general)
  - 哥哥拿着鱼竿在河边[空1]鱼。
  - Options: **钓** · 放 · 踢 · 弹
  - Hint: 想一想用鱼竿做什么。 · Explanation: 哥哥用鱼竿钓鱼，所以选“钓”。

- `zh-p3-wordchoice.q5` v4 (r-word-context, general)
  - 小明从来不说谎，大家都说他是个[空1]的孩子。
  - Options: 生气 · **诚实** · 骄傲 · 害怕
  - Hint: 不说谎、说实话的人是怎样的？ · Explanation: 从来不说谎、总是说实话，是“诚实”的表现。这里用“诚实”形容小明。

- `zh-m07.q5` v2 (r-explicit, general)
  - 下大雨时，小蚂蚁们已经住进了哪里？
  - Options: **新家** · 河里 · 树顶 · 饼干下面
  - Hint: 再读故事的最后一句。 · Explanation: 最后一句说，蚂蚁们已经住进了新家。
  - Material: `zh-m07` (full text below).

- `zh-m10.q5` v2 (r-explicit, general)
  - 第二天，面包店里有什么变化？
  - Options: 面包全都不见了 · 店里没有客人 · 店搬到了路口 · **店里挤满了客人**
  - Hint: 找一找写“第二天”的那一句。 · Explanation: 最后一句说，第二天店里挤满了客人。
  - Material: `zh-m10` (full text below).

- `zh-m12.q5` v3 (r-explicit, general)
  - 有了这样的好朋友，“我”觉得怎样？
  - Options: 很害怕 · **很幸福** · 很生气 · 很无聊
  - Hint: 看最后一句。 · Explanation: 最后一句写明：有这样的好朋友，我觉得很幸福。
  - Material: `zh-m12` (full text below).

- `zh-m14.q5` v2 (r-explicit, general)
  - 妈妈叫小鸟张开什么？
  - Options: 嘴巴 · **翅膀** · 尾巴 · 爪子
  - Hint: 再读妈妈对小鸟说的话。 · Explanation: 妈妈说：“张开翅膀，用力拍！”
  - Material: `zh-m14` (full text below).

- `zh-m18.q2` v1 (r-character, general)
  - 第2空选哪个字？
  - Options: 倍 · 北 · **背** · 被
  - Hint: 书包放在身后，用肩膀带着。 · Explanation: 书包要“背”着。
  - Material: `zh-m18` (full text below).

- `zh-m18.q4` v1 (r-character, general)
  - 第4空选哪个字？
  - Options: 案 · **按** · 安 · 暗
  - Hint: 照着规定的时间去做。 · Explanation: “按时”表示照着规定的时间。
  - Material: `zh-m18` (full text below).

- `zh-m15.q5` v1 (r-character, general)
  - 第5空选哪个字？
  - Options: 偷 · 榆 · 输 · **愉**
  - Hint: 组成表示开心的词。 · Explanation: “愉快”表示开心，竖心旁。
  - Material: `zh-m15` (full text below).

- `zh-p2-charctx-repair.q2` v2 (r-character, similar)
  - 我吃得很[空1]，一口也吃不下了。
  - Options: 跑 · 抱 · 泡 · **饱**
  - Hint: 吃了很多东西以后，会觉得怎样？ · Explanation: 吃够了叫“饱”。“饱”是食字旁，和吃有关。

- `zh-m08.q3` v2 (r-explicit-practical, general)
  - 游泳班几点开始上课？
  - Options: 下午两点 · 上午三点 · **下午三点** · 下午四点
  - Hint: 看“时间”一行。 · Explanation: “时间”一行写明下午三点到四点，所以三点开始。
  - Material: `zh-m08` (full text below).

- `zh-m17.q5` v2 (r-explicit-practical, general)
  - 书迟还了，每本书每天要罚多少钱？
  - Options: 二十分钱 · **十分钱** · 五十分钱 · 一元
  - Hint: 看第4条。 · Explanation: 第4条写明逾期还书每本每天罚款十分钱。
  - Material: `zh-m17` (full text below).

- `zh-p2-notice-repair.q3` v2 (r-explicit-practical, generic)
  - 读一读：【食堂今日午餐】 / 鸡饭：两元 / 炒面：一元五角 / 苹果：五角 / 炒面多少钱？
  - Options: 两元 · 五角 · **一元五角** · 一元
  - Hint: 找一找“炒面”这一行。 · Explanation: 告示写明炒面一元五角。

- `zh-p3-notice-repair.q3` v2 (r-explicit-practical, generic)
  - 读一读：【巴士车费】 / 大人：一元五角 / 小学生：五角 / 小学生坐巴士要付多少钱？
  - Options: 一元五角 · **五角** · 两元 · 一元
  - Hint: 找一找“小学生”这一行。 · Explanation: 告示写明小学生的车费是五角。

- `zh-p2-punctread.q1` v2 (r-punctuation, general)
  - 老师说：“请大家坐好。”冒号(mào hào)“：”后面写的是什么？
  - Options: 老师是谁 · 同学说的话 · **老师说的话** · 上课的时间
  - Hint: 看看“：”前面写着“老师说”。 · Explanation: 冒号“：”后面引号里的，是老师说的话。

- `zh-p2-radmeaning.q1` v2 (r-radical, general)
  - 看看偏旁，下面哪个字和说话有关？
  - Options: 活 · 恬 · **话** · 适
  - Hint: 看看每个字的左边，哪个偏旁和说话有关？ · Explanation: “话”是言字旁，和说话有关。

- `zh-p2-radmeaning.q4` v2 (r-radical, general)
  - “吃、喝、唱”的左边都一样。它们都和什么有关？
  - Options: 眼睛 · **口** · 脚 · 耳朵
  - Hint: 吃东西、喝水、唱歌，都要用到哪里？ · Explanation: “吃、喝、唱”都要用口，所以都是口字旁。

- `zh-p2-radmeaning-repair.q3` v3 (r-radical, generic)
  - “妈、姐、妹”都有同一个偏旁(piān páng)。这个偏旁和什么有关？
  - Options: **女人和女孩** · 马 · 树木 · 嘴巴
  - Hint: 这三个字说的都是家里的什么人？ · Explanation: 女字旁的字常和女人、女孩有关。“妈、姐、妹”都是家里的女人或女孩。

- `zh-p2-punctread-repair.q3` v3 (r-punctuation, generic)
  - 哪一句读起来语气最强？
  - Options: 妈妈回来了吗？ · 妈妈回来了。 · **妈妈回来了！** · 妈妈回来了没有？
  - Hint: 比较句子最后的标点，想想读的时候语气有什么不同。 · Explanation: “妈妈回来了！”用感叹号，读起来语气更强。感叹号可以表示高兴、惊讶等不同感情，不能只凭它判断心情。

- `zh-p2-card-repair.q3` v2 (written-purpose, generic)
  - 写生日卡时，写上自己的名字和日期，主要是让朋友知道什么？
  - Options: 今天的天气 · 礼物的价钱 · 学校的地址 · **谁写的、哪一天写的**
  - Hint: 想一想，名字和日期分别告诉别人什么。 · Explanation: 名字告诉朋友是谁写的，日期告诉朋友是哪一天写的。

- `zh-p2-meaning.q4` v2 (r-char-meaning, general)
  - “今天是晴天。”“晴”是说什么？
  - Options: 下着大雨 · 天上有很多乌云 · **天空明亮，云很少或没有云** · 刮着大风
  - Hint: 想想晴天和阴天、雨天有什么不同。 · Explanation: “晴”表示天空明亮，云很少或没有云；晴天也可能有少量的云。

- `zh-p2-sound.q5` v3 (r-char-sound, general)
  - 拼音“pǎo”是哪个字？
  - Options: 抱 · **跑** · 泡 · 饱
  - Hint: 小声读一读每个字，再比较声母和声调。 · Explanation: “跑”读 pǎo。“抱”读 bào，“泡”读 pào，“饱”读 bǎo。

- `zh-p2-sound.q7` v2 (r-char-sound, general)
  - 拼音“kàn”是哪个字？
  - Options: 着 · 手 · **看** · 目
  - Hint: 这个字和眼睛有关。 · Explanation: “看”读 kàn。“手”读 shǒu，“目”读 mù。“着”有不同读音，如“看着”的 zhe、“睡着”的 zháo，都不是 kàn。

## C. Random owner sample (67 of 333 AI-agreed unchanged items)

The pool contains every current item except the 24 outstanding/revised disputed IDs. After this desk review, previously new and wording-only items may enter the agreed pool if unchanged and not disputed. The v8 draw is historical. This new draw is prepared for owner review, not an approval record. Reproduce in Python using batch order:

```python
# The pool excludes the 24 IDs that were disputed when the sample was drawn (now resolved).
DISPUTED_AT_DRAW = ["zh-p2-order.q2", "zh-p2-collocation.q8", "zh-p3-wordchoice.q5", "zh-m07.q5", "zh-m10.q5", "zh-m12.q5", "zh-m14.q5", "zh-m18.q2", "zh-m18.q4", "zh-m15.q5", "zh-p2-charctx-repair.q2", "zh-m08.q3", "zh-m17.q5", "zh-p2-notice-repair.q3", "zh-p3-notice-repair.q3", "zh-p2-punctread.q1", "zh-p2-radmeaning.q1", "zh-p2-radmeaning.q4", "zh-p2-radmeaning-repair.q3", "zh-p2-punctread-repair.q3", "zh-p2-card-repair.q3", "zh-p2-meaning.q4", "zh-p2-sound.q5", "zh-p2-sound.q7"]
pool = [i['id'] for i in batch['items'] if i['id'] not in DISPUTED_AT_DRAW]
picked = set(random.Random('zh-starter-001-v9-owner-sample-2026-10-17').sample(pool, math.ceil(len(pool) / 5)))
sample = [iid for iid in pool if iid in picked]
assert sample == batch['review_log']['sampled_item_ids']
```

**Owner outcome 2026-10-18:** all 67 sampled items accepted with no notes.

67 is `ceil(333/5)`; the sample and disputes are disjoint. Owner should review each sample question with its material and mark acceptance or a new dispute. If the agreed pool changes, regenerate the draw and record that change before sign-off.

- `zh-m02.q1` v2 (r-explicit-practical, general)
  - 图书角哪一天开放？
  - Options: 星期一 · 星期二 · **星期三** · 星期四
  - Hint: 看通知中的开放时间。 · Explanation: 通知写明星期三开放。
  - Material: `zh-m02` (full text below).

- `zh-m03.q2` v2 (lu-word-choice, general)
  - 第2空选哪个词？
  - Options: 写字 · 洗澡 · **唱歌** · 看书
  - Hint: 看看做这个动作的是谁。 · Explanation: 这段话写小鸟在树上唱歌。
  - Material: `zh-m03` (full text below).

- `zh-m03.q4` v3 (r-character, general)
  - 第4空选哪个字？
  - Options: 永 · **水** · 木 · 禾
  - Hint: 想想“喝了几口”后面可以接什么。 · Explanation: “水”可以喝。“永”和“水”样子很像，要看清楚。
  - Material: `zh-m03` (full text below).

- `zh-p2-confusable-u5ea7.q2` v3 (r-character, similar)
  - 这[空1]桥很长。
  - Options: 坐 · 作 · **座** · 做
  - Hint: 这里要选表示桥的数量的字。 · Explanation: 说一座桥、这座桥，都用“座”。

- `zh-p2-confusable-u6674.q1` v3 (r-character, exact)
  - 天空没有云，今天是[空1]天。
  - Options: 睛 · 情 · 请 · **晴**
  - Hint: 想一想，哪个字用来写天气？ · Explanation: 没有云、天气好，可以说“晴天”。

- `zh-p2-confusable-u5df2.q2` v4 (r-character, similar)
  - 天[空1]经黑了，我们回家吧。
  - Options: 以 · 己 · **已** · 乙
  - Hint: 天不是刚要变黑，现在外面是什么样的？ · Explanation: “已经”表示事情已经发生了。

- `zh-p2-confusable-u5356.q3` v3 (r-character, generic)
  - 姐姐把旧玩具[空1]了，得到十块钱。
  - Options: **卖** · 读 · 买 · 实
  - Hint: 想一想，得到钱的人是在买还是卖？ · Explanation: 把东西给别人、得到钱，是“卖”。

- `zh-p2-confusable-u6839.q2` v3 (r-character, similar)
  - 大树的[空1]长在泥土里。
  - Options: 很 · 跟 · 银 · **根**
  - Hint: 想想大树哪一部分在泥土下面。 · Explanation: 树在泥土下面的部分叫“根”。“根”是木字旁，和树木有关。

- `zh-p2-confusable-u64cd.q1` v3 (r-character, exact)
  - 早上，我们在礼堂做早[空1]。
  - Options: 澡 · **操** · 燥 · 躁
  - Hint: 想一想，早上大家一起做的运动叫什么？ · Explanation: “早操”是早上做的运动。做操要用手，所以“操”是提手旁。

- `zh-p2-confusable-u64cd.q2` v3 (r-character, similar)
  - 下课了，同学们在[空1]场上跑步。
  - Options: 澡 · 燥 · **操** · 躁
  - Hint: 想一想，学校里跑步的地方叫什么？ · Explanation: “操场”是学校里运动的地方，写“操”。

- `zh-p2-radical-u5439.q3` v2 (r-radical, generic)
  - 小朋友对着蒲公英用力一[空1]，种子就飞走了。
  - Options: 欢 · **吹** · 炊 · 饮
  - Hint: 用嘴巴出气。想一想，哪个偏旁和嘴巴有关？ · Explanation: 用嘴出气是“吹”。

- `zh-p2-radical-u7092.q3` v1 (r-radical, generic)
  - 爸爸把青菜放进锅里，用大火[空1]熟了。
  - Options: 吵 · 抄 · **炒** · 秒
  - Hint: 用大火做菜，选和火有关的字。 · Explanation: 用火做菜写“炒”。

- `zh-p2-radical-u6c60.q3` v1 (r-radical, generic)
  - 这个[空1]塘里有许多鱼。
  - Options: 驰 · 他 · **池** · 地
  - Hint: 鱼住在有水的地方。 · Explanation: “池塘”是有水的地方，三点水。

- `zh-p2-radical-u7761.q3` v1 (r-radical, generic)
  - 弟弟太累了，一坐上车就[空1]着了。
  - Options: 锤 · 垂 · 捶 · **睡**
  - Hint: 太累了会怎样？想想和眼睛有关的偏旁。 · Explanation: 累了就会睡着，写“睡”。

- `zh-p2-measure.q8` v1 (lu-measure-word, general)
  - 下雨了，我带了一[空1]雨伞。
  - Options: 只 · 张 · **把** · 本
  - Hint: 有柄可以拿着的东西。 · Explanation: 伞用“把”来数。

- `zh-p2-collocation.q5` v1 (lu-collocation, general)
  - 我每天早上都[空1]牙。
  - Options: 踢 · 放 · 打 · **刷**
  - Hint: 用牙刷做的事。 · Explanation: 用牙刷“刷牙”。

- `zh-p2-wordchoice.q3` v1 (lu-word-choice, generic)
  - 这条路很[空1]，我们走了很久。
  - Options: 短 · **长** · 新 · 甜
  - Hint: 走了很久说明路怎么样？ · Explanation: 路长才要走很久。

- `zh-p2-wordchoice.q4` v1 (lu-word-choice, general)
  - 图书馆里很[空1]，大家都在看书。
  - Options: 忙乱 · 吵闹 · 热闹 · **安静**
  - Hint: 看书的地方需要怎样？ · Explanation: 图书馆里要安静。

- `zh-p2-wordchoice.q5` v1 (lu-word-choice, general)
  - 他每天都很早起床，从来不[空1]到。
  - Options: **迟** · 先 · 早 · 快
  - Hint: 早起床就不会怎样？ · Explanation: 早起床就不会迟到。

- `zh-p2-wordchoice.q7` v1 (lu-word-choice, general)
  - 这个西瓜又大又[空1]。
  - Options: 辣 · 苦 · **甜** · 臭
  - Hint: 好吃的西瓜是什么味道？ · Explanation: 西瓜又大又甜。

- `zh-p2-punct.q3` v2 (w-punctuation, generic)
  - 选一个标点(biāo diǎn)：我喜欢苹果[空1]香蕉和葡萄。
  - Options: ！ · **、** · 。 · ？
  - Hint: 几样东西排在一起时用什么隔开？ · Explanation: 并列的词语之间用顿号“、”。

- `zh-m06.q3` v1 (r-explicit, general)
  - 我帮奶奶做了哪件事？
  - Options: 洗碗 · **扫地** · 买菜 · 做饭
  - Hint: 找“我帮奶奶”后面的话。 · Explanation: 我帮奶奶扫地，还把衣服收进来。
  - Material: `zh-m06` (full text below).

- `zh-m07.q4` v1 (r-explicit, general)
  - 谁来帮小蚂蚁？
  - Options: 一只小鸟 · 蚂蚁妈妈 · 没有人 · **旁边的两只蚂蚁**
  - Hint: 找“帮忙”前面的词。 · Explanation: 旁边的两只蚂蚁马上过来帮忙。
  - Material: `zh-m07` (full text below).

- `zh-m08.q1` v1 (r-explicit-practical, general)
  - 谁可以报名参加游泳班？
  - Options: 家长 · **二年级学生** · 所有老师 · 一年级学生
  - Hint: 看“对象”。 · Explanation: 对象是二年级学生。
  - Material: `zh-m08` (full text below).

- `zh-m09.q2` v1 (r-explicit, general)
  - 春联是什么颜色的？
  - Options: 白色 · **红色** · 蓝色 · 绿色
  - Hint: 找“春联”前面的词。 · Explanation: 短文说“红红的春联”。
  - Material: `zh-m09` (full text below).

- `zh-m18.q3` v1 (r-character, general)
  - 第3空选哪个字？
  - Options: 完 · 园 · **玩** · 远
  - Hint: 和同学们一起做游戏。 · Explanation: “玩游戏”的“玩”是王字旁。
  - Material: `zh-m18` (full text below).

- `zh-m18.q5` v1 (lu-word-choice, general)
  - 第5空选哪个词？
  - Options: 可怕 · 难过 · 无聊 · **充实**
  - Hint: 一天里做了很多有意义的事。 · Explanation: 做了很多事，一天过得很充实。
  - Material: `zh-m18` (full text below).

- `zh-p2-wordchoice2.q1` v1 (lu-word-choice, general)
  - 小明考试前很[空1]，手心都出汗了。
  - Options: **紧张** · 安静 · 舒服 · 开心
  - Hint: 手心出汗是什么感觉？ · Explanation: 考试前手心出汗，说明很紧张。

- `zh-p2-sound.q1` v1 (r-char-sound, general)
  - “我长大了。”这里的“长”怎么读？
  - Options: cháng · **zhǎng** · zhāng · chǎng
  - Hint: 这里的“长”是说人变大了，不是说东西很长。 · Explanation: “长大”的“长”读 zhǎng。说东西很长时读 cháng。

- `zh-p2-sound.q2` v1 (r-char-sound, general)
  - “这条路很长。”这里的“长”怎么读？
  - Options: zhǎng · zhàng · **cháng** · chāng
  - Hint: 这里说的是路的长短。 · Explanation: 说长短的“长”读 cháng。

- `zh-m19.q1` v1 (written-purpose, general)
  - 这张卡是写给谁的？
  - Options: 小文 · **小美** · 妈妈 · 老师
  - Hint: 看第一行“亲爱的”后面的名字。 · Explanation: 第一行写着“亲爱的小美”，卡是写给小美的。
  - Material: `zh-m19` (full text below).

- `zh-m19.q2` v1 (written-purpose, general)
  - 这张卡是谁写的？
  - Options: 小美 · 老师 · **小文** · 妈妈
  - Hint: 看卡的下面写的名字。 · Explanation: 卡的下面写着“你的好朋友 小文”。
  - Material: `zh-m19` (full text below).

- `zh-m19.q5` v1 (written-purpose, general)
  - 卡的最下面写的是什么？
  - Options: 祝你的话 · 收卡的人 · **写卡的人和日期** · 送的礼物
  - Hint: 看看最后两行写了什么。 · Explanation: 最后两行写的是写卡的人“小文”和日期“十月八日”。
  - Material: `zh-m19` (full text below).

- `zh-p2-radmeaning-repair.q1` v1 (r-radical, exact)
  - 下面哪个字和水有关？
  - Options: 何 · **河** · 可 · 哥
  - Hint: 看看每个字的左边。 · Explanation: “河”是三点水，河里有水。其他三个字都有“可”，但和水没有关系。

- `zh-p2-radmeaning-repair.q2` v1 (r-radical, similar)
  - 下面哪个字和火有关？
  - Options: 打 · 钉 · **灯** · 盯
  - Hint: 以前的灯要点火才会亮。看看每个字的左边。 · Explanation: “灯”是火字旁，和火、和光有关。

- `zh-p2-punctread.q2` v1 (r-punctuation, general)
  - “我喜欢红色、黄色和蓝色。”这句话说到几种颜色？
  - Options: 一种 · 两种 · **三种** · 四种
  - Hint: “、”和“和”把颜色分开了，一个一个数。 · Explanation: 红色、黄色和蓝色，一共三种颜色。

- `zh-p2-punctread.q3` v1 (r-punctuation, general)
  - 哪一句是在说一件事，不是在问别人？
  - Options: 小明在家吗？ · **小明在家。** · 小明去哪里了？ · 小明在家没有？
  - Hint: 找一找最后不是问号的句子。 · Explanation: “小明在家。”最后是句号，是在说一件事。其他三句都在问人。

- `zh-p3-confusable-u7bee.q2` v2 (r-character, similar)
  - 妈妈提着菜[空1]去市场。
  - Options: 监 · 蓝 · **篮** · 栏
  - Hint: 装菜的东西。想一想，哪个偏旁和竹子有关？ · Explanation: 装东西的“篮子”是竹字头。

- `zh-p3-confusable-u7ba1.q1` v2 (r-character, exact)
  - 水[空1]破了，水流了一地。
  - Options: 官 · 关 · **管** · 馆
  - Hint: 水从这条长长的东西里流过。想一想，哪个偏旁和竹子有关？ · Explanation: “水管”的“管”是竹字头。

- `zh-p3-confusable-u7ba1.q3` v1 (r-character, generic)
  - 这根吸[空1]是用纸做的。
  - Options: **管** · 馆 · 关 · 官
  - Hint: 喝饮料用的细长东西。 · Explanation: “吸管”的“管”是竹字头。

- `zh-p3-confusable-u72fc.q1` v1 (r-character, exact)
  - 大灰[空1]想吃小羊。
  - Options: 郎 · 朗 · **狼** · 浪
  - Hint: 这是一种动物，看偏旁。 · Explanation: 动物“狼”是反犬旁。

- `zh-p3-confusable-u9493.q1` v2 (r-character, exact)
  - 爸爸带我去河边[空1]鱼。
  - Options: **钓** · 钩 · 约 · 的
  - Hint: 用鱼竿抓鱼。想一想，哪个偏旁和金属有关？ · Explanation: “钓鱼”的“钓”是金字旁。

- `zh-p3-confusable-u9493.q2` v1 (r-character, similar)
  - 小猫也想学[空1]鱼。
  - Options: 的 · **钓** · 钩 · 约
  - Hint: 用鱼竿等鱼上来。 · Explanation: “钓鱼”的“钓”和鱼钩有关，金字旁。

- `zh-p3-confusable-u9493.q3` v1 (r-character, generic)
  - 他拿着长长的[空1]竿坐在湖边。
  - Options: **钓** · 的 · 约 · 钩
  - Hint: 这根竿子是用来做什么的？ · Explanation: “钓竿”是钓鱼用的竿子。

- `zh-p3-confusable-u8eba.q3` v1 (r-character, generic)
  - 他累得一回家就[空1]下了。
  - Options: 淌 · 尚 · 趟 · **躺**
  - Hint: 累了，身体平放休息。 · Explanation: “躺下”是身字旁的“躺”。

- `zh-p3-confusable-u788e.q2` v1 (r-character, similar)
  - 窗户的玻璃被球打[空1]了。
  - Options: **碎** · 翠 · 卒 · 醉
  - Hint: 玻璃变成很多小片。 · Explanation: 变成小块小片写“碎”。

- `zh-p3-confusable-u62ab.q3` v2 (r-character, generic)
  - 演员[空1]着一件红色的斗篷。
  - Options: **披** · 波 · 被 · 坡
  - Hint: 斗篷搭在肩上。 · Explanation: 斗篷搭在肩上用“披”。

- `zh-p3-radical-u8e29.q2` v1 (r-radical, similar)
  - 他一不小心[空1]进了水坑。
  - Options: 彩 · **踩** · 睬 · 采
  - Hint: 脚走进了水坑。 · Explanation: 脚踏进去是“踩”。

- `zh-p3-radical-u8e29.q3` v1 (r-radical, generic)
  - 我们在沙滩上[空1]出一个个脚印。
  - Options: 睬 · 采 · **踩** · 彩
  - Hint: 留下脚印的动作。 · Explanation: 用脚踏出脚印写“踩”。

- `zh-p3-radical-u642c.q2` v1 (r-radical, similar)
  - 蚂蚁在[空1]家。
  - Options: 般 · **搬** · 船 · 盘
  - Hint: 把东西从一个地方移到另一个地方。 · Explanation: “搬家”的“搬”是提手旁。

- `zh-p3-collocation.q1` v1 (lu-collocation, exact)
  - 我报名[空1]了学校的歌唱比赛。
  - Options: 参观 · 观察 · 打开 · **参加**
  - Hint: 加入比赛用哪个词？ · Explanation: “参加比赛”表示加入比赛。

- `zh-p3-collocation.q5` v1 (lu-collocation, general)
  - 早睡早起是一个好[空1]。
  - Options: 天气 · 衣服 · 颜色 · **习惯**
  - Hint: 每天都会这样做的事。 · Explanation: “好习惯”。

- `zh-p3-collocation.q6` v1 (lu-collocation, general)
  - 过马路时要遵守交通[空1]。
  - Options: 树叶 · 书包 · **规则** · 汽车
  - Hint: 大家都要遵守的要求。 · Explanation: “遵守规则”。

- `zh-p3-wordchoice.q3` v1 (r-word-context, generic)
  - 这道数学题太[空1]了，我想了很久也不会做。
  - Options: 容易 · 快 · 简单 · **难**
  - Hint: 想了很久也不会做，说明题目怎样？ · Explanation: 题目难才会想很久。

- `zh-p3-sentence.q5` v1 (lu-sentence-transform, similar)
  - 用“把”改写：“弟弟吃完了饼干。”
  - Options: 弟弟吃完了把饼干。 · **弟弟把饼干吃完了。** · 饼干把弟弟吃完了。 · 把弟弟饼干吃完了。
  - Hint: “把”后面是被处理的东西。 · Explanation: “弟弟把饼干吃完了。”

- `zh-p3-punct.q1` v1 (w-punctuation, exact)
  - 选出正确的标点：你喜欢吃苹果还是香蕉[空1]
  - Options: 、 · ！ · 。 · **？**
  - Hint: 这句话在问人选择。 · Explanation: 问句用问号。

- `zh-m10.q2` v1 (r-explicit, general)
  - 第一天为什么来买面包的动物很少？
  - Options: 价钱太贵 · **店在树林深处，大家找不到** · 那天下大雨 · 面包不好吃
  - Hint: 猫头鹰说了什么？ · Explanation: 猫头鹰说店在树林深处，大家都找不到。
  - Material: `zh-m10` (full text below).

- `zh-m10.q4` v1 (r-explicit, general)
  - 小熊想到了什么办法？
  - Options: **挂牌子，还送面包给大家试吃** · 把面包卖得更贵 · 搬到河边 · 把店关了
  - Hint: 找“小熊想了想”后面的话。 · Explanation: 它挂了牌子，还送面包试吃。
  - Material: `zh-m10` (full text below).

- `zh-m11.q1` v2 (r-explicit, general)
  - 短文说垃圾可以分成哪两类？
  - Options: 大的和小的 · **可回收的和不可回收的** · 新的和旧的 · 干的和湿的
  - Hint: 读第一句。 · Explanation: 第一句写明垃圾可以分成可回收的和不可回收的。
  - Material: `zh-m11` (full text below).

- `zh-m13.q1` v1 (r-explicit, general)
  - 中秋节是哪一天？
  - Options: 农历五月五日 · 农历十二月三十日 · **农历八月十五** · 农历一月一日
  - Hint: 看第一句。 · Explanation: 农历八月十五是中秋节。
  - Material: `zh-m13` (full text below).

- `zh-m14.q3` v1 (r-explicit, general)
  - 小鸟摔到草地上以后，怎么做？
  - Options: 在草地上睡觉 · **爬起来再飞** · 不再学飞 · 哭着回家
  - Hint: 找“它没有哭”。 · Explanation: 它爬起来又飞了一次、两次。
  - Material: `zh-m14` (full text below).

- `zh-m14.q4` v1 (r-explicit, general)
  - 小鸟什么时候终于飞上天空？
  - Options: 半夜 · 早上 · **傍晚** · 中午
  - Hint: 找“终于”。 · Explanation: 到了傍晚，它终于飞上了天空。
  - Material: `zh-m14` (full text below).

- `zh-m15.q3` v1 (r-character, general)
  - 第3空选哪个字？
  - Options: **以** · 心 · 比 · 已
  - Hint: 组成表示时间先后的词。 · Explanation: “以后”表示时间在后面。
  - Material: `zh-m15` (full text below).

- `zh-m16.q3` v3 (r-character, general)
  - 第3空选哪个字？
  - Options: **转** · 砖 · 软 · 传
  - Hint: 风车被风吹时会怎样动？ · Explanation: 风车被风吹，会一圈一圈地“转”起来。这几个字字形相近，要看部首和意思。
  - Material: `zh-m16` (full text below).

- `zh-p2-read-repair.q1` v1 (r-explicit, exact)
  - 读一读：星期五下午，小林和爸爸去海边放风筝。风很大，他们的风筝飞得又高又远。 / 小林和谁去海边？
  - Options: 哥哥 · **爸爸** · 妈妈 · 老师
  - Hint: 找一找第一句里和小林一起去的人。 · Explanation: 第一句写明小林和爸爸去海边。

- `zh-p2-read-repair.q3` v1 (r-explicit, generic)
  - 读一读：学校的花园里种了很多花，有红花、黄花，还有白花。放学后，同学们轮流去浇水。 / 花园里有哪几种颜色的花？
  - Options: 只有白色 · 黄色和紫色 · **红色、黄色和白色** · 红色和蓝色
  - Hint: 把短文里说到的颜色都找出来。 · Explanation: 短文写了红花、黄花和白花。

- `zh-p3-read-repair.q2` v1 (r-explicit, similar)
  - 读一读：这次远足，我们沿着河边走了两个小时。路上，老师教我们认识了三种不同的鸟，还提醒大家不要乱丢垃圾。 / 老师提醒大家什么？
  - Options: 不要大声说话 · 要走快一点 · **不要乱丢垃圾** · 要多喝水
  - Hint: 找一找“提醒”后面的话。 · Explanation: 短文写明老师提醒大家不要乱丢垃圾。

## D. Whole-material context

Original generic authored materials only. Each material is answered as a whole before feedback. These texts establish question context, not rights approval.

### `zh-m01` v2 — 种豆子

> 星期六早上，小安和姐姐在家种豆子。姐姐拿来两个小盆，小安把泥土放进盆里。他们把豆子放进泥土，再浇一点水。最后，他们把小盆放在窗边。小安说：“我明天还要来看！”

### `zh-m02` v3 — 图书角通知

> 【图书角通知】
> 星期三下午三点，图书角开放。
> 地点：一楼活动室。
> 请带借书卡，每人可借两本书。
> 请在下个星期三还书。

### `zh-m03` v2 — 公园里的早晨

> 早上，我和妈妈到公园。雨停了，天放[空1]了。小鸟在树上[空2]。妈妈坐在长椅上，我沿(yán)着小路慢慢地[空3]。走累了，我喝了几口[空4]。回家前，我们把空瓶放进垃圾[空5]。

### `zh-m04` v2 — 找雨伞

> 放学时下雨了。小文打开书包，发现没有带伞。老师借给他一把蓝伞。小文向老师道谢，撑着蓝伞回家。第二天早上，小文把伞擦干，放回老师的桌上。

### `zh-m05` v2 — 换一个办法

> 学校的图书角要增加一个放书的地方。小宁想用纸盒做书架，可是大纸盒太软，放进几本书就倒了。她和伙伴把书拿出来，在盒子里加了两块硬纸板，再把较重的书放在下面。这次，纸盒站稳了。伙伴说：“先试一试，再改一改，真有用！”

### `zh-m06` v1 — 帮奶奶

> 星期天，我去奶奶家。奶奶的腿不好，走路很慢。我帮奶奶扫地，还帮她把晒干的衣服收进来。中午，奶奶给我做了我最爱吃的鸡蛋面。吃完饭，我和奶奶一起看照片。奶奶说：“你长大了，真是一个好孩子！”我听了，心里很高兴。

### `zh-m07` v1 — 小蚂蚁搬家

> 天空乌云密布，小蚂蚁们排着长长的队伍，一只接一只地往高处搬。它们有的搬米粒，有的搬面包屑。一只小蚂蚁搬不动一块大饼干，旁边的两只蚂蚁马上过来帮忙。不久，大雨哗哗地下起来了，这时蚂蚁们已经住进了新家。

### `zh-m08` v1 — 游泳班报名

> 【游泳班报名】
> 对象：二年级学生
> 时间：每星期二下午三点到四点
> 地点：学校游泳池
> 费用：每人二十元
> 请在三月五日以前把报名表交给林老师。

### `zh-m09` v1 — 过春节

> 春节是华人最重要的节日。过年前，大家把家里打扫干净，贴上红红的春联。除夕晚上，一家人围在一起吃团圆饭。大年初一，孩子们穿上新衣服，向长辈拜年，还会收到红包。

### `zh-m18` v1 — 我的一天

> 早上六点半，我[空1]床了。我刷牙、洗脸，然后吃早饭。七点，我[空2]着书包去上学。在学校里，我认真上课，下课时和同学们一起[空3]游戏。放学回家后，我先做功课，再帮妈妈摆碗筷。晚上九点，我[空4]时上床睡觉。我觉得这一天过得很[空5]。

### `zh-m19` v1 — 生日卡

> 【生日贺卡(hè kǎ)】
> 亲爱的小美：
> 祝你生日快乐！
> 也祝你天天开心，身体健康。
> 你的好朋友 小文
> 十月八日

### `zh-m10` v1 — 小熊开店

> 小熊在森林里开了一家面包店。开业第一天，它做了很多面包，可是来买的动物很少。小熊很着急，就去问猫头鹰。猫头鹰说：“你的店在树林深处，大家都找不到。”小熊想了想，在路口挂了一块写着“香香面包店”的牌子，还送面包给路过的动物试吃。第二天，店里挤满了客人。

### `zh-m11` v2 — 垃圾分类

> 垃圾可以分成可回收的和不可回收的。纸张、塑料瓶和铁罐都可以回收，回收后能做成新的东西。剩饭剩菜和用过的纸巾不能放进回收箱。如果大家都做好分类，就能减少垃圾，保护我们的环境。

### `zh-m12` v1 — 我的好朋友

> 我的好朋友叫小美。她个子不高，戴着一副圆圆的眼镜。小美很爱看书，每次下课都在图书角看书。有一次，我的铅笔盒掉在地上，铅笔撒了一地，小美马上蹲下来帮我捡。她还常常教我做数学题。有这样的好朋友，我觉得很幸福。

### `zh-m13` v1 — 中秋节

> 农历八月十五是中秋节。晚上，月亮又大又圆。家家户户都会吃月饼，孩子们提着各种各样的灯笼在公园里玩。奶奶告诉我，月亮圆了，一家人也要团团圆圆。

### `zh-m14` v1 — 学飞的小鸟

> 小鸟第一次学飞，它站在树枝上，看着下面，心里有点害怕。妈妈说：“别怕，张开翅膀，用力拍！”小鸟试了一次，摔到了草地上。它没有哭，爬起来又飞了一次、两次……到了傍晚，它终于飞上了天空。

### `zh-m15` v1 — 去动物园

> 星期六，爸爸带我去动物园。我们先去看猴子，它们在树上爬上爬下，真[空1]爱。接着，我们看到一只大象正在用长鼻子[空2]水。吃完午饭[空3]后，我们去看企鹅。企鹅走路一[空4]一摆的，大家都笑了。这真是[空5]快的一天。

### `zh-m16` v2 — 做纸风车

> 今天美术课，老师教我们做纸风车。我先把一张正方形的纸沿着两条对角线对[空1]，压出折痕。再从四个角往中心剪，中间留一小块不剪。接着，我把每个三角形的一个角[空2]到中心，叠在一起，用一枚图钉把中心钉在一根小木棍上，不要钉得太紧。风车做好了！风一吹，风车就[空3]了起来。我[空4]地拿给妈妈看，妈妈[空5]我做得很好。

### `zh-m17` v1 — 图书馆借书须知

> 【借书须知】
> 1. 每人每次最多可借三本书。
> 2. 借书期限为两个星期。
> 3. 请爱护图书，不要在书上画画。
> 4. 逾期(yú qī)还书，每本每天罚款十分钱。
> 开放时间：星期一至星期五，上午七点半到下午四点

## Next review and sign-off

1. Waived 2026-10-18: the owner confirmed the three v10 refinements and waived ChatGPT re-review of them. Batch status is `approved`.
2. Completed 2026-10-18: independent visual page/grade audit and owner denominator decision, as recorded in the preparation disposition and manifest. The old 13/17 figure is not current approved MOE coverage.
3. Done 2026-10-18: owner accepted all 24 disputed items and all 67 sampled items, approved the batch and cleared rights. Recorded in `review_log`.
4. Keep P3 import, real data, merge and release gates unchanged. Stock remains one item per repair stage; CL/HCL shared availability does not establish HCL depth.

Validation evidence and the exact published head are recorded on PR23. This file preserves versioned review evidence; the canonical batch and manifest records hold current approval status.
