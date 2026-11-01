import { useSyncExternalStore } from "react";
import type { Accent } from "../atlas/types";
import type { CardState, Grade } from "./srs";
import { gradeConfig, isGrade, type SchoolGrade } from "../lib/grade";
import { LEGACY_DATASETS, migrateProgress, type MigrationTarget } from "./migrate";

export type QuizKind = "meaning" | "picture" | "listen" | "spell";
export type Step = { id: string; kind: "intro" } | { id: string; kind: QuizKind; retry?: boolean; options?: string[] };

export interface ActiveSession {
  id: string;
  started: number;
  steps: Step[];
  index: number;
  /** First-attempt grade per word; retries never change it. */
  graded: Record<string, Grade>;
  newIds: string[];
  reviewIds: string[];
  /** Answer shown but not yet continued; survives reload without double counting. */
  pending?: { correct: boolean; value: string };
  finished?: number;
}

export interface DayStat {
  n: number; // new words met
  r: number; // graded reviews (first attempts)
  c: number; // correct first attempts
  t: number; // active seconds
}

export interface TypingRound {
  at: number;
  mode: "word" | "sentence" | "dictation";
  items: number;
  wpm: number;
  accuracy: number;
}

export interface Progress {
  version: 2;
  datasetId: string;
  cards: Record<string, CardState>;
  bookmarks: string[];
  days: Record<string, DayStat>;
  typing: TypingRound[];
  session: ActiveSession | null;
  /** Rolling list of recent mistakes, newest first. */
  mistakes: string[];
}

/** Per-child learning profile (nickname, grade, and child-scoped settings). */
export interface ChildProfile {
  id: string;
  name: string;
  createdAt: number;
  grade: SchoolGrade | 0;
  dailyNew: number;
  advanced: boolean;
  gardenGrade: number;
  onboarded: boolean;
}

export interface ProfilesState {
  version: 1;
  activeId: string | null;
  children: ChildProfile[];
}

/** Device-level prefs shared across kids. */
export interface DeviceSettings {
  schema: 5;
  accent: Accent;
  autoplay: boolean;
  retention: number;
  sfx: boolean;
}

/**
 * Merged view used by the rest of the app: device prefs + the active child's slice.
 * Keeping this shape means pages can keep reading `settings.grade` etc.
 */
export interface Settings extends DeviceSettings {
  grade: SchoolGrade | 0;
  dailyNew: number;
  advanced: boolean;
  gardenGrade: number;
  onboarded: boolean;
}

export const SETTINGS_SCHEMA = 5 as const;
export const MAX_CHILDREN = 6;
/** Advanced content defaults on for grades 5–6, off for 1–4 (parents can change it in 我的). */
export const advancedDefault = (grade: number) => grade >= 5;

export const defaultDevice: DeviceSettings = {
  schema: SETTINGS_SCHEMA,
  accent: "us",
  autoplay: true,
  retention: 0.9,
  sfx: true,
};

export const defaultSettings: Settings = {
  ...defaultDevice,
  grade: 0,
  dailyNew: 8,
  advanced: false,
  gardenGrade: 0,
  onboarded: false,
};

const CHILD_KEYS = ["grade", "dailyNew", "advanced", "gardenGrade", "onboarded"] as const;

/** Settings after a grade is picked: the daily goal follows the grade (5 / 8 / 10). */
export function settingsForGrade(s: Settings, grade: SchoolGrade): Settings {
  return { ...s, grade, dailyNew: gradeConfig(grade).dailyNew, advanced: advancedDefault(grade), gardenGrade: 0 };
}

