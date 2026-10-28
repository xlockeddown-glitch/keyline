/**
 * 0.0.99 Recent rewards: the last 20 rewards, read from the wallet ledger (signed in) or a local ring buffer
 * (guests). Pure mapping here; the server reader is recentFromLedger.
 */
import type { Sql } from "../lib/db.ts";
import type { Tier } from "./types.ts";

export type RewardSource = "lamp" | "market" | "streak" | "cache" | "gift" | "wheel" | "ride" | "merge" | "level" | "street" | "goal" | "daily" | "blitz" | "quest" | "reward" | "own" | "house" | "shop";
export type RecentReward = { at: number; src: RewardSource; where?: string; coins: number; keys: Partial<Record<Tier, number>>; credit?: Partial<Record<Tier, number>>; merged?: Partial<Record<Tier, number>> };

export const RECENT_MAX = 20;

const PREFIX: [string, RewardSource][] = [
  ["grade:", "lamp"], ["street:", "street"], ["cache:", "cache"], ["gift:", "gift"], ["lvgot:", "gift"], ["wheel:", "wheel"],
  ["ride:", "ride"], ["level:", "level"], ["goal:", "goal"], ["dgoal:", "goal"], ["daily:", "daily"], ["blitz", "blitz"], ["contract:", "blitz"],
  ["friend:", "gift"], ["survey:", "goal"], ["crate:", "cache"], ["quest:", "quest"], ["legacy:", "reward"], ["ownpay:", "own"], ["hook:", "house"], ["shopc:", "shop"],
];

/** One ledger row → a reward, or null when it gave nothing (spends, purchases, syncs). */
export function rewardOfRow(opKey: string, detail: string, at: number, poiName: (id: string) => string | undefined): RecentReward | null {
  if (opKey.startsWith("migrate")) return null;
  let o: Record<string, unknown> = {};
  try {
    const p = JSON.parse(detail || "{}");
    if (p && typeof p === "object") o = p as Record<string, unknown>;
  } catch {
    /* note */
  }
  const d = (o._d ?? null) as { c?: number; k?: Record<string, number>; mg?: Record<string, number>; cr?: Record<string, number> } | null;
  const coins = d ? Number(d.c) || 0 : typeof o.coins === "number" ? o.coins : 0;
  const keysRaw = d ? d.k ?? {} : ((o.keys as Record<string, number>) ?? {});
  const keys: Partial<Record<Tier, number>> = {};
  for (const [t, n] of Object.entries(keysRaw)) if (Number(n) > 0) keys[t as Tier] = Number(n);
  const credit = d?.cr && Object.keys(d.cr).length ? (d.cr as Partial<Record<Tier, number>>) : undefined;
  const merged = d?.mg && Object.keys(d.mg).length ? (d.mg as Partial<Record<Tier, number>>) : undefined;
  if (coins <= 0 && !Object.keys(keys).length && !credit && !merged) return null;
  let src: RewardSource = PREFIX.find(([p]) => opKey.startsWith(p))?.[1] ?? "reward";
  let where: string | undefined;
  if (src === "lamp") {
    if (o.mk === 1) src = "market";
    if (typeof o.pi === "string") where = poiName(o.pi);
    if (typeof o.streak === "number" && o.streak >= 3 && !where) src = "streak";
  }
  // 0.1.42: a visitor missed at a lamp you own.
  if (src === "own" && typeof o.poi === "string") where = poiName(o.poi);
  if (merged && src === "reward") src = "merge";
  return { at, src, ...(where ? { where } : {}), coins: Math.max(0, coins), keys, ...(credit ? { credit } : {}), ...(merged ? { merged } : {}) };
}

export async function recentFromLedger(sql: Sql, canonicalUserId: string, poiName: (id: string) => string | undefined): Promise<RecentReward[]> {
  const rows = await sql<{ op_key: string; detail: string; at: number }>`
    select op_key, detail, (extract(epoch from created_at) * 1000)::bigint as at
    from wallet_ledger where user_id = ${canonicalUserId} and op_key not like ${"migrate%"}
    order by created_at desc limit 80
  `;
  const out: RecentReward[] = [];
  for (const r of rows) {
    const x = rewardOfRow(r.op_key, r.detail, Number(r.at), poiName);
    if (x) out.push(x);
    if (out.length >= RECENT_MAX) break;
  }
  return out;
}

/** Guests: newest first, at most RECENT_MAX. */
export function pushRecent(list: readonly RecentReward[], r: RecentReward): RecentReward[] {
  return [r, ...list].slice(0, RECENT_MAX);
}

export const SOURCE_LABEL: Record<RewardSource, string> = {
  lamp: "Lamp", market: "Night market", streak: "Streak", cache: "Cache", gift: "Gift", wheel: "Wheel", ride: "Ride", merge: "Merge ↑",
  level: "Level-up", street: "Street match", goal: "Goal", daily: "Daily run", blitz: "Blitz", quest: "Quest", reward: "Reward", own: "Your lamp (a visitor missed)", house: "House key", shop: "Shop",
};

export function ago(at: number, now: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
