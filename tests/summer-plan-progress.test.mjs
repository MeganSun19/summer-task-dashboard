import assert from "node:assert/strict";
import test from "node:test";

await import("../summer-plan-progress.js");
const SummerPlan = globalThis.SummerPlanProgress;

function stateWith(day, extra = {}) {
  return {
    days: { brother: { "2026-08-07": day }, younger: {} },
    learningActivities: { moduleStarts: { brother: { englishIsland: "2026-08-07" }, younger: {} } },
    ...extra
  };
}

test("migration starts each child on today's existing content", () => {
  const state = stateWith({ tasks: [{ id: "englishIsland", done: false }] });
  SummerPlan.ensure(state, "2026-08-07");
  assert.equal(state.summerPlan.title, "暑假计划");
  assert.equal(state.summerPlan.kids.brother.currentDay, 1);
  assert.equal(state.summerPlan.kids.brother.currentDate, "2026-08-07");
  assert.equal(state.days.brother["2026-08-07"].planDayNumber, 1);
});

test("elapsed dates do not advance a plan without resolved learning days", () => {
  const state = {
    days: { brother: { "2026-08-07": { planDayNumber: 3, tasks: [{ done: true }, { done: false }] } } }
  };
  assert.equal(SummerPlan.dayFromResolvedHistory(state, "brother", "2026-08-07"), 1);
});

test("resolved history advances only after its actual completion date", () => {
  const state = {
    days: { brother: { "2026-08-06": { planDayNumber: 2, tasks: [{ done: true, completedOn: "2026-08-06" }] } } }
  };
  assert.equal(SummerPlan.dayFromResolvedHistory(state, "brother", "2026-08-07"), 3);
  assert.equal(SummerPlan.dayFromResolvedHistory(state, "brother", "2026-08-06"), 2);
});

test("an incomplete learning day carries over without advancing", () => {
  const state = stateWith({ planDayNumber: 1, tasks: [{ done: true }, { done: false }] }, {
    summerPlan: { kids: { brother: { currentDay: 1, currentDate: "2026-08-07" }, younger: { currentDay: 1, currentDate: "2026-08-07" } } }
  });
  assert.equal(SummerPlan.advance(state, "brother", "2026-08-08").changed, false);
  assert.equal(state.summerPlan.kids.brother.currentDate, "2026-08-07");
});

test("finishing a carried day today waits until tomorrow to advance", () => {
  const day = { planDayNumber: 1, tasks: [{ done: true, completedOn: "2026-08-08" }] };
  const state = stateWith(day, {
    summerPlan: { kids: { brother: { currentDay: 1, currentDate: "2026-08-07" }, younger: { currentDay: 1, currentDate: "2026-08-07" } } }
  });
  assert.equal(SummerPlan.advance(state, "brother", "2026-08-08").changed, false);
  assert.equal(SummerPlan.advance(state, "brother", "2026-08-09").changed, true);
  assert.equal(state.summerPlan.kids.brother.currentDay, 2);
  assert.equal(state.summerPlan.kids.brother.currentDate, "2026-08-09");
});

test("excused tasks unblock a day without counting as done", () => {
  const task = { done: false };
  SummerPlan.setTaskExcused(task, true, "2026-08-08");
  assert.equal(task.done, false);
  assert.equal(task.excused, true);
  assert.equal(SummerPlan.isDayResolved({ tasks: [task] }), true);
});

test("the final summer-plan day never creates day 27", () => {
  const state = stateWith({ planDayNumber: 26, tasks: [{ done: true, completedOn: "2026-08-07" }] }, {
    summerPlan: { kids: { brother: { currentDay: 26, currentDate: "2026-08-07" }, younger: { currentDay: 1, currentDate: "2026-08-07" } } }
  });
  assert.equal(SummerPlan.advance(state, "brother", "2026-08-08").changed, false);
  assert.equal(state.summerPlan.kids.brother.currentDay, 26);
});

test("joint progress matches the same logical learning day across different dates", () => {
  const complete = (planDayNumber) => ({ planDayNumber, tasks: [{ done: true }] });
  const state = {
    days: {
      brother: { "2026-08-07": complete(1), "2026-08-08": complete(2) },
      younger: { "2026-08-08": complete(1) }
    }
  };
  assert.deepEqual(SummerPlan.completionKeys(state), ["summer:1"]);
});
