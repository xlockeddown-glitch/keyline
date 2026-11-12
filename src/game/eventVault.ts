/**
 * 0.1.159 Comet vault: the first timed lantern kind. In each city one Comet vault opens every 6 hours and stays
 * open 20 minutes (Ryan made it rarer than the plan's 3 hours: at most 4 windows a day). Each city has its own
 * start offset, so they don't all pop at once.
 *
 * It opens with a green key and plays as tier III. A right answer pays the green coin ×1.5 plus one guaranteed
 * blue key, on top of the usual perfect-answer key back. Each walker clears it once per window (signed in: an
 * `ev:<id>` ledger row; guests go dark locally, like a market lantern). It never stacks with the night market.
 *
 * Pure and shared: the schedule is a function of the clock, and the spot comes from the baked market streets
 * (MARKET_STREETS), so the server rebuilds the same id and spot from its own clock. The spot sits on a baked
 * walkable street near spawn, outside every night-market zone and away from the city's lamps; sparse cities fall
 * back to a ring round spawn, as the market lanterns do.
 */
import { distM, metersPerDegLng } from "./geo.ts";
import { MARKET_STREETS } from "./marketStreets.ts";
import { hash32, marketStreets, zoneOf, type MarketZone } from "./nightMarket.ts";
import { CITIES } from "./data.ts";
import type { CityId, Poi, Tier } from "./types";

export const COMET_EVERY_MS = 6 * 60 * 60_000;
export const COMET_OPEN_MS = 20 * 60_000;
/** Green coin multiplier on a right answer. Never stacks with the night market. */
export const COMET_MULT = 1.5;
/** Guaranteed on a right answer (through the pocket rule). */
export const COMET_BONUS: Partial<Record<Tier, number>> = { blue: 1 };
export const COMET_TIER: Tier = "green";
/** Reward-card line for a comet clear (server award and guest loot alike). */
export const COMET_TAG = `Comet ×${COMET_MULT} · +1 blue key`;
/** A quiz opened just before the close still finds its vault by id (map lookups; same as market lanterns). */
export const COMET_LATE_MS = 10 * 60_000;
/** Clock skew the server allows at the close, for the deal and for the sealed pay time alike. */
export const COMET_SKEW_MS = 60_000;
/** The comet keeps this far from the city's lamps (when the streets allow). */
export const COMET_GAP_M = 60;
/** …and this far outside every night-market zone. */
export const COMET_ZONE_PAD_M = 40;
/** Prefer spots within this walk of the city's start (a 20-minute window has to be reachable); else any baked spot. */
export const COMET_NEAR_M = 900;
/** Sparse-city fallback: a ring this far round spawn. */
export const COMET_RING_M = 260;

const COMET_ID = /^comet-([a-z0-9-]+)-(\d+)$/;

/** Each city's start offset inside the 6-hour cycle (whole minutes, stable forever). */
export function cometOffset(city: CityId): number {
  return (hash32(`keyline-comet|${city}`) % (COMET_EVERY_MS / 60_000)) * 60_000;
}

/** The window index this moment falls in (a window starts every COMET_EVERY_MS from the city's offset). */
export function cometWindow(city: CityId, at: number): number {
  return Math.floor((at - cometOffset(city)) / COMET_EVERY_MS);
}

export function cometStart(city: CityId, w: number): number {
  return cometOffset(city) + w * COMET_EVERY_MS;
}

/** When window `w` closes. */
export function cometEnd(city: CityId, w: number): number {
  return cometStart(city, w) + COMET_OPEN_MS;
}

export type CometState = { city: CityId; w: number; startsAt: number; endsAt: number; open: boolean };

/** Where this city's comet schedule stands: the current window when open, else the next one. */
export function cometAt(city: CityId, at: number): CometState {
  const w = cometWindow(city, at);
  const s = cometStart(city, w);
  if (at - s < COMET_OPEN_MS) return { city, w, startsAt: s, endsAt: s + COMET_OPEN_MS, open: true };
  return { city, w: w + 1, startsAt: cometStart(city, w + 1), endsAt: cometEnd(city, w + 1), open: false };
}

export function isComet(id: string): boolean {
  return COMET_ID.test(id);
}

export function cometId(city: CityId, w: number): string {
  return `comet-${city}-${w}`;
}

/** When this comet's window ends (it stays dark until then once cleared). 0 for any other id. */
export function cometWindowEnd(id: string): number {
  const hit = COMET_ID.exec(id);
  if (!hit || !(hit[1]! in CITIES)) return 0;
  return cometEnd(hit[1] as CityId, Number(hit[2]));
}

/** Every night-market zone in the city (the comet must never sit inside one, whichever market is running). */
function zones(city: CityId): MarketZone[] {
  return marketStreets(city).map((s) => zoneOf(city, s));
}

function clearOfZones(zs: readonly MarketZone[], p: { lat: number; lng: number }): boolean {
  return zs.every((z) => distM(z.lat, z.lng, p.lat, p.lng) > z.r + COMET_ZONE_PAD_M);
}

type Cand = { lat: number; lng: number; street: string; gap: number; home: number };
const CANDS = new Map<CityId, Cand[]>();

