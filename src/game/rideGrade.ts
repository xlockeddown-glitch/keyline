import { CITIES } from "./data.ts";
import { hash32 } from "./dailyRun.ts";
import { sorterSchedule, sortOutcome } from "./matchSorter.ts";
import { gradeRoute, routeOutcome, routeRound } from "./routePuzzle.ts";
import { lampInFrame, lampOutcome, lampSchedule, roundSeed, type RideOutcome } from "./rideGames.ts";
import type { CityId } from "./types.ts";
import { whereOutcome, whereRound } from "./whereAmI.ts";

const TIERS = new Set<string>(["white", "blue", "green", "amber", "red", "violet"]);

/** Seed for every round of one boarded ride. The client is told this; it does not invent it. */
export function rideSeed(playerId: string, ticketAt: number) {
  return hash32(`${playerId}|${Math.floor(ticketAt)}`) || 1;
}

export type RideMoves = {
  taps?: number[];
  picks?: string[];
  boxes?: string[];
  orders?: string[][];
};

/**
 * Score one dealt round from the seed the server issued and the moves the client sent back.
 * Null when this game has nothing to score (unknown id, or the city dealt an empty round).
 * The caller then pays the played bonus only, and only once the ride was actually played.
 */
export function scoreRide(game: string, seed: number, n: number, ms: number, city: CityId, moves: RideMoves): RideOutcome | null {
  if (game === "lamplighter") {
    const lamps = lampSchedule(ms, roundSeed(seed, n));
    const lit = new Set<number>();
    let hits = 0;
    let strays = 0;
    for (const raw of (moves.taps ?? []).slice(0, 80)) {
      const t = Math.max(0, Math.min(ms, Math.floor(Number(raw)) || 0));
      const hit = lampInFrame(lamps, lit, t);
      if (hit) {
        lit.add(hit.id);
        hits += 1;
      } else strays += 1;
    }
    return lampOutcome({ lamps: lamps.length, hits, strays });
  }
  if (game === "where-am-i") {
    const clues = whereRound(CITIES[city]?.pois ?? [], seed, n);
    if (!clues.length) return null;
    const picks = (moves.picks ?? []).slice(0, clues.length);
    let right = 0;
    picks.forEach((name, i) => {
      if (name === clues[i]?.answer) right += 1;
    });
    return whereOutcome({ asked: picks.length, right, total: clues.length });
  }
  if (game === "match-sorter") {
    const matches = sorterSchedule(roundSeed(seed, n));
    const boxes = moves.boxes ?? [];
    let right = 0;
    let wrong = 0;
    let missed = 0;
    for (const m of matches) {
      const box = boxes[m.id];
      if (!box || !TIERS.has(box)) {
        missed += 1;
        continue;
      }
      if (box === m.tier) right += 1;
      else wrong += 1;
    }
    return sortOutcome({ total: matches.length, right, wrong, missed });
  }
  if (game === "route-puzzle") {
    const maps = routeRound(CITIES[city]?.pois ?? [], seed, n);
    if (!maps.length) return null;
    const orders = moves.orders ?? [];
    let done = 0;
    let shortest = 0;
    let close = 0;
    maps.forEach((m, i) => {
      const order = orders[i];
      if (!order?.length) return;
      done += 1;
      const g = gradeRoute(m, order);
      if (g.grade === "shortest") shortest += 1;
      else if (g.grade === "close") close += 1;
    });
    return routeOutcome({ total: maps.length, done, shortest, close });
  }
  return null;
}
