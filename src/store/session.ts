/* Adapted from Word Atlas (https://github.com/designfuchen/word-atlas), MIT, © 2026 Word Atlas contributors. */
import type { Atlas, WordRef } from "../atlas/types";
import { gradeConfig, type GradeConfig } from "../lib/grade";
import { hashSeed, normalize, shuffle } from "../lib/text";
import { isMastered, review, Rating, type Grade } from "./srs";
import { bumpDay, dayKey, store, type ActiveSession, type Progress, type QuizKind, type Settings, type Step } from "./store";

export function dueIds(p: Progress, now = Date.now()) {
  return Object.entries(p.cards)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

export function newToday(p: Progress) {
  return p.days[dayKey()]?.n ?? 0;
}

/** Next unseen words along the path: the child's grade band first, then easier bands, then harder. */
export function nextNew(atlas: Atlas, p: Progress, settings: Settings, count: number) {
  const band = gradeConfig(settings.grade).band;
  const out: string[] = [];
  const pass = (ok: (b: number) => boolean) => {
    for (const w of atlas.words) {
      if (out.length >= count) return;
      if (!ok(w.band) || p.cards[w.id] || out.includes(w.id)) continue;
      out.push(w.id);
    }
  };
  // Lower bands are prerequisites: a grade-5 beginner still meets "cat" before "kangaroo".
  pass((b) => b <= band);
  if (out.length < count) pass(() => true);
  return out;
}

export function todayPlan(atlas: Atlas, p: Progress, s: Settings, now = Date.now()) {
  const due = dueIds(p, now).filter((id) => atlas.byId.has(id));
  const newLeft = Math.max(0, s.dailyNew - newToday(p));
  const fresh = nextNew(atlas, p, s, newLeft);
  return { due, fresh, minutes: Math.max(1, Math.round(due.length * 0.3 + fresh.length * 1)) };
}

/** Words a child can spell with tiles or keys: one word, letters only. */
export const spellable = (w: WordRef, cfg: GradeConfig) =>
  cfg.spell !== "none" && /^[a-z]+$/i.test(w.word) && w.word.length <= (cfg.spell === "tiles" ? 8 : 14);

/**
 * Question type per word and grade.
 *   listen  – hear the word, tap the matching picture
 *   picture – see picture + Chinese, tap the English word
 *   meaning – read the English word, tap the Chinese (grades 3+)
 *   spell   – tiles (grades 3–4) or keyboard (5–6); never for grades 1–2
 */
export function quizKind(ref: WordRef, p: Progress, s: Settings, salt: number): QuizKind {
  const cfg = gradeConfig(s.grade);
  const c = p.cards[ref.id];
  const roll = hashSeed(ref.id + salt) % 100;
  if (cfg.band === 1) return roll < 50 ? "listen" : "picture";
  if (!c || c.s < 2) return roll < 40 ? "listen" : roll < 75 ? "picture" : "meaning";
  if (spellable(ref, cfg) && (c.s >= 4 || roll < 35)) return roll < 75 ? "spell" : "listen";
  return roll < 40 ? "listen" : roll < 70 ? "picture" : "meaning";
}

/** Three distractors, preferably from the same flower bed, with a different picture, meaning and spelling. */
export function distractors(atlas: Atlas, ref: WordRef, kind: QuizKind, seed: number) {
  const target = normalize(ref.word).toLowerCase();
  const scored: [number, WordRef][] = [];
  for (const w of atlas.words) {
    if (w.id === ref.id || normalize(w.word).toLowerCase() === target) continue;
    if (w.emoji === ref.emoji || w.zh === ref.zh) continue;
    let score = hashSeed(w.id + seed) % 100;
    if (w.topic === ref.topic) score += 150;
    if (Math.abs(w.band - ref.band) === 0) score += 40;
    if (kind === "picture" && w.word[0]?.toLowerCase() === target[0]) score += 30;
    scored.push([score, w]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  const seen = new Set<string>([ref.emoji, ref.zh]);
  const picks: string[] = [];
  for (const [, w] of scored) {
    if (seen.has(w.emoji) || seen.has(w.zh)) continue;
    seen.add(w.emoji);
    seen.add(w.zh);
    picks.push(w.id);
    if (picks.length === 3) break;
  }
  return shuffle([ref.id, ...picks], seed);
}

export function buildSession(atlas: Atlas, p: Progress, s: Settings, opts?: { ids?: string[]; reviewOnly?: boolean }): ActiveSession {
  const seed = Date.now();
  const plan = todayPlan(atlas, p, s);
  const reviewIds = opts?.ids ? opts.ids.filter((id) => p.cards[id]) : plan.due.slice(0, 120);
  const newIds = opts?.ids ? opts.ids.filter((id) => !p.cards[id]) : opts?.reviewOnly ? [] : plan.fresh;
  const steps: Step[] = [];
  const quiz = (id: string, salt: number): Step => {
    const ref = atlas.byId.get(id)!;
    const kind = quizKind(ref, p, s, seed + salt);
    return { id, kind, options: kind === "spell" ? undefined : distractors(atlas, ref, kind, seed + salt) };
  };
  // Reviews first while attention is fresh, then new words in small groups:
  // meet five, then recall those five in a different order.
  reviewIds.forEach((id, i) => steps.push(quiz(id, i)));
  for (let g = 0; g < newIds.length; g += 5) {
    const group = newIds.slice(g, g + 5);
    group.forEach((id) => steps.push({ id, kind: "intro" }));
    shuffle(group, seed + g).forEach((id, i) => steps.push(quiz(id, 1000 + g + i)));
  }
  return { id: `s${seed}`, started: seed, steps, index: 0, graded: {}, newIds, reviewIds };
}

export function gradeFor(kind: QuizKind, correct: boolean, ms: number, hinted: boolean, cfg: GradeConfig = gradeConfig(0)): Grade {
  if (!correct) return Rating.Again;
  if (hinted) return Rating.Hard;
  const slow = kind === "spell" ? cfg.slowMs * 2 : cfg.slowMs;
  if (ms > slow) return Rating.Hard;
  if (cfg.allowEasy && kind === "spell" && ms < 6000) return Rating.Easy;
  return Rating.Good;
}

/** Apply an answer. Only the first attempt for a word in a session updates memory and stats. */
export function answer(atlas: Atlas, step: Step & { kind: QuizKind }, correct: boolean, grade: Grade, value: string) {
  const { settings } = store.get();
  store.progress((p) => {
    const sess = p.session;
    if (!sess) return p;
    let next: Progress = { ...p, session: { ...sess, pending: { correct, value } } };
    const first = !(step.id in sess.graded) && !step.retry;
    if (first) {
      next = {
        ...next,
        cards: { ...next.cards, [step.id]: review(p.cards[step.id], grade, Date.now(), settings.retention, gradeConfig(settings.grade)) },
        session: { ...next.session!, graded: { ...sess.graded, [step.id]: grade } },
        mistakes: correct ? next.mistakes : [step.id, ...next.mistakes.filter((x) => x !== step.id)].slice(0, 300),
      };
      next = bumpDay(next, { r: 1, c: correct ? 1 : 0, n: sess.newIds.includes(step.id) ? 1 : 0 });
    }
    if (!correct) {
      // Practise it again a few steps later in another format; never re-graded.
      const steps = [...next.session!.steps];
      const retries = steps.filter((x) => x.id === step.id && "retry" in x && x.retry).length;
      if (retries < 2) {
        const ref = atlas.byId.get(step.id)!;
        const band1 = gradeConfig(settings.grade).band === 1;
        const kind: QuizKind = step.kind === "listen" ? "picture" : band1 || step.kind !== "picture" ? "listen" : "meaning";
        const at = Math.min(steps.length, sess.index + 4);
        steps.splice(at, 0, { id: step.id, kind, retry: true, options: distractors(atlas, ref, kind, Date.now()) });
        next = { ...next, session: { ...next.session!, steps } };
      }
    }
    return next;
  });
}

/** Move to the next step; `seconds` is time spent on this step, capped so idle tabs don't inflate stats. */
export function advance(seconds: number) {
  store.progress((p) => {
    const s = p.session;
    if (!s) return p;
    const index = s.index + 1;
    const finished = index >= s.steps.length ? Date.now() : undefined;
    const next = bumpDay(p, { t: Math.max(0, Math.min(90, Math.round(seconds))) });
    return { ...next, session: { ...s, index, pending: undefined, finished } };
  });
}

export function sessionStats(s: ActiveSession) {
  const graded = Object.values(s.graded);
  const correct = graded.filter((g) => g !== Rating.Again).length;
  return { total: graded.length, correct, accuracy: graded.length ? Math.round((correct / graded.length) * 100) : 0, stars: starsFor(correct, graded.length) };
}

export const masteredCount = (p: Progress) => Object.values(p.cards).filter(isMastered).length;

/** Encouraging 1–3 stars instead of a percentage: finishing always earns at least one. */
export function starsFor(correct: number, total: number) {
  if (!total) return 1;
  const r = correct / total;
  return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1;
}
