import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const curriculumDirectory = join(projectRoot, "curriculum");
const week1Course = JSON.parse(readFileSync(join(curriculumDirectory, "week1-course.json"), "utf8"));
const laterVerifiedClips = JSON.parse(readFileSync(join(curriculumDirectory, "opw-weeks2-4-verified-clips.json"), "utf8"));
const phonicsWordAudioPath = join(curriculumDirectory, "phonics-word-audio.json");
const phonicsWordAudio = existsSync(phonicsWordAudioPath)
  ? JSON.parse(readFileSync(phonicsWordAudioPath, "utf8"))
  : { words: {} };
const OMITTED_LIGHT_INPUT_DAYS = new Set([7, 14]);
const PHONICS_EXTENSIONS_BY_CURRICULUM_DAY = new Map([
  [1, { pattern: "final-ck", focus: "词尾 ck 发 /k/", words: ["back", "sack"] }],
  [2, { pattern: "final-ck", focus: "词尾 ck 接在短元音后", words: ["neck", "duck"] }],
  [3, { pattern: "initial-qu", focus: "qu 通常发 /kw/", words: ["quit", "quill"] }],
  [4, { pattern: "final-tch", focus: "词尾 tch 发 /tʃ/", words: ["fetch", "match"] }],
  [5, { pattern: "final-ck-review", focus: "复习短元音后的 ck", words: ["rock", "sock"] }],
  [6, { pattern: "initial-ph", focus: "ph 发 /f/", words: ["phone", "graph"] }],
  [8, { pattern: "vowel-team-ai", focus: "ai 通常发长元音 /eɪ/", words: ["rain", "tail"] }],
  [9, { pattern: "vowel-team-ay", focus: "词尾 ay 通常发长元音 /eɪ/", words: ["day", "play"] }],
  [10, { pattern: "vowel-team-ee", focus: "ee 通常发长元音 /iː/", words: ["tree", "green"] }],
  [11, { pattern: "vowel-team-ea", focus: "ea 常发长元音 /iː/", words: ["team", "leaf"] }],
  [12, { pattern: "vowel-team-oa", focus: "oa 通常发长元音 /oʊ/", words: ["boat", "coat"] }],
  [13, { pattern: "vowel-team-ow-long-o", focus: "词尾 ow 可发长元音 /oʊ/", words: ["snow", "grow"] }],
  [15, { pattern: "r-controlled-ar", focus: "ar 是常见 r 控制元音", words: ["car", "star"] }],
  [16, { pattern: "r-controlled-or", focus: "or 是常见 r 控制元音", words: ["corn", "fork"] }],
  [17, { pattern: "r-controlled-er", focus: "er 常发卷舌元音", words: ["her", "fern"] }],
  [18, { pattern: "r-controlled-ir", focus: "ir 常发卷舌元音", words: ["bird", "girl"] }],
  [19, { pattern: "r-controlled-ur", focus: "ur 常发卷舌元音", words: ["turn", "burn"] }],
  [20, { pattern: "r-controlled-review", focus: "对比 ar / ir", words: ["car", "bird"] }],
  [21, { pattern: "r-controlled-review", focus: "对比 or / ur", words: ["fork", "turn"] }],
  [22, { pattern: "vowel-team-oo-long", focus: "oo 可发长音 /uː/", words: ["moon", "food"] }],
  [23, { pattern: "vowel-team-oo-short", focus: "oo 也可发短音 /ʊ/", words: ["book", "foot"] }],
  [24, { pattern: "diphthong-ou", focus: "ou 常发 /aʊ/", words: ["out", "house"] }],
  [25, { pattern: "diphthong-ow", focus: "ow 也可发 /aʊ/", words: ["cow", "down"] }],
  [26, { pattern: "diphthong-oi", focus: "oi 常发 /ɔɪ/", words: ["coin", "soil"] }],
  [27, { pattern: "diphthong-oy", focus: "词尾 oy 常发 /ɔɪ/", words: ["boy", "toy"] }],
  [28, { pattern: "common-vowel-review", focus: "复习 oo / ow", words: ["moon", "cow"] }]
]);
const HEART_WORDS_BY_CURRICULUM_DAY = new Map([
  [1, ["I", "a", "the", "and", "read"]],
  [2, ["you", "can", "go", "see", "we"]],
  [3, ["where", "is", "in", "here", "there"]],
  [4, ["what", "has", "this", "these", "it"]],
  [5, ["my", "like", "love", "me", "your"]],
  [8, ["many", "one", "two", "three", "count"]],
  [9, ["more", "have", "all", "some", "any"]],
  [10, ["first", "after", "before", "again", "now"]],
  [11, ["next", "up", "down", "away", "around"]],
  [12, ["then", "to", "from", "near", "far"]],
  [15, ["time", "at", "school", "new", "ready"]],
  [16, ["want", "do", "not", "make", "get"]],
  [17, ["need", "help", "come", "find", "give"]],
  [18, ["because", "for", "of", "but", "so"]],
  [19, ["with", "he", "she", "they", "them"]],
  [22, ["who", "when", "which", "his", "her"]],
  [23, ["why", "was", "were", "are", "am"]],
  [24, ["how", "could", "would", "will", "must"]],
  [25, ["does", "did", "had", "been", "be"]],
  [26, ["said", "say", "look", "little", "big"]]
]);
const HEART_WORD_SENTENCES = Object.freeze({
  a: "I read a book.", the: "I love the earth.", is: "Where is water?",
  I: "I read a book.", you: "You can go.", where: "Where is water?",
  what: "What has these feet?", my: "My pet is a dinosaur.",
  many: "How many animals?", more: "I can see more.",
  first: "First, the frog is an egg.", next: "Next, it grows legs.",
  then: "Then, it can jump.", time: "It is time for school.",
  want: "I want a new book.", need: "I need an eraser.",
  because: "I need it because I use it.", with: "I am with my friend.",
  who: "Who can help?", why: "Why does it sleep?", how: "How do they move?",
  does: "Why does it rain?", said: "He said, ‘Try again.’",
  and: "You and I read.", can: "I can go.", in: "It is in the book.",
  has: "The animal has spots.", like: "I like this book.", one: "I see one frog.",
  have: "I have a book.", it: "It is here.", to: "I go to school.",
  there: "The book is there.", at: "I am at school.", do: "What do they eat?",
  help: "I can help.", make: "We make food.", when: "When does school start?",
  they: "They can help.", not: "I did not stop."
});

