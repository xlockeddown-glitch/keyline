// 0.0.50 friend tickets, API level: the service the server functions call, run on PGLite with migration 0009.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { CARD_MS, TICKET_TTL_MS, isToken } from "./friendTicket.ts";
import {
  RATE,
  ackNews,
  answerTicket,
  createTicket,
  friendNews,
  openTicket,
  peekTicket,
  rateHit,
  type FriendCard,
  type FriendDeps,
} from "./friendService.ts";
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
const ann = { id: "ann", name: "Ann B." };
const ben = { id: "ben", name: "Ben C." };
const cat = { id: "cat", name: "Cat D." };

async function setup(start = Date.UTC(2026, 9, 3, 12, 0, 0)) {
  const db = new PGlite();
  await db.exec(migration("0009_friend_tickets.sql"));
  await db.exec(migration("0009_friend_tickets.sql")); // idempotent
  let now = start;
  const d: FriendDeps = { sql: sqlOf(db), now: () => now, findCard: (id) => (id === CARD.id ? CARD : null) };
  return { db, d, tick: (ms: number) => (now += ms), at: () => now };
}

test("send → peek → friend opens (no answer sent) → right answer pays both → news once each", async () => {
  const { db, d, tick } = await setup();
  const made = await createTicket(d, ann, CARD.id);
  assert.ok(made.ok);
  if (!made.ok) return;
  assert.ok(isToken(made.token));
  assert.equal(made.left, 4);

  const peek = await peekTicket(d, made.token);
  assert.deepEqual(peek, { status: "live", from: "Ann B.", expiresAt: made.expiresAt });
  assert.ok(!JSON.stringify(peek).includes("Colorado"), "the peek never carries the card");

  tick(2000);
  const open = await openTicket(d, ben, made.token);
  assert.equal(open.status, "play");
  if (open.status !== "play") return;
  assert.equal(open.q, CARD.q);
  assert.deepEqual([...open.choices].sort(), [...CARD.choices].sort());
  assert.equal(open.msLeft, CARD_MS);
  assert.ok(!("answer" in open) && !("fact" in open), "the answer stays on the server until the friend answers");

  tick(4000);
  const got = await answerTicket(d, ben, made.token, "Colorado");
  assert.equal(got.status, "scored");
  if (got.status !== "scored") return;
  assert.equal(got.correct, true);
  assert.equal(got.rewarded, true);
  assert.equal(got.answer, "Colorado");

  const annNews = await friendNews(d, "ann");
  assert.deepEqual(annNews, [{ id: `s:${made.token}`, role: "sender", name: "Ben C." }]);
  const benNews = await friendNews(d, "ben");
  assert.deepEqual(benNews, [{ id: `f:${made.token}`, role: "friend", name: "Ann B." }]);
  // Acks are scoped: Ben can't ack Ann's side.
  assert.equal(await ackNews(d, "ben", [`s:${made.token}`]), 0);
  assert.equal(await ackNews(d, "ann", [`s:${made.token}`]), 1);
  assert.equal(await ackNews(d, "ben", [`f:${made.token}`]), 1);
  assert.deepEqual(await friendNews(d, "ann"), []);
  assert.deepEqual(await friendNews(d, "ben"), []);
  await db.close();
});

test("rejections: self-redemption, second redemption, a second answer, expiry, unknown card", async () => {
  const { db, d, tick } = await setup();
  const made = await createTicket(d, ann, CARD.id);
  assert.ok(made.ok);
  if (!made.ok) return;
  assert.equal((await openTicket(d, ann, made.token)).status, "self");
  assert.deepEqual(await answerTicket(d, ann, made.token, "Colorado"), { status: "reject", reason: "self" });
  assert.deepEqual(await answerTicket(d, ben, made.token, "Colorado"), { status: "reject", reason: "not-open" });

  assert.equal((await openTicket(d, ben, made.token)).status, "play");
  assert.equal((await openTicket(d, cat, made.token)).status, "taken", "one redemption per ticket");
  assert.deepEqual(await answerTicket(d, cat, made.token, "Colorado"), { status: "reject", reason: "not-yours" });
  const first = await answerTicket(d, ben, made.token, "Brazos");
  assert.equal(first.status === "scored" && first.correct, false);
  const second = await answerTicket(d, ben, made.token, "Colorado");
  assert.equal(second.status === "scored" && second.correct, false, "a second answer can't flip a miss");
  assert.equal((await peekTicket(d, made.token)).status, "used");
  assert.equal((await openTicket(d, ben, made.token)).status, "scored");

  const old = await createTicket(d, ann, CARD.id);
  assert.ok(old.ok);
  if (!old.ok) return;
  tick(TICKET_TTL_MS);
  assert.equal((await peekTicket(d, old.token)).status, "expired");
  assert.equal((await openTicket(d, ben, old.token)).status, "expired");

  // 48 h on it is a new UTC day, so all five of today's tickets are back.
  assert.deepEqual(await createTicket(d, ann, "p_made_up"), { ok: false, reason: "unknown-card", left: 5 });
  assert.deepEqual(await createTicket(d, null, CARD.id), { ok: false, reason: "guest", left: 0 });
  assert.equal((await openTicket(d, ben, "nope")).status, "missing");
  assert.equal((await peekTicket(d, "x".repeat(24))).status, "missing");
  await db.close();
});

