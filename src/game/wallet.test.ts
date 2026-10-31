// 0.0.78 server wallet: first sync keeps the higher pocket (once), a grade pays from the server's
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
// 0.1.44: and the new-player welcome pack (welcome.test.ts covers it).
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
// 0.1.43: these tests predate the free lantern gift; keep it out of their wallets (lampGift.test.ts covers it).
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
// own formula, the same token pays once, and a spend that isn't in the pocket is refused.
import { cacheLine } from "./goals.ts";
import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks, giftPass } from "./cityPass.ts";
import { rewardPoints } from "./rewards.ts";
import { CITIES, SERIES } from "./data.ts";
import { surveyProven } from "./survey.ts";
import { SEED, STREET_DAY_CAP, streetSpot } from "./streetSpots.ts";
import { perfectRefund } from "./perfectRefund.ts";
import { TIER_VALUE } from "./rewards.ts";
import { marketAt, marketMatches } from "./nightMarket.ts";
import { FARES_CAP, matchCap, sparkTier, transitLoot } from "./ticket.ts";
import { rideReward } from "./rideGames.ts";
import { payDaily } from "./dailyRun.ts";
import { rideSeed, scoreRide } from "./rideGrade.ts";
import { whereRound } from "./whereAmI.ts";
import {
  CLOTH_CAP,
  COIN_CAP,
  FIRST_SYNC_COIN_CAP,
  KEY_CAP,
  PASS_CAP,
  WALK_CAP,
  acceptNonces,
  clothOp,
  realCloth,
  applyDelta,
  emptyWallet,
  goalOp,
  gradeGrant,
  mergeFirstSync,
  provenBoost,
  rideOp,
  spendMatchOp,
  type GradePay,
  type LocalSnap,
} from "./wallet.ts";
import { canonicalWallet, rowToState } from "./walletSql.ts";
import { DEVICE_CAP, applyClientOp, awardGrade, carsOf, grantMatchGifts, grantScoutGifts, ownedOf, grantPassGift, lightsOf, spendDealt, syncPlayer, grantCan, paintOf, housesOf, lampsToday } from "./walletApply.ts";
import { MATCH_GIFTS, SCOUT_GIFTS } from "./matchGift.ts";
import { thanksClock } from "./thanksGift.ts";

// 0.1.39: these tests predate the thank-you gift; keep it out of their wallets (thanksGift.test.ts covers it).
thanksClock.cutoff = "2000-01-01T00:00:00Z";
import { MARKET_COIN_CAP, lightOf, marketCoinX } from "./marketLights.ts";
import { tokenNonce } from "./walletClient.ts";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

const mig = (name: string) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8");

