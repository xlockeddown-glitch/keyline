/**
 * 0.1.186 Meet you there (CARD-187): a location gift between friends, not a new faucet. A signed-in player on the
 * friend graph leaves a drop at a street lamp they are standing at (the Daily Run's reach); the one named friend
 * collects it only while standing at that same lamp. A wave carries nothing. A transfer is exactly 30 coin or 1
 * white key, taken from the dropper's pocket AT LEAVE TIME and held by the drop (escrow) until the friend collects
 * it or 24 hours pass, when it goes back to the dropper. Pure rules and copy here; the server is meetService.ts
 * (table meet_drops, migration 0021).
 *
 *  - The device only says "I am here, at this lamp, for this friend, this kind". Never an amount, a state, a time,
 *    a day, a slot or a sender.
 *  - Nothing is minted: what a collect or a refund credits is exactly what the leave debited.
 *  - Caps are per dropper per city-local day: 10 waves, 5 transfers. A leave spends its slot for good.
 */
import { z } from "zod";
import { CITIES } from "./data.ts";
import { isComet } from "./eventVault.ts";
import type { CityId, Poi, Tier } from "./types";

/** An uncollected drop lasts this long, then the escrow goes back to the dropper. */
export const MEET_TTL_MS = 24 * 60 * 60_000;
/** A leave that never finished (slot taken, not yet open) is cleared after this long. */
export const MEET_PENDING_MS = 5 * 60_000;
export const MEET_WAVE_CAP = 10;
export const MEET_ITEM_CAP = 5;
/** A coin transfer is exactly this much. No other amount exists. */
export const MEET_COIN = 30;
export const MEET_KEY_TIER: Tier = "white";
export const MEET_KEY_N = 1;

export const MEET_KINDS = ["wave", "key", "coin"] as const;
export type MeetKind = (typeof MEET_KINDS)[number];
export type MeetCls = "wave" | "item";
export const MEET_NONCE = /^[A-Za-z0-9_-]{8,40}$/;

/**
 * Everything the device may say. Unknown keys are stripped (zod's default), so an amount, state, expiry, day, slot
 * or dropper sent by a client never reaches the service.
 */
export const meetLeaveInput = z.object({
  city: z.string().min(1).max(40),
  lamp: z.string().min(1).max(80),
  lat: z.number().finite(),
  lng: z.number().finite(),
  friend: z.string().min(1).max(80),
  kind: z.enum(MEET_KINDS),
  nonce: z.string().regex(MEET_NONCE),
});
export const meetCollectInput = z.object({ id: z.string().regex(MEET_NONCE), lat: z.number().finite(), lng: z.number().finite() });

export const meetCls = (kind: MeetKind): MeetCls => (kind === "wave" ? "wave" : "item");
/** Leaves per dropper per city-local day, by class. */
export const meetCap = (cls: MeetCls): number => (cls === "wave" ? MEET_WAVE_CAP : MEET_ITEM_CAP);
/** What the drop row holds in escrow: 30 for coin, 1 for a key, 0 for a wave. */
export const meetAmount = (kind: MeetKind): number => (kind === "coin" ? MEET_COIN : kind === "key" ? MEET_KEY_N : 0);

/** Ledger keys: the dropper's debit, the friend's credit, the dropper's refund. */
export const meetLeaveKey = (id: string) => `meet:${id}`;
export const meetCollectKey = (id: string) => `meetget:${id}`;
export const meetRefundKey = (id: string) => `meetback:${id}`;

/**
 * A lamp a drop can sit at: one of the city's own baked, named street lamps that pass the Daily Lantern Run's kind
 * rule (no outfitter, station, counter, board or print shop), and never a comet vault. City-wide: not limited by
 * the Daily Run's radius. Null for anything else (a Hearth, a placed or owned lantern, another city's lamp).
 */
