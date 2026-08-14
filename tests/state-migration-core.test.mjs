import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

await import("../state-migration-core.js");
const { mergeStoredStates, mergeDeviceProgress, mergeRemoteProgress, mergeGardenProgress, mergeGrammarIslandStates } = globalThis.TaskStateMigration;
const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");

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

test("cloud merging unions idempotent grammar reward events from both devices", () => {
  const local = {
    days: { brother: {}, younger: {} },
    rewardProgress: { bonusEvents: { brother: {
      "grammar:brother:w1-a-an": { id: "grammar:brother:w1-a-an", amount: 5, source: "grammar-island" }
    }, younger: {} } }
  };
  const remote = {
    days: { brother: {}, younger: {} },
    rewardProgress: { bonusEvents: { brother: {
      "grammar:brother:w1-plurals": { id: "grammar:brother:w1-plurals", amount: 5, source: "grammar-island" }
    }, younger: {
      "grammar:younger:w1-a-an": { id: "grammar:younger:w1-a-an", amount: 5, source: "grammar-island" }
    } } }
  };

  const merged = mergeStoredStates(local, remote);
  assert.deepEqual(Object.keys(merged.rewardProgress.bonusEvents.brother).sort(), [
    "grammar:brother:w1-a-an", "grammar:brother:w1-plurals"
  ]);
  assert.deepEqual(Object.keys(merged.rewardProgress.bonusEvents.younger), ["grammar:younger:w1-a-an"]);
});

test("a stale realtime payload cannot erase a just-earned local grammar reward", () => {
  const local = {
    gardens: { brother: [], younger: [] },
    rewardProgress: { bonusEvents: { brother: {
      "grammar:brother:w1-a-an": { id: "grammar:brother:w1-a-an", amount: 5, source: "grammar-island" }
    }, younger: {} } }
  };
  const staleRealtime = {
    gardens: { brother: [], younger: [] },
    rewardProgress: { bonusEvents: { brother: {}, younger: {} } }
  };

  const merged = mergeGardenProgress(local, staleRealtime);
  assert.equal(merged.rewardProgress.bonusEvents.brother["grammar:brother:w1-a-an"].amount, 5);
});

test("grammar progress and schedules merge across devices without losing either child's records", () => {
  const local = { version: 1, kids: {
    brother: { schedule: { weekdays: [2, 5], startDate: "2026-08-11", updatedAt: "2026-08-11T01:00:00.000Z" }, lessons: {
      "w1-a-an": { completedAt: "2026-08-11T01:00:00.000Z", latestAt: "2026-08-11T01:00:00.000Z", bestPercent: 83, attemptCount: 1, attempts: [] }
    } },
    younger: { schedule: null, lessons: {} }
  } };
  const remote = { version: 1, kids: {
    brother: { schedule: { weekdays: [1, 3, 6], startDate: "2026-08-12", updatedAt: "2026-08-11T02:00:00.000Z" }, lessons: {
      "w1-plurals": { completedAt: "2026-08-11T02:00:00.000Z", latestAt: "2026-08-11T02:00:00.000Z", bestPercent: 100, attemptCount: 1, attempts: [] }
    } },
    younger: { schedule: { weekdays: [4], startDate: "2026-08-13", updatedAt: "2026-08-11T02:00:00.000Z" }, lessons: {
      "w1-a-an": { completedAt: "2026-08-11T02:00:00.000Z", latestAt: "2026-08-11T02:00:00.000Z", bestPercent: 100, attemptCount: 1, attempts: [] }
    } }
  } };

  const merged = mergeGrammarIslandStates(local, remote);
  assert.deepEqual(merged.kids.brother.schedule.weekdays, [1, 3, 6]);
  assert.deepEqual(Object.keys(merged.kids.brother.lessons).sort(), ["w1-a-an", "w1-plurals"]);
  assert.equal(merged.kids.younger.lessons["w1-a-an"].bestPercent, 100);
});

