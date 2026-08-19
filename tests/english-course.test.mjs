import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

await import("../week1-course-core.js");
const course = JSON.parse(readFileSync(new URL("../curriculum/english-course.json", import.meta.url), "utf8"));
const phonicsReviewQueue = JSON.parse(readFileSync(new URL("../tts-audio-review/queue.json", import.meta.url), "utf8"));
const staticAudioManifest = JSON.parse(readFileSync(new URL("../course-audio/manifest.json", import.meta.url), "utf8"));

test("the English course fits the available 26-day window without fixing calendar dates", () => {
  assert.equal(course.schemaVersion, 6);
  assert.equal(course.days.length, 26);
  assert.equal(course.schedule.mode, "starts-when-child-begins");
  assert.equal(course.schedule.durationDays, 26);
  assert.deepEqual(course.schedule.omittedLightInputCurriculumDays, [7, 14]);
  assert.deepEqual(course.days.map((day) => day.day), Array.from({ length: 26 }, (_, index) => index + 1));
  assert.deepEqual(course.days.map((day) => day.week), [
    ...Array(6).fill(1), ...Array(6).fill(2), ...Array(7).fill(3), ...Array(7).fill(4)
  ]);
  assert.equal(course.days.some((day) => "date" in day), false);
});

test("phonics difficulty progresses from short vowels to silent e", () => {
  assert.deepEqual(course.days.filter((day) => day.dayOfWeek === 1).map((day) => day.phonics.pattern), [
    "short-a", "digraph-sh", "initial-s-blends", "silent-e-a"
  ]);
  assert.equal(course.days.filter((day) => day.week === 2).every((day) => /digraph|ng-nk/.test(day.phonics.pattern)), true);
  assert.equal(course.days.filter((day) => day.week === 3).every((day) => day.phonics.pattern.includes("blend")), true);
  assert.equal(course.days.filter((day) => day.week === 4).every((day) => /silent-e|review|showcase/.test(day.phonics.pattern)), true);
});

test("weeks 2 through 4 retain the RAZ plan themes and anchor books", () => {
  assert.deepEqual(course.days.filter((day) => day.dayOfWeek === 1).map((day) => day.raz.anchorBook), [
    "B-51 I Read a Book", "B-28 Ten", "B-73 It Is School Time", "C-91 Who, Who, Who?"
  ]);
  assert.equal(course.days.find((day) => day.curriculumDay === 9).raz.focus, "动物吃什么/住哪里");
  assert.equal(course.days.find((day) => day.curriculumDay === 17).raz.focus, "家庭和朋友");
  assert.equal(course.days.find((day) => day.curriculumDay === 25).raz.focus, "信息类综合阅读");
  assert.equal(course.policy.razSource.includes("4-Week Plan"), true);
});

test("the expanded course introduces 200 contextual words at ten per teaching day", () => {
  const coreCounts = [1, 2, 3, 4].map((week) => course.days
    .filter((day) => day.week === week)
    .reduce((total, day) => total + day.heartWords.newWords.length, 0));
  const extensionCounts = [1, 2, 3, 4].map((week) => course.days
    .filter((day) => day.week === week)
    .reduce((total, day) => total + day.heartWords.extensionWords.length, 0));
  assert.deepEqual(coreCounts, [25, 25, 25, 25]);
  assert.deepEqual(extensionCounts, [25, 25, 25, 25]);
  assert.equal(course.days.filter((day) => day.dayOfWeek <= 5).every((day) => day.heartWords.newWords.length === 5), true);
  assert.equal(course.days.filter((day) => day.dayOfWeek <= 5).every((day) => day.heartWords.extensionWords.length === 5), true);
  assert.equal(course.days.filter((day) => day.dayOfWeek > 5).every((day) => day.heartWords.newWords.length === 0), true);
  assert.equal(course.days.filter((day) => day.dayOfWeek > 5).every((day) => day.heartWords.extensionWords.length === 0), true);
});

