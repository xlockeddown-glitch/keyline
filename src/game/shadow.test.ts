// Shadow pity: the posted rate holds until a few other players have found the can,
// then a walker past their mean by more than one standard deviation rolls a higher hidden chance.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { paintsFromServer } from "./ingredients.ts";
import { sealPlate } from "./rarity.ts";
import { SHADOW_MAX_MULT, shadowChance, shadowMult } from "./shadow.ts";
import { paintsForEvent, shadowPaints } from "./shadowRoll.ts";
import { deal, grade, openToken, publicCardId, resetGradeRing, type TriviaDeps } from "./triviaService.ts";
import type { Sql } from "../lib/db.ts";
import type { Poi, TriviaQ } from "./types.ts";

const sample = { n: 5, mean: 80, sd: 20 };

test("the posted rate holds until a few other players have found it, and until you're past them", () => {
  assert.equal(shadowMult(null, 10_000), 1);
  assert.equal(shadowMult({ n: 0, mean: 0, sd: 0 }, 10_000), 1);
  assert.equal(shadowMult({ n: 4, mean: 80, sd: 20 }, 10_000), 1, "four finds is not a few");
  assert.equal(shadowMult(sample, 100), 1, "mean + one standard deviation is not yet past");
  assert.equal(shadowMult(sample, 80), 1);
  assert.equal(shadowMult(sample, 0), 1);
  assert.ok(shadowMult(sample, 100.01) > 1);
  assert.equal(shadowMult(sample, 120), 2, "one further standard deviation doubles the chance");
  assert.equal(shadowMult(sample, 10_000), SHADOW_MAX_MULT);
  // Everyone found it on the same count: the mean itself is the step.
  assert.equal(shadowMult({ n: 5, mean: 80, sd: 0 }, 80), 1);
  assert.equal(shadowMult({ n: 5, mean: 80, sd: 0 }, 160), 2);
  assert.ok(Math.abs(shadowChance(0.1, { n: 5, mean: 10, sd: 0 }, 30) - 0.3) < 1e-12);
  assert.equal(shadowChance(0.1, { n: 4, mean: 10, sd: 0 }, 30), 0.1);
});

test("a server list replaces the local roll, and an empty list drops nothing", () => {
  assert.deepEqual(paintsFromServer("red", []), []);
  assert.deepEqual(paintsFromServer("red", ["paint-red", "nope", "paint-red", "paint-prism"]), ["paint-red", "paint-prism"]);
  const local = paintsFromServer("white", undefined);
  assert.ok(local.length <= 2);
  for (const id of local) assert.ok(id === "paint-white" || id === "paint-prism");
});

const mig = (n: string) => readFileSync(new URL(`../../migrations/${n}`, import.meta.url), "utf8");

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

