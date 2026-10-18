# Chinese review pack — batch zh-starter-002 v3

38 original P2 items for Chinese and Higher Chinese. Claude drafted v1; ChatGPT cross-reviewed all 38 questions and material `zh-m20` at `619c7c3b2d5437b45231939b4ff2d17d1a78775c`, then revised six questions for v2 on 2026-10-18. The other 32 questions have no blocking finding from that review.

Batch status: `author_checked_pending_independent_and_owner_review`; independent review `changes_requested`; owner sign-off `pending`; rights `cleared`. The six ChatGPT corrections await Claude re-review and owner disposition. Approval of `zh-starter-001` v10 covers its own items.

Every question is single-answer multiple choice with four options. `[空1]` marks a linked blank; keys below are review aids.

## Corrections for next review

| Item | Finding and v2 correction |
| --- | --- |
| `zh-m20.q2`, `zh-p2-reason-repair.q1`–`.q3` | The v1 key was uniquely longest in all four questions. V2 balances lengths with partial reasons and plausible unsupported details. Every question now has a wrong option at least as long as the key. Read for all the stated reasons; counting clauses or choosing the longest answer is insufficient. |
| `zh-p2-confusable2-u8bb0.q3` | Recording something does not guarantee remembering it. Explanation now says the words are written down and can be read again later. |
| `zh-p2-wordchoice-b.q2` | “对别人不好” was too broad. Explanation now gives deliberate hurtful actions as examples of 欺负. |

