import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lampsToTicket, ticketHint } from "./ticket.ts";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

test("empty-pocket hint counts the lamps still owed", () => {
  assert.equal(ticketHint(0), "Light 3 more lamps to earn a train ticket");
  assert.equal(ticketHint(2), "Light 1 more lamp to earn a train ticket");
  assert.equal(lampsToTicket(5), 1);
});

test("Journal tabs: Places, Supplies, Progress, Leaderboard; Places first", () => {
  const src = read("../components/keyline/HqPanel.tsx");
  assert.match(src, /const TABS = \["Places", "Supplies", "Progress", "Leaderboard"\] as const;/);
  assert.match(src, /useState<\(typeof TABS\)\[number\]>\("Places"\)/);
  assert.match(src, /aria-label="Journal sections"/);
  assert.doesNotMatch(src, /Headquarters|"Atlas"|"Ledger"|"Standings"/);
});

test("HUD says Journal, Goals and train ticket — not HQ, Survey or fare", () => {
  const hud = read("../components/keyline/Hud.tsx");
  assert.match(hud, />Journal</);
  assert.match(hud, />Goals</);
  assert.doesNotMatch(hud, /"Open HQ|>HQ<|>Survey<|Punch a fare|Fare desk|>Fare</);
  for (const f of ["Timetable.tsx", "GameMap.tsx", "HqPanel.tsx", "RideScreen.tsx", "Tutorial.tsx"]) {
    assert.doesNotMatch(read(`../components/keyline/${f}`), /[Pp]unch(es)? a? ?fares?|Need a fare/, f);
  }
  assert.doesNotMatch(read("./store.ts"), /Need a fare|A fare printed|Another fare|in HQ/);
});

test("Goals talk about places, not marks or stamps", () => {
  const src = read("./survey.ts");
  const copy = [...src.matchAll(/(?:label|blurb): (?:"([^"]*)"|`([^`]*)`)/g)].map((m) => m[1] ?? m[2]);
  assert.ok(copy.length >= 30, String(copy.length));
  for (const line of copy) assert.doesNotMatch(line!, /\b(marks?|stamps?|[Ss]tamp|survey|atlas)\b/, line);
  assert.doesNotMatch(src, /: "stamps"/);
});