const laterWeeks = [
  {
    week: 2,
    heartSchedule: [
      ["many", ["where", "what", "my"]], ["more", ["many", "where", "what"]],
      ["first", ["more", "many", "where"]], ["next", ["first", "more", "many"]],
      ["then", ["next", "first", "more"]], [null, ["then", "next", "first"]],
      [null, ["many", "more", "then"]]
    ],
    days: [
      {
        focus: "辅音组合 sh：两个字母发一个声音 /ʃ/", pattern: "digraph-sh", words: ["ship", "shop", "fish", "dish"],
        raz: ["数量和比较", ["B-28 Ten", "C-12 We Count", "D-31 Less than", "D-32 Greater than"], ["one", "two", "three", "many", "more", "less", "greater", "than", "count"], ["How many...?", "More than...", "Less than..."], "用积木或水果摆两组，开口比较 more / less。"]
      },
      {
        focus: "辅音组合 ch：听辨 /tʃ/ 并拼读词尾 -ch", pattern: "digraph-ch", words: ["chin", "chat", "much", "rich"],
        raz: ["动物吃什么/住哪里", ["C-9 What Animals Eat", "D-5 Where Animals Live", "E-4 Places Plants and Animals Live"], ["animals", "eat", "live", "place", "food", "water", "where", "what"], ["Animals eat...", "Animals live..."], "读后口头说两组：一种动物吃什么、住哪里。"]
      },
      {
        focus: "辅音组合 th：舌尖轻碰牙齿读 /θ/", pattern: "digraph-th", words: ["thin", "bath", "moth", "path"],
        raz: ["生长和变化", ["C-6 How Frogs Grow", "D-1 Grow, Vegetables, Grow!", "D-9 Where Plants Grow"], ["grow", "plant", "frog", "vegetable", "first", "next", "then", "where"], ["First... Next... Then..."], "看图按 first / next / then 口头复述三个步骤。"]
      },
      {
        focus: "辅音组合 wh：比较 w 与 wh 的词形", pattern: "digraph-wh", words: ["when", "whip", "whiz", "which"],
        raz: ["天气和季节", ["C-14 Snow Falls", "D-10 Fog", "D-11 Clouds", "E-11 The Four Seasons"], ["snow", "falls", "fog", "clouds", "season", "weather", "cold", "warm"], ["The weather is...", "In winter..."], "看窗外，用 The weather is... 说一句。"]
      },
      {
        focus: "词尾组合 ng / nk：听出鼻音结尾", pattern: "final-ng-nk", words: ["ring", "sing", "king", "pink"],
        raz: ["方位和移动", ["B-80 Near and Far Away", "C-33 Going Away", "D-37 Getting Around the City", "D-88 How We Get to School"], ["near", "far", "away", "around", "to", "from", "school", "city", "get"], ["I go to...", "It is near/far."], "在家里找一近一远的物品，各说一句 near / far。"]
      },
      {
        focus: "第 2 周回收：混合辨认 sh / ch / th / ng", pattern: "digraph-review", words: ["ship", "chin", "thin", "ring"],
        raz: ["第 2 周回收", ["任选数量、动物、天气主题各 1 本"], ["many", "more", "less", "where", "what", "eat", "live", "grow", "then", "away"], ["What do animals eat?", "Where do they live?"], "只复习犹豫词；能秒认的词直接跳过。"]
      },
      {
        focus: "辅音组合混合复习：按声音和词形分类", pattern: "digraph-mixed-review", words: ["fish", "chat", "bath", "when", "sing", "pink"],
        raz: ["轻松输入", ["自选 C/D 级动物或天气主题音频"], [], [], "只听或亲子共读；愿意时说一句 I heard...。"]
      }
    ]
  },
  {
    week: 3,
    heartSchedule: [
      ["time", ["first", "next", "then"]], ["want", ["time", "first", "then"]],
      ["need", ["want", "time", "more"]], ["because", ["need", "want", "time"]],
      ["with", ["because", "need", "want"]], [null, ["with", "because", "need"]],
      [null, ["time", "want", "need"]]
    ],
    days: [
      {
        focus: "s 辅音丛：两个声音都要读清楚", pattern: "initial-s-blends", words: ["stop", "step", "spin", "spot"],
        raz: ["学校和日常", ["B-73 It Is School Time", "C-46 Busy At School", "D-41 My New School", "E-43 Getting Ready for School"], ["school", "time", "ready", "new", "class", "teacher", "busy", "at"], ["It is time for...", "I am ready for..."], "联系真实生活，说一句 It is time for...。"]
      },
      {
        focus: "l 辅音丛：保留开头两个辅音", pattern: "initial-l-blends", words: ["clap", "flag", "slip", "plan"],
        raz: ["需要/想要/拥有", ["C-52 What I Want", "D-54 I Need An Eraser", "F-72 Needs and Wants"], ["want", "need", "have", "has", "eraser", "thing", "because", "enough"], ["I want...", "I need... because..."], "从身边物品各选一个 want 和 need，说出理由。"]
      },
      {
        focus: "r 辅音丛：比较 fr / tr / dr / cr", pattern: "initial-r-blends", words: ["frog", "trip", "drum", "crab"],
        raz: ["家庭和朋友", ["D-35 A Day for Dad", "E-31 Nothing for Father's Day", "E-71 A Week With Grandpa", "F-12 Best of Friends"], ["dad", "father", "grandpa", "friend", "family", "day", "week", "with"], ["I am with...", "My friend..."], "选一个家庭成员或朋友，说一句和他有关的话。"]
      },
      {
        focus: "词尾辅音丛：结尾两个声音都不丢", pattern: "final-blends", words: ["hand", "milk", "jump", "nest"],
        raz: ["工作和社区", ["B-75 I Am a Community Worker", "D-69 Community Helpers", "D-71 Workers", "F-62 Community Workers"], ["worker", "community", "help", "people", "job", "work", "can", "do"], ["Workers help...", "People can..."], "选一种社区工作，说 Workers help...。"]
      },
      {
        focus: "CCVC / CVCC 综合拼读：先分音，再合音", pattern: "blend-word-review", words: ["black", "plant", "swim", "frog"],
        raz: ["食物和制作", ["B-40 We Make Cookies", "C-27 Yummy, Yummy", "E-27 Let's Make Lemonade", "E-61 Making Pizza"], ["make", "made", "food", "yummy", "cookie", "pizza", "lemonade", "eat"], ["We make...", "I eat...", "It is yummy."], "假装制作一种食物，边做动作边说 make / eat / yummy。"]
      },
      {
        focus: "第 3 周回收：开头和结尾辅音丛", pattern: "blend-review", words: ["step", "clap", "frog", "hand"],
        raz: ["第 3 周回收", ["学校、need/want、worker、food 主题各选 1 本"], ["school", "time", "need", "want", "because", "friend", "people", "work", "make"], ["I need... because...", "Workers help..."], "重点回收 because / people / friend / work。"]
      },
      {
        focus: "辅音丛混合复习：流畅读词，不追求速度", pattern: "blend-mixed-review", words: ["spin", "flag", "trip", "milk", "plant", "swim"],
        raz: ["轻松输入", ["听 D/E 级故事类音频"], [], [], "只保留听力优势，不做纸笔任务。"]
      }
    ]
  },
  {
    week: 4,
    heartSchedule: [
      ["who", ["what", "where", "when"]], ["why", ["who", "what", "where"]],
      ["how", ["why", "who", "what"]], ["does", ["how", "why", "who"]],
      ["said", ["does", "how", "why"]], [null, ["said", "does", "how"]],
      [null, ["who", "why", "how"]]
    ],
    days: [
      {
        focus: "长元音 a_e：结尾 e 让 a 说字母音", pattern: "silent-e-a", words: ["make", "name", "same", "game"],
        raz: ["疑问词总复习", ["C-91 Who, Who, Who?", "D-27 Who Runs Faster?", "D-30 Why Does an Octopus Need Eight Arms?", "F-10 Who Needs Rain?"], ["who", "what", "where", "when", "why", "how", "does", "do", "they"], ["Who...?", "Why does...?", "How do they...?"], "只问问题，不讲语法；先用关键词回答，再尝试整句。"]
      },
      {
        focus: "长元音 i_e：比较短 i 与长 i", pattern: "silent-e-i", words: ["bike", "like", "time", "five"],
        raz: ["不规则高频词", ["C-88 There Is a Mouse in the House", "D-66 I Did Not Give Up!", "E-72 Try, try again", "F-86 Stop It, Zots!"], ["there", "is", "did", "not", "give", "again", "stop", "it", "said"], ["There is...", "I did not...", "Try again."], "把不规则词放进短句整体读，不要求全部靠拼读。"]
      },
      {
        focus: "长元音 o_e：结尾 e 改变中间元音", pattern: "silent-e-o", words: ["home", "hope", "rope", "nose"],
        raz: ["自然拼读辅助记词", ["D-87 Silent e", "F-27 Princess Prefix", "F-77 Sir Suffix"], ["silent", "e", "prefix", "suffix", "make", "name", "same", "hope"], ["Silent e changes...", "I can make..."], "轻讲规则，用 make / name / same / hope 验证 silent e。"]
      },
      {
        focus: "长元音 u_e 与 e_e：观察结尾 e", pattern: "silent-e-u-e", words: ["cube", "cute", "tune", "these"],
        raz: ["信息类综合阅读", ["F-1 The Food Chain", "F-14 Hibernation", "F-18 A Look at Fossils"], ["food", "chain", "look", "at", "fossil", "winter", "sleep", "animal"], ["A food chain has...", "Animals sleep..."], "看图口头复述信息，不要求整段英文。"]
      },
      {
        focus: "短元音与 Silent e 对比：一个 e 改变读音", pattern: "silent-e-contrast", words: ["cap", "cape", "kit", "kite", "hop", "hope"],
        raz: ["故事类综合阅读", ["F-74 The Three Little Pigs", "F-75 The Giant Turnip", "F-76 The Tortoise and the Hare"], ["little", "three", "big", "help", "pull", "fast", "slow", "hare", "turnip"], ["The pig is...", "They help...", "Slow and fast."], "选一本最喜欢的故事复述，其余只读。"]
      },
      {
        focus: "四周总复盘：短元音、组合、辅音丛、Silent e", pattern: "four-week-review", words: ["cat", "ship", "frog", "hand", "make", "hope"],
        raz: ["总复盘", ["从 4 周中每周选 2 本，共 8 本"], ["I", "you", "where", "many", "because", "who", "said", "does"], ["I can...", "There is...", "I need...", "Why does...?"], "把词分成秒认、犹豫、不会三类；只练后两类。"]
      },
      {
        focus: "轻松展示：选会读的词和书讲给家人听", pattern: "course-showcase", words: ["fish", "plan", "time", "home", "cube", "these"],
        raz: ["轻松展示", ["孩子自选 3 本读给家长听"], [], [], "只鼓励流畅阅读，不频繁纠错。"]
      }
    ]
  }
];

