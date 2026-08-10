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

  function normalizeSquads(state, plantCatalog, limit = 5) {
    state.gardens ||= { brother: [], younger: [] };
    const validPlantIds = new Set(plantCatalog.map((plant) => plant.id));
    const repairedKidIds = [];
    KID_IDS.forEach((kidId) => {
      const original = Array.isArray(state.gardens[kidId]) ? state.gardens[kidId] : [];
      const normalized = [...new Set(original)]
        .filter((plantId) => validPlantIds.has(plantId))
        .slice(0, limit);
      if (JSON.stringify(original) !== JSON.stringify(normalized)) repairedKidIds.push(kidId);
      state.gardens[kidId] = normalized;
    });
    return repairedKidIds;
  }

  function isPlantUnlocked(state, kidId, plantId) {
    return Boolean(state.rewardProgress?.unlockedPlants?.[kidId]?.includes(plantId));
  }

  root.RewardProgress = Object.freeze({ earnedSun, ensure, normalizeSquads, isPlantUnlocked });
})(typeof window === "undefined" ? globalThis : window);
