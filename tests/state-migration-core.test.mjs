import assert from "node:assert/strict";
import { test } from "node:test";

await import("../state-migration-core.js");
const { mergeStoredStates, mergeDeviceProgress } = globalThis.TaskStateMigration;

test("legacy dashboard state and English-island progress merge without losing completions", () => {
  const legacy = {
    startDate: "2026-08-01",
    days: {
      brother: {
        "2026-08-07": { tasks: [{ id: "math", done: true }, { id: "reading", done: false }], mistakes: "7×8", note: "" },
        "2026-08-01": { tasks: [{ id: "poem", done: true }] }
      },
      younger: {}
    },
    gardens: { brother: ["sunflower"], younger: [] },
    rewardProgress: { unlockedPlants: { brother: ["sunflower"], younger: [] } },
    taskSettings: { brother: { math: { enabled: true } }, younger: {} },
    planPeriods: [{ id: "legacy-period" }]
  };
  const current = {
    startDate: "2026-08-01",
    days: {
      brother: {
        "2026-08-07": { tasks: [{ id: "math", done: false }, { id: "englishIsland", done: true }], mistakes: "", note: "英语岛已开始" }
      },
      younger: {
        "2026-08-07": { tasks: [{ id: "englishIsland", done: false }] }
      }
    },
    gardens: { brother: [], younger: [] },
    rewardProgress: { unlockedPlants: { brother: ["peashooter"], younger: ["sunflower"] } },
    taskSettings: { brother: { englishIsland: { enabled: true } }, younger: {} },
    englishExperiment: { courseStarts: { brother: "2026-08-06", younger: null } }
  };

  const merged = mergeStoredStates(legacy, current);
  assert.equal(merged.days.brother["2026-08-07"].tasks.find((item) => item.id === "math").done, true);
  assert.equal(merged.days.brother["2026-08-07"].tasks.find((item) => item.id === "englishIsland").done, true);
  assert.equal(merged.days.brother["2026-08-07"].mistakes, "7×8");
  assert.equal(merged.days.brother["2026-08-01"].tasks[0].done, true);
  assert.deepEqual(merged.gardens.brother, ["sunflower"]);
  assert.deepEqual(merged.rewardProgress.unlockedPlants.brother, ["sunflower", "peashooter"]);
  assert.deepEqual(merged.rewardProgress.unlockedPlants.younger, ["sunflower"]);
  assert.equal(merged.taskSettings.brother.math.enabled, true);
  assert.equal(merged.taskSettings.brother.englishIsland.enabled, true);
  assert.equal(merged.englishExperiment.courseStarts.brother, "2026-08-06");
  assert.equal(merged.learningActivities.courseStarts.brother, "2026-08-06");
});

test("cloud recovery keeps local completion dates while remote settings stay authoritative", () => {
  const local = {
    startDate: "2026-08-01",
    days: { brother: { "2026-08-09": { tasks: [{ id: "math", done: true, completedOn: "2026-08-09" }] } }, younger: {} },
    taskSettings: { brother: { math: { title: "本机旧名称" } }, younger: {} }
  };
  const remote = {
    startDate: "2026-08-01",
    days: { brother: { "2026-08-09": { tasks: [{ id: "math", done: false }] } }, younger: {} },
    taskSettings: { brother: { math: { title: "云端新名称" } }, younger: {} }
  };
  const merged = mergeStoredStates(local, remote);
  assert.equal(merged.days.brother["2026-08-09"].tasks[0].done, true);
  assert.equal(merged.days.brother["2026-08-09"].tasks[0].completedOn, "2026-08-09");
  assert.equal(merged.taskSettings.brother.math.title, "云端新名称");
});

