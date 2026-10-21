/**
 * 0.0.98 levels and titles. Pure rules shared by the client and the server (levelsServer.ts).
 *
 * Levels never make the game easier for veterans: no permanent power. Rewards are matches (paid through the
 * shared pocket rule), cosmetics (name colours), giftable items for a friend, and temporary boosts that are
 * spent once (15 min). XP is derived on the server from its own records (graded answers, walk distance,
 * daily goals, rides), so existing players are backfilled automatically.
 */
import type { CityId, Tier, TriviaCat } from "./types.ts";

/* ---------------------------------------------------------------- XP */

export const XP_TIER: Readonly<Record<Tier, number>> = { white: 10, blue: 20, green: 35, amber: 60, red: 100, violet: 160 };
export const XP_PER_KM = 20;
export const XP_GOAL = 40;
export const XP_RIDE = 30;
export const LEVEL_CAP = 100;

export type XpInput = {
  correctByTier: Partial<Record<Tier, number>>;
  meters: number;
  goals: number;
  rides: number;
};

export function xpOf(i: XpInput): number {
  let xp = 0;
  for (const [t, n] of Object.entries(i.correctByTier) as [Tier, number][]) xp += (XP_TIER[t] ?? 0) * Math.max(0, Math.floor(n || 0));
  xp += Math.floor((Math.max(0, i.meters) / 1000) * XP_PER_KM);
  xp += XP_GOAL * Math.max(0, Math.floor(i.goals));
  xp += XP_RIDE * Math.max(0, Math.floor(i.rides));
  return xp;
}

/** XP to go from `level` to `level + 1`: fast early (100), slower later (~1,000 at 20, ~3,500 at 60). */
export function needFor(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return Math.round((100 + 18 * Math.pow(l - 1, 1.45)) / 10) * 10;
}

export function levelOf(xp: number): { level: number; into: number; need: number; xp: number } {
  let left = Math.max(0, Math.floor(xp));
  let level = 1;
  while (level < LEVEL_CAP && left >= needFor(level)) {
    left -= needFor(level);
    level++;
  }
  return { level, into: level >= LEVEL_CAP ? 0 : left, need: level >= LEVEL_CAP ? 0 : needFor(level), xp: Math.max(0, Math.floor(xp)) };
}

/* ---------------------------------------------------------------- rewards */

export const NAME_COLORS = [
  { id: "amber", label: "Amber", hex: "#e0a030" },
  { id: "teal", label: "Teal", hex: "#2aa198" },
  { id: "rose", label: "Rose", hex: "#e0607e" },
  { id: "sky", label: "Sky", hex: "#4a9be0" },
  { id: "lime", label: "Lime", hex: "#7cb342" },
  { id: "violet", label: "Violet", hex: "#9b6ad8" },
  { id: "coral", label: "Coral", hex: "#ef7c5a" },
  { id: "gold", label: "Gold", hex: "#d4af37" },
  { id: "ice", label: "Ice", hex: "#7fd6e6" },
  { id: "ember", label: "Ember", hex: "#d9442b" },
] as const;
export type NameColorId = (typeof NAME_COLORS)[number]["id"];

export function nameColorHex(id: string | null | undefined): string | null {
  return NAME_COLORS.find((c) => c.id === id)?.hex ?? null;
}

export const BOOST_MS = 15 * 60_000;
export const BOOST_LABEL = "Double streak pay (15 min)";

export type LevelReward = {
  level: number;
  match: { tier: Tier; n: number };
  nameColor?: NameColorId;
  /** A match to send a friend. */
  gift?: boolean;
  /** One "double streak pay for 15 minutes" token, used whenever the player chooses. */
  boost?: boolean;
};

/** The match a level pays: the tier rises with level. */
export function levelMatch(level: number): { tier: Tier; n: number } {
  if (level < 5) return { tier: "white", n: 2 };
  if (level < 10) return { tier: "blue", n: 1 };
  if (level < 20) return { tier: "green", n: 1 };
  if (level < 35) return { tier: "amber", n: 1 };
  if (level < 60 || level % 10 !== 0) return { tier: "red", n: 1 };
  return { tier: "violet", n: 1 };
}

/** What reaching `level` (2+) pays. */
export function rewardFor(level: number): LevelReward {
  const r: LevelReward = { level, match: levelMatch(level) };
  if (level % 5 === 0) r.nameColor = NAME_COLORS[(level / 5 - 1) % NAME_COLORS.length]!.id;
  else if (level % 4 === 0) r.boost = true;
  else if (level % 3 === 0) r.gift = true;
  return r;
}

