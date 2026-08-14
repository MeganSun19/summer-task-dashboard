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

test("grammar bonus rewards add to the wallet without creating daily tasks", () => {
  const state = stateWith([{ done: true }]);
  const beforeTasks = structuredClone(state.days);
  assert.equal(rewards.addBonusReward(state, "brother", {
    id: "grammar:brother:w1-a-an",
    amount: 5,
    source: "grammar-island",
    earnedAt: "2026-08-11T08:00:00.000Z"
  }), true);

  assert.equal(rewards.taskSun(state, "brother"), 10);
  assert.equal(rewards.bonusSun(state, "brother"), 5);
  assert.equal(rewards.earnedSun(state, "brother"), 15);
  assert.deepEqual(state.days, beforeTasks);
});

test("the same grammar lesson reward cannot be claimed twice", () => {
  const state = stateWith();
  const reward = { id: "grammar:younger:w1-a-an", amount: 5, source: "grammar-island" };
  assert.equal(rewards.addBonusReward(state, "younger", reward), true);
  assert.equal(rewards.addBonusReward(state, "younger", reward), false);
  assert.equal(rewards.bonusSun(state, "younger"), 5);
  assert.equal(Object.keys(state.rewardProgress.bonusEvents.younger).length, 1);
});

test("a raised grammar reward upgrades the stable event once without duplicating it", () => {
  const state = stateWith();
  const oldReward = { id: "grammar:younger:w1-a-an", amount: 5, source: "grammar-island" };
  const newReward = { ...oldReward, amount: 10 };
  assert.equal(rewards.addBonusReward(state, "younger", oldReward), true);
  assert.equal(rewards.addBonusReward(state, "younger", newReward), true);
  assert.equal(rewards.addBonusReward(state, "younger", newReward), false);
  assert.equal(state.rewardProgress.bonusEvents.younger[oldReward.id].amount, 10);
  assert.equal(Object.keys(state.rewardProgress.bonusEvents.younger).length, 1);
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

test("grammar paper practice earns one normal task reward without touching bonus events", () => {
  const state = stateWith([{ id: "grammar-paper", source: "parent", moduleId: "grammarPaper", done: true }]);
  rewards.ensure(state, plants);
  const beforeBonus = structuredClone(state.rewardProgress.bonusEvents);
  assert.equal(rewards.taskSun(state, "brother"), 10);
  assert.equal(rewards.earnedSun(state, "brother"), 10);
  assert.deepEqual(state.rewardProgress.bonusEvents, beforeBonus);
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

test("the app bridges grammar completion into the independent bonus ledger", () => {
  assert.match(appSource, /grammar-island-reward-earned/);
  assert.match(appSource, /grammar:\$\{kidId\}:\$\{lessonId\}/);
  assert.match(appSource, /GRAMMAR_LESSON_BONUS_SUN = 10/);
});
