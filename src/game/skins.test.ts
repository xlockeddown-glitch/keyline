// 0.1.61 map skins: four skins, two free, two bought with coin (skin:<id>), the worn one per account (skinon:<ms>).
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
import { applyClientOp, skinsOf, syncPlayer } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { SKINS, cleanSkins, skinOwned, skinShown } from "./skins.ts";
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
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };

test("skin list, prices and what shows", () => {
  assert.deepEqual(SKINS.map((s) => [s.id, s.price]), [["default", 0], ["moonlight", 0], ["mars", 50_000], ["neon", 50_000]]);
  assert.equal(skinOwned("moonlight", []), true);
  assert.equal(skinOwned("mars", []), false);
  assert.equal(skinOwned("mars", ["mars"]), true);
  assert.equal(skinShown("mars", [], null), "default", "an unowned choice falls back");
  assert.equal(skinShown("mars", ["mars"], null), "mars");
  assert.equal(skinShown("default", [], "neon"), "neon", "a guest can preview anything");
  assert.equal(skinShown("bogus", [], null), "default");
  assert.deepEqual(cleanSkins(["mars", "mars", "moonlight", "x", 3]), ["mars"]);
});

test("buy and wear: coin price, no double charge, can't wear unowned, choice syncs per account", async () => {
  const sql = await db();
  await syncPlayer(sql, "skn", snap, "sknphone1");
  const wid = (await canonicalWallet(sql, "skn")).id;
  const coins = async () => (await canonicalWallet(sql, "skn")).wallet.coins;
  await sql`update player_wallets set coins = 49999 where user_id = ${wid}`;
  assert.equal((await applyClientOp(sql, "skn", { kind: "skin", id: "mars" })).reason, "short-coins");
  assert.equal((await applyClientOp(sql, "skn", { kind: "skinOn", id: "mars" })).reason, "not-owned");
  assert.equal((await applyClientOp(sql, "skn", { kind: "skin", id: "pluto" })).reason, "unknown");
  await sql`update player_wallets set coins = 120000 where user_id = ${wid}`;
  assert.equal((await applyClientOp(sql, "skn", { kind: "skin", id: "mars" })).ok, true);
  assert.equal(await coins(), 70_000);
  assert.equal((await applyClientOp(sql, "skn", { kind: "skin", id: "mars" })).replay, true);
  assert.equal(await coins(), 70_000, "no double charge");
  assert.equal((await applyClientOp(sql, "skn", { kind: "skin", id: "moonlight" })).replay, true, "free skins cost nothing");
  assert.equal(await coins(), 70_000);
  assert.equal((await applyClientOp(sql, "skn", { kind: "skinOn", id: "mars" })).ok, true);
  assert.deepEqual(await skinsOf(sql, "skn"), { skins: ["mars"], skin: "mars" });
  await new Promise((r) => setTimeout(r, 5));
  assert.equal((await applyClientOp(sql, "skn", { kind: "skinOn", id: "moonlight" })).ok, true);
  const s = await syncPlayer(sql, "skn", snap, "sknphone2");
  assert.deepEqual(s.owned?.skins, ["mars"]);
  assert.equal(s.owned?.skin, "moonlight", "the latest choice wins on another device");
});

test("skins reuse the tile filter: one filter per skin, no animation, route accent only", () => {
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  const block = css.slice(css.indexOf("/* 0.1.61 map skins")).replace(/^\/\*.*?\*\//, "");
  for (const id of ["moonlight", "mars", "neon"]) assert.match(block, new RegExp(`:root\\[data-map-skin="${id}"\\] \\.atlas-tiles \\{ filter: `));
  assert.doesNotMatch(block, /animation|@keyframes|transition/);
  const pkg = readFileSync(new URL("../../package.json", import.meta.url), "utf8");
  assert.match(pkg, /src\/game\/skins\.test\.ts/);
});
