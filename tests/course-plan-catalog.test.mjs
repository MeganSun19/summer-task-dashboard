import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const projectRoot = new URL("..", import.meta.url);
const script = new URL("../scripts/generate-course-plan-catalog.py", import.meta.url).pathname;
const catalogPath = new URL("../curriculum/course-plan-catalog.json", import.meta.url);
const heartPlanPath = new URL("../curriculum/heart-word-plan.json", import.meta.url);
await import("../curriculum/course-plan-catalog.js");

function sampleModel(overrides = {}) {
  return {
    stages: [
      { stageId: "brother-foundation", title: "哥哥基础阶段", kidIds: "brother", goal: "基础", scheduleMode: "absolute", start: "2026-08-10", end: "2026-08-19", status: "ready" },
      { stageId: "both-next", title: "共同进阶阶段", kidIds: "both", goal: "进阶", scheduleMode: "absolute", start: "2026-08-20", end: "2026-08-29", status: "ready" }
    ],
    modules: [
      { stageId: "brother-foundation", moduleId: "englishIsland", enabled: "是", start: "2026-08-10", end: "2026-08-19" },
      { stageId: "both-next", moduleId: "reading", enabled: "是", start: "2026-08-20", end: "2026-08-29" }
    ],
    ...overrides
  };
}

test("the Excel master deterministically generates the current course stage", () => {
  execFileSync("python3", [script, "--check"], { cwd: projectRoot, encoding: "utf8" });
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  assert.equal(catalog.schemaVersion, 1);
  assert.deepEqual(globalThis.COURSE_PLAN_CATALOG, catalog);
  assert.equal(catalog.stages.length, 1);
  assert.deepEqual(catalog.stages[0].kidIds, ["brother", "younger"]);
  assert.deepEqual(catalog.stages[0].modules.map((item) => item.moduleId), [
    "englishIsland", "listening", "math", "poem", "reading", "writing"
  ]);
  const heartPlan = JSON.parse(readFileSync(heartPlanPath, "utf8"));
  assert.equal(heartPlan.words.length, 200);
  assert.equal(heartPlan.words.filter((entry) => entry.tier === "core").length, 100);
  assert.equal(heartPlan.words.filter((entry) => entry.tier === "extension").length, 100);
  assert.equal(heartPlan.words.every((entry) => entry.word && entry.sentence && entry.firstDay), true);
});

test("two children can move through non-overlapping absolute stages", () => {
  const directory = mkdtempSync(join(tmpdir(), "course-plan-valid-"));
  try {
    const modelPath = join(directory, "model.json");
    const outputPath = join(directory, "catalog.json");
    writeFileSync(modelPath, JSON.stringify(sampleModel()));
    execFileSync("python3", [script, "--model", modelPath, "--output", outputPath], { cwd: projectRoot });
    const catalog = JSON.parse(readFileSync(outputPath, "utf8"));
    assert.equal(catalog.stages.length, 2);
    assert.deepEqual(catalog.stages[1].kidIds, ["brother", "younger"]);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("overlapping ready stages for the same child fail validation", () => {
  const directory = mkdtempSync(join(tmpdir(), "course-plan-conflict-"));
  try {
    const model = sampleModel();
    model.stages[1].start = "2026-08-19";
    const modelPath = join(directory, "model.json");
    writeFileSync(modelPath, JSON.stringify(model));
    const result = spawnSync("python3", [script, "--model", modelPath, "--output", join(directory, "catalog.json")], {
      cwd: projectRoot,
      encoding: "utf8"
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /存在日期冲突/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("unknown and temporary-only modules cannot enter long-term courses", () => {
  for (const moduleId of ["unknownModule", "familyTask"]) {
    const directory = mkdtempSync(join(tmpdir(), "course-plan-module-"));
    try {
      const model = sampleModel({
        stages: [sampleModel().stages[0]],
        modules: [{ stageId: "brother-foundation", moduleId, enabled: "是", start: "2026-08-10", end: "2026-08-19" }]
      });
      const modelPath = join(directory, "model.json");
      writeFileSync(modelPath, JSON.stringify(model));
      const result = spawnSync("python3", [script, "--model", modelPath, "--output", join(directory, "catalog.json")], {
        cwd: projectRoot,
        encoding: "utf8"
      });
      assert.equal(result.status, 1);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});