const knownAudio = new Map(week1Course.days.flatMap((day) => day.phonics.words).map((entry) => [entry.word, entry.audio]));
const laterKnownAudio = new Map(laterVerifiedClips.selectedClips.map((entry) => [
  `${entry.week}:${entry.normalizedWord}`,
  {
    status: "verified",
    itemId: entry.itemId,
    level: entry.level,
    disc: entry.disc,
    track: entry.track,
    sourceFile: entry.sourceFile,
    clip: entry.clip
  }
]));
const fallbackWordAudio = new Map(Object.entries(phonicsWordAudio.words || {}));

function selectVerifiedAudio(...candidates) {
  return candidates.find((audio) => audio?.status === "verified") || { status: "unavailable" };
}

function buildRaz([focus, books, targetWords, sentenceFrames, childTask]) {
  return {
    focus,
    anchorBook: books[0],
    supportingBooks: books.slice(1),
    sourceBooks: books,
    targetWords,
    sentenceFrames,
    childTask,
    parentTask: childTask
  };
}

const laterDays = laterWeeks.flatMap((weekPlan) => weekPlan.days.map((entry, index) => {
  const dayOfWeek = index + 1;
  const day = (weekPlan.week - 1) * 7 + dayOfWeek;
  const [newHeartWord, reviewHeartWords] = weekPlan.heartSchedule[index];
  const phonicsWords = entry.words.map((word) => ({
    word,
    audio: selectVerifiedAudio(
      laterKnownAudio.get(`${weekPlan.week}:${word}`),
      knownAudio.get(word),
      fallbackWordAudio.get(word)
    )
  }));
  return {
    day,
    week: weekPlan.week,
    dayOfWeek,
    focus: entry.focus,
    phonics: {
      pattern: entry.pattern,
      words: phonicsWords,
      activity: dayOfWeek === 7 ? "混合复习并按词形分类。" : "先分音拼读，再合音读出完整单词。"
    },
    heartWords: { new: newHeartWord, review: reviewHeartWords },
    raz: buildRaz(entry.raz),
    listening: {
      type: dayOfWeek === 7 ? "review-and-read" : "listen-and-choose",
      readiness: phonicsWords.every((word) => word.audio.status === "verified") ? "ready" : "missing-source"
    }
  };
}));

