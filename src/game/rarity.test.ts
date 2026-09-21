import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import {
  BOOTSTRAP,
  RARITY_LADDER,
  assignRarity,
  bootstrapRarity,
  downStep,
  pickUnseenRarity,
  plateId,
  rarityStats,
  sealPlate,
  setQuarantine,
  setRetune,
  tagNudge,
} from "./rarity.ts";
import type { TriviaQ, TriviaSeed } from "./types";

beforeEach(() => {
  setRetune({});
  setQuarantine([]);
});

function plate(partial: Partial<TriviaQ> & Pick<TriviaQ, "q" | "rarity" | "id">): TriviaQ {
  return {
    choices: ["a", "b", "c", "d"],
    answer: "a",
    diff: 1,
    ...partial,
  };
}

test("same plate id always gets the same rarity", () => {
  const seed: TriviaSeed = {
    q: "What is 8 + 7?",
    choices: ["13", "14", "15", "16"],
    answer: "15",
    diff: 1,
  };
  const a = assignRarity(seed);
  const b = assignRarity(seed);
  const id = plateId(seed.q, seed.answer);
  assert.equal(a, b);
  assert.equal(assignRarity({ ...seed, id }), a);
  assert.equal(sealPlate(seed).id, id);
});

test("bootstrap shares match locked tables", () => {
  const n = 10_000;
  const counts: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const r = bootstrapRarity(1, `id-${i}`);
    counts[r] = (counts[r] ?? 0) + 1;
  }
  const white = (counts.white ?? 0) / n;
  const blue = (counts.blue ?? 0) / n;
  assert.ok(Math.abs(white - 0.7) < 0.04, `diff1 white ${white}`);
  assert.ok(Math.abs(blue - 0.3) < 0.04, `diff1 blue ${blue}`);

  const d2: Record<string, number> = {};
  const d3: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const a = bootstrapRarity(2, `std-${i}`);
    const b = bootstrapRarity(3, `hard-${i}`);
    d2[a] = (d2[a] ?? 0) + 1;
    d3[b] = (d3[b] ?? 0) + 1;
  }
  assert.ok(Math.abs((d2.green ?? 0) / n - 0.5) < 0.04, `diff2 green ${(d2.green ?? 0) / n}`);
  assert.ok(Math.abs((d2.blue ?? 0) / n - 0.25) < 0.04, `diff2 blue ${(d2.blue ?? 0) / n}`);
  assert.ok(Math.abs((d2.amber ?? 0) / n - 0.25) < 0.04, `diff2 amber ${(d2.amber ?? 0) / n}`);
  assert.ok(Math.abs((d3.red ?? 0) / n - 0.6) < 0.04, `diff3 red ${(d3.red ?? 0) / n}`);
  assert.ok(Math.abs((d3.amber ?? 0) / n - 0.25) < 0.04, `diff3 amber ${(d3.amber ?? 0) / n}`);
  assert.ok(Math.abs((d3.violet ?? 0) / n - 0.15) < 0.04, `diff3 violet ${(d3.violet ?? 0) / n}`);
  assert.equal(BOOTSTRAP[1][0]![0], "white");
});

test("tag nudge is ±1 and clamps at white/violet", () => {
  const nick: TriviaSeed = {
    q: "Atlanta's NFL club is nicknamed the…",
    choices: ["Falcons", "Rams", "Bears", "Colts"],
    answer: "Falcons",
    diff: 1,
    id: "nick-1",
  };
  assert.equal(tagNudge(nick), 1);
  const pop: TriviaSeed = {
    q: "Which Disney blockbuster won the Oscar?",
    choices: ["A", "B", "C", "D"],
    answer: "A",
    diff: 1,
    id: "pop-1",
  };
  assert.equal(tagNudge(pop), -1);
  const floor: TriviaSeed = {
    q: "What is the capital of France? The Eiffel is nearby.",
    choices: ["Paris", "Lyon", "Nice", "Lille"],
    answer: "Paris",
    diff: 1,
    id: "id-0",
  };
  const r = assignRarity(floor);
  assert.equal(RARITY_LADDER.includes(r), true);
  assert.notEqual(r, "violet");
});

test("unseen draw skips seen ids and never up-draws", () => {
  const city = [
    plate({ q: "c-white", id: "c1", rarity: "white" }),
    plate({ q: "c-blue", id: "c2", rarity: "blue" }),
  ];
  const global = [
    plate({ q: "g-white", id: "g1", rarity: "white" }),
    plate({ q: "g-green", id: "g3", rarity: "green" }),
  ];
  const seen = new Set(["c1"]);
  const hit = pickUnseenRarity("white", city, global, seen);
  assert.ok(hit);
  assert.equal(hit!.downfill, false);
  assert.equal(hit!.plate.rarity, "white");
  assert.equal(hit!.plate.id, "g1");

  const blue = pickUnseenRarity("blue", city, global, new Set(["c2"]));
  assert.ok(blue);
  assert.equal(blue!.plate.rarity, "white");
  assert.equal(blue!.downfill, true);

  const onlyHigh = [plate({ q: "amber", id: "a1", rarity: "amber" })];
  const noUp = pickUnseenRarity("blue", onlyHigh, [], new Set());
  assert.equal(noUp, null);
});

test("down-fill is exactly one step and is counted", () => {
  rarityStats.downfills = 0;
  const city = [plate({ q: "w", id: "w1", rarity: "white" })];
  const before = rarityStats.downfills;
  const hit = pickUnseenRarity("blue", city, [], new Set());
  assert.ok(hit);
  assert.equal(hit!.downfill, true);
  assert.equal(hit!.plate.rarity, "white");
  assert.equal(rarityStats.downfills, before + 1);
  assert.equal(downStep("white"), null);
  assert.equal(downStep("violet"), "red");
  const skip = pickUnseenRarity("green", city, [], new Set());
  assert.equal(skip, null);
});
