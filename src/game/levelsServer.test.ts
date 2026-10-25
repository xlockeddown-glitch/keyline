import { test } from "node:test";
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
// 0.1.44: and the new-player welcome pack (welcome.test.ts covers it).
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
// 0.1.43: these tests predate the free lantern gift; keep it out of their wallets (lampGift.test.ts covers it).
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { levelOf, rewardFor, xpOf } from "./levels.ts";
import { levelLook, levelTags, sendLevelGift, setLevelLook, useLevelBoost } from "./levelsServer.ts";
import { syncPlayer } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";

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
async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  await pg.exec(mig("0016_player_wallet.sql"));
  await pg.exec(mig("0003_plate_events.sql"));
  await pg.exec(mig("0014_walk_distance.sql"));
  await pg.exec(`create view plate_events_by_player as select * from plate_events`);
  await pg.exec(`create table "user" (id text primary key, name text)`);
  return sqlOf(pg);
}
const cat = (id: string) => (id.startsWith("sci") ? "science" : id.startsWith("loc") ? "local" : null) as never;
let n = 0;
async function answers(sql: Sql, uid: string, k: number, rarity: string, plate: string, correct = true) {
  for (let i = 0; i < k; i++) {
    await sql.query(
      `insert into plate_events (id, user_id, save_id, plate_id, shown_at, answered_at, latency_ms, correct, rarity, city, difficulty)
       values ($1, $2, 's', $3, now(), now() + ($4 || ' milliseconds')::interval, 1000, $5, $6, 'austin', 2)`,
      [`t:${n}`, uid, plate, String(n), correct, rarity],
    );
    n++;
  }
}
const snap = () => ({ coins: 0, keys: {}, cities: freshUnlocks() });

test("0.0.98 levels: backfill sets a baseline (no retro grants), later levels pay once, XP from the server's records", async () => {
  const sql = await db();
  await syncPlayer(sql, "vet", snap(), "vetphone1");
  await answers(sql, "vet", 30, "blue", "sci-1"); // 600 XP: well past level 2
  const first = await levelLook(sql, "vet", cat);
  assert.equal(first.xp, 600);
  assert.equal(first.level, levelOf(600).level);
  assert.ok(first.level >= 4);
  assert.deepEqual(first.paid, [], "a veteran's earlier levels are not paid retroactively");
  const keys0 = (await canonicalWallet(sql, "vet")).wallet.keys;
  await answers(sql, "vet", 40, "amber", "loc-1"); // +2400 XP
  const next = await levelLook(sql, "vet", cat);
  assert.ok(next.level > first.level);
  assert.deepEqual(next.paid.map((r) => r.level), Array.from({ length: next.level - first.level }, (_, i) => first.level + 1 + i));
  const keys1 = (await canonicalWallet(sql, "vet")).wallet.keys;
  const total = (k: Record<string, number>) => Object.values(k).reduce((a, b) => a + b, 0);
  assert.equal(total(keys1) - total(keys0), next.paid.reduce((a, r) => a + r.match.n, 0));
  const again = await levelLook(sql, "vet", cat);
  assert.deepEqual(again.paid, [], "paid once");
  assert.equal(again.rows.find((r) => r.id === "cat:science:0")!.have, 30);
  assert.equal(again.rows.find((r) => r.id === "cat:local:0")!.have, 40);
  assert.equal(xpOf({ correctByTier: { blue: 30, amber: 40 }, meters: 0, goals: 0, rides: 0 }), again.xp);
});

test("titles: only earned ones can be picked; Hot Streak from the answer order", async () => {
  const sql = await db();
  await syncPlayer(sql, "ttl", snap(), "ttlphone1");
  await answers(sql, "ttl", 24, "white", "x");
  await answers(sql, "ttl", 1, "white", "x", false);
  await answers(sql, "ttl", 25, "white", "x");
  const v = await levelLook(sql, "ttl", cat);
  assert.equal(v.rows.find((r) => r.id === "hot-streak")!.earned, true);
  assert.equal((await setLevelLook(sql, "ttl", { title: "cat:science:2" }, cat)).ok, false);
  // setLevelLook uses the real card index: the hot-streak title doesn't need it.
  assert.equal((await setLevelLook(sql, "ttl", { title: "hot-streak" }, cat)).ok, true);
  const tags = await levelTags(sql, ["ttl"]);
  assert.equal(tags.get("ttl")!.title, "Hot Streak");
  assert.equal(tags.get("ttl")!.level, v.level);
});

test("boost token: 15 minutes, one at a time; gifts move a token to a friend's match/boost once per nonce", async () => {
  const sql = await db();
  await syncPlayer(sql, "a", snap(), "aphone1");
  await syncPlayer(sql, "b", snap(), "bphone1");
  await sql.query(`insert into "user" (id, name) values ('a', 'Alice Smith')`);
  await sql.query(`update player_wallets set meta = meta || '{"boosts":1,"gifts":1,"lvl":6,"lvlInit":true}'::jsonb where user_id = 'a'`);
  const now = Date.now();
  const on = await useLevelBoost(sql, "a", now);
  assert.equal(on.ok, true);
  assert.equal(on.boostUntil, now + 15 * 60_000);
  assert.equal((await useLevelBoost(sql, "a", now + 1)).ok, false);
  assert.equal((await sendLevelGift(sql, "a", "a", "match", "nonce0001")).ok, false, "not to yourself");
  const g1 = await sendLevelGift(sql, "a", "b", "match", "nonce0001");
  assert.equal(g1.ok, true, JSON.stringify(g1));
  assert.equal((await sendLevelGift(sql, "a", "b", "match", "nonce0001")).ok, true, "replay");
  assert.equal((await sendLevelGift(sql, "a", "b", "match", "nonce0002")).ok, false, "token spent");
  const b = (await canonicalWallet(sql, "b")).wallet;
  assert.equal(b.keys.blue, 1, "level 6 sender gifts a blue");
  const look = await levelLook(sql, "b", cat);
  assert.equal(look.giftsIn.length, 1);
  assert.equal(look.giftsIn[0]!.item, "match");
  assert.equal((await levelLook(sql, "b", cat)).giftsIn.length, 0, "note shows once");
  assert.ok(rewardFor(4).boost);
});

test("level reward matches go through the 0.0.97 pocket rule (full pocket → merge credits)", async () => {
  const sql = await db();
  await syncPlayer(sql, "full", snap(), "fullphone1");
  await sql.query(`update player_wallets set white = 30, meta = meta || '{"lvl":1,"lvlInit":true}'::jsonb where user_id = 'full'`);
  await answers(sql, "full", 6, "blue", "x"); // 120 XP: level 2 pays 2 whites
  const v = await levelLook(sql, "full", cat);
  assert.deepEqual(v.paid.map((r) => r.level), [2]);
  const w = (await canonicalWallet(sql, "full")).wallet;
  assert.equal(w.keys.white, 30);
  assert.deepEqual(w.meta.credit, { white: 2 });
});
