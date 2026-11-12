#!/usr/bin/env node
/**
 * 0.1.162 painted shop and sign QA shots from the RUNNING dev game: 390x844 @3x, a seeded guest on a local save.
 * Never signs in and never presses Buy / Pay / Claim. Dev server only (uses the dev store and map handles).
 *   node scripts/shops-shots.mjs http://127.0.0.1:8096 shots/shops
 * Writes the map shots (each pin at the default zoom and zoomed in), the station with and without a fare and
 * cooling, the three sheet fronts, a line-up beside the comet, and 4x crops (a second pass at deviceScaleFactor 4).
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const [base = "http://127.0.0.1:8096", out = "shots/shops"] = process.argv.slice(2);
mkdirSync(`${out}/crops4x`, { recursive: true });
const CITY = process.env.SHOPS_CITY ?? "austin";
const errors = [];
const notes = {};

async function open(dsf, label) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dsf, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${label}: pageerror ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${label}: console ${m.text()}`);
  });
  await page.addInitScript((city) => {
    localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: city, howtoDone: true, tutorial: 4 }));
  }, CITY);
  await page.goto(`${base}/?comet=open`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".city-blade:not([disabled])", { timeout: 120000 });
  await page.waitForTimeout(800);
  if (dsf === 3 && label === "main") {
    notes.version = (await page.locator(".book-ver").first().textContent())?.trim();
    await page.screenshot({ path: `${out}/00-title-version.png` });
  }
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
    window.__qaGame = window.__keyline; // the app's own store (dev handle)
    const tag = document.createElement("div");
    tag.id = "qa-tag";
    tag.textContent = "seeded guest · local save";
    tag.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;font:600 10px system-ui;color:#f3efe6;background:#1a1410cc;border:1px solid #c9a35e;border-radius:999px;padding:3px 8px;pointer-events:none";
    document.body.appendChild(tag);
  });
  return { browser, page };
}

const tag = (page, text) => page.evaluate((t) => (document.getElementById("qa-tag").textContent = `seeded guest · local save · ${t}`), text);

async function clearPops(page) {
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.__qaGame.setState({ matchPop: null, toast: null }));
    await page.waitForTimeout(300);
  }
}

/** Service places in this city, straight from the app's data module (pure data, a second copy is harmless). */
const places = (page) =>
  page.evaluate(async (city) => {
    const { CITIES } = await import("/src/game/data.ts");
    const { isFareDesk } = await import("/src/game/ticket.ts");
    const c = CITIES[city];
    const pick = (f) => {
      const p = c.pois.find(f);
      return p ? { id: p.id, name: p.name, lat: p.lat, lng: p.lng } : null;
    };
    return { shop: pick((p) => p.kind === "shop"), counter: pick((p) => p.kind === "counter"), board: pick((p) => p.kind === "board"), station: pick((p) => isFareDesk(p)) };
  }, CITY);

/** Stand a little south-west of a place and look at it. */
async function lookAt(page, p, zoom) {
  await page.evaluate(
    ({ p, zoom }) => {
      const m = window.__keylineMap;
      m.place(p.lat - 0.0004, p.lng - 0.0005);
      m.map().setView([p.lat - 0.00012, p.lng], zoom, { animate: false });
    },
    { p, zoom },
  );
  await page.waitForTimeout(2200);
  await clearPops(page);
}

const SEL = { shop: ".shop-pin", counter: ".counter-pin", board: ".board-pin", station: ".station-pin" };

/** The pin nearest the middle of the screen (the one we are looking at). */
async function pinClip(page, sel, pad = 26) {
  const boxes = await page.locator(sel).evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })));
  const near = boxes.filter((b) => b.width > 0).sort((a, b) => Math.hypot(a.x + a.width / 2 - 195, a.y + a.height / 2 - 400) - Math.hypot(b.x + b.width / 2 - 195, b.y + b.height / 2 - 400))[0];
  if (!near) throw new Error(`no ${sel} on screen`);
  return { clip: { x: Math.max(0, near.x - pad), y: Math.max(0, near.y - pad), width: near.width + 2 * pad, height: near.height + 2 * pad }, box: near };
}

