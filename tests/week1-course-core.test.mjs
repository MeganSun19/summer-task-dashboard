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

test("a verified clip is only labelled playable when this device has its audio asset", () => {
  const listenRound = { mode: "listen" };
  assert.equal(OPWWeek1CourseCore.availabilityLabel(listenRound, false), "需导入");
  assert.equal(OPWWeek1CourseCore.availabilityLabel(listenRound, true), "可播放");
  assert.equal(OPWWeek1CourseCore.availabilityLabel({ mode: "read" }, false), "拼读");
});
