import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES } from "./data.ts";
import {
  PASS_POINTS,
  RUNS_PER_PASS,
  chooseStart,
  cleanUnlocks,
  freshUnlocks,
  goalsCheck,
  lampLit,
  lockLine,
  migrateUnlocks,
  passProgress,
  runFinished,
  unlockCity,
  unlockCost,
  type CityUnlocks,
} from "./cityPass.ts";
import type { CityId, Tier } from "./types.ts";

const started = (id: CityId = "austin"): CityUnlocks => chooseStart(freshUnlocks(), id);
const light = (u: CityUnlocks, tiers: Tier[]) => tiers.reduce((acc, t) => lampLit(acc, t).u, u);
const allPlaces = (id: CityId) => Object.fromEntries(CITIES[id].pois.map((p) => [p.id, true as const]));

test("pass math: amber 1, red 4, violet 10; every 10 points is a pass and the rest carries", () => {
  assert.equal(PASS_POINTS, 10);
  let u = started();
  assert.deepEqual([lampLit(u, "white").earned, lampLit(u, "blue").earned, lampLit(u, "green").earned], [0, 0, 0]);
  assert.equal(lampLit(u, "white").u.lampPts, 0, "white/blue/green lamps don't count");
  assert.equal(lampLit(u, "amber").u.lampPts, 1);
  assert.equal(lampLit(u, "red").u.lampPts, 4);
  const v = lampLit(u, "violet");
  assert.equal(v.earned, 1, "one violet is a whole pass");
  assert.equal(v.u.passes, 1);
  assert.equal(v.u.lampPts, 0);
  u = light(u, Array(9).fill("amber"));
  assert.equal(u.passes, 0);
  assert.equal(u.lampPts, 9);
  const tenth = lampLit(u, "amber");
  assert.equal(tenth.earned, 1, "10 ambers = a pass");
  assert.equal(tenth.u.lampPts, 0);
  u = light(started(), ["red", "red", "red"]);
  assert.equal(u.passes, 1, "red ×3 = 12 points → a pass");
  assert.equal(u.lampPts, 2, "2 points carry over");
  u = lampLit(light(started(), ["amber", "amber", "amber"]), "violet").u;
  assert.equal(u.passes, 1);
  assert.equal(u.lampPts, 3, "3 + 10 = 13 → one pass, 3 carried");
});

test("a new player picks any of the 15 cities to start; nothing else is open", () => {
  const fresh = freshUnlocks();
  for (const id of Object.keys(CITIES) as (keyof typeof CITIES)[]) assert.equal(unlockCost(fresh, id), "start");
  const u = started("chicago");
  assert.deepEqual(u.unlocked, ["chicago"]);
  assert.equal(chooseStart(u, "nyc"), u, "the start is chosen once");
  assert.equal(unlockCost(u, "chicago"), "open");
});

test("the second city is free, any city; the third needs a pass", () => {
  let u = started("austin");
  assert.equal(unlockCost(u, "london"), "free");
  assert.match(lockLine(u, "london"), /free/);
  const second = unlockCity(u, "london")!;
  assert.equal(second.paid, "free");
  u = second.u;
  assert.deepEqual(u.unlocked, ["austin", "london"]);
  assert.equal(u.freePick, false);
  assert.equal(u.passes, 0, "the free pick costs no pass");
  assert.equal(unlockCost(u, "nyc"), "locked");
  assert.equal(unlockCity(u, "nyc"), null, "no pass, no third city");
  assert.match(lockLine(u, "nyc"), /city pass/);
  u = lampLit(u, "violet").u;
  assert.equal(unlockCost(u, "nyc"), "pass");
  const third = unlockCity(u, "nyc")!;
  assert.equal(third.paid, "pass");
  assert.equal(third.u.passes, 0);
  assert.deepEqual(third.u.unlocked, ["austin", "london", "nyc"]);
  assert.equal(unlockCity(third.u, "nyc"), null, "already open");
  // A banked pass doesn't eat the free pick.
  const banked = unlockCity(lampLit(started(), "violet").u, "sf")!;
  assert.equal(banked.paid, "free");
  assert.equal(banked.u.passes, 1);
});

test("goals route: every place in an unlocked city pays one pass, once", () => {
  const u = started("temple");
  const part = passProgress(u, "temple", {});
  assert.equal(part.goals.have, 0);
  assert.equal(part.goals.need, CITIES.temple.pois.length);
  assert.equal(goalsCheck(u, "temple", {}).earned, 0);
  const done = goalsCheck(u, "temple", allPlaces("temple"));
  assert.equal(done.earned, 1);
  assert.equal(done.u.passes, 1);
  assert.equal(goalsCheck(done.u, "temple", allPlaces("temple")).earned, 0, "once per city");
  assert.equal(goalsCheck(u, "nyc", allPlaces("nyc")).earned, 0, "only in an unlocked city");
});

