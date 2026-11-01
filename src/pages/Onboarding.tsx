import { useState } from "react";
import { GRADE_LABEL, gradeConfig, type SchoolGrade } from "../lib/grade";
import { unlockAudio } from "../lib/speak";
import { store } from "../store/store";
import { Mark } from "../ui/Logo";

const GRADES: SchoolGrade[] = [1, 2, 3, 4, 5, 6];
const BAND_NOTE = { 1: "听一听、认图片，不用拼写", 2: "加上字母拼拼乐", 3: "可以自己打字拼写" } as const;

/** First run: nickname + grade. Nothing leaves the device; no account needed. */
export function Onboarding() {
  const [name, setName] = useState("小朋友");
  const [grade, setGrade] = useState<SchoolGrade | null>(null);
  const cfg = grade ? gradeConfig(grade) : null;
  return (
    <div className="onboard">
      <div className="onboard-hero">
        <Mark size={84} />
        <h1>你好，我是小词芽 🌱</h1>
        <p>每天学几个英语单词，把它们种成一座花园。</p>
      </div>
      <section className="card onboard-card" aria-labelledby="name-q">
        <h2 id="name-q">怎么称呼小朋友？</h2>
        <label className="name-field">
          <span className="sr-only">昵称</span>
          <input
            className="name-input"
            value={name}
            maxLength={12}
            placeholder="小朋友"
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
          />
        </label>
        <h2 id="grade-q">你上几年级？</h2>
        <div className="grade-grid" role="radiogroup" aria-labelledby="grade-q">
          {GRADES.map((g) => (
            <button key={g} role="radio" aria-checked={grade === g} className={`grade-btn ${grade === g ? "is-on" : ""}`} onClick={() => setGrade(g)}>
              <b>{g}</b>
              <span>{GRADE_LABEL[g]}</span>
            </button>
          ))}
        </div>
        <p className="onboard-note" aria-live="polite">
          {cfg ? `每天 ${cfg.dailyNew} 个新词 · ${BAND_NOTE[cfg.band]}` : "选好后随时可以在「我的」里修改"}
        </p>
        <button
          className="btn btn-primary btn-block btn-xl"
          disabled={!grade}
          onClick={() => {
            unlockAudio();
            if (!grade) return;
            store.completeOnboarding({ name: name.trim() || "小朋友", grade });
            location.hash = "#/";
          }}
        >
          开始种花 🌼
        </button>
      </section>
      <p className="privacy-note">不用注册账号，学习记录只保存在这台设备上。家里有两个小朋友也能各自种花。</p>
    </div>
  );
}
