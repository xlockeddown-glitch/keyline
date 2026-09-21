import { CITIES, CITY_LIST } from "./data.ts";
import { distM } from "./geo.ts";
import type { City, CityId, Poi } from "./types";

export const VAULTS_PER_FARE = 3;
export const FARES_CAP = 2;
export const WHITE_POCKET = 4;
export const BLUE_POCKET = 4;
export const GREEN_POCKET = 1;
export const SPARK_DAY = 6;

export function sparkState(day: string, n: number, lamps: string[], today: string) {
  if (day === today) return { sparkDay: day, sparkN: n, sparkLamps: lamps };
  return { sparkDay: today, sparkN: 0, sparkLamps: [] as string[] };
}

export function matchCap(tier: import("./types").Tier) {
  if (tier === "white") return WHITE_POCKET;
  if (tier === "blue") return BLUE_POCKET;
  if (tier === "green") return GREEN_POCKET;
  return 99;
}

export function fareDesk(city: City): Poi {
  return city.pois.find((p) => p.kind === "station") ?? city.pois.find((p) => p.printShop) ?? city.pois[0]!;
}

export function isFareDesk(p: { kind: string; printShop?: boolean }) {
  return p.kind === "station" || Boolean(p.printShop);
}

export function fareMs(from: CityId, to: CityId) {
  const a = CITIES[from].spawn;
  const b = CITIES[to].spawn;
  const km = distM(a.lat, a.lng, b.lat, b.lng) / 1000;
  return Math.round(Math.min(14 * 60_000, Math.max(48_000, 40_000 + km * 240)));
}

export function formatEta(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

export function otherWards(from: CityId) {
  return CITY_LIST.filter((c) => c.id !== from);
}

/** Matches found in the carriage. Longer waits pay more; 10+ min is a blue; sitting the whole 10+ min haul is a green. */
export function transitLoot(wallMs: number, openMs: number) {
  let white = 0;
  if (wallMs >= 12_000) white = 1;
  white += Math.floor(wallMs / 120_000);
  if (openMs >= 22_000) white += 1;
  white += Math.floor(openMs / 180_000);
  const ten = 10 * 60_000;
  const blue = wallMs >= ten ? 1 : 0;
  const sat = wallMs >= ten && openMs >= ten && openMs >= wallMs * 0.85;
  return {
    white: Math.min(WHITE_POCKET, white),
    blue,
    green: sat ? 1 : 0,
  };
}
