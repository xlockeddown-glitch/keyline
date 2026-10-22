// 0.1.22: daily, weekly and monthly quests (they replace the old milestones and the shared daily goals).
// Each period has a bank; every player gets their own fixed set for that period, picked from
// hash(account, period) among the sets whose total effort and reward sit in a narrow band, so nobody
// draws all-easy or all-hard. No storage: the server and the device run the same pure pick.
// The server (questServer.ts) recounts progress from its own ledger rows and pays each quest once per
// period. Sparks never count: only a right answer on a lamp that spent a match is a "lamp" event here.
import { fnv1a } from "./rarity.ts";
import { TIER_VALUE } from "./rewards.ts";
import type { PeriodKind } from "./questPeriods.ts";
import type { CityId, Tier, TriviaCat } from "./types.ts";

export type QuestEvent =
  | { k: "lamp"; at: number; tier: Tier; city: CityId | null; topic: TriviaCat | null; market: boolean; district?: string | null }
  | { k: "miss"; at: number }
  | { k: "ride"; at: number; game: string }
  | { k: "cache"; at: number }
  | { k: "street"; at: number }
  | { k: "hook"; at: number; day: string };

export type QuestReward = { coins: number; matches: Tier[]; lucky?: boolean };
/** What a player's account can do; a quest that needs something they don't have is never picked. */
export type QuestCtx = { house: boolean };
export type QuestNeeds = "house";
export type Effort = 1 | 2 | 3;

export type QuestDef = {
  id: string;
  kind: PeriodKind;
  title: string;
  sub: string;
  need: number;
  effort: Effort;
  reward: QuestReward;
  needs?: QuestNeeds;
  bonus?: boolean;
};

export type QuestRow = { id: string; have: number; need: number; done: boolean; note?: string };

const RANK: Record<Tier, number> = { white: 0, blue: 1, green: 2, amber: 3, red: 4, violet: 5 };
const LADDER: Tier[] = ["white", "blue", "green", "amber", "red"];
export const SHELF_TOTAL = 60;
export const SHELF_EACH = 10;
export const SHELF_TOPICS = 4;
/** What the all-month bonus pays when the account already owns Lucky for good. */
export const LUCKY_OWNED_COIN = 25_000;
/** Quests per player per period (the bonus row is extra). */
export const SET_SIZE: Record<PeriodKind, number> = { day: 4, week: 5, month: 4 };

const r = (coins: number, ...matches: Tier[]): QuestReward => ({ coins, matches });

export const DAILY_BANK: QuestDef[] = [
  { id: "d-right", kind: "day", title: "Busy lamplighter", sub: "Answer 8 lamps right.", need: 8, effort: 1, reward: r(60, "white") },
  { id: "d-green", kind: "day", title: "Green and up", sub: "Light 3 lamps, green or higher.", need: 3, effort: 1, reward: r(60, "white") },
  { id: "d-blue", kind: "day", title: "Blue hour", sub: "Light 3 blue lamps.", need: 3, effort: 1, reward: r(60, "white") },
  { id: "d-topics", kind: "day", title: "Mixed bag", sub: "Right lamps in 3 different categories.", need: 3, effort: 1, reward: r(60, "white") },
  { id: "d-cache", kind: "day", title: "Cache run", sub: "Open the daily match cache.", need: 1, effort: 1, reward: r(60, "white") },
  { id: "d-house", kind: "day", title: "Home key", sub: "Turn the key at one of your houses.", need: 1, effort: 1, reward: r(60, "white"), needs: "house" },
  { id: "d-ride", kind: "day", title: "Ride along", sub: "Finish a ride game.", need: 1, effort: 2, reward: r(100, "blue") },
  { id: "d-street", kind: "day", title: "Pocket finds", sub: "Pick up 3 street matches.", need: 3, effort: 2, reward: r(100, "blue") },
  { id: "d-roam", kind: "day", title: "Roamer", sub: "Light lamps in 3 different districts.", need: 3, effort: 2, reward: r(100, "blue") },
  { id: "d-streak", kind: "day", title: "Warm streak", sub: "6 right lamps in a row.", need: 6, effort: 2, reward: r(100, "blue") },
  { id: "d-amber", kind: "day", title: "Amber glow", sub: "Light an amber lamp or higher.", need: 1, effort: 3, reward: r(150, "green") },
];

