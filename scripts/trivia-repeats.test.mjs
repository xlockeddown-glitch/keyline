import assert from "node:assert/strict";
import { test } from "node:test";
import { loadGame, remember, seeded } from "./trivia-repeats.mjs";

test("a thin pool (white lamp, Local) cycles every card before any repeat, oldest first", async () => {
  const G = await loadGame();
  const poi = G.allPois(G.CITIES.austin).find((x) => x.tier === "white");
  assert.ok(poi);
  const real = Math.random;
  Math.random = seeded(7);
  try {
    const h = { asked: [], seenIds: [] };
    const order = [];
    // Enough draws to see the whole pool at least once and well into the second cycle.
    for (let i = 0; i < 400; i++) {
      const card = G.pickTrivia("austin", "local", poi, "white", [...h.seenIds, ...h.asked]);
      order.push(G.dupKey(card.q));
      remember(h, card, G.ASKED_KEEP);
    }
    const distinct = new Set(order).size;
    assert.ok(distinct >= 10, `only ${distinct} local cards reachable`);
    // No card comes back until the reachable pool is used up…
    const firstRepeat = order.findIndex((k, i) => order.indexOf(k) < i);
    assert.equal(firstRepeat, distinct, `repeat at card ${firstRepeat + 1} of ${distinct}`);
    // …and recycled cards come back in the order they were first seen.
    const second = order.slice(distinct, distinct * 2);
    assert.ok(second.length >= 10, `only ${second.length} recycled draws checked`);
    assert.deepEqual(second, order.slice(0, second.length));
  } finally {
    Math.random = real;
  }
});

test("near-duplicate prompts count as already seen", async () => {
  const G = await loadGame();
  assert.equal(
    G.dupKey("The moon landing of Apollo 11 was in…"),
    G.dupKey("The moon landing of Apollo 11 was…"),
  );
  assert.equal(
    G.dupKey("Which is larger, Mars or Earth?"),
    G.dupKey("Which is larger: Earth or Mars?"),
  );
  assert.notEqual(G.dupKey("What is 36 ÷ 6?"), G.dupKey("What is 6 ÷ 36?"));
});
