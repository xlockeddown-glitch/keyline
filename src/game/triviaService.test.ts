// 0.0.53 server-side trivia: deal never ships the answer (nor a raw id that hashes back to it), grade times the
// answer on the server clock, reveals the answer only after it, writes a signed-in walker's plate event and rolls
// clear itself, grades a token once, and guests play on an anonymous token.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { isSeen, plateId, sealPlate, seenSet } from "./rarity.ts";
import {
  DealIn,
  GradeIn,
  RTT_GRACE_MS,
  avoidList,
  deal,
  effectiveMs,
  grade,
  gradeOf,
  openToken,
  publicCardId,
  resetGradeRing,
  sealToken,
  type TriviaDeps,
} from "./triviaService.ts";
import type { Sql } from "../lib/db.ts";
import type { Poi, TriviaQ } from "./types";

const migration = (name: string) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8");

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

const BANK: TriviaQ[] = [
  sealPlate({ q: "Which river runs through Austin?", choices: ["Colorado", "Brazos", "Pecos", "Trinity"], answer: "Colorado", fact: "Lady Bird Lake is a reservoir on the Colorado.", diff: 1 }),
  sealPlate({ q: "How many stories is the UT Tower?", choices: ["14", "21", "27", "33"], answer: "27", diff: 2 }),
  sealPlate({ q: "Barton Springs stays near what temperature?", choices: ["55°F", "70°F", "85°F", "It freezes"], answer: "70°F", diff: 3 }),
];
const LAMP: Poi = { id: "ut-tower", name: "UT Tower", lat: 30.28, lng: -97.74, kind: "campus", tier: "blue", lore: "" };
const SAVE = "11111111-2222-3333-4444-555555555555";

function depsAt(clock: { t: number }, sql?: Sql, picks: string[] = []): TriviaDeps {
  const all = new Map<string, TriviaQ>();
  for (const c of BANK) {
    all.set(c.id, c);
    all.set(publicCardId(c), c);
  }
  return {
    now: () => clock.t,
    secret: "test-secret",
    pick: (_city, _cat, _poi, _tier, avoid) => {
      const seen = seenSet(avoid);
      const c = BANK.find((x) => !isSeen(x, seen)) ?? BANK[0]!;
      picks.push(c.id);
      return c;
    },
    card: (id) => all.get(id) ?? null,
    namedPoi: (_city, id) => (id === LAMP.id ? LAMP : null),
    series: (id) => (id === "the-run" ? { poi: { ...LAMP, id: "the-run", tier: "blue" }, cost: "blue", diffs: [1, 2, 3] } : null),
    sql: sql ? async () => sql : undefined,
    rand: () => 0.42,
  };
}

const dealIn = (over: Partial<Parameters<typeof deal>[2]> = {}) =>
  DealIn.parse({ city: "austin", cat: "local", poiId: LAMP.id, windowMs: 25000, seen: [], saveId: SAVE, ...over });

