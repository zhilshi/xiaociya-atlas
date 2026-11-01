# wordlist-v2.csv：小词芽 1–6 年级英语词表（草稿，尚未接入 App）

- 文件：`wordlist-v2.csv`（UTF-8，1717 行数据）
- 生成方式：`python3 data/build_wordlist_v2.py`，原始数据默认放在 `/workspace/wordlists`，也可以用环境变量 `WORDLISTS` 指定。人工修订写在 `wordlist-v2-overrides.json`。
- 来源评估见 `docs/wordlist-sources.md`，署名见 `ATTRIBUTION.md`。

## 字段
| 列 | 含义 |
|---|---|
| en | 英文词或短语（课标沿用英式拼写，美式重复拼写已去掉） |
| zh | 中文释义（儿童向，`；` 分隔多个义项） |
| pos | 词性（noun/verb/adj/adv/prep/pron/det/conj/excl/num/question） |
| topic | 主题（优先取 YLE 主题表，其次 v1 主题，再按词性兜底） |
| grade | 1–6 年级 |
| grade_rule | 定级依据，例如 `yle_movers`、`kebiao2+pep`、`yle_flyers>pep`（被 PEP 下调）、`>manual` |
| source_tags | 所有命中的来源：`yle_*`、`dolch_*`、`kebiao2`、`pep_gN`、`cefrj_A1..B2`、`legacy_v1` |
| freq_rank_subtitles | OpenSubtitles 词频排名（FrequencyWords） |
| ngsl_rank | NGSL 1.2 排名 |
| cefrj_level | CEFR-J 等级 |
| zh_source | manual / legacy_v1 / ECDICT(MIT) |
| licence_notes | 该行用到的来源各自的许可 |

## 定级规则（可复现）
1. **定段（band）**，按以下顺序，命中第一条就停：
   - YLE：Starters → 段 1（1–2 年级）；Movers → 段 3（3–4 年级）；Flyers → 段 5（5–6 年级）
   - 数字：按 YLE 规格，1–20 → 段 1；整十、hundred、序数 1st–20th → 段 3；thousand、21st、30th → 段 5
   - Dolch：pre-primer、primer、first → 段 1，其他 → 段 3
   - 星期、月份 → 段 3
   - 课标二级 → 有 PEP 年级就用 PEP 的段，没有就是段 5
   - PEP 且同时在 CEFR-J A1–B1 里 → PEP 3–4 年级对应段 3，5–6 年级对应段 5
   - CEFR-J A1/A2 补充词 → 段 5（A2 只有在字幕词频 ≤1500 且 NGSL ≤1000 时才收录）
   - v1 遗留词：v1 level 1 → 段 3，否则 → 段 5
2. **下调**：如果 PEP 教材出现的年级比上一步定的段更早，就采用 PEP 的段（grade_rule 会带 `>pep`）。
3. **段内拆两个年级**：计算分数 = Dolch 级别（不在 Dolch 记 5）+ 字幕词频档（≤500 记 0，≤1000 记 1，≤2000 记 2，≤5000 记 3，其他记 4）+ PEP 项（不在 PEP 记 1；PEP 年级 ≤ max(段, 3) 记 0；否则记 2）+（在课标里记 0，否则记 1）+ 扩展惩罚（CEFR-J A1 补充词 +1，A2 补充词 +3）。按（分数, 词频）排序后，前一半是低年级（段号），后一半是高年级（段号 + 1）。
4. **人工覆盖**：`wordlist-v2-overrides.json` 里可以写 drop、zh、rename、topic、grade 五类修订。

## 统计（2026-11-01 构建）
1 年级 247 · 2 年级 247 · 3 年级 235 · 4 年级 234 · 5 年级 377 · 6 年级 377，合计 1717。

## 注意
- 1–2 年级不在课标的必学范围内（课标从 3 年级开始），这里按 Starters 作为启蒙词。
- YLE、课标、PEP 都是有版权的列表，本表只用它们作为“等级信号”。对外发布前请先看 `docs/wordlist-sources.md` 的 §5。
