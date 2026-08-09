import assert from "node:assert/strict";
import { test } from "node:test";

await import("../reward-progress.js");
const rewards = globalThis.RewardProgress;
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
