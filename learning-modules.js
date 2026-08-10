(function (root) {
  const definitions = Array.isArray(root.LEARNING_MODULE_CATALOG) ? root.LEARNING_MODULE_CATALOG : [];
  const summerPlanModules = root.SUMMER_PLAN_CONTENT?.modules || {};
  const auxiliaryPresentations = {
    raz: { icon: "Aa", color: "#4f83d1", soft: "#eaf2ff", minutes: 30 },
    retelling: { icon: "说", color: "#48a978", soft: "#e6f6ec", minutes: 15 },
    speaking: { icon: "Talk", color: "#df746e", soft: "#ffedeb", minutes: 15 }
  };
  const registry = new Map(definitions.map((definition) => [definition.id, Object.freeze(definition)]));
  const fallbackPresentation = Object.freeze({ icon: "✓", color: "#7e69c8", soft: "#f0edff", minutes: 10 });

  function modulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function detailFor(definition, dayIndex) {
    if (!Array.isArray(definition.details) || !definition.details.length) return definition.detail || "";
    const index = definition.cycle === "week" ? modulo(dayIndex, 7) : modulo(dayIndex, definition.details.length);
    return definition.details[index];
  }

  function dailyContentFor(definition, dayIndex, contentDayIndexes) {
    if (!definition.contentKey) return null;
    const days = summerPlanModules[definition.contentKey]?.days;
    if (!Array.isArray(days) || !days.length) return null;
    const moduleDayIndex = Number.isInteger(contentDayIndexes?.[definition.id])
      ? contentDayIndexes[definition.id]
      : dayIndex;
    return days.find((item) => item.day === modulo(moduleDayIndex, days.length) + 1) || null;
  }

  function createTask(input) {
    const definition = registry.get(input.moduleId || input.id);
    const moduleId = input.moduleId || input.id;
    return {
      id: input.id || moduleId,
      taskId: input.taskId || moduleId,
      scheduleId: input.scheduleId || "default-course",
      source: input.source || "course",
      moduleId,
      title: input.title || definition?.title || "学习任务",
      detail: input.detail || "",
      tags: Array.isArray(input.tags) ? input.tags : [],
      instruction: input.instruction || "完成后点右边的按钮。",
      done: Boolean(input.done),
      ...(input.minutes || definition?.presentation?.minutes ? { minutes: input.minutes || definition.presentation.minutes } : {}),
      ...(definition?.activity ? { activity: { ...definition.activity } } : {}),
      ...(input.activity ? { activity: { ...input.activity } } : {}),
      ...(input.metadata ? { metadata: { ...input.metadata } } : {})
    };
  }

  function buildDefaultTasks(context) {
    const dayIndex = Number(context?.dayIndex) || 0;
    return definitions.filter((definition) => !definition.scheduledOnly).map((definition) => {
      const daily = dailyContentFor(definition, dayIndex, context?.contentDayIndexes);
      return createTask({
        moduleId: definition.id,
        title: daily?.title || definition.title,
        detail: daily?.detail || detailFor(definition, dayIndex),
        tags: daily?.tags || definition.tags,
        instruction: daily?.instruction || definition.instruction,
        minutes: daily?.minutes || definition.presentation.minutes,
        metadata: daily?.metadata
      });
    });
  }

  function get(id) {
    return registry.get(id) || null;
  }

  function getPresentation(id) {
    return registry.get(id)?.presentation || auxiliaryPresentations[id] || fallbackPresentation;
  }

  function isDynamicContent(id) {
    return Boolean(registry.get(id)?.contentKey);
  }

  function applySettings(tasks, settings = {}, release = null) {
    return tasks
      .filter((item) => settings[item.id]?.enabled !== false)
      .map((item) => {
        const dynamicContent = isDynamicContent(item.moduleId || item.id);
        return {
          ...item,
          ...(release ? { scheduleId: release.id, courseVersion: release.version } : {}),
          title: dynamicContent ? item.title : (settings[item.id]?.title || item.title),
          instruction: dynamicContent ? item.instruction : (settings[item.id]?.instruction || item.instruction)
        };
      });
  }

  function list() {
    return definitions.slice();
  }

  root.LearningModules = Object.freeze({
    schemaVersion: 1,
    list,
    get,
    getPresentation,
    isDynamicContent,
    applySettings,
    createTask,
    buildDefaultTasks
  });
})(typeof window === "undefined" ? globalThis : window);
