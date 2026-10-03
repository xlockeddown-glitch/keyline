// 0.0.50 friend tickets, API level: the handlers each server function runs (validation → caller → rate limit →
// service), on PGLite with the auth tables (0001) and migration 0009, playing the whole A→B story through them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { CARD_MS } from "./friendTicket.ts";
import { RATE, type FriendCard, type FriendDeps } from "./friendService.ts";
import { apiAck, apiAnswer, apiNews, apiOpen, apiPeek, apiSend } from "./friendHandlers.ts";
import type { Sql } from "../lib/db.ts";

const migration = (name: string) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8");

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}

const CARD: FriendCard = { id: "p00c0ffee", q: "Which river runs through Austin?", choices: ["Colorado", "Brazos", "Pecos", "Trinity"], answer: "Colorado", fact: "Lady Bird Lake is a reservoir on it.", diff: 2 };

async function setup(start = Date.UTC(2026, 9, 3, 12, 0, 0)) {
  const db = new PGlite();
  await db.exec(migration("0001_auth.sql"));
  await db.exec(migration("0009_friend_tickets.sql"));
  const users: [string, string][] = [["ann", "Ann Marie Baker"], ["ben", "ben carter"], ["cat", "Cat"]];
  for (const [id, name] of users) {
    await db.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1, $2, $3, true, now(), now())`, [id, name, `${id}@example.test`]);
  }
  let now = start;
  const d: FriendDeps = { sql: sqlOf(db), now: () => now, findCard: (id) => (id === CARD.id ? CARD : null) };
  return { db, d, tick: (ms: number) => (now += ms) };
}

test("API: A sends, B redeems right → both +1 white in news, sender sees 'Ben C.'; replays and self are refused", async () => {
  const { db, d, tick } = await setup();
  const sent = await apiSend(d, "ann", { cardId: CARD.id });
  assert.ok("ok" in sent && sent.ok);
  if (!("ok" in sent) || !sent.ok) return;

  const peek = await apiPeek(d, "1.2.3.4", { token: sent.token });
  assert.deepEqual(peek, { status: "live", from: "Ann B.", expiresAt: sent.expiresAt });

  const self = await apiOpen(d, "ann", { token: sent.token });
  assert.equal(self.status, "self", "no self-redeem");

  const open = await apiOpen(d, "ben", { token: sent.token });
  assert.equal(open.status, "play");
  const wire = JSON.stringify(open);
  assert.ok(!wire.includes('"answer"') && !wire.includes("Lady Bird"), "the play payload carries no answer or fact");
  assert.equal("msLeft" in open && open.msLeft, CARD_MS, "timed like a lamp card");

  assert.equal((await apiOpen(d, "cat", { token: sent.token })).status, "taken", "one redemption per ticket");
  assert.deepEqual(await apiAnswer(d, "ann", { token: sent.token, choice: "Colorado" }), { status: "reject", reason: "self" });

  tick(3000);
  const got = await apiAnswer(d, "ben", { token: sent.token, choice: "Colorado" });
  assert.equal(got.status, "scored");
  assert.ok(got.status === "scored" && got.correct && got.rewarded);

  const again = await apiAnswer(d, "ben", { token: sent.token, choice: "Brazos" });
  assert.ok(again.status === "scored" && again.correct && again.rewarded, "a replayed answer just reports the first");
  assert.deepEqual(await apiAnswer(d, "cat", { token: sent.token, choice: "Colorado" }), { status: "reject", reason: "not-yours" });

  const annNews = await apiNews(d, "ann");
  assert.deepEqual(annNews, [{ id: `s:${sent.token}`, role: "sender", name: "Ben C." }], "sender's toast names First L.");
  const benNews = await apiNews(d, "ben");
  assert.deepEqual(benNews, [{ id: `f:${sent.token}`, role: "friend", name: "Ann B." }]);
  assert.deepEqual(await apiAck(d, "ann", { ids: annNews.map((n) => n.id) }), { acked: 1 });
  assert.deepEqual(await apiNews(d, "ann"), []);
  await db.close();
});

test("API: guests can't send; bad input is refused before any work", async () => {
  const { db, d } = await setup();
  assert.deepEqual(await apiSend(d, null, { cardId: CARD.id }), { ok: false, reason: "guest", left: 0 });
  await assert.rejects(apiSend(d, "ann", { cardId: "x; drop table friend_tickets" }));
  await assert.rejects(apiOpen(d, "ben", { token: "short" }));
  await assert.rejects(apiAnswer(d, "ben", { token: "a".repeat(24), choice: "" }));
  await assert.rejects(apiAck(d, "ben", { ids: Array.from({ length: 41 }, () => "s:x") }));
  const n = await db.query<{ n: number }>("select count(*)::int as n from friend_tickets");
  assert.equal(n.rows[0]!.n, 0);
  await db.close();
});

test("API: daily caps hold through the endpoints (5 sends, 3 rewarded, pair once)", async () => {
  const { db, d } = await setup();
  const tokens: string[] = [];
  for (let i = 0; i < 6; i++) {
    const r = await apiSend(d, "ann", { cardId: CARD.id });
    if ("ok" in r && r.ok) tokens.push(r.token);
    else assert.deepEqual(r, { ok: false, reason: "daily-cap", left: 0 });
  }
  assert.equal(tokens.length, 5);
  // Ben answers two of Ann's tickets right: only the first pays (pair once a day).
  const results = [];
  for (const t of tokens.slice(0, 2)) {
    await apiOpen(d, "ben", { token: t });
    results.push(await apiAnswer(d, "ben", { token: t, choice: "Colorado" }));
  }
  assert.deepEqual(results.map((r) => r.status === "scored" && r.rewarded), [true, false]);
  assert.equal(results[1]!.status === "scored" && results[1]!.why, "pair-cap");
  await db.close();
});

test("API: every endpoint is rate-limited per caller", async () => {
  const { db, d } = await setup();
  const token = "b".repeat(24);
  const peeks = [];
  for (let i = 0; i < RATE.peek.limit + 1; i++) peeks.push(await apiPeek(d, "9.9.9.9", { token }));
  assert.equal(peeks.at(-1)!.status, "slow");
  assert.equal((await apiPeek(d, "8.8.8.8", { token })).status, "missing", "another IP is unaffected");

  const opens = [];
  for (let i = 0; i < RATE.play.limit + 1; i++) opens.push(await apiOpen(d, "ben", { token }));
  assert.equal(opens.at(-1)!.status, "slow");
  assert.equal((await apiAnswer(d, "ben", { token, choice: "x" })).status, "slow", "open and answer share one bucket");

  const sends = [];
  for (let i = 0; i < RATE.create.limit + 1; i++) sends.push(await apiSend(d, "cat", { cardId: "unknown" }));
  assert.deepEqual(sends.at(-1), { status: "slow" });

  for (let i = 0; i < RATE.news.limit; i++) await apiNews(d, "cat");
  assert.deepEqual(await apiNews(d, "cat"), []);
  for (let i = 0; i < RATE.ack.limit; i++) await apiAck(d, "cat", { ids: [] });
  assert.deepEqual(await apiAck(d, "cat", { ids: [] }), { acked: 0 });
  await db.close();
});
