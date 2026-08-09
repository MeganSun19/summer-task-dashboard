import assert from "node:assert/strict";
import { test } from "node:test";

await import("../state-migration-core.js");
const { mergeStoredStates } = globalThis.TaskStateMigration;

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
