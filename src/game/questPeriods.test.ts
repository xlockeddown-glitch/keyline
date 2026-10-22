// 0.1.22: quest resets on one Chicago clock.
import assert from "node:assert/strict";
import { test } from "node:test";
import { chicagoMidnight, claimOpen, currentPeriod, monthKey, nextMonthKey, periodOf, previousPeriod, QUEST_GRACE_MS, weekKey } from "./questPeriods.ts";

test("weeks start Monday 00:00 Chicago time, in CDT and CST", () => {
  // Mon 2026-10-19 00:00 CDT = 05:00Z.
  assert.equal(chicagoMidnight(2026, 10, 19), Date.UTC(2026, 9, 19, 5));
  assert.equal(weekKey(Date.UTC(2026, 9, 19, 5)), "W2026-10-19");
  assert.equal(weekKey(Date.UTC(2026, 9, 19, 4, 59, 59)), "W2026-10-12"); // Sunday 23:59:59 CDT
  // Wed 2026-10-21 19:00 CDT
  assert.equal(weekKey(Date.UTC(2026, 9, 22, 0)), "W2026-10-19");
  // DST ends Sun Nov 1 2026: Mon Nov 2 00:00 CST = 06:00Z.
  assert.equal(chicagoMidnight(2026, 11, 2), Date.UTC(2026, 10, 2, 6));
  const w = periodOf("W2026-10-26")!;
  assert.equal(w.start, Date.UTC(2026, 9, 26, 5));
  assert.equal(w.end, Date.UTC(2026, 10, 2, 6));
  assert.equal(w.end - w.start, 7 * 86_400_000 + 3_600_000); // the week with the extra hour
  assert.equal(weekKey(Date.UTC(2026, 10, 2, 5, 30)), "W2026-10-26"); // 23:30 CST Sunday
  assert.equal(weekKey(Date.UTC(2026, 10, 2, 6)), "W2026-11-02");
  // A year-end week keeps its Monday's date.
  assert.equal(weekKey(Date.UTC(2027, 0, 1, 12)), "W2026-12-28");
});

test("months start on the 1st at 00:00 Chicago time", () => {
  assert.equal(monthKey(Date.UTC(2026, 10, 1, 4, 59)), "M2026-10"); // Oct 31 23:59 CDT
  assert.equal(monthKey(Date.UTC(2026, 10, 1, 5)), "M2026-11");
  const m = periodOf("M2026-12")!;
  assert.equal(m.start, Date.UTC(2026, 11, 1, 6));
  assert.equal(m.end, Date.UTC(2027, 0, 1, 6));
  assert.equal(nextMonthKey("M2026-12"), "M2027-01");
  assert.equal(nextMonthKey("W2026-10-19"), null);
  assert.equal(currentPeriod("month", Date.UTC(2026, 9, 21)).key, "M2026-10");
  assert.equal(previousPeriod("month", Date.UTC(2026, 9, 21)).key, "M2026-09");
  assert.equal(previousPeriod("week", Date.UTC(2026, 9, 22)).key, "W2026-10-12");
});

test("bad keys are not periods", () => {
  assert.equal(periodOf("W2026-10-20"), null); // a Tuesday
  assert.equal(periodOf("W2026-02-30"), null);
  assert.equal(periodOf("M2026-13"), null);
  assert.equal(periodOf("2026-10"), null);
});

test("a period is claimable while it runs and for 24 h after, never before", () => {
  const w = periodOf("W2026-10-19")!;
  assert.equal(claimOpen(w.key, w.start - 1), false);
  assert.equal(claimOpen(w.key, w.start), true);
  assert.equal(claimOpen(w.key, w.end + QUEST_GRACE_MS - 1), true);
  assert.equal(claimOpen(w.key, w.end + QUEST_GRACE_MS), false);
});
