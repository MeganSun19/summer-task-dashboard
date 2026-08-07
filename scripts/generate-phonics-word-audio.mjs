import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const coursePath = join(projectRoot, "curriculum", "english-course.json");
const reviewRoot = join(projectRoot, "tts-audio-review");
const clipRoot = join(reviewRoot, "clips");
const recordingRoot = join(projectRoot, "human-recordings", "phonics-words");
const voice = process.env.PHONICS_TTS_VOICE || "Samantha";
const rate = Number(process.env.PHONICS_TTS_RATE || 145);
const course = JSON.parse(readFileSync(coursePath, "utf8"));

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  }
  return result.stdout;
}

function safeWord(word) {
  const normalized = String(word).trim().toLowerCase();
  if (!/^[a-z]+$/.test(normalized)) throw new Error(`Unsupported phonics word: ${word}`);
  return normalized;
}

function findHumanRecording(word) {
  if (!statSafe(recordingRoot)?.isDirectory()) return null;
  const match = readdirSync(recordingRoot).find((filename) => (
    basename(filename, extname(filename)).toLowerCase() === word &&
    [".wav", ".aiff", ".aif", ".m4a", ".mp3"].includes(extname(filename).toLowerCase())
  ));
  return match ? join(recordingRoot, match) : null;
}

function statSafe(path) {
  try { return statSync(path); } catch { return null; }
}

function durationSeconds(path) {
  return Number(run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", path
  ]).trim());
}

mkdirSync(clipRoot, { recursive: true });
mkdirSync(recordingRoot, { recursive: true });

const usage = new Map();
for (const day of course.days) {
  for (const entry of day.phonics.words) {
    if (entry.audio?.status === "verified") continue;
    const word = safeWord(entry.word);
    if (!usage.has(word)) usage.set(word, { weeks: new Set(), patterns: new Set() });
    usage.get(word).weeks.add(day.week);
    usage.get(word).patterns.add(day.phonics.pattern);
  }
}

const items = [];
for (const [word, context] of [...usage].sort(([left], [right]) => left.localeCompare(right))) {
  const output = join(clipRoot, `${word}.mp3`);
  const humanRecording = findHumanRecording(word);
  let sourceType = "tts";
  let sourceDescription = `macOS say · ${voice} · ${rate} wpm`;

  if (humanRecording) {
    sourceType = "human-recording";
    sourceDescription = `人工录音 · ${basename(humanRecording)}`;
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-i", humanRecording,
      "-af", "loudnorm=I=-20:LRA=7:TP=-2,adelay=120|120,apad=pad_dur=0.2",
      "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-q:a", "2", output
    ]);
  } else {
    const aiff = join(reviewRoot, `${word}.aiff`);
    run("say", ["-v", voice, "-r", String(rate), "-o", aiff, word]);
    if (!statSafe(aiff)?.size || durationSeconds(aiff) <= 0) throw new Error(`TTS produced empty audio for ${word}`);
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-i", aiff,
      "-af", "loudnorm=I=-20:LRA=7:TP=-2,adelay=120|120,apad=pad_dur=0.2",
      "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-q:a", "2", output
    ]);
  }

  const duration = durationSeconds(output);
  if (!Number.isFinite(duration) || duration < 0.35) throw new Error(`Invalid output duration for ${word}: ${duration}`);
  items.push({
    itemId: `phonics-word-${word}-v1`,
    word,
    assetId: `phonics-word-${word}`,
    filename: `${word}.mp3`,
    url: `./tts-audio-review/clips/${word}.mp3`,
    sourceType,
    sourceDescription,
    durationSeconds: Number(duration.toFixed(3)),
    weeks: [...context.weeks].sort(),
    patterns: [...context.patterns].sort(),
    reviewStatus: sourceType === "tts" ? "auto-approved" : "pending-human-review"
  });
}

const queue = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  policy: {
    playback: "Generated TTS is automatically approved for child playback; human recordings still require explicit review.",
    sourcePriority: "Existing verified Oxford clip, then reviewed human recording, then automatically approved TTS fallback.",
    reviewCriteria: "Human recordings require review; TTS is accepted automatically under the course publishing policy."
  },
  generator: { engine: "macOS say", voice, locale: "en_US", rate },
  summary: {
    total: items.length,
    tts: items.filter((item) => item.sourceType === "tts").length,
    humanRecordings: items.filter((item) => item.sourceType === "human-recording").length
  },
  items
};

writeFileSync(join(reviewRoot, "queue.json"), `${JSON.stringify(queue, null, 2)}\n`);
console.log(`Generated ${items.length} phonics candidates (${queue.summary.tts} TTS, ${queue.summary.humanRecordings} human recordings)`);
