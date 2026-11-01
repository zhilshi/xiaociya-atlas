import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { atlas } from "../atlas/data";
import {
  emptyProgress,
  exportBackup,
  flush,
  importBackup,
  MAX_CHILDREN,
  migrateLegacyStorage,
  progressKey,
  store,
} from "./store";

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
const card = (s: number) => ({ due: 1, s, d: 5, el: 0, sd: 1, ls: 0, reps: 1, lapses: 0, st: 2 as const, seen: 1, last: 1 });

beforeEach(() => {
  flush();
  mem.clear();
  store.rehydrate();
  store.useDataset(target);
});

test("legacy single-learner settings+progress migrate into the first child", () => {
  flush();
  mem.clear();
  mem.set(
    "wordsprout:settings",
    JSON.stringify({ schema: 4, grade: 3, dailyNew: 8, advanced: false, gardenGrade: 0, onboarded: true, accent: "uk", autoplay: true, sfx: true, retention: 0.9 }),
  );
  mem.set(
    "wordsprout:progress:wordsprout-v2",
    JSON.stringify({ ...emptyProgress("wordsprout-v2"), cards: { "animals.dog": card(3) } }),
  );
  const { profiles, migrated } = migrateLegacyStorage();
  assert.equal(migrated, true);
  assert.equal(profiles.children.length, 1);
  assert.equal(profiles.children[0].name, "小朋友");
  assert.equal(profiles.children[0].grade, 3);
  assert.ok(profiles.activeId);
  const raw = mem.get(progressKey(profiles.children[0].id, "wordsprout-v2"));
  assert.ok(raw);
  assert.ok(JSON.parse(raw!).cards["animals.dog"]);
  // Legacy keys stay so older builds can still read them.
  assert.ok(mem.has("wordsprout:progress:wordsprout-v2"));
});

test("two children keep separate progress when switching", () => {
  store.completeOnboarding({ name: "豆豆", grade: 2 });
  store.useDataset(target);
  store.progress((p) => ({ ...p, cards: { "animals.dog": card(2) } }));
  flush();
  const a = store.get().profiles.activeId!;
  const add = store.addChild({ name: "芽芽", grade: 5 });
  assert.equal(add.ok, true);
  store.useDataset(target);
  assert.deepEqual(store.get().progress.cards, {});
  store.progress((p) => ({ ...p, cards: { "fruits.apple": card(5) } }));
  flush();
  const b = store.get().profiles.activeId!;
  assert.notEqual(a, b);
  store.switchChild(a);
  assert.deepEqual(Object.keys(store.get().progress.cards), ["animals.dog"]);
  assert.equal(store.get().settings.grade, 2);
  store.switchChild(b);
  assert.deepEqual(Object.keys(store.get().progress.cards), ["fruits.apple"]);
  assert.equal(store.get().settings.grade, 5);
  // Device prefs are shared
  store.settings({ accent: "uk" });
  store.switchChild(a);
  assert.equal(store.get().settings.accent, "uk");
});

test("active child and progress survive rehydrate (refresh)", () => {
  store.completeOnboarding({ name: "豆豆", grade: 1 });
  store.progress((p) => ({ ...p, cards: { "animals.cat": card(1) } }));
  flush();
  const id = store.get().profiles.activeId!;
  store.addChild({ name: "芽芽", grade: 4 });
  store.switchChild(id);
  flush();
  store.rehydrate();
  store.useDataset(target);
  assert.equal(store.get().profiles.activeId, id);
  assert.equal(store.get().profiles.children.length, 2);
  assert.ok(store.get().progress.cards["animals.cat"]);
});

test("backup v3 round-trips multi-profile; v2 single backup still imports", () => {
  store.completeOnboarding({ name: "豆豆", grade: 2 });
  store.progress((p) => ({ ...p, cards: { "animals.dog": card(2) } }));
  store.addChild({ name: "芽芽", grade: 6 });
  store.progress((p) => ({ ...p, cards: { "fruits.apple": card(6) } }));
  flush();
  const backup = exportBackup();
  const parsed = JSON.parse(backup);
  assert.equal(parsed.version, 3);
  assert.equal(parsed.profiles.children.length, 2);

  mem.clear();
  store.rehydrate();
  store.useDataset(target);
  const r = importBackup(backup);
  assert.equal(r.ok, true);
  assert.equal(store.get().profiles.children.length, 2);
  const bean = store.get().profiles.children.find((c) => c.name === "豆豆")!;
  store.switchChild(bean.id);
  assert.ok(store.get().progress.cards["animals.dog"]);

  // Legacy v2 backup lands on the active child
  const v2 = {
    app: "wordsprout",
    version: 2,
    progress: { ...emptyProgress("wordsprout-v2"), cards: { "body.eye": card(1) } },
    settings: { schema: 4, grade: 1, onboarded: true, accent: "us", autoplay: true, sfx: true, retention: 0.9, dailyNew: 5, advanced: false, gardenGrade: 0 },
  };
  const r2 = importBackup(JSON.stringify(v2));
  assert.equal(r2.ok, true);
  assert.ok(store.get().progress.cards["body.eye"]);
});

test(`caps at ${MAX_CHILDREN} children`, () => {
  store.completeOnboarding({ name: "一号", grade: 1 });
  for (let i = 2; i <= MAX_CHILDREN; i++) {
    const r = store.addChild({ name: `${i}号`, grade: 1 });
    assert.equal(r.ok, true);
  }
  const over = store.addChild({ name: "溢出", grade: 1 });
  assert.equal(over.ok, false);
  assert.equal(store.get().profiles.children.length, MAX_CHILDREN);
});