test("heart-word reviews only use introduced words and include expanding intervals", () => {
  const introduced = new Set();
  const introducedExtensions = new Set();
  for (const day of course.days) {
    for (const word of day.heartWords.review) {
      assert.equal(introduced.has(word), true, `day ${day.day} reviews unintroduced ${word}`);
    }
    for (const word of day.heartWords.newWords) introduced.add(word);
    for (const word of day.heartWords.extensionReview) {
      assert.equal(introducedExtensions.has(word), true, `day ${day.day} reviews unintroduced extension ${word}`);
    }
    for (const word of day.heartWords.extensionWords) introducedExtensions.add(word);
  }
  assert.equal(course.days[21].heartWords.review.includes("when"), false);
  assert.deepEqual(course.days[1].heartWords.review, course.days[0].heartWords.newWords);
  assert.equal(course.days[18].heartWords.review.includes("my"), true);
  assert.equal(course.days[25].heartWords.review.includes("my"), true);
});

test("day 12 is a measurable stage review of the first eleven days", () => {
  const reviewDay = course.days.find((day) => day.day === 12);
  const review = reviewDay.stageReview;
  assert.deepEqual(review.lessonDays, Array.from({ length: 11 }, (_, index) => index + 1));
  assert.equal(review.phonicsQuiz.length, 20);
  assert.equal(review.phonicsQuiz.filter((item) => item.mode === "listen").length, 12);
  assert.equal(review.phonicsQuiz.filter((item) => item.mode === "spell").length, 8);
  assert.equal(review.coreWords.length, 15);
  assert.equal(review.extensionWords.length, 15);
  assert.equal(review.skipRaz, true);
  assert.equal(reviewDay.raz.assignment, null);
  assert.deepEqual(reviewDay.raz.targetWords, []);
  assert.deepEqual(reviewDay.raz.sentenceFrames, []);
  for (const item of review.phonicsQuiz) {
    const sourceDay = course.days.find((day) => day.day === item.sourceDay);
    const sourceWord = sourceDay.phonics.words.find((entry) => entry.word === item.word);
    assert.equal(sourceWord?.audio?.status, "verified", `${item.sourceDay}:${item.word}`);
  }
});

test("later teaching days mix new words with familiar spaced reviews", () => {
  for (const day of course.days.filter((entry) => entry.day >= 13 && entry.heartWords.newWords.length)) {
    assert.equal(day.heartWords.review.length >= 7, true, `day ${day.day}: core review`);
    assert.equal(day.heartWords.extensionReview.length >= 5, true, `day ${day.day}: extension review`);
  }
  for (const dayNumber of [18, 19, 25, 26]) {
    const day = course.days.find((entry) => entry.day === dayNumber);
    assert.equal(day.heartWords.newWords.length, 0, `day ${dayNumber}: no core new words`);
    assert.equal(day.heartWords.extensionWords.length, 0, `day ${dayNumber}: no extension new words`);
    assert.equal(day.heartWords.review.length + day.heartWords.extensionReview.length, 20, `day ${dayNumber}: review total`);
  }
});

test("every day builds a substantial mixed English-island session", () => {
  for (const day of course.days) {
    const rounds = OPWWeek1CourseCore.buildRounds(day);
    const kinds = new Set(rounds.map((round) => round.kind));
    assert.equal(kinds.has("phonics"), true, `day ${day.day}`);
    assert.equal(kinds.has("heart"), true, `day ${day.day}`);
    assert.equal(kinds.has("raz"), day.day !== 12, `day ${day.day}`);
    assert.equal(rounds.length >= 10, true, `day ${day.day} has ${rounds.length} rounds`);
    assert.equal(rounds.some((round) => ["book", "book-choice"].includes(round.mode)), day.day !== 12, `day ${day.day}`);
  }
});

test("only day 12 has the three stage-review modules and day 13 restores all four normal modules", () => {
  const moduleIds = (dayNumber) => OPWWeek1CourseCore.groupRoundsByModule(
    OPWWeek1CourseCore.buildRounds(course.days.find((day) => day.day === dayNumber))
  ).map((module) => module.id);
  assert.deepEqual(moduleIds(11), ["soundLab", "coreWords", "raz", "extraWords"]);
  assert.deepEqual(moduleIds(12), ["reviewLessons", "soundLab", "coreWords"]);
  assert.deepEqual(moduleIds(13), ["soundLab", "coreWords", "raz", "extraWords"]);
});

