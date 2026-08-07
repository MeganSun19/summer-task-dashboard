(function (root) {
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function parseDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function formatDate(value) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addDays(value, amount) {
    const next = new Date(value);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function uniqueDates(values) {
    return [...new Set((values || []).filter((value) => DATE_PATTERN.test(value)))].sort();
  }

  function expandDates(input) {
    const recurrence = input?.recurrence || "once";
    if (recurrence === "custom") return uniqueDates(input.customDates);
    const start = input?.startDate;
    const end = recurrence === "once" ? start : input?.endDate;
    if (!DATE_PATTERN.test(start || "") || !DATE_PATTERN.test(end || "") || start > end) return [];
    const step = recurrence === "alternate" ? 2 : 1;
    const dates = [];
    let cursor = parseDate(start);
    const finish = parseDate(end);
    while (cursor <= finish && dates.length < 366) {
      dates.push(formatDate(cursor));
      cursor = addDays(cursor, step);
    }
    return dates;
  }

  function normalizeSchedule(input) {
    const dates = expandDates(input);
    return {
      id: input.id,
      taskId: input.taskId,
      source: "parent",
      moduleId: input.moduleId || "familyTask",
      title: String(input.title || "").trim(),
      detail: String(input.detail || "").trim(),
      instruction: String(input.instruction || "").trim(),
      tags: Array.isArray(input.tags) ? input.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      minutes: Math.max(1, Math.min(180, Number(input.minutes) || 10)),
      kidIds: [...new Set(input.kidIds || [])].filter((kidId) => kidId === "brother" || kidId === "younger"),
      recurrence: input.recurrence || "once",
      startDate: dates[0] || input.startDate || "",
      endDate: dates[dates.length - 1] || input.endDate || input.startDate || "",
      dates,
      status: input.status || "published",
      createdAt: input.createdAt,
      updatedAt: input.updatedAt
    };
  }

  function applies(schedule, kidId, date) {
    return schedule?.status === "published"
      && schedule.kidIds?.includes(kidId)
      && schedule.dates?.includes(date);
  }

  function createInstance(schedule, kidId, date) {
    return {
      id: `instance-${schedule.taskId}-${kidId}-${date}`,
      taskId: schedule.taskId,
      scheduleId: schedule.id,
      source: "parent",
      moduleId: schedule.moduleId || "familyTask",
      title: schedule.title,
      detail: schedule.detail,
      tags: [...(schedule.tags || [])],
      instruction: schedule.instruction || "按卡片步骤完成；完成后点右边的按钮。",
      minutes: schedule.minutes || 10,
      scheduledDate: date,
      done: false
    };
  }

  function reconcileTasks(tasks, schedules, kidId, date) {
    const scheduleById = new Map((schedules || []).map((schedule) => [schedule.id, schedule]));
    const result = [];
    const represented = new Set();

    (tasks || []).forEach((item) => {
      if (item.source !== "parent" || !item.scheduleId) {
        result.push(item);
        return;
      }
      const schedule = scheduleById.get(item.scheduleId);
      if (item.done) {
        result.push(item);
        represented.add(item.scheduleId);
        return;
      }
      if (!applies(schedule, kidId, date)) return;
      result.push({ ...createInstance(schedule, kidId, date), done: false });
      represented.add(schedule.id);
    });

    (schedules || []).forEach((schedule) => {
      if (applies(schedule, kidId, date) && !represented.has(schedule.id)) {
        result.push(createInstance(schedule, kidId, date));
      }
    });
    return result;
  }

  root.FamilyTaskSchedules = Object.freeze({
    schemaVersion: 1,
    expandDates,
    normalizeSchedule,
    applies,
    createInstance,
    reconcileTasks
  });
})(typeof window === "undefined" ? globalThis : window);