async function db(extra: string[] = []) {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (
    alias_id text primary key,
    primary_id text not null,
    how text not null,
    linked_at timestamptz not null default now()
  )`);
  await pg.exec(mig("0016_player_wallet.sql"));
  await pg.exec(mig("0003_plate_events.sql"));
  await pg.exec(mig("0014_walk_distance.sql"));
  for (const name of extra) await pg.exec(mig(name));
  return sqlOf(pg);
}

const snap = (over: Partial<LocalSnap> = {}): LocalSnap => ({
  coins: 0,
  keys: {},
  cities: freshUnlocks(),
  ...over,
});

function pay(over: Partial<GradePay> = {}): GradePay {
  return {
    correct: true,
    elapsedMs: 3000,
    mult: 1,
    city: "austin",
    diff: 2,
    clearTier: "blue",
    poiTier: "blue",
    poiId: "ut-tower",
    lat: 30.28,
    lng: -97.74,
    series: null,
    step: 0,
    steps: 1,
    prior: [],
    streak: 0,
    loot: 1,
    lucky: false,
    cloth: null,
    charmDay: "",
    charmTopics: [],
    topic: null,
    dealtAt: Date.UTC(2026, 9, 16, 18),
    luckyHit: false,
    perfectBlue: false,
    ...over,
  };
}

/** 0.1.2: markets are dark 5 of every 15 minutes; pin Date inside an open window for market tests. */
function inOpenMarket() {
  const cycle = 15 * 60_000;
  mock.timers.enable({ apis: ["Date"], now: Math.floor(Date.now() / cycle) * cycle + 5 * 60_000 });
  return () => mock.timers.reset();
}

test("a lamp grant matches the street coin formula and a short pocket can't spend", () => {
  const w = emptyWallet();
  const grant = gradeGrant(w, pay());
  assert.equal(grant.ok, true);
  if (!grant.ok) return;
  const bonus = 1 + Math.min(0.4, 1 * 0.05);
  assert.equal(grant.award?.coins, rewardPoints("blue", { mult: 1, bonus, diffMult: 1, loot: 1 }));
  assert.equal(grant.wallet.coins, grant.award?.coins);
  assert.equal(spendMatchOp(emptyWallet(), "white").ok, false);
  const held = applyDelta(emptyWallet(), { keys: { white: 2 } });
  assert.equal(held.ok, true);
  if (!held.ok) return;
  const spent = spendMatchOp(held.wallet, "white");
  assert.equal(spent.ok, true);
  if (!spent.ok) return;
  assert.equal(spent.wallet.keys.white, 1);
});

test("first sync keeps the higher of each balance, capped, and unions cities", () => {
  const server = emptyWallet();
  server.coins = 80;
  server.keys = { ...server.keys, white: 4, blue: 1 };
  const local = snap({
    coins: COIN_CAP + 5000,
    keys: { white: 1, blue: KEY_CAP + 9, green: 2 },
    cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin", "nyc"], passes: 3, freePick: false },
  });
  const merged = mergeFirstSync(server, local);
  assert.equal(merged.migrated, true);
  assert.equal(merged.coins, FIRST_SYNC_COIN_CAP);
  assert.equal(merged.keys.white, 4);
  assert.equal(merged.keys.blue, KEY_CAP);
  assert.equal(merged.keys.green, 2);
  assert.ok(merged.cities.unlocked.includes("austin"));
  assert.ok(merged.cities.unlocked.includes("nyc"));
  assert.equal(merged.cities.passes, 0);
  assert.equal(merged.meta.revised, false);
  assert.equal(merged.meta.fares, 0);
});

test("sync, award, replay and spend survive a second call and a linked sign-in", async () => {
  const sql = await db();
  const first = await syncPlayer(sql, "ann", snap({ coins: 40, keys: { white: 3 }, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"] } }), "annphone1");
  assert.equal(first.wallet.migrated, true);
  assert.equal(first.wallet.coins, 40);
  assert.equal(first.wallet.keys.white, 3);
  assert.equal(first.deviceClosed, false);

  // A grade before the revise is real money. Replaying the token does not pay it again.
  const graded = await awardGrade(sql, "ann", "n1", { ...pay(), prevNonce: "" });
  assert.equal(graded.replay, false);
  assert.ok(graded.wallet.coins > 40);
  const again = await awardGrade(sql, "ann", "n1", { ...pay({ mult: 1, elapsedMs: 1000 }), prevNonce: "" });
  assert.equal(again.replay, true);
  assert.equal(again.wallet.coins, graded.wallet.coins);

  // The one revise keeps a higher local pocket. The same device cannot raise it again after that.
  const revised = await syncPlayer(sql, "ann", snap({ coins: 40, keys: { white: 9 } }), "annphone1");
  assert.equal(revised.deviceClosed, true);
  assert.equal(revised.wallet.keys.white, 9);
  assert.ok(revised.wallet.coins >= graded.wallet.coins);
  const sameDevice = await syncPlayer(sql, "ann", snap({ coins: COIN_CAP, keys: { white: KEY_CAP } }), "annphone1");
  assert.equal(sameDevice.replay, true);
  assert.equal(sameDevice.wallet.keys.white, 9);
  assert.equal(sameDevice.wallet.coins, revised.wallet.coins);
  const cheated = await syncPlayer(sql, "ann-x", snap({ coins: COIN_CAP, keys: { white: KEY_CAP, violet: 50 } }), "annxphon1");
  // Not linked yet: ann-x is a different walker, so this sync is theirs, not Ann's.
  assert.equal(cheated.wallet.coins, FIRST_SYNC_COIN_CAP);

  await sql`insert into player_links (alias_id, primary_id, how) values ('ann-y', 'ann', 'code')`;
  const linked = await syncPlayer(sql, "ann-y", snap({ coins: 1, keys: { white: 1, violet: 80 } }), "annyphon1");
  assert.equal(linked.deviceClosed, false);
  assert.equal(linked.wallet.keys.violet, 80, "a second device keeps a higher match count");
  assert.equal(linked.wallet.keys.white, 9, "a second device does not lower a count");
  const linkedRevise = await syncPlayer(sql, "ann-y", snap({ coins: 1, keys: { violet: 1 } }), "annyphon1");
  assert.equal(linkedRevise.deviceClosed, true);
  assert.equal(linkedRevise.wallet.keys.violet, 80);
  const ann = await canonicalWallet(sql, "ann");
  const y = await canonicalWallet(sql, "ann-y");
  assert.equal(ann.id, y.id);

  const spent = await spendDealt(sql, "ann-y", "d1", "white");
  assert.equal(spent.ok, true);
  assert.equal(spent.replay, false);
  assert.equal(spent.wallet.keys.white, 8);
  const replay = await spendDealt(sql, "ann", "d1", "white");
  assert.equal(replay.replay, true);
  assert.equal(replay.wallet.keys.white, 8);
  // Drain the rest, then one more deal is refused and changes nothing.
  for (let i = 0; i < 8; i++) {
    const s = await spendDealt(sql, "ann", `d-more-${i}`, "white");
    assert.equal(s.ok, true);
  }
  const before = (await canonicalWallet(sql, "ann")).wallet.keys.white;
  assert.equal(before, 0);
  const refused = await spendDealt(sql, "ann", "d-short", "white");
  assert.equal(refused.ok, false);
  assert.equal((await canonicalWallet(sql, "ann")).wallet.keys.white, 0);

  // A street match pays once, and only when the id is on this player's city-day list.
  const day = new Date().toISOString().slice(0, 10);
  const spot = streetSpot("ann", "austin", day, 0);
  assert.ok(spot);
  const forged = await applyClientOp(sql, "ann", { kind: "street", id: "k1", tier: "violet", city: "austin", lat: 30.2, lng: -97.7 });
  assert.equal(forged.ok, false);
  assert.equal(forged.reason, "unproven");
  const street = await applyClientOp(sql, "ann", { kind: "street", id: spot!.id, tier: "violet", city: "austin", lat: 30.2, lng: -97.7 });
  assert.equal(street.ok, true);
  assert.equal(street.wallet.keys[spot!.tier], 1);
  const streetAgain = await applyClientOp(sql, "ann", { kind: "street", id: spot!.id, tier: "violet", city: "austin", lat: 30.2, lng: -97.7 });
  assert.equal(streetAgain.replay, true);
  assert.equal(streetAgain.wallet.keys[spot!.tier], 1);

  // 0.0.99 regression (Ryan's twitch): white 30 + 1/3 credit, the pickup's color at 30: the server keeps the
  // white credit and adds exactly one credit to the pickup's color (or merges at 3). Nothing lost.
  {
    const s2 = streetSpot("ann", "austin", day, 1)!;
    const { id: annId, wallet: orig } = await canonicalWallet(sql, "ann");
    const cols = { white: 30, blue: 30, green: 30, amber: 30, red: 30, violet: 30 } as Record<string, number>;
    await sql.query(`update player_wallets set white = 30, blue = 30, green = $2, amber = $3, red = $4, violet = $5, meta = meta || '{"credit":{"white":1}}'::jsonb where user_id = $1`, [annId, s2.tier === "green" ? 30 : 0, s2.tier === "amber" ? 30 : 0, s2.tier === "red" ? 30 : 0, s2.tier === "violet" ? 30 : 0]);
    void cols;
    const before2 = (await canonicalWallet(sql, "ann")).wallet;
    const r2 = await applyClientOp(sql, "ann", { kind: "street", id: s2.id, tier: s2.tier, city: "austin", lat: 30.2, lng: -97.7 });
    assert.equal(r2.ok, true);
    const after2 = (await canonicalWallet(sql, "ann")).wallet;
    assert.equal(after2.keys[s2.tier], 30, "pocket stays at 30");
    const want = s2.tier === "white" ? { white: 2 } : s2.tier === "violet" ? { white: 1 } : { white: 1, [s2.tier]: 1 };
    assert.deepEqual(after2.meta.credit, want);
    if (s2.tier === "violet") assert.ok(after2.coins > before2.coins, "full violet pays coin");
    assert.deepEqual(r2.view.credit, want, "the view the device adopts carries the same credit");
    const k = orig.keys;
    await sql.query(`update player_wallets set coins = $2, white = $3, blue = $4, green = $5, amber = $6, red = $7, violet = $8, meta = meta || '{"credit":{}}'::jsonb where user_id = $1`, [annId, orig.coins, k.white, k.blue, k.green, k.amber, k.red, k.violet]);
  }

  // The same bank trade posted twice is one trade. The matches come from a device merge, not from the street.
  const topped = await syncPlayer(sql, "ann", snap({ keys: { white: 4 } }), "annbank01");
  assert.equal(topped.wallet.keys.white, 4);
  const up = await applyClientOp(sql, "ann", { kind: "bank", dir: "up", tier: "white" });
  assert.equal(up.ok, true);
  assert.equal(up.wallet.keys.white, 0);
  assert.equal(up.wallet.keys.blue, (topped.wallet.keys.blue ?? 0) + 1);
  const upAgain = await applyClientOp(sql, "ann", { kind: "bank", dir: "up", tier: "white" });
  assert.equal(upAgain.replay || !upAgain.ok, true);
  assert.equal(upAgain.wallet.keys.white, up.wallet.keys.white);
  assert.equal(upAgain.wallet.keys.blue, up.wallet.keys.blue);
});

test("a second device unions cities and only raises a counter", async () => {
  const sql = await db();
  const first = await syncPlayer(
    sql,
    "bea",
    snap({
      coins: 100,
      keys: { white: 4 },
      cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], passes: 5, goalsPaid: ["austin"], freePick: false },
    }),
    "beaphone1",
  );
  await syncPlayer(sql, "bea", snap({ coins: 100, keys: { white: 4 } }), "beaphone1");
  const second = await syncPlayer(
    sql,
    "bea",
    snap({
      coins: 10,
      keys: { white: 1, green: 2 },
      cities: { ...freshUnlocks(), start: "nyc", unlocked: ["nyc"], passes: 1, goalsPaid: ["nyc"], freePick: false },
    }),
    "beaphone2",
  );
  assert.equal(second.wallet.coins, 100);
  assert.equal(second.wallet.keys.white, 4);
  assert.equal(second.wallet.keys.green, 2);
  assert.equal(second.wallet.cities.passes, 1, "0.0.90: only the one-time free pass");
  assert.ok(second.wallet.cities.unlocked.includes("austin"));
  assert.ok(second.wallet.cities.unlocked.includes("nyc"));
  assert.deepEqual(second.wallet.cities.goalsPaid, []);
  assert.equal(first.wallet.cities.start, "austin");
  const raised = await syncPlayer(sql, "bea", snap({ coins: 250, keys: { white: 9 } }), "beaphone2");
  assert.equal(raised.deviceClosed, true);
  assert.equal(raised.wallet.coins, 250);
  assert.equal(raised.wallet.keys.white, 9);
  assert.equal(raised.wallet.keys.green, 2);
});

test("a sixth device cannot mint coins", async () => {
  const sql = await db();
  for (let i = 0; i < DEVICE_CAP; i++) {
    const id = `capdevice${i}`;
    const open = await syncPlayer(sql, "cam", snap({ coins: 20 + i, keys: { blue: i } }), id);
    assert.equal(open.deviceClosed, false);
    const close = await syncPlayer(sql, "cam", snap({ coins: 20 + i, keys: { blue: i } }), id);
    assert.equal(close.deviceClosed, true);
  }
  const held = (await canonicalWallet(sql, "cam")).wallet;
  const sixth = await syncPlayer(sql, "cam", snap({ coins: COIN_CAP, keys: { white: KEY_CAP, violet: 40 } }), "capdevice9");
  assert.equal(sixth.deviceClosed, true);
  assert.equal(sixth.replay, true);
  assert.equal(sixth.wallet.coins, held.coins);
  assert.equal(sixth.wallet.keys.white, held.keys.white);
  assert.equal(sixth.wallet.keys.violet, 0);
  const rows = await sql<{ op_key: string }>`select op_key from wallet_ledger where op_key = ${"migrate:capdevice9"} or op_key = ${"migrate-revise:capdevice9"}`;
  assert.equal(rows.length, 0);
  const again = await syncPlayer(sql, "cam", snap({ coins: COIN_CAP }), "capdevice9");
  assert.equal(again.wallet.coins, held.coins);
});

test("each device is clamped to the first-sync caps", () => {
  assert.equal(COIN_CAP, 5_000_000);
  assert.equal(KEY_CAP, 300);
  assert.equal(PASS_CAP, 25);
  const merged = mergeFirstSync(
    emptyWallet(),
    snap({
      coins: 9_000_000,
      keys: { white: 9_000, blue: 900, green: 900, amber: 900, red: 900, violet: 900 },
      cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], passes: 80, freePick: false },
    }),
  );
  assert.equal(merged.coins, FIRST_SYNC_COIN_CAP);
  for (const tier of ["white", "blue", "green", "amber", "red", "violet"] as const) assert.equal(merged.keys[tier], KEY_CAP);
  assert.equal(merged.cities.passes, 0);
  const keptVisit = CITIES.austin.pois[0]!.id;
  const server = emptyWallet();
  server.cities = { ...server.cities, start: "austin", unlocked: ["austin"], passes: 4, goalsPaid: ["austin"], freePick: false };
  server.meta = { ...server.meta, lucky: true, cloths: ["road-dust"], walkM: 1_200, fares: 1, brass: 3, visits: [keptVisit] };
  const kept = mergeFirstSync(
    server,
    snap({
      fares: 9,
      lucky: true,
      cloths: ["night-glass", "nope"],
      distanceM: 9_000_000,
      atlas: ["not-a-place", CITIES.austin.pois[1]!.id],
      brass: 40,
      ink: 20,
      press: 10,
      patterns: 4,
      cities: {
        ...freshUnlocks(),
        start: "nyc",
        unlocked: ["nyc", "nope" as "nyc"],
        passes: 80,
        goalsPaid: ["nyc"],
        freePick: false,
      },
    }),
  );
  assert.equal(kept.meta.fares, FARES_CAP);
  assert.equal(kept.cities.passes, 4);
  assert.deepEqual(kept.cities.goalsPaid, ["austin"]);
  assert.ok(kept.cities.unlocked.includes("austin"));
  assert.ok(kept.cities.unlocked.includes("nyc"));
  assert.equal(kept.cities.unlocked.includes("nope" as "nyc"), false);
  assert.equal(kept.meta.lucky, true);
  assert.deepEqual(kept.meta.cloths, ["road-dust"]);
  assert.equal(kept.meta.walkM, 1_200);
  assert.equal(kept.meta.brass, 3);
  assert.equal(kept.meta.ink, 0);
  assert.deepEqual(kept.meta.visits, [keptVisit]);
  const fresh = mergeFirstSync(
    emptyWallet(),
    snap({
      lucky: true,
      cloths: ["road-dust"],
      distanceM: 9_000_000,
      fares: 2,
      cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin", "nope" as "austin"], freePick: false },
    }),
  );
  assert.equal(fresh.meta.lucky, false);
  assert.deepEqual(fresh.meta.cloths, []);
  assert.equal(fresh.meta.walkM, 0);
  assert.equal(fresh.meta.fares, FARES_CAP);
  assert.deepEqual(fresh.cities.unlocked, ["austin"]);
  assert.equal(realCloth("nope"), null);
  assert.equal(CLOTH_CAP, 18);
  assert.equal(clothOp(emptyWallet(), "nope").ok, false);
  // 0.1.82: night glass takes one violet pattern and nothing else; stock is left alone.
  const w0 = emptyWallet();
  const byPattern = clothOp({ ...w0, meta: { ...w0.meta, patterns: 1, schematic: 1, press: 2 } }, "night-glass");
  assert.equal(byPattern.ok, true);
  if (byPattern.ok) assert.deepEqual([byPattern.wallet.meta.patterns, byPattern.wallet.meta.schematic, byPattern.wallet.meta.press], [0, 1, 2]);
  assert.equal(clothOp({ ...w0, meta: { ...w0.meta, schematic: 1, press: 3 } }, "night-glass").ok, false);
});

test("a city pass pays only when every place has a graded visit", () => {
  const ids = CITIES.austin.pois.map((p) => p.id);
  const w = emptyWallet();
  w.cities = { ...w.cities, start: "austin", unlocked: ["austin"], freePick: false };
  const missing = goalOp(w, "austin", new Set(ids.slice(1)));
  assert.equal(missing.ok, false);
  if (missing.ok) return;
  assert.equal(missing.reason, "unproven");
  const paid = goalOp(w, "austin", new Set(ids));
  assert.equal(paid.ok, true);
  if (!paid.ok) return;
  assert.equal(paid.wallet.cities.passes, 1);
  assert.ok(paid.wallet.cities.goalsPaid.includes("austin"));
  const again = goalOp(paid.wallet, "austin", new Set());
  assert.equal(again.ok, true);
  if (!again.ok) return;
  assert.equal(again.wallet.cities.passes, 1);
});

test("survey matches pay only for goals graded visits can prove", () => {
  const ids = CITIES.austin.pois.map((p) => p.id);
  assert.equal(surveyProven("walk-4", new Set(ids)), false);
  assert.equal(surveyProven("walk-4", new Set(), 3_999), false);
  assert.equal(surveyProven("walk-4", new Set(), 4_000), true);
  assert.equal(surveyProven("visit-4", new Set(ids.slice(0, 3))), false);
  assert.equal(surveyProven("visit-4", new Set(ids.slice(0, 4))), true);
  assert.equal(surveyProven("ward-austin-all", new Set(ids.slice(0, 4))), false);
  assert.equal(surveyProven("ward-austin-all", new Set(ids)), true);
  assert.equal(surveyProven("no-such-goal", new Set(ids)), false);
});

test("a ride pays the idle schedule from the server clock and never a client win", () => {
  const w = emptyWallet();
  const at = 1_700_000_000_000;
  const rideMs = 120_000;
  const early = rideOp(w, { departAt: at, arriveAt: at + rideMs, now: at + 5_000 });
  assert.equal(early.ok, true);
  if (!early.ok) return;
  assert.equal(early.wallet.keys.white, 0);
  const due = transitLoot(20_000, 0, rideMs);
  const mid = rideOp(w, { departAt: at, arriveAt: at + rideMs, now: at + 20_000 });
  assert.equal(mid.ok, true);
  if (!mid.ok) return;
  assert.equal(mid.wallet.keys.white, due.white);
  assert.equal(mid.wallet.keys.green, 0);
  const long = 11 * 60_000;
  const sat = transitLoot(long, long, long);
  assert.equal(sat.green, 1, "a client that reports the tab stayed open would be owed a green");
  const full = rideOp(w, { departAt: at, arriveAt: at + long, now: at + long });
  assert.equal(full.ok, true);
  if (!full.ok) return;
  assert.equal(full.wallet.keys.green, 0);
  assert.equal(rideOp(w, { departAt: 0, arriveAt: 10, now: 10 }).ok, false);
  // One late heartbeat cannot claim the whole ride. A beat every 40s across 11 minutes can.
  const jumped = rideOp(w, { departAt: at, arriveAt: at + long, now: at + long, watch: true });
  assert.equal(jumped.ok, true);
  if (!jumped.ok) return;
  assert.equal(jumped.wallet.keys.green, 0);
  let watched = w;
  for (let t = 40_000; t <= long; t += 40_000) {
    const step = rideOp(watched, { departAt: at, arriveAt: at + long, now: at + t, watch: true });
    assert.equal(step.ok, true);
    if (!step.ok) return;
    watched = step.wallet;
  }
  assert.equal(watched.keys.green, 1);
});

test("a scored ride pays the guest win only after play spans half the ride", () => {
  const at = 1_700_000_000_000;
  const rideMs = 5 * 60_000; // 0.1.2 cap
  const perfect = { kind: "won" as const, perf: 1, perfect: true };
  const early = rideOp(emptyWallet(), { departAt: at, arriveAt: at + rideMs, now: at + 1_000, touch: true, outcome: perfect });
  assert.equal(early.ok, true);
  if (!early.ok) return;
  assert.equal(early.wallet.keys.white, 0);
  assert.equal(early.wallet.meta.rideRank, 2);
  const one = rideOp(early.wallet, { departAt: at, arriveAt: at + rideMs, now: at + 1_000, play: true });
  assert.equal(one.ok, true);
  if (!one.ok) return;
  assert.equal(one.wallet.keys.white, 0, "one timestamp is not a played ride");
  const later = rideOp(one.wallet, { departAt: at, arriveAt: at + rideMs, now: at + 1_000 + rideMs / 2, play: true });
  assert.equal(later.ok, true);
  if (!later.ok) return;
  const won = transitLoot(1_000 + rideMs / 2, 0, rideMs, perfect);
  assert.equal(won.white, rideReward(rideMs, perfect).white);
  assert.equal(later.wallet.keys.white, won.white);
  assert.equal(later.wallet.keys.blue, won.blue);
  const playedOnly = rideOp(emptyWallet(), { departAt: at, arriveAt: at + rideMs, now: at + 1_000, touch: true, outcome: null });
  assert.equal(playedOnly.ok, true);
  if (!playedOnly.ok) return;
  const played = rideOp(playedOnly.wallet, { departAt: at, arriveAt: at + rideMs, now: at + 1_000 + rideMs / 2, play: true });
  assert.equal(played.ok, true);
  if (!played.ok) return;
  assert.equal(played.wallet.keys.white, rideReward(rideMs, { kind: "played" }).white);
  assert.equal(played.wallet.meta.rideRank, 0);
  let bare = emptyWallet();
  for (let t = 40_000; t <= rideMs; t += 40_000) {
    const step = rideOp(bare, { departAt: at, arriveAt: at + rideMs, now: at + t, play: true });
    assert.equal(step.ok, true);
    if (!step.ok) return;
    bare = step.wallet;
  }
  assert.equal(bare.keys.white, transitLoot(rideMs, 0, rideMs).white);
  const late = rideOp(emptyWallet(), { departAt: at, arriveAt: at + 10_000, now: at + 9_000, deal: { game: "lamplighter", n: 0, seed: 1 } });
  assert.equal(late.ok, false);
  if (late.ok) return;
  assert.equal(late.reason, "no-round");
});

test("the server scores a dealt round and pays nothing for an unknown game", () => {
  const seed = 4242;
  const clues = whereRound(CITIES.austin.pois, seed, 0);
  const won = scoreRide("where-am-i", seed, 0, 30_000, "austin", { picks: clues.map((c) => c.answer) });
  assert.equal(won?.kind, "won");
  assert.equal(won?.kind === "won" && won.perfect, true);
  assert.equal(scoreRide("no-such", seed, 0, 30_000, "austin", {}), null);
  const missed = scoreRide("where-am-i", seed, 0, 30_000, "austin", { picks: [] });
  assert.equal(missed?.kind, "played");
});

test("lucky and cloth are granted only when the craft spends its cost", async () => {
  assert.deepEqual(provenBoost(true, "road-dust", { lucky: false, cloths: new Set() }), { lucky: false, cloth: null });
  assert.deepEqual(provenBoost(true, "road-dust", { lucky: true, cloths: new Set(["road-dust"]) }), { lucky: true, cloth: "road-dust" });
  const plain = gradeGrant(emptyWallet(), pay());
  const dressed = gradeGrant(emptyWallet(), pay({ lucky: true, luckyHit: true, cloth: "road-dust" }));
  assert.equal(plain.ok && dressed.ok, true);
  if (!plain.ok || !dressed.ok) return;
  assert.ok((dressed.award?.coins ?? 0) > (plain.award?.coins ?? 0));
  const sql = await db();
  const cities = { ...freshUnlocks(), start: "austin", unlocked: ["austin"] as const, freePick: false };
  await syncPlayer(sql, "lux", snap({ cities }), "luxphone1");
  const graded = await awardGrade(sql, "lux", "luck1", { ...pay({ lucky: true, luckyHit: true, cloth: "road-dust" }), prevNonce: "" });
  // 0.1.14: the account's first right lamp in this 800 m square today also pays the new-district bonus (luck2 below, same square, does not).
  assert.equal(graded.wallet.coins, gradeGrant(emptyWallet(), pay({ freshDistrict: true })).award?.coins);
  assert.equal((await canonicalWallet(sql, "lux")).wallet.meta.lucky, false);
  const freeCloth = await applyClientOp(sql, "lux", { kind: "cloth", id: "road-dust" });
  assert.equal(freeCloth.ok, false);
  assert.equal(freeCloth.reason, "unproven");
  const freeGlass = await applyClientOp(sql, "lux", { kind: "cloth", id: "night-glass" });
  assert.equal(freeGlass.ok, false);
  assert.equal(freeGlass.reason, "short");
  const held = await canonicalWallet(sql, "lux");
  const stock = {
    ...held.wallet.meta,
    brass: 12,
    ink: 8,
    vellum: 8,
    schematic: 1,
    press: 4,
    patterns: 1,
    walkM: 10_000,
    lucky: true,
  };
  await sql.query(`update player_wallets set meta = $2::jsonb where user_id = $1`, [held.id, JSON.stringify(stock)]);
  const cloth = await applyClientOp(sql, "lux", { kind: "cloth", id: "road-dust" });
  assert.equal(cloth.ok, true);
  assert.ok(cloth.wallet.meta.cloths.includes("road-dust"));
  const glass = await applyClientOp(sql, "lux", { kind: "cloth", id: "night-glass" });
  assert.equal(glass.ok, true);
  assert.equal(glass.wallet.meta.patterns, 0);
  assert.equal(glass.wallet.meta.press, 4);
  const dressedGrade = await awardGrade(sql, "lux", "luck2", { ...pay({ lucky: true, luckyHit: true, cloth: "road-dust" }), prevNonce: "" });
  assert.equal(dressedGrade.wallet.coins - glass.wallet.coins, dressed.award?.coins);
});

test("a goal, a survey and a daily each pay once from server records", async () => {
  const sql = await db(["0006_daily_runs.sql", "0007_daily_runs_per_city.sql", "0014_walk_distance.sql"]);
  const pois = CITIES.austin.pois.map((p) => p.id);
  await syncPlayer(sql, "goa", snap({ cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin", "nyc", "temple"], freePick: false } }), "goaphone1");
  const early = await applyClientOp(sql, "goa", { kind: "goal", cityId: "austin" });
  assert.equal(early.ok, false);
  assert.equal(early.reason, "unproven");
  const graded = await awardGrade(sql, "goa", "g0", { ...pay({ poiId: pois[0] }), prevNonce: "" });
  assert.equal(graded.detail?.includes(pois[0]!), true);
  const still = await applyClientOp(sql, "goa", { kind: "goal", cityId: "austin" });
  assert.equal(still.ok, false);
  const { id } = await canonicalWallet(sql, "goa");
  for (const poi of pois.slice(1)) {
    await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"grade:" + poi}, ${JSON.stringify({ g: "perfect", pi: poi, coins: 0, keys: {}, boosts: [] })})`;
  }
  const surveyEarly = await applyClientOp(sql, "goa", { kind: "survey", id: "walk-4" });
  assert.equal(surveyEarly.ok, false);
  assert.equal(surveyEarly.reason, "unproven");
  const beforeWalk = (await canonicalWallet(sql, "goa")).wallet.keys.blue ?? 0;
  await sql`insert into walk_distance (user_id, city, meters) values ('goa', 'austin', 4000)`;
  const walked = await applyClientOp(sql, "goa", { kind: "survey", id: "walk-4" });
  assert.equal(walked.ok, true);
  assert.equal(walked.wallet.keys.blue, beforeWalk + 1);
  const beforeBlue = (await canonicalWallet(sql, "goa")).wallet.keys.blue ?? 0;
  const visited = await applyClientOp(sql, "goa", { kind: "survey", id: "visit-4" });
  assert.equal(visited.ok, true);
  assert.equal(visited.wallet.keys.blue, beforeBlue + 1);
  const visitedAgain = await applyClientOp(sql, "goa", { kind: "survey", id: "visit-4" });
  assert.equal(visitedAgain.replay, true);
  assert.equal(visitedAgain.wallet.keys.blue, visited.wallet.keys.blue);
  const passes = (await canonicalWallet(sql, "goa")).wallet.cities.passes;
  const goal = await applyClientOp(sql, "goa", { kind: "goal", cityId: "austin" });
  assert.equal(goal.ok, true);
  assert.equal(goal.wallet.cities.passes, passes + 1);
  const goalAgain = await applyClientOp(sql, "goa", { kind: "goal", cityId: "austin" });
  assert.equal(goalAgain.wallet.cities.passes, goal.wallet.cities.passes);

  const putRun = (day: string, city: string, time: number | null, voided = false, user = "goa") =>
    sql.query(
      `insert into daily_runs (day, user_id, city, display_name, started_at, last_at, last_lat, last_lng, voided, time_ms)
       values ($1, $2, $3, 'Goa', now(), now(), 0, 0, $4, $5)`,
      [day, user, city, voided, time],
    );
  const { id: goaId } = await canonicalWallet(sql, "goa");
  await putRun("1999-01-01", "austin", 1_000, true);
  const voided = await applyClientOp(sql, "goa", { kind: "daily", day: "1999-01-01", city: "austin" });
  assert.equal(voided.ok, false);
  assert.equal(voided.reason, "no-run");
  const locked = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${goaId} and op_key like ${"daily:%"}`;
  assert.equal(locked.length, 0);
  const nycNone = await applyClientOp(sql, "goa", { kind: "daily", day: "1999-01-01", city: "nyc" });
  assert.equal(nycNone.ok, false);
  assert.equal(nycNone.reason, "no-run");
  await putRun("1999-01-01", "chicago", null);
  const unfinished = await applyClientOp(sql, "goa", { kind: "daily", day: "1999-01-01", city: "chicago" });
  assert.equal(unfinished.ok, false);
  assert.equal(unfinished.reason, "no-run");
  await putRun("1999-01-01", "nyc", 12_000);
  const nycDue = payDaily(nycNone.wallet.keys, nycNone.wallet.coins);
  const nyc = await applyClientOp(sql, "goa", { kind: "daily", day: "1999-01-01", city: "nyc" });
  assert.equal(nyc.ok, true);
  assert.equal(nyc.wallet.cities.runs.nyc, 1);
  assert.equal(nyc.wallet.keys.white, nycDue.keys.white);
  assert.equal(nyc.wallet.keys.blue, nycDue.keys.blue);
  assert.equal(nyc.wallet.coins, nycDue.points);
  await putRun("1999-01-01", "temple", 9_000);
  const templeDue = payDaily(nyc.wallet.keys, nyc.wallet.coins);
  const temple = await applyClientOp(sql, "goa", { kind: "daily", day: "1999-01-01", city: "temple" });
  assert.equal(temple.ok, true);
  assert.equal(temple.replay, false);
  assert.equal(temple.wallet.cities.runs.temple, 1);
  assert.equal(temple.wallet.keys.white, templeDue.keys.white);
  assert.equal(temple.wallet.keys.blue, templeDue.keys.blue);
  assert.equal(temple.wallet.coins, templeDue.points);
  const templeAgain = await applyClientOp(sql, "goa", { kind: "daily", day: "1999-01-01", city: "temple" });
  assert.equal(templeAgain.replay, true);
  assert.equal(templeAgain.wallet.coins, temple.wallet.coins);
  assert.equal(templeAgain.wallet.keys.white, temple.wallet.keys.white);
  await putRun("1998-06-01", "austin", 8_000);
  const older = await applyClientOp(sql, "goa", { kind: "daily", day: "1998-06-01", city: "austin" });
  assert.equal(older.ok, true);
  assert.equal(older.wallet.cities.runs.austin, 1);
  await sql`insert into player_links (alias_id, primary_id, how) values ('goa-alt', 'goa', 'test')`;
  await putRun("1997-03-03", "london", 5_000, false, "goa-alt");
  const linked = await applyClientOp(sql, "goa", { kind: "daily", day: "1997-03-03", city: "london" });
  assert.equal(linked.ok, true);
  assert.equal(linked.wallet.cities.runs.london, 1);
});

test("a contract and a blitz pay a graded nonce once", async () => {
  const sql = await db(["0003_plate_events.sql"]);
  await syncPlayer(sql, "con", snap({ cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"] } }), "conphone1");
  const today = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  const insert = (nonce: string, at: string) =>
    sql.query(
      `insert into plate_events (id, user_id, save_id, plate_id, shown_at, answered_at, latency_ms, correct, rarity, city, difficulty)
       values ($1, 'con', 's', 'p', $2::timestamptz, $2::timestamptz, 1000, true, 'blue', 'austin', 2)`,
      [`t:${nonce}`, at],
    );
  await insert("nonceold1", yesterday);
  await insert("noncetoday", today);
  await insert("noncelamp2", today);
  await insert("noncelamp3", today);
  await insert("nonceblitz", today);
  const { id: conId } = await canonicalWallet(sql, "con");
  const markBlitz = (nonce: string, step: number) =>
    sql`insert into wallet_ledger (user_id, op_key, detail) values (${conId}, ${"blitz-card:" + nonce}, ${"blitz-" + step})`;
  const old = await applyClientOp(sql, "con", { kind: "contract", nonces: ["nonceold1", "noncelamp2", "noncelamp3"] });
  assert.equal(old.ok, false);
  assert.equal(old.reason, "unproven");
  const one = await applyClientOp(sql, "con", { kind: "contract", nonces: ["noncetoday"] });
  assert.equal(one.ok, false);
  assert.equal(one.reason, "unproven");
  const made = await applyClientOp(sql, "con", { kind: "contract", nonces: ["noncetoday", "noncelamp2", "noncelamp3"] });
  assert.equal(made.ok, true);
  assert.equal(made.wallet.keys.amber, 1);
  assert.ok(made.wallet.coins >= 1500);
  const reuse = await applyClientOp(sql, "con", { kind: "contract", nonces: ["noncetoday", "noncelamp2", "noncelamp3"] });
  assert.equal(reuse.replay, true);
  assert.equal(reuse.wallet.keys.amber, 1);
  const stolen = await applyClientOp(sql, "con", { kind: "blitz", step: 0, nonces: ["nonceblitz"] });
  assert.equal(stolen.ok, false);
  assert.equal(stolen.reason, "unproven");
  await markBlitz("nonceblitz", 0);
  const blitz = await applyClientOp(sql, "con", { kind: "blitz", step: 0, nonces: ["nonceblitz"] });
  assert.equal(blitz.ok, true);
  assert.equal(blitz.wallet.coins, made.wallet.coins + 20);
  const blitzAgain = await applyClientOp(sql, "con", { kind: "blitz", step: 0, nonces: ["nonceblitz"] });
  assert.equal(blitzAgain.replay, true);
  assert.equal(blitzAgain.wallet.coins, blitz.wallet.coins);
  await insert("noncestep2", today);
  await markBlitz("noncestep2", 1);
  const skip = await applyClientOp(sql, "con", { kind: "blitz", step: 2, nonces: ["noncestep2"] });
  assert.equal(skip.ok, false);
  const step = await applyClientOp(sql, "con", { kind: "blitz", step: 1, nonces: ["noncestep2"] });
  assert.equal(step.ok, true);
  assert.deepEqual(acceptNonces(["nope", "noncetoday"], new Set(["noncetoday"])), ["noncetoday"]);
  assert.equal(acceptNonces(["nope"], new Set()), null);
});

test("a ride pays only against a server ticket, timed on the server clock", async () => {
  const sql = await db(["0002_vault_clears.sql"]);
  const cities = { ...freshUnlocks(), start: "austin", unlocked: ["austin", "nyc"] as const, freePick: false };
  await syncPlayer(sql, "rid", snap({ cities }), "ridphone1");
  const none = await applyClientOp(sql, "rid", { kind: "ride" });
  assert.equal(none.ok, false);
  assert.equal(none.reason, "no-ticket");
  const unboarded = await applyClientOp(sql, "rid", { kind: "board", from: "austin", to: "nyc" });
  assert.equal(unboarded.ok, false);
  assert.equal(unboarded.reason, "no-ticket");
  await sql`insert into vault_clears (user_id, display_name, tier, correct) values ('rid', 'Rid', 'white', 3)`;
  const boarded = await applyClientOp(sql, "rid", { kind: "board", from: "austin", to: "nyc" });
  assert.equal(boarded.ok, true);
  const { id } = await canonicalWallet(sql, "rid");
  const at = Date.now() - 20_000;
  const rows = await sql<{ detail: string; op_key: string }>`select op_key, detail from wallet_ledger where user_id = ${id} and op_key like ${"ticket:%"}`;
  const ticket = JSON.parse(rows[0]!.detail) as { ms: number };
  await sql`update wallet_ledger set detail = ${JSON.stringify({ at, from: "austin", to: "nyc", ms: ticket.ms })} where user_id = ${id} and op_key = ${rows[0]!.op_key}`;
  const due = transitLoot(20_000, 0, ticket.ms);
  const paid = await applyClientOp(sql, "rid", { kind: "ride" });
  assert.equal(paid.ok, true);
  assert.equal(paid.wallet.keys.white, due.white);
  assert.equal(paid.wallet.keys.green, 0);
  const replay = await applyClientOp(sql, "rid", { kind: "ride" });
  assert.equal(replay.replay, true);
  assert.equal(replay.wallet.keys.white, paid.wallet.keys.white);
  const stillOut = await applyClientOp(sql, "rid", { kind: "board", from: "austin", to: "nyc" });
  assert.equal(stillOut.replay, true);
  assert.equal(stillOut.wallet.keys.white, paid.wallet.keys.white);

  await syncPlayer(sql, "kia", snap({ coins: 1800, cities }), "kiaphone1");
  const bought = await applyClientOp(sql, "kia", { kind: "kiosk", id: "fare" });
  assert.equal(bought.ok, true);
  const fromKiosk = await applyClientOp(sql, "kia", { kind: "board", from: "austin", to: "nyc" });
  assert.equal(fromKiosk.ok, true);
  assert.equal(fromKiosk.wallet.keys.white, 0);
});

test("a dealt ride is scored from the server seed and does not pay a win in one instant", async () => {
  const sql = await db(["0002_vault_clears.sql"]);
  const cities = { ...freshUnlocks(), start: "austin", unlocked: ["austin", "nyc"] as const, freePick: false };
  await syncPlayer(sql, "rnd", snap({ cities }), "rndphone1");
  await sql`insert into vault_clears (user_id, display_name, tier, correct) values ('rnd', 'Rnd', 'white', 3)`;
  const boarded = await applyClientOp(sql, "rnd", { kind: "board", from: "austin", to: "nyc" });
  assert.equal(boarded.ok, true);
  const { id } = await canonicalWallet(sql, "rnd");
  const at = Date.now() - 20_000;
  const rows = await sql<{ detail: string; op_key: string }>`select op_key, detail from wallet_ledger where user_id = ${id} and op_key like ${"ticket:%"}`;
  const ticket = JSON.parse(rows[0]!.detail) as { ms: number };
  await sql`update wallet_ledger set detail = ${JSON.stringify({ at, from: "austin", to: "nyc", ms: ticket.ms })} where user_id = ${id} and op_key = ${rows[0]!.op_key}`;
  const deal = await applyClientOp(sql, "rnd", { kind: "ride", deal: "where-am-i" });
  assert.equal(deal.ok, true);
  assert.equal(deal.rideDeal?.n, 0);
  assert.equal(deal.rideDeal?.game, "where-am-i");
  assert.equal(deal.rideDeal?.seed, rideSeed(id, at));
  assert.ok((deal.rideDeal?.ms ?? 0) >= 15_000);
  const idle = transitLoot(20_000, 0, ticket.ms);
  assert.equal(deal.wallet.keys.white, idle.white);
  const clues = whereRound(CITIES.nyc.pois, deal.rideDeal!.seed, 0);
  assert.ok(clues.length >= 5);
  const submit = await applyClientOp(sql, "rnd", { kind: "ride", round: { n: 0, picks: clues.map((c) => c.answer) } });
  assert.equal(submit.ok, true);
  assert.equal(submit.wallet.keys.white, idle.white);
  assert.equal(submit.wallet.meta.rideRank, 2);
  const replay = await applyClientOp(sql, "rnd", { kind: "ride", round: { n: 0, picks: [] } });
  assert.equal(replay.replay, true);
  assert.equal(replay.wallet.keys.white, idle.white);
  assert.equal(replay.wallet.meta.rideRank, 2);
});

test("a market spot pays two matches while the market is open, and a kiosk name counts as a visit", async (t) => {
  t.after(inOpenMarket());
  const sql = await db();
  const cities = { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false };
  await syncPlayer(sql, "str", snap({ coins: 3000, cities }), "strphone1");
  const day = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  assert.ok(marketAt("austin", now), "austin has a market open on the server clock");
  let market: ReturnType<typeof streetSpot> = null;
  for (let i = SEED.length; i < STREET_DAY_CAP; i++) {
    const s = streetSpot("str", "austin", day, i);
    if (s?.market && (s.tier === "white" || s.tier === "blue")) {
      market = s;
      break;
    }
  }
  assert.ok(market);
  const plain = streetSpot("str", "austin", day, 0);
  assert.ok(plain);
  assert.equal(plain!.market, false);
  await sql`insert into walk_distance (user_id, city, meters, updated_at) values ('str', 'austin', 40, now())`;
  const one = await applyClientOp(sql, "str", { kind: "street", id: plain!.id, tier: plain!.tier, city: "austin", lat: 0, lng: 0 });
  assert.equal(one.ok, true);
  assert.equal(one.wallet.keys[plain!.tier], 1);
  const before = one.wallet.keys[market!.tier] ?? 0;
  const add = marketMatches(before, Math.max(matchCap(market!.tier), before + 1), 2);
  assert.equal(add, 2);
  const paid = await applyClientOp(sql, "str", { kind: "street", id: market!.id, tier: market!.tier, city: "austin", lat: 0, lng: 0 });
  assert.equal(paid.ok, true);
  assert.equal(paid.wallet.keys[market!.tier], before + 2);
  assert.equal(paid.wallet.coins, one.wallet.coins);
  const again = await applyClientOp(sql, "str", { kind: "street", id: market!.id, tier: market!.tier, city: "austin", lat: 0, lng: 0 });
  assert.equal(again.replay, true);
  assert.equal(again.wallet.keys[market!.tier], before + 2);
  const { id } = await canonicalWallet(sql, "str");
  const rows = await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key like ${"street:sk:austin:" + day + ":%"}`;
  assert.equal(Number(rows[0]?.n), 2);
  const stale = streetSpot("str", "austin", "1999-01-01", SEED.length);
  const old = await applyClientOp(sql, "str", { kind: "street", id: stale!.id, tier: "white", city: "austin", lat: 0, lng: 0 });
  assert.equal(old.ok, false);
  const poi = CITIES.austin.pois[0]!.id;
  const named = await applyClientOp(sql, "str", { kind: "kiosk", id: "smear", poi });
  assert.equal(named.ok, true);
  const namedAgain = await applyClientOp(sql, "str", { kind: "kiosk", id: "smear", poi });
  assert.equal(namedAgain.replay, true);
  assert.equal(namedAgain.wallet.coins, named.wallet.coins);
  const missing = await applyClientOp(sql, "str", { kind: "kiosk", id: "smear", poi: "not-a-place" });
  assert.equal(missing.ok, false);
  assert.equal(missing.wallet.coins, named.wallet.coins);
  for (const place of CITIES.austin.pois.slice(1, 4)) {
    const bought = await applyClientOp(sql, "str", { kind: "kiosk", id: "smear", poi: place.id });
    assert.equal(bought.ok, true);
  }
  const blues = (await canonicalWallet(sql, "str")).wallet.keys.blue ?? 0;
  const visit = await applyClientOp(sql, "str", { kind: "survey", id: "visit-4" });
  assert.equal(visit.ok, true);
  assert.equal(visit.wallet.keys.blue, blues + 1);
});

