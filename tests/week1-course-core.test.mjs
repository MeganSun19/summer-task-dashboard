import assert from "node:assert/strict";
import test from "node:test";

await import("../week1-course-core.js");

test("an unstarted course always previews day 1", () => {
  assert.equal(OPWWeek1CourseCore.courseDayNumber("2026-08-04", null), 1);
  assert.equal(OPWWeek1CourseCore.courseDayNumber("2026-09-15"), 1);
});

test("an activated course maps its seven dates to days 1 through 7", () => {
  assert.equal(OPWWeek1CourseCore.courseDayNumber("2026-08-04", "2026-08-04"), 1);
  assert.equal(OPWWeek1CourseCore.courseDayNumber("2026-08-10", "2026-08-04"), 7);
  assert.equal(OPWWeek1CourseCore.courseDayNumber("2026-08-11", "2026-08-04"), null);
  assert.equal(OPWWeek1CourseCore.courseDayNumber("2026-08-03", "2026-08-04"), null);
});

test("a four-week course maps dates through day 28 when its length is supplied", () => {
  assert.equal(OPWWeek1CourseCore.courseDayNumber("2026-08-31", "2026-08-04", 28), 28);
  assert.equal(OPWWeek1CourseCore.courseDayNumber("2026-09-01", "2026-08-04", 28), null);
});

test("seeded audio practice order is stable, complete, and not the source order", () => {
  const words = ["hat", "map", "cap", "tap", "neck", "duck"];
  const first = OPWWeek1CourseCore.shuffleWithSeed(words, "kid-a|day-2|soundLab|first-v1");
  const repeated = OPWWeek1CourseCore.shuffleWithSeed(words, "kid-a|day-2|soundLab|first-v1");
  assert.deepEqual(first, repeated);
  assert.deepEqual([...first].sort(), [...words].sort());
  assert.notDeepEqual(first, words);
});

test("a different practice seed produces a different sound-lab order", () => {
  const words = ["hat", "map", "cap", "tap", "neck", "duck"];
  assert.notDeepEqual(
    OPWWeek1CourseCore.shuffleWithSeed(words, "practice-1"),
    OPWWeek1CourseCore.shuffleWithSeed(words, "practice-2")
  );
});

test("verified words become listening rounds and excluded words become reading rounds", () => {
  const rounds = OPWWeek1CourseCore.buildRounds({
    phonics: {
      words: [
        { word: "red", audio: { status: "verified", level: 2, disc: 1, track: 43, clip: { startSeconds: 1, endSeconds: 2 } } },
        { word: "pet", audio: { status: "unavailable" } }
      ]
    }
  });
  assert.equal(rounds[0].mode, "listen");
  assert.equal(rounds[0].assetId, "opw-l2-d1-track43");
  assert.equal(rounds[1].mode, "read");
  assert.deepEqual(rounds[0].choices, ["red", "pet"]);
});

test("stage review separates watched lessons, phonics testing, and one combined word test", () => {
  const rounds = OPWWeek1CourseCore.buildRounds({
    stageReview: { lessonDays: [1, 2] },
    phonics: { words: [
      { word: "cat", reviewMode: "listen", audio: { status: "verified", assetId: "cat" } },
      { word: "back", reviewMode: "spell", audio: { status: "verified", assetId: "back" } }
    ] },
    heartWords: { newWords: [], review: ["the"], extensionWords: [], extensionReview: ["blue"] },
    raz: { targetWords: [], sentenceFrames: [], sourceBooks: [], assignment: null }
  });
  const modules = OPWWeek1CourseCore.groupRoundsByModule(rounds);
  assert.deepEqual(modules.map((module) => [module.id, module.rounds.length]), [
    ["reviewLessons", 2], ["soundLab", 2], ["coreWords", 2]
  ]);
  assert.deepEqual(rounds.slice(0, 2).map((round) => round.mode), ["watch", "watch"]);
  assert.deepEqual(rounds.filter((round) => round.kind === "phonics").map((round) => round.mode), ["listen", "spell"]);
  assert.equal(rounds.filter((round) => round.kind === "raz").length, 0);
});