/** Name colours unlocked by `level`. */
export function colorsAt(level: number): NameColorId[] {
  const out: NameColorId[] = [];
  for (let l = 5; l <= level; l += 5) {
    const c = rewardFor(l).nameColor;
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

/* ---------------------------------------------------------------- titles */

export const TITLE_RUNGS = [250, 1000, 2000] as const;

/** Per-category ladders. sports/political/food/arts/nature are DRAFTS for Ryan to rename. */
export const CAT_LADDERS: Readonly<Record<TriviaCat, readonly [string, string, string]>> = {
  celebrity: ["Fan Club", "Paparazzo", "Media Lover"],
  music: ["Air Guitarist", "Roadie", "Headliner"],
  books: ["Bookworm", "Page Turner", "Literary Lion"],
  history: ["Time Tourist", "Time Traveler", "Living Legend"],
  science: ["Lab Rat", "Mad Scientist", "Big Brain"],
  math: ["Number Cruncher", "Human Calculator", "Mathlete Supreme"],
  games: ["Button Masher", "Speedrunner", "Final Boss"],
  local: ["Tourist", "Tour Guide", "True Local"],
  sports: ["Bench Warmer", "MVP", "Hall of Famer"],
  political: ["Ballot Caster", "Policy Wonk", "Head of State"],
  food: ["Snack Scout", "Line Cook", "Master Chef"],
  arts: ["Doodler", "Curator", "Old Master"],
  nature: ["Trail Walker", "Field Ranger", "Naturalist"],
};
export const DRAFT_LADDERS: readonly TriviaCat[] = ["sports", "political", "food", "arts", "nature"];

export type TitleStats = {
  byCat: Partial<Record<TriviaCat, number>>;
  /** Right answers on night-market lamps (recorded from 0.0.98; not backfillable). */
  marketLamps: number;
  bestStreak: number;
  perfects: number;
  violet: number;
  cityCorrect: Partial<Record<CityId, number>>;
};

export const BONUS_TITLES = [
  { id: "night-owl", name: "Night Owl", need: 500, what: "night-market lamps" },
  { id: "hot-streak", name: "Hot Streak", need: 25, what: "right in a row" },
  { id: "globetrotter", name: "Globetrotter", need: 100, what: "right in every city" },
  { id: "perfectionist", name: "Perfectionist", need: 1000, what: "perfects" },
  { id: "violet-hunter", name: "Violet Hunter", need: 100, what: "violet lamps" },
] as const;

export type TitleRow = { id: string; name: string; have: number; need: number; earned: boolean; group: string; draft?: boolean };

/** Every title with progress, in picker order. `cities` = every city id (Globetrotter counts the weakest). */
export function titleRows(s: TitleStats, cities: readonly CityId[]): TitleRow[] {
  const out: TitleRow[] = [];
  for (const [cat, names] of Object.entries(CAT_LADDERS) as [TriviaCat, readonly string[]][]) {
    const have = Math.max(0, s.byCat[cat] ?? 0);
    names.forEach((name, i) => {
      const need = TITLE_RUNGS[i]!;
      out.push({ id: `cat:${cat}:${i}`, name, have, need, earned: have >= need, group: cat, ...(DRAFT_LADDERS.includes(cat) ? { draft: true } : {}) });
    });
  }
  const weakest = cities.length ? Math.min(...cities.map((c) => s.cityCorrect[c] ?? 0)) : 0;
  const bonus: Record<string, number> = {
    "night-owl": s.marketLamps,
    "hot-streak": s.bestStreak,
    globetrotter: weakest,
    perfectionist: s.perfects,
    "violet-hunter": s.violet,
  };
  for (const b of BONUS_TITLES) {
    const have = Math.max(0, bonus[b.id] ?? 0);
    out.push({ id: b.id, name: b.name, have, need: b.need, earned: have >= b.need, group: "bonus" });
  }
  return out;
}

export function titleName(id: string | null | undefined): string | null {
  if (!id) return null;
  const m = /^cat:([a-z]+):([0-2])$/.exec(id);
  if (m) return CAT_LADDERS[m[1] as TriviaCat]?.[Number(m[2])] ?? null;
  return BONUS_TITLES.find((b) => b.id === id)?.name ?? null;
}

/** Longest run of `true` in answer order. */
export function bestRun(correct: readonly boolean[]): number {
  let best = 0;
  let run = 0;
  for (const c of correct) {
    run = c ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/** What the HUD/board carry for one player. */
export type LevelTag = { level: number; title: string | null; color: string | null };
