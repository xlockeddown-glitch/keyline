// 0.1.106 worn picks on the account: worn:<slot>:<ms> rows (latest wins, server-checked ownership) for the city print
// on the coat, cloth, the car you drive (or the cab) and the market light; first-sync backfill keeps device picks.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2999-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { ALL_PRINTS } from "./cityPrints.ts";
import type { LocalSnap } from "./wallet.ts";
import { applyClientOp, syncPlayer, wornOf } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { WORN_DEFAULT, planWornSync, type AccountWorn, type WornPicks } from "./wornSync.ts";
thanksClock.cutoff = "2999-01-01T00:00:00Z";

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
  for (const m of ["0001_auth.sql", "0002_vault_clears.sql", "0003_plate_events.sql", "0004_plate_stats.sql", "0006_daily_runs.sql", "0007_daily_runs_per_city.sql", "0011_player_links.sql", "0014_walk_distance.sql", "0015_paint_finds.sql", "0016_player_wallet.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };
const tick = () => new Promise((r) => setTimeout(r, 5));
const print = ALL_PRINTS[0]!;

async function earnPrint(sql: Sql, user: string) {
  const { id } = await canonicalWallet(sql, user);
  await sql`insert into plate_events (id, user_id, save_id, plate_id, shown_at, answered_at, latency_ms, correct, rarity, city)
    select 'pe' || g, ${id}, 's', 'p' || g, now(), now(), 1000, true, 'white', ${print.city} from generate_series(1, ${print.goal.correct}) g`;
  await sql`insert into walk_distance (user_id, city, meters) values (${id}, ${print.city}, ${print.goal.meters})`;
}
async function give(sql: Sql, user: string, coins: number, cloths: string[] = []) {
  const { id } = await canonicalWallet(sql, user);
  await sql`update player_wallets set coins = ${coins}, meta = meta || ${JSON.stringify({ cloths })}::jsonb where user_id = ${id}`;
}

test("refusals: unknown ids, and only what the account owns or earned", async () => {
  const sql = await db();
  await syncPlayer(sql, "rf", snap, "rfphone1");
  const wear = async (slot: "print" | "cloth" | "car" | "light", id: string | null) => (await applyClientOp(sql, "rf", { kind: "wear", slot, id })).reason;
  assert.equal(await wear("print", "no-such-print"), "unknown");
  assert.equal(await wear("print", print.id), "not-owned", "not earned yet");
  assert.equal(await wear("cloth", "road-dust"), "not-owned");
  assert.equal(await wear("car", "pinto"), "unknown");
  assert.equal(await wear("light", "jade"), "not-owned", "not bought");
  assert.equal(await wear("light", null), "unknown", "the market always shows some light");
  assert.equal(await wear("light", "plaid"), "unknown");
  // Off, the cab and the free amber light are always allowed.
  assert.equal(await wear("print", null), undefined);
  assert.equal(await wear("cloth", null), undefined);
  assert.equal(await wear("car", "cab"), undefined);
  assert.equal(await wear("light", "amber"), undefined);
});

test("owned picks: latest row wins; buying a car or light puts it on; a repeat is a replay", async () => {
  const sql = await db();
  await syncPlayer(sql, "ow", snap, "owphone1");
  await earnPrint(sql, "ow");
  await give(sql, "ow", 1_000_000, ["road-dust"]);
  assert.equal((await applyClientOp(sql, "ow", { kind: "wear", slot: "print", id: print.id })).ok, true);
  assert.equal((await applyClientOp(sql, "ow", { kind: "wear", slot: "print", id: print.id })).replay, true);
  assert.equal((await applyClientOp(sql, "ow", { kind: "wear", slot: "cloth", id: "road-dust" })).ok, true);
  const car = (await import("./cars.ts")).CARS[0]!.id;
  assert.equal((await applyClientOp(sql, "ow", { kind: "car", id: car })).ok, true);
  assert.equal((await applyClientOp(sql, "ow", { kind: "light", id: "jade" })).ok, true);
  let w = await wornOf(sql, "ow");
  assert.deepEqual(w, { print: print.id, cloth: "road-dust", car, light: "jade" }, "a buy is a pick");
  await tick();
  await applyClientOp(sql, "ow", { kind: "wear", slot: "car", id: "cab" });
  await applyClientOp(sql, "ow", { kind: "wear", slot: "light", id: "amber" });
  await applyClientOp(sql, "ow", { kind: "wear", slot: "print", id: null });
  w = await wornOf(sql, "ow");
  assert.deepEqual(w, { print: null, cloth: "road-dust", car: "cab", light: "amber" });
});

/** One device: its picks, run through the same plan the store's syncWorn uses, against the real server. */
async function deviceSync(sql: Sql, user: string, device: string, mine: WornPicks): Promise<WornPicks> {
  const s = await syncPlayer(sql, user, snap, device);
  const plan = planWornSync(mine, (s.owned!.worn ?? {}) as AccountWorn);
  for (const b of plan.backfill) await applyClientOp(sql, user, { kind: "wear", slot: b.slot, id: b.id });
  return { ...mine, ...plan.adopt } as WornPicks;
}

test("cross-device: the phone backfills its picks on first sync; the desktop wears the same; later changes follow", async () => {
  const sql = await db();
  await syncPlayer(sql, "rg", snap, "rgphone0");
  await earnPrint(sql, "rg");
  await give(sql, "rg", 0, ["road-dust"]);
  // The phone chose before 0.1.106: print on, cloth on, the cab, and a scarf it only has on this device (not on the account).
  const phone: WornPicks = { print: print.id, cloth: "scarf-austin", car: "cab", light: "amber" };
  const phoneAfter = await deviceSync(sql, "rg", "rgphone1", phone);
  assert.deepEqual(phoneAfter, phone, "nothing on the phone changes; the refused scarf stays a device pick");
  assert.deepEqual(await wornOf(sql, "rg"), { print: print.id, car: "cab" }, "amber is the default: nothing to offer");
  // The desktop never chose anything.
  const desk = await deviceSync(sql, "rg", "rgdesk1", WORN_DEFAULT);
  assert.deepEqual(desk, { print: print.id, cloth: null, car: "cab", light: "amber" });
  // The desktop puts the owned cloth on and the print off; the phone takes both on its next sync.
  await tick();
  await applyClientOp(sql, "rg", { kind: "wear", slot: "cloth", id: "road-dust" });
  await applyClientOp(sql, "rg", { kind: "wear", slot: "print", id: null });
  const phone2 = await deviceSync(sql, "rg", "rgphone1", phoneAfter);
  assert.deepEqual(phone2, { print: null, cloth: "road-dust", car: "cab", light: "amber" });
});

test("plan: account picks win; default picks are not offered", () => {
  assert.deepEqual(planWornSync(WORN_DEFAULT, {}), { backfill: [], adopt: {} });
  assert.deepEqual(planWornSync({ ...WORN_DEFAULT, light: "rose" }, { car: "cab" }), { backfill: [{ slot: "light", id: "rose" }], adopt: { car: "cab" } });
  assert.deepEqual(planWornSync({ ...WORN_DEFAULT, print: "x" }, { print: null }), { backfill: [], adopt: { print: null } });
});

test("wiring: each pick tells the account; sign-in lines picks up once the wallet is live", () => {
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  for (const slot of ["cloth", "car", "print", "light"]) assert.match(store, new RegExp(`pushOp\\(\\{ kind: "wear", slot: "${slot}"`));
  const sync = readFileSync(new URL("../components/keyline/WalletSync.tsx", import.meta.url), "utf8");
  assert.ok(sync.indexOf("syncWorn()") > sync.indexOf("setWalletLive(true)"));
  assert.doesNotMatch(readFileSync(new URL("../components/keyline/Prints.tsx", import.meta.url), "utf8"), /setState\(\{ printWorn: worn === r\.id/);
  assert.doesNotMatch(readFileSync(new URL("../components/keyline/NightMarket.tsx", import.meta.url), "utf8"), /setState\(\{ marketLight/);
});

test("a gifted car is owned but never counts as a pick", async () => {
  const sql = await db();
  await syncPlayer(sql, "gf", snap, "gfphone1");
  const { id } = await canonicalWallet(sql, "gf");
  const gifted = (await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where user_id = ${id} and op_key like ${"car:%"}`)[0];
  assert.ok(gifted && /"gift":true/.test(gifted.detail), "the thanks car is granted on this sync");
  assert.equal("car" in (await wornOf(sql, "gf")), false);
});
