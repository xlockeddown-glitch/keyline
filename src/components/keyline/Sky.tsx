import { useEffect, useState, useSyncExternalStore } from "react";
import { Cloud, CloudOff } from "lucide-react";
import { CITIES } from "@/game/data";
import { CITY_TZ, WEATHER_ICON, WEATHER_LABEL, arcAt, dayPhase, localClock, localMinutes, moonName, moonPhase, sunTimes, type CityWeather, type Phase, type Weather } from "@/game/sky";
import { getCityWeather } from "@/game/skyApi";
import { useGame } from "@/game/store";
import type { CityId } from "@/game/types";

/**
 * 0.1.6: purely cosmetic sky over the map: the city's real local time tints day / dusk / night / dawn, the sun or the
 * moon (today's phase) rides an arc, and the real weather draws rain, snow, fog, cloud or storm. Never takes taps
 * (pointer-events: none), stills with reduced motion, and the cloud button in the top bar turns it off.
 */
const KEY = "keyline-sky-v1";
const subs = new Set<() => void>();
let on = typeof localStorage === "undefined" ? true : localStorage.getItem(KEY) !== "off";
/** QA / screenshots: force a weather look or a clock (ms) without touching the real feed. */
let force: { weather?: Weather; now?: number } = {};
const emit = () => subs.forEach((f) => f());
export const skyOn = () => on;
export function toggleSky() {
  on = !on;
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode */ }
  emit();
}
export function forceSky(f: { weather?: Weather; now?: number }) {
  force = f;
  emit();
}
const subscribe = (f: () => void) => (subs.add(f), () => subs.delete(f));
const useSkyStore = () => useSyncExternalStore(subscribe, () => `${on}|${force.weather ?? ""}|${force.now ?? ""}`, () => "true||");

const weatherCache = new Map<CityId, CityWeather>();
const pulls = new Map<CityId, { at: number; p: Promise<CityWeather> }>();
/** One request per city per minute however many sky pieces are on screen (the server caches for 15 min). */
function pullWeather(cityId: CityId): Promise<CityWeather> {
  const hit = pulls.get(cityId);
  if (hit && Date.now() - hit.at < 60_000) return hit.p;
  const p = getCityWeather({ data: { cityId } }).then((r) => { weatherCache.set(cityId, r); return r; });
  pulls.set(cityId, { at: Date.now(), p });
  return p;
}

export type SkyView = { phase: Phase; weather: Weather; tempF: number | null; clock: string; isDay: boolean; arc: number; moon: number; on: boolean };

export function useSky(): SkyView {
  useSkyStore();
  const cityId = useGame((s) => s.cityId);
  const [tick, setTick] = useState(0);
  const [w, setW] = useState<CityWeather | null>(weatherCache.get(cityId) ?? null);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    let live = true;
    const pull = () =>
      pullWeather(cityId)
        .then((r) => { if (live) setW(r); })
        .catch(() => { /* clear sky */ });
    setW(weatherCache.get(cityId) ?? null);
    void pull();
    const t = window.setInterval(pull, 15 * 60_000);
    return () => { live = false; window.clearInterval(t); };
  }, [cityId]);
  void tick;
  const now = force.now ?? Date.now();
  const tz = CITY_TZ[cityId];
  const c = CITIES[cityId].spawn;
  const sun = sunTimes(c.lat, c.lng, tz, now);
  const min = localMinutes(tz, now);
  const phase = dayPhase(min, sun);
  const isDay = min >= sun.rise && min < sun.set;
  return { phase, weather: force.weather ?? w?.weather ?? "clear", tempF: force.weather ? null : (w?.tempF ?? null), clock: localClock(tz, now), isDay, arc: arcAt(min, sun, isDay), moon: moonPhase(now), on };
}

/** The lit part of the moon as an SVG path (r = 1, centred). */
function moonPath(p: number): { d: string; flip: boolean } {
  const k = Math.cos(2 * Math.PI * p);
  const rx = Math.abs(k).toFixed(3);
  return { d: `M0,-1 A1,1 0 0 1 0,1 A${rx},1 0 0 ${k > 0 ? 0 : 1} 0,-1 Z`, flip: p > 0.5 };
}

export function SkyLayer() {
  const v = useSky();
  if (!v.on) return null;
  return (
    <div className={`sky-layer is-${v.phase} is-${v.weather}`} data-testid="sky" data-phase={v.phase} data-weather={v.weather} aria-hidden>
      <div className="sky-tint" />
      {v.weather === "cloudy" || v.weather === "storm" || v.weather === "rain" ? <div className="sky-clouds" /> : null}
      {v.weather === "rain" || v.weather === "storm" ? <div className="sky-rain" /> : null}
      {v.weather === "snow" ? <div className="sky-snow" /> : null}
      {v.weather === "fog" ? <div className="sky-fog" /> : null}
      {v.weather === "storm" ? <div className="sky-flash" /> : null}
    </div>
  );
}

/** 0.1.6: the sun or today's moon as a small, soft glyph in the HUD line, so it never sits on map content. */
function SkyGlyph({ v }: { v: SkyView }) {
  if (v.weather !== "clear") return <span aria-hidden>{WEATHER_ICON[v.weather]}</span>;
  if (v.isDay) return <span className="sky-glyph sky-sun" aria-hidden data-testid="sky-sun" />;
  const m = moonPath(v.moon);
  return (
    <svg className="sky-glyph sky-moon" viewBox="-1.1 -1.1 2.2 2.2" aria-hidden data-testid="sky-moon" data-moon={moonName(v.moon)}>
      <circle r="1" className="sky-moon-dark" />
      <path d={m.d} className="sky-moon-lit" transform={m.flip ? "scale(-1,1)" : undefined} />
    </svg>
  );
}

/** HUD line: the city's weather and its own local time. */
export function SkyChip() {
  const v = useSky();
  return (
    <button
      type="button"
      className="sky-chip pointer-events-auto mt-1 block max-w-full truncate text-left text-xs text-fg-muted"
      data-testid="sky-chip"
      onClick={toggleSky}
      title={v.on ? "Tap to turn off sky and weather" : "Tap to turn on sky and weather"}
    >
      <SkyGlyph v={v} /> {WEATHER_LABEL[v.weather]}
      {v.tempF != null ? ` · ${v.tempF}°F` : ""} · {v.clock} here
    </button>
  );
}

export function SkyToggle() {
  const v = useSky();
  return (
    <button
      type="button"
      className="hud-plate is-kit pointer-events-auto size-11 justify-center p-0 max-[379px]:hidden"
      data-testid="sky-toggle"
      onClick={toggleSky}
      aria-label={v.on ? "Turn off sky and weather" : "Turn on sky and weather"}
      title={v.on ? "Sky and weather on" : "Sky and weather off"}
    >
      {v.on ? <Cloud className="size-4" strokeWidth={1.75} /> : <CloudOff className="size-4 text-fg-muted" strokeWidth={1.75} />}
    </button>
  );
}
