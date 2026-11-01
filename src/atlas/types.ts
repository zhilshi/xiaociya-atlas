export type Accent = "uk" | "us";

/** Grade band: 1 = grades 1–2, 2 = grades 3–4, 3 = grades 5–6. */
export type Band = 1 | 2 | 3;

export interface Topic {
  id: string;
  zh: string;
  en: string;
  icon: string;
  color: "mint" | "cream" | "peach" | "sky" | "lavender";
}

/** School grade 1–6 (0 = not chosen yet). */
export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

/** One word in the 小词芽 lexicon (wordlist-v2, grades 1–6). */
export interface WordRef {
  id: string;
  word: string;
  zh: string;
  /** Picture emoji; "" when no honest picture exists (UI shows a letter + 中文 gloss card). */
  emoji: string;
  /** Big text shown instead of a picture, e.g. "30" or "1st" for number words. */
  glyph: string;
  pos: string;
  /** Word Atlas file stem ("" = no upstream match) and WA_* flags (img/audio/core/ext). */
  wa: string;
  waFlags: number;
  /** School grade the word is introduced in (1–6). */
  grade: Grade;
  /** Index into Atlas.topics. */
  topic: number;
  topicId: string;
  band: Band;
  /** Position in the learning path (grade, then topic, then wordlist order). */
  order: number;
}

export interface Atlas {
  id: string;
  name: string;
  count: number;
  topics: Topic[];
  words: WordRef[];
  byId: Map<string, WordRef>;
  /** Retired v1 ids → current id (used by the progress migration). */
  aliases: Record<string, string>;
}
