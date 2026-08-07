import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const workspaceRoot = join(projectRoot, "..");
const disc1Path = join(projectRoot, "curriculum", "opw-disc1-catalog.json");
const timestampPath = join(projectRoot, "curriculum", "opw-word-timestamps.json");
const outputPath = join(projectRoot, "curriculum", "opw-full-audio-catalog.json");

const catalog = JSON.parse(readFileSync(disc1Path, "utf8"));
const timestamps = JSON.parse(readFileSync(timestampPath, "utf8"));
const timestampIndex = new Map(timestamps.tracks.map((entry) => [
  `${entry.level}-${entry.disc}-${entry.track}`,
  entry
]));

const disc2Mappings = {
  1: {
    expectedTrackCount: 65,
    sections: {
      "unit-5": [[45,2,3],[46,4,5],[47,6,7],[48,8],[49,9,10],[50,11],[51,12,13]],
      "unit-6": [[53,14,15],[54,16,17],[55,18,19],[56,20],[57,21,22],[58,23],[59,24,25],[60,26]],
      "review-3": [[61,27],[62,28],[63,29]],
      "unit-7": [[65,30,31],[66,32,33],[67,34,35],[68,36],[69,37,38],[70,39],[71,40,41],[72,42,43],[73,44],[74,45]],
      "unit-8": [[75,46,47],[76,48,49],[77,50,51],[78,52],[79,53,54],[80,55,56],[81,57,58],[82,59,60],[83,61],[84,62]],
      "review-4": [[85,63],[86,64],[87,65]]
    }
  },
  2: {
    expectedTrackCount: 65,
    sections: {
      "unit-5": [[45,2,3],[46,4,5],[47,6,7],[48,8,9],[49,10,11],[50,12,13],[51,14,15],[52,16]],
      "unit-6": [[53,17,18],[54,19,20],[55,21,22],[56,23,24],[57,25,26],[58,27,28],[59,29],[60,30]],
      "review-3": [[61,31],[62,32],[63,33]],
      "unit-7": [[65,34,35],[66,36,37],[67,38,39],[68,40,41],[69,42,43],[70,44,45],[71,46],[72,47]],
      "unit-8": [[73,48,49],[74,50,51],[75,52,53],[76,54,55],[77,56,57],[78,58,59],[79,60,61],[80,62]],
      "review-4": [[81,63],[82,64],[83,65]]
    }
  },
  3: {
    expectedTrackCount: 68,
    sections: {
      "unit-5": [[45,2,3],[46,4,5],[47,6,7],[48,8,9,10],[49,11,12],[50,13,14],[51,15],[52,16]],
      "unit-6": [[53,17,18],[54,19,20],[55,21,22],[56,23,24,25],[57,26,27],[58,28,29],[59,30,31],[60,32]],
      "review-3": [[61,33],[62,34]],
      "unit-7": [[65,35,36],[66,37,38,39],[67,40],[68,41,42,43],[69,44],[70,45],[71,46],[72,47]],
      "unit-8": [[73,48,49],[74,50,51],[75,52,53],[76,54,55,56],[77,57,58],[78,59,60,61],[79,62,63],[80,64]],
      "review-4": [[81,65],[82,66,67],[83,68]]
    }
  }
};

function duration(filePath) {
  return Number(execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath
  ], { encoding: "utf8" }).trim());
}

function trimEnd(filePath, fullDuration) {
  const result = spawnSync("ffmpeg", [
    "-hide_banner", "-nostats", "-i", filePath,
    "-af", "silencedetect=noise=-45dB:d=0.25", "-f", "null", "-"
  ], { encoding: "utf8" });
  const starts = [...(result.stderr || "").matchAll(/silence_start: ([0-9.]+)/g)]
    .map((match) => Number(match[1]));
  const finalStart = starts.at(-1);
  return Number.isFinite(finalStart) && fullDuration - finalStart <= 12
    ? Number(finalStart.toFixed(3))
    : Number(fullDuration.toFixed(3));
}

function transcription(level, disc, track, maxDuration) {
  const entry = timestampIndex.get(`${level}-${disc}-${track}`);
  if (!entry) throw new Error(`Missing word timestamps L${level} D${disc} T${track}`);
  const wordSegments = entry.wordSegments.filter((word) => (
    word.word &&
    word.startSeconds >= 0 &&
    word.endSeconds > word.startSeconds &&
    word.endSeconds <= maxDuration + 0.05
  ));
  return {
    transcript: entry.transcript,
    wordSegments,
    wordSegmentReview: entry.listeningReview
  };
}

