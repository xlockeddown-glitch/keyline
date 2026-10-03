import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { WARDROBE_UPSERT } from "./wardrobeSql";
import { COSMETIC_IDS, EMPTY_WARDROBE, cleanWardrobe, mergeWardrobe, type Wardrobe } from "./cosmetics";

/**
 * Server copy of a signed-in walker's print-shop wardrobe (0.0.45). Guests keep theirs in the local save only.
 * Every read and write is scoped to the verified session user. A sync merges the device's copy into the
 * stored one (ownership only grows, instalments keep the larger payment, the newer equip wins) and returns
 * the result, so a second device or a cleared browser gets everything back on sign-in.
 *
 * Matches live in the local save (as every match always has), so the server can't re-check a payment;
 * what it guarantees is that a bought item is never lost and that nobody else's row is touched.
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
    const merged = mergeWardrobe(await load(context.userId), cleanWardrobe(data));
    const sql = await getSql();
    await sql.query(WARDROBE_UPSERT, [
      context.userId,
      JSON.stringify(merged.owned),
      JSON.stringify(merged.paid),
      merged.coat,
      merged.lantern,
      merged.at,
    ]);
    return load(context.userId);
  });
