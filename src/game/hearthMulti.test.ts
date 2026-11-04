/** 0.1.117 Double and Triple Hearth vaults: versions, the server's step chain, pay boosts, lock-out, used fields, the picker. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { GradePay, LocalSnap } from "./wallet.ts";
import { HEARTH_TIERS, hearthBoost, hearthBoostLabel, hearthCost, hearthLast, hearthNext, hearthSteps, hearthTierAt, hearthVersion, slotUsed } from "./hearthMulti.ts";
import { plantRefusal } from "./placedLantern.ts";

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
  for (const m of ["0016_player_wallet.sql", "0002_vault_clears.sql", "0003_plate_events.sql", "0004_plate_stats.sql", "0014_walk_distance.sql", "0013_trivia_recent.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap = (keys: Record<string, number>): LocalSnap => ({ coins: 0, keys, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } });

test("versions: Single red; Double green → amber; Triple green → amber → red; boosts +25% / +50%; old rows are Single", () => {
  assert.deepEqual(HEARTH_TIERS[1], ["red"]);
  assert.deepEqual(HEARTH_TIERS[2], ["green", "amber"]);
  assert.deepEqual(HEARTH_TIERS[3], ["green", "amber", "red"]);
  assert.equal(hearthVersion(undefined), 1);
  assert.equal(hearthVersion(7), 1);
  assert.equal(hearthVersion(3), 3);
  assert.equal(hearthCost(1), "red");
  assert.equal(hearthCost(2), "green");
  assert.equal(hearthCost(3), "green");
  assert.deepEqual([0, 1].map((s) => hearthBoost(2, s)), [1, 1.25]);
  assert.deepEqual([0, 1, 2].map((s) => hearthBoost(3, s)), [1, 1.25, 1.5]);
  assert.equal(hearthBoost(1, 0), 1);
  assert.equal(hearthTierAt(3, 2), "red");
  assert.equal(hearthSteps(3), 3);
  assert.equal(hearthLast(2, 1), true);
  assert.equal(hearthLast(3, 1), false);
  assert.equal(hearthBoostLabel(2, 0), null);
  assert.equal(hearthBoostLabel(3, 2), "Triple Hearth, 3rd question +50%");
});

test("used fields: the next pick must be a field not used this run; a Math stand-in shares Math's slot; the chain must match", () => {
  const cats = ["history", "music", "food", "math"];
  const prev = { pi: "placed-a", hv: 3, hs: 0, cat: "music", hu: [] };
  assert.deepEqual(hearthNext(prev, "placed-a", 3, "food", cats), { step: 1, used: ["music"] });
  assert.deepEqual(hearthNext(prev, "placed-a", 3, "music", cats), { refused: "used" });
  assert.deepEqual(hearthNext(prev, "placed-b", 3, "food", cats), { refused: "chain" });
  assert.deepEqual(hearthNext(prev, "placed-a", 2, "food", cats), { refused: "chain" });
  assert.deepEqual(hearthNext({ ...prev, hs: 2, hu: ["music", "food"], cat: "history" }, "placed-a", 3, "math", cats), { refused: "done" });
  // Q1 took sports as Math's stand-in: Math (and any other stand-in) is used; history is free.
  const sub = { ...prev, cat: "sports" };
  assert.deepEqual(hearthNext(sub, "placed-a", 3, "math", cats), { refused: "used" });
  assert.deepEqual(hearthNext(sub, "placed-a", 3, "arts", cats), { refused: "used" });
  assert.equal("step" in hearthNext(sub, "placed-a", 3, "history", cats), true);
  assert.equal(slotUsed(cats, ["games"], "math"), true);
  assert.equal(slotUsed(cats, ["games"], "food"), false);
});

test("placement: the version is checked (1, 2, 3 or absent)", () => {
  const spot = { lat: 30.27, lng: -97.74 };
  const base = { city: "austin", ...spot, name: 0, cats: ["local", "history", "science", "music"] };
  assert.equal(plantRefusal(base, spot, [], []), null);
  for (const v of [1, 2, 3]) assert.equal(plantRefusal({ ...base, v }, spot, [], []), null);
  assert.equal(plantRefusal({ ...base, v: 4 }, spot, [], []), "version");
  assert.equal(plantRefusal({ ...base, v: 0 }, spot, [], []), "version");
});

test("pay: each right answer pays its tier coin, boosted on later questions; only the last returns the tier key (the prize)", async () => {
  const { gradeGrant, emptyWallet } = await import("./wallet.ts");
  const w = { ...emptyWallet(), migrated: true };
  const p = (over: Partial<GradePay>): GradePay => ({
    correct: true, elapsedMs: 5000, mult: 1, city: "austin", diff: 2, clearTier: "amber", poiTier: "amber", poiId: "placed-a",
    lat: 0, lng: 0, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "",
    charmTopics: [], topic: null, dealtAt: Date.UTC(2026, 10, 3, 3), luckyHit: false, perfectBlue: false, ...over,
  } as GradePay);
  const plainAmber = gradeGrant(w, p({})).award!;
  const dbl2 = gradeGrant(w, p({ hearth: { v: 2, step: 1 } })).award!;
  assert.ok(Math.abs(dbl2.coins - plainAmber.coins * 1.25) <= 1, `Double Q2 = amber coin +25% (${dbl2.coins} vs ${plainAmber.coins})`);
  assert.equal(dbl2.keys.amber, 1, "the prize: an amber key on Double's last question");
  assert.ok(dbl2.boosts.includes("Double Hearth, 2nd question +25%"));
  const greenQ1 = gradeGrant(w, p({ clearTier: "green", poiTier: "green", hearth: { v: 2, step: 0 } })).award!;
  assert.deepEqual(greenQ1.keys, {}, "no key back before the last question");
  const plainGreen = gradeGrant(w, p({ clearTier: "green", poiTier: "green" })).award!;
  assert.equal(greenQ1.coins, plainGreen.coins, "Q1 pays plain green coin");
  const tri2 = gradeGrant(w, p({ hearth: { v: 3, step: 1 } })).award!;
  assert.deepEqual(tri2.keys, {}, "Triple's amber question pays coin only");
  assert.equal(tri2.coins, dbl2.coins);
  const plainRed = gradeGrant(w, p({ clearTier: "red", poiTier: "red" })).award!;
  const tri3 = gradeGrant(w, p({ clearTier: "red", poiTier: "red", hearth: { v: 3, step: 2 } })).award!;
  assert.equal(tri3.keys.red, 1, "the prize: a red key on Triple's last question");
  assert.ok(Math.abs(tri3.coins - plainRed.coins * 1.5) <= 1, `Triple Q3 = red coin +50% (${tri3.coins} vs ${plainRed.coins})`);
  assert.deepEqual(gradeGrant(w, p({ correct: false, hearth: { v: 3, step: 1 } })).award, { coins: 0, keys: {}, boosts: [] });
});

async function placeTwo(sql: Sql) {
  const { applyClientOp, placedViews, syncPlayer } = await import("./walletApply.ts");
  const { CITIES } = await import("./data.ts");
  for (const who of ["dbl", "tri"]) {
    await syncPlayer(sql, who, snap({ green: 5 }), `${who}phone1`);
    // 0.1.119: the unlock is a plantok row (10 right reds in play; seeded here).
    await sql`insert into wallet_ledger (user_id, op_key, detail) values (${who}, 'plantok', '{"via":"red10"}')`;
  }
  await syncPlayer(sql, "vis", snap({ green: 3, red: 1 }), "visphone1");
  const s = CITIES.austin.spawn;
  const cats = ["history", "music", "food", "geography"];
  assert.equal((await applyClientOp(sql, "dbl", { kind: "plant", city: "austin", lat: s.lat + 0.004, lng: s.lng + 0.004, name: 1, cats, v: 2 })).ok, true);
  assert.equal((await applyClientOp(sql, "tri", { kind: "plant", city: "austin", lat: s.lat + 0.008, lng: s.lng + 0.004, name: 2, cats, v: 3 })).ok, true);
  const views = await placedViews(sql, "austin", "vis");
  return { dbl: views.find((v) => v.v === 2)!, tri: views.find((v) => v.v === 3)!, views };
}

function depsFor(sql: Sql, seen: { tier: string }) {
  const card = { id: "c1", q: "Q?", choices: ["a", "b", "c", "d"], answer: "a", diff: 2, rarity: "green" };
  let n = 0;
  return {
    now: () => Date.now(), secret: "s", rand: () => 0.4, nonce: () => `n${++n}-${Math.random().toString(36).slice(2, 8)}`,
    pick: (_c: string, _cat: string, _p: unknown, t: string) => ((seen.tier = t), card),
    card: () => card, namedPoi: () => null, sql: async () => sql,
  } as never;
}
const dealIn = (poiId: string, cat: string, more: object = {}) => ({ city: "austin", cat, poiId, windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555", ...more }) as never;
const spent = async (sql: Sql) => (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = 'vis' and op_key like 'deal:%'`).length;

test("server: a Triple runs green → amber → red off its own tokens; one key; used fields and client steps are refused", async () => {
  const { dealFor, grade, resetGradeRing } = await import("./triviaService.ts");
  resetGradeRing();
  const sql = await db();
  const { tri, views } = await placeTwo(sql);
  assert.equal(views.length, 2);
  assert.ok(!JSON.stringify(views).includes('"tri"'), "no owner id in the public list");
  const seen = { tier: "" };
  const deps = depsFor(sql, seen);
  const vis = { userId: "vis" } as never;
  // A client claiming step 2 without the chain is dealt question 1 (green), and pays the green key.
  const q1 = await dealFor(deps, vis, dealIn(tri.id, "music", { step: 2 }));
  assert.equal(q1.ok, true);
  assert.equal(seen.tier, "green");
  assert.equal(await spent(sql), 1, "one green key for the run");
  const t1 = (q1 as { token: string }).token;
  // The next question can't be dealt until question 1 is answered right.
  assert.equal((await dealFor(deps, vis, dealIn(tri.id, "food", { hearthPrev: t1 }))).ok, false, "not answered yet");
  const g1 = await grade(deps, vis, { token: t1, choice: "a", clientMs: 2000 });
  assert.equal(g1.ok && g1.correct, true);
  assert.equal((await dealFor(deps, vis, dealIn(tri.id, "music", { hearthPrev: t1 }))).ok, false, "music was used on Q1");
  const q2 = await dealFor(deps, vis, dealIn(tri.id, "food", { hearthPrev: t1 }));
  assert.equal(q2.ok, true);
  assert.equal(seen.tier, "amber");
  assert.equal(await spent(sql), 1, "no second key");
  assert.equal((await dealFor(deps, vis, dealIn(tri.id, "history", { hearthPrev: t1 }))).ok, false, "only one next deal per question");
  const t2 = (q2 as { token: string }).token;
  const g2 = await grade(deps, vis, { token: t2, choice: "a", clientMs: 2000 });
  assert.equal(g2.ok && g2.correct, true);
  if (g2.ok) assert.ok((g2 as { award?: { boosts: string[] } }).award?.boosts.includes("Triple Hearth, 2nd question +25%"));
  assert.equal((await dealFor(deps, vis, dealIn(tri.id, "food", { hearthPrev: t2 }))).ok, false, "food was used on Q2");
  const q3 = await dealFor(deps, vis, dealIn(tri.id, "geography", { hearthPrev: t2 }));
  assert.equal(q3.ok, true);
  assert.equal(seen.tier, "red");
  const t3 = (q3 as { token: string }).token;
  const before = (await sql<{ detail: string }>`select detail from wallet_ledger where user_id = 'vis' and op_key = 'wallet'`)[0];
  void before;
  const g3 = await grade(deps, vis, { token: t3, choice: "a", clientMs: 2000 });
  assert.equal(g3.ok && g3.correct, true);
  const award = (g3 as { award?: { keys: Record<string, number>; boosts: string[] } }).award;
  assert.equal(award?.keys.red, 1, "the prize: one red key");
  assert.ok(award?.boosts.includes("Triple Hearth, 3rd question +50%"));
  assert.equal((await dealFor(deps, vis, dealIn(tri.id, "history", { hearthPrev: t3 }))).ok, false, "the run is over after question 3");
  // A walk-away refund of question 1's key after it was answered is refused.
  const { refundDealt } = await import("./walletApply.ts");
  const n1 = (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = 'vis' and op_key like 'deal:%'`)[0]!.op_key.slice(5);
  assert.equal((await refundDealt(sql, "vis", n1, "green")).skipped, true);
});

test("server: a Double miss on question 2 ends the run and locks the vault out (amber: 5 min); a wrong Q1 can't chain", async () => {
  const { dealFor, grade, resetGradeRing } = await import("./triviaService.ts");
  const { LOCKOUT_LONG_MS, LOCKOUT_SHORT_MS } = await import("./lockout.ts");
  resetGradeRing();
  const sql = await db();
  const { dbl, tri } = await placeTwo(sql);
  const seen = { tier: "" };
  const deps = depsFor(sql, seen);
  const vis = { userId: "vis" } as never;
  const q1 = await dealFor(deps, vis, dealIn(dbl.id, "history"));
  assert.equal(seen.tier, "green");
  const t1 = (q1 as { token: string }).token;
  await grade(deps, vis, { token: t1, choice: "a", clientMs: 2000 });
  const q2 = await dealFor(deps, vis, dealIn(dbl.id, "music", { hearthPrev: t1 }));
  assert.equal(seen.tier, "amber");
  const g2 = await grade(deps, vis, { token: (q2 as { token: string }).token, choice: "b", clientMs: 2000 });
  assert.equal(g2.ok && !g2.correct, true);
  assert.equal((g2 as { lockoutMs?: number }).lockoutMs, LOCKOUT_LONG_MS);
  const again = await dealFor(deps, vis, dealIn(dbl.id, "food"));
  assert.equal(again.ok, false);
  assert.equal((again as { reason: string }).reason, "locked-out");
  // Triple: a wrong first answer locks out for green's 3 minutes, and its token can't open question 2.
  const w1 = await dealFor(deps, vis, dealIn(tri.id, "food"));
  const wt = (w1 as { token: string }).token;
  const gw = await grade(deps, vis, { token: wt, choice: "c", clientMs: 2000 });
  assert.equal((gw as { lockoutMs?: number }).lockoutMs, LOCKOUT_SHORT_MS);
  assert.equal((await dealFor(deps, vis, dealIn(tri.id, "music", { hearthPrev: wt }))).ok, false);
});

test("server: a Single Hearth (no v, or v 1) still plays one red question and pays its red key back", async () => {
  const { applyClientOp, placedViews, syncPlayer } = await import("./walletApply.ts");
  const { dealFor, grade, resetGradeRing } = await import("./triviaService.ts");
  const { CITIES } = await import("./data.ts");
  resetGradeRing();
  const sql = await db();
  await placeTwo(sql);
  await sql`insert into wallet_ledger (user_id, op_key, detail) values ('~placed', 'placed:old', ${JSON.stringify({ owner: "old", city: "austin", lat: CITIES.austin.spawn.lat + 0.012, lng: CITIES.austin.spawn.lng, name: 0, cats: ["history", "music", "food", "geography"], at: 1 })})`;
  void applyClientOp;
  void syncPlayer;
  const single = (await placedViews(sql, "austin", "vis")).find((v) => v.v === undefined)!;
  const seen = { tier: "" };
  const deps = depsFor(sql, seen);
  const vis = { userId: "vis" } as never;
  const q = await dealFor(deps, vis, dealIn(single.id, "food"));
  assert.equal(seen.tier, "red");
  const t = (q as { token: string }).token;
  assert.equal((await dealFor(deps, vis, dealIn(single.id, "music", { hearthPrev: t }))).ok, false, "a Single has no question 2");
  const g = await grade(deps, vis, { token: t, choice: "a", clientMs: 2000 });
  assert.equal((g as { award?: { keys: Record<string, number> } }).award?.keys.red, 1);
});

test("picker: the placement sheet offers Single, Double and Triple with their tier lines", async () => {
  const { versionLine } = await import("./hearthMulti.ts");
  assert.match(versionLine(1), /V key/);
  assert.match(versionLine(2), /3 left/);
  assert.match(versionLine(3), /3, then 2/);
  const src = readFileSync(new URL("../components/keyline/PlantSheet.tsx", import.meta.url), "utf8");
  assert.match(src, /data-testid="plant-version"/);
  assert.match(src, /HEARTH_VERSIONS\.map/);
  const vm = readFileSync(new URL("../components/keyline/VaultModal.tsx", import.meta.url), "utf8");
  for (const id of ["hearth-chips", "hearth-used", "hearth-note"]) assert.match(vm, new RegExp(`data-testid="${id}"`));
});