test("a full day combines phonics, typed heart-word recall, RAZ targets, speaking, and a book", () => {
  const rounds = OPWWeek1CourseCore.buildRounds({
    phonics: { words: [{ word: "cat", audio: { status: "unavailable" } }] },
    heartWords: { new: "I", review: ["a", "the", "is"] },
    raz: {
      focus: "基础句型",
      anchorBook: "B-51 I Read a Book",
      targetWords: ["I", "you", "book", "read"],
      sentenceFrames: ["I read a book.", "You and I see..."],
      parentTask: "读完找目标词。"
    }
  });

  assert.deepEqual(rounds.map((round) => round.kind), [
    "phonics", "heart", "heart", "heart", "heart", "heart", "raz", "raz", "raz", "raz"
  ]);
  assert.equal(rounds.filter((round) => round.mode === "spell").length, 4);
  assert.equal(rounds.find((round) => round.mode === "spell" && round.word === "I").isNew, true);
  assert.equal(rounds.find((round) => round.mode === "word-bank").words.length, 4);
  assert.equal(rounds.at(-1).book, "B-51 I Read a Book");
});

test("heart-word spelling rounds use contextual cloze prompts", () => {
  const rounds = OPWWeek1CourseCore.buildRounds({
    phonics: { words: [] },
    heartWords: { new: "where", review: ["is"] },
    raz: { targetWords: ["water", "here"], sentenceFrames: [], anchorBook: "Where?" }
  });
  const whereRound = rounds.find((round) => round.mode === "spell" && round.word === "where");
  assert.equal(whereRound.prompt, "__ is water?");
  assert.equal(whereRound.isNew, true);
});

test("two new high-frequency words each require notebook study and checked recall", () => {
  const rounds = OPWWeek1CourseCore.buildRounds({
    phonics: { words: [] },
    heartWords: { new: "I", newWords: ["I", "and"], review: ["the"] },
    raz: { targetWords: [], sentenceFrames: [], anchorBook: "I Read a Book" }
  });
  assert.deepEqual(rounds.filter((round) => round.mode === "study").map((round) => round.word), ["I", "and"]);
  assert.deepEqual(rounds.filter((round) => round.mode === "spell").map((round) => round.word), ["I", "and", "the"]);
  assert.equal(rounds.find((round) => round.word === "and" && round.mode === "spell").prompt, "You __ I read.");
});

test("extension words append after the legacy round sequence so partial progress does not shift", () => {
  const baseDay = {
    phonics: { words: [{ word: "cat", audio: { status: "unavailable" } }] },
    heartWords: { newWords: ["I"], review: ["the"], sentences: { blue: "The sky is blue." } },
    raz: { focus: "阅读", targetWords: ["book"], sentenceFrames: [], anchorBook: "B-51 I Read a Book" }
  };
  const legacyRounds = OPWWeek1CourseCore.buildRounds(baseDay);
  const expandedRounds = OPWWeek1CourseCore.buildRounds({
    ...baseDay,
    heartWords: { ...baseDay.heartWords, extensionWords: ["blue"], extensionReview: [] }
  });
  assert.deepEqual(expandedRounds.slice(0, legacyRounds.length), legacyRounds);
  assert.deepEqual(expandedRounds.slice(legacyRounds.length).map((round) => [round.label, round.mode, round.word]), [
    ["高频词加餐", "study", "blue"],
    ["高频词加餐", "spell", "blue"]
  ]);
  assert.equal(expandedRounds.at(-1).prompt, "The sky is __.");
});

test("completed legacy days remain complete when new rounds are appended", () => {
  assert.equal(OPWWeek1CourseCore.restoredRoundIndex({ completedRounds: 20, completedAt: "2026-08-09T00:00:00Z" }, 30), 30);
  assert.equal(OPWWeek1CourseCore.restoredRoundIndex({ completedRounds: 12, completedAt: null }, 30), 12);
});

