// 0.1.99 placed lantern slice 1: the server writes `plantok` on a perfect Stack; back-fill reads past prize rows.
import { welcomeClock, lampGiftClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { thanksClock } from "./thanksGift.ts";
thanksClock.cutoff = "2000-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { SERIES, STACK_ID, RUN_ID } from "./data.ts";
import type { GradePay, LocalSnap } from "./wallet.ts";
import { awardGrade, plantUnlocked, syncPlayer } from "./walletApply.ts";
import { PLANT_OK_KEY, findPerfectStack, perfectStackClear } from "./placedLantern.ts";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}
const mig = (n: string) => readFileSync(new URL(`../../migrations/${n}`, import.meta.url), "utf8");
async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap = (): LocalSnap => ({ coins: 0, keys: { green: 5 }, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } });
const card = (over: Partial<GradePay> & { prevNonce?: string }): Omit<GradePay, "prior"> & { prevNonce: string } => ({
  correct: true, elapsedMs: 2000, mult: 1, city: "austin", diff: 2, clearTier: null, poiTier: "green", poiId: STACK_ID,
  lat: 30.28, lng: -97.74, series: "stack", step: 0, steps: SERIES.stack.steps, streak: 0, loot: 1, lucky: false,
  cloth: null, charmDay: "", charmTopics: [], topic: null, dealtAt: Date.UTC(2026, 9, 16, 18), luckyHit: false,
  perfectBlue: false, prizeRoll: 0.5, prevNonce: "", ...over,
});
async function ladder(sql: Sql, who: string, ms: number[], series: "stack" | "run" = "stack") {
  let pv = "";
  const steps = SERIES[series].steps;
  for (let i = 0; i < steps; i++) {
    const n = `${who}-${series}-${i}`;
    await awardGrade(sql, who, n, card({ series, poiId: series === "stack" ? STACK_ID : RUN_ID, steps, step: i, elapsedMs: ms[i] ?? 2000, prevNonce: pv, clearTier: i === 0 ? SERIES[series].cost : null }));
    pv = n;
  }
}
const okRow = async (sql: Sql, who: string) => (await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${who} and op_key = ${PLANT_OK_KEY}`)[0]?.detail ?? null;

test("perfectStackClear: only a finished Stack with every card perfect", () => {
  assert.equal(perfectStackClear("stack", 3, 4, ["perfect", "perfect", "perfect", "perfect"]), true);
  assert.equal(perfectStackClear("stack", 3, 4, ["perfect", "great", "perfect", "perfect"]), false);
  assert.equal(perfectStackClear("stack", 2, 4, ["perfect", "perfect", "perfect"]), false, "not the last card");
  assert.equal(perfectStackClear("stack", 3, 4, ["perfect", "perfect", "perfect"]), false, "chain shorter than the ladder");
  assert.equal(perfectStackClear("run", 2, 3, ["perfect", "perfect", "perfect"]), false, "The Run doesn't count");
  assert.equal(perfectStackClear("climb", 2, 3, ["perfect", "perfect", "perfect"]), false);
});

test("server: a perfect Stack writes plantok once; a non-perfect Stack or a perfect Run doesn't", async () => {
  const sql = await db();
  for (const who of ["ace", "slow", "runner"]) await syncPlayer(sql, who, snap(), `${who}phone1`);
  await ladder(sql, "ace", [1000, 1500, 2500, 2900]);
  const row = await okRow(sql, "ace");
  assert.ok(row, "perfect Stack unlocks");
  assert.match(row!, /grade:ace-stack-3/);
  await ladder(sql, "ace", [1000, 1000, 1000, 1000]);
  assert.equal(await okRow(sql, "ace"), row, "a second perfect Stack doesn't rewrite it");
  await ladder(sql, "slow", [1000, 4000, 1000, 1000]);
  assert.equal(await okRow(sql, "slow"), null, "one great card: no unlock");
  await ladder(sql, "runner", [1000, 1000, 1000], "run");
  assert.equal(await okRow(sql, "runner"), null, "The Run is not the green ladder");
  assert.equal(await plantUnlocked(sql, "ace"), true);
  assert.equal(await plantUnlocked(sql, "slow"), false);
});

test("back-fill: a pre-release perfect-Stack prize row unlocks; a perfect Run prize or plain Stack cards don't", async () => {
  const sql = await db();
  await syncPlayer(sql, "old", snap(), "oldphone1");
  await syncPlayer(sql, "runr", snap(), "runrphone1");
  await sql`insert into wallet_ledger (user_id, op_key, detail) values ('old', 'grade:x4', ${JSON.stringify({ coins: 1, keys: {}, boosts: ["Perfect ladder: red match +400"], g: "perfect", pi: STACK_ID, pv: "x3" })})`;
  await sql`insert into wallet_ledger (user_id, op_key, detail) values ('runr', 'grade:r3', ${JSON.stringify({ coins: 1, keys: {}, boosts: ["Perfect ladder: amber match +150"], g: "perfect", pi: RUN_ID })})`;
  for (let i = 0; i < 4; i++) await sql`insert into wallet_ledger (user_id, op_key, detail) values ('runr', ${"grade:s" + i}, ${JSON.stringify({ coins: 1, keys: {}, boosts: [], g: "perfect", pi: STACK_ID, pv: i ? "s" + (i - 1) : "" })})`;
  assert.equal(await plantUnlocked(sql, "old"), true);
  assert.match((await okRow(sql, "old"))!, /"backfill":1/);
  assert.equal(await plantUnlocked(sql, "runr"), false, "a chain of perfect Stack cards without the prize row is not proof");
  assert.equal(await okRow(sql, "runr"), null);
});

test("findPerfectStack ignores misses, other ladders and junk", () => {
  const prize = (pi: string, g = "perfect") => JSON.stringify({ g, pi, boosts: ["Perfect ladder: violet match +400"] });
  assert.equal(findPerfectStack([{ op_key: "grade:a", detail: prize(STACK_ID) }]), "grade:a");
  assert.equal(findPerfectStack([{ op_key: "grade:a", detail: prize(RUN_ID) }]), null);
  assert.equal(findPerfectStack([{ op_key: "grade:a", detail: prize(STACK_ID, "miss") }]), null);
  assert.equal(findPerfectStack([{ op_key: "own:red", detail: prize(STACK_ID) }]), null);
  assert.equal(findPerfectStack([{ op_key: "grade:a", detail: "not json" }]), null);
});
