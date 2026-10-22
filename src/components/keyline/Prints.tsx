import { useEffect, useRef } from "react";
import { create } from "zustand";
import { PRINTS_PENDING } from "@/game/cityPrints";
import { CITIES } from "@/game/data";
import { fetchPrints } from "@/game/printApi";
import type { PrintRow } from "@/game/printsServer";
import { popMatch, useGame } from "@/game/store";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";

/** 0.0.99: the signed-in player's city-print progress as the server last reported it. */
export const usePrints = create<{ rows: PrintRow[] | null }>(() => ({ rows: null }));

const km = (m: number) => Math.floor(m / 1000).toLocaleString("en-US");
const cityName = (id: string) => (CITIES as Record<string, { name: string }>)[id]?.name ?? id;

/** New earns pop once each (the 0.0.98 pop queue holds them until any card or sheet closes). */
export function celebratePrints(rows: PrintRow[]) {
  const st = useGame.getState();
  const fresh = rows.filter((r) => r.earned && !st.printsSeen.includes(r.id));
  if (!fresh.length) return;
  const top = fresh[fresh.length - 1]!;
  useGame.setState({ printsSeen: [...st.printsSeen, ...fresh.map((r) => r.id)] });
  popMatch({ kind: "print", big: "City print earned!", sub: `${top.name} · ${cityName(top.city)}. Wear it from the Journal.`, tiers: [], coin: 0 });
}

export function PrintSync() {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const userId = !isPending && user ? user.id : null;
  const points = useGame((s) => s.points);
  const last = useRef(0);
  useEffect(() => {
    if (!userId) {
      usePrints.setState({ rows: null });
      return;
    }
    const wait = Math.max(3000, 30_000 - (Date.now() - last.current));
    const t = window.setTimeout(async () => {
      last.current = Date.now();
      try {
        const rows = await fetchPrints();
        usePrints.setState({ rows });
        const worn = useGame.getState().printWorn;
        if (worn && !rows.some((r) => r.id === worn && r.earned)) useGame.setState({ printWorn: null });
        celebratePrints(rows);
      } catch {
        /* offline: keep the last rows */
      }
    }, last.current ? wait : 600);
    return () => window.clearTimeout(t);
  }, [userId, points]);
  return null;
}

function Bar({ have, need, label }: { have: number; need: number; label: string }) {
  const pct = Math.min(100, Math.round((have / need) * 100));
  return (
    <div className="print-leg">
      <span className="print-leg-label">{label}</span>
      <span className="print-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

/** Journal: one card per print with both legs, and Wear / Take off once earned. */
export function PrintPanel() {
  const rows = usePrints((s) => s.rows);
  const worn = useGame((s) => s.printWorn);
  return (
    <div className="print-panel" data-testid="print-panel">
      <p className="kicker">City prints</p>
      <p className="mt-1 text-xs text-fg-muted">Coat patterns you can only earn in their city: right answers there plus kilometers walked there. Looks only; wear on any scout.</p>
      {!rows ? (
        <p className="mt-2 text-xs text-fg-subtle">Sign in to track city prints.</p>
      ) : (
        <ul className="mt-2 grid gap-2">
          {rows.map((r) => (
            <li key={r.id} className={`print-card ${r.earned ? "is-earned" : ""}`}>
              <span className="print-swatch" style={{ background: r.swatch }} aria-hidden />
              <div className="print-body">
                <p className="print-name">
                  {r.name} <span className="print-city">· {cityName(r.city)}</span>
                </p>
                <Bar have={r.correct} need={r.needCorrect} label={`${Math.min(r.correct, r.needCorrect)}/${r.needCorrect} right`} />
                <Bar have={r.meters} need={r.needMeters} label={`${km(Math.min(r.meters, r.needMeters))}/${km(r.needMeters)} km walked`} />
              </div>
              {r.earned ? (
                <button type="button" className="lvl-btn" onClick={() => useGame.setState({ printWorn: worn === r.id ? null : r.id })}>
                  {worn === r.id ? "Take off" : "Wear"}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-fg-subtle">Coming soon: {PRINTS_PENDING.map(cityName).join(", ")}.</p>
    </div>
  );
}