export const emptyProgress = (datasetId: string): Progress => ({
  version: 2,
  datasetId,
  cards: {},
  bookmarks: [],
  days: {},
  typing: [],
  session: null,
  mistakes: [],
});

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const PROFILES_KEY = "wordsprout:profiles";
const DEVICE_KEY = "wordsprout:device";
const LEGACY_SETTINGS_KEY = "wordsprout:settings";
const legacyProgressKey = (datasetId: string) => `wordsprout:progress:${datasetId}`;
export const progressKey = (childId: string, datasetId: string) => `wordsprout:progress:${childId}:${datasetId}`;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function newChildId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function defaultChild(partial?: Partial<ChildProfile> & { name?: string }): ChildProfile {
  const grade = partial?.grade && isGrade(partial.grade) ? partial.grade : 0;
  return {
    id: partial?.id ?? newChildId(),
    name: (partial?.name ?? "小朋友").trim().slice(0, 12) || "小朋友",
    createdAt: partial?.createdAt ?? Date.now(),
    grade,
    dailyNew: partial?.dailyNew ?? (grade ? gradeConfig(grade).dailyNew : 8),
    advanced: partial?.advanced ?? advancedDefault(grade),
    gardenGrade: partial?.gardenGrade ?? 0,
    onboarded: partial?.onboarded ?? (grade !== 0),
  };
}

/* ---------- validation (backups and stored data are untrusted) ---------- */

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown, lo = -Infinity, hi = Infinity) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;

function validCard(v: unknown): v is CardState {
  return (
    isObj(v) &&
    num(v.due, 0) &&
    num(v.s, 0) &&
    num(v.d, 0, 11) &&
    num(v.el, 0) &&
    num(v.sd, 0) &&
    num(v.ls, 0) &&
    num(v.reps, 0) &&
    num(v.lapses, 0) &&
    [0, 1, 2, 3].includes(v.st as number) &&
    (v.last === undefined || num(v.last, 0)) &&
    num(v.seen, 0)
  );
}

export function sanitizeProgress(v: unknown, datasetId: string): Progress {
  const out = emptyProgress(datasetId);
  if (!isObj(v) || v.version !== 2) return out;
  if (isObj(v.cards)) for (const [k, c] of Object.entries(v.cards)) if (validCard(c)) out.cards[k] = c;
  if (Array.isArray(v.bookmarks)) out.bookmarks = v.bookmarks.filter((x): x is string => typeof x === "string").slice(0, 20000);
  if (Array.isArray(v.mistakes)) out.mistakes = v.mistakes.filter((x): x is string => typeof x === "string").slice(0, 300);
  if (isObj(v.days))
    for (const [k, d] of Object.entries(v.days))
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && isObj(d) && num(d.n, 0) && num(d.r, 0) && num(d.c, 0) && num(d.t, 0))
        out.days[k] = { n: d.n as number, r: d.r as number, c: d.c as number, t: d.t as number };
  if (Array.isArray(v.typing))
    out.typing = v.typing
      .filter(
        (t): t is TypingRound =>
          isObj(t) && num(t.at, 0) && ["word", "sentence", "dictation"].includes(t.mode as string) && num(t.items, 0) && num(t.wpm, 0, 400) && num(t.accuracy, 0, 100),
      )
      .slice(-500);
  const s = v.session;
  if (isObj(s) && typeof s.id === "string" && Array.isArray(s.steps) && num(s.index, 0) && isObj(s.graded))
    out.session = s as unknown as ActiveSession;
  return out;
}

export function sanitizeDevice(v: unknown): DeviceSettings {
  const d = { ...defaultDevice };
  if (!isObj(v)) return d;
  if (v.accent === "uk" || v.accent === "us") d.accent = v.accent;
  if (typeof v.autoplay === "boolean") d.autoplay = v.autoplay;
  if (typeof v.sfx === "boolean") d.sfx = v.sfx;
  if (num(v.retention, 0.7, 0.97)) d.retention = v.retention as number;
  return d;
}

