import { mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
await import(join(projectRoot, "curriculum", "phonics-audio-sources.js"));
const outputDirectory = join(projectRoot, "phonics-media", "phonemes");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "phonics-phonemes-"));
const voice = "en-US-JennyNeural";
const targets = globalThis.PHONICS_AUDIO_SOURCES;
if (!Array.isArray(targets) || targets.length !== 47) throw new Error("Expected 47 phonics audio source records");

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

try {
  mkdirSync(outputDirectory, { recursive: true });
  targets.forEach((target) => {
    const sourcePath = target.sourceFile ? join(projectRoot, target.sourceFile) : join(temporaryDirectory, `${target.id}-source.mp3`);
    const outputPath = join(outputDirectory, `${target.id}.mp3`);
    if (!target.sourceFile) {
      run("uv", [
        "run", "--with", "edge-tts", "edge-tts",
        "--voice", voice, "--rate=-18%", "--text", target.source, "--write-media", sourcePath
      ]);
    }
    const sourceDuration = durationOf(sourcePath);
    const clipStart = target.fromEndStart ? Math.max(0, sourceDuration - target.fromEndStart) : target.start;
    const clipEnd = target.fromEndEnd ? Math.max(clipStart + 0.05, sourceDuration - target.fromEndEnd) : target.end;
    const tempo = target.tempo || 1;
    const tempoFilter = tempo === 1 ? "" : `,atempo=${tempo}`;
    const clipDuration = (clipEnd - clipStart) / tempo;
    const targetDuration = Math.max(0.7, Number((clipDuration + 0.2).toFixed(3)));
    const fadeInDuration = target.fadeIn ?? 0.018;
    const fadeOutStart = Math.max(0, clipDuration - 0.018);
    run("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-i", sourcePath,
      "-af", `atrim=start=${clipStart}:end=${clipEnd},asetpts=PTS-STARTPTS${tempoFilter},afade=t=in:st=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart}:d=0.018,loudnorm=I=-19:TP=-2:LRA=7,adelay=80|80,apad=whole_dur=${targetDuration},atrim=duration=${targetDuration}`,
      "-ar", "24000", "-ac", "1", "-b:a", "48k", outputPath
    ]);
    if (statSync(outputPath).size < 500) throw new Error(`Invalid phoneme asset: ${target.id}`);
    console.log(`Generated ${target.id} from ${target.source} ${clipStart.toFixed(2)}-${clipEnd.toFixed(2)}s tempo=${tempo}`);
  });
  console.log(`Ready: ${targets.length} controlled phoneme assets with ${voice}`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
