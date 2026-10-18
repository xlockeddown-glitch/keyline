/** 0.0.98: celebrations (level-up pop, loot/match toasts) wait while a card or modal is up. */
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
};

export const TUTORIAL_STEPS = 4;

/** True while something is covering the screen; queued pops stay in the store until it clears. */
export function overlayBusy(s: OverlayState): boolean {
  const modal = Boolean(s.openVault || s.hqOpen || s.invOpen || s.shopOpen || s.guideOpen || s.errandOpen || s.blitzOpen);
  if (modal) return true;
  if (s.tutorial < TUTORIAL_STEPS) return true;
  return Boolean(s.cratePop || s.blitzOffer);
}
