import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { viewerMiddleware } from "@/lib/auth/viewer-middleware";
import { CITY_LIST, KIOSK } from "./data";
import type { ClientOp, RideDeal } from "./walletApply";
import type { LegacyGrant, QuestStatus } from "./questServer";
import { QUEST_PERIOD_KEY } from "./questPeriods";
import { COSMETIC_IDS, type Wardrobe } from "./cosmetics";
import type { CityUnlocks } from "./cityPass";
import type { CityId, Tier } from "./types";

/**
 * 0.0.78 signed-in wallet. Guests never call these. Every handler takes the session user
 * and resolves the player_links primary inside the apply layer. The client sends an op,
 * never a new balance.
 */
const TIERS = ["white", "blue", "green", "amber", "red", "violet"] as const;
const CITIES = CITY_LIST.map((c) => c.id) as [CityId, ...CityId[]];
const KIOSKS = Object.keys(KIOSK) as [keyof typeof KIOSK, ...(keyof typeof KIOSK)[]];
const COSMETICS = COSMETIC_IDS as [string, ...string[]];
const City = z.enum(CITIES);
const Tier = z.enum(TIERS);
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Count = z.number().finite().min(0).max(1_000_000_000);

const Snap = z.object({
  coins: Count,
  keys: z
    .object({
      white: Count.optional(),
      blue: Count.optional(),
      green: Count.optional(),
      amber: Count.optional(),
      red: Count.optional(),
      violet: Count.optional(),
    })
    .optional(),
  cities: z.unknown(),
  crateDay: z.string().max(10).optional(),
  crateStreak: Count.optional(),
  blitzDay: z.string().max(10).optional(),
  blitzStep: Count.optional(),
  wheel: z
    .object({
      white: Count.optional(),
      blue: Count.optional(),
      green: Count.optional(),
      amber: Count.optional(),
      red: Count.optional(),
      violet: Count.optional(),
    })
    .optional(),
  lucky: z.boolean().optional(),
  cloths: z.array(z.string().max(40)).max(24).optional(),
  distanceM: Count.optional(),
  fares: Count.optional(),
  atlas: z.array(z.string().max(80)).max(640).optional(),
  brass: Count.optional(),
  ink: Count.optional(),
  vellum: Count.optional(),
  schematic: Count.optional(),
  press: Count.optional(),
  patterns: Count.optional(),
  deviceId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
});

const Op = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("unlock"), cityId: City }),
  z.object({ kind: z.literal("start"), cityId: City }),
  z.object({ kind: z.literal("goal"), cityId: City }),
  z.object({ kind: z.literal("bank"), dir: z.enum(["up", "down"]), tier: Tier }),
  z.object({ kind: z.literal("scout"), id: z.string().min(1).max(40) }),
  z.object({ kind: z.literal("light"), id: z.string().min(1).max(20) }),
  z.object({ kind: z.literal("car"), id: z.string().min(1).max(20) }),
  z.object({ kind: z.literal("paint"), car: z.string().min(1).max(20), color: z.string().min(1).max(20) }),
  z.object({ kind: z.literal("house"), city: City, tier: z.string().min(1).max(20) }),
  z.object({ kind: z.literal("home"), city: City }),
  z.object({ kind: z.literal("shop"), city: City }),
  z.object({ kind: z.literal("shopCollect"), city: City }),
  z.object({ kind: z.literal("own"), poi: z.string().min(1).max(80), free: z.boolean().optional() }),
  z.object({ kind: z.literal("hurry"), min: z.number().int().min(1).max(5) }),
  z.object({ kind: z.literal("kiosk"), id: z.enum(KIOSKS), poi: z.string().min(1).max(80).optional() }),
  z.object({ kind: z.literal("print"), id: z.enum(COSMETICS) }),
  z.object({ kind: z.literal("refund"), token: z.string().min(10).max(2000) }),
  z.object({
    kind: z.literal("street"),
    id: z.string().min(1).max(80),
    tier: Tier,
    city: City,
    lat: z.number().finite().min(-90).max(90),
    lng: z.number().finite().min(-180).max(180),
    via: z.literal("magnet").optional(),
  }),
  z.object({ kind: z.literal("drive"), city: City }),
  z.object({ kind: z.literal("quest"), period: z.string().regex(QUEST_PERIOD_KEY), id: z.string().min(1).max(20) }),
  z.object({
    kind: z.literal("legacy"),
    claimed: z.array(z.string().max(20)).max(8),
    circuits: z.array(z.string().max(20)).max(20),
    unfinished: z.boolean(),
    charms: z.array(z.string().max(20)).max(8),
  }),
  z.object({ kind: z.literal("cloth"), id: z.string().min(1).max(40) }),
  z.object({ kind: z.literal("daily"), day: Day, city: City }),
  z.object({ kind: z.literal("friend"), id: z.string().min(3).max(80) }),
  z.object({ kind: z.literal("survey"), id: z.string().min(1).max(80) }),
  z.object({ kind: z.literal("crate") }),
  z.object({ kind: z.literal("contract"), nonces: z.array(z.string().regex(/^[A-Za-z0-9_-]{8,80}$/)).min(1).max(8) }),
  z.object({ kind: z.literal("blitz"), step: z.number().int().min(0).max(5), nonces: z.array(z.string().regex(/^[A-Za-z0-9_-]{8,80}$/)).min(1).max(8) }),
  z.object({ kind: z.literal("wheel"), tier: Tier, city: City }),
  z.object({ kind: z.literal("board"), from: City, to: City }),
  z.object({ kind: z.literal("cache"), city: City }),
  z.object({ kind: z.literal("dgoal"), i: z.number().int().min(0).max(3) }),
  z.object({
    kind: z.literal("ride"),
    watch: z.boolean().optional(),
    play: z.boolean().optional(),
    deal: z.enum(["lamplighter", "where-am-i", "match-sorter", "route-puzzle"]).optional(),
    round: z
      .object({
        n: z.number().int().min(0).max(12),
        taps: z.array(z.number().int().min(0).max(180_000)).max(80).optional(),
        picks: z.array(z.string().max(80)).max(8).optional(),
        boxes: z.array(z.string().max(12)).max(40).optional(),
        orders: z.array(z.array(z.string().max(80)).max(8)).max(4).optional(),
      })
      .optional(),
  }),
]);

