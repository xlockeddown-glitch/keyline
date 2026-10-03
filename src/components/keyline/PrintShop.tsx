import { cityShop, SCOUTS } from "@/game/data";
import { CATALOGUE, owing, payable, priceLine, type Cosmetic, type CosmeticSlot } from "@/game/cosmetics";
import { vaultPinHtml } from "@/game/pins";
import { useGame } from "@/game/store";
import { ItemIcon } from "./ItemIcon";

const LAMP = vaultPinHtml({ tier: "blue" });

function LampSwatch({ skin }: { skin: string }) {
  return (
    <div className="skin-swatch" data-lantern={skin} aria-hidden>
      <div dangerouslySetInnerHTML={{ __html: LAMP }} />
    </div>
  );
}

function CoatSwatch({ coat }: { coat: string | null }) {
  const scout = useGame((s) => s.scout);
  return (
    <div className="scout-hire" aria-hidden>
      <span className="scout-marker is-idle" data-scout={scout} {...(coat ? { "data-coat": coat } : {})} data-row="0" data-col="0" />
    </div>
  );
}

function Price({ c, paidW, paidB }: { c: Cosmetic; paidW: number; paidB: number }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-fg-muted">
      {c.price.white ? (
        <span className="inline-flex items-center gap-1">
          <ItemIcon item="white" size={12} />
          {paidW ? `${paidW}/` : ""}
          {c.price.white} white
        </span>
      ) : null}
      {c.price.blue ? (
        <span className="inline-flex items-center gap-1">
          <ItemIcon item="blue" size={12} />
          {paidB ? `${paidB}/` : ""}
          {c.price.blue} blue
        </span>
      ) : null}
    </span>
  );
}

/**
 * The print shop's coats and lantern skins (0.0.45). `counter` = standing at the outfitter, where items are
 * ordered and paid for in white and blue matches; elsewhere (the Journal) owned items can still be put on
 * and taken off, and the rest show where to order them.
 */
export function PrintShop({ counter }: { counter: boolean }) {
  const wardrobe = useGame((s) => s.wardrobe);
  const keys = useGame((s) => s.keys);
  const scout = useGame((s) => s.scout);
  const cityId = useGame((s) => s.cityId);
  const payCosmetic = useGame((s) => s.payCosmetic);
  const wearCosmetic = useGame((s) => s.wearCosmetic);
  const shop = cityShop(cityId);
  const worn = (slot: CosmeticSlot) => (slot === "coat" ? wardrobe.coat : wardrobe.lantern);

  const section = (slot: CosmeticSlot, title: string, lede: string) => {
    const items = CATALOGUE.filter((c) => c.slot === slot);
    const stockWorn = worn(slot) === null;
    return (
      <section className="grid gap-2" data-testid={`print-${slot}`}>
        <p className="kicker mt-2">{title}</p>
        <p className="text-sm text-pretty text-fg-muted">{lede}</p>
        <div className="hq-row" data-item={slot === "coat" ? "stock-coat" : "stock-lantern"}>
          {slot === "coat" ? <CoatSwatch coat={null} /> : <LampSwatch skin="brass" />}
          <div className="hq-row-copy">
            <p className="hq-row-title">
              {slot === "coat" ? `${SCOUTS[scout].name}'s own coat` : "Brass"}
              {stockWorn ? <span className="ml-2 kicker">Wearing</span> : null}
            </p>
            <p className="hq-row-sub">{slot === "coat" ? "The coat every walker starts in." : "The city's own lamps: brass caps and posts."}</p>
            {stockWorn ? null : (
              <div className="hq-row-actions">
                <button type="button" className="btn btn-ghost px-3 text-xs" onClick={() => wearCosmetic(slot, null)}>
                  {slot === "coat" ? "Back to own coat" : "Back to brass"}
                </button>
              </div>
            )}
          </div>
        </div>
        {items.map((c) => {
          const owned = wardrobe.owned.includes(c.id);
          const wearing = worn(slot) === c.id;
          const paid = wardrobe.paid[c.id] ?? { white: 0, blue: 0 };
          const left = owing(wardrobe, c.id);
          const take = payable(wardrobe, keys, c.id);
          const total = c.price.white + c.price.blue;
          const done = total - left.white - left.blue;
          return (
            <div key={c.id} className="hq-row" data-item={c.id}>
              {slot === "coat" ? <CoatSwatch coat={c.id} /> : <LampSwatch skin={c.id} />}
              <div className="hq-row-copy">
                <p className="hq-row-title">
                  <span className="coat-chip" style={{ background: c.swatch }} aria-hidden />
                  {c.name}
                  {wearing ? <span className="ml-2 kicker">Wearing</span> : owned ? <span className="ml-2 kicker">Owned</span> : null}
                </p>
                <p className="hq-row-sub">{c.blurb}</p>
                {owned ? null : (
                  <div className="mt-2 grid gap-1.5">
                    <Price c={c} paidW={paid.white} paidB={paid.blue} />
                    {done > 0 ? (
                      <div className="paid-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={`${done} of ${total} matches paid`}>
                        <i style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                    ) : null}
                  </div>
                )}
                <div className="hq-row-actions">
                  {owned ? (
                    <button
                      type="button"
                      className={`btn ${wearing ? "btn-primary" : "btn-ghost"} px-3 text-xs`}
                      onClick={() => wearCosmetic(slot, wearing ? null : c.id)}
                    >
                      {wearing ? "Take off" : "Wear"}
                    </button>
                  ) : counter ? (
                    take.white + take.blue > 0 ? (
                      <button type="button" className="btn btn-primary px-3 text-xs" onClick={() => payCosmetic(c.id)}>
                        {take.white === left.white && take.blue === left.blue ? `Buy · ${priceLine(take)}` : `Pay in ${priceLine(take)}`}
                      </button>
                    ) : (
                      <p className="text-xs text-fg-subtle">Needs {priceLine(left)} — none in the pocket.</p>
                    )
                  ) : (
                    <p className="text-xs text-fg-subtle">{shop ? `Order at ${shop.name}` : "Order at the outfitter"}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    );
  };

  return (
    <div className="grid gap-3" data-testid="print-shop">
      {counter ? (
        <div className="hq-row items-center">
          <div className="hq-row-copy">
            <p className="hq-row-title">Your pocket</p>
            <p className="hq-row-sub">Prints are paid in matches, a few at a time if you like — the shop keeps what you've paid against each item.</p>
          </div>
          <span className="inline-flex items-center gap-3 text-sm tabular-nums">
            <span className="inline-flex items-center gap-1">
              <ItemIcon item="white" size={16} />
              {keys.white}
            </span>
            <span className="inline-flex items-center gap-1">
              <ItemIcon item="blue" size={16} />
              {keys.blue}
            </span>
          </span>
        </div>
      ) : null}
      {section("coat", "Coats", "Dyed and re-cut for whoever you walk as. Every character wears it, walking and standing. Looks only — no perk.")}
      {section("lantern", "Lantern skins", "Re-cases every street lamp in a new metal. The glass keeps its match colour, so a lamp's cost still reads at a glance.")}
    </div>
  );
}
