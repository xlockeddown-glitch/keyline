// 0.1.45: the one-time love gift goes to the account whose sign-in email is Amanda's, once, and to nobody else.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { COIN_CAP, type LocalSnap } from "./wallet.ts";
import { canonicalWallet } from "./walletSql.ts";
import { syncPlayer } from "./walletApply.ts";
import { thanksClock } from "./thanksGift.ts";
import { LOVE_COIN, LOVE_GIFT_KEY, LOVE_NOTE, lampGiftClock, welcomeClock } from "./lampGift.ts";

thanksClock.cutoff = "2000-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}
async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0001_auth.sql", "0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql"]) await pg.exec(readFileSync(new URL(`../../migrations/${m}`, import.meta.url), "utf8"));
  const add = (id: string, name: string, email: string) => pg.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1, $2, $3, true, now(), now())`, [id, name, email]);
  await add("amanda", "Amanda G", " OMFGitsMandy@gmail.com ");
  await add("other-amanda", "Amanda G", "amanda.g@example.com");
  await add("ryan", "Ryan Gray", "ryan@example.com");
  return { sql: sqlOf(pg), pg };
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "detroit", unlocked: ["detroit"], freePick: false } };
const coins = async (sql: Sql, u: string) => (await canonicalWallet(sql, u)).wallet.coins;
const rows = async (sql: Sql) => sql<{ user_id: string }>`select user_id from wallet_ledger where op_key = ${LOVE_GIFT_KEY}`;

test("the love gift pays Amanda's account 200,000 once with the note; a same-name account and anyone else get nothing", async () => {
  const { sql } = await db();
  const a = await syncPlayer(sql, "amanda", snap, "a-phone");
  assert.deepEqual(a.giftNotes?.filter((n) => n.startsWith("I Love")), [LOVE_NOTE]);
  assert.equal(LOVE_NOTE, "I Love you");
  const after = await coins(sql, "amanda");
  assert.ok(after >= LOVE_COIN);
  // Replay: no second pay, no second note.
  const again = await syncPlayer(sql, "amanda", snap, "a-phone");
  assert.ok(!(again.giftNotes ?? []).some((n) => n.startsWith("I Love")));
  assert.equal(await coins(sql, "amanda"), after);
  await syncPlayer(sql, "amanda", snap, "a-laptop");
  assert.equal(await coins(sql, "amanda"), after, "a second device doesn't pay it again");
  for (const u of ["other-amanda", "ryan", "no-user-row"]) {
    const r = await syncPlayer(sql, u, snap, `${u}-phone`);
    assert.ok(!(r.giftNotes ?? []).some((n) => n.startsWith("I Love")), u);
    assert.ok((await coins(sql, u)) < LOVE_COIN, u);
  }
  assert.deepEqual((await rows(sql)).map((r) => r.user_id), [(await canonicalWallet(sql, "amanda")).id]);
});

test("near the cap the gift clamps and the note says so; not doubled by the first hour (gift: isn't a doubled prefix)", async () => {
  const { sql } = await db();
  await syncPlayer(sql, "ryan", snap, "r");
  const id = (await canonicalWallet(sql, "amanda")).id;
  await sql`insert into player_wallets (user_id, coins) values (${id}, ${COIN_CAP - 1000}) on conflict (user_id) do update set coins = ${COIN_CAP - 1000}`;
  const r = await syncPlayer(sql, "amanda", snap, "a");
  const note = (r.giftNotes ?? []).find((n) => n.startsWith("I Love"));
  assert.ok(note && note !== LOVE_NOTE && /cap/.test(note), note);
  assert.equal(await coins(sql, "amanda"), COIN_CAP);
});
