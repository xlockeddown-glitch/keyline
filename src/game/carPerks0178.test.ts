// 0.1.178: Duesenberg Model J. 1,000,000 coin, pace 1.25 (+25% over the city cab), favorite History, factory 3-view
// only (no paint), and the Odometer: every 25th vault opened while seated in it pays +1 amber key. The count is the
// server's (grade rows in the ledger), lifetime, with no roll, and nothing a client sends can move it.
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
import { applyClientOp, awardGrade, grantCan, odometerOf, syncPlayer, type ClientOp } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { CAR_FAV, CAR_PERKS, ODOMETER_EVERY, hasOdometer, odometerPays, odometerText } from "./carPerks.ts";
import { CARS, carBoost, carOf, carPace, type CarId } from "./cars.ts";
import { CAR_COLORS, carSprite, colorOf, factoryColor, paintable, parseCan, rollCan } from "./carPaint.ts";
import { DealIn, provePerks } from "./triviaService.ts";
import { GradeIn } from "./triviaSchema.ts";
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
    lat: 30.27, lng: -97.77, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "",
    charmTopics: [], topic: "science", dealtAt: Date.now(), luckyHit: false, perfectBlue: false, prevNonce: "", ...over,
  };
}
const DUES = "duesenberg" as const;
const ODO = "Odometer +1 amber key";
const count = async (sql: Sql, id: string, like: string) =>
  Number((await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and detail like ${like}`)[0]?.n);
/** Grade rows that paid the Odometer key, and the once-only claim rows behind them. */
const paidRows = (sql: Sql, id: string) => count(sql, id, '%"odp":1%');
const claimRows = async (sql: Sql, id: string) =>
  Number((await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key like ${"odo:%"}`)[0]?.n);
const amber = async (sql: Sql, user: string) => (await canonicalWallet(sql, user)).wallet.keys.amber;
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

test("data: Duesenberg Model J — 1,000,000 coin, pace 1.25 (+25%), History favorite, in price order, no paint", () => {
  const d = carOf(DUES)!;
  assert.deepEqual([d.name, d.year, d.price, d.pace, d.star ?? false], ["Duesenberg Model J", "1929", 1_000_000, 1.25, false]);
  assert.equal(carPace(DUES), 1.25, "a multiplier on the city cab's speed: 1.00 is the cab");
  assert.equal(carBoost(d), "+25%");
  assert.equal(CAR_FAV.duesenberg, "history");
  const carFavs = Object.values(CAR_FAV);
  assert.equal(new Set(carFavs).size, carFavs.length, "no two cars share a favorite");
  // Price order still holds, and it sits between the Roadster and the Roadster 2.0.
  for (let i = 1; i < CARS.length; i++) assert.ok(CARS[i]!.price > CARS[i - 1]!.price && CARS[i]!.pace > CARS[i - 1]!.pace, CARS[i]!.id);
  const at = CARS.findIndex((c) => c.id === DUES);
  assert.deepEqual([CARS[at - 1]!.id, CARS[at + 1]!.id], ["roadster", "roadster2"]);
  // Factory 3-view only: no colours, so no can and no repaint.
  assert.deepEqual(CAR_COLORS.duesenberg, []);
  assert.equal(paintable(DUES), false);
  for (const c of CARS) if (c.id !== DUES) assert.equal(paintable(c.id), true, c.id);
  assert.equal(factoryColor(DUES), "");
  assert.equal(colorOf(DUES, "red"), null);
  assert.equal(parseCan("duesenberg:red"), null);
  assert.equal(parseCan("duesenberg:"), null);
  for (const view of ["side", "front", "back"] as const) {
    assert.equal(carSprite(DUES, view), `/sprites/cars/duesenberg-${view}.webp`);
    assert.equal(carSprite(DUES, view, "red"), `/sprites/cars/duesenberg-${view}.webp`, "a stray colour still shows the factory art");
  }
  // Every can the roll can ever hand out belongs to another car; the other eight keep their six colours each.
  const cans = new Set<string>();
  for (let i = 0; i < 4800; i++) cans.add(rollCan(i / 4800).car);
  assert.ok(!cans.has(DUES), "no Duesenberg can in the roll");
  assert.equal(cans.size, 8);
  assert.equal(rollCan(0.999999).car, "roadster2");
  // The perk.
  assert.equal(ODOMETER_EVERY, 25);
  assert.equal(CAR_PERKS.duesenberg.label, "Odometer · every 25th vault opened pays +1 amber key");
  assert.equal(hasOdometer(DUES), true);
  for (const c of CARS) if (c.id !== DUES) assert.equal(hasOdometer(c.id), false, c.id);
  assert.equal(hasOdometer(null), false);
});

