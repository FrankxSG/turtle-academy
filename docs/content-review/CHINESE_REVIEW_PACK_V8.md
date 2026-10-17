# Chinese review pack — batch zh-starter-001 v8

**Historical snapshot:** current review uses [v10](CHINESE_REVIEW_PACK_V10.md). Its old draw and item versions are retained for provenance only; no owner approval is implied.

Manifest `zh-2024-p2p3-draft.2`. Owner review under [CONTENT_QA](../CONTENT_QA.md): every disputed item, plus a random 1-in-5 sample of AI-agreed items. Generic original content only; no learner data.

## Review provenance

- Claude reviewed all 318 v7 items on 2026-10-17. Claude drafted 293 of them, so for those items this pass is an author recheck rather than independent AI cross-review. The 25 ChatGPT-drafted items received Claude cross-review.
- Sample pool: 259 unchanged items that the review agreed with. Changed, disputed and new items are excluded. Sample: 52 items drawn with Python `random.Random('zh-starter-001-v8-owner-sample-2026-10-17').sample`, listed in batch order and recorded in `review_log.sampled_item_ids`.
- Outcomes are pending: nothing below is approved until the owner records a decision.

## A. Disputed items (15) — owner rules on each

- `zh-p2-order.q2` v3 (P2, lu-sentence-order, general)
  - 哪个句子排得对？（妈妈 / 在厨房 / 做饭 / 正）
  - Options: 妈妈正在做饭厨房。 · 在厨房妈妈做饭正。 · 正妈妈在厨房做饭。 · **妈妈正在厨房做饭。**
  - Hint: 先找出谁在做什么，再看看地点放在哪里。 · Explanation: 妈妈在厨房里做饭，所以选“妈妈正在厨房做饭。”
  - Finding (accept): Earlier revision awaiting re-review. Key is the only grammatical order of the four tiles. v8 also rewords the instruction to 哪个句子排得对？ so every instruction character is on the P1–P2 lists.
- `zh-p2-collocation.q8` v2 (P2, lu-collocation, general)
  - 哥哥拿着鱼竿在河边（　）鱼。
  - Options: **钓** · 放 · 踢 · 弹
  - Hint: 想一想用鱼竿做什么。 · Explanation: 哥哥用鱼竿钓鱼，所以选“钓”。
  - Finding (accept): Earlier revision awaiting re-review. Key is correct and unique. Note: 钓 is not on the P1–P2 character lists; acceptable as collocation vocabulary, but it does not count toward character-list coverage.
- `zh-p3-wordchoice.q5` v3 (P3, r-word-context, general)
  - 小明没有说谎，（　）地向老师承认了错误。
  - Options: 生气 · **诚实** · 骄傲 · 害怕
  - Hint: 不说谎、说实话的人是怎样的？ · Explanation: 不说谎、说实话就是“诚实”。小明诚实地承认了错误。
  - Finding (revised): The stem gave a definition and then a blank, two instructions in one. Now a single cue: 小明没有说谎，（　）地向老师承认了错误。
  - Before (v2): 哪个词的意思是“说实话，不说谎”？小明（　）地向老师承认了错误。 → key 诚实
- `zh-m07.q5` v2 (P2, r-explicit, general)
  - Material: 小蚂蚁搬家
  - 下大雨时，小蚂蚁们已经住进了哪里？
  - Options: **新家** · 河里 · 树顶 · 饼干下面
  - Hint: 再读故事的最后一句。 · Explanation: 最后一句说，蚂蚁们已经住进了新家。
  - Finding (accept): Earlier revision awaiting re-review. Explicitly stated in the last sentence; distractors are clearly wrong.
- `zh-m10.q5` v2 (P3, r-explicit, general)
  - Material: 小熊开店
  - 第二天，面包店里有什么变化？
  - Options: 面包全都不见了 · 店里没有客人 · 店搬到了路口 · **店里挤满了客人**
  - Hint: 找一找写“第二天”的那一句。 · Explanation: 最后一句说，第二天店里挤满了客人。
  - Finding (accept): Earlier revision awaiting re-review. Correct; 店搬到了路口 is a fair distractor because the sign, not the shop, went to the junction.
- `zh-m12.q5` v3 (P3, r-explicit, general)
  - Material: 我的好朋友
  - 有了这样的好朋友，“我”觉得怎样？
  - Options: 很害怕 · **很幸福** · 很生气 · 很无聊
  - Hint: 看最后一句。 · Explanation: 最后一句写明：有这样的好朋友，我觉得很幸福。
  - Finding (revised): Question 1’s correct option already said 戴着圆眼镜, which gave away this answer inside the same material. Replaced with the feeling stated in the last sentence (很幸福).
  - Before (v2): 小美戴着什么样的眼镜？ → key 圆圆的眼镜
- `zh-m14.q5` v2 (P3, r-explicit, general)
  - Material: 学飞的小鸟
  - 妈妈叫小鸟张开什么？
  - Options: 嘴巴 · **翅膀** · 尾巴 · 爪子
  - Hint: 再读妈妈对小鸟说的话。 · Explanation: 妈妈说：“张开翅膀，用力拍！”
  - Finding (accept): Earlier revision awaiting re-review. Directly quoted from the mother’s words.
- `zh-m18.q2` v1 (P2, r-character, general)
  - Material: 我的一天
  - 第2空选哪个字？
  - Options: 倍 · 北 · **背** · 被
  - Hint: 书包放在身后，用肩膀带着。 · Explanation: 书包要“背”着。
  - Finding (decide): Tested character 背 is not on the P1–P2 lists. Key is right and the context (书包) is clear. Accept as a common word, or ask for a different blank.
- `zh-m18.q4` v1 (P2, r-character, general)
  - Material: 我的一天
  - 第4空选哪个字？
  - Options: 案 · **按** · 安 · 暗
  - Hint: 照着规定的时间去做。 · Explanation: “按时”表示照着规定的时间。
  - Finding (decide): Tested character 按 (按时) is not on the P1–P2 lists. Key is right. Accept, or ask for a different blank.
- `zh-m15.q5` v1 (P3, r-character, general)
  - Material: 去动物园
  - 第5空选哪个字？
  - Options: 偷 · 榆 · 输 · **愉**
  - Hint: 组成表示开心的词。 · Explanation: “愉快”表示开心，竖心旁。
  - Finding (decide): Tested character 愉 (愉快) is not on the P1–P3 lists. Key is right. Accept for P3, or ask for a different blank.
