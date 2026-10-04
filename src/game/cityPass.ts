import { CITIES, CITY_LIST } from "./data.ts";
import { SURVEY_GOALS, surveyHave } from "./survey.ts";
import type { CityId, Tier } from "./types.ts";

/**
 * 0.0.55 city unlocks. Lives in the client save (like coins and matches); the server never checks it, so friend
 * tickets and dealt cards keep working for any city.
 *
 *  - A new player picks a starting city out of all 15. The second city is free, picked any time at the train
 *    station (Timetable). City 3 onward costs one city pass each.
 *  - A pass comes from any ONE of three routes, each counted on its own, earned in an unlocked city:
 *    (a) lamp points: a lamp lit (trivia right) at amber pays 1, red 4, violet 10; every 10 points is a pass and the
 *        remainder carries over (a violet is a whole pass; red+red+red = 12 → a pass with 2 carried);
 *    (b) a city's goals: visiting every place in that city (the "All of <city>" goal, the HUD's GOALS x/N places)
 *        pays one pass, once per city;
 *    (c) Lantern Runs: 3 Daily Lantern Run finishes in a city pay one pass, once per city (later runs there don't
 *        count again; each city has its own count).
 *  - Passes bank (no cap) and are spent one per city at the train station.
 *  - Saves from before 0.0.55 keep every city they've been in or have progress in (current city, places visited,
 *    Lantern Runs, circuit progress, a ride under way) plus one free pass. If they hold only one city the free
 *    second pick is still open. Goals and Lantern Runs already finished before the update are marked counted (the
 *    free pass stands in for them) so an old save doesn't land a pile of passes at once; lamp points start at 0.
 */
export const PASS_POINTS = 10;
export const TIER_PASS_POINTS: Record<Tier, number> = { white: 0, blue: 0, green: 0, amber: 1, red: 4, violet: 10 };
export const RUNS_PER_PASS = 3;

export type CityUnlocks = {
  /** Starting city; null until a new player picks one. */
  start: CityId | null;
  unlocked: CityId[];
  /** The free second city is still to be picked. */
  freePick: boolean;
  /** Unspent city passes. */
  passes: number;
  /** Lamp points toward the next pass (0..9 after paying out). */
  lampPts: number;
  /** Cities whose goals (every place visited) already paid a pass. */
  goalsPaid: CityId[];
  /** Lantern Run finishes per city (counted when the finish is paid, once per city per UTC day). */
  runs: Partial<Record<CityId, number>>;
  /** Cities whose 3 Lantern Runs already paid a pass. */
  runsPaid: CityId[];
};

export type PassRoute = "lamps" | "goals" | "runs";

const isCity = (x: unknown): x is CityId => typeof x === "string" && x in CITIES;
const cityList = (x: unknown): CityId[] => (Array.isArray(x) ? [...new Set(x.filter(isCity))] : []);
const count = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0);

export function freshUnlocks(): CityUnlocks {
  return { start: null, unlocked: [], freePick: true, passes: 0, lampPts: 0, goalsPaid: [], runs: {}, runsPaid: [] };
}

/** Validate whatever came out of localStorage. */
export function cleanUnlocks(raw: unknown): CityUnlocks {
  if (!raw || typeof raw !== "object") return freshUnlocks();
  const r = raw as Record<string, unknown>;
  const unlocked = cityList(r.unlocked);
  const start = isCity(r.start) ? r.start : (unlocked[0] ?? null);
  if (start && !unlocked.includes(start)) unlocked.unshift(start);
  const runs: Partial<Record<CityId, number>> = {};
  if (r.runs && typeof r.runs === "object") for (const [k, v] of Object.entries(r.runs)) if (isCity(k) && count(v)) runs[k] = count(v);
  return {
    start,
    unlocked,
    freePick: unlocked.length < 2 ? true : r.freePick === true,
    passes: count(r.passes),
    lampPts: Math.min(PASS_POINTS - 1, count(r.lampPts)),
    goalsPaid: cityList(r.goalsPaid),
    runs,
    runsPaid: cityList(r.runsPaid),
  };
}

export function isUnlocked(u: CityUnlocks, id: CityId): boolean {
  return u.unlocked.includes(id);
}

/** A new player picks where they start. Ignored once a start is set. */
export function chooseStart(u: CityUnlocks, id: CityId): CityUnlocks {
  if (u.start || !isCity(id)) return u;
  return { ...u, start: id, unlocked: [id, ...u.unlocked.filter((c) => c !== id)] };
}

export type UnlockCost = "open" | "start" | "free" | "pass" | "locked";

/** What unlocking this city would take right now. */
export function unlockCost(u: CityUnlocks, id: CityId): UnlockCost {
  if (!u.start) return "start";
  if (isUnlocked(u, id)) return "open";
  if (u.freePick) return "free";
  return u.passes > 0 ? "pass" : "locked";
}

/** Unlock a city with the free pick, else one pass. Null when it can't (already open, or no pass). */
export function unlockCity(u: CityUnlocks, id: CityId): { u: CityUnlocks; paid: "free" | "pass" } | null {
  const cost = unlockCost(u, id);
  if (cost === "free") return { u: { ...u, unlocked: [...u.unlocked, id], freePick: false }, paid: "free" };
  if (cost === "pass") return { u: { ...u, unlocked: [...u.unlocked, id], passes: u.passes - 1 }, paid: "pass" };
  return null;
}

