/**
 * Ride mini-games: what a fare pays, which game a trip gets, and Lamplighter's rules.
 * Pure — no store, no DOM — so node tests can run it straight.
 */

/** `perfect` marks a clean sheet in games that offer the bonus (Where am I? 5/5). */
export type RideOutcome = { kind: "idle" } | { kind: "played" } | { kind: "won"; perf: number; perfect?: boolean };

export const IDLE: RideOutcome = { kind: "idle" };

/** Payout table is written for an eight-minute ride and scaled from there. */
export const RIDE_BASE_MS = 8 * 60_000;
export const BASE_IDLE = 1;
export const BASE_PLAYED = 3;
export const BASE_WON_LOW = 5;
export const BASE_WON_HIGH = 7;
/** A win at or above this performance is strong: it can trade three whites for a blue. */
export const STRONG_WIN = 0.75;
/** Rides this long can trade twice. */
export const LONG_RIDE_MS = 12 * 60_000;
export const BLUE_IN_WHITES = 3;
/** Flat whites a perfect round adds on top of the ride's pay. Not scaled by ride length. */
export const RIDE_PERFECT_BONUS = 1;

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/**
 * Matches one ride pays for its best outcome. Scale = minutes / 8, rounded, at least 1.
 * Played never pays under idle, won never under played, and a strong win always beats played.
 * Strong wins worth 5+ whites swap 3 whites for 1 blue (two swaps on 12+ minute rides at 10+).
 * A perfect win then adds RIDE_PERFECT_BONUS whites flat, after the swap.
 */
export function rideReward(rideMs: number, outcome: RideOutcome): { white: number; blue: number } {
  const scale = Math.max(0, rideMs) / RIDE_BASE_MS;
  const idle = Math.max(1, Math.round(BASE_IDLE * scale));
  if (outcome.kind === "idle") return { white: idle, blue: 0 };
  const played = Math.max(idle, Math.round(BASE_PLAYED * scale));
  if (outcome.kind === "played") return { white: played, blue: 0 };
  const perf = clamp01(outcome.perf);
  const strong = perf >= STRONG_WIN;
  let white = Math.max(played, Math.round((BASE_WON_LOW + (BASE_WON_HIGH - BASE_WON_LOW) * perf) * scale));
  if (strong) white = Math.max(white, played + 1);
  let blue = 0;
  if (strong && white >= 5) {
    blue = rideMs >= LONG_RIDE_MS && white >= 10 ? 2 : 1;
    white -= BLUE_IN_WHITES * blue;
  }
  if (outcome.perfect) white += RIDE_PERFECT_BONUS;
  return { white, blue };
}

/** Result-screen line for a perfect round's bonus, or undefined when there isn't one. */
export function perfectLine(outcome: RideOutcome): string | undefined {
  if (outcome.kind !== "won" || !outcome.perfect) return undefined;
  return `Perfect round: +${RIDE_PERFECT_BONUS} white bonus on top of the ride's pay.`;
}

/** Worth in whites, for comparing payouts. */
export function rideValue(r: { white: number; blue: number }) {
  return r.white + BLUE_IN_WHITES * r.blue;
}

const RANK = { idle: 0, played: 1, won: 2 } as const;

/** The better of two outcomes. A ride only ever pays its best. */
export function betterOutcome(a: RideOutcome, b: RideOutcome): RideOutcome {
  if (RANK[b.kind] !== RANK[a.kind]) return RANK[b.kind] > RANK[a.kind] ? b : a;
  if (a.kind === "won" && b.kind === "won") {
    if (b.perf !== a.perf) return b.perf > a.perf ? b : a;
    return b.perfect && !a.perfect ? b : a;
  }
  return a;
}

/** What the journey remembers about ride games. Lives on the save so a reload can't re-pay. */
export type RideGameMark = {
  /** Best finished round this ride. */
  game?: { kind: "played" | "won"; perf: number; rounds: number; perfect?: boolean };
  /** Set while a round is running. Still set on load means the tab closed mid-round. */
  roundAt?: number;
  forfeits?: number;
};

export function journeyOutcome(j: RideGameMark): RideOutcome {
  const g = j.game;
  if (!g) return IDLE;
  if (g.kind === "won") return g.perfect ? { kind: "won", perf: clamp01(g.perf), perfect: true } : { kind: "won", perf: clamp01(g.perf) };
  return { kind: "played" };
}

