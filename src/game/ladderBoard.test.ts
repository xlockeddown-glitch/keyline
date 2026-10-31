import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { LADDER_CATS, countByCat, pctOf, ladderBoard, rankLadder, resetLadderCache, rungFor } from "./ladderBoard.ts";
import type { TriviaCat } from "./types.ts";

test("0.1.69 ladders: 14 categories; rung names at 250 / 1000 / 2000", () => {
  assert.equal(LADDER_CATS.length, 14);
  assert.equal(rungFor("sports", 249), null);
  assert.equal(rungFor("sports", 250), "Bench Warmer");
  assert.equal(rungFor("sports", 1999), "MVP");
  assert.equal(rungFor("sports", 2000), "Hall of Famer");
  assert.equal(rungFor("sports", 99999), "Hall of Famer");
});

test("0.1.69 ladders: counts per category, unknown cards skipped; top 5, my rank, rival gap", () => {
  const cat = (id: string): TriviaCat | null => (id.startsWith("s") ? "sports" : id.startsWith("m") ? "music" : null);
  const by = countByCat(
    [
      { userId: "a", plateId: "s1", n: 300 }, { userId: "a", plateId: "s2", n: 10 }, { userId: "b", plateId: "s1", n: 400 },
      { userId: "c", plateId: "m1", n: 5 }, { userId: "d", plateId: "x", n: 999 },
      ...["e", "f", "g", "h", "i"].map((u, k) => ({ userId: u, plateId: "s3", n: 100 - k })),
    ],
    cat,
  );
  const s = by.get("sports")!;
  assert.deepEqual(s.slice(0, 2), [{ userId: "b", n: 400, tries: 400 }, { userId: "a", n: 310, tries: 310 }]);
  assert.deepEqual(by.get("music"), [{ userId: "c", n: 5, tries: 5 }]);
  assert.ok(![...by.values()].flat().some((r) => r.userId === "d"));
  const names = new Map([["b", "Bob Builder"], ["a", "Amanda Gray"], ["g", "Gus Grill"]]);
  const r = rankLadder("sports", s, names, "a");
  assert.equal(r.top.length, 5);
  assert.deepEqual(r.top[0], { userId: "b", name: "Bob B.", rank: 1, value: 400, pct: 100, rung: "Bench Warmer" });
  assert.deepEqual(r.mine, { value: 310, pct: 100, rank: 2, rung: "Bench Warmer", rival: { name: "Bob B.", gap: 90 } });
  assert.equal(rankLadder("sports", s, names, "b").mine.rival, null, "first place has no rival");
  const h = rankLadder("sports", s, names, "h");
  assert.equal(h.mine.rank, 6);
  assert.deepEqual(h.mine.rival, { name: "Gus G.", gap: 1 });
  assert.equal(rankLadder("sports", s, names, "zz").mine.rank, null);
  assert.ok(!JSON.stringify(r).includes("Builder"), "never the full name");
});

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

test("0.1.69 ladders server: right answers only, by card category, names First L., cached", async () => {
  const pg = new PGlite();
  await pg.exec(readFileSync(new URL("../../migrations/0003_plate_events.sql", import.meta.url), "utf8"));
  await pg.exec(`create view plate_events_by_player as select * from plate_events`);
  await pg.exec(`create table "user" (id text primary key, name text)`);
  await pg.exec(`insert into "user" values ('a', 'Amanda Gray'), ('b', 'Bo Diddley')`);
  const sql = sqlOf(pg);
  const sport = "card-sport";
  const music = "card-music";
  const catOf = (id: string): TriviaCat | null => (id === sport ? "sports" : id === music ? "music" : null);
  let n = 0;
  const ans = async (uid: string, plate: string, k: number, correct = true) => {
    for (let i = 0; i < k; i++, n++)
      await sql.query(
        `insert into plate_events (id, user_id, save_id, plate_id, shown_at, answered_at, latency_ms, correct, rarity, city, difficulty)
         values ($1, $2, 's', $3, now(), now(), 1000, $4, 'white', 'austin', 2)`,
        [`e${n}`, uid, plate, correct],
      );
  };
  await ans("a", sport, 3);
  await ans("a", sport, 5, false);
  await ans("b", sport, 5);
  await ans("a", music, 7);
  resetLadderCache();
  const b = await ladderBoard(sql, "sports", "a", catOf);
  assert.deepEqual(b.top.map((r) => [r.name, r.value]), [["Bo D.", 5], ["Amanda G.", 3]]);
  assert.deepEqual(b.top.map((r) => r.pct), [100, 38], "a: 3 of 8");
  assert.deepEqual(b.mine, { value: 3, pct: 38, rank: 2, rung: null, rival: { name: "Bo D.", gap: 2 } });
  assert.deepEqual((await ladderBoard(sql, "music", "a", catOf)).top.map((r) => r.value), [7]);
  await ans("a", sport, 10);
  assert.equal((await ladderBoard(sql, "sports", "a", catOf)).mine.value, 3, "cached for a minute");
  resetLadderCache();
  assert.equal((await ladderBoard(sql, "sports", "a", catOf)).mine.value, 13);
});

test("0.1.90 ladders: percent right summed per category; 0 tries is null; order still by right answers", () => {
  assert.equal(pctOf(0, 0), null);
  assert.equal(pctOf(1, 3), 33);
  assert.equal(pctOf(2, 3), 67);
  assert.equal(pctOf(5, 5), 100);
  const cat = (id: string): TriviaCat | null => (id.startsWith("s") ? "sports" : null);
  const s = countByCat(
    [
      { userId: "a", plateId: "s1", n: 10, tries: 40 }, { userId: "a", plateId: "s2", n: 10, tries: 10 },
      { userId: "b", plateId: "s1", n: 15, tries: 15 }, { userId: "c", plateId: "s1", n: 0, tries: 9 },
    ],
    cat,
  ).get("sports")!;
  assert.deepEqual(s.map((r) => r.userId), ["a", "b"], "more right ranks higher despite lower percent; zero right left off");
  const r = rankLadder("sports", s, new Map(), "b");
  assert.deepEqual(r.top.map((x) => x.pct), [40, 100]);
  assert.equal(r.mine.pct, 100);
  assert.equal(rankLadder("sports", s, new Map(), "zz").mine.pct, null);
});
