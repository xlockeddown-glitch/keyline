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
 * 0.0.57: the inventory sheets at 390x844, 375x667, 360x740 and 430x932 — Satchel, the four Journal tabs (top and
 * scrolled to the bottom), the Outfitter's Hire and Print shop counters (dev server only: opened from the store)
 * and the lamp card — checked by inventory-layout-verdict.mjs: no sideways page scroll, sheet inside the screen, no
 * control off the side or unreachable below the fold, no overlapping buttons, no clipped button text or squashed tap
 * targets, tab rows that fit, and nothing from the map (the +/- zoom) drawn over the sheet.
 *
 * Exits 1 on any problem. Screenshots (optional) are written as <prefix><w>x<h>.png.
 */
import { chromium } from "playwright";
import { checkedOutputPath, checkedUrl } from "./browser-guard.mjs";
import { hudLayoutProblems } from "./hud-layout-verdict.mjs";
import { inventoryProblems, measureOpenPanel } from "./inventory-layout-verdict.mjs";

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
const INVENTORY_SIZES = [
  [390, 844],
  [375, 667],
  [360, 740],
  [430, 932],
];

/** 0.0.57: every inventory-like sheet at each phone size. Returns problem strings; screenshots like the HUD ones. */
async function inventorySweep(page) {
  const out = [];
  const storeReady = await page
    .evaluate(async () => {
      try {
        const { useGame } = await import("/src/game/store.ts");
        window.__qaGame = useGame;
        return true;
      } catch {
        return false;
      }
    })
    .catch(() => false);
  const closeAll = async () => {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    if (storeReady)
      await page.evaluate(() => {
        const s = window.__qaGame.getState();
        s.toggleHq(false);
        s.toggleInv(false);
        s.closeShop();
        s.closeVault();
      });
    await page.waitForTimeout(200);
  };
  const scroll = (where) =>
    page.evaluate((where) => {
      for (const e of document.querySelectorAll(".panel, .panel *")) {
        const cs = getComputedStyle(e);
        if ((cs.overflowY === "auto" || cs.overflowY === "scroll") && e.scrollHeight > e.clientHeight + 1) e.scrollTop = where === "bottom" ? e.scrollHeight : 0;
      }
    }, where);
  const check = async (label, w, h, sel) => {
    await page.waitForTimeout(400);
    const m = await page.evaluate(measureOpenPanel, sel ?? null);
    out.push(...inventoryProblems(`${w}x${h} ${label}`, m));
    if (shotPrefix) await page.screenshot({ path: `${shotPrefix}inv-${label}-${w}x${h}.png` });
  };
  for (const [w, h] of INVENTORY_SIZES) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(500);
    await closeAll();
    await page.getByRole("button", { name: "Open satchel" }).first().click({ timeout: 5000 }).catch(() => {});
    await check("satchel", w, h);
    await closeAll();
    for (const tab of ["Places", "Supplies", "Progress", "Leaderboard"]) {
      if (!(await page.locator(".hq-tabs").count())) await page.locator('[aria-label^="Open Journal"]').first().click({ timeout: 5000 }).catch(() => {});
      await page.locator(".hq-tabs [role=tab]", { hasText: tab }).first().click({ timeout: 5000 }).catch(() => {});
      await scroll("top");
      await check(`journal-${tab.toLowerCase()}`, w, h);
      await scroll("bottom");
      await check(`journal-${tab.toLowerCase()}-bottom`, w, h);
    }
    await closeAll();
    if (storeReady) {
      for (const [id, label] of [
        ["hire", "Hire"],
        ["print", "Print shop"],
      ]) {
        await page.evaluate(() => window.__qaGame.setState({ shopOpen: true }));
        await page.waitForTimeout(250);
        await page.locator(".shop-tabs [role=tab]", { hasText: label }).first().click({ timeout: 5000 }).catch(() => {});
        await scroll("top");
        await check(`outfitter-${id}`, w, h);
        await scroll("bottom");
        await check(`outfitter-${id}-bottom`, w, h);
      }
      await closeAll();
    }
    const act = page.locator(".hud-dock .act-btn").first();
    if (await act.count()) {
      await act.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
      if (await page.locator(".vault-night").count()) await check("lamp-card", w, h, ".vault-night");
      else out.push(`${w}x${h} lamp-card: the lamp at the spawn did not open`);
      await closeAll();
    }
  }
  return out;
}

async function enterGame(page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem("keyline-save-v1"))
      localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: "detroit", howtoDone: true, tutorial: 4 }));
  });
  await page.goto(base.replace(/\/$/, "") + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".book-ver", { timeout: 120000 });
  // The server-rendered matchbook is disabled until the client hydrates; a cold dev server can take a while.
  await page.waitForSelector(".matchbook:not([disabled])", { timeout: 120000 });
  await page.waitForTimeout(800);
  await page.click(".matchbook", { timeout: 60000 });
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
  const inv = await inventorySweep(page);
  rows.push({ size: "inventory", sheets: INVENTORY_SIZES.length, problems: inv.length });
  problems.push(...inv);
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
