(function (root, factory) {
  const course = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = course;
  root.GRAMMAR_ISLAND_COURSE = course;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SOURCE_FORMATS = Object.freeze({
    "w1-a-an": ["第1页：a/an 填空", "第7页：单词分类连线", "第20页：看图引导造句"],
    "w1-plurals": ["第40页：-s/-es 词形转换", "第45页：按词尾分类", "第50页：-y/-ies 词形转换"],
    "w2-pronouns": ["第80页：看人物完成句子", "第90页：We/You 句型对比", "第100页：he/she/it 选择"],
    "w2-possessives": ["第56页：句子改写", "第60页：my/your/his/her/its 填空", "第65页：人物关系双空填词"],
    "w3-be": ["第135页：am/is/are 混合填空", "第140页：主语与be动词配对", "第144页：完整句测验"],
    "w3-demonstratives": ["第177/180页：this/that 看图造句", "第200页：this/that/these/those 两句描述"],
    "w4-have-has": ["第207/210页：have/has 找错并改正", "第215页：have/has 混合填空"],
    "w4-prepositions": ["第305页：看图三选一", "第316/320页：in/on/under 看图填空"],
    "w5-checkpoint": ["综合复用：分类、变形、填空、改写、纠错和位置判断"]
  });

  const VOCABULARY_SUPPORT = Object.freeze({
    "w1-a-an": [
      ["umbrella", "雨伞"], ["rabbit", "兔子"], ["ice cream", "冰淇淋"], ["igloo", "冰屋"], ["octopus", "章鱼"]
    ],
    "w1-plurals": [
      ["dish", "盘子"], ["bus", "公共汽车"], ["puppy", "小狗"], ["story", "故事"], ["box", "盒子"]
    ],
    "w2-pronouns": [
      ["ready", "准备好的"], ["kind", "友善的"], ["swim", "游泳"], ["sing", "唱歌"]
    ],
    "w2-possessives": [
      ["kite", "风筝"], ["tail", "尾巴"], ["robot", "机器人"], ["cap", "帽子"]
    ],
    "w3-be": [
      ["ready", "准备好的"], ["classmate", "同学"], ["restaurant", "餐厅"], ["naughty", "淘气的"]
    ],
    "w3-demonstratives": [
      ["piano", "钢琴"], ["bottle", "瓶子"], ["sofa", "沙发"], ["printer", "打印机"], ["fire truck", "消防车"]
    ],
    "w4-have-has": [
      ["bike", "自行车"], ["tail", "尾巴"], ["ruler", "尺子"], ["doghouse", "狗窝"], ["jacket", "夹克" ]
    ],
    "w4-prepositions": [
      ["eraser", "橡皮"], ["cup", "杯子"], ["chair", "椅子"], ["bed", "床"], ["hamster", "仓鼠"], ["basket", "篮子"]
    ],
    "w5-checkpoint": [
      ["umbrella", "雨伞"], ["puppy", "小狗"], ["kite", "风筝"], ["tail", "尾巴"], ["chair", "椅子"]
    ]
  });

  const microLesson = (id, title, durationSeconds, exampleWords, scenes, extraExamples = []) => ({
    title,
    durationLabel: `约 ${Math.round(durationSeconds)} 秒`,
    durationSeconds,
    audio: `./grammar-media/${id}-narration.mp3?v=20260817-3`,
    exampleWords,
    scenes,
    extraExamples
  });

  const MICRO_LESSONS = Object.freeze({
    "w1-a-an": microLesson("w1-a-an", "先听声音，再选 a 或 an", 57.3, ["moon", "zebra", "owl", "elephant", "astronaut"], [
      { at: 0, kind: "cards", eyebrow: "一个东西，需要小帮手", caption: "a 和 an 都放在一个可数名词前。", cards: [["🧩", "a / an", "一个东西的小帮手", "先听开头的声音"]], narration: "英语里说一个东西，名词前常常需要一个小帮手，a 或 an。先别急着只看字母，要先听单词开头的声音。" },
      { at: 11.6, kind: "cards", eyebrow: "辅音音素开头：用 a", caption: "听到 /m/、/z/ 这样的开头音，通常用 a。", cards: [["🌙", "a", "a moon", "开头音 /m/"], ["🦓", "a", "a zebra", "开头音 /z/"]], narration: "如果开头是辅音音素，通常用 a。a moon。a zebra。听到的是 m 和 z 这样的辅音开头。" },
      { at: 22.5, kind: "cards", eyebrow: "元音音素开头：用 an", caption: "听到元音开头，为了读得顺，通常用 an。", cards: [["🦉", "an", "an owl", "元音开头"], ["🐘", "an", "an elephant", "元音开头"]], narration: "如果开头是元音音素，通常用 an。an owl。an elephant。多出来的 n，会让两个词连接得更顺。" },
      { at: 33.4, kind: "cards", eyebrow: "把词组读出来再判断", caption: "astronaut 开头是元音音素，所以选择 an。", cards: [["👂", "先听", "astronaut", "开头是元音音素"], ["🚀", "再选", "an astronaut", "读起来更顺"]], narration: "判断时，把后面的单词读出来。astronaut 开头是元音音素，所以不是 a astronaut，而是 an astronaut。" },
      { at: 44.5, kind: "cards", eyebrow: "最后快速过一遍", caption: "不是只看首字母，而是听单词开头的声音。", cards: [["🌙", "a", "a moon", "辅音开头"], ["🦉", "an", "an owl", "元音开头"]], narration: "最后快速过一遍。a moon，a zebra；an owl，an elephant。记住，要听开头的声音。现在换一批新单词试试看。" }
    ]),
    "w1-plurals": microLesson("w1-plurals", "一个变多个，词尾会变身", 85.4, ["star", "pen", "fox", "brush", "watch", "candy", "key", "robot", "peach", "monkey"], [
      { at: 0, kind: "quantity", eyebrow: "先看数量", caption: "一个用单数；两个或更多，名词通常要变成复数。", singular: { icon: "⭐", text: "one star" }, plural: { icons: "⭐⭐⭐", text: "three stars" }, narration: "先看数量。这里有一颗星星，英语说 one star。现在变成三颗，变成 three stars。一个用单数，两个或更多，名词通常要变成复数。" },
      { at: 15.2, kind: "suffix", eyebrow: "最常见：加 -s", caption: "多数单词直接在词尾加 -s。", examples: [["star", "stars", "⭐"], ["pen", "pens", "🖊️"]], narration: "最常见的办法，是在单词后面加字母 S。one star, three stars。one pen, two pens。看见两个或更多，先想一想，词尾是不是要多一个 S。" },
      { at: 30.9, kind: "suffix", eyebrow: "这些词尾：加 -es", caption: "以 s、x、sh、ch 结尾，通常加 -es。", endings: ["s", "x", "sh", "ch"], examples: [["fox", "foxes", "🦊"], ["brush", "brushes", "🖌️"], ["watch", "watches", "⌚"]], narration: "有些词尾发音挤在一起，只加 S 不好读。以字母 S、X，或者字母组合 S H、C H 结尾，通常加 E S。one fox, two foxes。one brush, three brushes。one watch, two watches。" },
      { at: 51.4, kind: "y-rule", eyebrow: "辅音字母 + y：变成 -ies", caption: "candy 变 candies；但 key 只需要直接加 -s。", change: ["candy", "candies", "🍬"], contrast: ["key", "keys", "🔑"], narration: "如果单词是辅音字母加 Y 结尾，通常把 Y 变成 I，再加 E S。one candy, two candies。可是元音字母加 Y，不用换 Y。one key, two keys。" },
      { at: 67, kind: "recap", eyebrow: "最后快速过一遍", caption: "先看数量，再看词尾；接下来换一批新单词练习。", examples: [["four stars", "⭐⭐⭐⭐"], ["two foxes", "🦊🦊"], ["three candies", "🍬🍬🍬"]], narration: "最后挑战一下。四颗星，是 four stars。两只狐狸，是 two foxes。三块糖，是 three candies。记住：先看数量，再看词尾。现在轮到你用新的单词练习了。" }
    ], [
      { icon: "🤖🤖", title: "两个机器人", steps: ["先看数量：two", "robot 是普通词尾：加 -s"], answer: "two robots" },
      { icon: "🍑🍑🍑", title: "三颗桃子", steps: ["先看数量：three", "peach 以 ch 结尾：加 -es"], answer: "three peaches" },
      { icon: "🐒🐒", title: "容易弄错", steps: ["monkey 的 y 前面是元音 e", "保留 y，直接加 -s"], answer: "two monkeys ✓" }
    ]),
    "w2-pronouns": microLesson("w2-pronouns", "名字太长，代词来接棒", 64.4, ["leo", "nina", "turtle", "parrots", "coach"], [
      { at: 0, kind: "cards", eyebrow: "说自己和对方", caption: "I 指自己；you 指正在说话的对方。", cards: [["🙋", "I", "I am here.", "我"], ["👉", "you", "You are here.", "你／你们"]], narration: "代词可以代替名字，让句子更短。说自己时用 I。对正在说话的人，用 you。I am here。You are here。" },
      { at: 12.5, kind: "cards", eyebrow: "一个男孩或一个女孩", caption: "he 指男性，she 指女性。", cards: [["👦", "he", "Leo is kind. He smiles.", "男孩或男人"], ["👧", "she", "Nina runs. She is fast.", "女孩或女人"]], narration: "说一个男孩或男人，用 he。Leo is kind。He smiles。说一个女孩或女人，用 she。Nina runs。She is fast。" },
      { at: 26, kind: "cards", eyebrow: "一个动物或物品", caption: "不知道或不强调性别时，一个动物、物品常用 it。", cards: [["🐢", "it", "The turtle is slow. It rests.", "一个动物"], ["⏰", "it", "It is loud.", "一个物品"]], narration: "说一个动物或物品，常常用 it。The turtle is slow。It rests。一个闹钟也可以说，It is loud。" },
      { at: 36.9, kind: "cards", eyebrow: "两个或更多", caption: "they 指多个对象；we 包括说话的自己。", cards: [["🦜🦜", "they", "They can fly.", "多个对象"], ["🧑‍🤝‍🧑", "we", "We are a team.", "包括自己"]], narration: "说两个或更多的人、动物或物品，用 they。The parrots can fly。They can fly。如果一群人里包括自己，就用 we。We are a team。" },
      { at: 51, kind: "cards", eyebrow: "先找对象，再换代词", caption: "看清楚是谁、几个、包不包括自己。", cards: [["👦", "Leo", "he", "一个男孩"], ["🐢", "turtle", "it", "一个动物"], ["🦜🦜", "parrots", "they", "多个对象"]], narration: "最后记住，先找句子说的是谁，再看有几个。Leo 换成 he，turtle 换成 it，parrots 换成 they。现在轮到你判断。" }
    ]),
    "w2-possessives": microLesson("w2-possessives", "东西到底是谁的", 66.7, ["coat", "scarf", "camera", "nest", "helmet", "noah", "lily"], [
      { at: 0, kind: "cards", eyebrow: "我的和你的", caption: "my 是我的，your 是你的或你们的。", cards: [["🧥", "my", "my coat", "我的"], ["🧣", "your", "your scarf", "你的／你们的"]], narration: "这些词告诉我们，东西属于谁。说我的，用 my，my coat。对别人说你的，用 your，your scarf。" },
      { at: 10.7, kind: "cards", eyebrow: "他的和她的", caption: "his 跟男性主人，her 跟女性主人。", cards: [["👦📷", "his", "Noah's camera → his camera", "他的"], ["👧⛑️", "her", "Lily's helmet → her helmet", "她的"]], narration: "东西属于一个男孩或男人，用 his。Noah's camera，可以换成 his camera。属于一个女孩或女人，用 her。Lily's helmet，可以换成 her helmet。" },
      { at: 25.8, kind: "cards", eyebrow: "动物或物品自己的", caption: "its 表示“它的”，中间没有撇号。", cards: [["🐦🪹", "its", "its nest", "它的"], ["🤖🔋", "its", "its battery", "它的"]], narration: "动物或物品自己的东西，常用 its。小鸟的巢，可以说 its nest。机器人的电池，可以说 its battery。注意，its 中间没有撇号。" },
      { at: 40.5, kind: "cards", eyebrow: "后面通常要跟名词", caption: "不能只说 my、your；要说清楚是什么东西。", cards: [["✅", "my coat", "完整", "所有词 + 名词"], ["✅", "her helmet", "完整", "所有词 + 名词"]], narration: "my、your、his、her、its 后面通常要跟一个名词。不是只说 my，而是 my coat。不是只说 her，而是 her helmet。" },
      { at: 53.3, kind: "cards", eyebrow: "先找主人，再选词", caption: "判断主人是我、你、他、她，还是它。", cards: [["🙋", "I", "my coat", "我"], ["👦", "Noah", "his camera", "他"], ["🐦", "bird", "its nest", "它"]], narration: "最后先找主人。主人是我，用 my；是 Noah，用 his；是一只小鸟，用 its。找清楚属于谁，再换一批新东西练习。" }
    ]),
    "w3-be": microLesson("w3-be", "主语带着 be 动词找朋友", 59.5, ["hungry", "nora", "teacher", "sky", "cloudy", "park"], [
      { at: 0, kind: "cards", eyebrow: "I 只和 am 配对", caption: "看到 I，优先想到 am。", cards: [["🙋", "I + am", "I am hungry.", "固定搭档"]], narration: "am、is、are 都是 be 动词，但它们有不同的搭档。看到 I，就用 am。I am hungry。" },
      { at: 10.2, kind: "cards", eyebrow: "一个人或一个东西：is", caption: "he、she、it 和单数名字通常用 is。", cards: [["👩‍🏫", "Nora + is", "Nora is a teacher.", "一个人"], ["☁️", "sky + is", "The sky is cloudy.", "一个东西"]], narration: "说一个人或一个东西，通常用 is。Nora is a teacher。The sky is cloudy。he、she、it，也都和 is 配对。" },
      { at: 22.5, kind: "cards", eyebrow: "you 和多个对象：are", caption: "you、we、they 和复数名词通常用 are。", cards: [["👉", "you + are", "You are clever.", "你／你们"], ["🧑‍🤝‍🧑", "we + are", "We are at the park.", "包括自己"], ["👥", "they + are", "They are here.", "多个对象"]], narration: "看到 you、we、they，通常用 are。You are clever。We are at the park。They are here。复数名词也用 are。" },
      { at: 34.7, kind: "cards", eyebrow: "先圈主语", caption: "不要只看后面的形容词，先找句子在说谁。", cards: [["①", "找主语", "Nora", "一个人"], ["②", "选搭档", "is", "Nora is ..."]], narration: "做题时，先圈出主语，再选 be 动词。看到 Nora，是一个人，所以选 is。不要只盯着后面的词。" },
      { at: 45.8, kind: "cards", eyebrow: "三组搭档", caption: "I—am；单数—is；you 和复数—are。", cards: [["🙋", "I", "am", ""], ["1️⃣", "单数", "is", ""], ["👥", "you／复数", "are", ""]], narration: "最后记住三组搭档。I am。一个人或东西用 is。you、we、they 和多个对象用 are。现在开始换句子练习。" }
    ]),
    "w3-demonstratives": microLesson("w3-demonstratives", "远近和数量一起看", 61.3, ["cookie", "tower", "grapes", "mountains", "drums"], [
      { at: 0, kind: "cards", eyebrow: "近处一个：this", caption: "离自己近，而且只有一个，用 this。", cards: [["🍪", "this", "this cookie", "近处 · 一个"]], narration: "选择指示词，要同时看远近和数量。离自己近，而且只有一个，用 this。this cookie。如果它跑到远处，就不能再用 this。" },
      { at: 14.1, kind: "cards", eyebrow: "远处一个：that", caption: "离自己远，而且只有一个，用 that。", cards: [["🗼", "that", "that tower", "远处 · 一个"]], narration: "离自己远，而且只有一个，用 that。看远处的塔，可以说 that tower。" },
      { at: 22, kind: "cards", eyebrow: "近处多个：these", caption: "离自己近，而且有两个或更多，用 these。", cards: [["🍇🍇🍇", "these", "these grapes", "近处 · 多个"]], narration: "离自己近，而且有两个或更多，用 these。手边的几串葡萄，可以说 these grapes。these 后面的名词要用复数。" },
      { at: 34.3, kind: "cards", eyebrow: "远处多个：those", caption: "离自己远，而且有两个或更多，用 those。", cards: [["⛰️⛰️", "those", "those mountains", "远处 · 多个"]], narration: "离自己远，而且有两个或更多，用 those。远处的几座山，可以说 those mountains。those 后面的名词也要用复数。" },
      { at: 46.5, kind: "cards", eyebrow: "两步判断", caption: "先看一个还是多个，再看近处还是远处。", cards: [["🥁", "this drum", "近处一个", "this"], ["🥁🥁", "those drums", "远处多个", "those"]], narration: "最后分两步。先看一个还是多个，再看近处还是远处。近处一个鼓，用 this drum；远处多个鼓，用 those drums。现在轮到你判断。" }
    ]),
    "w4-have-has": microLesson("w4-have-has", "谁拥有，决定 have 还是 has", 56.7, ["sandwich", "crayons", "wings", "helmet", "camera", "noah"], [
      { at: 0, kind: "cards", eyebrow: "I 和 you：用 have", caption: "I have；you have。", cards: [["🥪", "I have", "I have a sandwich.", "我有"], ["🖍️", "You have", "You have crayons.", "你有"]], narration: "have 和 has 都表示有。先看是谁拥有东西。主语是 I 或 you，用 have。I have a sandwich。You have crayons。" },
      { at: 12.7, kind: "cards", eyebrow: "we 和 they：也用 have", caption: "包括自己或多个对象，通常用 have。", cards: [["🧑‍🤝‍🧑", "We have", "We have a camera.", "我们有"], ["🦋🦋", "They have", "They have wings.", "它们有"]], narration: "主语是 we 或 they，也用 have。We have a camera。They have wings。" },
      { at: 20, kind: "cards", eyebrow: "he、she、it：用 has", caption: "第三人称单数通常和 has 配对。", cards: [["👦", "He has", "He has a helmet.", "他有"], ["🦋", "It has", "It has wings.", "它有"]], narration: "主语是 he、she、it，通常用 has。He has a helmet。It has wings。这里的 has 词尾有一个 S。" },
      { at: 31.6, kind: "cards", eyebrow: "一个名字也用 has", caption: "Noah 是一个人，所以和 has 配对。", cards: [["👦📷", "Noah has", "Noah has a camera.", "一个人名"]], narration: "一个人的名字，也是第三人称单数。Noah has a camera。看到 Noah，不要被名字挡住，它和 he 一样用 has。" },
      { at: 43.2, kind: "cards", eyebrow: "先找主语", caption: "I、you、we、they—have；he、she、it 和单数—has。", cards: [["👥", "I／you／we／they", "have", ""], ["1️⃣", "he／she／it／单数", "has", ""]], narration: "最后先找主语。I、you、we、they 用 have。he、she、it 和一个人或东西用 has。现在去找句子里的主人。" }
    ]),
    "w4-prepositions": microLesson("w4-prepositions", "东西藏在哪里", 58.9, ["coin", "pocket", "lamp", "shelf", "mouse", "bridge"], [
      { at: 0, kind: "cards", eyebrow: "在里面：in", caption: "一个东西被空间包住，用 in。", cards: [["🪙", "in", "The coin is in the pocket.", "在里面"]], narration: "位置词告诉我们东西在哪里。一个东西被空间包在里面，用 in。想象口袋从四周包住硬币。The coin is in the pocket。" },
      { at: 13.2, kind: "cards", eyebrow: "在表面上：on", caption: "一个东西接触另一个东西的上表面，用 on。", cards: [["💡", "on", "The lamp is on the shelf.", "在上面"]], narration: "一个东西接触另一个东西的上表面，用 on。灯和架子的表面接触。The lamp is on the shelf。" },
      { at: 23.4, kind: "cards", eyebrow: "在下方：under", caption: "一个东西位于另一个东西下方，用 under。", cards: [["🐭", "under", "The mouse is under the bridge.", "在下面"]], narration: "一个东西位于另一个东西下方，用 under。小老鼠没有被桥包住，只是在桥的下方。The mouse is under the bridge。" },
      { at: 34.9, kind: "cards", eyebrow: "看关系，不只看高低", caption: "接触上表面才用 on；被包在空间里才用 in。", cards: [["🪙👖", "in", "被口袋包住", "coin in pocket"], ["💡▰", "on", "接触架子表面", "lamp on shelf"]], narration: "判断时要看两个东西的关系。被口袋包住，是 in。接触架子的上表面，是 on。只看高低还不够。" },
      { at: 46.6, kind: "cards", eyebrow: "三个位置", caption: "in 在里面；on 在上面；under 在下面。", cards: [["📥", "in", "里面", ""], ["🔝", "on", "上面", ""], ["⬇️", "under", "下面", ""]], narration: "最后记住三个位置。in，在里面；on，在上面；under，在下面。接下来换成生活里的新物品来判断。" }
    ]),
    "w5-checkpoint": microLesson("w5-checkpoint", "五步找线索，完成综合判断", 66, ["moon", "stars", "leo", "scarf", "parrots", "crayons", "coin", "pocket"], [
      { at: 0, kind: "cards", eyebrow: "第一步：听声音、看数量", caption: "a/an 看开头音；单复数先看数量。", cards: [["🌙", "a moon", "辅音开头", "a"], ["⭐⭐⭐", "three stars", "多个", "-s"]], narration: "综合题不要着急。第一步，听开头声音、看数量。moon 是辅音开头，用 a moon。三颗星是多个，用 three stars。" },
      { at: 13.2, kind: "cards", eyebrow: "第二步：找对象和 be 动词", caption: "先用代词替换，再选择 am、is、are。", cards: [["👦", "Leo → he", "He is here.", "一个男孩"], ["🦜🦜", "parrots → they", "They are here.", "多个对象"]], narration: "第二步，找句子说的是谁。Leo 可以换成 he，所以说 He is here。parrots 是多个，可以换成 they，所以说 They are here。" },
      { at: 25.7, kind: "cards", eyebrow: "第三步：东西属于谁", caption: "先找主人，再选 my、your、his、her、its。", cards: [["👦🧣", "Leo's scarf", "his scarf", "他的"], ["🙋🧣", "my scarf", "我的", "my"]], narration: "第三步，找东西属于谁。Leo 的围巾，可以说 his scarf。自己的围巾，可以说 my scarf。" },
      { at: 36.2, kind: "cards", eyebrow: "第四步：远近、数量和拥有", caption: "指示词看远近数量；have/has 看主语。", cards: [["🖍️🖍️", "these crayons", "近处多个", "these"], ["👦🖍️", "Leo has crayons.", "一个人", "has"]], narration: "第四步，看远近和数量，再看主语。近处多支蜡笔，用 these crayons。Leo 是一个人，所以说 Leo has crayons。" },
      { at: 48.7, kind: "cards", eyebrow: "第五步：看位置关系", caption: "圈出主语、数量、远近、主人或位置，再做选择。", cards: [["🪙👖", "in", "The coin is in the pocket.", "在里面"], ["✅", "一次找一个线索", "再完整读一遍", "检查"]], narration: "第五步，看位置关系。The coin is in the pocket。做综合题时，一次只找一个线索：主语、数量、远近、主人或位置。选好以后，再把完整句子读一遍。" }
    ])
  });

  const grammarAudioSlug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const lesson = (id, week, session, title, focus, sourcePages, printPages, explanation, oralPrompts, checks) => ({
    id, week, session, title, focus, sourcePages, printPages,
    sourceFormats: SOURCE_FORMATS[id] || [],
    vocabularySupport: (VOCABULARY_SUPPORT[id] || []).map(([word, zh]) => ({
      word, zh, audio: `./grammar-media/english/vocab-${grammarAudioSlug(word)}.mp3?v=20260817-1`
    })),
    microLesson: MICRO_LESSONS[id] || null,
    explanation,
    oralPrompts: oralPrompts.map((prompt, index) => ({
      ...prompt,
      audio: `./grammar-media/english/model-${id}-${index + 1}.mp3?v=20260817-1`
    })),
    checks
  });

  return Object.freeze({
    version: 1,
    title: "语法小岛 · 蓝书基础",
    rhythm: "每周学习日由家长自由选择 · 每次约 15–22 分钟",
    note: "独立长期课程，不计入今日任务、连续天数、地图或四周英语岛进度；每课首次完成奖励 10 阳光。",
    policy: {
      source: "Common English Grammar blue workbook selected pages",
      exerciseDesign: "Adapt the workbook's classify, transform, fill-in, rewrite, error-correction, and picture-position formats for oral-first online practice.",
      vocabulary: "Use familiar course words for explaining the grammar; allow limited concrete workbook words as supported vocabulary expansion, but never score an unknown noun as a grammar error.",
      paperRole: "After each online lesson, schedule three selected workbook pages on the next available paper-practice day."
    },
    lessons: [
      lesson("w1-a-an", 1, 1, "a / an", "听首音，选择 a 或 an", "蓝书 1–20", [1, 7, 20], [
        "a 放在辅音音素开头的单数名词前：a cat。",
        "an 放在元音音素开头的单数名词前：an apple。",
        "先听单词开头的声音，不只是看第一个字母。"
      ], [
        { skill: "an · 元音开头", cue: "补完整并说出来：___ umbrella", answer: "an umbrella", scaffold: "an + umbrella" },
        { skill: "a · 辅音开头", cue: "补完整并说出来：___ rabbit", answer: "a rabbit", scaffold: "a + rabbit" },
        { skill: "an · 完整句", cue: "补完整：I see ___ ice cream.", answer: "I see an ice cream.", scaffold: "I see an ___." },
        { skill: "a · 完整句", cue: "补完整：This is ___ red pen.", answer: "This is a red pen.", scaffold: "This is a ___ pen." },
        { skill: "an · 换词运用", cue: "用 orange 说：我有一个橙子。", answer: "I have an orange.", scaffold: "I have an ___." },
        { skill: "a / an · 对比", cue: "连续说两个词组：一只狗、一个鸡蛋。", answer: "a dog, an egg", scaffold: "a ___, an ___" }
      ], [
        { prompt: "___ orange", choices: ["a", "an"], answer: "an" },
        { prompt: "___ dog", choices: ["a", "an"], answer: "a" },
        { prompt: "I see ___ egg.", choices: ["a", "an"], answer: "an" },
        { prompt: "This is ___ kite.", choices: ["a", "an"], answer: "a" },
        { prompt: "She has ___ umbrella.", choices: ["a", "an"], answer: "an" },
        { prompt: "It is ___ red apple.", choices: ["a", "an"], answer: "a" }
      ]),
      lesson("w1-plurals", 1, 2, "一个与多个", "比较单数、复数和数量词", "蓝书 21–54", [40, 45, 50], [
        "一个用单数：one book；两个或更多通常用复数：two books。",
        "多数单词加 -s；以 s、x、sh、ch 结尾常加 -es。",
        "辅音字母加 y 结尾，通常把 y 变成 i 再加 -es：baby → babies。"
      ], [
        { skill: "规则复数 · -s", cue: "说：我有一本书。", answer: "I have one book.", scaffold: "I have one ___." },
        { skill: "规则复数 · -s", cue: "把数量换成 two：I have one book.", answer: "I have two books.", scaffold: "I have two book___." },
        { skill: "词尾变化 · -es", cue: "把 one box 变成 two...", answer: "two boxes", scaffold: "two box + es" },
        { skill: "词尾变化 · -es", cue: "把 one dish 变成 three...", answer: "three dishes", scaffold: "three dish + es" },
        { skill: "辅音字母+y · -ies", cue: "把 one baby 变成 three...", answer: "three babies", scaffold: "baby → bab + ies" },
        { skill: "元音字母+y · 直接加-s", cue: "把 one toy 变成 four...", answer: "four toys", scaffold: "four toy + s" },
        { skill: "规则复数 · -s", cue: "把 one cat 变成 five...", answer: "five cats", scaffold: "five cat + s" },
        { skill: "词尾变化 · -es", cue: "把 one bus 变成 two...", answer: "two buses", scaffold: "two bus + es" },
        { skill: "辅音字母+y · -ies", cue: "把 one puppy 变成 two...", answer: "two puppies", scaffold: "puppy → pupp + ies" },
        { skill: "辅音字母+y · -ies", cue: "把 one story 变成 three...", answer: "three stories", scaffold: "story → stor + ies" }
      ], [
        { prompt: "two ___", choices: ["cat", "cats", "cates"], answer: "cats" },
        { prompt: "three ___", choices: ["boxs", "boxes", "box"], answer: "boxes" },
        { prompt: "two ___", choices: ["babys", "babies", "baby"], answer: "babies" },
        { prompt: "哪一组变复数时都要加 -es？", choices: ["bus, dish", "cat, toy", "baby, story"], answer: "bus, dish" },
        { prompt: "three ___", choices: ["toys", "toies", "toy"], answer: "toys" },
        { prompt: "one ___", choices: ["books", "book", "bookes"], answer: "book" }
      ]),
      lesson("w2-pronouns", 2, 1, "I / you / he / she / it / they", "用代词替换人和物", "蓝书 75–129", [80, 90, 100], [
        "I 是我，you 是你或你们。",
        "he 指男孩或男人，she 指女孩或女人，it 指一个动物或物品。",
        "they 指两个或更多的人、动物或物品。"
      ], [
        { skill: "I · 说自己", cue: "说：我七岁。", answer: "I am seven.", scaffold: "I am ___." },
        { skill: "you · 对别人说", cue: "对家长说：你很开心。", answer: "You are happy.", scaffold: "You are ___." },
        { skill: "he · 男孩", cue: "Tom 会游泳，用 he 换掉 Tom。", answer: "He can swim.", scaffold: "He can ___." },
        { skill: "she · 女孩", cue: "Amy 在读书，用 she 换掉 Amy。", answer: "She is reading.", scaffold: "She is ___." },
        { skill: "it · 一个物品", cue: "这个球是红色的，用 it 开头。", answer: "It is red.", scaffold: "It is ___." },
        { skill: "they · 多个对象", cue: "两只猫很小，用 they 开头。", answer: "They are small.", scaffold: "They are ___." },
        { skill: "I / you · 对话", cue: "先说“我准备好了”，再对家长说“你准备好了”。", answer: "I am ready. You are ready.", scaffold: "I am ___. You are ___." },
        { skill: "we · 包括自己", cue: "你和哥哥都会读书，用 we 开头。", answer: "We can read.", scaffold: "We can ___." },
        { skill: "they · 多个对象", cue: "Amy 和 Ben 很开心，用 they 开头。", answer: "They are happy.", scaffold: "They are ___." }
      ], [
        { prompt: "Tom is a boy. ___ is six.", choices: ["He", "She", "It"], answer: "He" },
        { prompt: "The ball is red. ___ is new.", choices: ["He", "It", "They"], answer: "It" },
        { prompt: "Amy and Ben are here. ___ are ready.", choices: ["We", "They", "She"], answer: "They" },
        { prompt: "Amy is my sister. ___ can sing.", choices: ["He", "She", "They"], answer: "She" },
        { prompt: "Ben and I are friends. ___ can play.", choices: ["We", "It", "He"], answer: "We" },
        { prompt: "I am talking to Ben: ‘___ are kind.’", choices: ["You", "I", "It"], answer: "You" }
      ]),
      lesson("w2-possessives", 2, 2, "my / your / his / her / its", "说清楚东西属于谁", "蓝书 55–74", [56, 60, 65], [
        "my 是我的，your 是你的或你们的。",
        "his 是他的，her 是她的，its 是它的。",
        "这些词后面通常要跟名词：my book、her bag。"
      ], [
        { skill: "my · 我的", cue: "拿起自己的铅笔，说：这是我的铅笔。", answer: "This is my pencil.", scaffold: "This is my ___." },
        { skill: "your · 你的", cue: "把书递给对方，说：这是你的书。", answer: "This is your book.", scaffold: "This is your ___." },
        { skill: "his · 他的", cue: "Ben 有一个球，说：这是他的球。", answer: "This is his ball.", scaffold: "This is his ___." },
        { skill: "her · 她的", cue: "Amy 有一个包，说：那是她的包。", answer: "That is her bag.", scaffold: "That is her ___." },
        { skill: "its · 它的", cue: "小狗有一条长尾巴，说：它的尾巴很长。", answer: "Its tail is long.", scaffold: "Its ___ is long." },
        { skill: "综合转换", cue: "先说“我的风筝”，再换成“她的风筝”。", answer: "my kite, her kite", scaffold: "my ___, her ___" },
        { skill: "its · 动物", cue: "小猫有一张床，说：这是它的床。", answer: "This is its bed.", scaffold: "This is its ___." },
        { skill: "its · 物品", cue: "这个机器人有一个名字，说：它的名字是 Max。", answer: "Its name is Max.", scaffold: "Its name is ___." },
        { skill: "his / her · 对比", cue: "连续说：他的书、她的书。", answer: "his book, her book", scaffold: "his ___, her ___" }
      ], [
        { prompt: "I have a kite. It is ___ kite.", choices: ["my", "his", "her"], answer: "my" },
        { prompt: "Ben has a dog. It is ___ dog.", choices: ["your", "his", "its"], answer: "his" },
        { prompt: "Amy has a bag. It is ___ bag.", choices: ["her", "my", "his"], answer: "her" },
        { prompt: "You have a red pen. It is ___ pen.", choices: ["your", "its", "my"], answer: "your" },
        { prompt: "The cat has a bed. It is ___ bed.", choices: ["his", "her", "its"], answer: "its" },
        { prompt: "I have a red cap. It is ___ cap.", choices: ["my", "his", "its"], answer: "my" }
      ]),
      lesson("w3-be", 3, 1, "am / is / are", "让主语和 be 动词配对", "蓝书 130–144", [135, 140, 144], [
        "I 和 am 配对：I am ready。",
        "一个人或物和 is 配对：He is six；The cat is small。",
        "you、we、they 和多个事物用 are。"
      ], [
        { skill: "I + am", cue: "说：我很开心。", answer: "I am happy.", scaffold: "I am ___." },
        { skill: "I + am", cue: "说：我是一个学生。", answer: "I am a student.", scaffold: "I am a ___." },
        { skill: "单数 + is", cue: "说：这只猫很小。", answer: "The cat is small.", scaffold: "The cat is ___." },
        { skill: "he / she + is", cue: "说：他七岁。", answer: "He is seven.", scaffold: "He is ___." },
        { skill: "you + are", cue: "对家长说：你准备好了。", answer: "You are ready.", scaffold: "You are ___." },
        { skill: "复数 + are", cue: "说：这些狗很大。", answer: "The dogs are big.", scaffold: "The dogs are ___." },
        { skill: "I + am", cue: "说：我准备好了。", answer: "I am ready.", scaffold: "I am ___." },
        { skill: "she + is", cue: "说：Amy 是我的朋友。", answer: "Amy is my friend.", scaffold: "Amy is my ___." },
        { skill: "they + are", cue: "说：他们在学校。", answer: "They are at school.", scaffold: "They are at ___." }
      ], [
        { prompt: "I ___ ready.", choices: ["am", "is", "are"], answer: "am" },
        { prompt: "The dog ___ small.", choices: ["am", "is", "are"], answer: "is" },
        { prompt: "They ___ happy.", choices: ["am", "is", "are"], answer: "are" },
        { prompt: "You ___ my friend.", choices: ["am", "is", "are"], answer: "are" },
        { prompt: "Amy ___ seven.", choices: ["am", "is", "are"], answer: "is" },
        { prompt: "The books ___ new.", choices: ["am", "is", "are"], answer: "are" }
      ]),
      lesson("w3-demonstratives", 3, 2, "this / that / these / those", "同时判断远近和单复数", "蓝书 170–204", [177, 180, 200], [
        "近处一个用 this，远处一个用 that。",
        "近处多个用 these，远处多个用 those。",
        "this/that 后接单数；these/those 后接复数。"
      ], [
        { skill: "this · 近处一个", cue: "拿起手边一支铅笔，说：这是我的铅笔。", answer: "This is my pencil.", scaffold: "This is my ___." },
        { skill: "this · 近处一个", cue: "指手边一个苹果，说：这个苹果是红色的。", answer: "This apple is red.", scaffold: "This ___ is red." },
        { skill: "that · 远处一个", cue: "指远处一把椅子，说：那是一把椅子。", answer: "That is a chair.", scaffold: "That is a ___." },
        { skill: "these · 近处多个", cue: "指手边两支笔，说：这些是钢笔。", answer: "These are pens.", scaffold: "These are ___." },
        { skill: "those · 远处多个", cue: "指远处的书，说：那些是书。", answer: "Those are books.", scaffold: "Those are ___." },
        { skill: "远近对比", cue: "先说手边这只猫，再说远处那些狗。", answer: "This is a cat. Those are dogs.", scaffold: "This is a ___. Those are ___." },
        { skill: "that · 远处一个", cue: "指远处一个风筝，说：那个风筝是蓝色的。", answer: "That kite is blue.", scaffold: "That ___ is blue." },
        { skill: "these · 近处多个", cue: "指手边的苹果，说：这些苹果是红色的。", answer: "These apples are red.", scaffold: "These ___ are red." },
        { skill: "近远对比", cue: "连续说：这些书、那些书。", answer: "these books, those books", scaffold: "these ___, those ___" }
      ], [
        { prompt: "___ is my pencil here.", choices: ["This", "These", "Those"], answer: "This" },
        { prompt: "___ are the birds over there.", choices: ["That", "These", "Those"], answer: "Those" },
        { prompt: "___ are my shoes here.", choices: ["This", "These", "That"], answer: "These" },
        { prompt: "___ is the bus over there.", choices: ["That", "These", "Those"], answer: "That" },
        { prompt: "___ book here is new.", choices: ["This", "Those", "These"], answer: "This" },
        { prompt: "___ cats over there are small.", choices: ["That", "This", "Those"], answer: "Those" }
      ]),
      lesson("w4-have-has", 4, 1, "have / has", "描述谁拥有什么", "蓝书 205–218", [207, 210, 215], [
        "I、you、we、they 后用 have。",
        "he、she、it 和一个人或物后用 has。",
        "先找主语，再选择 have 或 has。"
      ], [
        { skill: "I + have", cue: "说：我有一支红色铅笔。", answer: "I have a red pencil.", scaffold: "I have a red ___." },
        { skill: "you + have", cue: "对家长说：你有一本书。", answer: "You have a book.", scaffold: "You have a ___." },
        { skill: "we / they + have", cue: "说：他们有两个球。", answer: "They have two balls.", scaffold: "They have two ___." },
        { skill: "he + has", cue: "说：Ben 有一辆自行车。", answer: "Ben has a bike.", scaffold: "Ben has a ___." },
        { skill: "she + has", cue: "说：她有一只小猫。", answer: "She has a small cat.", scaffold: "She has a small ___." },
        { skill: "it + has", cue: "说：这只狗有一条长尾巴。", answer: "The dog has a long tail.", scaffold: "The dog has a long ___." }
      ], [
        { prompt: "He have a bike. 哪里需要改？", choices: ["have → has", "bike → bikes", "不用改"], answer: "have → has" },
        { prompt: "We ___ two books.", choices: ["have", "has"], answer: "have" },
        { prompt: "The cat have a long tail. 哪里需要改？", choices: ["have → has", "tail → tails", "不用改"], answer: "have → has" },
        { prompt: "You ___ a red pen.", choices: ["have", "has"], answer: "have" },
        { prompt: "Amy have a new bag. 哪里需要改？", choices: ["have → has", "bag → bags", "不用改"], answer: "have → has" },
        { prompt: "They ___ three kites.", choices: ["have", "has"], answer: "have" }
      ]),
      lesson("w4-prepositions", 4, 2, "in / on / under", "用位置词说完整句", "蓝书 305–324", [305, 316, 320], [
        "in 是在里面，on 是在上面并接触，under 是在下面。",
        "常用句型：The ___ is in/on/under the ___.",
        "说位置时别漏掉 is 和 the。"
      ], [
        { skill: "in · 在里面", cue: "把橡皮放进盒子，说出它的位置。", answer: "The eraser is in the box.", scaffold: "The eraser is in the ___." },
        { skill: "in · 换情境", cue: "说：鱼在水里。", answer: "The fish is in the water.", scaffold: "The fish is in the ___." },
        { skill: "on · 在上面", cue: "把铅笔放到书上，说出它的位置。", answer: "The pencil is on the book.", scaffold: "The pencil is on the ___." },
        { skill: "on · 换情境", cue: "说：杯子在桌子上。", answer: "The cup is on the table.", scaffold: "The cup is on the ___." },
        { skill: "under · 在下面", cue: "把球放到椅子下面，说出它的位置。", answer: "The ball is under the chair.", scaffold: "The ball is under the ___." },
        { skill: "under · 换情境", cue: "说：鞋子在床下面。", answer: "The shoes are under the bed.", scaffold: "The shoes are under the ___." },
        { skill: "in · 第三次变式", cue: "说：书在书包里。", answer: "The book is in the bag.", scaffold: "The book is in the ___." },
        { skill: "on · 第三次变式", cue: "说：猫在椅子上。", answer: "The cat is on the chair.", scaffold: "The cat is on the ___." },
        { skill: "under · 第三次变式", cue: "说：玩具在桌子下面。", answer: "The toy is under the table.", scaffold: "The toy is under the ___." }
      ], [
        { prompt: "The fish is ___ the water.", choices: ["in", "on", "under"], answer: "in" },
        { prompt: "The book is ___ the table.", choices: ["in", "on", "under"], answer: "on" },
        { prompt: "The shoes are ___ the bed.", choices: ["in", "on", "under"], answer: "under" },
        { prompt: "The apple is ___ the bag.", choices: ["in", "on", "under"], answer: "in" },
        { prompt: "The cat is ___ the chair.", choices: ["in", "on", "under"], answer: "under" },
        { prompt: "The cup is ___ the desk.", choices: ["in", "on", "under"], answer: "on" }
      ]),
      lesson("w5-checkpoint", 5, 1, "基础阶段检测", "混合运用前 8 课，不讲新知识", "蓝书复习选页", [20, 50, 65, 100, 144, 200, 215, 320], [
        "先独立作答，不确定时把句子完整读出来。",
        "检测后按成绩决定：直接过、少量加练或返回口头操练。",
        "本课不追求满分，重点是找到还需要讲解的语法点。"
      ], [
        { skill: "a / an", cue: "用 umbrella 说：我有一把雨伞。", answer: "I have an umbrella.", scaffold: "I have an ___." },
        { skill: "复数", cue: "把 one baby 变成 two...", answer: "two babies", scaffold: "baby → bab + ies" },
        { skill: "代词", cue: "Amy 会唱歌，用 she 换掉 Amy。", answer: "She can sing.", scaffold: "She can ___." },
        { skill: "物主词", cue: "Ben 有一本书，说：这是他的书。", answer: "This is his book.", scaffold: "This is his ___." },
        { skill: "am / is / are", cue: "说：这些猫很小。", answer: "The cats are small.", scaffold: "The cats are ___." },
        { skill: "this / those", cue: "说：这是一个球，那些是风筝。", answer: "This is a ball. Those are kites.", scaffold: "This is a ___. Those are ___." },
        { skill: "have / has", cue: "说：她有一支红色的笔。", answer: "She has a red pen.", scaffold: "She has a red ___." },
        { skill: "位置词", cue: "说：两个球在盒子里。", answer: "The two balls are in the box.", scaffold: "The two balls are in the ___." }
      ], [
        { prompt: "I see ___ elephant.", choices: ["a", "an"], answer: "an" },
        { prompt: "Two ___ are here.", choices: ["baby", "babys", "babies"], answer: "babies" },
        { prompt: "Amy is my sister. ___ has a kite.", choices: ["He", "She", "It"], answer: "She" },
        { prompt: "They ___ two books.", choices: ["have", "has"], answer: "have" },
        { prompt: "___ are my pencils here.", choices: ["This", "These", "That"], answer: "These" },
        { prompt: "The cat is ___ the box.", choices: ["in", "has", "are"], answer: "in" }
      ])
    ]
  });
});
