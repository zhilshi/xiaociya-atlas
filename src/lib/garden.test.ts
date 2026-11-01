import assert from "node:assert/strict";
import { test } from "node:test";
import { bedSummary, isThirsty, plantOf, stageOf } from "./garden";
import { review, Rating, type CardState } from "../store/srs";

const card = (p: Partial<CardState>): CardState => ({ due: 0, s: 1, d: 5, el: 0, sd: 1, ls: 0, reps: 1, lapses: 0, st: 2, seen: 0, ...p });
const DAY = 86400000;

test("no card is a seed", () => {
  assert.equal(stageOf(undefined), "seed");
  assert.equal(isThirsty(undefined, Date.now()), false);
});

test("learning and relearning cards are sprouts", () => {
  assert.equal(stageOf(card({ st: 0 })), "sprout");
  assert.equal(stageOf(card({ st: 1, s: 30 })), "sprout");
  assert.equal(stageOf(card({ st: 3, s: 30 })), "sprout");
});

test("review cards grow by stability with exact boundaries", () => {
  assert.equal(stageOf(card({ s: 0.2 })), "leaf");
  assert.equal(stageOf(card({ s: 6.9 })), "leaf");
  assert.equal(stageOf(card({ s: 7 })), "bloom");
  assert.equal(stageOf(card({ s: 20.9 })), "bloom");
  assert.equal(stageOf(card({ s: 21 })), "fruit");
  assert.equal(stageOf(card({ s: 400 })), "fruit");
});

test("due cards are thirsty, including due exactly now", () => {
  const now = 1_000_000;
  assert.equal(plantOf(card({ due: now }), now).thirsty, true);
  assert.equal(plantOf(card({ due: now - 1 }), now).thirsty, true);
  assert.equal(plantOf(card({ due: now + 1 }), now).thirsty, false);
});

test("a wrong answer never drops below sprout", () => {
  let now = Date.UTC(2026, 10, 1);
  let c = review(undefined, Rating.Good, now);
  for (let i = 0; i < 10; i++) {
    now = Math.max(c.due, now + DAY);
    c = review(c, Rating.Good, now);
  }
  assert.equal(stageOf(c), "fruit");
  c = review(c, Rating.Again, c.due);
  assert.equal(stageOf(c), "sprout");
  // A first-ever wrong answer also shows a sprout, not a seed.
  assert.equal(stageOf(review(undefined, Rating.Again, now)), "sprout");
});

test("bed summary counts stages and detects a fully fruiting bed", () => {
  const cards = { a: card({ s: 30, due: 9e15 }), b: card({ s: 25, due: 0 }) };
  const s = bedSummary(["a", "b"], cards, 1);
  assert.equal(s.counts.fruit, 2);
  assert.equal(s.thirsty, 1);
  assert.equal(s.complete, true);
  assert.equal(bedSummary(["a", "c"], cards, 1).complete, false);
});
