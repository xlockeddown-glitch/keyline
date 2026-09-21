import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMOTE_MIN, PROMOTE_MAX, RETUNE_N, decideRetune, retunePlates, type PlateStatRow } from "./retune.ts";
import { freshnessPass, volatileReason } from "./freshness.ts";
import { pickUnseenRarity, setQuarantine, setRetune } from "./rarity.ts";
import type { TriviaQ } from "./types";

function row(partial: Partial<PlateStatRow> & Pick<PlateStatRow, "plateId" | "rarity">): PlateStatRow {
  return {
    attempts: RETUNE_N,
    correctCount: 50,
    scope: "global",
    ...partial,
  };
}

function plate(partial: Partial<TriviaQ> & Pick<TriviaQ, "q" | "rarity" | "id">): TriviaQ {
  return {
    choices: ["a", "b", "c", "d"],
    answer: "a",
    diff: 2,
    ...partial,
  };
}

test("N below 100 holds", () => {
  const hit = decideRetune(row({ plateId: "p1", rarity: "green", attempts: 99, correctCount: 99 }));
  assert.equal(hit.action, "hold");
  assert.equal(hit.to, "green");
});

test("high accuracy demotes exactly one step", () => {
  const n = RETUNE_N;
  const hit = decideRetune(row({ plateId: "p2", rarity: "green", attempts: n, correctCount: Math.ceil(n * 0.9) }));
  assert.ok(hit.rate >= DEMOTE_MIN);
  assert.equal(hit.action, "demote");
  assert.equal(hit.from, "green");
  assert.equal(hit.to, "blue");
});

test("too-easy white floors (no demote past white)", () => {
  const hit = decideRetune(row({ plateId: "p3", rarity: "white", attempts: 200, correctCount: 190 }));
  assert.equal(hit.action, "hold");
  assert.equal(hit.to, "white");
});

test("low accuracy promotes exactly one step", () => {
  const n = RETUNE_N;
  const hit = decideRetune(row({ plateId: "p4", rarity: "blue", attempts: n, correctCount: Math.floor(n * 0.3) }));
  assert.ok(hit.rate <= PROMOTE_MAX);
  assert.equal(hit.action, "promote");
  assert.equal(hit.to, "green");
});

test("too-hard violet flags rewrite and does not promote", () => {
  const hit = decideRetune(row({ plateId: "p5", rarity: "violet", attempts: 120, correctCount: 20 }));
  assert.equal(hit.action, "rewrite");
  assert.equal(hit.to, "violet");
});

test("rerun with assigned rarity is idempotent (does not walk)", () => {
  const r = row({ plateId: "p6", rarity: "green", attempts: 200, correctCount: 180 });
  const a = decideRetune(r);
  const b = decideRetune(r);
  assert.equal(a.action, "demote");
  assert.equal(a.to, b.to);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  const walked = decideRetune({ ...r, rarity: a.to });
  assert.equal(walked.to, "white");
  assert.notEqual(walked.to, a.to);
});

test("city-local N>=100 beats global; thin city uses global", () => {
  const report = retunePlates([
    row({ plateId: "same", rarity: "green", attempts: 50, correctCount: 5, scope: "global" }),
    row({
      plateId: "same",
      rarity: "green",
      attempts: 120,
      correctCount: 110,
      scope: "city",
      city: "austin",
    }),
    row({ plateId: "thin", rarity: "blue", attempts: 20, correctCount: 2, scope: "city", city: "nyc" }),
    row({ plateId: "thin", rarity: "blue", attempts: 150, correctCount: 20, scope: "global" }),
  ]);
  assert.equal(report.overrides.same, "blue");
  assert.equal(report.overrides.thin, "green");
});

test("volatile heuristics catch stale current facts, not old mayors", () => {
  assert.equal(volatileReason({ q: "Who is the mayor of Austin?" })?.includes("mayor"), true);
  assert.equal(volatileReason({ q: "Who was the mayor of Chicago in 1893?" }), null);
  assert.equal(volatileReason({ q: "As of last census, Austin had how many parks?" }), "as-of");
  assert.equal(volatileReason({ q: "What is the tallest building in Texas?" }), "tallest");
  assert.equal(volatileReason({ q: "The current champion of the NBA is…", answer: "X" }), "champion");
  assert.equal(volatileReason({ q: "What is the population of Temple, Texas?" }), "population");
  assert.equal(volatileReason({ q: "Who painted the Mona Lisa?", answer: "Leonardo" }), null);
  assert.equal(volatileReason({ q: "A quiet plate", fresh: "volatile" }), "tagged");
  assert.equal(volatileReason({ q: "Current mayor of Austin?", fresh: "stable" }), null);
});

test("clear mismatch quarantines; verify is rate-limited", async () => {
  let n = 0;
  const plates = [
    { id: "v1", q: "Who is the mayor of Austin?", answer: "Wrong Name", choices: ["Wrong Name", "Kirk Watson", "x", "y"] },
    { id: "v2", q: "Who is the mayor of London?", answer: "Also Wrong", choices: ["Also Wrong", "Sadiq Khan", "x", "y"] },
    { id: "ok", q: "Who painted the Mona Lisa?", answer: "Leonardo" },
  ];
  const out = await freshnessPass(plates, {
    now: new Date("2026-09-21T00:00:00Z"),
    limit: 1,
    verify: async () => {
      n += 1;
      return { mismatch: true, source: "https://en.wikipedia.org/wiki/Test" };
    },
  });
  assert.equal(n, 1);
  assert.deepEqual(out.quarantined, ["v1"]);
  assert.equal(out.records.find((r) => r.plateId === "v1")?.verifiedAt, "2026-09-21T00:00:00.000Z");
  assert.equal(out.records.find((r) => r.plateId === "v2")?.action, "hold");
  assert.equal(out.records.find((r) => r.plateId === "ok"), undefined);
});

test("retune overlay and quarantine apply at pick, assigner untouched", () => {
  setRetune({ g1: "blue" });
  setQuarantine(["c1"]);
  const city = [plate({ q: "c-white", id: "c1", rarity: "white" })];
  const global = [plate({ q: "g-white", id: "g1", rarity: "white" })];
  const hit = pickUnseenRarity("blue", city, global, new Set());
  assert.ok(hit);
  assert.equal(hit!.plate.id, "g1");
  assert.equal(hit!.plate.rarity, "white");
  setRetune({});
  setQuarantine([]);
});
