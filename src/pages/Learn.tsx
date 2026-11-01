/* Session runner adapted from Word Atlas (https://github.com/designfuchen/word-atlas), MIT, © 2026 Word Atlas contributors. */
import { ArrowRight, Delete, Lightbulb, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import type { WordRef } from "../atlas/types";
import { burst } from "../lib/burst";
import { plantOf, STAGE_INFO } from "../lib/garden";
import { gradeConfig } from "../lib/grade";
import { go } from "../lib/router";
import { cue } from "../lib/sound";
import { hashSeed, normalize, shuffle } from "../lib/text";
import { advance, answer, gradeFor, sessionStats } from "../store/session";
import { store, useStore, type ActiveSession, type QuizKind, type Step } from "../store/store";
import { Plant } from "../ui/Plant";
import { say, SpeakButton } from "../ui/SpeakButton";

export function Learn() {
  const session = useStore((s) => s.progress.session);
  useEffect(() => {
    if (!session) go({ page: "today" }, null, true);
  }, [session]);
  if (!session) return null;
  if (session.finished || session.index >= session.steps.length) return <Summary session={session} />;
  return <Runner session={session} />;
}

/** Move on; speak the next word inside this same tap so phone browsers allow the audio. */
function continueFrom(atlas: ReturnType<typeof useAtlas>, started: number) {
  const { progress, settings } = store.get();
  const s = progress.session;
  const next = s?.steps[s.index + 1];
  if (next && settings.autoplay && (next.kind === "intro" || next.kind === "listen")) {
    const w = atlas.byId.get(next.id);
    if (w) void say(w.word, settings.accent);
  }
  cue("tap", settings.sfx);
  advance((performance.now() - started) / 1000);
}

function Runner({ session }: { session: ActiveSession }) {
  const step = session.steps[session.index];
  const total = session.steps.length;
  return (
    <div className="learn">
      <header className="learn-top">
        <button className="icon-btn" onClick={() => go({ page: "today" })} aria-label="先休息一下">
          <X size={26} />
        </button>
        <div className="learn-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={session.index}>
          <span style={{ width: `${(session.index / total) * 100}%` }} />
        </div>
        <span className="learn-count">
          {session.index + 1}/{total}
        </span>
      </header>
      <div className="learn-stage" key={`${session.id}-${session.index}`}>
        {step.kind === "intro" ? <Intro step={step} /> : <Quiz step={step as Step & { kind: QuizKind }} session={session} />}
      </div>
    </div>
  );
}

function Intro({ step }: { step: Step }) {
  const atlas = useAtlas();
  const w = atlas.byId.get(step.id)!;
  const t0 = useRef(performance.now());
  const topic = atlas.topics[w.topic];
  return (
    <div className="intro">
      <p className="stage-label">🌱 新种子</p>
      <div className="intro-card">
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
      </div>
      <footer className="learn-actions">
        <button className="btn btn-primary btn-xl btn-block" onClick={() => continueFrom(atlas, t0.current)}>
          认识了 <ArrowRight size={24} />
        </button>
      </footer>
    </div>
  );
}

const PROMPT: Record<QuizKind, string> = {
  listen: "听一听，是哪一个？",
  picture: "这个用英语怎么说？",
  meaning: "这个单词是什么意思？",
  spell: "拼一拼这个单词",
};

function Quiz({ step, session }: { step: Step & { kind: QuizKind }; session: ActiveSession }) {
  const atlas = useAtlas();
  const settings = useStore((s) => s.settings);
  const cfg = gradeConfig(settings.grade);
  const w = atlas.byId.get(step.id)!;
  const t0 = useRef(performance.now());
  const [hinted, setHinted] = useState(false);
  const pending = session.pending;
  const options = (step.options ?? []).map((id) => atlas.byId.get(id)!).filter(Boolean);

  const submit = (value: string, correct: boolean, el?: HTMLElement | null) => {
    if (pending) return;
    const ms = performance.now() - t0.current;
    answer(atlas, step, correct, gradeFor(step.kind, correct, ms, hinted, cfg), value);
    cue(correct ? "correct" : "wrong", settings.sfx);
    if (correct) {
      void say(w.word, settings.accent);
      const r = el?.getBoundingClientRect();
      if (r) burst(r.left + r.width / 2, r.top + r.height / 2);
    }
  };

  return (
    <div className={`quiz quiz-${step.kind}`}>
      <p className="stage-label">{step.retry ? "🔁 再试一次" : PROMPT[step.kind]}</p>
      <div className="quiz-prompt">
        {step.kind === "listen" && <SpeakButton word={w.word} big label="再听一遍" />}
        {(step.kind === "picture" || step.kind === "spell") && (
          <>
            <div className="quiz-pic" aria-hidden="true">
              {w.emoji}
            </div>
            <p className="quiz-zh">{w.zh}</p>
            {step.kind === "spell" && <SpeakButton word={w.word} label="听发音" />}
          </>
        )}
        {step.kind === "meaning" && (
          <div className="word-head">
            <h2 className="word-en" lang="en">
              {w.word}
            </h2>
            <SpeakButton word={w.word} />
          </div>
        )}
      </div>

      {step.kind === "spell" ? (
        cfg.spell === "type" ? (
          <TypeSpell key={step.id} word={w} pending={!!pending} hinted={hinted} onHint={() => setHinted(true)} onSubmit={submit} />
        ) : (
          <TileSpell key={step.id} word={w} pending={!!pending} hinted={hinted} onHint={() => setHinted(true)} onSubmit={submit} />
        )
      ) : (
        <div className={`options options-${step.kind === "listen" ? "pics" : "words"}`}>
          {options.map((o) => {
            const state = pending ? (o.id === w.id ? "is-right" : o.id === pending.value ? "is-wrong" : "is-dim") : "";
            return (
              <button key={o.id} className={`option ${state}`} disabled={!!pending} onClick={(e) => submit(o.id, o.id === w.id, e.currentTarget)}>
                {step.kind === "listen" && (
                  <span className="option-pic" aria-label={cfg.band === 1 ? o.zh : undefined}>
                    {o.emoji}
                  </span>
                )}
                {step.kind === "listen" && cfg.band > 1 && <span className="option-zh">{o.zh}</span>}
                {step.kind === "picture" && (
                  <span className="option-en" lang="en">
                    {o.word}
                  </span>
                )}
                {step.kind === "meaning" && <span className="option-zhbig">{o.zh}</span>}
              </button>
            );
          })}
        </div>
      )}

      {pending && (
        <div className={`feedback ${pending.correct ? "is-ok" : "is-miss"}`} role="status">
          <div className="feedback-text">
            <b>{pending.correct ? "太棒了！🎉" : "没关系，记住它 👇"}</b>
            <span>
              <span aria-hidden="true">{w.emoji}</span> <span lang="en">{w.word}</span> · {w.zh}
            </span>
          </div>
          <button className="btn btn-primary btn-xl btn-block" autoFocus onClick={() => continueFrom(atlas, t0.current)}>
            继续 <ArrowRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}

type SpellProps = { word: WordRef; pending: boolean; hinted: boolean; onHint: () => void; onSubmit: (value: string, correct: boolean, el?: HTMLElement | null) => void };

/** Grades 3–4: tap letter tiles in order. */
function TileSpell({ word, pending, hinted, onHint, onSubmit }: SpellProps) {
  const target = word.word.toLowerCase();
  const tiles = useMemo(() => shuffle(target.split(""), hashSeed(word.id) + 3), [target, word.id]);
  const [picked, setPicked] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const typed = picked.map((i) => tiles[i]).join("");
  const full = picked.length === tiles.length;
  useEffect(() => {
    if (full && !pending) onSubmit(typed, typed === target, ref.current);
  }, [full]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="spell">
      <div className="slots" ref={ref} aria-label={`已拼：${typed}`}>
        {target.split("").map((ch, i) => (
          <span key={i} className={`slot ${i < picked.length ? "is-filled" : ""} ${pending ? (typed === target ? "is-right" : "is-wrong") : ""}`}>
            {i < picked.length ? tiles[picked[i]] : hinted && i === 0 ? <i className="slot-hint">{ch}</i> : ""}
          </span>
        ))}
      </div>
      <div className="tiles">
        {tiles.map((ch, i) => (
          <button key={i} className="tile" disabled={pending || picked.includes(i)} onClick={() => setPicked((p) => [...p, i])}>
            {ch}
          </button>
        ))}
      </div>
      {!pending && (
        <div className="spell-tools">
          <button className="btn btn-soft" onClick={() => setPicked((p) => p.slice(0, -1))} disabled={!picked.length} aria-label="退格">
            <Delete size={22} /> 退一格
          </button>
          <button className="btn btn-soft" onClick={onHint} disabled={hinted}>
            <Lightbulb size={22} /> 提示
          </button>
        </div>
      )}
      {pending && typed !== target && <p className="spell-answer" lang="en">正确拼写：{word.word}</p>}
    </div>
  );
}

/** Grades 5–6: type with the keyboard. */
function TypeSpell({ word, pending, hinted, onHint, onSubmit }: SpellProps) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const ok = normalize(value) === normalize(word.word);
  return (
    <form
      className="spell"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value, ok, ref.current);
      }}
    >
      <input
        ref={ref}
        className={`spell-input ${pending ? (ok ? "is-right" : "is-wrong") : ""}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        placeholder={hinted ? `${word.word[0]}${"_".repeat(word.word.length - 1)}` : "在这里输入"}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        lang="en"
        aria-label="输入英文拼写"
      />
      {!pending && (
        <div className="spell-tools">
          <button type="button" className="btn btn-soft" onClick={onHint} disabled={hinted}>
            <Lightbulb size={22} /> 提示
          </button>
          <button type="submit" className="btn btn-primary" disabled={!value.trim()}>
            检查
          </button>
        </div>
      )}
      {pending && !ok && <p className="spell-answer" lang="en">正确拼写：{word.word}</p>}
    </form>
  );
}

function Summary({ session }: { session: ActiveSession }) {
  const atlas = useAtlas();
  const cards = useStore((s) => s.progress.cards);
  const sfx = useStore((s) => s.settings.sfx);
  const stats = sessionStats(session);
  const ids = [...new Set(session.steps.map((s) => s.id))];
  useEffect(() => {
    cue("complete", sfx);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const close = (page: "today" | "garden") => {
    store.progress((p) => ({ ...p, session: null }));
    go({ page });
  };
  const now = Date.now();
  return (
    <div className="summary">
      <div className="stars" aria-label={`${stats.stars} 颗星`}>
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= stats.stars ? "star is-on" : "star"}>
            ★
          </span>
        ))}
      </div>
      <h1>完成啦！</h1>
      <p className="muted">
        种下 {session.newIds.length} 颗种子，浇了 {session.reviewIds.length} 次水
      </p>
      <ul className="summary-plants">
        {ids.map((id) => {
          const w = atlas.byId.get(id)!;
          const p = plantOf(cards[id], now);
          return (
            <li key={id}>
              <Plant stage={p.stage} size="sm" />
              <span lang="en">{w.word}</span>
              <small>{STAGE_INFO[p.stage].zh}</small>
            </li>
          );
        })}
      </ul>
      <div className="summary-actions">
        <button className="btn btn-primary btn-xl btn-block" onClick={() => close("garden")}>
          去花园看看 🌷
        </button>
        <button className="btn btn-soft btn-block" onClick={() => close("today")}>
          回到今天
        </button>
      </div>
    </div>
  );
}
