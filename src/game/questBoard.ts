// 0.1.22: weekly and monthly quests (they replace the old milestones). Pure rules shared by the
// client (display) and the server (questServer.ts), which recounts progress from its own ledger
// rows and pays each quest once per period. Sparks never count: only a right answer on a lamp that
// spent a match is a "lamp" event here.
import type { PeriodKind } from "./questPeriods.ts";
import type { CityId, Tier, TriviaCat } from "./types.ts";

export type QuestEvent =
  | { k: "lamp"; at: number; tier: Tier; city: CityId | null; topic: TriviaCat | null; market: boolean }
  | { k: "miss"; at: number }
  | { k: "ride"; at: number; game: string };

export type QuestReward = { coins: number; matches: Tier[]; lucky?: boolean };

export type QuestId = "w-lamps" | "w-ladder" | "w-streak" | "w-out" | "w-bonus" | "m-tour" | "m-night" | "m-shelf" | "m-bonus";

export type QuestDef = { id: QuestId; kind: PeriodKind; title: string; sub: string; need: number; reward: QuestReward; bonus?: boolean };

const RANK: Record<Tier, number> = { white: 0, blue: 1, green: 2, amber: 3, red: 4, violet: 5 };
const LADDER: Tier[] = ["white", "blue", "green", "amber", "red"];
export const SHELF_TOTAL = 60;
export const SHELF_EACH = 10;
export const SHELF_TOPICS = 4;
/** What the all-three monthly bonus pays when the account already owns Lucky for good. */
export const LUCKY_OWNED_COIN = 25_000;

export const QUESTS: QuestDef[] = [
  { id: "w-lamps", kind: "week", title: "Lamp lighter", sub: "Light 25 lamps, green or higher.", need: 25, reward: { coins: 2_000, matches: ["green"] } },
  { id: "w-ladder", kind: "week", title: "Colour ladder", sub: "One right lamp in each of white, blue, green, amber and red.", need: 5, reward: { coins: 1_500, matches: ["amber"] } },
  { id: "w-streak", kind: "week", title: "Hot hand", sub: "15 right lamps in a row.", need: 15, reward: { coins: 1_000, matches: ["blue", "green"] } },
  { id: "w-out", kind: "week", title: "Out and about", sub: "Finish 3 different ride games.", need: 3, reward: { coins: 1_200, matches: ["blue"] } },
  { id: "w-bonus", kind: "week", title: "Full week", sub: "Finish all four weekly quests.", need: 4, reward: { coins: 0, matches: ["red"] }, bonus: true },
  { id: "m-tour", kind: "month", title: "City tour", sub: "Right lamps in 4 different cities.", need: 4, reward: { coins: 15_000, matches: ["red"] } },
  { id: "m-night", kind: "month", title: "Night shift", sub: "12 right night-market lamps.", need: 12, reward: { coins: 20_000, matches: ["amber"] } },
  {
    id: "m-shelf",
    kind: "month",
    title: "Well read",
    sub: `${SHELF_TOTAL} right lamps across ${SHELF_TOPICS} or more categories, at least ${SHELF_EACH} in each.`,
    need: SHELF_TOTAL,
    reward: { coins: 12_000, matches: ["red"] },
  },
  {
    id: "m-bonus",
    kind: "month",
    title: "Full month",
    sub: `Finish all three monthly quests. Lucky is on for all of next month (${LUCKY_OWNED_COIN.toLocaleString("en-US")} coin if you already own Lucky).`,
    need: 3,
    reward: { coins: 0, matches: [], lucky: true },
    bonus: true,
  },
];

export const QUEST_IDS = QUESTS.map((q) => q.id);

export function questDef(id: string): QuestDef | null {
  return QUESTS.find((q) => q.id === id) ?? null;
}

export function questsOf(kind: PeriodKind): QuestDef[] {
  return QUESTS.filter((q) => q.kind === kind);
}

export type QuestRow = { id: QuestId; have: number; need: number; done: boolean; note?: string };

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

function shelf(lamps: Extract<QuestEvent, { k: "lamp" }>[]): { total: number; topics: number; done: boolean } {
  const by = new Map<TriviaCat, number>();
  for (const e of lamps) if (e.topic) by.set(e.topic, (by.get(e.topic) ?? 0) + 1);
  const topics = [...by.values()].filter((n) => n >= SHELF_EACH).length;
  const total = lamps.length;
  return { total, topics, done: total >= SHELF_TOTAL && topics >= SHELF_TOPICS };
}

/** Progress on every quest of one period, from events already filtered to that period's window. */
export function questProgress(kind: PeriodKind, events: QuestEvent[]): QuestRow[] {
  const lamps = events.filter((e): e is Extract<QuestEvent, { k: "lamp" }> => e.k === "lamp");
  const rows: QuestRow[] = [];
  const cap = (have: number, need: number) => Math.min(have, need);
  if (kind === "week") {
    const green = lamps.filter((e) => RANK[e.tier] >= RANK.green).length;
    const tiers = new Set(lamps.map((e) => e.tier).filter((t) => LADDER.includes(t))).size;
    const run = longestRun(events);
    const games = new Set(events.filter((e) => e.k === "ride").map((e) => (e as { game: string }).game)).size;
    rows.push({ id: "w-lamps", have: cap(green, 25), need: 25, done: green >= 25 });
    rows.push({ id: "w-ladder", have: cap(tiers, 5), need: 5, done: tiers >= 5 });
    rows.push({ id: "w-streak", have: cap(run, 15), need: 15, done: run >= 15 });
    rows.push({ id: "w-out", have: cap(games, 3), need: 3, done: games >= 3 });
  } else {
    const cities = new Set(lamps.map((e) => e.city).filter(Boolean)).size;
    const market = lamps.filter((e) => e.market).length;
    const s = shelf(lamps);
    rows.push({ id: "m-tour", have: cap(cities, 4), need: 4, done: cities >= 4 });
    rows.push({ id: "m-night", have: cap(market, 12), need: 12, done: market >= 12 });
    rows.push({
      id: "m-shelf",
      have: cap(s.total, SHELF_TOTAL),
      need: SHELF_TOTAL,
      done: s.done,
      note: `${Math.min(s.topics, SHELF_TOPICS)}/${SHELF_TOPICS} categories with ${SHELF_EACH}+`,
    });
  }
  const n = rows.filter((r) => r.done).length;
  const bonus: QuestId = kind === "week" ? "w-bonus" : "m-bonus";
  rows.push({ id: bonus, have: n, need: rows.length, done: n >= rows.length });
  return rows;
}

/** "2,000 coin + green match" */
export function rewardLine(r: QuestReward): string {
  const bits: string[] = [];
  if (r.coins) bits.push(`${r.coins.toLocaleString("en-US")} coin`);
  const by = new Map<Tier, number>();
  for (const t of r.matches) by.set(t, (by.get(t) ?? 0) + 1);
  for (const [t, n] of by) bits.push(`${n > 1 ? `${n} ` : ""}${t} match${n > 1 ? "es" : ""}`);
  if (r.lucky) bits.push("Lucky next month");
  return bits.join(" + ");
}
