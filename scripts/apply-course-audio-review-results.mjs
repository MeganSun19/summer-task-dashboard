import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const reviewRoot = join(projectRoot, "tmp", "course-audio-review");
const outputPath = join(projectRoot, "curriculum", "opw-weeks2-4-verified-clips.json");

const itemId = (item) => {
  const base = `l${item.level}-d${item.disc}-t${item.track}-w${item.wordIndex}`;
  return item.reviewRevision ? `${base}-r${item.reviewRevision}` : base;
};

const selectedClips = [];
const weekSummaries = [];

for (const week of [2, 3, 4]) {
  const weekDirectory = join(reviewRoot, `week-${week}`);
  const queuePath = join(weekDirectory, "review-queue.json");
  const resultsPath = join(weekDirectory, "review-results.json");
  if (!existsSync(queuePath) || !existsSync(resultsPath)) {
    throw new Error(`缺少第 ${week} 周审核队列或人工审核结果`);
  }

  const queue = JSON.parse(readFileSync(queuePath, "utf8"));
  const review = JSON.parse(readFileSync(resultsPath, "utf8"));
  const candidatesById = new Map(queue.items.map((item) => [itemId(item), item]));
  if (review.summary?.pending !== 0 || review.results.length !== queue.items.length) {
    throw new Error(`第 ${week} 周尚未完成全部人工审核`);
  }

  const verifiedByWord = new Map();
  for (const result of review.results) {
    const candidate = candidatesById.get(result.itemId);
    if (!candidate) throw new Error(`第 ${week} 周审核结果无法匹配候选：${result.itemId}`);
    if (result.status !== "verified") continue;
    const word = candidate.normalizedWord || candidate.word.toLowerCase();
    if (!verifiedByWord.has(word)) verifiedByWord.set(word, []);
    verifiedByWord.get(word).push({ candidate, result });
  }

  const selectedWords = [];
  let redundantVerified = 0;
  for (const [word, choices] of verifiedByWord) {
    choices.sort((left, right) => (
      left.candidate.candidateRank - right.candidate.candidateRank ||
      right.candidate.confidence - left.candidate.confidence ||
      (left.candidate.reviewClip.endSeconds - left.candidate.reviewClip.startSeconds) -
        (right.candidate.reviewClip.endSeconds - right.candidate.reviewClip.startSeconds)
    ));
    const { candidate, result } = choices[0];
    const clip = result.source?.reviewClip || candidate.reviewClip;
    selectedClips.push({
      week,
      word: candidate.word,
      normalizedWord: word,
      itemId: result.itemId,
      candidateRank: candidate.candidateRank,
      level: candidate.level,
      disc: candidate.disc,
      track: candidate.track,
      sourceFile: candidate.sourceFile,
      confidence: candidate.confidence,
      clip,
      reviewedAt: result.reviewedAt,
      verificationSource: "human-review"
    });
    selectedWords.push(word);
    redundantVerified += choices.length - 1;
  }

  const targetWords = [...new Set(queue.items.map((item) => item.normalizedWord || item.word.toLowerCase()))];
  weekSummaries.push({
    week,
    reviewedCandidates: review.results.length,
    verifiedCandidates: review.results.filter((result) => result.status === "verified").length,
    selectedClips: selectedWords.length,
    redundantVerified,
    selectedWords: selectedWords.sort(),
    candidateWordsWithoutVerifiedClip: targetWords.filter((word) => !verifiedByWord.has(word)).sort(),
    unresolvedWordsWithoutCandidate: (queue.unresolved || []).map((entry) => entry.word).sort()
  });
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  policy: {
    selection: "Only human-verified candidates are eligible; exactly one clip is selected per week and word.",
    ranking: "When multiple candidates were verified, prefer the lowest candidate rank, then higher confidence, then the shorter review clip.",
    exclusions: "Word errors, boundary errors, skipped candidates, and unresolved words remain unavailable."
  },
  summary: {
    reviewedCandidates: weekSummaries.reduce((sum, item) => sum + item.reviewedCandidates, 0),
    verifiedCandidates: weekSummaries.reduce((sum, item) => sum + item.verifiedCandidates, 0),
    selectedClips: selectedClips.length,
    redundantVerified: weekSummaries.reduce((sum, item) => sum + item.redundantVerified, 0)
  },
  weeks: weekSummaries,
  selectedClips: selectedClips.sort((left, right) => left.week - right.week || left.normalizedWord.localeCompare(right.normalizedWord))
};

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`人工审核结果已去重：${payload.summary.verifiedCandidates} 个通过候选 → ${payload.summary.selectedClips} 个正式词片段`);

await import("./build-english-course.mjs");
