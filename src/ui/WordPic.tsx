import { useState } from "react";
import type { WordRef } from "../atlas/types";
import { pictureUrl } from "../lib/media";

/**
 * The picture for a word, best first: Word Atlas illustration → emoji → big number glyph →
 * a clean gloss card (large first letter + 中文). Never a placeholder food emoji.
 */
export function WordPic({ w, size = "lg", showZh = true }: { w: WordRef; size?: "sm" | "md" | "lg"; showZh?: boolean }) {
  const [broken, setBroken] = useState(false);
  const url = pictureUrl(w);
  if (url && !broken)
    return (
      <span className={`wpic wpic-${size} wpic-img`}>
        <img src={url} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setBroken(true)} />
      </span>
    );
  if (w.emoji) return <span className={`wpic wpic-${size} wpic-emoji`}>{w.emoji}</span>;
  return <GlossCard w={w} size={size} showZh={showZh} />;
}

export function GlossCard({ w, size = "lg", showZh = true }: { w: WordRef; size?: "sm" | "md" | "lg"; showZh?: boolean }) {
  const big = w.glyph || w.word.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase() + w.word.replace(/[^A-Za-z]/g, "").charAt(1).toLowerCase();
  const zh = w.zh.split(/[；;，,]/)[0];
  return (
    <span className={`wpic wpic-${size} gloss ${w.glyph ? "gloss-num" : ""}`}>
      <span className="gloss-big" lang="en">
        {big}
      </span>
      {showZh && <span className="gloss-zh">{zh}</span>}
    </span>
  );
}

