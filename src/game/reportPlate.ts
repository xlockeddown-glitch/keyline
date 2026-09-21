import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { PlateEvent } from "./telemetry";

const CITIES = [
  "austin",
  "temple",
  "nyc",
  "sf",
  "london",
  "chicago",
  "detroit",
  "tucson",
  "toronto",
  "la",
  "boston",
  "nola",
] as const;

const TIERS = ["white", "blue", "green", "amber", "red", "violet"] as const;

const EventSchema = z.object({
  plateId: z.string().min(1).max(64),
  shownAt: z.number().finite(),
  answeredAt: z.number().finite(),
  latencyMs: z.number().int().min(0).max(3_600_000),
  correct: z.boolean(),
  rarity: z.enum(TIERS),
  city: z.enum(CITIES).nullable(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
  saveId: z.string().min(1).max(80),
});

function eventId(ev: PlateEvent) {
  return `${ev.saveId}:${ev.shownAt}:${ev.plateId}`;
}

/** Signed-in write. Guests stay on the local ring. */
export const reportPlate = createServerFn({ method: "POST" })
  .validator((u: unknown) => EventSchema.parse(u))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = eventId(data);
    const shown = new Date(data.shownAt).toISOString();
    const answered = new Date(data.answeredAt).toISOString();
    const inserted = await sql<{ id: string }>`
      insert into plate_events (
        id, user_id, save_id, plate_id,
        shown_at, answered_at, latency_ms, correct,
        rarity, city, difficulty
      )
      values (
        ${id}, ${context.userId}, ${data.saveId}, ${data.plateId},
        ${shown}::timestamptz, ${answered}::timestamptz, ${data.latencyMs}, ${data.correct},
        ${data.rarity}, ${data.city}, ${data.difficulty}
      )
      on conflict (id) do nothing
      returning id
    `;
    if (!inserted.length) return { ok: true as const };
    const hit = data.correct ? 1 : 0;
    await sql`
      insert into plate_stats (plate_id, rarity, difficulty, shown, correct, latency_sum, updated_at)
      values (${data.plateId}, ${data.rarity}, ${data.difficulty}, 1, ${hit}, ${data.latencyMs}, now())
      on conflict (plate_id) do update set
        rarity = excluded.rarity,
        difficulty = excluded.difficulty,
        shown = plate_stats.shown + 1,
        correct = plate_stats.correct + excluded.correct,
        latency_sum = plate_stats.latency_sum + excluded.latency_sum,
        updated_at = now()
    `;
    return { ok: true as const };
  });
