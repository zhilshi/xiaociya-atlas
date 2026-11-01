import lexicon from "../data/lexicon-v2.json";
import type { PackedLexicon } from "./convert";
import { buildAtlas } from "./lexicon";

/**
 * The whole 1,717-word grade 1–6 lexicon (≈100 KB, ≈30 KB gzipped) ships in its own chunk
 * so the app shell stays small and the service worker caches it for offline use.
 */
export const atlas = buildAtlas(lexicon as unknown as PackedLexicon);
