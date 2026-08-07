(function (root) {
  const presets = new Map();

  function register(preset) {
    if (!preset?.id || typeof preset.transformTasks !== "function") throw new Error("计划模板缺少 id 或 transformTasks");
    if (presets.has(preset.id)) throw new Error(`计划模板重复：${preset.id}`);
    presets.set(preset.id, Object.freeze({ ...preset }));
  }

  register({
    id: "hand-recovery",
    title: "手部休养",
    preview({ target, dateRange }) {
      return `${target}：${dateRange}使用手部休养计划；写字和书面数学将替换为中文口述与英语口语。`;
    },
    transformTasks(tasks, { createTask }) {
      return tasks.map((item) => {
        if ((item.moduleId || item.id) === "writing") {
          return createTask("retelling", "中文朗读与复述", "朗读一段喜欢的故事，再口头讲出发生了什么", ["朗读", "复述", "不动笔"], "舒服地坐好；朗读 10–15 分钟；最后用自己的话讲一遍，不需要写字。");
        }
        if ((item.moduleId || item.id) === "math") {
          return createTask("speaking", "英语口语练习", "复述今天的 RAZ，或用目标句型说 3 句话", ["开口说", "RAZ", "不动笔"], "先跟读今天的句子；再合上书说一遍；最后任选 3 个词造句。");
        }
        return item;
      });
    }
  });

  root.LearningPlanPresets = Object.freeze({
    get(id) { return presets.get(id) || null; },
    list() { return [...presets.values()]; },
    apply(id, tasks, context) {
      const preset = presets.get(id);
      return preset ? preset.transformTasks(tasks, context) : tasks;
    }
  });
})(typeof window === "undefined" ? globalThis : window);