test("the complete heart-word bank and every assigned RAZ book are actionable", () => {
  assert.equal(course.heartWords.words.length, 200);
  assert.equal(course.heartWords.words.filter((entry) => entry.tier === "core").length, 100);
  assert.equal(course.heartWords.words.filter((entry) => entry.tier === "extension").length, 100);
  assert.equal(course.heartWords.words.every((entry) => entry.word && entry.sentence), true);
  assert.equal(course.summary.laterWeeksAudioStatus, "tts-auto-applied");
  for (const day of course.days) {
    const rounds = OPWWeek1CourseCore.buildRounds(day);
    const assignment = day.raz.assignment;
    if (!assignment) {
      assert.equal(day.day, 12);
      assert.equal(rounds.some((round) => round.kind === "raz"), false);
    } else if (assignment.mode === "fixed") {
      assert.equal(rounds.filter((round) => round.mode === "book").length, assignment.books.length, `day ${day.day}`);
    } else {
      const requiredChoices = assignment.groups.reduce((sum, group) => sum + group.count, 0);
      assert.equal(rounds.filter((round) => round.mode === "book").length, (assignment.fixedBooks || []).length, `day ${day.day}`);
      assert.equal(rounds.filter((round) => round.mode === "book-choice").length, requiredChoices, `day ${day.day}`);
      assert.equal(assignment.groups.every((group) => group.choices.every((book) => /^[B-F]-\d+ /.test(book))), true, `day ${day.day}`);
    }
  }
});

test("all 200 high-frequency words have playable static pronunciation assets", () => {
  const heartAssets = course.heartWords.words.map((entry) => entry.audio);
  assert.equal(heartAssets.every((audio) => audio?.status === "verified" && audio.kind === "heart-word" && audio.assetId), true);
  assert.equal(new Set(heartAssets.map((audio) => audio.assetId)).size, 200);
  assert.equal(Object.values(staticAudioManifest.assets).filter((asset) => asset.kind === "heart-word").length, 200);
  for (const audio of heartAssets) {
    const staticAsset = staticAudioManifest.assets[audio.assetId];
    assert.equal(staticAsset?.url, `./course-audio/${audio.assetId}.mp3`);
    assert.equal(staticAsset?.bytes > 1000, true);
  }
});

test("Oxford listening rounds use independent reviewed clips instead of whole tracks", () => {
  const rounds = course.days.flatMap((day) => OPWWeek1CourseCore.buildRounds(day));
  const oxfordRounds = rounds.filter((round) => round.mode === "listen" && round.audio?.itemId);
  assert.equal(oxfordRounds.length > 0, true);
  for (const round of oxfordRounds) {
    const staticAsset = staticAudioManifest.assets[round.assetId];
    assert.equal(staticAsset?.kind, "oxford-clip", `${round.word}:${round.assetId}`);
    assert.equal(staticAsset?.bytes > 1000, true, `${round.word}:${round.assetId}`);
    assert.equal(round.audio.clip.startSeconds, 0, `${round.word}:${round.assetId}`);
    assert.equal(round.audio.clip.endSeconds > 0 && round.audio.clip.endSeconds < 6, true, `${round.word}:${round.assetId}`);
  }
});

test("Excel review-day choice rules are preserved instead of replaced with invented fixed books", () => {
  assert.equal(course.days.find((day) => day.curriculumDay === 6).raz.assignment.rule, "任选本周最喜欢的 4 本，再读 B-38 We Pack a Picnic");
  assert.equal(course.days.find((day) => day.curriculumDay === 13).raz.assignment, null);
  assert.equal(course.days.find((day) => day.curriculumDay === 20).raz.assignment.groups.length, 4);
  assert.deepEqual(course.days.find((day) => day.curriculumDay === 27).raz.assignment.groups.map((group) => group.count), [2, 2, 2, 2]);
  assert.equal(course.days.find((day) => day.curriculumDay === 28).raz.assignment.groups[0].count, 3);
});