/** Real markers (their own markup, iconSize and iconAnchor) copied side by side next to the comet, for scale. */
async function lineup(page, at, zoom) {
  await page.evaluate(
    ({ at, zoom }) => {
      const map = window.__keylineMap.map();
      for (const m of window.__qaLine ?? []) m.remove();
      window.__qaLine = [];
      map.setView([at.lat, at.lng], zoom, { animate: false });
      const found = {};
      map.eachLayer((l) => {
        const html = l.options?.icon?.options?.html;
        if (typeof html !== "string") return;
        for (const k of ["station-pin", "board-pin", "counter-pin", "shop-pin", "comet-pin"]) if (html.includes(`${k}`) && html.includes("world-obj") && !found[k]) found[k] = l;
      });
      const order = ["station-pin", "board-pin", "counter-pin", "shop-pin", "comet-pin"].filter((k) => found[k]);
      const c = map.latLngToContainerPoint([at.lat, at.lng]);
      order.forEach((k, i) => {
        const src = found[k];
        const ll = map.containerPointToLatLng([c.x + (i - (order.length - 1) / 2) * 68, c.y]);
        const Marker = src.constructor, Icon = src.options.icon.constructor;
        window.__qaLine.push(new Marker(ll, { icon: new Icon({ ...src.options.icon.options }), interactive: false, keyboard: false, zIndexOffset: 2000 }).addTo(map));
      });
      window.__qaLineKinds = order;
    },
    { at, zoom },
  );
  await page.waitForTimeout(1500);
  await clearPops(page);
}

