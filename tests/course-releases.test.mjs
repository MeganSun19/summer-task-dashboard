import assert from "node:assert/strict";
import { test } from "node:test";

await import("../course-releases.js");
const courses = globalThis.CourseReleases;

test("course release schema includes stage boundaries", () => {
  assert.equal(courses.schemaVersion, 2);
});

const settings = {
  englishIsland: { enabled: true, title: "英语岛" },
  writing: { enabled: false }
};

test("published course versions are immutable records with increasing versions", () => {
  const first = courses.publishDraft({ kidId: "brother", title: "基础阶段", effectiveDate: "2026-08-10", stageEndDate: "2026-08-19", settings }, [], {
    id: "release-1", createdAt: "now", publishedAt: "now"
  });
  const second = courses.publishDraft({ kidId: "brother", title: "进阶阶段", effectiveDate: "2026-08-20", settings }, [first], {
    id: "release-2", createdAt: "later", publishedAt: "later"
  });
  assert.equal(first.version, 1);
  assert.equal(second.version, 2);
  assert.equal(first.status, "published");
  assert.equal(first.stageEndDate, "2026-08-19");
  assert.equal(second.settings.writing.enabled, false);
});

test("a stage end marks the goal boundary without creating a daily-course gap", () => {
  const releases = [
    { id: "v1", kidId: "brother", version: 1, effectiveDate: "2026-08-10", stageEndDate: "2026-08-19", status: "published", settings },
    { id: "v2", kidId: "brother", version: 2, effectiveDate: "2026-08-25", stageEndDate: "", status: "published", settings: { math: { enabled: true } } }
  ];
  assert.equal(courses.stageState(releases, "brother", "2026-08-19").status, "active");
  assert.equal(courses.stageState(releases, "brother", "2026-08-22").status, "awaiting-next-stage");
  assert.equal(courses.settingsForDate({ releases }, {}, "brother", "2026-08-22").release.id, "v1");
  assert.equal(courses.settingsForDate({ releases }, {}, "brother", "2026-08-25").release.id, "v2");
});

test("publishing rejects a stage end before its effective date", () => {
  assert.equal(courses.publishDraft({
    kidId: "brother", title: "无效阶段", effectiveDate: "2026-08-20", stageEndDate: "2026-08-19", settings
  }, []), null);
});

test("daily generation selects the latest effective version for each child and date", () => {
  const releases = [
    { id: "b1", kidId: "brother", version: 1, effectiveDate: "2026-08-10", status: "published", settings: { math: { enabled: true } } },
    { id: "b2", kidId: "brother", version: 2, effectiveDate: "2026-08-20", status: "published", settings: { math: { enabled: false } } },
    { id: "y1", kidId: "younger", version: 1, effectiveDate: "2026-08-12", status: "published", settings: { reading: { enabled: true } } }
  ];
  assert.equal(courses.activeRelease(releases, "brother", "2026-08-09"), null);
  assert.equal(courses.activeRelease(releases, "brother", "2026-08-15").id, "b1");
  assert.equal(courses.activeRelease(releases, "brother", "2026-08-25").id, "b2");
  assert.equal(courses.activeRelease(releases, "younger", "2026-08-25").id, "y1");
});

test("legacy overall settings remain the baseline before the first release", () => {
  const plans = { releases: [{ id: "v1", kidId: "brother", version: 1, effectiveDate: "2026-08-10", status: "published", settings }] };
  const legacy = { brother: { poem: { enabled: false } } };
  assert.equal(courses.settingsForDate(plans, legacy, "brother", "2026-08-09").settings.poem.enabled, false);
  assert.equal(courses.settingsForDate(plans, legacy, "brother", "2026-08-10").release.id, "v1");
});

test("rollback creates an editable draft without mutating published history", () => {
  const release = { id: "v1", kidId: "brother", version: 1, title: "基础阶段", goal: "掌握 CVC", effectiveDate: "2026-08-10", status: "published", settings };
  const draft = courses.draftFromRelease(release, { id: "draft-2", effectiveDate: "2026-08-20", updatedAt: "later" });
  draft.settings.englishIsland.title = "草稿名称";
  assert.equal(draft.goal, "掌握 CVC");
  assert.equal(draft.effectiveDate, "2026-08-20");
  assert.equal(release.settings.englishIsland.title, "英语岛");
  assert.equal(release.status, "published");
});