export function sanitizeChild(v: unknown): ChildProfile | null {
  if (!isObj(v) || typeof v.id !== "string" || !v.id) return null;
  const name = typeof v.name === "string" && v.name.trim() ? v.name.trim().slice(0, 12) : "小朋友";
  const grade = isGrade(v.grade) ? v.grade : 0;
  const child = defaultChild({
    id: v.id,
    name,
    createdAt: num(v.createdAt, 0) ? (v.createdAt as number) : Date.now(),
    grade,
    dailyNew: grade ? gradeConfig(grade).dailyNew : 8,
    advanced: advancedDefault(grade),
    gardenGrade: 0,
    onboarded: false,
  });
  if (num(v.dailyNew, 1, 30)) child.dailyNew = Math.round(v.dailyNew as number);
  if (typeof v.advanced === "boolean") child.advanced = v.advanced;
  if ([0, 1, 2, 3, 4, 5, 6, 9].includes(v.gardenGrade as number)) child.gardenGrade = v.gardenGrade as number;
  child.onboarded = v.onboarded === true && child.grade !== 0;
  return child;
}

export function sanitizeProfiles(v: unknown): ProfilesState {
  if (!isObj(v) || v.version !== 1 || !Array.isArray(v.children)) return { version: 1, activeId: null, children: [] };
  const children = v.children.map(sanitizeChild).filter((c): c is ChildProfile => !!c).slice(0, MAX_CHILDREN);
  const activeId = typeof v.activeId === "string" && children.some((c) => c.id === v.activeId) ? v.activeId : children[0]?.id ?? null;
  return { version: 1, activeId, children };
}

/** Sanitize legacy merged settings (schema ≤4) or a partial patch into a full Settings object. */
export function sanitizeSettings(v: unknown): Settings {
  const s = { ...defaultSettings };
  if (!isObj(v)) return s;
  const device = sanitizeDevice(v);
  Object.assign(s, device);
  if (isGrade(v.grade)) {
    s.grade = v.grade;
    s.dailyNew = gradeConfig(v.grade).dailyNew;
    s.advanced = advancedDefault(v.grade);
  }
  // Schema 3 → 4/5: `advanced` and `gardenGrade` are new; keep explicit choices from schema ≥4.
  if ((v.schema === 4 || v.schema === 5) && typeof v.advanced === "boolean") s.advanced = v.advanced;
  if ([0, 1, 2, 3, 4, 5, 6, 9].includes(v.gardenGrade as number)) s.gardenGrade = v.gardenGrade as number;
  if (num(v.dailyNew, 1, 30)) s.dailyNew = Math.round(v.dailyNew as number);
  s.onboarded = v.onboarded === true && s.grade !== 0;
  s.schema = SETTINGS_SCHEMA;
  return s;
}

export function mergeSettings(device: DeviceSettings, child: ChildProfile | null): Settings {
  if (!child) return { ...defaultSettings, ...device, schema: SETTINGS_SCHEMA };
  return {
    ...device,
    schema: SETTINGS_SCHEMA,
    grade: child.grade,
    dailyNew: child.dailyNew,
    advanced: child.advanced,
    gardenGrade: child.gardenGrade,
    onboarded: child.onboarded,
  };
}

function childFromSettings(s: Settings, name = "小朋友"): ChildProfile {
  return defaultChild({
    name,
    grade: s.grade,
    dailyNew: s.dailyNew,
    advanced: s.advanced,
    gardenGrade: s.gardenGrade,
    onboarded: s.onboarded,
  });
}