- `zh-p2-charctx-repair.q2` v2 (P2, r-character, similar)
  - 我吃得很（　），一口也吃不下了。
  - Options: 跑 · 抱 · 泡 · **饱**
  - Hint: 吃了很多东西以后，会觉得怎样？ · Explanation: 吃够了叫“饱”。“饱”是食字旁，和吃有关。
  - Finding (revised): The stem 跑来（　）去 showed the answer 跑 in the sentence. Replaced with 我吃得很（　）, choosing 饱 from 跑/抱/泡/饱.
  - Before (v1): 小狗在院子里跑来（　）去。 → key 跑
- `zh-m08.q3` v2 (P2, r-explicit-practical, general)
  - Material: 游泳班报名
  - 游泳班几点开始上课？
  - Options: 下午两点 · 上午三点 · **下午三点** · 下午四点
  - Hint: 看“时间”一行。 · Explanation: “时间”一行写明下午三点到四点，所以三点开始。
  - Finding (revised): Asked for the length of the lesson (3 to 4 pm), which is a calculation, not explicit retrieval. Now asks the start time.
  - Before (v1): 每次上课多长时间？ → key 一个小时
- `zh-m17.q5` v2 (P3, r-explicit-practical, general)
  - Material: 图书馆借书须知
  - 书迟还了，每本书每天要罚多少钱？
  - Options: 二十分钱 · **十分钱** · 五十分钱 · 一元
  - Hint: 看第4条。 · Explanation: 第4条写明逾期还书每本每天罚款十分钱。
  - Finding (revised): Asked to work out a two-day fine. Applying information is a later-grade skill, so it now asks the daily fine stated in rule 4.
  - Before (v1): 一本书迟还了两天，要罚多少钱？ → key 二十分钱
- `zh-p2-notice-repair.q3` v2 (P2, r-explicit-practical, generic)
  - 读一读：【食堂今日午餐】 / 鸡饭：两元 / 炒面：一元五角 / 苹果：五角 / 炒面多少钱？
  - Options: 两元 · 五角 · **一元五角** · 一元
  - Hint: 找一找“炒面”这一行。 · Explanation: 告示写明炒面一元五角。
  - Finding (revised): Asked which item is cheapest (comparing 元 and 角). Now asks the stated price of 炒面.
  - Before (v1): 读一读：【食堂今日午餐】 / 鸡饭：两元 / 炒面：一元五角 / 苹果：五角 / 哪样东西最便宜？ → key 苹果
- `zh-p3-notice-repair.q3` v2 (P3, r-explicit-practical, generic)
  - 读一读：【巴士车费】 / 大人：一元五角 / 小学生：五角 / 小学生坐巴士要付多少钱？
  - Options: 一元五角 · **五角** · 两元 · 一元
  - Hint: 找一找“小学生”这一行。 · Explanation: 告示写明小学生的车费是五角。
  - Finding (revised): Asked to add two fares. Now asks the stated student fare.
  - Before (v1): 读一读：【巴士车费】 / 大人：一元五角 / 小学生：五角 / 小明（小学生）和妈妈一起坐巴士。 / 他们一共要付多少钱？ → key 两元

## B. New items (39) — need independent cross-review before they join the sample pool

New material `zh-m19` 生日卡: 【生日贺卡(hè kǎ)】 / 亲爱的小美： / 祝你生日快乐！ / 也祝你天天开心，身体健康。 / 你的好朋友 小文 / 十月八日

- `zh-p2-sound-repair.q1` v1 (P2, r-char-sound, exact)
  - “晴天”的“晴”怎么读？
  - Options: qīng · **qíng** · jīng · qǐng
  - Hint: “晴”和天气有关，想一想“晴天”怎么读。 · Explanation: “晴”读 qíng，第二声。“清”读 qīng，“请”读 qǐng。
- `zh-p2-sound-repair.q2` v1 (P2, r-char-sound, similar)
  - “请坐”的“请”怎么读？
  - Options: qíng · jìng · **qǐng** · qīng
  - Hint: 说“请”的时候，声音先降后升。 · Explanation: “请”读 qǐng，第三声。
- `zh-p2-sound-repair.q3` v1 (P2, r-char-sound, generic)
  - “小鸟在树上唱歌。”句子里“唱”的拼音是哪一个？
  - Options: cháng · zhàng · **chàng** · chuàng
  - Hint: 先轻声读一读“唱歌”，再看看哪个拼音的声调对。 · Explanation: “唱”读 chàng，第四声。
- `zh-p2-sound.q1` v1 (P2, r-char-sound, general)
  - “我长大了。”这里的“长”怎么读？
  - Options: cháng · **zhǎng** · zhāng · chǎng
  - Hint: 这里的“长”是说人变大了，不是说东西很长。 · Explanation: “长大”的“长”读 zhǎng。说东西很长时读 cháng。
- `zh-p2-sound.q2` v1 (P2, r-char-sound, general)
  - “这条路很长。”这里的“长”怎么读？
  - Options: zhǎng · zhàng · **cháng** · chāng
  - Hint: 这里说的是路的长短。 · Explanation: 说长短的“长”读 cháng。
- `zh-p2-sound.q3` v1 (P2, r-char-sound, general)
  - “我要去图书馆还书。”这里的“还”怎么读？
  - Options: hái · **huán** · huàn · hāi
  - Hint: 这里是把借来的书送回去。 · Explanation: 把东西送回去的“还”读 huán，“还有”的“还”读 hái。
- `zh-p2-sound.q4` v1 (P2, r-char-sound, general)
  - “妹妹睡着了。”这里的“着”怎么读？
  - Options: zhe · zhuó · **zháo** · zhāo
  - Hint: “睡着了”是说已经睡了，不是“看着”的“着”。 · Explanation: “睡着”的“着”读 zháo，“看着”的“着”读 zhe。
- `zh-p2-sound.q5` v1 (P2, r-char-sound, general)
  - 拼音“pǎo”是哪个字？
  - Options: 抱 · **跑** · 泡 · 饱
  - Hint: 这几个字右边都一样，看看拼音的声母。 · Explanation: “跑”读 pǎo。“抱”读 bào，“泡”读 pào，“饱”读 bǎo。