test("English rounds split into four independently selectable modules", () => {
  const rounds = OPWWeek1CourseCore.buildRounds({
    phonics: { words: [{ word: "cat", audio: { status: "unavailable" } }] },
    heartWords: { newWords: ["I"], review: [], extensionWords: ["blue"], extensionReview: [] },
    raz: { focus: "阅读", targetWords: ["book"], sentenceFrames: [], anchorBook: "B-51 I Read a Book" }
  });
  const modules = OPWWeek1CourseCore.groupRoundsByModule(rounds);
  assert.deepEqual(modules.map((module) => module.id), ["soundLab", "coreWords", "raz", "extraWords"]);
  assert.deepEqual(modules.map((module) => module.rounds.length), [1, 2, 2, 2]);
});

test("legacy linear progress migrates into module progress without shifting completed rounds", () => {
  const modules = [
    { id: "soundLab", rounds: [{}, {}] },
    { id: "coreWords", rounds: [{}, {}, {}] },
    { id: "raz", rounds: [{}, {}] },
    { id: "extraWords", rounds: [{}, {}] }
  ];
  const migrated = OPWWeek1CourseCore.moduleProgressFromSaved({ completedRounds: 4, updatedAt: "2026-08-10T00:00:00Z" }, modules);
  assert.equal(migrated.soundLab.completedRounds, 2);
  assert.equal(Boolean(migrated.soundLab.completedAt), true);
  assert.equal(migrated.coreWords.completedRounds, 2);
  assert.equal(migrated.coreWords.completedAt, null);
  assert.equal(migrated.raz.completedRounds, 0);
  assert.equal(migrated.extraWords.completedRounds, 0);
});

test("completed days from before the extension plan remain frozen", () => {
  const result = OPWWeek1CourseCore.extensionPlanForActivity({
    extensionWords: ["run"],
    extensionReview: ["blue", "play"]
  }, {
    completedAt: "2026-08-10T00:00:00Z",
    roundSchemaVersion: 5
  }, []);
  assert.equal(result.active, false);
  assert.deepEqual(result.heartWords.extensionWords, []);
  assert.deepEqual(result.heartWords.extensionReview, []);
});

test("the first unfinished day starts new extension words without old catch-up", () => {
  const result = OPWWeek1CourseCore.extensionPlanForActivity({
    extensionWords: ["green", "small"],
    extensionReview: ["blue", "run"]
  }, null, [{
    activityId: OPWWeek1CourseCore.activityId(1),
    record: { completedAt: "2026-08-09T00:00:00Z", learnedExtensionWords: ["blue"] }
  }]);
  assert.equal(result.active, true);
  assert.deepEqual(result.heartWords.extensionWords, ["green", "small"]);
  assert.deepEqual(result.heartWords.extensionReview, []);
});

test("later days only review extension words learned after activation", () => {
  const result = OPWWeek1CourseCore.extensionPlanForActivity({
    extensionWords: ["small"],
    extensionReview: ["blue", "green"]
  }, null, [{
    activityId: OPWWeek1CourseCore.activityId(3),
    record: {
      completedAt: "2026-08-11T00:00:00Z",
      extensionPlanVersion: 1,
      learnedExtensionWords: ["green"]
    }
  }]);
  assert.deepEqual(result.heartWords.extensionReview, ["green"]);
});

test("extension reviews are never turned into new-word study rounds", () => {
  const rounds = OPWWeek1CourseCore.buildRounds({
    phonics: { words: [] },
    heartWords: { newWords: [], review: [], extensionWords: ["run"], extensionReview: ["blue"] },
    raz: { targetWords: [], sentenceFrames: [] }
  });
  const extra = rounds.filter((round) => round.label === "高频词加餐");
  assert.deepEqual(extra.map((round) => [round.mode, round.word]), [
    ["study", "run"], ["spell", "run"], ["spell", "blue"]
  ]);
});

test("a verified clip is only labelled playable when this device has its audio asset", () => {
  const listenRound = { mode: "listen" };
  assert.equal(OPWWeek1CourseCore.availabilityLabel(listenRound, false), "需导入");
  assert.equal(OPWWeek1CourseCore.availabilityLabel(listenRound, true), "可播放");
  assert.equal(OPWWeek1CourseCore.availabilityLabel({ mode: "read" }, false), "拼读");
});
