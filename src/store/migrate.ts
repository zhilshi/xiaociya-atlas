/**
 * Progress migration wordsprout-v1 (395 words) → wordsprout-v2 (1,717 words, grades 1–6).
 *
 * Ids of words present in both lexicons never changed, so their cards carry over as-is.
 * Retired v1 ids are remapped through `aliases` (e.g. fruits.orange → colors.orange,
 * food.beans → w.bean). When two old cards land on one id, the stronger memory wins
 * (higher stability, then the more recent review). Unknown ids (e.g. actions.pray) are
 * dropped, the half-finished session is discarded, daily stats and typing rounds are kept.
 * The v1 storage key is left untouched so an older build can still read it.
 */
import type { CardState } from "./srs";
import type { Progress } from "./store";

export const LEGACY_DATASETS = ["wordsprout-v1"];

export interface MigrationTarget {
  id: string;
  aliases: Record<string, string>;
  has: (id: string) => boolean;
}

const stronger = (a: CardState, b: CardState) => (b.s > a.s || (b.s === a.s && (b.last ?? 0) > (a.last ?? 0)) ? b : a);

export function migrateProgress(old: Progress, to: MigrationTarget): Progress {
  const map = (id: string) => {
    const n = to.aliases[id] ?? id;
    return to.has(n) ? n : null;
  };
  const cards: Record<string, CardState> = {};
  for (const [id, c] of Object.entries(old.cards)) {
    const n = map(id);
    if (n) cards[n] = cards[n] ? stronger(cards[n], c) : c;
  }
  const uniq = (ids: string[]) => [...new Set(ids.map(map).filter((x): x is string => !!x))];
  return {
    ...old,
    datasetId: to.id,
    cards,
    bookmarks: uniq(old.bookmarks),
    mistakes: uniq(old.mistakes),
    session: null,
  };
}
