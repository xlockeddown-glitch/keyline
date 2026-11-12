#!/usr/bin/env node
/**
 * 0.1.160 painted vault QA shots from the RUNNING dev game: 390x844 @3x, a seeded guest on a local save. Never signs
 * in and never presses Buy / Pay / Claim. Cooling / lock-out vaults, Hearths and the worn skin are seeded into the
 * local store (dev handles `__keyline`, `__keylinePlant`, `__keylineMap`); nothing is written to a server.
 *   node scripts/vault-shots.mjs http://127.0.0.1:8092 shots/vaults
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const [base = "http://127.0.0.1:8092", out = "shots/vaults"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const CITY = process.env.VAULT_CITY ?? "austin";
const TIERS = ["white", "blue", "green", "amber", "red", "violet"];
const errors = [];
const notes = {};

async function open(label, query = "") {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${label}: pageerror ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${label}: console ${m.text()}`);
  });
  await page.addInitScript((city) => {
    if (!localStorage.getItem("keyline-save-v1")) localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: city, howtoDone: true, tutorial: 4 }));
  }, CITY);
  await page.goto(`${base}/${query}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".city-blade:not([disabled])", { timeout: 120000 });
  await page.waitForTimeout(800);
  if (label === "painted") {
    // Preview smoke: the title screen shows the bumped version.
    notes.version = (await page.locator(".book-ver").first().textContent())?.trim();
    notes.title = await page.title();
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
  await page.evaluate((text) => {
    window.__qaGame = window.__keyline;
    const tag = document.createElement("div");
    tag.textContent = text;
    tag.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:99999;font:600 10px system-ui;color:#f3efe6;background:#1a1410cc;border:1px solid #c9a35e;border-radius:999px;padding:3px 8px;pointer-events:none";
    tag.id = "qa-tag";
    document.body.appendChild(tag);
  }, `seeded guest · local save · ${label}`);
  return { browser, page };
}

async function clearPops(page, n = 4) {
  for (let i = 0; i < n; i++) {
    await page.evaluate(() => window.__qaGame.setState({ matchPop: null, toast: null }));
    for (const name of ["Nice", "Later", "Not now"]) {
      const b = page.getByRole("button", { name, exact: true });
      if (await b.count()) await b.first().click().catch(() => {});
    }
    await page.waitForTimeout(350);
  }
}
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png` });
const view = async (page, lat, lng, zoom) => {
  await page.evaluate(({ lat, lng, zoom }) => window.__keylineMap.map().setView([lat, lng], zoom, { animate: false }), { lat, lng, zoom });
  await page.waitForTimeout(1800);
  await clearPops(page, 2);
};
/** Crop round the pin of `sel` nearest the screen point of (lat, lng). */
async function cropPin(page, sel, lat, lng, name, pad = 26) {
  const box = await page.evaluate(
    ({ sel, lat, lng }) => {
      const map = window.__keylineMap.map();
      const pt = map.latLngToContainerPoint([lat, lng]);
      const host = map.getContainer().getBoundingClientRect();
      let best = null;
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        const d = Math.hypot(r.x + r.width / 2 - host.x - pt.x, r.y + r.height / 2 - host.y - pt.y);
        if (!best || d < best.d) best = { d, x: r.x, y: r.y, w: r.width, h: r.height, html: el.outerHTML };
      }
      return best;
    },
    { sel, lat, lng },
  );
  if (!box || box.d > 80) throw new Error(`no ${sel} pin at ${lat},${lng} (${JSON.stringify(box)})`);
  await page.screenshot({ path: `${out}/${name}.png`, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + pad * 2, height: box.h + pad * 2 } });
  return box;
}
/** The city's vault places by tier, nearest the walk start first. */
const cityVaults = (page) =>
  page.evaluate(async () => {
    const st = window.__qaGame.getState();
    const { CITIES } = await import("/src/game/data.ts");
    const { isFareDesk } = await import("/src/game/ticket.ts");
    const c = CITIES[st.cityId];
    const at = window.__keylineMap.pos();
    return c.pois
      .filter((p) => !["shop", "counter", "board"].includes(p.kind) && !isFareDesk(p))
      .map((p) => ({ id: p.id, name: p.name, tier: p.tier, lat: p.lat, lng: p.lng, d: Math.hypot(p.lat - at.lat, (p.lng - at.lng) * 0.86) }))
      .sort((a, b) => a.d - b.d);
  });
