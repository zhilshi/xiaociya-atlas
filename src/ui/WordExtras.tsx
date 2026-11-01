import type { WaEntry } from "../lib/media";
import { visibleContent } from "../lib/media";

/**
 * Word Atlas content under a word card. Kid tier (filtered examples, simple collocations)
 * is always shown; the 进阶扩展 tier is not rendered at all unless `advanced` is on, and even
 * then it starts collapsed behind a 进阶 toggle.
 */
export function WordExtras({ entry, grade, advanced, onSay }: { entry: WaEntry | null; grade: number; advanced: boolean; onSay?: (text: string) => void }) {
  const { examples, col, ext } = visibleContent(entry, grade, advanced);
  if (!examples.length && !col.length && !ext) return null;
  return (
    <div className="word-extras">
      {examples.map((x) => (
        <button key={x.en} type="button" className="example" onClick={() => onSay?.(x.en)} aria-label={`读例句：${x.en}`}>
          <span className="example-en" lang="en">
            {x.en}
          </span>
          <span className="example-zh">{x.zh}</span>
        </button>
      ))}
      {col.length > 0 && (
        <div className="collocations" aria-label="常用搭配">
          {col.map(([en, zh]) => (
            <span key={en} className="chip chip-soft">
              <b lang="en">{en}</b> {zh}
            </span>
          ))}
        </div>
      )}
      {ext && (
        <details className="advanced" data-tier="ext">
          <summary>进阶 Advanced</summary>
          {ext.senses && ext.senses.length > 0 && (
            <ul className="adv-list">
              {ext.senses.map(([pos, zh, en]) => (
                <li key={pos + zh}>
                  <b>{pos}</b> {zh} <span lang="en" className="muted">{en}</span>
                </li>
              ))}
            </ul>
          )}
          {(ext.ex ?? []).map((x) => (
            <p key={x.en} className="adv-ex">
              <span lang="en">{x.en}</span>
              <br />
              <span className="muted">{x.zh}</span>
            </p>
          ))}
          {ext.col && ext.col.length > 0 && <p className="adv-row"><b>搭配</b> {ext.col.map(([e, z]) => `${e}（${z}）`).join("；")}</p>}
          {ext.fam && ext.fam.length > 0 && <p className="adv-row"><b>词族</b> <span lang="en">{ext.fam.join(" · ")}</span></p>}
          {ext.syn && ext.syn.length > 0 && <p className="adv-row"><b>近义</b> <span lang="en">{ext.syn.join(" · ")}</span></p>}
          {ext.ant && ext.ant.length > 0 && <p className="adv-row"><b>反义</b> <span lang="en">{ext.ant.join(" · ")}</span></p>}
          {ext.tip && <p className="adv-row"><b>提示</b> {ext.tip}</p>}
          <p className="adv-src muted">内容来自 Word Atlas contributors（CC BY 4.0），已按年级重新分层</p>
        </details>
      )}
    </div>
  );
}
