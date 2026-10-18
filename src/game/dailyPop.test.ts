// 0.0.90: auto morning crate, once-a-day blitz offer, one-tap route cancel, no auto-route on a new train ticket.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SEED, STREET_CAP, STREET_DAY_CAP, streetSpot } from "./streetSpots.ts";
import { autoCrateDue, blitzOfferDue, playerFree, type FreeState } from "./dailyPop.ts";

const src = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8");
const body = (s: string, head: string) => {
  const i = s.indexOf(head);
  assert.ok(i > 0, head);
  return s.slice(i, s.indexOf("\n  },\n", i));
};

/** The store's flow in miniature: every graded answer checks autoCrateDue, a claim stamps the day. */
function day(answers: number, lastCrateDay: string, today: string) {
  let last = lastCrateDay;
  let claims = 0;
  for (let i = 0; i < answers; i++) {
    if (autoCrateDue(last, today)) {
      claims++;
      last = today;
    }
  }
  return { claims, last };
}

test("crate auto-claims once after the day's first answer, never twice in a day", () => {
  assert.deepEqual(day(1, "2026-10-16", "2026-10-17"), { claims: 1, last: "2026-10-17" });
  assert.equal(day(12, "2026-10-16", "2026-10-17").claims, 1, "many answers, one crate");
  assert.equal(day(5, "2026-10-17", "2026-10-17").claims, 0, "already claimed at the counter today");
  assert.equal(day(0, "", "2026-10-17").claims, 0, "no answer, no crate");
  assert.equal(day(1, "", "2026-10-17").claims, 1, "first day ever");
  const next = day(3, day(3, "2026-10-16", "2026-10-17").last, "2026-10-18");
  assert.equal(next.claims, 1, "new day, new crate");
});

test("store: settleAnswer claims the crate through claimCrate (its once-a-day guard, streak and server op stay)", () => {
  const s = src("./store.ts");
  const settle = body(s, "  settleAnswer: (out, now) => {");
  assert.match(settle, /if \(autoCrateDue\(get\(\)\.lastCrateDay, today\(\)\)\) get\(\)\.claimCrate\(true\);/);
  const claim = body(s, "  claimCrate: (auto) => {");
  assert.match(claim, /if \(get\(\)\.lastCrateDay === d\) return;/);
  assert.match(claim, /nextCrateStreak\(/);
  assert.match(claim, /pushOp\(\{ kind: "crate" \}\)/);
  assert.match(claim, /cratePop: \{ day, line: crateLine\(loot\) \}/);
});

test("blitz offer: once a day, and only when today's blitz is due", () => {
  assert.equal(blitzOfferDue("", "", "2026-10-17"), true);
  assert.equal(blitzOfferDue("2026-10-16", "2026-10-16", "2026-10-17"), true);
  assert.equal(blitzOfferDue("2026-10-17", "", "2026-10-17"), false, "already offered today");
  assert.equal(blitzOfferDue("", "2026-10-17", "2026-10-17"), false, "blitz already played today");
  const s = src("./store.ts");
  const dismiss = body(s, "  dismissCratePop: () => {");
  assert.match(dismiss, /blitzOfferDue\(get\(\)\.lastBlitzOfferDay, get\(\)\.lastBlitzDay, d\)/);
  assert.match(dismiss, /lastBlitzOfferDay: d/);
  assert.match(s, /lastBlitzOfferDay: s\.lastBlitzOfferDay,/, "offer day is saved, so a reload doesn't offer again");
  const answer = body(s, "  answerBlitzOffer: (play) => {");
  assert.match(answer, /if \(play\) get\(\)\.openBlitz\(\);/);
});

test("pop-ups wait until the player is free", () => {
  const free: FreeState = { openVault: null, loot: null, hqOpen: false, invOpen: false, shopOpen: false, guideOpen: false, errandOpen: null, blitzOpen: false, journey: null };
  assert.equal(playerFree(free), true);
  for (const k of Object.keys(free) as (keyof FreeState)[]) {
    const busy = { ...free, [k]: typeof free[k] === "boolean" ? true : {} };
    assert.equal(playerFree(busy), false, `${k} blocks the pop-up`);
  }
});

test("a newly earned train ticket does not auto-route to the station (only a deliberate tap / T does)", () => {
  const g = src("../components/keyline/GameMap.tsx");
  assert.ok(!/s\.fares > p\.fares\)\s*\{[^}]*setDestination/.test(g), "fares 0→1 must not call setDestination");
  assert.ok(!/fares\s*>\s*p\.fares/.test(g), "no subscription reacting to a ticket being earned");
});

