// 0.1.14: lanterns, vaults and street matches spread over the play area; a modest new-district bonus.
import assert from "node:assert/strict";
import test from "node:test";
import { CITIES, CITY_LIST } from "./data.ts";
import { distM, dest } from "./geo.ts";
import { createGraph, ingestLine, scatterStreetLamps, spreadDrop, startReach, SPREAD_MIN_M, type Pt } from "./streets.ts";
import { districtOf, districtsInDetails, FRESH_DISTRICT_DAY_CAP, isFreshDistrict } from "./district.ts";
import { emptyWallet, gradeGrant, type GradePay } from "./wallet.ts";
import { marketAt, pointOnMarket } from "./nightMarket.ts";

function grid(o: Pt, span = 2600, step = 120) {
  const g = createGraph(o.lat, o.lng);
  for (let x = -span; x <= span; x += step) {
    for (const [a, b] of [
      [dest(o.lat, o.lng, -span, x), dest(o.lat, o.lng, span, x)],
      [dest(o.lat, o.lng, x, -span), dest(o.lat, o.lng, x, span)],
    ] as [Pt, Pt][]) {
      const pts: Pt[] = [];
      for (let i = 0; i <= 40; i++) pts.push({ lat: a.lat + ((b.lat - a.lat) * i) / 40, lng: a.lng + ((b.lng - a.lng) * i) / 40 });
      ingestLine(g, pts);
    }
  }
  return g;
}

test("street matches keep SPREAD_MIN_M from everything lit and are not a downtown clump", () => {
  const o = CITIES.chicago.spawn;
  const g = grid(o);
  const reach = startReach(g, o);
  const lit: Pt[] = [...CITIES.chicago.pois];
  let close = 0;
  let core = 0;
  const n = 60;
  for (let i = 0; i < n; i++) {
    const p = spreadDrop(g, o, 220, 2200, reach, lit);
    if (lit.some((q) => distM(p.lat, p.lng, q.lat, q.lng) < SPREAD_MIN_M)) close++;
    if (distM(p.lat, p.lng, o.lat, o.lng) < 1000) core++;
    lit.push(p);
  }
  assert.ok(close <= 3, `${close} of ${n} drops landed within ${SPREAD_MIN_M} m of a lit spot`);
  assert.ok(core / n < 0.3, `${Math.round((100 * core) / n)}% of drops in the 1 km core`);
});

test("unnamed lamps fill the play area, never closer than 150 m, inside 2.8 km", () => {
  const c = CITIES.chicago;
  const g = grid(c.spawn, 3200);
  const lamps = scatterStreetLamps(g, [c.spawn, ...c.pois], c.id);
  assert.ok(lamps.length >= 30, `only ${lamps.length} lamps`);
  for (const a of lamps) {
    assert.ok(distM(a.lat, a.lng, c.spawn.lat, c.spawn.lng) <= 2800 + 1, `${a.name} is outside the play area`);
    for (const b of lamps) if (a !== b) assert.ok(distM(a.lat, a.lng, b.lat, b.lng) >= 150, `${a.name} / ${b.name}`);
  }
  const quads = new Set(lamps.map((p) => `${p.lat > c.spawn.lat ? "N" : "S"}${p.lng > c.spawn.lng ? "E" : "W"}`));
  assert.equal(quads.size, 4);
});

test("every city has at least 3 vaults outside the 1 km core, and no two vaults share a spot", () => {
  for (const c of CITY_LIST) {
    const out = c.pois.filter((p) => distM(p.lat, p.lng, c.spawn.lat, c.spawn.lng) > 1000);
    assert.ok(out.length >= 3, `${c.id}: ${out.length}`);
    const ids = new Set(c.pois.map((p) => p.id));
    assert.equal(ids.size, c.pois.length, `${c.id} duplicate poi id`);
  }
});

test("district squares and the daily cap", () => {
  const s = CITIES.austin.spawn;
  assert.equal(districtOf("austin", s.lat, s.lng), "0:0");
  const far = dest(s.lat, s.lng, 1700, -900);
  assert.equal(districtOf("austin", far.lat, far.lng), "2:-1");
  assert.equal(districtOf("austin", 0, 0), "");
  assert.equal(isFreshDistrict("1:1", ["0:0"]), true);
  assert.equal(isFreshDistrict("0:0", ["0:0"]), false);
  const full = Array.from({ length: FRESH_DISTRICT_DAY_CAP }, (_, i) => `${i}:9`);
  assert.equal(isFreshDistrict("5:5", full), false);
  assert.deepEqual(districtsInDetails(['{"g":"great","c":"austin","d":"1:-2"}', '{"g":"miss","d":"3:3"}', '{"g":"good"}']), ["1:-2"]);
});

function pay(over: Partial<GradePay> = {}): GradePay {
  return {
    correct: true, elapsedMs: 3000, mult: 1, city: "austin", diff: 2, clearTier: "blue", poiTier: "blue", poiId: "ut-tower",
    lat: 30.28, lng: -97.74, series: null, step: 0, steps: 1, prior: [], streak: 0, loot: 1, lucky: false, cloth: null,
    charmDay: "", charmTopics: [], topic: null, dealtAt: Date.UTC(2026, 9, 16, 18, 20), luckyHit: false, perfectBlue: false, ...over,
  };
}

test("a fresh district pays +25% of the lamp, labelled; never on a night-market lamp", () => {
  const plain = gradeGrant(emptyWallet(), pay());
  const fresh = gradeGrant(emptyWallet(), pay({ freshDistrict: true }));
  assert.ok(plain.award && fresh.award);
  const extra = fresh.award.coins - plain.award.coins;
  assert.ok(extra > 0 && extra <= Math.ceil(plain.award.coins * 0.25) + 1, `extra ${extra} on ${plain.award.coins}`);
  assert.ok(fresh.award.boosts.some((b) => b.startsWith("New district +")));
  // Find an open market and grade a lamp on its street.
  let at = Date.UTC(2026, 9, 16, 18, 1);
  let m = marketAt("austin", at);
  for (let i = 0; !m && i < 48; i++) m = marketAt("austin", (at += 3600_000));
  assert.ok(m, "an austin market opens in two days");
  const spot = pointOnMarket(m!.street);
  const onMarket = gradeGrant(emptyWallet(), pay({ dealtAt: at, lat: spot.lat, lng: spot.lng, poiId: "", freshDistrict: true }));
  assert.ok(!onMarket.award!.boosts.some((b) => b.startsWith("New district")), "market lamp got the district bonus");
});
