import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const curriculumDirectory = join(projectRoot, "curriculum");
const verifiedClips = JSON.parse(readFileSync(join(curriculumDirectory, "opw-level1-verified-clips.json"), "utf8"));
const fullReviewQueue = JSON.parse(readFileSync(join(curriculumDirectory, "opw-listening-review-priority.json"), "utf8"));
const week1ReviewStatePath = join(curriculumDirectory, "opw-week1-review-state.json");
const week1ReviewState = existsSync(week1ReviewStatePath)
  ? JSON.parse(readFileSync(week1ReviewStatePath, "utf8"))
  : { verifiedItems: [], correctionItems: [] };

const days = [
  {
    day: 1,
    focus: "短元音 a：听出 /æ/，从左到右拼 CVC 词",
    pattern: "short-a",
    words: ["ant", "cat", "man", "pan"],
    preferredSections: ["a am an"],
    heartWords: { new: "I", review: ["a", "the", "is"] },
    raz: {
      focus: "自我和基础句型",
      anchorBook: "B-51 I Read a Book",
      supportingBooks: ["B-53 You and I", "B-98 This Turtle"],
      targetWords: ["I", "you", "and", "a", "book", "read", "this", "see"],
      sentenceFrames: ["I read a book.", "You and I see..."],
      parentTask: "读前把目标词写在便签上；读中让孩子每见一次就点一下。"
    }
  },
  {
    day: 2,
    focus: "短元音 a：比较 -at 与 -ap 词族",
    pattern: "short-a-at-ap",
    words: ["hat", "map", "cap", "tap"],
    preferredSections: ["ad ag ap at"],
    heartWords: { new: "you", review: ["I", "a", "the"] },
    raz: {
      focus: "can/go 动作句型",
      anchorBook: "B-81 You Can Go",
      supportingBooks: ["B-50 Go Animals Go", "B-19 Animals Can Move"],
      targetWords: ["can", "go", "move", "animals", "fast", "slow", "up", "down"],
      sentenceFrames: ["I can go.", "Animals can move."],
      parentTask: "读后做动作：go, move, up, down，让词和动作连起来。"
    }
  },
  {
    day: 3,
    focus: "短元音 i：拼读 i 与 -in/-it 词形",
    pattern: "short-i",
    words: ["in", "it", "hit", "pin"],
    preferredSections: ["in ig it ix", "i ip ib id"],
    heartWords: { new: "where", review: ["I", "you", "is"] },
    raz: {
      focus: "is/where/水和地点",
      anchorBook: "B-11 Where Is Water?",
      supportingBooks: ["B-84 Where?", "C-41 Get In"],
      targetWords: ["where", "is", "water", "in", "here", "there", "get", "it"],
      sentenceFrames: ["Where is...?", "It is in..."],
      parentTask: "家长问 Where is water? 孩子用 It is... 回答，可中英混合。"
    }
  },
  {
    day: 4,
    focus: "短元音 e：拼读 -en/-et/-ed 词形",
    pattern: "short-e",
    words: ["hen", "pet", "red", "ten"],
    preferredSections: ["e et en ed"],
    heartWords: { new: "what", review: ["where", "I", "you"] },
    raz: {
      focus: "what/these/动物特征",
      anchorBook: "B-15 What Has These Feet?",
      supportingBooks: ["B-16 What Has These Stripes?", "B-17 What Has These Spots?"],
      targetWords: ["what", "has", "these", "feet", "stripes", "spots", "animal", "have"],
      sentenceFrames: ["What has these...?", "It has..."],
      parentTask: "不要解释语法，直接让孩子找 these 和 has。"
    }
  },
  {
    day: 5,
    focus: "短元音 o：拼读 -og/-op/-ox 词形",
    pattern: "short-o",
    words: ["dog", "fox", "hop", "log"],
    preferredSections: ["o ot op"],
    heartWords: { new: "my", review: ["what", "where", "I"] },
    raz: {
      focus: "like/love/my 个人表达",
      anchorBook: "B-6 My Pet Dinosaur",
      supportingBooks: ["B-12 I Love the Earth", "B-56 I Love Art Class"],
      targetWords: ["my", "pet", "love", "like", "the", "earth", "class", "dinosaur"],
      sentenceFrames: ["I love...", "My pet is..."],
      parentTask: "读后让孩子说 2 句自己喜欢的东西。"
    }
  },
  {
    day: 6,
    focus: "短元音 u：拼读 u 与 -up/-un 词形",
    pattern: "short-u",
    words: ["cup", "sun", "up", "run"],
    preferredSections: ["u ug ud up", "ut ub um un"],
    heartWords: { new: null, review: ["my", "what", "where"] },
    raz: {
      focus: "第 1 周回收",
      anchorBook: "B-38 We Pack a Picnic",
      supportingBooks: ["任选本周最喜欢的 3 本"],
      targetWords: ["I", "you", "can", "go", "where", "is", "what", "has", "my", "love"],
      sentenceFrames: ["I can...", "Where is...?", "What has...?"],
      parentTask: "只复习错词，不新增；把犹豫词留到下周一。"
    }
  },
  {
    day: 7,
    focus: "短元音 a/i/e/o/u 混合辨音",
    pattern: "short-vowel-review",
    words: ["cat", "map", "in", "pet", "dog", "sun"],
    preferredSections: [],
    heartWords: { new: null, review: ["I", "you", "my"] },
    raz: {
      focus: "轻松输入",
      anchorBook: "孩子自选本周最喜欢的 1 本",
      supportingBooks: ["再听 1 本 B 级音频（可选）"],
      targetWords: [],
      sentenceFrames: [],
      parentTask: "只听或亲子共读，不新增、不要求输出。"
    }
  }
];

