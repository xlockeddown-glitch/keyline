import { test } from "node:test";
import assert from "node:assert/strict";
import { CARS, DEALERS, DEALER_REACH_M, dealerTap, carPace, carOf, isCarId } from "./cars.ts";
import { CITIES } from "./data.ts";
import { distM } from "./geo.ts";

test("0.1.8 cars: Ryan's prices and speeds, each car dearer and faster, Roadster 2.0 on top", () => {
  assert.deepEqual(CARS.map((c) => [c.id, c.price, c.pace]), [
    ["civic", 30_000, 1.05],
    ["f150", 50_000, 1.08],
    ["ioniq5", 90_000, 1.1],
    ["mustang", 150_000, 1.15],
    ["belair57", 200_000, 1.17],
    ["model3", 350_000, 1.2],
    ["roadster", 600_000, 1.22],
    ["roadster2", 2_400_000, 1.3],
  ]);
  for (let i = 1; i < CARS.length; i++) assert.ok(CARS[i]!.price > CARS[i - 1]!.price && CARS[i]!.pace > CARS[i - 1]!.pace);
  assert.equal(CARS.filter((c) => c.star).map((c) => c.id).join(), "roadster2");
  assert.equal(carPace(null), 1, "no car: the city cab");
  assert.equal(carPace("roadster2"), 1.3);
  assert.equal(carOf("nope"), null);
  assert.ok(isCarId("f150") && !isCarId("tank"));
});

test("0.1.8 dealers: one real lot per city, inside the streets the game loads round the start", () => {
  for (const c of Object.values(CITIES)) {
    const d = DEALERS[c.id];
    assert.ok(d && d.name, c.id);
    const from = c.start ?? c.spawn;
    const m = distM(from.lat, from.lng, d.lat, d.lng);
    // bootstrapStreets covers 2 km round the start; the dealer is also handed in as a hub, so the far ring reaches it.
    assert.ok(m >= 300 && m <= 3200, `${c.id} dealer ${Math.round(m)} m from the start`);
    for (const p of c.pois) assert.ok(distM(p.lat, p.lng, d.lat, d.lng) >= 25, `${c.id}: dealer sits on ${p.name}`);
  }
});

test("0.1.8: a car never touches what pays — only the seated drive speed reads it", async () => {
  const { readFileSync } = await import("node:fs");
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  const wallet = readFileSync(new URL("./wallet.ts", import.meta.url), "utf8");
  assert.ok(!/carPace|carOn/.test(wallet), "no pay path reads the car");
  const map = readFileSync(new URL("../components/keyline/GameMap.tsx", import.meta.url), "utf8");
  assert.match(map, /cabSpeed\(arterial\) \* ownPace\(\) \* drivePace\(/);
  assert.ok(!/walkSpeed\([^)]*\) \* carPace/.test(map), "walking is untouched");
  assert.match(store, /buyCar:/);
});

test("0.1.11: the car lot sign survives a cab ride — only paintDealer replaces it", async () => {
  const { readFileSync } = await import("node:fs");
  const map = readFileSync(new URL("../components/keyline/GameMap.tsx", import.meta.url), "utf8");
  const cab = map.slice(map.indexOf("function paintCab()"), map.indexOf("function paintCab()") + 600);
  assert.ok(!/dealerMarker/.test(cab), "paintCab must not touch the car lot marker");
});

test("0.1.12 lot sign tap: opens at the door, walks you there from afar, asks you out of the cab", () => {
  assert.equal(dealerTap(0, false), "open");
  assert.equal(dealerTap(DEALER_REACH_M, false), "open");
  assert.equal(dealerTap(DEALER_REACH_M + 1, false), "walk");
  assert.equal(dealerTap(500, false), "walk");
  assert.equal(dealerTap(5, true), "seated");
});

