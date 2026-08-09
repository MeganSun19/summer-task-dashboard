(function (root) {
  const KID_IDS = ["brother", "younger"];

  function earnedSun(state, kidId) {
    return Object.values(state.days?.[kidId] || {}).reduce((sum, day) => (
      sum + (day.tasks || []).filter((item) => item.done).length * 10
    ), 0);
  }

  function ensure(state, plantCatalog) {
    state.rewardProgress ||= { schemaVersion: 1, unlockedPlants: {} };
    state.rewardProgress.schemaVersion = 1;
    state.rewardProgress.unlockedPlants ||= {};

    KID_IDS.forEach((kidId) => {
      const unlocked = new Set(state.rewardProgress.unlockedPlants[kidId] || []);
      const totalSun = earnedSun(state, kidId);
      (state.gardens?.[kidId] || []).forEach((plantId) => unlocked.add(plantId));
      plantCatalog.filter((plant) => totalSun >= plant.unlockAt).forEach((plant) => unlocked.add(plant.id));
      state.rewardProgress.unlockedPlants[kidId] = plantCatalog
        .map((plant) => plant.id)
        .filter((plantId) => unlocked.has(plantId));
    });
    return state.rewardProgress;
  }

  function isPlantUnlocked(state, kidId, plantId) {
    return Boolean(state.rewardProgress?.unlockedPlants?.[kidId]?.includes(plantId));
  }

  root.RewardProgress = Object.freeze({ earnedSun, ensure, isPlantUnlocked });
})(typeof window === "undefined" ? globalThis : window);
