// 0.1.24 regression: daily quests (period key "D…") were refused by the claim op schema, which only
// allowed week/month keys, so every daily Collect threw and the board said "Board's busy".
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BANK, BONUS, questClaimLine } from "./questBoard.ts";
import { currentPeriod, previousPeriod, QUEST_PERIOD_KEY } from "./questPeriods.ts";

test("the claim schema accepts every period the board shows (day, week, month, and last period in grace)", () => {
  const now = Date.UTC(2026, 9, 22, 1, 50); // Oct 21 8:50 PM Chicago
  for (const kind of ["day", "week", "month"] as const) {
    for (const p of [currentPeriod(kind, now), previousPeriod(kind, now)]) assert.match(p.key, QUEST_PERIOD_KEY, `${kind} ${p.key}`);
    for (const d of [...BANK[kind], BONUS[kind]]) assert.ok(d.id.length >= 1 && d.id.length <= 20, d.id);
  }
  const src = readFileSync(new URL("./walletApi.ts", import.meta.url), "utf8");
  const line = src.split("\n").find((l) => l.includes('z.literal("quest")'));
  assert.ok(line?.includes("regex(QUEST_PERIOD_KEY)"), "quest op uses the shared period pattern");
  assert.doesNotMatch("X2026-10-21", QUEST_PERIOD_KEY);
});

test("a refused collect says why instead of 'Board's busy'", () => {
  for (const r of ["unproven", "closed", "not-yours", "unknown", "busy", "offline", undefined]) assert.doesNotMatch(questClaimLine(r), /Board's busy/);
  assert.match(questClaimLine("offline"), /Couldn't reach the server/);
});
