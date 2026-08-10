import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const plan = JSON.parse(readFileSync(join(projectRoot, "curriculum", "heart-word-plan.json"), "utf8"));
const outputRoot = join(projectRoot, "audio-sources", "heart-words");
const catalogPath = join(projectRoot, "curriculum", "heart-word-audio.json");
const voice = process.env.HEART_WORD_TTS_VOICE || "Samantha";
const rate = Number(process.env.HEART_WORD_TTS_RATE || 140);
const force = process.argv.includes("--force");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  return result.stdout;
}

function statSafe(path) {
  try { return statSync(path); } catch { return null; }
}

function durationSeconds(path) {
  return Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nokey=1:noprint_wrappers=1", path]).trim());
}

function maxVolumeDb(path) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-i", path, "-af", "volumedetect", "-f", "null", "/dev/null"], { encoding: "utf8" });
  const match = String(result.stderr || "").match(/max_volume:\s*(-?[\d.]+) dB/);
  return match ? Number(match[1]) : Number.NEGATIVE_INFINITY;
}

function slug(word) {
  const value = String(word).toLowerCase().replace(/[’']/g, "");
  if (!/^[a-z]+$/.test(value)) throw new Error(`Unsupported heart word: ${word}`);
  return value;
}

mkdirSync(outputRoot, { recursive: true });
const words = {};
let generated = 0;
let reused = 0;
for (const entry of plan.words) {
  const filename = `${slug(entry.word)}.mp3`;
  const output = join(outputRoot, filename);
  if (force || !statSafe(output)?.size) {
    const aiff = join(outputRoot, `.${slug(entry.word)}.aiff`);
    run("say", ["-v", voice, "-r", String(rate), "-o", aiff, entry.word]);
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-i", aiff,
      "-af", "loudnorm=I=-20:LRA=7:TP=-2,adelay=120|120,apad=pad_dur=0.2",
      "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-q:a", "2", output
    ]);
    rmSync(aiff, { force: true });
    generated += 1;
  } else reused += 1;
  const duration = durationSeconds(output);
  const maxVolume = maxVolumeDb(output);
  if (!Number.isFinite(duration) || duration < 0.25 || maxVolume < -60) {
    throw new Error(`Invalid heart-word audio for ${entry.word}: duration=${duration}, maxVolume=${maxVolume}`);
  }
  words[entry.word] = {
    status: "verified",
    kind: "heart-word",
    sourceType: "tts",
    verificationSource: "tts-auto-policy",
    assetId: `heart-word-${slug(entry.word)}`,
    sourceFile: filename,
    clip: { startSeconds: 0, endSeconds: Number(duration.toFixed(3)) }
  };
}

const catalog = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  generator: { engine: "macOS say", voice, locale: "en_US", rate },
  policy: "High-frequency word TTS is automatically included for pronunciation support.",
  summary: { total: Object.keys(words).length, generated, reused },
  words
};
writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated heart-word audio catalog: ${catalog.summary.total} assets (${generated} new, ${reused} reused)`);
