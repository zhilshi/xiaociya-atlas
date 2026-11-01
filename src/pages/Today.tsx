import { useAtlas } from "../atlas/context";
import { atlas } from "../atlas/data";
import { bedSummary, STAGE_INFO, STAGES } from "../lib/garden";
import { GRADE_LABEL } from "../lib/grade";
import { go, openWord } from "../lib/router";
import { pictured } from "../lib/media";
import { sayWord } from "../ui/SpeakButton";
import { WordPic } from "../ui/WordPic";
import { weekStickers } from "../lib/stickers";
import { buildSession, newToday, todayPlan } from "../store/session";
import { store, useStore } from "../store/store";

export function startSession(ids?: string[]) {
  const { progress, settings } = store.get();
  const sess = buildSession(atlas, progress, settings, ids ? { ids } : undefined);
  if (!sess.steps.length) return false;
  store.progress((p) => ({ ...p, session: sess }));
  // Speak the first word inside this tap so phones allow audio.
  const first = sess.steps[0];
  if (settings.autoplay && (first.kind === "intro" || first.kind === "listen")) {
    const w = atlas.byId.get(first.id);
    if (w) void sayWord(w, settings.accent);
  }
  go({ page: "learn" });
  return true;
}

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? "早上好" : h < 14 ? "中午好" : h < 18 ? "下午好" : "晚上好";
}

export function Today() {
  useAtlas();
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const now = Date.now();
  const plan = todayPlan(atlas, progress, settings, now);
  const learnedToday = newToday(progress);
  const goal = settings.dailyNew;
  const doneToday = plan.due.length === 0 && plan.fresh.length === 0;
  const active = progress.session && !progress.session.finished ? progress.session : null;
  const week = weekStickers(progress.days);
  const all = bedSummary(
    atlas.words.map((w) => w.id),
    progress.cards,
    now,
  );
  const badges = atlas.topics.filter((t) =>
    bedSummary(
      atlas.words.filter((w) => w.topicId === t.id).map((w) => w.id),
      progress.cards,
      now,
    ).complete,
  );
  // Word of the day: a pictured word from the learner's own grade.
  const pool = atlas.words.filter((w) => w.grade === (settings.grade || 1) && pictured(w));
  const wodPool = pool.length ? pool : atlas.words;
  const wod = wodPool[Math.floor(now / 86400000) % wodPool.length];

  return (
    <div className="page today">
      <section className="hello">
        <h1>
          {greeting()}！<span className="hello-grade">{settings.grade ? GRADE_LABEL[settings.grade] : ""}</span>
        </h1>
        <p className="muted">今天也来给花园浇浇水吧 🌤️</p>
      </section>

      <section className="card task-card" aria-label="今天的任务">
        <div className="task-row">
          <div className="task-stat">
            <span className="task-num">{plan.fresh.length}</span>
            <span className="task-label">🌱 新种子</span>
          </div>
          <div className="task-stat">
            <span className="task-num">{plan.due.length}</span>
            <span className="task-label">💧 要浇水</span>
          </div>
          <div className="task-stat">
            <span className="task-num">
              {Math.min(learnedToday, goal)}/{goal}
            </span>
            <span className="task-label">⭐ 今日目标</span>
          </div>
        </div>
        {active ? (
          <button className="btn btn-primary btn-block btn-xl" onClick={() => go({ page: "learn" })}>
            继续学习 ▶
          </button>
        ) : doneToday ? (
          <div className="done-box">
            <span className="done-emoji">🎉</span>
            <p>今天的任务完成啦！去花园看看你的小苗吧。</p>
            <button className="btn btn-soft btn-block" onClick={() => go({ page: "garden" })}>
              去花园
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-block btn-xl" onClick={() => startSession()}>
            开始今天的学习 · 约 {plan.minutes} 分钟
          </button>
        )}
      </section>

      <section className="card" aria-labelledby="week-h">
        <h2 id="week-h" className="card-title">
          本周贴纸
        </h2>
        <ol className="stickers">
          {week.map((d) => (
            <li key={d.key} className={`sticker ${d.sticker ? "has" : ""} ${d.today ? "is-today" : ""}`}>
              <span className="sticker-face" aria-label={d.sticker ? "学习了" : "还没学"}>
                {d.sticker ?? ""}
              </span>
              <span className="sticker-day">{d.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card garden-peek" aria-labelledby="peek-h">
        <div className="card-head">
          <h2 id="peek-h" className="card-title">
            我的花园
          </h2>
          <a href="#/garden" className="link">
            全部 ›
          </a>
        </div>
        <div className="stage-row">
          {STAGES.filter((s) => s !== "seed").map((s) => (
            <div key={s} className="stage-pill">
              <span className="stage-emoji">{STAGE_INFO[s].emoji}</span>
              <b>{all.counts[s]}</b>
              <span>{STAGE_INFO[s].zh}</span>
            </div>
          ))}
        </div>
        {badges.length > 0 && (
          <p className="badges">
            {badges.map((t) => (
              <span key={t.id} className="badge" title={`${t.zh}花坛全部结果`}>
                🏅{t.icon}
              </span>
            ))}
          </p>
        )}
      </section>

      <section className="card wod" aria-label="每日一词">
        <button className="wod-btn" onClick={() => openWord(wod.id)}>
          <span className="wod-pic" aria-hidden="true">
            <WordPic w={wod} size="sm" />
          </span>
          <span className="wod-text">
            <small>每日一词</small>
            <b lang="en">{wod.word}</b>
            <span>{wod.zh}</span>
          </span>
        </button>
      </section>
    </div>
  );
}
