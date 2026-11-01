import type { Atlas, Band, Topic, WordRef } from "./types";

/** Raw shape of src/data/lexicon.json (shared with the earlier 小词芽 PWA). */
export interface RawLexicon {
  version?: number;
  topics: { id: string; nameEn: string; nameZh: string; icon: string; color: Topic["color"]; order: number; wordIds: string[] }[];
  words: { id: string; en: string; zh: string; topicId: string; level: number; image: { type: string; src: string } }[];
}

/**
 * Grade band for a word. The lexicon's `level` (1 basic, 2 common, 3 longer
 * compounds) maps to grades 1–2 / 3–4 / 5–6. A few family words that Chinese
 * primary textbooks teach early are pulled down to the lowest band.
 */
const EARLY = new Set(["family.grandfather", "family.grandmother"]);
export function bandOf(w: { id: string; level: number }): Band {
  if (EARLY.has(w.id)) return 1;
  return w.level <= 1 ? 1 : w.level === 2 ? 2 : 3;
}

export function buildAtlas(raw: RawLexicon, id = "wordsprout-v1"): Atlas {
  const topics: Topic[] = raw.topics
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((t) => ({ id: t.id, zh: t.nameZh, en: t.nameEn, icon: t.icon, color: t.color }));
  const tIndex = new Map(topics.map((t, i) => [t.id, i]));
  const lexOrder = new Map(raw.words.map((w, i) => [w.id, i]));
  const words: WordRef[] = raw.words
    .filter((w) => tIndex.has(w.topicId) && w.en && w.zh)
    .map((w) => ({
      id: w.id,
      word: w.en,
      zh: w.zh,
      emoji: w.image?.type === "emoji" ? w.image.src : "🌱",
      topic: tIndex.get(w.topicId)!,
      topicId: w.topicId,
      band: bandOf(w),
      order: 0,
    }))
    .sort((a, b) => a.band - b.band || a.topic - b.topic || lexOrder.get(a.id)! - lexOrder.get(b.id)!);
  words.forEach((w, i) => (w.order = i));
  return { id, name: "小词芽词库", count: words.length, topics, words, byId: new Map(words.map((w) => [w.id, w])) };
}
