import { ChevronLeft } from "lucide-react";
import { useAtlas } from "../atlas/context";
import { bedSummary, gardenBeds, gardenGradeOf, plantOf, STAGE_INFO, STAGES } from "../lib/garden";
import { go, openWord } from "../lib/router";
import { store, useStore } from "../store/store";
import { Plant, SeedMound } from "../ui/Plant";
import { startSession } from "./Today";

/** 单词花园: each topic is a flower bed, each word one plant. */
export function Garden({ bed }: { bed?: string }) {
  const atlas = useAtlas();
  const cards = useStore((s) => s.progress.cards);
  const myGrade = useStore((s) => s.settings.grade);
  const filter = useStore((s) => s.settings.gardenGrade);
  const shownGrade = gardenGradeOf(filter, myGrade);
  const now = Date.now();
  const topic = bed ? atlas.topics.find((t) => t.id === bed) : undefined;

  if (topic) {
    const inGrade = atlas.words.filter((w) => w.topicId === topic.id && (!shownGrade || w.grade === shownGrade));
    const words = inGrade.length ? inGrade : atlas.words.filter((w) => w.topicId === topic.id);
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
            <p className="bed-sub">{shownGrade && inGrade.length ? `${shownGrade} 年级` : "全部年级"}</p>
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
                    {w.word}
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

  const groups = gardenBeds(atlas.topics, atlas.words, shownGrade, cards, now);
  const bedCard = ({ topic: t, ids, sum: s }: (typeof groups.growing)[number]) => {
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
  };
  const bedChip = ({ topic: t, sum: s }: (typeof groups.growing)[number], done: boolean) => (
    <li key={t.id}>
      <button className={`bed-chip tint-${t.color}`} onClick={() => go({ page: "garden", bed: t.id })}>
        <span className="bed-chip-icon" aria-hidden="true">
          {t.icon}
        </span>
        <span className="bed-chip-name">{t.zh}</span>
        <span className="bed-chip-count">{done ? "🏅" : s.total}</span>
      </button>
    </li>
  );

  return (
    <div className="page garden">
      <h1 className="page-title">单词花园</h1>
      <p className="muted">每学会一个单词，就种下一棵小苗。常来浇水，它会开花结果。</p>
      <div className="grade-filter" role="radiogroup" aria-label="选择年级">
        {FILTERS.map(([v, label]) => {
          const on = filter === v;
          return (
            <button key={v} role="radio" aria-checked={on} className={`gf ${on ? "on" : ""}`} onClick={() => store.settings({ gardenGrade: v })}>
              {v === 0 ? `本年级${myGrade ? `(${myGrade})` : ""}` : label}
            </button>
          );
        })}
      </div>
      {groups.growing.length > 0 ? (
        <ul className="beds">{groups.growing.map(bedCard)}</ul>
      ) : (
        <p className="empty-note">还没有开始种的花坛。挑一个下面的花坛，或者去「今天」开始学习吧 🌱</p>
      )}
      {groups.unstarted.length > 0 && (
        <details className="bed-group" open={groups.growing.length === 0}>
          <summary>
            还没种的花坛 <span className="muted">{groups.unstarted.length}</span>
          </summary>
          <ul className="bed-chips">{groups.unstarted.map((b) => bedChip(b, false))}</ul>
        </details>
      )}
      {groups.complete.length > 0 && (
        <details className="bed-group">
          <summary>
            🏅 全部结果的花坛 <span className="muted">{groups.complete.length}</span>
          </summary>
          <ul className="bed-chips">{groups.complete.map((b) => bedChip(b, true))}</ul>
        </details>
      )}
      <Legend />
    </div>
  );
}

const FILTERS: [number, string][] = [
  [0, "本年级"],
  [1, "1"],
  [2, "2"],
  [3, "3"],
  [4, "4"],
  [5, "5"],
  [6, "6"],
  [9, "全部"],
];

function Legend() {
  return (
    <section className="legend" aria-label="生长阶段">
      {STAGES.map((s) => (
        <span key={s}>
          {s === "seed" ? <SeedMound px={20} /> : STAGE_INFO[s].emoji} {STAGE_INFO[s].zh}
        </span>
      ))}
      <span>💧 该复习</span>
    </section>
  );
}