test("a street claim needs the city, a fresh walk, and stops at the day's cap", async () => {
  const sql = await db();
  const day = new Date().toISOString().slice(0, 10);
  const austin = { ...freshUnlocks(), start: "austin" as const, unlocked: ["austin"] as const, freePick: false };
  await syncPlayer(sql, "stb", snap({ cities: { ...freshUnlocks(), start: "nyc", unlocked: ["nyc"], freePick: false } }), "stbphone1");
  const lockedSpot = streetSpot("stb", "austin", day, 0);
  assert.ok(lockedSpot);
  const locked = await applyClientOp(sql, "stb", { kind: "street", id: lockedSpot!.id, tier: "white", city: "austin", lat: 0, lng: 0 });
  assert.equal(locked.ok, false);
  assert.equal(locked.reason, "locked");

  await syncPlayer(sql, "stc", snap({ cities: austin }), "stcphone1");
  const quiet = streetSpot("stc", "austin", day, 0);
  assert.ok(quiet);
  const cold = await applyClientOp(sql, "stc", { kind: "street", id: quiet!.id, tier: "white", city: "austin", lat: 0, lng: 0 });
  assert.equal(cold.ok, false);
  assert.equal(cold.reason, "unproven");
  await sql`insert into walk_distance (user_id, city, meters, updated_at) values ('stc', 'austin', 80, now())`;
  for (let i = 0; i < STREET_DAY_CAP; i++) {
    const spot = streetSpot("stc", "austin", day, i);
    assert.ok(spot);
    const paid = await applyClientOp(sql, "stc", { kind: "street", id: spot!.id, tier: spot!.tier, city: "austin", lat: 0, lng: 0 });
    assert.equal(paid.ok, true, `claim ${i}`);
    assert.equal(paid.replay, false);
  }
  const extra = streetSpot("stc", "austin", day, STREET_DAY_CAP);
  assert.ok(extra);
  const capped = await applyClientOp(sql, "stc", { kind: "street", id: extra!.id, tier: extra!.tier, city: "austin", lat: 0, lng: 0 });
  assert.equal(capped.ok, false);
  assert.equal(capped.reason, "capped");
  const again = await applyClientOp(sql, "stc", { kind: "street", id: quiet!.id, tier: "white", city: "austin", lat: 0, lng: 0 });
  assert.equal(again.replay, true);
});

