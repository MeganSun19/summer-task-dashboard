(function (root) {
  const VERSION = 1;
  const TITLE = root.CoursePlanRuntime?.title("暑假计划") || "暑假计划";
  const TOTAL_DAYS = root.CoursePlanRuntime?.totalDays(26) || 26;
  const KIDS = ["brother", "younger"];

  function clampDay(value) {
    return Math.max(1, Math.min(TOTAL_DAYS, Number(value) || 1));
  }

  function addDays(date, days) {
    const [year, month, day] = String(date).split("-").map(Number);
    const next = new Date(year, month - 1, day);
    next.setDate(next.getDate() + days);
    const offset = next.getTimezoneOffset() * 60000;
    return new Date(next.getTime() - offset).toISOString().slice(0, 10);
  }

  function dayOffset(start, target) {
    if (!start || !target) return 0;
    const [startYear, startMonth, startDay] = String(start).split("-").map(Number);
    const [targetYear, targetMonth, targetDay] = String(target).split("-").map(Number);
    return Math.round((new Date(targetYear, targetMonth - 1, targetDay) - new Date(startYear, startMonth - 1, startDay)) / 86400000);
  }

  function isTaskResolved(task) {
    return Boolean(task?.done || task?.excused);
  }

  function isCourseTask(task) {
    return Boolean(task && task.source !== "parent");
  }

  function activeTasks(day) {
    return (day?.tasks || []).filter((task) => !task.archived);
  }

  function courseTasks(day) {
    return activeTasks(day).filter(isCourseTask);
  }

  function isDayResolved(day) {
    const tasks = courseTasks(day);
    return Boolean(tasks.length && tasks.every(isTaskResolved));
  }

  function resolvedCount(day) {
    return activeTasks(day).filter(isTaskResolved).length;
  }

  function dayResolvedOn(day, fallbackDate) {
    if (!isDayResolved(day)) return null;
    const dates = courseTasks(day).map((task) => task.completedOn || task.excusedOn || fallbackDate).filter(Boolean).sort();
    return dates.at(-1) || fallbackDate;
  }

  function inferredDay(state, kidId, today) {
    const start = state.learningActivities?.moduleStarts?.[kidId]?.englishIsland
      || state.learningActivities?.courseStarts?.[kidId]
      || state.englishExperiment?.courseStarts?.[kidId]
      || today;
    return clampDay(dayOffset(start, today) + 1);
  }

  function dayFromResolvedHistory(state, kidId, today) {
    const resolved = Object.entries(state.days?.[kidId] || {})
      .filter(([, day]) => day?.planDayNumber && isDayResolved(day))
      .map(([date, day]) => ({
        day: clampDay(day.planDayNumber),
        resolvedOn: dayResolvedOn(day, date)
      }))
      .sort((left, right) => right.day - left.day);
    if (!resolved.length) return 1;
    const latest = resolved[0];
    return latest.resolvedOn < today ? clampDay(latest.day + 1) : latest.day;
  }

  function ensure(state, today) {
    state.summerPlan ||= { version: VERSION, title: TITLE, totalDays: TOTAL_DAYS, kids: {} };
    state.summerPlan.version = VERSION;
    state.summerPlan.title = TITLE;
    state.summerPlan.totalDays = TOTAL_DAYS;
    state.summerPlan.kids ||= {};
    KIDS.forEach((kidId) => {
      const existing = state.summerPlan.kids[kidId];
      const progress = existing || {
        currentDate: today,
        currentDay: inferredDay(state, kidId, today),
        migratedOn: today
      };
      progress.currentDate ||= today;
      progress.currentDay = clampDay(progress.currentDay);
      state.summerPlan.kids[kidId] = progress;
      const day = state.days?.[kidId]?.[progress.currentDate];
      if (day) day.planDayNumber ||= progress.currentDay;
    });
    return state.summerPlan;
  }

  function current(state, kidId, today) {
    ensure(state, today);
    return state.summerPlan.kids[kidId];
  }

  function recoverLatestResolvedDay(state, kidId, today) {
    const progress = current(state, kidId, today);
    const latest = Object.entries(state.days?.[kidId] || {})
      .filter(([date, day]) => date > progress.currentDate && date <= today && isDayResolved(day))
      .map(([date, day]) => ({ date, day: clampDay(day.planDayNumber || progress.currentDay) }))
      .sort((left, right) => right.date.localeCompare(left.date))[0];
    if (!latest) return false;
    progress.currentDate = latest.date;
    progress.currentDay = Math.max(progress.currentDay, latest.day);
    progress.recoveredOn = today;
    return true;
  }

  function shouldAdvance(state, kidId, today) {
    const progress = current(state, kidId, today);
    const day = state.days?.[kidId]?.[progress.currentDate];
    const resolvedOn = dayResolvedOn(day, progress.currentDate);
    return Boolean(
      resolvedOn
      && progress.currentDay < TOTAL_DAYS
      && progress.currentDate < today
      && resolvedOn < today
    );
  }

  function advance(state, kidId, today) {
    const progress = current(state, kidId, today);
    if (!shouldAdvance(state, kidId, today)) return { changed: false, progress };
    progress.currentDay += 1;
    progress.currentDate = today;
    progress.advancedOn = today;
    return { changed: true, progress };
  }

  function setTaskDone(task, done, actualDate, statusUpdatedAt = new Date().toISOString()) {
    task.done = Boolean(done);
    task.statusUpdatedAt = statusUpdatedAt;
    if (task.done) {
      task.completedOn ||= actualDate;
      task.excused = false;
      delete task.excusedOn;
    } else {
      delete task.completedOn;
    }
  }

  function setTaskExcused(task, excused, actualDate, statusUpdatedAt = new Date().toISOString()) {
    task.excused = Boolean(excused);
    task.statusUpdatedAt = statusUpdatedAt;
    if (task.excused) {
      task.done = false;
      task.excusedOn ||= actualDate;
      delete task.completedOn;
    } else {
      delete task.excusedOn;
    }
  }

  function completionKeys(state) {
    const byKid = Object.fromEntries(KIDS.map((kidId) => {
      const keys = new Set();
      Object.entries(state.days?.[kidId] || {}).forEach(([date, day]) => {
        if (!isDayResolved(day)) return;
        keys.add(day.planDayNumber ? `summer:${day.planDayNumber}` : `legacy:${date}`);
      });
      return [kidId, keys];
    }));
    return [...byKid.brother].filter((key) => byKid.younger.has(key)).sort((left, right) => {
      const [leftType, leftValue] = left.split(":");
      const [rightType, rightValue] = right.split(":");
      if (leftType === rightType && leftType === "summer") return Number(leftValue) - Number(rightValue);
      return left.localeCompare(right);
    });
  }

  function streak(state, kidId, today) {
    const completionDates = new Set(Object.entries(state.days?.[kidId] || {}).map(([plannedDate, day]) => (
      dayResolvedOn(day, plannedDate)
    )).filter(Boolean));
    let cursor = completionDates.has(today) ? today : addDays(today, -1);
    let count = 0;
    while (completionDates.has(cursor) && count < 365) {
      count += 1;
      cursor = addDays(cursor, -1);
    }
    return count;
  }

  root.SummerPlanProgress = Object.freeze({
    VERSION, TITLE, TOTAL_DAYS, ensure, current, advance, shouldAdvance,
    isTaskResolved, isCourseTask, activeTasks, courseTasks, isDayResolved, resolvedCount, dayResolvedOn,
    setTaskDone, setTaskExcused, completionKeys, dayFromResolvedHistory,
    recoverLatestResolvedDay, streak, addDays
  });
})(typeof window === "undefined" ? globalThis : window);
