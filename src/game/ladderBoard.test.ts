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

test("0.1.69 ladders server: right answers only, by card category, names First L., cached", async (ctx) => {
  const pg = new PGlite();
  ctx.after(async () => { await pg.close(); });
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

// 0.1.156 ladders extras: weekly, city, friends, first-to-title.
async function extrasDb() {
  const pg = new PGlite();
  await pg.exec(readFileSync(new URL("../../migrations/0003_plate_events.sql", import.meta.url), "utf8"));
  await pg.exec(`create table player_links (alias_id text primary key, primary_id text not null)`);
  await pg.exec(`create view plate_events_by_player as
    select e.id, coalesce(l.primary_id, e.user_id) as user_id, e.plate_id, e.answered_at, e.correct, e.city
    from plate_events e left join player_links l on l.alias_id = e.user_id`);
  await pg.exec(`create table "user" (id text primary key, name text)`);
  await pg.exec(`insert into "user" values ('a', 'Amanda Gray'), ('b', 'Bob Builder'), ('c', 'Cat Dee'), ('d', 'Dan Eve')`);
  const sql = sqlOf(pg);
  let n = 0;
  /** `k` answers by `uid` on `plate`, one second apart from `at` (ms). */
  const ans = async (uid: string, plate: string, k: number, at: number, opts: { city?: string | null; correct?: boolean } = {}) => {
    const p = `x${n++}-`;
    await sql.query(
      `insert into plate_events (id, user_id, save_id, plate_id, shown_at, answered_at, latency_ms, correct, rarity, city, difficulty)
       select $1 || lpad(i::text, 5, '0'), $2, 's', $3, t, t, 1000, $4, 'white', $5, 2
       from generate_series(0, $6 - 1) i, lateral (select $7::timestamptz + i * interval '1 second' as t) x`,
      [p, uid, plate, opts.correct ?? true, opts.city === undefined ? "austin" : opts.city, k, new Date(at).toISOString()],
    );
  };
  return { pg, sql, ans };
}
const catOf = (id: string): TriviaCat | null => (id === "sp" ? "sports" : id === "mu" ? "music" : null);

test("0.1.156 ladders weekly: Mon 00:00 CT boundary, all-time rungs, last week's top", async (ctx) => {
  const { pg, sql, ans } = await extrasDb();
  ctx.after(async () => { await pg.close(); });
  const mon = Date.UTC(2026, 10, 9, 6); // Mon Nov 9 00:00 CST
  await ans("a", "sp", 300, Date.UTC(2026, 0, 5)); // old: a holds Bench Warmer all time
  await ans("b", "sp", 1, mon - 60_000); // Sun 23:59 CT: last week
  await ans("c", "sp", 2, mon - 3 * 86_400_000); // last week's top
  // Query Sunday before Monday's answers exist, so the week window is not polluted by later inserts.
  resetLadderCache();
  const sun = await ladderBoard(sql, "sports", null, { span: "week", now: mon - 1, catOf });
  assert.deepEqual(sun.top.map((r) => [r.userId, r.value]), [["c", 2], ["b", 1]]);
  assert.equal(sun.week?.key, "W2026-11-02");
  await ans("a", "sp", 1, mon); // Mon 00:00 CT: this week
  await ans("a", "sp", 1, mon + 3600_000, { correct: false });
  resetLadderCache();
  const now = mon + 12 * 3600_000;
  const w = await ladderBoard(sql, "sports", "a", { span: "week", now, catOf });
  assert.deepEqual(w.top.map((r) => [r.name, r.value, r.pct, r.rung]), [["Amanda G.", 1, 50, "Bench Warmer"]]);
  assert.equal(w.mine.rung, "Bench Warmer", "titles stay all-time on the weekly board");
  assert.deepEqual(w.week, { key: "W2026-11-09", end: Date.UTC(2026, 10, 16, 6) });
  assert.deepEqual(w.lastWeek, { name: "Cat D.", value: 2 });
  const all = await ladderBoard(sql, "sports", "a", { now, catOf });
  assert.deepEqual(all.top.map((r) => r.value), [301, 2, 1]);
  assert.equal(all.lastWeek, null);
  // The cache flips at the reset even inside the minute.
  const after = await ladderBoard(sql, "sports", null, { span: "week", now: mon + 1, catOf });
  assert.deepEqual(after.top.map((r) => r.userId), ["a"]);
});

test("0.1.156 ladders weekly: DST week (fall back Nov 1) starts Mon 00:00 CDT", async (ctx) => {
  const { pg, sql, ans } = await extrasDb();
  ctx.after(async () => { await pg.close(); });
  const start = Date.UTC(2026, 9, 26, 5); // Mon Oct 26 00:00 CDT
  await ans("a", "sp", 1, start - 1000); // Sun 23:59:59 CDT, the week before
  await ans("b", "sp", 1, start);
  await ans("c", "sp", 1, Date.UTC(2026, 10, 2, 5, 30)); // Sun Nov 1 23:30 CST, still this week
  resetLadderCache();
  const w = await ladderBoard(sql, "sports", null, { span: "week", now: Date.UTC(2026, 10, 2, 5, 59), catOf });
  assert.deepEqual(w.top.map((r) => r.userId), ["b", "c"]);
  assert.deepEqual(w.week, { key: "W2026-10-26", end: Date.UTC(2026, 10, 2, 6) });
  assert.deepEqual(w.lastWeek, { name: "Amanda G.", value: 1 });
});

test("0.1.156 ladders city: only answers given in that city; no-city answers left out; bad city rejected", async (ctx) => {
  const { pg, sql, ans } = await extrasDb();
  ctx.after(async () => { await pg.close(); });
  const t = Date.UTC(2026, 10, 3);
  await ans("a", "sp", 3, t, { city: "austin" });
  await ans("a", "sp", 9, t, { city: "nyc" });
  await ans("b", "sp", 5, t, { city: null });
  await ans("c", "sp", 2, t, { city: "austin" });
  resetLadderCache();
  const now = t + 3600_000;
  const b = await ladderBoard(sql, "sports", "a", { scope: "city", city: "austin", now, catOf });
  assert.deepEqual(b.top.map((r) => [r.userId, r.value]), [["a", 3], ["c", 2]]);
  assert.deepEqual((await ladderBoard(sql, "sports", null, { scope: "city", city: "nyc", now, catOf })).top.map((r) => r.value), [9]);
  assert.deepEqual((await ladderBoard(sql, "sports", null, { now, catOf })).top.map((r) => r.value), [12, 5, 2]);
  await assert.rejects(ladderBoard(sql, "sports", null, { scope: "city", city: "atlantis" as never, now, catOf }));
  await assert.rejects(ladderBoard(sql, "sports", null, { scope: "city", now, catOf }));
});

test("0.1.156 ladders friends: me plus my friends only; guest gets an empty board; aliases fold", async (ctx) => {
  const { pg, sql, ans } = await extrasDb();
  ctx.after(async () => { await pg.close(); });
  const t = Date.UTC(2026, 10, 3);
  await pg.exec(`insert into player_links values ('b2', 'b')`);
  await ans("a", "sp", 3, t);
  await ans("b", "sp", 2, t);
  await ans("b2", "sp", 4, t);
  await ans("c", "sp", 9, t);
  resetLadderCache();
  const now = t + 3600_000;
  const f = await ladderBoard(sql, "sports", "a", { scope: "friends", friendIds: ["b"], now, catOf });
  assert.deepEqual(f.top.map((r) => [r.userId, r.value]), [["b", 6], ["a", 3]]);
  assert.deepEqual(f.mine.rival, { name: "Bob B.", gap: 3 });
  assert.deepEqual((await ladderBoard(sql, "sports", "a", { scope: "friends", now, catOf })).top.map((r) => r.userId), ["a"], "no friends yet: just me");
  assert.deepEqual((await ladderBoard(sql, "sports", null, { scope: "friends", friendIds: ["b"], now, catOf })).top, [], "guest");
});

test("0.1.156 ladders firsts: earliest crosser wins; stable on rerun; follows recategorize", async (ctx) => {
  const { pg, sql, ans } = await extrasDb();
  ctx.after(async () => { await pg.close(); });
  await ans("a", "sp", 300, Date.UTC(2026, 0, 1)); // a's 250th lands first
  await ans("b", "sp", 400, Date.UTC(2026, 1, 1)); // b has more, later
  await ans("c", "sp", 249, Date.UTC(2025, 0, 1)); // never crosses
  resetLadderCache();
  const now = Date.UTC(2026, 10, 3);
  const [x, y] = await Promise.all([ladderBoard(sql, "sports", "b", { now, catOf }), ladderBoard(sql, "sports", "b", { now, catOf })]);
  const expected = [{ rung: "Bench Warmer", userId: "a", name: "Amanda G.", at: Date.UTC(2026, 0, 1) + 249_000 }];
  for (const b of [x!, y!]) {
    assert.deepEqual(b.top.map((r) => [r.userId, r.first ?? false]), [["b", false], ["a", true], ["c", false]]);
    assert.deepEqual(b.firsts, expected);
  }
  // The chip is global: it shows on the friends board too.
  const fr = await ladderBoard(sql, "sports", "a", { scope: "friends", friendIds: [], now, catOf });
  assert.equal(fr.mine.first, true);
  assert.equal(fr.top[0]?.first, true);
  // Earlier answers from b, once they exist, move the derived first (no frozen table).
  await ans("b", "sp", 300, Date.UTC(2025, 5, 1));
  resetLadderCache();
  const after = await ladderBoard(sql, "sports", "b", { now, catOf });
  assert.equal(after.firsts?.[0]?.userId, "b");
  assert.equal(after.top.find((r) => r.userId === "b")?.first, true);
  assert.equal(after.top.find((r) => r.userId === "a")?.first, undefined);
  // Recategorize the card: firsts follow today's category (sports empty, music goes to b who crossed first).
  resetLadderCache();
  const music = (id: string): TriviaCat | null => (id === "sp" ? "music" : null);
  const m = await ladderBoard(sql, "music", null, { now, catOf: music });
  assert.deepEqual(m.firsts?.map((f) => [f.rung, f.userId]), [["Air Guitarist", "b"]]);
  const s = await ladderBoard(sql, "sports", null, { now, catOf: music });
  assert.deepEqual(s.firsts, []);
});
