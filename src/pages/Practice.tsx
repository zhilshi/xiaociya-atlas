import { useAtlas } from "../atlas/context";
import { shuffle } from "../lib/text";
import { useStore } from "../store/store";
import { toast } from "../ui/Toast";
import { startSession } from "./Today";

/** Extra practice: pick a flower bed, recent words or the mistake list. */
export function Practice() {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const learned = Object.entries(progress.cards)
    .sort((a, b) => (b[1].last ?? 0) - (a[1].last ?? 0))
    .map(([id]) => id)
    .filter((id) => atlas.byId.has(id));
  const mistakes = progress.mistakes.filter((id) => progress.cards[id]);
  const run = (ids: string[], empty: string) => {
    if (!ids.length || !startSession(ids)) toast(empty, "info");
  };

  return (
    <div className="page practice">
      <h1 className="page-title">练习</h1>
      <p className="muted">多练几遍，小苗长得更快。</p>
      <div className="practice-quick">
        <button className="quick-card tint-peach" onClick={() => run(mistakes.slice(0, 10), "还没有错题，真棒！")}>
          <span className="quick-icon">🔁</span>
          <b>错题再练</b>
          <small>{mistakes.length} 个</small>
        </button>
        <button className="quick-card tint-sky" onClick={() => run(learned.slice(0, 10), "先去「今天」学几个新词吧")}>
          <span className="quick-icon">⏱️</span>
          <b>最近学过</b>
          <small>{Math.min(10, learned.length)} 个</small>
        </button>
      </div>
      <h2 className="section-title">按花坛练习</h2>
      <ul className="bed-list">
        {atlas.topics.map((t) => {
          const words = atlas.words.filter((w) => w.topicId === t.id);
          const known = words.filter((w) => progress.cards[w.id]).map((w) => w.id);
          const seeds = words.filter((w) => !progress.cards[w.id]).map((w) => w.id);
          return (
            <li key={t.id}>
              <button
                className={`bed-row tint-${t.color}`}
                onClick={() => (known.length >= 4 ? run(shuffle(known).slice(0, 10), "") : run(seeds.slice(0, 5), "这个花坛已经种满啦"))}
              >
                <span className="bed-icon">{t.icon}</span>
                <span className="bed-name">{t.zh}</span>
                <small>{known.length >= 4 ? `复习 ${Math.min(10, known.length)} 个` : `种 ${Math.min(5, seeds.length)} 颗新种子`}</small>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
