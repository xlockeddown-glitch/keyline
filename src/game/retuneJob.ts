import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { loadOverrides, loadQuarantine, runWeeklyRetune } from "./retuneRun";
import type { Tier } from "./types";

export type RetunePack = {
  overrides: Record<string, Tier>;
  quarantine: string[];
};

/** Public read. First visitor of an ISO week runs rarity retune; later visits reuse it. No wiki. */
export const fetchRetune = createServerFn({ method: "GET" }).handler(async (): Promise<RetunePack> => {
  try {
    const sql = await getSql();
    const ran = await runWeeklyRetune(sql);
    return { overrides: ran.overrides, quarantine: ran.quarantine ?? [] };
  } catch {
    try {
      const sql = await getSql();
      const overrides = await loadOverrides(sql);
      const quarantine = await loadQuarantine(sql);
      return { overrides, quarantine };
    } catch {
      return { overrides: {}, quarantine: [] };
    }
  }
});
