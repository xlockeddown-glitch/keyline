import { PAINT_COLORS, PAINT_DROP_IN, ULTRA_DROP_IN, paintId } from "@/game/ingredients";
import { PAINT_USE, type PaintJob } from "@/game/paint";
import type { PaintColor } from "@/game/ingredients";
import { useGame } from "@/game/store";

/**
 * The vat. A vault sometimes drops a can of its own colour — rarer colours, much less often.
 * Prism can drop from any colour, about 1 in 10,000. A coat and the street vaults take a set number.
 */
export function PaintVat() {
  const pantry = useGame((s) => s.pantry);
  const paints = useGame((s) => s.paints);
  const mix = useGame((s) => s.mixPaint);
  const wear = useGame((s) => s.wearPaint);

  const jobButton = (color: PaintColor, job: PaintJob) => {
    const use = PAINT_USE[color];
    const need = use[job];
    const owned = job === "coat" ? paints.coats.includes(color) : paints.vaults.includes(color);
    const on = job === "coat" ? paints.wornCoat === color : paints.wornVault === color;
    const have = pantry[paintId(color)] ?? 0;
    const label = job === "coat" ? "Coat" : "Vaults";
    if (!owned) {
      return (
        <button type="button" className={`btn px-3 text-xs ${have >= need ? "btn-primary" : "btn-quiet"}`} onClick={() => mix(color, job)}>
          {label} · {need}
        </button>
      );
    }
    return (
      <button type="button" className={`btn px-3 text-xs ${on ? "btn-primary" : "btn-ghost"}`} onClick={() => wear(job, on ? null : color)}>
        {on ? `Wearing ${label.toLowerCase()}` : `Wear ${label.toLowerCase()}`}
      </button>
    );
  };

  return (
    <section className="grid gap-2" data-testid="paint-vat">
      <p className="kicker mt-2">The vat</p>
      <p className="text-sm text-pretty text-fg-muted">
        A vault sometimes drops a can of its own colour. White is common. Each colour after that drops much less often, and red and violet almost never do. Prism can drop from any colour, about 1 in {ULTRA_DROP_IN.toLocaleString()}. A coat and the street vaults each take a set number of that colour. The glass still shows what the lamp costs.
      </p>
      {PAINT_COLORS.map((color) => {
        const use = PAINT_USE[color];
        const have = pantry[paintId(color)] ?? 0;
        return (
          <div key={color} className="hq-row" data-paint={color}>
            <span className={`paint-can is-${color}`} aria-hidden />
            <div className="hq-row-copy">
              <p className="hq-row-title">
                {use.name} <span className="tabular-nums text-fg-muted">×{have}</span>
              </p>
              <p className="hq-row-sub">
                {color === "prism" ? `1 in ${ULTRA_DROP_IN.toLocaleString()}. Any vault.` : `1 in ${PAINT_DROP_IN[color]}.`} Coat {use.coat}. Vaults {use.vault}.
              </p>
              <div className="hq-row-actions">
                {jobButton(color, "coat")}
                {jobButton(color, "vault")}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