/** One-time: legacy single-learner keys → profiles + per-child progress. */
export function migrateLegacyStorage(): { profiles: ProfilesState; device: DeviceSettings; migrated: boolean } {
  const existing = read<unknown>(PROFILES_KEY);
  if (existing !== null) {
    return { profiles: sanitizeProfiles(existing), device: sanitizeDevice(read(DEVICE_KEY) ?? read(LEGACY_SETTINGS_KEY)), migrated: false };
  }
  const legacy = read<unknown>(LEGACY_SETTINGS_KEY);
  if (legacy === null) {
    const profiles: ProfilesState = { version: 1, activeId: null, children: [] };
    const device = { ...defaultDevice };
    write(PROFILES_KEY, profiles);
    write(DEVICE_KEY, device);
    return { profiles, device, migrated: false };
  }
  const s = sanitizeSettings(legacy);
  const device = sanitizeDevice(s);
  const child = childFromSettings(s, "小朋友");
  // Only keep a child when onboarding already finished (or a grade was chosen).
  const children = child.grade !== 0 ? [child] : [];
  const profiles: ProfilesState = { version: 1, activeId: children[0]?.id ?? null, children };
  write(PROFILES_KEY, profiles);
  write(DEVICE_KEY, device);
  if (children[0]) {
    for (const ds of ["wordsprout-v2", ...LEGACY_DATASETS]) {
      const raw = localStorage.getItem(legacyProgressKey(ds));
      if (raw !== null) write(progressKey(children[0].id, ds), JSON.parse(raw));
    }
  }
  return { profiles, device, migrated: true };
}

/* ---------- store ---------- */

interface State {
  progress: Progress;
  settings: Settings;
  profiles: ProfilesState;
  saveError: boolean;
}

function bootState(): State {
  const { profiles, device } = migrateLegacyStorage();
  const active = profiles.children.find((c) => c.id === profiles.activeId) ?? null;
  return {
    progress: emptyProgress("wordsprout-v2"),
    settings: mergeSettings(device, active),
    profiles,
    saveError: false,
  };
}

let state: State = bootState();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;
/** Only write when this tab changed something, so idle tabs never clobber newer data. */
let dirty = false;
/** Progress is written only after it has been read from storage for this child+dataset. */
let loadedKey: string | null = null;
/** Current lexicon (for migrating imported backups from older lexicons). */
let target_: MigrationTarget | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function activeChild(): ChildProfile | null {
  return state.profiles.children.find((c) => c.id === state.profiles.activeId) ?? null;
}

function scheduleSave() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 250);
}

function persistProfilesAndDevice(): boolean {
  const device: DeviceSettings = {
    schema: SETTINGS_SCHEMA,
    accent: state.settings.accent,
    autoplay: state.settings.autoplay,
    retention: state.settings.retention,
    sfx: state.settings.sfx,
  };
  // Mirror child slice from merged settings into the active profile before write.
  const profiles = { ...state.profiles, children: state.profiles.children.map((c) => {
    if (c.id !== state.profiles.activeId) return c;
    return {
      ...c,
      grade: state.settings.grade,
      dailyNew: state.settings.dailyNew,
      advanced: state.settings.advanced,
      gardenGrade: state.settings.gardenGrade,
      onboarded: state.settings.onboarded,
    };
  }) };
  state = { ...state, profiles };
  return write(PROFILES_KEY, profiles) && write(DEVICE_KEY, device);
}

export function flush() {
  clearTimeout(saveTimer);
  if (!dirty) return;
  dirty = false;
  const child = activeChild();
  const expectKey = child ? progressKey(child.id, state.progress.datasetId) : null;
  const progressOk = !expectKey || loadedKey !== expectKey || write(expectKey, state.progress);
  const ok = progressOk && persistProfilesAndDevice();
  if (ok === state.saveError) {
    state = { ...state, saveError: !ok };
    emit();
  }
}

