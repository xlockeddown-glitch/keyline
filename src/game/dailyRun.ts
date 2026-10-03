/**
 * Daily Lantern Run (0.0.43): one shared five-lamp route per city per UTC day.
 * 0.0.44: one run per walker per city per UTC day — each city's run is its own entry and pays its own reward.
 * Pure — the client, the server functions (dailyApi.ts) and the tests all use these rules,
 * so the route a player walks is the route the server checks.
 */
import { CITIES, SCOUTS, WALK_PACE } from "./data.ts";
import { distM } from "./geo.ts";
import { TIER_VALUE } from "./rewards.ts";
import { matchCap } from "./ticket.ts";
import type { CityId, Poi, Tier } from "./types";

export const DAILY_LAMPS = 5;
/** Lamps come from the city's named marks within this walk of spawn, so the run stays downtown. */
export const DAILY_RADIUS_M = 1600;
/** Two route lamps never sit closer than this, so every leg is a real walk. */
export const DAILY_MIN_SEP_M = 400;
/** A route lamp lights when the walker is this close (the lantern charm doesn't stretch it). */
export const DAILY_LIGHT_M = 80;
/** …or at the curb nearest a set-back lamp, if that curb is within this of the lamp. */
export const DAILY_CURB_MAX_M = 150;
/** The server accepts a light reported this close to the lamp (curb limit plus slack). */
export const DAILY_REACH_M = 170;
/** A run must finish within two hours of lighting lamp 1, or it expires. */
export const DAILY_MAX_MS = 2 * 60 * 60_000;
/** Network slack the server allows when it times a leg between two requests. */
export const DAILY_JITTER_MS = 1500;
/** Impossible legs before that city's entry for the day is voided. */
export const DAILY_STRIKES = 3;

/** How close to the curb point nearest a lamp counts as standing at it. */
export const DAILY_CURB_M = 12;

/**
 * Can the walker light this route lamp? Within DAILY_LIGHT_M, yes. A lamp set back from the street
 * (a plaza, a stadium) also lights from the closest walkable spot to it — walks end there.
 */
export function canLightDaily(
  walker: { lat: number; lng: number },
  lamp: { lat: number; lng: number },
  curb: { lat: number; lng: number } | null,
): boolean {
  if (distM(walker.lat, walker.lng, lamp.lat, lamp.lng) <= DAILY_LIGHT_M) return true;
  if (!curb || distM(curb.lat, curb.lng, lamp.lat, lamp.lng) > DAILY_CURB_MAX_M) return false;
  return distM(walker.lat, walker.lng, curb.lat, curb.lng) <= DAILY_CURB_M;
}

export type DailyLamp = { id: string; name: string; lat: number; lng: number; tier: Tier };
export type DailyRoute = { day: string; city: CityId; seed: number; lamps: DailyLamp[] };

export function utcDay(at: Date | number = new Date()): string {
  return new Date(at).toISOString().slice(0, 10);
}

/** FNV-1a, 32-bit. Stable across engines. */
export function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 — small deterministic PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailySeed(day: string, city: CityId): number {
  return hash32(`keyline-lantern-run|${day}|${city}`);
}

/** Named street lamps only: no outfitter, no train station / print desk. */
export function dailyEligible(cityId: CityId): Poi[] {
  const city = CITIES[cityId];
  const ok = (p: Poi, r: number) =>
    p.kind !== "shop" && p.kind !== "station" && !p.printShop && distM(city.spawn.lat, city.spawn.lng, p.lat, p.lng) <= r;
  let r = DAILY_RADIUS_M;
  let list = city.pois.filter((p) => ok(p, r));
  while (list.length < DAILY_LAMPS * 2 && r < 6000) {
    r += 400;
    list = city.pois.filter((p) => ok(p, r));
  }
  return [...list].sort((a, b) => a.id.localeCompare(b.id));
}

