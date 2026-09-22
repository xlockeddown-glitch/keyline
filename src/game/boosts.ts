import type { Tier, TriviaCat } from "./types";
import { matchCap } from "./ticket.ts";

/** Consecutive correct answers that pay a white match. Resets on a miss. */
export const STREAK_SPARK_N = 3;
/** Correct submit faster than this (ms) pays Perfect timing coins. */
export const PERFECT_MS = 3000;
export const PERFECT_COINS = 5;
/** First correct per UTC day per topic, capped. */
export const CHARM_TOPICS_PER_DAY = 3;

export type TriviaBoostAward = {
  white: number;
  coins: number;
  labels: string[];
  charmDay: string;
  charmTopics: TriviaCat[];
};

export function utcDay(at: Date = new Date()) {
  return at.toISOString().slice(0, 10);
}

export function applyTriviaBoosts(input: {
  correct: boolean;
  elapsedMs: number;
  topic: TriviaCat | null | undefined;
  /** Consecutive correct count after this answer (0 on a miss). */
  streakAfter: number;
  charmDay: string;
  charmTopics: TriviaCat[];
  now?: Date;
}): TriviaBoostAward {
  const day = utcDay(input.now ?? new Date());
  const topics = input.charmDay === day ? [...input.charmTopics] : [];
  if (!input.correct) {
    return { white: 0, coins: 0, labels: [], charmDay: day, charmTopics: topics };
  }

  let white = 0;
  let coins = 0;
  const labels: string[] = [];

  if (input.streakAfter > 0 && input.streakAfter % STREAK_SPARK_N === 0) {
    white += 1;
    labels.push("Streak spark");
  }
  if (input.elapsedMs < PERFECT_MS) {
    coins += PERFECT_COINS;
    labels.push("Perfect timing");
  }
  const topic = input.topic ?? null;
  if (topic && !topics.includes(topic) && topics.length < CHARM_TOPICS_PER_DAY) {
    topics.push(topic);
    white += 1;
    labels.push("Category charm");
  }

  return { white, coins, labels, charmDay: day, charmTopics: topics };
}

/** Respect the white pocket. Extra awards are dropped, not converted. */
export function creditWhite(
  keys: Record<Tier, number>,
  n: number,
): { keys: Record<Tier, number>; added: number } {
  const want = Math.max(0, Math.floor(n));
  const have = keys.white ?? 0;
  const room = Math.max(0, matchCap("white") - have);
  const added = Math.min(want, room);
  if (!added) return { keys, added: 0 };
  return { keys: { ...keys, white: have + added }, added };
}