function loadProgressFor(childId: string, target: MigrationTarget): { progress: Progress; migrated: boolean } {
  const datasetId = target.id;
  const key = progressKey(childId, datasetId);
  const stored = read(key);
  let progress = sanitizeProgress(stored, datasetId);
  let migrated = false;
  if (stored === null) {
    for (const old of LEGACY_DATASETS) {
      const raw = read(progressKey(childId, old));
      if (raw === null) continue;
      progress = migrateProgress(sanitizeProgress(raw, old), target);
      migrated = true;
      break;
    }
  }
  return { progress, migrated };
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
  window.addEventListener("storage", (e) => {
    if (!e.newValue || !e.key) return;
    try {
      if (e.key === PROFILES_KEY || e.key === DEVICE_KEY) {
        const profiles = e.key === PROFILES_KEY ? sanitizeProfiles(JSON.parse(e.newValue)) : state.profiles;
        const device = e.key === DEVICE_KEY ? sanitizeDevice(JSON.parse(e.newValue)) : sanitizeDevice({
          accent: state.settings.accent,
          autoplay: state.settings.autoplay,
          retention: state.settings.retention,
          sfx: state.settings.sfx,
        });
        if (e.key === PROFILES_KEY) {
          /* already set */
        }
        const active = profiles.children.find((c) => c.id === profiles.activeId) ?? null;
        state = { ...state, profiles, settings: mergeSettings(device, active) };
        if (active && target_) {
          const { progress } = loadProgressFor(active.id, target_);
          state = { ...state, progress };
          loadedKey = progressKey(active.id, target_.id);
        }
        emit();
      } else if (state.profiles.activeId && e.key === progressKey(state.profiles.activeId, state.progress.datasetId)) {
        state = { ...state, progress: sanitizeProgress(JSON.parse(e.newValue), state.progress.datasetId) };
        emit();
      }
    } catch {
      /* ignore malformed writes */
    }
  });
}