- `zh-p2-sound.q6` v1 (P2, r-char-sound, general)
  - “快乐”的“乐”怎么读？
  - Options: yuè · **lè** · lèi · luò
  - Hint: “快乐”是说心里高兴。 · Explanation: “快乐”的“乐”读 lè，“音乐”的“乐”读 yuè。
- `zh-p2-sound.q7` v1 (P2, r-char-sound, general)
  - 拼音“kàn”是哪个字？
  - Options: 着 · 手 · **看** · 目
  - Hint: 这个字和眼睛有关。 · Explanation: “看”读 kàn。“着”读 zhe，“手”读 shǒu，“目”读 mù。
- `zh-p2-card-repair.q1` v1 (P2, written-purpose, exact)
  - 读一读：【便条(biàn tiáo)】 / 妈妈： / 我去图书馆借书，下午五点回家。 / 小安 / 十月九日 / 这张便条(biàn tiáo)是谁写的？
  - Options: 妈妈 · **小安** · 老师 · 图书馆
  - Hint: 写的人的名字写在哪里？看看下面。 · Explanation: 便条下面写着“小安”，是小安写给妈妈的。
- `zh-p2-card-repair.q2` v1 (P2, written-purpose, similar)
  - 读一读： / 亲爱的奶奶： / 祝您新年快乐，身体健康！ / 小红 / 一月一日 / 这张卡是写给谁的？
  - Options: 小红 · 妈妈 · **奶奶** · 老师
  - Hint: 看第一行“亲爱的”后面写的是谁。 · Explanation: 第一行写着“亲爱的奶奶”，这张卡是写给奶奶的。
- `zh-p2-card-repair.q3` v1 (P2, written-purpose, generic)
  - 写一张生日卡送给好朋友，卡的最下面要写什么？
  - Options: 今天的天气 · 收卡的人 · 一句问好的话 · **写卡的人和日期**
  - Hint: 收到卡的人怎样知道这张卡是谁、在哪一天写的？ · Explanation: 卡的最下面写上写卡的人和日期，收卡的人就知道是谁送的。
- `zh-m19.q1` v1 (P2, written-purpose, general)
  - Material: 生日卡
  - 这张卡是写给谁的？
  - Options: 小文 · **小美** · 妈妈 · 老师
  - Hint: 看第一行“亲爱的”后面的名字。 · Explanation: 第一行写着“亲爱的小美”，卡是写给小美的。
- `zh-m19.q2` v1 (P2, written-purpose, general)
  - Material: 生日卡
  - 这张卡是谁写的？
  - Options: 小美 · 老师 · **小文** · 妈妈
  - Hint: 看卡的下面写的名字。 · Explanation: 卡的下面写着“你的好朋友 小文”。
- `zh-m19.q3` v1 (P2, written-purpose, general)
  - Material: 生日卡
  - 这张卡是哪一天写的？
  - Options: **十月八日** · 八月十日 · 十月一日 · 八月八日
  - Hint: 看卡最下面的日期。 · Explanation: 最下面写着十月八日。
- `zh-m19.q4` v1 (P2, written-purpose, general)
  - Material: 生日卡
  - 小文祝小美什么？
  - Options: 新年快乐 · **生日快乐** · 学习进步 · 节日快乐
  - Hint: 看“祝你”后面的话。 · Explanation: 卡里写着“祝你生日快乐”。
- `zh-m19.q5` v1 (P2, written-purpose, general)
  - Material: 生日卡
  - 卡的最下面写的是什么？
  - Options: 祝你的话 · 收卡的人 · **写卡的人和日期** · 送的礼物
  - Hint: 看看最后两行写了什么。 · Explanation: 最后两行写的是写卡的人“小文”和日期“十月八日”。
- `zh-p2-meaning-repair.q1` v1 (P2, r-char-meaning, exact)
  - “我口渴了。”“渴”是说什么？
  - Options: 很想睡觉 · **很想喝水** · 很想吃东西 · 很想出去玩
  - Hint: 口渴的时候，会想要什么？ · Explanation: “渴”是很想喝水。“渴”是三点水，和水有关。
- `zh-p2-meaning-repair.q2` v1 (P2, r-char-meaning, similar)
  - “我饿了。”“饿”是说什么？
  - Options: 很想喝水 · 吃得太多了 · **很想吃东西** · 很想睡觉
  - Hint: 饿了以后，会想做什么？ · Explanation: “饿”是很想吃东西。“饿”是食字旁，和吃有关。
- `zh-p2-meaning-repair.q3` v1 (P2, r-char-meaning, generic)
  - “这碗面很香。”“香”是说什么？
  - Options: 看起来很大 · 吃起来很甜 · **闻起来很好** · 听起来很好听
  - Hint: “香”要用鼻子去闻。 · Explanation: “香”是说闻起来的味道很好。
- `zh-p2-meaning.q1` v1 (P2, r-char-meaning, general)
  - “我吃饱了。”“饱”是说什么？
  - Options: 很想吃东西 · 跑得很快 · 很想喝水 · **吃了很多，不想再吃了**
  - Hint: 吃了很多东西以后，还想吃吗？ · Explanation: “饱”是吃够了，不想再吃了。“饿”才是很想吃东西。
- `zh-p2-meaning.q2` v1 (P2, r-char-meaning, general)
  - “早”和哪个字相反？
  - Options: **晚** · 日 · 十 · 草
  - Hint: 想一想，一天开始的时候和快结束的时候。 · Explanation: “早”和“晚”相反。“日、十、草”只是字形和“早”有些像。
- `zh-p2-meaning.q3` v1 (P2, r-char-meaning, general)
  - “热”和哪个字相反？
  - Options: 高 · **冷** · 亮 · 多
  - Hint: 想一想，下雪的时候是什么感觉。 · Explanation: “热”和“冷”相反。
- `zh-p2-meaning.q4` v1 (P2, r-char-meaning, general)
  - “今天是晴天。”“晴”是说什么？
  - Options: 下着大雨 · 天上有很多乌云 · **天上没有云，太阳出来了** · 刮着大风
  - Hint: 晴天的时候可以去公园玩。哪一个是好天气？ · Explanation: “晴天”是天上没有云、太阳出来的天气。
- `zh-p2-radmeaning-repair.q1` v1 (P2, r-radical, exact)
  - 下面哪个字和水有关？
  - Options: 何 · **河** · 可 · 哥
  - Hint: 看看每个字的左边。 · Explanation: “河”是三点水，河里有水。其他三个字都有“可”，但和水没有关系。
