/**
 * 0.0.58: repeat counting for a sequence of dealt cards (oldest first). A repeat at k is a card id dealt again
 * within the previous `w` deals. `deal-repeats` passes when no window up to MIN_GAP has a repeat (or, for a pool
 * smaller than that, when every gap is at least the pool's size).
 */
export const MIN_GAP = 50;

export function repeatsWithin(ids, w) {
  let n = 0;
  ids.forEach((id, k) => {
    for (let j = Math.max(0, k - w); j < k; j++) if (ids[j] === id) return void n++;
  });
  return n;
}

export function shortestGap(ids) {
  const last = new Map();
  let best = Infinity;
  ids.forEach((id, k) => {
    if (last.has(id)) best = Math.min(best, k - last.get(id));
    last.set(id, k);
  });
  return best;
}

export function repeatVerdict(label, ids, pool = Infinity) {
  const need = Math.min(MIN_GAP, pool);
  const gap = shortestGap(ids);
  const row = { label, deals: ids.length, distinct: new Set(ids).size, r10: repeatsWithin(ids, 10), r25: repeatsWithin(ids, 25), r50: repeatsWithin(ids, 50), shortestGap: gap === Infinity ? null : gap };
  const problems = gap < need ? [`${label}: a card came back after ${gap} deal${gap === 1 ? "" : "s"} (want ≥ ${need})`] : [];
  return { row, problems };
}
