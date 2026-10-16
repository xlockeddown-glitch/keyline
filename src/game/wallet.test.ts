// 0.0.78 server wallet: first sync keeps the higher pocket (once), a grade pays from the server's
// own formula, the same token pays once, and a spend that isn't in the pocket is refused.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { rewardPoints } from "./rewards.ts";
import {
  COIN_CAP,
  KEY_CAP,
  applyDelta,
  emptyWallet,
  gradeGrant,
  mergeFirstSync,
  spendMatchOp,
  type GradePay,
  type LocalSnap,
} from "./wallet.ts";
import { canonicalWallet } from "./walletSql.ts";
import { DEVICE_CAP, applyClientOp, awardGrade, spendDealt, syncPlayer } from "./walletApply.ts";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (
    alias_id text primary key,
    primary_id text not null,
    how text not null,
    linked_at timestamptz not null default now()
  )`);
  await pg.exec(readFileSync(new URL("../../migrations/0016_player_wallet.sql", import.meta.url), "utf8"));
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

  // The same bank trade posted twice is one trade. A second trade, after the pocket changed, is another.
  await applyClientOp(sql, "ann", { kind: "street", id: "k1", tier: "white", city: "austin", lat: 30.2, lng: -97.7 });
  await applyClientOp(sql, "ann", { kind: "street", id: "k2", tier: "white", city: "austin", lat: 30.2, lng: -97.7 });
  await applyClientOp(sql, "ann", { kind: "street", id: "k3", tier: "white", city: "austin", lat: 30.2, lng: -97.7 });
  await applyClientOp(sql, "ann", { kind: "street", id: "k4", tier: "white", city: "austin", lat: 30.2, lng: -97.7 });
  const up = await applyClientOp(sql, "ann", { kind: "bank", dir: "up", tier: "white" });
  assert.equal(up.ok, true);
  assert.equal(up.wallet.keys.blue, (revised.wallet.keys.blue ?? 0) + 1);
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
