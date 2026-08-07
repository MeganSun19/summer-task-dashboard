(function (root) {
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function normalizeSettings(settings) {
    return Object.fromEntries(Object.entries(settings || {}).map(([moduleId, item]) => [moduleId, {
      enabled: item?.enabled !== false,
      ...(item?.title ? { title: String(item.title).trim() } : {}),
      ...(item?.instruction ? { instruction: String(item.instruction).trim() } : {})
    }]));
  }

  function normalizeDraft(input) {
    const effectiveDate = DATE_PATTERN.test(input.effectiveDate || "") ? input.effectiveDate : "";
    const stageEndDate = DATE_PATTERN.test(input.stageEndDate || "") ? input.stageEndDate : "";
    return {
      id: input.id || null,
      kidId: input.kidId,
      title: String(input.title || "长期课程").trim(),
      goal: String(input.goal || "").trim(),
      effectiveDate,
      stageEndDate,
      settings: normalizeSettings(input.settings),
      status: "draft",
      updatedAt: input.updatedAt || null
    };
  }

  function activeRelease(releases, kidId, date) {
    return (releases || [])
      .filter((release) => release.status === "published" && release.kidId === kidId && release.effectiveDate <= date)
      .sort((left, right) => right.effectiveDate.localeCompare(left.effectiveDate) || right.version - left.version)[0] || null;
  }

  function nextVersion(releases, kidId) {
    return Math.max(0, ...(releases || []).filter((release) => release.kidId === kidId).map((release) => Number(release.version) || 0)) + 1;
  }

  function publishDraft(draftInput, releases, meta = {}) {
    const draft = normalizeDraft(draftInput);
    if (!draft.effectiveDate || !draft.title || (draft.stageEndDate && draft.stageEndDate < draft.effectiveDate) || !Object.values(draft.settings).some((item) => item.enabled)) return null;
    return {
      id: meta.id,
      kidId: draft.kidId,
      title: draft.title,
      goal: draft.goal,
      version: nextVersion(releases, draft.kidId),
      effectiveDate: draft.effectiveDate,
      stageEndDate: draft.stageEndDate,
      settings: draft.settings,
      status: "published",
      createdAt: meta.createdAt,
      publishedAt: meta.publishedAt
    };
  }

  function settingsForDate(coursePlans, legacySettings, kidId, date) {
    const release = activeRelease(coursePlans?.releases, kidId, date);
    return { release, settings: release?.settings || legacySettings?.[kidId] || {} };
  }

  function stageState(releases, kidId, date) {
    const release = activeRelease(releases, kidId, date);
    if (!release) return { release: null, status: "not-started" };
    return {
      release,
      status: release.stageEndDate && date > release.stageEndDate ? "awaiting-next-stage" : "active"
    };
  }

  function draftFromRelease(release, input = {}) {
    if (!release) return null;
    return normalizeDraft({
      id: input.id,
      kidId: release.kidId,
      title: release.title,
      goal: release.goal || "",
      effectiveDate: input.effectiveDate,
      stageEndDate: input.stageEndDate || "",
      settings: release.settings,
      updatedAt: input.updatedAt
    });
  }

  root.CourseReleases = Object.freeze({
    schemaVersion: 2,
    normalizeDraft,
    activeRelease,
    nextVersion,
    publishDraft,
    settingsForDate,
    stageState,
    draftFromRelease
  });
})(typeof window === "undefined" ? globalThis : window);
