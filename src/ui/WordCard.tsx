import { useEffect, useState } from "react";
import { useAtlas } from "../atlas/context";
import { plantOf, STAGE_INFO } from "../lib/garden";
import { loadEntry, type WaEntry } from "../lib/media";
import { formatInterval } from "../store/srs";
import { useStore } from "../store/store";
import { Plant } from "./Plant";
import { say, SpeakButton } from "./SpeakButton";
import { WordExtras } from "./WordExtras";
import { WordPic } from "./WordPic";

/** Big word card: picture, word, meaning, pronunciation, examples and how its plant is growing. */
export function WordCard({ id }: { id: string }) {
  const atlas = useAtlas();
  const w = atlas.byId.get(id);
  const card = useStore((s) => s.progress.cards[id]);
  const { grade, advanced, accent } = useStore((s) => s.settings);
  const [entry, setEntry] = useState<WaEntry | null>(null);
  useEffect(() => {
    let live = true;
    setEntry(null);
    if (w) void loadEntry(w).then((e) => live && setEntry(e));
    return () => {
      live = false;
    };
  }, [w]);
  if (!w) return <p className="muted">找不到这个单词。</p>;
  const now = Date.now();
  const p = plantOf(card, now);
  const topic = atlas.topics[w.topic];
  const ipa = entry ? (accent === "uk" ? entry.uk : entry.us) : "";
  return (
    <article className="word-card" aria-label={`${w.word} ${w.zh}`}>
      <div className={`word-pic tint-${topic.color}`} aria-hidden="true">
        <WordPic w={w} />
      </div>
      <div className="word-head">
        <h2 className="word-en" lang="en">
          {w.word}
        </h2>
        <SpeakButton w={w} big />
      </div>
      {ipa && grade >= 3 && <p className="word-ipa muted">{ipa}</p>}
      <p className="word-zh">{w.zh}</p>
      <div className="word-meta">
        <span className="chip">
          {topic.icon} {topic.zh}
        </span>
        <span className="chip">{w.grade} 年级</span>
        <span className="chip">
          <Plant stage={p.stage} thirsty={p.thirsty} size="sm" /> {STAGE_INFO[p.stage].zh}
        </span>
        {card && !p.thirsty && <span className="chip chip-soft">{formatInterval(card.due - now)}后浇水</span>}
        {p.thirsty && <span className="chip chip-water">该浇水啦</span>}
      </div>
      <WordExtras entry={entry} grade={grade} advanced={advanced} onSay={(t) => void say(t, accent)} />
    </article>
  );
}
