import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { CITY_LIST, KIOSK } from "./data";
import type { ClientOp } from "./walletApply";
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
});

const Op = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("unlock"), cityId: City }),
  z.object({ kind: z.literal("start"), cityId: City }),
  z.object({ kind: z.literal("goal"), cityId: City }),
  z.object({ kind: z.literal("bank"), dir: z.enum(["up", "down"]), tier: Tier }),
  z.object({ kind: z.literal("scout"), id: z.string().min(1).max(40) }),
  z.object({ kind: z.literal("kiosk"), id: z.enum(KIOSKS) }),
  z.object({ kind: z.literal("print"), id: z.enum(COSMETICS) }),
  z.object({ kind: z.literal("refund"), token: z.string().min(10).max(2000) }),
  z.object({
    kind: z.literal("street"),
    id: z.string().min(1).max(80),
    tier: Tier,
    city: City,
    lat: z.number().finite().min(-90).max(90),
    lng: z.number().finite().min(-180).max(180),
  }),
  z.object({ kind: z.literal("daily"), day: Day, city: City }),
  z.object({ kind: z.literal("friend"), id: z.string().min(3).max(80) }),
  z.object({ kind: z.literal("survey"), id: z.string().min(1).max(80) }),
  z.object({ kind: z.literal("crate") }),
  z.object({ kind: z.literal("pulse") }),
  z.object({ kind: z.literal("contract"), id: z.string().min(1).max(200) }),
  z.object({ kind: z.literal("blitz"), step: z.number().int().min(0).max(5) }),
  z.object({ kind: z.literal("wheel"), tier: Tier, city: City }),
  z.object({
    kind: z.literal("ride"),
    departAt: Count,
    arriveAt: Count,
    openMs: Count,
    outcome: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("idle") }),
      z.object({ kind: z.literal("played") }),
      z.object({ kind: z.literal("won"), perf: z.number().finite().min(0).max(1), perfect: z.boolean().optional() }),
    ]),
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
};

export type SyncWire = {
  coins: number;
  keys: Record<Tier, number>;
  cities: CityUnlocks;
  migrated: boolean;
  revised: boolean;
};

export const syncWallet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((u: unknown) => Snap.parse(u))
  .handler(async ({ context, data }): Promise<SyncWire> => {
    const { getSql } = await import("@/lib/db");
    const { syncPlayer } = await import("./walletApply");
    const r = await syncPlayer(await getSql(), context.userId, { ...data, keys: data.keys ?? null });
    return {
      coins: r.view.coins,
      keys: r.view.keys,
      cities: r.view.cities,
      migrated: r.wallet.migrated,
      revised: r.wallet.meta.revised,
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
    };
  });
