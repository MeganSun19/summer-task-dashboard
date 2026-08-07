import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const outputPath = join(projectRoot, "curriculum", "opw-disc1-catalog.json");

const levels = [
  {
    level: 1,
    subtitle: "The Alphabet",
    pdfSource: "../outputs/牛津树自然拼读1教材.pdf",
    audioSourceDirectory: "/Users/megsun/Documents/P-files/kids/oxford-phonics-world-level1-disc1",
    expectedTrackCount: 60,
    sections: [
      unit(1, "Aa Bb Cc", ["Aa", "Bb", "Cc"], 5, 12, 3, 14, [[5, 3, 4], [6, 5, 6], [7, 7, 8], [8, 9], [9, 10, 11], [10, 12], [11, 13], [12, 14]]),
      unit(2, "Dd Ee Ff", ["Dd", "Ee", "Ff"], 13, 20, 15, 28, [[13, 15, 16], [14, 17, 18], [15, 19, 20], [16, 21, 22], [17, 23, 24], [18, 25], [19, 26, 27], [20, 28]]),
      review(1, "Review 1", 21, 24, 29, 31, [[21, 29], [22, 30], [23, 31]]),
      unit(3, "Gg Hh Ii", ["Gg", "Hh", "Ii"], 25, 32, 32, 44, [[25, 32, 33], [26, 34, 35], [27, 36, 37], [28, 38, 39], [29, 40, 41], [30, 42], [31, 43], [32, 44]]),
      unit(4, "Jj Kk Ll", ["Jj", "Kk", "Ll"], 33, 40, 45, 57, [[33, 45, 46], [34, 47, 48], [35, 49, 50], [36, 51], [37, 52, 53], [38, 54], [39, 55, 56], [40, 57]]),
      review(2, "Review 2", 41, 44, 58, 60, [[41, 58], [42, 59], [43, 60]]),
      unavailableUnit(5, "Mm Nn Oo", ["Mm", "Nn", "Oo"], 45, 52),
      unavailableUnit(6, "Pp Qq Rr", ["Pp", "Qq", "Rr"], 53, 60),
      unavailableReview(3, "Review 3", 61, 64),
      unavailableUnit(7, "Ss Tt Uu Vv", ["Ss", "Tt", "Uu", "Vv"], 65, 74),
      unavailableUnit(8, "Ww Xx Yy Zz", ["Ww", "Xx", "Yy", "Zz"], 75, 84),
      unavailableReview(4, "Review 4", 85, 88)
    ]
  },
  {
    level: 2,
    subtitle: "Short Vowels",
    pdfSource: "../outputs/Oxford_Phonics_World_2_SB.pdf",
    audioSourceDirectory: "../outputs/oxford-phonics-world-level2-disc1",
    expectedTrackCount: 65,
    sections: [
      unit(1, "a am an", ["a", "am", "an"], 5, 12, 3, 16, [[5, 3, 4], [6, 5, 6], [7, 7, 8], [8, 9, 10], [9, 11, 12], [10, 13, 14], [11, 15], [12, 16]]),
      unit(2, "ad ag ap at", ["ad", "ag", "ap", "at"], 13, 20, 17, 31, [[13, 17, 18], [14, 19, 20], [15, 21, 22], [16, 23, 24], [17, 25, 26], [18, 27, 28, 29], [19, 30], [20, 31]]),
      review(1, "Review 1", 21, 24, 32, 34, [[21, 32], [22, 33], [23, 34]]),
      unit(3, "e et en ed", ["e", "et", "en", "ed"], 25, 32, 35, 48, [[25, 35, 36], [26, 37, 38], [27, 39, 40], [28, 41, 42], [29, 43, 44], [30, 45, 46], [31, 47], [32, 48]]),
      unit(4, "i ip ib id", ["i", "ip", "ib", "id"], 33, 40, 49, 62, [[33, 49, 50], [34, 51, 52], [35, 53, 54], [36, 55, 56], [37, 57, 58], [38, 59, 60], [39, 61], [40, 62]]),
      review(2, "Review 2", 41, 44, 63, 65, [[41, 63], [42, 64], [43, 65]]),
      unavailableUnit(5, "in ig it ix", ["in", "ig", "it", "ix"], 45, 52),
      unavailableUnit(6, "o ot op", ["o", "ot", "op"], 53, 60),
      unavailableReview(3, "Review 3", 61, 64),
      unavailableUnit(7, "u ug ud up", ["u", "ug", "ud", "up"], 65, 72),
      unavailableUnit(8, "ut ub um un", ["ut", "ub", "um", "un"], 73, 80),
      unavailableReview(4, "Review 4", 81, 84)
    ]
  },
  {
    level: 3,
    subtitle: "Long Vowels",
    pdfSource: "../outputs/（已压缩）Oxford_Phonics_World_3_SB.pdf",
    audioSourceDirectory: "../outputs/oxford-phonics-world-level3-disc1",
    expectedTrackCount: 68,
    sections: [
      unit(1, "a_e ame ake ate ave", ["a_e", "ame", "ake", "ate", "ave"], 5, 12, 3, 18, [[5, 3, 4], [6, 5, 6, 7], [7, 8, 9], [8, 10, 11, 12], [9, 13, 14], [10, 15, 16], [11, 17], [12, 18]]),
      unit(2, "i_e ime ike ive ine", ["i_e", "ime", "ike", "ive", "ine"], 13, 20, 19, 34, [[13, 19, 20], [14, 21, 22], [15, 23, 24], [16, 25, 26, 27], [17, 28, 29], [18, 30, 31], [19, 32, 33], [20, 34]]),
      review(1, "Review 1", 21, 24, 35, 36, [[21, 35], [22, 36]]),
      unit(3, "o_e u_e u_e", ["o_e", "u_e /juː/", "u_e /uː/"], 25, 32, 37, 50, [[25, 37, 38], [26, 39, 40], [27, 41, 42], [28, 43, 44], [29, 45, 46], [30, 47, 48], [31, 49], [32, 50]]),
      unit(4, "ai ay", ["ai", "ay"], 33, 40, 51, 64, [[33, 51, 52], [34, 53, 54], [35, 55, 56], [36, 57, 58, 59], [37, 60], [38, 61], [39, 62, 63], [40, 64]]),
      review(2, "Review 2", 41, 44, 65, 68, [[41, 65], [42, 66, 67], [43, 68]]),
      unavailableUnit(5, "ee ea y ey", ["ee", "ea", "y", "ey"], 45, 52),
      unavailableUnit(6, "igh ie y", ["igh", "ie", "y"], 53, 60),
      unavailableReview(3, "Review 3", 61, 64),
      unavailableUnit(7, "oa ow", ["oa", "ow"], 65, 72),
      unavailableUnit(8, "ue ui ew oo", ["ue", "ui", "ew", "oo"], 73, 80),
      unavailableReview(4, "Review 4", 81, 84)
    ]
  }
];

