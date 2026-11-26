// 0.1.179: VW Microbus (1967). 70,000 coin, pace 1.09 (+9% over the city cab), favorite Music, factory 3-view only
// (no paint), and Encore: a failed vault pays back floor(20% of that color's base ladder coin), 20 a day. A failed
// vault is a server-graded wrong answer on a lit vault while seated in the Microbus the server sealed into the deal.
// The day is the America/Chicago calendar day. The count is the server's (grade rows in the ledger); nothing a
// client sends can move it.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { GradePay, LocalSnap } from "./wallet.ts";
import { applyClientOp, awardGrade, encoreOf, grantCan, syncPlayer, type ClientOp } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { CAR_FAV, CAR_PERKS, ENCORE_DAY_CAP, ENCORE_RATE, encoreLine, encorePays, encoreText, encoreToday, hasEncore } from "./carPerks.ts";
import { CARS, carBoost, carOf, carPace, type CarId } from "./cars.ts";
import { CAR_COLORS, carSprite, colorOf, factoryColor, paintable, parseCan, rollCan } from "./carPaint.ts";
import { TIER_ORDER, TIER_VALUE } from "./rewards.ts";
import { sealPlate } from "./rarity.ts";
import { DealIn, deal, dealFor, grade, openToken, provePerks, publicCardId, resetGradeRing, type TriviaDeps } from "./triviaService.ts";
import { GradeIn } from "./triviaSchema.ts";
import type { Poi, Tier, TriviaQ } from "./types";
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
// The in-memory Postgres reads the same pinned clock, and a clock jump leaves it holding a long internal timer that
// keeps the process alive after the tests. Each test's database is closed when the test ends.
const opened: PGlite[] = [];
afterEach(async () => {
  for (const pg of opened.splice(0)) await pg.close();
});
async function db(extra: string[] = []) {
  const pg = new PGlite();
  opened.push(pg);
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql", ...extra]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };
type Pay = Omit<GradePay, "prior"> & { prevNonce: string; car?: CarId | null; timedOut?: boolean; struck?: boolean };
function pay(over: Partial<Pay> = {}): Pay {
  return {
    correct: true, elapsedMs: 5000, mult: 1, city: "austin", diff: 2, clearTier: "green", poiTier: "green", poiId: "zilker",
    lat: 30.27, lng: -97.77, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "",
    charmTopics: [], topic: "science", dealtAt: Date.now(), luckyHit: false, perfectBlue: false, prevNonce: "", ...over,
  };
}
const BUS = "microbus" as const;
/** A failed lit vault in the Microbus: a wrong answer on a card that spent a key. */
const fail = (over: Partial<Pay> = {}) => pay({ correct: false, car: BUS, ...over });
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const coinsOf = async (sql: Sql, user: string) => (await canonicalWallet(sql, user)).wallet.coins;
/** Grade rows flagged as an Encore pay: the only thing the daily cap counts. */
const enRows = async (sql: Sql, id: string) =>
  Number((await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${id} and op_key like ${"grade:%"} and detail like ${'%"en":1%'}`)[0]?.n);
const hasLine = (r: { award?: { boosts: string[] } }) => (r.award?.boosts ?? []).some((b) => b.startsWith("Encore"));

// The server reads its own clock for the Chicago day. The tests pin that clock, and stamp each grade row with it.
// 2025-11-25/26 is Central Standard Time (UTC-6): midnight CT on the 26th is 06:00Z. The pinned days are in the past
// on purpose: a pinned clock ahead of the real one leaves the database driver waiting on a timer after the tests.
const ct = (day: number, h: number, m = 0) => Date.UTC(2025, 10, day, h + 6, m);
const NOON = ct(25, 12);
beforeEach(() => mock.timers.enable({ apis: ["Date"], now: NOON }));
afterEach(() => mock.timers.reset());
/** One grade at server time `at`, with its ledger row stamped at that time. */
async function gradeAt(sql: Sql, who: string, nonce: string, at: number, p: Pay) {
  mock.timers.setTime(at);
  const r = await awardGrade(sql, who, nonce, p);
  const { id } = await canonicalWallet(sql, who);
  await sql`update wallet_ledger set created_at = ${new Date(at).toISOString()} where user_id = ${id} and op_key = ${"grade:" + nonce}`;
  return r;
}
const dayIn = (zone: string, at: number) => new Date(at).toLocaleDateString("en-CA", { timeZone: zone });

test("data: VW Microbus — 70,000 coin, pace 1.09 (+9%), Music favorite, in price order, no paint colours or cans", () => {
  const b = carOf(BUS)!;
  assert.deepEqual([b.name, b.year, b.price, b.pace, b.star ?? false], ["VW Microbus", "1967", 70_000, 1.09, false]);
  assert.equal(b.blurb, "Teal and white, whitewalls, room for everyone.");
  assert.equal(carPace(BUS), 1.09, "a multiplier on the city cab's speed: 1.00 is the cab");
  assert.equal(carBoost(b), "+9%");
  assert.equal(CAR_FAV.microbus, "music");
  const carFavs = Object.values(CAR_FAV);
  assert.equal(new Set(carFavs).size, carFavs.length, "no two cars share a favorite");
  // CARS sorted by price still holds (and by pace), and it sits between the F-150 and the Ioniq 5.
  for (let i = 1; i < CARS.length; i++) assert.ok(CARS[i]!.price > CARS[i - 1]!.price && CARS[i]!.pace > CARS[i - 1]!.pace, CARS[i]!.id);
  const at = CARS.findIndex((c) => c.id === BUS);
  assert.deepEqual([CARS[at - 1]!.id, CARS[at + 1]!.id], ["f150", "ioniq5"]);
  assert.deepEqual(CARS.map((c) => c.id), ["civic", "f150", "microbus", "ioniq5", "mustang", "belair57", "model3", "roadster", "duesenberg", "roadster2"]);
  // Every other car's numbers are as they were.
  assert.deepEqual(
    CARS.filter((c) => c.id !== BUS).map((c) => [c.id, c.price, c.pace]),
    [["civic", 30_000, 1.05], ["f150", 50_000, 1.08], ["ioniq5", 90_000, 1.1], ["mustang", 150_000, 1.15], ["belair57", 200_000, 1.17], ["model3", 350_000, 1.2], ["roadster", 600_000, 1.22], ["duesenberg", 1_000_000, 1.25], ["roadster2", 2_400_000, 1.3]],
  );
  // Factory 3-view only: no colours, so no can and no repaint.
  assert.deepEqual(CAR_COLORS.microbus, []);
  assert.equal(paintable(BUS), false);
  assert.equal(factoryColor(BUS), "");
  assert.equal(colorOf(BUS, "red"), null);
  assert.equal(parseCan("microbus:red"), null);
  assert.equal(parseCan("microbus:teal"), null);
  for (const view of ["side", "front", "back"] as const) {
    assert.equal(carSprite(BUS, view), `/sprites/cars/microbus-${view}.webp`);
    assert.equal(carSprite(BUS, view, "red"), `/sprites/cars/microbus-${view}.webp`, "a stray colour still shows the factory art");
  }
  const cans = new Set<string>();
  for (let i = 0; i < 4800; i++) cans.add(rollCan(i / 4800).car);
  assert.ok(!cans.has(BUS), "no Microbus can in the roll");
  assert.equal(cans.size, 8, "the eight painted cars keep theirs");
  // The stylesheet: three factory views, no paint rule, nothing drawn on the sprite.
  const css = src("../styles.css");
  for (const [face, view] of [["down", "front"], ["up", "back"], ["left", "side"], ["right", "side"]] as const) {
    assert.match(css, new RegExp(`\\.cab-sprite\\[data-car="microbus"\\]\\[data-face="${face}"\\][^{]*\\{ background-image: url\\("/sprites/cars/microbus-${view}\\.webp"\\); \\}`), face);
  }
  assert.doesNotMatch(css, /data-car="microbus"\]\[data-paint/);
  // The perk.
  assert.equal(ENCORE_RATE, 0.2);
  assert.equal(ENCORE_DAY_CAP, 20);
  assert.equal(CAR_PERKS.microbus.label, "Encore · a failed vault pays back 20% of its base coin (20 a day)");
  assert.equal(hasEncore(BUS), true);
  for (const c of CARS) if (c.id !== BUS) assert.equal(hasEncore(c.id), false, c.id);
  assert.equal(hasEncore(null), false);
  assert.equal(hasEncore(undefined), false);
});

test("encorePays: floor rounding, zero below 5, the 20-a-day cap, only in the Microbus", () => {
  // pay = Math.floor(0.20 * base)
  assert.equal(encorePays(BUS, 7, 0), 1);
  assert.equal(encorePays(BUS, 12, 0), 2);
  assert.equal(encorePays(BUS, 19, 0), 3);
  assert.equal(encorePays(BUS, 5, 0), 1);
  assert.equal(encorePays(BUS, 4, 0), 0);
  assert.equal(encorePays(BUS, 0, 0), 0);
  assert.equal(encorePays(BUS, -50, 0), 0);
  assert.equal(encorePays(BUS, Number.NaN, 0), 0);
  for (let base = 0; base <= 8000; base++) {
    const got = encorePays(BUS, base, 0);
    assert.ok(Number.isInteger(got) && got === Math.floor(base / 5), `base ${base}`);
  }
  // The real ladder: white 6, blue 18, green 54, amber 162, red 486, violet 1,458.
  assert.deepEqual(TIER_ORDER.map((t) => encorePays(BUS, TIER_VALUE[t], 0)), [6, 18, 54, 162, 486, 1458]);
  // Cap: the 20th pays, the 21st does not.
  assert.equal(encorePays(BUS, 270, 19), 54);
  assert.equal(encorePays(BUS, 270, 20), 0);
  assert.equal(encorePays(BUS, 270, 21), 0);
  assert.equal(encorePays(BUS, 270, -1), 0, "a nonsense count never pays");
  assert.equal(encorePays(BUS, 270, 1.5), 0);
  // Seat.
  for (const c of CARS) if (c.id !== BUS) assert.equal(encorePays(c.id, 270, 0), 0, c.id);
  assert.equal(encorePays(null, 270, 0), 0);
  assert.equal(encorePays(undefined, 270, 0), 0);
  // The lines.
  assert.equal(encoreLine(54), "Encore +54 coin");
  assert.equal(encoreText(3), "Encore 3/20");
  assert.equal(encoreText(0), "Encore 0/20");
  assert.equal(encoreText(25), "Encore 20/20");
  assert.equal(encoreToday({ used: 3, day: "2025-11-25" }, NOON), 3);
  assert.equal(encoreToday({ used: 3, day: "2025-11-25" }, ct(26, 0, 1)), 0, "yesterday's count shows as a fresh day");
  assert.equal(encoreToday(null, NOON), 0);
});

test("Encore server flow: a failed lit vault seated in the Microbus pays exactly floor(0.2 * base) per color; every other miss is as before", async () => {
  const sql = await db();
  await syncPlayer(sql, "bus", snap, "bus-phone");
  await syncPlayer(sql, "ctrl", snap, "ctrl-phone");
  const { id } = await canonicalWallet(sql, "bus");
  const want: Record<Tier, number> = { white: 6, blue: 18, green: 54, amber: 162, red: 486, violet: 1458 };
  let n = 0;
  for (const tier of TIER_ORDER) {
    assert.equal(want[tier], Math.floor(0.2 * TIER_VALUE[tier]), tier);
    const before = await coinsOf(sql, "bus");
    // Modifiers that move a right answer's coin (streak, coat loot, market time, a Hearth step) do not move the base.
    const p = fail({ clearTier: tier, poiTier: tier, streak: 9, loot: 1.1, mult: 1, elapsedMs: 900 });
    const r = await gradeAt(sql, "bus", `c-${tier}`, NOON + n * 1000, p);
    const c = await gradeAt(sql, "ctrl", `c-${tier}`, NOON + n * 1000, { ...p, car: "civic" });
    const walk = await gradeAt(sql, "ctrl", `w-${tier}`, NOON + n * 1000, { ...p, car: null });
    n++;
    assert.ok(r.ok && c.ok && walk.ok);
    assert.deepEqual(r.award, { coins: want[tier], keys: {}, boosts: [`Encore +${want[tier]} coin`] }, tier);
    assert.equal((await coinsOf(sql, "bus")) - before, want[tier], `${tier}: the pocket grew by exactly the pay`);
    assert.deepEqual(r.encore, { used: n, day: "2025-11-25" });
    // The same miss in another car, and on foot: nothing paid, no line, no flag, no count in the reply.
    for (const o of [c, walk]) {
      assert.deepEqual(o.award, { coins: 0, keys: {}, boosts: [] }, tier);
      assert.equal(o.encore, undefined);
      assert.ok(!String(o.detail).includes('"en"'));
    }
  }
  assert.equal(await coinsOf(sql, "ctrl"), 0);
  assert.equal(await coinsOf(sql, "bus"), 6 + 18 + 54 + 162 + 486 + 1458);
  assert.equal(await enRows(sql, id), 6);
  // A Hearth step's tier is the vault color that pays.
  const hearth = await gradeAt(sql, "bus", "hearth", NOON + 60_000, fail({ poiId: "placed-1", clearTier: "green", poiTier: "amber", hearth: { v: 2, step: 1 } }));
  assert.equal(hearth.award?.coins, 162);
  // A miss whose key a Shell coat handed back keeps that, and Encore adds its own line beside it.
  const shell = await gradeAt(sql, "bus", "shell", NOON + 61_000, fail({ shellBack: true }));
  const shellCtrl = await gradeAt(sql, "ctrl", "shell", NOON + 61_000, fail({ shellBack: true, car: "civic" }));
  assert.deepEqual(shellCtrl.award, { coins: 0, keys: { green: 1 }, boosts: ["Shell: key back"] }, "unchanged for another car");
  assert.deepEqual(shell.award, { coins: 54, keys: { green: 1 }, boosts: ["Shell: key back", "Encore +54 coin"] });
  // The sync reply carries the same ledger count for the HUD text.
  mock.timers.setTime(NOON + 120_000);
  assert.deepEqual((await syncPlayer(sql, "bus", snap, "bus-phone")).encore, { used: 8, day: "2025-11-25" });
  assert.deepEqual((await syncPlayer(sql, "ctrl", snap, "ctrl-phone")).encore, { used: 0, day: "2025-11-25" });
});

test("Encore cap: 20 fails in a Chicago day pay, the 21st pays nothing; a replay of a paid nonce does not pay twice", async () => {
  const sql = await db();
  await syncPlayer(sql, "cap", snap, "cap-phone");
  const { id } = await canonicalWallet(sql, "cap");
  for (let i = 1; i <= 20; i++) {
    const r = await gradeAt(sql, "cap", `f-${i}`, NOON + i * 60_000, fail());
    assert.equal(r.award?.coins, 54, `fail ${i} pays`);
    assert.deepEqual(r.award?.boosts, ["Encore +54 coin"]);
    assert.deepEqual(r.encore, { used: i, day: "2025-11-25" });
    if (i === 5) {
      // The same nonce again (a retry, a second tab, another instance): the stored award, no second pay.
      const before = await coinsOf(sql, "cap");
      const again = await awardGrade(sql, "cap", "f-5", fail());
      assert.equal(again.replay, true);
      assert.deepEqual(again.award, r.award, "the replay reports what the first write paid");
      assert.equal(await coinsOf(sql, "cap"), before, "no second pay");
      assert.equal(await enRows(sql, id), 5);
      assert.deepEqual(again.encore, { used: 5, day: "2025-11-25" });
      // Even replayed as a different answer to a different vault.
      const twist = await awardGrade(sql, "cap", "f-5", fail({ poiTier: "violet", clearTier: "violet" }));
      assert.equal(twist.replay, true);
      assert.equal(await coinsOf(sql, "cap"), before);
    }
  }
  assert.equal(await coinsOf(sql, "cap"), 20 * 54);
  assert.equal(await enRows(sql, id), 20);
  const v21 = await gradeAt(sql, "cap", "f-21", NOON + 21 * 60_000, fail());
  assert.ok(v21.ok);
  assert.deepEqual(v21.award, { coins: 0, keys: {}, boosts: [] }, "the 21st qualifying fail pays nothing");
  assert.deepEqual(v21.encore, { used: 20, day: "2025-11-25" });
  const v22 = await gradeAt(sql, "cap", "f-22", NOON + 22 * 60_000, fail({ poiTier: "violet", clearTier: "violet" }));
  assert.equal(v22.award?.coins, 0);
  assert.equal(await coinsOf(sql, "cap"), 20 * 54);
  assert.equal(await enRows(sql, id), 20);
  // A paid nonce replayed once the cap is spent still reports its own pay and adds nothing.
  const late = await awardGrade(sql, "cap", "f-20", fail());
  assert.equal(late.replay, true);
  assert.deepEqual(late.award?.boosts, ["Encore +54 coin"]);
  assert.equal(await coinsOf(sql, "cap"), 20 * 54);
});

test("encore pays nothing for timeout, abandon, Autopilot and scout-strike misses, blitz cards, a correct answer or a spark; a base below 5 does not consume a slot", async () => {
  const sql = await db();
  await syncPlayer(sql, "no", snap, "no-phone");
  const { id } = await canonicalWallet(sql, "no");
  const none = [
    ["timeout: the wick ran out, no answer", fail({ timedOut: true })],
    ["scout strike: a wrong answer on a card the Fox struck an option from", fail({ struck: true, scout: "fox", poiTier: "red", clearTier: "red" })],
    ["Autopilot strike on the card", fail({ struck: true })],
    ["blitz card", fail({ poiId: "blitz-3" })],
    ["blitz card, no key", fail({ poiId: "blitz-3", clearTier: null })],
    ["spark miss (no key held)", fail({ clearTier: null, poiId: "spark-1" })],
  ] as const;
  let n = 0;
  for (const [why, p] of none) {
    const r = await gradeAt(sql, "no", `none-${n++}`, NOON + n * 1000, p);
    assert.ok(r.ok, why);
    assert.equal(r.award?.coins ?? 0, 0, why);
    assert.ok(!hasLine(r), why);
    assert.ok(!String(r.detail).includes('"en"'), why);
  }
  // A correct answer never triggers Encore (it pays as a right answer does, with no Encore line or flag)…
  const right = await gradeAt(sql, "no", "right", NOON + 30_000, pay({ car: BUS }));
  const rightCivic = await gradeAt(sql, "no", "right-civic", NOON + 31_000, pay({ car: "civic", poiId: "barton" }));
  assert.ok(right.ok && (right.award?.coins ?? 0) > 0);
  assert.ok(!hasLine(right) && !String(right.detail).includes('"en"'));
  assert.equal(right.encore, undefined);
  assert.ok(rightCivic.ok);
  // …nor does a right spark.
  const spark = await gradeAt(sql, "no", "spark-right", NOON + 32_000, pay({ car: BUS, clearTier: null, poiTier: "white", poiId: "spark-2" }));
  assert.ok(!hasLine(spark) && !String(spark.detail).includes('"en"'));
  assert.equal(await enRows(sql, id), 0, "none of those took a daily slot");
  assert.deepEqual(await encoreOf(sql, "no"), { used: 0, day: "2025-11-25" });

  // Abandon / closed card: the walk-away refunds the key through its own op and never writes a grade, so there is
  // no wrong answer to pay. The refund op is the only thing the device sends, and it carries no award.
  const coins0 = await coinsOf(sql, "no");
  const back = await applyClientOp(sql, "no", { kind: "refund", token: "not-a-real-token" } as unknown as ClientOp).catch(() => null);
  assert.ok(!back || !hasLine(back as never));
  assert.equal(await coinsOf(sql, "no"), coins0);
  assert.equal(await enRows(sql, id), 0);
  const store = src("./store.ts");
  assert.match(store, /if \(token\) pushOp\(\{ kind: "refund", token \}\);/, "closing a card sends the refund op, not a grade");
  // The grade service is where the three server facts come from: its clock and its sealed token, not the request.
  const service = src("./triviaService.ts");
  assert.match(service, /timedOut: timedOut \|\| elapsedMs > t\.w \+ LATE_GRACE_MS,/);
  assert.match(service, /struck: x\?\.st === 1,/);
  assert.match(service, /\.\.\.\(struck \? \{ st: 1 as const \} : \{\}\)/);
  assert.match(service, /if \(signedIn && \(credited \|\| replay\) && deps\.sql && !blitz\) \{/, "blitz cards never reach the grade write");

  // A base below 5 floors to 0: nothing paid, no flag, no slot. (The real ladder starts at 30; lower it for one grade.)
  const white = TIER_VALUE.white;
  try {
    TIER_VALUE.white = 4;
    const tiny = await gradeAt(sql, "no", "tiny", NOON + 40_000, fail({ poiTier: "white", clearTier: "white" }));
    assert.deepEqual(tiny.award, { coins: 0, keys: {}, boosts: [] });
    assert.ok(!String(tiny.detail).includes('"en"'));
    assert.deepEqual(tiny.encore, { used: 0, day: "2025-11-25" });
    TIER_VALUE.white = 7;
    const one = await gradeAt(sql, "no", "seven", NOON + 41_000, fail({ poiTier: "white", clearTier: "white" }));
    assert.deepEqual(one.award, { coins: 1, keys: {}, boosts: ["Encore +1 coin"] }, "base 7 pays 1");
    assert.deepEqual(one.encore, { used: 1, day: "2025-11-25" });
  } finally {
    TIER_VALUE.white = white;
  }
  assert.equal(await enRows(sql, id), 1);
  // With the 20 slots intact after all of the above, 19 more honest fails pay and the next does not.
  for (let i = 0; i < 19; i++) assert.equal((await gradeAt(sql, "no", `h-${i}`, NOON + 50_000 + i * 1000, fail())).award?.coins, 54, `honest ${i}`);
  assert.equal((await gradeAt(sql, "no", "h-over", NOON + 90_000, fail())).award?.coins, 0);
});

test("Encore end to end: the grade service pays a wrong answer in the sealed Microbus, and not a timeout, a late answer or a struck card", async () => {
  mock.timers.reset();
  resetGradeRing();
  const sql = await db(["0001_auth.sql", "0002_vault_clears.sql", "0004_plate_stats.sql", "0015_paint_finds.sql"]);
  const BANK: TriviaQ[] = [
    sealPlate({ q: "Which river runs through Austin?", choices: ["Colorado", "Brazos", "Pecos", "Trinity"], answer: "Colorado", diff: 1 }),
    sealPlate({ q: "How many stories is the UT Tower?", choices: ["14", "21", "27", "33"], answer: "27", diff: 2 }),
  ];
  const LAMP: Poi = { id: "ut-tower", name: "UT Tower", lat: 30.28, lng: -97.74, kind: "campus", tier: "red", lore: "" };
  const all = new Map<string, TriviaQ>();
  for (const c of BANK) {
    all.set(c.id, c);
    all.set(publicCardId(c), c);
  }
  const clock = { t: Date.now() };
  let nonce = 0;
  const deps: TriviaDeps = {
    now: () => clock.t,
    secret: "test-secret",
    pick: () => ({ ...BANK[nonce % 2]!, rarity: "red" as const }),
    card: (cid) => all.get(cid) ?? null,
    // One red vault per deal: a wrong answer locks its own vault out for a few minutes (0.1.107).
    namedPoi: (_c, pid) => (pid.startsWith("ut-") ? { ...LAMP, id: pid } : null),
    sql: async () => sql,
    rand: () => 0.42,
    nonce: () => `e2e-${++nonce}`,
  };
  await syncPlayer(sql, "ann", { ...snap, keys: { red: 9 } }, "ann-phone");
  await syncPlayer(sql, "bob", { ...snap, keys: { red: 9 } }, "bob-phone");
  const { id } = await canonicalWallet(sql, "ann");
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"car:microbus"}, ${JSON.stringify({ car: BUS })})`;
  const SAVE = "11111111-2222-3333-4444-555555555555";
  const dealPay = { streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], lat: 30.28, lng: -97.74, car: BUS };
  let vault = 0;
  const ask = (over: Record<string, unknown> = {}) => DealIn.parse({ city: "austin", cat: "local", poiId: `ut-${++vault}`, windowMs: 25000, seen: [], saveId: SAVE, pay: dealPay, ...over });
  const wrongOf = (c: { choices: string[] }, struck?: string) => c.choices.find((x) => x !== "Colorado" && x !== "27" && x !== struck)!;

  // A wrong answer on a red vault, seated in the Microbus this account owns: 486 back, on the miss.
  const d1 = await dealFor(deps, { userId: "ann" }, ask());
  assert.ok(d1.ok);
  if (!d1.ok) return;
  assert.equal(openToken(deps.secret, d1.token)?.x?.cr, BUS, "the server sealed the owned Microbus into the deal");
  assert.equal(openToken(deps.secret, d1.token)?.x?.st, undefined);
  clock.t += 3000;
  const before = await coinsOf(sql, "ann");
  const g1 = await grade(deps, { userId: "ann" }, { token: d1.token, choice: wrongOf(d1.card), clientMs: 2900 });
  assert.ok(g1.ok && !g1.correct && !g1.timedOut);
  if (!g1.ok) return;
  assert.deepEqual(g1.award, { coins: 486, keys: {}, boosts: ["Encore +486 coin"] });
  assert.equal(g1.encore?.used, 1);
  assert.equal((await coinsOf(sql, "ann")) - before, 486);
  assert.equal(g1.wallet?.coins, before + 486, "the miss reply carries the paid wallet");
  // The token again, now sending the right answer, a forged count and a forged car: the first grade stands.
  resetGradeRing();
  const again = await grade(deps, { userId: "ann" }, { token: d1.token, choice: "Colorado", clientMs: 2900, encore: 0, car: BUS } as never);
  assert.ok(again.ok && again.replay && !again.correct);
  assert.equal(await coinsOf(sql, "ann"), before + 486, "no second pay");

  // Timeout: no answer came. Late: an answer after the window. Neither is a wrong answer.
  const d2 = await dealFor(deps, { userId: "ann" }, ask());
  assert.ok(d2.ok);
  if (!d2.ok) return;
  clock.t += 26_000;
  const g2 = await grade(deps, { userId: "ann" }, { token: d2.token, choice: null, clientMs: 25_000 });
  assert.ok(g2.ok && !g2.correct && g2.timedOut);
  if (g2.ok) assert.ok(!hasLine(g2 as never) && (g2.award?.coins ?? 0) === 0 && g2.encore === undefined, "a timeout pays nothing");
  const d3 = await dealFor(deps, { userId: "ann" }, ask());
  assert.ok(d3.ok);
  if (!d3.ok) return;
  clock.t += 60_000;
  const g3 = await grade(deps, { userId: "ann" }, { token: d3.token, choice: wrongOf(d3.card), clientMs: 3000 });
  assert.ok(g3.ok && !g3.correct && g3.timedOut);
  if (g3.ok) assert.ok(!hasLine(g3 as never) && (g3.award?.coins ?? 0) === 0, "a late answer pays nothing");
  // An answer whose own stopwatch says it ran past the window is a timeout too, whatever it picked.
  const d3b = await dealFor(deps, { userId: "ann" }, ask());
  assert.ok(d3b.ok);
  if (!d3b.ok) return;
  clock.t += 20_000;
  const g3b = await grade(deps, { userId: "ann" }, { token: d3b.token, choice: wrongOf(d3b.card), clientMs: 999_000 });
  assert.ok(g3b.ok && !g3b.correct);
  if (g3b.ok) assert.ok(!hasLine(g3b as never) && (g3b.award?.coins ?? 0) === 0, "a self-reported late answer pays nothing");

  // Scout strike: the Fox struck a wrong option when this card was dealt; the token says so and a miss pays nothing.
  const fox = deal(deps, { userId: "ann" }, ask({ pay: { ...dealPay, scout: "fox" } }), [], { car: BUS, scout: "fox" });
  assert.ok(fox.ok);
  if (!fox.ok) return;
  const struck = (fox.card as { struck?: string }).struck;
  assert.ok(struck, "the Fox struck an option on the red card");
  assert.equal(openToken(deps.secret, fox.token)?.x?.st, 1, "sealed into the token");
  clock.t += 3000;
  const g4 = await grade(deps, { userId: "ann" }, { token: fox.token, choice: wrongOf(fox.card, struck), clientMs: 2900 });
  assert.ok(g4.ok && !g4.correct && !g4.timedOut);
  if (g4.ok) assert.ok(!hasLine(g4 as never) && (g4.award?.coins ?? 0) === 0 && g4.encore === undefined, "a struck card's miss pays nothing");
  // …and neither does picking the struck option itself.
  const fox2 = deal(deps, { userId: "ann" }, ask({ pay: { ...dealPay, scout: "fox" } }), [], { car: BUS, scout: "fox" });
  assert.ok(fox2.ok);
  if (!fox2.ok) return;
  clock.t += 3000;
  const g5 = await grade(deps, { userId: "ann" }, { token: fox2.token, choice: (fox2.card as { struck?: string }).struck!, clientMs: 2900 });
  if (g5.ok) assert.ok(!g5.correct && !hasLine(g5 as never) && (g5.award?.coins ?? 0) === 0);

  // Seat: bob claims the Microbus in his deal but does not own one, so nothing is sealed and his miss pays nothing.
  const d6 = await dealFor(deps, { userId: "bob" }, ask());
  assert.ok(d6.ok);
  if (!d6.ok) return;
  assert.equal(openToken(deps.secret, d6.token)?.x?.cr, undefined);
  clock.t += 3000;
  const g6 = await grade(deps, { userId: "bob" }, { token: d6.token, choice: wrongOf(d6.card), clientMs: 2900, car: BUS } as never);
  assert.ok(g6.ok && !g6.correct);
  if (g6.ok) assert.ok(!hasLine(g6 as never) && (g6.award?.coins ?? 0) === 0 && g6.encore === undefined);
  assert.equal(await coinsOf(sql, "bob"), 0);
  assert.equal(await coinsOf(sql, "ann"), before + 486, "one Encore in all");
  assert.equal(await enRows(sql, id), 1);
});

test("encore counter cannot be incremented from the client", async () => {
  const sql = await db();
  await syncPlayer(sql, "eve", snap, "eve-phone");
  const { id } = await canonicalWallet(sql, "eve");
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"car:microbus"}, ${JSON.stringify({ car: BUS })})`;
  // Eve spends her whole day's Encore.
  for (let i = 1; i <= ENCORE_DAY_CAP; i++) await gradeAt(sql, "eve", `e-${i}`, NOON + i * 1000, fail());
  mock.timers.setTime(NOON + 60_000);
  const coins0 = await coinsOf(sql, "eve");
  assert.equal(coins0, 20 * 54);
  const unchanged = async (why: string) => {
    assert.deepEqual(await encoreOf(sql, "eve"), { used: 20, day: "2025-11-25" }, `${why}: stored count`);
    assert.equal(await enRows(sql, id), 20, `${why}: paid rows`);
    assert.equal(await coinsOf(sql, "eve"), coins0, `${why}: coin`);
  };

  // (a) Client-supplied count fields are dropped by the request validators before any handler sees them…
  const forged = { encore: 0, en: 0, encoreUsed: 0, usedToday: 0, encoreDay: "1999-01-01", count: 0, used: 0 };
  const g = GradeIn.parse({ token: "t".repeat(40), choice: "x", clientMs: 900, ...forged, encore: { used: 0, day: "2025-11-25" } });
  assert.deepEqual(Object.keys(g).sort(), ["choice", "clientMs", "token"], "the answer request keeps token, choice and stopwatch only");
  const dealPay = { streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], lat: 30.27, lng: -97.77, car: BUS };
  const d = DealIn.parse({ city: "austin", cat: "science", poiId: "zilker", windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555", ...forged, pay: { ...dealPay, ...forged } });
  for (const k of Object.keys(forged)) {
    assert.ok(!(k in d), `deal request drops ${k}`);
    assert.ok(!(k in (d.pay ?? {})), `deal pay drops ${k}`);
  }
  // …and the grade write itself reads no such field: a forged "0 used" on the pay object still meets the spent cap.
  const sneaky = await gradeAt(sql, "eve", "e-sneak", NOON + 61_000, { ...fail(), ...forged, encore: { used: 0, day: "2025-11-25" } } as never);
  assert.ok(sneaky.ok);
  assert.deepEqual(sneaky.award, { coins: 0, keys: {}, boosts: [] }, "no pay from a forged count");
  assert.deepEqual(sneaky.encore, { used: 20, day: "2025-11-25" });
  await unchanged("forged grade fields");
  // The save sync (the one bulk write a device has) cannot carry a count either, and neither can wallet meta.
  const synced = await syncPlayer(sql, "eve", { ...snap, ...forged, encore: { used: 0, day: "2025-11-25" }, meta: { ...forged, encore: 0 }, cities: { ...(snap.cities as object), ...forged } } as never, "eve-phone");
  assert.deepEqual(synced.encore, { used: 20, day: "2025-11-25" }, "sync answers with the ledger count");
  await syncPlayer(sql, "eve", { ...snap, ...forged } as never, "eve-tablet");
  await unchanged("forged sync snapshot");
  assert.ok(!/encore|"en"/.test(JSON.stringify((await canonicalWallet(sql, "eve")).wallet.meta)), "no Encore field on the wallet row");
  assert.equal((await gradeAt(sql, "eve", "e-after-sync", NOON + 62_000, fail())).award?.coins, 0, "still capped after the forged syncs");

  // (b) The count is read only from the server's own grade rows, by the server's own timestamps. Rows of any other
  //     kind that say "en" are not pays (so they cannot fill the cap for someone, either).
  await syncPlayer(sql, "fresh", snap, "fresh-phone");
  const fresh = (await canonicalWallet(sql, "fresh")).id;
  for (const key of ["migrate:forged", "drive:austin", "encore:1", "op:encore", "car:encore", "refund:x", "deal:x"]) {
    await sql`insert into wallet_ledger (user_id, op_key, detail) values (${fresh}, ${key}, ${JSON.stringify({ en: 1, coins: 54, boosts: ["Encore +54 coin"] })}) on conflict (user_id, op_key) do nothing`;
  }
  assert.deepEqual(await encoreOf(sql, "fresh"), { used: 0, day: "2025-11-25" }, "only grade:* rows count");
  // A grade pays only with the car the server sealed into the deal, and it seals only a car this account owns.
  const ask = DealIn.parse({ city: "austin", cat: "science", poiId: "zilker", windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555", pay: dealPay });
  assert.equal((await provePerks(sql, "eve", ask)).car, BUS, "owned: sealed");
  assert.equal((await provePerks(sql, "fresh", ask)).car, undefined, "claimed but not owned: not sealed");

  // (c) No client-callable op sets, bumps or resets it: the op allow-list has no such kind, and unknown kinds are refused.
  const api = src("./walletApi.ts");
  const kinds = [...api.matchAll(/kind: z\.literal\("([A-Za-z]+)"\)/g)].map((m) => m[1]!);
  assert.ok(kinds.length > 30 && kinds.includes("car") && kinds.includes("paint"), "read the op allow-list");
  for (const k of kinds) assert.doesNotMatch(k, /encore/i, `op ${k}`);
  assert.match(api, /const Op = z\.discriminatedUnion\("kind", \[/, "ops are a closed union: any other kind fails the validator");
  assert.match(api, /\.validator\(\(u: unknown\) => Op\.parse\(u\)\)/);
  const reqSide = api.slice(api.indexOf("const Snap = z.object({"), api.indexOf("export type WalletWire"));
  assert.ok(reqSide.length > 2000);
  assert.doesNotMatch(reqSide, /encore|\ben\b/i, "no request schema (save snapshot or op) has an Encore field");
  const apply = src("./walletApply.ts");
  const clientOps = apply.slice(apply.indexOf("export type ClientOp ="), apply.indexOf("export type ClientResult"));
  assert.ok(clientOps.length > 500);
  assert.doesNotMatch(clientOps, /encore/i, "no ClientOp names it");
  for (const op of [{ kind: "encore", used: 0 }, { kind: "encore", reset: true }, { kind: "en", n: 0 }, { kind: "car", id: "encore" }, { kind: "wear", slot: "car", id: BUS, encore: 0 }]) {
    let r: Awaited<ReturnType<typeof applyClientOp>> | null = null;
    try {
      r = await applyClientOp(sql, "eve", op as unknown as ClientOp);
    } catch {
      r = null;
    }
    if (op.kind !== "wear") assert.ok(!r || !r.ok, `${JSON.stringify(op)} is refused`);
    await unchanged(JSON.stringify(op));
  }
  // The device never counts either: the store only takes the count from server replies and never saves it; the HUD
  // and the showroom print that count as plain text, and nothing is drawn on the sprite.
  const store = src("./store.ts");
  assert.doesNotMatch(store, /encore: s\.encore|saved\?\.encore|used \+ 1|used\+\+/, "not in the save, not incremented locally");
  assert.match(store, /if \(res\.encore\) useGame\.setState\(\{ encore: res\.encore \}\);/);
  const hud = src("../components/keyline/Hud.tsx");
  assert.match(hud, /hud\.seated && hasEncore\(carOn\) && encore != null/);
  assert.match(hud, /data-testid="hud-encore"/);
  const showroom = src("../components/keyline/Showroom.tsx");
  assert.match(showroom, /mine && hasEncore\(c\.id\) && encore != null/);
  assert.match(src("../components/keyline/LootToast.tsx"), /data-testid="miss-encore"/);
  const css = src("../styles.css");
  assert.doesNotMatch(css, /\.cab-sprite[^{]*encore|encore[^{]*\.cab-sprite/i, "no Encore rule touches the car sprite");
  assert.doesNotMatch(src("../components/keyline/GameMap.tsx"), /encore/i, "the map pawn never draws it");

  // After all of that Eve is still capped today, and a fresh account's first honest fail pays.
  await unchanged("the end");
  assert.equal((await gradeAt(sql, "eve", "e-last", NOON + 70_000, fail())).award?.coins, 0);
});

test("encore pays nothing when not seated in the Microbus at grade time", async () => {
  const sql = await db();
  await syncPlayer(sql, "sam", snap, "sam-phone");
  const { id } = await canonicalWallet(sql, "sam");
  // Sam owns the Microbus (and a Civic); owning is not sitting.
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"car:microbus"}, ${JSON.stringify({ car: BUS })})`;
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"car:civic"}, ${JSON.stringify({ car: "civic" })})`;
  let n = 0;
  // The grade-time car pay.car decides: every other car, and no car (on foot / the city cab).
  for (const car of [...CARS.filter((c) => c.id !== BUS).map((c) => c.id), null, undefined]) {
    const r = await gradeAt(sql, "sam", `seat-${n++}`, NOON + n * 1000, fail({ car }));
    assert.ok(r.ok, String(car));
    assert.deepEqual(r.award, { coins: 0, keys: {}, boosts: [] }, `${car}: nothing`);
    assert.equal(r.encore, undefined, String(car));
  }
  // A client claiming the Microbus after the deal was sealed in another car: extra fields beside the sealed car are
  // not read by the grade write…
  const claim = await gradeAt(sql, "sam", "claim", NOON + 30_000, { ...fail({ car: "civic" }), carOn: BUS, cr: BUS, seat: BUS, claimCar: BUS } as never);
  assert.deepEqual(claim.award, { coins: 0, keys: {}, boosts: [] });
  // …the answer request cannot carry a car at all…
  const g = GradeIn.parse({ token: "t".repeat(40), choice: "x", clientMs: 900, car: BUS, cr: BUS, pay: { car: BUS } });
  assert.deepEqual(Object.keys(g).sort(), ["choice", "clientMs", "token"]);
  // …and the grade's car is read from the token the server sealed at deal time, from its own ownership proof.
  const service = src("./triviaService.ts");
  assert.match(service, /car: isCarId\(x\?\.cr\) \? x\.cr : null,/, "the grade's car comes from the sealed token");
  assert.match(service, /\.\.\.\(proven\.car \? \{ cr: proven\.car \} : \{\}\)/, "and the token's car from the ownership proof");
  assert.equal(await coinsOf(sql, "sam"), 0);
  assert.equal(await enRows(sql, id), 0);
  assert.deepEqual(await encoreOf(sql, "sam"), { used: 0, day: "2025-11-25" });
  // Seated in it, the very next fail pays: the misses above took no slot.
  const seated = await gradeAt(sql, "sam", "seated", NOON + 40_000, fail());
  assert.deepEqual(seated.award, { coins: 54, keys: {}, boosts: ["Encore +54 coin"] });
  assert.deepEqual(seated.encore, { used: 1, day: "2025-11-25" });
});

test("encore cap resets at Chicago midnight", async () => {
  const sql = await db();
  // (1) 20 used just before 00:00 CT; the next fail after midnight CT pays.
  await syncPlayer(sql, "owl", snap, "owl-phone");
  for (let i = 1; i <= 20; i++) assert.equal((await gradeAt(sql, "owl", `n-${i}`, ct(25, 23, 30) + i * 1000, fail())).award?.coins, 54);
  const last = await gradeAt(sql, "owl", "n-2359", ct(25, 23, 59), fail());
  assert.equal(last.award?.coins, 0, "23:59 CT: the day's 20 are spent");
  assert.deepEqual(last.encore, { used: 20, day: "2025-11-25" });
  const first = await gradeAt(sql, "owl", "n-0001", ct(26, 0, 1), fail());
  assert.deepEqual(first.award, { coins: 54, keys: {}, boosts: ["Encore +54 coin"] }, "00:01 CT: a new day");
  assert.deepEqual(first.encore, { used: 1, day: "2025-11-26" });
  mock.timers.setTime(ct(26, 0, 2));
  assert.deepEqual((await syncPlayer(sql, "owl", snap, "owl-phone")).encore, { used: 1, day: "2025-11-26" });
  // The new day has its own 20.
  for (let i = 2; i <= 20; i++) assert.equal((await gradeAt(sql, "owl", `d2-${i}`, ct(26, 0, 2) + i * 1000, fail())).award?.coins, 54);
  assert.equal((await gradeAt(sql, "owl", "d2-21", ct(26, 1), fail())).award?.coins, 0);

  // (2) City-local midnight is not the boundary. New York is an hour ahead of Chicago: at 23:30 CT its local day has
  //     already rolled over, and a fail there still meets the spent cap.
  await syncPlayer(sql, "nyc", snap, "nyc-phone");
  const inNyc = { city: "nyc" as const, poiId: "bryant", lat: 40.7536, lng: -73.9832 };
  for (let i = 1; i <= 20; i++) assert.equal((await gradeAt(sql, "nyc", `y-${i}`, ct(25, 22, 30) + i * 1000, fail(inNyc))).award?.coins, 54);
  const at2330 = ct(25, 23, 30);
  assert.equal(dayIn("America/New_York", ct(25, 22, 30)), "2025-11-25");
  assert.equal(dayIn("America/New_York", at2330), "2025-11-26", "New York's local day has rolled");
  assert.equal(dayIn("America/Chicago", at2330), "2025-11-25", "Chicago's has not");
  const rolled = await gradeAt(sql, "nyc", "y-2330", at2330, fail(inNyc));
  assert.deepEqual(rolled.award, { coins: 0, keys: {}, boosts: [] }, "23:30 CT in New York: no reset at city-local midnight");
  assert.deepEqual(rolled.encore, { used: 20, day: "2025-11-25" });
  const nycNext = await gradeAt(sql, "nyc", "y-0005", ct(26, 0, 5), fail(inNyc));
  assert.equal(nycNext.award?.coins, 54, "00:05 CT: reset, in New York too");

  // (3) And the other way: Los Angeles is two hours behind. At 00:10 CT its local day is still the 25th, yet the cap
  //     has reset, because the day is Chicago's for every city.
  await syncPlayer(sql, "la", snap, "la-phone");
  const inLa = { city: "la" as const, poiId: "pershing", lat: 34.0484, lng: -118.2529 };
  for (let i = 1; i <= 20; i++) assert.equal((await gradeAt(sql, "la", `l-${i}`, ct(25, 23, 40) + i * 1000, fail(inLa))).award?.coins, 54);
  assert.equal((await gradeAt(sql, "la", "l-2358", ct(25, 23, 58), fail(inLa))).award?.coins, 0);
  const at0010 = ct(26, 0, 10);
  assert.equal(dayIn("America/Los_Angeles", at0010), "2025-11-25", "still yesterday in Los Angeles");
  assert.equal(dayIn("America/Chicago", at0010), "2025-11-26");
  const laNext = await gradeAt(sql, "la", "l-0010", at0010, fail(inLa));
  assert.equal(laNext.award?.coins, 54, "00:10 CT in Los Angeles: reset at Chicago midnight");
  assert.deepEqual(laNext.encore, { used: 1, day: "2025-11-26" });
});

test("no paint for the Microbus on the server: a can never rolls for it and the repaint op is refused", async () => {
  const sql = await db();
  await syncPlayer(sql, "lot", { ...snap, coins: 500_000 }, "lot-phone");
  const { id } = await canonicalWallet(sql, "lot");
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"car:microbus"}, ${JSON.stringify({ car: BUS })})`;
  for (let i = 0; i < 200; i++) {
    const can = await grantCan(sql, "lot", `t:${i}`, 1, 0, i / 200);
    assert.ok(can && can.car !== BUS, `pick ${i}`);
  }
  const coins = await coinsOf(sql, "lot");
  await sql`insert into wallet_ledger (user_id, op_key, detail) values (${id}, ${"can:forged"}, ${JSON.stringify({ can: "microbus:red" })})`;
  for (const color of ["red", "black", "sig", "teal", ""]) {
    let ok = false;
    try {
      ok = (await applyClientOp(sql, "lot", { kind: "paint", car: BUS, color })).ok;
    } catch {
      ok = false;
    }
    assert.equal(ok, false, `paint ${color}`);
  }
  assert.equal(await coinsOf(sql, "lot"), coins, "nothing charged");
  const owned = (await syncPlayer(sql, "lot", snap, "lot-phone")).owned;
  assert.equal(owned?.paint?.microbus, undefined);
  assert.ok(owned?.cars?.includes(BUS), "the car itself is owned");
  assert.ok(!owned?.cans?.some((c) => c.startsWith("microbus")), "no Microbus can in the satchel");
});
