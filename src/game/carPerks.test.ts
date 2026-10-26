import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { CAR_FAV, CAR_PERKS, FAV_BOTH, CAT_BONUS_CAP, SCOUT_FAV, bestReach, bestVaultMs, carCool, catBoost, cotdAt, cotdOf, perkFavs, regenHit } from "./carPerks.ts";
import { emptyWallet, gradeGrant, type GradePay } from "./wallet.ts";
import { DealIn, dealFor, openToken, publicCardId, type TriviaDeps } from "./triviaService.ts";
import { sealPlate } from "./rarity.ts";
import type { Poi, TriviaCat, TriviaQ } from "./types.ts";

const T0 = Date.UTC(2026, 9, 16, 18);
const pay = (over: Partial<GradePay> = {}): GradePay => ({ correct: true, elapsedMs: 3000, mult: 1, city: "austin", diff: 2, clearTier: "blue", poiTier: "blue", poiId: "ut-tower", lat: 30.28, lng: -97.74, series: null, step: 0, steps: 1, prior: [], streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], topic: null, dealtAt: T0, luckyHit: false, perfectBlue: false, ...over });
const coin = (p: GradePay) => {
  const g = gradeGrant(emptyWallet(), p);
  assert.ok(g.ok);
  return g.ok ? g.wallet.coins : 0;
};
const other = (not: TriviaCat[]): TriviaCat => (["sports", "local", "food", "arts", "history", "music"] as TriviaCat[]).find((c) => !not.includes(c))!;

test("perks only while seated in that car; same perk with a coat: the higher wins", () => {
  assert.equal(bestVaultMs(undefined, "civic"), 1000);
  assert.equal(bestVaultMs(undefined, null), 0, "not seated: nothing");
  assert.equal(bestVaultMs(4000, "civic"), 4000, "Sloth's +4 s beats the Civic");
  assert.equal(bestVaultMs(1000, "civic"), 1000, "Cat +1 s and Civic +1 s don't add");
  assert.equal(bestReach(1, "f150"), 1.5);
  assert.equal(bestReach(2, "f150"), 2, "Giraffe 2x beats the truck bed");
  assert.equal(bestReach(1, null), 1);
  assert.equal(carCool("mustang"), 0.85);
  assert.equal(carCool(null), 1);
  assert.equal(carCool("civic"), 1);
  assert.deepEqual(Object.keys(CAR_PERKS).sort(), ["civic", "f150", "mustang", "roadster", "roadster2"]);
  assert.doesNotMatch(JSON.stringify(CAR_PERKS), /coming soon/i);
  assert.match(CAR_PERKS.roadster2.label, /^Magnet · .*35 m/);
});

test("Roadster Regen: 1 in 5 from the nonce, the same every time, never without the car", () => {
  const n = 4000;
  let hits = 0;
  for (let i = 0; i < n; i++) {
    const h = regenHit("roadster", `nonce-${i}`);
    assert.equal(regenHit("roadster", `nonce-${i}`), h, "deterministic");
    if (h) hits++;
    assert.equal(regenHit(null, `nonce-${i}`), false);
    assert.equal(regenHit("roadster2", `nonce-${i}`), false);
  }
  assert.ok(Math.abs(hits / n - 0.2) < 0.03, `${hits / n}`);
});

test("category of the day: fixed per Chicago date; the boundary is Chicago midnight, not UTC", () => {
  assert.equal(cotdOf("2026-10-25"), cotdOf("2026-10-25"));
  const days = new Set(Array.from({ length: 60 }, (_, i) => cotdOf(`2026-11-${String((i % 28) + 1).padStart(2, "0")}-${i}`)));
  assert.ok(days.size > 5, "it moves around");
  // 11:30 PM CDT Oct 25 is 04:30 UTC Oct 26: still the 25th in Chicago.
  assert.equal(cotdAt(Date.UTC(2026, 9, 26, 4, 30)), cotdOf("2026-10-25"));
  assert.equal(cotdAt(Date.UTC(2026, 9, 26, 5, 30)), cotdOf("2026-10-26"), "12:30 AM CDT is the 26th");
});