async function db() {
  const pg = new PGlite();
  await pg.exec(migration("0001_auth.sql"));
  await pg.exec(migration("0002_vault_clears.sql"));
  await pg.exec(migration("0003_plate_events.sql"));
  await pg.exec(migration("0004_plate_stats.sql"));
  await pg.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ('ann', 'Ann Baker', 'ann@x.test', true, now(), now())`);
  return sqlOf(pg);
}

beforeEach(() => resetGradeRing());

test("a dealt card carries the prompt and shuffled choices — no answer, no fact, no raw id", () => {
  const clock = { t: 1_000_000 };
  const r = deal(depsAt(clock), { userId: null }, dealIn());
  assert.ok(r.ok);
  if (!r.ok) return;
  const card = BANK[0]!;
  assert.deepEqual([...r.card.choices].sort(), [...card.choices].sort());
  assert.equal(r.card.q, card.q);
  const wire = JSON.stringify(r);
  assert.doesNotMatch(wire, /"answer"|"fact"|correctIndex/);
  assert.ok(!wire.includes(card.fact!), "the fact waits for the grade");
  assert.ok(!wire.includes(card.id), "the raw id (fnv1a of prompt + answer) never leaves the server");
  // The public id can't be brute-forced back to the answer: hashing each choice with the prompt finds nothing.
  for (const c of r.card.choices) assert.notEqual(plateId(r.card.q, c), r.card.id);
  // And it doesn't depend on which choice is right.
  assert.equal(publicCardId({ q: card.q, choices: [...card.choices].reverse() }), r.card.id);
  const body = openToken("test-secret", r.token)!;
  assert.equal(body.c, r.card.id);
  assert.equal(body.s, "g");
  assert.ok(!JSON.stringify(body).includes(card.answer));
});

test("choices are shuffled on the server", () => {
  const clock = { t: 0 };
  const orders = new Set<string>();
  for (const seed of [0.01, 0.3, 0.6, 0.95]) {
    const d = { ...depsAt(clock), rand: () => seed };
    const r = deal(d, { userId: null }, dealIn());
    if (r.ok) orders.add(r.card.choices.join("|"));
  }
  assert.ok(orders.size > 1);
});

test("anti-repeat: the save's seen public ids (and old raw ids) keep a card from coming back", () => {
  const clock = { t: 0 };
  const picks: string[] = [];
  const d = depsAt(clock, undefined, picks);
  const seen: string[] = [];
  for (let i = 0; i < 3; i++) {
    const r = deal(d, { userId: null }, dealIn({ seen }));
    assert.ok(r.ok);
    if (r.ok) seen.push(r.card.id);
  }
  assert.equal(new Set(picks).size, 3, "three different cards");
  // Old saves hold raw ids: they map too, and the prompt rides along for near-duplicate matching.
  const avoid = avoidList(d, [BANK[0]!.id, publicCardId(BANK[1]!)]);
  assert.deepEqual(avoid, [BANK[0]!.id, BANK[1]!.id, BANK[0]!.q, BANK[1]!.q]);
});

test("unknown lamps are refused; street blanks deal from the client's description; Run steps pass the difficulty", () => {
  const clock = { t: 0 };
  assert.deepEqual(deal(depsAt(clock), { userId: null }, dealIn({ poiId: "nowhere" })), { ok: false, reason: "unknown-lamp" });
  const blank = deal(depsAt(clock), { userId: null }, dealIn({ poiId: "blank-1", blank: { name: "Lamp on 6th", kind: "landmark", tier: "white" } }));
  assert.ok(blank.ok);
  if (blank.ok) assert.equal(openToken("test-secret", blank.token)!.k, "white");
  let want: unknown;
  const d = { ...depsAt(clock), pick: (...a: Parameters<TriviaDeps["pick"]>) => ((want = a[5]), BANK[0]!) };
  deal(d, { userId: null }, dealIn({ poiId: "the-run", step: 2 }));
  assert.equal(want, 3);
  const spark = deal(depsAt(clock), { userId: null }, dealIn({ spark: true }));
  if (spark.ok) assert.equal(openToken("test-secret", spark.token)!.k, null, "sparks clear nothing on the rolls");
});

test("the server clock bounds the answer time: a client can't claim a perfect it didn't earn", () => {
  assert.equal(effectiveMs(2000, 2500), 2000);
  assert.equal(effectiveMs(500, 8000), 8000 - RTT_GRACE_MS);
  assert.equal(gradeOf(3000).grade, "perfect");
  assert.equal(gradeOf(3001).grade, "great");
  assert.equal(gradeOf(10001).grade, "good");
});

test("grading: right, wrong, timed out; the answer only comes back with the grade", async () => {
  const clock = { t: 5_000_000 };
  const d = depsAt(clock);
  const r = deal(d, { userId: null }, dealIn());
  assert.ok(r.ok);
  if (!r.ok) return;
  clock.t += 2600;
  const ok = await grade(d, { userId: null }, GradeIn.parse({ token: r.token, choice: "Colorado", clientMs: 2300 }));
  assert.ok(ok.ok && ok.correct && ok.grade === "perfect" && ok.mult === 1 && ok.answer === "Colorado" && ok.fact);
  assert.ok(ok.ok && !ok.credited, "guests are graded but nothing is written");

  const r2 = deal(d, { userId: null }, dealIn());
  if (!r2.ok) return;
  clock.t += 9000;
  const cheat = await grade(d, { userId: null }, { token: r2.token, choice: "Colorado", clientMs: 400 });
  assert.ok(cheat.ok && cheat.correct && cheat.grade === "great" && cheat.elapsedMs === 9000 - RTT_GRACE_MS);

  const r3 = deal(d, { userId: null }, dealIn());
  if (!r3.ok) return;
  clock.t += 4000;
  const wrong = await grade(d, { userId: null }, { token: r3.token, choice: "Brazos", clientMs: 3900 });
  assert.ok(wrong.ok && !wrong.correct && wrong.grade === null && wrong.mult === 0 && wrong.answer === "Colorado");

  const r4 = deal(d, { userId: null }, dealIn());
  if (!r4.ok) return;
  clock.t += 25000 + 3000;
  const late = await grade(d, { userId: null }, { token: r4.token, choice: "Colorado", clientMs: 1000 });
  assert.ok(late.ok && late.timedOut && !late.correct, "past the wick it's a miss whatever was chosen");
  const r5 = deal(d, { userId: null }, dealIn());
  if (!r5.ok) return;
  const out = await grade(d, { userId: null }, { token: r5.token, choice: null, clientMs: 25000 });
  assert.ok(out.ok && out.timedOut && !out.correct && out.answer === "Colorado");
});

test("tokens: tampering and someone else's token are refused; a token grades once", async () => {
  const clock = { t: 9_000_000 };
  const d = depsAt(clock);
  const r = deal(d, { userId: "ann" }, dealIn());
  if (!r.ok) return assert.fail("deal");
  const body = openToken("test-secret", r.token)!;
  const forged = sealToken("wrong-secret", { ...body, t: body.t - 1 });
  assert.deepEqual(await grade(d, { userId: "ann" }, { token: forged, choice: "Colorado", clientMs: 1 }), { ok: false, reason: "bad-token" });
  const [b64] = r.token.split(".");
  const swapped = `${Buffer.from(JSON.stringify({ ...body, t: 0 })).toString("base64url")}.${r.token.split(".")[1]}`;
  assert.notEqual(swapped.split(".")[0], b64);
  assert.deepEqual(await grade(d, { userId: "ann" }, { token: swapped, choice: "Colorado", clientMs: 1 }), { ok: false, reason: "bad-token" });
  assert.deepEqual(await grade(d, { userId: "ben" }, { token: r.token, choice: "Colorado", clientMs: 1 }), { ok: false, reason: "not-yours" });
  assert.deepEqual(await grade(d, { userId: null }, { token: r.token, choice: "Colorado", clientMs: 1 }), { ok: false, reason: "not-yours" });

  const g = deal(d, { userId: null }, dealIn());
  if (!g.ok) return;
  clock.t += 5000;
  const first = await grade(d, { userId: null }, { token: g.token, choice: "Brazos", clientMs: 4000 });
  const again = await grade(d, { userId: null }, { token: g.token, choice: "Colorado", clientMs: 4000 });
  assert.ok(first.ok && !first.correct);
  assert.ok(again.ok && again.replay && !again.correct, "learning the answer and re-sending doesn't flip the grade");
});

test("signed-in: the server writes the plate event and the rolls clear itself, once per token", async () => {
  const sql = await db();
  const clock = { t: Date.UTC(2026, 9, 3, 12) };
  const d = depsAt(clock, sql);
  const r = deal(d, { userId: "ann" }, dealIn());
  if (!r.ok) return assert.fail("deal");
  clock.t += 2000;
  const ok = await grade(d, { userId: "ann" }, { token: r.token, choice: "Colorado", clientMs: 1900 });
  assert.ok(ok.ok && ok.correct && ok.credited && ok.clearTier === "blue");
  const clears = await sql<{ tier: string; correct: number; display_name: string }>`select tier, correct, display_name from vault_clears where user_id = 'ann'`;
  assert.deepEqual(clears.map((c) => [c.tier, Number(c.correct)]), [["blue", 1]]);
  const ev = await sql<{ plate_id: string; correct: boolean; latency_ms: number; save_id: string }>`select plate_id, correct, latency_ms, save_id from plate_events`;
  assert.equal(ev.length, 1);
  assert.equal(ev[0]!.plate_id, BANK[0]!.id, "stats stay keyed by the raw id the retune uses");
  assert.equal(ev[0]!.save_id, SAVE);
  // Replay (even after the in-memory ring is gone — another instance): first result stands, no second clear.
  resetGradeRing();
  const again = await grade(d, { userId: "ann" }, { token: r.token, choice: "Colorado", clientMs: 1900 });
  assert.ok(again.ok && again.replay && !again.credited);
  const after = await sql<{ correct: number }>`select correct from vault_clears where user_id = 'ann'`;
  assert.equal(Number(after[0]!.correct), 1);
  // A wrong answer is recorded (standings accuracy) but clears nothing.
  const w = deal(d, { userId: "ann" }, dealIn({ seen: [r.card.id] }));
  if (!w.ok) return;
  clock.t += 4000;
  const miss = await grade(d, { userId: "ann" }, { token: w.token, choice: "nope", clientMs: 3900 });
  assert.ok(miss.ok && !miss.correct && miss.credited && miss.clearTier === null);
  const n = await sql<{ n: number }>`select count(*)::int as n from plate_events where user_id = 'ann'`;
  assert.equal(Number(n[0]!.n), 2);
  const stats = await sql<{ shown: number }>`select sum(shown)::int as shown from plate_stats`;
  assert.equal(Number(stats[0]!.shown), 2);
});

test("a guest token graded by a signed-in walker grades but credits nothing", async () => {
  const sql = await db();
  const clock = { t: Date.UTC(2026, 9, 3, 13) };
  const d = depsAt(clock, sql);
  const r = deal(d, { userId: null }, dealIn());
  if (!r.ok) return;
  clock.t += 2000;
  const g = await grade(d, { userId: "ann" }, { token: r.token, choice: "Colorado", clientMs: 1900 });
  assert.ok(g.ok && g.correct && !g.credited);
  const clears = await sql`select * from vault_clears`;
  assert.equal(clears.length, 0);
});
