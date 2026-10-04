// 0.0.54 gifts: the pure rules (who matches, what the client does) and the server service on PGLite with 0010.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { firstName, giftLine, giftMatches, giftsFor, planGift, type Gift, type GiftRow } from "./gifts.ts";
import { claimGift, listGifts, type GiftDeps } from "./giftService.ts";
import type { Sql } from "../lib/db.ts";

const MESSAGE = "Hope you get out of the hospital soon - Love Grok";
const HALISH_ID = "RHAYuG7IeY2PPUMk0EZ6p24RMnBDHNNC";
const known = (s: string) => ["raccoon", "giraffe", "fox"].includes(s);
const row: GiftRow = { id: "giraffe-halish", scout: "giraffe", user_id: HALISH_ID, first_name: "halish", message: MESSAGE };

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

async function setup() {
  const db = new PGlite();
  await db.exec(`create table "user" (id text primary key, name text)`);
  const mig = readFileSync(new URL("../../migrations/0010_gifts.sql", import.meta.url), "utf8");
  await db.exec(mig);
  await db.exec(mig); // idempotent, seed not doubled
  await db.query(`insert into "user" (id, name) values ($1, $2), ($3, $4), ($5, $6), ($7, $8)`, [
    HALISH_ID, "Halish",
    "dev-halish", "halish k",
    "ryan", "Ryan Gray",
    "hal", "Hal Ishmael",
  ]);
  const d: GiftDeps = { sql: sqlOf(db) };
  return { db, d };
}

test("firstName: first word, lower-cased", () => {
  assert.equal(firstName("Halish"), "halish");
  assert.equal(firstName("  HALISH   K "), "halish");
  assert.equal(firstName(""), "");
  assert.equal(firstName(null), "");
});

test("giftMatches: by user id, or by first name; nobody else", () => {
  assert.ok(giftMatches(row, { id: HALISH_ID, name: "Someone Else" }));
  assert.ok(giftMatches(row, { id: "other", name: "halish" }));
  assert.ok(giftMatches(row, { id: "other", name: "Halish Kumar" }));
  assert.ok(!giftMatches(row, { id: "other", name: "Hal" }));
  assert.ok(!giftMatches(row, { id: "other", name: "Halisha" }));
  assert.ok(!giftMatches(row, { id: "other", name: "Ryan Halish" }), "last name doesn't count");
  assert.ok(!giftMatches(row, { id: "", name: "Halish" }), "no id, no gift");
  assert.ok(!giftMatches({ user_id: null, first_name: null }, { id: "x", name: "Halish" }));
});

test("giftsFor carries the server claim flag", () => {
  assert.deepEqual(giftsFor([row], { id: HALISH_ID, name: "Halish" }, []), [{ id: row.id, scout: "giraffe", message: MESSAGE, claimed: false }]);
  assert.equal(giftsFor([row], { id: HALISH_ID, name: "Halish" }, [row.id])[0]!.claimed, true);
  assert.deepEqual(giftsFor([row], { id: "ryan", name: "Ryan Gray" }, []), []);
});

test("planGift: grants once, shows once; already-owned still shows the note; unknown scout does nothing", () => {
  const g: Gift = { id: row.id, scout: "giraffe", message: MESSAGE, claimed: false };
  assert.deepEqual(planGift(g, { scouts: ["raccoon"], giftsSeen: [] }, known), { grant: true, alreadyOwned: false, show: true });
  // After the grant and the note: nothing more to do.
  assert.deepEqual(planGift(g, { scouts: ["raccoon", "giraffe"], giftsSeen: [row.id] }, known), { grant: false, alreadyOwned: true, show: false });
  // Bought it already: no grant, note still shows once.
  assert.deepEqual(planGift(g, { scouts: ["raccoon", "giraffe"], giftsSeen: [] }, known), { grant: false, alreadyOwned: true, show: true });
  // New device after claiming elsewhere: the scout lands, the note does not show.
  assert.deepEqual(planGift({ ...g, claimed: true }, { scouts: ["raccoon"], giftsSeen: [] }, known), { grant: true, alreadyOwned: false, show: false });
  assert.deepEqual(planGift({ ...g, scout: "dragon" }, { scouts: [], giftsSeen: [] }, known), { grant: false, alreadyOwned: false, show: false });
});

test("giftLine names the scout", () => {
  assert.equal(giftLine("The Giraffe", false), "You got The Giraffe for free.");
  assert.match(giftLine("The Giraffe", true), /The Giraffe/);
});

test("seeded row: the giraffe for Halish, with the exact note", async () => {
  const { db } = await setup();
  const rows = (await db.query<GiftRow>("select id, scout, user_id, first_name, message from gifts")).rows;
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], row);
});

test("service: Halish gets it once (server claim), non-matching users get nothing and can't claim", async () => {
  const { d } = await setup();
  const first = await listGifts(d, HALISH_ID);
  assert.deepEqual(first, [{ id: "giraffe-halish", scout: "giraffe", message: MESSAGE, claimed: false }]);
  assert.deepEqual(await claimGift(d, HALISH_ID, "giraffe-halish"), { ok: true });
  assert.deepEqual(await claimGift(d, HALISH_ID, "giraffe-halish"), { ok: true }, "idempotent");
  assert.equal((await listGifts(d, HALISH_ID))[0]!.claimed, true);

  // Name fallback: a different account whose first name is Halish (e.g. a dev account).
  assert.equal((await listGifts(d, "dev-halish"))[0]!.claimed, false, "claims are per user");

  assert.deepEqual(await listGifts(d, "ryan"), []);
  assert.deepEqual(await listGifts(d, "hal"), []);
  assert.deepEqual(await listGifts(d, "nobody"), []);
  assert.deepEqual(await claimGift(d, "ryan", "giraffe-halish"), { ok: false });
  assert.deepEqual(await claimGift(d, HALISH_ID, "made-up"), { ok: false });
});
