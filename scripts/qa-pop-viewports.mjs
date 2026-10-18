#!/usr/bin/env node
/**
 * 0.0.99: reward pops show on tablets, phones and desktop. For each viewport (touch where it's a tablet):
 * finish How to Play with Next (leaves tutorial = 3), fire two pops back to back, and check both show in turn.
 *   node scripts/qa-pop-viewports.mjs http://127.0.0.1:8080
 */
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:8080";
const SIZES = [[768, 1024, true], [1024, 768, true], [820, 1180, true], [1180, 820, true], [1024, 1366, true], [1366, 1024, true], [390, 844, true], [1280, 800, false]];
const b = await chromium.launch();
const bad = [];
for (const [w, h, touch] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem("keyline-first-login-v1", JSON.stringify({ seen: true })));
  await p.goto(base + "/", { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".city-blade:not([disabled])", { timeout: 180000 });
  await p.waitForTimeout(600);
  await p.click(".city-blade");
  await p.waitForTimeout(1200);
  if (await p.getByText("Pick your first city").count()) { await p.getByText("Austin", { exact: true }).first().click(); await p.waitForTimeout(1200); }
  const g = p.getByRole("button", { name: "Continue as guest" });
  if (await g.count()) await g.click();
  await p.waitForSelector('[data-testid="hud-status"]', { timeout: 120000 });
  await p.waitForTimeout(800);
  const later = p.getByRole("button", { name: "Not now" });
  if (await later.count()) await later.click();
  for (let i = 0; i < 3; i++) {
    const next = p.getByRole("button", { name: /^(Next|Done|Got it|Let's go)/ });
    if (await next.count()) await next.first().click().catch(() => {});
    await p.waitForTimeout(250);
  }
  const res = await p.evaluate(async () => {
    const { useGame, popMatch } = await import("/src/game/store.ts");
    useGame.setState({ blitzOffer: false, cratePop: null });
    // How to Play finished with Next three times (0.0.98 left this at 3 and treated it as still open).
    for (let i = 0; i < 4 && useGame.getState().tutorial < 3; i++) useGame.getState().advanceTutorial();
    const tut = useGame.getState().tutorial;
    popMatch({ kind: "streak", big: "First!", sub: "a", tiers: ["white"], coin: 0 });
    popMatch({ kind: "streak", big: "Second!", sub: "b", tiers: ["blue"], coin: 0 });
    const seen = [];
    const t0 = performance.now();
    while (performance.now() - t0 < 9000 && seen.length < 2) {
      const el = document.querySelector('[data-testid="match-pop"]');
      const txt = el?.textContent ?? "";
      const k = txt.includes("Second!") ? "Second" : txt.includes("First!") ? "First" : null;
      if (k && seen[seen.length - 1] !== k) {
        seen.push(k);
        useGame.setState({ matchPop: null });
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    return { tut, seen };
  });
  if (res.seen.join(",") !== "First,Second") bad.push(`${w}x${h}: ${JSON.stringify(res)}`);
  console.log(`${w}x${h}${touch ? " touch" : ""}: tutorial=${res.tut} shown=${res.seen.join(",")}`);
  await ctx.close();
}
await b.close();
if (bad.length) {
  console.error("pop problems:\n" + bad.join("\n"));
  process.exit(1);
}
