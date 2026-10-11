/**
 * Shadow pity for the rarer cans. The posted odds (Help, the vat) never change.
 * A signed-in clear rolls against a higher chance only when this walker has gone
 * longer than other players did, by more than one standard deviation.
 *
 * The curve is the first find of that can: how many correct answers of that colour
 * it took (any colour, for prism). Fewer than a few other players — or none at all —
 * and the roll stays on the posted rate. White and blue are not in this set.
 */

/** Cans the shadow can touch. Common colours stay on the posted rate. */
export const SHADOW_PAINTS = ["green", "amber", "red", "violet", "prism"] as const;
export type ShadowPaint = (typeof SHADOW_PAINTS)[number];

/**
 * Distinct other players who have found the can. One or two lucky finds must not
 * move the curve for everyone else — "a few" is five.
 */
export const SHADOW_MIN_PLAYERS = 5;

/** The hidden chance never rises past this multiple of the posted rate. */
export const SHADOW_MAX_MULT = 4;

export type ShadowSample = {
  /** Other players with a first find. The walker asking is not in this count. */
  n: number;
  /** Mean correct answers those players had taken when the can first dropped. */
  mean: number;
  /** Sample standard deviation of that same count. Zero when they all matched. */
  sd: number;
};

export function isShadowPaint(color: string): color is ShadowPaint {
  return (SHADOW_PAINTS as readonly string[]).includes(color);
}

/**
 * Hidden multiplier on the posted drop chance.
 * At or under mean + one standard deviation, this is 1.
 * Each further standard deviation adds 1×, up to {@link SHADOW_MAX_MULT}.
 * A zero spread uses the mean as the step, so a pack that all found it on the
 * same count still raises once you're a full average wait past them.
 */
export function shadowMult(sample: ShadowSample | null, drought: number): number {
  if (!sample || sample.n < SHADOW_MIN_PLAYERS) return 1;
  if (!Number.isFinite(drought) || drought <= 0) return 1;
  const mean = sample.mean;
  if (!Number.isFinite(mean) || mean < 0) return 1;
  const spread = Number.isFinite(sample.sd) && sample.sd > 0 ? sample.sd : 0;
  const threshold = mean + spread;
  if (drought <= threshold) return 1;
  const unit = spread > 0 ? spread : mean > 0 ? mean : 1;
  const steps = (drought - threshold) / unit;
  if (!Number.isFinite(steps) || steps <= 0) return 1;
  return Math.min(SHADOW_MAX_MULT, 1 + steps);
}

/** Posted probability, times the shadow multiplier, never above 1. */
export function shadowChance(base: number, sample: ShadowSample | null, drought: number): number {
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Math.min(1, base * shadowMult(sample, drought));
}

/** `roll` is 0–1. Below `chance` hits, same rule as the posted paint roll. */
export function shadowHit(chance: number, roll: number): boolean {
  return Number.isFinite(chance) && chance > 0 && Number.isFinite(roll) && roll >= 0 && roll < chance;
}

