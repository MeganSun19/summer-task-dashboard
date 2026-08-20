import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

await import("../grammar-island-core.js");
await import("../curriculum/grammar-island-course.js");
await import("../curriculum/phonics-audio-sources.js");
await import("../curriculum/phonics-audio-timings.js");
await import("../curriculum/phonics-lesson-content.js");
await import("../curriculum/english-word-meanings.js");

const core = globalThis.GrammarIslandCore;
const course = globalThis.GRAMMAR_ISLAND_COURSE;
const phonicsLessons = globalThis.PHONICS_LESSON_CONTENT;
const phonicsAudioSources = globalThis.PHONICS_AUDIO_SOURCES;
const wordMeanings = globalThis.ENGLISH_WORD_MEANINGS;
const englishCourse = JSON.parse(await readFile(new URL("../curriculum/english-course.json", import.meta.url), "utf8"));
const grammarUiSource = await readFile(new URL("../grammar-island-ui.js", import.meta.url), "utf8");
const deploySource = await readFile(new URL("../deploy-cloudbase.sh", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");
const englishUiSource = await readFile(new URL("../week1-course-ui.js", import.meta.url), "utf8");
const phonicsAudioGeneratorSource = await readFile(new URL("../scripts/generate-phonics-lesson-audio.mjs", import.meta.url), "utf8");
const phonemeGeneratorSource = await readFile(new URL("../scripts/generate-phonics-phoneme-audio.mjs", import.meta.url), "utf8");

function fakeStorage(seed = {}) {
  const entries = new Map(Object.entries(seed));
  const writes = [];
  return {
    writes,
    getItem(key) { return entries.has(key) ? entries.get(key) : null; },
    setItem(key, value) { entries.set(key, value); writes.push(key); }
  };
}

test("the foundation release contains eight teaching lessons and one checkpoint", () => {
  assert.equal(course.lessons.length, 9);
  assert.deepEqual(course.lessons.map((lesson) => lesson.week), [1, 1, 2, 2, 3, 3, 4, 4, 5]);
  assert.equal(course.lessons.every((lesson) => lesson.explanation.length >= 3), true);
  assert.equal(course.lessons.slice(0, 8).every((lesson) => lesson.oralPrompts.length >= 6), true);
  assert.equal(course.lessons.slice(0, 8).every((lesson) => lesson.checks.length >= 6), true);
  assert.equal(course.lessons.at(-1).oralPrompts.length >= 8, true);
  assert.equal(course.lessons.every((lesson) => lesson.printPages.length >= 3), true);
  assert.match(course.policy.source, /Common English Grammar/);
  assert.match(course.policy.paperRole, /three selected workbook pages/);
  assert.match(course.note, /10 阳光/);
});

test("oral practice uses varied prompts with a scaffold for every retry", () => {
  for (const lesson of course.lessons) {
    assert.equal(lesson.oralPrompts.every((prompt) => prompt.skill && prompt.cue && prompt.answer && prompt.scaffold), true, lesson.id);
  }
  assert.equal(course.lessons.flatMap((lesson) => lesson.oralPrompts).some((prompt) => prompt.cue === "你有一本书，说出来。"), false);
});

test("every lesson records its workbook exercise formats and supported vocabulary", () => {
  for (const lesson of course.lessons) {
    assert.equal(lesson.sourceFormats.length >= 1, true, `${lesson.id}: source formats`);
    assert.equal(lesson.vocabularySupport.length >= 3, true, `${lesson.id}: vocabulary support`);
    assert.equal(lesson.vocabularySupport.every((entry) => entry.word && entry.zh), true, `${lesson.id}: bilingual support`);
    assert.equal(new Set(lesson.vocabularySupport.map((entry) => entry.word)).size, lesson.vocabularySupport.length, `${lesson.id}: duplicate support`);
  }
  assert.equal(course.lessons.find((lesson) => lesson.id === "w1-plurals").sourceFormats.some((item) => item.includes("词形转换")), true);
  assert.equal(course.lessons.find((lesson) => lesson.id === "w4-have-has").sourceFormats.some((item) => item.includes("找错并改正")), true);
  assert.equal(course.lessons.find((lesson) => lesson.id === "w4-prepositions").sourceFormats.some((item) => item.includes("看图")), true);
});

test("every micro lesson teaches transfer with examples not reused by its practice", () => {
  for (const lesson of course.lessons) {
    assert.equal(lesson.microLesson.scenes.length, 5, `${lesson.id}: scenes`);
    assert.match(lesson.microLesson.audio, new RegExp(`grammar-media/${lesson.id}-narration\\.mp3`));
    assert.equal(lesson.microLesson.durationSeconds >= 45 && lesson.microLesson.durationSeconds <= 100, true, `${lesson.id}: duration`);
    assert.equal(lesson.microLesson.scenes.every((scene, index, scenes) => scene.narration && (index === 0 || scene.at > scenes[index - 1].at)), true, `${lesson.id}: timeline`);
    const practiceText = [
      ...lesson.oralPrompts.flatMap((prompt) => [prompt.cue, prompt.answer, prompt.scaffold]),
      ...lesson.checks.flatMap((check) => [check.prompt, ...check.choices]),
      ...lesson.vocabularySupport.flatMap((entry) => [entry.word, entry.zh])
    ].join(" ").toLowerCase();
    for (const exampleWord of lesson.microLesson.exampleWords) {
      assert.equal(new RegExp(`\\b${exampleWord}\\b`, "i").test(practiceText), false, `${lesson.id}: ${exampleWord} leaked into practice`);
    }
  }
});

test("every grammar narration, vocabulary word, and model answer has a static neural audio file", async () => {
  const urls = course.lessons.flatMap((lesson) => [
    lesson.microLesson.audio,
    ...lesson.vocabularySupport.map((entry) => entry.audio),
    ...lesson.oralPrompts.map((prompt) => prompt.audio)
  ]);
  for (const url of new Set(urls)) {
    const relativePath = url.split("?")[0].replace(/^\.\//, "");
    const info = await stat(new URL(`../${relativePath}`, import.meta.url));
    assert.equal(info.size > 500, true, relativePath);
  }
  assert.match(grammarUiSource, /new Audio\(audioUrl\)/);
  assert.match(grammarUiSource, /speakEnglishWithBrowser/);
});

test("the plural y-rule stacks safely on narrow Android viewports", () => {
  assert.match(stylesSource, /@media \(max-width: 520px\)[\s\S]*?\.grammar-y-comparison \{ grid-template-columns: 1fr;/);
  assert.match(stylesSource, /\.grammar-y-comparison > div \{[^}]*min-width: 0;/);
  assert.match(indexSource, /styles\.css\?v=20260820-review-feedback-1/);
  assert.match(indexSource, /app\.js\?v=20260819-day12-review-1/);
});

test("the child-facing English island removes product rationale and keeps short actions", () => {
  assert.doesNotMatch(indexSource, /孩子端课程|独立长期课程 · 不计入今日进度|蓝书课程总进度/);
  assert.doesNotMatch(grammarUiSource, /本课沿用的蓝书题型|内容范围：|动画示例和后续练习|额外学习奖励/);
  assert.doesNotMatch(englishUiSource, /模块可以自由选择，首次全部完成后|本期高频词总表/);
  assert.match(englishUiSource, /选一项开始吧/);
  assert.match(grammarUiSource, /还不懂？再看几个例子/);
});

test("all 26 phonics days have synchronized neural teacher animations", async () => {
  for (let day = 1; day <= 26; day += 1) {
    const filename = `day-${String(day).padStart(2, "0")}-lesson.mp3`;
    const info = await stat(new URL(`../phonics-media/${filename}`, import.meta.url));
    assert.equal(info.size > 500, true, filename);
  }
  assert.match(englishUiSource, /data-phonics-lesson-audio/);
  assert.match(englishUiSource, /data-phonics-lesson-stage/);
  assert.match(englishUiSource, /timeupdate", syncPhonicsLessonAnimation/);
  assert.match(englishUiSource, /▶ 播放全部/);
  assert.match(deploySource, /phonics-media\/\."/);
});

test("every phonics lesson uses one paced audio track per visible rule scene", async () => {
  const phonemeAssets = new Set();
  for (const lesson of phonicsLessons) {
    assert.equal(lesson.animationScenes.length >= 2, true, `day ${lesson.day}: scenes`);
    assert.equal(lesson.audioSegments.length, lesson.animationScenes.length, `day ${lesson.day}: audio scene count`);
    assert.equal(lesson.sceneStarts.length, lesson.animationScenes.length, `day ${lesson.day}: timeline count`);
    assert.equal(lesson.sceneStarts.every((start, index, starts) => index === 0 || start > starts[index - 1]), true, `day ${lesson.day}: timeline order`);
    lesson.animationScenes.forEach((scene, index) => {
      assert.equal(typeof scene.pronunciation, "string", `day ${lesson.day}: pronunciation type`);
      assert.equal(scene.pronunciation.trim().length > 0, true, `day ${lesson.day}: pronunciation present`);
      assert.equal(scene.soundModels.length > 0, true, `day ${lesson.day}: target sound model present`);
      const englishText = lesson.audioSegments[index].filter((segment) => segment.language === "en").map((segment) => segment.text).join(" ").toLowerCase();
      scene.words.forEach((word) => assert.equal((englishText.match(new RegExp(`\\b${word.toLowerCase()}\\b`, "g")) || []).length, 3, `day ${lesson.day}: ${word}`));
      const phonemes = lesson.audioSegments[index].filter((segment) => segment.language === "phoneme");
      assert.equal(phonemes.length, scene.soundModels.length * 3, `day ${lesson.day}: every target sound repeats three times`);
      phonemes.forEach((segment) => phonemeAssets.add(segment.asset));
    });
    for (let index = 0; index < lesson.animationScenes.length; index += 1) {
      const sceneFilename = `day-${String(lesson.day).padStart(2, "0")}-scene-${String(index + 1).padStart(2, "0")}.mp3`;
      const sceneInfo = await stat(new URL(`../phonics-media/scenes/${sceneFilename}`, import.meta.url));
      assert.equal(sceneInfo.size > 500, true, sceneFilename);
    }
  }
  for (const asset of phonemeAssets) {
    const info = await stat(new URL(`../${asset}`, import.meta.url));
    assert.equal(info.size > 500, true, asset);
  }
  assert.match(phonicsAudioGeneratorSource, /sceneDefinitions = lesson\.audioSegments\?\.length/);
  assert.match(phonicsAudioGeneratorSource, /sceneDefinitions\.map/);
  assert.match(phonicsAudioGeneratorSource, /sceneOutputDirectory/);
});

test("animation scene boundaries are generated from the rebuilt audio", () => {
  assert.match(indexSource, /phonics-audio-timings\.js/);
  assert.match(phonicsAudioGeneratorSource, /generatedTimings\[lesson\.day\] = sceneStarts/);
  assert.match(phonicsAudioGeneratorSource, /writeFileSync\(timingsPath/);
  assert.deepEqual(phonicsLessons.find((lesson) => lesson.day === 13).sceneStarts, [0, 22.1, 43.9, 59.4, 75]);
});

test("all target sounds have traceable sources and release is gated on human listening", () => {
  assert.equal(phonicsAudioSources.length, 47);
  assert.equal(new Set(phonicsAudioSources.map((source) => source.id)).size, 47);
  const sourceIds = new Set(phonicsAudioSources.map((source) => source.id));
  const referencedIds = new Set(phonicsLessons.flatMap((lesson) => lesson.animationScenes).flatMap((scene) => scene.soundModels).map((sound) => sound.asset.split("/").pop().replace(/\.mp3$/, "")));
  referencedIds.forEach((id) => assert.equal(sourceIds.has(id), true, id));
  assert.equal(phonicsAudioSources.every((source) => source.sourceLabel && source.riskNote && source.reviewStatus), true);
  assert.match(deploySource, /validate-phonics-audio-sources\.mjs" --release/);
  assert.match(indexSource, /curriculum\/phonics-audio-sources\.js/);
  assert.match(phonemeGeneratorSource, /PHONICS_AUDIO_SOURCES/);
});

test("vowel candidates no longer retain the consonants from eight, eat, out, oil, ooze, it or odd", () => {
  const byId = Object.fromEntries(phonicsAudioSources.map((source) => [source.id, source]));
  assert.equal(byId["long-a"].source, "A");
  assert.equal(byId["long-e"].source, "E");
  assert.equal(byId["long-i"].source, "I");
  assert.equal(byId["long-oo"].source, "ooh");
  assert.equal(byId.ow.source, "ow");
  assert.equal(byId.oy.source, "oy");
  assert.equal(byId["short-i"].end <= 0.42, true);
  assert.equal(byId["short-o"].end <= 0.52, true);
  assert.equal(["eight", "eat", "out", "oil", "ooze"].some((word) => phonicsAudioSources.some((source) => source.source === word)), false);
});

test("reported phoneme regressions use bounded speech cuts and distinguish both oo sounds", () => {
  const byId = Object.fromEntries(phonicsAudioSources.map((source) => [source.id, source]));
  assert.equal(byId.k.sourceFile, "audio-sources/phonics-words/back.mp3");
  assert.equal(byId.f.sourceFile, "audio-sources/phonics-words/graph.mp3");
  assert.equal(byId.er.sourceFile, "audio-sources/phonics-words/her.mp3");
  assert.equal(byId["short-oo"].sourceFile, "audio-sources/phonics-words/book.mp3");
  assert.equal(byId["short-oo"].end <= 0.34, true);
  for (const id of ["nt", "mp", "nd", "ft", "lt"]) {
    assert.equal(typeof byId[id].start, "number", id);
    assert.equal(typeof byId[id].end, "number", id);
    assert.equal(byId[id].start < byId[id].end && byId[id].end < 1, true, id);
    assert.equal("fromEndStart" in byId[id] || "fromEndEnd" in byId[id], false, id);
  }
  assert.equal(byId["long-oo"].displayLabel, "oo 长音");
  assert.equal(byId["short-oo"].displayLabel, "oo 短音");
});

test("day 15 follows the original fr tr dr cr plan while later gr remains review", () => {
  const day15 = phonicsLessons.find((lesson) => lesson.day === 15);
  const day18 = phonicsLessons.find((lesson) => lesson.day === 18);
  assert.deepEqual(day15.animationScenes.map((scene) => scene.mark), ["fr", "dr", "tr", "cr", "er"]);
  assert.equal(day15.animationScenes[0].words.includes("fresh"), true);
  assert.equal(day18.animationScenes.some((scene) => scene.mark === "gr"), true);
});

test("st and sk explain unaspirated voiceless stops instead of relabeling them d and g", () => {
  const day13 = phonicsLessons.find((lesson) => lesson.day === 13);
  const st = day13.animationScenes.find((scene) => scene.mark === "st");
  const sk = day13.animationScenes.find((scene) => scene.mark === "sk");
  assert.equal(st.pronunciation, "/st/");
  assert.equal(sk.pronunciation, "/sk/");
  assert.match(st.tip, /仍是 t，不是 d/);
  assert.match(sk.tip, /仍是 k，不是 g/);
  assert.match(day13.audioSegments[0][0].text, /少送气/);
  assert.match(day13.audioSegments[1][0].text, /少送气/);
});

test("ck uses its own final-sound asset and every visible scene prints its pronunciation", async () => {
  const day1 = phonicsLessons.find((lesson) => lesson.day === 1);
  const ckSceneIndex = day1.animationScenes.findIndex((scene) => scene.mark === "ck");
  assert.equal(day1.animationScenes[ckSceneIndex].pronunciation, "/k/");
  assert.deepEqual(day1.audioSegments[ckSceneIndex].filter((segment) => segment.asset).map((segment) => segment.asset), Array(3).fill("phonics-media/phonemes/ck.mp3"));
  const ckAsset = await stat(new URL("../phonics-media/phonemes/ck.mp3", import.meta.url));
  assert.equal(ckAsset.size > 500, true);
  for (const token of ["a /æ/ ↔ a_e /eɪ/", "i /ɪ/ ↔ i_e /aɪ/", "o /ɑ/ ↔ o_e /oʊ/"]) {
    assert.equal(phonicsLessons.flatMap((lesson) => lesson.animationScenes).some((scene) => scene.pronunciation === token), true, token);
  }
  assert.match(englishUiSource, /phonics-pronunciation/);
  assert.match(englishUiSource, /发音 \$\{escapeHTML\(scene\.pronunciation\)\}/);
});

test("phonics animation examples transfer the rule without repeating any course practice word", () => {
  const practiceWords = new Set(englishCourse.days.flatMap((day) => day.phonics.words.map((entry) => entry.word.toLowerCase())));
  assert.equal(phonicsLessons.length, 26);
  for (const lesson of phonicsLessons) {
    const examples = [...lesson.mainExamples, ...lesson.extensionExamples];
    assert.equal(examples.length >= 5, true, `day ${lesson.day}`);
    assert.equal(examples.every((word) => !practiceWords.has(word.toLowerCase())), true, `day ${lesson.day}`);
    assert.equal(examples.every((word) => lesson.narration.join(" ").toLowerCase().includes(word.toLowerCase())), true, `day ${lesson.day}: narration`);
  }
});

test("day 11 teaches ng, nk and oa as three paced scenes with triple sound and word models", async () => {
  const lesson = phonicsLessons.find((entry) => entry.day === 11);
  assert.deepEqual(lesson.animationScenes.map((scene) => scene.mark), ["ng", "nk", "oa"]);
  assert.equal(lesson.sceneStarts.length, 3);
  assert.equal(lesson.sceneStarts.every((start, index, starts) => index === 0 || start > starts[index - 1]), true);
  assert.equal(lesson.audioSegments.flat().some((segment) => segment.language === "zh"), true);
  assert.equal(lesson.audioSegments.flat().some((segment) => segment.language === "en"), true);
  assert.deepEqual(lesson.audioSegments.flat().filter((segment) => segment.asset).map((segment) => segment.asset), [
    ...Array(3).fill("phonics-media/phonemes/ng.mp3"),
    ...Array(3).fill("phonics-media/phonemes/nk.mp3"),
    ...Array(3).fill("phonics-media/phonemes/long-o.mp3")
  ]);
  for (const filename of ["ng.mp3", "nk.mp3", "long-o.mp3"]) {
    const info = await stat(new URL(`../phonics-media/phonemes/${filename}`, import.meta.url));
    assert.equal(info.size > 500, true, filename);
  }
  for (const token of ["ng", "song", "wing", "nk", "bank", "sink", "oa", "goat", "road"]) {
    assert.equal((lesson.narration.join(" ").match(new RegExp(`\\b${token}\\b`, "gi")) || []).length, 3, token);
  }
  assert.match(englishUiSource, /data-phonics-scene-starts/);
  assert.match(englishUiSource, /split\(","\)\.filter\(Boolean\)\.map\(Number\)/);
  assert.match(phonicsAudioGeneratorSource, /zh-CN-XiaoxiaoNeural/);
  assert.match(phonicsAudioGeneratorSource, /en-US-JennyNeural/);
  assert.match(phonicsAudioGeneratorSource, /mixedLanguageSegments\(narration\)/);
});

test("review lessons expose every reviewed sound instead of jumping straight to whole words", () => {
  const day25 = phonicsLessons.find((entry) => entry.day === 25);
  const day26 = phonicsLessons.find((entry) => entry.day === 26);
  assert.deepEqual(day25.animationScenes.map((scene) => scene.mark), ["a", "sh", "cl", "a_e", "o_e", "oy"]);
  assert.deepEqual(day26.animationScenes.map((scene) => scene.mark), ["sh", "gl", "i_e", "o_e", "u_e", "e_e", "oo 长音", "ow"]);
  assert.equal(day25.animationScenes.every((scene) => scene.soundModels.length > 0), true);
  assert.equal(day26.animationScenes.every((scene) => scene.soundModels.length > 0), true);
});

test("every phonics, heart and animation word has a compact Chinese meaning", () => {
  const words = [
    ...englishCourse.days.flatMap((day) => day.phonics.words.map((entry) => entry.word)),
    ...englishCourse.heartWords.words.map((entry) => entry.word),
    ...phonicsLessons.flatMap((lesson) => [...lesson.mainExamples, ...lesson.extensionExamples])
  ];
  assert.equal(words.every((word) => Boolean(wordMeanings[word.toLowerCase()])), true);
  assert.match(englishUiSource, /中文提示：/);
  assert.match(englishUiSource, /activeModuleFocus\(moduleId\)/);
});

test("completed phonics lessons appear in a read-only history review", () => {
  assert.match(englishUiSource, /已学自然拼读 · \$\{completedPhonicsDays\.length\} 课/);
  assert.match(englishUiSource, /moduleCard\("soundLab"[\s\S]*?\$\{phonicsHistoryMarkup\(\)\}/);
  assert.doesNotMatch(englishUiSource, /<\/div>\$\{[^}]*phonicsHistoryMarkup\(\)\}/);
  assert.match(englishUiSource, /lessonDay\.day < currentDayNumber/);
  assert.match(englishUiSource, /record\?\.moduleProgress\?\.soundLab\?\.completedAt/);
  assert.match(englishUiSource, /planPreviewDay\s*\? course\.days\.filter\(\(lessonDay\) => lessonDay\.day < dayNumber\)/);
  const historyHandler = englishUiSource.slice(
    englishUiSource.indexOf("function showHistoricalPhonicsLesson"),
    englishUiSource.indexOf("function stopCourseAudio")
  );
  assert.doesNotMatch(historyHandler, /saveProgress|LearningActivityProgress\?\.save|startCourseModule/);
});

test("stage review only labels missed heart words as needing memorisation", () => {
  assert.match(englishUiSource, /heartReviewWords = new Set/);
  assert.match(englishUiSource, /heartReviewMistakes = \[\.\.\.reviewMistakes\]\.filter\(\(word\) => heartReviewWords\.has\(word\)\)/);
  assert.match(englishUiSource, /高频词需要再练：/);
  assert.doesNotMatch(englishUiSource, /<p class="stage-review-result">需要再练：/);
  assert.match(englishUiSource, /这里练的是听音和拼读，不需要背这些单词/);
});

test("high-value rule families receive at least three oral variations", () => {
  const plurals = course.lessons.find((lesson) => lesson.id === "w1-plurals").oralPrompts;
  assert.equal(plurals.filter((prompt) => prompt.skill === "规则复数 · -s").length, 3);
  assert.equal(plurals.filter((prompt) => prompt.skill === "词尾变化 · -es").length, 3);
  assert.equal(plurals.filter((prompt) => prompt.skill === "辅音字母+y · -ies").length, 3);

  const positions = course.lessons.find((lesson) => lesson.id === "w4-prepositions").oralPrompts;
  for (const word of ["in", "on", "under"]) {
    assert.equal(positions.filter((prompt) => prompt.skill.startsWith(word)).length, 3);
  }
});

test("every check has one answer included in its choices", () => {
  for (const lesson of course.lessons) {
    for (const check of lesson.checks) {
      assert.equal(check.choices.includes(check.answer), true, `${lesson.id}: ${check.prompt}`);
      assert.equal(new Set(check.choices).size, check.choices.length, `${lesson.id}: duplicate choices`);
    }
  }
});

test("grammar progress writes only to its isolated storage key", () => {
  const mainDashboard = JSON.stringify({ learningActivities: { untouched: true } });
  const storage = fakeStorage({ "summer-task-dashboard-english-v1": mainDashboard });
  const lesson = course.lessons[0];
  const completed = core.completeLesson(
    core.load(storage),
    "brother",
    lesson,
    ["can", "can", "again"],
    lesson.checks.map((check) => check.answer),
    new Date("2026-08-11T00:00:00Z")
  );
  core.save(storage, completed.state);

  assert.deepEqual(storage.writes, [core.STORAGE_KEY]);
  assert.equal(storage.getItem("summer-task-dashboard-english-v1"), mainDashboard);
});

test("the two children keep independent grammar records", () => {
  const lesson = course.lessons[0];
  const answers = lesson.checks.map((check) => check.answer);
  const completed = core.completeLesson(core.emptyState(), "brother", lesson, ["can", "can", "can"], answers);

  assert.equal(core.summary(completed.state, "brother", course.lessons).completed, 1);
  assert.equal(core.summary(completed.state, "younger", course.lessons).completed, 0);
  assert.equal(core.lessonProgress(completed.state, "younger", lesson.id), null);
});

test("a parent can reset one grammar lesson without changing schedules or the other child", () => {
  const firstLesson = course.lessons[0];
  const secondLesson = course.lessons[1];
  const answersFor = (lesson) => lesson.checks.map((check) => check.answer);
  let state = core.setSchedule(core.emptyState(), "brother", { startDate: "2026-08-11", weekdays: [2, 5] });
  state = core.completeLesson(state, "brother", firstLesson, ["can"], answersFor(firstLesson)).state;
  state = core.completeLesson(state, "brother", secondLesson, ["can"], answersFor(secondLesson)).state;
  state = core.completeLesson(state, "younger", firstLesson, ["can"], answersFor(firstLesson)).state;

  state = core.resetLessonProgress(state, "brother", firstLesson.id);

  assert.equal(core.lessonProgress(state, "brother", firstLesson.id), null);
  assert.notEqual(core.lessonProgress(state, "brother", secondLesson.id), null);
  assert.notEqual(core.lessonProgress(state, "younger", firstLesson.id), null);
  assert.deepEqual(core.scheduleFor(state, "brother").weekdays, [2, 5]);
});

test("resetting one child's grammar history preserves both schedules and the other child's history", () => {
  const lesson = course.lessons[0];
  const answers = lesson.checks.map((check) => check.answer);
  let state = core.setSchedule(core.emptyState(), "brother", { startDate: "2026-08-11", weekdays: [2, 5] });
  state = core.setSchedule(state, "younger", { startDate: "2026-08-12", weekdays: [3, 6] });
  state = core.completeLesson(state, "brother", lesson, ["can"], answers).state;
  state = core.completeLesson(state, "younger", lesson, ["can"], answers).state;

  state = core.resetKidProgress(state, "brother");

  assert.equal(core.summary(state, "brother", course.lessons).completed, 0);
  assert.equal(core.summary(state, "younger", course.lessons).completed, 1);
  assert.deepEqual(core.scheduleFor(state, "brother").weekdays, [2, 5]);
  assert.deepEqual(core.scheduleFor(state, "younger").weekdays, [3, 6]);
});

test("weekly schedules support any freely selected set of weekdays", () => {
  const schedule = core.normalizeSchedule({ startDate: "2026-08-11", weekdays: [2, 5] });
  assert.equal(core.isScheduledDate("2026-08-11", schedule), true);
  assert.equal(core.isScheduledDate("2026-08-12", schedule), false);
  assert.equal(core.isScheduledDate("2026-08-14", schedule), true);
  assert.equal(core.nextScheduledDate("2026-08-11", schedule), "2026-08-14");
  assert.equal(core.nextScheduledDate("2026-08-14", schedule), "2026-08-18");

  const threeDays = core.normalizeSchedule({ startDate: "2026-08-11", weekdays: [1, 3, 6] });
  assert.deepEqual(threeDays.weekdays, [1, 3, 6]);
  assert.equal(core.isScheduledDate("2026-08-12", threeDays), true);
  assert.equal(core.isScheduledDate("2026-08-14", threeDays), false);

  const everyDay = core.normalizeSchedule({ startDate: "2026-08-11", weekdays: [0, 1, 2, 3, 4, 5, 6] });
  assert.equal(everyDay.weekdays.length, 7);
  assert.equal(core.nextScheduledDate("2026-08-11", everyDay), "2026-08-12");
});

test("a future grammar start date becomes the next scheduled session", () => {
  const schedule = core.normalizeSchedule({ startDate: "2026-08-14", weekdays: [2, 5] });
  assert.equal(core.isScheduledDate("2026-08-11", schedule), false);
  assert.equal(core.nextScheduledDate("2026-08-11", schedule), "2026-08-14");
});

test("each child can use a different freely selected weekly schedule", () => {
  let state = core.setSchedule(core.emptyState(), "brother", { startDate: "2026-08-11", weekdays: [1, 2, 5] });
  state = core.setSchedule(state, "younger", { startDate: "2026-08-12", weekdays: [0, 3, 4, 6] });
  assert.deepEqual(core.scheduleFor(state, "brother").weekdays, [1, 2, 5]);
  assert.deepEqual(core.scheduleFor(state, "younger").weekdays, [0, 3, 4, 6]);
});

test("lesson scoring keeps the best result while retaining recent attempts", () => {
  const lesson = course.lessons[0];
  const correct = lesson.checks.map((check) => check.answer);
  const wrong = lesson.checks.map((check) => check.choices.find((choice) => choice !== check.answer));
  const first = core.completeLesson(core.emptyState(), "brother", lesson, ["again"], correct);
  assert.equal(first.firstCompletion, true);
  const second = core.completeLesson(first.state, "brother", lesson, ["again"], wrong);
  assert.equal(second.firstCompletion, false);
  const state = second.state;
  const record = core.lessonProgress(state, "brother", lesson.id);

  assert.equal(record.bestPercent, 100);
  assert.equal(record.attempts.length, 2);
  assert.equal(record.attemptCount, 2);
  assert.equal(record.attempts.at(-1).percent, 0);
});

test("a corrected answer remains an error in the first-attempt score", () => {
  const lesson = course.lessons[0];
  const firstAnswers = lesson.checks.map((check, index) => (
    index === 0 ? check.choices.find((choice) => choice !== check.answer) : check.answer
  ));
  const completed = core.completeLesson(
    core.emptyState(), "brother", lesson, ["can"], firstAnswers,
    new Date("2026-08-11T08:00:00Z"), "2026-08-11"
  );
  assert.equal(completed.result.percent, Math.round(((lesson.checks.length - 1) / lesson.checks.length) * 100));
  assert.equal(completed.result.sessionDate, "2026-08-11");
  assert.equal(core.lessonProgress(completed.state, "brother", lesson.id).latestSessionDate, "2026-08-11");
});

test("adaptive print advice follows the workbook thresholds", () => {
  assert.equal(core.recommendation(90).level, "pass");
  assert.equal(core.recommendation(89).level, "review");
  assert.equal(core.recommendation(70).level, "review");
  assert.equal(core.recommendation(69).level, "retry");
});

test("completed lessons from before the reward release are backfilled idempotently", () => {
  assert.match(grammarUiSource, /backfillCompletedLessonRewards\(\)/);
  assert.match(grammarUiSource, /silent: true/);
  assert.match(grammarUiSource, /lessonId: lesson\.id/);
});

test("the grammar UI mirrors its isolated local state into family cloud sync", () => {
  assert.match(grammarUiSource, /GrammarIslandSync/);
  assert.match(grammarUiSource, /learning-activity-context-change/);
  assert.match(grammarUiSource, /persistGrammarState/);
});

test("paper days show an actionable worksheet card instead of saying grammar is not scheduled", () => {
  assert.match(grammarUiSource, /GrammarPaperPracticeSync\?\.getTask/);
  assert.match(grammarUiSource, /今天做练习卷/);
  assert.match(grammarUiSource, /做完后回到今日任务，点击“完成 \+10☀”/);
  assert.equal(grammarUiSource.indexOf("paperTaskCard(paperTask)") < grammarUiSource.indexOf("waitingCard(nextLesson, nextDate)"), true);
});

test("same-child cloud refreshes cannot rebuild an active grammar lesson", () => {
  const contextRender = grammarUiSource.slice(
    grammarUiSource.indexOf("function renderForContext"),
    grammarUiSource.indexOf("function mergeGrammarStates")
  );
  assert.match(contextRender, /if \(nextKidId === kidId && activeLesson\) return;/);
  assert.equal(contextRender.indexOf("activeLesson) return") < contextRender.indexOf("render();"), true);
});

test("an unsaved parent schedule draft survives unrelated app renders", () => {
  assert.match(grammarUiSource, /parentScheduleDraft/);
  assert.match(grammarUiSource, /云端刷新不会覆盖当前选择/);
  assert.match(grammarUiSource, /formWeekdays/);
});

test("the CloudBase bundle includes every grammar-island runtime file", () => {
  assert.match(deploySource, /grammar-island-core\.js/);
  assert.match(deploySource, /grammar-paper-practice\.js/);
  assert.match(deploySource, /grammar-island-ui\.js/);
  assert.match(deploySource, /grammar-island-course\.js/);
  assert.match(deploySource, /grammar-media\/\.\"/);
});
