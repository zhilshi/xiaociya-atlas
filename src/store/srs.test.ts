import assert from "node:assert/strict";
import { test } from "node:test";
import { isMastered, preview, Rating, review } from "./srs";

const DAY = 86400000;

test("a new card answered Good is scheduled soon, Again sooner", () => {
  const now = Date.UTC(2026, 9, 25);
  const p = preview(undefined, now);
  assert.ok(p[Rating.Again] < p[Rating.Good]);
  assert.ok(p[Rating.Good] <= p[Rating.Easy]);
  const c = review(undefined, Rating.Good, now);
  assert.equal(c.reps, 1);
  assert.equal(c.seen, now);
});

test("repeated successful reviews grow stability until mastered", () => {
  let now = Date.UTC(2026, 9, 25);
  let c = review(undefined, Rating.Good, now);
  for (let i = 0; i < 8 && !isMastered(c); i++) {
    now = Math.max(c.due, now + DAY);
    c = review(c, Rating.Good, now);
  }
  assert.ok(isMastered(c), `stability ${c.s}`);
});

test("a lapse resets progress and counts the lapse", () => {
  let now = Date.UTC(2026, 9, 25);
  let c = review(undefined, Rating.Good, now);
  for (let i = 0; i < 5; i++) {
    now = Math.max(c.due, now + DAY);
    c = review(c, Rating.Good, now);
  }
  const before = c.s;
  c = review(c, Rating.Again, c.due);
  assert.equal(c.lapses, 1);
  assert.ok(c.s < before);
  assert.equal(isMastered(c), false);
});

test("grade limits cap the review interval", () => {
  let now = Date.UTC(2026, 9, 25);
  const opts = { maxInterval: 30, learningSteps: ["5m", "1d"] as ("5m" | "1d")[] };
  let c = review(undefined, Rating.Good, now, 0.9, opts);
  for (let i = 0; i < 12; i++) {
    now = Math.max(c.due, now + DAY);
    c = review(c, Rating.Easy, now, 0.9, opts);
  }
  assert.ok(c.due - now <= 31 * DAY, `interval ${(c.due - now) / DAY}`);
});
