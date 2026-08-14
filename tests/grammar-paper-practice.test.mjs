import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

await import("../grammar-paper-practice.js");
await import("../curriculum/grammar-island-course.js");
const paper = globalThis.GrammarPaperPractice;
const lessons = globalThis.GRAMMAR_ISLAND_COURSE.lessons;
const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");
const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");

function grammarState(completedLessonIds = []) {
  const records = Object.fromEntries(completedLessonIds.map((lessonId, index) => [lessonId, {
    completedAt: `2026-08-${String(17 + index * 2).padStart(2, "0")}T01:00:00.000Z`,
    attempts: [{ sessionDate: `2026-08-${String(17 + index * 2).padStart(2, "0")}` }]
  }]));
  return { version: 1, kids: { brother: { lessons: records }, younger: { lessons: {} } } };
}

const scheduleState = {
  version: 1,
  kids: {
    brother: { enabled: true, startDate: "2026-08-18", weekdays: [2, 4, 6], updatedAt: "2026-08-14T10:00:00.000Z" },
    younger: { enabled: true, startDate: "2026-08-18", weekdays: [2, 4, 6], updatedAt: "2026-08-14T10:00:00.000Z" }
  }
};

function reconcile({ date, tasks = [], completed = ["w1-a-an"], days = { brother: {}, younger: {} } } = {}) {
  return paper.reconcileTasks(tasks, {
    kidId: "brother",
    date,
    scheduleState,
    grammarState: grammarState(completed),
    lessons,
    days
  });
}

test("paper practice only appears on configured Tuesday, Thursday and Saturday after an online lesson", () => {
  assert.equal(reconcile({ date: "2026-08-17" }).length, 0);
  assert.equal(reconcile({ date: "2026-08-18", completed: [] }).length, 0);
  const tasks = reconcile({ date: "2026-08-18" });
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].grammarLessonId, "w1-a-an");
  assert.deepEqual(tasks[0].printPages, [1, 7, 20]);
  assert.equal(tasks[0].source, "parent");
  assert.equal(tasks[0].moduleId, "grammarPaper");
});

test("disabled paper scheduling leaves every existing task and completion field unchanged", () => {
  const existing = [{ id: "math", source: "course", done: true, completedOn: "2026-08-18", statusUpdatedAt: "2026-08-18T03:00:00.000Z" }];
  const result = paper.reconcileTasks(existing, {
    kidId: "brother",
    date: "2026-08-18",
    scheduleState: null,
    grammarState: grammarState(["w1-a-an"]),
    lessons,
    days: { brother: {}, younger: {} }
  });
  assert.deepEqual(result, existing);
});

test("an unfinished paper lesson carries to the next paper day without losing the old record", () => {
  const first = reconcile({ date: "2026-08-18" })[0];
  const days = { brother: { "2026-08-18": { tasks: [first] } }, younger: {} };
  const next = reconcile({ date: "2026-08-20", tasks: [first], days });
  assert.equal(next.length, 2);
  assert.equal(next[0].archived, true);
  assert.equal(next[1].grammarLessonId, "w1-a-an");
  assert.equal(next[1].scheduledDate, "2026-08-20");
});

test("finishing one paper lesson advances to the next completed online lesson on the next paper day", () => {
  const first = { ...reconcile({ date: "2026-08-18" })[0], done: true, completedOn: "2026-08-18" };
  const days = { brother: { "2026-08-18": { tasks: [first] } }, younger: {} };
  const next = reconcile({ date: "2026-08-20", tasks: [first], completed: ["w1-a-an", "w1-plurals"], days });
  assert.equal(next[0].archived, true);
  assert.equal(next[1].grammarLessonId, "w1-plurals");
  assert.deepEqual(next[1].printPages, [40, 45, 50]);
});

test("completing today's paper task cannot generate a second rewardable task on the same date", () => {
  const current = { ...reconcile({ date: "2026-08-18" })[0], done: true, completedOn: "2026-08-18" };
  const days = { brother: { "2026-08-18": { tasks: [current] } }, younger: {} };
  const result = reconcile({ date: "2026-08-18", tasks: [current], completed: ["w1-a-an", "w1-plurals"], days });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, current.id);
  assert.equal(result[0].done, true);
});

test("every generated teaching task uses exactly three pages from its course lesson instead of date hardcoding", () => {
  lessons.forEach((lesson) => {
    const task = paper.createTask(lesson, "brother", "2026-09-01");
    assert.deepEqual(task.printPages, lesson.printPages.slice(0, 3));
    assert.equal(task.printPages.length, 3);
    assert.match(task.detail, new RegExp(task.printPages.join("、")));
  });
});

test("the dashboard loads paper-course data before app startup and reconciles both normal and carried days", () => {
  assert.ok(indexSource.indexOf("grammar-paper-practice.js") < indexSource.indexOf("app.js?v="));
  assert.ok(indexSource.indexOf("grammar-island-course.js") < indexSource.indexOf("app.js?v="));
  assert.equal((appSource.match(/reconcileSupplementalTasks\(/g) || []).length >= 3, true);
  assert.match(appSource, /grammarPaperRecovered/);
});
