import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { resetStreakCache, streakBoard } from "./streakBoard.ts";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

test("0.0.99 Longest streak: best run of right answers per player from the answer records, in answer order", async () => {
  const pg = new PGlite();
  await pg.exec(readFileSync(new URL("../../migrations/0003_plate_events.sql", import.meta.url), "utf8"));
  await pg.exec(`create view plate_events_by_player as select * from plate_events`);
  await pg.exec(`create table "user" (id text primary key, name text)`);
  await pg.exec(`insert into "user" values ('a', 'Ann'), ('b', 'Bo')`);
  const sql = sqlOf(pg);
  let n = 0;
  const ans = async (uid: string, pattern: string) => {
    for (const ch of pattern) {
      await sql.query(
        `insert into plate_events (id, user_id, save_id, plate_id, shown_at, answered_at, latency_ms, correct, rarity, city, difficulty)
         values ($1, $2, 's', 'p', now(), now() + ($3 || ' milliseconds')::interval, 1000, $4, 'white', 'austin', 2)`,
        [`e${n}`, uid, String(n), ch === "1"],
      );
      n++;
    }
  };
  await ans("a", "1110111110011"); // best 5
  await ans("b", "11111110"); // best 7
  resetStreakCache();
  const b = await streakBoard(sql, "a");
  assert.deepEqual(b.top.map((r) => [r.userId, r.value]), [["b", 7], ["a", 5]]);
  assert.deepEqual(b.mine, { value: 5, rank: 2 });
  assert.equal(b.top[0]!.name.length > 0, true);
});