export const WEEKLY_BANK: QuestDef[] = [
  { id: "w-lamps", kind: "week", title: "Lamp lighter", sub: "Light 25 lamps, green or higher.", need: 25, effort: 2, reward: r(2_000, "green") },
  { id: "w-ladder", kind: "week", title: "Colour ladder", sub: "One right lamp in each of white, blue, green, amber and red.", need: 5, effort: 2, reward: r(1_500, "amber") },
  { id: "w-streak", kind: "week", title: "Hot hand", sub: "15 right lamps in a row.", need: 15, effort: 2, reward: r(1_000, "blue", "green") },
  { id: "w-out", kind: "week", title: "Out and about", sub: "Finish 3 different ride games.", need: 3, effort: 1, reward: r(1_200, "blue") },
  { id: "w-cache", kind: "week", title: "Regular", sub: "Open the match cache on 4 days.", need: 4, effort: 1, reward: r(1_000, "green") },
  { id: "w-house", kind: "week", title: "Homebody", sub: "Turn a house key on 3 days.", need: 3, effort: 1, reward: r(1_000, "green"), needs: "house" },
  { id: "w-roam", kind: "week", title: "District walker", sub: "Light lamps in 10 different districts.", need: 10, effort: 2, reward: r(1_500, "amber") },
  { id: "w-street", kind: "week", title: "Gutter gold", sub: "Pick up 12 street matches.", need: 12, effort: 2, reward: r(1_500, "green") },
  { id: "w-amber", kind: "week", title: "High lamps", sub: "Light 5 lamps, amber or higher.", need: 5, effort: 3, reward: r(2_000, "amber") },
];

export const MONTHLY_BANK: QuestDef[] = [
  { id: "m-tour", kind: "month", title: "City tour", sub: "Right lamps in 4 different cities.", need: 4, effort: 3, reward: r(15_000, "red") },
  { id: "m-night", kind: "month", title: "Night shift", sub: "12 right night-market lamps.", need: 12, effort: 3, reward: r(20_000, "amber") },
  {
    id: "m-shelf",
    kind: "month",
    title: "Well read",
    sub: `${SHELF_TOTAL} right lamps across ${SHELF_TOPICS} or more categories, at least ${SHELF_EACH} in each.`,
    need: SHELF_TOTAL,
    effort: 2,
    reward: r(12_000, "red"),
  },
  { id: "m-hop", kind: "month", title: "Market hopper", sub: "Right night-market lamps in 3 different cities.", need: 3, effort: 3, reward: r(16_000, "red") },
  { id: "m-streak", kind: "month", title: "Long run", sub: "25 right lamps in a row.", need: 25, effort: 2, reward: r(12_000, "amber") },
  { id: "m-red", kind: "month", title: "Red letter", sub: "Light 10 lamps, red or higher.", need: 10, effort: 2, reward: r(12_000, "red") },
  { id: "m-days", kind: "month", title: "Steady hand", sub: "Right lamps on 12 different days.", need: 12, effort: 2, reward: r(12_000, "amber") },
];

/** The all-done bonus per period (unchanged rewards: green / red / Lucky next month). */
export const BONUS: Record<PeriodKind, QuestDef> = {
  day: { id: "d-bonus", kind: "day", title: "Full day", sub: "Finish all of today's quests.", need: 4, effort: 1, reward: r(0, "green"), bonus: true },
  week: { id: "w-bonus", kind: "week", title: "Full week", sub: "Finish all of this week's quests.", need: 5, effort: 1, reward: r(0, "red"), bonus: true },
  month: {
    id: "m-bonus",
    kind: "month",
    title: "Full month",
    sub: `Finish all of this month's quests. Lucky is on for all of next month (${LUCKY_OWNED_COIN.toLocaleString("en-US")} coin if you already own Lucky).`,
    need: 4,
    effort: 1,
    reward: { coins: 0, matches: [], lucky: true },
    bonus: true,
  },
};

export const BANK: Record<PeriodKind, QuestDef[]> = { day: DAILY_BANK, week: WEEKLY_BANK, month: MONTHLY_BANK };
export const QUESTS: QuestDef[] = [...DAILY_BANK, BONUS.day, ...WEEKLY_BANK, BONUS.week, ...MONTHLY_BANK, BONUS.month];

export function questDef(id: string): QuestDef | null {
  return QUESTS.find((q) => q.id === id) ?? null;
}

/** Coin plus the matches at their tier value: what a reward is worth, for the fairness band. */
export function rewardValue(rw: QuestReward): number {
  return rw.coins + rw.matches.reduce((a, t) => a + TIER_VALUE[t], 0);
}

/**
 * The fairness band per period: a set's total effort (1 easy … 3 hard per quest) and total reward value
 * must both land inside it. Every set a player can draw is in the band, with or without a house.
 */
export const FAIR: Record<PeriodKind, { effort: [number, number]; value: [number, number] }> = {
  day: { effort: [6, 7], value: [550, 800] },
  week: { effort: [8, 9], value: [7_900, 10_000] },
  month: { effort: [9, 10], value: [57_000, 69_000] },
};

function combos<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  const pick = (start: number, acc: T[]) => {
    if (acc.length === n) return void out.push(acc);
    for (let i = start; i <= xs.length - (n - acc.length); i++) pick(i + 1, [...acc, xs[i]!]);
  };
  pick(0, []);
  return out;
}

export function eligible(def: QuestDef, ctx: QuestCtx): boolean {
  return def.needs !== "house" || ctx.house;
}

/** Every fair set this player could draw this kind of period (bank order inside a set). */
export function fairSets(kind: PeriodKind, ctx: QuestCtx): QuestDef[][] {
  const pool = BANK[kind].filter((d) => eligible(d, ctx));
  const f = FAIR[kind];
  return combos(pool, SET_SIZE[kind]).filter((set) => {
    const e = set.reduce((a, d) => a + d.effort, 0);
    const v = set.reduce((a, d) => a + rewardValue(d.reward), 0);
    return e >= f.effort[0] && e <= f.effort[1] && v >= f.value[0] && v <= f.value[1];
  });
}

