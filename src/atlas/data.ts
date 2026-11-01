import lexicon from "../data/lexicon.json";
import { buildAtlas, type RawLexicon } from "./lexicon";

/** The whole 395-word lexicon ships inside the bundle: no network, works offline. */
export const atlas = buildAtlas(lexicon as RawLexicon);
