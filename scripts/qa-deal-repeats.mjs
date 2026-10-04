#!/usr/bin/env node
/**
 * 0.0.58 deal-repeats check against a RUNNING dev server's real trivia deal endpoint (dealTrivia, the server
 * function the game calls; not the picker in-process). One walker opens ~50 lamps in one city across tiers
 * (the lamp's first-offered field, like a favourite-field player), and no card may come back within 50 deals:
 *
 *   - guest, one tab: the store's own flow (tryOpen → pickCategory → answer), the save's seen list as memory;
 *   - guest, two tabs of one save, alternating: the tabs must share the save's memory (seenMemory.ts);
 *   - signed in on two devices (two browser contexts, separate saves), alternating: the server's per-walker recent
 *     list (trivia_recent) must carry the memory. Needs a gate stand-in: --gate http://127.0.0.1:8163 (skipped
 *     without one; the dev server must run with GROK_GATE_ORIGIN pointing at it).
 *
 *   node scripts/qa-deal-repeats.mjs http://127.0.0.1:8080 [--gate http://127.0.0.1:8163] [--city detroit] [--n 50]
 *
 * Exits 1 on any repeat inside the window.
 */
import { chromium } from "playwright";
import { checkedUrl } from "./browser-guard.mjs";
import { repeatVerdict } from "./deal-repeats-verdict.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const base = checkedUrl(args.find((a) => /^https?:/.test(a) && args[args.indexOf(a) - 1] !== "--gate") ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const gate = opt("--gate", null);
const city = opt("--city", "detroit");
const N = Number(opt("--n", "50"));

const browser = await chromium.launch();
const rows = [];
const problems = [];

async function page(ctx, jwt) {
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".matchbook:not([disabled])", { timeout: 180000 });
  if (jwt) await p.waitForFunction(async () => Boolean((await (await fetch("/api/auth/get-session")).json())?.user), null, { timeout: 60000, polling: 1000 });
  await p.waitForTimeout(600);
  await p.click(".matchbook");
  await p.waitForTimeout(1000);
  const g = p.getByRole("button", { name: "Continue as guest" });
  if (await g.count()) await g.click();
  await p.waitForSelector('[data-testid="hud-status"]', { timeout: 120000 });
  await p.waitForTimeout(1000);
  await p.evaluate(async () => {
    window.__kg = (await import("/src/game/store.ts")).useGame;
    window.__D = await import("/src/game/data.ts");
    window.__M = await import("/src/game/triviaMeta.ts");
  });
  return p;
}

async function context(jwt) {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
  if (jwt) await c.route(`${base}/**`, (r) => r.continue({ headers: { ...r.request().headers(), "x-grok-identity": jwt } }));
  await c.addInitScript((city) => {
    if (!localStorage.getItem("keyline-save-v1"))
      localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: city, howtoDone: true, tutorial: 4, cities: { start: city, unlocked: [city], freePick: false, passes: 0, lampPts: 0, goalsPaid: [], runs: {}, runsPaid: [] } }));
    localStorage.setItem("keyline-first-login-v1", JSON.stringify({ seen: true }));
  }, city);
  return c;
}

/** One lamp open through the store, answered (first choice). Returns the dealt public card id. */
const open = (p, i) =>
  p.evaluate(async (i) => {
    const G = window.__kg;
    const lamps = window.__D.CITIES[G.getState().cityId].pois.filter((x) => x.kind !== "shop" && !x.fareDesk);
    const poi = lamps[(i * 7) % lamps.length];
    const wait = (f) => new Promise((ok, no) => { const t0 = Date.now(); const iv = setInterval(() => { if (f()) { clearInterval(iv); ok(); } else if (Date.now() - t0 > 30000) { clearInterval(iv); no(new Error("timeout")); } }, 30); });
    G.setState({ keys: { white: 6, blue: 4, green: 3, amber: 1, red: 1, violet: 3 }, vaults: {}, loot: null, miss: null });
    if (G.getState().tryOpen(poi.id, performance.now())) return null;
    G.getState().pickCategory(window.__M.offerCats(poi.id, G.getState().vaultsOpened, 6, poi)[0], performance.now());
    try { await wait(() => G.getState().openVault?.question); } catch { return null; }
    const id = G.getState().openVault.question.id;
    G.getState().answer(G.getState().openVault.question.choices[0], performance.now());
    try { await wait(() => !G.getState().openVault); } catch { /* graded late: the card was still dealt */ }
    G.getState().dismissLoot();
    await new Promise((r) => setTimeout(r, 450));
    return id;
  }, i);

async function scenario(label, pages) {
  const ids = [];
  for (let i = 0; i < N; i++) {
    const id = await open(pages[i % pages.length], i);
    if (id) ids.push(id);
  }
  if (ids.length < N * 0.9) problems.push(`${label}: only ${ids.length}/${N} lamps dealt a card`);
  const v = repeatVerdict(label, ids);
  rows.push(v.row);
  problems.push(...v.problems);
}

try {
  const solo = await context(null);
  await scenario("guest, one tab", [await page(solo, null)]);
  await solo.close();
  const tabs = await context(null);
  await scenario("guest, two tabs", [await page(tabs, null), await page(tabs, null)]);
  await tabs.close();
  if (gate) {
    const run = Date.now().toString(36);
    const jwt = await (await fetch(`${gate}/mint?sub=qa-repeats-${run}&name=Repeats&email=repeats-${run}@qa.keyline.test`)).text();
    const a = await context(jwt);
    const b = await context(jwt);
    await scenario("signed in, two devices", [await page(a, jwt), await page(b, jwt)]);
    await a.close();
    await b.close();
  } else rows.push({ label: "signed in, two devices", skipped: "no --gate" });
} finally {
  await browser.close();
}
console.log(JSON.stringify({ ok: problems.length === 0, city, rows, problems }, null, 2));
process.exitCode = problems.length ? 1 : 0;
