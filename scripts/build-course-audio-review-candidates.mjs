import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const workspaceRoot = dirname(projectRoot);
const course = JSON.parse(readFileSync(join(projectRoot, "curriculum", "english-course.json")));
const catalog = JSON.parse(readFileSync(join(projectRoot, "curriculum", "opw-full-audio-catalog.json")));

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}
const week = Number(args.get("--week") || 4);
if (!Number.isInteger(week) || week < 1 || week > 4) throw new Error(`无效周次：${week}`);
const timestampsPaths = String(args.get("--timestamps") || "").split(",").filter(Boolean).map((path) => resolve(path));
const targetedTimestampSets = timestampsPaths.map((path) => JSON.parse(readFileSync(path)));
const targetedTracks = new Map(targetedTimestampSets.flatMap((payload) => payload.tracks || []).map((track) => [
  `${track.level}-${track.disc}-${track.track}`,
  track
]));
const hasTargetedTimestamps = targetedTimestampSets.length > 0;
const fallbackLevels = new Set(String(args.get("--fallback-levels") || "")
  .split(",")
  .filter(Boolean)
  .map(Number));

const outputRoot = resolve(args.get("--output") || join(projectRoot, "tmp", "course-audio-review", `week-${week}`));
if (!outputRoot.startsWith(join(projectRoot, "tmp", "course-audio-review"))) {
  throw new Error("输出目录必须位于项目 tmp/course-audio-review 下");
}
rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(join(outputRoot, "clips"), { recursive: true });

function normalizeWord(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function candidateScore(candidate) {
  const duration = candidate.endSeconds - candidate.startSeconds;
  const idealDurationPenalty = Math.abs(duration - 0.65) * 0.12;
  const longPenalty = duration > 1.6 ? 2 : 0;
  const shortPenalty = duration < 0.18 ? 2 : 0;
  return candidate.confidence - idealDurationPenalty - longPenalty - shortPenalty;
}

const targetDays = course.days.filter((day) => day.week === week);
const targets = new Map();
for (const day of targetDays) {
  for (const entry of day.phonics?.words || []) {
    if (entry.audio?.status === "verified") continue;
    if (!targets.has(entry.word)) targets.set(entry.word, { word: entry.word, days: [] });
    targets.get(entry.word).days.push(day.day);
  }
}

const candidatesByWord = new Map([...targets].map(([word]) => [word, []]));
for (const level of catalog.levels) {
  for (const track of level.tracks) {
    const targetedTrack = targetedTracks.get(`${level.level}-${track.disc}-${track.track}`);
    if (hasTargetedTimestamps && !targetedTrack && !fallbackLevels.has(level.level)) continue;
    const targetedSegments = targetedTrack?.wordSegments || [];
    const wordSegments = [
      ...targetedSegments,
      ...(track.wordSegments || []).filter((legacy) => !targetedSegments.some((targeted) => (
        normalizeWord(targeted.word) === normalizeWord(legacy.word) &&
        Math.abs(targeted.startSeconds - legacy.startSeconds) < 0.2
      )))
    ];
    const sourceDirectory = join(workspaceRoot, "outputs", `oxford-phonics-world-level${level.level}-disc${track.disc}`);
    for (const [wordIndex, segment] of wordSegments.entries()) {
      const word = normalizeWord(segment.word);
      if (!candidatesByWord.has(word)) continue;
      if (segment.confidence < 0.4) continue;
      const wordDuration = segment.endSeconds - segment.startSeconds;
      if (wordDuration < 0.25 || wordDuration > 2) continue;
      candidatesByWord.get(word).push({
        level: level.level,
        disc: track.disc,
        track: track.track,
        sourceFile: track.sourceFile,
        sourcePath: join(sourceDirectory, track.sourceFile),
        sectionId: track.sectionId,
        sectionTitle: track.sectionTitle || track.sectionId,
        pdfPage: track.pdfPage,
        bookPage: track.bookPage,
        wordIndex,
        recognizedWord: segment.word,
        startSeconds: segment.startSeconds,
        endSeconds: segment.endSeconds,
        confidence: segment.confidence
      });
    }
  }
}

const items = [];
const unresolved = [];
for (const target of targets.values()) {
  const ranked = candidatesByWord.get(target.word)
    .map((candidate) => ({ ...candidate, score: candidateScore(candidate) }))
    .sort((left, right) => right.score - left.score || right.confidence - left.confidence);
  const selected = [];
  const usedTracks = new Set();
  for (const candidate of ranked) {
    const trackKey = `${candidate.level}-${candidate.disc}-${candidate.track}`;
    if (usedTracks.has(trackKey)) continue;
    selected.push(candidate);
    usedTracks.add(trackKey);
    if (selected.length === 3) break;
  }
  if (selected.length < 3) {
    for (const candidate of ranked) {
      if (selected.includes(candidate)) continue;
      selected.push(candidate);
      if (selected.length === 3) break;
    }
  }
  if (!selected.length) {
    unresolved.push({ ...target, reason: "no-exact-transcript-match" });
    continue;
  }
  selected.forEach((candidate, candidateIndex) => {
    const contextPadding = Math.min(0.2, Math.max(0, (3 - (candidate.endSeconds - candidate.startSeconds)) / 2));
    const clipStart = Math.max(0, candidate.startSeconds - Math.min(0.08, contextPadding));
    const clipEnd = candidate.endSeconds + Math.min(0.12, contextPadding);
    const clipDuration = clipEnd - clipStart;
    const id = `${target.word}-l${candidate.level}-d${candidate.disc}-t${String(candidate.track).padStart(2, "0")}-w${candidate.wordIndex}`;
    const filename = `${id}.mp3`;
    execFileSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", candidate.sourcePath,
      "-ss", clipStart.toFixed(3),
      "-t", clipDuration.toFixed(3),
      "-vn", "-codec:a", "libmp3lame", "-q:a", "3",
      join(outputRoot, "clips", filename)
    ]);
    items.push({
      id,
      targetWord: target.word,
      courseDays: target.days,
      candidateRank: candidateIndex + 1,
      level: candidate.level,
      disc: candidate.disc,
      track: candidate.track,
      sourceFile: candidate.sourceFile,
      sectionId: candidate.sectionId,
      sectionTitle: candidate.sectionTitle,
      pdfPage: candidate.pdfPage,
      bookPage: candidate.bookPage,
      wordIndex: candidate.wordIndex,
      recognizedWord: candidate.recognizedWord,
      confidence: candidate.confidence,
      sourceWindow: { startSeconds: candidate.startSeconds, endSeconds: candidate.endSeconds },
      clipWindow: { startSeconds: Number(clipStart.toFixed(3)), endSeconds: Number(clipEnd.toFixed(3)) },
      clipDurationSeconds: Number(clipDuration.toFixed(3)),
      qualityGate: candidate.confidence >= 0.75 && clipDuration <= 1.8 ? "review-ready" : "retranscribe-first",
      clipUrl: `./clips/${filename}`
    });
  });
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  course: course.title,
  week,
  policy: {
    scope: "course words without verified audio",
    selection: "highest-scoring exact normalized transcript matches; prefer distinct source tracks",
    score: "Whisper confidence minus duration penalty",
    clip: "0.25–2.00s recognized word, physically re-encoded with at most 3.00s total listening context",
    timestamps: hasTargetedTimestamps
      ? `targeted retranscription: ${[...new Set(targetedTimestampSets.map((item) => item.model))].join(", ")}`
      : "legacy full-catalog transcription",
    safety: "only human-accepted clips may be written back to the course"
  },
  summary: {
    targetWords: targets.size,
    wordsWithCandidates: new Set(items.map((item) => item.targetWord)).size,
    unresolvedWords: unresolved.length,
    candidateClips: items.length,
    reviewReadyClips: items.filter((item) => item.qualityGate === "review-ready").length,
    retranscribeFirstClips: items.filter((item) => item.qualityGate === "retranscribe-first").length
  },
  unresolved,
  items
};