async function run(dsf) {
  const main = dsf === 3;
  const dir = main ? out : `${out}/crops4x`;
  const { browser, page } = await open(dsf, main ? "main" : "crops4x");
  const P = await places(page);
  if (main) notes.places = P;
  const shot = (name, clip) => page.screenshot({ path: `${dir}/${name}.png`, ...(clip ? { clip } : {}) });

  // 1. Each pin where it really stands: default zoom (16), then zoomed in (18).
  for (const [kind, p] of Object.entries(P)) {
    if (!p) continue;
    for (const [zoom, zn] of [[16, "default"], [18, "zoom"]]) {
      await lookAt(page, p, zoom);
      await tag(page, `${kind} · ${p.name} · zoom ${zoom}`);
      if (main) await shot(`${zn === "default" ? "01" : "02"}-map-${kind}-${zn}`);
      const { clip, box } = await pinClip(page, SEL[kind]);
      await shot(`pin-${kind}-${zn}${main ? "-crop" : ""}`, clip);
      if (main) {
        notes[`${kind}_${zn}`] = await page.evaluate(
          ({ sel, box }) => {
            const el = [...document.querySelectorAll(sel)].find((e) => Math.abs(e.getBoundingClientRect().x - box.x) < 1);
            const img = el.querySelector("img");
            const obj = el.closest(".world-obj");
            return {
              html: el.outerHTML,
              scale: getComputedStyle(obj).scale,
              box: [box.width, box.height].map((n) => +n.toFixed(1)),
              img: { natural: [img.naturalWidth, img.naturalHeight], complete: img.complete, rendering: getComputedStyle(img).imageRendering, filter: getComputedStyle(img).filter },
              rootFilter: getComputedStyle(el).filter,
              rootBackground: getComputedStyle(el).backgroundImage,
              before: getComputedStyle(el, "::before").display + "/" + getComputedStyle(el, "::before").content,
              after: getComputedStyle(el, "::after").display + "/" + getComputedStyle(el, "::after").content,
              shadow: getComputedStyle(obj, "::before").content !== "none",
            };
          },
          { sel: SEL[kind], box },
        );
      }
    }
  }

  // 2. Station states at zoom 18: no fare, a fare held (label under the post), cooling (whole image dimmed).
  if (P.station) {
    await lookAt(page, P.station, 18);
    const states = [
      ["nofare", { fares: 0 }, false],
      ["fare", { fares: 1 }, false],
      ["cooling", { fares: 0 }, true],
    ];
    for (const [name, patch, cooling] of states) {
      await page.evaluate(
        ({ patch, cooling, id }) => {
          const g = window.__qaGame;
          const vaults = { ...g.getState().vaults };
          if (cooling) vaults[id] = { state: "cooling", coolUntil: Date.now() + 10 * 60_000 };
          else delete vaults[id];
          g.setState({ ...patch, vaults });
        },
        { patch, cooling, id: P.station.id },
      );
      await page.waitForTimeout(900);
      await clearPops(page);
      await tag(page, `station · ${name === "fare" ? "holding 1 fare (seeded locally)" : name === "cooling" ? "cooling" : "no fare"}`);
      if (main) await shot(`03-map-station-${name}`);
      const { clip } = await pinClip(page, SEL.station, 30);
      await shot(`pin-station-${name}${main ? "-crop" : ""}`, clip);
      if (main) notes[`station_${name}`] = await page.locator(SEL.station).first().evaluate((el) => el.outerHTML);
    }
    await page.evaluate((id) => {
      const g = window.__qaGame;
      const vaults = { ...g.getState().vaults };
      delete vaults[id];
      g.setState({ fares: 0, vaults });
    }, P.station.id);
  }

  // 3. Line-up beside the comet (copies of the real markers), default zoom and zoomed.
  const comet = await page.evaluate(() => window.__keylineMap.comet());
  if (comet) {
    // Bring every kind of marker into the layer set first (the map only keeps what the city has; all are always built).
    for (const [zoom, zn] of [[16, "default"], [17, "zoom17"], [18, "zoom18"]]) {
      await page.evaluate((c) => window.__keylineMap.place(c.lat - 0.0006, c.lng - 0.0006), comet);
      await lineup(page, { lat: comet.lat + 0.0004, lng: comet.lng }, zoom);
      await tag(page, `QA line-up: copies of the real markers beside the comet · zoom ${zoom}`);
      if (main) {
        await shot(`04-lineup-${zn}`);
        notes.lineup = await page.evaluate(() => window.__qaLineKinds);
      }
      const c = await page.evaluate((at) => {
        const p = window.__keylineMap.map().latLngToContainerPoint([at.lat, at.lng]);
        return { x: p.x, y: p.y };
      }, { lat: comet.lat + 0.0004, lng: comet.lng });
      await shot(`lineup-${zn}${main ? "-crop" : ""}`, { x: Math.max(0, c.x - 190), y: Math.max(0, c.y - 90), width: 380, height: 130 });
    }
    // Seating check: the same line-up with the shared contact shadow tinted (a QA style, removed straight after),
    // so the foot of every painting can be seen against its ellipse on the dark map.
    await page.addStyleTag({ content: ".world-obj.has-shadow::before{background:radial-gradient(closest-side,#ff3df2,#ff3df2 60%,transparent) !important}" }).then(async (h) => {
      await tag(page, "QA line-up · shared shadow tinted pink to show seating · zoom 18");
      await page.waitForTimeout(400);
      if (main) await shot("06-lineup-shadow-check");
      const c = await page.evaluate((at) => {
        const p = window.__keylineMap.map().latLngToContainerPoint([at.lat, at.lng]);
        return { x: p.x, y: p.y };
      }, { lat: comet.lat + 0.0004, lng: comet.lng });
      await shot(`lineup-shadow-check${main ? "-crop" : ""}`, { x: Math.max(0, c.x - 190), y: Math.max(0, c.y - 90), width: 380, height: 130 });
      await h.evaluate((el) => el.remove());
    });
    await page.evaluate(() => {
      for (const m of window.__qaLine ?? []) m.remove();
    });
  }

  // 4. The sheets with the three fronts. Opened through the store; nothing is bought, paid or claimed.
  const fronts = [
    ["outfitter-hire", async () => page.evaluate(() => window.__qaGame.setState({ shopOpen: true, errandOpen: null })), ".shop-front"],
    ["print-shop", async () => page.getByRole("tab", { name: "Print shop" }).click(), ".print-front:not(.shop-front):not(.counter-front)"],
    ["street-counter", async () => page.evaluate((id) => window.__qaGame.setState({ shopOpen: false, errandOpen: "counter", errandId: id }), P.counter?.id), ".counter-front"],
  ];
  for (const [name, openIt, sel] of fronts) {
    await openIt();
    await page.waitForSelector(`${sel} img`, { timeout: 15000 });
    await page.waitForFunction((s) => document.querySelector(`${s} img`)?.complete, sel);
    await page.waitForTimeout(900);
    await tag(page, `${name} sheet · nothing bought`);
    if (main) await shot(`05-sheet-${name}`);
    const b = await page.locator(sel).first().boundingBox();
    await shot(`front-${name}${main ? "-crop" : ""}`, { x: b.x, y: b.y, width: b.width, height: b.height });
    if (main)
      notes[`front_${name}`] = await page.locator(`${sel} img`).first().evaluate((img) => ({
        src: img.getAttribute("src"),
        css: [img.getBoundingClientRect().width, img.getBoundingClientRect().height].map((n) => +n.toFixed(1)),
        natural: [img.naturalWidth, img.naturalHeight],
        rendering: getComputedStyle(img).imageRendering,
        figure: +img.parentElement.getBoundingClientRect().height.toFixed(1),
        close: Boolean(document.querySelector('[aria-label="Close"]')),
      }));
  }
  await page.evaluate(() => window.__qaGame.setState({ shopOpen: false, errandOpen: null }));
  await browser.close();
}

await run(3);
await run(4);
writeFileSync(`${out}/shots.json`, JSON.stringify({ notes, errors }, null, 2));
console.log(JSON.stringify({ notes, errors }, null, 2));
