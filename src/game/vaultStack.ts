/**
 * 0.1.7 stacking lamp cooldowns (Ryan): each open of the same lamp on the same day rests longer — the 1st open rests
 * the usual time, the 2nd twice as long, the 3rd three times… The count starts again at the city's local midnight.
 * Pure helpers; the device keeps the count next to the lamp's cooldown in the save (VaultRuntime.opens / openDay).
 */
import { CITY_TZ } from "./sky.ts";
import type { CityId, VaultRuntime } from "./types";

/** The city's local calendar day, YYYY-MM-DD. */
export function cityDay(city: CityId, at: number): string {
  return new Date(at).toLocaleDateString("en-CA", { timeZone: CITY_TZ[city] ?? "America/Chicago" });
}

/** Which open of this lamp today this one is (1 for the first open today). */
export function openNumber(v: Pick<VaultRuntime, "opens" | "openDay"> | undefined, day: string): number {
  return (v?.openDay === day ? Math.max(0, v.opens ?? 0) : 0) + 1;
}

/** Rest after the nth open today: the base rest (market rest included) times n. */
export function stackedCoolMs(baseMs: number, n: number): number {
  return Math.round(baseMs * Math.max(1, Math.floor(n)));
}
