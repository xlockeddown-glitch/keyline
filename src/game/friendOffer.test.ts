import { test } from "node:test";
import assert from "node:assert/strict";
import { OFFER_SNOOZE_MS, RECENT_KEEP, RECENT_KEY, SESSION_KEY, SNOOZE_KEY, noteAnswered, noteDismissed, noteIgnored, offerAllowed, readOffer, readRecent } from "./friendOffer.ts";

function store() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}
const T = Date.UTC(2026, 9, 3, 19);

test("a fresh player is offered the chip", () => {
  assert.equal(offerAllowed(readOffer(store(), store()), T), true);
});

test("dismissing hides it for 24 hours, and a reload (new session, same localStorage) doesn't bring it back", () => {
  const local = store();
  noteDismissed(local, store(), T);
  const reload = store(); // new tab/session
  assert.equal(offerAllowed(readOffer(local, reload), T + 60_000), false);
  assert.equal(offerAllowed(readOffer(local, reload), T + OFFER_SNOOZE_MS - 1), false);
  assert.equal(offerAllowed(readOffer(local, reload), T + OFFER_SNOOZE_MS), true, "back after 24 h");
  assert.ok(JSON.parse(local.m.get(SNOOZE_KEY)!).dismissedAt === T);
});

test("at most one unused nudge per session", () => {
  const local = store();
  const session = store();
  assert.equal(offerAllowed(readOffer(local, session), T), true);
  noteIgnored(session); // timed out unused
  assert.equal(session.m.get(SESSION_KEY), "1");
  assert.equal(offerAllowed(readOffer(local, session), T + 1000), false, "not again this session");
  assert.equal(offerAllowed(readOffer(local, store()), T + 1000), true, "a new session may nudge once more");
});

test("garbage or a clock set backwards never locks the chip away for good", () => {
  const local = store();
  local.setItem(SNOOZE_KEY, "{not json");
  assert.equal(offerAllowed(readOffer(local, store()), T), true);
  local.setItem(SNOOZE_KEY, JSON.stringify({ dismissedAt: T + 10 * OFFER_SNOOZE_MS }));
  assert.equal(offerAllowed(readOffer(local, store()), T), true);
  assert.equal(offerAllowed(readOffer(null, null), T), true, "no storage (private mode): behaves like a fresh session");
});

test("FriendTickets wires the rules: checks before offering, snoozes on X, counts a timeout", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../components/keyline/FriendTickets.tsx", import.meta.url), "utf8");
  assert.match(src, /offerAllowed\(/);
  assert.match(src, /noteDismissed\(/);
  assert.match(src, /noteIgnored\(/);
});

test("answered cards are kept for the Journal even while the chip is snoozed (newest first, no repeats, capped)", () => {
  const local = store();
  const session = store();
  noteDismissed(local, session, T);
  assert.equal(offerAllowed(readOffer(local, session), T + 1000), false, "chip snoozed");
  for (let i = 1; i <= RECENT_KEEP + 2; i++) noteAnswered(local, { id: `c${i}`, q: `Q${i}`, at: T + i });
  noteAnswered(local, { id: "c4", q: "Q4", at: T + 99 }); // answered again: moves to the front, no duplicate
  const recent = readRecent(local);
  assert.equal(recent.length, RECENT_KEEP);
  assert.deepEqual(recent.map((c) => c.id), ["c4", "c5", "c3"]);
  assert.equal(readRecent(store()).length, 0, "nothing answered yet");
  local.setItem(RECENT_KEY, "{bad");
  assert.deepEqual(readRecent(local), []);
  local.setItem(RECENT_KEY, JSON.stringify([{ id: 5, q: "x", at: 1 }, { id: "ok", q: "Fine", at: 2 }]));
  assert.deepEqual(readRecent(local).map((c) => c.id), ["ok"]);
  assert.deepEqual(readRecent(null), []);
});

test("the Journal row sends through the same sheet (server daily cap), without the chip's snooze or session cap", async () => {
  const { readFileSync } = await import("node:fs");
  const ft = readFileSync(new URL("../components/keyline/FriendTickets.tsx", import.meta.url), "utf8");
  const hq = readFileSync(new URL("../components/keyline/HqPanel.tsx", import.meta.url), "utf8");
  const row = ft.slice(ft.indexOf("export function FriendJournalRow"), ft.indexOf("type SheetState"));
  assert.ok(row.length > 100, "FriendJournalRow exists");
  assert.match(row, /readRecent\(/);
  assert.match(row, /openFriendSheet\(/);
  assert.doesNotMatch(row, /offerAllowed|noteIgnored|noteDismissed/, "the Journal door ignores the chip's cooldown");
  assert.match(ft, /noteAnswered\(local/, "every answered card is kept, snoozed or not");
  assert.ok(ft.indexOf("noteAnswered(") < ft.indexOf("if (offerAllowed("), "kept before the snooze check");
  assert.match(ft, /reason === "daily-cap"/, "the sheet reports the server's daily cap");
  assert.match(hq, /<FriendJournalRow \/>/);
});