export const store = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** Re-read localStorage (tests / after seeding legacy keys). */
  rehydrate() {
    flush();
    state = bootState();
    loadedKey = null;
    const activeId = state.profiles.activeId;
    if (target_ && activeId) {
      const { progress, migrated } = loadProgressFor(activeId, target_);
      state = { ...state, progress };
      loadedKey = progressKey(activeId, target_.id);
      if (migrated) scheduleSave();
    }
    emit();
  },
  /** Load progress for a lexicon, migrating older lexicon progress the first time. */
  useDataset(target: MigrationTarget) {
    flush();
    target_ = target;
    const child = activeChild();
    if (!child) {
      state = { ...state, progress: emptyProgress(target.id) };
      loadedKey = null;
      emit();
      return;
    }
    const { progress, migrated } = loadProgressFor(child.id, target);
    state = { ...state, progress };
    loadedKey = progressKey(child.id, target.id);
    emit();
    if (migrated) scheduleSave();
  },
  progress(fn: (p: Progress) => Progress) {
    state = { ...state, progress: fn(state.progress) };
    emit();
    scheduleSave();
  },
  settings(patch: Partial<Settings>) {
    const next = { ...state.settings, ...patch, schema: SETTINGS_SCHEMA };
    let profiles = state.profiles;
    if (state.profiles.activeId && CHILD_KEYS.some((k) => k in patch)) {
      profiles = {
        ...profiles,
        children: profiles.children.map((c) =>
          c.id === profiles.activeId
            ? {
                ...c,
                grade: next.grade,
                dailyNew: next.dailyNew,
                advanced: next.advanced,
                gardenGrade: next.gardenGrade,
                onboarded: next.onboarded,
              }
            : c,
        ),
      };
    }
    state = { ...state, settings: next, profiles };
    emit();
    scheduleSave();
  },
  /** First-run onboarding: create the first child and activate them. */
  completeOnboarding(input: { name: string; grade: SchoolGrade }) {
    const name = input.name.trim().slice(0, 12) || "小朋友";
    const base = settingsForGrade(state.settings, input.grade);
    const child = defaultChild({
      name,
      grade: input.grade,
      dailyNew: base.dailyNew,
      advanced: base.advanced,
      gardenGrade: 0,
      onboarded: true,
    });
    const profiles: ProfilesState = { version: 1, activeId: child.id, children: [child] };
    state = {
      ...state,
      profiles,
      settings: mergeSettings(
        { schema: SETTINGS_SCHEMA, accent: state.settings.accent, autoplay: state.settings.autoplay, retention: state.settings.retention, sfx: state.settings.sfx },
        child,
      ),
      progress: emptyProgress(target_?.id ?? state.progress.datasetId),
    };
    loadedKey = progressKey(child.id, state.progress.datasetId);
    emit();
    scheduleSave();
  },
  addChild(input: { name: string; grade: SchoolGrade }): { ok: true; id: string } | { ok: false; error: string } {
    if (state.profiles.children.length >= MAX_CHILDREN) return { ok: false, error: `最多 ${MAX_CHILDREN} 个小朋友档案` };
    flush();
    const name = input.name.trim().slice(0, 12) || "小朋友";
    const base = settingsForGrade(defaultSettings, input.grade);
    const child = defaultChild({
      name,
      grade: input.grade,
      dailyNew: base.dailyNew,
      advanced: base.advanced,
      onboarded: true,
    });
    const profiles: ProfilesState = {
      version: 1,
      activeId: child.id,
      children: [...state.profiles.children, child],
    };
    const device: DeviceSettings = {
      schema: SETTINGS_SCHEMA,
      accent: state.settings.accent,
      autoplay: state.settings.autoplay,
      retention: state.settings.retention,
      sfx: state.settings.sfx,
    };
    const datasetId = target_?.id ?? state.progress.datasetId;
    state = {
      ...state,
      profiles,
      settings: mergeSettings(device, child),
      progress: emptyProgress(datasetId),
    };
    loadedKey = progressKey(child.id, datasetId);
    emit();
    scheduleSave();
    return { ok: true, id: child.id };
  },
  switchChild(id: string): boolean {
    if (!state.profiles.children.some((c) => c.id === id)) return false;
    if (id === state.profiles.activeId) return true;
    flush();
    const profiles = { ...state.profiles, activeId: id };
    const child = profiles.children.find((c) => c.id === id)!;
    const device: DeviceSettings = {
      schema: SETTINGS_SCHEMA,
      accent: state.settings.accent,
      autoplay: state.settings.autoplay,
      retention: state.settings.retention,
      sfx: state.settings.sfx,
    };
    let progress = emptyProgress(target_?.id ?? state.progress.datasetId);
    let key: string | null = null;
    if (target_) {
      const loaded = loadProgressFor(id, target_);
      progress = loaded.progress;
      key = progressKey(id, target_.id);
      if (loaded.migrated) dirty = true;
    }
    state = { ...state, profiles, settings: mergeSettings(device, child), progress };
    loadedKey = key;
    emit();
    scheduleSave();
    return true;
  },
  renameChild(id: string, name: string): boolean {
    const n = name.trim().slice(0, 12);
    if (!n) return false;
    if (!state.profiles.children.some((c) => c.id === id)) return false;
    const profiles = {
      ...state.profiles,
      children: state.profiles.children.map((c) => (c.id === id ? { ...c, name: n } : c)),
    };
    state = { ...state, profiles };
    emit();
    scheduleSave();
    return true;
  },
  updateChild(id: string, patch: Partial<Pick<ChildProfile, "name" | "grade" | "dailyNew" | "advanced" | "gardenGrade">>): boolean {
    const idx = state.profiles.children.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    let child = { ...state.profiles.children[idx] };
    if (typeof patch.name === "string") {
      const n = patch.name.trim().slice(0, 12);
      if (!n) return false;
      child.name = n;
    }
    if (isGrade(patch.grade)) {
      const next = settingsForGrade(mergeSettings(defaultDevice, child), patch.grade);
      child = { ...child, grade: patch.grade, dailyNew: next.dailyNew, advanced: next.advanced, gardenGrade: 0, onboarded: true };
    }
    if (num(patch.dailyNew, 1, 30)) child.dailyNew = Math.round(patch.dailyNew as number);
    if (typeof patch.advanced === "boolean") child.advanced = patch.advanced;
    if (patch.gardenGrade !== undefined && [0, 1, 2, 3, 4, 5, 6, 9].includes(patch.gardenGrade)) child.gardenGrade = patch.gardenGrade;
    const children = state.profiles.children.slice();
    children[idx] = child;
    const profiles = { ...state.profiles, children };
    const settings = id === state.profiles.activeId ? mergeSettings({
      schema: SETTINGS_SCHEMA,
      accent: state.settings.accent,
      autoplay: state.settings.autoplay,
      retention: state.settings.retention,
      sfx: state.settings.sfx,
    }, child) : state.settings;
    state = { ...state, profiles, settings };
    emit();
    scheduleSave();
    return true;
  },
  removeChild(id: string): { ok: true } | { ok: false; error: string } {
    if (!state.profiles.children.some((c) => c.id === id)) return { ok: false, error: "找不到这个档案" };
    flush();
    const children = state.profiles.children.filter((c) => c.id !== id);
    // Drop progress keys for the removed child (best-effort).
    for (const ds of ["wordsprout-v2", ...LEGACY_DATASETS]) removeKey(progressKey(id, ds));
    const activeId = state.profiles.activeId === id ? children[0]?.id ?? null : state.profiles.activeId;
    const profiles: ProfilesState = { version: 1, activeId, children };
    const device: DeviceSettings = {
      schema: SETTINGS_SCHEMA,
      accent: state.settings.accent,
      autoplay: state.settings.autoplay,
      retention: state.settings.retention,
      sfx: state.settings.sfx,
    };
    const child = children.find((c) => c.id === activeId) ?? null;
    let progress = emptyProgress(target_?.id ?? state.progress.datasetId);
    let key: string | null = null;
    if (child && target_) {
      const loaded = loadProgressFor(child.id, target_);
      progress = loaded.progress;
      key = progressKey(child.id, target_.id);
    }
    state = { ...state, profiles, settings: mergeSettings(device, child), progress };
    loadedKey = key;
    emit();
    scheduleSave();
    return { ok: true };
  },
};

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => select(state), () => select(state));
}

