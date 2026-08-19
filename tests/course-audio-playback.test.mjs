import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ui = await readFile(new URL("../week1-course-ui.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

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

test("same-day cloud refreshes cannot interrupt an active module or playing audio", () => {
  assert.match(ui, /const nextContextKey = `\$\{context\?\.kidId[\s\S]*?\$\{context\?\.planDay/);
  assert.match(ui, /const audioPlaying = !refs\.week1CoursePlayer\.paused && !refs\.week1CoursePlayer\.ended/);
  assert.match(ui, /if \(currentContextKey === nextContextKey && \(activeModule \|\| phonicsLessonButton \|\| audioPlaying\)\) return;/);
  const contextRender = ui.slice(ui.indexOf("function renderForContext"), ui.indexOf("function buildOverview"));
  assert.equal(contextRender.indexOf("audioPlaying") < contextRender.indexOf("stopCourseAudio();"), true);
  assert.doesNotMatch(ui, /Promise\.all\(allRounds|AudioStore\.getAsset\(round\.assetId\)/);
  assert.match(ui, /availableAssetIds = new Set\(allRounds\.map/);
});

test("stage-review lesson playback only advances after the complete audio ends", () => {
  assert.match(ui, /function handleCoursePlayerEnded\(\)/);
  assert.match(ui, /activeRounds\[roundIndex\]\?\.mode === "watch"/);
  assert.match(ui, /Boolean\(phonicsLessonButton\?\.dataset\.phonicsLessonAudio\)/);
  assert.match(ui, /if \(completedWatch\) advanceRound\(\)/);
  assert.match(ui, /reviewMistakes: \[\.\.\.reviewMistakes\]/);
  assert.match(ui, /skipRaz[\s\S]*?assignment: null/);
});

test("phonics animation pause resumes from the same position", () => {
  const playback = ui.slice(ui.indexOf("function playPhonicsLesson"), ui.indexOf("function resetPhonicsLessonButton"));
  assert.match(playback, /player\.pause\(\);[\s\S]*?phonicsContinueLabel/);
  assert.match(playback, /!player\.ended && player\.currentTime > 0/);
  assert.match(playback, /player\.play\(\)/);
  const resumeBranch = playback.slice(playback.indexOf("if (phonicsLessonButton === button"), playback.indexOf("stopCourseAudio();"));
  assert.doesNotMatch(resumeBranch, /currentTime\s*=\s*0|resetPhonicsLessonButton/);
});

test("each phonics scene can be replayed and paused independently", () => {
  assert.match(ui, /data-phonics-scene-play=/);
  assert.match(ui, /data-phonics-scene-audio=/);
  assert.match(ui, /function playPhonicsScene\(button\)/);
  assert.match(ui, /player\.src = audioUrl;[\s\S]*?player\.currentTime = 0;[\s\S]*?player\.play\(\)/);
  assert.match(ui, /phonics-media\/scenes\/day-/);
});

test("localhost can preview a chosen phonics day without changing saved learning progress", () => {
  assert.match(ui, /\["localhost", "127\.0\.0\.1"\]\.includes\(window\.location\.hostname\)/);
  assert.match(ui, /previewParams\.get\("phonics-preview"\)/);
  assert.match(ui, /dayNumber = validPreviewDay \|\| Number\(moduleContext\?\.planDay\)/);
  assert.match(ui, /phonicsPreviewMode = Boolean\(validPreviewDay\)/);
  assert.match(ui, /if \(!phonicsPreviewMode && !moduleContext\?\.startDate\)/);
  assert.match(ui, /function saveProgress\(\) \{\s*if \(phonicsPreviewMode\) return;/);
  assert.match(ui, /const stored = phonicsPreviewMode\s*\? null/);
  assert.match(ui, /document\.body\.classList\.toggle\("phonics-preview-mode", Boolean\(previewDay \|\| phonicsAuditMode\)\)/);
  assert.match(css, /\.phonics-preview-mode #grammarIslandCard \{ display: none !important; \}/);
});

test("stage-review spelling highlights the Chinese clue and offers a one-time answer escape", () => {
  assert.match(ui, /stage-review-meaning/);
  assert.match(css, /\.stage-review-meaning[\s\S]*?background: #fff2a8/);
  assert.match(ui, /data-show-spelling-answer>实在想不起来，看看答案/);
  const reveal = ui.slice(ui.indexOf("function showSpellingAnswer"), ui.indexOf("function wordMeaning"));
  assert.match(reveal, /button\.dataset\.revealed === "1"/);
  assert.match(reveal, /button\.textContent = `答案：\$\{round\.word\}`/);
  assert.match(reveal, /recordReviewMistake\(round\)/);
  assert.match(reveal, /wrongAttempts \+= 1/);
});

test("localhost exposes one full phonics audit page without changing child pages", () => {
  assert.match(ui, /previewParams\.get\("phonics-audit"\) === "1"/);
  assert.match(ui, /function renderPhonicsAudit\(\)/);
  assert.match(ui, /全部 26 课动画/);
  assert.match(ui, /data-phonics-audit-audio/);
  assert.match(ui, /phonicsAuditMode\) renderPhonicsAudit\(\)/);
});

test("a selected module is locked before first-start persistence can rerender the page", () => {
  const startModule = ui.slice(ui.indexOf("async function startCourseModule"), ui.indexOf("function returnToDashboard"));
  assert.match(startModule, /activeModule = selected/);
  assert.equal(startModule.indexOf("activeModule = selected") < startModule.indexOf("LearningActivityProgress?.startModule"), true);
  for (const moduleId of ["soundLab", "coreWords", "raz", "extraWords"]) {
    assert.match(ui, new RegExp(`moduleCard\\("${moduleId}"`));
  }
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

test("child-facing word cards show only the word meaning without study-management labels", () => {
  assert.doesNotMatch(ui, /新词·要写|复习·要拼|拓展新词·要写|拓展复习·要拼/);
  assert.match(ui, /<small>\$\{escapeHTML\(wordMeaning\(word\)\)}<\/small>/);
});
