import { STAGE_INFO, type Stage } from "../lib/garden";

/** A plant in a flower bed: stage emoji, plus a water drop when the word is due. */
export function Plant({ stage, thirsty, size = "md" }: { stage: Stage; thirsty?: boolean; size?: "sm" | "md" | "lg" }) {
  const info = STAGE_INFO[stage];
  return (
    <span className={`plant plant-${size} stage-${stage}`} role="img" aria-label={`${info.zh}${thirsty ? "，口渴了" : ""}`}>
      <span className="plant-emoji">{info.emoji}</span>
      {thirsty && <span className="plant-drop">💧</span>}
    </span>
  );
}
