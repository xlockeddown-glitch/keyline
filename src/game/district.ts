/**
 * 0.1.14: "New district" bonus. The city is cut into 800 m squares around its spawn. The first right lamp in a
 * square you have not lit today (city-local day) pays +25% of that lamp's base coin, for up to 6 squares a day
 * per city. Not on a night-market lamp (the market already pays double, and this must never reward camping
 * there). The server decides it from its own grade rows; the client only shows the label.
 *
 * 0.1.187: "Fading block" (CARD-189), a soft anti-camp rule and not a new faucet. After the 3rd right vault in one
 * 800 m square on one city-local day, the 4th and every later right vault in that square pays floor(0.50 x coin).
 *  - What counts: this account's own grade rows in this city on this city day (the same cityDay clock and the same
 *    30 h ledger window as the district bonus above) that are rights (not `"g":"miss"`) and carry this square as
 *    `"d":"x:y"`. A grade row carries "d" only for a right answer on a card that spent a key, so a street-lamp
 *    right counts, a Stray lamp right included, and so does a put-in-order near-miss (it lights the vault).
 *  - What is excluded, from the count and from the fade: night-market lamps (`"mk":1`), Comet clears (`"ev":1`) and
 *    Hearth vaults (`"hh":1`, written from 0.1.187, or a `placed-` vault id, which covers older rows).
 *  - What never reaches the count: a wrong answer, a timeout (`"g":"miss"`), a walked-away card (no grade row), a
 *    spark (no key spent, so no "d"). Ward Circuit lights, Holiday Lights stamps, Sunday Drive pays and Meet you
 *    there transfers are not grade rows at all.
 *  - What is faded: the grade's coin (base, favorites, card of the day, district bonus, boosts, key-overflow coin)
 *    plus the Stray lamp extra, as one total: floor(0.50 x (grade coin + stray extra)). Keys, the perfect-answer
 *    key-back, the streak prize and car perks are unchanged.
 *  - Ledger-only: nothing is stored but the grade rows themselves (a faded row is flagged `"fb":1`). No table, no
 *    counter, nothing from the client. Another square pays full again, and so does the next city day.
 */
import { CITIES } from "./data.ts";
import type { CityId } from "./types.ts";

export const DISTRICT_M = 800;
export const FRESH_DISTRICT_BONUS = 0.25;
export const FRESH_DISTRICT_DAY_CAP = 6;
export const FRESH_DISTRICT_TAG = "New district";

const M_PER_DEG_LAT = 111_320;

/** Square id like "2:-1" (north, east) from the city spawn. "" when the point is unusable. */
export function districtOf(city: CityId, lat: number, lng: number): string {
  const c = CITIES[city];
  if (!c || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return "";
  const n = (lat - c.spawn.lat) * M_PER_DEG_LAT;
  const e = (lng - c.spawn.lng) * M_PER_DEG_LAT * Math.cos((c.spawn.lat * Math.PI) / 180);
  return `${Math.floor(n / DISTRICT_M + 0.5)}:${Math.floor(e / DISTRICT_M + 0.5)}`;
}

/** Fresh = a real square, not lit yet today, and today's fresh count still under the cap. */
export function isFreshDistrict(d: string, litToday: Iterable<string>): boolean {
  if (!d) return false;
  const seen = new Set(litToday);
  return !seen.has(d) && seen.size < FRESH_DISTRICT_DAY_CAP;
}

export function freshDistrictCoin(lampCoin: number): number {
  return Math.max(1, Math.round(lampCoin * FRESH_DISTRICT_BONUS));
}

/** District ids of today's right lamps, read from grade ledger details (`"d":"x:y"`, written from 0.1.14). */
export function districtsInDetails(details: string[]): string[] {
  const out: string[] = [];
  for (const raw of details) {
    if (raw.includes('"g":"miss"')) continue;
    const m = /"d":"(-?\d+:-?\d+)"/.exec(raw);
    if (m) out.push(m[1]!);
  }
  return out;
}

export const FADE_AFTER = 3;
export const FADE_RATE = 0.5;
export const FADE_TAG = "Fading block: half coin";
/** The Field Guide's one line. */
export const FADE_GUIDE = `Fading block: signed in, after your ${FADE_AFTER}rd right vault in one ${DISTRICT_M} m square on a city day, the 4th and every later one there pays half coin (keys, your streak and the perfect-answer key-back are unchanged). Night-market, Comet and Hearth vaults do not count and are never faded. A drive to another square pays full again, and so does the next city day.`;

/** Faded coin: floor(0.50 x coin), never below 0. */
export function fadeCoin(coin: number): number {
  return Number.isFinite(coin) && coin > 0 ? Math.floor(FADE_RATE * coin) : 0;
}

/** Counted rights in `district` among grade-row details: a right with this "d", not market, Comet or Hearth. */
export function rightsInSquare(details: string[], district: string): number {
  if (!district) return 0;
  let n = 0;
  for (const raw of details) {
    if (raw.includes('"g":"miss"')) continue;
    if (raw.includes('"mk":1') || raw.includes('"ev":1') || raw.includes('"hh":1') || raw.includes('"pi":"placed-')) continue;
    if (/"d":"(-?\d+:-?\d+)"/.exec(raw)?.[1] === district) n++;
  }
  return n;
}

/** The fade is due once this many counted rights are already on the ledger for the square today. */
export function fadeDue(count: number): boolean {
  return count >= FADE_AFTER;
}
