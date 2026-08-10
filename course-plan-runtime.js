(function (root) {
  const catalog = root.COURSE_PLAN_CATALOG || { stages: [] };

  function relativeStages(kidId) {
    return (catalog.stages || []).filter((stage) => (
      stage.status === "ready"
      && stage.schedule?.mode === "relative"
      && stage.kidIds?.includes(kidId)
    ));
  }

  function stageFor(kidId, planDay = 1) {
    return relativeStages(kidId).find((stage) => (
      Number(stage.schedule.start) <= planDay && planDay <= Number(stage.schedule.end)
    )) || null;
  }

  function moduleFor(kidId, planDay, moduleId) {
    const stage = stageFor(kidId, planDay);
    if (!stage) return { stage: null, module: null, governed: false };
    const module = (stage.modules || []).find((item) => (
      item.moduleId === moduleId
      && Number(item.schedule?.start) <= planDay
      && planDay <= Number(item.schedule?.end)
    )) || null;
    return { stage, module, governed: true };
  }

  function primaryStage(kidId = "brother") {
    return relativeStages(kidId)[0] || null;
  }

  function totalDays(fallback = 26) {
    const stage = primaryStage();
    return Math.max(1, Number(stage?.schedule?.end) || fallback);
  }

  function title(fallback = "暑假计划") {
    const stageTitle = String(primaryStage()?.title || "").split("·")[0].trim();
    return stageTitle || fallback;
  }

  root.CoursePlanRuntime = Object.freeze({ schemaVersion: 1, stageFor, moduleFor, primaryStage, totalDays, title });
})(typeof window === "undefined" ? globalThis : window);
