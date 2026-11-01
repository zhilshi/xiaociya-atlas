import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { convert, readRows, WA_CORE, WA_EXT, WA_IMG, type PackedLexicon, type V1Lexicon } from "./convert";
import { TOPICS_V2 } from "./topics-v2";

const file = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const rows = readRows(file("data/wordlist-v2.csv"));
const v1 = JSON.parse(file("data/legacy/lexicon-v1.json")) as V1Lexicon;
const wa = JSON.parse(file("data/word-atlas-manifest.json"));
const lex = convert(rows, v1, wa);
const shipped = JSON.parse(file("src/data/lexicon-v2.json")) as PackedLexicon;

test("CSV → data: 1717 words, 247/247/235/234/377/377 per grade", () => {
  assert.equal(rows.length, 1717);
  assert.equal(lex.words.length, 1717);
  const per = [1, 2, 3, 4, 5, 6].map((g) => lex.words.filter((w) => w[4] === g).length);
  assert.deepEqual(per, [247, 247, 235, 234, 377, 377]);
});

test("the bundled lexicon is up to date with the CSV (npm run data)", () => {
  assert.deepEqual(shipped.words, lex.words);
  assert.deepEqual(shipped.topics, lex.topics);
  assert.deepEqual(shipped.aliases, lex.aliases);
});

test("ids are unique and stable for words that were already in v1", () => {
  const ids = new Set(lex.words.map((w) => w[0]));
  assert.equal(ids.size, 1717);
  const byEn = new Map(lex.words.map((w) => [w[1], w[0]]));
  let kept = 0;
  for (const old of v1.words) {
    if (ids.has(old.id)) {
      kept++;
      continue;
    }
    // Every retired v1 id points to its v2 word, except "pray" which left the list.
    if (old.en === "pray") continue;
    assert.ok(lex.aliases[old.id], `v1 ${old.id} has neither a v2 id nor an alias`);
    assert.ok(ids.has(lex.aliases[old.id]));
  }
  assert.ok(kept >= 380, `kept ${kept}`);
  assert.equal(byEn.get("dog"), "animals.dog");
  assert.equal(byEn.get("May"), "calendar.may");
  assert.notEqual(byEn.get("may"), "calendar.may");
  assert.equal(byEn.get("orange"), "colors.orange");
  assert.equal(lex.aliases["fruits.orange"], "colors.orange");
  // Same input, same ids: conversion is deterministic.
  assert.deepEqual(convert(rows, v1, wa).words.map((w) => w[0]), lex.words.map((w) => w[0]));
});

test("topics: every word in exactly one kid topic of 8–60 words, with emoji icon and Chinese name", () => {
  const seen = new Map<string, number>();
  for (const t of TOPICS_V2) for (const w of t.words.split("|")) seen.set(w, (seen.get(w) ?? 0) + 1);
  for (const r of rows) assert.equal(seen.get(r.en), 1, `${r.en} listed ${seen.get(r.en) ?? 0}×`);
  assert.equal(lex.topics.length, TOPICS_V2.length);
  lex.topics.forEach((t, i) => {
    const n = lex.words.filter((w) => w[5] === i).length;
    assert.ok(n >= 8 && n <= 60, `${t.id} has ${n}`);
    assert.match(t.zh, /\p{Script=Han}/u, t.id);
    assert.match(t.icon, /\p{Extended_Pictographic}/u, t.id);
  });
});

test("no food placeholder: unlearned or picture-less words never show a chestnut", () => {
  for (const w of lex.words) if (w[1] !== "chestnut") assert.notEqual(w[6], "🌰", w[1]);
  const bare = lex.words.filter((w) => !w[6] && !w[7] && !(w[9] & WA_IMG));
  // These get the big-letter gloss card; there must be some, and fewer than a quarter.
  assert.ok(bare.length < 1717 / 4, `${bare.length} without picture`);
});

test("word atlas flags follow the manifest; core and extension are separate", () => {
  const withImg = lex.words.filter((w) => w[9] & WA_IMG).length;
  assert.ok(withImg > 1200, `img ${withImg}`);
  for (const w of lex.words) {
    const m = wa.words[w[1]];
    if (!m) assert.equal(w[9], 0);
    else {
      assert.equal(w[8], m.stem);
      assert.equal(!!(w[9] & WA_CORE), !!m.core);
      assert.equal(!!(w[9] & WA_EXT), !!m.ext);
    }
  }
});
