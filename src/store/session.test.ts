import assert from "node:assert/strict";
import { test } from "node:test";
import { atlas } from "../atlas/data";
import { gradeConfig } from "../lib/grade";
import { distractors, gradeFor, gradeOrder, nextNew, quizKind, starsFor, todayPlan } from "./session";
import { Rating } from "./srs";
import { defaultSettings, emptyProgress, settingsForGrade } from "./store";

const p = emptyProgress(atlas.id);
const card = { due: 0, s: 30, d: 5, el: 0, sd: 0, ls: 0, reps: 9, lapses: 0, st: 2 as const, seen: 0 };

test("new words come from the chosen grade first", () => {
  for (const g of [1, 2, 3, 4, 5, 6] as const) {
    const ids = nextNew(atlas, p, settingsForGrade(defaultSettings, g), 40);
    assert.equal(ids.length, 40);
    for (const id of ids) assert.equal(atlas.byId.get(id)!.grade, g, `grade ${g}: ${id}`);
  }
});

test("when a grade is used up, lower grades fill in (nearest first), then higher", () => {
  assert.deepEqual(gradeOrder(4), [4, 3, 2, 1, 5, 6]);
  assert.deepEqual(gradeOrder(1), [1, 2, 3, 4, 5, 6]);
  const s = settingsForGrade(defaultSettings, 3);
  const cards = Object.fromEntries(atlas.words.filter((w) => w.grade === 3).map((w) => [w.id, { ...card, due: Date.now() + 1e9 }]));
  const ids = nextNew(atlas, { ...p, cards }, s, 5);
  assert.ok(ids.every((id) => atlas.byId.get(id)!.grade === 2));
});

test("daily new words: grades 1–2 → 5, 3–4 → 8, 5–6 → 10; due reviews from lower grades included", () => {
  const now = Date.now();
  const g1word = atlas.words.find((w) => w.grade === 1)!;
  for (const [g, n] of [[1, 5], [2, 5], [3, 8], [4, 8], [5, 10], [6, 10]] as const) {
    const s = settingsForGrade(defaultSettings, g);
    const plan = todayPlan(atlas, { ...p, cards: { [g1word.id]: { ...card, due: now - 1000 } } }, s, now);
    assert.equal(plan.fresh.length, n);
    assert.deepEqual(plan.due, [g1word.id]);
  }
});

test("spelling stays per grade: none for 1–2, tiles 3–4, typing 5–6", () => {
  assert.equal(gradeConfig(1).spell, "none");
  assert.equal(gradeConfig(2).spell, "none");
  assert.equal(gradeConfig(3).spell, "tiles");
  assert.equal(gradeConfig(4).spell, "tiles");
  assert.equal(gradeConfig(5).spell, "type");
  assert.equal(gradeConfig(6).spell, "type");
  const s = settingsForGrade(defaultSettings, 2);
  for (const w of atlas.words.slice(0, 120)) {
    const k = quizKind(w, { ...p, cards: { [w.id]: card } }, s, 7);
    assert.ok(k === "listen" || k === "picture", k);
  }
});

test("distractors are distinct pictures and meanings, mostly from the same bed", () => {
  const ref = atlas.byId.get("animals.dog")!;
  const opts = distractors(atlas, ref, "listen", 42);
  assert.equal(opts.length, 4);
  assert.ok(opts.includes(ref.id));
  const ws = opts.map((id) => atlas.byId.get(id)!);
  assert.equal(new Set(ws.map((w) => w.zh)).size, 4);
  assert.equal(new Set(ws.map((w) => w.emoji || w.wa)).size, 4);
  assert.ok(ws.filter((w) => w.topicId === ref.topicId).length >= 3);
});

test("words without emoji still get three distinct options", () => {
  const ref = atlas.words.find((w) => !w.emoji && !w.glyph)!;
  const opts = distractors(atlas, ref, "meaning", 9);
  assert.equal(new Set(opts).size, 4);
  assert.equal(new Set(opts.map((id) => atlas.byId.get(id)!.zh)).size, 4);
});

test("young children are graded gently and never Easy", () => {
  const low = gradeConfig(1);
  assert.equal(gradeFor("listen", true, 12000, false, low), Rating.Good);
  assert.equal(gradeFor("listen", true, 16000, false, low), Rating.Hard);
  assert.equal(gradeFor("spell", true, 1000, false, gradeConfig(6)), Rating.Easy);
  assert.equal(gradeFor("listen", false, 1000, false, low), Rating.Again);
});

test("stars instead of percentages", () => {
  assert.equal(starsFor(0, 5), 1);
  assert.equal(starsFor(3, 5), 2);
  assert.equal(starsFor(5, 5), 3);
});
