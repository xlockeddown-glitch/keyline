// 0.1.63 Airports: far routes can fly; the server closes the ticket like the Loop and files souvenir:<city>.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2999-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { LocalSnap } from "./wallet.ts";
import { applyClientOp, syncPlayer } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { FLIGHT_MIN_MILES, SOUVENIRS, addSouvenir, canFly, cleanSouvenirs, flightRoutes, milesBetween, souvenirKey } from "./flight.ts";
import { CITIES } from "./data.ts";
thanksClock.cutoff = "2999-01-01T00:00:00Z";

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
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };

test("far routes fly: over 1,000 miles, symmetric, 67 city pairs", () => {
  assert.equal(FLIGHT_MIN_MILES, 1000);
  const r = flightRoutes();
  assert.equal(r.length, 134);
  for (const x of r) {
    assert.ok(x.miles > 1000);
    assert.ok(canFly(x.to, x.from));
  }
  assert.equal(canFly("nyc", "boston"), false);
  assert.equal(canFly("austin", "temple"), false);
  assert.equal(canFly("chicago", "austin"), false, "980 mi stays on the Loop");
  assert.equal(canFly("austin", "nyc"), true);
  assert.equal(canFly("london", "chicago"), true);
  assert.ok(Math.abs(milesBetween("nyc", "la") - 2450) < 60);
});

test("souvenirs: one per city, deduped and cleaned", () => {
  assert.deepEqual(Object.keys(SOUVENIRS).sort(), Object.keys(CITIES).sort());
  assert.equal(souvenirKey("nola"), "souvenir:nola");
  const a = addSouvenir([], "souvenir:nola");
  assert.deepEqual(addSouvenir(a, "souvenir:nola"), a);
  assert.deepEqual(cleanSouvenirs(["souvenir:nola", "souvenir:nola", "souvenir:mars", 3, "poster:la-sf"]), ["souvenir:nola"]);
});

test("server fly op: needs an open far ticket, closes it free, files the souvenir once", async () => {
  const sql = await db();
  await syncPlayer(sql, "fly", snap, "flyphone1");
  const wid = (await canonicalWallet(sql, "fly")).id;
  assert.equal((await applyClientOp(sql, "fly", { kind: "fly" })).reason, "no-ticket");
  const now = Date.now();
  await sql`insert into wallet_ledger (user_id, op_key, detail, created_at) values (${wid}, ${"ticket:1"}, ${JSON.stringify({ at: now - 1000, from: "austin", to: "temple", ms: 600000 })}, now() - interval '2 seconds')`;
  assert.equal((await applyClientOp(sql, "fly", { kind: "fly" })).reason, "too-near");
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${wid}, ${"ticket:2"}, ${JSON.stringify({ at: now, from: "austin", to: "nyc", ms: 600000 })})`;
  const coins = (await canonicalWallet(sql, "fly")).wallet.coins;
  assert.equal((await applyClientOp(sql, "fly", { kind: "fly" })).ok, true);
  assert.equal((await canonicalWallet(sql, "fly")).wallet.coins, coins, "flying is free once the ticket is spent");
  assert.equal((await applyClientOp(sql, "fly", { kind: "fly" })).reason, "arrived");
  const rows = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${wid} and op_key like 'souvenir:%'`;
  assert.deepEqual(rows.map((r) => r.op_key), ["souvenir:nyc"]);
});

test("wiring: the wire accepts loop and fly, the sheet offers Fly on far routes, the cutscene skips and respects reduced motion", () => {
  const api = readFileSync(new URL("./walletApi.ts", import.meta.url), "utf8");
  assert.match(api, /z\.literal\("loop"\), ride: z\.boolean\(\)/);
  assert.match(api, /z\.literal\("fly"\)/);
  const sheet = readFileSync(new URL("../components/keyline/Timetable.tsx", import.meta.url), "utf8");
  assert.match(sheet, /canFly\(cityId, c\.id\) \?/);
  assert.match(sheet, /punch\(c\.id, "fly"\)/);
  const cut = readFileSync(new URL("../components/keyline/FlightScreen.tsx", import.meta.url), "utf8");
  assert.match(cut, /prefers-reduced-motion: reduce/);
  assert.match(cut, /data-testid="flight-skip"/);
  assert.match(cut, /cat: "geography"/);
  assert.doesNotMatch(cut, /requestAnimationFrame/);
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  assert.match(store, /if \(how === "fly" && !canFly\(from, to\)\) return/);
  const pkg = readFileSync(new URL("../../package.json", import.meta.url), "utf8");
  assert.match(pkg, /src\/game\/flight\.test\.ts/);
});