const week1Days = week1Course.days.map((day) => ({
  ...day,
  week: 1,
  dayOfWeek: day.day,
  phonics: {
    ...day.phonics,
    words: day.phonics.words.map((entry) => ({
      ...entry,
      audio: selectVerifiedAudio(entry.audio, fallbackWordAudio.get(entry.word))
    }))
  }
}));
const curriculumDays = [...week1Days, ...laterDays].map((day) => {
  const extension = PHONICS_EXTENSIONS_BY_CURRICULUM_DAY.get(day.day);
  if (!extension) return day;
  const extensionWords = extension.words.map((word) => ({
    word,
    audio: selectVerifiedAudio(
      laterKnownAudio.get(`${day.week}:${word}`),
      knownAudio.get(word),
      fallbackWordAudio.get(word)
    )
  }));
  return {
    ...day,
    focus: `${day.focus}｜常见规律拓展：${extension.focus}`,
    phonics: {
      ...day.phonics,
      extensions: [{ ...extension, words: extensionWords.map((entry) => entry.word) }],
      words: [...day.phonics.words, ...extensionWords],
      activity: `${day.phonics.activity} 核心词完成后，再练 2 个常见规律拓展词。`
    }
  };
});
const curriculumDayByNumber = new Map(curriculumDays.map((day) => [day.day, day]));
const booksForDay = (number) => {
  const raz = curriculumDayByNumber.get(number)?.raz;
  return raz?.sourceBooks || [raz?.anchorBook, ...(raz?.supportingBooks || [])].filter(Boolean);
};
const booksForWeek = (week) => curriculumDays
  .filter((day) => day.week === week && day.dayOfWeek <= 5)
  .flatMap((day) => booksForDay(day.day));