/** Fold a finished round into the journey. Keeps the best; counts the round. */
export function markRound<J extends RideGameMark>(j: J, outcome: RideOutcome): J {
  const best = betterOutcome(journeyOutcome(j), outcome);
  const rounds = (j.game?.rounds ?? 0) + 1;
  const next: J = { ...j, roundAt: undefined };
  if (best.kind === "idle") return next;
  next.game = { kind: best.kind, perf: best.kind === "won" ? best.perf : 0, rounds };
  if (best.kind === "won" && best.perfect) next.game.perfect = true;
  return next;
}

export function openRound<J extends RideGameMark>(j: J, now: number): J {
  return { ...j, roundAt: now };
}

/** A round still open when the save loads was cut off: forfeit it. Idle pay and earlier bests stand. */
export function forfeitRound<J extends RideGameMark>(j: J): J {
  if (j.roundAt == null) return j;
  return { ...j, roundAt: undefined, forfeits: (j.forfeits ?? 0) + 1 };
}

// ── Which game a trip gets ──────────────────────────────────────────────

export type RideGameId = "lamplighter" | "where-am-i" | "match-sorter" | "route-puzzle";

export const RIDE_GAME_NAME: Record<RideGameId, string> = {
  lamplighter: "Lamplighter",
  "where-am-i": "Where am I?",
  "match-sorter": "Match sorter",
  "route-puzzle": "Route puzzle",
};

/** Short trips get quick reflex games, long trips get thinkers. */
export const RIDE_GAME_BANDS: { underMs: number; games: RideGameId[] }[] = [
  { underMs: 2 * 60_000, games: ["lamplighter"] },
  { underMs: 6 * 60_000, games: ["where-am-i", "match-sorter"] },
  { underMs: Number.POSITIVE_INFINITY, games: ["route-puzzle"] },
];

/** Games that are built. Lamplighter fills any band whose games aren't ready yet. */
export const READY_RIDE_GAMES: readonly RideGameId[] = ["lamplighter", "where-am-i", "match-sorter"];

/**
 * The game a ride gets. Bands share their games evenly; which one is a hash of the ride seed
 * (the departure time), so a reload, the store and the screen all agree.
 */
export function pickRideGame(rideMs: number, ready: readonly RideGameId[] = READY_RIDE_GAMES, seed = 0): RideGameId {
  const band = RIDE_GAME_BANDS.find((b) => rideMs < b.underMs) ?? RIDE_GAME_BANDS[RIDE_GAME_BANDS.length - 1]!;
  const open = band.games.filter((g) => ready.includes(g));
  if (!open.length) return "lamplighter";
  if (open.length === 1) return open[0]!;
  return open[Math.floor(seededRng(Math.floor(seed) ^ 0x2545f491)() * open.length)]!;
}

/** The game this journey gets: its length picks the band, its departure picks within it. */
export function rideGameFor(j: { departAt: number; arriveAt: number }): RideGameId {
  return pickRideGame(j.arriveAt - j.departAt, READY_RIDE_GAMES, j.departAt);
}

/** Where am I? rounds: up to 75s, and none under 30s. */
export const WHERE_ROUND_MAX_MS = 75_000;
export const WHERE_ROUND_MIN_MS = 30_000;

/** Where am I? round length for the time left, or null when the platform is too close. */
export function whereRoundMs(remainingMs: number): number | null {
  const room = Math.floor(remainingMs - ARRIVAL_BUFFER_MS);
  if (room < WHERE_ROUND_MIN_MS) return null;
  return Math.min(WHERE_ROUND_MAX_MS, room);
}

// ── Match sorter timing (rules live in matchSorter.ts) ──────────────────

/** Wave shape: how many matches, how far apart they drop, and how long one takes to fall. */
export const SORT_WAVES: readonly { count: number; gapMs: number; fallMs: number }[] = [
  { count: 5, gapMs: 1_250, fallMs: 6_200 },
  { count: 6, gapMs: 1_050, fallMs: 5_400 },
  { count: 7, gapMs: 900, fallMs: 4_700 },
  { count: 8, gapMs: 780, fallMs: 4_100 },
];
export const SORT_FIRST_MS = 1_200;
/** Breather after the last drop of a wave before the next wave starts dropping. */
export const SORT_WAVE_PAUSE_MS = 2_200;
export const SORT_TOTAL = SORT_WAVES.reduce((n, w) => n + w.count, 0);

function sortEnd() {
  let at = SORT_FIRST_MS;
  let end = 0;
  for (const w of SORT_WAVES) {
    at += (w.count - 1) * w.gapMs;
    end = Math.max(end, at + w.fallMs);
    at += SORT_WAVE_PAUSE_MS;
  }
  return end;
}
/** Round length: the last match's fall plus a beat. Fixed, so every seed fits the same window. */
export const SORT_ROUND_MS = sortEnd() + 600;

