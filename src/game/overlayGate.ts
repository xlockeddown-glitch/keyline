/**
 * 0.0.98: celebrations (level-up pop, loot/match toasts) wait while a card or modal is up.
 * 0.0.99: "up" means actually on screen. The 0.0.98 rule counted the How to Play card as open at step 3
 * (the card has 3 steps, 0-2; finishing with Next leaves tutorial = 3) and counted the daily crate/blitz card
 * while that card was itself hiding behind the pending loot, so for many players pops waited forever.
 */
import { playerFree } from "./dailyPop.ts";

export type OverlayState = {
  tutorial: number;
  openVault: unknown;
  hqOpen: boolean;
  invOpen: boolean;
  shopOpen: boolean;
  guideOpen: boolean;
  errandOpen: unknown;
  blitzOpen: boolean;
  cratePop: unknown;
  blitzOffer: boolean;
  loot?: unknown;
  journey?: unknown;
};

/** Tutorial.tsx STEPS.length: steps 0-2 show a card; 3 and 4 both mean done. */
export const TUTORIAL_STEPS = 3;

/** A queued pop never waits longer than this once no vault is open (a stuck flag can't eat a reward). */
export const POP_MAX_WAIT_MS = 4000;

/** True while something is covering the screen; queued pops stay in the store until it clears. */
export function overlayBusy(s: OverlayState): boolean {
  const modal = Boolean(s.openVault || s.hqOpen || s.invOpen || s.shopOpen || s.guideOpen || s.errandOpen || s.blitzOpen);
  if (modal) return true;
  if (s.tutorial < TUTORIAL_STEPS) return true;
  // The daily card only shows when the player is free (no loot pending): only then does it cover anything.
  const dailyShown = playerFree({ ...s, loot: s.loot ?? null, journey: s.journey ?? null }) && Boolean(s.cratePop || s.blitzOffer);
  return dailyShown;
}
