import { test } from "node:test";
import assert from "node:assert/strict";
import { CHEER_STREAKS, cheerFor, streakPrize, streakSub } from "./goals.ts";

test("0.1.3 cheers: 5 hop, 10 jump, 25 and every 25 after a party; nothing in between", () => {
  assert.deepEqual([...CHEER_STREAKS], [5, 10, 25]);
  assert.equal(cheerFor(5), "hop");
  assert.equal(cheerFor(10), "jump");
  for (const n of [25, 50, 75, 100]) assert.equal(cheerFor(n), "party");
  for (const n of [0, 1, 4, 6, 15, 20, 30, 45, -5, 2.5]) assert.equal(cheerFor(n), null, String(n));
});

test("every cheer streak is also a streak that pays, so the cheer always rides a real pop", () => {
  for (let n = 1; n <= 300; n++) if (cheerFor(n)) assert.ok(streakPrize(n), String(n));
});

test("the streak line says what you won and what it's for", () => {
  assert.equal(streakSub("blue"), "You won a blue match. Use it on a blue lamp.");
});
