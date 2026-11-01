import type { CardState } from "../store/srs";

/**
 * 单词花园: one plant per word, grown from the FSRS memory state.
 *   种子 seed   – never studied (no card)
 *   发芽 sprout – learning or relearning (st 1 / 3), or a brand-new card
 *   长叶 leaf   – in review, stability < 7 days
 *   开花 bloom  – stability 7–21 days
 *   结果 fruit  – stability ≥ 21 days (= mastered)
 * Plants never wilt: a wrong answer sends the card to relearning, which shows as 发芽.
 * A plant that is due for review is "thirsty" (💧) – water it by reviewing.
 */
export type Stage = "seed" | "sprout" | "leaf" | "bloom" | "fruit";

export const STAGES: Stage[] = ["seed", "sprout", "leaf", "bloom", "fruit"];

export const STAGE_INFO: Record<Stage, { zh: string; emoji: string; tip: string }> = {
  seed: { zh: "种子", emoji: "", tip: "还没学" }, // drawn as an SVG seed mound (ui/Plant.tsx)
  sprout: { zh: "发芽", emoji: "🌱", tip: "刚认识" },
  leaf: { zh: "长叶", emoji: "🌿", tip: "记住一点了" },
  bloom: { zh: "开花", emoji: "🌷", tip: "记得很牢" },
  fruit: { zh: "结果", emoji: "🍎", tip: "学会啦" },
};

export const LEAF_DAYS = 7;
export const FRUIT_DAYS = 21;

export function stageOf(card: CardState | undefined): Stage {
  if (!card) return "seed";
  if (card.st === 0 || card.st === 1 || card.st === 3) return "sprout";
  if (card.s >= FRUIT_DAYS) return "fruit";
  if (card.s >= LEAF_DAYS) return "bloom";
  return "leaf";
}

export function isThirsty(card: CardState | undefined, now: number) {
  return !!card && card.due <= now;
}

export function plantOf(card: CardState | undefined, now: number) {
  return { stage: stageOf(card), thirsty: isThirsty(card, now) };
}

/** Counts per stage for a list of word ids, plus whether the whole bed bears fruit. */
export function bedSummary(ids: string[], cards: Record<string, CardState>, now: number) {
  const counts: Record<Stage, number> = { seed: 0, sprout: 0, leaf: 0, bloom: 0, fruit: 0 };
  let thirsty = 0;
  for (const id of ids) {
    const p = plantOf(cards[id], now);
    counts[p.stage]++;
    if (p.thirsty) thirsty++;
  }
  return { counts, thirsty, total: ids.length, complete: ids.length > 0 && counts.fruit === ids.length };
}

/** Which grade the garden shows: 0 = the learner's grade, 1–6 = that grade, 9 = all grades. */
export function gardenGradeOf(filter: number, myGrade: number): number {
  if (filter === 9) return 0;
  if (filter >= 1 && filter <= 6) return filter;
  return myGrade >= 1 && myGrade <= 6 ? myGrade : 0;
}

export interface BedGroup<T> {
  growing: T[];
  unstarted: T[];
  complete: T[];
}

/**
 * Flower beds for one grade (0 = all): one per topic that has words in that grade, split
 * into growing (shown as big cards), not started and fully grown (collapsed lists).
 */
export function gardenBeds<W extends { id: string; topicId: string; grade: number }, T extends { id: string }>(
  topics: T[],
  words: W[],
  grade: number,
  cards: Record<string, CardState>,
  now: number,
): BedGroup<{ topic: T; ids: string[]; sum: ReturnType<typeof bedSummary> }> {
  const out: BedGroup<{ topic: T; ids: string[]; sum: ReturnType<typeof bedSummary> }> = { growing: [], unstarted: [], complete: [] };
  for (const topic of topics) {
    const ids = words.filter((w) => w.topicId === topic.id && (!grade || w.grade === grade)).map((w) => w.id);
    if (!ids.length) continue;
    const sum = bedSummary(ids, cards, now);
    const bed = { topic, ids, sum };
    if (sum.complete) out.complete.push(bed);
    else if (sum.counts.seed === sum.total) out.unstarted.push(bed);
    else out.growing.push(bed);
  }
  return out;
}