/** The day's route: five seeded lamps, walked in nearest-next order from the city's spawn. */
export function dailyRoute(cityId: CityId, day: string): DailyRoute {
  const city = CITIES[cityId];
  const seed = dailySeed(day, cityId);
  const rnd = mulberry32(seed);
  const pool = dailyEligible(cityId);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = t;
  }
  const picks: Poi[] = [];
  for (const p of pool) {
    if (picks.length >= DAILY_LAMPS) break;
    if (picks.some((q) => distM(p.lat, p.lng, q.lat, q.lng) < DAILY_MIN_SEP_M)) continue;
    picks.push(p);
  }
  for (const p of pool) {
    if (picks.length >= DAILY_LAMPS) break;
    if (!picks.includes(p)) picks.push(p);
  }
  const ordered: Poi[] = [];
  let cur = city.spawn;
  const left = [...picks];
  while (left.length) {
    left.sort((a, b) => distM(cur.lat, cur.lng, a.lat, a.lng) - distM(cur.lat, cur.lng, b.lat, b.lng) || a.id.localeCompare(b.id));
    const nxt = left.shift()!;
    ordered.push(nxt);
    cur = nxt;
  }
  return {
    day,
    city: cityId,
    seed,
    lamps: ordered.map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, tier: p.tier })),
  };
}

/** Fastest any walker can go: best coat's gait and pace, sprinting the whole way (stamina ignored). */
export function dailyTopSpeed(): number {
  let best = 1;
  for (const s of Object.values(SCOUTS)) best = Math.max(best, s.gait * (s.perk.pace ?? 1));
  return WALK_PACE * best * 1.5;
}

/** Straight-line lamp-to-lamp meters for leg `i` (lamp i-1 → lamp i), i = 1..4. */
export function legMeters(route: DailyRoute, i: number): number {
  const a = route.lamps[i - 1];
  const b = route.lamps[i];
  if (!a || !b) return 0;
  return distM(a.lat, a.lng, b.lat, b.lng);
}

/** Milliseconds to cover `m` meters at the top sprint, less 10%. */
export function floorForMeters(m: number): number {
  return Math.floor(((Math.max(0, m) / dailyTopSpeed()) * 1000) * 0.9);
}

/**
 * Fewest milliseconds leg `i` can take wherever in reach the two lights happened: the straight line
 * between the lamps less a full reach at each end, at the top sprint. Honest walks take far longer —
 * streets bend and sprint stamina runs out.
 */
export function legFloorMs(route: DailyRoute, i: number): number {
  return floorForMeters(legMeters(route, i) - 2 * DAILY_REACH_M);
}

/** Floor between the two spots the walker actually lit from: no street is shorter than the straight line. */
export function spotFloorMs(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return floorForMeters(distM(a.lat, a.lng, b.lat, b.lng));
}

export function runFloorMs(route: DailyRoute): number {
  let n = 0;
  for (let i = 1; i < route.lamps.length; i++) n += legFloorMs(route, i);
  return n;
}

export type Verdict = { ok: true } | { ok: false; reason: "order" | "too-fast" | "expired" | "far" | "bad" };

/**
 * Client splits: ms after lamp 1 at which lamps 2..5 lit (strictly rising), with the spots each lamp
 * lit from (lamps 1..5) when known. Checks each leg and the total against the floors and the two-hour limit.
 */
export function checkSplits(route: DailyRoute, splits: number[], spots?: { lat: number; lng: number }[]): Verdict {
  if (!Array.isArray(splits) || splits.length !== route.lamps.length - 1) return { ok: false, reason: "bad" };
  let prev = 0;
  for (let i = 0; i < splits.length; i++) {
    const s = splits[i]!;
    if (!Number.isFinite(s) || s <= prev) return { ok: false, reason: "order" };
    const a = spots?.[i];
    const b = spots?.[i + 1];
    const floor = Math.max(legFloorMs(route, i + 1), a && b ? spotFloorMs(a, b) : 0);
    if (s - prev < floor) return { ok: false, reason: "too-fast" };
    prev = s;
  }
  if (prev > DAILY_MAX_MS) return { ok: false, reason: "expired" };
  if (prev < runFloorMs(route)) return { ok: false, reason: "too-fast" };
  return { ok: true };
}

