import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { atlas } from "../atlas/data";
import { migrateProgress } from "./migrate";
import { emptyProgress, exportBackup, flush, importBackup, store } from "./store";

const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  get length() {
    return mem.size;
  },
};
const target = { id: atlas.id, aliases: atlas.aliases, has: (id: string) => atlas.byId.has(id) };
const card = (s: number, last = 1) => ({ due: 1, s, d: 5, el: 0, sd: 1, ls: 0, reps: 1, lapses: 0, st: 2 as const, seen: 1, last });

function v1() {
  return {
    ...emptyProgress("wordsprout-v1"),
    cards: {
      "animals.dog": card(3),
      "fruits.orange": card(1),
      "colors.orange": card(5),
      "food.beans": card(2),
      "actions.pray": card(4),
    },
    bookmarks: ["fruits.grapes", "actions.pray"],
    mistakes: ["body.eyes", "body.eye"],
    days: { "2026-10-30": { n: 3, r: 4, c: 3, t: 60 } },
  };
}

const legacySettings = JSON.stringify({
  schema: 4,
  grade: 3,
  onboarded: true,
  accent: "us",
  autoplay: true,
  sfx: true,
  retention: 0.9,
  dailyNew: 8,
  advanced: false,
  gardenGrade: 0,
});

beforeEach(() => {
  flush();
  mem.clear();
});

test("v1 progress maps onto v2 ids, keeps the stronger card, drops retired words", () => {
  const m = migrateProgress(v1(), target);
  assert.equal(m.datasetId, "wordsprout-v2");
  assert.deepEqual(Object.keys(m.cards).sort(), ["animals.dog", "colors.orange", "w.bean"]);
  assert.equal(m.cards["colors.orange"].s, 5, "stronger memory wins on alias collisions");
  assert.deepEqual(m.bookmarks, ["w.grape"]);
  assert.deepEqual(m.mistakes, ["body.eye"]);
  assert.deepEqual(m.days, v1().days);
  assert.equal(m.session, null);
});

test("first load of v2 migrates stored v1 progress and keeps the v1 key", () => {
  mem.set("wordsprout:settings", legacySettings);
  mem.set("wordsprout:progress:wordsprout-v1", JSON.stringify(v1()));
  store.rehydrate();
  store.useDataset(target);
  const p = store.get().progress;
  assert.equal(p.datasetId, "wordsprout-v2");
  assert.ok(p.cards["animals.dog"] && p.cards["w.bean"]);
  assert.ok(mem.has("wordsprout:progress:wordsprout-v1"));
});

test("existing v2 progress is never overwritten by v1", () => {
  mem.set("wordsprout:settings", legacySettings);
  mem.set("wordsprout:progress:wordsprout-v1", JSON.stringify(v1()));
  mem.set("wordsprout:progress:wordsprout-v2", JSON.stringify({ ...emptyProgress("wordsprout-v2"), cards: { "fruits.apple": card(1) } }));
  store.rehydrate();
  store.useDataset(target);
  assert.deepEqual(Object.keys(store.get().progress.cards), ["fruits.apple"]);
});

test("a v1 backup file can be imported into v2", () => {
  store.rehydrate();
  store.completeOnboarding({ name: "测试", grade: 3 });
  store.useDataset(target);
  const backup = JSON.parse(exportBackup());
  const legacy = {
    app: "wordsprout",
    version: 2,
    progress: v1(),
    settings: JSON.parse(legacySettings),
  };
  const r = importBackup(JSON.stringify(legacy));
  assert.equal(r.ok, true);
  assert.ok(store.get().progress.cards["colors.orange"]);
  const other = { ...backup, version: 2, progress: { ...v1(), datasetId: "something-else" }, settings: legacy.settings };
  assert.equal(importBackup(JSON.stringify(other)).ok, false);
});