function unit(number, title, focusPatterns, pdfStart, pdfEnd, trackStart, trackEnd, pageTracks) {
  return availableSection("unit", number, title, focusPatterns, pdfStart, pdfEnd, trackStart, trackEnd, pageTracks);
}

function review(number, title, pdfStart, pdfEnd, trackStart, trackEnd, pageTracks) {
  return availableSection("review", number, title, [], pdfStart, pdfEnd, trackStart, trackEnd, pageTracks);
}

function availableSection(kind, number, title, focusPatterns, pdfStart, pdfEnd, trackStart, trackEnd, pageTracks) {
  return {
    id: `${kind}-${number}`,
    kind,
    number,
    title,
    focusPatterns,
    pdfPages: [pdfStart, pdfEnd],
    bookPages: [pdfStart - 1, pdfEnd - 1],
    audioAvailability: "available-disc1",
    trackRange: [trackStart, trackEnd],
    pageTracks
  };
}

function unavailableUnit(number, title, focusPatterns, pdfStart, pdfEnd) {
  return unavailableSection("unit", number, title, focusPatterns, pdfStart, pdfEnd);
}

function unavailableReview(number, title, pdfStart, pdfEnd) {
  return unavailableSection("review", number, title, [], pdfStart, pdfEnd);
}

function unavailableSection(kind, number, title, focusPatterns, pdfStart, pdfEnd) {
  return {
    id: `${kind}-${number}`,
    kind,
    number,
    title,
    focusPatterns,
    pdfPages: [pdfStart, pdfEnd],
    bookPages: [pdfStart - 1, pdfEnd - 1],
    audioAvailability: "unavailable-disc2-not-in-inventory",
    trackRange: null,
    pageTracks: []
  };
}