test("a signed-in idle ride and a played ride pay the same as a guest", async () => {
  const sql = await db(["0002_vault_clears.sql"]);
  const cities = { ...freshUnlocks(), start: "austin" as const, unlocked: ["austin", "nyc"] as const, freePick: false };
  const synced = await syncPlayer(sql, "far", snap({ fares: 9, cities }), "farphone1");
  assert.equal(synced.wallet.meta.fares, FARES_CAP);
  const boarded = await applyClientOp(sql, "far", { kind: "board", from: "austin", to: "nyc" });
  assert.equal(boarded.ok, true);
  const { id } = await canonicalWallet(sql, "far");
  const firstRows = await sql<{ detail: string; op_key: string }>`select op_key, detail from wallet_ledger where user_id = ${id} and op_key like ${"ticket:%"}`;
  const first = JSON.parse(firstRows[0]!.detail) as { ms: number };
  const idleAt = Date.now() - first.ms - 80_000;
  await sql`update wallet_ledger set detail = ${JSON.stringify({ at: idleAt, from: "austin", to: "nyc", ms: first.ms })} where user_id = ${id} and op_key = ${firstRows[0]!.op_key}`;
  const idleDue = transitLoot(first.ms, 0, first.ms);
  const idle = await applyClientOp(sql, "far", { kind: "ride" });
  assert.equal(idle.ok, true);
  assert.equal(idle.wallet.keys.white, idleDue.white);
  assert.equal(idle.wallet.keys.blue, idleDue.blue);
  assert.equal(idle.wallet.keys.green, idleDue.green);

  const doneAt = Date.now() - first.ms - 5_000;
  await sql`update wallet_ledger set detail = ${JSON.stringify({ at: doneAt, from: "austin", to: "nyc", ms: first.ms })} where user_id = ${id} and op_key = ${firstRows[0]!.op_key}`;
  const second = await applyClientOp(sql, "far", { kind: "board", from: "austin", to: "nyc" });
  assert.equal(second.ok, true);
  assert.equal(second.replay, false);

  const tickets = await sql<{ detail: string; op_key: string }>`select op_key, detail from wallet_ledger where user_id = ${id} and op_key like ${"ticket:%"} order by created_at`;
  const open = tickets[tickets.length - 1]!;
  const openTicket = JSON.parse(open.detail) as { ms: number };
  const wall = Math.floor(openTicket.ms * 0.8);
  const playAt = Date.now() - wall;
  await sql`update wallet_ledger set detail = ${JSON.stringify({ at: playAt, from: "austin", to: "nyc", ms: openTicket.ms })} where user_id = ${id} and op_key = ${open.op_key}`;
  const dealt = await applyClientOp(sql, "far", { kind: "ride", deal: "where-am-i" });
  assert.equal(dealt.ok, true);
  assert.equal(dealt.wallet.meta.rideTouch, true);
  const meta = { ...dealt.wallet.meta, rideLo: playAt };
  await sql.query(`update player_wallets set meta = $2::jsonb where user_id = $1`, [id, JSON.stringify(meta)]);
  const played = await applyClientOp(sql, "far", { kind: "ride", play: true });
  assert.equal(played.ok, true);
  const playedDue = transitLoot(Date.now() - playAt, 0, openTicket.ms, { kind: "played" });
  assert.equal(played.wallet.keys.white, idle.wallet.keys.white + playedDue.white);
  assert.equal(played.wallet.keys.blue, idle.wallet.keys.blue + playedDue.blue);
  assert.equal(played.wallet.keys.green, idle.wallet.keys.green + playedDue.green);
  assert.ok(playedDue.white > idleDue.white);
  const arrived = Date.now() - openTicket.ms - 5_000;
  await sql`update wallet_ledger set detail = ${JSON.stringify({ at: arrived, from: "austin", to: "nyc", ms: openTicket.ms })} where user_id = ${id} and op_key = ${open.op_key}`;
  const third = await applyClientOp(sql, "far", { kind: "board", from: "austin", to: "nyc" });
  assert.equal(third.ok, false);
  assert.equal(third.reason, "no-ticket");
});