- `zh-p2-radmeaning-repair.q2` v1 (P2, r-radical, similar)
  - 下面哪个字和火有关？
  - Options: 打 · 钉 · **灯** · 盯
  - Hint: 以前的灯要点火才会亮。看看每个字的左边。 · Explanation: “灯”是火字旁，和火、和光有关。
- `zh-p2-radmeaning-repair.q3` v1 (P2, r-radical, generic)
  - “妈、姐、妹”都有同一个偏旁(piān páng)。这个偏旁和什么有关？
  - Options: **女孩子** · 马 · 树木 · 嘴巴
  - Hint: 这三个字说的都是家里的什么人？ · Explanation: “妈、姐、妹”都是女字旁，说的都是女的家人。
- `zh-p2-radmeaning.q1` v1 (P2, r-radical, general)
  - 下面哪个字和说话有关？
  - Options: 活 · 舌 · **话** · 适
  - Hint: 看看每个字的左边，哪个偏旁和说话有关？ · Explanation: “话”是言字旁，和说话有关。
- `zh-p2-radmeaning.q2` v1 (P2, r-radical, general)
  - “跑、跳、踢”都和身体的哪里有关？
  - Options: 手 · 眼睛 · 口 · **脚**
  - Hint: 看看这三个字左边都一样的地方。 · Explanation: “跑、跳、踢”都是足字旁，都是用脚做的动作。
- `zh-p2-radmeaning.q3` v1 (P2, r-radical, general)
  - 下面哪个字和手有关？
  - Options: 白 · **拍** · 伯 · 怕
  - Hint: 看看每个字的左边，哪个偏旁和手有关？ · Explanation: “拍”是提手旁，拍手、拍球都要用手。
- `zh-p2-radmeaning.q4` v1 (P2, r-radical, general)
  - “吃、喝、唱”都有口字旁。它们都和什么有关？
  - Options: 眼睛 · **口** · 脚 · 耳朵
  - Hint: 吃东西、喝水、唱歌，都要用到哪里？ · Explanation: “吃、喝、唱”都要用口，所以都是口字旁。
- `zh-p2-punctread-repair.q1` v1 (P2, r-punctuation, exact)
  - 哪一句是在问别人？
  - Options: 我们去公园。 · **我们去公园吗？** · 我们去公园！ · 我们去公园了。
  - Hint: 看看每一句最后的标点。 · Explanation: 句子最后是问号“？”，又有“吗”，是在问别人。
- `zh-p2-punctread-repair.q2` v1 (P2, r-punctuation, similar)
  - “今天会下雨吗？”说这句话的人在做什么？
  - Options: 告诉别人一件事 · **问别人** · 请别人帮忙 · 说自己很高兴
  - Hint: 看看句子最后的标点。 · Explanation: 句子最后是问号“？”，说话的人在问别人今天会不会下雨。
- `zh-p2-punctread-repair.q3` v1 (P2, r-punctuation, generic)
  - 哪一句说话的人很高兴？
  - Options: 妈妈回来了吗？ · 妈妈回来了。 · **妈妈回来了！** · 妈妈回来了没有？
  - Hint: 哪个标点可以表示心里很高兴？ · Explanation: 感叹号“！”可以表示很高兴。问号是在问人，句号只是说一件事。
- `zh-p2-punctread.q1` v1 (P2, r-punctuation, general)
  - 老师说：“请大家坐好。”冒号(máo hào)“：”后面写的是什么？
  - Options: 老师是谁 · 同学说的话 · **老师说的话** · 上课的时间
  - Hint: 看看“：”前面写着“老师说”。 · Explanation: 冒号“：”后面引号里的，是老师说的话。
- `zh-p2-punctread.q2` v1 (P2, r-punctuation, general)
  - “我喜欢红色、黄色和蓝色。”这句话说到几种颜色？
  - Options: 一种 · 两种 · **三种** · 四种
  - Hint: “、”和“和”把颜色分开了，一个一个数。 · Explanation: 红色、黄色和蓝色，一共三种颜色。
- `zh-p2-punctread.q3` v1 (P2, r-punctuation, general)
  - 哪一句是在说一件事，不是在问别人？
  - Options: 小明在家吗？ · **小明在家。** · 小明去哪里了？ · 小明在家没有？
  - Hint: 找一找最后不是问号的句子。 · Explanation: “小明在家。”最后是句号，是在说一件事。其他三句都在问人。
- `zh-p2-punctread.q4` v1 (P2, r-punctuation, general)
  - “谁在门外？”这句话最后为什么用“？”
  - Options: 因为很高兴 · 因为话说完了 · **因为在问别人** · 因为要说很多东西
  - Hint: 说这句话的人知道门外是谁吗？ · Explanation: 说话的人不知道门外是谁，在问别人，所以用问号。

## C. Wording-only changes (44) — key and options unchanged

