#!/usr/bin/env node
/**
 * 0.1.161 painted cars QA shots from the RUNNING dev game: 390x844 @3x, a seeded guest on a local save. Cars, paint
 * and the Loop are seeded through the app's own store (window.__keyline); the cab is seated with the map's own Car
 * toggle (window.__keylineMap.cab). Never signs in and never presses Buy / Pay / Claim.
 *   node scripts/cars-shots.mjs http://127.0.0.1:8093 /home/box/keyline-art/shots/cars
 * Close-ups and the contact sheet: python3 scripts/art/cars-contact.py <out>
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const [base = "http://127.0.0.1:8093", out = "shots/cars"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const CITY = process.env.CARS_CITY ?? "austin";
const CARS = ["civic", "f150", "ioniq5", "mustang", "belair57", "model3", "roadster", "roadster2"];
const errors = [];
const notes = { faces: {}, boxes: {} };

async function open(label, save = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${label}: pageerror ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${label}: console ${m.text()}`);
  });
  page.on("requestfailed", (r) => {
    if (r.url().includes("/sprites/cars/")) errors.push(`${label}: failed ${r.url()}`);
  });
  page.on("response", (r) => {
    if (r.url().includes("/sprites/cars/") && r.status() >= 400) errors.push(`${label}: ${r.status()} ${r.url()}`);
  });
  await page.addInitScript(
    ({ city, save }) => {
      localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: city, howtoDone: true, tutorial: 4, ...save }));
    },
    { city: CITY, save },
  );
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".city-blade:not([disabled])", { timeout: 120000 });
  await page.waitForTimeout(800);
  return { browser, page };
}

async function enter(page) {
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
  await tag(page, "seeded guest · local save · painted cars 0.1.161");
  await page.waitForFunction(() => Boolean(window.__keylineMap?.drive()?.segs?.length >= 4), null, { timeout: 120000 });
}

async function tag(page, text) {
  await page.evaluate((text) => {
    document.getElementById("qa-tag")?.remove();
    const el = document.createElement("div");
    el.textContent = text;
    el.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;font:600 10px system-ui;color:#f3efe6;background:#1a1410cc;border:1px solid #c9a35e;border-radius:999px;padding:3px 8px;pointer-events:none";
    el.id = "qa-tag";
    document.body.appendChild(el);
  }, text);
}

async function clearPops(page, n = 3) {
  for (let i = 0; i < n; i++) {
    await page.evaluate(() => window.__keyline.setState({ matchPop: null, toast: null }));
    for (const name of ["Not now", "Nice", "Later", "Got it"]) {
      const b = page.getByRole("button", { name, exact: true });
      if (await b.count()) await b.first().click().catch(() => {});
    }
    await page.waitForTimeout(250);
  }
}

const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });

/** Park (if seated), put this car and colour on the save, and sit back in it. */
async function seat(page, car, paint = null) {
  await page.evaluate(
    async ({ car, paint, all }) => {
      const m = window.__keylineMap;
      if (m.seated()) m.cab();
      await new Promise((r) => setTimeout(r, 300));
      const g = window.__keyline;
      g.setState({ carsOwned: all, carOn: car, carCab: false, carPaint: paint ? { [car]: paint } : {} });
      m.cab();
    },
    { car, paint, all: CARS },
  );
  await page.waitForFunction(() => window.__keylineMap.seated(), null, { timeout: 20000 });
  await page.waitForTimeout(700);
  await clearPops(page, 1);
}

/** The cab's own box on screen (the 56px pawn box, with the painting inside it). */
async function cabClip(page, pad = 26) {
  const box = await page.locator(".pawn .cab-sprite").first().boundingBox();
  if (!box) throw new Error("no cab sprite");
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2, half = 28 + pad;
  return { x: Math.max(0, cx - half), y: Math.max(0, cy - half), width: half * 2, height: half * 2 };
}

