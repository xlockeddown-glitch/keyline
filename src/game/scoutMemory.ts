/**
 * 0.1.6: one worn scout per save, even with two tabs open. Every tab writes its whole save (on a timer, on hide,
 * on pagehide), and the `storage` listener only took the other tab's pocket and seen cards. A second tab that was
 * opened earlier (a gift link, a friend ticket, the home-screen app next to a browser tab) still held the old
 * scout and wrote it back, so the scout you had just put on (Beth B.'s gifted Corgi) came off on the next load.
 * Now a tab takes the other tab's worn scout, plus any scouts it owns, when that tab saves.
 */

/** The worn scout and owned scouts in a raw save string (another tab's write), or null. */
export function savedScout(raw: string | null | undefined, known: (id: string) => boolean): { scout: string; scouts: string[] } | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { version?: number; scout?: unknown; scouts?: unknown };
    if (!d || (d.version !== 1 && d.version !== 2)) return null;
    if (typeof d.scout !== "string" || !known(d.scout)) return null;
    const scouts = Array.isArray(d.scouts) ? d.scouts.filter((x): x is string => typeof x === "string" && known(x)) : [];
    return { scout: d.scout, scouts };
  } catch {
    return null;
  }
}

/**
 * What this tab should hold after another tab saved `theirs`. Returns null when nothing changes.
 * The worn scout is taken only when one of the two tabs owns it, so a bad write can't put on a scout nobody has.
 */
export function adoptScout(
  mine: { scout: string; scouts: readonly string[] },
  theirs: { scout: string; scouts: readonly string[] },
): { scout: string; scouts: string[] } | null {
  const scouts = Array.from(new Set([...mine.scouts, ...theirs.scouts]));
  const scout = scouts.includes(theirs.scout) ? theirs.scout : mine.scout;
  if (scout === mine.scout && scouts.length === mine.scouts.length) return null;
  return { scout, scouts };
}