| Item | Field | Reason | Before | After |
| --- | --- | --- | --- | --- |
| `zh-m15.q4` | hint | Hint called a penguin’s sway a hand action | 企鹅走路时身体怎么动？用手的动作。 | 企鹅走路时，身体会左右怎样动？ |
| `zh-p3-confusable-u62ab.q3` | stem | 超人 is a franchise character; now 演员 | 超人（　）着一件红色的斗篷。 | 演员（　）着一件红色的斗篷。 |
| `zh-p2-radical-u8e22.q1` | hint | Hint named the radical that only the answer has | 这是用脚做的动作，看看哪个字是足字旁。 | 这是用脚做的动作。想一想，哪个偏旁和脚有关？ |
| `zh-p2-radical-u8e22.q2` | hint | Hint named the radical that only the answer has | 石子是用脚弄走的，选足字旁的字。 | 石子是用脚弄走的。想一想，哪个偏旁和脚有关？ |
| `zh-p2-radical-u63a8.q1` | hint | Hint named the radical that only the answer has | 开门要用手，选提手旁的字。 | 开门要用手。想一想，哪个偏旁和手有关？ |
| `zh-p2-radical-u5439.q3` | hint | Hint named the radical that only the answer has | 用嘴巴出气，选口字旁的字。 | 用嘴巴出气。想一想，哪个偏旁和嘴巴有关？ |
| `zh-p2-radical-u7092.q1` | hint | Hint named the radical that only the answer has | 做菜要用火，选火字旁的字。 | 做菜要用火。想一想，哪个偏旁和火有关？ |
| `zh-p2-radical-u7761.q1` | hint | Hint named the radical that only the answer has | 闭上眼睛休息，选目字旁的字。 | 闭上眼睛休息。想一想，哪个偏旁和眼睛有关？ |
| `zh-p2-radical-u996e.q1` | hint | Hint named the radical that only the answer has | 可以喝的东西，选食字旁的字。 | 可以喝的东西。想一想，哪个偏旁和吃喝有关？ |
| `zh-p2-radical-u996e.q3` | hint | Hint named the radical that only the answer has | 和吃喝有关，选食字旁的字。 | 想一想，哪个偏旁和吃喝有关？ |
| `zh-p2-radical-u6811.q1` | hint | Hint named the radical that only the answer has | 长得高高大大、有绿叶的植物，选木字旁的字。 | 长得高高大大、有绿叶的植物。想一想，哪个偏旁和树木有关？ |
| `zh-p2-radical-u6697.q1` | hint | Hint named the radical that only the answer has | 没有光，选日字旁的字。 | 没有光。想一想，哪个偏旁和太阳或光线有关？ |
| `zh-p2-radical-u8df3.q1` | hint | Hint named the radical that only the answer has | 青蛙用腿做的动作，选足字旁的字。 | 青蛙用腿做的动作。想一想，哪个偏旁和脚有关？ |
| `zh-p3-confusable-u7bee.q2` | hint | Hint named the radical that only the answer has | 装菜的东西，选竹字头的字。 | 装菜的东西。想一想，哪个偏旁和竹子有关？ |
| `zh-p3-confusable-u7ba1.q1` | hint | Hint named the radical that only the answer has | 水从这条长长的东西里流过，注意竹字头。 | 水从这条长长的东西里流过。想一想，哪个偏旁和竹子有关？ |
| `zh-p3-confusable-u72fc.q2` | hint | Hint named the radical that only the answer has | 会嚎叫的动物，选反犬旁的字。 | 会嚎叫的动物。想一想，哪个偏旁和动物有关？ |
| `zh-p3-confusable-u6162.q2` | hint | Hint named the radical that only the answer has | 要说得不快一点，选竖心旁的字。 | 要说得不快一点。想一想，哪个偏旁和心里的感觉有关？ |
| `zh-p3-confusable-u9493.q1` | hint | Hint named the radical that only the answer has | 用鱼竿抓鱼，选金字旁的字。 | 用鱼竿抓鱼。想一想，哪个偏旁和金属有关？ |
| `zh-p3-confusable-u8eba.q1` | hint | Hint named the radical that only the answer has | 身体平平地放着，选身字旁的字。 | 身体平平地放着。想一想，哪个偏旁和身体有关？ |
| `zh-p3-confusable-u788e.q1` | hint | Hint named the radical that only the answer has | 杯子变成很多小块，选石字旁的字。 | 杯子变成很多小块。想一想，哪个偏旁和石头有关？ |
| `zh-p3-confusable-u788e.q3` | hint | Hint named the radical that only the answer has | 很小很小的片，选石字旁的字。 | 很小很小的片。想一想，哪个偏旁和石头有关？ |
| `zh-p3-confusable-u5077.q1` | hint | Hint named the radical that only the answer has | 没有问过别人就拿去吃，选单人旁的字。 | 没有问过别人就拿去吃。想一想，哪个偏旁和人有关？ |
| `zh-p3-confusable-u6652.q1` | hint | Hint named the radical that only the answer has | 衣服要在太阳下变干，选日字旁的字。 | 衣服要在太阳下变干。想一想，哪个偏旁和太阳或光线有关？ |
| `zh-p3-confusable-u60ca.q1` | hint | Hint named the radical that only the answer has | 这是心里突然的感觉，选竖心旁的字。 | 这是心里突然的感觉。想一想，哪个偏旁和心里的感觉有关？ |
| `zh-p3-confusable-u7bc7.q1` | hint | Hint named the radical that only the answer has | 数文章用的量词，注意竹字头。 | 数文章用的量词。想一想，哪个偏旁和竹子有关？ |
| `zh-p3-confusable-u7bc7.q2` | hint | Hint named the radical that only the answer has | 文章的量词，选竹字头的字。 | 文章的量词。想一想，哪个偏旁和竹子有关？ |
| `zh-p3-confusable-u62ab.q1` | hint | Hint named the radical that only the answer has | 把衣服搭在肩上，选提手旁的字。 | 把衣服搭在肩上。想一想，哪个偏旁和手有关？ |
| `zh-p3-radical-u8e29.q1` | hint | Hint named the radical that only the answer has | 用脚做的动作，选足字旁的字。 | 用脚做的动作。想一想，哪个偏旁和脚有关？ |
| `zh-p3-radical-u642c.q1` | hint | Hint named the radical that only the answer has | 用手移动东西，选提手旁的字。 | 用手移动东西。想一想，哪个偏旁和手有关？ |
| `zh-p3-radical-u558a.q1` | hint | Hint named the radical that only the answer has | 用嘴发出大声，选口字旁的字。 | 用嘴发出大声。想一想，哪个偏旁和嘴巴有关？ |
| `zh-p3-radical-u88d9.q1` | hint | Hint named the radical that only the answer has | 这是一种衣服，选衣字旁的字。 | 这是一种衣服。想一想，哪个偏旁和衣服有关？ |
| `zh-p3-radical-u817f.q1` | hint | Hint named the radical that only the answer has | 身体的一个部位，选月字旁的字。 | 身体的一个部位。想一想，哪个偏旁和身体有关？ |
| `zh-p3-radical-u949f.q1` | hint | Hint named the radical that only the answer has | 看时间用的东西，选金字旁的字。 | 看时间用的东西。想一想，哪个偏旁和金属有关？ |
| `zh-p3-radical-u94f6.q1` | hint | Hint named the radical that only the answer has | 一种金属的颜色，选金字旁的字。 | 一种金属的颜色。想一想，哪个偏旁和金属有关？ |
| `zh-p3-radical-u94f6.q3` | hint | Hint named the radical that only the answer has | 存钱的地方，选金字旁的字。 | 存钱的地方。想一想，哪个偏旁和金属有关？ |
| `zh-p2-order.q1` | stem | Instruction used characters beyond the P1–P2 lists | 哪个句子排列正确？（我 / 上学 / 每天 / 走路） | 哪个句子排得对？（我 / 上学 / 每天 / 走路） |
| `zh-p2-order.q3` | stem | Instruction used characters beyond the P1–P2 lists | 哪个句子排列正确？（小狗 / 在草地上 / 开心地 / 跑） | 哪个句子排得对？（小狗 / 在草地上 / 开心地 / 跑） |
| `zh-p2-order.q4` | stem | Instruction used characters beyond the P1–P2 lists | 哪个句子排列正确？（星期天 / 我们 / 去公园 / 玩） | 哪个句子排得对？（星期天 / 我们 / 去公园 / 玩） |
| `zh-p2-order.q5` | stem | Instruction used characters beyond the P1–P2 lists | 哪个句子排列正确？（老师 / 讲故事 / 给我们 / 听） | 哪个句子排得对？（老师 / 讲故事 / 给我们 / 听） |
| `zh-p2-order.q6` | stem | Instruction used characters beyond the P1–P2 lists | 哪个句子排列正确？（弟弟 / 把玩具 / 收好 / 了） | 哪个句子排得对？（弟弟 / 把玩具 / 收好 / 了） |
| `zh-p2-punct.q1` | stem | Instruction used characters beyond the P1–P2 lists | 选出正确的标点：你今天想去哪里（　） | 选一个标点(biāo diǎn)：你今天想去哪里（　） |
| `zh-p2-punct.q2` | stem | Instruction used characters beyond the P1–P2 lists | 选出正确的标点：这里的风景真美（　） | 选一个标点(biāo diǎn)：这里的风景真美（　） |
| `zh-p2-punct.q3` | stem | Instruction used characters beyond the P1–P2 lists | 选出正确的标点：我喜欢苹果（　）香蕉和葡萄。 | 选一个标点(biāo diǎn)：我喜欢苹果（　）香蕉和葡萄。 |
| `zh-p2-punct.q4` | stem | Instruction used characters beyond the P1–P2 lists | 选出正确的标点：老师说（　）“明天要带水壶。” | 选一个标点(biāo diǎn)：老师说（　）“明天要带水壶。” |

