import { payMatchesOf } from "./goals.ts";
// 0.0.50 friend tickets: the reward and anti-abuse rules on their own.
import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  ANSWER_GRACE_MS,
  CARD_MS,
  DAILY_REWARDS,
  DAILY_TICKETS,
  TICKET_TTL_MS,
  answerDecision,
  createDecision,
  dealChoices,
  isToken,
  markFriendPaid,
  newToken,
  openDecision,
  pairKey,
  payFriend,
  rewardDecision,
  rewardLine,
  utcDay,
  type TicketRow,
} from "./friendTicket.ts";
import { matchCap } from "./ticket.ts";

const T0 = Date.UTC(2026, 9, 3, 18, 0, 0);
const row = (p: Partial<TicketRow> = {}): TicketRow => ({
  token: "a".repeat(24),
  senderId: "ann",
  senderName: "Ann B.",
  createdAt: T0,
  expiresAt: T0 + TICKET_TTL_MS,
  friendId: null,
  openedAt: null,
  answeredAt: null,
  correct: null,
  rewarded: false,
  ...p,
});

test("caps and timing match the brief", () => {
  assert.equal(TICKET_TTL_MS, 48 * 3600 * 1000);
  assert.equal(DAILY_TICKETS, 5);
  assert.equal(DAILY_REWARDS, 3);
  assert.equal(CARD_MS, 25_000, "timed like a lamp card");
});

test("tokens are 24-char base64url from 144 random bits, and never repeat", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 2000; i++) {
    const t = newToken();
    assert.ok(isToken(t), t);
    seen.add(t);
  }
  assert.equal(seen.size, 2000);
  assert.ok(!isToken("short"));
  assert.ok(!isToken("a".repeat(23) + "/"));
  assert.ok(!isToken("../../etc/passwd/aaaaaaaa"));
});

test("guests can't send; 5 tickets per UTC day; unknown cards can't travel", () => {
  assert.deepEqual(createDecision({ signedIn: false, createdToday: 0, cardKnown: true }), { kind: "reject", reason: "guest" });
  assert.deepEqual(createDecision({ signedIn: true, createdToday: 0, cardKnown: false }), { kind: "reject", reason: "unknown-card" });
  for (let n = 0; n < DAILY_TICKETS; n++) assert.equal(createDecision({ signedIn: true, createdToday: n, cardKnown: true }).kind, "ok");
  assert.deepEqual(createDecision({ signedIn: true, createdToday: 5, cardKnown: true }), { kind: "reject", reason: "daily-cap" });
});

test("UTC day boundaries, not local time", () => {
  assert.equal(utcDay(Date.UTC(2026, 9, 3, 23, 59, 59)), "2026-10-03");
  assert.equal(utcDay(Date.UTC(2026, 9, 4, 0, 0, 0)), "2026-10-04");
});

test("open: no self-redemption, one redemption, 48 h expiry, resume keeps the same clock", () => {
  assert.equal(openDecision(null, "ben", T0).kind, "missing");
  assert.equal(openDecision(row(), "ann", T0).kind, "self");
  assert.equal(openDecision(row(), "ben", T0 + 1000).kind, "claim");
  assert.equal(openDecision(row(), "ben", T0 + TICKET_TTL_MS - 1).kind, "claim");
  assert.equal(openDecision(row(), "ben", T0 + TICKET_TTL_MS).kind, "expired");
  const opened = row({ friendId: "ben", openedAt: T0 + 5000 });
  assert.equal(openDecision(opened, "cat", T0 + 6000).kind, "taken", "a second friend can't redeem it");
  assert.deepEqual(openDecision(opened, "ben", T0 + 15000), { kind: "resume", msLeft: CARD_MS - 10000 });
  assert.equal(openDecision(opened, "ben", T0 + 5000 + CARD_MS).kind, "lapsed", "reloading doesn't restart the wick");
  assert.equal(openDecision(row({ friendId: "ben", openedAt: T0, answeredAt: T0 + 3000 }), "ben", T0 + 4000).kind, "done");
  // A friend who opened before expiry may still finish the card right at the line.
  assert.equal(openDecision(row({ friendId: "ben", openedAt: T0 + TICKET_TTL_MS - 1000 }), "ben", T0 + TICKET_TTL_MS + 1000).kind, "resume");
});

