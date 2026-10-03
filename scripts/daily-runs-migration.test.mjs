// 0.0.44: 0007 widens the Daily Lantern Run key to day + user + city. Applied on top of the deployed
// 0006 with 0.0.43 rows already in the table, every old row must stay valid and a second city must fit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const sql = (name) => readFileSync(new URL(`../migrations/${name}`, import.meta.url), "utf8");

const insert = (day, user, city) => `
  insert into daily_runs (day, user_id, city, display_name, started_at, last_at, last_lat, last_lng, lit, time_ms, finished_at)
  values ('${day}', '${user}', '${city}', 'Ryan G.', now(), now(), 42.33, -83.05, 5, 90000, now())`;

test("0007: existing 0006 rows survive; one entry per walker per city per day", async () => {
  const db = new PGlite();
  await db.exec(sql("0006_daily_runs.sql"));
  // 0.0.43 rows: one per walker per day.
  await db.exec(insert("2026-10-01", "u1", "detroit"));
  await db.exec(insert("2026-10-02", "u1", "austin"));
  await db.exec(insert("2026-10-02", "u2", "detroit"));
  await assert.rejects(db.exec(insert("2026-10-02", "u1", "detroit")), "0006 refused a second city");

  await db.exec(sql("0007_daily_runs_per_city.sql"));
  const n = await db.query("select count(*)::int as n from daily_runs");
  assert.equal(n.rows[0].n, 3, "every existing row kept");

  const pk = await db.query(`
    select array_agg(a.attname::text order by k.ord) as cols
    from pg_constraint c
    cross join lateral unnest(c.conkey) with ordinality as k(attnum, ord)
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
    where c.conrelid = 'daily_runs'::regclass and c.contype = 'p'`);
  assert.deepEqual(pk.rows[0].cols, ["day", "user_id", "city"]);

  // A second city the same day is now its own entry…
  await db.exec(insert("2026-10-02", "u1", "detroit"));
  // …but the same city twice the same day is still refused, and the start upsert no-ops on it.
  await assert.rejects(db.exec(insert("2026-10-02", "u1", "detroit")));
  await db.exec(`${insert("2026-10-02", "u1", "detroit")} on conflict (day, user_id, city) do nothing`);
  const mine = await db.query("select city from daily_runs where day = '2026-10-02' and user_id = 'u1' order by city");
  assert.deepEqual(mine.rows.map((r) => r.city), ["austin", "detroit"]);
  await db.close();
});
