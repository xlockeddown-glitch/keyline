// 0.1.116 Random: the server rolls the field (any field, Math only under the 43% offer rule), seals the pick in the
// token, and pays +10% itself; the Penguin's favorite is Random (+15% more), all inside the +40% cap; no Random at Hearths.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { ALL_CATS, MATH_OFFER_KEEP, keepsMath, randomCat } from "./triviaMeta.ts";
import { CAT_BONUS_CAP, RANDOM_BONUS, SCOUT_FAV, catBoost, cotdAt, perkFavs } from "./carPerks.ts";
import { DealIn, deal, openToken, type TriviaDeps } from "./triviaService.ts";
import { sealPlate } from "./rarity.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { GradePay, LocalSnap } from "./wallet.ts";
import { canonicalWallet } from "./walletSql.ts";
import { awardGrade, syncPlayer } from "./walletApply.ts";
import type { Poi, Tier, TriviaCat } from "./types.ts";

test("randomCat: every field comes up; Math only where the vault-offer rule keeps it, so never more than the normal mix", () => {
  const seen = new Map<TriviaCat, number>();
  const N = 28_000;
  let s = 7;
  const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
  for (let i = 0; i < N; i++) {
    const seed = `lamp#random#${i}`;
    const c = randomCat(rnd(), seed);
    if (c === "math") assert.ok(keepsMath(seed), "Math only when the 43% rule keeps it");
    seen.set(c, (seen.get(c) ?? 0) + 1);
  }
  assert.deepEqual([...seen.keys()].sort(), [...ALL_CATS].sort(), "dealt from any category");
  const math = (seen.get("math") ?? 0) / N;
  assert.ok(Math.abs(math - MATH_OFFER_KEEP / ALL_CATS.length) < 0.008, `math share ${math}`);
  for (const c of ALL_CATS.filter((x) => x !== "math")) assert.ok(Math.abs((seen.get(c) ?? 0) / N - 1 / ALL_CATS.length) < 0.012, c);
});

test("catBoost: Random +10%; Penguin (favors Random) +25% total; never the category of the day; cap +40%", () => {
  const at = Date.UTC(2026, 10, 3, 18);
  assert.equal(RANDOM_BONUS, 0.1);
  assert.equal(SCOUT_FAV.lynx, "random");
  assert.ok(Math.abs(catBoost("random", [], at).x - 1.1) < 1e-9);
  const penguin = perkFavs("lynx", true, null);
  assert.deepEqual(penguin, ["random"]);
  assert.ok(Math.abs(catBoost("random", penguin, at).x - 1.25) < 1e-9);
  assert.deepEqual(catBoost("random", penguin, at).labels, ["Random +10%", "Favorite +15%"]);
  // Penguin + a car that favors the dealt field: favorites match the pick (Random), not the rolled field.
  assert.ok(Math.abs(catBoost("random", perkFavs("lynx", true, "civic"), at).x - 1.25) < 1e-9);
  // Unproven coat: Random alone.
  assert.ok(Math.abs(catBoost("random", perkFavs("lynx", false, null), at).x - 1.1) < 1e-9);
  // The Penguin no longer favors Music.
  assert.equal(catBoost("music", penguin, at).x, catBoost("music", [], at).x);
  // Cap: even two Random favorites (+25%) on Random (+10%) stays at or below +40%; any field too.
  for (const t of [...ALL_CATS, "random" as const]) for (const f of [[], ["random"], ["random", "random"], [t, t]] as const) assert.ok(catBoost(t, f, at).x <= 1 + CAT_BONUS_CAP + 1e-9, t);
  assert.notEqual(cotdAt(at), "random");
});

