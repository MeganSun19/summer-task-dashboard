import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const catalogPath = join(projectRoot, "curriculum", "opw-disc1-catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const problems = [];

for (const level of catalog.levels) {
  const audioDirectory = level.audioSourceDirectory.startsWith("/")
    ? level.audioSourceDirectory
    : join(projectRoot, level.audioSourceDirectory);
  const actualTracks = level.tracks.map((track) => track.track);
  const expectedTracks = Array.from({ length: level.expectedTrackCount }, (_, index) => index + 1);
  const expectedActivityTracks = expectedTracks.slice(2);

  if (JSON.stringify(actualTracks) !== JSON.stringify(expectedTracks)) {
    problems.push(`L${level.level}: expected catalog tracks 01-${level.expectedTrackCount}, got ${actualTracks.join(",")}`);
  }
  if (level.expectedTrackCount !== level.tracks.length) {
    problems.push(`L${level.level}: file count and catalog count differ`);
  }

  for (const track of level.tracks) {
    const filePath = join(audioDirectory, track.sourceFile);
    if (!existsSync(filePath)) {
      problems.push(`L${level.level} T${track.track}: missing ${filePath}`);
      continue;
    }
    const duration = Number(execFileSync("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      filePath
    ], { encoding: "utf8" }).trim());
    if (Math.abs(duration - track.clip.endSeconds) > 0.02) {
      problems.push(`L${level.level} T${track.track}: duration ${duration.toFixed(3)} != ${track.clip.endSeconds}`);
    }
    if (track.clip.startSeconds !== 0 || track.clip.endSeconds <= 0) {
      problems.push(`L${level.level} T${track.track}: invalid full-track clip`);
    }
    if (track.clip.candidateTrimEndSeconds > track.clip.endSeconds) {
      problems.push(`L${level.level} T${track.track}: tail trim exceeds duration`);
    }
    const section = level.sections.find((entry) => entry.id === track.sectionId);
    if (track.sectionId !== "disc-frontmatter" && (!section || track.pdfPage < section.pdfPages[0] || track.pdfPage > section.pdfPages[1])) {
      problems.push(`L${level.level} T${track.track}: page is outside ${track.sectionId}`);
    }
  }

  const availableSections = level.sections.filter((section) => section.audioAvailability === "available-disc1");
  const covered = availableSections.flatMap((section) => {
    const [start, end] = section.trackRange;
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });
  if (JSON.stringify(covered) !== JSON.stringify(expectedActivityTracks)) {
    problems.push(`L${level.level}: section ranges are not continuous`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(catalog.levels.map((level) => (
  `OK L${level.level}: ${level.sections.length} book sections, ${level.tracks.length} Disc 1 files cataloged (01-${level.expectedTrackCount})`
)).join("\n"));
