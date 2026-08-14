(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GrammarPaperPractice = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const KID_IDS = ["brother", "younger"];
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function normalizeSchedule(input) {
    if (!input || input.enabled === false) return null;
    const weekdays = [...new Set((input.weekdays || []).map(Number))]
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      .sort((a, b) => a - b);
    if (!DATE_PATTERN.test(input.startDate || "") || !weekdays.length) return null;
    return {
      enabled: true,
      startDate: input.startDate,
      weekdays,
      ...(input.updatedAt ? { updatedAt: String(input.updatedAt) } : {})
    };
  }

  function scheduleFor(state, kidId) {
    if (!KID_IDS.includes(kidId)) return null;
    return normalizeSchedule(state?.kids?.[kidId]);
  }

  function isScheduledDate(date, schedule) {
    const normalized = normalizeSchedule(schedule);
    if (!normalized || !DATE_PATTERN.test(date || "") || date < normalized.startDate) return false;
    const [year, month, day] = date.split("-").map(Number);
    return normalized.weekdays.includes(new Date(year, month - 1, day).getDay());
  }

  function firstCompletionDate(record) {
    return record?.attempts?.find((attempt) => DATE_PATTERN.test(attempt?.sessionDate || ""))?.sessionDate
      || (DATE_PATTERN.test(record?.completedAt?.slice(0, 10) || "") ? record.completedAt.slice(0, 10) : "");
  }

  function completedPaperLessonIds(days, kidId) {
    const completed = new Set();
    Object.values(days?.[kidId] || {}).forEach((day) => {
      (day.tasks || []).forEach((task) => {
        if (task.moduleId === "grammarPaper" && task.grammarLessonId && task.done) {
          completed.add(task.grammarLessonId);
        }
      });
    });
    return completed;
  }

  function nextLesson({ grammarState, kidId, date, lessons, days }) {
    const records = grammarState?.kids?.[kidId]?.lessons || {};
    const paperCompleted = completedPaperLessonIds(days, kidId);
    return (lessons || []).find((lesson) => {
      const record = records[lesson.id];
      const completedOn = firstCompletionDate(record);
      return Boolean(record?.completedAt && completedOn && completedOn <= date && !paperCompleted.has(lesson.id));
    }) || null;
  }

  function selectedPrintPages(lesson) {
    return [...new Set((lesson?.printPages || []).map(Number).filter(Number.isFinite))].slice(0, 3);
  }

  function createTask(lesson, kidId, date) {
    const pages = selectedPrintPages(lesson);
    return {
      id: `grammar-paper-${kidId}-${lesson.id}-${date}`,
      taskId: `grammar-paper-${lesson.id}`,
      source: "parent",
      moduleId: "grammarPaper",
      grammarLessonId: lesson.id,
      printPages: pages,
      title: `语法纸面巩固 · ${lesson.title}`,
      detail: `完成蓝书《Common English Grammar》本课对应的第 ${pages.join("、")} 页。`,
      instruction: "先口头复习本课规则；独立完成 3 页打印资料；家长检查后订正错题；最后点击完成。",
      tags: ["语法巩固", "蓝书", lesson.title, "打印资料"],
      minutes: 20,
      scheduledDate: date,
      done: false
    };
  }

  function reconcileTasks(tasks, context) {
    const current = Array.isArray(tasks) ? tasks : [];
    const { kidId, date, grammarState, lessons, days } = context || {};
    const schedule = scheduleFor(context?.scheduleState, kidId);
    let hasCurrentPaperTask = false;
    const result = current.map((task) => {
      if (task.moduleId !== "grammarPaper") return task;
      if (task.scheduledDate === date) {
        hasCurrentPaperTask = true;
        const active = { ...task };
        delete active.archived;
        return active;
      }
      return { ...task, archived: true };
    });
    if (!isScheduledDate(date, schedule) || hasCurrentPaperTask) return result;
    const lesson = nextLesson({ grammarState, kidId, date, lessons, days });
    if (!lesson || selectedPrintPages(lesson).length !== 3) return result;
    result.push(createTask(lesson, kidId, date));
    return result;
  }

  return Object.freeze({
    normalizeSchedule,
    scheduleFor,
    isScheduledDate,
    completedPaperLessonIds,
    nextLesson,
    selectedPrintPages,
    createTask,
    reconcileTasks
  });
});
