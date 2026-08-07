import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const catalog = JSON.parse(readFileSync(join(projectRoot, "curriculum", "opw-full-audio-catalog.json"), "utf8"));
const problems = [];
let wordSegmentCount = 0;
let lowConfidenceCount = 0;

for (const level of catalog.levels) {
  for (const disc of [1, 2]) {
    const expectedCount = level.expectedTrackCounts[`disc${disc}`];
    const tracks = level.tracks.filter((track) => track.disc === disc);
    const expectedNumbers = Array.from({ length: expectedCount }, (_, index) => index + 1);
    const actualNumbers = tracks.map((track) => track.track);
    if (JSON.stringify(actualNumbers) !== JSON.stringify(expectedNumbers)) {
      problems.push(`L${level.level} D${disc}: non-continuous tracks: ${actualNumbers.join(",")}`);
    }

    const directory = join(projectRoot, level.audioSourceDirectories[`disc${disc}`]);
    for (const track of tracks) {
      const filePath = join(directory, track.sourceFile);
      if (!existsSync(filePath)) {
        problems.push(`L${level.level} D${disc} T${track.track}: missing ${filePath}`);
        continue;
      }
      const duration = Number(execFileSync("ffprobe", [
        "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath
      ], { encoding: "utf8" }).trim());
      if (Math.abs(duration - track.clip.endSeconds) > 0.02) {
        problems.push(`L${level.level} D${disc} T${track.track}: duration mismatch`);
      }
      if (track.clip.candidateTrimEndSeconds > track.clip.endSeconds) {
        problems.push(`L${level.level} D${disc} T${track.track}: trim end outside track`);
      }
      if (track.sectionId !== "disc-frontmatter") {
        const section = level.sections.find((entry) => entry.id === track.sectionId);
        if (!section || section.disc !== disc) {
          problems.push(`L${level.level} D${disc} T${track.track}: invalid section ${track.sectionId}`);
        } else if (track.pdfPage < section.pdfPages[0] || track.pdfPage > section.pdfPages[1]) {
          problems.push(`L${level.level} D${disc} T${track.track}: page outside ${track.sectionId}`);
        }
      }
      for (const word of track.wordSegments) {
        wordSegmentCount += 1;
        if (word.confidence < 0.65) lowConfidenceCount += 1;
        if (!word.word || word.startSeconds < 0 || word.endSeconds < word.startSeconds || word.endSeconds > track.clip.endSeconds + 0.05) {
          problems.push(`L${level.level} D${disc} T${track.track}: invalid word segment ${JSON.stringify(word)}`);
        }
      }
    }
  }

  const sectionsWithAudio = level.sections.filter((section) => section.audioAvailability.startsWith("available-disc"));
  if (sectionsWithAudio.length !== level.sections.length) {
    problems.push(`L${level.level}: not every book section has audio`);
  }
}

if (problems.length) {
  console.error(problems.slice(0, 100).join("\n"));
  console.error(`${problems.length} total validation problems`);
  process.exit(1);
}

console.log(`OK: ${catalog.levels.reduce((sum, level) => sum + level.tracks.length, 0)} tracks, ${wordSegmentCount} word segments, ${lowConfidenceCount} below confidence 0.65`);
for (const level of catalog.levels) {
  console.log(`L${level.level}: ${level.tracks.filter((track) => track.disc === 1).length} + ${level.tracks.filter((track) => track.disc === 2).length} tracks; ${level.sections.length} sections mapped`);
}