test("boost math: favorite +15%, day +25%, added, capped at +40%; lamps only, never on a miss or a series card", () => {
  const day = cotdAt(T0);
  assert.equal(catBoost(day, [], T0).x, 1.25);
  const fav = other([day]);
  assert.equal(catBoost(fav, [fav], T0).x, 1.15);
  assert.equal(catBoost(day, [day], T0).x, 1.4);
  // 0.1.45: coat + car on the same favorite stack to +25%; different favorites: only the matching one counts.
  assert.equal(FAV_BOTH, 0.25);
  assert.equal(catBoost(fav, [fav, fav], T0).x, 1.25, "coat and car both favor it: +25%");
  assert.equal(catBoost(fav, [fav, day], T0).x, 1.15, "different favorites: just the one");
  assert.equal(catBoost(fav, [day, fav], T0).x, 1.15, "car alone");
  assert.equal(catBoost(day, [day, day], T0).x, 1.4, "day +25% and both +25% caps at 1.40");
  assert.equal(coin(pay({ topic: fav, favs: [fav, fav] })), Math.round(coin(pay({ topic: other([day, fav]) })) * 1.25));
  // Giraffe + Roadster on Science (both Science), not the day: +25%, server-side from proven favs.
  const sci = perkFavs("giraffe", true, "roadster");
  assert.deepEqual(sci, ["science", "science"]);
  const notDay = cotdAt(T0) === "science" ? T0 + 86_400_000 : T0;
  assert.equal(catBoost("science", sci, notDay).x, cotdAt(notDay) === "science" ? 1.4 : 1.25);
  assert.equal(catBoost("science", perkFavs("giraffe", false, "roadster"), notDay).x, 1.15, "an unproven coat drops to the car's +15%");
  assert.ok(catBoost(day, [day], T0).x <= 1 + CAT_BONUS_CAP);
  assert.equal(catBoost(null, [fav], T0).x, 1);
  const base = coin(pay({ topic: other([day, fav]) }));
  assert.equal(coin(pay({ topic: day })), Math.round(base * 1.25));
  assert.equal(coin(pay({ topic: fav, favs: [fav] })), Math.round(base * 1.15));
  assert.equal(coin(pay({ topic: day, favs: [day] })), Math.round(base * 1.4));
  assert.equal(coin(pay({ topic: day, correct: false })), 0, "a miss pays nothing");
  const series = (t: TriviaCat | null) => coin(pay({ topic: t, series: "run", step: 2, steps: 3, prior: ["perfect", "perfect"] }));
  assert.equal(series(day), series(other([day])), "series cards are not boosted");
  // Matches never change.
  const g1 = gradeGrant(emptyWallet(), pay({ topic: day, favs: [day] }));
  const g0 = gradeGrant(emptyWallet(), pay({ topic: other([day]) }));
  assert.ok(g1.ok && g0.ok);
  if (g1.ok && g0.ok) assert.deepEqual(g1.wallet.keys, g0.wallet.keys);
});

test("stacking with the night market: the category factor applies before it (same ratio on a market lamp)", () => {
  const day = cotdAt(T0);
  // Find a market-open moment for this lamp by scanning the day; the ratio holds with or without the market.
  let checked = 0;
  for (let k = 0; k < 96 && checked < 3; k++) {
    const at = T0 + k * 15 * 60_000;
    if (cotdAt(at) !== day) continue;
    const a = coin(pay({ topic: day, dealtAt: at }));
    const b = coin(pay({ topic: other([day]), dealtAt: at }));
    assert.ok(Math.abs(a / b - 1.25) < 0.02, `${a}/${b}`);
    checked++;
  }
  assert.ok(checked > 0);
});

test("favorites count only for a proven coat and a seated, owned car", () => {
  assert.deepEqual(perkFavs("fox", true, "mustang"), [SCOUT_FAV.fox, CAR_FAV.mustang]);
  assert.equal(SCOUT_FAV.corgi, "celebrity");
  assert.equal(SCOUT_FAV.fox, "math");
  assert.deepEqual(perkFavs("fox", false, null), []);
  assert.equal(new Set(Object.values(SCOUT_FAV)).size, 9, "nine different coat favorites");
  assert.equal(SCOUT_FAV.sloth, "political");
  assert.equal(SCOUT_FAV.owl, "books");
});

const mig = (name: string) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8");
function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}
const CARD: TriviaQ = sealPlate({ q: "How many stories is the UT Tower?", choices: ["14", "21", "27", "33"], answer: "27", diff: 2 });
const LAMP: Poi = { id: "ut-tower", name: "UT Tower", lat: 30.28, lng: -97.74, kind: "campus", tier: "blue", lore: "" };

test("the server, not the client, decides which car and coat count (a claimed car or coat it can't find is dropped)", async () => {
  const pg = new PGlite();
  await pg.exec("select 1");
  for (const m of ["0001_auth.sql", "0002_vault_clears.sql", "0003_plate_events.sql", "0004_plate_stats.sql", "0006_daily_runs.sql", "0007_daily_runs_per_city.sql", "0011_player_links.sql", "0015_paint_finds.sql", "0016_player_wallet.sql"]) await pg.exec(mig(m));
  const sql = sqlOf(pg);
  await pg.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ('ann', 'Ann Baker', 'ann@x.test', true, now(), now())`);
  const deps: TriviaDeps = {
    now: () => T0,
    secret: "s",
    pick: () => CARD,
    card: (id) => (id === CARD.id || id === publicCardId(CARD) ? CARD : null),
    namedPoi: (_c, id) => (id === LAMP.id ? LAMP : null),
    series: () => null,
    sql: async () => sql,
    rand: () => 0.5,
  };
  const input = (car: string, scout: string) =>
    DealIn.parse({ city: "austin", cat: "local", poiId: LAMP.id, windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555", spark: true, pay: { streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], lat: 0, lng: 0, scout, car } });
  const x = async (car: string, scout: string) => {
    const r = await dealFor(deps, { userId: "ann" }, input(car, scout));
    assert.ok(r.ok);
    return r.ok ? openToken("s", r.token)!.x : undefined;
  };
  let t = await x("roadster", "fox");
  assert.equal(t?.cr, undefined, "a car the account doesn't own is dropped");
  assert.equal(t?.fs, undefined, "a coat it doesn't own: no favorite");
  t = await x("roadster", "raccoon");
  assert.equal(t?.fs, 1, "the starting coat is everyone's");
  await sql`insert into wallet_ledger (user_id, op_key, detail) values ('ann', 'car:roadster', '{}'), ('ann', 'scout:fox', '{}')`;
  t = await x("roadster", "fox");
  assert.equal(t?.cr, "roadster");
  assert.equal(t?.fs, 1);
  const guest = await dealFor(deps, { userId: null }, input("roadster", "fox"));
  assert.ok(guest.ok && openToken("s", guest.token)!.x?.cr === undefined, "guests never carry a car perk to the server");
});
