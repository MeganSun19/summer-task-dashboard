import assert from "node:assert/strict";
import { test } from "node:test";

await import("../learning-plan-presets.js");

test("a plan preset transforms modules without changing the application shell", () => {
  const tasks = [{ id: "writing", moduleId: "writing" }, { id: "reading", moduleId: "reading" }];
  const createTask = (id, title) => ({ id, moduleId: id, title });
  const result = globalThis.LearningPlanPresets.apply("hand-recovery", tasks, { createTask });
  assert.equal(result[0].moduleId, "retelling");
  assert.equal(result[1], tasks[1]);
});