const razChoiceAssignments = new Map([
  [6, {
    rule: "任选本周最喜欢的 4 本，再读 B-38 We Pack a Picnic",
    fixedBooks: ["B-38 We Pack a Picnic"],
    groups: [{ label: "第 1 周最喜欢的书", count: 4, choices: booksForWeek(1) }]
  }],
  [13, {
    rule: "数量、动物、天气主题各选 1 本",
    groups: [
      { label: "数量主题", count: 1, choices: booksForDay(8) },
      { label: "动物主题", count: 1, choices: booksForDay(9) },
      { label: "天气主题", count: 1, choices: booksForDay(11) }
    ]
  }],
  [20, {
    rule: "学校、need/want、worker、food 主题各选 1 本",
    groups: [
      { label: "学校主题", count: 1, choices: booksForDay(15) },
      { label: "need / want 主题", count: 1, choices: booksForDay(16) },
      { label: "worker 主题", count: 1, choices: booksForDay(18) },
      { label: "food 主题", count: 1, choices: booksForDay(19) }
    ]
  }],
  [21, {
    rule: "听 1 本 D/E 级故事类音频",
    groups: [{
      label: "D/E 级故事音频",
      count: 1,
      choices: booksForWeek(3).filter((book) => /^[DE]-/.test(book))
    }]
  }],
  [27, {
    rule: "从 4 周中每周选 2 本，共 8 本",
    groups: [1, 2, 3, 4].map((week) => ({ label: `第 ${week} 周`, count: 2, choices: booksForWeek(week) }))
  }],
  [28, {
    rule: "孩子自选 3 本读给家长听",
    groups: [{ label: "全课程书目", count: 3, choices: [1, 2, 3, 4].flatMap(booksForWeek) }]
  }]
]);

