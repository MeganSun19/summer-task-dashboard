import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const curriculumDirectory = join(projectRoot, "curriculum");
const resultsPath = process.argv[2] ? resolve(process.argv[2]) : null;

if (!resultsPath) {
  throw new Error("Usage: node scripts/apply-week1-review-results.mjs <review-results.json>");
}

const reviewPayload = JSON.parse(readFileSync(resultsPath, "utf8"));
const currentQueue = JSON.parse(readFileSync(join(curriculumDirectory, "opw-week1-review-queue.json"), "utf8"));
const fullQueue = JSON.parse(readFileSync(join(curriculumDirectory, "opw-listening-review-priority.json"), "utf8"));
const existingStatePath = join(curriculumDirectory, "opw-week1-review-state.json");
const existingState = existsSync(existingStatePath)
  ? JSON.parse(readFileSync(existingStatePath, "utf8"))
  : { verifiedItems: [], excludedWords: [] };
if (!Array.isArray(reviewPayload.results) || !Array.isArray(currentQueue.items)) {
  throw new Error("Week 1 review queue or results payload is invalid");
}

const itemId = (item) => {
  const base = `l${item.level}-d${item.disc}-t${item.track}-w${item.wordIndex}`;
  return item.reviewRevision ? `${base}-r${item.reviewRevision}` : base;
};
const currentById = new Map(currentQueue.items.map((item) => [itemId(item), item]));
const fullById = new Map(fullQueue.items.map((item) => [itemId(item), item]));
const replacementIds = new Map([
  ["l2-d1-t44-w23", "l2-d1-t43-w27"],
  ["l2-d2-t4-w20", "l2-d2-t31-w58"]
]);

const isRevisionReview = reviewPayload.results.some((result) => /-r\d+$/.test(result.itemId));
const reviewedIds = new Set(reviewPayload.results.map((result) => result.itemId));
const verifiedItems = isRevisionReview ? [...existingState.verifiedItems] : [];
const excludedWords = isRevisionReview ? [...(existingState.excludedWords || [])] : [];
const correctionItems = isRevisionReview
  ? currentQueue.items.filter((item) => !reviewedIds.has(itemId(item)))
  : [];

for (const result of reviewPayload.results) {
  const candidate = currentById.get(result.itemId) || fullById.get(result.itemId);
  if (!candidate) throw new Error(`Review result has no matching Week 1 queue item: ${result.itemId}`);
  const currentWordItem = currentQueue.items.find((item) => item.normalizedWord === candidate.normalizedWord);
  const courseDays = currentWordItem?.courseDays || candidate.courseDays || [];
  const courseWords = currentWordItem?.courseWords || candidate.courseWords || [candidate.normalizedWord];

  if (result.status === "verified") {
    const clip = result.source?.reviewClip || candidate.reviewClip;
    verifiedItems.push({
      itemId: result.itemId,
      level: candidate.level,
      sectionId: candidate.sectionId,
      sectionTitle: candidate.sectionTitle,
      focusPatterns: candidate.focusPatterns,
      disc: candidate.disc,
      track: candidate.track,
      sourceFile: candidate.sourceFile,
      word: candidate.word,
      normalizedWord: candidate.normalizedWord,
      confidence: candidate.confidence,
      wordTimestamp: {
        startSeconds: candidate.startSeconds,
        endSeconds: candidate.endSeconds
      },
      clip,
      verifiedAt: result.reviewedAt,
      verificationSource: "week1-human-review"
    });
    continue;
  }

  if (result.status === "boundary-error") {
    if (isRevisionReview) {
      excludedWords.push({
        normalizedWord: candidate.normalizedWord,
        itemId: result.itemId,
        status: result.status,
        reviewerNote: result.note,
        excludedAt: result.reviewedAt,
        reason: "failed-second-pass"
      });
      continue;
    }
    correctionItems.push({
      ...candidate,
      reviewRevision: (candidate.reviewRevision || 1) + 1,
      reviewClip: {
        startSeconds: candidate.startSeconds,
        endSeconds: candidate.endSeconds
      },
      correction: {
        pass: 2,
        type: "tighten-to-word-timestamp",
        previousReviewClip: candidate.reviewClip,
        reviewerNote: result.note
      }
    });
    continue;
  }

  if (result.status === "word-error") {
    const replacementId = replacementIds.get(result.itemId);
    const replacement = replacementId ? fullById.get(replacementId) : null;
    if (!replacement) throw new Error(`No replacement configured for rejected word candidate: ${result.itemId}`);
    if (replacement.normalizedWord !== candidate.normalizedWord) {
      throw new Error(`Replacement ${replacementId} does not match rejected word ${candidate.normalizedWord}`);
    }
    correctionItems.push({
      ...replacement,
      reviewRevision: (candidate.reviewRevision || 1) + 1,
      reviewClip: {
        startSeconds: replacement.startSeconds,
        endSeconds: replacement.endSeconds
      },
      expandedReviewClip: replacement.reviewClip,
      courseDays,
      courseWords,
      curriculumReason: currentWordItem?.curriculumReason || candidate.curriculumReason || "required-for-week-1",
      correction: {
        pass: 2,
        type: "replacement-candidate",
        replacesItemId: result.itemId,
        reviewerNote: result.note
      }
    });
    continue;
  }

  throw new Error(`Unsupported review status for ${result.itemId}: ${result.status}`);
}

const state = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceReviewResults: basename(resultsPath),
  policy: {
    verified: "Only clips marked verified by the human reviewer are ready for child use.",
    corrections: "Boundary errors use exact machine word timestamps; word errors use a different isolated-word candidate and require a second human pass."
  },
  summary: {
    reviewed: reviewPayload.results.length,
    verified: verifiedItems.length,
    pendingSecondPass: correctionItems.length,
    excludedAfterSecondPass: excludedWords.length,
    tightenedBoundaries: correctionItems.filter((item) => item.correction.type === "tighten-to-word-timestamp").length,
    replacementCandidates: correctionItems.filter((item) => item.correction.type === "replacement-candidate").length
  },
  verifiedItems,
  correctionItems,
  excludedWords
};

writeFileSync(join(curriculumDirectory, "opw-week1-review-state.json"), `${JSON.stringify(state, null, 2)}\n`);
console.log(`Wrote opw-week1-review-state.json: ${JSON.stringify(state.summary)}`);

await import("./build-week1-course.mjs");
