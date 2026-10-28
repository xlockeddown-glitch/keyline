import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { sfx } from "@/game/audio";
import { SHOP_CAP, SHOP_NAME, SHOP_PAY, SHOP_PRICE, formatWait, shopArt, shopOutput } from "@/game/shop";
import { useGame } from "@/game/store";
import { ItemIcon } from "./ItemIcon";
import { useSheetOpen } from "./useSheetOpen";

/** 0.1.59 Lantern Shop sheet: for sale (buy), or your shop with the till and the next-ready countdown. */
export function LanternSheet() {
  const open = useGame((s) => s.lanternOpen);
  const close = useGame((s) => s.setLanternOpen);
  const cityId = useGame((s) => s.cityId);
  const points = useGame((s) => s.points);
  const shop = useGame((s) => s.shops[s.cityId]);
  const buy = useGame((s) => s.buyShop);
  const collect = useGame((s) => s.collectShop);
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useSheetOpen(open);
  useEffect(() => {
    if (!open) return;
    setConfirm(false);
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [open]);
  if (!open) return null;
  const out = shop ? shopOutput(shop.anchor, now) : null;
  const short = points < SHOP_PRICE;
  const pay = `${SHOP_PAY.toLocaleString("en-US")} coins every 4 hours`;

  return (
    <div className="absolute inset-0 z-[700] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6" data-testid="lantern-sheet">
      <div className="panel sheet-bottom flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">{shop ? "Your shop" : "Shop for sale"}</p>
            <h2 className="font-display text-2xl">{SHOP_NAME}</h2>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              Makes {pay}. The till holds up to {SHOP_CAP} payouts ({(SHOP_PAY * SHOP_CAP).toLocaleString("en-US")} coins), so drop by a few times a day.
            </p>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => close(false)} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <img className="house-art" src={shopArt} alt="" width={480} height={360} />
          {shop && out ? (
            <div className="mt-3 flex items-center justify-between gap-3" data-testid="shop-till">
              <div className="text-sm">
                <p className="flex items-center gap-1.5 font-semibold tabular-nums">
                  <ItemIcon item="coin" size={16} />
                  {out.coin.toLocaleString("en-US")} in the till · {out.n}/{SHOP_CAP}
                </p>
                <p className="text-fg-muted tabular-nums" data-testid="shop-next">
                  {out.n >= SHOP_CAP ? "Till is full. Collect to keep it working." : `Next ${SHOP_PAY.toLocaleString("en-US")} in ${formatWait(out.readyAt - now)}.`}
                </p>
              </div>
              <button
                type="button"
                className={`btn ${out.n ? "btn-primary" : "btn-quiet"} shrink-0 px-4 text-sm`}
                data-testid="shop-collect"
                disabled={!out.n}
                onClick={() => {
                  sfx.ui();
                  collect(cityId);
                }}
              >
                {out.n ? "Collect" : "Not yet"}
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                <ItemIcon item="coin" size={16} />
                {SHOP_PRICE.toLocaleString("en-US")}
              </p>
              {confirm ? (
                <span className="flex gap-2" data-testid="shop-confirm">
                  <button type="button" className="btn btn-quiet px-3 text-xs" onClick={() => setConfirm(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary px-3 text-xs"
                    data-testid="shop-buy-yes"
                    onClick={() => {
                      buy(cityId);
                      setConfirm(false);
                    }}
                  >
                    Pay {SHOP_PRICE.toLocaleString("en-US")}
                  </button>
                </span>
              ) : (
                <button type="button" className={`btn ${short ? "btn-quiet" : "btn-primary"} px-4 text-sm`} data-testid="shop-buy" disabled={short} onClick={() => setConfirm(true)}>
                  {short ? `Need ${(SHOP_PRICE - points).toLocaleString("en-US")} more` : "Buy"}
                </button>
              )}
            </div>
          )}
          <p className="mt-4 text-xs text-fg-subtle">Sign in to buy. One shop per city, yours for good. The clock runs on the server; what waits past a full till is lost.</p>
        </div>
      </div>
    </div>
  );
}