const days = curriculumDays
  .filter((day) => !OMITTED_LIGHT_INPUT_DAYS.has(day.day))
  .map((day, index) => ({
    ...day,
    curriculumDay: day.day,
    day: index + 1
  }));
for (const day of days) {
  day.heartWords.newWords = [...(HEART_WORDS_BY_CURRICULUM_DAY.get(day.curriculumDay) || [])];
}
for (const day of days) {
  const assignment = razChoiceAssignments.get(day.curriculumDay);
  if (assignment) day.raz.assignment = { mode: "choose", ...assignment };
  else day.raz.assignment = {
    mode: "fixed",
    books: day.raz.sourceBooks || [day.raz.anchorBook, ...(day.raz.supportingBooks || [])].filter(Boolean)
  };
}
const introducedHeartWords = new Map();
const reviewIntervals = new Set([1, 3, 7, 14, 21]);
for (const day of days) {
  const immediate = [...introducedHeartWords]
    .filter(([, introducedDay]) => day.day - introducedDay === 1)
    .map(([word]) => word);
  const scheduled = [...introducedHeartWords]
    .filter(([, introducedDay]) => reviewIntervals.has(day.day - introducedDay))
    .map(([word]) => word);
  const manual = (day.heartWords.review || []).filter((word) => introducedHeartWords.has(word));
  day.heartWords.review = [...new Set([...immediate, ...scheduled, ...manual])]
    .filter((word) => !day.heartWords.newWords.includes(word))
    .slice(0, 10);
  for (const word of day.heartWords.newWords) introducedHeartWords.set(word, day.day);
}
const uniquePhonicsWords = new Set(days.flatMap((day) => day.phonics.words.map((entry) => entry.word)));
const heartWordIntroductions = new Map();
for (const day of days) {
  for (const word of day.heartWords.newWords) heartWordIntroductions.set(word, day);
}
const heartWordBank = [...heartWordIntroductions].map(([word, introduction]) => ({
  word,
  firstDay: introduction?.day || 0,
  sentence: HEART_WORD_SENTENCES[word] || `Practice ${word} in a sentence.`
}));