test("route: a ✕ beside the Route pill from one stop up cancels the whole route; Esc too when nothing is open", () => {
  const h = src("../components/keyline/Hud.tsx");
  assert.match(h, /hud\.routeStops >= 1 \|\| hud\.waypoint \?/, "0.0.95: the Stop chip shows during any walk");
  assert.match(h, /data-testid="route-cancel"[\s\S]*?onClick=\{\(\) => useGame\.getState\(\)\.cancelRoute\(\)\}/);
  const s = src("./store.ts");
  assert.match(s, /cancelRoute: \(\) => set\(\{ routeCancel: get\(\)\.routeCancel \+ 1 \}\)/);
  const g = src("../components/keyline/GameMap.tsx");
  assert.match(g, /if \(s\.routeCancel !== p\.routeCancel\) clearRoute\(\);/);
  assert.match(g, /if \(!panel\) clearRoute\(\);/);
  const css = src("../styles.css");
  assert.match(css, /\.route-cancel\{[^}]*min-width:76px;min-height:40px/, "0.0.95: a big red Stop chip");
});

test("street matches doubled: 18 opening, cap 16 (10 at pocket 5+), 14s–39s spawns, 80 claims a city-day", () => {
  assert.equal(SEED.length, 18);
  assert.equal(SEED.filter((t) => t === "white").length, 12, "same 2:1 white/blue opening");
  assert.equal(SEED.filter((t) => t === "blue").length, 6);
  assert.equal(STREET_DAY_CAP, 80);
  assert.equal(STREET_CAP, 6400);
  assert.ok(STREET_CAP * 14 >= 86_400, "a full day at the 14s floor fits under the spot list");
  for (let i = 0; i < SEED.length; i++) assert.equal(streetSpot("p", "austin", "2026-10-17", i)!.tier, SEED[i]);
  for (let i = 0; i < 2000; i++) assert.notEqual(streetSpot("p", "austin", "2026-10-17", i)!.tier, "violet", "violet stays off the curb");
  assert.equal(streetSpot("p", "austin", "2026-10-17", STREET_CAP), null);
  const s = src("./store.ts");
  assert.match(s, /return pocket >= 15 \? 10 : 16;/, "0.0.94: cap 16 until 15+ held");
  assert.match(s, /Math\.max\(14_000, 39_000 - playMin \* 450\)/);
  assert.doesNotMatch(s, /if \(pocket >= 7\) return;/, "0.0.93: the pocket>=7 spawn pause is gone");
  assert.match(s, /function seedKeys\(cityId: CityId, n = SEED\.length\)/);
});

test("I'm stuck: closes everything, re-binds, and moves the walker back to the start — no rewards touched", () => {
  const s = src("./store.ts");
  const un = body(s, "  unstick: () => {");
  assert.match(un, /if \(get\(\)\.openVault\) get\(\)\.closeVault\(\);/);
  for (const k of ["hqOpen: false", "invOpen: false", "shopOpen: false", "errandOpen: null", "guideOpen: false", "blitzOpen: false", "unstuck: get().unstuck + 1"]) assert.ok(un.includes(k), k);
  assert.match(un, /get\(\)\.bindStreet\(\);/);
  for (const bad of ["vaults", "coolUntil", "keys", "points", "coins", "lastCrateDay", "lastBlitzDay", "dealTrivia", "seenIds"]) assert.ok(!un.includes(bad), `unstick must not touch ${bad}`);
  const g = src("../components/keyline/GameMap.tsx");
  const i = g.indexOf("if (s.unstuck !== p.unstuck) {");
  assert.ok(i > 0);
  const block = g.slice(i, g.indexOf("\n      }\n", i));
  for (const k of ["exitCab();", "clearRoute();", "keysHeld.current.clear();", "city.start ?? city.spawn", "placeOnStreet(g, start.lat, start.lng)", "pos.current.speed = 0;", "setHud({ seated: false })"]) assert.ok(block.includes(k), k);
  const f = src("../components/keyline/FieldGuide.tsx");
  assert.match(f, /I'm stuck/);
  assert.match(f, /Back to the start\?/);
  assert.match(f, /useGame\.getState\(\)\.unstick\(\)/);
});

test("a wedged walker re-plans at most 3 times on a leg, then the route drops (no endless re-plan loop)", () => {
  const g = src("../components/keyline/GameMap.tsx");
  assert.match(g, /const MAX_STUCK_REPLANS = 3;/);
  const fn = g.slice(g.indexOf("function replanStuck("), g.indexOf("function endLeg()"));
  assert.match(fn, /replans\.current \+= 1;/);
  assert.match(fn, /if \(replans\.current > MAX_STUCK_REPLANS\) \{\s*clearRoute\(\);/);
  // Both stuck paths go through it; nothing re-plans a stuck leg directly any more.
  assert.equal((g.match(/replanStuck\(/g) ?? []).length, 3, "definition + two stuck sites");
  assert.ok(!/else void setDestination\(wp\.lat, wp\.lng, legDoor\.current, true\);/.test(g));
  // The counter survives the re-plan itself (keepQueue) and resets on a new leg, a fresh tap or a cleared route.
  assert.match(g, /function endLeg\(\) \{\n    replans\.current = 0;/);
  assert.match(g, /if \(!keepQueue\) \{\n      replans\.current = 0;/);
});