test("answer: scored on the server, only by the friend who opened it, once, on time", () => {
  const opened = row({ friendId: "ben", openedAt: T0 });
  assert.deepEqual(answerDecision(opened, "ben", "Paris", "Paris", T0 + 4000), { kind: "score", correct: true, late: false });
  assert.deepEqual(answerDecision(opened, "ben", "Rome", "Paris", T0 + 4000), { kind: "score", correct: false, late: false });
  assert.deepEqual(answerDecision(opened, "ben", "Paris", "Paris", T0 + CARD_MS + ANSWER_GRACE_MS), { kind: "score", correct: true, late: false });
  assert.deepEqual(answerDecision(opened, "ben", "Paris", "Paris", T0 + CARD_MS + ANSWER_GRACE_MS + 1), { kind: "score", correct: false, late: true });
  assert.deepEqual(answerDecision(opened, "ann", "Paris", "Paris", T0 + 4000), { kind: "reject", reason: "self" });
  assert.deepEqual(answerDecision(opened, "cat", "Paris", "Paris", T0 + 4000), { kind: "reject", reason: "not-yours" });
  assert.deepEqual(answerDecision(row(), "ben", "Paris", "Paris", T0), { kind: "reject", reason: "not-open" }, "must open (start the clock) first");
  assert.deepEqual(answerDecision({ ...opened, answeredAt: T0 + 1 }, "ben", "Paris", "Paris", T0 + 2), { kind: "reject", reason: "answered" });
});

test("reward: right and on time pays both, unless the sender's 3 a day or the pair's 1 a day is used", () => {
  assert.deepEqual(rewardDecision({ correct: true, late: false, senderRewardedToday: 0, pairRewardedToday: 0 }), { rewarded: true });
  assert.deepEqual(rewardDecision({ correct: true, late: false, senderRewardedToday: 2, pairRewardedToday: 0 }), { rewarded: true });
  assert.deepEqual(rewardDecision({ correct: true, late: false, senderRewardedToday: 3, pairRewardedToday: 0 }), { rewarded: false, why: "sender-cap" });
  assert.deepEqual(rewardDecision({ correct: true, late: false, senderRewardedToday: 0, pairRewardedToday: 1 }), { rewarded: false, why: "pair-cap" });
  assert.deepEqual(rewardDecision({ correct: false, late: false, senderRewardedToday: 0, pairRewardedToday: 0 }), { rewarded: false, why: "wrong" });
  assert.deepEqual(rewardDecision({ correct: false, late: true, senderRewardedToday: 0, pairRewardedToday: 0 }), { rewarded: false, why: "late" });
});

test("a friend pair is the same pair in either direction", () => {
  assert.equal(pairKey("ann", "ben"), pairKey("ben", "ann"));
  assert.notEqual(pairKey("ann", "ben"), pairKey("ann", "cat"));
});

test("dealt order is a permutation of the card's four choices", () => {
  const c = ["A", "B", "C", "D"];
  for (let i = 0; i < 50; i++) assert.deepEqual([...dealChoices(c)].sort(), c);
  assert.deepEqual(dealChoices(c, () => 0.999), c);
});

test("payFriend: +1 white; a full white pocket pays 30 coin instead", () => {
  const keys = { white: 1, blue: 0, green: 0, amber: 0, red: 0, violet: 0 };
  assert.deepEqual(payFriend(keys, 100, 1, matchCap("white")), { keys: { ...keys, white: 2 }, points: 100, added: 1, coins: 0 });
  const full = { ...keys, white: 30 };
  assert.deepEqual(payFriend(full, 100, 1, matchCap("white"), payMatchesOf), { keys: { ...full, white: 31 }, points: 100, added: 1, coins: 0 });
});

