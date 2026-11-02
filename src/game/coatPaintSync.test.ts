// 0.1.105 coat / vault paint on the account: dye:<job>:<color> (server-checked cans), dyeon:<job>:<ms> (worn pick).
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2999-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import type { LocalSnap } from "./wallet.ts";
import { applyClientOp, cansFound, dyesOf, syncPlayer } from "./walletApply.ts";
import { thanksClock } from "./thanksGift.ts";
import { EMPTY_PAINT, mergedBench, planDyeSync, visibleCoat, type PaintBench, type ServerBench } from "./paint.ts";
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
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql", "0002_vault_clears.sql", "0015_paint_finds.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };
async function finds(sql: Sql, user: string, paint: string, n: number) {
  const had = Number((await sql<{ n: number }>`select count(*)::int as n from paint_finds where user_id = ${user} and paint = ${paint}`)[0]?.n) || 0;
  for (let i = had; i < had + n; i++) await sql`insert into paint_finds (event_id, user_id, paint, clears, first) values (${`t:${user}:${paint}:${i}`}, ${user}, ${paint}, ${i + 1}, ${i === 0})`;
}
const tick = () => new Promise((r) => setTimeout(r, 5));

test("server: a mix needs cans the account can prove; replays never spend twice; coat and vault share a colour's cans", async () => {
  const sql = await db();
  await syncPlayer(sql, "dy", snap, "dyphone1");
  assert.equal((await applyClientOp(sql, "dy", { kind: "dye", job: "coat", color: "red" })).reason, "short-paint");
  await finds(sql, "dy", "red", 8);
  assert.equal((await applyClientOp(sql, "dy", { kind: "dye", job: "coat", color: "red" })).ok, true);
  assert.equal((await applyClientOp(sql, "dy", { kind: "dye", job: "coat", color: "red" })).replay, true, "mixed once");
  assert.equal((await applyClientOp(sql, "dy", { kind: "dye", job: "vault", color: "red" })).reason, "short-paint", "the coat used the 8 red cans");
  await finds(sql, "dy", "red", 10);
  assert.equal((await applyClientOp(sql, "dy", { kind: "dye", job: "vault", color: "red" })).ok, true);
  // White and blue are never logged as finds: capped by right answers on that tier.
  assert.equal((await applyClientOp(sql, "dy", { kind: "dye", job: "coat", color: "white" })).reason, "short-paint");
  await sql`insert into vault_clears (user_id, display_name, tier, correct) values ('dy', 'Dy', 'white', 3)`;
  assert.equal((await cansFound(sql, "dy")).white, 3);
  assert.equal((await applyClientOp(sql, "dy", { kind: "dye", job: "coat", color: "white" })).ok, true);
  assert.equal((await applyClientOp(sql, "dy", { kind: "dye", job: "coat", color: "plaid" as "red" })).reason, "unknown");
  const d = await dyesOf(sql, "dy");
  assert.deepEqual([d.coats, d.vaults, d.wornCoat, d.wornVault], [["red", "white"], ["red"], "white", "red"], "a mix puts itself on");
});

test("server: wear only what the account mixed; the latest pick wins; null takes it off", async () => {
  const sql = await db();
  await syncPlayer(sql, "wr", snap, "wrphone1");
  await finds(sql, "wr", "green", 5);
  await finds(sql, "wr", "prism", 1);
  assert.equal((await applyClientOp(sql, "wr", { kind: "dyeOn", job: "coat", color: "green" })).reason, "not-owned");
  assert.equal((await applyClientOp(sql, "wr", { kind: "dye", job: "coat", color: "green" })).ok, true);
  await tick();
  assert.equal((await applyClientOp(sql, "wr", { kind: "dye", job: "coat", color: "prism" })).ok, true);
  await tick();
  assert.equal((await applyClientOp(sql, "wr", { kind: "dyeOn", job: "coat", color: "green" })).ok, true);
  assert.equal((await applyClientOp(sql, "wr", { kind: "dyeOn", job: "coat", color: "green" })).replay, true);
  assert.equal((await dyesOf(sql, "wr")).wornCoat, "green");
  await tick();
  assert.equal((await applyClientOp(sql, "wr", { kind: "dyeOn", job: "coat", color: null })).ok, true);
  assert.equal((await dyesOf(sql, "wr")).wornCoat, null);
  assert.equal((await applyClientOp(sql, "wr", { kind: "dyeOn", job: "vault", color: "green" })).reason, "not-owned", "a coat mix is not a vault mix");
});

