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
      title: `完成语法练习卷 · ${lesson.title}（3页）`,
      detail: `请完成《${lesson.title}》练习卷：蓝书第 ${pages.join("、")} 页。`,
      instruction: "先说一遍本课规则，再独立完成 3 页；检查并订正后，点击“完成 +10☀”。",
      tags: ["练习卷", "3页", lesson.title],
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
        const lesson = (lessons || []).find((candidate) => candidate.id === task.grammarLessonId);
        const presentation = lesson ? createTask(lesson, kidId, date) : null;
        const active = { ...task };
        if (presentation) {
          active.title = presentation.title;
          active.detail = presentation.detail;
          active.instruction = presentation.instruction;
          active.tags = presentation.tags;
          active.minutes = presentation.minutes;
          active.printPages = presentation.printPages;
        }
        delete active.archived;
        hasCurrentPaperTask = true;
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
