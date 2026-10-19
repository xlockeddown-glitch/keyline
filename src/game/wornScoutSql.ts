/**
 * 0.1.6 worn scout upsert, kept apart from the server function so a test can run it on PGLite.
 * Params: $1 user_id, $2 scout, $3 worn_at (ms). The newer equip wins; replaying the same equip (same worn_at)
 * or a late write from a slower device (older worn_at) changes nothing, so a retry is safe.
 */
export const WORN_UPSERT = `
  insert into worn_scouts (user_id, scout, worn_at, updated_at)
  values ($1, $2, $3, now())
  on conflict (user_id) do update set
    scout = excluded.scout,
    worn_at = excluded.worn_at,
    updated_at = now()
  where worn_scouts.worn_at < excluded.worn_at
`;

export const WORN_SELECT = `select scout, worn_at from worn_scouts where user_id = $1 limit 1`;

export type Worn = { scout: string; at: number };

export function wornFromRow(r: { scout?: unknown; worn_at?: unknown } | undefined): Worn | null {
  if (!r || typeof r.scout !== "string" || !r.scout) return null;
  return { scout: r.scout, at: Number(r.worn_at) || 0 };
}

/**
 * On sign-in: the account's worn scout wins when this device owns it (owned lists are merged from the server
 * first). Returns the scout to put on, or null to keep the local one (no row, unknown scout, not owned).
 */
export function pickWorn(local: { scout: string; scouts: readonly string[] }, server: Worn | null): string | null {
  if (!server || server.scout === local.scout) return null;
  return local.scouts.includes(server.scout) ? server.scout : null;
}
