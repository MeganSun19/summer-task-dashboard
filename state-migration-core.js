(function (root) {
  function mergeGardenSquad(legacy, current, kidId) {
    const legacyUpdatedAt = legacy.gardenUpdatedAt?.[kidId] || "";
    const currentUpdatedAt = current.gardenUpdatedAt?.[kidId] || "";
    if (legacyUpdatedAt || currentUpdatedAt) {
      return structuredClone(legacyUpdatedAt > currentUpdatedAt
        ? (legacy.gardens?.[kidId] || [])
        : (current.gardens?.[kidId] || []));
    }
    return structuredClone(current.gardens?.[kidId]?.length
      ? current.gardens[kidId]
      : (legacy.gardens?.[kidId] || []));
  }

  function mergeGardenProgress(local, remote) {
    const merged = structuredClone(remote);
    merged.gardens = {
      brother: mergeGardenSquad(local, remote, "brother"),
      younger: mergeGardenSquad(local, remote, "younger")
    };
    merged.gardenUpdatedAt = {
      brother: [local.gardenUpdatedAt?.brother, remote.gardenUpdatedAt?.brother].filter(Boolean).sort().at(-1) || null,
      younger: [local.gardenUpdatedAt?.younger, remote.gardenUpdatedAt?.younger].filter(Boolean).sort().at(-1) || null
    };
    merged.rewardProgress ||= {};
    merged.rewardProgress.bonusEvents = mergeBonusEvents(local, remote);
    merged.grammarIsland = mergeGrammarIslandStates(local.grammarIsland, remote.grammarIsland);
    return merged;
  }

  function mergeBonusEvents(local, remote) {
    return {
      brother: {
        ...(local.rewardProgress?.bonusEvents?.brother || {}),
        ...(remote.rewardProgress?.bonusEvents?.brother || {})
      },
      younger: {
        ...(local.rewardProgress?.bonusEvents?.younger || {}),
        ...(remote.rewardProgress?.bonusEvents?.younger || {})
      }
    };
  }

  function mergeGrammarIslandStates(local, remote) {
    if (!local && !remote) return null;
    const result = { version: 1, kids: {} };
    ["brother", "younger"].forEach((kidId) => {
      const localKid = local?.kids?.[kidId] || {};
      const remoteKid = remote?.kids?.[kidId] || {};
      const localSchedule = localKid.schedule || null;
      const remoteSchedule = remoteKid.schedule || null;
      const schedule = !localSchedule ? remoteSchedule
        : !remoteSchedule ? localSchedule
          : String(localSchedule.updatedAt || "") > String(remoteSchedule.updatedAt || "") ? localSchedule : remoteSchedule;
      const lessons = {};
      const lessonIds = new Set([
        ...Object.keys(localKid.lessons || {}),
        ...Object.keys(remoteKid.lessons || {})
      ]);
      lessonIds.forEach((lessonId) => {
        const left = localKid.lessons?.[lessonId];
        const right = remoteKid.lessons?.[lessonId];
        if (!left || !right) {
          lessons[lessonId] = structuredClone(right || left);
          return;
        }
        const latestDeletion = [left.deletedAt, right.deletedAt].filter(Boolean).sort().at(-1) || "";
        const latestCompletion = [left.latestAt || left.completedAt, right.latestAt || right.completedAt].filter(Boolean).sort().at(-1) || "";
        if (latestDeletion && latestDeletion >= latestCompletion) {
          lessons[lessonId] = { deletedAt: latestDeletion };
          return;
        }
        if (left.deletedAt && !right.completedAt) {
          lessons[lessonId] = structuredClone(left);
          return;
        }
        if (right.deletedAt && !left.completedAt) {
          lessons[lessonId] = structuredClone(right);
          return;
        }
        const latestIsRight = String(right.latestAt || right.completedAt || "") >= String(left.latestAt || left.completedAt || "");
        const latest = latestIsRight ? right : left;
        const attempts = [...(left.attempts || []), ...(right.attempts || [])]
          .filter((attempt, index, values) => values.findIndex((candidate) => (
            candidate.completedAt === attempt.completedAt
            && candidate.percent === attempt.percent
          )) === index)
          .sort((a, b) => String(a.completedAt || "").localeCompare(String(b.completedAt || "")))
          .slice(-5);
        lessons[lessonId] = {
          ...structuredClone(latest),
          completedAt: [left.completedAt, right.completedAt].filter(Boolean).sort()[0] || latest.completedAt,
          latestAt: [left.latestAt, right.latestAt].filter(Boolean).sort().at(-1) || latest.latestAt,
          bestPercent: Math.max(Number(left.bestPercent || 0), Number(right.bestPercent || 0)),
          attemptCount: Math.max(Number(left.attemptCount || left.attempts?.length || 0), Number(right.attemptCount || right.attempts?.length || 0), attempts.length),
          attempts
        };
      });
      result.kids[kidId] = { lessons, schedule: schedule ? structuredClone(schedule) : null };
    });
    const latestUpdatedAt = [local?.updatedAt, remote?.updatedAt].filter(Boolean).sort().at(-1);
    if (latestUpdatedAt) result.updatedAt = latestUpdatedAt;
    return result;
  }

  function mergeStoredStates(legacy, current, options = {}) {
    const mergeLegacyExcused = options.mergeLegacyExcused !== false;
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
        const nextTasks = (newDay.tasks || []).map((item) => {
          const oldTask = oldTasks.get(item.id);
          const oldUpdatedAt = oldTask?.statusUpdatedAt || "";
          const newUpdatedAt = item.statusUpdatedAt || "";
          const authoritative = oldUpdatedAt && oldUpdatedAt > newUpdatedAt ? oldTask : item;
          const hasTimestamp = Boolean(oldUpdatedAt || newUpdatedAt);
          const done = hasTimestamp ? Boolean(authoritative?.done) : Boolean(item.done || oldTask?.done);
          const validExcuse = (task) => Boolean(task?.excused && task.excusedOn === date);
          const excused = !done && (hasTimestamp
            ? validExcuse(authoritative)
            : Boolean(validExcuse(item) || (mergeLegacyExcused && validExcuse(oldTask))));
          const mergedTask = { ...item, done, excused };
          mergedTask.statusUpdatedAt = authoritative?.statusUpdatedAt || oldUpdatedAt || newUpdatedAt || undefined;
          if (done) mergedTask.completedOn = authoritative?.completedOn || item.completedOn || oldTask?.completedOn || date;
          else delete mergedTask.completedOn;
          if (excused) mergedTask.excusedOn = authoritative?.excusedOn || item.excusedOn || oldTask?.excusedOn || date;
          else delete mergedTask.excusedOn;
          if (!mergedTask.statusUpdatedAt) delete mergedTask.statusUpdatedAt;
          return mergedTask;
        });
        const nextTaskIds = new Set(nextTasks.map((item) => item.id));
        const preservedLocalTasks = (oldDay.tasks || []).filter((item) => (
          !nextTaskIds.has(item.id) && (item.done || item.excused || item.source === "parent")
        ));
        merged.days[kidId][date] = {
          ...oldDay,
          ...newDay,
          tasks: [...nextTasks, ...preservedLocalTasks],
          mistakes: newDay.mistakes || oldDay.mistakes || "",
          note: newDay.note || oldDay.note || ""
        };
      });
    });
    merged.taskSettings = {
      brother: { ...(legacy.taskSettings?.brother || {}), ...(current.taskSettings?.brother || {}) },
      younger: { ...(legacy.taskSettings?.younger || {}), ...(current.taskSettings?.younger || {}) }
    };
    const mergedGarden = mergeGardenProgress(legacy, current);
    merged.gardens = mergedGarden.gardens;
    merged.gardenUpdatedAt = mergedGarden.gardenUpdatedAt;
    merged.rewardProgress = {
      schemaVersion: 2,
      unlockedPlants: {
        brother: [...new Set([
          ...(legacy.rewardProgress?.unlockedPlants?.brother || []),
          ...(current.rewardProgress?.unlockedPlants?.brother || [])
        ])],
        younger: [...new Set([
          ...(legacy.rewardProgress?.unlockedPlants?.younger || []),
          ...(current.rewardProgress?.unlockedPlants?.younger || [])
        ])]
      },
      bonusEvents: mergeBonusEvents(legacy, current)
    };
    merged.grammarIsland = mergeGrammarIslandStates(legacy.grammarIsland, current.grammarIsland);
    merged.planPeriods = current.planPeriods?.length ? current.planPeriods : (legacy.planPeriods || []);
    merged.learningActivities = mergeLearningActivities(
      legacy.learningActivities || legacy.englishExperiment,
      current.learningActivities || current.englishExperiment
    );
    merged.englishExperiment = merged.learningActivities;
    merged.updatedAt = [legacy.updatedAt, current.updatedAt].filter(Boolean).sort().at(-1);
    return merged;
  }

  function mergeDeviceProgress(local, remote) {
    // A valid exemption belongs to one exact calendar date. Preserve it just
    // like a completion; the date check in mergeStoredStates prevents an old
    // recurring-task exemption from leaking into later days.
    const merged = mergeStoredStates(local, remote, { mergeLegacyExcused: true });
    if (!local.summerPlan && !remote.summerPlan) return merged;
    merged.summerPlan ||= structuredClone(local.summerPlan || remote.summerPlan);
    merged.summerPlan.kids ||= {};
    ["brother", "younger"].forEach((kidId) => {
      const candidates = [local.summerPlan?.kids?.[kidId], remote.summerPlan?.kids?.[kidId]].filter(Boolean);
      merged.summerPlan.kids[kidId] = candidates.sort((left, right) => (
        Number(right.currentDay || 0) - Number(left.currentDay || 0)
        || String(right.currentDate || "").localeCompare(String(left.currentDate || ""))
      ))[0] || merged.summerPlan.kids[kidId];
    });
    return merged;
  }

  function mergeLearningActivities(local = {}, remote = {}) {
    const merged = { ...local, ...remote, progress: {}, moduleStarts: {} };
    ["brother", "younger"].forEach((kidId) => {
      merged.progress[kidId] = {};
      const localProgress = local.progress?.[kidId] || {};
      const remoteProgress = remote.progress?.[kidId] || {};
      const dates = new Set([...Object.keys(localProgress), ...Object.keys(remoteProgress)]);
      dates.forEach((date) => {
        merged.progress[kidId][date] = { ...(localProgress[date] || {}), ...(remoteProgress[date] || {}) };
        Object.keys(merged.progress[kidId][date]).forEach((activityId) => {
          const localRecord = localProgress[date]?.[activityId];
          const remoteRecord = remoteProgress[date]?.[activityId];
          if (localRecord?.updatedAt > (remoteRecord?.updatedAt || "")) {
            merged.progress[kidId][date][activityId] = localRecord;
          }
        });
      });
      merged.moduleStarts[kidId] = {
        ...(local.moduleStarts?.[kidId] || {}),
        ...(remote.moduleStarts?.[kidId] || {})
      };
    });
    return merged;
  }

  root.TaskStateMigration = Object.freeze({ mergeStoredStates, mergeDeviceProgress, mergeGardenProgress, mergeGrammarIslandStates });
})(typeof window === "undefined" ? globalThis : window);
