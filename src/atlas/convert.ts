/**
 * wordlist-v2.csv → compact lexicon JSON (build/test time only; never bundled).
 *
 * Id stability: words that already existed in the 395-word v1 lexicon keep their v1 id
 * (e.g. "animals.dog"), so FSRS progress saved by older builds still applies. New words get
 * "w.<slug>". Old ids that no longer exist 1:1 are listed in `aliases` (old → new) and the
 * store migration remaps saved progress through them.
 */
import { BASE_TOPIC, TOPICS_V2 } from "./topics-v2";
import { EMOJI_V2, numberGlyph } from "./emoji-v2";
import type { Topic } from "./types";

export interface CsvRow {
  en: string;
  zh: string;
  pos: string;
  topic: string;
  grade: number;
}

export interface V1Lexicon {
  words: { id: string; en: string; zh: string; topicId: string; image: { type: string; src: string } }[];
}

/** Word Atlas media/content for one headword (data/word-atlas-manifest.json, CC BY 4.0). */
export interface WaManifest {
  words: Record<string, { stem: string; img: boolean; audio: boolean; core: number; ext: boolean }>;
}

/** Bit flags for upstream Word Atlas resources. */
export const WA_IMG = 1,
  WA_AUDIO = 2,
  WA_CORE = 4,
  WA_EXT = 8;

/** [id, en, zh, pos, grade, topicIndex, emoji, glyph, waStem, waFlags] */
export type PackedWord = [string, string, string, string, number, number, string, string, string, number];

export interface PackedLexicon {
  version: 2;
  id: string;
  source: string;
  topics: Topic[];
  words: PackedWord[];
  aliases: Record<string, string>;
}

export const DATASET_V2 = "wordsprout-v2";

/** RFC-4180-ish parser (quoted fields, doubled quotes, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let f = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') (f += '"'), i++;
        else q = false;
      } else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") row.push(f), (f = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(f), rows.push(row), (row = []), (f = "");
    } else f += c;
  }
  if (f || row.length) row.push(f), rows.push(row);
  return rows.filter((r) => r.some((x) => x.trim()));
}

export function readRows(text: string): CsvRow[] {
  const [head, ...rest] = parseCsv(text.replace(/^\uFEFF/, ""));
  const col = (n: string) => {
    const i = head.indexOf(n);
    if (i < 0) throw new Error(`wordlist CSV is missing column ${n}`);
    return i;
  };
  const [en, zh, pos, topic, grade] = ["en", "zh", "pos", "topic", "grade"].map(col);
  return rest.map((r) => ({ en: r[en].trim(), zh: r[zh].trim(), pos: r[pos].trim(), topic: r[topic].trim(), grade: Number(r[grade]) }));
}

/** v1 words that appear twice (two senses): which v1 id the v2 word continues. */
const V1_PREFER: Record<string, string> = { fish: "animals.fish", fly: "actions.fly", orange: "colors.orange" };
/** v1 plurals → v2 singular headword. ("pray" has no v2 counterpart and is retired.) */
const V1_PLURAL: Record<string, string> = { beans: "bean", eyes: "eye", grapes: "grape", pancakes: "pancake", parents: "parent" };

/** Order beds appear in (and new words are introduced in, within a grade): concrete first. */
export const TOPIC_ORDER = [
  "greetings", "family", "body", "colors", "numbers", "fruit", "pets", "wild", "critters", "school", "stationery",
  "toys", "clothes", "home", "meals", "snacks", "vegetables", "kitchen", "weather", "nature", "transport", "places",
  "sports", "hobbies", "festivals", "jobs", "calendar", "time", "feelings", "health", "shopping", "things", "actions",
  "daily", "study", "size", "goodbad", "character", "state", "position", "questions", "pronouns", "helpers",
  "thinking", "adverbs", "littlewords",
];

const slug = (s: string) =>
  s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function topicOf(row: CsvRow): string {
  for (const t of TOPICS_V2) if (t.words.split("|").includes(row.en)) return t.id;
  return BASE_TOPIC[row.topic] ?? "things";
}

export function convert(rows: CsvRow[], v1: V1Lexicon, wa: WaManifest = { words: {} }, source = "data/wordlist-v2.csv"): PackedLexicon {
  const defs = TOPIC_ORDER.map((id) => {
    const t = TOPICS_V2.find((x) => x.id === id);
    if (!t) throw new Error(`unknown topic ${id}`);
    return t;
  });
  if (defs.length !== TOPICS_V2.length) throw new Error("TOPIC_ORDER does not list every topic");
  const tIndex = new Map(defs.map((t, i) => [t.id, i]));

  // v1 lookup by exact headword, then by lowercase headword.
  const v1ByEn = new Map<string, V1Lexicon["words"]>();
  for (const w of v1.words) {
    const k = w.en.toLowerCase();
    v1ByEn.set(k, [...(v1ByEn.get(k) ?? []), w]);
  }
  const lowerCount = new Map<string, number>();
  for (const r of rows) lowerCount.set(r.en.toLowerCase(), (lowerCount.get(r.en.toLowerCase()) ?? 0) + 1);

  const used = new Set<string>();
  const v1Taken = new Set<string>();
  const words: PackedWord[] = [];
  const idOfEn = new Map<string, string>();

  for (const r of rows) {
    const cands = v1ByEn.get(r.en.toLowerCase()) ?? [];
    // Case-ambiguous pairs (May / may): only the exact-case headword inherits the v1 id.
    const ok = cands.filter((w) => lowerCount.get(r.en.toLowerCase())! === 1 || w.en === r.en);
    const prev = ok.find((w) => w.id === V1_PREFER[r.en.toLowerCase()]) ?? ok[0];
    let id: string;
    if (prev && !v1Taken.has(prev.id)) {
      id = prev.id;
      v1Taken.add(id);
    } else {
      id = `w.${slug(r.en)}`;
      if (used.has(id)) id = `${id}.${slug(r.pos || "x")}`;
    }
    if (used.has(id)) throw new Error(`duplicate id ${id}`);
    used.add(id);
    idOfEn.set(r.en, id);
    const glyph = numberGlyph(r.en) ?? "";
    const emoji = prev?.image.type === "emoji" ? prev.image.src : glyph ? "" : (EMOJI_V2[r.en] ?? "");
    const m = wa.words[r.en];
    const flags = m ? (m.img ? WA_IMG : 0) | (m.audio ? WA_AUDIO : 0) | (m.core ? WA_CORE : 0) | (m.ext ? WA_EXT : 0) : 0;
    words.push([id, r.en, r.zh, r.pos, r.grade, tIndex.get(topicOf(r))!, emoji, glyph, flags ? m!.stem : "", flags]);
  }

  const aliases: Record<string, string> = {};
  for (const w of v1.words) {
    if (used.has(w.id)) continue;
    const k = w.en.toLowerCase();
    const target = idOfEn.get(V1_PLURAL[k] ?? w.en) ?? idOfEn.get(V1_PLURAL[k] ?? k);
    if (target) aliases[w.id] = target;
  }

  words.sort((a, b) => a[4] - b[4] || a[5] - b[5] || 0);
  // Array.prototype.sort is stable: CSV order is kept inside (grade, topic).
  return { version: 2, id: DATASET_V2, source, topics: defs.map(({ words: _w, ...t }) => t), words, aliases };
}
