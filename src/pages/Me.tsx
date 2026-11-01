import { Download, Pencil, Plus, RotateCcw, Trash2, Upload, UserRound } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { isMastered } from "../store/srs";
import { GRADE_LABEL, type SchoolGrade } from "../lib/grade";
import {
  dayKey,
  exportBackup,
  importBackup,
  MAX_CHILDREN,
  resetProgress,
  settingsForGrade,
  store,
  useStore,
  type Settings,
} from "../store/store";
import { toast } from "../ui/Toast";
import { useAtlas } from "../atlas/context";
import { downloadGradePack } from "../lib/media";

const GRADES: SchoolGrade[] = [1, 2, 3, 4, 5, 6];

type EditorMode = null | { kind: "add" } | { kind: "edit"; id: string };

export function Me() {
  const progress = useStore((s) => s.progress);
  const settings = useStore((s) => s.settings);
  const profiles = useStore((s) => s.profiles);
  const saveError = useStore((s) => s.saveError);
  const file = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorMode>(null);
  const [draftName, setDraftName] = useState("小朋友");
  const [draftGrade, setDraftGrade] = useState<SchoolGrade>(3);
  const atlas = useAtlas();
  const [pack, setPack] = useState<number | null>(null);
  const active = profiles.children.find((c) => c.id === profiles.activeId) ?? null;

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

  const openAdd = () => {
    if (profiles.children.length >= MAX_CHILDREN) {
      toast(`最多 ${MAX_CHILDREN} 个小朋友档案`, "warn");
      return;
    }
    setDraftName(`小朋友${profiles.children.length + 1}`);
    setDraftGrade(3);
    setEditor({ kind: "add" });
  };
  const openEdit = (id: string) => {
    const c = profiles.children.find((x) => x.id === id);
    if (!c) return;
    setDraftName(c.name);
    setDraftGrade((c.grade || 3) as SchoolGrade);
    setEditor({ kind: "edit", id });
    setConfirmDelete(null);
  };
  const saveEditor = () => {
    const name = draftName.trim() || "小朋友";
    if (editor?.kind === "add") {
      const r = store.addChild({ name, grade: draftGrade });
      toast(r.ok ? `已添加 ${name}` : r.error, r.ok ? "ok" : "warn");
    } else if (editor?.kind === "edit") {
      store.updateChild(editor.id, { name, grade: draftGrade });
      toast("已保存", "ok");
    }
    setEditor(null);
  };

  return (
    <div className="page me">
      <h1 className="page-title">我的</h1>

      <section className="card kids-card" aria-labelledby="kids-h">
        <div className="card-head">
          <h2 id="kids-h" className="card-title">
            小朋友档案
          </h2>
          <button className="btn btn-soft btn-sm" onClick={openAdd} disabled={profiles.children.length >= MAX_CHILDREN}>
            <Plus size={16} /> 添加
          </button>
        </div>
        <p className="muted small kids-hint">每个小朋友有自己的年级和花园进度，切换不会互相串。</p>
        <ul className="kids-list">
          {profiles.children.map((c) => {
            const on = c.id === profiles.activeId;
            return (
              <li key={c.id} className={`kid-row ${on ? "is-on" : ""}`}>
                <button
                  className="kid-main"
                  onClick={() => {
                    if (!on) {
                      store.switchChild(c.id);
                      toast(`已切换到 ${c.name}`, "ok");
                    }
                  }}
                  aria-current={on ? "true" : undefined}
                >
                  <span className="kid-avatar" aria-hidden="true">
                    <UserRound size={22} />
                  </span>
                  <span className="kid-meta">
                    <b>{c.name}</b>
                    <small>{c.grade ? GRADE_LABEL[c.grade as SchoolGrade] : "未选年级"}{on ? " · 当前" : ""}</small>
                  </span>
                </button>
                <button className="kid-icon" aria-label={`编辑 ${c.name}`} onClick={() => openEdit(c.id)}>
                  <Pencil size={18} />
                </button>
              </li>
            );
          })}
        </ul>
        {editor && (
          <div className="kid-editor" role="dialog" aria-label={editor.kind === "add" ? "添加小朋友" : "编辑小朋友"}>
            <label className="name-field">
              <span>昵称</span>
              <input className="name-input" value={draftName} maxLength={12} onChange={(e) => setDraftName(e.target.value)} />
            </label>
            <div className="grade-grid grade-grid-sm" role="radiogroup" aria-label="年级">
              {GRADES.map((g) => (
                <button key={g} role="radio" aria-checked={draftGrade === g} className={`grade-btn ${draftGrade === g ? "is-on" : ""}`} onClick={() => setDraftGrade(g)}>
                  <span>{GRADE_LABEL[g]}</span>
                </button>
              ))}
            </div>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={saveEditor}>
                保存
              </button>
              <button className="btn btn-soft" onClick={() => setEditor(null)}>
                取消
              </button>
              {editor.kind === "edit" &&
                (confirmDelete === editor.id ? (
                  <>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        const r = store.removeChild(editor.id);
                        setConfirmDelete(null);
                        setEditor(null);
                        toast(r.ok ? "已删除档案" : r.error, r.ok ? "ok" : "warn");
                      }}
                    >
                      确定删除
                    </button>
                    <button className="btn btn-soft" onClick={() => setConfirmDelete(null)}>
                      手滑了
                    </button>
                  </>
                ) : (
                  <button className="btn btn-ghost" onClick={() => setConfirmDelete(editor.id)}>
                    <Trash2 size={16} /> 删除
                  </button>
                ))}
            </div>
          </div>
        )}
      </section>

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
      {active && <p className="muted small stats-note">以上是「{active.name}」的花园数据</p>}

      {saveError && <p className="warn-box">这台设备的存储空间满了，学习记录可能没保存。请导出备份。</p>}

      <section className="card settings">
        <h2 className="card-title">当前学习设置</h2>
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
        <p className="muted small">没有账号，所有记录只保存在这台设备的浏览器里。换手机前请先导出备份（含全部小朋友档案）。</p>
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
                toast("当前小朋友的花园已清空，可以重新开始啦", "ok");
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
            <RotateCcw size={18} /> 清空当前小朋友的学习记录
          </button>
        )}
      </section>

      <a className="about-link" href="#/about">
        关于小词芽 · 开源与致谢 ›
      </a>
    </div>
  );
}
