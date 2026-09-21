import { useState } from "react";
import { X } from "lucide-react";
import { CHARMS, CITIES, TIER_LABEL, allPois } from "@/game/data";
import {
  MATERIAL_LIST,
  TIERS,
  isCharm,
  isMaterial,
  isTier,
  itemBlurb,
  itemName,
  type ItemId,
} from "@/game/items";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import type { CharmId } from "@/game/types";
import { CostIcons, ItemIcon } from "./ItemIcon";

export function Satchel() {
  const invOpen = useGame((s) => s.invOpen);
  const toggleInv = useGame((s) => s.toggleInv);
  const toggleHq = useGame((s) => s.toggleHq);
  const keys = useGame((s) => s.keys);
  const brass = useGame((s) => s.brass);
  const ink = useGame((s) => s.ink);
  const vellum = useGame((s) => s.vellum);
  const schematics = useGame((s) => s.schematics);
  const charms = useGame((s) => s.charms);
  const equipped = useGame((s) => s.equipped);
  const equip = useGame((s) => s.equip);
  const cityId = useGame((s) => s.cityId);
  const atlas = useGame((s) => s.atlas);
  const vaults = useGame((s) => s.vaults);
  const blanks = useGame((s) => s.blanks);
  const [sel, setSel] = useState<ItemId>("blue");
  const city = CITIES[cityId];
  const lamps = allPois(city, blanks);
  const have = { brass, ink, vellum, schematics };

  if (!invOpen) return null;

  function pick(id: ItemId) {
    sfx.ui();
    setSel(id);
  }

  const count = countOf(sel, keys, have, charms);
  const charm = isCharm(sel) ? CHARMS[sel] : null;

  return (
    <div className="absolute inset-0 z-[720] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div className="panel flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
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

        <div className="grid min-h-0 flex-1 overflow-y-auto sm:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="flex flex-col gap-5 px-5 py-4">
            <section>
              <p className="kicker mb-2">Matches</p>
              <ul className="grid grid-cols-6 gap-2">
                {TIERS.map((t) => (
                  <li key={t}>
                    <Slot
                      item={t}
                      qty={keys[t]}
                      selected={sel === t}
                      onClick={() => pick(t)}
                    />
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p className="kicker mb-2">Stock</p>
              <ul className="grid grid-cols-4 gap-2">
                {MATERIAL_LIST.map((m) => (
                  <li key={m.id}>
                    <Slot
                      item={m.id}
                      qty={m.id === "schematic" ? schematics : have[m.id]}
                      selected={sel === m.id}
                      onClick={() => pick(m.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <p className="kicker mb-2">Charms</p>
              <ul className="grid grid-cols-4 gap-2">
                {(Object.keys(CHARMS) as CharmId[]).map((id) => (
                  <li key={id}>
                    <Slot
                      item={id}
                      qty={charms.includes(id) ? 1 : 0}
                      selected={sel === id}
                      equipped={equipped === id}
                      locked={!charms.includes(id)}
                      onClick={() => pick(id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="border-t border-border bg-bg-subtle/40 px-5 py-4 sm:border-l sm:border-t-0">
            <div className="flex items-start gap-3">
              <ItemIcon item={sel} size={64} />
              <div>
                <p className="kicker">{isTier(sel) ? "Match" : isMaterial(sel) ? "Stock" : "Charm"}</p>
                <h3 className="font-display text-xl leading-tight">{itemName(sel)}</h3>
                <p className="mt-1 text-sm tabular-nums text-fg-muted">
                  {isCharm(sel)
                    ? charms.includes(sel)
                      ? equipped === sel
                        ? "Equipped"
                        : "In the bag"
                      : "Not printed"
                    : `${count} carried`}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-pretty text-fg-muted">{itemBlurb(sel)}</p>

            {isTier(sel) ? (
              <ul className="mt-4 grid gap-1.5">
                {lamps.filter((p) => p.tier === sel).length === 0 ? (
                  <li className="text-xs text-fg-subtle">No {TIER_LABEL[sel].toLowerCase()} lamps in {city.name}.</li>
                ) : (
                  lamps
                    .filter((p) => p.tier === sel)
                    .map((p) => {
                      const cool = (vaults[p.id]?.coolUntil ?? 0) > Date.now();
                      const known = Boolean(atlas[p.id]);
                      return (
                        <li key={p.id} className="text-sm text-fg">
                          <span className="text-fg-muted">{known ? p.name : "Undiscovered lamp"}</span>
                          {cool ? <span className="ml-2 text-xs text-fg-subtle">recasting</span> : null}
                        </li>
                      );
                    })
                )}
              </ul>
            ) : null}

            {charm ? (
              <div className="mt-4 grid gap-3">
                <CostIcons cost={charm.cost} have={have} />
                {charms.includes(sel as CharmId) ? (
                  <button
                    type="button"
                    className={`btn ${equipped === sel ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => equip(equipped === sel ? null : (sel as CharmId))}
                  >
                    {equipped === sel ? "Unequip" : "Equip"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => {
                      toggleInv(false);
                      toggleHq(true);
                    }}
                  >
                    Print at HQ
                  </button>
                )}
              </div>
            ) : null}

            {isMaterial(sel) ? (
              <p className="mt-4 text-xs text-fg-subtle">Spent at the print shop to make charms. Tab opens HQ.</p>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Slot({
  item,
  qty,
  selected,
  equipped,
  locked,
  onClick,
}: {
  item: ItemId;
  qty: number;
  selected: boolean;
  equipped?: boolean;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`item-slot ${selected ? "is-on" : ""} ${locked ? "is-locked" : ""}`}
      aria-pressed={selected}
      aria-label={`${itemName(item)}${qty ? `, ${qty}` : ""}`}
    >
      <ItemIcon item={item} size={36} />
      {equipped ? <span className="item-eq">On</span> : null}
      {!locked && !isCharm(item) ? <span className="item-qty tabular-nums">{qty}</span> : null}
    </button>
  );
}

function countOf(
  id: ItemId,
  keys: Record<string, number>,
  have: { brass: number; ink: number; vellum: number; schematics: number },
  charms: CharmId[],
) {
  if (isTier(id)) return keys[id] ?? 0;
  if (id === "brass") return have.brass;
  if (id === "ink") return have.ink;
  if (id === "vellum") return have.vellum;
  if (id === "schematic") return have.schematics;
  if (isCharm(id)) return charms.includes(id) ? 1 : 0;
  return 0;
}
