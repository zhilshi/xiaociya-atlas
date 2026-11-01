/**
 * Word Atlas resources (CC BY 4.0, Word Atlas contributors) for words that exist upstream:
 * illustration, UK/US recordings, and example/collocation content split into a kid tier
 * ("core") and an advanced tier ("ext", 进阶扩展). Everything is fetched lazily from
 * public/wa/ and cached cache-first by the service worker.
 */
import { WA_AUDIO, WA_CORE, WA_EXT, WA_GEN, WA_IMG } from "../atlas/convert";
import type { Accent, WordRef } from "../atlas/types";

const BASE = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";

export interface Example {
  en: string;
  zh: string;
  /** Passed the grade 1–6 suitability filter. */
  kid: boolean;
}
export interface WaContent {
  ex?: Example[];
  col?: [string, string][];
}
export interface WaExtension extends WaContent {
  fam?: string[];
  syn?: string[];
  ant?: string[];
  tip?: string;
  senses?: [string, string, string][];
  cefr?: string;
}
export interface WaEntry {
  uk: string;
  us: string;
  /** Kid content: shown to everyone. */
  core?: WaContent;
  /** 进阶扩展: only rendered when the advanced setting is on. */
  ext?: WaExtension;
}

export const hasPicture = (w: WordRef) => !!(w.waFlags & WA_IMG);
export const hasUpstreamAudio = (w: WordRef) => !!(w.waFlags & WA_AUDIO);
export const hasKidContent = (w: WordRef) => !!(w.waFlags & WA_CORE);
export const hasExtension = (w: WordRef) => !!(w.waFlags & WA_EXT);
/** WordSprout-drawn illustration (public/wa/gen/), not an upstream Word Atlas thumb. */
export const hasCustomArt = (w: WordRef) => !!(w.waFlags & WA_GEN);

export const pictureUrl = (w: WordRef) => {
  if (!hasPicture(w) || !w.wa) return "";
  const dir = hasCustomArt(w) ? "gen" : "thumb";
  return `${BASE}wa/${dir}/${w.wa}.webp`;
};
export const audioUrl = (w: WordRef, accent: Accent) => (hasUpstreamAudio(w) ? `${BASE}wa/${accent}/${w.wa}.mp3` : "");

const gradeFiles = new Map<number, Promise<Record<string, WaEntry>>>();

/** Load one word's upstream content (one JSON file per grade, fetched once). */
export function loadEntry(w: WordRef): Promise<WaEntry | null> {
  if (!w.wa) return Promise.resolve(null);
  let p = gradeFiles.get(w.grade);
  if (!p) {
    p = fetch(`${BASE}wa/entries/g${w.grade}.json`).then((r) => (r.ok ? r.json() : {}));
    p.catch(() => gradeFiles.delete(w.grade));
    gradeFiles.set(w.grade, p);
  }
  return p.then((all) => all[w.word] ?? null).catch(() => null);
}

/** What a learner may see: kid content always; the advanced tier only when switched on. */
export function visibleContent(e: WaEntry | null, grade: number, advanced: boolean) {
  if (!e) return { examples: [] as Example[], col: [] as [string, string][], ext: null as WaExtension | null };
  const max = grade && grade <= 2 ? 1 : 2;
  const examples = (e.core?.ex ?? []).filter((x) => x.kid).slice(0, max);
  const col = grade && grade <= 2 ? [] : (e.core?.col ?? []).slice(0, 3);
  return { examples, col, ext: advanced && e.ext ? e.ext : null };
}

/** Has a real picture: a Word Atlas illustration or an emoji (not just a letter card). */
export const pictured = (w: WordRef) => !!w.emoji || hasPicture(w);

/**
 * 离线包 (ported from Word Atlas's offline download): fetch every picture, recording and
 * the content file for one grade so the service worker's media cache holds them.
 */
export async function downloadGradePack(words: WordRef[], grade: number, accent: Accent, onProgress?: (done: number, total: number) => void) {
  const list = words.filter((w) => w.grade === grade && w.wa);
  const urls = [`${BASE}wa/entries/g${grade}.json`, ...list.map(pictureUrl), ...list.map((w) => audioUrl(w, accent))].filter(Boolean);
  let done = 0;
  let failed = 0;
  const queue = [...urls];
  const worker = async () => {
    for (let u = queue.shift(); u; u = queue.shift()) {
      try {
        const r = await fetch(u);
        if (!r.ok) failed++;
      } catch {
        failed++;
      }
      onProgress?.(++done, urls.length);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return { total: urls.length, failed };
}
