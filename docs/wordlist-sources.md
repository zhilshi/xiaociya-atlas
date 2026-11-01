# 小词芽 WordSprout 词表来源评估（v2，2026-11-01）

> 起因：v1 词库只有 395 个词，选词靠主题凭感觉，没按 1–6 年级对齐任何公开分级标准。这里是反思和改进：先查清楚海外和国内现成的分级词表，再按明确规则合并成 1–6 年级词表。
> 原则：只写实际下载或打开过的内容，行数都是本机统计的。原始数据放在 `/workspace/wordlists/`，不进 git。

## 1. 实际用到的来源

| 来源 | 本机路径 | 规模（实测） | 许可 | 在 v2 里的作用 |
|---|---|---|---|---|
| **Cambridge YLE 词表**（Pre A1 Starters / A1 Movers / A2 Flyers，2018 版合订本） | `/workspace/wordlists/yle/149679-yle-starters-word-list.pdf`（43 页）→ 解析为 `yle_wordlist.csv`、`yle_themes.csv` | 字母表行数：Starters 498、Movers 408、Flyers 518（含人名和解析噪音）；主题表 1026 行 | © UCLES。PDF 可公开下载，但没有开放许可 | **主分级依据**，同时提供主题。v2 只用它的“词属于哪一级”这个事实，不复制 PDF 的版式和例句 |
| **CEFR-J Wordlist v1.5**（东京外国语大学投野研究室） | `/workspace/wordlists/olp-en-cefrj/cefrj-vocabulary-profile-1.5.csv`（来自 github.com/openlanguageprofiles/olp-en-cefrj） | 7799 行：A1 1164 / A2 1411 / B1 2446 / B2 2778 | 可免费用于研究和商业用途，**需要引用** | 补充词：A1 单词，以及高频的 A2 单词；同时提供 cefrj_level 列 |
| **Dolch sight words**（220 个）+ **Dolch nouns**（95 个） | `/workspace/wordlists/dolch/dolch-sight-words.csv`、`dolch-nouns.csv`（来自 planitteachers.ai/data/word-lists/） | 220 + 95 | 1936/1948 年发表的词表，通常视为公有领域 | 辅助 1–2 年级的高频功能词；在同一级内用来排序 |
| **义务教育英语课程标准（2022）附录 二级词汇** | `/workspace/wordlists/kebiao/kebiao_level2_505.txt` | 官方 505 词，**只还原出 495 个**（新浪转载页 486 个 + 百度摘录补 9 个） | 教育部文件，原文没有开放数据下载 | 作为“国内小学必学”的覆盖校验和排序信号；**不作为数据再发布** |
| **人教版 PEP 3–6 年级单词** | `/workspace/wordlists/pep/g{3..6}-s{1,2}.json`（来自 github.com/cyforkk/pep-english-words） | 8 册分别是 64/71/84/104/133/156/147/92 词 | 仓库代码是 MIT，但它的 README 写明词库版权归人民教育出版社 | 只用来**下调年级**（教材教得更早就提前）；也作为准入信号（必须同时在 CEFR-J A1–B1 里） |
| **ECDICT** | `/workspace/wordlists/ecdict.csv`（66MB，770,611 行，来自 github.com/skywind3000/ECDICT） | — | MIT | 中文释义的兜底来源（365 个词）。注意：它的 tag 只有 zk/gk/cet4/cet6/ky/toefl/ielts/gre，**没有小学标签** |
| **FrequencyWords en_50k**（OpenSubtitles 2018） | `/workspace/wordlists/freq/en_50k.txt`（来自 github.com/hermitdave/FrequencyWords） | 50,000 行 | 代码 MIT，数据 CC BY-SA 4.0 | 字幕词频排名，用于同级内排序和筛选 A2 |
| **NGSL 1.2**（Browne, Culligan, Phillips） | `/workspace/wordlists/ngsl/NGSL_12_stats.csv`（来自 newgeneralservicelist.com） | 2809 个 lemma | CC BY-SA 4.0 | 通用词频排名，用于筛选 A2 |
| **小词芽 v1 词库** | `src/data/lexicon.json` | 395 | 自有 | 保留，并按新规则重新分级（389 个保留，6 个去掉，原因见 §4） |