const rebuild = (page) => page.evaluate(() => window.__qaGame.setState({ hearthGen: (window.__qaGame.getState().hearthGen ?? 0) + 1 }));
const hearthView = (id, lat, lng, name, cats, extra = {}) => ({ id, city: CITY, lat, lng, name, cats, by: "Seeded G.", ...extra });

// ───────────────────────── 1. Painted pins (stock brass / no skin) ─────────────────────────
{
  const { browser, page } = await open("painted", "?comet=open");
  const pois = await cityVaults(page);
  const at = await page.evaluate(() => window.__keylineMap.pos());
  notes.defaultZoom = await page.evaluate(() => window.__keylineMap.map().getZoom());
  notes.tiersNearStart = pois.slice(0, 14).map((p) => `${p.tier}:${p.name}`);
  await clearPops(page);
  await shot(page, "01-map-default-zoom");
  await view(page, at.lat, at.lng, 17);
  await shot(page, "02-map-zoom17");
  await view(page, at.lat, at.lng, 18);
  await shot(page, "03-map-zoom18");

  // One pin per tier, as it sits on the map (default zoom), cropped.
  const pick = Object.fromEntries(TIERS.map((t) => [t, pois.find((p) => p.tier === t)]));
  notes.pins = {};
  for (const t of TIERS) {
    const p = pick[t];
    if (!p) throw new Error(`no ${t} vault in ${CITY}`);
    await view(page, p.lat, p.lng, 18);
    const box = await cropPin(page, `.painted-vault-pin.tier-${t}:not(.hearth-pin):not(.comet-pin)`, p.lat, p.lng, `10-pin-${t}`);
    notes.pins[t] = { poi: p.name, css: `${box.w}x${box.h}`, html: box.html };
  }

  // Beside the comet (48×58): stand by it so both are in one frame.
  const comet = await page.evaluate(() => window.__keylineMap.comet());
  if (comet) {
    const near = pois.map((p) => ({ ...p, dc: Math.hypot(p.lat - comet.lat, (p.lng - comet.lng) * 0.86) })).sort((a, b) => a.dc - b.dc)[0];
    await page.evaluate((c) => window.__keylineMap.place(c.lat - 0.0003, c.lng - 0.0002), comet);
    await view(page, (comet.lat + near.lat) / 2, (comet.lng + near.lng) / 2, 17);
    await shot(page, "04-map-comet-and-vaults-z17");
    const cb = await cropPin(page, ".comet-pin", comet.lat, comet.lng, "11-pin-comet-for-scale");
    notes.cometCss = `${cb.w}x${cb.h}`;
    notes.cometNeighbour = `${near.tier}:${near.name} ${(near.dc * 111000).toFixed(0)} m`;
  }

  // Cooling + locked-out vaults (local state only) and three seeded Hearths by the walk start.
  await page.evaluate((a) => window.__keylineMap.place(a.lat, a.lng), at);
  const [a, b, c2] = pois.slice(0, 3);
  await page.evaluate(
    ({ a, b }) => {
      const g = window.__qaGame;
      const until = Date.now() + 3 * 3600_000;
      g.setState({ vaults: { ...g.getState().vaults, [a.id]: { state: "cooling", coolUntil: until }, [b.id]: { state: "cooling", coolUntil: until, lockout: true } } });
    },
    { a, b },
  );
  await rebuild(page);
  await view(page, a.lat, a.lng, 18);
  const cool = await cropPin(page, ".painted-vault-pin.cooling", a.lat, a.lng, `12-pin-cooling-${a.tier}`);
  notes.cooling = cool.html;
  await view(page, b.lat, b.lng, 18);
  const lock = await cropPin(page, ".painted-vault-pin.locked-out", b.lat, b.lng, `13-pin-locked-${b.tier}`);
  notes.locked = lock.html;
  await view(page, (a.lat + b.lat + c2.lat) / 3, (a.lng + b.lng + c2.lng) / 3, 17);
  await shot(page, "05-map-cooling-and-locked-z17");

  // A spot by the walk start with the most room from every vault (the three Hearths sit 0.0011° apart).
  let H = null;
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -6; dx <= 6; dx++) {
      const c = { lat: at.lat + dy * 0.0004, lng: at.lng + dx * 0.0005 };
      const room = Math.min(...pois.flatMap((p) => [-0.0011, 0, 0.0011].map((o) => Math.hypot(p.lat - c.lat, (p.lng - c.lng - o) * 0.86))));
      if (!H || room > H.room) H = { ...c, room };
    }
  const hearths = [
    hearthView("placed-qa1", H.lat, H.lng, 0, ["history", "science", "music", "games"], { mine: true }),
    hearthView("placed-qa2", H.lat, H.lng + 0.0011, 1, ["local", "food", "sports", "geography"], { polish: Date.now() + 5 * 86400_000 }),
    hearthView("placed-qa3", H.lat, H.lng - 0.0011, 2, ["books", "arts", "nature", "celebrity"]),
  ];
  const mine = { owner: "qa", city: CITY, lat: H.lat, lng: H.lng, name: 0, cats: hearths[0].cats, at: Date.now() };
  const me = { unlocked: true, mine, hearths: [{ v: 1, id: "placed-qa1", mine, stats: { today: { opens: 7, coin: 350, keys: 1 }, total: { opens: 41, coin: 2050, keys: 4 }, cap: 1000 } }] };
  await page.evaluate(
    ({ hearths, me }) => {
      window.__keylinePlant.show(hearths, me, false);
      const g = window.__qaGame;
      g.setState({ vaults: { ...g.getState().vaults, "placed-qa3": { state: "cooling", coolUntil: Date.now() + 3600_000, lockout: true } } });
    },
    { hearths, me },
  );
  await view(page, H.lat - 0.0001, H.lng, 18);
  await shot(page, "06-map-hearths-z18");
  for (const [i, h] of hearths.entries()) {
    const hb = await cropPin(page, ".hearth-pin", h.lat, h.lng, `14-pin-hearth-${["open", "polished", "locked"][i]}`, 14);
    notes[`hearth_${i}`] = { css: `${hb.w}x${hb.h}`, html: hb.html };
  }
  await view(page, H.lat - 0.0001, H.lng, 17);
  await shot(page, "07-map-hearths-z17");

  // The vault card: a painted tier.
  const amber = pick.amber;
  await page.evaluate((p) => {
    window.__keylineMap.stand(p.lat, p.lng);
    window.__keylineMap.map().setView([p.lat, p.lng], 18, { animate: false });
    const g = window.__qaGame;
    const s = g.getState();
    g.setState({ keys: { ...s.keys, white: 3, blue: 3, green: 3, amber: 3, red: 3, violet: 3 } }); // the seeded guest's local keys
  }, amber);
  await page.waitForTimeout(1200);
  let msg = await page.evaluate((id) => window.__qaGame.getState().tryOpen(id, performance.now()), amber.id);
  if (msg) throw new Error(`tryOpen amber: ${msg}`);
  await page.waitForSelector('[data-testid="vault-hero-painted"]', { timeout: 15000 });
  await page.waitForTimeout(700);
  await shot(page, "20-modal-amber");
  notes.modalHero = await page.locator('[data-testid="vault-hero-painted"]').first().evaluate((el) => el.outerHTML);
  await page.evaluate(() => window.__qaGame.getState().closeVault());
  await page.waitForTimeout(500);

  // The Hearth card: the painting and the owner's four fields.
  await page.evaluate((h) => {
    window.__keylineMap.stand(h.lat, h.lng);
    window.__keylineMap.map().setView([h.lat, h.lng], 18, { animate: false });
  }, H);
  await page.waitForTimeout(1200);
  msg = await page.evaluate(() => window.__qaGame.getState().tryOpen("placed-qa1", performance.now()));
  if (msg) throw new Error(`tryOpen hearth: ${msg}`);
  await page.waitForSelector('[data-testid="hearth-hero-art"]', { timeout: 15000 });
  await page.waitForTimeout(700);
  await shot(page, "21-modal-hearth-fields");
  notes.hearthModalFields = await page.locator(".field-card.hearth-field .font-display").allTextContents();
  await page.evaluate(() => window.__qaGame.getState().closeVault());
  await page.waitForTimeout(500);

  // "Your Hearth" owner card.
  await page.evaluate(() => window.__keylinePlant.setPlant({ ownerOpen: true, ownerV: 1 }));
  await page.waitForSelector('[data-testid="ho-vault-art"]', { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot(page, "22-hearth-owner-card");
  await page.evaluate(() => window.__keylinePlant.setPlant({ ownerOpen: false }));

  // The placement preview (ghost) uses the same painting.
  await page.evaluate((a) => {
    window.__keylineMap.place(a.lat, a.lng);
    window.__keylinePlant.setPlant({ placing: true, name: 0, cats: ["history", "science"], v: 1 });
  }, at);
  await page.waitForSelector(".hearth-ghost img", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await clearPops(page, 2);
  await shot(page, "23-hearth-placement-ghost");
  notes.ghost = await page.locator(".hearth-ghost").first().evaluate((el) => el.outerHTML).catch(() => null);
  await page.evaluate(() => window.__keylinePlant.setPlant({ placing: false, ghost: null }));
  await page.waitForTimeout(400);

  // ───────────── 2. Equip a skin on the live map (no reload): pins swap to the skinnable SVG vault ─────────────
  await page.evaluate(() => {
    document.getElementById("qa-tag").textContent = "seeded guest · local save · copper skin seeded (no purchase)";
  });
  await view(page, at.lat, at.lng, 18);
  const before = await page.evaluate(() => ({ painted: document.querySelectorAll(".painted-vault-pin:not(.hearth-pin):not(.comet-pin)").length, svg: document.querySelectorAll(".vault-pin > svg.vk-vault").length }));
  await page.evaluate(() => {
    const g = window.__qaGame;
    const w = g.getState().wardrobe;
    g.setState({ wardrobe: { ...w, owned: [...new Set([...w.owned, "copper"])], lantern: "copper", at: Date.now() } });
  });
  await page.waitForTimeout(1500);
  await clearPops(page, 2);
  const after = await page.evaluate(() => ({
    painted: document.querySelectorAll(".painted-vault-pin:not(.hearth-pin):not(.comet-pin)").length,
    svg: document.querySelectorAll(".vault-pin > svg.vk-vault").length,
    hearthPainted: document.querySelectorAll(".hearth-pin img.hearth-sprite").length,
    cometPainted: document.querySelectorAll(".comet-pin img").length,
    lantern: document.documentElement.dataset.lantern ?? null,
  }));
  notes.skinSwap = { before, after };
  await shot(page, "30-map-skinned-copper-z18");
  await view(page, c2.lat, c2.lng, 18);
  await cropPin(page, ".vault-pin:not(.painted-vault-pin)", c2.lat, c2.lng, `31-pin-skinned-copper-${c2.tier}`);
  await view(page, a.lat, a.lng, 18);
  await cropPin(page, ".vault-pin.cooling:not(.painted-vault-pin)", a.lat, a.lng, `32-pin-skinned-cooling-${a.tier}`);
  await view(page, b.lat, b.lng, 18);
  await cropPin(page, ".vault-pin.locked-out:not(.painted-vault-pin)", b.lat, b.lng, `32-pin-skinned-locked-${b.tier}`);
  await view(page, H.lat - 0.0001, H.lng, 18);
  await shot(page, "33-map-skinned-hearths-stay-painted");
  // The card keeps the SVG hero for a skinned walker.
  await page.evaluate((p) => {
    window.__keylineMap.stand(p.lat, p.lng);
    window.__keylineMap.map().setView([p.lat, p.lng], 18, { animate: false });
  }, amber);
  await page.waitForTimeout(1200);
  msg = await page.evaluate((id) => window.__qaGame.getState().tryOpen(id, performance.now()), amber.id);
  if (msg) throw new Error(`tryOpen amber (skinned): ${msg}`);
  await page.waitForSelector('[data-testid="vault-hero-art"]', { timeout: 15000 });
  await page.waitForTimeout(700);
  await shot(page, "34-modal-skinned-copper");
  await page.evaluate(() => window.__qaGame.getState().closeVault());
  // Take the skin off again: back to the paintings, still no reload.
  await page.evaluate(() => {
    const g = window.__qaGame;
    g.setState({ wardrobe: { ...g.getState().wardrobe, lantern: null, at: Date.now() } });
  });
  await page.waitForTimeout(1200);
  notes.skinSwap.off = await page.evaluate(() => ({ painted: document.querySelectorAll(".painted-vault-pin:not(.hearth-pin):not(.comet-pin)").length, svg: document.querySelectorAll(".vault-pin > svg.vk-vault").length }));

  // The print shop's swatches stay the SVG case (look only: nothing is pressed).
  await page.evaluate(() => window.__qaGame.setState({ shopOpen: true }));
  await page.waitForTimeout(800);
  const tab = page.getByRole("tab", { name: /Print shop/i }).or(page.getByRole("button", { name: /Print shop/i }));
  if (await tab.count()) {
    await tab.first().click().catch(() => {});
    await page.waitForTimeout(800);
    const sw = page.locator('[data-testid^="vault-skin-"]').first();
    if (await sw.count()) {
      await sw.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(400);
      notes.shopSwatches = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="vault-skin-"]')].map((el) => ({ skin: el.getAttribute("data-lantern"), svg: el.querySelectorAll("svg.vk-vault").length, img: el.querySelectorAll("img").length })));
      await shot(page, "35-print-shop-swatches-svg");
    }
  }
  await browser.close();
}

// ───────────── 3. 4× inspection close-ups, in the running game at the default zoom (deviceScaleFactor 4) ─────────────
{
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 4, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`closeups: pageerror ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`closeups: console ${m.text()}`);
  });
  await page.addInitScript((city) => localStorage.setItem("keyline-save-v1", JSON.stringify({ version: 2, cityId: city, howtoDone: true, tutorial: 4 })), CITY);
  await page.goto(`${base}/?comet=open`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".city-blade:not([disabled])", { timeout: 120000 });
  await page.waitForTimeout(800);
  await page.click(".city-blade");
  await page.waitForTimeout(1200);
  const guest = page.getByRole("button", { name: "Continue as guest" });
  if (await guest.count()) await guest.click();
  await page.waitForSelector('[data-testid="hud-status"]', { timeout: 120000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => (window.__qaGame = window.__keyline));
  mkdirSync(`${out}/closeups`, { recursive: true });
  const pois = await cityVaults(page);
  const zoom = await page.evaluate(() => window.__keylineMap.map().getZoom());
  const at = await page.evaluate(() => window.__keylineMap.pos());
  // Park the walker away so no scout stands over a pin.
  const far = pois[pois.length - 1];
  await page.evaluate((f) => window.__keylineMap.place(f.lat, f.lng), far);
  const [a, b] = pois.slice(0, 2);
  await page.evaluate(
    ({ a, b }) => {
      const g = window.__qaGame;
      const until = Date.now() + 3 * 3600_000;
      g.setState({ vaults: { ...g.getState().vaults, [a.id]: { state: "cooling", coolUntil: until }, [b.id]: { state: "cooling", coolUntil: until, lockout: true } } });
    },
    { a, b },
  );
  let H = null;
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -6; dx <= 6; dx++) {
      const c = { lat: at.lat + dy * 0.0004, lng: at.lng + dx * 0.0005 };
      const room = Math.min(...pois.map((p) => Math.hypot(p.lat - c.lat, (p.lng - c.lng) * 0.86)));
      if (!H || room > H.room) H = { ...c, room };
    }
  await page.evaluate((h) => window.__keylinePlant.show([h], { unlocked: true, mine: null }, false), hearthView("placed-qa1", H.lat, H.lng, 0, ["history", "science", "music", "games"]));
  await rebuild(page);
  const sizes = {};
  for (const t of TIERS) {
    const p = pois.find((x) => x.tier === t && x.id !== a.id && x.id !== b.id);
    await view(page, p.lat, p.lng, zoom);
    const box = await cropPin(page, `.painted-vault-pin.tier-${t}:not(.hearth-pin):not(.comet-pin)`, p.lat, p.lng, `closeups/ingame-4x-${t}`, 10);
    sizes[t] = `${box.w}x${box.h}`;
  }
  await view(page, a.lat, a.lng, zoom);
  await cropPin(page, ".painted-vault-pin.cooling", a.lat, a.lng, `closeups/ingame-4x-cooling-${a.tier}`, 10);
  await view(page, b.lat, b.lng, zoom);
  await cropPin(page, ".painted-vault-pin.locked-out", b.lat, b.lng, `closeups/ingame-4x-locked-${b.tier}`, 10);
  await view(page, H.lat, H.lng, zoom);
  const hb = await cropPin(page, ".hearth-pin", H.lat, H.lng, "closeups/ingame-4x-hearth", 10);
  sizes.hearth = `${hb.w}x${hb.h}`;
  const comet = await page.evaluate(() => window.__keylineMap.comet());
  if (comet) {
    await view(page, comet.lat, comet.lng, zoom);
    const cb = await cropPin(page, ".comet-pin", comet.lat, comet.lng, "closeups/ingame-4x-comet-for-scale", 10);
    sizes.comet = `${cb.w}x${cb.h}`;
  }
  notes.closeups = { zoom, cssBoxes: sizes };
  await browser.close();
}

writeFileSync(`${out}/shots.json`, JSON.stringify({ notes, errors }, null, 2));
console.log(JSON.stringify({ notes, errors }, null, 2));