export type RunRow = {
  city: CityId;
  day: string;
  lit: number;
  startedAt: number;
  lastAt: number;
  /** Server ms after lamp 1 for lamps 2..n. */
  splits: number[];
  /** The client's own ms after lamp 1 for the same lamps. */
  clientSplits: number[];
  timeMs: number | null;
  voided: boolean;
  strikes: number;
  /** Where the last lamp was lit from. */
  lastLat: number;
  lastLng: number;
};

export type StartDecision =
  | { kind: "new" }
  | { kind: "resume"; row: RunRow }
  | { kind: "done"; row: RunRow }
  | { kind: "void" }
  | { kind: "far" };

/**
 * One run per walker per city per UTC day: lamp 1 locks that city's entry for the day; its clock never
 * resets. `existing` is this walker's row for the route's own day and city — a run in another city is
 * a separate entry and never blocks this one.
 */
export function startDecision(route: DailyRoute, existing: RunRow | null, at: { lat: number; lng: number }, now: number): StartDecision {
  if (existing && (existing.city !== route.city || existing.day !== route.day)) existing = null;
  if (existing) {
    if (existing.voided) return { kind: "void" };
    if (existing.timeMs != null) return { kind: "done", row: existing };
    if (now - existing.startedAt > DAILY_MAX_MS) return { kind: "void" };
    return { kind: "resume", row: existing };
  }
  const first = route.lamps[0]!;
  if (distM(at.lat, at.lng, first.lat, first.lng) > DAILY_REACH_M) return { kind: "far" };
  return { kind: "new" };
}

export type LightDecision =
  | { kind: "lit"; row: RunRow; finished: boolean }
  | { kind: "already"; row: RunRow }
  | { kind: "reject"; reason: "order" | "too-fast" | "far" | "bad"; strike: boolean }
  | { kind: "expire" };

/**
 * Lamp `index` (1..4) of an open run, timed on the server clock. `clientSplit` is the client's own
 * ms-after-lamp-1 for this lamp; both it and the server's leg time must clear the leg floor.
 */
export function lightDecision(
  route: DailyRoute,
  row: RunRow,
  index: number,
  at: { lat: number; lng: number },
  clientSplit: number,
  now: number,
): LightDecision {
  if (!Number.isInteger(index) || index < 1 || index >= route.lamps.length) return { kind: "reject", reason: "bad", strike: false };
  if (index < row.lit) return { kind: "already", row };
  if (index > row.lit) return { kind: "reject", reason: "order", strike: false };
  if (now - row.startedAt > DAILY_MAX_MS) return { kind: "expire" };
  const lamp = route.lamps[index]!;
  if (distM(at.lat, at.lng, lamp.lat, lamp.lng) > DAILY_REACH_M) return { kind: "reject", reason: "far", strike: false };
  const floor = Math.max(legFloorMs(route, index), spotFloorMs({ lat: row.lastLat, lng: row.lastLng }, at));
  const serverLeg = now - row.lastAt;
  const prevClient = index > 1 ? (row.clientSplits[index - 2] ?? 0) : 0;
  if (serverLeg + DAILY_JITTER_MS < floor) return { kind: "reject", reason: "too-fast", strike: true };
  if (!Number.isFinite(clientSplit) || clientSplit - prevClient < floor) return { kind: "reject", reason: "too-fast", strike: true };
  const elapsed = now - row.startedAt;
  const splits = [...row.splits, elapsed];
  const finished = index === route.lamps.length - 1;
  if (finished && elapsed + DAILY_JITTER_MS < runFloorMs(route)) return { kind: "reject", reason: "too-fast", strike: true };
  return {
    kind: "lit",
    finished,
    row: { ...row, lit: index + 1, lastAt: now, lastLat: at.lat, lastLng: at.lng, splits, clientSplits: [...row.clientSplits, clientSplit], timeMs: finished ? elapsed : null },
  };
}