test("odometerPays: counts 24 / 25 / 26 / 50, only in the Duesenberg, never at zero", () => {
  assert.equal(odometerPays(DUES, 24), false);
  assert.equal(odometerPays(DUES, 25), true);
  assert.equal(odometerPays(DUES, 26), false);
  assert.equal(odometerPays(DUES, 50), true);
  assert.equal(odometerPays(DUES, 0), false);
  assert.equal(odometerPays(DUES, -25), false);
  assert.equal(odometerPays(DUES, 25.5), false);
  assert.equal(odometerPays("roadster2", 25), false);
  assert.equal(odometerPays("belair57", 50), false);
  assert.equal(odometerPays(null, 25), false);
  assert.equal(odometerText(17), "Odometer 17/25");
  assert.equal(odometerText(25), "Odometer 0/25");
  assert.equal(odometerText(42), "Odometer 17/25");
  assert.equal(odometerText(0), "Odometer 0/25");
});

test("Odometer server flow: the 25th and 50th lit vault in the Duesenberg each pay exactly 1 amber key; a replay never pays twice; other cars and unseated grades don't count", async () => {
  const sql = await db();
  await syncPlayer(sql, "duke", snap, "duke-phone");
  await syncPlayer(sql, "ctrl", snap, "ctrl-phone");
  const { id } = await canonicalWallet(sql, "duke");
  // Not a vault opened in this car: a miss, a spark (no key spent), a blitz card, another car, and no car at all.
  const others = [
    ["miss", pay({ car: DUES, correct: false })],
    ["spark", pay({ car: DUES, clearTier: null, poiId: "spark-1" })],
    ["blitz", pay({ car: DUES, poiId: "blitz-1" })],
    ["civic", pay({ car: "civic" })],
    ["r2", pay({ car: "roadster2" })],
    ["walk", pay({})],
    ["null", pay({ car: null })],
  ] as const;
  // The control account makes every one of the same grades in a Civic, so the two pockets differ by the perk alone.
  const civic = <T extends { car?: CarId | null }>(p: T): T => (p.car === DUES ? { ...p, car: "civic" } : p);
  for (const [n, p] of others) {
    const r = await awardGrade(sql, "duke", `pre-${n}`, p);
    await awardGrade(sql, "ctrl", `pre-${n}`, civic(p));
    assert.ok(r.ok, n);
    assert.equal(r.odometer, undefined, n);
  }
  assert.equal(await odometerOf(sql, "duke"), 0, "none of those counted");

  // 50 lit vaults in the Duesenberg; the control account opens the same 50 in a Civic (same streak pay, no perk).
  const got: number[] = [];
  for (let i = 1; i <= 50; i++) {
    const city = i % 2 ? pay({ car: DUES }) : pay({ car: DUES, city: "chicago", poiId: "bean", lat: 41.88, lng: -87.62 });
    const plain = civic(city);
    const a = await awardGrade(sql, "duke", `v-${i}`, city);
    const c = await awardGrade(sql, "ctrl", `v-${i}`, plain);
    assert.ok(a.ok && c.ok);
    assert.equal(a.odometer, i, `vault ${i} carries count ${i}`);
    assert.equal(c.odometer, undefined);
    const extra = (a.award?.keys.amber ?? 0) - (c.award?.keys.amber ?? 0);
    assert.equal(extra, i % 25 === 0 ? 1 : 0, `vault ${i}: ${extra} extra amber`);
    assert.equal(a.award?.boosts.includes(ODO) ?? false, i % 25 === 0, `vault ${i} boost line`);
    if (extra) got.push(i);
    // Halfway to the first key: a grade in another car, an unseated one, a day passing and a miss change nothing.
    if (i === 12) {
      for (const who of ["duke", "ctrl"]) {
        await awardGrade(sql, who, "mid-civic", pay({ car: "civic" }));
        await awardGrade(sql, who, "mid-walk", pay({}));
      }
      await sql`update wallet_ledger set created_at = created_at - interval '26 hours'`;
      assert.equal(await odometerOf(sql, "duke"), 12, "the count is lifetime, not daily");
    }
    if (i === 25) {
      // The 25th nonce again (a retry, a second tab, another instance): the stored award, no second key.
      const before = await amber(sql, "duke");
      const again = await awardGrade(sql, "duke", "v-25", city);
      assert.equal(again.replay, true);
      assert.ok(again.award?.boosts.includes(ODO), "the replay reports what the first write paid");
      assert.equal(again.odometer, 25);
      assert.equal(await amber(sql, "duke"), before, "no second amber key");
      assert.equal(await paidRows(sql, id), 1);
      assert.equal(await claimRows(sql, id), 1);
      assert.equal(await odometerOf(sql, "duke"), 25);
    }
    if (i === 49) {
      // An old nonce replayed just before the next payout must not take the 50th's claim.
      const before = await amber(sql, "duke");
      await awardGrade(sql, "duke", "v-25", pay({ car: DUES }));
      await awardGrade(sql, "duke", "v-3", pay({ car: DUES }));
      assert.equal(await amber(sql, "duke"), before);
      assert.equal(await claimRows(sql, id), 1, "no odo:50 claim from a replay");
      assert.equal(await odometerOf(sql, "duke"), 49);
    }
  }
  assert.deepEqual(got, [25, 50], "exactly the 25th and the 50th");
  assert.equal(await paidRows(sql, id), 2);
  assert.equal(await claimRows(sql, id), 2);
  assert.equal(await odometerOf(sql, "duke"), 50);
  assert.equal((await amber(sql, "duke")) - (await amber(sql, "ctrl")), 2, "two amber keys over the control, no more");
  assert.equal(await odometerOf(sql, "ctrl"), 0);
  // The sync reply carries the same ledger count for the HUD text.
  assert.equal((await syncPlayer(sql, "duke", snap, "duke-phone")).odometer, 50);
  assert.equal((await syncPlayer(sql, "ctrl", snap, "ctrl-phone")).odometer, 0);
});