const course = {
  schemaVersion: 5,
  generatedOn: "2026-08-07",
  title: "暑假计划 · 英语岛基础阶段",
  schedule: {
    mode: "starts-when-child-begins",
    durationDays: days.length,
    planningAssumption: "If development finishes on 2026-08-05, the earliest start is 2026-08-06 and 26 consecutive days fit through 2026-08-31.",
    omittedLightInputCurriculumDays: [...OMITTED_LIGHT_INPUT_DAYS]
  },
  policy: {
    courseOrder: "Short vowels → consonant digraphs → consonant blends → long vowels and silent e, with compact daily extensions for ck/qu/tch/ph, common vowel teams, r-controlled vowels, and oo/ou/ow/oi/oy.",
    dailyStructure: "phonics, contextual heart words, RAZ target words, spoken sentence frames, and every explicitly assigned review book",
    audioRule: "Existing verified Oxford clips remain valid; generated TTS is automatically playable without human review. Human recordings remain optional replacements and require explicit review. Do not scan Oxford tracks merely to source new course words.",
    heartWordRule: "New heart words are copied into an English notebook, then recalled by typing; reviews recur after expanding intervals.",
    heartWordSelection: "100 foundational high-frequency words selected from Dolch early-reader words, retaining the course's RAZ anchor words; teaching follows UFLI guidance by decoding regular parts and marking only irregular parts for memory.",
    heartWordSources: [
      "https://ufli.education.ufl.edu/resources/teaching-resources/instructional-activities/irregular-and-high-frequency-words/",
      "https://sightwords.com/sight-words/dolch/"
    ],
    razSource: "../outputs/raz_bf_catalog/raz_b_to_f_catalog.xlsx · 4-Week Plan"
  },
  summary: {
    weeks: 4,
    days: days.length,
    uniquePhonicsWords: uniquePhonicsWords.size,
    teachingDays: days.filter((day) => day.dayOfWeek <= 5).length,
    reviewDays: days.filter((day) => day.dayOfWeek > 5).length,
    heartWords: heartWordBank.length,
    razBookAssignments: days.reduce((total, day) => total + (
      day.raz.assignment.mode === "fixed"
        ? day.raz.assignment.books.length
        : (day.raz.assignment.fixedBooks?.length || 0) + day.raz.assignment.groups.reduce((sum, group) => sum + group.count, 0)
    ), 0),
    laterWeeksAudioStatus: "tts-auto-applied",
    verifiedFallbackWords: Object.keys(phonicsWordAudio.words || {}).length,
    extensionPatterns: [...new Set([...PHONICS_EXTENSIONS_BY_CURRICULUM_DAY.values()].map((entry) => entry.pattern))].length,
    extensionWords: new Set([...PHONICS_EXTENSIONS_BY_CURRICULUM_DAY.values()].flatMap((entry) => entry.words)).size
  },
  heartWords: {
    instruction: "在英文句子中认出标注的心词；新词读 3 遍、写 3 遍，再遮住答案独立拼写；复习词必须拼写正确才能继续。",
    words: heartWordBank
  },
  days
};

writeFileSync(join(curriculumDirectory, "english-course.json"), `${JSON.stringify(course, null, 2)}\n`);
console.log(`Wrote english-course.json: ${JSON.stringify(course.summary)}`);
