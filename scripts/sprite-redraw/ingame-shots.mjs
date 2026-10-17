#!/usr/bin/env node
/**
 * In-game review shots for a redrawn scout at phone size (390x844 @3x) on the dev server:
 * standing in its own coat, a print-shop coat and a dye, then 8-frame walk strips (right and toward the camera).
 *   node scripts/sprite-redraw/ingame-shots.mjs http://127.0.0.1:8092 /workspace/screenshots/turtle-redraw-ingame- turtle
 * Writes <prefix>stand.png (three coats side by side), <prefix>walk-right.png, <prefix>walk-down.png.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";

const [base, prefix, scout = "turtle"] = process.argv.slice(2);
const R = 40;

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

async function wear(page, coat, dye) {
  await page.evaluate(
    ({ scout, coat, dye }) => {
      const g = window.__qaGame;
      const s = g.getState();
      g.setState({
        scout,
        wardrobe: { ...s.wardrobe, owned: coat ? [...new Set([...s.wardrobe.owned, coat])] : s.wardrobe.owned, coat },
        paints: { ...s.paints, wornCoat: dye },
      });
    },
    { scout, coat, dye },
  );
  await page.waitForTimeout(2500); // the browser mixes coats from the mask
}

const clipOf = async (page) => {
  const b = await page.locator(".pawn").first().boundingBox();
  return { x: b.x - R, y: b.y - R, width: b.width + 2 * R, height: b.height + 2 * R };
};

const shots = [];
{
  const { browser, page } = await open();
  for (const [name, coat, dye] of [["own", null, null], ["plum", "plum", null], ["dye-green", null, "green"]]) {
    await wear(page, coat, dye);
    const p = `${prefix}stand-${name}.png`;
    await page.screenshot({ path: p, clip: await clipOf(page) });
    shots.push(p);
  }
  await page.screenshot({ path: `${prefix}full.png` });
  await browser.close();
}
for (const [dir, dx, dy] of [["right", 170, 28], ["down", 28, 260]]) {
  const { browser, page } = await open();
  await wear(page, null, null);
  const b = await page.locator(".pawn").first().boundingBox();
  await page.mouse.click(b.x + dx, b.y + dy);
  await page.waitForTimeout(400);
  for (let i = 0; i < 8; i++) {
    await page.screenshot({ path: `${prefix}walk-${dir}-${i}.png`, clip: await clipOf(page) });
    await page.waitForTimeout(55);
  }
  await browser.close();
}
// Stitch: stand row, walk rows.
execFileSync("python3", ["-c", `
from PIL import Image
p = ${JSON.stringify(prefix)}
def row(paths, out):
    ims = [Image.open(x) for x in paths]
    w = sum(i.width for i in ims); h = max(i.height for i in ims)
    o = Image.new("RGB", (w, h))
    x = 0
    for i in ims:
        o.paste(i, (x, 0)); x += i.width
    o.save(out)
row([p + "stand-" + n + ".png" for n in ("own", "plum", "dye-green")], p + "stand.png")
for d in ("right", "down"):
    row([p + "walk-" + d + "-" + str(i) + ".png" for i in range(8)], p + "walk-" + d + ".png")
`]);
console.log("ok");
