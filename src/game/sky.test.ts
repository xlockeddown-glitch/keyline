import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_TZ, arcAt, dayPhase, localClock, localMinutes, moonName, moonPhase, sunTimes, weatherOfCode } from "./sky.ts";

test("weather codes map to six looks; unknown is clear", () => {
  assert.equal(weatherOfCode(0), "clear");
  assert.equal(weatherOfCode(3), "cloudy");
  assert.equal(weatherOfCode(45), "fog");
  assert.equal(weatherOfCode(61), "rain");
  assert.equal(weatherOfCode(81), "rain");
  assert.equal(weatherOfCode(73), "snow");
  assert.equal(weatherOfCode(95), "storm");
  assert.equal(weatherOfCode(null), "clear");
  assert.equal(weatherOfCode(NaN), "clear");
});

test("every city has a real time zone", () => {
  for (const [id, tz] of Object.entries(CITY_TZ)) assert.doesNotThrow(() => localClock(tz, Date.now()), id);
});

test("local time follows the city: 18:00 UTC is 1 PM in Austin (CDT) and 7 PM in London (BST)", () => {
  const t = Date.UTC(2026, 9, 19, 18, 0);
  assert.equal(localMinutes(CITY_TZ.austin, t), 13 * 60);
  assert.equal(localMinutes(CITY_TZ.london, t), 19 * 60);
});

test("Austin in October: sunrise near 7:30 AM, sunset near 6:50 PM; phases line up", () => {
  const t = Date.UTC(2026, 9, 19, 18, 0);
  const s = sunTimes(30.27, -97.74, CITY_TZ.austin, t);
  assert.ok(Math.abs(s.rise - (7 * 60 + 33)) < 15, String(s.rise));
  assert.ok(Math.abs(s.set - (18 * 60 + 52)) < 15, String(s.set));
  assert.equal(dayPhase(13 * 60, s), "day");
  assert.equal(dayPhase(s.set, s), "dusk");
  assert.equal(dayPhase(23 * 60, s), "night");
  assert.equal(dayPhase(s.rise, s), "dawn");
  assert.ok(arcAt(13 * 60, s, true) > 0.4 && arcAt(13 * 60, s, true) < 0.6);
});

test("moon phase: known full moon 2026-10-26 and new moon 2026-10-10 (±1 day)", () => {
  const full = moonPhase(Date.UTC(2026, 9, 26, 4, 0));
  assert.ok(Math.abs(full - 0.5) < 0.04, String(full));
  const nw = moonPhase(Date.UTC(2026, 9, 10, 16, 0));
  assert.ok(nw < 0.04 || nw > 0.96, String(nw));
  assert.equal(moonName(0.5), "Full moon");
});

test("weather: one fetch per city per 15 min; failures fall back to clear and retry sooner", async () => {
  const { cityWeather, resetWeatherCache } = await import("./skyApi.ts");
  resetWeatherCache();
  let calls = 0;
  const ok = (async () => { calls++; return new Response(JSON.stringify({ current: { weather_code: 63, temperature_2m: 51.4 } })); }) as typeof fetch;
  const t0 = Date.UTC(2026, 9, 19, 18);
  const a = await cityWeather("chicago", t0, ok);
  assert.deepEqual([a.weather, a.tempF, a.source], ["rain", 51, "open-meteo"]);
  await cityWeather("chicago", t0 + 14 * 60_000, ok);
  assert.equal(calls, 1);
  await cityWeather("chicago", t0 + 16 * 60_000, ok);
  assert.equal(calls, 2);
  const bad = (async () => { throw new Error("offline"); }) as typeof fetch;
  const f = await cityWeather("austin", t0, bad);
  assert.deepEqual([f.weather, f.source], ["clear", "fallback"]);
  const kept = await cityWeather("chicago", t0 + 40 * 60_000, bad);
  assert.equal(kept.weather, "rain", "a failed refresh keeps the last good reading");
});