for (const level of catalog.levels) {
  const mapping = disc2Mappings[level.level];
  level.audioSourceDirectories = {
    disc1: `../outputs/oxford-phonics-world-level${level.level}-disc1`,
    disc2: `../outputs/oxford-phonics-world-level${level.level}-disc2`
  };
  delete level.audioSourceDirectory;
  level.expectedTrackCounts = { disc1: level.expectedTrackCount, disc2: mapping.expectedTrackCount };
  delete level.expectedTrackCount;
  delete level.disc;
  delete level.disc1Coverage;
  level.fullBookAudioCoverage = "units-1-through-8-and-reviews-1-through-4";

  for (const section of level.sections) {
    if (!mapping.sections[section.id]) continue;
    const pageTracks = mapping.sections[section.id];
    const tracks = pageTracks.flatMap(([, ...numbers]) => numbers);
    section.audioAvailability = "available-disc2";
    section.disc = 2;
    section.trackRange = [tracks[0], tracks.at(-1)];
  }
  for (const section of level.sections.filter((entry) => entry.audioAvailability === "available-disc1")) {
    section.disc = 1;
  }

  level.tracks = level.tracks.map((track) => ({
    ...track,
    disc: 1,
    ...transcription(level.level, 1, track.track, track.clip.endSeconds),
    segmentAvailability: {
      ...track.segmentAvailability,
      wordOrPromptTimestamps: true
    }
  }));

  const disc2Directory = join(workspaceRoot, "outputs", `oxford-phonics-world-level${level.level}-disc2`);
  const frontmatterFile = `OPW_SB${level.level}_Disc2_Track01.mp3`;
  const frontmatterPath = join(disc2Directory, frontmatterFile);
  const frontmatterDuration = duration(frontmatterPath);
  level.tracks.push({
    disc: 2,
    track: 1,
    sourceFile: frontmatterFile,
    sectionId: "disc-frontmatter",
    pdfPage: null,
    bookPage: null,
    clip: {
      startSeconds: 0,
      endSeconds: Number(frontmatterDuration.toFixed(3)),
      candidateTrimEndSeconds: trimEnd(frontmatterPath, frontmatterDuration),
      usability: "available-unassigned-source-track",
      listeningReview: "required-before-curriculum-use"
    },
    ...transcription(level.level, 2, 1, frontmatterDuration),
    segmentAvailability: { fullTrack: true, tailTrimCandidate: true, wordOrPromptTimestamps: true }
  });

  for (const [sectionId, pageTracks] of Object.entries(mapping.sections)) {
    for (const [pdfPage, ...trackNumbers] of pageTracks) {
      for (const track of trackNumbers) {
        const sourceFile = `OPW_SB${level.level}_Disc2_Track${String(track).padStart(2, "0")}.mp3`;
        const filePath = join(disc2Directory, sourceFile);
        const fullDuration = duration(filePath);
        level.tracks.push({
          disc: 2,
          track,
          sourceFile,
          sectionId,
          pdfPage,
          bookPage: pdfPage - 1,
          clip: {
            startSeconds: 0,
            endSeconds: Number(fullDuration.toFixed(3)),
            candidateTrimEndSeconds: trimEnd(filePath, fullDuration),
            usability: "usable-full-activity-track",
            listeningReview: "required-before-subtrack-use"
          },
          ...transcription(level.level, 2, track, fullDuration),
          segmentAvailability: { fullTrack: true, tailTrimCandidate: true, wordOrPromptTimestamps: true }
        });
      }
    }
  }
}

catalog.schemaVersion = 3;
catalog.inventoryConfirmedOn = "2026-08-03";
catalog.mappingPolicy.physicalSplitsCreated = false;
catalog.mappingPolicy.defaultUsableSegment = "complete activity track plus machine-generated word timestamps";
catalog.mappingPolicy.wordLevelPolicy = "all tracks have machine-generated word timestamps; low-confidence and curriculum-critical clips require listening review";
catalog.inventoryNotes = [
  "All six Disc archives are extracted under outputs and mapped.",
  "Level 3 Disc 2 archive contains one stray duplicate OPW_SB3_Disc1_Track68.mp3; it is preserved but excluded from Disc 2 inventory."
];

writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${outputPath}: ${catalog.levels.map((level) => `L${level.level} ${level.tracks.length}`).join(", ")}`);