function itemId(item) {
  const base = `l${item.level}-d${item.disc}-t${item.track}-w${item.wordIndex}`;
  return item.reviewRevision ? `${base}-r${item.reviewRevision}` : base;
}

function selectVerified(word) {
  return [...week1ReviewState.verifiedItems, ...verifiedClips.items]
    .filter((item) => item.normalizedWord === word)
    .sort((left, right) => (
      Number(right.verificationSource === "week1-human-review") - Number(left.verificationSource === "week1-human-review") ||
      right.confidence - left.confidence ||
      left.itemId.localeCompare(right.itemId)
    ))[0] || null;
}

function candidateRank(item) {
  return item.priority === 1 ? 0 : item.priority === 0 ? 1 : 2;
}

function selectReviewCandidate(word, preferredSections) {
  if (week1ReviewState.excludedWords?.some((item) => item.normalizedWord === word)) return null;
  const correction = week1ReviewState.correctionItems.find((item) => item.normalizedWord === word);
  if (correction) return correction;
  return fullReviewQueue.items
    .filter((item) => item.level >= 2 && item.normalizedWord === word)
    .sort((left, right) => (
      left.level - right.level ||
      Number(!preferredSections.includes(left.sectionTitle)) - Number(!preferredSections.includes(right.sectionTitle)) ||
      candidateRank(left) - candidateRank(right) ||
      right.confidence - left.confidence ||
      left.disc - right.disc ||
      left.track - right.track ||
      left.wordIndex - right.wordIndex
    ))[0] || null;
}

function verifiedSource(item) {
  return {
    status: "verified",
    itemId: item.itemId,
    level: item.level,
    disc: item.disc,
    track: item.track,
    sourceFile: item.sourceFile,
    clip: item.clip
  };
}

function pendingSource(item) {
  return {
    status: "pending-review",
    itemId: itemId(item),
    level: item.level,
    disc: item.disc,
    track: item.track,
    sourceFile: item.sourceFile,
    clip: item.reviewClip
  };
}