test("a late answer (past the wick, on the server clock) pays nothing; a lapsed reopen scores a miss", async () => {
  const { db, d, tick } = await setup();
  const a = await createTicket(d, ann, CARD.id);
  const b = await createTicket(d, ann, CARD.id);
  if (!a.ok || !b.ok) throw new Error("create failed");
  await openTicket(d, ben, a.token);
  tick(CARD_MS + 5000);
  const late = await answerTicket(d, ben, a.token, "Colorado");
  assert.equal(late.status, "scored");
  if (late.status === "scored") {
    assert.equal(late.rewarded, false);
    assert.equal(late.why, "late");
  }
  await openTicket(d, cat, b.token);
  tick(CARD_MS + 1);
  const lapsed = await openTicket(d, cat, b.token);
  assert.equal(lapsed.status, "scored");
  await db.close();
});

test("caps: 5 tickets a UTC day, 3 rewarded redemptions a sender a day, a pair once a day (either direction)", async () => {
  const { db, d, tick } = await setup(Date.UTC(2026, 9, 3, 10, 0, 0));
  const tokens: string[] = [];
  for (let i = 0; i < 5; i++) {
    const r = await createTicket(d, ann, CARD.id);
    assert.ok(r.ok, `ticket ${i + 1}`);
    if (r.ok) tokens.push(r.token);
  }
  assert.deepEqual(await createTicket(d, ann, CARD.id), { ok: false, reason: "daily-cap", left: 0 });

  const friends = ["f1", "f2", "f3", "f4"].map((id) => ({ id, name: `${id} X.` }));
  const paid: boolean[] = [];
  for (const [i, f] of friends.entries()) {
    await openTicket(d, f, tokens[i]!);
    const r = await answerTicket(d, f, tokens[i]!, "Colorado");
    paid.push(r.status === "scored" && r.rewarded);
    if (i === 3 && r.status === "scored") assert.equal(r.why, "sender-cap");
  }
  assert.deepEqual(paid, [true, true, true, false], "the sender's 4th right answer of the day pays nobody");

  // Pair rule: f1 already shared a white with Ann today — in the other direction too.
  const back = await createTicket(d, friends[0]!, CARD.id);
  if (!back.ok) throw new Error("f1 create failed");
  await openTicket(d, ann, back.token);
  const r = await answerTicket(d, ann, back.token, "Colorado");
  assert.equal(r.status === "scored" && r.why, "pair-cap");

  // Next UTC day: fresh caps.
  tick(14 * 3600 * 1000);
  const fresh = await createTicket(d, ann, CARD.id);
  assert.ok(fresh.ok);
  if (!fresh.ok) return;
  assert.equal(fresh.left, 4);
  await openTicket(d, friends[0]!, fresh.token);
  const again = await answerTicket(d, friends[0]!, fresh.token, "Colorado");
  assert.equal(again.status === "scored" && again.rewarded, true);
  const days = await db.query<{ day: string; created: number; rewarded: number }>("select day, created, rewarded from friend_ticket_days where sender_id = 'ann' order by day");
  assert.deepEqual(days.rows, [
    { day: "2026-10-03", created: 5, rewarded: 3 },
    { day: "2026-10-04", created: 1, rewarded: 1 },
  ]);
  await db.close();
});

test("the database refuses a second reward for a pair on one day even if the app check is raced", async () => {
  const { db, d } = await setup();
  const a = await createTicket(d, ann, CARD.id);
  const b = await createTicket(d, ann, CARD.id);
  if (!a.ok || !b.ok) throw new Error("create failed");
  await openTicket(d, ben, a.token);
  await openTicket(d, ben, b.token);
  const [x, y] = await Promise.all([answerTicket(d, ben, a.token, "Colorado"), answerTicket(d, ben, b.token, "Colorado")]);
  const rewarded = [x, y].filter((r) => r.status === "scored" && r.rewarded).length;
  assert.equal(rewarded, 1);
  const n = await db.query<{ n: number }>("select count(*)::int as n from friend_tickets where rewarded");
  assert.equal(n.rows[0]!.n, 1);
  const s = await db.query<{ rewarded: number }>("select rewarded from friend_ticket_days where sender_id = 'ann'");
  assert.equal(s.rows[0]!.rewarded, 1, "the losing racer gives its sender slot back");
  await db.close();
});

test("rate limit: a bucket refuses past its limit inside one window, then resets", async () => {
  const { db, d, at } = await setup();
  const rule = RATE.create;
  const hits: boolean[] = [];
  for (let i = 0; i < rule.limit + 2; i++) hits.push(await rateHit(d.sql, "create:ann", rule, at()));
  assert.equal(hits.filter(Boolean).length, rule.limit);
  assert.equal(await rateHit(d.sql, "create:ben", rule, at()), true, "buckets are per user");
  assert.equal(await rateHit(d.sql, "create:ann", rule, at() + rule.windowMs), true);
  await db.close();
});
