# 小词芽 WordSprout (atlas fork) — delivery notes

Branch `xiaociya` of https://github.com/zhilshi/xiaociya-atlas. It is a fork of Word Atlas 词光 (MIT) by designfuchen / Word Atlas contributors. The LICENSE file is kept, and NOTICE plus the README carry the attribution.

## Preview
- https://atlas.xiaociya.pages.dev (branch alias). The v2 deploy URL is https://91956272.xiaociya.pages.dev (build `index-rS5GiHmh.js`).
- Both return HTTP 200 with `<title>小词芽 WordSprout · 小学英语单词花园</title>`.
- This is a Cloudflare Pages **preview** deploy (`--branch=atlas`). The production deployment of project `xiaociya` was not touched and still serves the old standalone app.

## What changed
1. **Rebrand.** The name is now 小词芽 WordSprout. It uses a light, white, minimal theme only (the dark theme and its toggle were removed). The new sprout logo, manifest, favicon and icons are in place. The UI is Simplified Chinese with no account and local-only data. An About page carries the attribution and privacy note.
2. **Content.**
   - The IELTS list and its mp3s were removed.
   - `src/data/lexicon.json` holds 395 words in 10 topics, with emoji pictures.
   - Grade bands: level 1 → band 1 (grades 1–2, 219 words, including grandfather and grandmother pulled down); level 2 → band 2 (grades 3–4, 144 words); level 3 → band 3 (grades 5–6, 32 words). The README documents this.
3. **Grade onboarding.**
   - On first launch the child picks grade 1–6. Settings are now schema 3 and include `grade` and `onboarded`.
   - Older or invalid settings are migrated, with onboarding re-shown when no valid grade exists.
   - The grade drives daily new words (5/8/10), question types (band 1: listen/picture; band 2: + meaning + letter tiles; band 3: + typed spelling), the FSRS max interval (30/60/180 days), learning steps, the "slow answer" threshold and the UI scale.
   - It can be changed later in 我的.
4. **单词花园 (word garden).**
   - Each topic is a flower bed. Plants grow 🌰 → 🌱 → 🌿 → 🌷 → 🍎 according to FSRS stability (<7, 7–21, ≥21 days).
   - Due words show 💧, and a "water" button practises them. A bed earns 🏅 when every plant bears fruit.
   - The Today page shows a weekly sticker strip and a garden summary.
5. **Phone audio.**
   - Audio is unlocked on the first `pointerdown`, and speech starts synchronously inside the tap.
   - Fallback order: device English speechSynthesis voice → Youdao dictvoice (type=2 US / type=1 UK, per the accent setting) → Google translate_tts.
   - Playback counts as successful 1.5 s after `playing`. If every option fails, the child sees one friendly toast. No audio files are bundled.
6. **Other.**
   - WebAudio sound cues (can be switched off).
   - Practice modes: mistakes, recent words, or a chosen bed.
   - JSON backup export and import.
   - The service worker was renamed `wordsprout-v1`.

## v2 — 1,717-word grade 1–6 lexicon + Word Atlas media (2026-11-01)

### Lexicon
- `data/wordlist-v2.csv` → `src/data/lexicon-v2.json` (packed rows; `npm run data`). Total 1717, per grade 247/247/235/234/377/377. A test checks the CSV counts and that the bundled JSON is fresh.
- **Stable ids.** v1's 395 words keep their ids (e.g. `animals.dog`). New words use `w.<word>`. 8 v1 plural or duplicate ids alias to their v2 headword (e.g. `fruits.orange → colors.orange`, `body.eyes → body.eye`). `pray` has no v2 counterpart and is retired.
- **Migration** (`src/store/migrate.ts`). On first load of dataset `wordsprout-v2`, progress under `wordsprout:progress:wordsprout-v1` is remapped through the aliases:
  - When two old ids collapse into one, the stronger FSRS card is kept.
  - Bookmarks and mistakes are deduped. Day stats and typing stats are kept. An in-flight session is dropped.
  - The v1 key is left untouched for rollback.
  - v1 JSON backups import through the same path.
  - Settings move to schema 4 (adds `advanced` and `gardenGrade`).
- **46 topics, 8–60 words each**, each with an emoji and a Chinese name: 打招呼 32, 家人朋友 49, 身体 37, 颜色形状 34, 数字 58, 水果 21, 宠物农场 28, 野生动物 37, 鸟儿虫子海洋 36, 学校 32, 文具 18, 玩具童话 28, 衣服 37, 我的家 49, 一日三餐 48, 零食饮料 39, 蔬菜 19, 厨房餐桌 20, 天气 24, 大自然 46, 交通出行 54, 城市地点 57, 运动 45, 音乐爱好 34, 节日旅行 24, 职业 36, 星期月份 34, 时间 41, 心情 41, 看病健康 24, 买东西 19, 生活用品 46, 动一动 59, 一天的生活 49, 读读写写 48, 大小快慢 30, 好不好 39, 什么样的人 35, 什么样子 29, 在哪里 51, 问一问 13, 我你他 42, 常用动词 39, 想一想说一说 49, 怎么做 37, 小小词 50.
- **Pictures:**
  - 1355 words use a Word Atlas illustration.
  - 1611 have an illustration or emoji.
  - 17 more use a glyph (numbers or letters).
  - 89 get a big-letter + 中文 gloss card.
  - Unlearned seeds are an SVG soil mound. 🌰 appears only for the word "chestnut".

### Per-grade behaviour
- New words come from the chosen grade first, then lower grades (nearest first), then higher grades. Due reviews from every grade are always included. The grade can be switched in 我的.
- New words per day: 5 (G1–2), 8 (G3–4), 10 (G5–6).
- Spelling: none for G1–2, letter tiles for G3–4, typing for G5–6.
- Quiz distractors prefer the same grade or band and the same "has a picture" state.
- **Garden:**
  - Grade filter chips: 本年级, 1–6, 全部.
  - Growing beds show as cards.
  - 还没种 beds and 🏅 finished beds are collapsed into big-chip lists.
  - Bed detail is filtered by grade.