writeFileSync(join(outputRoot, "manifest.json"), `${JSON.stringify(payload, null, 2)}\n`);
const reviewQueue = {
  schemaVersion: 1,
  generatedAt: payload.generatedAt,
  queueId: `course-week-${week}-targeted-${payload.generatedAt.slice(0, 10)}`,
  course: course.title,
  week,
  summary: {
    total: items.length,
    targetWords: payload.summary.targetWords,
    wordsWithCandidates: payload.summary.wordsWithCandidates,
    unresolvedWords: payload.summary.unresolvedWords
  },
  unresolved,
  items: items.map((item) => {
    const sourceDuration = item.sourceWindow.endSeconds - item.sourceWindow.startSeconds;
    const expandedPadding = Math.max(0, Math.min(1, (3 - sourceDuration) / 2));
    return ({
    level: item.level,
    disc: item.disc,
    track: item.track,
    sourceFile: item.sourceFile,
    sectionId: item.sectionId,
    sectionTitle: item.sectionTitle,
    wordIndex: item.wordIndex,
    word: item.targetWord,
    normalizedWord: item.targetWord,
    confidence: item.confidence,
    startSeconds: item.sourceWindow.startSeconds,
    endSeconds: item.sourceWindow.endSeconds,
    reviewClip: item.clipWindow,
    expandedReviewClip: {
      startSeconds: Number(Math.max(0, item.sourceWindow.startSeconds - expandedPadding).toFixed(3)),
      endSeconds: Number((item.sourceWindow.endSeconds + expandedPadding).toFixed(3))
    },
    priority: item.qualityGate === "review-ready" ? 0 : 1,
    reason: item.qualityGate === "review-ready" ? "course-target-word" : "low-confidence",
    curriculumReason: `required-for-week-${week}`,
    courseDays: item.courseDays,
    candidateRank: item.candidateRank,
    reviewRevision: 20260805
    });
  })
};
writeFileSync(join(outputRoot, "review-queue.json"), `${JSON.stringify(reviewQueue, null, 2)}\n`);
console.log(JSON.stringify({ outputRoot, ...payload.summary, unresolved: unresolved.map((item) => item.word) }, null, 2));
