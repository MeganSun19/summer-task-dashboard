(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GrammarIslandCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const STORAGE_KEY = "twin-star-grammar-island-v1";
  const KID_IDS = ["brother", "younger"];

  function emptyState() {
    return {
      version: 1,
      kids: Object.fromEntries(KID_IDS.map((kidId) => [kidId, { lessons: {}, schedule: null }]))
    };
  }

  function normalizeState(input) {
    const state = input && typeof input === "object" ? input : emptyState();
    state.version = 1;
    state.kids ||= {};
    KID_IDS.forEach((kidId) => {
      state.kids[kidId] ||= { lessons: {}, schedule: null };
      state.kids[kidId].lessons ||= {};
      state.kids[kidId].schedule ||= null;
    });
    return state;
  }

  function localISODate(value = new Date()) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseISODate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function normalizeSchedule(input, fallbackDate = localISODate()) {
    const weekdays = [...new Set((input?.weekdays || [1, 3, 5]).map(Number))]
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      .sort((a, b) => a - b);
    const normalized = {
      frequency: "weekly-selected-days",
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(input?.startDate || "") ? input.startDate : fallbackDate,
      weekdays: weekdays.length ? weekdays : [1, 3, 5]
    };
    if (input?.updatedAt) normalized.updatedAt = String(input.updatedAt);
    return normalized;
  }

  function scheduleFor(state, kidId, fallbackDate) {
    return normalizeSchedule(normalizeState(state).kids[kidId]?.schedule, fallbackDate);
  }

  function setSchedule(state, kidId, schedule, fallbackDate, now = new Date()) {
    const normalized = normalizeState(state);
    normalized.kids[kidId].schedule = {
      ...normalizeSchedule(schedule, fallbackDate),
      updatedAt: now.toISOString()
    };
    normalized.updatedAt = now.toISOString();
    return normalized;
  }

  function isScheduledDate(date, schedule) {
    const normalized = normalizeSchedule(schedule, date);
    if (date < normalized.startDate) return false;
    return normalized.weekdays.includes(parseISODate(date).getDay());
  }

  function nextScheduledDate(date, schedule, includeDate = false) {
    const normalized = normalizeSchedule(schedule, date);
    const startsLater = date < normalized.startDate;
    let cursor = parseISODate(startsLater ? normalized.startDate : date);
    if (!startsLater && !includeDate) cursor.setDate(cursor.getDate() + 1);
    for (let offset = 0; offset < 14; offset += 1) {
      const candidate = localISODate(cursor);
      if (candidate >= normalized.startDate && normalized.weekdays.includes(cursor.getDay())) return candidate;
      cursor.setDate(cursor.getDate() + 1);
    }
    return null;
  }

  function load(storage) {
    try {
      return normalizeState(JSON.parse(storage?.getItem(STORAGE_KEY)));
    } catch {
      return emptyState();
    }
  }

  function save(storage, state) {
    const normalized = normalizeState(state);
    normalized.updatedAt ||= new Date().toISOString();
    storage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function lessonProgress(state, kidId, lessonId) {
    const record = normalizeState(state).kids[kidId]?.lessons?.[lessonId];
    return record?.deletedAt ? null : (record || null);
  }

  function resetLessonProgress(state, kidId, lessonId, now = new Date()) {
    const normalized = normalizeState(state);
    if (normalized.kids[kidId]) normalized.kids[kidId].lessons[lessonId] = { deletedAt: now.toISOString() };
    normalized.updatedAt = now.toISOString();
    return normalized;
  }

  function resetKidProgress(state, kidId, now = new Date()) {
    const normalized = normalizeState(state);
    if (normalized.kids[kidId]) {
      Object.keys(normalized.kids[kidId].lessons).forEach((lessonId) => {
        normalized.kids[kidId].lessons[lessonId] = { deletedAt: now.toISOString() };
      });
    }
    normalized.updatedAt = now.toISOString();
    return normalized;
  }

  function completeLesson(state, kidId, lesson, oralRatings, answers, now = new Date(), sessionDate = localISODate(now)) {
    const normalized = normalizeState(state);
    const correct = lesson.checks.reduce((total, check, index) => (
      total + (answers[index] === check.answer ? 1 : 0)
    ), 0);
    const total = lesson.checks.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const previous = normalized.kids[kidId].lessons[lesson.id];
    const attempt = {
      completedAt: now.toISOString(),
      correct,
      total,
      percent,
      sessionDate,
      oralRatings: [...oralRatings],
      answers: [...answers]
    };
    normalized.kids[kidId].lessons[lesson.id] = {
      completedAt: previous?.completedAt || attempt.completedAt,
      latestAt: attempt.completedAt,
      latestSessionDate: sessionDate,
      bestPercent: Math.max(Number(previous?.bestPercent || 0), percent),
      attemptCount: Number(previous?.attemptCount || previous?.attempts?.length || 0) + 1,
      attempts: [...(previous?.attempts || []), attempt].slice(-5)
    };
    normalized.updatedAt = attempt.completedAt;
    return { state: normalized, result: attempt, firstCompletion: !previous?.completedAt };
  }

  function summary(state, kidId, lessons) {
    const records = normalizeState(state).kids[kidId]?.lessons || {};
    const completed = lessons.filter((lesson) => records[lesson.id]?.completedAt).length;
    const bestScores = lessons
      .map((lesson) => Number(records[lesson.id]?.bestPercent))
      .filter(Number.isFinite);
    return {
      completed,
      total: lessons.length,
      percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
      averageBest: bestScores.length
        ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length)
        : null
    };
  }

  function recommendation(percent) {
    if (percent >= 90) return { level: "pass", text: "线上已掌握：纸面题只作可选巩固，不必重复刷题。" };
    if (percent >= 70) return { level: "review", text: "已经全部订正，但首次作答还不够稳定：隔天在语法小岛再练一轮，纸面题只作辅助。" };
    return { level: "retry", text: "已经全部订正，但首次错误较多：先回语法小岛重新讲、重新说，不能用纸面练习代替在线纠错。" };
  }

  return Object.freeze({
    STORAGE_KEY,
    localISODate,
    normalizeSchedule,
    scheduleFor,
    setSchedule,
    isScheduledDate,
    nextScheduledDate,
    emptyState,
    normalizeState,
    load,
    save,
    lessonProgress,
    resetLessonProgress,
    resetKidProgress,
    completeLesson,
    summary,
    recommendation
  });
});
