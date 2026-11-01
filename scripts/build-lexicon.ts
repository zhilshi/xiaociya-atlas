/** npm run data — regenerate src/data/lexicon-v2.json from data/wordlist-v2.csv. */
import { readFileSync, writeFileSync } from "node:fs";
import { applyGeneratedArt, convert, readRows } from "../src/atlas/convert";

const root = new URL("..", import.meta.url);
const rows = readRows(readFileSync(new URL("data/wordlist-v2.csv", root), "utf8"));
const v1 = JSON.parse(readFileSync(new URL("data/legacy/lexicon-v1.json", root), "utf8"));
const wa = JSON.parse(readFileSync(new URL("data/word-atlas-manifest.json", root), "utf8"));
const lex = convert(rows, v1, wa);

let gen = null;
try {
  gen = JSON.parse(readFileSync(new URL("data/generated-art-manifest.json", root), "utf8"));
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
}
const merged = applyGeneratedArt(lex, gen);
if (merged) console.log(`generated-art: merged ${merged} custom illustrations`);

const body = [
  "{",
  `"version":2,"id":${JSON.stringify(lex.id)},"source":${JSON.stringify(lex.source)},`,
  `"topics":${JSON.stringify(lex.topics)},`,
  `"aliases":${JSON.stringify(lex.aliases)},`,
  `"words":[`,
  lex.words.map((w) => JSON.stringify(w)).join(",\n"),
  "]}",
].join("\n");
writeFileSync(new URL("src/data/lexicon-v2.json", root), body + "\n");
const pics = lex.words.filter((w) => w[6] || w[7]).length;
const n = (bit: number) => lex.words.filter((w) => w[9] & bit).length;
console.log(`word-atlas: img ${n(1)}, audio ${n(2)}, kid examples ${n(4)}, 进阶 ${n(8)}, gen ${n(16)}`);
console.log(`lexicon-v2: ${lex.words.length} words, ${lex.topics.length} topics, ${Object.keys(lex.aliases).length} aliases, ${pics} with picture/glyph`);
