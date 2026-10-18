/**
 * 0.0.90 daily pop: the morning crate claims itself after the first graded answer of the day, then
 * (once a day, when it is due) the Daily Blitz is offered. Pure rules; the store and DailyPop.tsx wire them.
 */
import { blitzDue } from "./dailyBlitz.ts";

/** The crate auto-claims on a graded answer when today's crate hasn't been claimed yet. */
export function autoCrateDue(lastCrateDay: string, today: string): boolean {
  return lastCrateDay !== today;
}

/** Offer the blitz after the crate pop-up: at most once a day, and only when today's blitz hasn't started. */
export function blitzOfferDue(lastOfferDay: string, lastBlitzDay: string, today: string): boolean {
  return lastOfferDay !== today && blitzDue(lastBlitzDay, today);
}

export type FreeState = {
  openVault: unknown;
  loot: unknown;
  hqOpen: boolean;
  invOpen: boolean;
  shopOpen: boolean;
  guideOpen: boolean;
  errandOpen: unknown;
  blitzOpen: boolean;
  journey: unknown;
};

/** No open lamp / question / loot, panel, sheet or train ride: safe to show a pop-up. */
export function playerFree(s: FreeState): boolean {
  return !s.openVault && !s.loot && !s.hqOpen && !s.invOpen && !s.shopOpen && !s.guideOpen && !s.errandOpen && !s.blitzOpen && !s.journey;
}
