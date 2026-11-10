/**
 * 0.1.149 hearth polish. 8,000 coin, once per hearth per seven-day window.
 * The trim is brighter until seven days after the charge. It does not change
 * the owner cut, keys, or any payout.
 *
 * The window is a fixed 7-day bucket from the Unix epoch (not a calendar Monday).
 * The ledger key is one row per hearth per bucket, so a refresh cannot charge twice.
 * A charge still lasts seven days from the tap, so a buy late in the bucket is a full week of trim.
 * A new bucket does not charge while that week is still running.
 */
export const HEARTH_POLISH_PRICE = 8_000;
export const HEARTH_POLISH_MS = 7 * 24 * 60 * 60 * 1000;

export type PolishHold = { id: string; week: number; until: number };

export function hearthWeek(at: number): number {
  return Math.floor(at / HEARTH_POLISH_MS);
}

/** When a charge made at `at` stops glowing. */
export function polishUntil(at: number): number {
  return at + HEARTH_POLISH_MS;
}

export function polishKey(id: string, week: number): string {
  return `hpolish:${id}:${week}`;
}

export function polishLive(until: number | undefined, at: number): boolean {
  return typeof until === "number" && Number.isFinite(until) && at < until;
}

/** A stored hold, or null when the detail is missing or the glow has ended. */
export function cleanPolish(raw: unknown, id: string, at: number): PolishHold | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<PolishHold>;
  const week = Math.floor(Number(r.week));
  const until = Math.floor(Number(r.until));
  if (!Number.isFinite(week) || !polishLive(until, at)) return null;
  return { id, week, until };
}