const reviewItemsById = new Map();
const wordAudioSources = new Map();
const plannedDays = days.map((day) => {
  const phonicsWords = day.words.map((word) => {
    const existingSource = wordAudioSources.get(word);
    if (existingSource) {
      if (existingSource.status === "pending-review") {
        const existingReviewItem = reviewItemsById.get(existingSource.itemId);
        existingReviewItem.courseDays = [...new Set([...existingReviewItem.courseDays, day.day])];
      }
      return { word, audio: existingSource };
    }

    const verified = selectVerified(word);
    if (verified) {
      const audio = verifiedSource(verified);
      wordAudioSources.set(word, audio);
      return { word, audio };
    }

    const candidate = selectReviewCandidate(word, day.preferredSections);
    if (!candidate) {
      const audio = { status: "unavailable" };
      wordAudioSources.set(word, audio);
      return { word, audio };
    }

    const id = itemId(candidate);
    const existing = reviewItemsById.get(id);
    if (existing) {
      existing.courseDays = [...new Set([...existing.courseDays, day.day])];
      existing.courseWords = [...new Set([...existing.courseWords, word])];
    } else {
      reviewItemsById.set(id, {
        ...candidate,
        courseDays: [day.day],
        courseWords: [word],
        curriculumReason: "required-for-week-1"
      });
    }
    const audio = pendingSource(candidate);
    wordAudioSources.set(word, audio);
    return { word, audio };
  });

  const statuses = phonicsWords.map((entry) => entry.audio.status);
  return {
    day: day.day,
    focus: day.focus,
    phonics: {
      pattern: day.pattern,
      words: phonicsWords,
      activity: day.day === 7
        ? "混合播放 6 个词，孩子按短元音声音分到 a/i/e/o/u 五组。"
        : "先逐音拼读，再听一个词，从当天 4 个词中选出听到的词。"
    },
    heartWords: day.heartWords,
    raz: day.raz,
    listening: {
      type: day.day === 7 ? "short-vowel-sort" : "listen-and-choose",
      readiness: statuses.every((status) => status === "verified")
        ? "ready"
        : statuses.includes("unavailable") ? "missing-source" : "pending-review"
    }
  };
});

const allWordEntries = plannedDays.flatMap((day) => day.phonics.words);
const uniqueWordEntries = [...new Map(allWordEntries.map((entry) => [entry.word, entry])).values()];
const statusCounts = uniqueWordEntries.reduce((counts, entry) => {
  counts[entry.audio.status] = (counts[entry.audio.status] || 0) + 1;
  return counts;
}, {});
const reviewItems = [...reviewItemsById.values()].sort((left, right) => (
  Math.min(...left.courseDays) - Math.min(...right.courseDays) ||
  left.courseWords[0].localeCompare(right.courseWords[0])
));

const course = {
  schemaVersion: 1,
  generatedOn: "2026-08-04",
  title: "首周英语岛课程：短元音起步",
  policy: {
    courseOrder: "Our teaching sequence; Oxford levels are source libraries only.",
    dailyStructure: "one phonics focus, 4-6 decodable words, heart-word review, one RAZ anchor book, and one listening activity",
    audioRule: "Only human-verified clips are ready; pending candidates must be reviewed before child use.",
    razSource: "../outputs/raz_bf_catalog/raz_b_to_f_catalog.xlsx · 4-Week Plan · Week 1"
  },
  initialHeartWordReview: ["a", "the", "is"],
  summary: {
    days: plannedDays.length,
    uniquePhonicsWords: uniqueWordEntries.length,
    verifiedWords: statusCounts.verified || 0,
    pendingReviewWords: statusCounts["pending-review"] || 0,
    unavailableWords: statusCounts.unavailable || 0
  },
  days: plannedDays
};

const reviewQueue = {
  schemaVersion: 1,
  generatedOn: "2026-08-04",
  title: "首周课程最小试听审核清单",
  sourceCourse: "week1-course.json",
  sourceQueue: "opw-listening-review-priority.json",
  sourceReviewResults: week1ReviewState.sourceReviewResults || null,
  policy: {
    scope: "one best Level 2/3 candidate only for each first-week word not already covered by a Level 1 verified clip",
    ordering: "course day, then course word",
    completionRule: "Only verified results may replace pending-review sources in the child course."
  },
  summary: {
    total: reviewItems.length,
    byLevel: Object.fromEntries([2, 3].map((level) => [level, reviewItems.filter((item) => item.level === level).length])),
    byDisc: Object.fromEntries([1, 2].map((disc) => [disc, reviewItems.filter((item) => item.disc === disc).length]))
  },
  items: reviewItems
};

writeFileSync(join(curriculumDirectory, "week1-course.json"), `${JSON.stringify(course, null, 2)}\n`);
writeFileSync(join(curriculumDirectory, "opw-week1-review-queue.json"), `${JSON.stringify(reviewQueue, null, 2)}\n`);
console.log(`Wrote week1-course.json: ${JSON.stringify(course.summary)}`);
console.log(`Wrote opw-week1-review-queue.json: ${JSON.stringify(reviewQueue.summary)}`);
