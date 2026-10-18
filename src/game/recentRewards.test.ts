import { test } from "node:test";
import assert from "node:assert/strict";
import { RECENT_MAX, pushRecent, rewardOfRow } from "./recentRewards.ts";
import { withDelta } from "./walletSql.ts";
import { emptyWallet } from "./wallet.ts";

test("0.0.99 recent rewards: ledger rows map to source, place and amounts; spends and syncs are skipped", () => {
  const name = (id: string) => (id === "p1" ? "Driskill Hotel" : undefined);
  const lamp = rewardOfRow("grade:n1", JSON.stringify({ coins: 40, keys: {}, boosts: [], pi: "p1", _d: { c: 40, k: { blue: 1 } } }), 1, name)!;
  assert.deepEqual([lamp.src, lamp.where, lamp.coins, lamp.keys], ["lamp", "Driskill Hotel", 40, { blue: 1 }]);
  assert.equal(rewardOfRow("grade:n2", JSON.stringify({ coins: 80, keys: {}, mk: 1, pi: "p1" }), 1, name)!.src, "market", "pre-0.0.99 rows use the award");
  const merge = rewardOfRow("street:sk:x", JSON.stringify({ _d: { c: 0, k: { green: 1 }, mg: { green: 1 }, cr: {} } }), 1, name)!;
  assert.deepEqual(merge.merged, { green: 1 });
  assert.equal(rewardOfRow("scout:corgi", JSON.stringify({ _d: { c: -9600, k: {} } }), 1, name), null);
  assert.equal(rewardOfRow("migrate:dev1", "sync", 1, name), null);
  assert.equal(rewardOfRow("level:5", "", 1, name), null, "a note with no delta gives nothing to show");
});

test("withDelta: adds what changed (coin, matches, credits, merges) to JSON details, leaves notes alone", () => {
  const a = emptyWallet();
  const b = { ...a, coins: 25, keys: { ...a.keys, blue: 1 }, meta: { ...a.meta, credit: { white: 1 } } };
  const d = JSON.parse(withDelta(JSON.stringify({ coins: 25 }), "grade:x", a, b, {}));
  assert.deepEqual(d._d, { c: 25, k: { blue: 1 }, cr: { white: 1 } });
  assert.equal(withDelta("a plain note", "gift:x", a, b, {}), "a plain note");
  assert.deepEqual(JSON.parse(withDelta("", "street:x", a, b, { green: 1 }))._d.mg, { green: 1 });
  assert.equal(withDelta("sync", "migrate:dev", a, b, {}), "sync");
});

test("guest ring buffer keeps the newest 20", () => {
  let l: ReturnType<typeof pushRecent> = [];
  for (let i = 0; i < 25; i++) l = pushRecent(l, { at: i, src: "lamp", coins: i, keys: {} });
  assert.equal(l.length, RECENT_MAX);
  assert.equal(l[0]!.at, 24);
});
