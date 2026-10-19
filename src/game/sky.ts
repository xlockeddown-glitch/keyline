/**
 * 0.1.6 sky: cosmetic sun / moon / weather over the map, matched to each real city. No gameplay effects.
 * Pure helpers (local time, sun times, day phase, moon phase, weather codes) so the server, client and tests agree.
 */
import type { CityId } from "./types";

export const CITY_TZ: Record<CityId, string> = {
  austin: "America/Chicago", temple: "America/Chicago", chicago: "America/Chicago", nola: "America/Chicago", nashville: "America/Chicago",
  nyc: "America/New_York", boston: "America/New_York", detroit: "America/Detroit", toronto: "America/Toronto",
  sf: "America/Los_Angeles", la: "America/Los_Angeles", seattle: "America/Los_Angeles",
  denver: "America/Denver", tucson: "America/Phoenix", london: "Europe/London",
};

export type Weather = "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm";
export const WEATHERS: Weather[] = ["clear", "cloudy", "rain", "snow", "fog", "storm"];
export type Phase = "dawn" | "day" | "dusk" | "night";

/** Open-Meteo / WMO weather code → one of our six looks. Unknown codes are clear. */
export function weatherOfCode(code: number | null | undefined): Weather {
  if (code == null || !Number.isFinite(code)) return "clear";
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code === 2 || code === 3) return "cloudy";
  return "clear";
}

/** Minutes past local midnight in a time zone. */
export function localMinutes(tz: string, now: number): number {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date(now));
  const h = Number(p.find((x) => x.type === "hour")?.value ?? 0), m = Number(p.find((x) => x.type === "minute")?.value ?? 0);
  return (h % 24) * 60 + m;
}

/** "3:40 PM" in the city's own time. */
export function localClock(tz: string, now: number): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(now));
}

/** Offset of a time zone from UTC in minutes at `now` (e.g. −300 for CDT). */
export function tzOffsetMin(tz: string, now: number): number {
  const utc = Math.floor(now / 60_000) % 1440;
  let d = localMinutes(tz, now) - ((utc + 1440) % 1440);
  if (d > 720) d -= 1440;
  if (d < -720) d += 1440;
  return d;
}

/** Sunrise and sunset in local minutes (NOAA approximation, ±a few minutes). */
export function sunTimes(lat: number, lng: number, tz: string, now: number): { rise: number; set: number } {
  const day = Math.floor(now / 86_400_000);
  const start = Date.UTC(new Date(now).getUTCFullYear(), 0, 0);
  const doy = day - Math.floor(start / 86_400_000);
  const g = ((2 * Math.PI) / 365) * (doy - 1);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const rad = (lat * Math.PI) / 180;
  const cosH = (Math.cos((90.833 * Math.PI) / 180) - Math.sin(rad) * Math.sin(decl)) / (Math.cos(rad) * Math.cos(decl));
  const ha = (Math.acos(Math.max(-1, Math.min(1, cosH))) * 180) / Math.PI;
  const off = tzOffsetMin(tz, now);
  const noon = 720 - 4 * lng - eqt + off;
  return { rise: Math.round(noon - 4 * ha), set: Math.round(noon + 4 * ha) };
}

/** Dawn and dusk are the 40 minutes either side of sunrise and sunset. */
export function dayPhase(min: number, sun: { rise: number; set: number }): Phase {
  if (min >= sun.rise - 40 && min < sun.rise + 40) return "dawn";
  if (min >= sun.rise + 40 && min < sun.set - 40) return "day";
  if (min >= sun.set - 40 && min < sun.set + 40) return "dusk";
  return "night";
}

/** 0 = new, 0.5 = full, from a known new moon (2000-01-06 18:14 UTC). */
export function moonPhase(now: number): number {
  const SYN = 29.530588853 * 86_400_000;
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  return ((((now - ref) % SYN) + SYN) % SYN) / SYN;
}

export function moonName(p: number): string {
  const n = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
  return n[Math.round(p * 8) % 8]!;
}

/** Where the sun or moon sits across the sky, 0 (east horizon) → 1 (west horizon). */
export function arcAt(min: number, sun: { rise: number; set: number }, isDay: boolean): number {
  if (isDay) return Math.max(0, Math.min(1, (min - sun.rise) / (sun.set - sun.rise)));
  const night = 1440 - (sun.set - sun.rise);
  const since = (min - sun.set + 1440) % 1440;
  return Math.max(0, Math.min(1, since / night));
}

export const WEATHER_LABEL: Record<Weather, string> = { clear: "Clear", cloudy: "Cloudy", rain: "Rain", snow: "Snow", fog: "Fog", storm: "Storm" };
export const WEATHER_ICON: Record<Weather, string> = { clear: "☀", cloudy: "☁", rain: "🌧", snow: "❄", fog: "🌫", storm: "⛈" };

export const WEATHER_TTL_MS = 15 * 60_000;
export type CityWeather = { weather: Weather; tempF: number | null; at: number; source: "open-meteo" | "fallback" };
