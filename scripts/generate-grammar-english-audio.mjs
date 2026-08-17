import { mkdtempSync, mkdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(projectRoot, "grammar-media", "english");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "grammar-english-audio-"));
const voice = "en-US-JennyNeural";

await import("../curriculum/grammar-island-course.js");
const course = globalThis.GRAMMAR_ISLAND_COURSE;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
  return result.stdout;
}

function durationOf(path) {
  return Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path]).trim());
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generate(target, index, total) {
  const rawPath = join(temporaryDirectory, `raw-${index}.mp3`);
  const outputPath = join(outputDirectory, target.filename);
  run("uv", [
    "run", "--with", "edge-tts", "edge-tts",
    "--voice", voice,
    target.kind === "vocabulary" ? "--rate=-15%" : "--rate=-10%",
    "--text", target.text,
    "--write-media", rawPath
  ]);
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y", "-i", rawPath,
    "-af", "loudnorm=I=-19:TP=-2:LRA=7,adelay=100|100,apad=pad_dur=0.18",
    "-ar", "24000", "-ac", "1", "-b:a", "48k", outputPath
  ]);
  const size = statSync(outputPath).size;
  const duration = durationOf(outputPath);
  if (!size || !Number.isFinite(duration) || duration < 0.35) throw new Error(`Invalid grammar audio: ${target.filename}`);
  if ((index + 1) % 20 === 0 || index + 1 === total) console.log(`Generated ${index + 1}/${total} English grammar clips`);
}

try {
  mkdirSync(outputDirectory, { recursive: true });
  const targets = new Map();
  for (const lesson of course.lessons) {
    for (const entry of lesson.vocabularySupport) {
      targets.set(`vocab:${entry.word}`, { kind: "vocabulary", text: entry.word, filename: `vocab-${slug(entry.word)}.mp3` });
    }
    lesson.oralPrompts.forEach((prompt, index) => {
      targets.set(`model:${lesson.id}:${index + 1}`, { kind: "model", text: prompt.answer, filename: `model-${lesson.id}-${index + 1}.mp3` });
    });
  }
  const list = [...targets.values()];
  list.forEach((target, index) => generate(target, index, list.length));
  console.log(`Generated ${list.length} English grammar clips with ${voice}`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