test("Odometer: two answers racing to the 25th count pay one amber key between them", async () => {
  const sql = await db();
  await syncPlayer(sql, "race", snap, "race-phone");
  const { id } = await canonicalWallet(sql, "race");
  for (let i = 1; i <= 24; i++) await awardGrade(sql, "race", `r-${i}`, pay({ car: DUES }));
  assert.equal(await odometerOf(sql, "race"), 24);
  const [a, b] = await Promise.all([awardGrade(sql, "race", "r-a", pay({ car: DUES })), awardGrade(sql, "race", "r-b", pay({ car: DUES }))]);
  assert.ok(a.ok && b.ok);
  const lines = [a, b].filter((r) => r.award?.boosts.includes(ODO)).length;
  assert.equal(lines, 1, "one of the two pays, never both");
  assert.equal(await paidRows(sql, id), 1);
  assert.equal(await claimRows(sql, id), 1);
  for (let i = 0; i < 3; i++) await awardGrade(sql, "race", `r-post-${i}`, pay({ car: DUES }));
  assert.equal(await paidRows(sql, id), 1, "and nothing more until the next 25th");
});

test("Odometer claim: a fresh claim held by another answer is respected; a stale one whose answer never landed is handed on", async () => {
  const sql = await db();
  for (const [who, ago, pays] of [["fresh", "5 seconds", false], ["stale", "10 minutes", true]] as const) {
    await syncPlayer(sql, who, snap, `${who}-phone`);
    const { id } = await canonicalWallet(sql, who);
    for (let i = 1; i <= 24; i++) await awardGrade(sql, who, `c-${i}`, pay({ car: DUES }));
    await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"odo:25"}, ${JSON.stringify({ g: "ghost", n: 25 })})`;
    await sql.query(`update wallet_ledger set created_at = now() - interval '${ago}' where user_id = $1 and op_key = 'odo:25'`, [id]);
    const r = await awardGrade(sql, who, "c-25", pay({ car: DUES }));
    assert.equal(r.odometer, 25, who);
    assert.equal(r.award?.boosts.includes(ODO) ?? false, pays, who);
    assert.equal(await paidRows(sql, id), pays ? 1 : 0, who);
    assert.equal(await claimRows(sql, id), 1, who);
  }
});

test("odometer counter cannot be incremented from the client", async () => {
  const sql = await db();
  await syncPlayer(sql, "eve", snap, "eve-phone");
  const { id } = await canonicalWallet(sql, "eve");
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"car:duesenberg"}, ${JSON.stringify({ car: DUES })})`;
  for (let i = 1; i <= 23; i++) await awardGrade(sql, "eve", `e-${i}`, pay({ car: DUES }));
  assert.equal(await odometerOf(sql, "eve"), 23);
  const amber0 = await amber(sql, "eve");
  const paid0 = await paidRows(sql, id);
  const unchanged = async (why: string) => {
    assert.equal(await odometerOf(sql, "eve"), 23, `${why}: stored count`);
    assert.equal(await amber(sql, "eve"), amber0, `${why}: amber keys`);
    assert.equal(await paidRows(sql, id), paid0, `${why}: payouts`);
    assert.equal(await claimRows(sql, id), 0, `${why}: claims`);
  };

  // (a) Client-supplied count fields are dropped by the request validators before any handler sees them…
  const forged = { odometer: 24, od: 24, odo: 24, odCount: 24, count: 24, odp: 1 };
  const g = GradeIn.parse({ token: "t".repeat(40), choice: "x", clientMs: 900, ...forged });
  assert.deepEqual(Object.keys(g).sort(), ["choice", "clientMs", "token"], "the answer request keeps token, choice and stopwatch only");
  const dealPay = { streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], lat: 30.27, lng: -97.77, car: DUES };
  const d = DealIn.parse({ city: "austin", cat: "science", poiId: "zilker", windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555", ...forged, pay: { ...dealPay, ...forged } });
  for (const k of Object.keys(forged)) {
    assert.ok(!(k in d), `deal request drops ${k}`);
    assert.ok(!(k in (d.pay ?? {})), `deal pay drops ${k}`);
  }
  // …and the grade write itself reads no such field: a forged count on the pay object is still vault 24, not 25.
  const sneaky = await awardGrade(sql, "eve", "e-24", { ...pay({ car: DUES }), ...forged, odometer: 24 } as never);
  assert.equal(sneaky.odometer, 24, "counted as the 24th, by the ledger");
  assert.ok(!sneaky.award?.boosts.includes(ODO), "no key from a forged count");
  assert.equal(await amber(sql, "eve"), amber0);
  await sql`delete from wallet_ledger where user_id = ${id} and op_key = ${"grade:e-24"}`;
  await unchanged("forged grade fields");
  // The save sync (the one bulk write a device has) cannot carry a count either.
  const synced = await syncPlayer(sql, "eve", { ...snap, ...forged, meta: forged, cities: { ...(snap.cities as object), ...forged } } as never, "eve-phone");
  assert.equal(synced.odometer, 23, "sync answers with the ledger count");
  await syncPlayer(sql, "eve", { ...snap, ...forged } as never, "eve-tablet");
  await unchanged("forged sync snapshot");
  assert.ok(!JSON.stringify((await canonicalWallet(sql, "eve")).wallet.meta).includes("odo"), "no odometer field on the wallet row");

  // (b) The count is read only from the server's own grade rows. A row of any other kind that says "od" is not one.
  for (const key of ["migrate:forged", "drive:austin", "odo:999", "op:odometer", "car:odometer"]) {
    await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${key}, ${JSON.stringify({ od: 999, odp: 1, g: "e-1", n: 999 })}) on conflict (user_id, op_key) do nothing`;
  }
  assert.equal(await odometerOf(sql, "eve"), 23, "only grade:* rows count");
  await sql`delete from wallet_ledger where user_id = ${id} and op_key in ('migrate:forged', 'drive:austin', 'odo:999', 'op:odometer', 'car:odometer')`;
  // A grade counts only with the car the server sealed into the deal, and it seals only a car this account owns.
  const ask = DealIn.parse({ city: "austin", cat: "science", poiId: "zilker", windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555", pay: dealPay });
  assert.equal((await provePerks(sql, "eve", ask)).car, DUES, "owned: sealed");
  await syncPlayer(sql, "mallory", snap, "mallory-phone");
  assert.equal((await provePerks(sql, "mallory", ask)).car, undefined, "claimed but not owned: not sealed");
  const unproven = await awardGrade(sql, "mallory", "m-1", pay({ car: null }));
  assert.equal(unproven.odometer, undefined);
  assert.equal(await odometerOf(sql, "mallory"), 0);
  const service = src("./triviaService.ts");
  assert.match(service, /car: isCarId\(x\?\.cr\) \? x\.cr : null,/, "the grade's car comes from the sealed token");
  assert.match(service, /\.\.\.\(proven\.car \? \{ cr: proven\.car \} : \{\}\)/, "and the token's car from the ownership proof");

  // (c) No client-callable op sets or bumps it: the op allow-list has no such kind, and unknown kinds are refused.
  const api = src("./walletApi.ts");
  const kinds = [...api.matchAll(/kind: z\.literal\("([A-Za-z]+)"\)/g)].map((m) => m[1]!);
  assert.ok(kinds.length > 30 && kinds.includes("car") && kinds.includes("paint"), "read the op allow-list");
  for (const k of kinds) assert.doesNotMatch(k, /odo|odometer|mileage/i, `op ${k}`);
  assert.match(api, /const Op = z\.discriminatedUnion\("kind", \[/, "ops are a closed union: any other kind fails the validator");
  assert.match(api, /\.validator\(\(u: unknown\) => Op\.parse\(u\)\)/);
  const reqSide = api.slice(api.indexOf("const Snap = z.object({"), api.indexOf("export type WalletWire"));
  assert.ok(reqSide.length > 2000);
  assert.doesNotMatch(reqSide, /odometer|\bodo?\b/i, "no request schema (save snapshot or op) has an odometer field");
  const apply = src("./walletApply.ts");
  const clientOps = apply.slice(apply.indexOf("export type ClientOp ="), apply.indexOf("export type ClientResult"));
  assert.ok(clientOps.length > 500);
  assert.doesNotMatch(clientOps, /odometer|\bodo?\b/i, "no ClientOp names it");
  for (const op of [{ kind: "odometer", count: 24 }, { kind: "odo", n: 24 }, { kind: "odometer", od: 24, car: DUES }, { kind: "car", id: "odometer" }, { kind: "wear", slot: "car", id: DUES, odometer: 24 }]) {
    let r: Awaited<ReturnType<typeof applyClientOp>> | null = null;
    try {
      r = await applyClientOp(sql, "eve", op as unknown as ClientOp);
    } catch {
      r = null;
    }
    if (op.kind !== "wear") assert.ok(!r || !r.ok, `${JSON.stringify(op)} is refused`);
    await unchanged(JSON.stringify(op));
  }
  // The device never counts either: the store only takes the number from server replies and never saves it.
  const store = src("./store.ts");
  assert.doesNotMatch(store, /odometer: s\.odometer|saved\?\.odometer|odometer \+ 1|odometer\+\+/, "not in the save, not incremented locally");
  assert.match(store, /if \(typeof res\.odometer === "number"\)/);

  // After all of that the honest 24th and 25th vaults behave exactly as they should have.
  const v24 = await awardGrade(sql, "eve", "e-24", pay({ car: DUES }));
  assert.equal(v24.odometer, 24);
  assert.ok(!v24.award?.boosts.includes(ODO));
  const v25 = await awardGrade(sql, "eve", "e-25", pay({ car: DUES }));
  assert.equal(v25.odometer, 25);
  assert.ok(v25.award?.boosts.includes(ODO));
  assert.equal(await paidRows(sql, id), paid0 + 1);
});

test("no paint for the Duesenberg on the server: a can never rolls for it and the repaint op is refused", async () => {
  const sql = await db();
  await syncPlayer(sql, "lot", { ...snap, coins: 5_000_000 }, "lot-phone");
  const { id } = await canonicalWallet(sql, "lot");
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"car:duesenberg"}, ${JSON.stringify({ car: DUES })})`;
  for (let i = 0; i < 200; i++) {
    const can = await grantCan(sql, "lot", `t:${i}`, 1, 0, i / 200);
    assert.ok(can && can.car !== DUES, `pick ${i}`);
  }
  const coins = (await canonicalWallet(sql, "lot")).wallet.coins;
  // Even a forged can row for it is not a can, and painting it is refused without charging.
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"can:forged"}, ${JSON.stringify({ can: "duesenberg:red" })})`;
  for (const color of ["red", "black", "sig", "burgundy", ""]) {
    let ok = false;
    try {
      ok = (await applyClientOp(sql, "lot", { kind: "paint", car: DUES, color })).ok;
    } catch {
      ok = false;
    }
    assert.equal(ok, false, `paint ${color}`);
  }
  assert.equal((await canonicalWallet(sql, "lot")).wallet.coins, coins, "nothing charged");
  assert.equal((await syncPlayer(sql, "lot", snap, "lot-phone")).owned?.paint?.duesenberg, undefined);
  assert.ok(!(await syncPlayer(sql, "lot", snap, "lot-phone")).owned?.cans?.some((c) => c.startsWith("duesenberg")), "no Duesenberg can in the satchel");
  // The showroom offers no repaint for a car that is not paintable.
  const showroom = src("../components/keyline/Showroom.tsx");
  assert.match(showroom, /\{paintable\(c\.id\) \? \(\s*<button[^>]*?data-testid=\{`paint-\$\{c\.id\}`\}/s);
  assert.match(showroom, /mine && paintable\(c\.id\) && painting === c\.id/);
  // And the odometer text is plain HUD text beside the car chip, never a piece laid on the sprite.
  const hud = src("../components/keyline/Hud.tsx");
  assert.match(hud, /hud\.seated && hasOdometer\(carOn\) && odometer != null/);
  const css = src("../styles.css");
  assert.doesNotMatch(css, /\.cab-sprite[^{]*odo|\.odo-chip[^{]*\.cab-sprite/, "no odometer rule touches the car sprite");
  const map = src("../components/keyline/GameMap.tsx");
  assert.doesNotMatch(map, /odometer|odo-chip/i, "the map pawn never draws it");
});
