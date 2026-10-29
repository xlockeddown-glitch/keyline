/** 0.1.67: Journal · Places in the Progress-tab row style: summary bars, tap rows, compact lists. Screen only. */
import { useState } from "react";
import { CAT_LABEL, cotdAt } from "@/game/carPerks";
import { CITIES, KIND_LABEL, TIER_LABEL } from "@/game/data";
import { houseArt, houseList } from "@/game/houses";
import { MARKET_TAG } from "@/game/nightMarket";
import { useOwnedLamps } from "@/game/ownLampsClient";
import { SHOP_EVERY_MS, SHOP_NAME, SHOP_PAY, SHOP_PRICE } from "@/game/shop";
import { useGame } from "@/game/store";
import type { Poi, PoiKind } from "@/game/types";
import { sfx } from "@/game/audio";
import { ItemIcon } from "./ItemIcon";
import { MarketJournalRow, useMarket } from "./NightMarket";
import { OwnLampsSection, shortCoin } from "./OwnLamps";

const TIER_COUNT = 6;

export function BarRow({ title, have, need, sub, testid }: { title: string; have: number; need: number; sub?: string; testid?: string }) {
  const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 0;
  return (
    <li className="jr-row jr-bar-row" data-testid={testid}>
      <div className="jr-main">
        <p className="jr-title">{title}</p>
        {sub ? <p className="jr-sub">{sub}</p> : null}
        <span className="print-bar jr-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct}%` }} />
        </span>
      </div>
      <span className="jr-val tabular-nums">
        {have}/{need}
      </span>
    </li>
  );
}

export function TapRow({ title, sub, open, onTap, testid, value = "View" }: { title: string; sub?: string; open: boolean; onTap: () => void; testid?: string; value?: string }) {
  return (
    <li className="jr-row">
      <button
        type="button"
        className="jr-tap"
        aria-expanded={open}
        data-testid={testid}
        onClick={() => {
          sfx.ui();
          onTap();
        }}
      >
        <span className="jr-main">
          <span className="jr-title">{title}</span>
          {sub ? <span className="jr-sub">{sub}</span> : null}
        </span>
        <span className="jr-go">
          {open ? "Hide" : value} {open ? "▴" : "›"}
        </span>
      </button>
    </li>
  );
}

function groupOf(p: Poi): string {
  return KIND_LABEL[p.kind as PoiKind] ?? "Other";
}

function PoiRow({ p, known, marketLamp }: { p: Poi; known: boolean; marketLamp: boolean }) {
  return (
    <li className="hq-row jr-detail">
      <ItemIcon item={p.tier} size={36} />
      <div className="hq-row-copy">
        <p className="kicker">
          {p.kind === "shop" ? "Outfitter" : p.kind === "counter" ? "Counter" : p.kind === "board" ? "Notice" : `${TIER_LABEL[p.tier]} · ${KIND_LABEL[p.kind]}`}
          {p.printShop ? " · Print" : ""}
          {marketLamp ? <span className="market-x"> · {MARKET_TAG}</span> : null}
        </p>
        <p className="hq-row-title">
          {known ? p.name : p.kind === "shop" ? "Undiscovered outfitter" : p.kind === "counter" ? "Undiscovered counter" : p.kind === "board" ? "Undiscovered notice" : "Undiscovered lamp"}
        </p>
        <p className="hq-row-sub">
          {known
            ? p.lore
            : p.kind === "shop"
              ? "Look for the brass awning on the street."
              : p.kind === "counter"
                ? "A street counter. Get matches, open your daily crate, or trade matches."
                : p.kind === "board"
                  ? "A notice board. Pick up jobs and play the Daily Blitz."
                  : "Walk up to it to add it to Places."}
        </p>
      </div>
    </li>
  );
}

