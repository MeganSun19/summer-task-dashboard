import { mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
await import(join(projectRoot, "curriculum/phonics-lesson-content.js"));

const lessons = globalThis.PHONICS_LESSON_CONTENT;
const outputDirectory = join(projectRoot, "phonics-media");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "phonics-lesson-audio-"));
const voice = "zh-CN-XiaoxiaoNeural";
const force = process.argv.includes("--force");

if (!Array.isArray(lessons) || lessons.length !== 26) throw new Error("Expected 26 phonics lesson scripts");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
}

try {
  mkdirSync(outputDirectory, { recursive: true });
  lessons.forEach((lesson) => {
    const filename = `day-${String(lesson.day).padStart(2, "0")}-lesson.mp3`;
    const outputPath = join(outputDirectory, filename);
    if (!force) {
      try {
        if (statSync(outputPath).size > 1000) return;
      } catch {}
    }
    const rawPath = join(temporaryDirectory, `day-${lesson.day}-raw.mp3`);
    run("uv", ["run", "--with", "edge-tts", "edge-tts", "--voice", voice, "--rate=-7%", "--text", lesson.narration.join(" "), "--write-media", rawPath]);
    run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", rawPath, "-af", "loudnorm=I=-19:TP=-2:LRA=7,adelay=100|100,apad=pad_dur=0.2", "-ar", "24000", "-ac", "1", "-b:a", "48k", outputPath]);
    if (statSync(outputPath).size < 1000) throw new Error(`Invalid audio: ${filename}`);
    console.log(`Generated ${lesson.day}/${lessons.length}: ${filename}`);
  });
  console.log(`Ready: ${lessons.length} transfer-focused phonics narrations with ${voice}`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