test("a newer grammar reset tombstone prevents an older device from resurrecting a lesson", () => {
  const completed = { version: 1, kids: {
    brother: { schedule: null, lessons: { "w1-a-an": {
      completedAt: "2026-08-11T01:00:00.000Z", latestAt: "2026-08-11T01:00:00.000Z", bestPercent: 100, attempts: []
    } } }, younger: { schedule: null, lessons: {} }
  } };
  const reset = { version: 1, kids: {
    brother: { schedule: null, lessons: { "w1-a-an": { deletedAt: "2026-08-11T03:00:00.000Z" } } },
    younger: { schedule: null, lessons: {} }
  } };

  const merged = mergeGrammarIslandStates(completed, reset);
  assert.equal(merged.kids.brother.lessons["w1-a-an"].completedAt, undefined);
  assert.equal(merged.kids.brother.lessons["w1-a-an"].deletedAt, "2026-08-11T03:00:00.000Z");
});

test("merging identical grammar state is a stable no-op", () => {
  const state = { version: 1, updatedAt: "2026-08-11T03:00:00.000Z", kids: {
    brother: { schedule: { weekdays: [2, 5], startDate: "2026-08-11", updatedAt: "2026-08-11T02:00:00.000Z" }, lessons: {} },
    younger: { schedule: null, lessons: {} }
  } };
  assert.deepEqual(mergeGrammarIslandStates(state, state), state);
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

test("normal remote loads preserve newer local task completion without restoring stale settings", () => {
  const local = {
    startDate: "2026-08-01",
    updatedAt: "2026-08-14T03:00:00.000Z",
    days: { brother: { "2026-08-14": { tasks: [{
      id: "reading", done: true, completedOn: "2026-08-14", statusUpdatedAt: "2026-08-14T02:59:00.000Z"
    }] } }, younger: {} },
    taskSettings: { brother: { math: { title: "本机旧设置" } }, younger: {} },
    summerPlan: { kids: { brother: { currentDay: 6, currentDate: "2026-08-14" } } }
  };
  const remote = {
    startDate: "2026-08-01",
    updatedAt: "2026-08-14T02:00:00.000Z",
    days: { brother: { "2026-08-14": { tasks: [{ id: "reading", done: false }] } }, younger: {} },
    taskSettings: { brother: { math: { title: "云端当前设置" } }, younger: {} },
    summerPlan: { kids: { brother: { currentDay: 6, currentDate: "2026-08-14" } } }
  };
  const merged = mergeRemoteProgress(local, remote);
  assert.equal(merged.days.brother["2026-08-14"].tasks[0].done, true);
  assert.equal(merged.days.brother["2026-08-14"].tasks[0].completedOn, "2026-08-14");
  assert.equal(merged.taskSettings.brother.math.title, "云端当前设置");
});

test("remote progress merges a variable-sized day task by task across separate study sessions", () => {
  const taskIds = ["phonics", "words", "raz", "math", "poem", "listening", "parent-extra"];
  const makeTask = (id, done, statusUpdatedAt) => ({
    id,
    done,
    ...(done ? { completedOn: "2026-08-14" } : {}),
    statusUpdatedAt
  });
  const local = {
    startDate: "2026-08-01",
    updatedAt: "2026-08-14T12:00:00.000Z",
    days: { brother: { "2026-08-14": { tasks: taskIds.map((id, index) => (
      makeTask(id, index < 5, index < 5 ? `2026-08-14T${String(index + 7).padStart(2, "0")}:00:00.000Z` : "2026-08-14T06:00:00.000Z")
    )) } }, younger: {} }
  };
  const remote = {
    startDate: "2026-08-01",
    updatedAt: "2026-08-14T13:00:00.000Z",
    days: { brother: { "2026-08-14": { tasks: taskIds.map((id, index) => (
      makeTask(id, index >= 5, index >= 5 ? `2026-08-14T${index + 7}:00:00.000Z` : "2026-08-14T06:00:00.000Z")
    )) } }, younger: {} }
  };

  const merged = mergeRemoteProgress(local, remote);
  assert.equal(merged.days.brother["2026-08-14"].tasks.length, 7);
  assert.deepEqual(merged.days.brother["2026-08-14"].tasks.map((task) => task.done), Array(7).fill(true));
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

test("newer local garden removal is not resurrected by an older cloud squad", () => {
  const local = {
    days: { brother: {}, younger: {} },
    gardens: { brother: ["sunflower", "peashooter", "wallnut", "snowpea", "cherry"], younger: [] },
    gardenUpdatedAt: { brother: "2026-08-10T10:00:00.000Z", younger: null }
  };
  const remote = {
    days: { brother: {}, younger: {} },
    gardens: { brother: ["sunflower", "peashooter", "wallnut", "snowpea", "cherry", "melon"], younger: [] },
    gardenUpdatedAt: { brother: "2026-08-10T09:00:00.000Z", younger: null }
  };
  const merged = mergeDeviceProgress(local, remote);
  assert.deepEqual(merged.gardens.brother, local.gardens.brother);
  assert.equal(merged.gardenUpdatedAt.brother, local.gardenUpdatedAt.brother);
});

test("a newer explicit empty squad wins over stale nonempty garden data", () => {
  const local = {
    days: { brother: {}, younger: {} },
    gardens: { brother: [], younger: [] },
    gardenUpdatedAt: { brother: "2026-08-10T11:00:00.000Z", younger: null }
  };
  const remote = {
    days: { brother: {}, younger: {} },
    gardens: { brother: ["sunflower"], younger: [] },
    gardenUpdatedAt: { brother: "2026-08-10T10:00:00.000Z", younger: null }
  };
  assert.deepEqual(mergeDeviceProgress(local, remote).gardens.brother, []);
});

test("a newer cloud garden change beats an older local squad", () => {
  const local = {
    days: { brother: {}, younger: {} },
    gardens: { brother: ["sunflower"], younger: [] },
    gardenUpdatedAt: { brother: "2026-08-10T10:00:00.000Z", younger: null }
  };
  const remote = {
    days: { brother: {}, younger: {} },
    gardens: { brother: ["peashooter"], younger: [] },
    gardenUpdatedAt: { brother: "2026-08-10T11:00:00.000Z", younger: null }
  };
  assert.deepEqual(mergeDeviceProgress(local, remote).gardens.brother, ["peashooter"]);
});

test("a late stale realtime payload cannot undo a just-saved local squad change", () => {
  const local = {
    days: { brother: {}, younger: {} },
    gardens: { brother: ["sunflower", "melon"], younger: [] },
    gardenUpdatedAt: { brother: "2026-08-10T12:00:00.000Z", younger: null },
    taskSettings: { brother: { math: { enabled: true } }, younger: {} }
  };
  const staleRealtime = {
    days: { brother: {}, younger: {} },
    gardens: { brother: ["sunflower"], younger: [] },
    gardenUpdatedAt: { brother: "2026-08-10T11:59:00.000Z", younger: null },
    taskSettings: { brother: { math: { enabled: false } }, younger: {} }
  };
  const merged = mergeGardenProgress(local, staleRealtime);
  assert.deepEqual(merged.gardens.brother, ["sunflower", "melon"]);
  assert.equal(merged.taskSettings.brother.math.enabled, false);
});

test("every remote-state path applies garden last-write-wins before rendering", () => {
  const applyRemote = appSource.slice(appSource.indexOf("function applyRemoteState"), appSource.indexOf("function updateCloudStatus"));
  assert.match(applyRemote, /mergeRemoteProgress\(\s*conflictState \|\| localStateBeforeRemote,\s*remoteState\s*\)/);
  assert.match(applyRemote, /completionRecovered/);
  assert.match(applyRemote, /mergeGardenProgress\(localStateBeforeRemote, selectedState\)/);
  assert.match(applyRemote, /completionRecovered \|\| progressRecovered \|\| gardenRecovered/);
});