export type WalletWire = {
  ok: boolean;
  replay: boolean;
  reason?: string;
  view: { coins: number; keys: Record<Tier, number>; cities: CityUnlocks };
  award?: { coins: number; keys: Partial<Record<Tier, number>>; boosts: string[] };
  authoritative: boolean;
  wardrobe?: Wardrobe;
  ingredient?: { id: string; n: number };
  line?: string;
  wheelWin?: number;
  cache?: { got: Tier[]; coin: number; already?: boolean };
  rideDeal?: RideDeal;
  hurry?: { arriveAt: number; cost: number };
  /** 0.1.9: paint can found (cache) or the can a paint op spent. */
  can?: { car: string; color: string };
  home?: { match: Tier | null; n?: number; coin?: number; day: string };
  shop?: { n: number; coin: number; at: number; anchor: number; readyAt: number };
  quest?: { id: string; period: string; lucky?: string };
  legacy?: LegacyGrant[];
};

export type SyncWire = {
  /** 0.1.44: a new player's double-coin hour ends here (ms); absent when none. */
  doubleUntil?: number;
  coins: number;
  keys: Record<Tier, number>;
  cities: CityUnlocks;
  /** 0.0.97: the server's overflow credits. */
  credit?: Partial<Record<Tier, number>>;
  migrated: boolean;
  revised: boolean;
  playerId: string;
  /** 0.0.95: notes for one-time gifts the server paid on this sync. */
  giftNotes?: string[];
  /** 0.0.95: what the account owns on the server (scouts, charms, cloths); merged into the save on sign-in. */
  owned?: { scouts: string[]; charms: string[]; cloths: string[]; lights?: string[]; cars?: string[]; cans?: string[]; paint?: Record<string, string>; houses?: Record<string, { tier: string; items?: string[] }>; homeClaims?: string[]; shops?: Record<string, { at: number; anchor: number }> };
};

export const syncWallet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((u: unknown) => Snap.parse(u))
  .handler(async ({ context, data }): Promise<SyncWire> => {
    const { getSql } = await import("@/lib/db");
    const { syncPlayer } = await import("./walletApply");
    const { deviceId, ...snap } = data;
    const r = await syncPlayer(await getSql(), context.userId, { ...snap, keys: snap.keys ?? null }, deviceId);
    return {
      coins: r.view.coins,
      keys: r.view.keys,
      cities: r.view.cities,
      credit: r.view.credit,
      migrated: r.wallet.migrated,
      revised: r.deviceClosed,
      playerId: r.playerId,
      ...(r.giftNotes?.length ? { giftNotes: r.giftNotes } : {}),
      ...(r.owned ? { owned: r.owned } : {}),
      ...(r.doubleUntil ? { doubleUntil: r.doubleUntil } : {}),
    };
  });

export const applyWallet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((u: unknown) => Op.parse(u))
  .handler(async ({ context, data }): Promise<WalletWire> => {
    const { getSql } = await import("@/lib/db");
    const { applyClientOp } = await import("./walletApply");
    const r = await applyClientOp(await getSql(), context.userId, data as ClientOp);
    return {
      ok: r.ok,
      replay: r.replay,
      reason: r.reason,
      view: r.view,
      award: r.award,
      authoritative: r.authoritative,
      wardrobe: r.wardrobe,
      ingredient: r.ingredient,
      line: r.line,
      wheelWin: r.wheelWin,
      cache: r.cache,
      rideDeal: r.rideDeal,
      hurry: r.hurry,
      can: r.can,
      home: r.home,
      shop: r.shop,
      quest: r.quest,
      legacy: r.legacy,
    };
  });

/** 0.0.99: the signed-in player's last 20 rewards, from the wallet ledger. */
export const fetchRecentRewards = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const { recentFromLedger } = await import("./recentRewards");
    const { canonicalWallet } = await import("./walletSql");
    const { CITIES } = await import("./data");
    const sql = await getSql();
    const { id } = await canonicalWallet(sql, context.userId);
    const names = new Map<string, string>();
    for (const c of Object.values(CITIES)) for (const p of c.pois) names.set(p.id, p.name);
    return recentFromLedger(sql, id, (pid) => names.get(pid));
  });

/** 0.1.22: this week's and this month's quests, counted by the server from its own ledger rows. */
export const fetchQuests = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<QuestStatus> => {
    const { getSql } = await import("@/lib/db");
    const { questStatus } = await import("./questServer");
    return questStatus(await getSql(), context.userId);
  });

/** 0.1.42: every owned lamp (owner's display name), for the lamp card; `mine` for the signed-in owner. Guests may read. */
export const fetchOwnedLamps = createServerFn({ method: "POST" })
  .middleware([viewerMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const { ownedLamps, lampGiftsOpen } = await import("./walletApply");
    try {
      const sql = await getSql();
      // 0.1.43: the signed-in player's unclaimed gift lanterns ride along.
      return { lamps: await ownedLamps(sql, context.userId), gifts: context.userId ? await lampGiftsOpen(sql, context.userId) : [] };
    } catch {
      return { lamps: [], gifts: [] as string[] };
    }
  });
