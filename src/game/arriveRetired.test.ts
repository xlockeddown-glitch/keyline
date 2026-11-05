// 0.1.125 (Ryan): the instant Arrive is gone. The server refuses the old `loop` op without a ride ("retired") and
// the ticket stays open, so the same trip still lands by the Loop (poster filed) or, on far routes, Fly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { LocalSnap } from "./wallet.ts";
import { applyClientOp, syncPlayer } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { CITY_LIST } from "./data.ts";
import { canFly } from "./flight.ts";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

test("server: Arrive (loop without ride) is refused 'retired', spends nothing, and the open ticket still lands by the Loop", async () => {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0001_auth.sql", "0002_vault_clears.sql", "0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(readFileSync(new URL(`../../migrations/${m}`, import.meta.url), "utf8"));
  const sql = sqlOf(pg);
  const snap: LocalSnap = { coins: 0, keys: {}, fares: 2, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin", "chicago"], freePick: false } };
  await syncPlayer(sql, "t", snap, "t-phone1");
  const id = (await canonicalWallet(sql, "t")).id;
  assert.equal((await applyClientOp(sql, "t", { kind: "board", from: "austin", to: "chicago" })).ok, true);
  const old = await applyClientOp(sql, "t", { kind: "loop", ride: false });
  assert.equal(old.ok, false);
  assert.equal(old.reason, "retired");
  const rows = async (like: string) => (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${id} and op_key like ${like}`).length;
  assert.equal(await rows("hurry:%"), 0, "the refused Arrive didn't close the ticket");
  assert.equal(await rows("ticket:%"), 1, "one ticket spent for the trip");
  // The same trip lands by the Loop: ticket closed, route poster filed.
  assert.equal((await applyClientOp(sql, "t", { kind: "loop", ride: true })).ok, true);
  assert.equal(await rows("hurry:%"), 1);
  assert.equal(await rows("poster:%"), 1);
});

test("client: no Arrive button or skip path; every open city pair has the Loop (Fly only adds far ones)", () => {
  const sheet = readFileSync(new URL("../components/keyline/Timetable.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(sheet, /"skip"|>\s*Arrive\s*</);
  assert.match(sheet, /punch\(c\.id, "loop"\)/);
  // The Loop button is unconditional per open city (no route check); Fly is gated by canFly.
  assert.doesNotMatch(sheet, /\? \(\s*<button[^>]*data-testid=\{`loop-/);
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  assert.doesNotMatch(store, /"skip"/);
  assert.match(store, /boardFare: \(to, how = "loop"\)/);
  assert.match(store, /commitWallet\(\{ kind: "loop", ride: true \}\)/);
  // Far pairs that fly also have the Loop; sanity on the route data.
  let pairs = 0;
  for (const a of CITY_LIST) for (const b of CITY_LIST) if (a.id !== b.id) { pairs++; if (canFly(a.id, b.id)) assert.ok(canFly(b.id, a.id)); }
  assert.ok(pairs > 100);
});