function resolveFromProject(path) {
  return path.startsWith("/") ? path : join(projectRoot, path);
}

function audioDuration(filePath) {
  return Number(execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "csv=p=0",
    filePath
  ], { encoding: "utf8" }).trim());
}

function candidateTrimEnd(filePath, duration) {
  const result = spawnSync("ffmpeg", [
    "-hide_banner", "-nostats", "-i", filePath,
    "-af", "silencedetect=noise=-45dB:d=0.25",
    "-f", "null", "-"
  ], { encoding: "utf8" });
  const output = result.stderr || "";
  const starts = [...output.matchAll(/silence_start: ([0-9.]+)/g)].map((match) => Number(match[1]));
  const lastStart = starts.at(-1);
  return Number.isFinite(lastStart) && duration - lastStart <= 12
    ? Number(lastStart.toFixed(3))
    : Number(duration.toFixed(3));
}

for (const level of levels) {
  const audioDirectory = resolveFromProject(level.audioSourceDirectory);
  level.disc = 1;
  level.pdfPageCount = level.level === 1 ? 107 : 105;
  level.disc1Coverage = "units-1-through-4-and-reviews-1-through-2";
  level.tracks = [];

  for (const track of [1, 2]) {
    const sourceFile = `OPW_SB${level.level}_Disc1_Track${String(track).padStart(2, "0")}.mp3`;
    const filePath = join(audioDirectory, sourceFile);
    const duration = audioDuration(filePath);
    const isLevel1AlphabetSong = level.level === 1 && track === 2;
    level.tracks.push({
      track,
      sourceFile,
      sectionId: "disc-frontmatter",
      pdfPage: isLevel1AlphabetSong ? 89 : null,
      bookPage: isLevel1AlphabetSong ? 88 : null,
      clip: {
        startSeconds: 0,
        endSeconds: Number(duration.toFixed(3)),
        candidateTrimEndSeconds: candidateTrimEnd(filePath, duration),
        usability: isLevel1AlphabetSong ? "usable-supplemental-song" : "available-unassigned-source-track",
        listeningReview: "required-before-curriculum-use"
      },
      segmentAvailability: {
        fullTrack: true,
        tailTrimCandidate: true,
        wordOrPromptTimestamps: false
      }
    });
  }

  for (const section of level.sections) {
    for (const [pdfPage, ...trackNumbers] of section.pageTracks) {
      for (const track of trackNumbers) {
        const sourceFile = `OPW_SB${level.level}_Disc1_Track${String(track).padStart(2, "0")}.mp3`;
        const filePath = join(audioDirectory, sourceFile);
        const duration = audioDuration(filePath);
        const knownPromptSequence = level.level === 1 && track === 5
          ? ["ant", "bear", "apple", "alligator", "cup", "ax"]
          : undefined;
        level.tracks.push({
          track,
          sourceFile,
          sectionId: section.id,
          pdfPage,
          bookPage: pdfPage - 1,
          clip: {
            startSeconds: 0,
            endSeconds: Number(duration.toFixed(3)),
            candidateTrimEndSeconds: candidateTrimEnd(filePath, duration),
            usability: "usable-full-activity-track",
            listeningReview: knownPromptSequence ? "verified-prompt-sequence" : "required-before-subtrack-use"
          },
          segmentAvailability: {
            fullTrack: true,
            tailTrimCandidate: true,
            wordOrPromptTimestamps: false
          },
          ...(knownPromptSequence ? { knownPromptSequence } : {})
        });
      }
    }
    delete section.pageTracks;
  }
}

const catalog = {
  schemaVersion: 2,
  course: "Oxford Phonics World",
  inventoryConfirmedOn: "2026-08-03",
  assetPolicy: "family-local-reference-only-do-not-publish",
  mappingPolicy: {
    sourceAudioPreserved: true,
    physicalSplitsCreated: false,
    defaultUsableSegment: "complete activity track",
    candidateTrimMeaning: "start of final silence detected at -45dB for at least 0.25 seconds; requires listening review before destructive trimming",
    wordLevelPolicy: "add timestamps only for exercises that need prompt replay; do not batch-split every MP3"
  },
  levels
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${outputPath}: ${levels.map((level) => `L${level.level} ${level.tracks.length}`).join(", ")}`);
