import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

await import("../reward-progress.js");
const rewards = globalThis.RewardProgress;
const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");
const plants = [
  { id: "sunflower", unlockAt: 10 },
  { id: "peashooter", unlockAt: 30 },
  { id: "wallnut", unlockAt: 60 }
];

function stateWith(brotherTasks = [], youngerTasks = []) {
  return {
    days: {
      brother: { "2026-08-09": { tasks: brotherTasks } },
      younger: { "2026-08-09": { tasks: youngerTasks } }
    },
    gardens: { brother: [], younger: [] }
  };
}

test("both children start with the same zero sun balance", () => {
  const state = stateWith();
  assert.equal(rewards.earnedSun(state, "brother"), 0);
  assert.equal(rewards.earnedSun(state, "younger"), 0);
});

test("upgrade preserves current sun and seeds each child's permanent unlocks", () => {
  const state = stateWith(
    [{ done: true }, { done: true }, { done: true }],
    [{ done: true }]
  );
  rewards.ensure(state, plants);
  assert.equal(rewards.earnedSun(state, "brother"), 30);
  assert.equal(rewards.earnedSun(state, "younger"), 10);
  assert.deepEqual(state.rewardProgress.unlockedPlants.brother, ["sunflower", "peashooter"]);
  assert.deepEqual(state.rewardProgress.unlockedPlants.younger, ["sunflower"]);
});

test("an unlocked plant stays unlocked after a completion is undone", () => {
  const task = { done: true };
  const state = stateWith([task]);
  rewards.ensure(state, plants);
  task.done = false;
  rewards.ensure(state, plants);
  assert.equal(rewards.earnedSun(state, "brother"), 0);
  assert.equal(rewards.isPlantUnlocked(state, "brother", "sunflower"), true);
});

test("excused tasks award no sun and an existing squad is preserved as unlocked", () => {
  const state = stateWith([{ done: false, excused: true }]);
  state.gardens.brother = ["peashooter"];
  rewards.ensure(state, plants);
  assert.equal(rewards.earnedSun(state, "brother"), 0);
  assert.equal(rewards.isPlantUnlocked(state, "brother", "peashooter"), true);
});

test("an archived completed temporary task keeps its historical sun reward", () => {
  const state = stateWith([{ id: "dance", source: "parent", done: true, archived: true }]);
  assert.equal(rewards.earnedSun(state, "brother"), 10);
});

test("legacy over-cap squads are repaired without losing permanent unlocks", () => {
  const catalog = [
    ...plants,
    { id: "snowpea", unlockAt: 100 },
    { id: "cherry", unlockAt: 160 },
    { id: "melon", unlockAt: 240 }
  ];
  const state = stateWith();
  state.gardens.brother = ["sunflower", "peashooter", "wallnut", "snowpea", "cherry", "melon"];
  rewards.ensure(state, catalog);
  const repaired = rewards.normalizeSquads(state, catalog, 5);
  assert.deepEqual(repaired, ["brother"]);
  assert.deepEqual(state.gardens.brother, ["sunflower", "peashooter", "wallnut", "snowpea", "cherry"]);
  assert.equal(rewards.isPlantUnlocked(state, "brother", "melon"), true);
});

test("squad repair removes duplicates and unknown plants", () => {
  const state = stateWith();
  state.gardens.younger = ["sunflower", "sunflower", "unknown", "wallnut"];
  const repaired = rewards.normalizeSquads(state, plants, 5);
  assert.deepEqual(repaired, ["younger"]);
  assert.deepEqual(state.gardens.younger, ["sunflower", "wallnut"]);
});

test("the peashooter uses an emoji supported by older Android fonts", () => {
  assert.match(appSource, /id: "peashooter", icon: "🌿"/);
  assert.doesNotMatch(appSource, /🫛/);
});
