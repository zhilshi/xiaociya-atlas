import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { bandOf, buildAtlas, type RawLexicon } from "./lexicon";

const raw = JSON.parse(readFileSync(new URL("../data/lexicon.json", import.meta.url), "utf8")) as RawLexicon;

test("loads all 395 original words with emoji images and grade bands", () => {
  const a = buildAtlas(raw);
  assert.equal(a.count, 395);
  assert.equal(a.topics.length, 10);
  for (const w of a.words) {
    assert.ok(w.emoji && w.word && w.zh, w.id);
    assert.ok([1, 2, 3].includes(w.band), w.id);
  }
  const low = a.words.filter((w) => w.band === 1).length;
  assert.ok(low >= 200, `low band ${low}`);
});

test("learning path goes band by band", () => {
  const a = buildAtlas(raw);
  for (let i = 1; i < a.words.length; i++) assert.ok(a.words[i].band >= a.words[i - 1].band);
  assert.equal(a.words[0].order, 0);
});

test("band mapping follows level with early family words", () => {
  assert.equal(bandOf({ id: "x", level: 1 }), 1);
  assert.equal(bandOf({ id: "x", level: 2 }), 2);
  assert.equal(bandOf({ id: "x", level: 3 }), 3);
  assert.equal(bandOf({ id: "family.grandmother", level: 3 }), 1);
});
