import assert from "node:assert/strict";
import { test } from "node:test";
import { planStop, type PlanStop } from "./routePlan.ts";

const here: PlanStop = { lat: 30.27, lng: -97.74 };
const a: PlanStop = { lat: 30.271, lng: -97.741, keyId: "a" };
const b: PlanStop = { lat: 30.275, lng: -97.75, keyId: "b" };
const c: PlanStop = { lat: 30.28, lng: -97.76, keyId: "c" };

test("the first tap starts a walk and later taps add stops in order", () => {
  assert.equal(planStop([], null, a).action, "start");
  const one = planStop([], here, a);
  assert.equal(one.action, "append");
  assert.deepEqual(one.queue, [a]);
  const two = planStop(one.queue, here, b);
  assert.deepEqual(
    two.queue.map((s) => s.keyId),
    ["a", "b"],
  );
  const three = planStop(two.queue, here, c);
  assert.deepEqual(
    three.queue.map((s) => s.keyId),
    ["a", "b", "c"],
  );
});

test("tapping a queued stop again drops only that stop", () => {
  const dropped = planStop([a, b, c], here, b);
  assert.equal(dropped.action, "drop");
  assert.deepEqual(
    dropped.queue.map((s) => s.keyId),
    ["a", "c"],
  );
});

test("the stop you are already walking is not added twice", () => {
  const again = planStop([b], a, { ...a });
  assert.equal(again.action, "same");
  assert.deepEqual(again.queue, [b]);
});

test("eight stops is the cap, counting the one you are walking", () => {
  const queue: PlanStop[] = [];
  for (let i = 0; i < 7; i++) queue.push({ lat: 30.3 + i * 0.01, lng: -97.7, keyId: `k${i}` });
  const full = planStop(queue, here, { lat: 31, lng: -97, keyId: "extra" });
  assert.equal(full.action, "full");
  assert.equal(full.queue.length, 7);
});

test("matches a few steps apart stay separate stops", () => {
  const p: PlanStop = { lat: 30.271, lng: -97.741, keyId: "p" };
  const q: PlanStop = { lat: 30.27108, lng: -97.741, keyId: "q" };
  const decided = planStop([p], here, q);
  assert.equal(decided.action, "append");
  assert.deepEqual(
    decided.queue.map((s) => s.keyId),
    ["p", "q"],
  );
});

test("a second tap on the same corner does not stack a stop", () => {
  const corner: PlanStop = { lat: 30.271, lng: -97.741 };
  const again = planStop([], corner, { lat: corner.lat + 0.00002, lng: corner.lng });
  assert.equal(again.action, "same");
});

test("0.0.95: a new tap replaces the route; tapping the live stop again does nothing", async () => {
  const { tapAction } = await import("./routePlan.ts");
  assert.equal(tapAction(null, here), "replace");
  assert.equal(tapAction(here, { lat: here.lat + 0.00005, lng: here.lng }), "same");
  assert.equal(tapAction(here, { lat: here.lat + 0.01, lng: here.lng }), "replace");
  assert.equal(tapAction({ ...here, keyId: "a" }, { ...here, keyId: "b" }), "replace");
});

test("0.0.97: a tap replaces the route; press-and-hold appends; 5 stops max", async () => {
  const { tapAction, holdAction, HOLD_CAP } = await import("./routePlan.ts");
  const a = { lat: 30.27, lng: -97.74 };
  const b = { lat: 30.272, lng: -97.74 };
  const c = { lat: 30.274, lng: -97.74 };
  assert.equal(HOLD_CAP, 5);
  assert.equal(tapAction(a, b), "replace", "tap never queues");
  assert.equal(holdAction([], null, a), "start");
  assert.equal(holdAction([], a, b), "append");
  assert.equal(holdAction([b], a, c), "append");
  assert.equal(holdAction([b], a, { lat: b.lat + 0.00003, lng: b.lng }), "same", "holding on the last stop twice adds nothing");
  const four = [b, c, { lat: 30.276, lng: -97.74 }, { lat: 30.278, lng: -97.74 }];
  assert.equal(holdAction(four.slice(0, 3), a, { lat: 30.29, lng: -97.74 }), "append", "4th queued = 5 total");
  assert.equal(holdAction(four, a, { lat: 30.29, lng: -97.74 }), "full");
});
