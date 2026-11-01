import { ChevronLeft } from "lucide-react";
import { useAtlas } from "../atlas/context";
import { bedSummary, plantOf, STAGE_INFO, STAGES } from "../lib/garden";
import { go, openWord } from "../lib/router";
import { useStore } from "../store/store";
import { Plant } from "../ui/Plant";
import { startSession } from "./Today";

/** 单词花园: each topic is a flower bed, each word one plant. */
export function Garden({ bed }: { bed?: string }) {
  const atlas = useAtlas();
  const cards = useStore((s) => s.progress.cards);
  const now = Date.now();
  const topic = bed ? atlas.topics.find((t) => t.id === bed) : undefined;

  if (topic) {
    const words = atlas.words.filter((w) => w.topicId === topic.id);
    const sum = bedSummary(
      words.map((w) => w.id),
      cards,
      now,
    );
    const thirsty = words.filter((w) => plantOf(cards[w.id], now).thirsty).map((w) => w.id);
    return (
      <div className="page garden">
        <button className="back-btn" onClick={() => go({ page: "garden" })}>
          <ChevronLeft size={22} /> 花园
        </button>
        <header className={`bed-head tint-${topic.color}`}>
          <span className="bed-icon" aria-hidden="true">
            {topic.icon}
          </span>
          <div>
            <h1>{topic.zh}花坛</h1>
            <p>
              {sum.counts.fruit}/{sum.total} 结果 {sum.thirsty > 0 && `· ${sum.thirsty} 棵口渴了`}
            </p>
          </div>
          {sum.complete && (
            <span className="bed-badge" title="整个花坛都结果啦">
              🏅
            </span>
          )}
        </header>
        {thirsty.length > 0 && (
          <button className="btn btn-water btn-block" onClick={() => startSession(thirsty.slice(0, 12))}>
            💧 给 {Math.min(12, thirsty.length)} 棵小苗浇水
          </button>
        )}
        <ul className="plot" aria-label={`${topic.zh}花坛的单词`}>
          {words.map((w) => {
            const p = plantOf(cards[w.id], now);
            return (
              <li key={w.id}>
                <button className={`plot-cell stage-${p.stage}`} onClick={() => openWord(w.id)} aria-label={`${w.word}，${STAGE_INFO[p.stage].zh}`}>
                  <Plant stage={p.stage} thirsty={p.thirsty} />
                  <span className="plot-word" lang="en">
                    {p.stage === "seed" ? "?" : w.word}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <Legend />
      </div>
    );
  }

  return (
    <div className="page garden">
      <h1 className="page-title">单词花园</h1>
      <p className="muted">每学会一个单词，就种下一棵小苗。常来浇水，它会开花结果。</p>
      <ul className="beds">
        {atlas.topics.map((t) => {
          const ids = atlas.words.filter((w) => w.topicId === t.id).map((w) => w.id);
          const s = bedSummary(ids, cards, now);
          const planted = s.total - s.counts.seed;
          const preview = ids.slice(0, 12).map((id) => plantOf(cards[id], now));
          return (
            <li key={t.id}>
              <button className={`bed tint-${t.color}`} onClick={() => go({ page: "garden", bed: t.id })}>
                <div className="bed-top">
                  <span className="bed-icon" aria-hidden="true">
                    {t.icon}
                  </span>
                  <span className="bed-name">{t.zh}</span>
                  {s.complete && <span className="bed-badge">🏅</span>}
                  {s.thirsty > 0 && <span className="chip chip-water">💧{s.thirsty}</span>}
                </div>
                <div className="bed-soil" aria-hidden="true">
                  {preview.map((p, i) => (
                    <Plant key={i} stage={p.stage} thirsty={p.thirsty} size="sm" />
                  ))}
                </div>
                <div className="bed-bar" aria-label={`已种 ${planted} / ${s.total}`}>
                  <span style={{ width: `${(planted / s.total) * 100}%` }} />
                </div>
                <span className="bed-count">
                  已种 {planted}/{s.total} · 结果 {s.counts.fruit}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <section className="legend" aria-label="生长阶段">
      {STAGES.map((s) => (
        <span key={s}>
          {STAGE_INFO[s].emoji} {STAGE_INFO[s].zh}
        </span>
      ))}
      <span>💧 该复习</span>
    </section>
  );
}
