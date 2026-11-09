import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { WARDROBE_UPSERT } from "./wardrobeSql";
import { COSMETIC_IDS, EMPTY_WARDROBE, applyWardrobeSync, cleanWardrobe, type Wardrobe } from "./cosmetics";

/**
 * Server copy of a signed-in walker's print-shop wardrobe (0.0.45). Guests keep theirs in the local save only.
 * Every read and write is scoped to the verified session user.
 *
 * 0.1.137: a sync may change what is worn. Ownership and instalments come only from the row the
 * print op recorded — a post cannot add an owned id or raise a paid count. Owned items stay owned
 * (the upsert still unions, and this handler never sends an id the record does not already have).
 */
const Id = z.enum(COSMETIC_IDS as [string, ...string[]]);
const Count = z.number().int().min(0).max(99);
const WardrobeSchema = z.object({
  owned: z.array(Id).max(COSMETIC_IDS.length),
  paid: z.record(z.string(), z.object({ white: Count, blue: Count })),
  coat: z.string().nullable(),
  lantern: z.string().nullable(),
  at: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
});

type Row = { owned: unknown; paid: unknown; coat: string | null; lantern: string | null; equip_at: number | string };

const json = (v: unknown) => (typeof v === "string" ? (JSON.parse(v) as unknown) : v);

function fromRow(r: Row | undefined): Wardrobe {
  if (!r) return { ...EMPTY_WARDROBE, paid: {} };
  return cleanWardrobe({ owned: json(r.owned), paid: json(r.paid), coat: r.coat, lantern: r.lantern, at: Number(r.equip_at) || 0 });
}

async function load(userId: string): Promise<Wardrobe> {
  const sql = await getSql();
  const rows = await sql<Row>`select owned, paid, coat, lantern, equip_at from wardrobes where user_id = ${userId} limit 1`;
  return fromRow(rows[0]);
}

export const fetchWardrobe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Wardrobe> => load(context.userId));

export const syncWardrobe = createServerFn({ method: "POST" })
  .validator((u: unknown) => WardrobeSchema.parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Wardrobe> => {
    const recorded = await load(context.userId);
    const next = applyWardrobeSync(recorded, cleanWardrobe(data));
    const sql = await getSql();
    await sql.query(WARDROBE_UPSERT, [
      context.userId,
      JSON.stringify(next.owned),
      JSON.stringify(next.paid),
      next.coat,
      next.lantern,
      next.at,
    ]);
    return load(context.userId);
  });
