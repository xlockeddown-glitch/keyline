// usage: node .art-shot.mjs <base> <prefix> <scout> <coat|-> 
import { chromium } from "playwright";
const [base, prefix, scout = "corgi", coatArg = "plum"] = process.argv.slice(2);
const coat = coatArg === "-" ? null : coatArg;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: "detroit", howtoDone: true, tutorial: 4 }));
});
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
await page.evaluate(async ({ scout, coat }) => {
  const { useGame } = await import("/src/game/store.ts");
  window.__qaGame = useGame;
  const w = useGame.getState().wardrobe;
  useGame.setState({ scout, scouts: [...new Set([...(useGame.getState().scouts || []), scout])], wardrobe: { ...w, owned: coat ? [...new Set([...w.owned, coat])] : w.owned, coat } });
}, { scout, coat });
await page.waitForTimeout(2500);
// zoom map in one level? keep default
const marker = page.locator(".pawn").first();
await page.screenshot({ path: `${prefix}${scout}-full.png` });
const box = await marker.boundingBox();
const clip = { x: box.x - 60, y: box.y - 60, width: box.width + 120, height: box.height + 120 };
await page.screenshot({ path: `${prefix}${scout}-idle-zoom.png`, clip });
// walk: click the map somewhere off to the right/up
await page.mouse.click(box.x + 150, box.y + 10);
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(110);
  const b = await marker.boundingBox();
  await page.screenshot({ path: `${prefix}${scout}-walk-${i}.png`, clip: { x: b.x - 60, y: b.y - 60, width: b.width + 120, height: b.height + 120 } });
}
await browser.close();
