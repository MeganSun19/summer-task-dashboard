import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const catalogSource = JSON.parse(readFileSync(new URL("../curriculum/learning-module-catalog.json", import.meta.url), "utf8"));
const summerPlanSource = JSON.parse(readFileSync(new URL("../curriculum/summer-plan-content.json", import.meta.url), "utf8"));
await import("../curriculum/summer-plan-content.js");
await import("../curriculum/learning-module-catalog.js");
await import("../curriculum/course-plan-catalog.js");
await import("../course-plan-runtime.js");
await import("../learning-modules.js");
const modules = globalThis.LearningModules;

test("generated browser catalog is identical to its JSON source", () => {
  assert.equal(catalogSource.schemaVersion, modules.schemaVersion);
  assert.deepEqual(modules.list(), catalogSource.modules);
});

test("default tasks are generated through the Excel-governed module registry", () => {
  const tasks = modules.buildDefaultTasks({ date: "2026-08-07", kidId: "brother", dayIndex: 6 });
  assert.deepEqual(tasks.map((task) => task.moduleId), [
    "englishIsland", "writing", "poem", "math", "reading", "listening"
  ]);
  assert.equal(tasks[0].activity.renderer, "english-course");
  assert.match(tasks[2].title, /第14周复习/);
  assert.match(tasks[2].detail, /《春日》/);
  assert.equal(tasks[3].title, "数学 · 今日安排");
  assert.match(tasks[3].detail, /家长今天填写/);
  assert.equal(tasks[4].detail, "自由阅读");
  assert.equal(tasks[5].detail, "自选 Big Muzzy 或英文西游记一集");
});

test("Excel-generated summer plan restores 26 poem days and leaves math open", () => {
  const poemDays = summerPlanSource.modules.poem.days;
  assert.equal(poemDays.length, 26);
  assert.match(poemDays[0].title, /第11周复习/);
  assert.match(poemDays[1].title, /第12周学习/);
  assert.match(poemDays[14].title, /第18周复习/);
  assert.match(poemDays[15].title, /第1周学习/);
  assert.match(poemDays[25].title, /第6周学习/);
  assert.equal(summerPlanSource.modules.math, undefined);
});

test("a module-specific content anchor can restart poem without resetting the whole plan", () => {
  const tasks = modules.buildDefaultTasks({ dayIndex: 7, contentDayIndexes: { poem: 0 } });
  const poem = tasks.find((task) => task.moduleId === "poem");
  assert.match(poem.title, /第11周复习/);
});

test("the temporary family task remains catalogued but outside the six defaults", () => {
  assert.equal(modules.buildDefaultTasks({ dayIndex: 0 }).length, 6);
  assert.deepEqual(modules.get("familyTask"), {
    id: "familyTask",
    title: "家庭任务",
    detail: "家长发布的临时安排",
    tags: ["临时任务"],
    instruction: "按卡片步骤完成；完成后点右边的按钮。",
    presentation: { icon: "★", color: "#e28b37", soft: "#fff1df", minutes: 10 },
    scheduledOnly: true
  });
});

test("long-term settings cannot freeze a dynamic poem title or instruction", () => {
  const dayTwo = modules.buildDefaultTasks({ dayIndex: 1, contentDayIndexes: { poem: 1 } });
  const applied = modules.applySettings(dayTwo, {
    poem: { enabled: true, title: "古诗背诵：春日偶成", instruction: "固定旧步骤" },
    reading: { enabled: true, title: "家庭阅读" }
  });
  assert.equal(applied.find((item) => item.id === "poem").title, "古诗背诵 · 第12周学习");
  assert.notEqual(applied.find((item) => item.id === "poem").instruction, "固定旧步骤");
  assert.equal(applied.find((item) => item.id === "reading").title, "家庭阅读");
});

test("task records retain stable ids while carrying module metadata", () => {
  const task = modules.createTask({
    id: "temporary-dance-1",
    moduleId: "reading",
    title: "练习舞蹈",
    detail: "练习第一段",
    tags: ["舞蹈"]
  });
  assert.equal(task.id, "temporary-dance-1");
  assert.equal(task.moduleId, "reading");
  assert.equal(task.done, false);
  assert.equal(modules.getPresentation(task.moduleId).minutes, 20);
});

test("unknown future modules receive a safe generic presentation", () => {
  assert.deepEqual(modules.getPresentation("future-module"), {
    icon: "✓", color: "#7e69c8", soft: "#f0edff", minutes: 10
  });
});