## D. Random 20% owner sample (52 of 259)

- `zh-m02.q2` v2 (P2, r-explicit-practical, general)
  - Material: 图书角通知
  - 图书角几点开放？
  - Options: 上午三点 · **下午三点** · 下午四点 · 上午四点
  - Hint: 注意“上午”和“下午”。 · Explanation: 通知写明下午三点。
- `zh-m02.q3` v3 (P2, r-explicit-practical, general)
  - Material: 图书角通知
  - 图书角在哪里？
  - Options: **一楼活动室** · 二楼活动室 · 一楼音乐室 · 二楼音乐室
  - Hint: 找“地点”一栏。 · Explanation: 地点一栏写的是一楼活动室。
- `zh-m05.q3` v2 (P3, r-explicit, general)
  - Material: 换一个办法
  - 纸盒开始为什么倒了？
  - Options: **纸盒太软** · 书太少 · 地上有水 · 没有伙伴
  - Hint: 找“可是”后面明说的情况。 · Explanation: 短文说大纸盒太软，所以放进书后就倒了。
- `zh-p2-confusable-u5ea7.q3` v3 (P2, r-character, generic)
  - 车上没有空（　）了，只能站着。
  - Options: 做 · **座** · 作 · 坐
  - Hint: 这里缺的是表示可以坐下的位置的字。 · Explanation: 可以坐下的位置是“座”。有空座，才有地方坐。
- `zh-p2-confusable-u6674.q1` v3 (P2, r-character, exact)
  - 天空没有云，今天是（　）天。
  - Options: 睛 · 情 · 请 · **晴**
  - Hint: 想一想，哪个字用来写天气？ · Explanation: 没有云、天气好，可以说“晴天”。
- `zh-p2-confusable-u5df2.q1` v3 (P2, r-character, exact)
  - 我（　）经做完功课了。
  - Options: 己 · **已** · 以 · 乙
  - Hint: 这里说的是事情做完了。 · Explanation: “已经”表示事情做完了。“已”的左上角封了一半，“自己”的“己”不封口。
- `zh-p2-confusable-u64cd.q3` v3 (P2, r-character, generic)
  - 姐姐喜欢学体（　），她会翻跟头。
  - Options: 躁 · **操** · 澡 · 燥
  - Hint: 这里说的是一种运动。 · Explanation: “体操”是一种运动。“操”是提手旁，和用手做动作有关。
- `zh-p2-confusable-u4e4c.q3` v3 (P2, r-character, generic)
  - 她的头发（　）黑发亮。
  - Options: 岛 · **乌** · 鸟 · 马
  - Hint: 这里要组成一个表示很黑的词。 · Explanation: “乌黑”就是很黑。
- `zh-p2-radical-u63a8.q2` v1 (P2, r-radical, similar)
  - 大家一起把车（　）到路边。
  - Options: 谁 · 堆 · 维 · **推**
  - Hint: 这是用手用力的动作。 · Explanation: “推”是提手旁，表示用手。
- `zh-p2-radical-u6c60.q1` v1 (P2, r-radical, exact)
  - 公园里有一个小水（　）。
  - Options: 他 · 驰 · **池** · 地
  - Hint: 装水的地方，选三点水的字。 · Explanation: “池”是三点水，和水有关。
- `zh-p2-radical-u6697.q2` v1 (P2, r-radical, similar)
  - 天色越来越（　），快要下雨了。
  - Options: 音 · 部 · 意 · **暗**
  - Hint: 乌云来了，光线变少。 · Explanation: 光线少就是“暗”。
- `zh-p2-measure.q1` v1 (P2, lu-measure-word, exact)
  - 妈妈给我买了一（　）故事书。
  - Options: 张 · 只 · **本** · 条
  - Hint: 书一般怎么数？ · Explanation: 书用“本”来数：一本书。
- `zh-p2-measure.q3` v1 (P2, lu-measure-word, generic)
  - 请给我一（　）白纸。
  - Options: 条 · 本 · 只 · **张**
  - Hint: 纸是薄薄平平的。 · Explanation: 纸用“张”来数。
