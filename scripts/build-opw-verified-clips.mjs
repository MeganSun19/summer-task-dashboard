import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { OPW_COURSE_CATALOG_URL, loadCourseCatalog } from "../curriculum/opw-course-catalog.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const queuePath = join(projectRoot, "curriculum", "opw-listening-review-priority.json");
const outputPath = join(projectRoot, "curriculum", "opw-level1-verified-clips.json");
const resultsPath = process.argv[2] ? resolve(process.argv[2]) : null;

if (!resultsPath) {
  throw new Error("Usage: node scripts/build-opw-verified-clips.mjs <review-results.json>");
}

const queuePayload = JSON.parse(readFileSync(queuePath, "utf8"));
const reviewPayload = JSON.parse(readFileSync(resultsPath, "utf8"));
if (!Array.isArray(queuePayload.items) || !Array.isArray(reviewPayload.results)) {
  throw new Error("Review queue or results payload is invalid");
}

const courseCatalog = loadCourseCatalog();
const tracks = new Map();
for (const level of courseCatalog.levels) {
  for (const track of level.tracks) tracks.set(`${level.level}-${track.disc}-${track.track}`, track);
}

const queueById = new Map(queuePayload.items.map((item) => [
  `l${item.level}-d${item.disc}-t${item.track}-w${item.wordIndex}`,
  item
]));
const items = [];

for (const result of reviewPayload.results) {
  const candidate = queueById.get(result.itemId);
  if (!candidate) throw new Error(`Review result has no matching queue item: ${result.itemId}`);
  if (candidate.level !== 1 || candidate.priority !== 0 || result.status !== "verified") continue;

  const track = tracks.get(`${candidate.level}-${candidate.disc}-${candidate.track}`);
  if (!track) throw new Error(`Verified item has no matching course track: ${result.itemId}`);
  const reviewedClip = result.source?.reviewClip;
  const clip = reviewedClip && Number.isFinite(reviewedClip.startSeconds) && Number.isFinite(reviewedClip.endSeconds)
    ? reviewedClip
    : candidate.reviewClip;

  items.push({
    itemId: result.itemId,
    level: candidate.level,
    sectionId: candidate.sectionId,
    sectionTitle: candidate.sectionTitle,
    focusPatterns: candidate.focusPatterns,
    disc: candidate.disc,
    track: candidate.track,
    sourceFile: track.sourceFile,
    word: candidate.word,
    normalizedWord: candidate.normalizedWord,
    confidence: candidate.confidence,
    wordTimestamp: {
      startSeconds: candidate.startSeconds,
      endSeconds: candidate.endSeconds
    },
    clip: {
      startSeconds: clip.startSeconds,
      endSeconds: clip.endSeconds
    },
    verifiedAt: result.reviewedAt,
    verificationPass: reviewedClip ? 2 : 1
  });
}

items.sort((left, right) => (
  left.disc - right.disc || left.track - right.track || left.clip.startSeconds - right.clip.startSeconds
));

const reviewedLevel1P0 = reviewPayload.results.filter((result) => {
  const candidate = queueById.get(result.itemId);
  return candidate?.level === 1 && candidate?.priority === 0;
});
const rejected = reviewedLevel1P0.filter((result) => result.status !== "verified");

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceCatalog: basename(fileURLToPath(OPW_COURSE_CATALOG_URL)),
  sourceQueue: basename(queuePath),
  sourceReviewResults: basename(resultsPath),
  policy: {
    included: "Level 1 P0 candidates marked verified after human listening review",
    excluded: "word-error, boundary-error, and skipped candidates are omitted from items",
    originalAudio: "Oxford MP3 files are referenced only and are never modified or deleted"
  },
  summary: {
    reviewedLevel1P0: reviewedLevel1P0.length,
    verified: items.length,
    excluded: rejected.length,
    excludedWordError: rejected.filter((item) => item.status === "word-error").length,
    excludedBoundaryError: rejected.filter((item) => item.status === "boundary-error").length,
    verifiedOnSecondPass: items.filter((item) => item.verificationPass === 2).length
  },
  items
};

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${outputPath}: ${JSON.stringify(output.summary)}`);
