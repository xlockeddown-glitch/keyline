// 0.1.149: 8,000 coin for a brighter hearth trim. One charge per hearth per seven-day window.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { thanksClock } from "./thanksGift.ts";
thanksClock.cutoff = "2000-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { HEARTH_CUT } from "./placedLantern.ts";
import { HEARTH_POLISH_MS, HEARTH_POLISH_PRICE, hearthWeek, polishLive } from "./hearthPolish.ts";
import type { LocalSnap } from "./wallet.ts";

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
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql", "0013_trivia_recent.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap = (coins: number): LocalSnap => ({ coins, keys: { green: 5, red: 1 }, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } });

test("hearth polish: 8,000 once, a full week of trim, no second charge, and the cut is untouched", async () => {
  const { applyClientOp, awardGrade, grantHearthPolish, placedViews, syncPlayer } = await import("./walletApply.ts");
  const { canonicalWallet } = await import("./walletSql.ts");
  const { placedId } = await import("./hearthVaults.ts");
  const { CITIES } = await import("./data.ts");
  const { PLANT_RED_NEED } = await import("./placedLantern.ts");
  const sql = await db();
  await syncPlayer(sql, "ace", snap(0), "acephone1");
  for (let i = 0; i < PLANT_RED_NEED; i++) {
    await awardGrade(sql, "ace", `ace-r-${i}`, {
      correct: true, elapsedMs: 2000, mult: 1, city: "austin", diff: 2, clearTier: "red", poiTier: "red", poiId: "red-lamp",
      lat: 30.28, lng: -97.74, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], topic: null,
      dealtAt: Date.UTC(2026, 9, 16, 18), luckyHit: false, perfectBlue: false, prevNonce: "",
    });
  }
  const s = CITIES.austin.spawn;
  const planted = await applyClientOp(sql, "ace", { kind: "plant", city: "austin", lat: s.lat + 0.004, lng: s.lng + 0.004, name: 0, cats: ["local", "history", "science", "music"] });
  assert.equal(planted.ok, true, String(planted.reason));
  const id = placedId("ace");
  const week = 1_000;
  const at = week * HEARTH_POLISH_MS + 3_600_000;
  await sql`update player_wallets set coins = 100 where user_id = 'ace'`;

  const short = await grantHearthPolish(sql, "ace", id, at);
  assert.equal(short.ok, false);
  assert.equal(short.reason, "short-coins");
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 100);
  const rows = async () => sql<{ n: string }>`select count(*) as n from wallet_ledger where user_id = 'ace' and op_key like ${"hpolish:%"}`;
  assert.equal(Number((await rows())[0]?.n ?? 0), 0, "a short pocket leaves no row, so a later pay can succeed");

  await sql`update player_wallets set coins = 24000 where user_id = 'ace'`;
  const stranger = await grantHearthPolish(sql, "ace", "placed-nope", at);
  assert.equal(stranger.reason, "unknown");
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 24000);

  const keysBefore = (await canonicalWallet(sql, "ace")).wallet.keys;
  const bought = await grantHearthPolish(sql, "ace", id, at);
  assert.equal(bought.ok, true);
  assert.equal(bought.replay, false);
  assert.equal(bought.polish?.until, at + HEARTH_POLISH_MS);
  assert.equal(polishLive(bought.polish?.until, at + HEARTH_POLISH_MS - 1), true);
  assert.equal(polishLive(bought.polish?.until, at + HEARTH_POLISH_MS), false);
  const pocket = await canonicalWallet(sql, "ace");
  assert.equal(pocket.wallet.coins, 24_000 - HEARTH_POLISH_PRICE);
  assert.deepEqual(pocket.wallet.keys, keysBefore);

  const again = await grantHearthPolish(sql, "ace", id, at + 60_000);
  assert.equal(again.replay, true);
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 24_000 - HEARTH_POLISH_PRICE, "a refresh in the same window does not charge");

  const still = await grantHearthPolish(sql, "ace", id, at + HEARTH_POLISH_MS - 1_000);
  assert.equal(still.replay, true);
  assert.equal(hearthWeek(at + HEARTH_POLISH_MS - 1_000), week + 1, "the next bucket has started");
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 24_000 - HEARTH_POLISH_PRICE, "a new bucket does not charge while the trim is still up");

  const next = await grantHearthPolish(sql, "ace", id, at + HEARTH_POLISH_MS + 1_000);
  assert.equal(next.ok, true);
  assert.equal(next.replay, false);
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 24_000 - HEARTH_POLISH_PRICE * 2);

  assert.equal(HEARTH_CUT, 50);
  await sql`update player_wallets set coins = ${HEARTH_POLISH_PRICE} where user_id = 'ace'`;
  const live = await grantHearthPolish(sql, "ace", id, Date.now());
  assert.equal(live.ok, true);
  assert.equal(live.replay, false);
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 0);
  const views = await placedViews(sql, "austin", "ace");
  assert.ok((views[0]?.polish ?? 0) > Date.now());
  assert.equal(JSON.stringify(views).includes('"ace"'), false, "the public list still hides the owner id");
  const wire = await applyClientOp(sql, "ace", { kind: "hpolish", id });
  assert.equal(wire.replay, true);
  assert.equal((await canonicalWallet(sql, "ace")).wallet.coins, 0);
});

test("hearth polish is a look only: the charge does not touch pay", () => {
  const src = readFileSync(new URL("./walletApply.ts", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export async function grantHearthPolish"), src.indexOf("function refused"));
  assert.doesNotMatch(fn, /HEARTH_CUT|hearthBoost|marketCoinX|keys:/);
  assert.match(src, /op.kind === "hpolish"/);
  const client = readFileSync(new URL("./plantClient.ts", import.meta.url), "utf8");
  const tap = client.slice(client.indexOf("export async function polishHearth"), client.indexOf("export const plantNowPlaced"));
  assert.match(tap, /keepPoints\(before - HEARTH_POLISH_PRICE\)/);
  assert.match(tap, /showPolish\(id, polishUntil\(now\)\)/);
  assert.match(tap, /keepPoints\(before\)/);
  assert.match(tap, /showPolish\(id, prevPolish\)/);
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  const block = css.slice(css.indexOf("0.1.149 hearth polish"), css.indexOf("/* 0.1.111", css.indexOf("0.1.149 hearth polish")));
  assert.match(block, /is-polished/);
  assert.match(block, /#e0c788/);
  assert.doesNotMatch(block, /@keyframes/);
  const pin = readFileSync(new URL("./pins.ts", import.meta.url), "utf8");
  assert.match(pin, /is-polished/);
});