test("0.1.31: a bought car is driven in every city and session, no dealer visit", async () => {
  const { driveOf } = await import("./cars.ts");
  // Bought in Austin: the save holds the car and it's picked.
  let owned = ["civic"] as import("./cars.ts").CarId[];
  const on = driveOf(owned, "civic", false);
  assert.equal(on, "civic");
  // Train to Chicago: nothing about the car is per city, so the pick holds.
  assert.equal(driveOf(owned, on, false), "civic");
  // New device / cleared save / an old tab wrote back a carless save: the ledger's cars come back and one is driven.
  assert.equal(driveOf(owned, null, false), "civic");
  owned = ["civic", "mustang"];
  assert.equal(driveOf(owned, null, false), "mustang", "the fastest car you own");
  // Chose the city cab on purpose: respected until you pick a car again.
  assert.equal(driveOf(owned, null, true), null);
  assert.equal(driveOf([], null, false), null, "no car, the city cab");
  assert.equal(driveOf(["civic"], "f150", false), "civic", "a pick you don't own falls back to one you do");
  const { readFileSync } = await import("node:fs");
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  assert.match(store, /carOn: driveOf\(cars, get\(\)\.carOn, get\(\)\.carCab\)/, "server-owned cars are adopted and driven");
  assert.match(store, /savedCars\(e\.newValue\)/, "another tab's car isn't overwritten by this tab");
  const arrive = store.slice(store.indexOf("tickJourney:"), store.indexOf("tickJourney:") + 4000);
  assert.ok(!/carOn|carsOwned/.test(arrive), "arriving in a new city leaves the car alone");
});

test("0.1.161 painted cars: every base view ships as an RGBA webp, sides 640 px wide, and every paint variant exists", async () => {
  const { readFileSync, existsSync } = await import("node:fs");
  const { CAR_COLORS, carSprite, factoryColor } = await import("./carPaint.ts");
  const file = (p: string) => new URL(`../../public${p}`, import.meta.url);
  assert.equal(CARS.length, 8);
  for (const c of CARS) {
    for (const view of ["side", "front", "back"] as const) {
      const path = carSprite(c.id, view);
      assert.equal(path, `/sprites/cars/${c.id}-${view}.webp`);
      const buf = readFileSync(file(path));
      assert.equal(buf.toString("ascii", 0, 4), "RIFF", path);
      assert.equal(buf.toString("ascii", 8, 12), "WEBP", path);
      assert.equal(buf.toString("ascii", 12, 16), "VP8X", `${path}: extended webp (alpha)`);
      assert.ok(buf[20]! & 0x10, `${path}: alpha flag`);
      const w = 1 + buf.readUIntLE(24, 3), h = 1 + buf.readUIntLE(27, 3);
      if (view === "side") assert.equal(w, 640, `${path}: ${w}x${h}`);
      // Front and back are cut at the side's pixel density: well past 2x of the 40px map width.
      else assert.ok(w >= 280 && w <= 400, `${path}: ${w}x${h}`);
      assert.ok(h >= 180 && h < w, `${path}: ${w}x${h}`);
      assert.ok(buf.length < 80_000, `${path}: ${buf.length} bytes`);
      for (const p of CAR_COLORS[c.id]) {
        const v = carSprite(c.id, view, p.id);
        assert.equal(v.endsWith(".webp"), true);
        assert.equal(v.includes("/paint/"), p.id !== factoryColor(c.id));
        assert.ok(existsSync(file(v)), `${v} exists`);
      }
    }
  }
});

test("0.1.161 painted cars: the stylesheet points at the webps only and never pixelates the cab", async () => {
  const { readFileSync, existsSync } = await import("node:fs");
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.equal(/\/sprites\/cars\/[^")]*\.png/.test(css), false, "no car png left in the stylesheet");
  const urls = [...new Set(css.match(/\/sprites\/cars\/[^")]+\.webp/g) ?? [])];
  assert.equal(urls.length, 8 * 3 * 6, "8 cars, 3 views, 6 colours");
  for (const u of urls) assert.ok(existsSync(new URL(`../../public${u}`, import.meta.url)), `${u} exists`);
  const cab = css.match(/\n\.cab-sprite \{[^}]*\}/)?.[0] ?? "";
  assert.match(cab, /width: 56px/);
  assert.doesNotMatch(cab, /image-rendering/);
  assert.match(css, /\.cab-sprite\[data-car\]:not\(\[data-car=""\]\) \{[^}]*image-rendering: auto/);
  // The Loop skid glows under the wheels, behind the painting; the sled keeps its 0.1.157 seat on the near rails.
  assert.match(css, /\.loop-skid \{[^}]*z-index: -1;[^}]*bottom: -1px;/);
  assert.match(css, /\.loop-sled \{[^}]*left: calc\(50% \+ 6px\);\s*top: 76\.5%;[^}]*transform: scale\(3\);/);
  // The streak pixel perk keeps its own crisp scaling: it is an effect, not the car.
  assert.match(css, /\.pawn\.is-driving\.is-streak-pixel::before\s*\{[^}]*image-rendering:\s*pixelated/);
});
