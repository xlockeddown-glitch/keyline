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

test("Journal tabs: Places, Supplies, Goals, Progress, Leaderboard; Places first", () => {
  const src = read("../components/keyline/HqPanel.tsx");
  assert.match(src, /const TABS = \["Places", "Supplies", "Goals", "Progress", "Leaderboard"\] as const;/);
  assert.match(src, /useState<\(typeof TABS\)\[number\]>\("Places"\)/);
  assert.match(src, /aria-label="Journal sections"/);
  assert.doesNotMatch(src, /Headquarters|"Atlas"|"Ledger"|"Standings"/);
});

test("HUD says Journal, Goals and train ticket — not HQ, Survey or fare", () => {
  const hud = read("../components/keyline/Hud.tsx");
  assert.match(hud, />Journal</);
  // 0.0.71: goals live in the Journal, not on the HUD.
  assert.match(read("../components/keyline/HqPanel.tsx"), />Goals</);
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

test("0.1.28 Journal: Goals tab holds the goals in order; Progress keeps standing, collections, stats, log", () => {
  const src = read("../components/keyline/HqPanel.tsx");
  const inOrder = (from: string, to: string, marks: string[]) => {
    const tab = src.slice(src.indexOf(from), src.indexOf(to, src.indexOf(from)));
    const at = marks.map((m) => tab.indexOf(m));
    assert.ok(at.every((i) => i >= 0), marks.filter((_, i) => at[i] < 0).join(", "));
    assert.deepEqual([...at].sort((a, b) => a - b), at);
  };
  const goals = ["<DailyGoals", 'kicker">Daily Blitz', "Login streak", "<QuestDesk", "<FriendJournalRow", 'kicker mt-2">Goals'];
  const progress = ["<LevelPanel />", "<PassProgressRow />", "<PrintPanel />", "<MarketLightsPanel />", 'className="hq-stats"', "<RecentRewards />", 'kicker mt-2">Bank'];
  inOrder('tab === "Goals"', ") : null}", goals);
  inOrder('tab === "Progress"', ") : null}", progress);
  const prog = src.slice(src.indexOf('tab === "Progress"'), src.indexOf(") : null}", src.indexOf('tab === "Progress"')));
  for (const m of goals) assert.equal(prog.includes(m), false, m);
});

test("0.1.44 help page: houses, owned lanterns, train stops and the new-player hour, in American spelling", () => {
  const f = read("../components/keyline/FieldGuide.tsx");
  // 0.1.74: Help topics are rows; the id rides on the Topic as testid="…".
  for (const id of ["help-houses", "help-own-lamps", "help-trains", "help-welcome"]) assert.ok(f.includes(`data-testid="${id}"`) || f.includes(`testid="${id}"`), id);
  assert.match(f, /KEY_MATCHES/);
  assert.match(f, /OWN_PRICE/);
  assert.doesNotMatch(f, /colour/);
});
