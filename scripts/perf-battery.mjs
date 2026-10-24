#!/usr/bin/env node
/** Battery profile: 390x844, 4x CPU throttle; idle / walking / lamp card open. node scripts/perf-battery.mjs URL SECS [shot.png] */
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:8093";
const SECS = Number(process.argv[3] ?? 30);
const shot = process.argv[4];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  if (!localStorage.getItem("keyline-save-v1"))
    localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: "detroit", howtoDone: true, tutorial: 4 }));
  window.__fr = 0; const loop = () => { window.__fr++; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  window.__timers = 0; const si = window.setInterval; window.setInterval = function (...a) { window.__timers++; return si.apply(this, a); };
});
let reqs = 0; page.on("request", () => reqs++);
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".city-blade:not([disabled])", { timeout: 120000 });
await page.waitForTimeout(800);
await page.click(".city-blade");
await page.waitForTimeout(1200);
const guest = page.getByRole("button", { name: "Continue as guest" });
if (await guest.count()) await guest.click();
await page.waitForSelector('[data-testid="hud-status"]', { timeout: 120000 });
await page.waitForTimeout(1500);
for (const n of ["Not now", "Later", "Close"]) { const b = page.getByRole("button", { name: n }); if (await b.count()) await b.first().click().catch(() => {}); }
await page.waitForTimeout(Number(process.env.WARM ?? 4000));
console.log("hud:", (await page.locator('[data-testid="hud-status"]').textContent())?.slice(0, 120));
if (shot) await page.screenshot({ path: shot });
if (process.env.EXP_CSS) await page.addStyleTag({ content: process.env.EXP_CSS });
if (process.env.EXP === "noanim") await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
const cdp = await ctx.newCDPSession(page);
await cdp.send("Performance.enable");
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
// count real paints/layer commits via the compositor: use frames that produced paint via PerformanceObserver is not available; use LayoutCount/RecalcStyleCount.
async function metrics() { const { metrics } = await cdp.send("Performance.getMetrics"); return Object.fromEntries(metrics.map((m) => [m.name, m.value])); }
async function run(name, during) {
  const fr0 = await page.evaluate(() => window.__fr); const m0 = await metrics(); const r0 = reqs; const t0 = Date.now();
  await during();
  const fr1 = await page.evaluate(() => window.__fr); const m1 = await metrics(); const s = (Date.now() - t0) / 1000;
  const d = (k) => m1[k] - m0[k];
  const out = { name, secs: +s.toFixed(1), rafFps: +((fr1 - fr0) / s).toFixed(1), busyPct: +((d("TaskDuration") / s) * 100).toFixed(1),
    scriptMsPerSec: +((d("ScriptDuration") * 1000) / s).toFixed(1), styleMsPerSec: +((d("RecalcStyleDuration") * 1000) / s).toFixed(1),
    layoutMsPerSec: +((d("LayoutDuration") * 1000) / s).toFixed(1), styleRecalcsPerSec: +(d("RecalcStyleCount") / s).toFixed(1),
    layoutsPerSec: +(d("LayoutCount") / s).toFixed(1), requests: reqs - r0, domNodes: m1.Nodes };
  console.log(JSON.stringify(out));
}
await run("idle-map", () => page.waitForTimeout(SECS * 1000));
if (process.env.ONLY_IDLE) { await browser.close(); process.exit(0); }
const act = page.locator(".hud-dock .act-btn").first();
if (await act.count()) await act.click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(1500);
console.log("card open:", (await page.locator(".vault-night").count()) > 0);
await run("lamp-card", () => page.waitForTimeout(SECS * 1000));
await page.keyboard.press("Escape"); await page.waitForTimeout(800);
await run("walking", async () => { await page.keyboard.down("KeyW"); await page.waitForTimeout(SECS * 500); await page.keyboard.up("KeyW"); await page.keyboard.down("KeyD"); await page.waitForTimeout(SECS * 500); await page.keyboard.up("KeyD"); });
await browser.close();
