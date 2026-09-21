import { downStep, upStep } from "./rarity.ts";
import type { Tier } from "./types";

/** Locked weekly retune. Assigner is not consulted here except as `from` rarity. */
export const RETUNE_N = 100;
/** Too easy: ~85–90%. Inclusive midpoint. */
export const DEMOTE_MIN = 0.875;
/** Too hard: ~35–40%. Inclusive midpoint. */
export const PROMOTE_MAX = 0.375;

export type StatScope = "global" | "city";

export type PlateStatRow = {
  plateId: string;
  rarity: Tier;
  attempts: number;
  correctCount: number;
  sumLatencyMs?: number | null;
  city?: string | null;
  scope: StatScope;
};

export type RetuneAction = "hold" | "demote" | "promote" | "rewrite";

export type RetuneChange = {
  plateId: string;
  from: Tier;
  to: Tier;
  action: RetuneAction;
  attempts: number;
  correctCount: number;
  rate: number;
  sumLatencyMs: number | null;
  scope: StatScope;
  city: string | null;
};

export function accuracy(attempts: number, correctCount: number) {
  if (attempts <= 0) return 0;
  return correctCount / attempts;
}

/** One plate, one step from the assigned rarity. Never walks on rerun. */
export function decideRetune(row: PlateStatRow): RetuneChange {
  const rate = accuracy(row.attempts, row.correctCount);
  const snap: RetuneChange = {
    plateId: row.plateId,
    from: row.rarity,
    to: row.rarity,
    action: "hold",
    attempts: row.attempts,
    correctCount: row.correctCount,
    rate,
    sumLatencyMs: row.sumLatencyMs ?? null,
    scope: row.scope,
    city: row.city ?? null,
  };
  if (row.attempts < RETUNE_N) return snap;
  if (rate >= DEMOTE_MIN) {
    const to = downStep(row.rarity) ?? "white";
    if (to === row.rarity) return snap;
    return { ...snap, to, action: "demote" };
  }
  if (rate <= PROMOTE_MAX) {
    const to = upStep(row.rarity);
    if (!to) return { ...snap, action: "rewrite" };
    return { ...snap, to, action: "promote" };
  }
  return snap;
}

/** City-local N≥100 wins; else global. Stable sort. */
export function pickScopedStats(rows: readonly PlateStatRow[]): PlateStatRow[] {
  const byId = new Map<string, PlateStatRow[]>();
  for (const row of rows) {
    const list = byId.get(row.plateId) ?? [];
    list.push(row);
    byId.set(row.plateId, list);
  }
  const ids = [...byId.keys()].sort();
  const picked: PlateStatRow[] = [];
  for (const id of ids) {
    const list = byId.get(id) ?? [];
    const cityOk = list
      .filter((x) => x.scope === "city" && x.attempts >= RETUNE_N)
      .sort((a, b) => b.attempts - a.attempts || (a.city ?? "").localeCompare(b.city ?? ""));
    if (cityOk[0]) {
      picked.push(cityOk[0]);
      continue;
    }
    const global = list
      .filter((x) => x.scope === "global")
      .sort((a, b) => b.attempts - a.attempts || a.plateId.localeCompare(b.plateId));
    if (global[0]) picked.push(global[0]);
  }
  return picked;
}

export type RetuneReport = {
  overrides: Record<string, Tier>;
  changes: RetuneChange[];
  rewrites: RetuneChange[];
};

export function retunePlates(rows: readonly PlateStatRow[]): RetuneReport {
  const overrides: Record<string, Tier> = {};
  const changes: RetuneChange[] = [];
  const rewrites: RetuneChange[] = [];
  for (const row of pickScopedStats(rows)) {
    const hit = decideRetune(row);
    if (hit.action === "hold") continue;
    changes.push(hit);
    if (hit.action === "rewrite") rewrites.push(hit);
    else overrides[hit.plateId] = hit.to;
  }
  return { overrides, changes, rewrites };
}

export function isoWeek(at = new Date()) {
  const utc = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function logRetuneChange(hit: RetuneChange) {
  const rate = `${(hit.rate * 100).toFixed(1)}%`;
  console.info(
    `[trivia] retune ${hit.action} ${hit.plateId} ${hit.from} → ${hit.to} n=${hit.attempts} hit=${hit.correctCount} rate=${rate} scope=${hit.scope}${hit.city ? ` city=${hit.city}` : ""}`,
  );
}
