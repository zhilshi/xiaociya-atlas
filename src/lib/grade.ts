import type { Band } from "../atlas/types";

export type SchoolGrade = 1 | 2 | 3 | 4 | 5 | 6;
export type SpellMode = "none" | "tiles" | "type";

export interface GradeConfig {
  band: Band;
  /** Default new words per day. */
  dailyNew: number;
  /** Spelling exercise: none (grades 1–2), letter tiles (3–4), keyboard (5–6). */
  spell: SpellMode;
  /** UI scale for fonts and touch targets. */
  scale: number;
  /** FSRS limits: shorter intervals and fewer in-session repeats for younger children. */
  maxInterval: number;
  learningSteps: ("1m" | "5m" | "10m" | "1d")[];
  /** Answers slower than this count as Hard. */
  slowMs: number;
  /** Whether a fast correct spelling may be graded Easy. */
  allowEasy: boolean;
}

export const isGrade = (g: unknown): g is SchoolGrade => typeof g === "number" && Number.isInteger(g) && g >= 1 && g <= 6;

export const bandOfGrade = (g: SchoolGrade): Band => (g <= 2 ? 1 : g <= 4 ? 2 : 3);

const BY_BAND: Record<Band, GradeConfig> = {
  1: { band: 1, dailyNew: 5, spell: "none", scale: 1.22, maxInterval: 30, learningSteps: ["5m", "1d"], slowMs: 15000, allowEasy: false },
  2: { band: 2, dailyNew: 8, spell: "tiles", scale: 1.1, maxInterval: 60, learningSteps: ["5m", "1d"], slowMs: 12000, allowEasy: true },
  3: { band: 3, dailyNew: 10, spell: "type", scale: 1, maxInterval: 180, learningSteps: ["1m", "10m"], slowMs: 9000, allowEasy: true },
};

/** Grade 0 means "not chosen yet"; it behaves like the middle band until onboarding is done. */
export function gradeConfig(g: SchoolGrade | 0): GradeConfig {
  return BY_BAND[isGrade(g) ? bandOfGrade(g) : 2];
}

export const GRADE_LABEL: Record<SchoolGrade, string> = { 1: "一年级", 2: "二年级", 3: "三年级", 4: "四年级", 5: "五年级", 6: "六年级" };