export function PlacesTab() {
  const cityId = useGame((s) => s.cityId);
  const atlas = useGame((s) => s.atlas);
  const houses = useGame((s) => s.houses);
  const shops = useGame((s) => s.shops);
  const city = CITIES[cityId];
  const homes = houseList(houses);
  const owned = useOwnedLamps();
  const { market } = useMarket(cityId);
  const [open, setOpen] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const toggle = (k: string) => setOpen((o) => (o === k ? null : k));
  const tiersOwned = new Set(owned.filter((o) => o.mine && !o.free).map((o) => o.tier)).size;
  const lit = city.pois.filter((p) => atlas[p.id]).length;
  const myHouse = homes.owned.find((h) => h.city === cityId);
  const myShop = shops[cityId];
  const groups = new Map<string, Poi[]>();
  for (const p of city.pois) groups.set(groupOf(p), [...(groups.get(groupOf(p)) ?? []), p]);
  const list = [...groups.entries()];
  const shown = more ? list : list.slice(0, 2);
  const hours = SHOP_EVERY_MS / 3_600_000;

  return (
    <ul className="jr-list" data-testid="places-tab">
      <li className="jr-row jr-cotd" data-testid="cotd-line">
        <span className="jr-title">Category of the day</span>
        <span className="cotd-badge">{CAT_LABEL[cotdAt(Date.now())]} +25%</span>
      </li>
      <li className="kicker jr-kicker">{city.name} summary</li>
      <BarRow title="Lanterns owned" have={tiersOwned} need={TIER_COUNT} testid="sum-lanterns" />
      <BarRow title="Places lit" have={lit} need={city.pois.length} testid="sum-places" />
      <TapRow
        title="House"
        testid="row-house"
        sub={myHouse ? `${myHouse.house.name} · ${myHouse.lot.name}` : `${homes.owned.length} owned · ${homes.forSale.length} lots for sale`}
        open={open === "house"}
        onTap={() => toggle("house")}
      />
      {open === "house" ? (
        <>
          <li className="kicker jr-kicker">Your houses</li>
          {homes.owned.length === 0 ? <li className="hq-row-sub">No houses yet. Each city has one lot for sale.</li> : null}
          {homes.owned.map((h) => (
            <li key={h.city} className="hq-row jr-detail">
              <img src={houseArt(h.house.id)} alt="" width={36} height={36} className="shrink-0 rounded object-cover" />
              <div className="hq-row-copy">
                <p className="hq-row-title">
                  {CITIES[h.city].name} · {h.house.name}
                </p>
                <p className="hq-row-sub">{h.lot.name}</p>
              </div>
            </li>
          ))}
          <li className="kicker jr-kicker">House lots for sale ({homes.forSale.length})</li>
          {homes.forSale.map((h) => (
            <li key={h.city} className="jr-row jr-mini">
              <span className="jr-title">
                {CITIES[h.city].name} · {h.lot.name}
              </span>
              <span className="jr-val tabular-nums">from {shortCoin(h.from)}</span>
            </li>
          ))}
        </>
      ) : null}
      <TapRow
        title={SHOP_NAME}
        testid="row-shop"
        sub={myShop ? `Yours · pays ${shortCoin(SHOP_PAY)} / ${hours} h` : `${shortCoin(SHOP_PRICE)} · pays ${shortCoin(SHOP_PAY)} / ${hours} h`}
        open={open === "shop"}
        onTap={() => toggle("shop")}
      />
      {open === "shop" ? (
        <li className="hq-row-sub jr-note">
          {myShop
            ? `Your ${SHOP_NAME} in ${city.name}. Walk to it on the map to collect the till.`
            : `One per city. Walk to the shop lot on the map to buy it for ${SHOP_PRICE.toLocaleString("en-US")} coin. It pays ${SHOP_PAY.toLocaleString("en-US")} every ${hours} h.`}
        </li>
      ) : null}
      <OwnLampsSection compact />
      <li className="kicker jr-kicker">Places in {city.name}</li>
      <MarketJournalRow />
      {shown.map(([g, ps]) => {
        const n = ps.filter((p) => atlas[p.id]).length;
        const k = `g:${g}`;
        return (
          <li key={g} className="jr-group">
            <button type="button" className="jr-tap" aria-expanded={open === k} data-testid={`group-${g}`} onClick={() => { sfx.ui(); toggle(k); }}>
              <span className="jr-main">
                <span className="jr-title">{g}</span>
                <span className="print-bar jr-bar" aria-hidden>
                  <i style={{ width: `${Math.round((n / ps.length) * 100)}%` }} />
                </span>
              </span>
              <span className="jr-val tabular-nums">
                {n}/{ps.length} {open === k ? "▴" : "›"}
              </span>
            </button>
            {open === k ? (
              <ul className="grid gap-2 pt-2">
                {ps.map((p) => (
                  <PoiRow key={p.id} p={p} known={Boolean(atlas[p.id])} marketLamp={Boolean(market?.street.lamps.includes(p.id))} />
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
      {list.length > 2 ? (
        <li>
          <button type="button" className="jr-more" aria-expanded={more} data-testid="places-more" onClick={() => setMore((m) => !m)}>
            {more ? "Show fewer ▴" : `+ ${list.length - 2} more ▾`}
          </button>
        </li>
      ) : null}
    </ul>
  );
}
