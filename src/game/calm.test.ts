import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { Calm, CREDIT_CALM_MS } from "./calm.ts";

test("0.0.99 credit pip: optimistic 1/3, server {}, server 1/3 within the window shows ONE change; a bounce back shows none", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const shown: unknown[] = [];
  const c = new Calm<Record<string, number>>({ white: 1 }, CREDIT_CALM_MS, (v) => shown.push(v));
  c.push({ white: 1, blue: 1 }); // device settle
  mock.timers.tick(70);
  c.push({ white: 1 }); // a server pocket that differs
  mock.timers.tick(70);
  c.push({ white: 1, blue: 1 }); // the confirmed one
  mock.timers.tick(CREDIT_CALM_MS + 10);
  assert.deepEqual(shown, [{ white: 1, blue: 1 }]);
  // Flick away and straight back: nothing shown.
  c.push({});
  mock.timers.tick(50);
  c.push({ white: 1, blue: 1 });
  mock.timers.tick(CREDIT_CALM_MS + 10);
  assert.equal(shown.length, 1);
  mock.timers.reset();
});
