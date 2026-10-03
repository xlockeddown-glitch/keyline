#!/usr/bin/env node
/**
 * HUD layout smoke (0.0.47): load the game as a guest on a running dev/preview server and check the top HUD at
 * common phone sizes, phone landscape, a tablet and desktop — the status plate must be >= 200 px wide, not under
 * the top buttons or the map zoom, and desktop keeps the plate beside the button row.
 * 0.0.48: the bottom-right lamp card (at the Detroit spawn: 'Campus Martius Park / At the lamp · E or tap') and the
 * E button stay fully on screen on portrait phones (360–430 px) and desktop, the card keeps 120 px+, and the lamp
 * name stays inside the card.
 *
 *   node scripts/qa-hud-mobile.mjs http://127.0.0.1:8080 [/workspace/screenshots/prefix-]
 *
 * Exits 1 on any problem. Screenshots (optional) are written as <prefix><w>x<h>.png.
 */
import { chromium } from "playwright";
import { checkedOutputPath, checkedUrl } from "./browser-guard.mjs";
import { hudLayoutProblems } from "./hud-layout-verdict.mjs";

const base = checkedUrl(process.argv[2] ?? "http://127.0.0.1:8080");
const shotPrefix = process.argv[3] ? checkedOutputPath(process.argv[3] + "x.png", ["/workspace"]).slice(0, -5) : null;
const PHONES = [
  [360, 800],
  [390, 844],
  [414, 896],
  [430, 932],
  [844, 390],
  [667, 375],
  [768, 1024],
];
const DESKTOP = [1280, 800];

async function enterGame(page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem("keyline-save-v1"))
      localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: "detroit", howtoDone: true, tutorial: 4 }));
  });
  await page.goto(base.replace(/\/$/, "") + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".book-ver", { timeout: 120000 });
  await page.waitForTimeout(800);
  await page.click(".matchbook");
  await page.waitForTimeout(1200);
  const guest = page.getByRole("button", { name: "Continue as guest" });
  if (await guest.count()) await guest.click();
  await page.waitForSelector('[data-testid="hud-status"]', { timeout: 120000 });
  await page.waitForTimeout(2500);
}

const measure = (page) =>
  page.evaluate(() => {
    const r = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { left: b.left, top: b.top, width: b.width, height: b.height };
    };
    return {
      width: innerWidth,
      height: innerHeight,
      status: r(document.querySelector('[data-testid="hud-status"]')),
      row: r(document.querySelector(".hud-kits")),
      kits: [...document.querySelectorAll(".hud-kits .hud-plate.is-kit")].map(r),
      zoom: r(document.querySelector(".leaflet-control-zoom")),
      sight: r(document.querySelector('[data-testid="hud-sight"]')),
      sightName: r(document.querySelector('[data-testid="hud-sight"] .sight-name')),
      sightText: document.querySelector('[data-testid="hud-sight"]')?.textContent ?? "",
      act: r(document.querySelector(".hud-dock .act-btn")),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

const browser = await chromium.launch();
const problems = [];
const rows = [];
try {
  const phoneCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await phoneCtx.newPage();
  await enterGame(page);
  for (const [w, h] of PHONES) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(600);
    const m = await measure(page);
    rows.push({ size: `${w}x${h}`, statusWidth: Math.round(m.status?.width ?? 0), statusTop: Math.round(m.status?.top ?? 0), sightLeft: Math.round(m.sight?.left ?? -1), sightRight: Math.round((m.sight?.left ?? 0) + (m.sight?.width ?? 0)), sightWidth: Math.round(m.sight?.width ?? 0), sight: m.sightText.replace(/\s+/g, " ").trim().slice(0, 60) });
    // The lamp card check (0.0.48) covers portrait phones 360–430 px; phone landscape keeps the 0.0.47 checks only.
    if (w > 480) delete m.sight;
    else if (!/At the lamp/.test(m.sightText)) problems.push(`${w}x${h}: lamp card is not showing a lamp in reach ("${m.sightText.trim().slice(0, 40)}")`);
    problems.push(...hudLayoutProblems(m));
    if (shotPrefix) await page.screenshot({ path: `${shotPrefix}${w}x${h}.png` });
  }
  await phoneCtx.close();
  const deskCtx = await browser.newContext({ viewport: { width: DESKTOP[0], height: DESKTOP[1] } });
  const desk = await deskCtx.newPage();
  await enterGame(desk);
  const m = await measure(desk);
  rows.push({ size: `${DESKTOP[0]}x${DESKTOP[1]}`, statusWidth: Math.round(m.status?.width ?? 0), statusTop: Math.round(m.status?.top ?? 0), sightRight: Math.round((m.sight?.left ?? 0) + (m.sight?.width ?? 0)), sightWidth: Math.round(m.sight?.width ?? 0) });
  problems.push(...hudLayoutProblems(m, { desktop: true }));
  if (shotPrefix) await desk.screenshot({ path: `${shotPrefix}${DESKTOP[0]}x${DESKTOP[1]}.png` });
  await deskCtx.close();
} finally {
  await browser.close();
}
console.log(JSON.stringify({ ok: problems.length === 0, rows, problems }, null, 2));
process.exitCode = problems.length ? 1 : 0;
