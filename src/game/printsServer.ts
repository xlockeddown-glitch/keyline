/**
 * 0.0.99 city prints, server side. Progress is read from the server's own records only: right answers in a
 * city (plate_events_by_player) and metres WALKED there (walk_distance_by_player; rides are not in it).
 * A print is earned once both legs are met. Prints are cosmetic: nothing here touches the wallet.
 */
import type { Sql } from "../lib/db.ts";
import { ALL_PRINTS, printProgress } from "./cityPrints.ts";
import type { CityId } from "./types.ts";
import { canonicalWallet } from "./walletSql.ts";

export type PrintRow = { id: string; city: CityId; name: string; swatch: string; correct: number; meters: number; needCorrect: number; needMeters: number; earned: boolean };

export async function printLook(sql: Sql, userId: string): Promise<PrintRow[]> {
  const { id } = await canonicalWallet(sql, userId);
  const right = await sql<{ city: string; n: number }>`
    select city, count(*)::int as n from plate_events_by_player where user_id = ${id} and correct and city is not null group by city
  `;
  const walked = await sql<{ city: string; m: number }>`
    select city, coalesce(sum(meters), 0)::bigint as m from walk_distance_by_player where user_id = ${id} group by city
  `;
  const c = new Map(right.map((r) => [r.city, Number(r.n)]));
  const m = new Map(walked.map((r) => [r.city, Number(r.m)]));
  return ALL_PRINTS.map((p) => {
    const got = { correct: c.get(p.city) ?? 0, meters: m.get(p.city) ?? 0 };
    return { id: p.id, city: p.city, name: p.name, swatch: p.swatch, ...got, needCorrect: p.goal.correct, needMeters: p.goal.meters, earned: printProgress(p, got).done };
  });
}