## 2. 评估过但没用上的

- **Oxford 3000/5000、English Vocabulary Profile (EVP)**：专有数据，没有可用的下载，未使用。
- **Fry 1000**：尝试下载的 CSV 返回 404（`/workspace/wordlists/fry/` 是空的），而且它有版权问题，未使用。
- **Cambridge 其他 URL**：`wordlists-pre-a1-…pdf` 报 HTTP/2 错误，`351851-…pdf` 返回 404。最后用的是 149679 号合订本。
- **课标全文**：edui123.com 上没有附录三的内容，百度和头条的页面抓取被拦截，所以只有转载版本（缺 10 词）。
- **英国 National Curriculum 拼写词表**（Year 1 45 / Year 2 64 / Year 3–4 109 / Year 5–6 104 行，按 OGL 许可）：已经下载到 `dolch/` 目录，但它是母语儿童的拼写词，不适合中国 EFL 学生，所以 v2 没用。
- **CEFR-J B1/B2、Octanove C1/C2（CC BY-SA 4.0）**：对小学来说太难，只有已在 YLE、课标或 v1 里的词会带上这个等级标注。
- 已用 GitHub API 核实、留给后续图片和例句使用的资源：OpenMoji（CC BY-SA 4.0）、Twemoji（图形 CC BY 4.0）、Open English WordNet（CC BY 4.0）。CC-CEDICT 和 Tatoeba 的许可还没核实。

## 3. 年级映射（为什么这样分）

中国小学一般从 3 年级开始开英语课，但很多家长会让孩子从 1 年级就开始接触。课标分为 预备级（1–2 年级）、一级（3–4 年级）、二级（5–6 年级）。剑桥 YLE 的三个等级和这个阶段划分基本对应：

- **Starters (Pre A1) → 1–2 年级**
- **Movers (A1) → 3–4 年级**
- **Flyers (A2) → 5–6 年级**

具体规则写在 `data/README-wordlist-v2.md`。核心规则：先用 YLE 定“段”；没有 YLE 的词依次用 Dolch、课标、PEP、CEFR-J 定段；如果 PEP 教得更早，就下调；段内再按“简单度分数”对半分成低、高两个年级。

## 4. 结果（`data/wordlist-v2.csv`）

共 **1717 词**：1 年级 247、2 年级 247、3 年级 235、4 年级 234、5 年级 377、6 年级 377。
- 课标二级词：还原出的 495 个里覆盖了 491 个（noodle 以 v1 的 noodles 形式出现）。
- YLE：Starters 468、Movers 358、Flyers 463 个词被收录（去掉了人名、屈折形式和解析噪音）。
- 人工复核：6 个年级的 `en=zh` 全量都看过了（每级 230–380 词，见 `/workspace/logs/review_g*.txt`）。修正了 1000 多条中文释义；删除了 220 多个词，包括屈折形式（went/ate…）、美式和英式重复拼写、IELTS 级或抽象的词（government、evidence、opportunity…），以及不适合儿童的词（kill、war、drug、smoking…）。删除清单在 `data/wordlist-v2-overrides.json`。
- v1 去掉的 6 个：grapes、eyes、pancakes、beans、parents 是复数形式，对应的单数已经在表里；pray 是宗教类词，而且没有任何分级来源。

## 5. 风险和缺口

1. **版权**：YLE（© UCLES）、课标附录、PEP 教材词表都**没有开放许可**。v2 只把“某词属于某级”当作事实信号来用。如果要公开发布或商用，建议请法务确认，或者只发布 CEFR-J、NGSL、ECDICT 这些开放来源能推出的字段。
2. 课标还缺 10 词（505 − 495），需要拿到官方 PDF 才能补齐。
3. 5–6 年级各有 377 词，比低年级多。原因是 Flyers 本身就大，加上 CEFR-J 补充词。如果低年级（1–2 年级 = 非课标必学）想要更少的词，可以把 2 年级里一部分移到 3 年级。
4. 中文释义：1039 条是人工写的，310 条来自 v1，365 条来自 ECDICT 首义（已全量人工浏览，但仍可能有不贴切的）。
5. 主题：功能词和日常词各占约 190 个，后续需要再细分主题，并配图或 emoji。
