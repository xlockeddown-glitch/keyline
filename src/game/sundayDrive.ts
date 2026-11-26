/**
 * 0.1.181 Sunday Drive (CARD-183): a daily mileage meter for every signed-in player. Every whole 1,000 m moved on
 * the streets (on foot or seated) pays 25 coin, 8 pays a Chicago day (200 coin). Pure rules here; the server write
 * is walletApply.sundayPing and the table is migrations/0019_sunday_drive.sql.
 *
 *  - The client only ever says "I moved X m in mode M". It never sends a meter total or a pay count.
 *  - Time is the server's: `elapsedMs` is the server's own clock since this account's previous ping.
 *  - A leg above its speed ceiling is rejected whole (0 m), never clamped. Nothing else is voided by a bad leg.
 *  - Meters belong to the Chicago day of the server's receipt time. A ping is never split across midnight, and the
 *    day's leftover meters are dropped when the day turns.
 *  - Back-and-forth on one street pays like any other meters, on purpose. No distinct-street rule.
 */
import { cabSpeed } from "./data.ts";
import { DAILY_JITTER_MS, dailyTopSpeed } from "./dailyRun.ts";
import { carPace } from "./cars.ts";
import { chicagoDay } from "./questPeriods.ts";
import { TURBO_PACE } from "./streakMile.ts";

export type SundayMode = "walk" | "drive";
/** What the HUD needs: pays made today and the Chicago day they are for. Always the server's ledger count. */
export type SundayDay = { paid: number; day: string };

/** Meters per pay. */
export const SUNDAY_KM_M = 1000;
/** Coin per whole km. */
export const SUNDAY_COIN = 25;
/** Pays per Chicago day. */
export const SUNDAY_DAY_CAP = 8;
/** GPS jitter: a leg shorter than this adds nothing. */
export const SUNDAY_MIN_LEG_M = 10;
/** GPS jitter: an on-foot leg slower than this (m/s, by the server's clock) adds nothing. */
export const SUNDAY_MIN_FOOT_MPS = 0.5;
/** Clock skew only, the same 2% the walk board allows. */
export const SUNDAY_SLACK = 1.02;
/** An account's first ping has no previous clock: it is judged over this short fixed window (the walk board's opening window). */
export const SUNDAY_OPEN_MS = 8_000;
/** Pings closer than this do not move the clock and add nothing. */
export const SUNDAY_MIN_GAP_MS = 1_000;
/** The most one ping may ask for. Above the schema's limit the request is refused before it reaches the rules. */
export const SUNDAY_PING_MAX_M = 20_000;

/** The ledger key of the day's k-th pay (k = 1..SUNDAY_DAY_CAP). One row each, so a replay or a race cannot pay twice. */
export const sundayKey = (day: string, k: number) => `sd:${day}:${k}`;

/**
 * The fastest a leg may be, in m/s.
 *  - On foot: dailyTopSpeed() = WALK_PACE * MAX_PACE, the Lantern Run's ceiling, which covers every coat's pace.
 *  - Seated: cabSpeed(arterial = true) * max(1, the best pace among the cars this account owns on the server)
 *    * TURBO_PACE. The server cannot see which car is being driven or which road it is on, so it takes the fastest
 *    road, the fastest car the account really owns (the city cab is 1.00) and the streak turbo.
 */
export function sundayCeiling(mode: SundayMode, ownedCars: readonly string[] = []): number {
  if (mode === "walk") return dailyTopSpeed();
  return cabSpeed(true) * Math.max(1, ...ownedCars.map((c) => carPace(c))) * TURBO_PACE;
}

/**
 * Meters one ping adds: all of them or none.
 *  0 when the leg is under SUNDAY_MIN_LEG_M, when an on-foot leg is slower than SUNDAY_MIN_FOOT_MPS, when no time
 *  has passed, or when it asks for more than (elapsed + DAILY_JITTER_MS) * ceiling * SUNDAY_SLACK (a teleport).
 */
export function sundayLeg(mode: SundayMode, meters: number, elapsedMs: number, ceilingMps: number): number {
  const asked = Math.floor(Number(meters));
  if (!Number.isFinite(asked) || asked < SUNDAY_MIN_LEG_M) return 0;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  if (!Number.isFinite(ceilingMps) || ceilingMps <= 0) return 0;
  if (mode !== "drive" && asked / (elapsedMs / 1000) < SUNDAY_MIN_FOOT_MPS) return 0;
  const cap = ((elapsedMs + DAILY_JITTER_MS) / 1000) * ceilingMps * SUNDAY_SLACK;
  return asked <= cap ? asked : 0;
}

/** Which pays (k) a move from `before` to `after` meters crosses, in order. Whole km only, never past the cap. */
export function sundayCrossed(before: number, after: number): number[] {
  const from = Math.max(0, Math.floor(before / SUNDAY_KM_M));
  const to = Math.min(SUNDAY_DAY_CAP, Math.floor(after / SUNDAY_KM_M));
  const out: number[] = [];
  for (let k = from + 1; k <= to; k++) out.push(k);
  return out;
}

export type SundayMeter = { day: string; meters: number; lastAt: number };
export type SundayPingIn = { mode: SundayMode; meters: number };

/**
 * One ping against the meter, at server time `now`. The whole rule in one pure step (the server write does the same
 * thing in SQL): the clock always moves to `now` once SUNDAY_MIN_GAP_MS has passed, the meter resets when `now` is a
 * new Chicago day, an accepted leg lands whole on that day, and `pays` lists the km boundaries it crossed.
 */
export function sundayStep(prev: SundayMeter | null, ping: SundayPingIn, now: number, ceilingMps: number): { meter: SundayMeter; added: number; pays: number[] } {
  const day = chicagoDay(now);
  if (prev && now - prev.lastAt < SUNDAY_MIN_GAP_MS) return { meter: prev, added: 0, pays: [] };
  const before = prev && prev.day === day ? prev.meters : 0;
  const added = sundayLeg(ping.mode, ping.meters, prev ? now - prev.lastAt : SUNDAY_OPEN_MS, ceilingMps);
  return { meter: { day, meters: before + added, lastAt: now }, added, pays: sundayCrossed(before, before + added) };
}

/** The Chicago day a ping received at `now` belongs to (the one clock the server and the HUD guard share). */
export const sundayDayAt = (now: number) => chicagoDay(now);

/** "Sunday Drive 3/8 km" for the HUD, from the server's count. */
export function sundayText(paid: number): string {
  const n = Math.min(SUNDAY_DAY_CAP, Math.max(0, Math.floor(paid) || 0));
  return `Sunday Drive ${n}/${SUNDAY_DAY_CAP} km`;
}

/** The server's count as it stands at `nowMs`: 0 once its Chicago day has passed (the next reply brings the new day's). */
export function sundayToday(s: SundayDay | null | undefined, nowMs: number): number {
  return s && s.day === chicagoDay(nowMs) ? s.paid : 0;
}

/** The toast a pay shows. */
export const sundayLine = (coin: number) => `Sunday Drive +${coin} coin`;