const cabState = (page) =>
  page.evaluate(() => {
    const el = document.querySelector(".pawn .cab-sprite");
    const cs = getComputedStyle(el);
    return { face: el.dataset.face, car: el.dataset.car, paint: el.dataset.paint, image: cs.backgroundImage.replace(/^.*\/sprites\//, "/sprites/").replace(/"\)$/, ""), rendering: cs.imageRendering, size: cs.backgroundSize, pos: cs.backgroundPosition };
  });

/** Drive until the cab shows this face, then shoot it mid-drive (a real route on the road graph, not a forced attribute). */
async function driveFace(page, want, name, { full = true } = {}) {
  const d = 0.0035;
  const tries = { right: [[0, d], [d / 3, d], [-d / 3, d]], left: [[0, -d], [d / 3, -d], [-d / 3, -d]], up: [[d, 0], [d, d / 3], [d, -d / 3]], down: [[-d, 0], [-d, d / 3], [-d, -d / 3]] }[want];
  const here = await page.evaluate(() => window.__keylineMap.pos());
  let got = false, st = null;
  for (const [dy, dx] of tries) {
    await page.evaluate(({ lat, lng }) => window.__keylineMap.walkTo(lat, lng), { lat: here.lat + dy, lng: here.lng + dx });
    const until = Date.now() + 9000;
    while (Date.now() < until && !got) {
      await page.waitForTimeout(80);
      if ((await cabState(page)).face !== want) continue;
      const clip = await cabClip(page);
      const buf = await page.screenshot({ clip });
      st = await cabState(page);
      if (st.face !== want) continue; // it turned during the shot
      writeFileSync(`${out}/${name}-crop.png`, buf);
      if (full) await page.screenshot({ path: `${out}/${name}.png` });
      got = true;
    }
    if (got) break;
  }
  notes.faces[name] = { want, got, ...(st ?? (await cabState(page))) };
  if (!got) errors.push(`${name}: never faced ${want}`);
  return got;
}

// 1. The map cab: default zoom, zoomed, and driving right / left / down (front) / up (back).
{
  const { browser, page } = await open("map");
  await enter(page);
  const home = await page.evaluate(() => window.__keylineMap.pos());
  notes.zoomDefault = await page.evaluate(() => window.__keylineMap.map().getZoom());
  await seat(page, "civic");
  await clearPops(page);
  await shot(page, "01-map-cab-default");
  notes.cabDefault = await cabState(page);
  await page.screenshot({ path: `${out}/01b-map-cab-default-crop.png`, clip: await cabClip(page) });
  await page.evaluate(() => {
    const m = window.__keylineMap;
    m.map().setView([m.pos().lat, m.pos().lng], 19, { animate: false });
  });
  await page.waitForTimeout(1800);
  await clearPops(page);
  await shot(page, "02-map-cab-zoom");
  await page.screenshot({ path: `${out}/02b-map-cab-zoom-crop.png`, clip: await cabClip(page) });
  await page.evaluate((z) => window.__keylineMap.map().setZoom(z, { animate: false }), notes.zoomDefault);
  await page.waitForTimeout(800);
  for (const [face, n] of [["right", "03-drive-side-right"], ["left", "04-drive-side-left"], ["down", "05-drive-front"], ["up", "06-drive-back"]]) {
    await page.evaluate((h) => window.__keylineMap.place(h.lat, h.lng), home);
    await page.waitForTimeout(500);
    await clearPops(page, 1);
    await driveFace(page, face, n);
  }
  // Every car, parked on the same spot: side (as seated) for the footprint check.
  await page.evaluate((h) => window.__keylineMap.place(h.lat, h.lng), home);
  for (const car of CARS) {
    await seat(page, car);
    await page.evaluate((h) => window.__keylineMap.place(h.lat, h.lng), home);
    await page.waitForTimeout(700);
    await clearPops(page, 1);
    await driveFace(page, "right", `07-map-${car}`, { full: false });
    notes.boxes[car] = notes.faces[`07-map-${car}`];
  }
  // The Bel Air is the open car: the worn scout rides behind the door line. Front and back as well.
  await seat(page, "belair57");
  for (const [face, n] of [["right", "08-belair-drive-side"], ["down", "08-belair-drive-front"], ["up", "08-belair-drive-back"]]) {
    await page.evaluate((h) => window.__keylineMap.place(h.lat, h.lng), home);
    await page.waitForTimeout(500);
    await driveFace(page, face, n);
  }
  // Paint variants on the map.
  for (const [car, paint] of [["civic", "sig"], ["mustang", "red"], ["mustang", "sig"], ["belair57", "black"], ["ioniq5", "sig"], ["f150", "blue"], ["model3", "red"], ["roadster", "sig"]]) {
    await seat(page, car, paint);
    await page.evaluate((h) => window.__keylineMap.place(h.lat, h.lng), home);
    await page.waitForTimeout(700);
    await clearPops(page, 1);
    await driveFace(page, "right", `09-paint-${car}-${paint}`, { full: car === "civic" });
    notes.boxes[`${car}-${paint}`] = notes.faces[`09-paint-${car}-${paint}`];
    if (car === "mustang" && paint === "red") {
      for (const face of ["down", "up"]) {
        await page.evaluate((h) => window.__keylineMap.place(h.lat, h.lng), home);
        await page.waitForTimeout(400);
        await driveFace(page, face, `09-paint-mustang-red-${face === "down" ? "front" : "back"}`, { full: false });
      }
    }
  }
  // The car lot sign on the map.
  const door = await page.evaluate(() => window.__keylineMap.dealer());
  if (door) {
    await page.evaluate(
      async (d) => {
        const m = window.__keylineMap;
        if (m.seated()) m.cab();
        await new Promise((r) => setTimeout(r, 300));
        m.place(d.lat, d.lng);
        m.map().setView([d.lat, d.lng], 18, { animate: false });
      },
      door,
    );
    await page.waitForTimeout(2500);
    await clearPops(page);
    await shot(page, "10-dealer-sign");
    const sign = await page.locator(".dealer-pin").first().boundingBox();
    if (sign) await page.screenshot({ path: `${out}/10b-dealer-sign-crop.png`, clip: { x: Math.max(0, sign.x - 20), y: Math.max(0, sign.y - 20), width: sign.width + 40, height: sign.height + 40 } });
    else errors.push("dealer: no .dealer-pin on screen");
    // The Showroom: all eight cards (the scroller opened out for one tall shot), then with paint on the owned cars.
    await page.evaluate((all) => window.__keyline.setState({ carsOwned: [], carOn: null, carPaint: {}, dealerNear: true, dealerOpen: true, points: 12_345, carsAll: all }), CARS);
    await page.waitForSelector('[data-testid="showroom"]', { timeout: 10000 });
    await page.waitForTimeout(900);
    await shot(page, "11-showroom-phone");
    await page.setViewportSize({ width: 390, height: 2300 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/12-showroom-all-8.png` });
    await page.evaluate((all) => window.__keyline.setState({ carsOwned: all, carOn: "mustang", carPaint: { civic: "sig", mustang: "red", belair57: "black", ioniq5: "sig", f150: "blue", model3: "silver", roadster: "red", roadster2: "blue" } }), CARS);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/13-showroom-paint-variants.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.__keyline.setState({ dealerOpen: false }));
  } else errors.push("dealer: no door on the map handle");
  await browser.close();
}

// 2. The title screen and the garage (the house sheet's Drive row) with a painted car on the save.
{
  const { browser, page } = await open("title", { carsOwned: CARS, carOn: "mustang", carPaint: { mustang: "sig" } });
  await page.waitForTimeout(1200);
  await tag(page, "seeded guest · local save · painted cars 0.1.161");
  await shot(page, "14-title-car");
  notes.titleVersion = await page.evaluate(() => document.body.innerText.match(/v?0\.1\.\d+/)?.[0] ?? null);
  notes.titleCar = await page.evaluate(() => document.querySelector(".ts-car")?.getAttribute("src") ?? null);
  await browser.close();
}

// 3. The Loop: the seated car on the sled, on the near rails, at the start, the middle and late in the zoom.
for (const [car, paint] of [["civic", null], ["mustang", "red"], ["belair57", null], ["f150", null]]) {
  const { browser, page } = await open(`loop-${car}`, { carsOwned: CARS, carOn: car, carPaint: paint ? { [car]: paint } : {} });
  await enter(page);
  await clearPops(page);
  await page.evaluate(() => window.__keyline.setState({ loop: { from: "austin", to: "chicago", crate: false }, screen: "loop" }));
  await page.waitForSelector('[data-testid="loop-screen"]', { timeout: 10000 });
  await tag(page, `seeded guest · local save · the Loop, ${car}${paint ? ` ${paint}` : ""}`);
  // Hold the ride on a frame: pause the screen's own animations and seek them (no waiting, and no arrival).
  const hold = (ms) =>
    page.evaluate((ms) => {
      for (const a of document.querySelector('[data-testid="loop-screen"]').getAnimations({ subtree: true })) {
        a.pause();
        const name = a.animationName ?? "";
        if (name === "loop-zoom") a.currentTime = ms;
        else if (name === "loop-in") a.currentTime = 500;
        else if (name === "loop-out") a.currentTime = 0;
        else a.currentTime = 0;
      }
    }, ms);
  const sledClip = async () => {
    const b = await page.locator(".loop-sled").boundingBox();
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    return { x: Math.max(0, cx - 120), y: cy - 110, width: 240, height: 200 };
  };
  for (const [name, ms] of [["start", 300], ["mid", 3500], ["late", 6300]]) {
    await hold(ms);
    await page.waitForTimeout(350);
    if (car === "civic" || name === "mid") await shot(page, `20-loop-${car}-${name}`);
    await page.screenshot({ path: `${out}/21-loop-${car}-${name}-crop.png`, clip: await sledClip() });
  }
  notes[`loop_${car}`] = await page.evaluate(() => {
    const el = document.querySelector(".loop-sled .cab-sprite");
    const cs = getComputedStyle(el);
    const sled = getComputedStyle(document.querySelector(".loop-sled"));
    return { car: el.dataset.car, paint: el.dataset.paint, image: cs.backgroundImage.replace(/^.*\/sprites\//, "/sprites/").replace(/"\)$/, ""), rendering: cs.imageRendering, top: sled.top, left: sled.left, transform: sled.transform };
  });
  await browser.close();
}

writeFileSync(`${out}/shots.json`, JSON.stringify({ notes, errors }, null, 2));
console.log(JSON.stringify({ notes, errors }, null, 2));
if (errors.length) process.exitCode = 1;
