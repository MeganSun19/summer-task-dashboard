import assert from "node:assert/strict";
import { test } from "node:test";

await import("../curriculum/course-plan-catalog.js");
await import("../course-plan-runtime.js");
const runtime = globalThis.CoursePlanRuntime;

test("the Excel-generated relative stage governs the current summer plan without changing its display contract", () => {
  assert.equal(runtime.title(), "暑假计划");
  assert.equal(runtime.totalDays(), 26);
  assert.equal(runtime.stageFor("brother", 1)?.id, "english-island-foundation-26");
  assert.equal(runtime.stageFor("younger", 26)?.id, "english-island-foundation-26");
});

test("all six long-term modules come from the Excel stage while temporary tasks stay outside it", () => {
  const ids = ["englishIsland", "writing", "poem", "math", "reading", "listening"];
  ids.forEach((id) => assert.equal(runtime.moduleFor("brother", 2, id).module?.enabled, true));
  assert.equal(runtime.moduleFor("brother", 2, "familyTask").module, null);
  assert.equal(runtime.moduleFor("brother", 2, "familyTask").governed, true);
});

test("content outside the published relative stage is not governed by a stale course", () => {
  assert.equal(runtime.stageFor("brother", 27), null);
  assert.equal(runtime.moduleFor("brother", 27, "poem").governed, false);
});