test("markFriendPaid: a reward lands in a save once, however often the news repeats", () => {
  const a = markFriendPaid([], ["s:x", "f:y", "s:x"]);
  assert.deepEqual(a.fresh, ["s:x", "f:y"]);
  const b = markFriendPaid(a.paid, ["s:x", "s:z"]);
  assert.deepEqual(b.fresh, ["s:z"]);
  assert.deepEqual(b.paid, ["s:x", "f:y", "s:z"]);
});

test("result lines: First L. names don't get a doubled full stop", () => {
  assert.equal(rewardLine(null, "Ryan G."), "+1 White match for you and Ryan G (rung 1/5)");
  assert.equal(rewardLine(null, "Beth", { tier: "green", rung: 2 }), "+1 Green match for you and Beth (rung 3/5)");
  assert.match(rewardLine("pair-cap", "Ryan G."), /already shared a ticket match today.*rung stays/);
  assert.match(rewardLine("sender-cap", "Ryan G."), /three friend-ticket matches today/);
});

test("0.1.25 ladder replay: climb, wrong/late reset, cap holds, idle reset, difficulty floor, no violet", async () => {
  const { replayLadder, ladderNext, ladderNextLine, LADDER, LADDER_IDLE_MS } = await import("./friendTicket.ts");
  const H = 3600_000;
  let t = 0;
  const step = (o: Partial<{ correct: boolean; late: boolean; rewarded: boolean; capped: boolean; diff: number }> = {}) => ({
    token: `t${(t += 1)}`, at: t * 24 * H, correct: true, late: false, rewarded: true, capped: false, diff: 3, ...o,
  });
  const climb = [step(), step(), step(), step(), step(), step()];
  const st = replayLadder(climb);
  assert.deepEqual(climb.map((s) => st.paid.get(s.token)!.tier), ["white", "blue", "green", "amber", "red", "white"]);
  assert.ok(!LADDER.includes("violet"));
  t = 0;
  assert.equal(replayLadder([step(), step(), step({ correct: false, rewarded: false })]).rung, 0, "wrong resets");
  t = 0;
  assert.equal(replayLadder([step(), step(), step({ late: true, correct: false, rewarded: false })]).rung, 0, "late resets");
  t = 0;
  assert.equal(replayLadder([step(), step(), step({ rewarded: false, capped: true })]).rung, 2, "a capped right keeps the rung");
  t = 0;
  const easy = [step(), step(), step({ diff: 1 })];
  const e = replayLadder(easy);
  assert.equal(e.paid.get(easy[2]!.token)!.tier, "white");
  assert.equal(e.rung, 2, "too easy: no climb, no reset");
  t = 0;
  const red = [step(), step(), step(), step(), step({ diff: 2 })];
  assert.equal(replayLadder(red).paid.get(red[4]!.token)!.tier, "white", "red needs a hard card");
  t = 0;
  const idle = replayLadder([step(), step()]);
  assert.equal(ladderNext(idle, idle.lastAt! + LADDER_IDLE_MS + 1).rung, 0, "48 h idle resets");
  assert.equal(ladderNext(idle, idle.lastAt! + H).tier, "green");
  assert.equal(ladderNextLine("amber", 2), "Next: Amber (needs medium+)");
  assert.equal(ladderNextLine("red", 3), "Next: Red (needs hard)");
});

test("0.1.25 ladder is server-only: the wallet pays the server's replay, never a client tier", () => {
  const src = readFileSync(new URL("./walletApply.ts", import.meta.url), "utf8");
  assert.match(src, /const pay = await ticketPay\(sql, row\.pair_key, token\);/);
  assert.match(src, /friendOp\(w, 1, pay\.tier\)/);
});
