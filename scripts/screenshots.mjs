// Phone screenshots (390x844) of the main screens. Run `npm run build && npx vite preview` first.
// Usage: node scripts/screenshots.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:5188/";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const lexicon = JSON.parse(readFileSync(new URL("../src/data/lexicon-v2.json", import.meta.url), "utf8"));
// Packed rows: [id, en, zh, pos, grade, topicIndex, emoji, glyph, waStem, waFlags]
const words = lexicon.words.map(([id, en, , , grade, t, , , , flags]) => ({ id, en, grade, topic: lexicon.topics[t].id, flags }));
const GRADE = 3;
const CHILD_A = "demo-child-dou";
const CHILD_B = "demo-child-ya";
// Demo garden: grade-3 nature/weather/places beds partly grown, plus some grade 1–2 words to review.
const DEMO_TOPICS = ["nature", "weather", "places", "family", "feelings"];
const demoIds = [
  ...DEMO_TOPICS.flatMap((t) => words.filter((w) => w.grade === GRADE && w.topic === t).slice(0, 7)),
  ...words.filter((w) => w.grade < GRADE && DEMO_TOPICS.includes(w.topic)).slice(0, 14),
].map((w) => w.id);
const bedCount = (t) => demoIds.filter((id) => words.find((w) => w.id === id).topic === t).length;
const BED = bedCount("nature") ? "nature" : DEMO_TOPICS.slice().sort((a, b) => bedCount(b) - bedCount(a))[0];
// Word card: a grade-3 word in that bed with a Word Atlas picture and kid examples.
const CARD = words.find((w) => w.topic === BED && w.grade === GRADE && (w.flags & 5) === 5) ?? words.find((w) => w.topic === BED);
const DAY = 86400000;

/** Demo progress: a few animal and fruit words at every growth stage, some due, five study days. */
function demoProgress(now) {
  const cards = {};
  const ids = demoIds;
  const stab = [0.5, 3, 5, 9, 15, 25, 30, 40];
  ids.forEach((id, i) => {
    const s = stab[i % stab.length];
    const st = i % 9 === 0 ? 1 : 2;
    const due = i % 5 === 0 ? now - DAY : now + s * DAY;
    cards[id] = { due, s, d: 5, el: 1, sd: Math.round(s), ls: 0, reps: 3, lapses: 0, st, last: now - DAY, seen: now - 10 * DAY };
  });
  const days = {};
  for (const back of [0, 1, 2, 4, 5]) {
    const d = new Date(now - back * DAY);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days[k] = { n: 3, r: 8, c: 7, t: 300 };
  }
  return { version: 2, datasetId: "wordsprout-v2", cards, bookmarks: [], days, typing: [], session: null, mistakes: [] };
}

const launchOpts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
const browser = await chromium.launch(launchOpts);

async function newCtx(seedDemo) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "zh-CN" });
  await ctx.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      setTimeout(() => this.dispatchEvent(new Event("playing")), 20);
      return Promise.resolve();
    };
  });
  if (seedDemo) {
    const progressJson = JSON.stringify(demoProgress(Date.now()));
    await ctx.addInitScript(
      ({ progressJson, CHILD_A, CHILD_B }) => {
        if (localStorage.getItem("__demo_seeded")) return;
        const profiles = {
          version: 1,
          activeId: CHILD_A,
          children: [
            { id: CHILD_A, name: "豆豆", createdAt: 1, grade: 3, dailyNew: 8, advanced: false, gardenGrade: 0, onboarded: true },
            { id: CHILD_B, name: "芽芽", createdAt: 2, grade: 1, dailyNew: 5, advanced: false, gardenGrade: 0, onboarded: true },
          ],
        };
        const device = { schema: 5, accent: "us", autoplay: true, retention: 0.9, sfx: true };
        const empty = { version: 2, datasetId: "wordsprout-v2", cards: {}, bookmarks: [], days: {}, typing: [], session: null, mistakes: [] };
        localStorage.setItem("wordsprout:profiles", JSON.stringify(profiles));
        localStorage.setItem("wordsprout:device", JSON.stringify(device));
        localStorage.setItem(`wordsprout:progress:${CHILD_A}:wordsprout-v2`, progressJson);
        localStorage.setItem(`wordsprout:progress:${CHILD_B}:wordsprout-v2`, JSON.stringify(empty));
        localStorage.setItem("__demo_seeded", "1");
      },
      { progressJson, CHILD_A, CHILD_B },
    );
  }
  return ctx;
}

const shot = async (page, name) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}${name}.png` });
  console.log("saved", name);
};

// 1) Onboarding (fresh install)
{
  const ctx = await newCtx(false);
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.locator(".name-input").fill("豆豆");
  await page.getByRole("radio", { name: /三年级/ }).click();
  await shot(page, "1-onboarding-grade");
  await ctx.close();
}

// 2–8) Seeded multi-kid demo
{
  const ctx = await newCtx(true);
  const page = await ctx.newPage();
  await page.goto(BASE + "#/");
  await shot(page, "2-today");

  await page.goto(BASE + "#/garden");
  await shot(page, "3-garden");
  await page.goto(BASE + `#/garden?bed=${BED}`);
  await shot(page, "4-garden-bed");
  await page.goto(BASE + `#/garden?bed=${BED}&w=${CARD.id}`);
  await page.waitForSelector(".word-extras, .word-card", { timeout: 5000 });
  await page.waitForTimeout(800);
  await shot(page, "5-word-card");
  console.log("bed", BED, "card", CARD.id);

  await page.goto(BASE + "#/");
  await page.getByRole("button", { name: /开始今天的学习|继续学习/ }).click();
  for (let i = 0; i < 20 && (await page.getByRole("button", { name: /认识了/ }).count()); i++) await page.getByRole("button", { name: /认识了/ }).click();
  await page.waitForTimeout(600);
  await shot(page, "6-practice-question");
  const first = page.locator(".option").first();
  if (await first.count()) {
    await first.click();
    await shot(page, "7-practice-feedback");
  }

  await page.goto(BASE + "#/me");
  await page.waitForSelector(".kids-list", { timeout: 5000 });
  await shot(page, "8-kids-switch");
  await ctx.close();
}

await browser.close();
