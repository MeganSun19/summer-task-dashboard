import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const OPW_COURSE_CATALOG_URL = new URL("./opw-full-audio-catalog.json", import.meta.url);

export function loadCourseCatalog(url = OPW_COURSE_CATALOG_URL) {
  return JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
}

export function getLevel(catalog, levelNumber) {
  const level = catalog.levels.find((entry) => entry.level === Number(levelNumber));
  if (!level) throw new Error(`Unknown Oxford Phonics World level: ${levelNumber}`);
  return level;
}

export function getSchedulableSections(catalog, levelNumber) {
  const level = getLevel(catalog, levelNumber);
  return level.sections.filter((section) => (
    (section.disc === 1 || section.disc === 2) &&
    section.audioAvailability === `available-disc${section.disc}`
  ));
}

export function buildSectionAudioTask(catalog, levelNumber, sectionId) {
  const level = getLevel(catalog, levelNumber);
  const section = getSchedulableSections(catalog, levelNumber)
    .find((entry) => entry.id === sectionId);
  if (!section) throw new Error(`Section is not schedulable: L${levelNumber} ${sectionId}`);

  const tracks = level.tracks
    .filter((track) => track.disc === section.disc && track.sectionId === section.id)
    .sort((left, right) => left.track - right.track)
    .map((track) => ({
      disc: track.disc,
      track: track.track,
      sourceFile: track.sourceFile,
      pdfPage: track.pdfPage,
      bookPage: track.bookPage,
      clip: track.clip
    }));

  if (!tracks.length) throw new Error(`No audio tracks mapped for L${levelNumber} ${sectionId}`);
  return {
    course: catalog.course,
    level: level.level,
    sectionId: section.id,
    title: section.title,
    focusPatterns: section.focusPatterns,
    disc: section.disc,
    trackRange: section.trackRange,
    tracks
  };
}
