import type { DayStat } from "../store/store";

const STICKERS = ["🌻", "🐞", "🦋", "⭐", "🍓", "🌈", "🐝", "🍀", "🐣", "🌸"];

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Last seven days, oldest first; a day with any study earns a sticker. */
export function weekStickers(days: Record<string, DayStat>, today = new Date()) {
  const out: { key: string; label: string; sticker: string | null; today: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const k = key(d);
    const stat = days[k];
    const did = !!stat && stat.n + stat.r > 0;
    out.push({ key: k, label: i === 0 ? "今天" : "日一二三四五六"[d.getDay()], sticker: did ? STICKERS[(d.getDate() + d.getMonth()) % STICKERS.length] : null, today: i === 0 });
  }
  return out;
}
