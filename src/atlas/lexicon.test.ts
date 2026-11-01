import assert from "node:assert/strict";
import { test } from "node:test";
import { atlas } from "./data";
import { topicWords } from "./lexicon";

test("loads the 1717-word grade 1–6 lexicon", () => {
  assert.equal(atlas.count, 1717);
  assert.equal(atlas.id, "wordsprout-v2");
  assert.equal(atlas.topics.length, 46);
  for (const w of atlas.words) {
    assert.ok(w.word && w.zh, w.id);
    assert.ok(w.grade >= 1 && w.grade <= 6, w.id);
    assert.equal(w.band, w.grade <= 2 ? 1 : w.grade <= 4 ? 2 : 3, w.id);
    assert.equal(atlas.byId.get(w.id), w);
  }
});

test("learning path goes grade by grade", () => {
  for (let i = 1; i < atlas.words.length; i++) assert.ok(atlas.words[i].grade >= atlas.words[i - 1].grade);
  assert.equal(atlas.words[0].order, 0);
});

test("topic words can be filtered by grade", () => {
  const all = topicWords(atlas, "pets");
  const g1 = topicWords(atlas, "pets", 1);
  assert.ok(all.length >= 8);
  assert.ok(g1.length > 0 && g1.length < all.length);
  assert.ok(g1.every((w) => w.grade === 1 && w.topicId === "pets"));
});
