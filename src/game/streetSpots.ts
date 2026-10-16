import type { CityId, Tier } from "./types.ts";

/** One city-day of street matches. A guest spawning at the 28s floor for a full day lands near this. */
export const STREET_CAP = 3200;

const SEED: Tier[] = ["white", "blue", "white", "white", "blue", "white", "white", "blue", "white"];

export type StreetSpot = {
  id: string;
  city: CityId;
  day: string;
  index: number;
  tier: Tier;
  /** Half of the spots after the opening nine. The server pays the market double only while that city's market is open. */
  market: boolean;
};

function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Same weights as the guest curb (`streetKeyTier`): rarer the longer the day has been going. */
function tierAt(playMin: number, rnd: () => number): Tier {
  const t = Math.min(90, Math.max(0, playMin));
  const weights: [Tier, number][] = [
    ["white", Math.max(0.22, 0.78 - t * 0.0055)],
    ["blue", 0.18 + t * 0.002],
    ["green", 0.04 + t * 0.0018],
    ["amber", t > 18 ? (t - 18) * 0.0014 : 0],
    ["red", t > 50 ? (t - 50) * 0.00045 : 0],
  ];
  const sum = weights.reduce((s, [, w]) => s + w, 0) || 1;
  let r = rnd() * sum;
  for (const [tier, w] of weights) {
    r -= w;
    if (r <= 0) return tier;
  }
  return "white";
}

/** The spot list for one player, city and UTC day. Index 0 is the same match every time. */
export function streetSpot(playerId: string, city: CityId, day: string, index: number): StreetSpot | null {
  if (!playerId || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  if (!Number.isInteger(index) || index < 0 || index >= STREET_CAP) return null;
  const id = `sk:${city}:${day}:${index}`;
  if (index < SEED.length) return { id, city, day, index, tier: SEED[index]!, market: false };
  const rnd = mulberry32(hash32(`${playerId}|${city}|${day}|${index}`));
  const playMin = (index - SEED.length) * 0.5;
  return { id, city, day, index, tier: tierAt(playMin, rnd), market: rnd() < 0.5 };
}

export function parseStreetId(id: string): { city: CityId; day: string; index: number } | null {
  const m = /^sk:([a-z]+):(\d{4}-\d{2}-\d{2}):(\d+)$/.exec(id);
  if (!m) return null;
  const index = Number(m[3]);
  if (!Number.isInteger(index)) return null;
  return { city: m[1] as CityId, day: m[2]!, index };
}

const CURSOR_KEY = "keyline-street-ix-v1";
const memory: Record<string, number> = {};

function readCursor(): Record<string, number> {
  try {
    const raw = globalThis.localStorage?.getItem(CURSOR_KEY);
    if (!raw) return { ...memory };
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : { ...memory };
  } catch {
    return { ...memory };
  }
}

function writeCursor(bag: Record<string, number>) {
  Object.assign(memory, bag);
  try {
    globalThis.localStorage?.setItem(CURSOR_KEY, JSON.stringify(bag));
  } catch {
    /* private mode keeps the in-memory cursor */
  }
}

/** Next unissued spot for this browser. `floor` skips indexes already sitting on the map. */
export function takeStreetSpot(playerId: string, city: CityId, now = Date.now(), floor = 0): StreetSpot | null {
  const day = new Date(now).toISOString().slice(0, 10);
  const key = `${playerId}:${city}:${day}`;
  const bag = readCursor();
  const index = Math.max(bag[key] ?? 0, floor);
  const spot = streetSpot(playerId, city, day, index);
  if (!spot) return null;
  bag[key] = index + 1;
  writeCursor(bag);
  return spot;
}
