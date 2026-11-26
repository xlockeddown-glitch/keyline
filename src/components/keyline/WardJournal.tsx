import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { wardGoalLine, wardView } from "@/game/wardCircuit";

/**
 * 0.1.184 Ward Circuit in the Journal's Goals tab: one plain line for today's circuit in the current city, signed
 * in only, and only when the city has a circuit today. Everything here is the server's ledger count (store.ward).
 */
export function WardJournal() {
  const ward = useGame((s) => s.ward);
  const cityId = useGame((s) => s.cityId);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const v = ward ? wardView(ward, cityId, now) : null;
  if (!v) return null;
  return (
    <div data-testid="journal-ward">
      <p className="kicker">Ward Circuit</p>
      <p className="mt-1 text-xs text-fg-muted" data-testid="ward-progress">
        {wardGoalLine(v)}
      </p>
    </div>
  );
}
