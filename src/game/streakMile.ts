/**
 * 0.1.133 answer-streak milestones. The run is the same one the server already pays
 * (streakWalk / the old streakRun): right grades since the last miss, newest first,
 * and the Tabby's first miss of a Chicago day does not break it.
 *
 * Volatile perks (turbo, trail, pixel speed, the market rung, triple vault coin)
 * are on only while that run is at least the threshold. They are not items.
 * The violet key is minted once per run. Streak Lord is once ever.
 *
 * Night market choice: one existing light rung, +0.1 on vault-answer coin while the
 * player is on an open market (the same step as Amber → Jade). Matches stay ×2.
 * The bump uses the market-coin cap (×3), so Rainbow + Owl already at the cap adds 0.
 */
import { MARKET_COIN_CAP } from "./marketLights.ts";

export const STREAK_LOOKBACK = 420;

export const TURBO_AT = 20;
export const TRAIL_AT = 30;
export const MARKET_AT = 40;
export const PIXEL_AT = 50;
export const TRIPLE_AT = 75;
export const VIOLET_AT = 100;
export const LORD_AT = 250;

/** +12% on the seated car's existing pace. Modest next to the Mustang (+15%) and the Roadster 2.0 (+30%). */
export const TURBO_PACE = 1.12;
/** The drive loop's base catch-up rate (was the literal 4.2). */
export const BASE_ACCEL = 4.2;
/** About 1.7× snappier, still a ramp, not a teleport. */
export const FAST_ACCEL = 7.2;
export const TRIPLE_COIN = 3;
/** One night-market light rung. */
export const STREAK_MARKET_STEP = 0.1;

export type MileId = "turbo" | "trail" | "market" | "pixel" | "triple" | "violet" | "lord";

export type Mile = {
  at: number;
  id: MileId;
  name: string;
  /** One line for the HUD list. */
  blurb: string;
};

export const STREAK_MILESTONES: readonly Mile[] = [
  { at: TURBO_AT, id: "turbo", name: "Turbo", blurb: "The car pulls a little harder while you drive." },
  { at: TRAIL_AT, id: "trail", name: "Blue trail", blurb: "A blue trail follows the car while you drive." },
  { at: MARKET_AT, id: "market", name: "Night market", blurb: "Vault coin on an open night market gains one light rung (+0.1), still capped at ×3." },
  { at: PIXEL_AT, id: "pixel", name: "Pixel speed", blurb: "Pixel speed lines, and the car gets up to speed faster, while you drive." },
  { at: TRIPLE_AT, id: "triple", name: "Triple vault coin", blurb: "A right vault answer pays triple coin. Tills, gifts, refunds, and sparks do not." },
  { at: VIOLET_AT, id: "violet", name: "Violet key", blurb: "One violet key this streak. A full pocket pays coin, the same as any violet key." },
  { at: LORD_AT, id: "lord", name: "Streak Lord", blurb: "A permanent title. It stays in the Journal after the streak breaks." },
];

export type StreakPerks = {
  turbo: boolean;
  trail: boolean;
  market: boolean;
  pixel: boolean;
  fastAccel: boolean;
  triple: boolean;
};

export function perksAt(run: number): StreakPerks {
  const n = liveRun(run);
  return {
    turbo: n >= TURBO_AT,
    trail: n >= TRAIL_AT,
    market: n >= MARKET_AT,
    pixel: n >= PIXEL_AT,
    fastAccel: n >= PIXEL_AT,
    triple: n >= TRIPLE_AT,
  };
}

export function nextMile(run: number, lord = false): Mile | null {
  const n = liveRun(run);
  return STREAK_MILESTONES.find((m) => (m.id === "lord" ? !(lord || n >= m.at) : n < m.at)) ?? null;
}

export function crossed(before: number, after: number, at: number): boolean {
  return before < at && after >= at;
}

/** Labels for perks that turned on with this answer. Violet and the title are named by their own ledger writes. */
export function mileCrossLabels(before: number, after: number): string[] {
  const out: string[] = [];
  if (crossed(before, after, TURBO_AT)) out.push("Streak 20 · Turbo");
  if (crossed(before, after, TRAIL_AT)) out.push("Streak 30 · Blue trail");
  if (crossed(before, after, MARKET_AT)) out.push("Streak 40 · Night market +0.1");
  if (crossed(before, after, PIXEL_AT)) out.push("Streak 50 · Pixel speed");
  if (crossed(before, after, TRIPLE_AT)) out.push("Streak 75 · Triple vault coin");
  return out;
}

/** Multiplier on cab speed. 1 unless seated and actually driving with turbo. */
export function drivePace(run: number, seated: boolean, driving: boolean): number {
  return seated && driving && perksAt(run).turbo ? TURBO_PACE : 1;
}

/** Catch-up rate for the drive loop. The fast rate is seated driving only. */
export function driveAccel(run: number, seated: boolean, driving: boolean): number {
  return seated && driving && perksAt(run).fastAccel ? FAST_ACCEL : BASE_ACCEL;
}

/**
 * Extra vault coin for the streak's market rung: +0.1 on the multiplier, capped the same way as market lights.
 * `baseCoin` is the vault coin before the market doubles it. 0 off a cap-saturated light (Rainbow + Owl).
 */
export function streakMarketCoin(baseCoin: number, lightMult: number, coatMarket: number | undefined): number {
  const coin = Math.max(0, Math.round(baseCoin));
  if (!coin) return 0;
  const owl = Math.max(0, (coatMarket ?? 2) - 2);
  const now = Math.min(MARKET_COIN_CAP, Math.round((lightMult + owl) * 100) / 100);
  const next = Math.min(MARKET_COIN_CAP, Math.round((now + STREAK_MARKET_STEP) * 100) / 100);
  const add = Math.round((next - now) * 100) / 100;
  if (add <= 0) return 0;
  return Math.round(coin * add);
}

export type StreakRow = { miss: boolean; day: string; key?: string };

/**
 * Answer streak from grade rows, newest first. Same miss rule as the 0.0.96 Tabby run:
 * with the shield, only the day's first miss is skipped.
 * `anchor` is the oldest counted grade's key (the start of this run).
 */
export function streakWalk(rows: readonly StreakRow[], shield: boolean): { run: number; anchor: string } {
  let run = 0;
  let anchor = "";
  const missDays = new Map<string, number>();
  if (shield) for (const r of rows) if (r.miss) missDays.set(r.day, (missDays.get(r.day) ?? 0) + 1);
  const seen = new Map<string, number>();
  for (const r of rows) {
    if (r.miss) {
      if (!shield) break;
      const k = (seen.get(r.day) ?? 0) + 1;
      seen.set(r.day, k);
      if (k < (missDays.get(r.day) ?? 0)) break;
      continue;
    }
    run++;
    if (r.key) anchor = r.key;
  }
  return { run, anchor };
}

function liveRun(run: number): number {
  if (!Number.isFinite(run) || run <= 0) return 0;
  return Math.floor(run);
}
