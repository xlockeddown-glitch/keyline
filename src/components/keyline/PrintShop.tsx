import { cityShop, SCOUTS } from "@/game/data";
import { CATALOGUE, owing, payable, priceLine, quotePrice, type Cosmetic, type CosmeticSlot } from "@/game/cosmetics";
import { vaultPinHtml } from "@/game/pins";
import { useGame } from "@/game/store";
import { PUBLISH_STAMP } from "@/version";
import { ItemIcon } from "./ItemIcon";
import { PaintVat } from "./PaintVat";
import { PRESS_PULL_PRICE, pressOffer, pullBaseOwned } from "@/game/pressPull";
import { buyPressPull } from "@/game/pressClient";
import { PAINT_USE } from "@/game/paint";

// 0.0.99: warm amber glass so the metal reads; the wrapper's data-lantern re-cases this lamp exactly like the street ones.
const LAMP = vaultPinHtml({ tier: "amber" });

function LampSwatch({ skin, label }: { skin: string; label: string }) {
  return (
    <div className="skin-swatch" data-lantern={skin} data-testid={`vault-skin-${skin}`} title={label} aria-hidden>
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
  const paints = useGame((s) => s.paints);

  const section = (slot: CosmeticSlot, title: string, lede: string) => {
    const items = CATALOGUE.filter((c) => c.slot === slot);
    const stockWorn =
      slot === "coat" ? worn(slot) === null && !paints.wornCoat : worn(slot) === null && !paints.wornVault;
    return (
      <section className="grid gap-2" data-testid={`print-${slot}`}>
        <p className="kicker mt-2">{title}</p>
        <p className="text-sm text-pretty text-fg-muted">{lede}</p>
        <div className="hq-row" data-item={slot === "coat" ? "stock-coat" : "stock-lantern"}>
          {slot === "coat" ? <CoatSwatch coat={null} /> : <LampSwatch skin="brass" label="Stock steel and brass" />}
          <div className="hq-row-copy">
            <p className="hq-row-title">
              {slot === "coat" ? `${SCOUTS[scout].name}'s own coat` : "Steel and brass"}
              {stockWorn ? <span className="ml-2 kicker">Wearing</span> : null}
            </p>
            <p className="hq-row-sub">{slot === "coat" ? "The coat every walker starts in." : "Steel case, brass trim. What every vault starts as."}</p>
            {stockWorn || !counter ? null : (
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
          const wearing =
            slot === "coat" ? !paints.wornCoat && worn(slot) === c.id : !paints.wornVault && worn(slot) === c.id;
          const paid = wardrobe.paid[c.id] ?? { white: 0, blue: 0 };
          const left = owing(wardrobe, c.id);
          const take = payable(wardrobe, keys, c.id);
          const bill = quotePrice(wardrobe, c.id);
          const total = bill.white + bill.blue;
          const done = total - left.white - left.blue;
          return (
            <div key={c.id} className="hq-row" data-item={c.id}>
              {slot === "coat" ? <CoatSwatch coat={c.id} /> : <LampSwatch skin={c.id} label={`Preview · ${c.name}`} />}
              <div className="hq-row-copy">
                <p className="hq-row-title">
                  <span className="coat-chip" style={{ background: c.swatch }} aria-hidden />
                  {c.name}
                  {wearing ? <span className="ml-2 kicker">Wearing</span> : owned ? <span className="ml-2 kicker">Owned</span> : null}
                </p>
                <p className="hq-row-sub">{c.blurb}</p>
                {owned ? null : (
                  <div className="mt-2 grid gap-1.5">
                    <Price c={{ ...c, price: bill }} paidW={paid.white} paidB={paid.blue} />
                    {done > 0 ? (
                      <div className="paid-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={`${done} of ${total} keys paid`}>
                        <i style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                    ) : null}
                  </div>
                )}
                <div className="hq-row-actions">
                  {owned && counter ? (
                    <button
                      type="button"
                      className={`btn ${wearing ? "btn-primary" : "btn-ghost"} px-3 text-xs`}
                      onClick={() => wearCosmetic(slot, wearing ? null : c.id)}
                    >
                      {wearing ? "Take off" : "Wear"}
                    </button>
                  ) : owned ? (
                    <p className="text-xs text-fg-subtle">{wearing ? "Wearing." : shop ? `Put it on at ${shop.name}` : "Put it on at the outfitter"}</p>
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
      <figure className="print-front">
        <img src={`/sprites/print-shop.png?v=${PUBLISH_STAMP}`} alt="" />
      </figure>
      <WeeklyPull />
      {counter ? (
        <div className="hq-row items-center">
          <div className="hq-row-copy">
            <p className="hq-row-title">Your pocket</p>
            <p className="hq-row-sub">Pay for prints with keys. You can pay a little at a time; the shop remembers what you've paid.</p>
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
      {section("coat", "Coats", "A new coat for your character. It only changes how you look.")}
      {section("lantern", "Vault skins", "A new metal case for every street vault. The dial, the numeral and the slot keep their color, so you can still tell which key it takes. The drawing on each row is the preview.")}
      <PaintVat counter={counter} />
      {counter ? <NightPress /> : null}
    </div>
  );
}

/** 0.1.153: one recolor a week. Same offer for everyone. Coin only, and only if you own the coat or the vault skin. */
function WeeklyPull() {
  const points = useGame((s) => s.points);
  const wardrobe = useGame((s) => s.wardrobe);
  const paints = useGame((s) => s.paints);
  const offer = pressOffer(Date.now());
  const base = pullBaseOwned(wardrobe.owned, offer.job);
  const have = (offer.job === "coat" ? paints.coats : paints.vaults).includes(offer.color);
  const short = base && !have && points < PRESS_PULL_PRICE;
  const name = PAINT_USE[offer.color].name.replace(/ paint$/, "");
  const title = offer.job === "coat" ? `${name} coat` : `${name} vault`;
  return (
    <section className="grid gap-2" data-testid="press-pull">
      <p className="kicker mt-2">This week&apos;s pull</p>
      <div className="hq-row items-center">
        {offer.job === "coat" ? <CoatSwatch coat={`dye-${offer.color}`} /> : <LampSwatch skin={`paint-${offer.color}`} label={title} />}
        <div className="hq-row-copy">
          <p className="hq-row-title">
            {title}
            {have ? <span className="ml-2 kicker">Yours</span> : null}
          </p>
          <p className="hq-row-sub" data-testid="press-pull-note">
            {!base
              ? offer.job === "coat"
                ? "Own a coat first. The pull dyes one you already have."
                : "Own a vault skin first. The pull paints a case you already have."
              : have
                ? "Yours for good. It does not change pay."
                : short
                  ? "Need 25,000 coin."
                  : "One look until Monday. Miss the week and this one is gone."}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-quiet shrink-0"
          data-testid="press-pull-buy"
          data-short={short ? "1" : undefined}
          disabled={have}
          onClick={() => void buyPressPull()}
        >
          {have ? "Yours" : "Buy · 25,000"}
        </button>
      </div>
    </section>
  );
}

/** 0.1.22: charms are retired; the press only prints Night glass now (0.1.82: from the violet pattern alone). */
function NightPress() {
  const quests = useGame((s) => s.quests);
  const printNight = useGame((s) => s.printPattern);
  if (quests.patterns < 1 || quests.cloths.includes("night-glass")) return null;
  return (
    <section className="grid gap-2">
      <p className="kicker mt-2">Press</p>
      <div className="hq-row">
        <div className="hq-row-copy">
          <p className="hq-row-title">Night glass ×{quests.patterns}</p>
          <p className="hq-row-sub">Spends the violet pattern. Nothing else needed.</p>
          <div className="hq-row-actions">
            <button type="button" className="btn btn-quiet px-3 text-xs" onClick={() => printNight()}>
              Print
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
