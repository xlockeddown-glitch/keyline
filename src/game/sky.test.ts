import { test } from "node:test";
import assert from "node:assert/strict";
import { CITY_TZ, VEIL, arcAt, dayPhase, localClock, localMinutes, moonName, moonPhase, phaseOverride, sunTimes, weatherOfCode } from "./sky.ts";

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

// 0.1.80: known sun times (NOAA / timeanddate, rounded to the minute); the approximation must land within 8 minutes.
const near = (got: number, h: number, m: number, what: string) => assert.ok(Math.abs(got - (h * 60 + m)) <= 8, `${what}: ${got} vs ${h}:${m}`);
test("sunrise / sunset: Chicago solstices, London midsummer, Tucson midwinter (no DST)", () => {
  const chiJun = sunTimes(41.88, -87.63, CITY_TZ.chicago, Date.UTC(2026, 5, 21, 17));
  near(chiJun.rise, 5, 15, "Chicago Jun 21 rise"); near(chiJun.set, 20, 29, "Chicago Jun 21 set");
  const chiDec = sunTimes(41.88, -87.63, CITY_TZ.chicago, Date.UTC(2026, 11, 21, 18));
  near(chiDec.rise, 7, 15, "Chicago Dec 21 rise"); near(chiDec.set, 16, 22, "Chicago Dec 21 set");
  const lonJun = sunTimes(51.51, -0.13, CITY_TZ.london, Date.UTC(2026, 5, 21, 12));
  near(lonJun.rise, 4, 43, "London Jun 21 rise"); near(lonJun.set, 21, 21, "London Jun 21 set");
  const tusDec = sunTimes(32.22, -110.97, CITY_TZ.tucson, Date.UTC(2026, 11, 21, 19));
  near(tusDec.rise, 7, 19, "Tucson Dec 21 rise"); near(tusDec.set, 17, 24, "Tucson Dec 21 set");
});

test("phase boundaries: dawn and dusk are 40 min either side, edges belong to the later phase", () => {
  const s = { rise: 400, set: 1100 };
  assert.equal(dayPhase(359, s), "night");
  assert.equal(dayPhase(360, s), "dawn");
  assert.equal(dayPhase(439, s), "dawn");
  assert.equal(dayPhase(440, s), "day");
  assert.equal(dayPhase(1059, s), "day");
  assert.equal(dayPhase(1060, s), "dusk");
  assert.equal(dayPhase(1139, s), "dusk");
  assert.equal(dayPhase(1140, s), "night");
  assert.equal(dayPhase(0, s), "night");
});

test("every city gets all four phases across one real day", async () => {
  const { CITIES } = await import("./data.ts");
  for (const [id, tz] of Object.entries(CITY_TZ)) {
    const c = CITIES[id as keyof typeof CITIES].spawn;
    const s = sunTimes(c.lat, c.lng, tz, Date.UTC(2026, 9, 30, 18));
    assert.ok(s.rise > 240 && s.rise < 540 && s.set > 960 && s.set < 1200, `${id} ${s.rise}-${s.set}`);
    const seen = new Set<string>();
    for (let m = 0; m < 1440; m += 10) seen.add(dayPhase(m, s));
    assert.equal(seen.size, 4, id);
  }
});

test("veil darkness rises day < dawn < dusk < night; ?sky= override parses", () => {
  assert.ok(VEIL.day === 0 && VEIL.dawn < VEIL.dusk && VEIL.dusk < VEIL.night);
  assert.equal(phaseOverride("?sky=noon"), "day");
  assert.equal(phaseOverride("?sky=dusk"), "dusk");
  assert.equal(phaseOverride("?x=1&sky=midnight"), "night");
  assert.equal(phaseOverride("?sky=lunch"), null);
  assert.equal(phaseOverride(""), null);
});
