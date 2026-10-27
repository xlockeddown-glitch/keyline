// 0.1.55: Bel Air Road trip: the first lit lamp in each city each day, seated in the Bel Air, pays +1 white (server-paid).
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
import { CAR_FAV, CAR_PERKS, roadTripPays } from "./carPerks.ts";
import { CARS } from "./cars.ts";
import { CAR_COLORS } from "./carPaint.ts";
import type { CarId } from "./cars.ts";
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
const rtRows = async (sql: Sql, id: string) =>
  Number((await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and detail like ${'%"rt":1%'}`)[0]?.n);

const RT = "Road trip: +1 white";
test("data: Bel Air in price order, six colours, Road trip perk, Geography favorite", () => {
  assert.deepEqual(CARS.filter((c) => c.id === "belair57").map((c) => [c.price, c.pace, c.year]), [[200_000, 1.17, "1957"]]);
  assert.equal(CAR_COLORS.belair57.length, 6);
  assert.equal(CAR_COLORS.belair57[0]!.name, "Tropical Turquoise");
  assert.equal(CAR_FAV.belair57, "geography");
  assert.match(CAR_PERKS.belair57.label, /^Road trip/);
  assert.equal(roadTripPays("belair57", false), true);
  assert.equal(roadTripPays("belair57", true), false);
  assert.equal(roadTripPays("ioniq5", false), false);
  assert.equal(roadTripPays(null, false), false);
});

test("Road trip: first lit lamp per city per day only, once per grade, not on a miss, spark or in another car", async () => {
  const sql = await db();
  await syncPlayer(sql, "rt", snap, "rt-phone");
  const { id } = await canonicalWallet(sql, "rt");
  for (const [n, p] of [["m", pay({ car: "belair57", correct: false })], ["s", pay({ car: "belair57", clearTier: null, poiId: "spark-1" })], ["o", pay({ car: "civic" })], ["x", pay({})]] as const) {
    const r = await awardGrade(sql, "rt", `g-${n}`, p);
    assert.ok(!r.award?.boosts.includes(RT), n);
  }
  const a = await awardGrade(sql, "rt", "a1", pay({ car: "belair57" }));
  assert.ok(a.award?.boosts.includes(RT), JSON.stringify(a.award));
  await syncPlayer(sql, "plain", snap, "plain-phone");
  const plain = await awardGrade(sql, "plain", "p0", pay({}));
  assert.equal(a.award?.keys.white ?? 0, (plain.award?.keys.white ?? 0) + 1, "exactly one extra white");
  await awardGrade(sql, "rt", "a1", pay({ car: "belair57" }));
  const second = await awardGrade(sql, "rt", "a2", pay({ car: "belair57" }));
  assert.ok(!second.award?.boosts.includes(RT), "second lamp in the same city today: nothing");
  assert.equal(await rtRows(sql, id), 1, "no double pay on a replay");
  const other = await awardGrade(sql, "rt", "b1", pay({ car: "belair57", city: "chicago", poiId: "bean", lat: 41.88, lng: -87.62 }));
  assert.ok(other.award?.boosts.includes(RT), "a new city pays again");
  assert.equal(await rtRows(sql, id), 2);
  // Yesterday's Road trip row doesn't count today.
  await sql`update wallet_ledger set created_at = created_at - interval '26 hours' where user_id = ${id} and detail like ${'%"rt":1%'}`;
  const next = await awardGrade(sql, "rt", "a3", pay({ car: "belair57" }));
  assert.ok(next.award?.boosts.includes(RT), "the next day pays again");
});
