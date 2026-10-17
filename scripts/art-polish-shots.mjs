#!/usr/bin/env node
/**
 * 0.0.81 art polish screenshots: every scout standing at the Detroit spawn at phone size (390x844 @3x), plus a
 * walk strip (8 frames, 110 ms apart, walking right) for the scouts named in WALK. Dev server only (sets the
 * scout through the store).
 *   node scripts/art-polish-shots.mjs http://127.0.0.1:8090 /workspace/screenshots/art-polish-after- [corgi,giraffe]
 */
import { chromium } from "playwright";

const [base, prefix, walkArg = "corgi,giraffe"] = process.argv.slice(2);
const SCOUTS = ["raccoon", "cat", "corgi", "fox", "lynx", "owl", "sloth", "turtle", "giraffe"];
const WALK = walkArg.split(",").filter(Boolean);
const R = 40; // css px around the 56 px pawn

async function open() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() =>
    localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: "detroit", howtoDone: true, tutorial: 4 })),
  );
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".city-blade:not([disabled])", { timeout: 120000 });
  await page.waitForTimeout(800);
  await page.click(".city-blade");
  await page.waitForTimeout(1200);
  const guest = page.getByRole("button", { name: "Continue as guest" });
  if (await guest.count()) await guest.click();
  await page.waitForSelector('[data-testid="hud-status"]', { timeout: 120000 });
  await page.waitForTimeout(800);
  const later = page.getByRole("button", { name: "Not now" });
  if (await later.count()) await later.click();
  await page.evaluate(async () => {
    const { useGame } = await import("/src/game/store.ts");
    window.__qaGame = useGame;
  });
  return { browser, page };
}

async function setScout(page, scout, coat = null) {
  await page.evaluate(
    ({ scout, coat }) => {
      const g = window.__qaGame;
      const w = g.getState().wardrobe;
      g.setState({ scout, wardrobe: { ...w, owned: coat ? [...new Set([...w.owned, coat])] : w.owned, coat } });
    },
    { scout, coat },
  );
  await page.waitForTimeout(1500);
}

const clipOf = async (page) => {
  const b = await page.locator(".pawn").first().boundingBox();
  return { x: b.x - R, y: b.y - R, width: b.width + 2 * R, height: b.height + 2 * R };
};

const { browser, page } = await open();
for (const s of SCOUTS) {
  await setScout(page, s);
  await page.screenshot({ path: `${prefix}${s}.png`, clip: await clipOf(page) });
}
await setScout(page, "corgi", "plum");
await page.screenshot({ path: `${prefix}corgi-plum.png`, clip: await clipOf(page) });
await page.screenshot({ path: `${prefix}full-corgi-plum.png` });
await browser.close();

for (const s of WALK) {
  const { browser, page } = await open();
  await setScout(page, s);
  const b = await page.locator(".pawn").first().boundingBox();
  await page.mouse.click(b.x + 170, b.y + 28);
  await page.waitForTimeout(400);
  for (let i = 0; i < 8; i++) {
    await page.screenshot({ path: `${prefix}walk-${s}-${i}.png`, clip: await clipOf(page) });
    await page.waitForTimeout(110);
  }
  await browser.close();
}
console.log("ok");
