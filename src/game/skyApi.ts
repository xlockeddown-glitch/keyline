import { createServerFn } from "@tanstack/react-start";
import { CITIES } from "./data.ts";
import { WEATHER_TTL_MS, weatherOfCode, type CityWeather } from "./sky.ts";
import type { CityId } from "./types";

/**
 * 0.1.6: a city's current weather from Open-Meteo (free, no key), cached on the server for 15 min per city so
 * every player in a city shares one lookup. Any failure (network, timeout, odd reply) shows clear skies.
 */
const cache = new Map<CityId, CityWeather>();
const inflight = new Map<CityId, Promise<CityWeather>>();

export async function cityWeather(id: CityId, now = Date.now(), fetcher: typeof fetch = fetch): Promise<CityWeather> {
  const hit = cache.get(id);
  if (hit && now - hit.at < WEATHER_TTL_MS) return hit;
  const run = inflight.get(id);
  if (run) return run;
  const city = CITIES[id];
  const p = (async (): Promise<CityWeather> => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.spawn.lat.toFixed(3)}&longitude=${city.spawn.lng.toFixed(3)}&current=weather_code,temperature_2m&temperature_unit=fahrenheit`;
      const res = await fetcher(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { current?: { weather_code?: number; temperature_2m?: number } };
      const code = j.current?.weather_code;
      if (typeof code !== "number") throw new Error("no code");
      const t = j.current?.temperature_2m;
      return { weather: weatherOfCode(code), tempF: typeof t === "number" ? Math.round(t) : null, at: now, source: "open-meteo" };
    } catch {
      // Keep the last good reading if we have one; otherwise clear. Retry after a shorter wait.
      return hit ? { ...hit, at: now - WEATHER_TTL_MS + 3 * 60_000 } : { weather: "clear", tempF: null, at: now - WEATHER_TTL_MS + 3 * 60_000, source: "fallback" };
    }
  })();
  inflight.set(id, p);
  try {
    const w = await p;
    cache.set(id, w);
    return w;
  } finally {
    inflight.delete(id);
  }
}

export function resetWeatherCache() {
  cache.clear();
}

export const getCityWeather = createServerFn({ method: "GET" })
  .validator((u: unknown) => {
    const id = String((u as { cityId?: unknown })?.cityId ?? "");
    if (!(id in CITIES)) throw new Error("bad city");
    return { cityId: id as CityId };
  })
  .handler(async ({ data }) => cityWeather(data.cityId));