Sources checked during the cross-review: [记](https://zdic.net/hans/记), [欺负](https://zdic.net/hans/欺负), [结](https://zdic.net/hans/结), and the dictionary readings for 前、七、走、左、就、狗、牛、手、见、全、先、口. The bearing-fruit reading of 结 is jiē. The four owner-retained tone-mark questions are correct. The cumulative P1–P2 text check found only the already-disclosed 调 in 声调. These are educational desk checks; no app rendering or release is approved.

## Claude re-review of the v2 corrections (2026-10-18)

All six corrections are accepted in substance. One follow-up is made in v3 (common check 7): every option in `zh-m20.q2`, `zh-p2-reason-repair.q1` and `.q2` now has two parts, so a hint asking how many things the reason has no longer separated the options. These three hints now ask which two things the text states. The `zh-m20.q2` explanation no longer refers to an option that says only 乌云. Keys and options are unchanged. `zh-p2-reason-repair.q3` keeps its hint, which already asks which things stopped 小花.

## Owner decisions and sample history

The owner kept the four tone-mark questions in v1 (`zh-p2-sound2.q2`, `.q3`, `zh-p2-sound2-repair.q2`, `.q3`), accepted the v1 seven-item sample and cleared rights on 2026-10-18. Those decisions remain evidence for the item versions seen. Batch sign-off is still pending.

| Original v1 sample | Current version | Decision scope |
| --- | ---: | --- |
| `zh-p2-confusable2-u8fdc.q2` | 1 | Owner accepted v1; question unchanged |
| `zh-p2-confusable2-u5b8c.q3` | 1 | Owner accepted v1; question unchanged |
| `zh-p2-confusable2-u6349.q2` | 1 | Owner accepted v1; question unchanged |
| `zh-p2-confusable2-u6349.q3` | 1 | Owner accepted v1; question unchanged |
| `zh-p2-confusable2-u5e26.q2` | 1 | Owner accepted v1; question unchanged |
| `zh-p2-reason-repair.q1` | 3 | Owner accepted v1; revised (now v3) needs a fresh decision |
| `zh-p2-reason-repair.q2` | 3 | Owner accepted v1; revised (now v3) needs a fresh decision |

The v1 sample was drawn from 34 items, excluding the four then-disputed tone-mark items, with seed `zh-starter-002-v1-owner-sample-2026-10-18`. It can be reproduced against the v1 batch at `619c7c3`. It is historical and is not the v2 sample.

## V2 pending owner disposition queue

| Item | Version | Claude re-review | Owner disposition |
| --- | ---: | --- | --- |
| `zh-p2-confusable2-u8bb0.q3` | 2 | pending | pending |
| `zh-p2-wordchoice-b.q2` | 2 | pending | pending |
| `zh-m20.q2` | 3 | pending | pending |
| `zh-p2-reason-repair.q1` | 3 | pending | pending |
| `zh-p2-reason-repair.q2` | 3 | pending | pending |
| `zh-p2-reason-repair.q3` | 2 | pending | pending |

## V2 owner sample — 7 of 32 unchanged agreed items

Six corrected IDs are excluded. All four previously disputed tone-mark questions are now eligible because the owner kept them and the cross-review found no correctness issue. This draw is prepared for review; no new owner acceptance is inferred.

```python
import json, math, random
b = json.load(open('content/chinese/batches/starter-002.json'))
disputed_at_draw = {
    "zh-p2-confusable2-u8bb0.q3",
    "zh-p2-wordchoice-b.q2",
    "zh-m20.q2",
    "zh-p2-reason-repair.q1",
    "zh-p2-reason-repair.q2",
    "zh-p2-reason-repair.q3",
}
pool = [i['id'] for i in b['items'] if i['id'] not in disputed_at_draw]
picked = set(random.Random('zh-starter-002-v2-owner-sample-2026-10-18').sample(pool, math.ceil(len(pool) / 5)))
assert [i for i in pool if i in picked] == b['review_log']['sampled_item_ids']
```

| Sampled item | Version | V2 sample decision |
| --- | ---: | --- |
| `zh-p2-confusable2-u8fdc.q2` | 1 | pending |
| `zh-p2-confusable2-u8fdc.q3` | 1 | pending |
| `zh-p2-confusable2-u5e26.q2` | 1 | pending |
| `zh-p2-confusable2-u8bb0.q2` | 1 | pending |
| `zh-p2-sound2.q2` | 1 | pending |
| `zh-p2-wordchoice-b.q4` | 1 | pending |
| `zh-m20.q4` | 1 | pending |

## All 38 current questions

| ID / version / stage | Question and options | Key | Hint | Explanation | Repair route |
| --- | --- | --- | --- | --- | --- |
| zh-p2-confusable2-u8fdc.q1 v1 / exact | 外婆住得很[空1]，我们要坐很久的车才能到。<br>1 运；2 远；3 园；4 元 | 远 | 要坐很久的车才能到，说明路长不长？ | 路很长，要坐很久的车，是“远”。“运”在“运动”里，“园”在“公园”里，“元”在“一元”里。 | zh.p2_chinese.char.u8fdc; zh.p2_higher_chinese.char.u8fdc |
| zh-p2-confusable2-u8fdc.q2 v1 / similar | 我们走了很[空1]的路，才到海边。<br>1 园；2 元；3 远；4 运 | 远 | 走了很久才到，路长不长？ | “很远的路”就是很长的路。 | zh.p2_chinese.char.u8fdc; zh.p2_higher_chinese.char.u8fdc |
| zh-p2-confusable2-u8fdc.q3 v1 / generic | 我们要做永[空1]的好朋友。<br>1 远；2 元；3 运；4 园 | 远 | “永（　）”就是一直都会这样。 | “永远”就是一直都会这样。 | zh.p2_chinese.char.u8fdc; zh.p2_higher_chinese.char.u8fdc |
| zh-p2-confusable2-u5b8c.q1 v1 / exact | 我做[空1]作业，就去公园玩。<br>1 玩；2 完；3 元；4 园 | 完 | 作业都做好了，用哪个字？ | “做完”就是做好了。“玩”是“玩游戏”的“玩”；“元”“园”读 yuán。 | zh.p2_chinese.char.u5b8c; zh.p2_higher_chinese.char.u5b8c |
| zh-p2-confusable2-u5b8c.q2 v1 / similar | 弟弟喝[空1]牛奶，就去刷牙。<br>1 园；2 元；3 完；4 玩 | 完 | 牛奶喝好了，没有了，用哪个字？ | “喝完牛奶”就是牛奶都喝好了。 | zh.p2_chinese.char.u5b8c; zh.p2_higher_chinese.char.u5b8c |
| zh-p2-confusable2-u5b8c.q3 v1 / generic | 这本故事书，我已经看[空1]了。<br>1 元；2 玩；3 园；4 完 | 完 | 书从头看到了最后，用哪个字？ | “看完了”就是从头看到了最后。 | zh.p2_chinese.char.u5b8c; zh.p2_higher_chinese.char.u5b8c |
| zh-p2-confusable2-u6349.q1 v1 / exact | 小猫在草地上[空1]虫子。<br>1 足；2 捉；3 种；4 跳 | 捉 | 小猫想吃虫子，它要做什么？ | “捉虫子”就是把虫子抓住。“足”在“足球”里，“种”在“种花”里。 | zh.p2_chinese.char.u6349; zh.p2_higher_chinese.char.u6349 |
| zh-p2-confusable2-u6349.q2 v1 / similar | 青蛙跳起来，一口就[空1]住了一只虫子。<br>1 种；2 足；3 跳；4 捉 | 捉 | 青蛙用口把虫子抓住了，用哪个字？ | “捉住虫子”就是把虫子抓住了。 | zh.p2_chinese.char.u6349; zh.p2_higher_chinese.char.u6349 |
| zh-p2-confusable2-u6349.q3 v1 / generic | 弟弟在水池边[空1]到了一只青蛙。<br>1 捉；2 种；3 足；4 路 | 捉 | 弟弟把青蛙抓住了，用哪个字？ | “捉到青蛙”就是把青蛙抓住了。“路”和“捉”都有“足”，可是“路”是走路的“路”。 | zh.p2_chinese.char.u6349; zh.p2_higher_chinese.char.u6349 |
| zh-p2-confusable2-u5e26.q1 v1 / exact | 下雨了，出门要记得[空1]雨伞。<br>1 常；2 忘；3 带；4 市 | 带 | 出门时把雨伞拿在身边，用哪个字？ | “带雨伞”就是出门时把雨伞拿在身边。不能说“记得忘雨伞”。 | zh.p2_chinese.char.u5e26; zh.p2_higher_chinese.char.u5e26 |
| zh-p2-confusable2-u5e26.q2 v1 / similar | 哥哥[空1]我去游泳。<br>1 忘；2 带；3 市；4 常 | 带 | 是谁跟着谁去？ | “哥哥带我去”，就是我跟着哥哥一起去。 | zh.p2_chinese.char.u5e26; zh.p2_higher_chinese.char.u5e26 |
| zh-p2-confusable2-u5e26.q3 v1 / generic | 妈妈[空1]着两个小朋友过马路。<br>1 市；2 常；3 忘；4 带 | 带 | 是谁跟着谁？ | “妈妈带着小朋友”，就是小朋友跟着妈妈一起走。 | zh.p2_chinese.char.u5e26; zh.p2_higher_chinese.char.u5e26 |
| zh-p2-confusable2-u8bb0.q1 v1 / exact | 我常常忘[空1]带水壶。<br>1 己；2 记；3 起；4 语 | 记 | “忘（　）”就是没有想起来。 | “忘记”就是没有想起来。“己”在“自己”里，“起”在“起床”里。 | zh.p2_chinese.char.u8bb0; zh.p2_higher_chinese.char.u8bb0 |
| zh-p2-confusable2-u8bb0.q2 v1 / similar | 你还[空1]得那只小白兔吗？<br>1 起；2 己；3 语；4 记 | 记 | “（　）得”就是没有忘。 | “记得”就是没有忘。 | zh.p2_chinese.char.u8bb0; zh.p2_higher_chinese.char.u8bb0 |
| zh-p2-confusable2-u8bb0.q3 v2 / generic | 老师说的话，我都[空1]在本子上了。<br>1 语；2 起；3 记；4 己 | 记 | 把话写在本子上，用哪个字？ | “记在本子上”就是把话写下来，以后可以再看。 | zh.p2_chinese.char.u8bb0; zh.p2_higher_chinese.char.u8bb0 |
| zh-p2-sound2.q1 v1 / general | “前面”的“前”怎么读？<br>1 xián；2 qián；3 qiǎn；4 jiàn | qián | “前”的声母和“七”一样。再想一想，是第几声？ | “前”读 qián，声母是 q，第二声。 | zh.p2_chinese.skill.char-sound; zh.p2_higher_chinese.skill.char-sound |
| zh-p2-sound2.q2 v1 / general | “走路”的“走”，哪一个拼音写对了？<br>1 zoǔ；2 zuǒ；3 zǒu；4 zòu | zǒu | 看一看声调写在哪个字母上面。 | “走”读 zǒu，第三声。ou 在一起时，声调写在 o 上面。zuǒ 是“左”的读音。 | zh.p2_chinese.skill.char-sound; zh.p2_higher_chinese.skill.char-sound |
| zh-p2-sound2.q3 v1 / general | “就”的拼音，哪一个写对了？<br>1 jiū；2 jìu；3 qiù；4 jiù | jiù | 看一看声母，再看一看声调写在哪个字母上面。 | “就”读 jiù，第四声。iu 在一起时，声调写在 u 上面。 | zh.p2_chinese.skill.char-sound; zh.p2_higher_chinese.skill.char-sound |
| zh-p2-sound2.q4 v1 / general | “树上结出了很多果子”里的“结”怎么读？<br>1 jié；2 jiē；3 jiě；4 qiē | jiē | “结”有两个读音。想一想，长出果子的“结”读哪一个？ | 长出果子的“结”读 jiē，第一声。“结”在别的地方还可以读 jié。 | zh.p2_chinese.skill.char-sound; zh.p2_higher_chinese.skill.char-sound |
| zh-p2-sound2.q5 v1 / general | “小狗”的“狗”怎么读？<br>1 gōu；2 kǒu；3 gòu；4 gǒu | gǒu | 先看声母，再看声调。 | “狗”读 gǒu，第三声。kǒu 是“口”的读音。 | zh.p2_chinese.skill.char-sound; zh.p2_higher_chinese.skill.char-sound |
| zh-p2-sound2-repair.q1 v1 / exact | 拼音“qián”是哪个字？<br>1 前；2 见；3 全；4 先 | 前 | 小声读一读每个字，再看声母和声调。 | “前”读 qián。“见”读 jiàn，“全”读 quán，“先”读 xiān。 | zh.p2_chinese.skill.char-sound; zh.p2_higher_chinese.skill.char-sound |
| zh-p2-sound2-repair.q2 v1 / similar | “牛”的拼音，哪一个写对了？<br>1 níu；2 niú；3 nóu；4 niǔ | niú | 看一看声调写在哪个字母上面。 | “牛”读 niú，第二声。iu 在一起时，声调写在 u 上面。 | zh.p2_chinese.skill.char-sound; zh.p2_higher_chinese.skill.char-sound |
| zh-p2-sound2-repair.q3 v1 / generic | “手”的拼音，哪一个写对了？<br>1 shoǔ；2 sǒu；3 shǔ；4 shǒu | shǒu | 先看声母，再看声调写在哪个字母上面。 | “手”读 shǒu，第三声。ou 在一起时，声调写在 o 上面。 | zh.p2_chinese.skill.char-sound; zh.p2_higher_chinese.skill.char-sound |
| zh-p2-wordchoice-b.q1 v1 / general | 小明很[空1]，每天都自己收好玩具。<br>1 坏；2 乖；3 怕；4 哭 | 乖 | 每天都自己收好玩具，小明是一个怎样的孩子？ | “乖”就是听话、懂事。自己收好玩具，说明小明很乖。 | zh.p2_chinese.skill.word-choice; zh.p2_higher_chinese.skill.word-choice |
| zh-p2-wordchoice-b.q2 v2 / general | [空1]别人是不对的。<br>1 帮助；2 照顾；3 欺负；4 认识 | 欺负 | 哪一件事是不对的？ | 为了让别人难过，抢别人的东西、笑别人，是欺负人的做法。这些做法是不对的。 | zh.p2_chinese.skill.word-choice; zh.p2_higher_chinese.skill.word-choice |
| zh-p2-wordchoice-b.q3 v1 / general | 我[空1]这本书送给你。<br>1 给；2 被；3 让；4 把 | 把 | 我要送的是什么？这样东西放在“送给你”的前面。 | “我把这本书送给你”，说的是我送书给你。 | zh.p2_chinese.skill.word-choice; zh.p2_higher_chinese.skill.word-choice |
| zh-p2-wordchoice-b.q4 v1 / general | 奶奶送[空1]我一个新书包。<br>1 给；2 把；3 被；4 让 | 给 | 新书包到了谁的手里？ | “送给我”，就是书包到了我的手里。 | zh.p2_chinese.skill.word-choice; zh.p2_higher_chinese.skill.word-choice |
| zh-p2-wordchoice-b.q5 v1 / general | 我的水壶在这里，你的水壶[空1]？<br>1 吗；2 吧；3 呢；4 的 | 呢 | 问别人的水壶在哪里，句子最后用哪个字？ | “你的水壶呢？”就是问你的水壶在哪里。 | zh.p2_chinese.skill.word-choice; zh.p2_higher_chinese.skill.word-choice |
| zh-p2-wordchoice-b-repair.q1 v1 / exact | 一只小鸟飞到窗边，[空1]在找东西吃。<br>1 他；2 它；3 她；4 地 | 它 | 小鸟是人，还是动物？ | 说到动物或东西，用“它”。“他”和“她”说的是人。 | zh.p2_chinese.skill.word-choice; zh.p2_higher_chinese.skill.word-choice |
| zh-p2-wordchoice-b-repair.q2 v1 / similar | 大树的叶子都黄了，[空1]好像生病了。<br>1 她；2 地；3 它；4 他 | 它 | 大树是人吗？ | 说到大树这样的东西，用“它”。 | zh.p2_chinese.skill.word-choice; zh.p2_higher_chinese.skill.word-choice |
| zh-p2-wordchoice-b-repair.q3 v1 / generic | 我的书包很旧了，可是我还是很喜欢[空1]。<br>1 地；2 他；3 她；4 它 | 它 | “喜欢（　）”说的是书包。书包是人吗？ | 说到书包这样的东西，用“它”。 | zh.p2_chinese.skill.word-choice; zh.p2_higher_chinese.skill.word-choice |
| zh-m20.q1 v1 / general | 小美和谁走路回家？<br>1 爸爸；2 姐姐；3 妈妈；4 老师 | 妈妈 | 看第一句。 | 第一句写明小美和妈妈走路回家。 | zh.p2_chinese.skill.explicit-info; zh.p2_higher_chinese.skill.explicit-info |
| zh-m20.q2 v3 / general | 妈妈为什么说快下雨了？哪一句把原因说全了？<br>1 因为天上来了很多乌云，天色看起来很暗。；2 因为天上来了很多乌云，还刮起了大风。；3 因为天上来了很多乌云，还下起了大雨。；4 因为她们已经走了很久，还没有走到家。 | 因为天上来了很多乌云，还刮起了大风。 | 妈妈说了哪两件事？看一看，哪一句里的两件事都是妈妈说的。 | 妈妈说了两个原因：天上来了很多乌云，还刮起了大风。别的句子里，有的话不是妈妈说的。 | zh.p2_chinese.skill.explicit-info; zh.p2_higher_chinese.skill.explicit-info |
| zh-m20.q3 v1 / general | 她们在巴士站等了多久，雨就停了？<br>1 一个下午；2 一会儿；3 一个晚上；4 两天 | 一会儿 | 找一找“雨就停了”前面的话。 | 短文写明她们等了一会儿，雨就停了。 | zh.p2_chinese.skill.explicit-info; zh.p2_higher_chinese.skill.explicit-info |
| zh-m20.q4 v1 / general | 回到家，小美说了什么？<br>1 “还好我们没有淋湿！”；2 “我们都淋湿了！”；3 “我想坐巴士回家！”；4 “雨一直没有停！” | “还好我们没有淋湿！” | 看最后一句。 | 最后一句写明小美说：“还好我们没有淋湿！” | zh.p2_chinese.skill.explicit-info; zh.p2_higher_chinese.skill.explicit-info |
| zh-p2-reason-repair.q1 v3 / exact | 读一读：弟弟哭了，因为他的风筝飞走了，他还找不到妈妈。<br>弟弟为什么哭了？哪一句把原因说全了？<br>1 因为他的风筝飞走了，飞得很高很远。；2 因为他一直找不到妈妈，心里很着急。；3 因为他的风筝飞走了，他还找不到妈妈。；4 因为他的风筝飞走了，妈妈还不让他回家。 | 因为他的风筝飞走了，他还找不到妈妈。 | “因为”后面写了哪两件事？看一看，哪一句里的两件事都写在句子里。 | “因为”后面写了两件事：风筝飞走了，还找不到妈妈。两件都要说。 | zh.p2_chinese.skill.explicit-info; zh.p2_higher_chinese.skill.explicit-info |
| zh-p2-reason-repair.q2 v3 / similar | 读一读：今天我很开心，因为我考了一百分，妈妈还给我买了一本新书。<br>“我”为什么很开心？哪一句把原因说全了？<br>1 因为我考了一百分，妈妈还给我买了一本新书。；2 因为我这次考了一百分，妈妈还带我去公园玩。；3 因为妈妈给我买了一本新书，还送我一支彩色笔。；4 因为妈妈今天给我买了一本我很喜欢的新书。 | 因为我考了一百分，妈妈还给我买了一本新书。 | “因为”后面写了哪两件事？看一看，哪一句里的两件事都写在句子里。 | “我”开心有两个原因：考了一百分，妈妈还买了一本新书。 | zh.p2_chinese.skill.explicit-info; zh.p2_higher_chinese.skill.explicit-info |
| zh-p2-reason-repair.q3 v2 / generic | 读一读：小花没有去公园。她生病了，外面又下着大雨。<br>小花为什么没有去公园？哪一句把原因说全了？<br>1 因为外面下着大雨，雨实在太大了。；2 因为她生病了，外面又刮起大风。；3 因为外面下着大雨，她又找不到伞。；4 因为她生病了，外面又下着大雨。 | 因为她生病了，外面又下着大雨。 | 这一次没有写“因为”。想一想，哪些事让小花不能去？ | 小花没有去公园，有两个原因：她生病了，外面又下着大雨。 | zh.p2_chinese.skill.explicit-info; zh.p2_higher_chinese.skill.explicit-info |

## Material context

### zh-m20 · 回家的路上 (v1)

> 星期三放学后，小美和妈妈走路回家。走到半路，妈妈说：“天上来了很多乌云，还刮起了大风，快下雨了。我们去巴士站等一等吧！”她们在巴士站等了一会儿，雨就停了。回到家，小美说：“还好我们没有淋湿！”

All first answers in this four-question material are collected before feedback. `zh-m20.q2` is now v3 (v2 options, v3 hint and explanation); material wording and the other three questions are unchanged.

## Handoff

- Done 2026-10-18: Claude re-reviewed the six v2 corrections. Each reason question leaves exactly one fully supported answer, with no length or clause-count cue. The three v3 hint edits are Claude edits, so they need ChatGPT re-review (or an owner waiver).
- Owner rules on the corrected versions and reviews the prepared sample after any review corrections settle. Preserve earlier decisions against the versions actually reviewed.
- Keep independent review, owner batch sign-off and import/release authorization separate. Current batch state records pending work.

## Author and review history

- 2026-10-18 author draft (Claude): 38 original P2 items for Chinese and Higher Chinese in four topic sets — look-alike/sound-alike characters (远 完 捉 带 记; 15), character sounds and written pinyin (8), word choice including 它 for animals and things, 把/给, 呢, 乖 and 欺负 (8), and finding the whole reason in a short text (material zh-m20 and three standalone items; 7). Each set has a complete exact/similar/generic pool.
- Drafted one set at a time; every item read rendered with blanks, annotations and options; common checks 1-11 and Chinese checks ZH1-ZH5 run on each item. Stems, options, hints, explanations and the passage use only characters on the cumulative P1-P2 lists, except the pinyin term 声调 (as in the approved zh-p2-sound.q5). Pinyin checked by hand; the 结 reading for bearing fruit (jiē) checked against a dictionary; no pinyin library was available.
- Known limits: in the four "which reason is complete" items the key is the longest option, because a complete reason is longer than a partial one (check 10); in the standalone ones the key also repeats the given sentence, because they test finding the whole reason, not paraphrase (check 5).
- Sources: P2 school exercise formats were reviewed privately to choose question types. No worksheet, textbook or past-paper wording, answer or learner information is used. As with every public group, the targets are generic curriculum content, not a record of any learner's errors.
- Disputed for the owner: four tone-mark placement items (zh-p2-sound2.q2, .q3, -repair.q2, -repair.q3) — whether telling correctly marked pinyin from wrongly marked pinyin is in P2 scope.
- Owner sample: 7 of 34 undisputed items, ceil(N/5), random.Random('zh-starter-002-v1-owner-sample-2026-10-18').sample(pool, ceil(len(pool)/5)) over batch order, pool excluding the disputed items.
- Owner decision 2026-10-18: all four tone-mark placement items kept as written; disputes cleared. The owner sample was drawn while they were disputed, so its pool stays the 34 items listed in the review pack.
- Owner decisions 2026-10-18: all 7 sampled items accepted as written, with no notes; rights cleared, because the content is original Turtle Academy material and no worksheet, textbook or past-paper text was copied.
- Pending: independent cross-review (ChatGPT) of all 38 items, Claude re-review of any corrections, then owner sign-off of the batch.
- 2026-10-18 ChatGPT independent cross-review of all 38 v1 questions and zh-m20 at 619c7c3: all keys correct; 32 items without blocking findings. Six revisions in v2 require Claude re-review and owner disposition: four complete-reason items had a uniquely longest key; the 记 explanation promised remembering; the 欺负 explanation was too broad. Read all revised stems/options/hints/explanations together with the material; keys, IDs, courses, leaf mappings and repair routes unchanged. Written pinyin readings checked against dictionary entries; cumulative P1-P2 text check found only the existing disclosed 调 in 声调.
- v2 owner-review provenance: the four tone-mark decisions and seven sampled-item acceptances recorded on 2026-10-18 apply to the v1 items the owner saw. Two originally sampled items, zh-p2-reason-repair.q1 and .q2, now have new versions and need a fresh owner decision. The prior seven-ID draw remains documented in the review pack. All six revised IDs are disputed pending review; redraw from the 32 unchanged agreed items using random.Random('zh-starter-002-v2-owner-sample-2026-10-18').sample(pool, ceil(len(pool)/5)) in batch order. Current sample decisions pending; rights clearance retained; owner batch sign-off remains pending.
- 2026-10-18 Claude re-review of the six v2 corrections at 1f59eb6: all six accepted in substance (balanced option lengths, unsupported-detail distractors, narrower 记 and 欺负 explanations). Follow-up in v3: every option in zh-m20.q2 and zh-p2-reason-repair.q1-.q2 now has two parts, so the hints that asked how many things the reason has no longer separated the options (common check 7). The hints now ask which two things the text states. The zh-m20.q2 explanation no longer refers to a removed one-cloud option. Keys, options, IDs and routes unchanged; text within the P1-P2 lists.
