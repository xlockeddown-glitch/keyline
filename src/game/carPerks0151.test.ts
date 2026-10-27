// 0.1.51: Ioniq 5 Vehicle-to-load (+1 white per lit lamp while seated, 20 a day per player, server-paid once per grade)
// and Model 3 Autopilot (1 in 10 lamp questions lose one wrong option, rolled from the deal nonce).
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { GradePay, LocalSnap } from "./wallet.ts";
import { awardGrade, syncPlayer } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { CAR_FAV, CAR_PERKS, V2L_DAY_CAP, autopilotHit, autopilotStrike, v2lPays } from "./carPerks.ts";
import { CARS } from "./cars.ts";
import { CAR_COLORS } from "./carPaint.ts";
import { DealIn, deal, type TriviaDeps } from "./triviaService.ts";
import { sealPlate } from "./rarity.ts";
import type { CarId } from "./cars.ts";
import type { Poi } from "./types.ts";
thanksClock.cutoff = "2000-01-01T00:00:00Z";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}
const mig = (name: string) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8");
async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };
function pay(over: Partial<GradePay> & { car?: CarId | null } = {}): Omit<GradePay, "prior"> & { prevNonce: string; car?: CarId | null } {
  return {
    correct: true, elapsedMs: 5000, mult: 1, city: "austin", diff: 2, clearTier: "green", poiTier: "green", poiId: "zilker",
    lat: 30.27, lng: -97.77, series: null, step: 0, steps: 1, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "",
    charmTopics: [], topic: "science", dealtAt: Date.now(), luckyHit: false, perfectBlue: false, prevNonce: "", ...over,
  };
}
const v2Rows = async (sql: Sql, id: string) =>
  Number((await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and detail like ${'%"v2":1%'}`)[0]?.n);

test("data: two new cars in price order, six real colours each, perks and favorites", () => {
  assert.deepEqual(CARS.filter((c) => c.id === "ioniq5" || c.id === "model3").map((c) => [c.id, c.price, c.pace]), [["ioniq5", 90_000, 1.1], ["model3", 350_000, 1.2]]);
  for (const c of ["ioniq5", "model3"] as const) assert.equal(CAR_COLORS[c].length, 6);
  assert.equal(CAR_FAV.ioniq5, "arts");
  assert.equal(CAR_FAV.model3, "math");
  const carFavs = Object.entries(CAR_FAV).filter(([k]) => k !== "belair57").map(([, v]) => v); // belair57: temporary "local" until geography
  assert.equal(new Set(carFavs).size, carFavs.length, "no two cars share a favorite");
  assert.match(CAR_PERKS.ioniq5.label, /^Vehicle-to-load/);
  assert.match(CAR_PERKS.model3.label, /^Autopilot/);
  assert.equal(V2L_DAY_CAP, 20);
  assert.equal(v2lPays("ioniq5", 19), true);
  assert.equal(v2lPays("ioniq5", 20), false);
  assert.equal(v2lPays("model3", 0), false);
  assert.equal(v2lPays(null, 0), false);
});

test("Autopilot: 1 in 10 from the nonce, the same every time, never the answer, only the Model 3", () => {
  const choices = ["a", "b", "c", "d"];
  let hits = 0;
  const n = 5000;
  for (let i = 0; i < n; i++) {
    const s = autopilotStrike("model3", `n-${i}`, choices, "b");
    assert.equal(autopilotStrike("model3", `n-${i}`, [...choices].reverse(), "b"), s, "deterministic, whatever the order");
    assert.notEqual(s, "b");
    if (s) hits++;
    assert.equal(autopilotHit("roadster", `n-${i}`), false);
    assert.equal(autopilotStrike(null, `n-${i}`, choices, "b"), null);
  }
  assert.ok(Math.abs(hits / n - 0.1) < 0.02, `${hits / n}`);
});

test("Autopilot in the deal: only for a proven Model 3, never on a series card, the struck option is a wrong one", () => {
  const card = sealPlate({ q: "2 + 2?", choices: ["3", "4", "5", "6"], answer: "4", diff: 2 });
  const lamp: Poi = { id: "ut-tower", name: "UT Tower", lat: 30.28, lng: -97.74, kind: "campus", tier: "blue", lore: "" };
  let k = 0;
  const deps: TriviaDeps = {
    now: () => 1_800_000_000_000, secret: "s", pick: () => card, card: () => card,
    namedPoi: (_c, id) => (id === lamp.id ? lamp : null),
    series: (id) => (id === "the-run" ? { poi: { ...lamp, id: "the-run" }, cost: "blue", diffs: [1, 2, 3] } : null),
    rand: () => 0.42, nonce: () => `nonce-${k}`,
  };
  const inp = (over = {}) => DealIn.parse({ city: "austin", cat: "math", poiId: lamp.id, windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555", ...over });
  let hits = 0;
  for (k = 0; k < 600; k++) {
    const r = deal(deps, { userId: "u" }, inp(), [], { car: "model3" });
    assert.ok(r.ok);
    const st = r.ok ? r.card.struck : undefined;
    assert.equal(Boolean(st), autopilotHit("model3", `nonce-${k}`));
    if (st) { hits++; assert.notEqual(st, "4"); }
    const none = deal(deps, { userId: "u" }, inp(), [], {});
    assert.equal(none.ok && none.card.struck, undefined, "no proven car: no Autopilot");
    const run = deal(deps, { userId: "u" }, inp({ poiId: "the-run" }), [], { car: "model3" });
    assert.equal(run.ok && run.card.struck, undefined, "series cards: no Autopilot");
  }
  assert.ok(hits > 30 && hits < 95, `${hits}`);
});

test("Vehicle-to-load: +1 white per lit lamp in the Ioniq 5, 20 a day, once per grade, not on a miss or in another car", async () => {
  const sql = await db();
  await syncPlayer(sql, "ev", snap, "ev-phone");
  const { id } = await canonicalWallet(sql, "ev");
  const a = await awardGrade(sql, "ev", "g0", pay({ car: "ioniq5" }));
  assert.ok(a.ok);
  assert.ok(a.award?.boosts.includes("Vehicle-to-load: +1 white"), JSON.stringify(a.award));
  await syncPlayer(sql, "ice", snap, "ice-phone");
  const plain = await awardGrade(sql, "ice", "p0", pay({}));
  assert.equal(a.award?.keys.white ?? 0, (plain.award?.keys.white ?? 0) + 1, "exactly one extra white");
  // A replay of the same grade pays nothing new.
  await awardGrade(sql, "ev", "g0", pay({ car: "ioniq5" }));
  assert.equal(await v2Rows(sql, id), 1, "no double pay on a replay");
  // A miss, a spark (no match), another car and no car: no white.
  for (const [n, p] of [["m", pay({ car: "ioniq5", correct: false })], ["s", pay({ car: "ioniq5", clearTier: null, poiId: "spark-1" })], ["o", pay({ car: "model3" })], ["x", pay({})]] as const) {
    const r = await awardGrade(sql, "ev", `g-${n}`, p);
    assert.ok(!r.award?.boosts.includes("Vehicle-to-load: +1 white"), n);
  }
  for (let i = 1; i < 25; i++) await awardGrade(sql, "ev", `g${i}`, pay({ car: "ioniq5" }));
  assert.equal(await v2Rows(sql, id), V2L_DAY_CAP, "capped at 20 a day");
  const after = await awardGrade(sql, "ev", "g99", pay({ car: "ioniq5" }));
  assert.ok(!after.award?.boosts.includes("Vehicle-to-load: +1 white"));
});