/** Match sorter round length, or null when the platform is too close for the full round. */
export function sorterRoundMs(remainingMs: number): number | null {
  return remainingMs - ARRIVAL_BUFFER_MS >= SORT_ROUND_MS ? SORT_ROUND_MS : null;
}

/** Round length for this ride's game. */
export function rideRoundMs(game: RideGameId, remainingMs: number): number | null {
  if (game === "where-am-i") return whereRoundMs(remainingMs);
  if (game === "match-sorter") return sorterRoundMs(remainingMs);
  return lampRoundMs(remainingMs);
}

// ── Lamplighter ─────────────────────────────────────────────────────────

export const ROUND_MAX_MS = 60_000;
export const ROUND_MIN_MS = 15_000;
/** Rounds end at least this long before the train pulls in. */
export const ARRIVAL_BUFFER_MS = 8_000;
/** How long a lamp takes to cross the window. */
export const LAMP_TRAVEL_MS = 2_600;
/** Tap within this of a lamp crossing the frame and it lights. */
export const LAMP_HIT_MS = 200;
/** Light at least this share of lamps (strays count against you) to win. */
export const WIN_ACC = 0.6;

/** Round length for the time left, or null when the platform is too close for a round. */
export function lampRoundMs(remainingMs: number): number | null {
  const room = Math.floor(remainingMs - ARRIVAL_BUFFER_MS);
  if (room < ROUND_MIN_MS) return null;
  return Math.min(ROUND_MAX_MS, room);
}

export type LampTier = "white" | "blue" | "green" | "amber";
export type Lamp = { id: number; at: number; tier: LampTier };

export function seededRng(seed: number) {
  let a = (Math.floor(seed) >>> 0) || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** When each lamp crosses the frame. Gaps tighten as the round goes on. */
export function lampSchedule(roundMs: number, seed: number): Lamp[] {
  const rnd = seededRng(seed);
  const out: Lamp[] = [];
  let at = 1_700;
  let id = 0;
  while (at <= roundMs - 700) {
    const t = at / roundMs;
    const roll = rnd();
    const tier: LampTier = roll < 0.55 ? "white" : roll < 0.8 ? "blue" : roll < 0.95 ? "green" : "amber";
    out.push({ id: id++, at: Math.round(at), tier });
    const gap = 1_350 - 550 * t;
    at += gap + (rnd() - 0.5) * 360;
  }
  return out;
}

/** The unlit lamp nearest the frame at time t, if one is close enough to light. */
export function lampInFrame(lamps: Lamp[], lit: ReadonlySet<number>, t: number): Lamp | null {
  let best: Lamp | null = null;
  let gap = LAMP_HIT_MS + 1;
  for (const l of lamps) {
    if (lit.has(l.id)) continue;
    const d = Math.abs(l.at - t);
    if (d < gap) {
      gap = d;
      best = l;
    }
  }
  return gap <= LAMP_HIT_MS ? best : null;
}

export type LampTally = { lamps: number; hits: number; strays: number; streak: number };

/** Accuracy counts every lamp that passed plus every tap at an empty frame. */
export function lampAccuracy(t: Pick<LampTally, "lamps" | "hits" | "strays">) {
  const shots = t.lamps + t.strays;
  return shots > 0 ? Math.min(1, t.hits / shots) : 0;
}

export function lampOutcome(t: Pick<LampTally, "lamps" | "hits" | "strays">): RideOutcome {
  const acc = lampAccuracy(t);
  if (t.lamps > 0 && acc >= WIN_ACC) return { kind: "won", perf: clamp01((acc - WIN_ACC) / (1 - WIN_ACC)) };
  return { kind: "played" };
}

/** End-of-round line, in the conductor's voice. */
export function lampVerdict(t: Pick<LampTally, "lamps" | "hits" | "strays">) {
  const acc = lampAccuracy(t);
  const of = `${t.hits} of ${t.lamps} lit.`;
  if (t.lamps > 0 && t.hits === t.lamps && t.strays === 0) return `${of} Every one. The conductor tips his cap.`;
  if (acc >= 0.9) return `${of} Clean work. The street looks warmer.`;
  if (acc >= WIN_ACC) return `${of} Good enough to get paid.`;
  if (t.hits === 0) return `${of} The street stayed dark. The seat still pays.`;
  return `${of} Bit jumpy. You still get the carriage rate.`;
}