export function meetLamp(city: string, poiId: string): Poi | null {
  const c = Object.hasOwn(CITIES, city) ? CITIES[city as CityId] : null;
  if (!c || typeof poiId !== "string" || !poiId || isComet(poiId)) return null;
  const p = c.pois.find((x) => x.id === poiId);
  if (!p || p.kind === "shop" || p.kind === "station" || p.kind === "counter" || p.kind === "board" || p.printShop) return null;
  return p;
}

/** One drop as the server tells the device. `name` is the other player: who left it, or who it is for. */
export type MeetDropView = { id: string; name: string; city: string; lamp: string; lampName: string; kind: MeetKind; amount: number; expiresAt: number };
export type MeetStatus = { ready: boolean; friends: { id: string; name: string }[]; incoming: MeetDropView[]; mine: MeetDropView[] };
export type MeetReason = "unready" | "sync" | "lamp" | "far" | "friend" | "open" | "cap" | "short" | "gone" | "spent" | "again";

/** "30 coin", "1 white key", "a wave". */
export function meetWhat(kind: MeetKind): string {
  return kind === "coin" ? `${MEET_COIN} coin` : kind === "key" ? `${MEET_KEY_N} ${MEET_KEY_TIER} key` : "a wave";
}

export function meetLeaveLine(kind: MeetKind, toName: string): string {
  return kind === "wave"
    ? `You left ${toName} a wave here. It lasts 24 hours.`
    : `You left ${toName} ${meetWhat(kind)} here. It came out of your pocket now. If nobody collects it in 24 hours it comes back to you.`;
}

export function meetIncomingLine(kind: MeetKind, fromName: string): string {
  return `${fromName} left you ${meetWhat(kind)} here.`;
}

export function meetCollectLine(kind: MeetKind, fromName: string): string {
  return kind === "wave" ? `${fromName} waved at you here.` : `${fromName} left you ${meetWhat(kind)}. It is in your pocket now.`;
}

export function meetRefundLine(kind: MeetKind): string {
  return kind === "wave" ? "Your wave was not collected. It is gone." : `Nobody collected your ${meetWhat(kind)}. It is back in your pocket.`;
}

export function meetExpiredLine(): string {
  return "That drop is gone. It expired or was already collected.";
}

/** A refusal in plain words. */
export function meetRefusal(reason: string | undefined, kind?: MeetKind): string {
  switch (reason) {
    case "cap":
      return kind === "wave" ? `You have left ${MEET_WAVE_CAP} waves today. That is the limit for one day.` : `You have left ${MEET_ITEM_CAP} keys or coin drops today. That is the limit for one day.`;
    case "open":
      return "You already left one here. One drop per lamp until it is collected or expires.";
    case "far":
      return "Too far. Stand at this lamp.";
    case "short":
      return kind === "key" ? `Not enough. You need ${MEET_KEY_N} ${MEET_KEY_TIER} key in your pocket.` : `Not enough. You need ${MEET_COIN} coin in your pocket.`;
    case "friend":
      return "That player is not on your friend list. Open a friend ticket with them first.";
    case "lamp":
      return "Drops only work at a street lamp.";
    case "gone":
      return meetExpiredLine();
    case "sync":
      return "Sign in and let your pocket sync first.";
    default:
      return "That did not go through. Try again.";
  }
}

/** "expires in 5h" / "expires in 12 min". */
export function meetExpiresIn(expiresAt: number, now: number): string {
  const ms = Math.max(0, expiresAt - now);
  if (ms >= 60 * 60_000) return `expires in ${Math.floor(ms / (60 * 60_000))}h`;
  return `expires in ${Math.max(1, Math.ceil(ms / 60_000))} min`;
}

export const MEET_GUIDE = `Meet you there: signed in, standing at a street lamp, you can leave a friend (anyone you have opened a friend ticket with) a wave, ${MEET_KEY_N} ${MEET_KEY_TIER} key or ${MEET_COIN} coin. A key or coin leaves your pocket right away. Your friend collects it by standing at that same lamp. Not collected in 24 hours, it comes back to you. ${MEET_WAVE_CAP} waves and ${MEET_ITEM_CAP} key or coin drops a day, one drop per lamp.`;
