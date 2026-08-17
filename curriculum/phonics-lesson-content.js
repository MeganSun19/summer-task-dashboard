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
    { day: 11, mainExamples: ["song", "wing", "bank", "sink"], extensionExamples: ["goat", "road"], narration: ["今天听词尾 N G 和 N K。song、wing 的结尾是 ng；bank、sink 的结尾是 nk，还要加上 k。", "先听清结尾，再把整个词连起来。", "字母组合 O A 常常发长 o：goat，road。下面换一组词检查你是否真的懂了。"] },
    { day: 12, mainExamples: ["shark", "bench", "three", "long"], extensionExamples: ["flow", "yellow"], narration: ["今天把学过的组合放在一起。shark 是 sh，bench 是 ch，three 是 th，long 是 ng。", "先找两个字母组成的声音，再读完整单词。", "flow 和 yellow 里的 O W 发长 o。动画里的词先收起来，下面用另一组词复习。"] },
    { day: 13, mainExamples: ["stem", "skip", "snap", "slug"], extensionExamples: ["park", "farm"], narration: ["今天练 S 开头的辅音丛。stem，skip，snap，slug 的开头都有两个辅音。", "两个声音都要听见，不能丢掉一个。", "park 和 farm 里的 A R 是一组常见声音。现在把方法用到下面的新词。"] },
    { day: 14, mainExamples: ["clip", "flat", "plug", "glad"], extensionExamples: ["horse", "storm"], narration: ["今天练 L 辅音丛。clip，flat，plug，glad 的开头都有两个辅音。", "先读第一个，再滑到 l，两个声音都保留。", "horse 和 storm 里的 O R 是常见组合。下面换词继续练。"] },
    { day: 15, mainExamples: ["grin", "drop", "trim", "crack"], extensionExamples: ["term", "verb"], narration: ["今天练 R 辅音丛。grin，drop，trim，crack 的开头都有 r。", "先听第一个辅音，再接 r 和后面的元音。", "term 和 verb 里的 E R 发卷舌元音。现在去读下面的新词。"] },
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

  root.PHONICS_LESSON_CONTENT = Object.freeze(lessons.map((lesson) => Object.freeze({
    ...lesson,
    mainExamples: Object.freeze([...lesson.mainExamples]),
    extensionExamples: Object.freeze([...lesson.extensionExamples]),
    narration: Object.freeze([...lesson.narration])
  })));
})(typeof window !== "undefined" ? window : globalThis);
