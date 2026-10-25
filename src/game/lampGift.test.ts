import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { GradePay, LocalSnap } from "./wallet.ts";
import { canonicalWallet } from "./walletSql.ts";
import { applyClientOp, awardGrade, grantLampGift, lampGiftsOpen, ownedLamps, syncPlayer } from "./walletApply.ts";
import { thanksClock } from "./thanksGift.ts";
import { LAMP_GIFT_CUTOFF, lampGiftClock, lampGiftNote, welcomeClock } from "./lampGift.ts";
import { OWN_PRICE, ownPayFor } from "./ownLamps.ts";
import { CITIES } from "./data.ts";
import type { Tier } from "./types.ts";

thanksClock.cutoff = "2000-01-01T00:00:00Z";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";

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
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(readFileSync(new URL(`../../migrations/${m}`, import.meta.url), "utf8"));
  return sqlOf(pg);
}

const snap = (): LocalSnap => ({ coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } });
const lamps = (t: Tier) => Object.values(CITIES).flatMap((c) => c.pois).filter((p) => p.tier === t && p.kind !== "station");

/** An account that played before the cutoff: one sync with the gift off, rows backdated a day, cutoff an hour ago. */
async function veteran(sql: Sql, id: string) {
  lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
  await syncPlayer(sql, id, snap(), `${id}-phone1`);
  await sql.query(`update wallet_ledger set created_at = now() - interval '1 day' where user_id = $1`, [id]);
  lampGiftClock.cutoff = new Date(Date.now() - 3600_000).toISOString();
}

test("cutoff constant is 1:00 AM CT Oct 26", () => {
  assert.equal(LAMP_GIFT_CUTOFF, "2026-10-26T06:00:00Z");
});

test("eligibility: an account from before the cutoff gets both, once; a newer one gets nothing", async () => {
  const sql = await db();
  await veteran(sql, "old");
  const r = await syncPlayer(sql, "old", snap(), "old-phone1");
  assert.deepEqual(r.giftNotes, [lampGiftNote(["white", "blue", "green", "amber"])], "0.1.44: one note for all four");
  assert.match(r.giftNotes![0]!, /Free White, Blue, Green and Amber lanterns are waiting/);
  assert.deepEqual(await lampGiftsOpen(sql, "old"), ["white", "blue", "green", "amber"]);
  const again = await syncPlayer(sql, "old", snap(), "old-phone1");
  assert.equal(again.giftNotes, undefined, "grant is idempotent");
  assert.deepEqual(await grantLampGift(sql, "old"), []);
  // New account: first row now, cutoff an hour ago.
  await syncPlayer(sql, "new", snap(), "new-phone1");
  assert.deepEqual(await lampGiftsOpen(sql, "new"), []);
  assert.deepEqual(await grantLampGift(sql, "new"), []);
});

test("claim: free, one per color, lamp exclusivity (incl. concurrent), stacks with a bought lantern, pays like a bought one", async () => {
  const sql = await db();
  await veteran(sql, "a");
  await veteran(sql, "b");
  await syncPlayer(sql, "a", snap(), "a-phone1");
  await syncPlayer(sql, "b", snap(), "b-phone1");
  await syncPlayer(sql, "nob", snap(), "nob-phone1");
  const aid = (await canonicalWallet(sql, "a")).id;
  const [w0, w1, w2, w3] = lamps("white");
  const b0 = lamps("blue")[0]!;
  // No entitlement: a new account, or a color that isn't gifted.
  assert.equal((await applyClientOp(sql, "nob", { kind: "own", poi: w0!.id, free: true })).reason, "no-gift");
  assert.equal((await applyClientOp(sql, "a", { kind: "own", poi: lamps("red")[0]!.id, free: true })).reason, "no-gift");
  // Concurrent: two gifted players race for one lamp; exactly one gets it.
  const [ra, rb] = await Promise.all([applyClientOp(sql, "a", { kind: "own", poi: w0!.id, free: true }), applyClientOp(sql, "b", { kind: "own", poi: w0!.id, free: true })]);
  assert.equal([ra.ok, rb.ok].filter(Boolean).length, 1);
  assert.equal((ra.ok ? rb : ra).reason, "taken");
  const winner = ra.ok ? "a" : "b";
  const loser = ra.ok ? "b" : "a";
  assert.equal((await ownedLamps(sql, null)).filter((l) => l.poi === w0!.id).length, 1);
  // Free: no coins spent. Can't claim twice (another lamp is refused, the same lamp is a replay).
  assert.equal((await canonicalWallet(sql, winner)).wallet.coins, 0);
  assert.equal((await applyClientOp(sql, winner, { kind: "own", poi: w1!.id, free: true })).reason, "owned");
  assert.equal((await applyClientOp(sql, winner, { kind: "own", poi: w0!.id, free: true })).replay, true);
  assert.deepEqual(await lampGiftsOpen(sql, winner), ["blue", "green", "amber"]);
  // The loser still has the gift and places it elsewhere; then blue too.
  assert.equal((await applyClientOp(sql, loser, { kind: "own", poi: w2!.id, free: true })).ok, true);
  assert.equal((await applyClientOp(sql, "a", { kind: "own", poi: b0.id, free: true })).ok, true);
  // Gifted + bought of the same color: both allowed (own:white and ownfree:white are independent).
  await sql`update player_wallets set coins = ${OWN_PRICE.white} where user_id = ${aid}`;
  assert.equal((await applyClientOp(sql, "a", { kind: "own", poi: w3!.id })).ok, true);
  assert.equal((await canonicalWallet(sql, "a")).wallet.coins, 0);
  const mine = (await ownedLamps(sql, "a")).filter((l) => l.mine);
  assert.equal(mine.filter((l) => l.tier === "white").length, 2);
  assert.equal(mine.filter((l) => l.free).length, 2);
  // A gifted lamp pays its owner on a visitor's miss, like a bought one.
  const giftedWhite = winner === "a" ? w0! : w2!;
  const pay = (over: Partial<GradePay>) => ({ correct: false, elapsedMs: 3000, mult: 1, city: "austin" as const, diff: 2 as const, clearTier: "white" as Tier, poiTier: "white" as Tier, poiId: giftedWhite.id, lat: 30.28, lng: -97.74, series: null, step: 0, steps: 1, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], topic: null, dealtAt: Date.now(), luckyHit: false, perfectBlue: false, prevNonce: "", ...over });
  const before = (await canonicalWallet(sql, "a")).wallet;
  await awardGrade(sql, "nob", "gm1", pay({}));
  const after = (await canonicalWallet(sql, "a")).wallet;
  assert.equal(after.coins, before.coins + ownPayFor("white", "gm1").coins);
  assert.equal(after.keys.white, before.keys.white + (ownPayFor("white", "gm1").match ? 1 : 0));
});
