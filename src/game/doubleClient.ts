/** 0.1.44: the new player's double-coin hour on the client (the server decides; this only shows the note). */
import { useEffect, useState, useSyncExternalStore } from "react";

let until = 0;
const subs = new Set<() => void>();

export function setDoubleUntil(ms: number) {
  until = ms > Date.now() ? ms : 0;
  subs.forEach((f) => f());
}

/** Minutes left of double rewards (0 when none). Ticks every 20 s. */
export function useDoubleMinutes(): number {
  const end = useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => until,
    () => 0,
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!end) return;
    const t = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => window.clearInterval(t);
  }, [end]);
  return end > now ? Math.ceil((end - now) / 60_000) : 0;
}