/** Spots along the baked walkable streets, outside every market zone, with their distance to the nearest lamp. */
export function cometCandidates(city: CityId): Cand[] {
  const hit = CANDS.get(city);
  if (hit) return hit;
  const c = CITIES[city];
  const zs = zones(city);
  const lamps = c?.pois ?? [];
  const gapOf = (p: { lat: number; lng: number }) => lamps.reduce((m, q) => Math.min(m, distM(p.lat, p.lng, q.lat, q.lng)), Infinity);
  const home = c ? (c.start ?? c.spawn) : { lat: 0, lng: 0 };
  const homeOf = (p: { lat: number; lng: number }) => distM(home.lat, home.lng, p.lat, p.lng);
  const out: Cand[] = [];
  for (const s of MARKET_STREETS[city] ?? []) {
    for (const ln of s.lines) {
      for (let i = 0; i + 3 < ln.length; i += 2) {
        const a = { lat: ln[i]!, lng: ln[i + 1]! }, b = { lat: ln[i + 2]!, lng: ln[i + 3]! };
        const n = Math.max(1, Math.ceil(distM(a.lat, a.lng, b.lat, b.lng) / 25));
        for (let k = 0; k < n; k++) {
          const p = { lat: a.lat + ((b.lat - a.lat) * k) / n, lng: a.lng + ((b.lng - a.lng) * k) / n };
          if (clearOfZones(zs, p)) out.push({ ...p, street: s.name, gap: gapOf(p), home: homeOf(p) });
        }
      }
    }
  }
  // Sparse city (no baked street clear of the markets): the market-style ring round spawn.
  if (!out.length && c) {
    const o = c.spawn;
    for (let i = 0; i < 8; i++) {
      const t = (i / 8) * Math.PI * 2;
      const p = { lat: o.lat + (COMET_RING_M * Math.sin(t)) / 111_320, lng: o.lng + (COMET_RING_M * Math.cos(t)) / metersPerDegLng(o.lat) };
      out.push({ ...p, street: "", gap: gapOf(p), home: homeOf(p) });
    }
    const clear = out.filter((p) => clearOfZones(zs, p));
    if (clear.length) out.splice(0, out.length, ...clear);
  }
  CANDS.set(city, out);
  return out;
}

const VAULTS = new Map<string, Poi | null>();

/** The comet vault of window `w` (open or not): same id and spot on every device and on the server. */
export function cometOfWindow(city: CityId, w: number): Poi | null {
  const key = `${city}|${w}`;
  if (VAULTS.has(key)) return VAULTS.get(key)!;
  const cands = cometCandidates(city);
  let poi: Poi | null = null;
  if (cands.length) {
    // Near the start when the bake has spots there; spread like the market lanterns: only spots clear of the lamps,
    // and if none are, the one farthest from them.
    const near = cands.filter((p) => p.home <= COMET_NEAR_M);
    const base = near.length ? near : cands;
    const far = base.filter((p) => p.gap >= COMET_GAP_M);
    const pool = far.length ? far : [base.reduce((a, b) => (b.gap > a.gap ? b : a))];
    const p = pool[hash32(`keyline-comet|${city}|${w}`) % pool.length]!;
    const on = p.street ? ` on ${p.street}` : " near the start";
    poi = {
      id: cometId(city, w),
      name: "Comet vault",
      kind: "landmark",
      tier: COMET_TIER,
      lat: +p.lat.toFixed(6),
      lng: +p.lng.toFixed(6),
      lore: `A comet came down${on}. Its vault is open for 20 minutes: a green key, ×${COMET_MULT} coin and a blue key back.`,
      noClue: true,
      ...(p.street ? { street: p.street } : {}),
    } as Poi;
  }
  if (VAULTS.size > 256) VAULTS.clear();
  VAULTS.set(key, poi);
  return poi;
}

/** The comet vault open in this city at this moment, or null between windows. */
export function cometVault(city: CityId, at: number): Poi | null {
  const s = cometAt(city, at);
  return s.open ? cometOfWindow(city, s.w) : null;
}

/** The comet with this id while its window is open (plus `graceMs` after the close), else null. */
export function cometById(city: CityId, id: string, at: number, graceMs = 0): Poi | null {
  const hit = COMET_ID.exec(id);
  if (!hit || hit[1] !== city) return null;
  const w = Number(hit[2]);
  if (!Number.isSafeInteger(w)) return null;
  const s = cometStart(city, w);
  if (at < s || at >= s + COMET_OPEN_MS + graceMs) return null;
  return cometOfWindow(city, w);
}

/** The street a comet sits on ("" in the sparse-city fallback). */
export function cometStreet(p: Poi): string {
  return (p as Poi & { street?: string }).street ?? "";
}

/** "1 h 10" / "14 min" — HUD countdown wording. */
export function cometLeft(ms: number): string {
  const m = Math.max(1, Math.ceil(ms / 60_000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${String(r).padStart(2, "0")}` : `${h} h`;
}

/** The HUD line: open ("Comet vault on Elm St · 14 min left") or waiting ("next comet in 1 h 10"). */
export function cometLine(city: CityId, at: number): { open: boolean; text: string; poi: Poi | null } {
  const s = cometAt(city, at);
  if (s.open) {
    const poi = cometOfWindow(city, s.w);
    const st = poi ? cometStreet(poi) : "";
    return { open: true, poi, text: `Comet vault${st ? ` on ${st}` : ""} · ${cometLeft(s.endsAt - at)} left` };
  }
  return { open: false, poi: null, text: `next comet in ${cometLeft(s.startsAt - at)}` };
}