const CARD = sealPlate({ q: "Which river runs through Austin?", choices: ["Colorado", "Brazos", "Pecos", "Trinity"], answer: "Colorado", diff: 2 });
const LAMP: Poi = { id: "ut-tower", name: "UT Tower", lat: 30.28, lng: -97.74, kind: "campus", tier: "blue", lore: "" };
const deps = (picked: string[], r = 0.42): TriviaDeps => ({
  now: () => 1_000_000, secret: "s", rand: () => r,
  pick: (_c, cat) => (picked.push(cat), CARD), card: () => CARD,
  namedPoi: (_c, id) => (id === LAMP.id ? LAMP : null), series: () => null,
});
const input = (over: object) => DealIn.parse({ city: "austin", cat: "local", poiId: LAMP.id, windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555", ...over });

test("deal: Random is rolled and sealed by the server; a client can't claim it (or its boost) on a normal pick", () => {
  for (const r of [0, 0.2, 0.55, 0.99]) {
    const picked: string[] = [];
    const d = deal(deps(picked, r), { userId: null }, input({ cat: "random" }));
    assert.ok(d.ok);
    if (!d.ok) return;
    const x = openToken("s", d.token)!.x!;
    assert.equal(x.rn, 1);
    assert.ok((ALL_CATS as string[]).includes(x.cat), x.cat);
    assert.deepEqual(picked, [x.cat], "the bank is asked for a real field, never 'random'");
  }
  // Extra pay claims are stripped by the schema; only cat "random" sets the sealed flag.
  const parsed = input({ cat: "local", pay: { random: true, rn: 1, favs: ["random"], streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], lat: 0, lng: 0 } });
  const d = deal(deps([]), { userId: null }, parsed);
  assert.ok(d.ok);
  if (d.ok) assert.equal(openToken("s", d.token)!.x!.rn, undefined);
  assert.equal(DealIn.safeParse({ ...parsed, cat: "surprise" }).success, false);
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

test("awardGrade: the server pays Random +10%, the Penguin's Random +25%, from the sealed flag and proven favorites", async () => {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(readFileSync(new URL(`../../migrations/${m}`, import.meta.url), "utf8"));
  const sql = sqlOf(pg);
  const snap = (): LocalSnap => ({ coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } });
  const at = Date.UTC(2026, 10, 3, 18);
  // A field that isn't today's category, so only Random / favorites move the coin.
  const topic = ALL_CATS.find((c) => c !== cotdAt(at))!;
  const pay = (over: Partial<GradePay>) => ({ correct: true, elapsedMs: 2000, mult: 1, city: "austin" as const, diff: 2 as const, clearTier: "amber" as Tier, poiTier: "amber" as Tier, poiId: "ut-tower", lat: 30.28, lng: -97.74, series: null, step: 0, steps: 1, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], topic, dealtAt: at, luckyHit: false, perfectBlue: false, prevNonce: "", ...over });
  const coin = async (u: string, over: Partial<GradePay>) => {
    await syncPlayer(sql, u, snap(), `${u}-phone1`);
    const before = (await canonicalWallet(sql, u)).wallet.coins;
    await awardGrade(sql, u, `${u}-n1`, pay(over));
    return (await canonicalWallet(sql, u)).wallet.coins - before;
  };
  const base = await coin("plain", {});
  const rand = await coin("rand", { random: true });
  const peng = await coin("peng", { random: true, favs: ["random"] });
  const pengField = await coin("pengf", { favs: ["random"] });
  assert.ok(base > 100, `base ${base}`);
  assert.ok(Math.abs(rand / base - 1.1) < 0.02, `random ${rand} vs ${base}`);
  assert.ok(Math.abs(peng / base - 1.25) < 0.02, `penguin ${peng} vs ${base}`);
  assert.equal(pengField, base, "the Penguin's favorite only pays on a Random pick");
});

test("Hearth vaults offer no Random: the picker hides it and the server refuses a Random deal there", async () => {
  const { hearthCatOk } = await import("./hearthVaults.ts");
  assert.equal(hearthCatOk(["local", "history", "science", "math"], "random"), false);
  assert.equal(hearthCatOk(["local", "history", "science", "music"], "random"), false);
  const src = readFileSync(new URL("../components/keyline/VaultModal.tsx", import.meta.url), "utf8");
  assert.match(src, /\{hearth \? null : \(\s*<button[^>]*data-testid="field-random"/);
});
