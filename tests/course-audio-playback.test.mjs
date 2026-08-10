import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ui = await readFile(new URL("../week1-course-ui.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("all phones use one click-driven audio element", () => {
  assert.match(html, /<audio id="week1CoursePlayer" preload="none" hidden><\/audio>/);
  assert.match(html, /id="week1CourseAudioPlay"/);
  assert.equal((html.match(/<audio /g) || []).length, 1);
  assert.doesNotMatch(ui, /APPLE_MOBILE_AUDIO|iPhone|iPad|Android|PreviewPlayer/);
});

test("course entry and round changes never initialize, load, or autoplay audio", () => {
  const render = ui.slice(ui.indexOf("function renderRound"), ui.indexOf("function showListenRound"));
  const listen = ui.slice(ui.indexOf("function showListenRound"), ui.indexOf("function showChoiceRound"));
  assert.doesNotMatch(`${render}\n${listen}`, /\.src\s*=|\.load\(|\.play\(|createAudioUrl|pause\(|removeAttribute/);
  assert.match(listen, /week1CourseAudioPlay\.hidden = false/);
  assert.match(listen, /先点播放听一遍/);
});

test("overview words and listening questions share the same direct-play function", () => {
  assert.match(ui, /function playCurrentRoundAudio\(\)[\s\S]*?playAudioAsset\(round\.assetId/);
  assert.match(ui, /async function playPhonicsWord[\s\S]*?playAudioAsset\(round\.assetId/);
  assert.match(ui, /async function playHeartWord[\s\S]*?playAudioAsset\(assetId/);
  const playback = ui.slice(ui.indexOf("function playAudioAsset"), ui.indexOf("function chooseWord"));
  assert.match(playback, /player\.src = audioUrl/);
  assert.match(playback, /return player\.play\(\)/);
  assert.doesNotMatch(playback, /await|\.load\(|createAudioUrl|removeAttribute/);
});

test("audio uses independently published static MP3 clips", () => {
  assert.match(ui, /course-audio\/\$\{encodeURIComponent\(assetId\)\}\.mp3/);
});

test("same-day cloud refreshes cannot close an active course module", () => {
  assert.match(ui, /const nextContextKey = `\$\{context\?\.kidId[\s\S]*?\$\{context\?\.planDay/);
  assert.match(ui, /if \(activeModule && currentContextKey === nextContextKey\) return;/);
  assert.doesNotMatch(ui, /Promise\.all\(allRounds|AudioStore\.getAsset\(round\.assetId\)/);
  assert.match(ui, /availableAssetIds = new Set\(allRounds\.map/);
});

test("sound-lab rounds and answer positions are shuffled without shifting legacy partial progress", () => {
  assert.match(ui, /const legacyPartialOrder = !practiceMode && roundIndex > 0 && !savedModuleProgress\.roundOrderVersion/);
  assert.match(ui, /shuffleWithSeed\(selected\.rounds, `\$\{activeChoiceSeed\}\|rounds`\)/);
  assert.match(ui, /shuffleWithSeed\(round\.choices, `\$\{activeChoiceSeed\}\|\$\{round\.word\}\|choices`\)/);
  assert.match(ui, /roundOrderVersion: 1/);
});

test("the 200-word bank renders one lightweight page at a time", () => {
  assert.match(ui, /const HEART_WORD_BANK_PAGE_SIZE = 40/);
  assert.match(ui, /words\.slice\(start, start \+ HEART_WORD_BANK_PAGE_SIZE\)/);
  assert.match(ui, /data-heart-word-page="-1"/);
  assert.match(ui, /data-heart-word-page="1"/);
  assert.doesNotMatch(ui, /course\.heartWords\?\.words \|\| \[\]\)\.map/);
});
