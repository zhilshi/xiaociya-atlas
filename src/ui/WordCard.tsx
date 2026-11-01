import { useAtlas } from "../atlas/context";
import { plantOf, STAGE_INFO } from "../lib/garden";
import { formatInterval } from "../store/srs";
import { useStore } from "../store/store";
import { Plant } from "./Plant";
import { SpeakButton } from "./SpeakButton";

/** Big word card: picture, word, meaning, pronunciation and how its plant is growing. */
export function WordCard({ id }: { id: string }) {
  const atlas = useAtlas();
  const w = atlas.byId.get(id);
  const card = useStore((s) => s.progress.cards[id]);
  if (!w) return <p className="muted">找不到这个单词。</p>;
  const now = Date.now();
  const p = plantOf(card, now);
  const topic = atlas.topics[w.topic];
  return (
    <article className="word-card" aria-label={`${w.word} ${w.zh}`}>
      <div className={`word-pic tint-${topic.color}`} aria-hidden="true">
        {w.emoji}
      </div>
      <div className="word-head">
        <h2 className="word-en" lang="en">
          {w.word}
        </h2>
        <SpeakButton word={w.word} big />
      </div>
      <p className="word-zh">{w.zh}</p>
      <div className="word-meta">
        <span className="chip">
          {topic.icon} {topic.zh}
        </span>
        <span className="chip">
          <Plant stage={p.stage} thirsty={p.thirsty} size="sm" /> {STAGE_INFO[p.stage].zh}
        </span>
        {card && !p.thirsty && <span className="chip chip-soft">{formatInterval(card.due - now)}后浇水</span>}
        {p.thirsty && <span className="chip chip-water">该浇水啦</span>}
      </div>
    </article>
  );
}