/** This player's quests for one period: fixed by (account, period key), the same on the server and the device. */
export function questSet(kind: PeriodKind, accountId: string, periodKey: string, ctx: QuestCtx): QuestDef[] {
  const sets = fairSets(kind, ctx);
  if (!sets.length) return BANK[kind].filter((d) => eligible(d, ctx)).slice(0, SET_SIZE[kind]);
  return sets[fnv1a(`quests|${accountId}|${periodKey}`) % sets.length]!;
}

/** Longest run of right lamps with no miss between them. Sparks are not events, so they neither count nor break it. */
export function longestRun(events: QuestEvent[]): number {
  let run = 0;
  let best = 0;
  for (const e of [...events].sort((a, b) => a.at - b.at)) {
    if (e.k === "lamp") best = Math.max(best, ++run);
    else if (e.k === "miss") run = 0;
  }
  return best;
}

type Lamp = Extract<QuestEvent, { k: "lamp" }>;
const chicagoDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" });
const distinct = (xs: Array<string | null | undefined>) => new Set(xs.filter(Boolean)).size;

/** Progress on one quest from events already filtered to its period's window. */
export function progressOf(def: QuestDef, events: QuestEvent[]): QuestRow {
  const lamps = events.filter((e): e is Lamp => e.k === "lamp");
  const row = (have: number, done = have >= def.need, note?: string): QuestRow => ({ id: def.id, have: Math.min(have, def.need), need: def.need, done, ...(note ? { note } : {}) });
  const atLeast = (t: Tier) => lamps.filter((e) => RANK[e.tier] >= RANK[t]).length;
  switch (def.id) {
    case "d-right":
      return row(lamps.length);
    case "d-green":
    case "w-lamps":
      return row(atLeast("green"));
    case "d-blue":
      return row(lamps.filter((e) => e.tier === "blue").length);
    case "d-topics":
      return row(distinct(lamps.map((e) => e.topic)));
    case "d-cache":
    case "w-cache":
      return row(events.filter((e) => e.k === "cache").length);
    case "d-house":
      return row(events.filter((e) => e.k === "hook").length);
    case "w-house":
      return row(new Set(events.filter((e) => e.k === "hook").map((e) => (e as { day: string }).day)).size);
    case "d-ride":
      return row(events.filter((e) => e.k === "ride").length);
    case "w-out":
      return row(new Set(events.filter((e) => e.k === "ride").map((e) => (e as { game: string }).game)).size);
    case "d-street":
    case "w-street":
      return row(events.filter((e) => e.k === "street").length);
    case "d-roam":
    case "w-roam":
      return row(distinct(lamps.map((e) => e.district)));
    case "d-streak":
    case "w-streak":
    case "m-streak":
      return row(longestRun(events));
    case "d-amber":
    case "w-amber":
      return row(atLeast("amber"));
    case "w-ladder":
      return row(new Set(lamps.map((e) => e.tier).filter((t) => LADDER.includes(t))).size);
    case "m-tour":
      return row(distinct(lamps.map((e) => e.city)));
    case "m-night":
      return row(lamps.filter((e) => e.market).length);
    case "m-hop":
      return row(distinct(lamps.filter((e) => e.market).map((e) => e.city)));
    case "m-red":
      return row(atLeast("red"));
    case "m-days":
      return row(new Set(lamps.map((e) => chicagoDate.format(new Date(e.at)))).size);
    case "m-shelf": {
      const by = new Map<TriviaCat, number>();
      for (const e of lamps) if (e.topic) by.set(e.topic, (by.get(e.topic) ?? 0) + 1);
      const topics = [...by.values()].filter((n) => n >= SHELF_EACH).length;
      return row(lamps.length, lamps.length >= SHELF_TOTAL && topics >= SHELF_TOPICS, `${Math.min(topics, SHELF_TOPICS)}/${SHELF_TOPICS} categories with ${SHELF_EACH}+`);
    }
    default:
      return row(0, false);
  }
}

/** Progress on a player's set, then the all-done bonus row. */
export function questProgress(kind: PeriodKind, set: QuestDef[], events: QuestEvent[]): QuestRow[] {
  const rows = set.map((d) => progressOf(d, events));
  const n = rows.filter((x) => x.done).length;
  rows.push({ id: BONUS[kind].id, have: n, need: rows.length, done: rows.length > 0 && n >= rows.length });
  return rows;
}

/** "2,000 coin + green match" */
export function rewardLine(rw: QuestReward): string {
  const bits: string[] = [];
  if (rw.coins) bits.push(`${rw.coins.toLocaleString("en-US")} coin`);
  const by = new Map<Tier, number>();
  for (const t of rw.matches) by.set(t, (by.get(t) ?? 0) + 1);
  for (const [t, n] of by) bits.push(`${n > 1 ? `${n} ` : ""}${t} match${n > 1 ? "es" : ""}`);
  if (rw.lucky) bits.push("Lucky next month");
  return bits.join(" + ");
}
