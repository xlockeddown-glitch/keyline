// 0.1.14: phone-size map shot of one city as a guest, after the ward lamps fill. node scripts/shot-spread.mjs <base> <city> <out.png>
import { chromium } from "playwright";
const [base, city, out] = process.argv.slice(2);
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.addInitScript((c) => {
  localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: c, howtoDone: true, tutorial: 4 }));
}, city);
await page.goto(base.replace(/\/$/, "") + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".city-blade:not([disabled])", { timeout: 180000 });
await page.waitForTimeout(800);
await page.click(".city-blade", { timeout: 60000 });
await page.waitForTimeout(1500);
const guest = page.getByRole("button", { name: "Continue as guest" });
if (await guest.count()) await guest.click();
await page.waitForSelector('[data-testid="hud-status"]', { timeout: 180000 });
for (const name of ["Not now", "Later", "Close"]) {
  const x = page.getByRole("button", { name });
  if (await x.count()) await x.first().click().catch(() => {});
}
await page.waitForTimeout(45000); // streets + surroundings + ward lamps
for (const name of ["Not now", "Later"]) {
  const x = page.getByRole("button", { name });
  if (await x.count()) await x.first().click().catch(() => {});
}
// zoom out to the min so the spread is visible
const zo = page.locator(".leaflet-control-zoom-out");
for (let i = 0; i < 4; i++) if (await zo.count()) await zo.click().catch(() => {});
await page.waitForTimeout(2500);
await page.screenshot({ path: out });
await b.close();
console.log("saved", out);
