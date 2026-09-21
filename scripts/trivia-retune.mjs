#!/usr/bin/env node
/**
 * Weekly Keyline retune job.
 *
 * Dry-run by default (prints, writes nothing).
 *
 *   npm run trivia:retune
 *   npm run trivia:retune -- --apply
 *   npm run trivia:retune -- --fresh --apply
 *   npm run trivia:retune -- --force --apply
 *   node --experimental-strip-types scripts/trivia-retune.mjs --dry
 *
 * Flags:
 *   --apply   persist rarity overrides + freshness tags (needs DATABASE_URL)
 *   --fresh   Wikipedia-check up to 20 volatile plates (rate-limited)
 *   --force   ignore same-ISO-week skip
 *   --dry     force dry-run (default)
 *   --skip-fresh  skip the volatile scan
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadQuestions } from "./trivia-audit.mjs";
import { plateId } from "../src/game/rarity.ts";
import { isoWeek, retunePlates } from "../src/game/retune.ts";
import { FRESH_LIMIT, freshnessPass, sleep, wikiVerify } from "../src/game/freshness.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

function flags(argv) {
  const set = new Set(argv);
  return {
    apply: set.has("--apply"),
    fresh: set.has("--fresh"),
    force: set.has("--force"),
    dry: set.has("--dry") || !set.has("--apply"),
    skipFresh: set.has("--skip-fresh"),
  };
}

async function loadStats() {
  if (!process.env.DATABASE_URL) return [];
  const { getSql } = await import("../src/lib/db.ts");
  const sql = await getSql();
  const { loadPlateStats } = await import("../src/game/retuneRun.ts");
  return loadPlateStats(sql);
}

async function main() {
  const opts = flags(process.argv.slice(2));
  const week = isoWeek();
  console.log(`[trivia] retune ${week} ${opts.dry ? "dry-run" : "apply"}${opts.fresh ? " +fresh" : ""}`);

  let stats = [];
  try {
    stats = await loadStats();
  } catch (err) {
    console.warn(`[trivia] stats skipped: ${err instanceof Error ? err.message : err}`);
  }
  const report = retunePlates(stats);
  console.log(
    `[trivia] stats=${stats.length} promote=${report.changes.filter((c) => c.action === "promote").length} demote=${report.changes.filter((c) => c.action === "demote").length} rewrite=${report.rewrites.length}`,
  );

  let fresh = { records: [], quarantined: [] };
  if (!opts.skipFresh) {
    const items = loadQuestions(ROOT);
    const plates = items.map((it) => ({
      id: plateId(it.q, it.answer),
      q: it.q,
      answer: it.answer,
      choices: it.choices,
    }));
    const verify = opts.fresh
      ? async (p) => {
          const hit = await wikiVerify(p);
          await sleep(300);
          return hit;
        }
      : undefined;
    fresh = await freshnessPass(plates, { limit: FRESH_LIMIT, verify });
    console.log(
      `[trivia] volatile=${fresh.records.filter((r) => r.fresh === "volatile").length} quarantined=${fresh.quarantined.length} verified=${fresh.records.filter((r) => r.verifiedAt).length}`,
    );
  }

  if (opts.apply && process.env.DATABASE_URL) {
    const { getSql } = await import("../src/lib/db.ts");
    const { persistFreshness, persistRetune } = await import("../src/game/retuneRun.ts");
    const sql = await getSql();
    await persistRetune(sql, week, report);
    if (fresh.records.length) await persistFreshness(sql, week, fresh.records);
    console.log("[trivia] persisted");
  } else if (opts.apply) {
    console.warn("[trivia] --apply ignored: DATABASE_URL is not set");
  }

  const out = {
    week,
    dry: opts.dry,
    overrides: report.overrides,
    changes: report.changes,
    rewrites: report.rewrites,
    volatile: fresh.records.filter((r) => r.fresh === "volatile").map((r) => ({
      plateId: r.plateId,
      reason: r.reason,
      action: r.action,
      quarantined: r.quarantined,
      verifiedAt: r.verifiedAt,
      source: r.source,
    })),
    quarantined: fresh.quarantined,
  };
  console.log(JSON.stringify({ week: out.week, dry: out.dry, overrideCount: Object.keys(out.overrides).length, quarantined: out.quarantined, rewriteCount: out.rewrites.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
