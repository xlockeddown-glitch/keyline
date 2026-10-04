/**
 * 0.0.58: one anti-repeat memory per save, even with two tabs open. Each tab keeps the save's seen card ids in
 * memory and wrote them back whole, so a second tab (a friend-ticket link, a gift link) neither knew what the first
 * had just been dealt nor kept it: the two dealt each other's cards within a few turns. Before every deal and on
 * every `storage` event the tab folds the saved list into its own.
 */

/**
 * `mine` (oldest first) with anything only in `theirs` folded in ahead of it, capped to the newest `keep`.
 * Returns `mine` itself when there is nothing to fold in, so callers can skip a no-op update.
 */
export function mergeSeen(theirs: readonly unknown[] | null | undefined, mine: readonly string[], keep: number): readonly string[] {
  const have = new Set(mine);
  const extra: string[] = [];
  for (const x of theirs ?? []) {
    if (typeof x !== "string" || !x || have.has(x)) continue;
    have.add(x);
    extra.push(x);
  }
  if (!extra.length) return mine;
  return [...extra, ...mine].slice(-keep);
}

/** The seen lists in a raw save string (another tab's write), or null. */
export function savedSeen(raw: string | null | undefined): { seenIds: string[]; asked: string[] } | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { version?: number; seenIds?: unknown; asked?: unknown };
    if (!d || (d.version !== 1 && d.version !== 2)) return null;
    const strs = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : []);
    return { seenIds: strs(d.seenIds), asked: strs(d.asked) };
  } catch {
    return null;
  }
}
