// Distance on the leaderboard: walk-pace cap, and the folded board (PGLite, migrations through 0014).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { dailyTopSpeed } from "./dailyRun.ts";
import type { Sql } from "../lib/db.ts";
import { formatDistance, rankDistance, rankKind } from "./standings.ts";
import { creditOpen, creditWalk, loadDistanceBoard, loadMyDistance, recordWalk, WALK_SLACK, WALK_WINDOW_MS } from "./walkBoard.ts";

const mig = (n: string) => readFileSync(new URL(`../../migrations/${n}`, import.meta.url), "utf8");
const BEFORE = [
  "0001_auth.sql",
  "0002_vault_clears.sql",
  "0003_plate_events.sql",
  "0006_daily_runs.sql",
  "0007_daily_runs_per_city.sql",
  "0011_player_links.sql",
  "0014_walk_distance.sql",
];

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

const TOP = 100;

test("credit: walk-pace cap, idle window, opening post", () => {
  assert.equal(creditWalk(0, 8_000, TOP), 0);
  assert.equal(creditWalk(-20, 8_000, TOP), 0);
  assert.equal(creditWalk(Number.NaN, 8_000, TOP), 0);
  assert.equal(creditWalk(500, 0, TOP), 0);
  assert.equal(creditWalk(500, -1, TOP), 0);
  assert.equal(creditWalk(40, 8_000, TOP), 40, "an honest scrap is kept whole");
  const eight = Math.floor(8 * TOP * WALK_SLACK);
  assert.equal(creditWalk(1_000_000, 8_000, TOP), eight);
  const idle = Math.floor((WALK_WINDOW_MS / 1000) * TOP * WALK_SLACK);
  assert.equal(creditWalk(1_000_000, 10 * 60_000, TOP), idle, "a late post cannot dump the whole idle");
  assert.equal(creditOpen(1_000_000, TOP), Math.floor(8 * TOP * WALK_SLACK));
  assert.equal(creditOpen(12, TOP), 12);
  const coat = dailyTopSpeed();
  assert.equal(coat, 92 * 1.15, "every coat is capped at the one walk pace (0.0.90: +15%)");
  assert.equal(creditWalk(1e12, 60_000, coat), Math.floor(45 * coat * WALK_SLACK));
});

test("rankDistance: most metres, earliest tie, First L.", () => {
  assert.deepEqual(rankKind("distance", []), []);
  const ranked = rankDistance([
    { userId: "b", name: "Bea Late", meters: 1000, updatedAt: 200 },
    { userId: "a", name: "Ada Early", meters: 1000, updatedAt: 100 },
    { userId: "c", name: "Cy Long", meters: 2500, updatedAt: 300 },
    { userId: "z", name: "", meters: 0, updatedAt: 0 },
    { userId: "d", name: "Dee Zero", meters: 0, updatedAt: 1 },
  ]);
  assert.deepEqual(
    ranked.map((r) => r.userId),
    ["c", "a", "b"],
  );
  assert.equal(ranked[0]!.rank, 1);
  assert.equal(ranked[0]!.name, "Cy L.");
  assert.equal(ranked[0]!.meters, 2500);
  assert.equal(ranked[1]!.name, "Ada E.");
  assert.equal(ranked[2]!.name, "Bea L.");
  assert.equal(formatDistance(840), "840 m");
  assert.equal(formatDistance(1500), "1.5 km");
  assert.equal(formatDistance(120_000), "120 km");
  assert.equal(formatDistance(0), "\u2014");
});

test("posted walks: opening cap, a fast second post is ignored, linked sign-ins are one row", async () => {
  const db = new PGlite();
  for (const n of BEFORE) await db.exec(mig(n));
  await db.exec(mig("0014_walk_distance.sql"));
  const sql = sqlOf(db);
  const t0 = Date.UTC(2026, 9, 10, 18, 0, 0);
  await db.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1, $2, $3, true, $4, $4)`, [
    "primary",
    "Ryan Gray",
    "ryan@example.com",
    "2026-09-01T00:00:00Z",
  ]);
  await db.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1, $2, $3, true, $4, $4)`, [
    "alias",
    "Ryan Gray",
    "ryan-x@example.com",
    "2026-10-03T00:00:00Z",
  ]);
  await db.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1, $2, $3, true, $4, $4)`, [
    "hal",
    "Halish",
    "hal@example.com",
    "2026-09-10T00:00:00Z",
  ]);

  const open = await recordWalk(sql, "primary", "austin", 5_000, TOP, t0);
  assert.equal(open.opened, true);
  assert.equal(open.retry, false);
  assert.equal(open.accepted, creditOpen(5_000, TOP));

  const tooSoon = await recordWalk(sql, "primary", "austin", 5_000, TOP, t0 + 400);
  assert.equal(tooSoon.retry, true);
  assert.equal(tooSoon.accepted, 0);
  const mineSoon = await loadMyDistance(sql, "primary", null);
  assert.equal(mineSoon.meters, open.accepted, "a post inside the gap adds nothing");

  const later = await recordWalk(sql, "primary", "temple", 5_000, TOP, t0 + 10_000);
  assert.equal(later.retry, false);
  assert.equal(later.opened, false);
  assert.equal(later.accepted, creditWalk(5_000, 10_000, TOP));

  const alias = await recordWalk(sql, "alias", "austin", 400, TOP, t0);
  assert.equal(alias.accepted, 400);
  await recordWalk(sql, "hal", "austin", 200, TOP, t0);

  await db.query(`insert into player_links (alias_id, primary_id, how) values ('alias', 'primary', 'code')`);

  const all = await loadDistanceBoard(sql, null);
  assert.deepEqual(
    all.map((r) => [r.userId, r.meters, r.name]),
    [
      ["primary", open.accepted + later.accepted + 400, "Ryan G."],
      ["hal", 200, "Halish"],
    ],
  );
  const austin = await loadDistanceBoard(sql, "austin");
  assert.equal(austin[0]!.userId, "primary");
  assert.equal(austin[0]!.meters, open.accepted + 400, "temple stays off the austin board");
  assert.equal(austin[1]!.userId, "hal");

  const mine = await loadMyDistance(sql, "primary", null);
  assert.equal(mine.meters, open.accepted + later.accepted + 400);
  assert.equal(mine.rank, 1);
  const temple = await loadMyDistance(sql, "primary", "temple");
  assert.equal(temple.meters, later.accepted);
  assert.equal(temple.rank, 1);
  const nobody = await loadMyDistance(sql, "missing", null);
  assert.deepEqual(nobody, { meters: 0, rank: null });
});
