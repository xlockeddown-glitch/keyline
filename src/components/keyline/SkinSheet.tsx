import { useEffect } from "react";
import { X } from "lucide-react";
import { sfx } from "@/game/audio";
import { SKINS, skinOwned, skinShown } from "@/game/skins";
import { useGame } from "@/game/store";
import { walletLive } from "@/game/walletClient";
import { ItemIcon } from "./ItemIcon";
import { useSheetOpen } from "./useSheetOpen";

/** 0.1.61: draws the worn (or previewed) skin onto the page root, where the map and HUD accents read it. */
export function SkinSync() {
  const chosen = useGame((s) => s.mapSkin);
  const owned = useGame((s) => s.skins);
  const preview = useGame((s) => s.skinPreview);
  const shown = skinShown(chosen, owned, preview);
  useEffect(() => {
    document.documentElement.dataset.mapSkin = shown;
  }, [shown]);
  return null;
}

/** 0.1.61 Skins sheet: try any skin on the live map, wear an owned one, buy a paid one (signed in). */
export function SkinSheet() {
  const open = useGame((s) => s.skinsOpen);
  const setOpen = useGame((s) => s.setSkinsOpen);
  const owned = useGame((s) => s.skins);
  const chosen = useGame((s) => s.mapSkin);
  const preview = useGame((s) => s.skinPreview);
  const points = useGame((s) => s.points);
  const tryOn = useGame((s) => s.previewSkin);
  const wear = useGame((s) => s.wearSkin);
  const buy = useGame((s) => s.buySkin);
  useSheetOpen(open);
  if (!open) return null;
  const live = walletLive();
  const shown = skinShown(chosen, owned, preview);

  return (
    <div className="absolute inset-x-0 bottom-0 z-[700] flex justify-center sm:p-6" data-testid="skin-sheet">
      <div className="panel sheet-bottom flex max-h-[60dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
          <div>
            <p className="kicker">Map skins</p>
            <p className="mt-1 text-sm text-fg-muted">Tap one to try it on the map.</p>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => setOpen(false)} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <ul className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto px-4 py-3">
          {SKINS.map((s) => {
            const mine = skinOwned(s.id, owned);
            const wearing = chosen === s.id && mine;
            const short = points < s.price;
            return (
              <li key={s.id} className={`skin-card${shown === s.id ? " is-on" : ""}`} data-testid={`skin-${s.id}`}>
                <button type="button" className="skin-try" onClick={() => tryOn(s.id)} aria-label={`Try ${s.name}`}>
                  <span className="skin-swatch" style={{ background: `linear-gradient(135deg, ${s.swatch[0]} 55%, ${s.swatch[1]} 56%)` }} />
                  <span className="font-display text-base leading-tight">{s.name}</span>
                  <span className="text-xs text-fg-muted">{s.blurb}</span>
                </button>
                {wearing ? (
                  <span className="skin-tag">Wearing</span>
                ) : mine ? (
                  <button type="button" className="btn btn-primary px-3 text-xs" data-testid={`skin-wear-${s.id}`} onClick={() => { sfx.ui(); wear(s.id); }}>
                    Wear
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`btn ${live && !short ? "btn-primary" : "btn-quiet"} px-3 text-xs`}
                    data-testid={`skin-buy-${s.id}`}
                    disabled={!live || short}
                    onClick={() => buy(s.id)}
                  >
                    <ItemIcon item="coin" size={14} /> {live ? (short ? `Need ${(s.price - points).toLocaleString("en-US")}` : s.price.toLocaleString("en-US")) : "Sign in to buy"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
