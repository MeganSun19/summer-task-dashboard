import assert from "node:assert/strict";
import { test } from "node:test";

await import("../task-overrides.js");
const overrides = globalThis.TaskOverrides;

const base = [
  { id: "math", moduleId: "math", title: "数学 · 今日安排", detail: "家长填写", instruction: "完成并订正", tags: ["数学"] },
  { id: "poem", moduleId: "poem", title: "古诗 · 第11周复习", detail: "背诵", instruction: "先背再检查", tags: ["复习"] }
];

test("a math-only daily edit produces a math-only field override", () => {
  const edited = structuredClone(base);
  edited[0].detail = "除法练习册第 3 页";
  const patch = overrides.derive(edited, base);
  assert.deepEqual(patch, { math: { detail: "除法练习册第 3 页" } });

  const nextDefaults = structuredClone(base);
  nextDefaults[1].title = "古诗 · 第12周学习";
  const applied = overrides.apply(nextDefaults, patch);
  assert.equal(applied[0].detail, "除法练习册第 3 页");
  assert.equal(applied[1].title, "古诗 · 第12周学习");
});

test("legacy migration can ignore dynamic modules while preserving a manual math entry", () => {
  const edited = structuredClone(base);
  edited[0].detail = "今天练习除法";
  edited[1].title = "旧版本固定古诗";
  assert.deepEqual(overrides.derive(edited, base, { ignoredIds: ["poem"] }), {
    math: { detail: "今天练习除法" }
  });
});

test("returning a field to its default removes the override", () => {
  assert.deepEqual(overrides.derive(structuredClone(base), base), {});
});
