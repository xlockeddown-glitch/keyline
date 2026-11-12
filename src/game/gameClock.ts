/**
 * 0.1.159 dev / QA clock for timed vaults (the Comet vault, and the night market alongside it).
 *
 * Production always reads the real clock: `gameNow()` is `Date.now()` and nothing can move it, because the setter
 * and the cookie read are behind `import.meta.env.DEV` (false in a build). In the dev server, screenshots and local
 * QA can shift the clock with `window.__keylineClock(ms | null)` or `?comet=open|cooling|locked` (GameMap), like
 * `window.__keylineSky`. The shift is mirrored to a dev cookie so the dev server's trivia deal and grade see the
 * same time (triviaBank.ts reads it only in DEV). Unit tests pass explicit `at` values and never use this.
 */
export const DEV_CLOCK_COOKIE = "kl_dev_clock";

let shift = 0;

/** The game's clock: the real one, plus a dev-only shift. */
export function gameNow(): number {
  return shift ? Date.now() + shift : Date.now();
}

/** Dev only: set the shift (ms added to the real clock). A no-op in production. */
export function setDevClockShift(ms: number): void {
  if (!import.meta.env?.DEV) return;
  shift = Number.isFinite(ms) ? Math.round(ms) : 0;
  if (typeof document !== "undefined") {
    document.cookie = shift ? `${DEV_CLOCK_COOKIE}=${shift}; path=/; SameSite=Lax` : `${DEV_CLOCK_COOKIE}=; path=/; max-age=0`;
  }
}

/** Dev only: a shift read back from the cookie (server side, or a reload). Bad values are 0. */
export function parseDevShift(raw: string | null | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && Math.abs(n) < 400 * 24 * 3600_000 ? Math.round(n) : 0;
}

if (import.meta.env?.DEV && typeof window !== "undefined") {
  // A reload keeps the forced clock (the cookie is what the dev server reads too).
  const m = new RegExp(`(?:^|; )${DEV_CLOCK_COOKIE}=([^;]*)`).exec(document.cookie);
  shift = parseDevShift(m?.[1]);
  (window as unknown as { __keylineClock?: (ms: number | null) => void }).__keylineClock = (ms) => setDevClockShift(ms == null ? 0 : ms - Date.now());
}
