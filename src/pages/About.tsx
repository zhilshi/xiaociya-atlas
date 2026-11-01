import { REPO_URL, UPSTREAM_URL } from "../config";
import { Mark } from "../ui/Logo";

export function About() {
  return (
    <div className="page about">
      <div className="about-hero">
        <Mark size={72} />
        <h1>小词芽 WordSprout</h1>
        <p className="muted">给 1–6 年级小朋友的英语单词花园</p>
      </div>
      <section className="card prose">
        <h2>怎么学</h2>
        <p>每天认识几个新单词（种下种子），按记忆规律回来复习（浇水）。记得越牢，小苗就会长叶、开花、结果。答错也没关系，小苗只会回到发芽，从不枯萎。</p>
        <h2>隐私</h2>
        <p>不需要注册，没有广告。学习记录只保存在这台设备上；发音可能会向有道词典或 Google 请求单词读音。</p>
        <h2>开源与致谢</h2>
        <p>
          小词芽基于{" "}
          <a href={UPSTREAM_URL} target="_blank" rel="noreferrer">
            Word Atlas 词光
          </a>{" "}
          （MIT 许可，© 2026 Word Atlas contributors / designfuchen）改编，复用了它的间隔重复（FSRS）、学习流程与离线 PWA 架构。单词内容与图标为小词芽原创整理，图片使用系统 Emoji。
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
