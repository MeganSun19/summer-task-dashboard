import test from "node:test";
import assert from "node:assert/strict";

await import("../family-sync-core.js");

const rows = [
  { family_id: "old-id", family_name: "旧家庭", invite_code: "AB37C1F7", access_role: "owner", revision: 4 },
  { family_id: "main-id", family_name: "双星学习岛", invite_code: "67690f58", access_role: "device", revision: 12 }
];

test("keeps the explicitly selected family when several memberships exist", () => {
  const result = globalThis.FamilySyncCore.chooseActiveFamily(rows, "main-id");
  assert.equal(result.activeFamily.inviteCode, "67690F58");
  assert.equal(result.needsChoice, false);
});

test("never chooses an arbitrary family when the saved selection is unavailable", () => {
  const result = globalThis.FamilySyncCore.chooseActiveFamily(rows, "missing-id");
  assert.equal(result.activeFamily, null);
  assert.equal(result.needsChoice, true);
  assert.equal(result.families.length, 2);
});

test("automatically restores the only joined family", () => {
  const result = globalThis.FamilySyncCore.chooseActiveFamily(rows.slice(1), "");
  assert.equal(result.activeFamily.familyId, "main-id");
  assert.equal(result.needsChoice, false);
});

test("normalizes duplicate membership rows and status code", () => {
  const families = globalThis.FamilySyncCore.normalizeFamilies([...rows, rows[1]]);
  assert.equal(families.length, 2);
  assert.equal(globalThis.FamilySyncCore.shortInviteCode("67690f58"), "0F58");
});
