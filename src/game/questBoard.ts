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
  | { k: "lamp"; at: number; tier: Tier; city: CityId | null; topic: TriviaCat | null; market: boolean; district?: string | null; perfect?: boolean }
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
  /** The one hard slot in every weekly / monthly set (from 0.1.27's banks on). */
  challenge?: boolean;
  /** Which counter this quest uses when its id differs (a v2 quest with a higher target). */
  calc?: string;
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
  { id: "w-ladder", kind: "week", title: "Color ladder", sub: "One right lamp in each of white, blue, green, amber and red.", need: 5, effort: 2, reward: r(1_500, "amber") },
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

/**
 * 0.1.27 (Ryan: "finished nearly every weekly and monthly quest on day one"): higher targets and a Challenge slot.
 * They start at the next period so nobody's current set reshuffles: weeks from Monday 26 Oct 2026, months from
 * November 2026. New ids (…2) keep old-period claims and new-period claims apart; `calc` reuses the counter.
 */
export const V2_FROM: Record<PeriodKind, string | null> = { day: null, week: "W2026-10-26", month: "M2026-11" };
const v2 = (base: QuestDef[], id: string, over: Partial<QuestDef>): QuestDef => ({ ...base.find((d) => d.id === id)!, id: `${id}2`, calc: id, ...over });

export const WEEKLY_BANK_V2: QuestDef[] = [
  v2(WEEKLY_BANK, "w-lamps", { sub: "Light 50 lamps, green or higher.", need: 50, effort: 3, reward: r(3_000, "green") }),
  v2(WEEKLY_BANK, "w-ladder", { effort: 1 }),
  v2(WEEKLY_BANK, "w-streak", { sub: "25 right lamps in a row.", need: 25, effort: 2, reward: r(1_500, "blue", "green") }),
  v2(WEEKLY_BANK, "w-out", { effort: 1 }),
  v2(WEEKLY_BANK, "w-cache", { sub: "Open the match cache on 6 days.", need: 6, effort: 2, reward: r(1_500, "green") }),
  v2(WEEKLY_BANK, "w-house", { sub: "Turn a house key on 5 days.", need: 5, effort: 2, reward: r(1_500, "green") }),
  v2(WEEKLY_BANK, "w-roam", { sub: "Light lamps in 18 different districts.", need: 18, effort: 3, reward: r(2_000, "amber") }),
  v2(WEEKLY_BANK, "w-street", { sub: "Pick up 25 street matches.", need: 25, effort: 2, reward: r(2_000, "green") }),
  v2(WEEKLY_BANK, "w-amber", { sub: "Light 10 lamps, amber or higher.", need: 10, effort: 3, reward: r(2_500, "amber") }),
];

export const WEEKLY_CHALLENGES: QuestDef[] = [
  { id: "wc-perfect", kind: "week", title: "Sharpshooter", sub: "30 perfect answers (right and fast).", need: 30, effort: 3, reward: r(5_000, "red"), challenge: true },
  { id: "wc-run", kind: "week", title: "Unbroken", sub: "40 right lamps in a row.", need: 40, effort: 3, reward: r(5_000, "red"), challenge: true, calc: "streak" },
  { id: "wc-red", kind: "week", title: "Red week", sub: "Light 6 lamps, red or higher.", need: 6, effort: 3, reward: r(5_000, "red"), challenge: true, calc: "m-red" },
];

export const MONTHLY_BANK_V2: QuestDef[] = [
  v2(MONTHLY_BANK, "m-tour", { effort: 2 }),
  v2(MONTHLY_BANK, "m-night", { sub: "25 right night-market lamps.", need: 25, effort: 3, reward: r(24_000, "amber") }),
  {
    ...v2(MONTHLY_BANK, "m-shelf", {}),
    sub: "120 right lamps across 4 or more categories, at least 20 in each.",
    need: 120,
    effort: 3,
    reward: r(18_000, "red"),
  },
  v2(MONTHLY_BANK, "m-hop", { effort: 2 }),
  v2(MONTHLY_BANK, "m-streak", { sub: "40 right lamps in a row.", need: 40, effort: 3, reward: r(16_000, "amber") }),
  v2(MONTHLY_BANK, "m-red", { sub: "Light 20 lamps, red or higher.", need: 20, effort: 3, reward: r(16_000, "red") }),
  v2(MONTHLY_BANK, "m-days", { sub: "Right lamps on 18 different days.", need: 18, effort: 2, reward: r(14_000, "amber") }),
];
export const SHELF2_EACH = 20;

