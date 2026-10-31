import { Fragment, useState } from "react";
import { X } from "lucide-react";
import { CITIES, cityShop } from "@/game/data";
import { TIERS, itemBlurb, itemName } from "@/game/items";
import { INGREDIENTS, isPaintId, type IngredientId } from "@/game/ingredients";
import { sfx } from "@/game/audio";
import { carOf } from "@/game/cars";
import { colorOf, parseCan } from "@/game/carPaint";
import { useGame } from "@/game/store";
import { vaultColorNote } from "@/game/vaultNote";
import { clothPerk } from "@/game/quests";
import { ItemIcon } from "./ItemIcon";
import { useSheetOpen } from "./useSheetOpen";

/**
 * 0.1.82: the satchel in the Journal row style: Matches, Paint (vault cans and car cans) and Keepsakes, each row taps
 * open in place. Brass, ink, vellum, schematics and press stock are cut, so the Stock grid, the Press stock list and the
 * detail pane below the fold are gone; a typical bag fits on one phone screen.
 */
export function Satchel() {
  const invOpen = useGame((s) => s.invOpen);
  const toggleInv = useGame((s) => s.toggleInv);
  const keys = useGame((s) => s.keys);
  const pantry = useGame((s) => s.pantry);
  const cityId = useGame((s) => s.cityId);
  const atlas = useGame((s) => s.atlas);
  const vaults = useGame((s) => s.vaults);
  const carCans = useGame((s) => s.carCans);
  const quests = useGame((s) => s.quests);
  const [open, setOpen] = useState<string | null>(null);
  const city = CITIES[cityId];
  const shop = cityShop(cityId)?.name ?? "the outfitter";

  useSheetOpen(invOpen);
  if (!invOpen) return null;

  const tap = (k: string) => {
    sfx.ui();
    setOpen((o) => (o === k ? null : k));
  };
  const paints = (Object.entries(pantry) as [IngredientId, number][]).filter(([id, n]) => n > 0 && isPaintId(id));
  const cans = [...new Set(carCans)];
  const glass = quests.cloths.includes("night-glass");

  return (
    <div className="absolute inset-0 z-[720] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div className="panel sheet-bottom flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <ItemIcon item="satchel" size={44} />
            <div>
              <p className="kicker">Field bag</p>
              <h2 className="font-display text-2xl leading-none">Satchel</h2>
            </div>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => toggleInv(false)} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4" data-testid="satchel-rows">
          <p className="kicker jr-kicker">Matches</p>
          <ul className="jr-list" data-testid="satchel-matches">
            {TIERS.map((t) => (
              <Fragment key={t}>
                <Row k={`m:${t}`} open={open} onTap={tap} icon={<ItemIcon item={t} size={24} />} title={itemName(t)} val={`×${keys[t] ?? 0}`} />
                {open === `m:${t}` ? (
                  <li className="hq-row-sub jr-note">
                    {itemBlurb(t)} {vaultColorNote(city.pois, t, city.name, atlas, vaults, Date.now())}
                  </li>
                ) : null}
              </Fragment>
            ))}
          </ul>

          <p className="kicker jr-kicker">Paint</p>
          <ul className="jr-list" data-testid="satchel-paint">
            {paints.map(([id, n]) => (
              <Fragment key={id}>
                <Row k={`p:${id}`} open={open} onTap={tap} icon={<i className={`jr-dot satchel-paint is-${id.slice(6)}`} />} title={INGREDIENTS[id].name} val={`×${n}`} />
                {open === `p:${id}` ? <li className="hq-row-sub jr-note">{INGREDIENTS[id].blurb} Mix it in the paint vat at {shop}: dyed coats and street-lamp colors.</li> : null}
              </Fragment>
            ))}
            {cans.map((id) => {
              const c = parseCan(id);
              const col = c ? colorOf(c.car, c.color) : null;
              if (!c || !col) return null;
              return (
                <Fragment key={id}>
                  <Row k={`c:${id}`} open={open} onTap={tap} icon={<i className="jr-dot" style={{ background: col.hex }} />} title={`${col.name} · ${carOf(c.car)?.name ?? "car"}`} val={`×${carCans.filter((x) => x === id).length}`} />
                  {open === `c:${id}` ? <li className="hq-row-sub jr-note">A car paint can. Bring it to a car lot to repaint a car you own.</li> : null}
                </Fragment>
              );
            })}
            {!paints.length && !cans.length ? (
              <li className="hq-row-sub jr-note">No paint yet. Lamps sometimes give a can in their color; amber and red vaults and the match cache can give car paint.</li>
            ) : null}
          </ul>

          <p className="kicker jr-kicker">Keepsakes</p>
          <ul className="jr-list" data-testid="satchel-keepsakes">
            <Row k="k:pattern" open={open} onTap={tap} icon={<i className="jr-dot satchel-paint is-violet" />} title="Violet pattern" val={`×${quests.patterns}`} />
            {open === "k:pattern" ? <li className="hq-row-sub jr-note">From the long quests. {glass ? "Night glass is already printed." : `One prints Night glass at ${shop}.`}</li> : null}
            <Row k="k:glass" open={open} onTap={tap} icon={<i className="jr-dot satchel-paint is-blue" />} title="Night glass" val={glass ? "Printed" : "Not yet"} />
            {open === "k:glass" ? <li className="hq-row-sub jr-note">A lamp cloth. {clothPerk("night-glass")}</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ k, open, onTap, icon, title, val }: { k: string; open: string | null; onTap: (k: string) => void; icon: React.ReactNode; title: string; val: string }) {
  return (
    <li className="jr-row jr-mini">
      <button type="button" className="jr-tap" aria-expanded={open === k} onClick={() => onTap(k)} data-testid={`satchel-row-${k}`}>
        {icon}
        <span className="jr-main"><span className="jr-title">{title}</span></span>
        <span className="jr-val tabular-nums">{val} {open === k ? "▴" : "›"}</span>
      </button>
    </li>
  );
}