/** Route (a): a lamp was lit (answered right) at this tier. */
export function lampLit(u: CityUnlocks, tier: Tier): { u: CityUnlocks; earned: number } {
  const add = TIER_PASS_POINTS[tier] ?? 0;
  if (!add) return { u, earned: 0 };
  const total = u.lampPts + add;
  const earned = Math.floor(total / PASS_POINTS);
  return { u: { ...u, lampPts: total % PASS_POINTS, passes: u.passes + earned }, earned };
}

const wardAll = (id: CityId) => SURVEY_GOALS.find((g) => g.id === `ward-${id}-all`)!;

export function goalsHave(id: CityId, atlas: Record<string, true>): { have: number; need: number } {
  const g = wardAll(id);
  return { have: Math.min(g.need, surveyHave(g, atlas, 0)), need: g.need };
}

/** Route (b): every place in an unlocked city visited pays a pass, once per city. */
export function goalsCheck(u: CityUnlocks, id: CityId, atlas: Record<string, true>): { u: CityUnlocks; earned: number } {
  if (!isUnlocked(u, id) || u.goalsPaid.includes(id)) return { u, earned: 0 };
  const { have, need } = goalsHave(id, atlas);
  if (have < need) return { u, earned: 0 };
  return { u: { ...u, goalsPaid: [...u.goalsPaid, id], passes: u.passes + 1 }, earned: 1 };
}

/** Route (c): a paid Lantern Run finish in a city. The 3rd one there pays a pass, once per city. */
export function runFinished(u: CityUnlocks, id: CityId): { u: CityUnlocks; earned: number } {
  if (!isCity(id)) return { u, earned: 0 };
  const n = (u.runs[id] ?? 0) + 1;
  const next = { ...u, runs: { ...u.runs, [id]: n } };
  if (!isUnlocked(u, id) || u.runsPaid.includes(id) || n < RUNS_PER_PASS) return { u: next, earned: 0 };
  return { u: { ...next, runsPaid: [...next.runsPaid, id], passes: next.passes + 1 }, earned: 1 };
}

export type PassProgress = {
  passes: number;
  lamps: { have: number; need: number };
  goals: { have: number; need: number; paid: boolean };
  runs: { have: number; need: number; paid: boolean };
};

/** Progress toward the next pass from each route, for the city the player is in. */
export function passProgress(u: CityUnlocks, id: CityId, atlas: Record<string, true>): PassProgress {
  const g = goalsHave(id, atlas);
  return {
    passes: u.passes,
    lamps: { have: u.lampPts, need: PASS_POINTS },
    goals: { ...g, paid: u.goalsPaid.includes(id) },
    runs: { have: Math.min(RUNS_PER_PASS, u.runs[id] ?? 0), need: RUNS_PER_PASS, paid: u.runsPaid.includes(id) },
  };
}

/** One line for a locked city: what it takes. */
export function lockLine(u: CityUnlocks, id: CityId): string {
  const cost = unlockCost(u, id);
  if (cost === "open" || cost === "start") return "";
  if (cost === "free") return "Locked · your second city is free. Pick it at the train station.";
  if (cost === "pass") return `Locked · 1 city pass (you have ${u.passes}). Unlock at the train station.`;
  return `Locked · needs a city pass: ${PASS_POINTS} lamp points (amber 1, red 4, violet 10), every place in a city, or ${RUNS_PER_PASS} Lantern Runs in one city.`;
}

type OldSave = {
  cityId?: unknown;
  atlas?: unknown;
  dailyPaid?: unknown;
  quests?: { circuit?: unknown } | null;
  journey?: { to?: unknown; from?: unknown } | null;
};

const POI_CITY: Record<string, CityId> = {};
for (const c of CITY_LIST) for (const p of c.pois) POI_CITY[p.id] = c.id;

/** Saves from before 0.0.55: every city with play in it stays open, plus one free pass. */
export function migrateUnlocks(save: OldSave): CityUnlocks {
  const seen: CityId[] = [];
  const add = (x: unknown) => {
    if (isCity(x) && !seen.includes(x)) seen.push(x);
  };
  add(save.cityId);
  if (save.atlas && typeof save.atlas === "object") for (const id of Object.keys(save.atlas)) add(POI_CITY[id]);
  const runs: Partial<Record<CityId, number>> = {};
  if (Array.isArray(save.dailyPaid))
    for (const k of save.dailyPaid) {
      const city = typeof k === "string" ? k.split("|")[1] : undefined;
      if (isCity(city)) {
        add(city);
        runs[city] = (runs[city] ?? 0) + 1;
      }
    }
  const circuit = save.quests?.circuit;
  if (circuit && typeof circuit === "object") for (const [id, v] of Object.entries(circuit)) if (v && typeof v === "object" && Object.values(v).some(Boolean)) add(id);
  add(save.journey?.to);
  add(save.journey?.from);
  if (!seen.length) seen.push("austin");
  const atlas = (save.atlas && typeof save.atlas === "object" ? save.atlas : {}) as Record<string, true>;
  const goalsPaid = seen.filter((id) => {
    const g = goalsHave(id, atlas);
    return g.have >= g.need;
  });
  const runsPaid = (Object.keys(runs) as CityId[]).filter((id) => (runs[id] ?? 0) >= RUNS_PER_PASS);
  return { start: seen[0]!, unlocked: seen, freePick: seen.length < 2, passes: 1, lampPts: 0, goalsPaid, runs, runsPaid };
}
