import assert from "node:assert/strict";
import { test } from "node:test";
import { bandOfGrade, gradeConfig, isGrade } from "./grade";

test("grades map to three bands with daily goals 5 / 8 / 10", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map((g) => bandOfGrade(g as 1)), [1, 1, 2, 2, 3, 3]);
  assert.deepEqual([1, 3, 5].map((g) => gradeConfig(g as 1).dailyNew), [5, 8, 10]);
});

test("spelling: none for grades 1–2, tiles for 3–4, typing for 5–6", () => {
  assert.equal(gradeConfig(2).spell, "none");
  assert.equal(gradeConfig(3).spell, "tiles");
  assert.equal(gradeConfig(4).spell, "tiles");
  assert.equal(gradeConfig(6).spell, "type");
});

test("younger grades get bigger UI", () => {
  assert.ok(gradeConfig(1).scale > gradeConfig(4).scale);
  assert.ok(gradeConfig(4).scale > gradeConfig(6).scale);
  assert.equal(isGrade(0), false);
  assert.equal(isGrade(6), true);
});
