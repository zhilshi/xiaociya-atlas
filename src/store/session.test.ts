import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildAtlas, type RawLexicon } from "../atlas/lexicon";
import { distractors, gradeFor, nextNew, quizKind, starsFor } from "./session";
import { Rating } from "./srs";
import { defaultSettings, emptyProgress, settingsForGrade } from "./store";
import { gradeConfig } from "../lib/grade";

const atlas = buildAtlas(JSON.parse(readFileSync(new URL("../data/lexicon.json", import.meta.url), "utf8")) as RawLexicon);
const p = emptyProgress(atlas.id);

test("grade 1 meets only lowest-band words first", () => {
  const ids = nextNew(atlas, p, settingsForGrade(defaultSettings, 1), 30);
  assert.equal(ids.length, 30);
  for (const id of ids) assert.equal(atlas.byId.get(id)!.band, 1);
});

test("grades 1–2 never get spelling", () => {
  const s = settingsForGrade(defaultSettings, 2);
  const card = { due: 0, s: 30, d: 5, el: 0, sd: 0, ls: 0, reps: 9, lapses: 0, st: 2 as const, seen: 0 };
  for (const w of atlas.words.slice(0, 80)) {
    const k = quizKind(w, { ...p, cards: { [w.id]: card } }, s, 7);
    assert.ok(k === "listen" || k === "picture", k);
  }
});

test("distractors are distinct pictures, mostly from the same bed", () => {
  const ref = atlas.byId.get("animals.dog")!;
  const opts = distractors(atlas, ref, "listen", 42);
  assert.equal(opts.length, 4);
  assert.ok(opts.includes(ref.id));
  const emojis = new Set(opts.map((id) => atlas.byId.get(id)!.emoji));
  assert.equal(emojis.size, 4);
  assert.ok(opts.every((id) => atlas.byId.get(id)!.topicId === "animals"));
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
