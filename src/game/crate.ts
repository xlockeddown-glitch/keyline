import type { Tier } from "./types";

export const CRATE_MAX = 30;

const EMPTY: Record<Tier, number> = {
  white: 0,
  blue: 0,
  green: 0,
  amber: 0,
  red: 0,
  violet: 0,
};

export function dayGap(prev: string, next: string) {
  if (!prev) return Number.POSITIVE_INFINITY;
  const a = Date.parse(`${prev}T00:00:00Z`);
  const b = Date.parse(`${next}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  return Math.round((b - a) / 86_400_000);
}

/** Streak after a claim today. A single missed day is forgiven; two in a row resets. */
export function nextCrateStreak(lastDay: string, streak: number, today: string) {
  const gap = dayGap(lastDay, today);
  if (gap <= 0) return Math.max(1, Math.min(CRATE_MAX, streak || 1));
  const step = Math.max(1, (streak || 0) + 1);
  if (gap === 1 || gap === 2) return Math.min(CRATE_MAX, step);
  return 1;
}

export function crateLoot(day: number): Record<Tier, number> {
  const d = Math.max(1, Math.min(CRATE_MAX, Math.floor(day)));
  if (d >= 30) return { ...EMPTY, violet: 1, white: 2, blue: 1 };
  if (d >= 25) return { ...EMPTY, red: 1, amber: 1, blue: 1, white: 2 };
  if (d >= 20) return { ...EMPTY, amber: 1, green: 1, blue: 1, white: 3 };
  if (d >= 15) return { ...EMPTY, green: 1, blue: 2, white: 3 };
  if (d >= 10) return { ...EMPTY, green: 1, blue: 2, white: 4 };
  if (d >= 5) return { ...EMPTY, blue: 2, white: 4 };
  return { ...EMPTY, white: 5, blue: 1 };
}

export function crateLine(loot: Record<Tier, number>) {
  const order: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];
  return order
    .filter((t) => (loot[t] ?? 0) > 0)
    .map((t) => {
      const n = loot[t]!;
      return n === 1 ? `1 ${t}` : `${n} ${t}`;
    })
    .join(", ");
}