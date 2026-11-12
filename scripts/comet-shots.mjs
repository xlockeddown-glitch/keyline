#!/usr/bin/env node
/**
 * 0.1.159 Comet vault QA shots from the RUNNING dev game: 390x844 @3x, a seeded guest on a local save, the comet
 * window forced with the dev clock (`?comet=open|cooling|locked`, `window.__keylineClock`). Never signs in and never
 * presses Buy / Pay / Claim. Dev server only (the answer lookup imports the bank module from the dev server).
 *   node scripts/comet-shots.mjs http://127.0.0.1:8092 shots/comet
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const [base = "http://127.0.0.1:8092", out = "shots/comet"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const CITY = process.env.COMET_CITY ?? "austin";
const errors = [];

async function open(state) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${state}: pageerror ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${state}: console ${m.text()}`);
  });
  await page.addInitScript((city) => {
    localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: city, howtoDone: true, tutorial: 4 }));
  }, CITY);
  await page.goto(`${base}/?comet=${state}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".city-blade:not([disabled])", { timeout: 120000 });
  await page.waitForTimeout(800);
  await page.click(".city-blade");
  await page.waitForTimeout(1200);
  const guest = page.getByRole("button", { name: "Continue as guest" });
  if (await guest.count()) await guest.click();
  await page.waitForSelector('[data-testid="hud-status"]', { timeout: 120000 });
  await page.waitForTimeout(1000);
  for (const name of ["Not now", "Close", "Got it"]) {
    const b = page.getByRole("button", { name, exact: true });
    if (await b.count()) await b.first().click().catch(() => {});
  }
  await page.evaluate(() => {
    // The app's own store (dev handle), not a second module copy.
    const useGame = window.__keyline;
    window.__qaGame = useGame;
    // Seed the local guest pocket: three green keys (no server, no account).
    const s = useGame.getState();
    useGame.setState({ keys: { ...s.keys, green: Math.max(3, s.keys.green ?? 0) } });
  });
  // Label every in-game shot (a screenshot annotation, not game UI).
  await page.evaluate((st) => {
    const tag = document.createElement("div");
    tag.textContent = `seeded guest · local save · dev clock: comet ${st}`;
    tag.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;font:600 10px system-ui;color:#f3efe6;background:#1a1410cc;border:1px solid #c9a35e;border-radius:999px;padding:3px 8px;pointer-events:none";
    tag.id = "qa-tag";
    document.body.appendChild(tag);
  }, state);
  return { browser, page };
}

async function standNearComet(page, zoom = 17) {
  const c = await page.evaluate(() => window.__keylineMap.comet());
  if (!c) throw new Error("no comet open on the dev clock");
  await page.evaluate(
    ({ c, zoom }) => {
      const m = window.__keylineMap;
      m.place(c.lat - 0.00025, c.lng - 0.0002);
      m.map().setView([c.lat - 0.0002, c.lng], zoom, { animate: false });
    },
    { c, zoom },
  );
  await page.waitForTimeout(2500);
  await clearPops(page);
  return c;
}

/** Street key caches and their "Key cache!" pop are not this slice; clear them so the comet is in view. */
async function clearPops(page) {
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.__qaGame.setState({ matchPop: null, toast: null }));
    await page.waitForTimeout(400);
  }
}

const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });

async function hudShot(page, name) {
  const el = page.locator('[data-testid="comet-hud"]').first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (!box) throw new Error("no comet HUD line");
  await page.screenshot({ path: `${out}/${name}.png`, clip: { x: 0, y: Math.max(0, box.y - 90), width: 390, height: Math.min(844, box.height + 140) } });
  return (await el.textContent())?.trim();
}

const notes = {};

