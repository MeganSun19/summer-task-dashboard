(function (root) {
  const KID_IDS = ["brother", "younger"];

  function taskSun(state, kidId) {
    return Object.values(state.days?.[kidId] || {}).reduce((sum, day) => (
      sum + (day.tasks || []).filter((item) => item.done).length * 10
    ), 0);
  }

  function bonusSun(state, kidId) {
    return Object.values(state.rewardProgress?.bonusEvents?.[kidId] || {}).reduce((sum, event) => (
      sum + Math.max(0, Number(event?.amount || 0))
    ), 0);
  }

  function earnedSun(state, kidId) {
    return taskSun(state, kidId) + bonusSun(state, kidId);
  }

  function addBonusReward(state, kidId, event) {
    if (!KID_IDS.includes(kidId) || !event?.id || Number(event.amount) <= 0) return false;
    ensureRewardState(state);
    const existing = state.rewardProgress.bonusEvents[kidId][event.id];
    if (existing) {
      const upgradedAmount = Math.max(Number(existing.amount || 0), Number(event.amount));
      if (upgradedAmount === Number(existing.amount || 0)) return false;
      state.rewardProgress.bonusEvents[kidId][event.id] = {
        ...existing,
        amount: upgradedAmount
      };
      return true;
    }
    state.rewardProgress.bonusEvents[kidId][event.id] = {
      id: String(event.id),
      amount: Number(event.amount),
      source: String(event.source || "bonus"),
      earnedAt: String(event.earnedAt || new Date().toISOString())
    };
    return true;
  }

  function ensureRewardState(state) {
    state.rewardProgress ||= {};
    state.rewardProgress.schemaVersion = 2;
    state.rewardProgress.unlockedPlants ||= {};
    state.rewardProgress.bonusEvents ||= {};
    KID_IDS.forEach((kidId) => {
      state.rewardProgress.unlockedPlants[kidId] ||= [];
      state.rewardProgress.bonusEvents[kidId] ||= {};
    });
    return state.rewardProgress;
  }

  function ensure(state, plantCatalog) {
    ensureRewardState(state);

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

  root.RewardProgress = Object.freeze({ taskSun, bonusSun, earnedSun, addBonusReward, ensure, normalizeSquads, isPlantUnlocked });
})(typeof window === "undefined" ? globalThis : window);
