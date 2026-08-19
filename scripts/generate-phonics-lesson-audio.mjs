import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const timingsPath = join(projectRoot, "curriculum", "phonics-audio-timings.js");
try { await import(timingsPath); } catch {}
await import(join(projectRoot, "curriculum/phonics-lesson-content.js"));

const lessons = globalThis.PHONICS_LESSON_CONTENT;
const outputDirectory = join(projectRoot, "phonics-media");
const sceneOutputDirectory = join(outputDirectory, "scenes");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "phonics-lesson-audio-"));
const chineseVoice = "zh-CN-XiaoxiaoNeural";
const englishVoice = "en-US-JennyNeural";
const force = process.argv.includes("--force");
const requestedDay = Number(process.argv.find((argument) => argument.startsWith("--day="))?.split("=")[1]) || null;
const generatedTimings = { ...(globalThis.PHONICS_AUDIO_TIMINGS || {}) };

if (!Array.isArray(lessons) || lessons.length !== 26) throw new Error("Expected 26 phonics lesson scripts");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${command} failed with exit code ${result.status}`);
  }
}

function durationOf(path) {
  const result = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Could not read duration for ${path}`);
  return Number(result.stdout.trim());
}

function mixedLanguageSegments(narration) {
  return String(narration).split(/([A-Za-z]+(?:\s+[A-Za-z]+)*)/g)
    .map((text) => text.trim())
    .filter((text) => /[A-Za-z\u3400-\u9fff]/.test(text))
    .map((text) => ({ language: /[A-Za-z]/.test(text) ? "en" : "zh", text }));
}

try {
  mkdirSync(outputDirectory, { recursive: true });
  mkdirSync(sceneOutputDirectory, { recursive: true });
  lessons.filter((lesson) => !requestedDay || lesson.day === requestedDay).forEach((lesson) => {
    const filename = `day-${String(lesson.day).padStart(2, "0")}-lesson.mp3`;
    const outputPath = join(outputDirectory, filename);
    if (!force) {
      try {
        if (statSync(outputPath).size > 1000) return;
      } catch {}
    }
    const lessonDirectory = join(temporaryDirectory, `day-${lesson.day}`);
    mkdirSync(lessonDirectory, { recursive: true });
    const segmentPausePath = join(lessonDirectory, "segment-pause.mp3");
    run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.32", "-b:a", "48k", segmentPausePath]);
    const sceneDefinitions = lesson.audioSegments?.length
      ? lesson.audioSegments
      : lesson.narration.map((narration) => mixedLanguageSegments(narration));
    const scenePaths = sceneDefinitions.map((segments, index) => {
      const scenePath = join(lessonDirectory, `scene-${index + 1}.mp3`);
      const segmentPaths = segments.map((segment, segmentIndex) => {
        if (segment.asset) {
          const assetPath = join(projectRoot, segment.asset);
          if (statSync(assetPath).size < 500) throw new Error(`Invalid phoneme asset: ${segment.asset}`);
          return assetPath;
        }
        const segmentPath = join(lessonDirectory, `scene-${index + 1}-segment-${segmentIndex + 1}.mp3`);
        const isEnglish = segment.language === "en";
        run("uv", [
          "run", "--with", "edge-tts", "edge-tts",
          "--voice", isEnglish ? englishVoice : chineseVoice,
          `--rate=${segment.rate || (isEnglish ? "-18%" : lesson.audioRate || "-7%")}`,
          "--text", segment.text,
          "--write-media", segmentPath
        ]);
        return segmentPath;
      });
      const sceneConcatPath = join(lessonDirectory, `scene-${index + 1}-concat.txt`);
      const sceneEntries = segmentPaths.flatMap((segmentPath, segmentIndex) => segmentIndex === segmentPaths.length - 1 ? [segmentPath] : [segmentPath, segmentPausePath]);
      writeFileSync(sceneConcatPath, `${sceneEntries.map((entry) => `file '${entry}'`).join("\n")}\n`);
      run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", sceneConcatPath, "-ar", "24000", "-ac", "1", "-b:a", "48k", scenePath]);
      return scenePath;
    });
    scenePaths.forEach((scenePath, index) => {
      const sceneFilename = `day-${String(lesson.day).padStart(2, "0")}-scene-${String(index + 1).padStart(2, "0")}.mp3`;
      run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", scenePath, "-af", "loudnorm=I=-19:TP=-2:LRA=7,adelay=100|100,apad=pad_dur=0.25", "-ar", "24000", "-ac", "1", "-b:a", "48k", join(sceneOutputDirectory, sceneFilename)]);
    });
    const pausePath = join(lessonDirectory, "pause.mp3");
    const pauseSeconds = Number(lesson.pauseSeconds) || 0.55;
    run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", String(pauseSeconds), "-b:a", "48k", pausePath]);
    const concatPath = join(lessonDirectory, "concat.txt");
    const concatEntries = scenePaths.flatMap((scenePath, index) => index === scenePaths.length - 1 ? [scenePath] : [scenePath, pausePath]);
    writeFileSync(concatPath, `${concatEntries.map((entry) => `file '${entry}'`).join("\n")}\n`);
    run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-af", "loudnorm=I=-19:TP=-2:LRA=7,adelay=100|100,apad=pad_dur=0.4", "-ar", "24000", "-ac", "1", "-b:a", "48k", outputPath]);
    if (statSync(outputPath).size < 1000) throw new Error(`Invalid audio: ${filename}`);
    let cursor = 0;
    const sceneStarts = scenePaths.map((scenePath, index) => {
      const start = Number(cursor.toFixed(1));
      cursor += durationOf(scenePath) + (index === scenePaths.length - 1 ? 0 : pauseSeconds);
      return start;
    });
    generatedTimings[lesson.day] = sceneStarts;
    console.log(`Generated ${lesson.day}/${lessons.length}: ${filename} starts=${sceneStarts.join(",")} duration=${durationOf(outputPath).toFixed(1)}s`);
  });
  const timingEntries = Object.keys(generatedTimings).map(Number).sort((a, b) => a - b).map((day) => `    ${day}: Object.freeze([${generatedTimings[day].join(", ")}])`).join(",\n");
  writeFileSync(timingsPath, `(function (root) {\n  // Generated by scripts/generate-phonics-lesson-audio.mjs.\n  root.PHONICS_AUDIO_TIMINGS = Object.freeze({\n${timingEntries}\n  });\n})(typeof window !== "undefined" ? window : globalThis);\n`);
  console.log(`Ready: ${lessons.length} transfer-focused phonics narrations with ${chineseVoice} + ${englishVoice}`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