export type DailyEntry = { userId: string; name: string; timeMs: number; finishedAt: number };
export type DailyStanding = { userId: string; name: string; timeMs: number; rank: number };

/** Fastest first; ties go to whoever finished first, then a stable id. Impossible times never rank. */
export function rankDaily(rows: DailyEntry[], floorMs: number, limit = 25): DailyStanding[] {
  const best = new Map<string, DailyEntry>();
  for (const r of rows) {
    if (!Number.isFinite(r.timeMs) || r.timeMs < floorMs || r.timeMs > DAILY_MAX_MS) continue;
    const had = best.get(r.userId);
    if (!had || r.finishedAt < had.finishedAt) best.set(r.userId, r);
  }
  return [...best.values()]
    .sort((a, b) => a.timeMs - b.timeMs || a.finishedAt - b.finishedAt || a.userId.localeCompare(b.userId))
    .slice(0, limit)
    .map((r, i) => ({ userId: r.userId, name: r.name, timeMs: r.timeMs, rank: i + 1 }));
}

/** Finishing pays once per city per UTC day: 2 white + 1 blue (150 coin on the white=30 ladder). */
export const DAILY_REWARD: Partial<Record<Tier, number>> = { white: 2, blue: 1 };

export function dailyRewardValue(): number {
  let n = 0;
  for (const [t, c] of Object.entries(DAILY_REWARD) as [Tier, number][]) n += TIER_VALUE[t] * c;
  return n;
}

/** The save's record of a paid finish: one key per city per UTC day. */
export function dailyPaidKey(day: string, city: CityId): string {
  return `${day}|${city}`;
}

/** Paid keys kept in the save (oldest drop first) — plenty for fifteen cities over a couple of days. */
export const DAILY_PAID_KEEP = 48;

export function isDailyPaid(paid: readonly string[], day: string, city: CityId): boolean {
  return paid.includes(dailyPaidKey(day, city));
}

/** Mark a city's finish paid for the day; null if that city already paid today (once per city per day). */
export function markDailyPaid(paid: readonly string[], day: string, city: CityId): string[] | null {
  if (!day || isDailyPaid(paid, day, city)) return null;
  return [...paid, dailyPaidKey(day, city)].slice(-DAILY_PAID_KEEP);
}

/**
 * Saves from 0.0.43 kept one `dailyPaidDay` (one reward a day, any city). Carry it over as that day's
 * paid city when the old local run says which city it was; otherwise it can't be tied to a city.
 */
export function legacyDailyPaid(paidDay: unknown, legacyRun: { day?: unknown; city?: unknown; timeMs?: unknown } | null): string[] {
  if (typeof paidDay !== "string" || !paidDay) return [];
  if (!legacyRun || legacyRun.day !== paidDay || typeof legacyRun.city !== "string" || legacyRun.timeMs == null) return [];
  return [dailyPaidKey(paidDay, legacyRun.city as CityId)];
}

/** Credit the reward; a match that won't fit the pocket pays its ladder value in coin instead. */
export function payDaily(keys: Record<Tier, number>, points: number) {
  const next = { ...keys };
  let coins = 0;
  const added: Partial<Record<Tier, number>> = {};
  for (const [t, c] of Object.entries(DAILY_REWARD) as [Tier, number][]) {
    const room = Math.max(0, matchCap(t) - (next[t] ?? 0));
    const fit = Math.min(room, c);
    next[t] = (next[t] ?? 0) + fit;
    if (fit) added[t] = fit;
    coins += (c - fit) * TIER_VALUE[t];
  }
  return { keys: next, points: points + coins, added, coins };
}

export function formatRunTime(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  const tenths = Math.floor(ms / 100);
  const m = Math.floor(tenths / 600);
  const s = Math.floor((tenths % 600) / 10);
  const t = tenths % 10;
  return `${m}:${String(s).padStart(2, "0")}.${t}`;
}
