import { STAGE_INFO, type Stage } from "../lib/garden";

/** A seed resting in a small dirt mound (the "not learned yet" stage; no food emoji). */
export function SeedMound({ px }: { px?: number }) {
  return (
    <svg className="seed-svg" viewBox="0 0 48 48" width={px} height={px} aria-hidden="true">
      <ellipse cx="24" cy="38" rx="20" ry="7" fill="#c9a27a" />
      <path d="M4 38c3-9 11-14 20-14s17 5 20 14z" fill="#b98b5e" />
      <path d="M10 36c3-5 8-8 14-8" stroke="#d8b892" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="25" cy="25" rx="6" ry="4.2" transform="rotate(-25 25 25)" fill="#8a5a33" />
      <path d="M21.5 26.5c2-2.5 4.5-4 7-4.2" stroke="#b07a4a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** A plant in a flower bed: stage picture, plus a water drop when the word is due. */
export function Plant({ stage, thirsty, size = "md" }: { stage: Stage; thirsty?: boolean; size?: "sm" | "md" | "lg" }) {
  const info = STAGE_INFO[stage];
  return (
    <span className={`plant plant-${size} stage-${stage}`} role="img" aria-label={`${info.zh}${thirsty ? "，口渴了" : ""}`}>
      {stage === "seed" ? <SeedMound /> : <span className="plant-emoji">{info.emoji}</span>}
      {thirsty && <span className="plant-drop">💧</span>}
    </span>
  );
}