test("a 50M pocket reads back inside the caps, and atlas visits count", async () => {
  const raw = rowToState({
    coins: 50_000_000,
    white: 2000,
    blue: 2000,
    green: 2000,
    amber: 2000,
    red: 2000,
    violet: 2000,
    cities: { start: "austin", unlocked: ["austin"], freePick: false, passes: 80, lampPts: 0, goalsPaid: [], runs: {}, runsPaid: [] },
    meta: { walkM: 9_000_000, lucky: true, cloths: ["road-dust", "nope"], visits: ["not-a-place"] },
    migrated: true,
    version: 1,
  });
  assert.equal(raw.coins, COIN_CAP);
  assert.equal(raw.keys.white, KEY_CAP);
  assert.equal(raw.keys.blue, KEY_CAP);
  assert.equal(raw.cities.passes, PASS_CAP);
  assert.equal(raw.meta.walkM, WALK_CAP);
  assert.equal(raw.meta.lucky, true);
  assert.deepEqual(raw.meta.cloths, ["road-dust"]);
  assert.deepEqual(raw.meta.visits, []);

  const sql = await db();
  const places = CITIES.austin.pois.slice(0, 4).map((p) => p.id);
  const synced = await syncPlayer(
    sql,
    "atl",
    snap({
      coins: 50_000_000,
      keys: { white: 2000 },
      cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], passes: 80, freePick: false },
      distanceM: 200_000,
      atlas: [places[0]!, "nope", ...places.slice(1)],
      fares: 9,
    }),
    "atlphone1",
  );
  assert.equal(synced.wallet.coins, FIRST_SYNC_COIN_CAP);
  assert.equal(synced.wallet.keys.white, KEY_CAP);
  assert.equal(synced.wallet.cities.passes, 1, "0.0.90: only the one-time free pass");
  assert.equal(synced.wallet.meta.walkM, 0);
  assert.equal(synced.wallet.meta.fares, FARES_CAP);
  assert.deepEqual(synced.wallet.meta.visits, []);
  await sql.query(`update player_wallets set coins = 50000000, white = 2000 where user_id = $1`, ["atl"]);
  const read = await canonicalWallet(sql, "atl");
  assert.equal(read.wallet.coins, COIN_CAP);
  assert.equal(read.wallet.keys.white, KEY_CAP);
  const fromDevice = await applyClientOp(sql, "atl", { kind: "survey", id: "visit-4" });
  assert.equal(fromDevice.ok, false);
  assert.equal(fromDevice.reason, "unproven");
  const earned = { ...read.wallet.meta, visits: places };
  await sql.query(`update player_wallets set meta = $2::jsonb where user_id = $1`, [read.id, JSON.stringify(earned)]);
  const visit = await applyClientOp(sql, "atl", { kind: "survey", id: "visit-4" });
  assert.equal(visit.ok, true);
  assert.equal(visit.wallet.keys.blue, 1);
});

test("a failed unlock reply rolls the local city list back", () => {
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  const unlock = store.slice(store.indexOf("unlockCity: (id) =>"), store.indexOf("setHud: (h) =>"));
  assert.match(unlock, /const before = get\(\)\.cities/);
  assert.match(unlock, /if \(res == null\)/);
  assert.match(unlock, /cities: before/);
  assert.match(store, /kind: "ride", watch: watching, play: playing/);
  assert.match(store, /kind: "board"/);
  assert.match(store, /if \(!res\?\.ok\)/);
  assert.match(store, /Need a train ticket/);
  assert.doesNotMatch(store, /kind: "pulse"/);
  const body = Buffer.from(JSON.stringify({ n: "nonceaaaa", t: Date.UTC(2026, 9, 16, 12) })).toString("base64url");
  assert.equal(tokenNonce(`${body}.sig`), "nonceaaaa");
  assert.equal(tokenNonce("nope"), null);
});

// 0.0.90: perfect lamp refunds the spent match, same tier; violet excluded; a miss refunds nothing.
test("0.0.90 perfect refund: single lamp gets its match back", () => {
  const w = emptyWallet();
  const g = gradeGrant(w, pay({ elapsedMs: 9000, mult: 0.7 }));
  assert.equal(g.award?.keys.blue, 1);
});

test("0.0.90 perfect refund: a Run/Stack cleared gets the cost match back on the last card only", () => {
  const def = SERIES.stack;
  const mid = gradeGrant(emptyWallet(), pay({ series: "stack", step: 0, steps: def.steps, clearTier: def.cost, poiTier: def.cost }));
  assert.equal(mid.award?.keys[def.cost] ?? 0, 0);
  const last = gradeGrant(
    emptyWallet(),
    pay({ series: "stack", step: def.steps - 1, steps: def.steps, prior: Array(def.steps - 1).fill("great"), clearTier: def.cost, poiTier: def.cost, elapsedMs: 9000 }),
  );
  const expected = (def.pay === def.cost ? 1 : 0) + 1;
  assert.equal(last.award?.keys[def.cost], expected);
});

test("0.0.90 perfect refund: a miss refunds nothing", () => {
  const g = gradeGrant(emptyWallet(), pay({ correct: false }));
  assert.deepEqual(g.award?.keys, {});
});

test("0.0.90 perfect refund: violet never refunds; full pocket pays overflow coin", () => {
  assert.deepEqual(perfectRefund("violet", 0, 9), { match: 0, coin: 0 });
  const v = gradeGrant(emptyWallet(), pay({ clearTier: "violet", poiTier: "violet" }));
  assert.equal(v.award?.keys.violet ?? 0, 0);
  assert.deepEqual(perfectRefund("blue", 5, 5), { match: 0, coin: TIER_VALUE.blue });
  assert.deepEqual(perfectRefund("blue", 4, 5), { match: 1, coin: 0 });
});

test("0.0.90 pass gift: new player gets 1, a second grant is a no-op, existing player +1, clamp 25", async () => {
  const sql = await db();
  await grantPassGift(sql, "newbie");
  await grantPassGift(sql, "newbie");
  assert.equal((await canonicalWallet(sql, "newbie")).wallet.cities.passes, 1);
  // Sync also grants it (once) and is idempotent.
  await syncPlayer(sql, "newbie", snap(), "newbphon1");
  assert.equal((await canonicalWallet(sql, "newbie")).wallet.cities.passes, 1);
  assert.equal(giftPass(freshUnlocks()).passes, 1);
  assert.equal(giftPass({ ...freshUnlocks(), passes: 4 }).passes, 5);
  assert.equal(giftPass({ ...freshUnlocks(), passes: 25 }).passes, 25);
});

test("0.0.92 server wheel: a rare slice pays a match one tier up, once per earned spin", async () => {
  const { buildWheel } = await import("./wheel.ts");
  const sql = await db(["0002_vault_clears.sql"]);
  await sql`create view vault_clears_by_player as select user_id, tier, correct from vault_clears`;
  await sql`insert into vault_clears (user_id, display_name, tier, correct) values ('wil', 'Wil', 'white', 25)`;
  await syncPlayer(sql, "wil", snap(), "wilphone1");
  let roll = 0;
  while (roll < 1 && buildWheel("white", "austin", roll).slices[buildWheel("white", "austin", roll).win]!.face !== "Rare") roll += 0.001;
  const real = Math.random;
  Math.random = () => roll;
  try {
    const r = await applyClientOp(sql, "wil", { kind: "wheel", tier: "white", city: "austin" });
    assert.ok(r.ok, JSON.stringify(r));
    // Shown == paid: the reply names the slice the server rolled, and that slice is what landed in the pocket.
    assert.equal(typeof r.wheelWin, "number");
    assert.equal(buildWheel("white", "austin", 0).slices[r.wheelWin!]!.face, "Rare");
    assert.equal(r.wallet.keys.blue, 1);
    const again = await applyClientOp(sql, "wil", { kind: "wheel", tier: "white", city: "austin" });
    assert.equal(again.ok, false);
    assert.equal(again.wallet.keys.blue, 1);
  } finally {
    Math.random = real;
  }
});

test("0.0.92 server wheel: Take all pays the combined prizes and reports its slice; Nothing pays nothing", async () => {
  const { buildWheel } = await import("./wheel.ts");
  const find = (face: string) => {
    let roll = 0;
    while (roll < 1 && buildWheel("white", "austin", roll).slices[buildWheel("white", "austin", roll).win]!.face !== face) roll += 0.0005;
    return roll;
  };
  const real = Math.random;
  try {
    for (const [who, face] of [["tak", "Take all"], ["nob", "Nothing"]] as const) {
      const sql = await db(["0002_vault_clears.sql"]);
      await sql`create view vault_clears_by_player as select user_id, tier, correct from vault_clears`;
      await sql`insert into vault_clears (user_id, display_name, tier, correct) values (${who}, 'X', 'white', 25)`;
      await syncPlayer(sql, who, snap(), `${who}phone1`);
      const before = (await canonicalWallet(sql, who)).wallet;
      const roll = find(face);
      Math.random = () => roll;
      const r = await applyClientOp(sql, who, { kind: "wheel", tier: "white", city: "austin" });
      Math.random = real;
      assert.ok(r.ok);
      assert.equal(buildWheel("white", "austin", 0).slices[r.wheelWin!]!.face, face, "shown == paid");
      if (face === "Take all") {
        // 0.1.82: the old Stock slice is the 100-coin Purse, so Take all is 385 coin and carries no ingredient.
        assert.equal(r.wallet.coins - before.coins, 385);
        assert.equal(r.wallet.keys.white - before.keys.white, 3);
        assert.equal(r.wallet.keys.blue - before.keys.blue, 1);
        assert.equal(r.ingredient, undefined);
      } else {
        assert.equal(r.wallet.coins, before.coins);
        assert.deepEqual(r.wallet.keys, before.keys);
        assert.equal(r.line, "Nothing this time");
      }
    }
  } finally {
    Math.random = real;
  }
});

test("0.0.93 streaks: 5 right in a row pays a white match on the server; a miss resets", async () => {
  const sql = await db();
  const cities = { ...freshUnlocks(), start: "austin", unlocked: ["austin"] as const, freePick: false };
  await syncPlayer(sql, "stk", snap({ cities }), "stkphone1");
  const at = async (n: string, correct: boolean) => {
    const r = await awardGrade(sql, "stk", n, { ...pay({ correct }), prevNonce: "" });
    await sql`update wallet_ledger set created_at = now() + (${n.length} || ' seconds')::interval where op_key = ${"grade:" + n}`;
    return r;
  };
  let last;
  for (const n of ["a", "aa", "aaa", "aaaa"]) last = await at(n, true);
  const white4 = last!.wallet.keys.white;
  const fifth = await at("aaaaa", true);
  assert.equal(fifth.wallet.keys.white, white4 + 1, "5 in a row: a white match");
  assert.ok(fifth.award?.boosts.includes("5 in a row"));
  await at("aaaaaa", false);
  const after = await at("aaaaaaa", true);
  assert.equal(after.wallet.keys.white, fifth.wallet.keys.white, "a miss reset the run");
});

test("0.0.93 cache and daily goals: once a day, 2-3 amber/red matches (0.1.7); goals need proof of play", async () => {
  const sql = await db();
  const cities = { ...freshUnlocks(), start: "austin", unlocked: ["austin"] as const, freePick: false };
  await syncPlayer(sql, "cac", snap({ cities }), "cacphone1");
  const c1 = await applyClientOp(sql, "cac", { kind: "cache", city: "austin" });
  assert.ok(c1.ok);
  const got = c1.cache!.got;
  assert.ok(got.length >= 2 && got.length <= 3 && got.every((t) => t === "amber" || t === "red"), "0.1.7: the server pays amber or red only");
  const c2 = await applyClientOp(sql, "cac", { kind: "cache", city: "austin" });
  assert.equal(c2.replay, true);
  assert.deepEqual(c2.wallet.keys, c1.wallet.keys, "once per day");
  const locked = await applyClientOp(sql, "cac", { kind: "cache", city: "nyc" });
  assert.equal(locked.ok, false);

  const early = await applyClientOp(sql, "cac", { kind: "dgoal", i: 0 });
  assert.equal(early.ok, false, "no graded answers yet");
  for (const n of ["g1", "g2", "g3", "g4", "g5", "g6"]) await awardGrade(sql, "cac", n, { ...pay(), prevNonce: "" });
  const coins0 = (await canonicalWallet(sql, "cac")).wallet.coins;
  const allEarly = await applyClientOp(sql, "cac", { kind: "dgoal", i: 3 });
  assert.equal(allEarly.ok, false, "all three first");
  for (const i of [0, 1, 2]) assert.ok((await applyClientOp(sql, "cac", { kind: "dgoal", i })).ok);
  const twice = await applyClientOp(sql, "cac", { kind: "dgoal", i: 0 });
  assert.equal(twice.replay, true);
  const green0 = (await canonicalWallet(sql, "cac")).wallet.keys.green ?? 0;
  const all = await applyClientOp(sql, "cac", { kind: "dgoal", i: 3 });
  assert.ok(all.ok);
  assert.equal(all.wallet.coins - coins0, 3 * 60);
  assert.equal(all.wallet.keys.green, green0 + 1);
});