### Word Atlas reuse (CC BY 4.0, upstream 19a9bd88; `scripts/import_word_atlas.py`)
- 1399 of 1717 words matched upstream:
  - **Images:** 1355 (256px WebP thumbs).
  - **Audio:** 1398 words with UK+US mp3.
  - **Examples:** kid-safe core examples on 1068 words (1100 sentences); any example on 1398 words.
  - **进阶 tier:** 1399 words (1606 extension examples).
- **Core vs extension.** `public/wa/entries/g<grade>.json` stores `core` (kid examples flagged `kid:true`, grade-limited: G1–2 one short sentence and no collocations) separately from `ext` (other senses, extra examples, collocations, word family, synonyms/antonyms, tips).
  - The 进阶扩展 switch in 我的 defaults on for G5–6 and off for G1–4.
  - When on, the tier is still collapsed inside a `<details>` on the word card.
  - Tests assert that kid mode never renders `data-tier="ext"` content.
- **Unsafe content is dropped, not toggled** (the safer option): 92 examples and 29 collocations matching violence, adult, substance or crime filters are deleted at import, so they exist in no tier.
- 44 words whose upstream sense differs from the school meaning (e.g. bear = 忍受) get no upstream picture, and their examples go to ext only.
- **Not copied:** upstream example-sentence audio (it would break the file budget). Examples are read by device TTS.
- **Loading and caching.**
  - Media loads lazily.
  - The SW serves `/wa/thumb|uk|us/` cache-first from `wordsprout-media-1`, capped at 3000 entries and kept across app version bumps.
  - 我的 → 离线包 pre-downloads the current grade.
  - Media is in git: about 37 MB, under the 80 MB growth limit.
- **Ported upstream features:**
  - Recorded UK/US audio, played first, before the existing TTS fallback.
  - IPA for G3+.
  - Example sentences and collocations.
  - The SW media cache.
  - The offline download pack.
  - The 关于/致谢 page.
  - Accent setting.
  - Backup/export, now migrating v1.
- **Skipped upstream features:**
  - Galaxy star map: the garden replaces it.
  - Share cards: social posting is not suitable for kids.
  - Separate typing trainer: G5–6 typing spelling already covers it.
  - ⌘K search and keyboard shortcuts: the app is phone-first.
  - IELTS copy and onboarding: adult-oriented.
  - Example audio: file budget.
- **Attribution:**
  - The NOTICE file says "Word Atlas contributors — CC BY 4.0", links the licence and lists the modifications.
  - The README and the in-app 关于 · 致谢 page carry the same credit.
  - The MIT LICENSE is kept.
- **Word-list attribution** (README and NOTICE, per `data/ATTRIBUTION.md`):
  - The CEFR-J 1.5 citation.
  - NGSL/FrequencyWords ranks are CC BY-SA 4.0. They live only in the repo CSV, with attribution, and are not bundled into the app.
  - ECDICT is MIT.
  - YLE, 课标 and PEP were used as level signals only.

### v2 build and test
- `npm test`: 57 tests, 57 passed, 0 failed (counts, freshness, id stability and aliases, migration, grade filtering, topic coverage, no-chestnut, kid mode never renders extension content, audio order).
- dist: 4164 files, about 36 MB (limits: 5000 files and 60 MB). JS is 443 KB (gzip 145 KB).
- Screenshots (390×844, grade 3 demo): `screenshots/1-onboarding-grade, 2-today, 3-garden, 4-garden-bed, 5-word-card, 6-practice-question, 7-practice-feedback`.

## How to run
`npm install && npm run dev`, then `npm test`, `npm run build`, and `npm run screenshots` (after `npx vite preview`). The README has the details.

## Test and build summary (v1, superseded by v2 above)
- `npm test`: **35 tests, 35 passed, 0 failed**. The suites cover lexicon/bands, grade config, settings migration and validation, garden stage boundaries, the FSRS interval cap, session/quiz kinds, and the audio fallback order.
- `npm run build` (tsc + vite) passes. `dist/` has **7 files, about 473 KB** (JS 432 KB / gzip 109 KB).
- Screenshots: `screenshots/1-onboarding-grade.png … 7-practice-feedback.png`, 7 files, about 920 KB in total, taken at 390×844 in Playwright Chromium with demo progress seeded.

## Known gaps
- 318 words (mostly function words) have no Word Atlas entry. They use emoji, glyph or gloss cards with TTS audio.
- G1–2 have few kid-safe core examples (51 and 58 words), because upstream sentences are mostly too long for that age.
- There are no phonics yet.
- Offline phones without an English voice still lack audio for words without recordings. TTS endpoints are third-party and unofficial.
- Not yet checked on real iOS or Android hardware: audio, the PWA install, and the safe areas.
- The screenshots stub audio playback, because headless Chromium has no speakers.
- There is no parent area or cloud backup. Progress lives in this browser's localStorage only, apart from manual export/import.
- The Playwright browser version is pinned by the lockfile. On this box the screenshots used a pre-installed Chromium via `CHROMIUM_PATH`.

## Next milestones
1. Write short G1–2 example sentences and record audio for the 318 uncovered words.
2. Move media to R2 if the repo or dist budget gets tight.
3. Add a parent area: a PIN gate, progress report, daily goal and time limits.
4. Backup and sync: QR or file transfer between devices, and optional cloud backup.
5. Real-device QA for audio and PWA on iOS Safari and Android WeChat/Chrome, then promote to production.