test("device recovery keeps legacy completions without resurrecting a stale exemption", () => {
  const local = {
    startDate: "2026-08-01",
    days: { brother: { "2026-08-10": { tasks: [
      { id: "reading", done: true, completedOn: "2026-08-10" },
      { id: "handwriting", done: false, excused: true, excusedOn: "2026-08-07" }
    ] } }, younger: {} }
  };
  const remote = {
    startDate: "2026-08-01",
    days: { brother: { "2026-08-10": { tasks: [
      { id: "reading", done: false },
      { id: "handwriting", done: false, excused: false }
    ] } }, younger: {} }
  };
  const merged = mergeDeviceProgress(local, remote);
  assert.equal(merged.days.brother["2026-08-10"].tasks[0].done, true);
  assert.equal(merged.days.brother["2026-08-10"].tasks[1].excused, false);
});

test("device recovery preserves a valid date-specific exemption", () => {
  const local = {
    startDate: "2026-08-01",
    days: { brother: { "2026-08-09": { tasks: [
      { id: "writing", done: false, excused: true, excusedOn: "2026-08-09" }
    ] } }, younger: {} }
  };
  const remote = {
    startDate: "2026-08-01",
    days: { brother: { "2026-08-09": { tasks: [
      { id: "writing", done: false, excused: false }
    ] } }, younger: {} }
  };
  const merged = mergeDeviceProgress(local, remote);
  assert.equal(merged.days.brother["2026-08-09"].tasks[0].excused, true);
  assert.equal(merged.days.brother["2026-08-09"].tasks[0].excusedOn, "2026-08-09");
});

test("newer task status wins when two devices conflict", () => {
  const local = {
    startDate: "2026-08-01",
    days: { brother: { "2026-08-10": { tasks: [{
      id: "handwriting", done: false, excused: false, statusUpdatedAt: "2026-08-10T03:00:00.000Z"
    }] } }, younger: {} }
  };
  const remote = {
    startDate: "2026-08-01",
    days: { brother: { "2026-08-10": { tasks: [{
      id: "handwriting", done: false, excused: true, excusedOn: "2026-08-10", statusUpdatedAt: "2026-08-10T02:00:00.000Z"
    }] } }, younger: {} }
  };
  const merged = mergeDeviceProgress(local, remote);
  assert.equal(merged.days.brother["2026-08-10"].tasks[0].excused, false);
  assert.equal(merged.days.brother["2026-08-10"].tasks[0].statusUpdatedAt, "2026-08-10T03:00:00.000Z");
});

test("device recovery keeps the furthest learning day and completed local-only tasks", () => {
  const local = {
    startDate: "2026-08-01",
    days: { brother: { "2026-08-10": { tasks: [
      { id: "reading", done: true },
      { id: "parent-writing", source: "parent", done: true }
    ] } }, younger: {} },
    summerPlan: { kids: { brother: { currentDay: 2, currentDate: "2026-08-10" } } }
  };
  const remote = {
    startDate: "2026-08-01",
    days: { brother: { "2026-08-10": { tasks: [{ id: "reading", done: false }] } }, younger: {} },
    summerPlan: { kids: { brother: { currentDay: 1, currentDate: "2026-08-07" } } }
  };
  const merged = mergeDeviceProgress(local, remote);
  assert.equal(merged.summerPlan.kids.brother.currentDay, 2);
  assert.equal(merged.summerPlan.kids.brother.currentDate, "2026-08-10");
  assert.deepEqual(merged.days.brother["2026-08-10"].tasks.map((task) => task.id), ["reading", "parent-writing"]);
  assert.equal(merged.days.brother["2026-08-10"].tasks.filter((task) => task.done).length, 2);
});

test("device recovery keeps the newest English activity record from either device", () => {
  const local = {
    startDate: "2026-08-01", days: { brother: {}, younger: {} },
    learningActivities: { progress: { brother: { "2026-08-10": {
      phonics: { score: 5, updatedAt: "2026-08-10T03:00:00.000Z" }
    } }, younger: {} } }
  };
  const remote = {
    startDate: "2026-08-01", days: { brother: {}, younger: {} },
    learningActivities: { progress: { brother: { "2026-08-10": {
      phonics: { score: 2, updatedAt: "2026-08-10T02:00:00.000Z" }
    } }, younger: {} } }
  };
  const merged = mergeDeviceProgress(local, remote);
  assert.equal(merged.learningActivities.progress.brother["2026-08-10"].phonics.score, 5);
});
