import type { Sql } from "../lib/db.ts";
import { setQuarantine, setRetune } from "./rarity.ts";
import { isoWeek, logRetuneChange, retunePlates, type PlateStatRow, type RetuneReport } from "./retune.ts";
import type { FreshRecord } from "./freshness.ts";
import type { Tier } from "./types";

const TIERS: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];

function asTier(v: string): Tier {
  return (TIERS as string[]).includes(v) ? (v as Tier) : "white";
}

export async function loadPlateStats(sql: Sql): Promise<PlateStatRow[]> {
  const global = await sql<{
    plate_id: string;
    rarity: string;
    shown: number;
    correct: number;
    latency_sum: number;
  }>`
    select plate_id, rarity, shown, correct, latency_sum
    from plate_stats
  `;
  const city = await sql<{
    plate_id: string;
    city: string;
    rarity: string;
    attempts: number;
    correct_count: number;
    sum_latency_ms: number;
  }>`
    select
      plate_id,
      city,
      min(rarity) as rarity,
      count(*)::int as attempts,
      sum(case when correct then 1 else 0 end)::int as correct_count,
      coalesce(sum(latency_ms), 0)::bigint as sum_latency_ms
    from plate_events
    where city is not null
    group by plate_id, city
  `;
  const rows: PlateStatRow[] = [];
  for (const r of global) {
    rows.push({
      plateId: r.plate_id,
      rarity: asTier(r.rarity),
      attempts: Number(r.shown) || 0,
      correctCount: Number(r.correct) || 0,
      sumLatencyMs: Number(r.latency_sum) || 0,
      scope: "global",
    });
  }
  for (const r of city) {
    rows.push({
      plateId: r.plate_id,
      rarity: asTier(r.rarity),
      attempts: Number(r.attempts) || 0,
      correctCount: Number(r.correct_count) || 0,
      sumLatencyMs: Number(r.sum_latency_ms) || 0,
      city: r.city,
      scope: "city",
    });
  }
  return rows;
}

export async function persistRetune(sql: Sql, week: string, report: RetuneReport) {
  await sql`delete from plate_overrides`;
  for (const hit of report.changes) {
    logRetuneChange(hit);
    const snap = JSON.stringify({
      attempts: hit.attempts,
      correctCount: hit.correctCount,
      rate: hit.rate,
      sumLatencyMs: hit.sumLatencyMs,
      scope: hit.scope,
      city: hit.city,
    });
    await sql`
      insert into plate_overrides (
        plate_id, from_rarity, to_rarity, action,
        attempts, correct_count, rate, sum_latency_ms,
        scope, city, week, snapshot, updated_at
      )
      values (
        ${hit.plateId}, ${hit.from}, ${hit.to}, ${hit.action},
        ${hit.attempts}, ${hit.correctCount}, ${hit.rate}, ${hit.sumLatencyMs},
        ${hit.scope}, ${hit.city}, ${week}, ${snap}::jsonb, now()
      )
    `;
  }
  await sql`
    insert into plate_retune_meta (id, week, ran_at)
    values ('current', ${week}, now())
    on conflict (id) do update set week = excluded.week, ran_at = excluded.ran_at
  `;
}

export async function persistFreshness(sql: Sql, week: string, records: FreshRecord[]) {
  for (const rec of records) {
    await sql`
      insert into plate_freshness (
        plate_id, fresh, quarantined, verified_at, reason, source, week, updated_at
      )
      values (
        ${rec.plateId}, ${rec.fresh}, ${rec.quarantined},
        ${rec.verifiedAt}, ${rec.reason}, ${rec.source}, ${week}, now()
      )
      on conflict (plate_id) do update set
        fresh = excluded.fresh,
        quarantined = excluded.quarantined,
        verified_at = excluded.verified_at,
        reason = excluded.reason,
        source = excluded.source,
        week = excluded.week,
        updated_at = excluded.updated_at
    `;
  }
}

export async function loadOverrides(sql: Sql): Promise<Record<string, Tier>> {
  const rows = await sql<{ plate_id: string; to_rarity: string; action: string }>`
    select plate_id, to_rarity, action from plate_overrides
    where action in ('demote', 'promote')
  `;
  const map: Record<string, Tier> = {};
  for (const r of rows) map[r.plate_id] = asTier(r.to_rarity);
  return map;
}

export async function loadQuarantine(sql: Sql): Promise<string[]> {
  const rows = await sql<{ plate_id: string }>`
    select plate_id from plate_freshness where quarantined = true
  `;
  return rows.map((r) => r.plate_id);
}

export async function runWeeklyRetune(sql: Sql, opts: { force?: boolean; dry?: boolean } = {}) {
  const week = isoWeek();
  if (!opts.force && !opts.dry) {
    const meta = await sql<{ week: string }>`select week from plate_retune_meta where id = 'current'`;
    if (meta[0]?.week === week) {
      const overrides = await loadOverrides(sql);
      const quarantine = await loadQuarantine(sql);
      setRetune(overrides);
      setQuarantine(quarantine);
      return { week, skipped: true, dry: false, overrides, quarantine, changes: [], rewrites: [] as RetuneReport["rewrites"] };
    }
  }
  const rows = await loadPlateStats(sql);
  const report = retunePlates(rows);
  const quarantine = opts.dry ? [] : await loadQuarantine(sql).catch(() => [] as string[]);
  if (!opts.dry) {
    await persistRetune(sql, week, report);
    setRetune(report.overrides);
    setQuarantine(quarantine);
  } else {
    for (const hit of report.changes) logRetuneChange(hit);
  }
  return { week, skipped: false, dry: Boolean(opts.dry), quarantine, ...report };
}
