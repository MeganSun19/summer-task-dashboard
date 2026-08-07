import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const reviewRoot = join(projectRoot, "tts-audio-review");
const queue = JSON.parse(readFileSync(join(reviewRoot, "queue.json"), "utf8"));
const existingAudioPath = join(projectRoot, "curriculum", "phonics-word-audio.json");
const existingAudio = existsSync(existingAudioPath)
  ? JSON.parse(readFileSync(existingAudioPath, "utf8"))
  : { words: {} };
const autoApproveTts = process.argv.includes("--auto-approve-tts");
const approveAll = process.argv.includes("--all-verified-by-user");
const resultArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const resultPath = resolve(resultArgument || join(reviewRoot, "review-results.json"));
const review = autoApproveTts ? {
  schemaVersion: 1,
  queueGeneratedAt: queue.generatedAt,
  exportedAt: new Date().toISOString(),
  reviewSource: "automatic-tts-course-policy",
  results: queue.items.map((item) => ({
    itemId: item.itemId,
    status: item.sourceType === "tts" ? "verified" : "pending-human-review",
    note: item.sourceType === "tts" ? "TTS 按课程规则自动入课" : "人工录音仍需审核",
    reviewedAt: item.sourceType === "tts" ? new Date().toISOString() : null
  }))
} : approveAll ? {
  schemaVersion: 1,
  queueGeneratedAt: queue.generatedAt,
  exportedAt: new Date().toISOString(),
  reviewSource: "user-confirmed-all-in-conversation",
  results: queue.items.map((item) => ({
    itemId: item.itemId,
    status: "verified",
    note: "用户逐词试听后确认全部通过",
    reviewedAt: new Date().toISOString()
  }))
} : (() => {
  if (!existsSync(resultPath)) throw new Error(`Missing review results: ${resultPath}`);
  return JSON.parse(readFileSync(resultPath, "utf8"));
})();
if (approveAll) writeFileSync(resultPath, `${JSON.stringify(review, null, 2)}\n`);
const resultById = new Map((review.results || []).map((entry) => [entry.itemId, entry]));
const missing = queue.items.filter((item) => !resultById.has(item.itemId));
if (missing.length) throw new Error(`${missing.length} candidates have not been reviewed`);

const sourceRoot = join(projectRoot, "audio-sources", "phonics-words");
mkdirSync(sourceRoot, { recursive: true });
const words = { ...(existingAudio.words || {}) };
let applied = 0;
let pending = 0;
let rejected = 0;
for (const item of queue.items) {
  const result = resultById.get(item.itemId);
  if (result.status !== "verified") {
    if (result.status === "pending-human-review") pending += 1;
    else rejected += 1;
    continue;
  }
  copyFileSync(join(reviewRoot, "clips", item.filename), join(sourceRoot, item.filename));
  words[item.word] = {
    status: "verified",
    sourceType: item.sourceType,
    verificationSource: autoApproveTts && item.sourceType === "tts" ? "tts-auto-policy" : "human-review",
    reviewedAt: result.reviewedAt,
    assetId: item.assetId,
    sourceFile: item.filename,
    clip: { startSeconds: 0, endSeconds: item.durationSeconds }
  };
  applied += 1;
}

if (autoApproveTts) {
  queue.policy = {
    playback: "Generated TTS is automatically approved for child playback; human recordings still require explicit review.",
    sourcePriority: "Existing verified Oxford clip, then reviewed human recording, then automatically approved TTS fallback.",
    reviewCriteria: "Human recordings require review; TTS is accepted automatically under the course publishing policy."
  };
  queue.items = queue.items.map((item) => ({
    ...item,
    reviewStatus: item.sourceType === "tts" ? "auto-approved" : item.reviewStatus
  }));
  queue.summary = { ...queue.summary, autoApprovedTts: applied, pendingHumanRecordings: pending };
  writeFileSync(join(reviewRoot, "queue.json"), `${JSON.stringify(queue, null, 2)}\n`);
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  policy: "Generated TTS is automatically included; human recordings require review.",
  summary: { processed: queue.items.length, applied, pending, rejected, verifiedTotal: Object.keys(words).length },
  words
};
writeFileSync(join(projectRoot, "curriculum", "phonics-word-audio.json"), `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Applied phonics audio: ${applied} added, ${pending} pending, ${payload.summary.verifiedTotal} verified total`);
await import(pathToFileURL(join(projectRoot, "scripts", "build-english-course.mjs")));
await import(pathToFileURL(join(projectRoot, "scripts", "build-static-course-audio.mjs")));