// 1. Open: default zoom, zoomed in, the HUD line; then a clear (quiz + reward).
{
  const { browser, page } = await open("open");
  const c = await standNearComet(page, 17);
  await shot(page, "01-map-open-default");
  notes.hudOpen = await hudShot(page, "05-hud-open");
  await page.evaluate((c) => window.__keylineMap.map().setView([c.lat, c.lng], 19, { animate: false }), c);
  await page.waitForTimeout(2000);
  await clearPops(page);
  await shot(page, "02-map-open-zoom");
  const pin = page.locator(".comet-pin").first();
  const pinBox = await pin.boundingBox();
  if (pinBox) await page.screenshot({ path: `${out}/02b-pin-open-crop.png`, clip: { x: Math.max(0, pinBox.x - 40), y: Math.max(0, pinBox.y - 40), width: pinBox.width + 80, height: pinBox.height + 80 } });
  // Walk up (stand on it) and open it the way a tap does.
  await page.evaluate((c) => {
    window.__keylineMap.stand(c.lat, c.lng);
    window.__keylineMap.map().setView([c.lat, c.lng], 18, { animate: false });
  }, c);
  await page.waitForTimeout(1200);
  const msg = await page.evaluate((id) => {
    const g = window.__qaGame;
    const s = g.getState();
    g.setState({ keys: { ...s.keys, green: Math.max(3, s.keys.green ?? 0) } }); // the seeded guest's green keys
    return s.tryOpen(id, performance.now());
  }, c.id);
  if (msg) throw new Error(`tryOpen: ${msg}`);
  await page.waitForTimeout(800);
  if (process.env.COMET_DEBUG) {
    await page.screenshot({ path: `${out}/debug-open.png` });
    console.log(await page.evaluate(() => JSON.stringify({ ov: window.__qaGame.getState().openVault, keys: window.__qaGame.getState().keys })));
  }
  await page.locator('[data-testid="field-random"]').click({ timeout: 15000 });
  await page.waitForFunction(() => Boolean(window.__qaGame.getState().openVault?.question), null, { timeout: 30000 });
  await page.waitForTimeout(600);
  await shot(page, "06-clear-quiz");
  const q = await page.evaluate(() => window.__qaGame.getState().openVault.question);
  const answer = await page.evaluate(async (q) => {
    const { everyCard } = await import("/src/game/trivia.ts");
    const hit = everyCard().find((x) => x.q === q.q && [...x.choices].sort().join("|") === [...q.choices].sort().join("|"));
    return hit?.answer ?? null;
  }, q);
  if (!answer) throw new Error("answer lookup failed");
  await page.locator(".plate-choices button", { hasText: answer }).first().click();
  await page.waitForFunction(() => Boolean(window.__qaGame.getState().loot || window.__qaGame.getState().miss), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await shot(page, "07-clear-reward");
  notes.loot = await page.evaluate(() => window.__qaGame.getState().loot);
  // Close the reward and look at the cleared pin + HUD (cooling, until the window ends).
  for (const name of ["Continue", "Close", "Done", "OK", "Nice"]) {
    const b = page.getByRole("button", { name, exact: true });
    if (await b.count()) {
      await b.first().click().catch(() => {});
      break;
    }
  }
  await page.evaluate(() => window.__qaGame.setState({ loot: null, miss: null, openVault: null }));
  // The day's first answer opens the morning crate (not this slice): close its card.
  await page.waitForTimeout(2500);
  // …and the Daily Blitz nudge that follows it (not this slice either).
  for (let i = 0; i < 4; i++) {
    for (const name of ["Nice", "Later"]) {
      const b = page.getByRole("button", { name, exact: true });
      if (await b.count()) await b.first().click().catch(() => {});
    }
    await page.waitForTimeout(600);
  }
  await page.evaluate((c) => {
    window.__keylineMap.place(c.lat - 0.00025, c.lng - 0.0002);
    window.__keylineMap.map().setView([c.lat - 0.0002, c.lng], 18, { animate: false });
  }, c);
  await page.waitForTimeout(6000);
  await clearPops(page);
  await shot(page, "08-after-clear-cooling");
  notes.hudCleared = await hudShot(page, "08b-hud-cleared");
  // The window closed: no pin, and the next-comet line.
  await page.evaluate(async () => {
    const ev = await import("/src/game/eventVault.ts"); // pure functions only, so a second copy is harmless
    const end = ev.cometWindowEnd(window.__keylineMap.comet().id);
    window.__keylineClock(end + 4 * 3600_000 + 30 * 60_000); // 1 h 10 before the next one
  });
  await page.waitForTimeout(6500);
  await clearPops(page);
  for (const name of ["Nice", "Later"]) {
    const b = page.getByRole("button", { name, exact: true });
    if (await b.count()) await b.first().click().catch(() => {});
  }
  notes.hudNext = await hudShot(page, "09-hud-next-comet");
  await shot(page, "09b-map-closed");
  await page.evaluate(() => window.__keylineClock(null));
  await browser.close();
}

// 2. Cooling and locked, fresh guests (forced on the dev clock).
for (const [state, n] of [["cooling", "03"], ["locked", "04"]]) {
  const { browser, page } = await open(state);
  const c = await standNearComet(page, 18);
  await shot(page, `${n}-map-${state}`);
  const pin = page.locator(".comet-pin").first();
  const box = await pin.boundingBox();
  if (box) await page.screenshot({ path: `${out}/${n}b-pin-${state}-crop.png`, clip: { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 40), width: box.width + 80, height: box.height + 80 } });
  notes[`hud_${state}`] = await hudShot(page, `${n}c-hud-${state}`);
  notes[`pin_${state}`] = await pin.evaluate((el) => el.outerHTML);
  void c;
  await browser.close();
}

writeFileSync(`${out}/shots.json`, JSON.stringify({ notes, errors }, null, 2));
console.log(JSON.stringify({ notes, errors }, null, 2));
