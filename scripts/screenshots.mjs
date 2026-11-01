// Phone screenshots (390x844) of the main screens. Run `npm run build && npx vite preview` first.
// Usage: node scripts/screenshots.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const BASE = process.argv[2] || "http://localhost:5188/";
const OUT = new URL("../screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const lexicon = JSON.parse(readFileSync(new URL("../src/data/lexicon.json", import.meta.url), "utf8"));
const DAY = 86400000;

/** Demo progress: a few animal and fruit words at every growth stage, some due, five study days. */
function demoProgress(now) {
  const cards = {};
  const ids = lexicon.words.filter((w) => w.topicId === "animals" || w.topicId === "fruits").map((w) => w.id);
  const stab = [0.5, 3, 5, 9, 15, 25, 30, 40];
  ids.slice(0, 40).forEach((id, i) => {
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
  return { version: 2, datasetId: "wordsprout-v1", cards, bookmarks: [], days, typing: [], session: null, mistakes: [] };
}

// CHROMIUM_PATH lets you reuse an already-installed Chromium instead of `npx playwright install`.
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "zh-CN" });
// Headless Chromium has no speakers: pretend audio plays so no "no sound" toast covers the UI.
await ctx.addInitScript(() => {
  HTMLMediaElement.prototype.play = function () {
    setTimeout(() => this.dispatchEvent(new Event("playing")), 20);
    return Promise.resolve();
  };
});
let page = await ctx.newPage();
const shot = async (name) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}${name}.png` });
  console.log("saved", name);
};

await page.goto(BASE);
await page.getByRole("radio", { name: /三年级/ }).click();
await shot("1-onboarding-grade");
await page.getByRole("button", { name: /开始种花/ }).click();

// Seed demo progress before the app boots (the running app would overwrite it on pagehide).
await page.waitForTimeout(400);
await page.close();
await ctx.addInitScript((p) => {
  if (!localStorage.getItem("__demo_seeded")) {
    localStorage.setItem("wordsprout:progress:wordsprout-v1", p);
    localStorage.setItem("__demo_seeded", "1");
  }
}, JSON.stringify(demoProgress(Date.now())));
page = await ctx.newPage();
await page.goto(BASE + "#/");
await shot("2-today");

await page.goto(BASE + "#/garden");
await shot("3-garden");
await page.goto(BASE + "#/garden?bed=animals");
await shot("4-garden-bed");
await page.goto(BASE + "#/garden?bed=animals&w=animals.panda");
await shot("5-word-card");

await page.goto(BASE + "#/");
await page.getByRole("button", { name: /开始今天的学习|继续学习/ }).click();
for (let i = 0; i < 20 && (await page.getByRole("button", { name: /认识了/ }).count()); i++) await page.getByRole("button", { name: /认识了/ }).click();
await shot("6-practice-question");
const first = page.locator(".option").first();
if (await first.count()) {
  await first.click();
  await shot("7-practice-feedback");
}
await browser.close();
