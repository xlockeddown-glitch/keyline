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
import { printLook } from "./printsServer.ts";
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

test("0.0.99 prints: earned only with 500 right in the city AND 150 km walked there; other cities don't count; wallet untouched", async () => {
  const sql = await db();
  await syncPlayer(sql, "p1", snap(), "p1phone1");
  const before = (await canonicalWallet(sql, "p1")).wallet;
  await answers(sql, "p1", 500, "white", "loc-a");
  await sql.query(`insert into walk_distance (user_id, city, meters) values ('p1', 'austin', 149999), ('p1', 'chicago', 900000)`);
  let rows = await printLook(sql, "p1");
  const austin = rows.find((r) => r.id === "print-austin-bluebonnet")!;
  assert.equal(austin.correct, 500);
  assert.equal(austin.earned, false, "1 m short");
  assert.equal(rows.find((r) => r.city === "chicago")!.earned, false, "walked but no answers there");
  await sql.query(`update walk_distance set meters = 150000 where user_id = 'p1' and city = 'austin'`);
  rows = await printLook(sql, "p1");
  assert.equal(rows.find((r) => r.id === "print-austin-bluebonnet")!.earned, true);
  assert.deepEqual((await canonicalWallet(sql, "p1")).wallet, before);
});
