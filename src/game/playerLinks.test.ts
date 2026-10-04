// 0.0.54b player links: one walker, several sign-ins → one standings row. PGLite with 0001–0011.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { CODE_TTL_MS, canonicalId, cleanCode, groupIds, makeLinkCode, newCode, redeemLinkCode, type LinkDeps } from "./playerLinks.ts";
import type { Sql } from "../lib/db.ts";

const mig = (n: string) => readFileSync(new URL(`../../migrations/${n}`, import.meta.url), "utf8");
const BEFORE = ["0001_auth.sql", "0002_vault_clears.sql", "0003_plate_events.sql", "0006_daily_runs.sql", "0007_daily_runs_per_city.sql"];

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

type U = { id: string; name: string; email: string; at: string };
// Ryan's shape on the live board: one long-standing account and two newer ones with the same name.
const RYAN: U = { id: "ryan-main", name: "Ryan Gray", email: "ryan@gmail.example", at: "2026-09-01T00:00:00Z" };
const RYAN_X: U = { id: "ryan-x", name: "Ryan Gray", email: "123@x.example", at: "2026-10-03T20:00:00Z" };
const RYAN_G2: U = { id: "ryan-g2", name: "Ryan Gray", email: "other@gmail.example", at: "2026-10-03T21:00:00Z" };
const HAL: U = { id: "hal", name: "Halish", email: "hal@example.com", at: "2026-09-10T00:00:00Z" };

