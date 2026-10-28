/**
 * 0.1.58 Loop: city travel is instant by default; the Loop is the optional tunnel ride.
 * Pure helpers shared by the store, the server wallet op and the tunnel cutscene.
 */
import { crateLoot } from "./crate.ts";
import type { CityId, Tier } from "./types.ts";

/** Cutscene length (ms); reduced motion plays a short fade instead. */
export const LOOP_MS = 7000;
export const LOOP_FADE_MS = 600;
/** About 1 Loop ride in 12 turns up a mystery crate. */
export const LOOP_CRATE_ONE_IN = 12;

function fmix32(h: number) {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Seeded by the ticket's departure time, so the client and server roll the same crate. */
export function loopCrate(departAt: number): boolean {
  const lo = departAt % 0x100000000;
  const hi = Math.floor(departAt / 0x100000000);
  return fmix32((lo ^ Math.imul(hi, 0x9e3779b1)) >>> 0) % LOOP_CRATE_ONE_IN === 0;
}

/** A mystery crate holds a day-one morning crate. */
export function loopCrateLoot(): Record<Tier, number> {
  return crateLoot(1);
}

/** Ledger key for the route's tunnel poster (one per direction). */
export function posterKey(from: CityId, to: CityId): string {
  return `poster:${from}-${to}`;
}

export function addPoster(list: readonly string[], key: string): string[] {
  return list.includes(key) ? [...list] : [...list, key];
}

export function cleanPosters(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is string => typeof x === "string" && /^poster:[a-z0-9_]+-[a-z0-9_]+$/.test(x)))];
}

export function posterRoute(key: string): { from: string; to: string } | null {
  const m = /^poster:([a-z0-9_]+)-([a-z0-9_]+)$/.exec(key);
  return m ? { from: m[1], to: m[2] } : null;
}

/** Poster colours come from the route so each one looks its own. */
export function posterHue(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return fmix32(h >>> 0) % 360;
}
