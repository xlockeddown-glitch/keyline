import { useState } from "react";
import { X } from "lucide-react";
import { TIER_LABEL } from "@/game/data";
import { PAY_NOTES, lampPayRows, paintFromClears, paintOddsLine } from "@/game/vaultPay";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import { ItemIcon } from "./ItemIcon";
import { useSheetOpen } from "./useSheetOpen";

export function FieldGuide() {
  const open = useGame((s) => s.guideOpen);
  const toggleGuide = useGame((s) => s.toggleGuide);
  const replay = useGame((s) => s.replayTutorial);
  const clears = useGame((s) => s.correctByTier);
  const [askStuck, setAskStuck] = useState(false);
  useSheetOpen(open);
  if (!open) return null;
  const rows = lampPayRows();

  return (
    <div className="absolute inset-0 z-[720] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div
        className="panel sheet-bottom flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl sm:rounded-xl"
        role="dialog"
        aria-labelledby="field-guide-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Help</p>
            <h2 id="field-guide-title" className="font-display text-xl leading-tight">
              What a lamp pays
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-quiet size-11 p-0"
            onClick={() => {
              sfx.ui();
              toggleGuide(false);
            }}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-pretty text-fg-muted">
            A right answer on an ordinary question. Slow is over 10 seconds. Perfect is under 3. The bar is that coin band, drawn so a violet lamp can sit next to a white one.
          </p>
          <ul className="mt-3 grid gap-2">
            {rows.map((row) => {
              const mine = paintFromClears(clears[row.tier] ?? 0, row.paintIn);
              return (
              <li key={row.tier} className="pay-row">
                <div className="flex items-center gap-2">
                  <ItemIcon item={row.tier} size={28} />
                  <p className="min-w-0 flex-1 font-display text-lg leading-tight">{TIER_LABEL[row.tier]}</p>
                  <p className="shrink-0 text-xs text-fg-subtle">Recast {row.recast}</p>
                </div>
                <p className="mt-1 text-sm tabular-nums">
                  {row.slow.toLocaleString()}–{row.perfect.toLocaleString()} coin
                  <span className="text-fg-muted"> · paint {paintOddsLine(row.tier)}</span>
                </p>
                <div className="pay-track" aria-hidden>
                  <i
                    className={`pay-range tier-${row.tier}`}
                    style={{ left: `${row.barStart}%`, width: `${row.barWidth}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-pretty text-fg-muted">{row.extra}</p>
                {mine ? <p className="mt-1 text-xs tabular-nums text-fg">{mine}</p> : null}
              </li>
              );
            })}
          </ul>
          <div className="mt-4 grid gap-2">
            {PAY_NOTES.map((note) => (
              <p key={note} className="text-sm text-pretty text-fg-muted">
                {note}
              </p>
            ))}
          </div>
          {/* 0.0.95: what the lantern result's badges and emblems mean. */}
          <section className="mt-5" data-testid="help-badges">
            <h3 className="font-display text-lg leading-tight">Prize badges</h3>
            <ul className="badge-help mt-2 grid gap-1.5 text-sm">
              <li><span className="emb-badge is-market">🏮 ×2</span><span>Night market: everything on its street pays ×N.</span></li>
              <li><span className="emb-badge is-streak">🔥 5</span><span>Answer streak: right answers in a row (5 pays a white, 10 a blue).</span></li>
              <li><span className="emb-badge is-boost">⚡2</span><span>Boosts applied (charm, ride reward, scout ability). Tap it to see which.</span></li>
              <li><span className="badge-ico"><ItemIcon item="blue" size={22} /><b>↺</b></span><span>Perfect score: your match comes back.</span></li>
              <li><span className="badge-ico"><ItemIcon item="coin" size={22} /><b>↺</b></span><span>Match back, but the pocket was full, so coin instead.</span></li>
              <li><span className="badge-ico"><ItemIcon item="coin" size={20} /><ItemIcon item="white" size={20} /><ItemIcon item="brass" size={20} /><b>+N</b></span><span>Items earned: coin, matches, brass, ink, vellum, schematic, ingredient, paint.</span></li>
            </ul>
          </section>
        </div>
        <div className="shrink-0 border-t border-border px-5 py-3">
          {askStuck ? (
            <div className="flex items-center gap-2" data-testid="stuck-confirm">
              <p className="flex-1 text-sm">Back to the start? You keep everything.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  sfx.ui();
                  setAskStuck(false);
                  useGame.getState().unstick();
                }}
              >
                Yes
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setAskStuck(false)}>
                No
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost w-full" data-testid="stuck" onClick={() => setAskStuck(true)}>
              I'm stuck
            </button>
          )}
        </div>
        <footer className="flex shrink-0 gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            className="btn btn-ghost flex-1"
            onClick={() => {
              sfx.ui();
              replay();
            }}
          >
            Walkthrough
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => {
              sfx.ui();
              toggleGuide(false);
            }}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
