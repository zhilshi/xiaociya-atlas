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

/** One word in the 小词芽 lexicon (original content, emoji image for now). */
export interface WordRef {
  id: string;
  word: string;
  zh: string;
  emoji: string;
  /** Index into Atlas.topics. */
  topic: number;
  topicId: string;
  band: Band;
  /** Position in the learning path (band, then topic, then lexicon order). */
  order: number;
}

export interface Atlas {
  id: string;
  name: string;
  count: number;
  topics: Topic[];
  words: WordRef[];
  byId: Map<string, WordRef>;
}