test("0.0.97 cache into full pockets: matches become merge credits on the server, never coin below violet", async () => {
  const sql = await db();
  const cities = { ...freshUnlocks(), start: "austin", unlocked: ["austin"] as const, freePick: false };
  await syncPlayer(sql, "cfull", snap({ cities }), "cfullphone1");
  await sql.query(`update player_wallets set white = 30, blue = 30, green = 30 where user_id = $1`, ["cfull"]);
  const r = await applyClientOp(sql, "cfull", { kind: "cache", city: "austin" });
  assert.ok(r.ok);
  assert.equal(r.cache!.coin, 0);
  const w = (await canonicalWallet(sql, "cfull")).wallet;
  assert.deepEqual([w.keys.white, w.keys.blue, w.keys.green], [30, 30, 30]);
  const credits = Object.values(w.meta.credit).reduce((a, b) => a + (b ?? 0), 0) + 3 * (w.keys.amber ?? 0);
  assert.ok(credits >= 1, "the cache still counts toward the next colors");
});

test("0.0.95 Amanda's make-up gift: 2 red once, idempotent, only her account, overflow coin when full", async () => {
  const sql = await db();
  const g = MATCH_GIFTS.find((x) => x.key === "gift:amanda-red-0095")!;
  assert.equal(g.userId, "j9k4J0Lv4ffeRdJF9577cNY6qZaOcWv6");
  assert.equal(g.note, "A make-up gift: 2 red matches.");
  const first = await syncPlayer(sql, g.userId, snap({}), "amandaphone1");
  assert.deepEqual(first.giftNotes, [g.note]);
  assert.equal(first.wallet.keys.red, 2);
  const again = await syncPlayer(sql, g.userId, snap({}), "amandaphone1");
  assert.equal(again.giftNotes, undefined, "note once");
  assert.equal(again.wallet.keys.red, 2, "paid once");
  assert.deepEqual(await grantMatchGifts(sql, g.userId), [], "direct replay pays nothing");
  assert.equal((await canonicalWallet(sql, g.userId)).wallet.keys.red, 2);
  const other = await syncPlayer(sql, "someone-else", snap({}), "otherphone1");
  assert.equal(other.giftNotes, undefined);
  assert.equal(other.wallet.keys.red ?? 0, 0);
  // 0.0.97: a full red pocket turns the gift into red credits (2/3 toward violet).
  const list = [{ ...g, key: "gift:test-full", userId: "fullred" }];
  await syncPlayer(sql, "fullred", snap({}), "fullphone1");
  await sql.query(`update player_wallets set red = $2 where user_id = $1`, ["fullred", matchCap("red")]);
  assert.deepEqual(await grantMatchGifts(sql, "fullred", list), [g.note]);
  const up = (await canonicalWallet(sql, "fullred")).wallet;
  assert.equal(up.keys.red, matchCap("red"));
  assert.deepEqual(up.meta.credit, { red: 2 });
});

test("0.0.95 purchases live on the account: a scout bought on one device shows on another after logout", async () => {
  const sql = await db();
  await syncPlayer(sql, "buy", snap({ coins: 20000 }), "buyphone1");
  const bought = await applyClientOp(sql, "buy", { kind: "scout", id: "corgi" });
  assert.equal(bought.ok, true);
  const coinsAfter = bought.wallet.coins;
  // Second device / after a logout wiped the save: the sync hands back what the account owns.
  const other = await syncPlayer(sql, "buy", snap({ coins: 0 }), "buylaptop1");
  assert.ok(other.owned?.scouts.includes("corgi"));
  // Buying again on the device that forgot it is a replay: no second charge.
  const again = await applyClientOp(sql, "buy", { kind: "scout", id: "corgi" });
  assert.equal(again.replay, true);
  assert.equal(again.wallet.coins, coinsAfter);
  const o = await ownedOf(sql, "buy");
  assert.deepEqual(o.scouts, ["corgi"]);
});

test("0.0.95 Beth B.'s Corgi restore: owned once, duplicate purchases refunded, idempotent, only her", async () => {
  const g = SCOUT_GIFTS.find((x) => x.key === "gift:bethb-corgi-0095")!;
  assert.equal(g.userId, "b4kKJFQyhu9Muu04I70TirgSafJyY64S");
  const sql = await db();
  const beth = g.userId;
  await syncPlayer(sql, beth, snap({ coins: 20000 }), "bethphone1");
  const first = await grantScoutGifts(sql, beth);
  assert.deepEqual(first, []);
  // (already granted by the sync above) — check ownership and no coin moved without a duplicate.
  const o = await ownedOf(sql, beth);
  assert.ok(o.scouts.includes("corgi"));
  // A second account with a legacy duplicate row gets the refund once.
  const list = [{ ...g, key: "gift:test-corgi", userId: "dup" }];
  await syncPlayer(sql, "dup", snap({ coins: 20000 }), "dupphone1");
  await applyClientOp(sql, "dup", { kind: "scout", id: "corgi" });
  const { id } = await canonicalWallet(sql, "dup");
  await sql`insert into wallet_ledger (user_id, op_key) values (${id}, 'scout:corgi:legacy')`;
  const before = (await canonicalWallet(sql, "dup")).wallet.coins;
  const notes = await grantScoutGifts(sql, "dup", list);
  assert.equal(notes.length, 1);
  assert.match(notes[0]!, /Corgi is back.*\+9,600 coin/);
  assert.equal((await canonicalWallet(sql, "dup")).wallet.coins, before + 9600);
  assert.deepEqual(await grantScoutGifts(sql, "dup", list), [], "idempotent");
  assert.equal((await canonicalWallet(sql, "dup")).wallet.coins, before + 9600);
  // Someone else is untouched.
  await syncPlayer(sql, "zed", snap({ coins: 5 }), "zedphone1");
  assert.deepEqual(await grantScoutGifts(sql, "zed"), []);
  assert.ok(!(await ownedOf(sql, "zed")).scouts.includes("corgi"));
});

test("0.0.98 regression: a gift-owned scout is never charged or refused on re-buy (Beth's Corgi)", async () => {
  const sql = await db();
  const beth = SCOUT_GIFTS[0]!.userId;
  await syncPlayer(sql, beth, snap({ coins: 50 }), "bethphone2");
  // A device that hasn't synced yet shows Corgi unowned and sends a buy with too few coins:
  // before 0.0.98 this was refused "short-coins" and the client rolled the Corgi back.
  const poor = await applyClientOp(sql, beth, { kind: "scout", id: "corgi" });
  assert.equal(poor.ok, true);
  assert.equal((await canonicalWallet(sql, beth)).wallet.coins, 50);
  // With coins, still no second charge.
  await sql`update player_wallets set coins = 20000 where user_id = ${(await canonicalWallet(sql, beth)).id}`;
  const rich = await applyClientOp(sql, beth, { kind: "scout", id: "corgi" });
  assert.equal(rich.ok, true);
  assert.equal((await canonicalWallet(sql, beth)).wallet.coins, 20000);
  assert.ok((await ownedOf(sql, beth)).scouts.includes("corgi"));
  // A player who doesn't own it still pays.
  await syncPlayer(sql, "buyer", snap({ coins: 20000 }), "buyerphone1");
  const b = await applyClientOp(sql, "buyer", { kind: "scout", id: "corgi" });
  assert.equal(b.ok, true);
  assert.ok((await canonicalWallet(sql, "buyer")).wallet.coins < 20000);
});

test("0.1.00 market lights: server sells them in order for coin, and the grade's market coin follows the owned light (Owl stacks, cap ×3)", async (t) => {
  t.after(inOpenMarket());
  const sql = await db();
  await syncPlayer(sql, "lit", snap({ coins: 0 }), "litphone1");
  assert.equal((await applyClientOp(sql, "lit", { kind: "light", id: "jade" })).ok, false, "no coin");
  await sql`update player_wallets set coins = 100000 where user_id = ${(await canonicalWallet(sql, "lit")).id}`;
  const skip = await applyClientOp(sql, "lit", { kind: "light", id: "rose" });
  assert.equal(skip.ok, false, "must buy jade first");
  assert.equal((await applyClientOp(sql, "lit", { kind: "light", id: "jade" })).ok, true);
  assert.equal((await canonicalWallet(sql, "lit")).wallet.coins, 100000 - 15000);
  assert.equal((await applyClientOp(sql, "lit", { kind: "light", id: "jade" })).ok, true, "replay is free");
  assert.equal((await canonicalWallet(sql, "lit")).wallet.coins, 100000 - 15000);
  assert.deepEqual((await lightsOf(sql, "lit")).best, "jade");

  const now = Date.now();
  const m = marketAt("austin", now)!;
  const onMkt = pay({ dealtAt: now, poiId: "", lat: m.zone.lat, lng: m.zone.lng });
  const coin = (x: Partial<typeof onMkt>) => gradeGrant(emptyWallet(), { ...onMkt, ...x }).award!.coins;
  const amber = coin({});
  const rainbow = coin({ light: "rainbow" });
  const owlRainbow = coin({ light: "rainbow", scout: "owl" });
  const owlAmber = coin({ scout: "owl" });
  assert.ok(rainbow > amber, "rainbow pays more than amber");
  assert.equal(owlAmber, rainbow, "Owl on amber (2.0+0.5) = rainbow (2.5)");
  assert.ok(owlRainbow > rainbow, "Owl stacks on rainbow");
  assert.equal(marketCoinX(true, lightOf("rainbow"), 2.5), MARKET_COIN_CAP);
  assert.equal(marketCoinX(true, lightOf("rainbow"), 9), MARKET_COIN_CAP, "cap");
  assert.equal(marketCoinX(false, lightOf("rainbow"), 2.5), 1, "off the market");
});

test("0.0.96 abilities in the server grade: Raccoon blue, Owl ×2.5 market coin, Fox/Penguin +10%", (t) => {
  t.after(inOpenMarket());
  const plain = gradeGrant(emptyWallet(), pay());
  const rum = gradeGrant(emptyWallet(), pay({ scout: "raccoon", rummage: true }));
  assert.ok(plain.ok && rum.ok);
  assert.equal((rum.award!.keys.blue ?? 0) - (plain.award!.keys.blue ?? 0), 1, "Rummager adds one blue");
  const fullBlue = { ...emptyWallet(), keys: { ...emptyWallet().keys, blue: matchCap("blue") + 5 } };
  const rumFull = gradeGrant(fullBlue, pay({ scout: "raccoon", rummage: true, clearTier: "white", poiTier: "white" }));
  const plainFull = gradeGrant(fullBlue, pay({ clearTier: "white", poiTier: "white" }));
  assert.equal(rumFull.award!.coins, plainFull.award!.coins, "0.0.97: full blue is not coin");
  assert.equal((rumFull.award!.keys.blue ?? 0) - (plainFull.award!.keys.blue ?? 0), 1, "Rummager blue lands (merged later)");
  const fox = gradeGrant(emptyWallet(), pay({ scout: "fox", loot: 1.1 }));
  assert.ok(fox.award!.coins > plain.award!.coins);

  const now = Date.now();
  const m = marketAt("austin", now);
  assert.ok(m);
  const pt = { lat: m!.street.lines[0]![0]!, lng: m!.street.lines[0]![1]! };
  const onMkt = pay({ dealtAt: now, poiId: "", lat: pt.lat, lng: pt.lng });
  const two = gradeGrant(emptyWallet(), onMkt);
  const owl = gradeGrant(emptyWallet(), { ...onMkt, scout: "owl" });
  const off = gradeGrant(emptyWallet(), { ...onMkt, scout: "owl", lat: 0, lng: 0 });
  const offPlain = gradeGrant(emptyWallet(), { ...onMkt, lat: 0, lng: 0 });
  assert.ok(owl.award!.coins > two.award!.coins, "Owl market pays more");
  // lampCoin×2 → ×2.5: the extra is a quarter of the ×2 lamp coin (perfect refund/boost unchanged).
  assert.equal(off.award!.coins, offPlain.award!.coins, "off the market the Owl pays the same");
});

test("0.1.47 Panda Bamboo luck: the server's roll pays the lamp coin twice; no roll or another coat pays as usual", () => {
  const plain = gradeGrant(emptyWallet(), pay({ scout: "panda" }));
  const hit = gradeGrant(emptyWallet(), pay({ scout: "panda", doubleUp: true }));
  const other = gradeGrant(emptyWallet(), pay({ scout: "fox", doubleUp: true }));
  assert.ok(plain.ok && hit.ok && other.ok);
  assert.ok(hit.award!.coins > plain.award!.coins, "double lamp coin");
  assert.ok(hit.award!.boosts.some((b) => b.startsWith("Bamboo luck +")), hit.award!.boosts.join(","));
  assert.equal(other.award!.coins, gradeGrant(emptyWallet(), pay({ scout: "fox" })).award!.coins, "only the Panda's perk pays");
  assert.deepEqual(hit.award!.keys, plain.award!.keys, "matches unchanged");
  const miss = gradeGrant(emptyWallet(), pay({ scout: "panda", doubleUp: true, correct: false }));
  assert.equal(miss.award!.coins, 0);
});

