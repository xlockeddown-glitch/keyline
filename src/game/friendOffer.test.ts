import { test } from "node:test";
import assert from "node:assert/strict";
import { OFFER_SNOOZE_MS, SESSION_KEY, SNOOZE_KEY, noteDismissed, noteIgnored, offerAllowed, readOffer } from "./friendOffer.ts";

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
