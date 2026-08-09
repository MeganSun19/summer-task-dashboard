(function (root) {
  function mergeStoredStates(legacy, current) {
    const merged = { ...legacy, ...current };
    merged.days = { brother: {}, younger: {} };
    ["brother", "younger"].forEach((kidId) => {
      const legacyDays = legacy.days?.[kidId] || {};
      const currentDays = current.days?.[kidId] || {};
      const dates = new Set([...Object.keys(legacyDays), ...Object.keys(currentDays)]);
      dates.forEach((date) => {
        const oldDay = legacyDays[date];
        const newDay = currentDays[date];
        if (!oldDay || !newDay) {
          merged.days[kidId][date] = structuredClone(newDay || oldDay);
          return;
        }
        const oldTasks = new Map((oldDay.tasks || []).map((item) => [item.id, item]));
        merged.days[kidId][date] = {
          ...oldDay,
          ...newDay,
          tasks: (newDay.tasks || []).map((item) => {
            const oldTask = oldTasks.get(item.id);
            const done = Boolean(item.done || oldTask?.done);
            const excused = !done && Boolean(item.excused || oldTask?.excused);
            const mergedTask = { ...item, done, excused };
            if (done) mergedTask.completedOn = item.completedOn || oldTask?.completedOn || date;
            else delete mergedTask.completedOn;
            if (excused) mergedTask.excusedOn = item.excusedOn || oldTask?.excusedOn || date;
            else delete mergedTask.excusedOn;
            return mergedTask;
          }),
          mistakes: newDay.mistakes || oldDay.mistakes || "",
          note: newDay.note || oldDay.note || ""
        };
      });
    });
    merged.taskSettings = {
      brother: { ...(legacy.taskSettings?.brother || {}), ...(current.taskSettings?.brother || {}) },
      younger: { ...(legacy.taskSettings?.younger || {}), ...(current.taskSettings?.younger || {}) }
    };
    merged.gardens = {
      brother: current.gardens?.brother?.length ? current.gardens.brother : (legacy.gardens?.brother || []),
      younger: current.gardens?.younger?.length ? current.gardens.younger : (legacy.gardens?.younger || [])
    };
    merged.rewardProgress = {
      schemaVersion: 1,
      unlockedPlants: {
        brother: [...new Set([
          ...(legacy.rewardProgress?.unlockedPlants?.brother || []),
          ...(current.rewardProgress?.unlockedPlants?.brother || [])
        ])],
        younger: [...new Set([
          ...(legacy.rewardProgress?.unlockedPlants?.younger || []),
          ...(current.rewardProgress?.unlockedPlants?.younger || [])
        ])]
      }
    };
    merged.planPeriods = current.planPeriods?.length ? current.planPeriods : (legacy.planPeriods || []);
    merged.learningActivities = current.learningActivities || current.englishExperiment
      || legacy.learningActivities || legacy.englishExperiment;
    merged.englishExperiment = merged.learningActivities;
    return merged;
  }

  root.TaskStateMigration = Object.freeze({ mergeStoredStates });
})(typeof window === "undefined" ? globalThis : window);