- `zh-p2-collocation.q6` v1 (P2, lu-collocation, general)
  - 老师在白板上（　）字。
  - Options: 放 · 弹 · **写** · 踢
  - Hint: 用笔做的事。 · Explanation: 用笔“写字”。
- `zh-p2-collocation.q7` v1 (P2, lu-collocation, general)
  - 音乐课上，我们一起（　）歌。
  - Options: **唱** · 放 · 踢 · 打
  - Hint: 用声音做的事。 · Explanation: 用嘴“唱歌”。
- `zh-p2-wordchoice.q7` v1 (P2, lu-word-choice, general)
  - 这个西瓜又大又（　）。
  - Options: 辣 · 苦 · **甜** · 臭
  - Hint: 好吃的西瓜是什么味道？ · Explanation: 西瓜又大又甜。
- `zh-m06.q2` v1 (P2, r-explicit, general)
  - Material: 帮奶奶
  - 奶奶走路为什么很慢？
  - Options: 路太远了 · 外面下雨了 · 奶奶太累了 · **奶奶的腿不好**
  - Hint: 找写奶奶走路的句子。 · Explanation: 短文说奶奶的腿不好，走路很慢。
- `zh-m06.q3` v1 (P2, r-explicit, general)
  - Material: 帮奶奶
  - 我帮奶奶做了哪件事？
  - Options: 洗碗 · **扫地** · 买菜 · 做饭
  - Hint: 找“我帮奶奶”后面的话。 · Explanation: 我帮奶奶扫地，还把衣服收进来。
- `zh-m06.q4` v1 (P2, r-explicit, general)
  - Material: 帮奶奶
  - 中午奶奶给我做了什么？
  - Options: 鸡汤 · 炒饭 · **鸡蛋面** · 面包
  - Hint: 找“中午”那一句。 · Explanation: 奶奶做了鸡蛋面。
- `zh-m07.q1` v1 (P2, r-explicit, general)
  - Material: 小蚂蚁搬家
  - 故事开始时，天空是什么样子？
  - Options: 下着大雪 · 阳光很好 · **乌云密布** · 出现彩虹
  - Hint: 看第一句。 · Explanation: 第一句写天空乌云密布。
- `zh-m07.q2` v1 (P2, r-explicit, general)
  - Material: 小蚂蚁搬家
  - 蚂蚁们往哪里搬？
  - Options: 往低处搬 · 往河里搬 · **往高处搬** · 往树洞里搬
  - Hint: 找“往”后面的词。 · Explanation: 蚂蚁们往高处搬。
- `zh-m07.q4` v1 (P2, r-explicit, general)
  - Material: 小蚂蚁搬家
  - 谁来帮小蚂蚁？
  - Options: 一只小鸟 · 蚂蚁妈妈 · 没有人 · **旁边的两只蚂蚁**
  - Hint: 找“帮忙”前面的词。 · Explanation: 旁边的两只蚂蚁马上过来帮忙。
- `zh-m18.q3` v1 (P2, r-character, general)
  - Material: 我的一天
  - 第3空选哪个字？
  - Options: 完 · 园 · **玩** · 远
  - Hint: 和同学们一起做游戏。 · Explanation: “玩游戏”的“玩”是王字旁。
- `zh-p3-confusable-u7ba1.q3` v1 (P3, r-character, generic)
  - 这根吸（　）是用纸做的。
  - Options: **管** · 馆 · 关 · 官
  - Hint: 喝饮料用的细长东西。 · Explanation: “吸管”的“管”是竹字头。
- `zh-p3-confusable-u72fc.q1` v1 (P3, r-character, exact)
  - 大灰（　）想吃小羊。
  - Options: 郎 · 朗 · **狼** · 浪
  - Hint: 这是一种动物，看偏旁。 · Explanation: 动物“狼”是反犬旁。
- `zh-p3-confusable-u6162.q3` v1 (P3, r-character, generic)
  - 车子开得太（　），我们迟到了。
  - Options: **慢** · 漫 · 馒 · 曼
  - Hint: 迟到可能是因为车子不够快。 · Explanation: 车子不快写“慢”。
- `zh-p3-radical-u8e29.q2` v1 (P3, r-radical, similar)
  - 他一不小心（　）进了水坑。
  - Options: 彩 · **踩** · 睬 · 采
  - Hint: 脚走进了水坑。 · Explanation: 脚踏进去是“踩”。
- `zh-p3-radical-u642c.q3` v1 (P3, r-radical, generic)
  - 这箱书太重了，我一个人（　）不动。
  - Options: 盘 · 般 · **搬** · 船
  - Hint: 重东西要用手抬起来移动。 · Explanation: 移动重物写“搬”。
- `zh-p3-radical-u88d9.q3` v1 (P3, r-radical, generic)
  - 跳舞时，她的长（　）转成了一朵花。
  - Options: **裙** · 群 · 君 · 郡
  - Hint: 跳舞时会转起来的衣服。 · Explanation: “长裙”的“裙”是衣字旁。
- `zh-p3-radical-u817f.q2` v1 (P3, r-radical, similar)
  - 小狗有四条（　）。
  - Options: **腿** · 褪 · 推 · 退
  - Hint: 小狗用来走路的部位。 · Explanation: 走路用“腿”，月字旁。
- `zh-p3-radical-u949f.q3` v1 (P3, r-radical, generic)
  - 学校的（　）声响了，大家进课室。
  - Options: **钟** · 肿 · 冲 · 种
  - Hint: 会响的金属东西。 · Explanation: “钟声”的“钟”是金字旁。
- `zh-p3-measure.q7` v1 (P3, lu-measure-word, general)
  - 我给外婆写了一（　）信。
  - Options: 本 · 块 · **封** · 条
  - Hint: 信装在信封里。 · Explanation: 信用“封”来数。
- `zh-p3-collocation.q2` v1 (P3, lu-collocation, similar)
  - 老师带我们去（　）博物馆。
  - Options: **参观** · 参加 · 穿上 · 修理
  - Hint: 到一个地方去看看。 · Explanation: “参观博物馆”表示去看展览。
- `zh-p3-collocation.q4` v1 (P3, lu-collocation, general)
  - 我们要爱护地球，保护（　）。
  - Options: 饭菜 · **环境** · 时间 · 声音
  - Hint: 地球上的空气、水和树木。 · Explanation: “保护环境”。
