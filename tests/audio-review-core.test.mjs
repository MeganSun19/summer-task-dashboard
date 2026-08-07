import assert from "node:assert/strict";
import test from "node:test";

await import("../audio-review-core.js");

const items = [
  { level: 1, disc: 1, track: 5, wordIndex: 2, priority: 0, word: "ant", startSeconds: 1, endSeconds: 1.5 },
  { level: 1, disc: 2, track: 2, wordIndex: 4, priority: 1, word: "monkey", startSeconds: 2, endSeconds: 2.5 }
];

test("review item IDs remain stable across sessions", () => {
  assert.equal(OPWAudioReviewCore.itemId(items[0]), "l1-d1-t5-w2");
  assert.equal(OPWAudioReviewCore.itemId({ ...items[0], reviewRevision: 2 }), "l1-d1-t5-w2-r2");
});

test("review summaries ignore results from an earlier queue revision", () => {
  const revised = [{ ...items[0], reviewRevision: 2 }];
  const staleResults = {
    "l1-d1-t5-w2": OPWAudioReviewCore.reviewRecord(items[0], "boundary-error", "旧边界")
  };
  assert.deepEqual(OPWAudioReviewCore.summarize(revised, staleResults), {
    total: 1,
    reviewed: 0,
    pending: 1,
    verified: 0,
    "word-error": 0,
    "boundary-error": 0,
    skipped: 0
  });
});

test("pending filters exclude saved results", () => {
  const results = {
    "l1-d1-t5-w2": OPWAudioReviewCore.reviewRecord(items[0], "verified", "", "2026-08-03T00:00:00.000Z")
  };
  const pending = OPWAudioReviewCore.filterItems(items, {
    priority: "all", level: "1", disc: "all", status: "pending"
  }, results);
  assert.deepEqual(pending, [items[1]]);
  assert.deepEqual(OPWAudioReviewCore.summarize(items, results), {
    total: 2,
    reviewed: 1,
    pending: 1,
    verified: 1,
    "word-error": 0,
    "boundary-error": 0,
    skipped: 0
  });
});

test("review records retain correction notes and source coordinates", () => {
  const record = OPWAudioReviewCore.reviewRecord(items[1], "word-error", "正确词：Mary", "2026-08-03T00:00:00.000Z");
  assert.equal(record.note, "正确词：Mary");
  assert.equal(record.source.disc, 2);
  assert.equal(record.source.wordIndex, 4);
});

test("word and boundary errors remain distinct in the review summary", () => {
  const results = {
    "l1-d1-t5-w2": OPWAudioReviewCore.reviewRecord(items[0], "word-error", "应为 bear"),
    "l1-d2-t2-w4": OPWAudioReviewCore.reviewRecord(items[1], "boundary-error", "开头太早")
  };
  const summary = OPWAudioReviewCore.summarize(items, results);
  assert.equal(summary.verified, 0);
  assert.equal(summary["word-error"], 1);
  assert.equal(summary["boundary-error"], 1);
});

test("issue filters return only word and boundary errors", () => {
  const results = {
    "l1-d1-t5-w2": OPWAudioReviewCore.reviewRecord(items[0], "word-error", ""),
    "l1-d2-t2-w4": OPWAudioReviewCore.reviewRecord(items[1], "verified", "")
  };
  const issues = OPWAudioReviewCore.filterItems(items, {
    priority: "all", level: "1", disc: "all", status: "issues"
  }, results);
  assert.deepEqual(issues, [items[0]]);
});

test("review records retain the playback window used for verification", () => {
  const item = {
    ...items[0],
    reviewClip: { startSeconds: 0.8, endSeconds: 1.7 },
    activeReviewClip: { startSeconds: 0.5, endSeconds: 2.1 }
  };
  const record = OPWAudioReviewCore.reviewRecord(item, "verified", "");
  assert.deepEqual(record.source.reviewClip, { startSeconds: 0.5, endSeconds: 2.1 });
});

test("review queue validation rejects empty fallback responses", () => {
  assert.throws(() => OPWAudioReviewCore.validateQueuePayload({}), /有效的 Oxford 试听清单/);
  assert.deepEqual(OPWAudioReviewCore.validateQueuePayload({ summary: { total: 0 }, items: [] }), []);
  assert.equal(OPWAudioReviewCore.validateQueuePayload({
    items: [{ ...items[0], reviewClip: { startSeconds: 0.8, endSeconds: 1.7 } }]
  }).length, 1);
});
