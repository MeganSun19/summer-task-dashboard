import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSchedulableSections, loadCourseCatalog } from "../curriculum/opw-course-catalog.mjs";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const outputPath = join(projectRoot, "curriculum", "opw-listening-review-priority.json");
const LOW_CONFIDENCE = 0.65;
const CORE_REPEAT_COUNT = 2;
const nonCoreWords = new Set([
  "a", "an", "and", "are", "at", "circle", "do", "does", "draw", "find", "four", "has",
  "have", "i", "in", "is", "it", "learn", "letter", "listen", "look", "my", "of", "on",
  "one", "page", "read", "repeat", "right", "say", "see", "sound", "that", "the", "then",
  "this", "three", "to", "trace", "two", "unit", "what", "whats", "which", "with", "word",
  "words", "write", "you", "your"
]);

function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

function focusTargets(patterns) {
  const targets = new Set();
  for (const pattern of patterns) {
    const leadingPattern = pattern.split(/\s|\//, 1)[0];
    const normalized = normalizeWord(leadingPattern);
    if (normalized) targets.add(normalized);
    if (normalized.length === 2 && normalized[0] === normalized[1]) targets.add(normalized[0]);
  }
  return targets;
}

function rounded(value) {
  return Number(value.toFixed(3));
}

const catalog = loadCourseCatalog();
const items = [];

for (const level of catalog.levels) {
  const sections = new Map(getSchedulableSections(catalog, level.level).map((section) => [section.id, section]));
  for (const track of level.tracks) {
    const section = sections.get(track.sectionId);
    if (!section) continue;

    const sectionFocusTargets = focusTargets(section.focusPatterns);
    const counts = new Map();
    for (const segment of track.wordSegments) {
      const word = normalizeWord(segment.word);
      if (word.length >= 2 && !nonCoreWords.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
    }
    const firstCoreOccurrence = new Set();

    for (const [index, segment] of track.wordSegments.entries()) {
      const word = normalizeWord(segment.word);
      const lowConfidence = segment.confidence < LOW_CONFIDENCE;
      const explicitFocusTarget = sectionFocusTargets.has(word);
      const repeatedCoreWord = word.length >= 2 && !nonCoreWords.has(word) && (counts.get(word) || 0) >= CORE_REPEAT_COUNT;
      const coreRepresentative = (explicitFocusTarget || repeatedCoreWord) && !firstCoreOccurrence.has(word);
      if (coreRepresentative) firstCoreOccurrence.add(word);
      if (!lowConfidence && !coreRepresentative) continue;

      const priority = lowConfidence && coreRepresentative ? 0 : coreRepresentative ? 1 : 2;
      items.push({
        priority,
        reason: priority === 0 ? "core-word-and-low-confidence" : priority === 1 ? "core-word" : "low-confidence",
        level: level.level,
        sectionId: section.id,
        sectionTitle: section.title,
        focusPatterns: section.focusPatterns,
        disc: track.disc,
        track: track.track,
        sourceFile: track.sourceFile,
        word: segment.word,
        normalizedWord: word,
        wordIndex: index,
        confidence: segment.confidence,
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        reviewClip: {
          startSeconds: rounded(Math.max(0, segment.startSeconds - 0.15)),
          endSeconds: rounded(Math.min(track.clip.endSeconds, segment.endSeconds + 0.2))
        },
        expandedReviewClip: {
          startSeconds: rounded(Math.max(0, segment.startSeconds - 0.5)),
          endSeconds: rounded(Math.min(track.clip.endSeconds, segment.endSeconds + 0.65))
        }
      });
    }
  }
}

items.sort((left, right) => (
  left.priority - right.priority ||
  left.level - right.level ||
  left.disc - right.disc ||
  left.track - right.track ||
  left.startSeconds - right.startSeconds
));

const summary = {
  total: items.length,
  priority0CoreAndLowConfidence: items.filter((item) => item.priority === 0).length,
  priority1CoreWords: items.filter((item) => item.priority === 1).length,
  priority2LowConfidence: items.filter((item) => item.priority === 2).length,
  disc1: items.filter((item) => item.disc === 1).length,
  disc2: items.filter((item) => item.disc === 2).length
};

const output = {
  schemaVersion: 1,
  generatedOn: "2026-08-03",
  sourceCatalog: "opw-full-audio-catalog.json",
  policy: {
    lowConfidenceBelow: LOW_CONFIDENCE,
    coreWordCandidate: `first occurrence of an explicit section focus target, or a non-instructional word repeated at least ${CORE_REPEAT_COUNT} times in one activity track`,
    ordering: ["core-word-and-low-confidence", "core-word", "low-confidence"],
    reviewWindows: {
      initial: "word timestamp with 0.15s leading and 0.20s trailing context",
      issueRecheck: "word timestamp with 0.50s leading and 0.65s trailing context"
    },
    note: "Machine-generated candidates only; mark reviewed results separately after listening."
  },
  summary,
  items
};

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${outputPath}: ${JSON.stringify(summary)}`);
