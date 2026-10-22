# Chinese review pack — batch zh-starter-003 v2

117 original recognition questions. Independent review: **passed**; owner sign-off **approved** and rights **cleared** on 2026-10-18. This is content preparation, not a runtime release.

## Cross-review findings

ChatGPT read all 117 v1 items with their options, hints and explanations. Twenty-one items are revised at item version 2: bounded meanings replace overbroad definitions; colour contexts specify the intended colour; the 九 recognition item no longer requires addition; unnatural 喷 usage is replaced. Keys and target IDs are unchanged. Claude independently rechecked all 21 revisions and passed them.

The official-source P1 audit and visual spot-check are retained in the [historical PR24 cross-review record](https://github.com/FrankxSG/turtle-academy/pull/31#issuecomment-6340410328). The owner approved list zh-2024-p1-review.3, and approved this 117-item batch and its public use. Tests now prevent proposed target lists entering approved release coverage and preserve practice-only classification.

## Owner sample

Current v2 draw: 20 of 96 non-disputed items (ceil(N/5)); the 21 revised items were separately independently rechecked and owner-reviewed.

`zh-p2-p1review-u5348.q2`, `zh-p2-confusable3-u53d1.q1`, `zh-p2-confusable3-u5168.q2`, `zh-p2-textbook-extra-u8721.q1`, `zh-p2-confusable3-u8eab.q1`, `zh-p2-p1review-u4ee5.q3`, `zh-p2-confusable3-u5168.q1`, `zh-p2-p1review-u725b.q2`, `zh-p2-p1review-u4e5d.q1`, `zh-p2-confusable3-u7eff.q3`, `zh-p2-p1review-u5b66.q3`, `zh-p2-p1review-u672c.q1`, `zh-p2-textbook-extra-u8721.q2`, `zh-p2-textbook-extra-u74f6.q2`, `zh-p2-confusable3-u50cf.q3`, `zh-p2-p1review-u4e1c.q2`, `zh-p2-textbook-extra-u517d.q1`, `zh-p2-confusable3-u5427.q1`, `zh-p2-textbook-extra-u5858.q1`, `zh-p2-p1review-u5929.q2`

Recipe: `random.Random('zh-starter-003-v2-owner-sample-2026-10-18').sample(pool, ceil(len(pool)/5))`, preserving batch order before sampling and excluding disputed IDs. V1 sample is preserved in the batch review-log history.

## Revised items reviewed and accepted

`zh-p2-p1review-u4e5d.q2` v2, `zh-p2-p1review-u571f.q2` v2, `zh-p2-p1review-u767d.q1` v2, `zh-p2-p1review-u767d.q2` v2, `zh-p2-p1review-u5b66.q2` v2, `zh-p2-p1review-u672c.q3` v2, `zh-p2-confusable3-u7eff.q1` v2, `zh-p2-confusable3-u7eff.q2` v2, `zh-p2-confusable3-u8bfb.q1` v2, `zh-p2-confusable3-u90a3.q3` v2, `zh-p2-confusable3-u9e1f.q1` v2, `zh-p2-confusable3-u9e1f.q3` v2, `zh-p2-textbook-extra-u517d.q3` v2, `zh-p2-textbook-extra-u55b7.q2` v2, `zh-p2-textbook-extra-u55b7.q3` v2, `zh-p2-textbook-extra-u5bc6.q1` v2, `zh-p2-textbook-extra-u5bc6.q2` v2, `zh-p2-textbook-extra-u80f6.q1` v2, `zh-p2-textbook-extra-u80f6.q2` v2, `zh-p2-textbook-extra-u8b66.q3` v2, `zh-p2-textbook-extra-u9b54.q2` v2

## Item review table

Keys below are reviewer aids. Recognition does not assess independent handwriting.

| ID / stage | Question and options | Key | Hint | Explanation |
| --- | --- | --- | --- | --- |
| `zh-p2-p1review-u4e1c.q1` v1 / exact | 妈妈去商店买（　）西。<br>1 东；2 来；3 乐；4 车 | 东 | “（　）西”可以是吃的，也可以是用的。 | “东西”可以是吃的、用的。“乐”在“快乐”里，“车”在“汽车”里。 |
| `zh-p2-p1review-u4e1c.q2` v1 / similar | 你的书包里有什么（　）西？<br>1 来；2 东；3 车；4 乐 | 东 | 书包里放的书和笔，都可以叫“（　）西”。 | 书包里的书、笔都是“东西”。 |
| `zh-p2-p1review-u4e1c.q3` v1 / generic | 早上，太阳从（　）边出来。<br>1 东；2 乐；3 来；4 车 | 东 | 早上太阳在哪一边？ | 太阳早上从东边出来。 |
| `zh-p2-p1review-u4e5d.q1` v1 / exact | 一、二、三、四、五、六、七、八、（　）、十。<br>1 力；2 九；3 几；4 刀 | 九 | 八和十的中间是什么？ | 八、九、十。“几”在“几个”里，“力”在“力气”里。 |
| `zh-p2-p1review-u4e5d.q2` v2 / similar | “9”用哪个字来写？<br>1 九；2 刀；3 力；4 儿 | 九 | 把“9”和四个字对一对。 | “9”就是“九”。 |
| `zh-p2-p1review-u4e5d.q3` v1 / generic | 一年有十二个月，（　）月的后面是十月。<br>1 儿；2 刀；3 力；4 九 | 九 | 十月的前面是哪个月？ | 九月的后面是十月。 |
| `zh-p2-p1review-u4ee5.q1` v1 / exact | 今天下大雨，所（　）我们不去公园了。<br>1 以；2 衣；3 已；4 椅 | 以 | 前面说了为什么，后面说会怎么样，用“所（　）”。 | “所以”后面说的是会怎么样。“衣”在“衣服”里，“已”在“已经”里，“椅”在“椅子”里。 |
| `zh-p2-p1review-u4ee5.q2` v1 / similar | 妹妹很喜欢画画，所（　）她每天都画。<br>1 椅；2 以；3 衣；4 已 | 以 | 前面说她喜欢画画，后面说她每天都画，中间用“所（　）”连起来。 | “所以”放在后面，说出会怎么样。 |
| `zh-p2-p1review-u4ee5.q3` v1 / generic | 下课（　）后，我们一起去吃午饭。<br>1 以；2 椅；3 已；4 衣 | 以 | “（　）后”就是后来。 | “以后”就是后来的时候。 |
| `zh-p2-p1review-u5348.q1` v1 / exact | 中（　）十二点，我们一起吃饭。<br>1 午；2 牛；3 干；4 年 | 午 | 十二点吃饭的时候叫“中（　）”。 | “中午”是十二点左右。“牛”在“小牛”里，“干”在“饼干”里。 |
| `zh-p2-p1review-u5348.q2` v1 / similar | 下（　）三点，我去公园跑步。<br>1 干；2 午；3 牛；4 年 | 午 | 十二点以后的时候叫“下（　）”。 | “下午”是中午以后的时候。 |
| `zh-p2-p1review-u5348.q3` v1 / generic | 上（　）八点，我们开始上课。<br>1 午；2 牛；3 年；4 干 | 午 | 早上到十二点以前，叫“上（　）”。 | “上午”是早上到中午的时候。 |
| `zh-p2-p1review-u5382.q1` v1 / exact | 哪一句的字写对了？<br>1 我们在足球厂上踢球。；2 爸爸在汽车工广做工。；3 爸爸在汽车工厂做工。；4 我们在足球广上踢球。 | 爸爸在汽车工厂做工。 | 做东西的地方和踢球的地方，用的字不一样。 | 做东西的地方是“工厂”，踢球的地方是“足球场”。 |
| `zh-p2-p1review-u5382.q2` v1 / similar | 这家糖（　）做的糖很好吃。<br>1 长；2 厂；3 广；4 场 | 厂 | 做糖的地方叫“糖（　）”。 | 做糖的地方是“糖厂”。 |
| `zh-p2-p1review-u5382.q3` v1 / generic | 工（　）里的工人每天都很忙。<br>1 片；2 广；3 厂；4 长 | 厂 | 工人做工的地方叫“工（　）”。 | “工厂”是工人做东西的地方。 |
| `zh-p2-p1review-u53f3.q1` v1 / exact | 我有两只手：一只是左手，一只是（　）手。<br>1 左；2 有；3 石；4 右 | 右 | 一只手是左手，还有一只手叫什么手？ | 两只手是左手和右手。“石”在“石头”里，“有”在“没有”里。 |
| `zh-p2-p1review-u53f3.q2` v1 / similar | 向（　）转，就到学校了。<br>1 有；2 右；3 古；4 石 | 右 | 转弯可以向左，也可以向（　）。 | “向右转”就是转到右边。 |
| `zh-p2-p1review-u53f3.q3` v1 / generic | 我的家在学校的（　）边。<br>1 古；2 石；3 有；4 右 | 右 | 左手那一边是左边，还有一只手那一边叫什么边？ | “右边”就是右手那一边。 |
| `zh-p2-p1review-u571f.q1` v1 / exact | 花园里的泥（　）黑黑的，小花长得很好。<br>1 王；2 士；3 上；4 土 | 土 | 花长在地上的泥（　）里。 | “泥土”就是地上的泥。“士”在“巴士”里，“上”在“上下”里。 |
| `zh-p2-p1review-u571f.q2` v2 / similar | 我们把种子放进（　）里，再给它水。<br>1 土；2 王；3 上；4 士 | 土 | 种子要放在地里的泥（　）里。 | 这里说的是把种子放进泥土里。 |
| `zh-p2-p1review-u571f.q3` v1 / generic | 这条小路是（　）路，下雨后很不好走。<br>1 士；2 王；3 上；4 土 | 土 | 没有石头、只有泥的路叫“（　）路”。 | “土路”就是用泥做的路。 |
| `zh-p2-p1review-u5929.q1` v1 / exact | 今（　）是星期一，我们要上学。<br>1 天；2 大；3 开；4 太 | 天 | 说今日，就是说“今（　）”。 | “今天”就是今日。“大”在“大小”里，“太”在“太阳”里。 |
| `zh-p2-p1review-u5929.q2` v1 / similar | 明（　）我们一起去公园，好吗？<br>1 开；2 天；3 大；4 太 | 天 | 过了今日，后一日叫“明（　）”。 | “明天”是今天的后一天。 |
| `zh-p2-p1review-u5929.q3` v1 / generic | （　）上有很多白云。<br>1 大；2 天；3 太；4 开 | 天 | 白云在哪里？在我们的头上面。 | 白云在天上。 |
| `zh-p2-p1review-u5b66.q1` v1 / exact | 我每天早上坐巴士去（　）校。<br>1 学；2 觉；3 字；4 写 | 学 | 上课的地方叫“（　）校”。 | 上课的地方是“学校”。“写”在“写字”里。 |
| `zh-p2-p1review-u5b66.q2` v2 / similar | 我们要好好（　）习。<br>1 写；2 学；3 觉；4 字 | 学 | 读书、上课可以帮助我们“（　）习”。 | 读书、上课可以帮助我们学习，知道新的东西。 |
| `zh-p2-p1review-u5b66.q3` v1 / generic | 小明是我的同（　），我们在一个班。<br>1 写；2 字；3 学；4 觉 | 学 | 在一个班一起上课的人叫“同（　）”。 | “同学”就是一起上课的人。 |
| `zh-p2-p1review-u600e.q1` v1 / exact | 老师问我：“你（　）么回家？”<br>1 作；2 做；3 怎；4 昨 | 怎 | 问别人用什么方法，用“（　）么”。 | “怎么”用来问方法。“昨”在“昨天”里，“作”在“工作”里。 |
| `zh-p2-p1review-u600e.q2` v1 / similar | 这个字（　）么读？请你告诉我。<br>1 怎；2 作；3 昨；4 做 | 怎 | 不知道读法，就问“（　）么读”。 | “怎么读”是问读法。 |
| `zh-p2-p1review-u600e.q3` v1 / generic | 你觉得这本书（　）么样？<br>1 做；2 昨；3 作；4 怎 | 怎 | 问书好不好看，可以说“（　）么样”。 | “怎么样”是问好不好。 |
| `zh-p2-p1review-u672c.q1` v1 / exact | 我买了一（　）新书。<br>1 本；2 体；3 木；4 林 | 本 | 我们说“一（　）书、两（　）书”。 | 书要说“一本书”。“木”在“木头”里，“体”在“身体”里，“林”在“树林”里。 |
| `zh-p2-p1review-u672c.q2` v1 / similar | 这（　）故事书很好看，我看了两次。<br>1 木；2 林；3 体；4 本 | 本 | “这（　）书”就是这一（　）书。 | “这本书”就是这一本书。 |
| `zh-p2-p1review-u672c.q3` v2 / generic | 我把作业写在（　）子上。<br>1 林；2 本；3 木；4 体 | 本 | 写作业用的小书叫“（　）子”。 | 本子可以用来写字。 |
| `zh-p2-p1review-u725b.q1` v1 / exact | 草地上有一头小（　）在吃草。<br>1 生；2 半；3 午；4 牛 | 牛 | 会吃草、身体很大的动物是什么？ | 小牛会吃草。“午”在“中午”里，“半”在“一半”里，“生”在“生日”里。 |
| `zh-p2-p1review-u725b.q2` v1 / similar | 我每天早上喝一杯（　）奶。<br>1 车；2 半；3 午；4 牛 | 牛 | 白白的奶，是从一种会吃草的大动物身上来的。 | “牛奶”是牛的奶。 |
| `zh-p2-p1review-u725b.q3` v1 / generic | 爷爷家的（　）很大，可以帮他拉车。<br>1 生；2 半；3 午；4 牛 | 牛 | 哪种动物很大，会帮人拉车？ | 牛很大，可以拉车。 |
| `zh-p2-p1review-u767d.q1` v2 / exact | 这朵云的颜色像牛奶，是（　）色的。<br>1 百；2 日；3 自；4 白 | 白 | 想一想，牛奶是什么颜色。 | 这朵云像牛奶一样，是白色的。云也可以有别的颜色。 |
| `zh-p2-p1review-u767d.q2` v2 / similar | 我穿着一件（　）衣服，颜色像牛奶一样。<br>1 白；2 自；3 日；4 百 | 白 | 想一想，牛奶是什么颜色。 | 这里的衣服像牛奶一样，是白色的。 |
| `zh-p2-p1review-u767d.q3` v1 / generic | 我明（　）了，谢谢老师！<br>1 白；2 日；3 自；4 百 | 白 | “明（　）”就是知道了、懂了。 | “明白”就是懂了。 |
| `zh-p2-p1review-u7ed9.q1` v1 / exact | 我把这本书送（　）哥哥。<br>1 给；2 把；3 结；4 经 | 给 | 让别人拿到东西，就是送（　）别人。 | “送给哥哥”就是让哥哥拿到这本书。“把”放在东西前面，“我把这本书”。 |
| `zh-p2-p1review-u7ed9.q2` v1 / similar | 请把尺子拿（　）我，好吗？<br>1 给；2 把；3 结；4 经 | 给 | 尺子要到“我”的手里，用哪个字？ | “拿给我”就是让尺子到我手里。 |
| `zh-p2-p1review-u7ed9.q3` v1 / generic | 妈妈（　）我买了一个新书包。<br>1 经；2 把；3 结；4 给 | 给 | 书包是妈妈为我买的。 | “妈妈给我买”就是妈妈为我买。 |
| `zh-p2-p1review-u89c1.q1` v1 / exact | 我在公园看（　）了小明。<br>1 见；2 现；3 页；4 贝 | 见 | 用眼睛看到，叫“看（　）”。 | “看见”就是看到了。“贝”在“宝贝”里，“页”在“一页”里。 |
| `zh-p2-p1review-u89c1.q2` v1 / similar | 放学了，我对同学说：“再（　）！”<br>1 现；2 页；3 贝；4 见 | 见 | 和别人分开的时候，我们说“再（　）”。 | “再见”是和别人分开时说的话。 |
| `zh-p2-p1review-u89c1.q3` v1 / generic | 我听（　）有人在门外叫我。<br>1 页；2 见；3 贝；4 现 | 见 | 用耳朵听到，叫“听（　）”。 | “听见”就是听到了。 |
| `zh-p2-p1review-u8d70.q1` v1 / exact | 我们一直向前（　），就到学校了。<br>1 走；2 足；3 起；4 是 | 走 | 用脚一步一步向前去，叫“（　）”。 | “向前走”就是一步一步向前去。“足”在“足球”里，“起”在“起床”里。 |
| `zh-p2-p1review-u8d70.q2` v1 / similar | 下雨了，我们快点（　）回家吧。<br>1 走；2 足；3 是；4 起 | 走 | 回家要用脚一步一步去。 | “走回家”就是用脚回家。 |
| `zh-p2-p1review-u8d70.q3` v1 / generic | 小狗一步一步地（　）过来，在我身边坐下。<br>1 起；2 是；3 足；4 走 | 走 | 小狗用脚一步一步过来。 | “走过来”就是一步一步过来。 |
| `zh-p2-confusable3-u50cf.q1` v1 / exact | 弯弯的月亮（　）一条小船。<br>1 象；2 家；3 像；4 相 | 像 | 月亮弯弯的，小船也弯弯的。说它们一样，用哪个字？ | 月亮像小船。“象”在“大象”里，“家”在“大家”里。 |
| `zh-p2-confusable3-u50cf.q2` v1 / similar | 妹妹长得很（　）妈妈。<br>1 相；2 象；3 家；4 像 | 像 | 妹妹和妈妈长得一样，就是妹妹很（　）妈妈。 | 妹妹长得像妈妈。 |
| `zh-p2-confusable3-u50cf.q3` v1 / generic | 天黑了，好（　）要下雨了。<br>1 家；2 相；3 像；4 象 | 像 | 看起来要下雨了，可以说“好（　）要下雨了”。 | “好像”就是看起来会这样。 |
| `zh-p2-confusable3-u5168.q1` v1 / exact | 小朋友们（　）都来了，一个也没有少。<br>1 金；2 会；3 把；4 全 | 全 | 一个也没有少，就是“（　）都来了”。 | “全都”就是一个也没有少。“金”在“金鱼”里，“会”在“开会”里。 |
| `zh-p2-confusable3-u5168.q2` v1 / similar | 这些书（　）是新的，一本旧的也没有。<br>1 全；2 金；3 把；4 今 | 全 | 每一本都是新的，就是“（　）是新的”。 | “全是新的”就是每一本都是新的。 |
| `zh-p2-confusable3-u5168.q3` v1 / generic | 星期天，我们（　）家去公园玩。<br>1 今；2 会；3 把；4 全 | 全 | 家里每个人都去，就是“（　）家”。 | “全家”就是家里每个人。 |
| `zh-p2-confusable3-u533b.q1` v1 / exact | 我生病了，妈妈带我去看（　）生。<br>1 衣；2 一；3 医；4 以 | 医 | 病人要去看谁？ | 生病要去看医生。“衣”在“衣服”里，“以”在“所以”里。 |
| `zh-p2-confusable3-u533b.q2` v1 / similar | （　）院里有很多病人。<br>1 医；2 一；3 以；4 衣 | 医 | 病人去看病的地方叫“（　）院”。 | “医院”是看病的地方。 |
| `zh-p2-confusable3-u533b.q3` v1 / generic | 他长大后想做（　）生，帮病人看病。<br>1 以；2 医；3 衣；4 一 | 医 | 帮病人看病的人叫什么？ | 帮病人看病的人是医生。 |
| `zh-p2-confusable3-u53d1.q1` v1 / exact | 这里（　）生了什么事？<br>1 反；2 发；3 方；4 友 | 发 | 问有什么事出现了，用“（　）生”。 | “发生”就是有事出现了。“方”在“地方”里，“友”在“朋友”里。 |
| `zh-p2-confusable3-u53d1.q2` v1 / similar | 妹妹的头（　）长长的。<br>1 发；2 友；3 方；4 反 | 发 | 长在头上的叫“头（　）”。 | “头发”是长在头上的。 |
| `zh-p2-confusable3-u53d1.q3` v1 / generic | 老师（　）给我们每人一本新书。<br>1 发；2 方；3 友；4 反 | 发 | 老师把书一本一本给我们，叫“（　）给”。 | “发给”就是一个一个地给。 |
| `zh-p2-confusable3-u5427.q1` v1 / exact | 我们一起去公园（　）！<br>1 爸；2 吧；3 巴；4 把 | 吧 | 请别人一起做事，句子后面加哪个字？ | “我们一起去吧”是请别人一起去。“把”在“把书放好”里，“巴”在“巴士”里。 |
| `zh-p2-confusable3-u5427.q2` v1 / similar | 你是新来的同学（　）？<br>1 把；2 吧；3 巴；4 爸 | 吧 | 觉得是，但不太知道，句子后面用哪个字？ | “你是新来的同学吧？”是在想一想后问。 |
| `zh-p2-confusable3-u5427.q3` v1 / generic | 快点走（　），要下雨了。<br>1 把；2 爸；3 吧；4 巴 | 吧 | 叫别人快点走，句子后面用哪个字？ | “快点走吧”是叫别人快点走。 |
| `zh-p2-confusable3-u7eff.q1` v2 / exact | 小草常见的颜色是（　）色。<br>1 绿；2 经；3 给；4 红 | 绿 | 想一想，常见的小草是什么颜色。 | 常见的小草是绿色的。“给”在“送给”里，“经”在“已经”里。 |
| `zh-p2-confusable3-u7eff.q2` v2 / similar | 下了几天雨，小草长得更（　）了。<br>1 给；2 红；3 经；4 绿 | 绿 | 小草是什么颜色的？ | 这句话写雨后的小草长得更绿了。 |
| `zh-p2-confusable3-u7eff.q3` v1 / generic | 红灯停，（　）灯行。<br>1 红；2 给；3 绿；4 经 | 绿 | 过马路时，红灯要停，什么灯可以走？ | 红灯停，绿灯行。 |
| `zh-p2-confusable3-u8bfb.q1` v2 / exact | 老师请我大声（　）课文。<br>1 卖；2 实；3 读；4 买 | 读 | 把书上的字大声说出来，叫“（　）”。 | 这句话说大声读课文，就是把课文读出声音。 |
| `zh-p2-confusable3-u8bfb.q2` v1 / similar | 我在（　）二年级，妹妹在上一年级。<br>1 卖；2 实；3 买；4 读 | 读 | 上几年级，也可以说“（　）几年级”。 | “读二年级”就是上二年级。 |
| `zh-p2-confusable3-u8bfb.q3` v1 / generic | 这个字怎么（　）？请你教我。<br>1 读；2 卖；3 买；4 实 | 读 | 不会说这个字的音，就问怎么（　）。 | “怎么读”是问这个字怎么说。 |
| `zh-p2-confusable3-u8eab.q1` v1 / exact | 我们要多做运动，（　）体才会好。<br>1 生；2 体；3 身；4 自 | 身 | “（　）体”就是我们的头、手、脚等。 | “身体”就是我们的头、手、脚。“体”在“身体”的后面，“自”在“自己”里。 |
| `zh-p2-confusable3-u8eab.q2` v1 / similar | 小狗跑到我（　）边，坐了下来。<br>1 体；2 生；3 自；4 身 | 身 | 在我的旁边，也可以说在我“（　）边”。 | “身边”就是旁边。 |
| `zh-p2-confusable3-u8eab.q3` v1 / generic | 我转过（　），看见妈妈来了。<br>1 自；2 体；3 身；4 生 | 身 | 把后面转到前面，叫“转过（　）”。 | “转过身”就是转过来。 |
| `zh-p2-confusable3-u90a3.q1` v1 / exact | 这个书包是我的，（　）个书包是哥哥的。<br>1 拿；2 都；3 那；4 哪 | 那 | 近的用“这个”，远的用什么字？ | 近的说“这个”，远的说“那个”。“哪”是用来问的。 |
| `zh-p2-confusable3-u90a3.q2` v1 / similar | 你看，（　）里有一只小猫。<br>1 都；2 拿；3 哪；4 那 | 那 | 小猫在远的地方，就说“（　）里”。 | “那里”说的是远的地方。 |
| `zh-p2-confusable3-u90a3.q3` v2 / generic | （　）天下大雨，我没有去公园。<br>1 那；2 哪；3 拿；4 都 | 那 | 说过去的一天，可以说“（　）天”。 | 这里的“那天”指下大雨的那一天。 |
| `zh-p2-confusable3-u9e1f.q1` v2 / exact | 树上有一只小（　）在唱歌。<br>1 岛；2 乌；3 马；4 鸟 | 鸟 | 在树上唱歌、会飞的是什么？ | 这里说的是在树上唱歌的小鸟。“乌”在“乌云”里，“马”在“小马”里。 |
| `zh-p2-confusable3-u9e1f.q2` v1 / similar | 一只小（　）飞到窗前，叫个不停。<br>1 马；2 岛；3 乌；4 鸟 | 鸟 | 会飞到窗前的是什么？ | 小鸟会飞。 |
| `zh-p2-confusable3-u9e1f.q3` v2 / generic | （　）儿在天上飞来飞去。<br>1 鸟；2 乌；3 马；4 岛 | 鸟 | 在天上飞来飞去的是什么？ | 这句话写鸟儿在天上飞。 |
| `zh-p2-textbook-extra-u517d.q1` v1 / exact | 小猫生病了，我们带它去看（　）医。<br>1 前；2 关；3 兽；4 首 | 兽 | 给动物看病的人叫“（　）医”。 | 给动物看病的人叫“兽医”。“首”在“一首歌”里，“关”在“关门”里。 |
| `zh-p2-textbook-extra-u517d.q2` v1 / similar | 动物生病了，要找（　）医看病。<br>1 关；2 前；3 首；4 兽 | 兽 | 不是给人看病，是给动物看病的医生。 | 给动物看病的是兽医。 |
| `zh-p2-textbook-extra-u517d.q3` v2 / generic | 大森林里住着很多野（　）。<br>1 关；2 首；3 兽；4 前 | 兽 | “野（　）”可以生活在森林里，也可以生活在别的野外地方。 | “野兽”指在野外生活的兽，不是只在森林里生活的兽。 |
| `zh-p2-textbook-extra-u55b7.q1` v1 / exact | 公园里有一个（　）水池，水一直往上冲。<br>1 唱；2 吹；3 喝；4 喷 | 喷 | 水从池子里一直往上冲出来，这样的水池叫什么？ | “喷水池”的水会往上冲出来。“吹”在“吹风”里，“喝”在“喝水”里。 |
| `zh-p2-textbook-extra-u55b7.q2` v2 / similar | 我往小花上（　）了一点水。<br>1 吹；2 喷；3 唱；4 喝 | 喷 | 把水变成小水点，送到花上。 | 这里说的是把水喷到小花上。 |
| `zh-p2-textbook-extra-u55b7.q3` v2 / generic | 水从瓶口一下子向外（　）出来，弄湿了桌子。<br>1 喝；2 吹；3 唱；4 喷 | 喷 | 想一想，水一下子向外出来，用哪个字。 | 这里的“喷出来”说水从瓶口向外出来。 |
| `zh-p2-textbook-extra-u5858.q1` v1 / exact | 青蛙在池（　）里游来游去。<br>1 场；2 糖；3 康；4 塘 | 塘 | 有水、有小鱼的地方叫“池（　）”。 | “池塘”是有水的地方。“糖”可以吃，“场”在“足球场”里。 |
| `zh-p2-textbook-extra-u5858.q2` v1 / similar | 池（　）边开着很多小花。<br>1 糖；2 塘；3 场；4 康 | 塘 | 有水、有鱼的地方叫“池（　）”。 | “池塘边”就是水边。 |
| `zh-p2-textbook-extra-u5858.q3` v1 / generic | 这个水（　）里有很多小鱼。<br>1 糖；2 塘；3 场；4 康 | 塘 | 有很多水、有小鱼的地方，叫“水（　）”。 | “水塘”是有水的地方。 |
| `zh-p2-textbook-extra-u5bc6.q1` v2 / exact | 天上乌云（　）布，快要下雨了。<br>1 密；2 家；3 蜜；4 宝 | 密 | 乌云很多，连成一大片。 | “乌云密布”说的是天上布满了乌云。 |
| `zh-p2-textbook-extra-u5bc6.q2` v2 / similar | 树林里的树长得很（　），太阳都照不进来。<br>1 家；2 密；3 宝；4 蜜 | 密 | 树很多，一棵接一棵，中间空的地方很少。 | 树很多、很近，就是长得很密。 |
| `zh-p2-textbook-extra-u5bc6.q3` v1 / generic | 雨点又大又（　），我们快点回家吧。<br>1 家；2 密；3 宝；4 蜜 | 密 | 雨点很多，一个接一个，就是又大又（　）。 | 雨点很多，就是雨很密。 |
| `zh-p2-textbook-extra-u5bdf.q1` v1 / exact | 警（　）叔叔在路口帮我们过马路。<br>1 茶；2 家；3 察；4 客 | 察 | 穿着工作服、帮大家、抓坏人的人叫“警（　）”。 | “警察”会帮大家。“茶”可以喝，“客”在“客人”里。 |
| `zh-p2-textbook-extra-u5bdf.q2` v1 / similar | 看到坏人，要快点告诉警（　）。<br>1 茶；2 客；3 察；4 家 | 察 | 抓坏人的是谁？ | 警察会抓坏人。 |
| `zh-p2-textbook-extra-u5bdf.q3` v1 / generic | 老师要我们好好观（　）小花是怎么长大的。<br>1 察；2 家；3 茶；4 客 | 察 | 用眼睛好好地看，叫“观（　）”。 | “观察”就是好好地看。 |
| `zh-p2-textbook-extra-u6a61.q1` v1 / exact | 要把写坏的字去掉，可以用（　）皮。<br>1 像；2 象；3 想；4 橡 | 橡 | 用什么东西可以把字去掉？ | “橡皮”可以把写坏的字去掉。“像”在“好像”里，“象”在“大象”里。 |
| `zh-p2-textbook-extra-u6a61.q2` v1 / similar | 这块（　）皮是我的，那块是妹妹的。<br>1 橡；2 像；3 想；4 象 | 橡 | 一块小小的、可以去掉字的东西叫“（　）皮”。 | “橡皮”可以去掉写坏的字。 |
| `zh-p2-textbook-extra-u6a61.q3` v1 / generic | 我的书包里有尺子和（　）皮。<br>1 想；2 橡；3 像；4 象 | 橡 | 书包里写字要用的东西：尺子和“（　）皮”。 | “橡皮”和尺子都是上学要用的。 |
| `zh-p2-textbook-extra-u70db.q1` v1 / exact | 生日蛋糕上有几支蜡（　）。<br>1 虫；2 蜡；3 火；4 烛 | 烛 | 生日蛋糕上点着的东西叫“蜡（　）”。 | 生日蛋糕上有蜡烛。“蜡烛”两个字不一样，后一个是“烛”。 |
| `zh-p2-textbook-extra-u70db.q2` v1 / similar | 我吹了蜡（　），大家给我唱生日歌。<br>1 烛；2 虫；3 蜡；4 火 | 烛 | 生日时要吹的东西叫“蜡（　）”。 | 生日时吹蜡烛。 |
| `zh-p2-textbook-extra-u70db.q3` v1 / generic | 家里没有电，我们点了一支蜡（　）。<br>1 烛；2 火；3 虫；4 蜡 | 烛 | 没有电的时候，可以点什么来照亮？ | 没有电时，可以点蜡烛。 |
| `zh-p2-textbook-extra-u74f6.q1` v1 / exact | 我的水（　）里还有很多水。<br>1 平；2 饼；3 片；4 瓶 | 瓶 | 放水的东西叫“水（　）”。 | “水瓶”是放水的。“平”在“平安”里，“饼”在“饼干”里。 |
| `zh-p2-textbook-extra-u74f6.q2` v1 / similar | 桌上有三（　）果汁。<br>1 片；2 平；3 饼；4 瓶 | 瓶 | 果汁放在什么里面？一（　）、两（　）、三（　）。 | 果汁放在瓶子里，“三瓶果汁”。 |
| `zh-p2-textbook-extra-u74f6.q3` v1 / generic | 花（　）里有几朵红花。<br>1 饼；2 瓶；3 片；4 平 | 瓶 | 放花的东西叫“花（　）”。 | “花瓶”是放花的。 |
| `zh-p2-textbook-extra-u80f6.q1` v2 / exact | 我用（　）水把画贴在本子上。<br>1 胶；2 校；3 服；4 脸 | 胶 | 把画贴好时用的东西，叫“（　）水”。 | 胶水是用来贴东西的。“校”在“学校”里，“脸”在“洗脸”里。 |
| `zh-p2-textbook-extra-u80f6.q2` v2 / similar | 这一瓶（　）水用完了，我要买新的。<br>1 胶；2 服；3 脸；4 校 | 胶 | 贴东西时，可以用“（　）水”。 | “胶水”是贴东西用的。 |
| `zh-p2-textbook-extra-u80f6.q3` v1 / generic | 这张画是用（　）带贴在墙上的。<br>1 胶；2 服；3 校；4 脸 | 胶 | 贴东西用的带子叫“（　）带”。 | “胶带”是贴东西用的。 |
| `zh-p2-textbook-extra-u8721.q1` v1 / exact | 生日蛋糕上有几支（　）烛。<br>1 烛；2 借；3 蜡；4 蛋 | 蜡 | 生日蛋糕上点着的东西叫“（　）烛”。 | 生日蛋糕上有蜡烛。“借”在“借书”里。“蜡烛”两个字不一样，前一个是“蜡”。 |
| `zh-p2-textbook-extra-u8721.q2` v1 / similar | 家里没有电，我们点了一支（　）烛。<br>1 借；2 烛；3 蛋；4 蜡 | 蜡 | 没有电的时候，点“（　）烛”来照亮。 | 没有电时，可以点蜡烛。 |
| `zh-p2-textbook-extra-u8721.q3` v1 / generic | 我用红色的（　）笔画了一个太阳。<br>1 烛；2 借；3 蛋；4 蜡 | 蜡 | 画画用的、有很多颜色的笔，叫“（　）笔”。 | “蜡笔”是画画用的笔。 |
| `zh-p2-textbook-extra-u8b66.q1` v1 / exact | （　）察叔叔帮我找到了小狗。<br>1 警；2 课；3 记；4 请 | 警 | 帮人、抓坏人的叔叔叫“（　）察”。 | “警察”会帮大家。“请”在“请问”里，“课”在“上课”里。 |
| `zh-p2-textbook-extra-u8b66.q2` v1 / similar | 我长大后想做（　）察，抓坏人。<br>1 请；2 记；3 课；4 警 | 警 | 抓坏人的人叫“（　）察”。 | “警察”会抓坏人。 |
| `zh-p2-textbook-extra-u8b66.q3` v2 / generic | 听到火（　）声，大家快点走出大楼。<br>1 请；2 记；3 警；4 课 | 警 | 告诉大家有火的声音，叫“火（　）声”。 | 这里说听到火警声，就是听到告诉大家有火的声音。 |
| `zh-p2-textbook-extra-u9152.q1` v1 / exact | 我和妹妹在家里玩家家（　）。<br>1 酒；2 泡；3 河；4 洗 | 酒 | 小朋友在家里做饭、请客的游戏叫“家家（　）”。 | “家家酒”是小朋友做饭、请客的游戏。“洗”在“洗手”里，“河”在“小河”里。 |
| `zh-p2-textbook-extra-u9152.q2` v1 / similar | 我们用小碗小盘玩家家（　），我做饭，妹妹吃饭。<br>1 河；2 酒；3 洗；4 泡 | 酒 | 用小碗小盘做饭的游戏叫“家家（　）”。 | 这个游戏叫“家家酒”。 |
| `zh-p2-textbook-extra-u9152.q3` v1 / generic | 这一瓶是大人喝的（　），小朋友不能喝。<br>1 洗；2 河；3 泡；4 酒 | 酒 | 大人喝的、小朋友不能喝的是什么？ | 酒是大人喝的，小朋友不能喝。 |
| `zh-p2-textbook-extra-u9b54.q1` v1 / exact | 我最喜欢玩（　）术方块。<br>1 床；2 林；3 魔；4 广 | 魔 | 一种可以转来转去的方块，叫“（　）术方块”。 | “魔术方块”可以转来转去。“林”在“树林”里，“床”在“起床”里。 |
| `zh-p2-textbook-extra-u9b54.q2` v2 / similar | 叔叔会变（　）术，手里的球一下子不见了。<br>1 魔；2 林；3 床；4 广 | 魔 | 让东西一下子不见了，叫变“（　）术”。 | 这里是在变魔术，球只是看起来不见了。 |
| `zh-p2-textbook-extra-u9b54.q3` v1 / generic | 故事里的老人会（　）法，可以让小花说话。<br>1 广；2 床；3 魔；4 林 | 魔 | 能让小花说话，这是故事里的“（　）法”。 | “魔法”是故事里才有的。 |

## Owner approval — 2026-10-18

The owner signed after reviewing the 20 seeded sample items and all 21 revised items. Content approval covers zh-starter-003 v2 (117 items); rights and public use are approved. The signed source is `1aa0e39ac6ae0a2c140b27d541e755f42a0427e0`, pre-approval batch SHA-256 `a393c21fc90ab87a6fd55a2d1dfa4e1528ef16599994eb0780b974918a0e85d6`, signed at `2026-10-18T14:14:53.948Z`. The target-list approval was given separately earlier in the same chat. Question text, keys, IDs and versions are unchanged. No merge, deployment or real learner data use is authorized.