- `zh-p3-collocation.q7` v1 (P3, lu-collocation, general)
  - 大家一起想办法，终于解决了这个（　）。
  - Options: 窗户 · 蛋糕 · 鞋子 · **问题**
  - Hint: 想办法要解决的是什么？ · Explanation: “解决问题”。
- `zh-p3-wordchoice.q1` v1 (P3, r-word-context, exact)
  - 这次考试他得了满分，大家都很（　）他。
  - Options: 担心 · 害怕 · 讨厌 · **佩服**
  - Hint: 别人做得很好时，我们心里会怎样？ · Explanation: “佩服”表示觉得别人很了不起。
- `zh-p3-wordchoice.q3` v1 (P3, r-word-context, generic)
  - 这道数学题太（　）了，我想了很久也不会做。
  - Options: 容易 · 快 · 简单 · **难**
  - Hint: 想了很久也不会做，说明题目怎样？ · Explanation: 题目难才会想很久。
- `zh-p3-sentence.q3` v1 (P3, lu-sentence-order, generic)
  - 哪个句子排列正确？（因为 / 下大雨 / 运动会 / 改期了）
  - Options: 运动会因为改期了，下大雨。 · 改期了因为运动会下大雨。 · **因为下大雨，运动会改期了。** · 下大雨因为，运动会改期了。
  - Hint: 先说原因，再说结果。 · Explanation: “因为下大雨，运动会改期了。”
- `zh-p3-sentence.q4` v1 (P3, lu-sentence-transform, exact)
  - 用“被”改写：“小猫打翻了花瓶。”
  - Options: 被小猫花瓶打翻了。 · **花瓶被小猫打翻了。** · 花瓶把小猫打翻了。 · 小猫被花瓶打翻了。
  - Hint: “被”前面是受到动作的东西。 · Explanation: 受到动作的是花瓶，所以“花瓶被小猫打翻了。”
- `zh-p3-sentence.q6` v1 (P3, lu-sentence-transform, generic)
  - 把“妈妈买了一个蛋糕。”改成问句，哪一句正确？
  - Options: 一个蛋糕买了妈妈。 · **妈妈买了什么？** · 妈妈买了一个蛋糕！ · 妈妈为什么蛋糕？
  - Hint: 问句要问出“蛋糕”这部分。 · Explanation: 问买了什么东西：“妈妈买了什么？”
- `zh-p3-punct.q6` v1 (P3, w-punctuation, general)
  - 选出正确的标点：我最喜欢读（　）西游记》这本书。
  - Options: 、 · “ · **《** · （
  - Hint: 书名要用什么符号括起来？ · Explanation: 书名用书名号《》。
- `zh-m11.q4` v1 (P3, r-explicit, general)
  - Material: 垃圾分类
  - 回收的东西可以怎样？
  - Options: **做成新的东西** · 扔进大海 · 全部烧掉 · 埋进土里
  - Hint: 找“回收后”。 · Explanation: 回收后能做成新的东西。
- `zh-m13.q2` v1 (P3, r-explicit, general)
  - Material: 中秋节
  - 中秋节晚上的月亮是什么样子的？
  - Options: 是红色的 · **又大又圆** · 看不见 · 又小又弯
  - Hint: 看第二句。 · Explanation: 月亮又大又圆。
- `zh-m13.q4` v1 (P3, r-explicit, general)
  - Material: 中秋节
  - 孩子们在公园里提着什么玩？
  - Options: **灯笼** · 雨伞 · 气球 · 风筝
  - Hint: 找“孩子们提着”。 · Explanation: 孩子们提着灯笼玩。
- `zh-m14.q1` v1 (P3, r-explicit, general)
  - Material: 学飞的小鸟
  - 小鸟第一次学什么？
  - Options: 学游泳 · 学找虫子 · **学飞** · 学唱歌
  - Hint: 看第一句。 · Explanation: 小鸟第一次学飞。
- `zh-m15.q2` v1 (P3, r-character, general)
  - Material: 去动物园
  - 第2空选哪个字？
  - Options: 跑 · **喷** · 唱 · 睡
  - Hint: 大象用鼻子把水怎样？ · Explanation: 大象用鼻子“喷水”。
- `zh-m17.q2` v1 (P3, r-explicit-practical, general)
  - Material: 图书馆借书须知
  - 借书可以借多久？
  - Options: **两个星期** · 三天 · 一个星期 · 一个月
  - Hint: 看第2条。 · Explanation: 借书期限为两个星期。
- `zh-m17.q3` v1 (P3, r-explicit-practical, general)
  - Material: 图书馆借书须知
  - 下面哪种做法是不对的？
  - Options: 星期一来借书 · 按时还书 · **在书上画画** · 爱护图书
  - Hint: 看第3条。 · Explanation: 须知说不要在书上画画。
- `zh-m17.q4` v1 (P3, r-explicit-practical, general)
  - Material: 图书馆借书须知
  - 星期六可以去图书馆借书吗？
  - Options: 可以 · 只能上午去 · 只能下午去 · **不可以**
  - Hint: 看开放时间。 · Explanation: 图书馆只在星期一至星期五开放。
- `zh-p2-charctx-repair.q3` v1 (P2, r-character, generic)
  - 妈妈给我买了一个新书（　）。
  - Options: **包** · 抱 · 跑 · 饱
  - Hint: 上学时用来装书的东西叫什么？ · Explanation: 装书的是“书包”。
- `zh-p3-read-repair.q2` v1 (P3, r-explicit, similar)
  - 读一读：这次远足，我们沿着河边走了两个小时。路上，老师教我们认识了三种不同的鸟，还提醒大家不要乱丢垃圾。 / 老师提醒大家什么？
  - Options: 不要大声说话 · 要走快一点 · **不要乱丢垃圾** · 要多喝水
  - Hint: 找一找“提醒”后面的话。 · Explanation: 短文写明老师提醒大家不要乱丢垃圾。
- `zh-p3-charctx-repair.q1` v1 (P3, r-character, exact)
  - 他做事很认真，从来不（　）虎。
  - Options: **马** · 妈 · 吗 · 码
  - Hint: “不认真”可以说成哪个词？ · Explanation: “马虎”是不认真的意思，句子说他从来不马虎。

## Sign-off record

Owner decisions and the batch sign-off are recorded on the tracking PR, then copied into `review_log` in a follow-up commit. This file is not a record of approval.
