# 小词芽 WordSprout 🌱

给小学 1–6 年级孩子的英语单词花园。每天学几个单词，把它们种成一座花园：
学会一个词就种下一颗种子，按时复习（浇水）它就会发芽、长叶、开花、结果。

> Based on Word Atlas (MIT) by designfuchen / Word Atlas contributors —
> https://github.com/designfuchen/word-atlas . See [LICENSE](LICENSE) and [NOTICE](NOTICE).

- **白底极简、儿童友好**：只有浅色主题，大按钮、大字号，低年级字号更大。
- **不用注册账号**：所有学习记录只保存在这台设备的浏览器里（可导出/导入备份）。
- **按年级分层**：首次打开选择年级，决定每天新词数量、练习题型和复习节奏。
- **手机能发音**：系统英文语音 → 有道词典发音（美音 type=2 / 英音 type=1）→ Google 翻译发音，依次兜底。
- **离线可用**：PWA，装到主屏幕后断网也能学（发音需要系统语音或网络）。

| 引导选年级 | 今天 | 花园 | 单词卡 | 练习 |
|---|---|---|---|---|
| ![](screenshots/1-onboarding-grade.png) | ![](screenshots/2-today.png) | ![](screenshots/4-garden-bed.png) | ![](screenshots/5-word-card.png) | ![](screenshots/6-practice-question.png) |

## 运行

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # node:test 单元测试
npm run build      # 类型检查 + 生产构建到 dist/
npm run preview    # 预览 dist/
```

截图（Playwright Chromium, 390×844）：先 `npm run build && npx vite preview --port 5188`，再
`npm run screenshots`（如本机已有 Chromium，可设 `CHROMIUM_PATH=/path/to/chrome`）。

部署（Cloudflare Pages 预览分支）：

```bash
npx wrangler pages deploy dist --project-name=xiaociya --branch=atlas
```

## 词库与年级分层

`data/wordlist-v2.csv` 共 **1717 个词**，按年级 247/247/235/234/377/377。`npm run data` 把它转成
`src/data/lexicon-v2.json`（`scripts/build-lexicon.ts` → `src/atlas/convert.ts`）：

- **46 个儿童主题**（`src/atlas/topics-v2.ts`），每个 8–60 词，带 emoji 图标和中文名，每个词只属于一个主题。
- **id 稳定**：v1 的 395 个词保留原 id（如 `animals.dog`、`calendar.may`），新词用 `w.<word>`；
  v1 的复数/重复词通过 `aliases` 映射（如 `fruits.orange → colors.orange`），学习记录自动迁移（`src/store/migrate.ts`）。
- **图片**：Word Atlas 插画（1355 词）→ emoji → 数字字形 → 大字母 + 中文卡片（89 词）。不再用 🌰 当占位。

孩子选的年级决定（`src/lib/grade.ts`、`src/store/session.ts`）：

| 年级 | 每天新词 | 题型 | 拼写 |
|---|---|---|---|
| 1–2 | 5 | 听音选图、看图选词 | 无 |
| 3–4 | 8 | + 选中文 | 字母拼拼乐 |
| 5–6 | 10 | + 选中文 | 键盘拼写 |

新词先出本年级，本年级学完再出更低年级（由近到远），最后更高年级；所有年级到期的复习都会出现。年级可在「我的」里切换。

### Word Atlas 图片、读音与例句

`npm run data:wa`（`scripts/import_word_atlas.py`）从 Word Atlas 导入与词表重合的 1399 个词：
256px WebP 插画、英/美式 mp3（优先播放，失败再走设备语音 → 有道 → Google）、例句与搭配。
内容分两层：**core**（按年级过滤的儿童例句，1–2 年级最多一句短句）和 **ext / 进阶扩展**
（更多例句、词族、近反义词、提示），进阶默认 5–6 年级打开、1–4 年级关闭，可在「我的」切换。
不适合儿童的内容直接删除，不进任何一层。媒体按需加载，Service Worker 独立缓存（上限 3000 个文件），
「我的 → 离线包」可预下载本年级。

## 单词花园

每个主题是一个花坛，每个词是一株植物。花园默认只显示本年级的花坛，可按 1–6 年级或全部筛选；
正在长的花坛显示为大卡片，还没种和已全部结果的花坛折叠成大按钮，成长阶段由 FSRS 记忆稳定度 `s`（天）决定（`src/lib/garden.ts`）：

种子（还没学，画成一小堆土里的种子） → 🌱 发芽（新学或刚答错） → 🌿 长叶（s < 7） → 🌷 开花（7 ≤ s < 21） → 🍎 结果（s ≥ 21）。

到期需要复习的词显示 💧 “口渴了”，点“浇水”就会练习这些词。一个花坛全部结果会获得 🏅。

## 代码结构

```
src/atlas      词库转换（convert.ts）、主题（topics-v2.ts）、加载（lexicon.ts）
src/lib        年级配置、花园阶段、发音、音效、路由、贴纸
src/store      本地存储、设置迁移、FSRS 调度、学习会话
src/pages      Onboarding / Today / Garden / Learn / Practice / Me / About
src/ui         Logo、Plant、WordCard、WordPic、WordExtras、SpeakButton、Sheet、Toast
```

## License 与致谢

- 代码：MIT — see [LICENSE](LICENSE)。基于 Word Atlas（MIT, © 2026 Word Atlas contributors）。
- 图片、读音、例句（`public/wa/`）：**Word Atlas contributors — CC BY 4.0**
  （<https://creativecommons.org/licenses/by/4.0/>）。已修改：只取 1–6 年级重合词、压缩插画、
  按年级重新筛选并分层例句、删除不适合儿童的内容。修改说明见 [NOTICE](NOTICE)，App 内「关于 · 致谢」页也有说明。
- 词表（`data/wordlist-v2.csv`，详见 [data/ATTRIBUTION.md](data/ATTRIBUTION.md)）：
  - CEFR-J Wordlist Version 1.5 — 『CEFR-J Wordlist Version 1.5』 東京外国語大学投野由紀夫研究室。
  - NGSL / FrequencyWords 词频排名：CC BY-SA 4.0。仅在仓库的 CSV 里以排名列形式再分发（保留署名与相同方式共享），App 打包数据不含这些列。
  - ECDICT 中文释义：MIT。
  - 剑桥 YLE（© UCLES）、义务教育课程标准、人教 PEP 词表：只作为分级参考信号，没有复制其词表。
