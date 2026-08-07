import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildSectionAudioTask,
  getSchedulableSections,
  loadCourseCatalog,
  OPW_COURSE_CATALOG_URL
} from "../curriculum/opw-course-catalog.mjs";

test("course data source is the full-book catalog", () => {
  assert.equal(OPW_COURSE_CATALOG_URL.pathname.endsWith("/opw-full-audio-catalog.json"), true);
  const catalog = loadCourseCatalog();
  assert.equal(catalog.schemaVersion, 3);
  assert.equal(catalog.levels.length, 3);
});

test("all book sections, including Disc 2, are schedulable", () => {
  const catalog = loadCourseCatalog();
  for (const level of catalog.levels) {
    const sections = getSchedulableSections(catalog, level.level);
    assert.equal(sections.length, 12, `L${level.level} should expose all units and reviews`);
    assert.equal(sections.some((section) => section.disc === 2), true);
    assert.equal(sections.some((section) => section.id === "unit-8"), true);
  }
});

test("a Disc 2 section produces playable course track references", () => {
  const task = buildSectionAudioTask(loadCourseCatalog(), 1, "unit-5");
  assert.equal(task.disc, 2);
  assert.deepEqual(task.trackRange, [2, 13]);
  assert.equal(task.tracks.length, 12);
  assert.equal(task.tracks.every((track) => track.disc === 2), true);
  assert.equal(task.tracks[0].sourceFile, "OPW_SB1_Disc2_Track02.mp3");
});

test("listening review queue is ordered and covers Disc 2", () => {
  const queueUrl = new URL("../curriculum/opw-listening-review-priority.json", import.meta.url);
  const queue = JSON.parse(readFileSync(queueUrl, "utf8"));
  assert.equal(queue.sourceCatalog, "opw-full-audio-catalog.json");
  assert.equal(queue.summary.total, queue.items.length);
  assert.equal(queue.summary.disc2 > 0, true);
  assert.deepEqual([...new Set(queue.items.map((item) => item.priority))], [0, 1, 2]);
  assert.equal(queue.items.every((item) => item.disc === 1 || item.disc === 2), true);
  assert.equal(queue.items.every((item) => item.expandedReviewClip.startSeconds <= item.reviewClip.startSeconds), true);
  assert.equal(queue.items.every((item) => item.expandedReviewClip.endSeconds >= item.reviewClip.endSeconds), true);
});

test("Level 1 verified clip set contains only curated P0 items", () => {
  const verifiedUrl = new URL("../curriculum/opw-level1-verified-clips.json", import.meta.url);
  const verified = JSON.parse(readFileSync(verifiedUrl, "utf8"));
  assert.equal(verified.summary.reviewedLevel1P0, 188);
  assert.equal(verified.summary.verified, 143);
  assert.equal(verified.summary.excluded, 45);
  assert.equal(verified.items.length, 143);
  assert.equal(new Set(verified.items.map((item) => item.itemId)).size, 143);
  assert.equal(verified.items.every((item) => item.level === 1), true);
  assert.equal(verified.items.every((item) => item.clip.startSeconds >= 0 && item.clip.endSeconds > item.clip.startSeconds), true);
});
