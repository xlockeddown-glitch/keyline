// 0.1.14 shots: node scripts/shot-spread-extra.mjs <base> market|car <out.png> [city]
import { chromium } from "playwright";
const [base, mode, out, city = mode === "market" ? "nashville" : "detroit"] = process.argv.slice(2);
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.addInitScript((c) => {
  localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: c, howtoDone: true, tutorial: 4, keys: { white: 5, blue: 5, green: 5, amber: 3, red: 1, violet: 0 } }));
}, city);
await page.goto(base.replace(/\/$/, "") + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".city-blade:not([disabled])", { timeout: 180000 });
await page.waitForTimeout(800);
await page.click(".city-blade", { timeout: 60000 });
await page.waitForTimeout(1500);
const guest = page.getByRole("button", { name: "Continue as guest" });
if (await guest.count()) await guest.click();
await page.waitForSelector('[data-testid="hud-status"]', { timeout: 180000 });
const dismiss = async () => { for (const name of ["Not now", "Later"]) { const x = page.getByRole("button", { name }); if (await x.count()) await x.first().click().catch(() => {}); } };
await dismiss();
await page.waitForTimeout(20000);
await dismiss();
if (mode === "market") {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("b")].find((x) => /Night market/.test(x.textContent ?? ""));
    (b?.closest("button,[role=button]") ?? b)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForTimeout(30000);
  const n = await page.evaluate(async () => {
    const { marketAt, marketLanterns } = await import("/src/game/nightMarket.ts");
    const { useGame } = await import("/src/game/store.ts");
    return marketLanterns(marketAt(useGame.getState().cityId, Date.now())).map((p) => p.tier);
  });
  console.log("lanterns", JSON.stringify(n));
} else {
  await page.evaluate(async () => {
    const { useGame } = await import("/src/game/store.ts");
    useGame.setState({ carsOwned: ["mustang"], carOn: "mustang" });
  });
  await page.keyboard.press("KeyF");
  await page.waitForTimeout(2500);
  const hud = await page.evaluate(async () => { const { useGame } = await import("/src/game/store.ts"); const h = useGame.getState().hud; return { seated: h.seated, own: h.ownCar, near: h.nearestId, d: Math.round(h.nearestDist) }; });
  console.log("hud", JSON.stringify(hud));
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(2500);
  const open = await page.evaluate(async () => { const { useGame } = await import("/src/game/store.ts"); const s = useGame.getState(); return { openVault: Boolean(s.openVault), seated: s.hud.seated, toast: s.toast }; });
  console.log("after E", JSON.stringify(open));
}
await page.screenshot({ path: out });
await b.close();
