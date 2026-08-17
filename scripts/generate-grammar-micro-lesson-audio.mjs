import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(projectRoot, "grammar-media");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "grammar-micro-audio-"));
const pauseSeconds = 0.55;
const voice = "zh-CN-XiaoxiaoNeural";
const requestedLessonId = process.argv.find((argument) => argument.startsWith("--lesson="))?.split("=")[1] || null;

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

function generateLesson(lesson) {
  const scenes = lesson.microLesson?.scenes || [];
  if (scenes.length !== 5 || scenes.some((scene) => !scene.narration)) throw new Error(`${lesson.id} needs five narrated micro-lesson scenes`);
  const lessonTemporaryDirectory = join(temporaryDirectory, lesson.id);
  mkdirSync(lessonTemporaryDirectory, { recursive: true });
  const outputPath = join(outputDirectory, `${lesson.id}-narration.mp3`);
  const scenePaths = scenes.map((scene, index) => {
    const path = join(lessonTemporaryDirectory, `scene-${index + 1}.mp3`);
    run("uv", [
      "run", "--with", "edge-tts", "edge-tts",
      "--voice", voice, "--rate=-8%", "--text", scene.narration, "--write-media", path
    ]);
    return path;
  });
  const silencePath = join(lessonTemporaryDirectory, "pause.mp3");
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi",
    "-i", "anullsrc=r=24000:cl=mono", "-t", String(pauseSeconds), "-b:a", "48k", silencePath
  ]);
  const concatPath = join(lessonTemporaryDirectory, "concat.txt");
  const concatEntries = scenePaths.flatMap((path, index) => index === scenePaths.length - 1 ? [path] : [path, silencePath]);
  writeFileSync(concatPath, `${concatEntries.map((path) => `file '${path}'`).join("\n")}\n`);
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", concatPath,
    "-af", "loudnorm=I=-18:TP=-2:LRA=7,apad=pad_dur=0.8",
    "-ar", "24000", "-ac", "1", "-b:a", "48k", outputPath
  ]);

  let cursor = 0;
  const sceneStarts = scenePaths.map((path, index) => {
    const start = Number(cursor.toFixed(1));
    cursor += durationOf(path) + (index === scenePaths.length - 1 ? 0 : pauseSeconds);
    return start;
  });
  return { id: lesson.id, sceneStarts, durationSeconds: Number(durationOf(outputPath).toFixed(1)), outputPath };
}

try {
  mkdirSync(outputDirectory, { recursive: true });
  const lessons = course.lessons.filter((lesson) => lesson.microLesson && (!requestedLessonId || lesson.id === requestedLessonId));
  if (!lessons.length) throw new Error(`No micro lesson found${requestedLessonId ? ` for ${requestedLessonId}` : ""}`);
  const results = lessons.map(generateLesson);
  results.forEach((result) => console.log(`${result.id}: starts=${result.sceneStarts.join(",")} duration=${result.durationSeconds}s`));
  console.log(`Generated ${results.length} micro-lesson narration files with ${voice}`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