export function bumpDay(p: Progress, patch: Partial<DayStat>): Progress {
  const k = dayKey();
  const d = p.days[k] ?? { n: 0, r: 0, c: 0, t: 0 };
  return {
    ...p,
    days: {
      ...p.days,
      [k]: { n: d.n + (patch.n ?? 0), r: d.r + (patch.r ?? 0), c: d.c + (patch.c ?? 0), t: d.t + (patch.t ?? 0) },
    },
  };
}

export function toggleBookmark(id: string) {
  store.progress((p) => ({
    ...p,
    bookmarks: p.bookmarks.includes(id) ? p.bookmarks.filter((x) => x !== id) : [id, ...p.bookmarks],
  }));
}

/* ---------- backup ---------- */

export function exportBackup() {
  flush();
  const { progress, settings, profiles } = state;
  const device: DeviceSettings = {
    schema: SETTINGS_SCHEMA,
    accent: settings.accent,
    autoplay: settings.autoplay,
    retention: settings.retention,
    sfx: settings.sfx,
  };
  const progressMap: Record<string, Progress> = {};
  for (const child of profiles.children) {
    for (const ds of ["wordsprout-v2", ...LEGACY_DATASETS]) {
      const key = progressKey(child.id, ds);
      const raw = read<Progress>(key);
      if (raw) {
        const p = sanitizeProgress(raw, ds);
        progressMap[`${child.id}:${ds}`] = { ...p, session: null };
      }
    }
    // Ensure the in-memory active progress is included even if not yet flushed to a distinct read.
    if (child.id === profiles.activeId) {
      progressMap[`${child.id}:${progress.datasetId}`] = { ...progress, session: null };
    }
  }
  return JSON.stringify(
    {
      app: "wordsprout",
      version: 3,
      exported: new Date().toISOString(),
      device,
      profiles,
      progress: progressMap,
      // Legacy single-archive fields so older tooling can still peek at the active kid.
      settings: { ...settings, session: undefined },
      activeProgress: { ...progress, session: null },
    },
    null,
    1,
  );
}

function markDirty() {
  dirty = true;
}

