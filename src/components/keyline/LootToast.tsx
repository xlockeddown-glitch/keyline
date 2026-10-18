import { PERFECT_REFUND_LINE } from "@/game/perfectRefund";
import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import type { Tier } from "@/game/types";
import { DIFF_LABEL } from "@/game/triviaMeta";
import { streakPrize } from "@/game/goals";
import type { LootDrop } from "@/game/types";
import { ItemIcon, QtyChip } from "./ItemIcon";

export function LootToast() {
  const loot = useGame((s) => s.loot);
  const miss = useGame((s) => s.miss);
  const toast = useGame((s) => s.toast);
  const dismissLoot = useGame((s) => s.dismissLoot);
  const streak = useGame((s) => s.streak);

  const hold = loot ? (loot.grade === "perfect" ? 3600 : loot.grade === "great" ? 3200 : 2800) : 2600;

  useEffect(() => {
    if (!loot && !miss) return;
    const id = window.setTimeout(() => dismissLoot(), hold);
    return () => window.clearTimeout(id);
  }, [loot, miss, hold, dismissLoot]);

  if (!loot && !miss && !toast) return null;

  return (
    <>
      {loot || miss ? (
        <div className="pointer-events-none absolute inset-0 z-[850] flex items-center justify-center px-4 pb-32">
          <button
            type="button"
            className={`result-pop pointer-events-auto ${miss ? "is-miss" : "is-hit"}`}
            onClick={() => dismissLoot()}
            style={{ "--hold": `${hold}ms` } as React.CSSProperties}
          >
            {loot ? (
              <LootEmblems loot={loot} streak={streak} />
            ) : (
              <>
                <p className="kicker">Spent</p>
                <p className="font-display mt-1 text-3xl leading-none">Miss</p>
                <p className="mt-3 text-sm text-fg-muted">The match is spent. The trivia card read:</p>
                <p className="mt-1 text-base font-medium text-pretty">{miss!.answer}</p>
                {miss!.fact ? <p className="mt-2 text-xs text-fg-subtle text-pretty">{miss!.fact}</p> : null}
              </>
            )}
          </button>
        </div>
      ) : toast ? (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-[850] flex justify-center px-3">
          <div className="panel px-4 py-2 text-sm">{toast}</div>
        </div>
      ) : null}
    </>
  );
}
const RATING: Record<LootDrop["grade"], string> = { perfect: "Perfect!", great: "Great!", good: "Good" };

function still() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** 0.0.93: counts up from 0 (static when reduced motion is on). */
function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const [n, setN] = useState(() => (still() ? to : 0));
  useEffect(() => {
    if (still()) {
      setN(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (t: number) => {
      const k = Math.max(0, Math.min(1, (t - t0) / 700));
      setN(Math.round(to * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, delay]);
  return <>{n.toLocaleString()}</>;
}

function Jar() {
  return (
    <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden className="emb-jar">
      <rect x="9" y="4" width="14" height="5" rx="1.5" fill="#b9874b" />
      <path d="M8 10h16v15a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" fill="#e9d9b6" stroke="#6b4a24" strokeWidth="1.5" />
      <circle cx="16" cy="19" r="4" fill="#8a5a2b" />
    </svg>
  );
}

/** 0.0.93: the lantern result as emblems + amounts and a big rating word; essentials are badges, not sentences. */
export function LootEmblems({ loot, streak }: { loot: LootDrop; streak: number }) {
  type Emb = { key: string; title: string; node: React.ReactNode; amt?: React.ReactNode; cls?: string; testid?: string };
  const list: Emb[] = [];
  list.push({ key: "coin", title: `${loot.points} coin`, node: <ItemIcon item="coin" size={44} />, amt: <>+<CountUp to={loot.points} delay={120} /></>, cls: "is-coin" });
  for (const [t, n] of Object.entries(loot.keys) as [Tier, number][]) if (n) list.push({ key: t, title: `${n} ${t} match`, node: <ItemIcon item={t} size={26} />, amt: `×${n}` });
  if (loot.refund) {
    list.push(
      loot.refund.match
        ? { key: "back", title: PERFECT_REFUND_LINE, node: <ItemIcon item={loot.refund.tier} size={26} />, amt: "↺", cls: "is-back", testid: "perfect-refund" }
        : { key: "back", title: `${PERFECT_REFUND_LINE}: pocket full, +${loot.refund.coin} coin`, node: <ItemIcon item="coin" size={30} />, amt: <>↺ +{loot.refund.coin}</>, cls: "is-back is-full", testid: "perfect-refund" },
    );
  }
  if (loot.brass) list.push({ key: "brass", title: "brass", node: <ItemIcon item="brass" size={32} />, amt: `+${loot.brass}` });
  if (loot.ink) list.push({ key: "ink", title: "ink", node: <ItemIcon item="ink" size={32} />, amt: `+${loot.ink}` });
  if (loot.vellum) list.push({ key: "vellum", title: "vellum", node: <ItemIcon item="vellum" size={32} />, amt: `+${loot.vellum}` });
  if (loot.schematic) list.push({ key: "schem", title: "schematic", node: <ItemIcon item="schematic" size={32} />, amt: "+1" });
  if (loot.ingredient) list.push({ key: "ing", title: loot.ingredient.name, node: <Jar />, amt: "+1" });
  for (const c of [loot.paint, loot.extraPaint]) if (c) list.push({ key: c.id, title: c.name, node: <i className={`emb-paint paint-found is-${c.id.slice(6)}`} />, amt: "+1" });
  const hot = streakPrize(streak) ? streak : 0;
  return (
    <div className={`emb-wrap is-${loot.grade}`} aria-label={`${loot.grade}, ${DIFF_LABEL[loot.diff] ?? ""}, +${loot.points} coin`}>
      {loot.grade === "perfect" ? (
        <span className="emb-burst" aria-hidden>
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ "--a": `${i * 36}deg` } as React.CSSProperties} />
          ))}
        </span>
      ) : null}
      <p className="emb-rating font-display" data-testid="loot-rating">{RATING[loot.grade]}</p>
      <div className="emb-badges">
        {loot.market ? (
          <span className="emb-badge is-market" data-testid="market-reward" title={`Night market ×${loot.market.mult} · ${loot.market.street}`}>
            🏮 ×{loot.market.mult}
          </span>
        ) : null}
        {hot ? (
          <span className="emb-badge is-streak" data-testid="loot-streak" title={`${hot} in a row`}>
            🔥 {hot}
          </span>
        ) : null}
        {loot.boosts?.length ? (
          <span className="emb-badge is-boost" title={loot.boosts.join(" · ")}>
            ⚡{loot.boosts.length}
          </span>
        ) : null}
      </div>
      <div className="emb-row">
        {list.map((e, i) => (
          <span key={e.key} className={`emb ${e.cls ?? ""}`} title={e.title} data-testid={e.testid} style={{ animationDelay: `${120 + i * 90}ms` }}>
            {e.node}
            {e.amt ? <b className="emb-amt tabular-nums">{e.amt}</b> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
