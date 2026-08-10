(function (root) {
  const FIELDS = ["title", "detail", "instruction", "tags"];

  function sameValue(field, left, right) {
    if (field === "tags") {
      return JSON.stringify(Array.isArray(left) ? left : []) === JSON.stringify(Array.isArray(right) ? right : []);
    }
    return String(left || "") === String(right || "");
  }

  function cloneValue(field, value) {
    return field === "tags" ? [...(Array.isArray(value) ? value : [])] : String(value || "");
  }

  function derive(tasks, baseTasks, options = {}) {
    const baseById = new Map((baseTasks || []).map((item) => [item.id, item]));
    const ignoredIds = new Set(options.ignoredIds || []);
    const overrides = {};
    (tasks || []).forEach((item) => {
      if (item.source === "parent" || ignoredIds.has(item.id)) return;
      const base = baseById.get(item.id);
      if (!base) return;
      const changed = {};
      FIELDS.forEach((field) => {
        if (!sameValue(field, item[field], base[field])) changed[field] = cloneValue(field, item[field]);
      });
      if (Object.keys(changed).length) overrides[item.id] = changed;
    });
    return overrides;
  }

  function apply(tasks, overrides = {}) {
    return (tasks || []).map((item) => {
      const override = overrides[item.id];
      if (!override || item.source === "parent") return item;
      const next = { ...item };
      FIELDS.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(override, field)) next[field] = cloneValue(field, override[field]);
      });
      return next;
    });
  }

  root.TaskOverrides = Object.freeze({ schemaVersion: 1, derive, apply });
})(typeof window === "undefined" ? globalThis : window);