test("only verified clips can become listening rounds in the extended course", () => {
  for (const day of course.days) {
    for (const word of day.phonics.words) {
      assert.equal(["verified", "unavailable"].includes(word.audio.status), true, `${day.day}:${word.word}`);
      if (word.audio.status === "verified") {
        assert.equal(Boolean(word.audio.clip), true, `${day.day}:${word.word}`);
        assert.equal(Boolean(word.audio.assetId || (word.audio.level && word.audio.disc && word.audio.track)), true, `${day.day}:${word.word}`);
      }
    }
  }
});

test("verified fallback word audio can coexist with Oxford track clips", () => {
  const fallbackEntries = course.days.flatMap((day) => day.phonics.words).filter((entry) => entry.audio.assetId);
  assert.equal(fallbackEntries.every((entry) => entry.audio.assetId === `phonics-word-${entry.word}`), true);
  assert.equal(course.summary.verifiedFallbackWords, new Set(fallbackEntries.map((entry) => entry.word)).size);
});

test("weeks 2 through 4 use at most one human-verified clip per word", () => {
  const laterAudioByWeekAndWord = new Map();
  for (const day of course.days.filter((entry) => entry.week >= 2)) {
    for (const entry of day.phonics.words) {
      if (entry.audio.status !== "verified") continue;
      const key = `${day.week}:${entry.word}`;
      const signature = JSON.stringify(entry.audio);
      if (laterAudioByWeekAndWord.has(key)) assert.equal(laterAudioByWeekAndWord.get(key), signature, key);
      laterAudioByWeekAndWord.set(key, signature);
    }
  }
  const expectedKeys = new Set(course.days.filter((entry) => entry.week >= 2)
    .flatMap((day) => day.phonics.words
      .filter((entry) => entry.audio.status === "verified")
      .map((entry) => `${day.week}:${entry.word}`)));
  assert.equal(laterAudioByWeekAndWord.size, expectedKeys.size);
});

test("the compact extensions cover the four high-value phonics groups", () => {
  const patterns = new Set(course.days.flatMap((day) => (day.phonics.extensions || []).map((entry) => entry.pattern)));
  for (const expected of [
    "final-ck", "initial-qu", "final-tch", "initial-ph",
    "vowel-team-ai", "vowel-team-ay", "vowel-team-ee", "vowel-team-ea", "vowel-team-oa", "vowel-team-ow-long-o",
    "r-controlled-ar", "r-controlled-or", "r-controlled-er", "r-controlled-ir", "r-controlled-ur",
    "vowel-team-oo-long", "vowel-team-oo-short", "diphthong-ou", "diphthong-ow", "diphthong-oi", "diphthong-oy"
  ]) assert.equal(patterns.has(expected), true, expected);
  assert.equal(course.schedule.durationDays, 26);
  assert.equal(course.summary.extensionWords, 46);
  assert.equal(Math.max(...course.days.map((day) => day.phonics.words.length)) <= 8, true);
});

test("generated TTS enters the course automatically without a human-review gate", () => {
  const entries = course.days.flatMap((day) => day.phonics.words);
  const unavailableWords = new Set(entries.filter((entry) => entry.audio.status === "unavailable").map((entry) => entry.word));
  const autoTtsEntries = entries.filter((entry) => entry.audio.verificationSource === "tts-auto-policy");
  assert.equal(unavailableWords.size, 0);
  assert.equal(autoTtsEntries.length > 0, true);
  assert.equal(autoTtsEntries.every((entry) => entry.audio.status === "verified" && entry.audio.sourceType === "tts"), true);
  assert.equal(phonicsReviewQueue.items.every((entry) => entry.sourceType !== "tts" || entry.reviewStatus === "auto-approved"), true);
  assert.equal(course.summary.verifiedFallbackWords, 85);
});
