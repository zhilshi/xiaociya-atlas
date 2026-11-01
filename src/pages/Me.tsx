import { Download, RotateCcw, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { isMastered } from "../store/srs";
import { GRADE_LABEL, type SchoolGrade } from "../lib/grade";
import { dayKey, exportBackup, importBackup, resetProgress, settingsForGrade, store, useStore, type Settings } from "../store/store";
import { toast } from "../ui/Toast";
import { useAtlas } from "../atlas/context";
import { downloadGradePack } from "../lib/media";

const GRADES: SchoolGrade[] = [1, 2, 3, 4, 5, 6];

export function Me() {
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const saveError = useStore((s) => s.saveError);
  const file = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const atlas = useAtlas();
  const [pack, setPack] = useState<number | null>(null);
  const savePack = async () => {
    setPack(0);
    const r = await downloadGradePack(atlas.words, settings.grade || 1, settings.accent, (d, t) => setPack(Math.min(99, Math.round((d / t) * 100))));
    setPack(100);
    toast(r.failed ? `下载完成，${r.failed} 个文件没下好，可以稍后再试` : `已存好 ${r.total} 个图片和读音`, r.failed ? "warn" : "ok");
  };

  const stats = useMemo(() => {
    const cards = Object.values(progress.cards);
    const days = Object.values(progress.days);
    return {
      planted: cards.length,
      fruit: cards.filter(isMastered).length,
      days: days.filter((d) => d.n + d.r > 0).length,
      minutes: Math.round(days.reduce((n, d) => n + d.t, 0) / 60),
    };
  }, [progress]);

  const set = (patch: Partial<Settings>) => store.settings(patch);
  const download = () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wordsprout-backup-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const restore = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) return toast("文件太大，不像是学习备份。", "warn");
    const r = importBackup(await f.text());
    toast(r.ok ? `已恢复 ${r.cards} 个单词的记录` : r.error, r.ok ? "ok" : "warn");
  };

  return (
    <div className="page me">
      <h1 className="page-title">我的</h1>
      <section className="stat-grid">
        <div>
          <b>{stats.planted}</b>
          <span>🌱 种下的词</span>
        </div>
        <div>
          <b>{stats.fruit}</b>
          <span>🍎 结果的词</span>
        </div>
        <div>
          <b>{stats.days}</b>
          <span>⭐ 学习天数</span>
        </div>
        <div>
          <b>{stats.minutes}</b>
          <span>⏱️ 分钟</span>
        </div>
      </section>

      {saveError && <p className="warn-box">这台设备的存储空间满了，学习记录可能没保存。请导出备份。</p>}

      <section className="card settings">
        <h2 className="card-title">年级</h2>
        <div className="grade-grid grade-grid-sm" role="radiogroup" aria-label="年级">
          {GRADES.map((g) => (
            <button key={g} role="radio" aria-checked={settings.grade === g} className={`grade-btn ${settings.grade === g ? "is-on" : ""}`} onClick={() => store.settings(settingsForGrade(settings, g))}>
              <span>{GRADE_LABEL[g]}</span>
            </button>
          ))}
        </div>

        <label className="row">
          <span>每天新词</span>
          <span className="stepper">
            <button onClick={() => set({ dailyNew: Math.max(1, settings.dailyNew - 1) })} aria-label="少一个">
              −
            </button>
            <b>{settings.dailyNew}</b>
            <button onClick={() => set({ dailyNew: Math.min(30, settings.dailyNew + 1) })} aria-label="多一个">
              +
            </button>
          </span>
        </label>

        <div className="row">
          <span>发音</span>
          <span className="seg">
            <button className={settings.accent === "us" ? "is-on" : ""} onClick={() => set({ accent: "us" })}>
              美式
            </button>
            <button className={settings.accent === "uk" ? "is-on" : ""} onClick={() => set({ accent: "uk" })}>
              英式
            </button>
          </span>
        </div>
        <label className="row">
          <span>自动读单词</span>
          <input type="checkbox" className="switch" checked={settings.autoplay} onChange={(e) => set({ autoplay: e.target.checked })} />
        </label>
        <label className="row">
          <span>答题音效</span>
          <input type="checkbox" className="switch" checked={settings.sfx} onChange={(e) => set({ sfx: e.target.checked })} />
        </label>
        <label className="row">
          <span>
            进阶扩展
            <small className="row-note">词卡里多一个「进阶」折叠区：更多例句、词族、近反义词。5–6 年级默认打开。</small>
          </span>
          <input type="checkbox" className="switch" checked={settings.advanced} onChange={(e) => set({ advanced: e.target.checked })} />
        </label>
        <div className="row">
          <span>
            离线包
            <small className="row-note">把{settings.grade ? `${settings.grade} 年级` : "本年级"}的图片和读音存到这台设备，没网也能学。</small>
          </span>
          <button className="btn btn-soft btn-sm" disabled={pack !== null && pack < 100} onClick={() => void savePack()}>
            {pack === null ? "下载" : pack < 100 ? `${pack}%` : "已下载 ✓"}
          </button>
        </div>
      </section>

      <section className="card settings">
        <h2 className="card-title">家长区 · 数据</h2>
        <p className="muted small">没有账号，所有记录只保存在这台设备的浏览器里。换手机前请先导出备份。</p>
        <div className="btn-row">
          <button className="btn btn-soft" onClick={download}>
            <Download size={20} /> 导出备份
          </button>
          <button className="btn btn-soft" onClick={() => file.current?.click()}>
            <Upload size={20} /> 导入备份
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void restore(f);
              e.target.value = "";
            }}
          />
        </div>
        {confirmReset ? (
          <div className="btn-row">
            <button
              className="btn btn-danger"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
                toast("花园已清空，可以重新开始啦", "ok");
              }}
            >
              确定清空
            </button>
            <button className="btn btn-soft" onClick={() => setConfirmReset(false)}>
              取消
            </button>
          </div>
        ) : (
          <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={18} /> 清空学习记录
          </button>
        )}
      </section>

      <a className="about-link" href="#/about">
        关于小词芽 · 开源与致谢 ›
      </a>
    </div>
  );
}
