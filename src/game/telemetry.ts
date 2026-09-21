import type { CityId, TriviaDiff, Tier } from "./types";

export const PLATE_KEEP = 200;
export const ROLL_KEEP = 400;

export type PlateEvent = {
  plateId: string;
  shownAt: number;
  answeredAt: number;
  latencyMs: number;
  correct: boolean;
  rarity: Tier;
  city: CityId | null;
  difficulty: TriviaDiff | null;
  saveId: string;
};

export type PlateTally = { shown: number; correct: number; latencySum: number };
export type PlateAgg = Record<Tier, PlateTally>;
export type PlateRoll = {
  attempts: number;
  correctCount: number;
  sumLatencyMs: number;
  lastAt: number;
};
export type PlateRollMap = Record<string, PlateRoll>;

const ZERO: PlateTally = { shown: 0, correct: 0, latencySum: 0 };

export function emptyAgg(): PlateAgg {
  return {
    white: { ...ZERO },
    blue: { ...ZERO },
    green: { ...ZERO },
    amber: { ...ZERO },
    red: { ...ZERO },
    violet: { ...ZERO },
  };
}

export function addTally(agg: PlateAgg, ev: PlateEvent): PlateAgg {
  const cur = agg[ev.rarity] ?? { ...ZERO };
  return {
    ...agg,
    [ev.rarity]: {
      shown: cur.shown + 1,
      correct: cur.correct + (ev.correct ? 1 : 0),
      latencySum: cur.latencySum + ev.latencyMs,
    },
  };
}

export function bumpRoll(map: PlateRollMap, ev: PlateEvent, keep = ROLL_KEEP): PlateRollMap {
  const cur = map[ev.plateId] ?? { attempts: 0, correctCount: 0, sumLatencyMs: 0, lastAt: 0 };
  const next: PlateRollMap = {
    ...map,
    [ev.plateId]: {
      attempts: cur.attempts + 1,
      correctCount: cur.correctCount + (ev.correct ? 1 : 0),
      sumLatencyMs: cur.sumLatencyMs + ev.latencyMs,
      lastAt: ev.answeredAt,
    },
  };
  const ids = Object.keys(next);
  if (ids.length <= keep) return next;
  const drop = ids.sort((a, b) => (next[a]!.lastAt - next[b]!.lastAt) || a.localeCompare(b)).slice(0, ids.length - keep);
  const out = { ...next };
  for (const id of drop) delete out[id];
  return out;
}

export function mintSaveId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `s${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
}

export function finishPlate(input: {
  plateId?: string | null;
  shownAt: number;
  answeredAt: number;
  correct: boolean;
  rarity?: Tier | null;
  city?: CityId | null;
  difficulty?: TriviaDiff | null;
  saveId?: string | null;
}): PlateEvent | null {
  const plateId = (input.plateId ?? "").trim();
  const saveId = (input.saveId ?? "").trim();
  if (!plateId || !saveId) return null;
  const shownAt = Math.floor(input.shownAt);
  const answeredAt = Math.floor(input.answeredAt);
  return {
    plateId,
    shownAt,
    answeredAt,
    latencyMs: Math.max(0, answeredAt - shownAt),
    correct: Boolean(input.correct),
    rarity: input.rarity ?? "white",
    city: input.city ?? null,
    difficulty: input.difficulty ?? null,
    saveId,
  };
}

export function pushPlate(log: PlateEvent[], ev: PlateEvent) {
  return [...log, ev].slice(-PLATE_KEEP);
}

export function recordPlateEvent(
  log: PlateEvent[],
  agg: PlateAgg | undefined,
  input: Parameters<typeof finishPlate>[0],
  roll?: PlateRollMap,
) {
  const event = finishPlate(input);
  const plateAgg = agg ?? emptyAgg();
  const plateRoll = roll ?? {};
  if (!event) return { event: null, plates: log, plateAgg, plateRoll };
  return {
    event,
    plates: pushPlate(log, event),
    plateAgg: addTally(plateAgg, event),
    plateRoll: bumpRoll(plateRoll, event),
  };
}

/** Same mapping `store.answer` uses when a plate is shown and then answered. */
export function emitOnAnswer(args: {
  plates?: PlateEvent[];
  plateAgg?: PlateAgg;
  plateRoll?: PlateRollMap;
  saveId: string;
  cityId: CityId | null;
  plateId?: string | null;
  shownAt: number;
  answeredAt: number;
  correct: boolean;
  rarity?: Tier | null;
  difficulty?: TriviaDiff | null;
}) {
  return recordPlateEvent(
    args.plates ?? [],
    args.plateAgg,
    {
      plateId: args.plateId,
      shownAt: args.shownAt,
      answeredAt: args.answeredAt,
      correct: args.correct,
      rarity: args.rarity,
      city: args.cityId,
      difficulty: args.difficulty ?? null,
      saveId: args.saveId,
    },
    args.plateRoll ?? {},
  );
}
