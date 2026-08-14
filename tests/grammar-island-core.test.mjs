import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

await import("../grammar-island-core.js");
await import("../curriculum/grammar-island-course.js");

const core = globalThis.GrammarIslandCore;
const course = globalThis.GRAMMAR_ISLAND_COURSE;
const grammarUiSource = await readFile(new URL("../grammar-island-ui.js", import.meta.url), "utf8");
const deploySource = await readFile(new URL("../deploy-cloudbase.sh", import.meta.url), "utf8");

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
});