export const MONTHLY_CHALLENGES: QuestDef[] = [
  { id: "mc-run", kind: "month", title: "Iron streak", sub: "75 right lamps in a row.", need: 75, effort: 3, reward: r(40_000, "red", "red"), challenge: true, calc: "streak" },
  { id: "mc-volume", kind: "month", title: "Lamplighter of the month", sub: "Answer 500 lamps right.", need: 500, effort: 3, reward: r(40_000, "red", "red"), challenge: true, calc: "d-right" },
  { id: "mc-perfect", kind: "month", title: "Dead eye", sub: "150 perfect answers (right and fast).", need: 150, effort: 3, reward: r(40_000, "red", "red"), challenge: true, calc: "wc-perfect" },
];

export const CHALLENGES: Record<PeriodKind, QuestDef[]> = { day: [], week: WEEKLY_CHALLENGES, month: MONTHLY_CHALLENGES };

/** Is this period on the 0.1.27 banks? Period keys sort by date inside a kind. */
export function isV2(kind: PeriodKind, periodKey: string): boolean {
  const from = V2_FROM[kind];
  return from != null && periodKey >= from;
}

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
export const BANK_V2: Record<PeriodKind, QuestDef[]> = { day: DAILY_BANK, week: WEEKLY_BANK_V2, month: MONTHLY_BANK_V2 };
export const QUESTS: QuestDef[] = [...DAILY_BANK, BONUS.day, ...WEEKLY_BANK, ...WEEKLY_BANK_V2, ...WEEKLY_CHALLENGES, BONUS.week, ...MONTHLY_BANK, ...MONTHLY_BANK_V2, ...MONTHLY_CHALLENGES, BONUS.month];

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

/** 0.1.27 bands for the regular slots (the Challenge slot is drawn on its own, and all three pay the same). */
export const FAIR_V2: Record<PeriodKind, { effort: [number, number]; value: [number, number] }> = {
  day: FAIR.day,
  week: { effort: [8, 9], value: [8_000, 10_500] },
  month: { effort: [7, 8], value: [50_000, 62_000] },
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
export function fairSets(kind: PeriodKind, ctx: QuestCtx, v2 = false): QuestDef[][] {
  const pool = (v2 ? BANK_V2 : BANK)[kind].filter((d) => eligible(d, ctx));
  const f = (v2 ? FAIR_V2 : FAIR)[kind];
  const n = SET_SIZE[kind] - (v2 && CHALLENGES[kind].length ? 1 : 0);
  return combos(pool, n).filter((set) => {
    const e = set.reduce((a, d) => a + d.effort, 0);
    const v = set.reduce((a, d) => a + rewardValue(d.reward), 0);
    return e >= f.effort[0] && e <= f.effort[1] && v >= f.value[0] && v <= f.value[1];
  });
}

/** This player's quests for one period: fixed by (account, period key), the same on the server and the device. */
export function questSet(kind: PeriodKind, accountId: string, periodKey: string, ctx: QuestCtx): QuestDef[] {
  const v2 = isV2(kind, periodKey);
  const sets = fairSets(kind, ctx, v2);
  const n = SET_SIZE[kind] - (v2 && CHALLENGES[kind].length ? 1 : 0);
  const regular = sets.length ? sets[fnv1a(`quests|${accountId}|${periodKey}`) % sets.length]! : (v2 ? BANK_V2 : BANK)[kind].filter((d) => eligible(d, ctx)).slice(0, n);
  if (!v2 || !CHALLENGES[kind].length) return regular;
  // The Challenge slot: one of the period's hard quests, drawn on its own seed, always last before the bonus.
  const ch = CHALLENGES[kind];
  return [...regular, ch[fnv1a(`challenge|${accountId}|${periodKey}`) % ch.length]!];
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
  switch (def.calc ?? def.id) {
    case "streak":
      return row(longestRun(events));
    case "wc-perfect":
      return row(lamps.filter((e) => e.perfect).length);
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
      const each = def.id === "m-shelf2" ? SHELF2_EACH : SHELF_EACH;
      const by = new Map<TriviaCat, number>();
      for (const e of lamps) if (e.topic) by.set(e.topic, (by.get(e.topic) ?? 0) + 1);
      const topics = [...by.values()].filter((n) => n >= each).length;
      return row(lamps.length, lamps.length >= def.need && topics >= SHELF_TOPICS, `${Math.min(topics, SHELF_TOPICS)}/${SHELF_TOPICS} categories with ${each}+`);
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

/** 0.1.24: what a refused quest collect says, by the server's reason (or "offline" when the call never landed). */
export function questClaimLine(reason: string | undefined): string {
  switch (reason) {
    case "unproven":
      return "Not done yet. The server counts it from your lamps.";
    case "closed":
      return "That quest has closed.";
    case "not-yours":
    case "unknown":
      return "That quest isn't on your board anymore. Reopen the board to refresh it.";
    case "busy":
      return "Another update to your pocket landed at the same time. Tap Collect again.";
    case "offline":
      return "Couldn't reach the server. Nothing was lost; tap Collect again.";
    default:
      return "The server couldn't pay that quest. Nothing was lost; tap Collect again.";
  }
}