test("0.0.96 Plate refunds 1 in 3 failed lamps (server roll); Tabby keeps a streak through the day's first miss", async () => {
  const sql = await db();
  await syncPlayer(sql, "shl", snap({ coins: 100, keys: { blue: 2 } }), "shlphone1");
  const spent = await spendDealt(sql, "shl", "f1", "blue");
  assert.equal(spent.wallet.keys.blue, 1);
  const miss = await awardGrade(sql, "shl", "f1", { ...pay({ correct: false, scout: "turtle", shellBack: true }), prevNonce: "" });
  assert.equal(miss.wallet.keys.blue, 2, "match back");
  const missAgain = await awardGrade(sql, "shl", "f1", { ...pay({ correct: false, scout: "turtle", shellBack: true }), prevNonce: "" });
  assert.equal(missAgain.replay, true);
  assert.equal(missAgain.wallet.keys.blue, 2);
  await spendDealt(sql, "shl", "f2", "blue");
  const noRoll = await awardGrade(sql, "shl", "f2", { ...pay({ correct: false, scout: "turtle", shellBack: false }), prevNonce: "" });
  assert.equal(noRoll.wallet.keys.blue, 1);
  await spendDealt(sql, "shl", "f3", "blue");
  const otherCoat = await awardGrade(sql, "shl", "f3", { ...pay({ correct: false, scout: "raccoon", shellBack: false }), prevNonce: "" });
  assert.equal(otherCoat.wallet.keys.blue, 0);

  // Tabby: four right, one miss (today's first), then the fifth right pays the 5-in-a-row white.
  await syncPlayer(sql, "tab", snap({ coins: 100, keys: { blue: 9 } }), "tabphone1");
  for (let i = 0; i < 4; i++) await awardGrade(sql, "tab", `t${i}`, { ...pay({ scout: "cat" }), prevNonce: "" });
  await awardGrade(sql, "tab", "tmiss", { ...pay({ correct: false, scout: "cat" }), prevNonce: "" });
  const fifth = await awardGrade(sql, "tab", "t5", { ...pay({ scout: "cat" }), prevNonce: "" });
  assert.ok(fifth.award?.boosts.includes("5 in a row"), "streak survived the first miss");
  await syncPlayer(sql, "rac", snap({ coins: 100, keys: { blue: 9 } }), "racphone1");
  for (let i = 0; i < 4; i++) await awardGrade(sql, "rac", `r${i}`, { ...pay({ scout: "raccoon" }), prevNonce: "" });
  await awardGrade(sql, "rac", "rmiss", { ...pay({ correct: false, scout: "raccoon" }), prevNonce: "" });
  const rf = await awardGrade(sql, "rac", "r5", { ...pay({ scout: "raccoon" }), prevNonce: "" });
  assert.ok(!rf.award?.boosts.includes("5 in a row"), "other coats lose the streak");
});

test("0.0.97 server pocket: overflow credits persist on the server, merge 3→1 up, and a client can't forge them", async () => {
  const sql = await db();
  await syncPlayer(sql, "cred", snap({}), "credphone1");
  await sql.query(`update player_wallets set white = 30 where user_id = $1`, ["cred"]);
  const { id } = await canonicalWallet(sql, "cred");
  const { mutateWallet } = await import("./walletSql.ts");
  const add = (k: string, n: number) => mutateWallet(sql, "cred", k, (w) => ({ ok: true, wallet: { ...w, keys: { ...w.keys, white: w.keys.white + n } } }));
  await add("t:1", 2);
  let w = (await canonicalWallet(sql, "cred")).wallet;
  assert.equal(w.keys.white, 30);
  assert.deepEqual(w.meta.credit, { white: 2 }, "partial credits persist");
  await add("t:2", 1);
  w = (await canonicalWallet(sql, "cred")).wallet;
  assert.deepEqual([w.keys.white, w.keys.blue], [30, 1]);
  assert.deepEqual(w.meta.credit, {});
  // A client save carrying credits changes nothing on the server.
  await syncPlayer(sql, "cred", { ...snap({}), credit: { white: 2, blue: 2 } } as never, "credphone2");
  assert.deepEqual((await canonicalWallet(sql, "cred")).wallet.meta.credit, {});
  // Forged meta values are clamped on read.
  await sql.query(`update player_wallets set meta = meta || '{"credit":{"white":50,"violet":3}}'::jsonb where user_id = $1`, [id]);
  assert.deepEqual((await canonicalWallet(sql, "cred")).wallet.meta.credit, { white: 2 });
  // Legacy pockets above 30 are kept.
  await sql.query(`update player_wallets set amber = 150 where user_id = $1`, [id]);
  await mutateWallet(sql, "cred", "t:3", (x) => ({ ok: true, wallet: { ...x, keys: { ...x.keys, amber: x.keys.amber + 1 } } }));
  w = (await canonicalWallet(sql, "cred")).wallet;
  assert.equal(w.keys.amber, 150);
  assert.equal(w.meta.credit.amber, 1);
});

test("0.1.8 cars: the server sells each car once at its own price, any order, and the sync lists them", async () => {
  const sql = await db();
  await syncPlayer(sql, "car", snap({ coins: 0 }), "carphone1");
  assert.equal((await applyClientOp(sql, "car", { kind: "car", id: "civic" })).ok, false, "no coin");
  assert.equal((await applyClientOp(sql, "car", { kind: "car", id: "batmobile" })).ok, false, "unknown car");
  const wid = (await canonicalWallet(sql, "car")).id;
  await sql`update player_wallets set coins = 200000 where user_id = ${wid}`;
  assert.equal((await applyClientOp(sql, "car", { kind: "car", id: "mustang" })).ok, true, "any order");
  assert.equal((await canonicalWallet(sql, "car")).wallet.coins, 200000 - 150000);
  assert.equal((await applyClientOp(sql, "car", { kind: "car", id: "mustang" })).ok, true, "replay is free");
  assert.equal((await canonicalWallet(sql, "car")).wallet.coins, 50000);
  assert.equal((await applyClientOp(sql, "car", { kind: "car", id: "roadster2" })).ok, false, "2.4M is out of reach");
  assert.equal((await applyClientOp(sql, "car", { kind: "car", id: "f150" })).ok, true);
  assert.equal((await canonicalWallet(sql, "car")).wallet.coins, 0);
  assert.deepEqual((await carsOf(sql, "car")).sort(), ["f150", "mustang"]);
  const s = await syncPlayer(sql, "car", snap({ coins: 0 }), "carphone1");
  assert.deepEqual([...(s.owned?.cars ?? [])].sort(), ["f150", "mustang"]);
});

test("0.1.9 car paint: cans drop server-side once per source, paint needs the car, a matching can and 10% coin", async () => {
  const sql = await db();
  await syncPlayer(sql, "pnt", snap({ coins: 0 }), "pntphone1");
  const wid = (await canonicalWallet(sql, "pnt")).id;
  assert.equal(await grantCan(sql, "pnt", "g:n1", 0.08, 0.5, 0), null, "missed roll: no can");
  const a = await grantCan(sql, "pnt", "g:n2", 0.08, 0.01, 0.5);
  assert.ok(a, "a hit drops a can");
  assert.equal(await grantCan(sql, "pnt", "g:n2", 0.08, 0.01, 0.9), null, "same source never drops twice");
  // A known can: civic red (pick lands on index 3 of 48; 0.1.55 eight cars × six colours).
  await grantCan(sql, "pnt", "c:2026-10-20", 0.2, 0, 3.5 / 48);
  assert.ok((await paintOf(sql, "pnt")).cans.some((c) => c.can.car === "civic" && c.can.color === "red"));
  assert.equal((await applyClientOp(sql, "pnt", { kind: "paint", car: "civic", color: "red" })).reason, "no-car");
  await sql`update player_wallets set coins = 31000 where user_id = ${wid}`;
  assert.equal((await applyClientOp(sql, "pnt", { kind: "car", id: "civic" })).ok, true);
  assert.equal((await applyClientOp(sql, "pnt", { kind: "paint", car: "civic", color: "blue" })).reason, "no-can");
  assert.equal((await applyClientOp(sql, "pnt", { kind: "paint", car: "civic", color: "red" })).reason, "short-coins", "1,000 < 3,000");
  await sql`update player_wallets set coins = 3000 where user_id = ${wid}`;
  const r = await applyClientOp(sql, "pnt", { kind: "paint", car: "civic", color: "red" });
  assert.equal(r.ok, true);
  assert.equal((await canonicalWallet(sql, "pnt")).wallet.coins, 0, "10% of 30,000");
  const after = await paintOf(sql, "pnt");
  assert.equal(after.paint.civic, "red");
  assert.ok(!after.cans.some((c) => c.can.car === "civic" && c.can.color === "red"), "the can is spent");
  assert.equal((await applyClientOp(sql, "pnt", { kind: "paint", car: "civic", color: "red" })).reason, "no-can", "one can, one paint job");
  const s = await syncPlayer(sql, "pnt", snap({ coins: 0 }), "pntphone1");
  assert.equal(s.owned?.paint?.civic, "red");
});

test("0.1.12 houses: any tier first, step-up costs the difference, the key needs three lamps here and pays once a day", async () => {
  const sql = await db();
  await syncPlayer(sql, "hse", snap({ coins: 0 }), "hsephone1");
  const wid = (await canonicalWallet(sql, "hse")).id;
  assert.equal((await applyClientOp(sql, "hse", { kind: "house", city: "austin", tier: "cottage" })).reason, "short-coins");
  assert.equal((await applyClientOp(sql, "hse", { kind: "house", city: "austin", tier: "mansion" })).reason, "unknown");
  await sql`update player_wallets set coins = 1400000 where user_id = ${wid}`;
  assert.equal((await applyClientOp(sql, "hse", { kind: "house", city: "austin", tier: "row" })).ok, true, "skip ahead");
  assert.equal((await canonicalWallet(sql, "hse")).wallet.coins, 1270000);
  assert.equal((await applyClientOp(sql, "hse", { kind: "house", city: "austin", tier: "cottage" })).reason, "owned", "never down");
  assert.equal((await applyClientOp(sql, "hse", { kind: "house", city: "austin", tier: "row" })).ok, true, "same tier is a free replay");
  assert.equal((await applyClientOp(sql, "hse", { kind: "house", city: "austin", tier: "villa" })).ok, true);
  assert.equal((await canonicalWallet(sql, "hse")).wallet.coins, 1270000 - 1070000, "villa step-up is 1.2M - 130k");
  assert.deepEqual(await housesOf(sql, "hse"), { austin: { tier: "villa" } });
  // The key: no house in London, and Austin needs three correct lamps there today (misses and other cities don't count).
  assert.equal((await applyClientOp(sql, "hse", { kind: "home", city: "london" })).reason, "no-house");
  assert.equal((await applyClientOp(sql, "hse", { kind: "home", city: "austin" })).reason, "unproven");
  await awardGrade(sql, "hse", "h1", { ...pay(), prevNonce: "" });
  await awardGrade(sql, "hse", "h2", { ...pay({ correct: false }), prevNonce: "" });
  await awardGrade(sql, "hse", "h3", { ...pay({ city: "london", poiId: "" }), prevNonce: "" });
  await awardGrade(sql, "hse", "h4", { ...pay({ poiId: "" }), prevNonce: "" });
  assert.equal(await lampsToday(sql, "hse", "austin"), 2, "an unnamed spot (market lantern) counts; a miss and London don't");
  await awardGrade(sql, "hse", "h5", { ...pay(), prevNonce: "" });
  const before = (await canonicalWallet(sql, "hse")).wallet;
  const k = await applyClientOp(sql, "hse", { kind: "home", city: "austin" });
  assert.equal(k.ok, true);
  assert.equal(k.home?.match, "amber");
  assert.equal(k.home?.n, 2);
  assert.equal(k.home?.coin, 25_000);
  const after = (await canonicalWallet(sql, "hse")).wallet;
  assert.equal(after.coins, before.coins + 25_000, "0.1.42: the villa key pays 25,000 coin");
  assert.equal(after.keys.amber, before.keys.amber + 2, "0.1.42: and 2 amber matches");
  const again = await applyClientOp(sql, "hse", { kind: "home", city: "austin" });
  assert.equal(again.home?.match, null, "once a day");
  assert.equal(again.home?.coin, 0);
  assert.equal((await canonicalWallet(sql, "hse")).wallet.keys.amber, after.keys.amber, "a replay pays nothing extra");
  assert.equal((await canonicalWallet(sql, "hse")).wallet.coins, after.coins);
  const s = await syncPlayer(sql, "hse", snap({ coins: 0 }), "hsephone1");
  assert.equal(s.owned?.houses?.austin?.tier, "villa");
  assert.ok(s.owned?.homeClaims?.some((x) => x.startsWith("hook:austin:")));
});

test("0.1.12: the wallet holds 5,000,000, but a first sync still carries at most 250,000 from a device", async () => {
  const sql = await db();
  const s = await syncPlayer(sql, "big", snap({ coins: 4_000_000 }), "bigphone1");
  assert.equal(s.wallet.coins, FIRST_SYNC_COIN_CAP);
  const wid = (await canonicalWallet(sql, "big")).id;
  await sql`update player_wallets set coins = 4999000 where user_id = ${wid}`;
  const { mutateWallet } = await import("./walletSql.ts");
  await mutateWallet(sql, "big", "t:big", (w) => applyDelta(w, { coins: 5000 }));
  assert.equal((await canonicalWallet(sql, "big")).wallet.coins, COIN_CAP);
});