test("Lantern Run route: the 3rd paid run in a city pays one pass, once per city, counted per city", () => {
  let u = unlockCity(started("austin"), "denver")!.u;
  assert.equal(RUNS_PER_PASS, 3);
  u = runFinished(u, "austin").u;
  u = runFinished(u, "denver").u;
  u = runFinished(u, "austin").u;
  assert.equal(u.passes, 0, "2 in Austin + 1 in Denver is not 3 in one city");
  const third = runFinished(u, "austin");
  assert.equal(third.earned, 1);
  assert.equal(third.u.passes, 1);
  assert.equal(runFinished(third.u, "austin").earned, 0, "later runs there don't pay again");
  assert.equal(passProgress(third.u, "austin", {}).runs.paid, true);
  assert.equal(passProgress(third.u, "denver", {}).runs.have, 1);
});

test("migration: an old save keeps every city it played plus one free pass", () => {
  const atlas = { ...allPlaces("temple"), [CITIES.nyc.pois[0]!.id]: true as const };
  const u = migrateUnlocks({
    cityId: "austin",
    atlas,
    dailyPaid: ["2026-09-01|chicago", "2026-09-02|chicago", "2026-09-03|chicago", "2026-09-04|seattle"],
    quests: { circuit: { austin: { red: false, ward: false }, boston: { red: true, ward: false }, la: { red: false } } },
    journey: { from: "austin", to: "detroit" },
  });
  assert.equal(u.start, "austin");
  assert.deepEqual([...u.unlocked].sort(), ["austin", "boston", "chicago", "detroit", "nyc", "seattle", "temple"]);
  assert.ok(!u.unlocked.includes("la"), "an empty circuit entry isn't progress");
  assert.equal(u.passes, 1, "one free pass");
  assert.equal(u.freePick, false, "already holds more than one city");
  assert.deepEqual(u.goalsPaid, ["temple"], "goals finished before the update are counted, not paid again");
  assert.deepEqual(u.runsPaid, ["chicago"]);
  assert.equal(u.runs.seattle, 1);
  assert.equal(goalsCheck(u, "temple", atlas).earned, 0);
  // A one-city old save still has its free second pick, and the pass on top.
  const solo = migrateUnlocks({ cityId: "detroit" });
  assert.deepEqual(solo.unlocked, ["detroit"]);
  assert.equal(solo.freePick, true);
  assert.equal(solo.passes, 1);
  assert.equal(unlockCity(unlockCity(solo, "nola")!.u, "sf")!.paid, "pass");
  assert.deepEqual(migrateUnlocks({}).unlocked, ["austin"], "an empty old save keeps the old default city");
  // Round-trips through the save validator.
  assert.deepEqual(cleanUnlocks(JSON.parse(JSON.stringify(u))), u);
  assert.deepEqual(cleanUnlocks({ unlocked: ["mars", "nyc"], passes: -3, lampPts: 99 }).unlocked, ["nyc"]);
  assert.equal(cleanUnlocks({ passes: -3 }).passes, 0);
  assert.equal(cleanUnlocks(null).start, null);
});

test("store wiring: the save carries unlocks, old saves migrate, pickCity and the train respect locks", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  assert.match(src, /cities: s\.cities/, "persisted");
  assert.match(src, /migrateUnlocks\(saved\)/, "old saves migrate");
  assert.match(src, /lampLit\(/);
  assert.match(src, /goalsCheck\(/);
  assert.match(src, /runFinished\(/);
  const board = src.slice(src.indexOf("boardFare: (to) =>"), src.indexOf("chooseRideGame: (game) =>"));
  assert.match(board, /isUnlocked\(/, "the train won't board a locked city");
  const pick = src.slice(src.indexOf("pickCity: (id) =>"), src.indexOf("setHud: (h) =>"));
  assert.match(pick, /isUnlocked\(|chooseStart\(/);
});

test("a friend ticket from a locked city still opens as a one-card preview", async () => {
  const { readFileSync } = await import("node:fs");
  const page = readFileSync(new URL("../routes/t/$token.tsx", import.meta.url), "utf8");
  // The ticket page plays the card without consulting (or changing) the player's city unlocks or save.
  assert.doesNotMatch(page, /cityPass|@\/game\/store|isUnlocked|unlockCost/);
  assert.match(page, /preview/i, "says it's a one-card preview");
  // The server side of tickets carries no city gate either.
  for (const f of ["./friendService.ts", "./friendHandlers.ts", "./friendCards.ts"]) {
    assert.doesNotMatch(readFileSync(new URL(f, import.meta.url), "utf8"), /cityPass|unlocked/);
  }
  // And a locked city never blocks the ticket's card: the lock only gates walking there.
  const u = unlockCity(started("austin"), "london")!.u;
  assert.equal(unlockCost(u, "nola"), "locked");
});

test("a new player's city picker comes before the gift note", async () => {
  const { readFileSync } = await import("node:fs");
  const gift = readFileSync(new URL("../components/keyline/GiftNote.tsx", import.meta.url), "utf8");
  assert.match(gift, /cities\.start/, "the gift note reads whether a start city is picked");
  assert.match(gift, /if \(!userId \|\| !started\) return;/, "and asks for gifts only after it is");
  const title = readFileSync(new URL("../components/keyline/TitleScreen.tsx", import.meta.url), "utf8");
  assert.match(title, /if \(!g\.cities\.start\) \{\s*setScreen\("cities"\);/, "the title sends a new player to the picker first");
});
