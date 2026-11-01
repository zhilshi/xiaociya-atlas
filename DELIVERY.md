# 小词芽 WordSprout (atlas fork) — delivery notes

Branch `xiaociya` of https://github.com/zhilshi/xiaociya-atlas. It is a fork of Word Atlas 词光 (MIT) by designfuchen / Word Atlas contributors. The LICENSE file is kept, and NOTICE plus the README carry the attribution.

## Preview
- https://atlas.xiaociya.pages.dev (branch alias). This deploy's URL is https://fb4a01fa.xiaociya.pages.dev.
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

## How to run
`npm install && npm run dev`, then `npm test`, `npm run build`, and `npm run screenshots` (after `npx vite preview`). The README has the details.

## Test and build summary (2026-11-01)
- `npm test`: **35 tests, 35 passed, 0 failed**. The suites cover lexicon/bands, grade config, settings migration and validation, garden stage boundaries, the FSRS interval cap, session/quiz kinds, and the audio fallback order.
- `npm run build` (tsc + vite) passes. `dist/` has **7 files, about 473 KB** (JS 432 KB / gzip 109 KB).
- Screenshots: `screenshots/1-onboarding-grade.png … 7-practice-feedback.png`, 7 files, about 920 KB in total, taken at 390×844 in Playwright Chromium with demo progress seeded.

## Known gaps
- Only 395 words, and band 3 (grades 5–6) is thin at 32 words. There are no example sentences or phonics yet.
- Pronunciation depends on the device voice or online TTS. Offline phones without an English voice have no audio. TTS endpoints are third-party and unofficial.
- Not yet checked on real iOS or Android hardware: audio, the PWA install, and the safe areas.
- The screenshots stub audio playback, because headless Chromium has no speakers.
- There is no parent area or cloud backup. Progress lives in this browser's localStorage only, apart from manual export/import.
- The Playwright browser version is pinned by the lockfile. On this box the screenshots used a pre-installed Chromium via `CHROMIUM_PATH`.

## Next milestones
1. Grow the curriculum to about 1200 words layered by grade and aligned with PEP/外研 textbooks, with example sentences.
2. Record human audio (US/UK) and serve it from R2 with offline caching.
3. Add a parent area: a PIN gate, progress report, daily goal and time limits.
4. Backup and sync: QR or file transfer between devices, and optional cloud backup.
5. Real-device QA for audio and PWA on iOS Safari and Android WeChat/Chrome, then promote to production.