test("0.1.19: sparks (no match held) are capped on the server — six a day, once per lamp", async () => {
  const sql = await db();
  await syncPlayer(sql, "beth", snap({ coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "detroit", unlocked: ["detroit"] } }), "bethphone");
  const spark = (poiId: string) => ({ ...pay({ clearTier: null, poiTier: "red", poiId, city: "detroit", series: null }), prevNonce: "" });
  const first = await awardGrade(sql, "beth", "s0", spark("det-lamp-0"));
  assert.equal(first.wallet.keys.red, 1, "a spark pays the lamp's color");
  const again = await awardGrade(sql, "beth", "s0b", spark("det-lamp-0"));
  assert.equal(again.wallet.keys.red, 1, "the same lamp can't spark twice in a day");
  for (let i = 1; i < 6; i++) await awardGrade(sql, "beth", `s${i}`, spark(`det-lamp-${i}`));
  const six = await awardGrade(sql, "beth", "s6", spark("det-lamp-6"));
  assert.equal(six.wallet.keys.red, 6, "only six sparks pay a day");
  assert.match(String(six.award?.boosts ?? ""), /Sparks are spent/);
});

test("0.1.19: violet never sparks on the server; red still does", async () => {
  const sql = await db();
  await syncPlayer(sql, "vio", snap({ coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "detroit", unlocked: ["detroit"] } }), "viophone");
  const spark = (tier: "violet" | "red", poiId: string) => ({ ...pay({ clearTier: null, poiTier: tier, poiId, city: "detroit", series: null }), prevNonce: "" });
  const v = await awardGrade(sql, "vio", "v1", spark("violet", "det-violet"));
  assert.equal(v.wallet.keys.violet ?? 0, 0, "a violet spark pays nothing");
  assert.equal(v.wallet.coins, 0);
  const r = await awardGrade(sql, "vio", "r1", spark("red", "det-red"));
  assert.equal(r.wallet.keys.red, 1, "red still sparks");
});

test("0.1.19: the device offers no spark at a violet lamp", () => {
  assert.equal(sparkTier("violet"), false);
  for (const t of ["white", "blue", "green", "amber", "red"]) assert.equal(sparkTier(t), true);
  const src = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  assert.match(src, /if \(!sparkTier\(poi\.tier\)\) return `Need a \$\{TIER_LABEL\[poi\.tier\]\} match\.`;/);
});

test("0.1.23: a second cache open (another device) says already opened, never an empty 'pockets full'", async () => {
  const sql = await db();
  const cities = { ...freshUnlocks(), start: "chicago", unlocked: ["chicago"] as const, freePick: false };
  // Ryan's pockets: white and blue at 30, room in green/amber/red.
  await syncPlayer(sql, "ryan", snap({ cities, keys: { white: 30, blue: 30, green: 24, amber: 6, red: 1 } }), "ryandesk1");
  const first = await applyClientOp(sql, "ryan", { kind: "cache", city: "chicago" });
  assert.ok(first.cache!.got.length >= 2, "a cache pays amber/red when those pockets have room");
  assert.equal(first.cache!.coin, 0);
  const again = await applyClientOp(sql, "ryan", { kind: "cache", city: "chicago" });
  assert.equal(again.replay, true);
  assert.equal(again.cache!.already, true);
  assert.deepEqual(again.cache!.got, first.cache!.got, "the replay reports what the first open paid");
  assert.equal(cacheLine([], 0), "Match cache! It was empty.");
  assert.doesNotMatch(cacheLine([], 0), /full/);
  assert.match(cacheLine([], 90), /Every pocket is full: \+90 coin/);
  const src = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  assert.match(src, /if \(r\.replay \|\| r\.cache\?\.already \|\| !r\.cache\)/, "the device shows 'already opened' on a replay");
});

test("0.1.42 owned lanterns: one per color, one owner per lamp, misses pay the owner once within the limits", async () => {
  const { OWN_PRICE, ownPayFor, OWN_DAILY_CAP, OWN_CLAIM_USER } = await import("./ownLamps.ts");
  const { ownedLamps, payOwner } = await import("./walletApply.ts");
  const { CITIES } = await import("./data.ts");
  const sql = await db();
  const tiers = ["white", "blue", "green", "amber", "red", "violet"] as const;
  const lamps = (t: (typeof tiers)[number]) => Object.values(CITIES).flatMap((c) => c.pois).filter((p) => p.tier === t && p.kind !== "station");
  const station = Object.values(CITIES).flatMap((c) => c.pois).find((p) => p.kind === "station");
  await syncPlayer(sql, "own", snap({ coins: 0 }), "ownphone1");
  await syncPlayer(sql, "vis", snap({ coins: 0 }), "visphone1");
  await syncPlayer(sql, "rich", snap({ coins: 0 }), "richphone1");
  const oid = (await canonicalWallet(sql, "own")).id;
  const rid = (await canonicalWallet(sql, "rich")).id;

  // Insufficient coins: refused, and the lamp stays free.
  const w0 = lamps("white")[0]!;
  assert.equal((await applyClientOp(sql, "own", { kind: "own", poi: w0.id })).reason, "short-coins");
  assert.equal((await ownedLamps(sql, null)).length, 0);
  if (station) assert.equal((await applyClientOp(sql, "own", { kind: "own", poi: station.id })).reason, "unknown", "train stops can't be owned");

  // One per tier: each color costs its price; a second lamp of a color is refused.
  for (const t of tiers) {
    await sql`update player_wallets set coins = ${OWN_PRICE[t] + 100_000} where user_id = ${oid}`;
    assert.equal((await applyClientOp(sql, "own", { kind: "own", poi: lamps(t)[0]!.id })).ok, true, t);
  }
  assert.equal((await canonicalWallet(sql, "own")).wallet.coins, 100_000);
  assert.equal((await applyClientOp(sql, "own", { kind: "own", poi: lamps("white")[1]!.id })).reason, "owned", "one white per player");
  assert.equal((await applyClientOp(sql, "own", { kind: "own", poi: w0.id })).replay, true, "same lamp again is a free replay");
  assert.equal((await canonicalWallet(sql, "own")).wallet.coins, 100_000);
  const list = await ownedLamps(sql, "own");
  assert.equal(list.length, 6);
  assert.ok(list.every((l) => l.mine));
  assert.ok((await ownedLamps(sql, "vis")).every((l) => !l.mine));

  // POI exclusivity: another player can't take an owned lamp, and a refused buy charges nothing.
  await sql`update player_wallets set coins = 4000000 where user_id = ${rid}`;
  assert.equal((await applyClientOp(sql, "rich", { kind: "own", poi: w0.id })).reason, "taken");
  assert.equal((await canonicalWallet(sql, "rich")).wallet.coins, 4_000_000);
  const [ra, rb] = await Promise.all([
    applyClientOp(sql, "rich", { kind: "own", poi: lamps("white")[2]!.id }),
    applyClientOp(sql, "vis", { kind: "own", poi: lamps("white")[2]!.id }),
  ]);
  assert.equal(ra.ok, true, "the funded buyer wins");
  assert.equal(rb.reason === "taken" || rb.reason === "short-coins", true);
  assert.equal((await ownedLamps(sql, null)).filter((l) => l.poi === lamps("white")[2]!.id).length, 1);

  // Self-play: the owner missing at their own lamp pays nothing.
  const miss = (t: (typeof tiers)[number], poiId: string) => ({ ...pay({ correct: false, clearTier: t, poiTier: t, poiId }), prevNonce: "" });
  const ownerCoins = async () => (await canonicalWallet(sql, "own")).wallet.coins;
  await awardGrade(sql, "own", "self1", miss("white", w0.id));
  assert.equal(await ownerCoins(), 100_000, "no pay from own plays");
  // A right answer by a visitor pays the visitor only.
  await awardGrade(sql, "vis", "right1", { ...pay({ correct: true, clearTier: "white", poiTier: "white", poiId: w0.id }), prevNonce: "" });
  assert.equal(await ownerCoins(), 100_000);

  // A visitor's miss pays the owner half the tier value plus (by nonce) a match; a replay does not pay again.
  const before = (await canonicalWallet(sql, "own")).wallet;
  await awardGrade(sql, "vis", "m1", miss("white", w0.id));
  const exp = ownPayFor("white", "m1");
  const after = (await canonicalWallet(sql, "own")).wallet;
  assert.equal(exp.coins, 15);
  assert.equal(after.coins, before.coins + 15);
  assert.equal(after.keys.white, before.keys.white + (exp.match ? 1 : 0));
  await awardGrade(sql, "vis", "m1", miss("white", w0.id));
  assert.equal(await payOwner(sql, (await canonicalWallet(sql, "vis")).id, "m1", w0.id), false, "idempotent per grade nonce");
  assert.equal((await canonicalWallet(sql, "own")).wallet.coins, before.coins + 15);
  // Cooldown: a second miss inside the lamp's cooldown pays nothing.
  await awardGrade(sql, "vis", "m2", miss("white", w0.id));
  assert.equal(await ownerCoins(), before.coins + 15, "only at the lamp's normal cooldown");
  for (const t of tiers) assert.equal(ownPayFor(t, "x").coins, { white: 15, blue: 45, green: 135, amber: 405, red: 1215, violet: 3645 }[t]);
  assert.ok([...Array(40).keys()].some((i) => ownPayFor("blue", `n${i}`).match) && [...Array(40).keys()].some((i) => !ownPayFor("blue", `n${i}`).match), "the match is a coin flip");

  // Daily cap: OWN_DAILY_CAP paid misses on one lamp today, then nothing (cooldowns aged out).
  await sql`update wallet_ledger set created_at = now() - interval '100 seconds' where user_id = ${oid} and op_key like 'ownpay:%'`;
  for (let i = 1; i < OWN_DAILY_CAP; i++) {
    await sql.query(`insert into wallet_ledger (user_id, op_key, detail, created_at) values ($1, $2, $3, now() - make_interval(secs => $4))`, [oid, `ownpay:fake${i}`, JSON.stringify({ poi: w0.id }), 100 + i]);
  }
  const capped = await ownerCoins();
  await awardGrade(sql, "vis", "m3", miss("white", w0.id));
  assert.equal(await ownerCoins(), capped, "max 20 paid misses per lamp per day");

  // Coin cap: a payout clamps at COIN_CAP.
  const b0 = lamps("blue")[0]!;
  await sql`update player_wallets set coins = ${COIN_CAP - 10} where user_id = ${oid}`;
  await awardGrade(sql, "vis", "m4", miss("blue", b0.id));
  assert.equal(await ownerCoins(), COIN_CAP);
  void OWN_CLAIM_USER;
});

test("0.1.42 house keys: every tier pays 2 matches of its color plus its coin, once a day, clamped at the coin cap", async () => {
  const want = { cottage: ["white", 1_000], row: ["blue", 3_000], town: ["green", 8_000], villa: ["amber", 25_000] } as const;
  for (const [tier, [color, coin]] of Object.entries(want)) {
    const sql = await db();
    const u = `key-${tier}`;
    await syncPlayer(sql, u, snap({ coins: 0 }), `${u}phone1`);
    const wid = (await canonicalWallet(sql, u)).id;
    await sql`update player_wallets set coins = 2000000 where user_id = ${wid}`;
    assert.equal((await applyClientOp(sql, u, { kind: "house", city: "austin", tier })).ok, true, tier);
    for (const n of ["a", "b", "c"]) await awardGrade(sql, u, `${u}${n}`, { ...pay(), prevNonce: "" });
    const before = (await canonicalWallet(sql, u)).wallet;
    const r = await applyClientOp(sql, u, { kind: "home", city: "austin" });
    assert.deepEqual([r.ok, r.home?.match, r.home?.n, r.home?.coin], [true, color, 2, coin], tier);
    const after = (await canonicalWallet(sql, u)).wallet;
    assert.equal(after.coins, before.coins + coin, tier);
    assert.equal(after.keys[color], before.keys[color] + 2, tier);
    const again = await applyClientOp(sql, u, { kind: "home", city: "austin" });
    assert.equal(again.home?.coin, 0, `${tier} replay`);
    const last = (await canonicalWallet(sql, u)).wallet;
    assert.deepEqual([last.coins, last.keys[color]], [after.coins, after.keys[color]], `${tier} replay pays nothing extra`);
  }
  // Coin cap: a key near the cap pays only up to COIN_CAP (the matches still land).
  const sql = await db();
  await syncPlayer(sql, "keycap", snap({ coins: 0 }), "keycapphone1");
  const wid = (await canonicalWallet(sql, "keycap")).id;
  await sql`update player_wallets set coins = 1200000 where user_id = ${wid}`;
  await applyClientOp(sql, "keycap", { kind: "house", city: "austin", tier: "villa" });
  for (const n of ["a", "b", "c"]) await awardGrade(sql, "keycap", `kc${n}`, { ...pay(), prevNonce: "" });
  await sql`update player_wallets set coins = ${COIN_CAP - 100} where user_id = ${wid}`;
  const amber = (await canonicalWallet(sql, "keycap")).wallet.keys.amber;
  const r = await applyClientOp(sql, "keycap", { kind: "home", city: "austin" });
  assert.equal(r.home?.coin, 100);
  const w = (await canonicalWallet(sql, "keycap")).wallet;
  assert.equal(w.coins, COIN_CAP);
  assert.equal(w.keys.amber, amber + 2);
});
