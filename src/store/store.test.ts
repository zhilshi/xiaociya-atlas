import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSettings, sanitizeProgress, sanitizeSettings, settingsForGrade } from "./store";

const card = { due: 1, s: 2, d: 5, el: 0, sd: 1, ls: 0, reps: 1, lapses: 0, st: 2, seen: 1 };

test("keeps valid progress and drops malformed records", () => {
  const p = sanitizeProgress(
    {
      version: 2,
      cards: { ok: card, bad: { ...card, d: 99 }, worse: "x" },
      bookmarks: ["ok", 3],
      days: { "2026-10-25": { n: 1, r: 2, c: 1, t: 30 }, nope: { n: 1, r: 1, c: 1, t: 1 } },
      typing: [{ at: 1, mode: "word", items: 10, wpm: 40, accuracy: 98 }, { at: 1, mode: "hack", items: 1, wpm: 1, accuracy: 1 }],
    },
    "wordsprout-v1",
  );
  assert.deepEqual(Object.keys(p.cards), ["ok"]);
  assert.deepEqual(p.bookmarks, ["ok"]);
  assert.deepEqual(Object.keys(p.days), ["2026-10-25"]);
  assert.equal(p.typing.length, 1);
});

test("rejects other progress versions and unknown settings", () => {
  assert.deepEqual(sanitizeProgress({ version: 1, cards: { ok: card } }, "x").cards, {});
  const s = sanitizeSettings({ accent: "fr", dailyNew: 1e9, theme: "dark", retention: 0.5 });
  assert.equal(s.accent, "us");
  assert.equal(s.dailyNew, defaultSettings.dailyNew);
  assert.equal(s.retention, 0.9);
  assert.equal("theme" in s, false, "no theme setting: the app is always light");
});

test("defaults: light, no grade, onboarding pending", () => {
  const s = sanitizeSettings(null);
  assert.equal(s.schema, 5);
  assert.equal(s.advanced, false);
  assert.equal(s.gardenGrade, 0);
  assert.equal(s.grade, 0);
  assert.equal(s.onboarded, false);
});

test("migrates old Word Atlas settings: no grade means onboarding again", () => {
  const old = { accent: "uk", dailyNew: 15, theme: "dark", onboarded: true, startLevel: 2, ambience: "stars", dataset: "open" };
  const s = sanitizeSettings(old);
  assert.equal(s.onboarded, false);
  assert.equal(s.grade, 0);
  assert.equal(s.accent, "uk");
  assert.deepEqual(Object.keys(s).sort(), Object.keys(defaultSettings).sort());
});

test("grade is validated and drives the daily goal", () => {
  assert.equal(sanitizeSettings({ grade: 7, onboarded: true }).grade, 0);
  assert.equal(sanitizeSettings({ grade: 2.5 }).grade, 0);
  assert.equal(sanitizeSettings({ grade: "3" }).grade, 0);
  const g1 = sanitizeSettings({ grade: 1, onboarded: true });
  assert.equal(g1.onboarded, true);
  assert.equal(g1.dailyNew, 5);
  assert.equal(sanitizeSettings({ grade: 4 }).dailyNew, 8);
  assert.equal(sanitizeSettings({ grade: 6 }).dailyNew, 10);
  assert.equal(sanitizeSettings({ grade: 6, dailyNew: 12 }).dailyNew, 12);
  assert.equal(settingsForGrade(defaultSettings, 2).dailyNew, 5);
  assert.equal(settingsForGrade(defaultSettings, 5).grade, 5);
});

test("schema 3 → 5: 进阶扩展 defaults on for grades 5–6, off for 1–4", () => {
  for (const g of [1, 2, 3, 4]) assert.equal(sanitizeSettings({ schema: 3, grade: g, onboarded: true }).advanced, false);
  for (const g of [5, 6]) assert.equal(sanitizeSettings({ schema: 3, grade: g, onboarded: true }).advanced, true);
  // An explicit schema-4/5 choice is kept; switching grade in 我的 resets to that grade's default.
  assert.equal(sanitizeSettings({ schema: 4, grade: 2, advanced: true }).advanced, true);
  assert.equal(sanitizeSettings({ schema: 5, grade: 6, advanced: false }).advanced, false);
  assert.equal(settingsForGrade(defaultSettings, 5).advanced, true);
  assert.equal(settingsForGrade({ ...defaultSettings, advanced: true }, 3).advanced, false);
  assert.equal(sanitizeSettings({ gardenGrade: 9 }).gardenGrade, 9);
  assert.equal(sanitizeSettings({ gardenGrade: 7 }).gardenGrade, 0);
  assert.equal(sanitizeSettings({ gardenGrade: "3" }).gardenGrade, 0);
});