async function db() {
  const pg = new PGlite();
  for (const n of ["0001_auth.sql", "0002_vault_clears.sql", "0003_plate_events.sql", "0004_plate_stats.sql", "0006_daily_runs.sql", "0007_daily_runs_per_city.sql", "0011_player_links.sql", "0015_paint_finds.sql"]) {
    await pg.exec(mig(n));
  }
  await pg.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ('ann', 'Ann', 'ann@x.test', true, now(), now())`);
  return sqlOf(pg);
}

async function clear(sql: Sql, userId: string, tier: string, n: number) {
  await sql`insert into vault_clears (user_id, display_name, tier, correct) values (${userId}, ${userId}, ${tier}, ${n})`;
}

async function found(sql: Sql, userId: string, paint: string, clears: number) {
  await sql`
    insert into paint_finds (event_id, user_id, paint, clears, first)
    values (${`seed-${userId}-${paint}`}, ${userId}, ${paint}, ${clears}, true)
  `;
}

test("nobody, then four players: the roll stays posted. The fifth opens the shadow", async () => {
  const sql = await db();
  await clear(sql, "ann", "green", 100);
  const posted = await shadowPaints(sql, "ann", "green", "e-posted", () => 0.2);
  assert.deepEqual(posted, [], "0.2 misses 1 in 10, and prism, when no one has a green can");

  for (let i = 0; i < 4; i++) await found(sql, `p${i}`, "green", 10);
  const still = await shadowPaints(sql, "ann", "green", "e-four", () => 0.2);
  assert.deepEqual(still, [], "four finds do not move the curve");

  await found(sql, "p4", "green", 10);
  const raised = await shadowPaints(sql, "ann", "green", "e-five", () => 0.2);
  assert.deepEqual(raised, ["paint-green"], "100 answers against a mean of 10 is past the cap, so 0.2 hits the raised roll");
  const row = await sql<{ user_id: string; clears: number; first: boolean }>`
    select user_id, clears, first from paint_finds where event_id = 'e-five'
  `;
  assert.equal(row.length, 1);
  assert.equal(row[0]!.user_id, "ann");
  assert.equal(Number(row[0]!.clears), 100);
  assert.equal(row[0]!.first, true);

  const again = await shadowPaints(sql, "ann", "green", "e-after", () => 0.2);
  assert.deepEqual(again, [], "the drought resets at the find, so the next roll is posted again");
  const others = await sql<{ n: number }>`
    select count(*)::int as n from paint_finds where paint = 'green' and first and user_id <> 'ann'
  `;
  assert.equal(Number(others[0]!.n), 5, "her own find is not part of anyone else's curve");
});

test("a linked sign-in counts as the same walker, and the find is stored once", async () => {
  const sql = await db();
  await sql`insert into player_links (alias_id, primary_id, how) values ('ann-x', 'ann', 'code')`;
  await clear(sql, "ann-x", "violet", 200);
  for (let i = 0; i < 5; i++) await found(sql, `v${i}`, "violet", 40);
  const hits = await shadowPaints(sql, "ann-x", "violet", "e-link", () => 0.04);
  assert.deepEqual(hits, ["paint-violet"]);
  const row = await sql<{ user_id: string; clears: number }>`select user_id, clears from paint_finds where event_id = 'e-link'`;
  assert.equal(row[0]!.user_id, "ann");
  assert.equal(Number(row[0]!.clears), 200);
});

test("prism stays posted until a few people have one, and a blue can is not a shadow find", async () => {
  const sql = await db();
  await clear(sql, "ann", "white", 30_000);
  const seq = (...xs: number[]) => {
    let i = 0;
    return () => xs[i++] ?? 0.99;
  };
  const quiet = await shadowPaints(sql, "ann", "blue", "e-prism-quiet", seq(0.99, 0.0002));
  assert.deepEqual(quiet, [], "1 in 10,000 holds while nobody has a prism");
  for (let i = 0; i < 5; i++) await found(sql, `u${i}`, "prism", 10_000);
  const raised = await shadowPaints(sql, "ann", "blue", "e-prism", seq(0.99, 0.0002));
  assert.deepEqual(raised, ["paint-prism"]);
  const paints = await sql<{ paint: string }>`select paint from paint_finds where user_id = 'ann'`;
  assert.deepEqual(paints.map((r) => r.paint), ["prism"], "a blue can is not written onto the curve");
});

test("a replayed grade reads the cans back in colour-then-prism order", async () => {
  const sql = await db();
  await sql`
    insert into paint_finds (event_id, user_id, paint, clears, first) values
      ('t:same', 'ann', 'prism', 12, true),
      ('t:same', 'ann', 'red', 4, true)
  `;
  assert.deepEqual(await paintsForEvent(sql, "t:same"), ["paint-red", "paint-prism"]);
});

const BANK: TriviaQ[] = [
  sealPlate({ q: "Which river runs through Austin?", choices: ["Colorado", "Brazos", "Pecos", "Trinity"], answer: "Colorado", fact: "A reservoir.", diff: 1 }),
];
const LAMP: Poi = { id: "ut-tower", name: "UT Tower", lat: 30.28, lng: -97.74, kind: "campus", tier: "blue", lore: "" };
const SAVE = "11111111-2222-3333-4444-555555555555";

function deps(sql: Sql, roll: () => number): TriviaDeps {
  const all = new Map<string, TriviaQ>();
  for (const c of BANK) {
    all.set(c.id, c);
    all.set(publicCardId(c), c);
  }
  return {
    now: () => 9_000_000,
    secret: "test-secret",
    pick: () => BANK[0]!,
    card: (id) => all.get(id) ?? null,
    namedPoi: (_c, id) => (id === LAMP.id ? LAMP : null),
    series: (id) => (id === "the-run" ? { poi: { ...LAMP, id: "the-run", tier: "blue" }, cost: "blue", diffs: [1, 2, 3] } : null),
    sql: async () => sql,
    roll,
  };
}

const dealIn = (over: Record<string, unknown> = {}) => ({
  city: "austin" as const,
  cat: "local" as const,
  poiId: LAMP.id,
  windowMs: 25000,
  seen: [] as string[],
  saveId: SAVE,
  ...over,
});

test("the server rolls a signed-in clear, a guest stays local, and only the last card of a run pays paint", async () => {
  resetGradeRing();
  const sql = await db();
  const d = deps(sql, () => 0);
  const guest = deal(d, { userId: null }, dealIn());
  assert.ok(guest.ok);
  if (!guest.ok) return;
  assert.equal(openToken("test-secret", guest.token)!.pr, 1);
  const guestGrade = await grade(d, { userId: null }, { token: guest.token, choice: "Colorado", clientMs: 1900 });
  assert.ok(guestGrade.ok && guestGrade.correct && !("paints" in guestGrade));

  const spark = deal(d, { userId: "ann" }, dealIn({ spark: true }));
  assert.ok(spark.ok && spark.ok && openToken("test-secret", spark.token)!.pr === 0);
  const mid = deal(d, { userId: "ann" }, dealIn({ poiId: "the-run", step: 0 }));
  const last = deal(d, { userId: "ann" }, dealIn({ poiId: "the-run", step: 2 }));
  assert.ok(mid.ok && last.ok);
  if (!mid.ok || !last.ok) return;
  assert.equal(openToken("test-secret", mid.token)!.pr, 0);
  assert.equal(openToken("test-secret", last.token)!.pr, 1);

  const lamp = deal(d, { userId: "ann" }, dealIn({ poiId: "green-corner", blank: { name: "Green corner", kind: "landmark", tier: "green" } }));
  assert.ok(lamp.ok);
  if (!lamp.ok) return;
  const first = await grade(d, { userId: "ann" }, { token: lamp.token, choice: "Colorado", clientMs: 1900 });
  assert.ok(first.ok && first.credited);
  if (!first.ok) return;
  assert.deepEqual(first.paints, ["paint-green", "paint-prism"]);
  resetGradeRing();
  const replay = await grade(d, { userId: "ann" }, { token: lamp.token, choice: "Colorado", clientMs: 1900 });
  assert.ok(replay.ok && replay.replay && !replay.credited);
  if (!replay.ok) return;
  assert.deepEqual(replay.paints, ["paint-green", "paint-prism"]);
  const n = await sql<{ n: number }>`select count(*)::int as n from paint_finds`;
  assert.equal(Number(n[0]!.n), 2, "a replay does not write the find again");
  const clears = await sql<{ correct: number }>`select correct from vault_clears where user_id = 'ann'`;
  assert.equal(Number(clears[0]!.correct), 1);
});
