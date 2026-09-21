import { standingName } from "./standingName.ts";
import type { CityId, Tier } from "./types";

export const ACCURACY_MIN = 100;
export const SPEED_MIN = 10;

export type StandingKind = "cards" | "speed" | "accuracy";
export type StandingScope = "all" | "city";

export type AttemptAgg = {
  userId: string;
  name: string;
  attempts: number;
  correct: number;
  latencySum: number;
};

export type StandingRow = {
  userId: string;
  name: string;
  rank: number;
  correct: number;
  attempts: number;
  avgMs: number | null;
  rate: number | null;
};

export type StandingBoard = {
  kind: StandingKind;
  scope: StandingScope;
  city: CityId | null;
  byTier: Record<Tier, StandingRow[]>;
};

export function emptyStandingBoard(
  kind: StandingKind = "cards",
  scope: StandingScope = "all",
  city: CityId | null = null,
): StandingBoard {
  return {
    kind,
    scope,
    city,
    byTier: {
      white: [],
      blue: [],
      green: [],
      amber: [],
      red: [],
      violet: [],
    },
  };
}

export function publicStandingName(name: string | null | undefined) {
  return standingName(name);
}

function cmpUser(a: AttemptAgg, b: AttemptAgg) {
  return a.userId.localeCompare(b.userId);
}

function toRow(row: AttemptAgg, rank: number): StandingRow {
  const attempts = Math.max(0, row.attempts);
  const correct = Math.max(0, row.correct);
  return {
    userId: row.userId,
    name: publicStandingName(row.name),
    rank,
    correct,
    attempts,
    avgMs: attempts > 0 ? row.latencySum / attempts : null,
    rate: attempts > 0 ? correct / attempts : null,
  };
}

function rankList(rows: AttemptAgg[], cmp: (a: AttemptAgg, b: AttemptAgg) => number, limit = 25): StandingRow[] {
  return [...rows]
    .sort((a, b) => cmp(a, b) || cmpUser(a, b))
    .slice(0, limit)
    .map((row, i) => toRow(row, i + 1));
}

/** Most trivia cards answered correctly. Ties: more attempts, then stable user id. */
export function rankCards(rows: AttemptAgg[], limit = 25): StandingRow[] {
  const eligible = rows.filter((r) => r.correct > 0);
  return rankList(
    eligible,
    (a, b) => b.correct - a.correct || b.attempts - a.attempts,
    limit,
  );
}

/** Fastest average answer time. Needs SPEED_MIN attempts. Lower avg wins. */
export function rankSpeed(rows: AttemptAgg[], minAttempts = SPEED_MIN, limit = 25): StandingRow[] {
  const eligible = rows.filter((r) => r.attempts >= minAttempts);
  return rankList(
    eligible,
    (a, b) => {
      const avgA = a.latencySum / a.attempts;
      const avgB = b.latencySum / b.attempts;
      return avgA - avgB || b.attempts - a.attempts;
    },
    limit,
  );
}

/** Highest share correct. Needs ACCURACY_MIN attempts. Ties: more attempts. */
export function rankAccuracy(rows: AttemptAgg[], minAttempts = ACCURACY_MIN, limit = 25): StandingRow[] {
  const eligible = rows.filter((r) => r.attempts >= minAttempts);
  return rankList(
    eligible,
    (a, b) => {
      const rateA = a.correct / a.attempts;
      const rateB = b.correct / b.attempts;
      return rateB - rateA || b.attempts - a.attempts;
    },
    limit,
  );
}

export function rankKind(kind: StandingKind, rows: AttemptAgg[], limit = 25): StandingRow[] {
  if (kind === "speed") return rankSpeed(rows, SPEED_MIN, limit);
  if (kind === "accuracy") return rankAccuracy(rows, ACCURACY_MIN, limit);
  return rankCards(rows, limit);
}

export function mineFromBoard(board: StandingBoard, userId: string | null | undefined, tier: Tier): StandingRow | null {
  if (!userId) return null;
  return board.byTier[tier].find((r) => r.userId === userId) ?? null;
}

export function formatAvg(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "\u2014";
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatRate(rate: number | null): string {
  if (rate == null || !Number.isFinite(rate)) return "\u2014";
  return `${Math.round(rate * 100)}%`;
}

export function standingValue(kind: StandingKind, row: StandingRow): string {
  if (kind === "speed") return formatAvg(row.avgMs);
  if (kind === "accuracy") return formatRate(row.rate);
  return row.correct.toLocaleString();
}

export const STANDING_KINDS: { id: StandingKind; label: string; blurb: string }[] = [
  { id: "cards", label: "Most cards", blurb: "Trivia cards answered correctly, by match colour." },
  { id: "speed", label: "Fastest", blurb: "Lowest average answer time. Ten trivia cards to rank." },
  { id: "accuracy", label: "% correct", blurb: "Highest share answered correctly. One hundred trivia cards to rank." },
];
