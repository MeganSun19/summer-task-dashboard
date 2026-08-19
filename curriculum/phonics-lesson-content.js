(function (root) {
  const lessons = [
    { day: 1, mainExamples: ["bat", "jam", "van"], extensionExamples: ["pack", "tack"], narration: ["今天练短元音 a。嘴巴张开，听中间短短的 a：bat，jam，van。", "从左到右读出每个声音，再把它们连起来。", "再看词尾 C K，两个字母一起发 k：pack，tack。看完动画，再用下面的新词挑战自己。"] },
    { day: 2, mainExamples: ["mat", "rat", "lap", "nap"], extensionExamples: ["pick", "lock"], narration: ["今天继续练短元音 a，并比较两个词族。mat、rat 的结尾是 at；lap、nap 的结尾是 ap。", "前面的辅音换了，后面的声音保持住，就能更快拼出来。", "再听 pick 和 lock，短元音后面的 C K 一起发 k。下面的练习会换一组新词。"] },
    { day: 3, mainExamples: ["sit", "lip", "fin"], extensionExamples: ["quiz", "quick"], narration: ["今天练短元音 i。听一听 sit，lip，fin 中间短短的 i。", "先读开头，再接上 i 和最后一个声音。", "字母组合 Q U 常常一起发 kw：quiz，quick。现在把这个规律用到下面的新词里。"] },
    { day: 4, mainExamples: ["bed", "net", "pen"], extensionExamples: ["catch", "hutch"], narration: ["今天练短元音 e。听中间的 e：bed，net，pen。", "可以把词尾当成小积木，再换前面的辅音。", "词尾 T C H 通常一起发 ch：catch，hutch。三个字母只发一个结尾声音。下面换新词试一试。"] },
    { day: 5, mainExamples: ["hot", "pot", "box"], extensionExamples: ["dock", "mock"], narration: ["今天练短元音 o。听 hot，pot，box 中间的 o。", "先把声音分开，再顺滑地连成一个词。", "dock 和 mock 的末尾是 C K，一起发 k。记住规律，再去拼下面没有见过的词。"] },
    { day: 6, mainExamples: ["bus", "mud", "nut"], extensionExamples: ["photo", "dolphin"], narration: ["今天练短元音 u。听 bus，mud，nut 中间短短的 u。", "拼读时先慢慢分音，再一口气合起来。", "字母组合 P H 常常发 f：photo，dolphin。看到 P H，不要读成两个声音。下面用新词练习。"] },
    { day: 7, mainExamples: ["shell", "shed", "brush"], extensionExamples: ["train", "snail"], narration: ["今天认识字母组合 S H。两个字母合在一起，发轻轻的 sh：shell，shed，brush。", "嘴唇微微向前，气流连续出来。", "再看 A I，它常常发长 a：train，snail。记住声音，下面换一组词来拼。"] },
    { day: 8, mainExamples: ["chop", "chest", "lunch"], extensionExamples: ["stay", "tray"], narration: ["今天认识字母组合 C H。它发清楚的 ch：chop，chest，lunch。", "声音短而有力，不要读成 sh。", "词尾 A Y 常常发长 a：stay，tray。现在把两个规律用到下面的新词里。"] },
    { day: 9, mainExamples: ["thumb", "thick", "math"], extensionExamples: ["bee", "feet"], narration: ["今天认识字母组合 T H。舌尖轻轻碰一下上牙，再送气：thumb，thick，math。", "不要把它读成 s 或 f，先看嘴形，再把整个词连起来。", "字母组合 E E 常常发长 e：bee，feet。下面的练习会换词，看看你能不能自己迁移。"] },
    { day: 10, mainExamples: ["what", "wheel", "whale"], extensionExamples: ["sea", "meat"], narration: ["今天比较 W 和 W H。what，wheel，whale 的开头要读清楚，后面的元音也不能丢。", "先看开头组合，再把整个词顺滑地读出来。", "字母组合 E A 常常发长 e：sea，meat。现在去挑战下面的新词。"] },
    {
      day: 11,
      mainExamples: ["song", "wing", "bank", "sink"],
      extensionExamples: ["goat", "road"],
      audioRate: "-13%",
      pauseSeconds: 1.1,
      sceneStarts: [0, 23.2, 47.2],
      animationScenes: [
        { kicker: "先学第一个声音", mark: "ng", title: "词尾 ng", tip: "先听三遍，再放进单词里", words: ["song", "wing"] },
        { kicker: "再学第二个声音", mark: "nk", title: "词尾 nk", tip: "结尾还能听见一个 k", words: ["bank", "sink"] },
        { kicker: "最后学一个新组合", mark: "oa", title: "oa 常常发长 o", tip: "一个组合学稳，再学下一个", words: ["goat", "road"] }
      ],
      audioSegments: [
        [
          { language: "zh", text: "先只听词尾的这个声音。" },
          { language: "phoneme", asset: "phonics-media/phonemes/ng.mp3" },
          { language: "phoneme", asset: "phonics-media/phonemes/ng.mp3" },
          { language: "phoneme", asset: "phonics-media/phonemes/ng.mp3" },
          { language: "zh", text: "声音从鼻子出来。现在放进单词里，慢慢听。" },
          { language: "en", text: "song. song. song. wing. wing. wing." }
        ],
        [
          { language: "zh", text: "现在只听第二个词尾声音。它的最后还能听见一个 k。" },
          { language: "phoneme", asset: "phonics-media/phonemes/nk.mp3" },
          { language: "phoneme", asset: "phonics-media/phonemes/nk.mp3" },
          { language: "phoneme", asset: "phonics-media/phonemes/nk.mp3" },
          { language: "zh", text: "放进单词里，慢慢听。" },
          { language: "en", text: "bank. bank. bank. sink. sink. sink." }
        ],
        [
          { language: "zh", text: "最后学习新的元音组合。它常常发长 o。" },
          { language: "phoneme", asset: "phonics-media/phonemes/long-o.mp3" },
          { language: "phoneme", asset: "phonics-media/phonemes/long-o.mp3" },
          { language: "phoneme", asset: "phonics-media/phonemes/long-o.mp3" },
          { language: "zh", text: "放进单词里，慢慢听。" },
          { language: "en", text: "goat. goat. goat. road. road. road." },
          { language: "zh", text: "看完动画，再用下面的新词练习。" }
        ]
      ],
      narration: [
        "先只听词尾 N G。ng，ng，ng。声音从鼻子出来。现在放进单词里，慢慢听。song。song。song。再听 wing。wing。wing。",
        "现在只听词尾 N K。nk，nk，nk。它的最后还能听见一个 k。放进单词里，慢慢听。bank。bank。bank。再听 sink。sink。sink。",
        "最后学习字母组合 O A。oa，oa，oa。它常常发长 o。放进单词里，慢慢听。goat。goat。goat。再听 road。road。road。看完动画，再用下面的新词练习。"
      ]
    },
    { day: 12, mainExamples: ["shark", "bench", "three", "long"], extensionExamples: ["flow", "yellow"], narration: ["今天把学过的组合放在一起。shark 是 sh，bench 是 ch，three 是 th，long 是 ng。", "先找两个字母组成的声音，再读完整单词。", "flow 和 yellow 里的 O W 发长 o。动画里的词先收起来，下面用另一组词复习。"] },
    { day: 13, mainExamples: ["stem", "skip", "snap", "slug"], extensionExamples: ["park", "farm"], narration: ["今天练 S 开头的辅音丛。stem，skip，snap，slug 的开头都有两个辅音。", "两个声音都要听见，不能丢掉一个。", "park 和 farm 里的 A R 是一组常见声音。现在把方法用到下面的新词。"] },
    { day: 14, mainExamples: ["clip", "flat", "plug", "glad"], extensionExamples: ["horse", "storm"], narration: ["今天练 L 辅音丛。clip，flat，plug，glad 的开头都有两个辅音。", "先读第一个，再滑到 l，两个声音都保留。", "horse 和 storm 里的 O R 是常见组合。下面换词继续练。"] },
    { day: 15, mainExamples: ["fresh", "drop", "trim", "crack"], extensionExamples: ["term", "verb"], narration: ["今天练 R 辅音丛。fresh，drop，trim，crack 的开头都有 r。", "先听第一个辅音，再接 r 和后面的元音。", "term 和 verb 里的 E R 发卷舌元音。现在去读下面的新词。"] },
    { day: 16, mainExamples: ["tent", "lamp", "sand", "gift"], extensionExamples: ["shirt", "first"], narration: ["今天练词尾辅音丛。tent，lamp，sand，gift 的结尾都有两个辅音。", "读到最后也不能少掉一个声音。", "shirt 和 first 里的 I R 是一组卷舌元音。下面换一组词来检验。"] },
    { day: 17, mainExamples: ["smog", "crust", "bend", "pond"], extensionExamples: ["curl", "surf"], narration: ["今天把开头和结尾辅音丛放在一起。smog，crust，bend，pond，先找元音，再看前后有几个辅音。", "一次读不顺没关系，先分音，再合音。", "curl 和 surf 里的 U R 是一组卷舌元音。下面用新词练习。"] },
    { day: 18, mainExamples: ["skit", "blot", "grill", "desk"], extensionExamples: ["yard", "dirt"], narration: ["今天复习辅音丛。skit，blot，grill 的开头有两个声音，desk 的结尾也有两个声音。", "用手指从左到右滑过去，提醒自己不要漏音。", "再比较 yard 里的 A R 和 dirt 里的 I R。下面换词复习。"] },
    { day: 19, mainExamples: ["smell", "bluff", "crop", "belt", "stamp", "twist"], extensionExamples: ["short", "hurt"], narration: ["今天练流畅读词。smell，bluff，crop，belt，stamp，twist，先准确分音，再一口气读完。", "不需要追求速度，要检查开头和结尾有没有漏音。", "short 里的 O R 和 hurt 里的 U R 声音不同。下面用另一组词挑战。"] },
    { day: 20, mainExamples: ["cake", "lake", "gate", "wave"], extensionExamples: ["pool", "room"], narration: ["今天认识结尾的魔法 e。cake，lake，gate，wave 末尾的 e 不单独发音，却让中间的 a 说字母音。", "先找到 a，再看看末尾有没有 e。", "pool 和 room 里的 O O 常常发长音。记住规律，下面换新词拼读。"] },
    { day: 21, mainExamples: ["ride", "side", "nine", "line"], extensionExamples: ["good", "wood"], narration: ["今天练长元音 i。ride，side，nine，line 末尾都有不发音的 e，它让中间的 i 说字母音。", "和短 i 比一比，听听声音有没有变长。", "good 和 wood 里的 O O 发较短的声音。下面用不同的词练习。"] },
    { day: 22, mainExamples: ["bone", "note", "rose", "stone"], extensionExamples: ["round", "cloud"], narration: ["今天练长元音 o。bone，note，rose，stone 末尾的 e 不发音，却让中间的 o 说字母音。", "先看完整个词，再决定元音怎么读。", "round 和 cloud 里的 O U 常常发 ow。下面换一组词试一试。"] },
    { day: 23, mainExamples: ["mule", "June", "flute", "theme"], extensionExamples: ["owl", "town"], narration: ["今天看两种带 e 的长元音。mule，June，flute 里的 u 被末尾 e 变成长音；theme 里的 e 也说长音。", "末尾的 e 自己不出声，却会提醒前面的元音。", "owl 和 town 里的 O W 发 ow。下面用新词辨认。"] },
    { day: 24, mainExamples: ["mad", "made", "rid", "ride", "rob", "robe"], extensionExamples: ["boil", "join"], narration: ["今天比较短元音和魔法 e。mad 加上 e 变 made；rid 加上 e 变 ride；rob 加上 e 变 robe。", "只多一个 e，中间元音就会改变。", "boil 和 join 里的 O I 常常发 oy。下面还有三组不同的词等你判断。"] },
    { day: 25, mainExamples: ["van", "shut", "clip", "wave", "stone"], extensionExamples: ["joy", "enjoy"], narration: ["今天做四周总复习。van 里是短元音，shut 里有 sh，clip 有辅音丛，wave 和 stone 有魔法 e。", "看到词先找熟悉的组合，再从左到右拼。", "joy 和 enjoy 词尾的 O Y 发 oy。下面换一组词完成复盘。"] },
    { day: 26, mainExamples: ["brush", "glad", "line", "stone", "mule", "theme"], extensionExamples: ["tooth", "brown"], narration: ["今天轻松展示你会的声音。brush 里有 sh，glad 有辅音丛，line，stone，mule，theme 都有魔法 e。", "先找熟悉的声音，再把完整单词读出来。", "tooth 里的 O O 和 brown 里的 O W 也要仔细听。下面选不同的词读给家人听。"] }
  ];

  const scenePlans = {
    1: [
      { mark: "a", title: "短元音 a", tip: "嘴巴张开，声音短短的", asset: "short-a", source: "main" },
      { mark: "ck", title: "词尾 ck", tip: "两个字母只发一个 /k/", asset: "ck", source: "extension" }
    ],
    2: [
      { mark: "-at", sound: "-at /æt/", title: "at 词族", tip: "保留词尾，替换开头", asset: "short-a", words: ["mat", "rat"] },
      { mark: "-ap", sound: "-ap /æp/", title: "ap 词族", tip: "保留词尾，替换开头", asset: "short-a", words: ["lap", "nap"] },
      { mark: "ck", title: "词尾 ck", tip: "两个字母只发一个 /k/", asset: "ck", source: "extension" }
    ],
    3: [
      { mark: "i", title: "短元音 i", tip: "声音短短的", asset: "short-i", source: "main" },
      { mark: "qu", title: "字母组合 qu", tip: "合起来发 /kw/", asset: "kw", source: "extension" }
    ],
    4: [
      { mark: "e", title: "短元音 e", tip: "声音短短的", asset: "short-e", source: "main" },
      { mark: "tch", title: "词尾 tch", tip: "三个字母只发一个 /tʃ/", asset: "ch", source: "extension" }
    ],
    5: [
      { mark: "o", title: "短元音 o", tip: "声音短短的", asset: "short-o", source: "main" },
      { mark: "ck", title: "词尾 ck", tip: "两个字母只发一个 /k/", asset: "ck", source: "extension" }
    ],
    6: [
      { mark: "u", title: "短元音 u", tip: "声音短短的", asset: "short-u", source: "main" },
      { mark: "ph", title: "字母组合 ph", tip: "两个字母合起来发 /f/", asset: "f", source: "extension" }
    ],
    7: [
      { mark: "sh", title: "字母组合 sh", tip: "嘴唇向前，气流连续", asset: "sh", source: "main" },
      { mark: "ai", title: "字母组合 ai", tip: "常常发长元音 /eɪ/", asset: "long-a", source: "extension" }
    ],
    8: [
      { mark: "ch", title: "字母组合 ch", tip: "声音短而有力", asset: "ch", source: "main" },
      { mark: "ay", title: "词尾 ay", tip: "常常发长元音 /eɪ/", asset: "long-a", source: "extension" }
    ],
    9: [
      { mark: "th", title: "字母组合 th", tip: "舌尖轻碰上牙，再送气", asset: "th", source: "main" },
      { mark: "ee", title: "字母组合 ee", tip: "常常发长元音 /iː/", asset: "long-e", source: "extension" }
    ],
    10: [
      { mark: "wh", title: "字母组合 wh", tip: "先读清开头，再接元音", asset: "w", source: "main" },
      { mark: "ea", title: "字母组合 ea", tip: "常常发长元音 /iː/", asset: "long-e", source: "extension" }
    ],
    11: [
      { mark: "ng", title: "词尾 ng", tip: "声音从鼻子出来", asset: "ng", words: ["song", "wing"] },
      { mark: "nk", title: "词尾 nk", tip: "最后还能听见一个 /k/", asset: "nk", words: ["bank", "sink"] },
      { mark: "oa", title: "字母组合 oa", tip: "常常发长元音 /oʊ/", asset: "long-o", source: "extension" }
    ],
    12: [
      { mark: "sh", title: "字母组合 sh", tip: "先找组合，再读完整单词", asset: "sh", words: ["shark"] },
      { mark: "ch", title: "字母组合 ch", tip: "声音短而有力", asset: "ch", words: ["bench"] },
      { mark: "th", title: "字母组合 th", tip: "舌尖轻碰上牙", asset: "th", words: ["three"] },
      { mark: "ng", title: "词尾 ng", tip: "听清鼻音结尾", asset: "ng", words: ["long"] },
      { mark: "ow", title: "字母组合 ow", tip: "这里发长元音 /oʊ/", asset: "long-o", source: "extension" }
    ],
    13: [
      { mark: "st", sound: "/st/", title: "st 辅音丛", tip: "t 少送气，但仍是 t，不是 d", soundCue: "注意，s 后面的 t 少送气，听起来有一点像 d，但它还是 t。现在听三遍。", asset: "st", words: ["stem"] },
      { mark: "sk", sound: "/sk/", title: "sk 辅音丛", tip: "k 少送气，但仍是 k，不是 g", soundCue: "注意，s 后面的 k 少送气，听起来有一点像 g，但它还是 k。现在听三遍。", asset: "sk", words: ["skip"] },
      { mark: "sn", sound: "/sn/", title: "sn 辅音丛", tip: "两个声音都要听见", asset: "sn", words: ["snap"] },
      { mark: "sl", sound: "/sl/", title: "sl 辅音丛", tip: "两个声音都要听见", asset: "sl", words: ["slug"] },
      { mark: "ar", title: "字母组合 ar", tip: "听清卷舌元音", asset: "ar", source: "extension" }
    ],
    14: [
      { mark: "cl", sound: "/kl/", title: "cl 辅音丛", tip: "滑到 l，不要漏音", asset: "cl", words: ["clip"] },
      { mark: "fl", sound: "/fl/", title: "fl 辅音丛", tip: "滑到 l，不要漏音", asset: "fl", words: ["flat"] },
      { mark: "pl", sound: "/pl/", title: "pl 辅音丛", tip: "滑到 l，不要漏音", asset: "pl", words: ["plug"] },
      { mark: "gl", sound: "/ɡl/", title: "gl 辅音丛", tip: "滑到 l，不要漏音", asset: "gl", words: ["glad"] },
      { mark: "or", title: "字母组合 or", tip: "听清卷舌元音", asset: "or", source: "extension" }
    ],
    15: [
      { mark: "fr", sound: "/fr/", title: "fr 辅音丛", tip: "两个辅音都要保留", asset: "fr", words: ["fresh"] },
      { mark: "dr", sound: "/dr/", title: "dr 辅音丛", tip: "两个辅音都要保留", asset: "dr", words: ["drop"] },
      { mark: "tr", sound: "/tr/", title: "tr 辅音丛", tip: "两个辅音都要保留", asset: "tr", words: ["trim"] },
      { mark: "cr", sound: "/kr/", title: "cr 辅音丛", tip: "两个辅音都要保留", asset: "cr", words: ["crack"] },
      { mark: "er", title: "字母组合 er", tip: "听清卷舌元音", asset: "er", source: "extension" }
    ],
    16: [
      { mark: "nt", sound: "/nt/", title: "词尾 nt", tip: "读到最后也不能漏音", asset: "nt", words: ["tent"] },
      { mark: "mp", sound: "/mp/", title: "词尾 mp", tip: "读到最后也不能漏音", asset: "mp", words: ["lamp"] },
      { mark: "nd", sound: "/nd/", title: "词尾 nd", tip: "读到最后也不能漏音", asset: "nd", words: ["sand"] },
      { mark: "ft", sound: "/ft/", title: "词尾 ft", tip: "读到最后也不能漏音", asset: "ft", words: ["gift"] },
      { mark: "ir", title: "字母组合 ir", tip: "听清卷舌元音", asset: "er", source: "extension" }
    ],
    17: [
      { mark: "sm", sound: "/sm/", title: "sm 辅音丛", tip: "先分音，再合起来", asset: "sm", words: ["smog"] },
      { mark: "cr", sound: "/kr/", title: "cr 辅音丛", tip: "先分音，再合起来", asset: "cr", words: ["crust"] },
      { mark: "nd", sound: "/nd/", title: "词尾 nd", tip: "读到最后也不能漏音", asset: "nd", words: ["bend", "pond"] },
      { mark: "ur", title: "字母组合 ur", tip: "听清卷舌元音", asset: "er", source: "extension" }
    ],
    18: [
      { mark: "sk", sound: "/sk/", title: "开头或词尾 sk", tip: "词首的 k 少送气，但仍是 k，不是 g", soundCue: "在单词开头，s 后面的 k 少送气，听起来有一点像 g，但它还是 k。现在听三遍。", asset: "sk", words: ["skit", "desk"] },
      { mark: "bl", sound: "/bl/", title: "bl 辅音丛", tip: "两个声音都要听见", asset: "bl", words: ["blot"] },
      { mark: "gr", sound: "/ɡr/", title: "gr 辅音丛", tip: "两个声音都要听见", asset: "gr", words: ["grill"] },
      { mark: "ar", title: "字母组合 ar", tip: "听清卷舌元音", asset: "ar", words: ["yard"] },
      { mark: "ir", title: "字母组合 ir", tip: "和 ar 比一比", asset: "er", words: ["dirt"] }
    ],
    19: [
      { mark: "sm", sound: "/sm/", title: "sm 辅音丛", tip: "准确比速度更重要", asset: "sm", words: ["smell"] },
      { mark: "bl", sound: "/bl/", title: "bl 辅音丛", tip: "准确比速度更重要", asset: "bl", words: ["bluff"] },
      { mark: "cr", sound: "/kr/", title: "cr 辅音丛", tip: "准确比速度更重要", asset: "cr", words: ["crop"] },
      { mark: "lt", sound: "/lt/", title: "词尾 lt", tip: "读到最后也不能漏音", asset: "lt", words: ["belt"] },
      { mark: "mp", sound: "/mp/", title: "词尾 mp", tip: "读到最后也不能漏音", asset: "mp", words: ["stamp"] },
      { mark: "st", sound: "/st/", title: "词尾 st", tip: "读到最后也不能漏音", asset: "st", words: ["twist"] },
      { mark: "or", title: "字母组合 or", tip: "听清卷舌元音", asset: "or", words: ["short"] },
      { mark: "ur", title: "字母组合 ur", tip: "和 or 比一比", asset: "er", words: ["hurt"] }
    ],
    20: [
      { mark: "a_e", title: "魔法 e 让 a 发长音", tip: "末尾 e 自己不发音", asset: "long-a", source: "main" },
      { mark: "oo 长音", title: "oo 的长音", tip: "这里发 /uː/", asset: "long-oo", source: "extension" }
    ],
    21: [
      { mark: "i_e", title: "魔法 e 让 i 发长音", tip: "末尾 e 自己不发音", asset: "long-i", source: "main" },
      { mark: "oo 短音", title: "oo 的短音", tip: "这里发 /ʊ/", asset: "short-oo", source: "extension" }
    ],
    22: [
      { mark: "o_e", title: "魔法 e 让 o 发长音", tip: "末尾 e 自己不发音", asset: "long-o", source: "main" },
      { mark: "ou", title: "字母组合 ou", tip: "这里发 /aʊ/", asset: "ow", source: "extension" }
    ],
    23: [
      { mark: "u_e", title: "魔法 e 让 u 发长音", tip: "末尾 e 自己不发音", asset: "long-u", words: ["mule", "June", "flute"] },
      { mark: "e_e", title: "魔法 e 让 e 发长音", tip: "末尾 e 自己不发音", asset: "long-e", words: ["theme"] },
      { mark: "ow", title: "字母组合 ow", tip: "这里发 /aʊ/", asset: "ow", source: "extension" }
    ],
    24: [
      { mark: "a ↔ a_e", sound: "a /æ/ ↔ a_e /eɪ/", title: "短 a 和长 a", tip: "多一个 e，元音会改变", sounds: [{ label: "短 a", cue: "先听短音。", asset: "short-a" }, { label: "长 a", cue: "再听长音。", asset: "long-a" }], words: ["mad", "made"] },
      { mark: "i ↔ i_e", sound: "i /ɪ/ ↔ i_e /aɪ/", title: "短 i 和长 i", tip: "听听元音怎么变", sounds: [{ label: "短 i", cue: "先听短音。", asset: "short-i" }, { label: "长 i", cue: "再听长音。", asset: "long-i" }], words: ["rid", "ride"] },
      { mark: "o ↔ o_e", sound: "o /ɑ/ ↔ o_e /oʊ/", title: "短 o 和长 o", tip: "先看末尾有没有 e", sounds: [{ label: "短 o", cue: "先听短音。", asset: "short-o" }, { label: "长 o", cue: "再听长音。", asset: "long-o" }], words: ["rob", "robe"] },
      { mark: "oi", title: "字母组合 oi", tip: "常常发 /ɔɪ/", asset: "oy", source: "extension" }
    ],
    25: [
      { mark: "a", sound: "/æ/", title: "短元音 a", tip: "先听声音，再读完整单词", asset: "short-a", words: ["van"] },
      { mark: "sh", sound: "/ʃ/", title: "字母组合 sh", tip: "先听声音，再读完整单词", asset: "sh", words: ["shut"] },
      { mark: "cl", sound: "/kl/", title: "cl 辅音丛", tip: "先听声音，再读完整单词", asset: "cl", words: ["clip"] },
      { mark: "a_e", sound: "/eɪ/", title: "魔法 e 让 a 发长音", tip: "先听声音，再读完整单词", asset: "long-a", words: ["wave"] },
      { mark: "o_e", sound: "/oʊ/", title: "魔法 e 让 o 发长音", tip: "先听声音，再读完整单词", asset: "long-o", words: ["stone"] },
      { mark: "oy", title: "词尾 oy", tip: "常常发 /ɔɪ/", asset: "oy", source: "extension" }
    ],
    26: [
      { mark: "sh", sound: "/ʃ/", title: "字母组合 sh", tip: "先听声音，再读完整单词", asset: "sh", words: ["brush"] },
      { mark: "gl", sound: "/ɡl/", title: "gl 辅音丛", tip: "先听声音，再读完整单词", asset: "gl", words: ["glad"] },
      { mark: "i_e", sound: "/aɪ/", title: "魔法 e 让 i 发长音", tip: "先听声音，再读完整单词", asset: "long-i", words: ["line"] },
      { mark: "o_e", sound: "/oʊ/", title: "魔法 e 让 o 发长音", tip: "先听声音，再读完整单词", asset: "long-o", words: ["stone"] },
      { mark: "u_e", sound: "/juː/", title: "魔法 e 让 u 发长音", tip: "先听声音，再读完整单词", asset: "long-u", words: ["mule"] },
      { mark: "e_e", sound: "/iː/", title: "魔法 e 让 e 发长音", tip: "先听声音，再读完整单词", asset: "long-e", words: ["theme"] },
      { mark: "oo 长音", title: "oo 的长音", tip: "这里发 /uː/", asset: "long-oo", words: ["tooth"] },
      { mark: "ow", title: "字母组合 ow", tip: "这里发 /aʊ/", asset: "ow", words: ["brown"] }
    ]
  };

  const phonemeAsset = (id) => `phonics-media/phonemes/${id}.mp3`;
  const pronunciationByAsset = {
    "short-a": "/æ/", ck: "/k/", k: "/k/", "short-i": "/ɪ/", kw: "/kw/",
    "short-e": "/e/", ch: "/tʃ/", "short-o": "/ɑ/", "short-u": "/ʌ/", f: "/f/",
    sh: "/ʃ/", "long-a": "/eɪ/", th: "/θ/（清音）", "long-e": "/iː/", w: "/w/",
    ng: "/ŋ/", nk: "/ŋk/", "long-o": "/oʊ/", ar: "/ɑr/", or: "/ɔr/",
    er: "/ɝ/", "long-oo": "/uː/", "short-oo": "/ʊ/", "long-i": "/aɪ/",
    ow: "/aʊ/", "long-u": "/juː/", oy: "/ɔɪ/", fr: "/fr/"
  };
  const fallbackSceneStartsByDay = {
    1: [0, 25.2], 2: [0, 20.5, 40.5], 3: [0, 25.2], 4: [0, 25], 5: [0, 25.4],
    6: [0, 25.1], 7: [0, 25.4], 8: [0, 25.2], 9: [0, 25.1], 10: [0, 25],
    11: [0, 20.3, 40.8], 12: [0, 15.5, 30.8, 45.7, 61.1], 13: [0, 15.7, 31, 46.5, 62.1],
    14: [0, 15.1, 30.9, 46.1, 61.5], 15: [0, 15.2, 30.4, 45.6, 61], 16: [0, 15.2, 30.4, 45.8, 61],
    17: [0, 15.5, 30.9, 51], 18: [0, 20.6, 36, 51.2, 66.7],
    19: [0, 14.8, 29.7, 44.3, 58.9, 73.7, 88.5, 104], 20: [0, 30.4], 21: [0, 31.3],
    22: [0, 31], 23: [0, 25.9, 40.8], 24: [0, 24.9, 50.4, 75.4],
    25: [0, 14.6, 29.5, 44.1, 58.8, 74.4], 26: [0, 14.8, 29.6, 44.9, 60.5, 75.7, 90.1, 104.8]
  };
  const sceneStartsByDay = root.PHONICS_AUDIO_TIMINGS || fallbackSceneStartsByDay;
  const kickerFor = (index, total) => index === 0 ? "先学这个声音" : index === total - 1 ? "最后看这个声音" : "再看一个声音";
  const repeatedWords = (words) => words.flatMap((word) => [word, word, word]).join(". ") + ".";
  const configuredLessons = lessons.map((lesson) => {
    const plan = scenePlans[lesson.day] || [];
    const scenes = plan.map((scene, index) => ({
      kicker: kickerFor(index, plan.length),
      mark: scene.mark,
      pronunciation: scene.sound || pronunciationByAsset[scene.asset] || "逐音拼读",
      title: scene.title,
      tip: scene.tip,
      asset: scene.asset ? phonemeAsset(scene.asset) : "",
      soundModels: (scene.sounds || (scene.asset ? [{ label: scene.mark, asset: scene.asset }] : [])).map((sound) => ({ label: sound.label, cue: sound.cue || scene.soundCue || "先听这个声音。", asset: phonemeAsset(sound.asset) })),
      words: [...(scene.words || (scene.source === "extension" ? lesson.extensionExamples : lesson.mainExamples))]
    }));
    const audioSegments = scenes.map((scene) => [
      ...scene.soundModels.flatMap((sound) => [
        { language: "zh", text: sound.cue },
        ...Array.from({ length: 3 }, () => ({ language: "phoneme", asset: sound.asset }))
      ]),
      { language: "zh", text: "现在放进单词里，慢慢听。" },
      { language: "en", text: repeatedWords(scene.words) }
    ]);
    return { ...lesson, audioRate: "-10%", pauseSeconds: scenes.length >= 6 ? 0.35 : 0.9, sceneStarts: sceneStartsByDay[lesson.day], animationScenes: scenes, audioSegments };
  });

  root.PHONICS_LESSON_CONTENT = Object.freeze(configuredLessons.map((lesson) => Object.freeze({
    ...lesson,
    mainExamples: Object.freeze([...lesson.mainExamples]),
    extensionExamples: Object.freeze([...lesson.extensionExamples]),
    narration: Object.freeze([...lesson.narration]),
    sceneStarts: lesson.sceneStarts ? Object.freeze([...lesson.sceneStarts]) : undefined,
    animationScenes: lesson.animationScenes ? Object.freeze(lesson.animationScenes.map((scene) => Object.freeze({
      ...scene,
      words: Object.freeze([...scene.words]),
      soundModels: Object.freeze(scene.soundModels.map((sound) => Object.freeze({ ...sound })))
    }))) : undefined,
    audioSegments: lesson.audioSegments ? Object.freeze(lesson.audioSegments.map((segments) => Object.freeze(segments.map((segment) => Object.freeze({ ...segment }))))) : undefined
  })));
})(typeof window !== "undefined" ? window : globalThis);
