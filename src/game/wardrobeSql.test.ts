// 0.0.45: migration 0008 (wardrobes) applied on top of the deployed schema, and the sync upsert.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { WARDROBE_UPSERT } from "./wardrobeSql.ts";

const sql = (name: string) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8");

test("0008: wardrobes table; the upsert keeps one row per walker and never drops an owned item", async () => {
  const db = new PGlite();
  // The deployed daily-run migrations come first and are untouched by 0008.
  await db.exec(sql("0006_daily_runs.sql"));
  await db.exec(sql("0007_daily_runs_per_city.sql"));
  await db.exec(sql("0008_wardrobes.sql"));
  await db.exec(sql("0008_wardrobes.sql")); // idempotent

  const up = (user: string, owned: string[], paid: object, coat: string | null, lantern: string | null, at: number) =>
    db.query(WARDROBE_UPSERT, [user, JSON.stringify(owned), JSON.stringify(paid), coat, lantern, at]);

  await up("u1", ["copper"], { plum: { white: 2, blue: 0 } }, null, "copper", 100);
  // A second device that never saw the copper lamp syncs a coat: copper must survive.
  await up("u1", ["oilskin"], {}, "oilskin", null, 200);
  await up("u2", ["nickel"], {}, null, "nickel", 50);

  const rows = await db.query<{ user_id: string; owned: string[]; paid: object; coat: string | null; lantern: string | null; equip_at: number }>(
    "select user_id, owned, paid, coat, lantern, equip_at from wardrobes order by user_id",
  );
  assert.equal(rows.rows.length, 2);
  const u1 = rows.rows[0]!;
  assert.deepEqual(u1.owned, ["copper", "oilskin"]);
  assert.deepEqual(u1.paid, {});
  assert.equal(u1.coat, "oilskin");
  assert.equal(u1.lantern, null);
  assert.equal(Number(u1.equip_at), 200);
  assert.deepEqual(rows.rows[1]!.owned, ["nickel"], "other walkers' rows untouched");
  const daily = await db.query("select count(*)::int as n from daily_runs");
  assert.equal((daily.rows[0] as { n: number }).n, 0);
  await db.close();
});

test("0006 and 0007 are unchanged by 0.0.45 (deployed migrations are never edited)", () => {
  assert.match(sql("0006_daily_runs.sql"), /primary key \(day, user_id\)/);
  assert.match(sql("0007_daily_runs_per_city.sql"), /primary key \(day, user_id, city\)/);
  assert.doesNotMatch(sql("0006_daily_runs.sql") + sql("0007_daily_runs_per_city.sql"), /wardrobe/);
});
