import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { atlas } from "../atlas/data";
import type { WaEntry } from "../lib/media";
import { defaultSettings, sanitizeSettings, settingsForGrade } from "../store/store";
import { WordExtras } from "./WordExtras";

const entry: WaEntry = {
  uk: "/x/",
  us: "/x/",
  core: {
    ex: [
      { en: "I like my red kite.", zh: "我喜欢我的红风筝。", kid: true },
      { en: "We fly it in the park.", zh: "我们在公园放它。", kid: true },
      { en: "UNSAFE-NOT-KID sentence.", zh: "不该出现", kid: false },
    ],
    col: [["fly a kite", "放风筝"]],
  },
  ext: { ex: [{ en: "EXT-ONLY example about mortgages.", zh: "进阶例句", kid: false }], fam: ["EXTFAM"], tip: "EXT-TIP" },
};
const html = (grade: number, advanced: boolean, e: WaEntry | null = entry) => renderToStaticMarkup(createElement(WordExtras, { entry: e, grade, advanced }));
const EXT = /EXT-ONLY|EXTFAM|EXT-TIP|进阶 Advanced|data-tier="ext"/;

test("kid mode never renders extension content by default (grades 1–4)", () => {
  for (const g of [1, 2, 3, 4] as const) {
    const s = settingsForGrade(defaultSettings, g);
    assert.equal(s.advanced, false);
    const out = html(g, s.advanced);
    assert.doesNotMatch(out, EXT, `grade ${g}`);
    assert.doesNotMatch(out, /UNSAFE-NOT-KID/);
  }
  // Fresh installs and upgraded schema-3 settings are kid mode too.
  assert.equal(sanitizeSettings(null).advanced, false);
  assert.doesNotMatch(html(3, sanitizeSettings({ schema: 3, grade: 3 }).advanced), EXT);
});

test("grades 1–2 see at most one short example and no collocations", () => {
  const out = html(1, false);
  assert.equal(out.match(/class="example"/g)?.length, 1);
  assert.doesNotMatch(out, /fly a kite/);
  const g3 = html(3, false);
  assert.equal(g3.match(/class="example"/g)?.length, 2);
  assert.match(g3, /fly a kite/);
});

test("with 进阶 on, the extension is present but collapsed", () => {
  const out = html(5, true);
  assert.match(out, /<details class="advanced" data-tier="ext">/);
  assert.doesNotMatch(out, /<details[^>]* open/);
  assert.match(out, /EXT-ONLY/);
  assert.match(out, /CC BY 4.0/);
  assert.equal(html(5, true, null), "");
});

test("shipped kid content is marked kid-safe and kept apart from the extension", () => {
  const words = new Set(atlas.words.map((w) => w.word));
  for (const g of [1, 2, 3, 4, 5, 6]) {
    const all = JSON.parse(readFileSync(new URL(`../../public/wa/entries/g${g}.json`, import.meta.url), "utf8")) as Record<string, WaEntry>;
    for (const [w, e] of Object.entries(all)) {
      assert.ok(words.has(w), w);
      for (const x of e.core?.ex ?? []) assert.equal(x.kid, true, `${w}: ${x.en}`);
      assert.ok((e.core?.ex ?? []).length <= (g <= 2 ? 1 : 2), w);
      if (g <= 2) for (const x of e.core?.ex ?? []) assert.ok(x.en.split(/\s+/).length <= 8, x.en);
      const text = JSON.stringify(e).toLowerCase();
      assert.doesNotMatch(text, /\b(kill|murder|gun|sex|drunk|cocaine|suicide)\b/, w);
    }
  }
});
