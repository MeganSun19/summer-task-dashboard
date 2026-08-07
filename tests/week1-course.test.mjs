import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const course = JSON.parse(readFileSync(new URL("../curriculum/week1-course.json", import.meta.url), "utf8"));
const queue = JSON.parse(readFileSync(new URL("../curriculum/opw-week1-review-queue.json", import.meta.url), "utf8"));

test("week 1 follows our course order and keeps RAZ Week 1 anchors", () => {
  assert.equal(course.days.length, 7);
  assert.deepEqual(course.days.map((day) => day.phonics.pattern), [
    "short-a", "short-a-at-ap", "short-i", "short-e", "short-o", "short-u", "short-vowel-review"
  ]);
  assert.equal(course.days[0].raz.anchorBook, "B-51 I Read a Book");
  assert.equal(course.days[5].raz.anchorBook, "B-38 We Pack a Picnic");
  assert.equal(course.days.every((day) => day.raz.anchorBook), true);
});

test("each teaching day has four decodable words and a listening activity", () => {
  for (const day of course.days.slice(0, 6)) {
    assert.equal(day.phonics.words.length, 4, `day ${day.day}`);
    assert.equal(day.listening.type, "listen-and-choose");
  }
  assert.equal(course.days[6].phonics.words.length, 6);
  assert.equal(course.days[6].listening.type, "short-vowel-sort");
});

test("only verified clips are ready and every pending source is in the minimal queue", () => {
  const pendingIds = new Set(queue.items.map((item) => `l${item.level}-d${item.disc}-t${item.track}-w${item.wordIndex}-r${item.reviewRevision}`));
  const wordEntries = course.days.flatMap((day) => day.phonics.words);
  for (const entry of wordEntries) {
    if (entry.audio.status === "pending-review") assert.equal(pendingIds.has(entry.audio.itemId), true, entry.word);
    if (entry.audio.status === "verified") assert.equal(entry.audio.level >= 1, true, entry.word);
  }
  assert.deepEqual(
    [...new Set(wordEntries.filter((entry) => entry.audio.status === "unavailable").map((entry) => entry.word))].sort(),
    ["in", "it", "man", "pet"]
  );
});

test("the completed second pass keeps accepted clips and drops troublesome audio", () => {
  assert.equal(course.summary.verifiedWords, 20);
  assert.equal(course.summary.pendingReviewWords, 0);
  assert.equal(course.summary.unavailableWords, 4);
  assert.equal(queue.summary.total, 0);
});

test("the focused queue has one unique candidate per uncovered word", () => {
  assert.equal(queue.summary.total, queue.items.length);
  assert.equal(new Set(queue.items.map((item) => `l${item.level}-d${item.disc}-t${item.track}-w${item.wordIndex}-r${item.reviewRevision}`)).size, queue.items.length);
  assert.equal(queue.items.every((item) => item.level === 2 || item.level === 3), true);
  assert.equal(queue.items.every((item) => item.curriculumReason === "required-for-week-1"), true);
});
