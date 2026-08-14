import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

await import("../family-task-schedules.js");
const schedules = globalThis.FamilyTaskSchedules;
const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");

function sample(overrides = {}) {
  return schedules.normalizeSchedule({
    id: "schedule-dance",
    taskId: "task-dance",
    title: "练习舞蹈",
    detail: "练习前半段",
    instruction: "热身后跟视频练习三遍",
    kidIds: ["brother"],
    recurrence: "alternate",
    startDate: "2026-08-10",
    endDate: "2026-08-16",
    status: "published",
    ...overrides
  });
}

test("expands one-time, daily, alternate and custom schedules", () => {
  assert.deepEqual(schedules.expandDates({ recurrence: "once", startDate: "2026-08-10" }), ["2026-08-10"]);
  assert.deepEqual(schedules.expandDates({ recurrence: "daily", startDate: "2026-08-10", endDate: "2026-08-12" }), [
    "2026-08-10", "2026-08-11", "2026-08-12"
  ]);
  assert.deepEqual(sample().dates, ["2026-08-10", "2026-08-12", "2026-08-14", "2026-08-16"]);
  assert.deepEqual(schedules.expandDates({ recurrence: "custom", customDates: ["2026-08-13", "bad", "2026-08-11", "2026-08-13"] }), [
    "2026-08-11", "2026-08-13"
  ]);
});

test("temporary-task submission uses visible in-app validation on every mobile browser", () => {
  assert.match(indexSource, /id="familyTaskForm"[^>]*novalidate/);
  assert.match(indexSource, /id="familyTaskPreview"[^>]*aria-live="polite"/);
  assert.match(appSource, /function showFamilyTaskFormError/);
  assert.match(appSource, /结束日期不能早于开始日期/);
  assert.match(appSource, /请填写至少一个有效的自选日期/);
});

test("creates traceable daily instances only for scheduled children and dates", () => {
  const schedule = sample();
  assert.equal(schedules.applies(schedule, "brother", "2026-08-12"), true);
  assert.equal(schedules.applies(schedule, "younger", "2026-08-12"), false);
  const item = schedules.createInstance(schedule, "brother", "2026-08-12");
  assert.equal(item.id, "instance-task-dance-brother-2026-08-12");
  assert.equal(item.taskId, "task-dance");
  assert.equal(item.scheduleId, "schedule-dance");
  assert.equal(item.source, "parent");
  assert.equal(item.moduleId, "familyTask");
});

test("editing or cancelling a schedule updates pending instances but preserves completed history", () => {
  const original = sample({ recurrence: "once", startDate: "2026-08-10" });
  const pending = schedules.createInstance(original, "brother", "2026-08-10");
  const edited = sample({ recurrence: "once", startDate: "2026-08-10", title: "练习完整舞蹈" });
  assert.equal(schedules.reconcileTasks([pending], [edited], "brother", "2026-08-10")[0].title, "练习完整舞蹈");

  const completed = { ...pending, done: true };
  assert.deepEqual(schedules.reconcileTasks([completed], [{ ...edited, status: "cancelled" }], "brother", "2026-08-10"), [{ ...completed, archived: true }]);
  assert.deepEqual(schedules.reconcileTasks([pending], [{ ...edited, status: "cancelled" }], "brother", "2026-08-10"), [{ ...pending, archived: true }]);
});

test("a carried course day loads temporary tasks by the actual calendar date", () => {
  const daily = sample({ recurrence: "daily", startDate: "2026-08-10", endDate: "2026-08-11" });
  const courseTasks = [{ id: "poem", source: "course", done: false }];
  const onActualDate = schedules.reconcileTasks(courseTasks, [daily], "brother", "2026-08-11");
  assert.deepEqual(onActualDate.map((item) => item.id), [
    "poem",
    "instance-task-dance-brother-2026-08-11"
  ]);
});

test("a recurring schedule archives yesterday's completion and creates today's simple instance", () => {
  const daily = sample({ recurrence: "daily", startDate: "2026-08-10", endDate: "2026-08-11" });
  const completedYesterday = { ...schedules.createInstance(daily, "brother", "2026-08-10"), done: true };
  const result = schedules.reconcileTasks([completedYesterday], [daily], "brother", "2026-08-11");
  assert.deepEqual(result.map((item) => item.id), [
    "instance-task-dance-brother-2026-08-10",
    "instance-task-dance-brother-2026-08-11"
  ]);
  assert.equal(result[0].archived, true);
  assert.equal(result[1].archived, undefined);
});

test("an unfinished temporary task expires without deletion while today's instance is added", () => {
  const daily = sample({ recurrence: "daily", startDate: "2026-08-10", endDate: "2026-08-11" });
  const overdue = schedules.createInstance(daily, "brother", "2026-08-10");
  const result = schedules.reconcileTasks([overdue], [daily], "brother", "2026-08-11");
  assert.deepEqual(result.map((item) => item.id), [
    "instance-task-dance-brother-2026-08-10",
    "instance-task-dance-brother-2026-08-11"
  ]);
  assert.equal(result[0].done, false);
  assert.equal(result[0].archived, true);
});
