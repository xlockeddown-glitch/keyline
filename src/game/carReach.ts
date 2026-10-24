/**
 * 0.1.14: lamps, vaults and matches answer from inside YOUR OWN car (Ryan's call). The city cab still parks
 * you first (kept as it was), and the dealer and house stay on foot.
 */
import { distM } from "./geo.ts";
import type { Pt } from "./streets.ts";

export type Ride = "foot" | "own" | "cab";

export function rideOf(seated: boolean, ownCar: boolean): Ride {
  return !seated ? "foot" : ownCar ? "own" : "cab";
}

/**
 * 0.1.35: whatever you climb into while you own a car (carOn set) is your car. A cab already parked at the curb used
 * to be entered as the city cab, so lamps and matches refused you in your own car ("Park at the curb").
 */
export function seatIsOwnCar(carOn: string | null | undefined): boolean {
  return Boolean(carOn);
}

/** Can this ride open a lamp / vault / pick up a match without stepping out? */
export function lampFromRide(ride: Ride): boolean {
  return ride !== "cab";
}

/**
 * Cut a drive route where it first comes within `stopM` of the target, so the car stops at the curb in reach
 * instead of driving to the road's closest point and parking. Unchanged when it never gets that close.
 */
export function trimToReach(path: Pt[], target: Pt, stopM: number): Pt[] {
  if (path.length < 2) return path;
  if (distM(path[0]!.lat, path[0]!.lng, target.lat, target.lng) <= stopM) return [path[0]!, path[0]!];
  for (let i = 1; i < path.length; i++) {
    const b = path[i]!;
    if (distM(b.lat, b.lng, target.lat, target.lng) > stopM) continue;
    const a = path[i - 1]!;
    // Step back along a→b to the first point inside the ring (12 steps is plenty at street scale).
    let cut = b;
    for (let k = 1; k <= 12; k++) {
      const t = k / 12;
      const p = { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
      if (distM(p.lat, p.lng, target.lat, target.lng) <= stopM) {
        cut = p;
        break;
      }
    }
    return [...path.slice(0, i), cut];
  }
  return path;
}
