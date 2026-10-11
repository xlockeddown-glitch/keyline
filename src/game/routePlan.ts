import { distM } from "./geo.ts";

/** One stop on a walk the player built: a match, a door, or a point on the map. */
export type PlanStop = { lat: number; lng: number; keyId?: string; door?: boolean };

/** The live stop plus the queue. Eight is enough for a loop around a ward. */
export const ROUTE_CAP = 8;

/** Two taps this close, with no match id, are the same corner. */
export const ROUTE_NEAR_M = 16;

function sameStop(a: PlanStop, b: PlanStop) {
  // Different matches stay separate even when they sit a few steps apart.
  if (a.keyId || b.keyId) return Boolean(a.keyId && a.keyId === b.keyId);
  return distM(a.lat, a.lng, b.lat, b.lng) < ROUTE_NEAR_M;
}

/**
 * No current walk: start one. A walk already going: add this stop on the end,
 * or take it off if it was already queued. The live stop stays put.
 */
export function planStop(queue: readonly PlanStop[], current: PlanStop | null, stop: PlanStop) {
  if (!current) return { action: "start" as const, queue: [] as PlanStop[] };
  if (sameStop(current, stop)) return { action: "same" as const, queue: [...queue] };
  const idx = queue.findIndex((s) => sameStop(s, stop));
  if (idx >= 0) return { action: "drop" as const, queue: queue.filter((_, i) => i !== idx) };
  if (queue.length + 1 >= ROUTE_CAP) return { action: "full" as const, queue: [...queue] };
  return { action: "append" as const, queue: [...queue, stop] };
}