export function importBackup(text: string): { ok: true; cards: number } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "文件不是有效的 JSON。" };
  }
  if (!isObj(data) || data.app !== "wordsprout") return { ok: false, error: "这不是小词芽的学习备份。" };

  // Multi-profile backup (v3)
  if (data.version === 3 && isObj(data.profiles) && isObj(data.progress)) {
    const profiles = sanitizeProfiles(data.profiles);
    if (!profiles.children.length) return { ok: false, error: "备份里没有小朋友档案。" };
    const device = sanitizeDevice(data.device ?? data.settings);
    // Write all progress blobs
    for (const [k, raw] of Object.entries(data.progress)) {
      const colon = k.indexOf(":");
      if (colon < 0) continue;
      const childId = k.slice(0, colon);
      const ds = k.slice(colon + 1);
      if (!profiles.children.some((c) => c.id === childId)) continue;
      let progress = sanitizeProgress(raw, ds);
      if (ds !== (target_?.id ?? progress.datasetId) && LEGACY_DATASETS.includes(ds) && target_) {
        progress = migrateProgress(progress, target_);
        write(progressKey(childId, target_.id), { ...progress, session: null });
      } else {
        write(progressKey(childId, progress.datasetId), { ...progress, session: null });
      }
    }
    const active = profiles.children.find((c) => c.id === profiles.activeId) ?? profiles.children[0];
    profiles.activeId = active.id;
    write(PROFILES_KEY, profiles);
    write(DEVICE_KEY, device);
    state = {
      ...state,
      profiles,
      settings: mergeSettings(device, active),
      progress: emptyProgress(target_?.id ?? "wordsprout-v2"),
    };
    if (target_) {
      const loaded = loadProgressFor(active.id, target_);
      state = { ...state, progress: loaded.progress };
      loadedKey = progressKey(active.id, target_.id);
    }
    emit();
    markDirty();
    flush();
    return { ok: true, cards: Object.keys(state.progress.cards).length };
  }

  // Legacy single-learner backup (v2)
  if (data.version !== 2 || !isObj(data.progress)) return { ok: false, error: "这不是小词芽的学习备份。" };
  const id = target_?.id ?? state.progress.datasetId;
  const from = data.progress.datasetId;
  let progress: Progress;
  if (from === id) progress = sanitizeProgress({ ...data.progress, session: null }, id);
  else if (typeof from === "string" && LEGACY_DATASETS.includes(from) && target_?.id === id)
    progress = migrateProgress(sanitizeProgress(data.progress, from), target_);
  else return { ok: false, error: "备份来自另一个词库，请先切换到对应词库。" };

  const s = sanitizeSettings(data.settings);
  const imported = { ...s, onboarded: s.grade !== 0 };
  let child = activeChild();
  if (!child) {
    child = childFromSettings(imported, "小朋友");
    state = {
      ...state,
      profiles: { version: 1, activeId: child.id, children: [child] },
    };
  } else {
    child = {
      ...child,
      grade: imported.grade,
      dailyNew: imported.dailyNew,
      advanced: imported.advanced,
      gardenGrade: imported.gardenGrade,
      onboarded: imported.onboarded,
    };
    state = {
      ...state,
      profiles: {
        ...state.profiles,
        children: state.profiles.children.map((c) => (c.id === child!.id ? child! : c)),
      },
    };
  }
  const device = sanitizeDevice(imported);
  state = {
    ...state,
    progress,
    settings: mergeSettings(device, child),
  };
  loadedKey = progressKey(child.id, progress.datasetId);
  emit();
  markDirty();
  flush();
  return { ok: true, cards: Object.keys(progress.cards).length };
}

export function resetProgress() {
  const child = activeChild();
  const datasetId = state.progress.datasetId;
  state = { ...state, progress: emptyProgress(datasetId) };
  if (child) loadedKey = progressKey(child.id, datasetId);
  emit();
  markDirty();
  flush();
}

