/**
 * Server roll for a signed-in clear's paint. Reads the curve, applies the shadow,
 * and records a find. The caller has already counted this correct answer on
 * vault_clears. Guests never get here — they stay on the posted rate.
 */
import type { Sql } from "../lib/db.ts";
import { PAINT_COLORS, PAINT_DROP_IN, ULTRA_DROP_IN, paintId, type PaintColor, type PaintId } from "./ingredients.ts";
import { canonicalId } from "./playerLinks.ts";
import { isShadowPaint, shadowChance, shadowHit, type ShadowSample } from "./shadow.ts";
import type { Tier } from "./types.ts";

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return 0;
}

async function sampleOf(sql: Sql, paint: string, exceptUser: string): Promise<ShadowSample> {
  const rows = await sql<{ n: unknown; mean: unknown; sd: unknown }>`
    select count(*)::int as n,
           avg(clears)::float as mean,
           stddev_samp(clears)::float as sd
    from paint_finds
    where paint = ${paint} and first and user_id <> ${exceptUser}
  `;
  const row = rows[0];
  return { n: num(row?.n), mean: num(row?.mean), sd: num(row?.sd) };
}

async function lastClears(sql: Sql, userId: string, paint: string): Promise<number> {
  const rows = await sql<{ c: unknown }>`
    select max(clears)::int as c from paint_finds where user_id = ${userId} and paint = ${paint}
  `;
  return num(rows[0]?.c);
}

/** Correct answers already on the board for this walker, folded across linked sign-ins. */
async function clearsOf(sql: Sql, userId: string): Promise<{ byTier: Map<string, number>; total: number }> {
  const rows = await sql<{ tier: string; correct: unknown }>`
    select v.tier, sum(v.correct)::int as correct
    from vault_clears v
    left join player_links l on l.alias_id = v.user_id
    where coalesce(l.primary_id, v.user_id) = ${userId}
    group by v.tier
  `;
  const byTier = new Map<string, number>();
  let total = 0;
  for (const row of rows) {
    const n = num(row.correct);
    byTier.set(row.tier, n);
    total += n;
  }
  return { byTier, total };
}

async function noteFind(sql: Sql, userId: string, paint: string, clears: number, eventId: string): Promise<void> {
  if (clears < 1) return;
  const prior = await sql<{ x: number }>`
    select 1 as x from paint_finds where user_id = ${userId} and paint = ${paint} limit 1
  `;
  const first = prior.length === 0;
  try {
    await sql`
      insert into paint_finds (event_id, user_id, paint, clears, first)
      values (${eventId}, ${userId}, ${paint}, ${clears}, ${first})
      on conflict (event_id, paint) do nothing
    `;
  } catch {
    if (!first) return;
    await sql`
      insert into paint_finds (event_id, user_id, paint, clears, first)
      values (${eventId}, ${userId}, ${paint}, ${clears}, false)
      on conflict (event_id, paint) do nothing
    `;
  }
}

/**
 * What this signed-in clear dropped. Colour first, then prism — the same order
 * the local roll uses. Empty means the roll happened and nothing dropped.
 */
export async function shadowPaints(
  sql: Sql,
  userId: string,
  tier: Tier,
  eventId: string,
  rand: () => number = Math.random,
): Promise<PaintId[]> {
  const me = await canonicalId(sql, userId);
  const { byTier, total } = await clearsOf(sql, me);
  const hits: PaintId[] = [];

  const colorAt = byTier.get(tier) ?? 0;
  const colorBase = 1 / PAINT_DROP_IN[tier];
  const colorChance = isShadowPaint(tier)
    ? shadowChance(colorBase, await sampleOf(sql, tier, me), Math.max(0, colorAt - (await lastClears(sql, me, tier))))
    : colorBase;
  if (shadowHit(colorChance, rand())) {
    hits.push(paintId(tier));
    if (isShadowPaint(tier)) await noteFind(sql, me, tier, colorAt, eventId);
  }

  const prismAt = total;
  const prismChance = shadowChance(
    1 / ULTRA_DROP_IN,
    await sampleOf(sql, "prism", me),
    Math.max(0, prismAt - (await lastClears(sql, me, "prism"))),
  );
  if (shadowHit(prismChance, rand())) {
    hits.push(paintId("prism"));
    await noteFind(sql, me, "prism", prismAt, eventId);
  }
  return hits;
}

/** Cans already recorded for this grade, colour then prism. Empty when the roll missed. */
export async function paintsForEvent(sql: Sql, eventId: string): Promise<PaintId[]> {
  const rows = await sql<{ paint: string }>`select paint from paint_finds where event_id = ${eventId}`;
  const hits: PaintId[] = [];
  for (const row of rows) {
    if (!(PAINT_COLORS as readonly string[]).includes(row.paint)) continue;
    const id = paintId(row.paint as PaintColor);
    if (!hits.includes(id)) hits.push(id);
  }
  hits.sort((a, b) => Number(a === "paint-prism") - Number(b === "paint-prism"));
  return hits;
}
