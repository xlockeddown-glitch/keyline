// 0.1.22: one clock for weekly and monthly quests, America/Chicago. A week starts Monday 00:00 CT,
// a month on the 1st at 00:00 CT. Keys are shared by everyone: "W2026-10-19" (the Monday) and "M2026-11".
const TZ = "America/Chicago";
/** A finished period can still be claimed for this long after it ends. */
export const QUEST_GRACE_MS = 24 * 3600_000;

export type PeriodKind = "week" | "month";

type Ymd = { y: number; m: number; d: number };

const fmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function parts(ms: number): Ymd & { h: number; mi: number; s: number } {
  const o: Record<string, number> = {};
  for (const p of fmt.formatToParts(new Date(ms))) if (p.type !== "literal") o[p.type] = Number(p.value);
  return { y: o.year!, m: o.month!, d: o.day!, h: o.hour!, mi: o.minute!, s: o.second! };
}

/** The Chicago calendar date at `ms`. */
export function chicagoDate(ms: number): Ymd {
  const p = parts(ms);
  return { y: p.y, m: p.m, d: p.d };
}

/** UTC ms of 00:00 Chicago time on that calendar date (DST-safe: US clocks change at 02:00). */
export function chicagoMidnight(y: number, m: number, d: number): number {
  const guess = Date.UTC(y, m - 1, d, 6);
  const p = parts(guess);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  const offset = asUtc - guess; // local - utc, negative in Chicago
  return Date.UTC(y, m - 1, d) - offset;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Weekday 0 = Monday … 6 = Sunday, of a calendar date. */
function isoDow({ y, m, d }: Ymd): number {
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

function addDays({ y, m, d }: Ymd, n: number): Ymd {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

export function weekKey(ms: number): string {
  const day = chicagoDate(ms);
  const mon = addDays(day, -isoDow(day));
  return `W${mon.y}-${pad(mon.m)}-${pad(mon.d)}`;
}

export function monthKey(ms: number): string {
  const { y, m } = chicagoDate(ms);
  return `M${y}-${pad(m)}`;
}

export function periodKey(kind: PeriodKind, ms: number): string {
  return kind === "week" ? weekKey(ms) : monthKey(ms);
}

export type Period = { key: string; kind: PeriodKind; start: number; end: number };

const WEEK_RE = /^W(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^M(\d{4})-(\d{2})$/;

/** The window [start, end) of a key, or null if the key is not a real period. */
export function periodOf(key: string): Period | null {
  const w = WEEK_RE.exec(key);
  if (w) {
    const day = { y: Number(w[1]), m: Number(w[2]), d: Number(w[3]) };
    const t = new Date(Date.UTC(day.y, day.m - 1, day.d));
    if (t.getUTCMonth() + 1 !== day.m || t.getUTCDate() !== day.d || isoDow(day) !== 0) return null;
    const next = addDays(day, 7);
    return { key, kind: "week", start: chicagoMidnight(day.y, day.m, day.d), end: chicagoMidnight(next.y, next.m, next.d) };
  }
  const mo = MONTH_RE.exec(key);
  if (mo) {
    const y = Number(mo[1]);
    const m = Number(mo[2]);
    if (m < 1 || m > 12) return null;
    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;
    return { key, kind: "month", start: chicagoMidnight(y, m, 1), end: chicagoMidnight(ny, nm, 1) };
  }
  return null;
}

export function currentPeriod(kind: PeriodKind, now: number): Period {
  return periodOf(periodKey(kind, now))!;
}

/** The period before the current one (the one still in its claim grace right after a reset). */
export function previousPeriod(kind: PeriodKind, now: number): Period {
  return periodOf(periodKey(kind, currentPeriod(kind, now).start - 1))!;
}

/** The month after `key` ("M2026-12" → "M2027-01"). */
export function nextMonthKey(key: string): string | null {
  const p = periodOf(key);
  if (!p || p.kind !== "month") return null;
  return monthKey(p.end);
}

/** A period can be claimed while it runs and for QUEST_GRACE_MS after it ends; never before it starts. */
export function claimOpen(key: string, now: number): boolean {
  const p = periodOf(key);
  if (!p) return false;
  return now >= p.start && now < p.end + QUEST_GRACE_MS;
}