/** One device: its local bench, run through the same plan/merge the store's syncDyes uses, against the real server. */
async function deviceSync(sql: Sql, user: string, device: string, local: PaintBench): Promise<PaintBench> {
  const s = await syncPlayer(sql, user, snap, device);
  const server = s.owned!.dyes as ServerBench;
  const plan = planDyeSync(local, server);
  const taken: PaintBench = { ...server, coats: [...server.coats], vaults: [...server.vaults] };
  for (const b of plan.backfill) if ((await applyClientOp(sql, user, { kind: "dye", job: b.job, color: b.color })).ok) (b.job === "coat" ? taken.coats : taken.vaults).push(b.color);
  if (plan.backfill.length || server.rows === 0)
    for (const job of ["coat", "vault"] as const) {
      const want = plan.wear[job];
      if (want === null || (job === "coat" ? taken.coats : taken.vaults).includes(want)) await applyClientOp(sql, user, { kind: "dyeOn", job, color: want });
      await tick();
    }
  return mergedBench(local, taken, plan.wear);
}

test("cross-device: the phone's mixes backfill on first sync; the desktop then shows the same coat paint and picks", async () => {
  const sql = await db();
  await finds(sql, "rg", "amber", 6);
  await finds(sql, "rg", "violet", 12);
  // The phone mixed before 0.1.105: amber coat (worn) and violet vaults (worn), plus a red coat from cans the server never saw.
  const phone: PaintBench = { coats: ["amber", "red"], vaults: ["violet"], wornCoat: "amber", wornVault: "violet" };
  const phoneAfter = await deviceSync(sql, "rg", "rgphone1", phone);
  assert.deepEqual(phoneAfter, phone, "nothing on the phone is lost, even the mix the server refused");
  const acct = await dyesOf(sql, "rg");
  assert.deepEqual([acct.coats, acct.vaults, acct.wornCoat, acct.wornVault], [["amber"], ["violet"], "amber", "violet"]);
  // The desktop never mixed anything.
  const desk = await deviceSync(sql, "rg", "rgdesk1", EMPTY_PAINT);
  assert.deepEqual(desk, { coats: ["amber"], vaults: ["violet"], wornCoat: "amber", wornVault: "violet" });
  assert.equal(visibleCoat(desk.wornCoat, null), "dye-amber", "the walker wears the same coat paint");
  // The desktop takes the coat paint off; the phone picks it up on its next sync.
  await tick();
  await applyClientOp(sql, "rg", { kind: "dyeOn", job: "coat", color: null });
  const phone2 = await deviceSync(sql, "rg", "rgphone1", phoneAfter);
  assert.equal(phone2.wornCoat, null);
  assert.equal(phone2.wornVault, "violet");
  assert.deepEqual((await dyesOf(sql, "rg")).coats, ["amber"], "the refused red is offered again but still not proven");
});

test("plan: the account's picks win after its first sync; a device's own picks seed an empty account", () => {
  const local: PaintBench = { coats: ["blue"], vaults: [], wornCoat: "blue", wornVault: null };
  assert.deepEqual(planDyeSync(local, { ...EMPTY_PAINT, rows: 0 }), { backfill: [{ job: "coat", color: "blue" }], wear: { coat: "blue", vault: null } });
  const acct: ServerBench = { coats: ["green"], vaults: [], wornCoat: "green", wornVault: null, rows: 1 };
  const p = planDyeSync(local, acct);
  assert.deepEqual(p.wear, { coat: "green", vault: null });
  assert.deepEqual(mergedBench(local, acct, p.wear), { coats: ["green", "blue"], vaults: [], wornCoat: "green", wornVault: null });
});

test("wiring: the vat and the wear buttons tell the account; sign-in lines the bench up once the wallet is live", () => {
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  assert.match(store, /pushOp\(\{ kind: "dye", job, color \}\)/);
  assert.match(store, /pushOp\(\{ kind: "dyeOn", job, color \}\)/);
  assert.match(store, /accountDyes = o\.dyes \? cleanServerBench\(o\.dyes\) : null/);
  const sync = readFileSync(new URL("../components/keyline/WalletSync.tsx", import.meta.url), "utf8");
  assert.ok(sync.indexOf("syncDyes()") > sync.indexOf("setWalletLive(true)"), "after the wallet goes live, or the ops are dropped");
});