async function setup(users: U[], start = Date.UTC(2026, 9, 3, 22)) {
  const db = new PGlite();
  for (const n of BEFORE) await db.exec(mig(n));
  for (const u of users)
    await db.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1, $2, $3, true, $4, $4)`, [u.id, u.name, u.email, u.at]);
  const clear = (id: string, name: string, tier: string, n: number, at: string) =>
    db.query(`insert into vault_clears (user_id, display_name, tier, correct, updated_at) values ($1, $2, $3, $4, $5)`, [id, name, tier, n, at]);
  await clear("ryan-main", "Ryan G.", "white", 220, "2026-10-01T00:00:00Z");
  await clear("ryan-main", "Ryan G.", "blue", 134, "2026-10-01T00:00:00Z");
  await clear("ryan-x", "Ryan G.", "blue", 1, "2026-10-03T20:05:00Z");
  await clear("ryan-g2", "Ryan G.", "blue", 1, "2026-10-03T21:05:00Z");
  await clear("hal", "Halish", "blue", 8, "2026-10-02T00:00:00Z");
  let i = 0;
  const ev = (uid: string, ms: number, ok: boolean) =>
    db.query(
      `insert into plate_events (id, user_id, save_id, plate_id, shown_at, answered_at, latency_ms, correct, rarity) values ($1, $2, 's', 'p', now(), now(), $3, $4, 'blue')`,
      [`e${i++}`, uid, ms, ok],
    );
  await ev("ryan-main", 2000, true);
  await ev("ryan-x", 3000, true);
  await ev("hal", 8000, false);
  const run = (uid: string, name: string, ms: number) =>
    db.query(
      `insert into daily_runs (day, user_id, city, display_name, started_at, last_at, last_lat, last_lng, lit, finished_at, time_ms) values ('2026-10-03', $1, 'austin', $2, now(), now(), 0, 0, 5, now(), $3)`,
      [uid, name, ms],
    );
  await run("ryan-main", "Ryan G.", 500_000);
  await run("ryan-x", "Ryan G.", 400_000);
  await run("hal", "Halish", 450_000);
  await db.exec(mig("0011_player_links.sql"));
  await db.exec(mig("0011_player_links.sql")); // idempotent
  let now = start;
  let seed = 1;
  const d: LinkDeps = { sql: sqlOf(db), now: () => now, random: () => ((seed = (seed * 16807) % 2147483647) / 2147483647) };
  return { db, d, tick: (ms: number) => (now += ms) };
}

const board = async (db: PGlite, tier: string) =>
  (await db.query<{ user_id: string; display_name: string; correct: number }>(`select user_id, display_name, correct from vault_clears_by_player where tier = $1 order by correct desc, user_id`, [tier])).rows;

test("codes: alphabet, clean-up of what was typed", () => {
  const c = newCode(() => 0.5);
  assert.equal(c.length, 8);
  assert.equal(cleanCode(c.toLowerCase().slice(0, 4) + "-" + c.slice(4)), c);
  assert.equal(cleanCode("ABCD-EFG"), null);
  assert.equal(cleanCode("ABCD-EFG0"), null, "0 is not in the alphabet");
});

test("data fix leaves distinct-email users apart: Ryan still has 3 rows until he links them", async () => {
  const { db } = await setup([RYAN, RYAN_X, RYAN_G2, HAL]);
  assert.equal((await db.query(`select * from player_links`)).rows.length, 0);
  const blue = await board(db, "blue");
  assert.deepEqual(blue.map((r) => r.user_id), ["ryan-main", "hal", "ryan-g2", "ryan-x"]);
});

test("data fix links same email (case-insensitive) to the oldest user id", async () => {
  const dupe: U = { ...RYAN_X, email: "Ryan@Gmail.Example" };
  const { db, d } = await setup([RYAN, dupe, HAL]);
  assert.deepEqual((await db.query(`select alias_id, primary_id, how from player_links`)).rows, [{ alias_id: "ryan-x", primary_id: "ryan-main", how: "email" }]);
  assert.equal(await canonicalId(d.sql, "ryan-x"), "ryan-main");
  const blue = await board(db, "blue");
  assert.deepEqual(blue, [
    { user_id: "ryan-main", display_name: "Ryan G.", correct: 135 },
    { user_id: "hal", display_name: "Halish", correct: 8 },
    { user_id: "ryan-g2", display_name: "Ryan G.", correct: 1 }, // different email: left alone
  ]);
});

test("link by code: newer sign-in enters the main account's code → one row, oldest id kept, counts summed", async () => {
  const { db, d } = await setup([RYAN, RYAN_X, RYAN_G2, HAL]);
  const { code } = await makeLinkCode(d, "ryan-main");
  const r = await redeemLinkCode(d, "ryan-x", code.slice(0, 4).toLowerCase() + " " + code.slice(4));
  assert.deepEqual(r, { ok: true, primaryId: "ryan-main", linked: ["ryan-main", "ryan-x"] });
  // The other direction works too: code made on the newer sign-in, entered on the main one — oldest still wins.
  const c2 = await makeLinkCode(d, "ryan-g2");
  const r2 = await redeemLinkCode(d, "ryan-main", c2.code);
  assert.ok(r2.ok && r2.primaryId === "ryan-main");
  assert.deepEqual(await groupIds(d.sql, "ryan-g2"), ["ryan-main", "ryan-g2", "ryan-x"]);

  assert.deepEqual(await board(db, "blue"), [
    { user_id: "ryan-main", display_name: "Ryan G.", correct: 136 },
    { user_id: "hal", display_name: "Halish", correct: 8 },
  ]);
  assert.deepEqual(await board(db, "white"), [{ user_id: "ryan-main", display_name: "Ryan G.", correct: 220 }]);
  // Telemetry (speed/accuracy) folds the same way.
  const ev = (await db.query<{ user_id: string; n: number }>(`select user_id, count(*)::int as n from plate_events_by_player group by 1 order by 1`)).rows;
  assert.deepEqual(ev, [{ user_id: "hal", n: 1 }, { user_id: "ryan-main", n: 2 }]);
  // Daily run board: one row each, Ryan's best time across his sign-ins.
  const daily = (await db.query<{ user_id: string; time_ms: number }>(`select user_id, time_ms from daily_runs_by_player where day = '2026-10-03' and city = 'austin' order by time_ms`)).rows;
  assert.deepEqual(daily, [{ user_id: "ryan-main", time_ms: 400_000 }, { user_id: "hal", time_ms: 450_000 }]);
  // Nothing was rewritten: the raw rows are all still there.
  assert.equal((await db.query(`select * from vault_clears where tier = 'blue'`)).rows.length, 4);
});

test("link by code: refusals (bad, used, expired, already one walker)", async () => {
  const { d, tick } = await setup([RYAN, RYAN_X, RYAN_G2, HAL]);
  assert.deepEqual(await redeemLinkCode(d, "ryan-x", "nope"), { ok: false, reason: "bad-code" });
  assert.deepEqual(await redeemLinkCode(d, "ryan-x", "ABCDEFGH"), { ok: false, reason: "bad-code" });
  const own = await makeLinkCode(d, "ryan-main");
  assert.deepEqual(await redeemLinkCode(d, "ryan-main", own.code), { ok: false, reason: "same" });
  assert.ok((await redeemLinkCode(d, "ryan-x", own.code)).ok);
  assert.deepEqual(await redeemLinkCode(d, "ryan-g2", own.code), { ok: false, reason: "used" });
  assert.deepEqual(await redeemLinkCode(d, "ryan-x", (await makeLinkCode(d, "ryan-main")).code), { ok: false, reason: "same" });
  const late = await makeLinkCode(d, "ryan-main");
  tick(CODE_TTL_MS + 1);
  assert.deepEqual(await redeemLinkCode(d, "ryan-g2", late.code), { ok: false, reason: "expired" });
  // A newer code replaces an unused older one.
  const a = await makeLinkCode(d, "hal");
  const b = await makeLinkCode(d, "hal");
  assert.notEqual(a.code, b.code);
  assert.deepEqual(await redeemLinkCode(d, "ryan-g2", a.code), { ok: false, reason: "bad-code" });
});
