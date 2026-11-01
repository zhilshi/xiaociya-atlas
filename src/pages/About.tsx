import { REPO_URL, UPSTREAM_URL } from "../config";
import { Mark } from "../ui/Logo";

const CC_BY = "https://creativecommons.org/licenses/by/4.0/";

export function About() {
  return (
    <div className="page about">
      <div className="about-hero">
        <Mark size={72} />
        <h1>小词芽 WordSprout</h1>
        <p className="muted">给 1–6 年级小朋友的英语单词花园 · 1717 个词</p>
      </div>
      <section className="card prose">
        <h2>怎么学</h2>
        <p>每天认识几个新单词（种下种子），按记忆规律回来复习（浇水）。记得越牢，小苗就会长叶、开花、结果。答错也没关系，小苗只会回到发芽，从不枯萎。</p>
        <h2>隐私</h2>
        <p>不需要注册，没有广告。学习记录只保存在这台设备上；没有自带录音的单词，发音可能会向有道词典或 Google 请求读音。</p>
      </section>
      <section className="card prose" aria-labelledby="thanks-h">
        <h2 id="thanks-h">致谢 · 图片、读音与例句</h2>
        <p>
          很多单词的插画、英式/美式读音、例句和搭配来自{" "}
          <a href={UPSTREAM_URL} target="_blank" rel="noreferrer">
            Word Atlas
          </a>
          ：<b>Word Atlas contributors — CC BY 4.0</b>（
          <a href={CC_BY} target="_blank" rel="noreferrer">
            许可协议
          </a>
          ）。
        </p>
        <p className="small muted">
          修改说明：小词芽把插画压缩成小图，只挑选了 1–6 年级单词用到的部分；例句和搭配按年级重新筛选和分层（低年级只看一句短例句），不适合小朋友的内容已删除，其余较难内容放进「进阶」区。改动不代表原作者认可。
        </p>
        <h2>词表来源</h2>
        <p className="small">
          年级词表参考了 CEFR-J Wordlist（Version 1.5, 东京外国语大学投野由纪夫研究室, 2012）、ECDICT（MIT）释义，以及剑桥 YLE、义务教育课程标准与人教 PEP 教材词表（只作为分级参考信号，没有复制其内容）。
        </p>
        <h2>开源</h2>
        <p>
          小词芽的代码基于{" "}
          <a href={UPSTREAM_URL} target="_blank" rel="noreferrer">
            Word Atlas 词光
          </a>
          （MIT 许可，© 2026 Word Atlas contributors）改编，复用了它的间隔重复（FSRS）、学习流程与离线 PWA 架构。代码以 MIT 许可开源。
        </p>
        <p>
          源代码：
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            {REPO_URL.replace("https://", "")}
          </a>
        </p>
      </section>
    </div>
  );
}
