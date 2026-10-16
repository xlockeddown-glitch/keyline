// 0.0.78 server wallet: first sync keeps the higher pocket (once), a grade pays from the server's
// own formula, the same token pays once, and a spend that isn't in the pocket is refused.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { rewardPoints } from "./rewards.ts";
import { CITIES } from "./data.ts";
import { surveyProven } from "./survey.ts";
import { streetSpot } from "./streetSpots.ts";
import { matchCap, transitLoot } from "./ticket.ts";
import { rideReward } from "./rideGames.ts";
import { payDaily } from "./dailyRun.ts";
import { rideSeed, scoreRide } from "./rideGrade.ts";
import { whereRound } from "./whereAmI.ts";
import { marketMatches } from "./nightMarket.ts";
import {
  CLOTH_CAP,
  COIN_CAP,
  KEY_CAP,
  PASS_CAP,
  WALK_CAP,
  acceptNonces,
  charmOp,
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
import { canonicalWallet } from "./walletSql.ts";
import { DEVICE_CAP, applyClientOp, awardGrade, spendDealt, syncPlayer } from "./walletApply.ts";
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
  assert.equal(merged.coins, COIN_CAP);
  assert.equal(merged.keys.white, 4);
  assert.equal(merged.keys.blue, KEY_CAP);
  assert.equal(merged.keys.green, 2);
  assert.ok(merged.cities.unlocked.includes("austin"));
  assert.ok(merged.cities.unlocked.includes("nyc"));
  assert.equal(merged.cities.passes, 3);
  assert.equal(merged.meta.revised, false);
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
  assert.equal(cheated.wallet.coins, COIN_CAP);

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
  assert.equal(second.wallet.cities.passes, 5);
  assert.ok(second.wallet.cities.unlocked.includes("austin"));
  assert.ok(second.wallet.cities.unlocked.includes("nyc"));
  assert.ok(second.wallet.cities.goalsPaid.includes("austin"));
  assert.ok(second.wallet.cities.goalsPaid.includes("nyc"));
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
  assert.equal(COIN_CAP, 250_000);
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
  assert.equal(merged.coins, COIN_CAP);
  for (const tier of ["white", "blue", "green", "amber", "red", "violet"] as const) assert.equal(merged.keys[tier], KEY_CAP);
  assert.equal(merged.cities.passes, PASS_CAP);
  const brought = mergeFirstSync(
    emptyWallet(),
    snap({
      lucky: true,
      cloths: ["road-dust", "nope", "scarf-austin", "scarf-austin", "scarf-nowhere"],
      distanceM: 9_000_000,
    }),
  );
  assert.equal(brought.meta.lucky, true);
  assert.deepEqual(brought.meta.cloths, ["road-dust", "scarf-austin"]);
  assert.equal(brought.meta.walkM, WALK_CAP);
  assert.equal(realCloth("nope"), null);
  assert.equal(CLOTH_CAP, 18);
  assert.equal(clothOp(emptyWallet(), "nope").ok, false);
  assert.equal(charmOp(emptyWallet(), "scholar").ok, false);
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
  const rideMs = 8 * 60_000;
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

test("lucky and cloth pay only when the server knows the player owns them", async () => {
  assert.deepEqual(provenBoost(true, "road-dust", { lucky: false, cloths: new Set() }), { lucky: false, cloth: null });
  assert.deepEqual(provenBoost(true, "road-dust", { lucky: true, cloths: new Set(["road-dust"]) }), { lucky: true, cloth: "road-dust" });
  const plain = gradeGrant(emptyWallet(), pay());
  const dressed = gradeGrant(emptyWallet(), pay({ lucky: true, luckyHit: true, cloth: "road-dust" }));
  assert.equal(plain.ok && dressed.ok, true);
  if (!plain.ok || !dressed.ok) return;
  assert.ok((dressed.award?.coins ?? 0) > (plain.award?.coins ?? 0));
  const sql = await db();
  await syncPlayer(sql, "lux", snap({ cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"] } }), "luxphone1");
  const graded = await awardGrade(sql, "lux", "luck1", { ...pay({ lucky: true, luckyHit: true, cloth: "road-dust" }), prevNonce: "" });
  assert.equal(graded.wallet.coins, plain.award?.coins);
  assert.equal(graded.wallet.keys.blue ?? 0, plain.wallet.keys.blue ?? 0);
  const charm = await applyClientOp(sql, "lux", { kind: "charm", id: "lucky" });
  assert.equal(charm.ok, true);
  assert.equal(charm.wallet.meta.lucky, true);
  const cloth = await applyClientOp(sql, "lux", { kind: "cloth", id: "road-dust" });
  assert.equal(cloth.ok, true);
  const dressedGrade = await awardGrade(sql, "lux", "luck2", { ...pay({ lucky: true, luckyHit: true, cloth: "road-dust" }), prevNonce: "" });
  assert.equal(dressedGrade.wallet.coins - cloth.wallet.coins, dressed.award?.coins);
  const again = await applyClientOp(sql, "lux", { kind: "charm", id: "lucky" });
  assert.equal(again.replay || again.ok, true);
  assert.equal(again.wallet.meta.lucky, true);
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
  await insert("nonceblitz", today);
  const old = await applyClientOp(sql, "con", { kind: "contract", nonces: ["nonceold1"] });
  assert.equal(old.ok, false);
  assert.equal(old.reason, "unproven");
  const made = await applyClientOp(sql, "con", { kind: "contract", nonces: ["noncetoday"] });
  assert.equal(made.ok, true);
  assert.equal(made.wallet.keys.amber, 1);
  assert.ok(made.wallet.coins >= 1500);
  const reuse = await applyClientOp(sql, "con", { kind: "contract", nonces: ["noncetoday"] });
  assert.equal(reuse.replay, true);
  assert.equal(reuse.wallet.keys.amber, 1);
  const stolen = await applyClientOp(sql, "con", { kind: "blitz", step: 0, nonces: ["noncetoday"] });
  assert.equal(stolen.ok, false);
  const blitz = await applyClientOp(sql, "con", { kind: "blitz", step: 0, nonces: ["nonceblitz"] });
  assert.equal(blitz.ok, true);
  assert.equal(blitz.wallet.coins, made.wallet.coins + 20);
  const blitzAgain = await applyClientOp(sql, "con", { kind: "blitz", step: 0, nonces: ["nonceblitz"] });
  assert.equal(blitzAgain.replay, true);
  assert.equal(blitzAgain.wallet.coins, blitz.wallet.coins);
  await insert("noncestep2", today);
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

test("a market spot pays the double, and a kiosk name counts as a visit", async () => {
  const sql = await db();
  const cities = { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false };
  await syncPlayer(sql, "str", snap({ coins: 3000, cities }), "strphone1");
  const day = new Date().toISOString().slice(0, 10);
  let market: ReturnType<typeof streetSpot> = null;
  for (let i = 9; i < 40; i++) {
    const s = streetSpot("str", "austin", day, i);
    if (s?.market) {
      market = s;
      break;
    }
  }
  assert.ok(market);
  const paid = await applyClientOp(sql, "str", { kind: "street", id: market!.id, tier: "white", city: "austin", lat: 0, lng: 0 });
  assert.equal(paid.ok, true);
  const add = marketMatches(0, Math.max(matchCap(market!.tier), 1), 2);
  assert.equal(paid.wallet.keys[market!.tier], add);
  const stale = streetSpot("str", "austin", "1999-01-01", 9);
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
  const before = (await canonicalWallet(sql, "str")).wallet.keys.blue ?? 0;
  const visit = await applyClientOp(sql, "str", { kind: "survey", id: "visit-4" });
  assert.equal(visit.ok, true);
  assert.equal(visit.wallet.keys.blue, before + 1);
});

test("a failed unlock reply rolls the local city list back", () => {
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  const unlock = store.slice(store.indexOf("unlockCity: (id) =>"), store.indexOf("setHud: (h) =>"));
  assert.match(unlock, /const before = get\(\)\.cities/);
  assert.match(unlock, /if \(res == null\)/);
  assert.match(unlock, /cities: before/);
  assert.match(store, /kind: "ride", watch: watching, play: playing/);
  assert.match(store, /kind: "board"/);
  assert.doesNotMatch(store, /kind: "pulse"/);
  const body = Buffer.from(JSON.stringify({ n: "nonceaaaa", t: Date.UTC(2026, 9, 16, 12) })).toString("base64url");
  assert.equal(tokenNonce(`${body}.sig`), "nonceaaaa");
  assert.equal(tokenNonce("nope"), null);
});
