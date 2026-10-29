/** 0.1.42: owned lanterns, release 1 (placeholder look; real art is a later release). */
import { Fragment, useState } from "react";
import { CITIES, CITY_LIST, TIER_LABEL } from "@/game/data";
import { OWN_PRICE } from "@/game/ownLamps";
import { buyLamp, useLampGifts, useOwnedLamps } from "@/game/ownLampsClient";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import type { CityId, Tier } from "@/game/types";

/** Short coin: 600000 -> 600k, 2000000 -> 2M. */
export const shortCoin = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(n));

const TIERS: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];

/** Journal · Places: one lantern per color; pick any unowned lamp of that color. */
export function OwnLampsSection({ compact = false }: { compact?: boolean } = {}) {
  const owned = useOwnedLamps();
  const cityId = useGame((s) => s.cityId);
  const points = useGame((s) => s.points);
  const gifts = useLampGifts();
  const [pick, setPick] = useState<Tier | null>(null);
  /** 0.1.43: the open picker places a gift lantern (free) rather than buying one. */
  const [free, setFree] = useState(false);
  const [city, setCity] = useState<CityId>(cityId);
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState("");
  const taken = new Set(owned.map((o) => o.poi));
  const lamps = pick ? CITIES[city].pois.filter((p) => p.tier === pick && p.kind !== "station" && !taken.has(p.id)) : [];

  const picker = pick ? (
        <li className="own-pick grid gap-2 rounded-lg border border-border p-3" data-testid="own-pick">
          <p className="hq-row-title">Pick a {TIER_LABEL[pick]} lamp · {free ? "free gift" : `${OWN_PRICE[pick].toLocaleString("en-US")} coins`}</p>
          <label className="hq-row-sub flex items-center gap-2">
            City
            <select className="min-h-11 rounded border border-border bg-bg px-2" value={city} onChange={(e) => setCity(e.target.value as CityId)}>
              {CITY_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {lamps.length === 0 ? <p className="hq-row-sub">No free {TIER_LABEL[pick]} lamps in {CITIES[city].name}. Try another city.</p> : null}
          <ul className="grid gap-1">
            {lamps.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 text-sm">{p.name}</span>
                <button
                  type="button"
                  className="btn min-h-11 shrink-0 px-3 text-sm"
                  disabled={busy || (!free && points < OWN_PRICE[pick])}
                  onClick={() => {
                    setBusy(true);
                    void buyLamp(p.id, pick, free).then((msg) => {
                      setBusy(false);
                      setLine(msg);
                      if (msg.endsWith("is yours.")) {
                        sfx.craft();
                        setPick(null);
                        setFree(false);
                      }
                    });
                  }}
                >
                  {free ? "Place" : "Buy"}
                </button>
              </li>
            ))}
          </ul>
          {!free && points < OWN_PRICE[pick] ? <p className="hq-row-sub">Need {(OWN_PRICE[pick] - points).toLocaleString("en-US")} more coins.</p> : null}
        </li>
      ) : null;

  return (
    <>
      {compact ? <li className="kicker jr-kicker">Lanterns · tap a row to pick a lamp</li> : <li className="kicker">Your lanterns</li>}
      {compact ? null : <li className="hq-row-sub">Own one lamp of each color. When a visitor misses there, you get half its value.</li>}
      {TIERS.map((t) => {
        const mine = owned.find((o) => o.mine && !o.free && o.tier === t);
        const poi = mine ? CITIES[mine.city as CityId]?.pois.find((p) => p.id === mine.poi) : null;
        if (compact) {
          const on = pick === t && !free;
          return (
            <Fragment key={t}>
              <li className={`jr-row own-row tier-${t}`} data-testid={`own-${t}`}>
                <button
                  type="button"
                  className="jr-tap"
                  disabled={Boolean(mine)}
                  aria-expanded={mine ? undefined : on}
                  onClick={() => {
                    sfx.ui();
                    setLine("");
                    setFree(false);
                    setPick(on ? null : t);
                  }}
                >
                  <span className={`own-dot tier-${t}`} aria-hidden />
                  <span className="jr-main">
                    <span className="jr-title">{TIER_LABEL[t]}</span>
                    {mine ? <span className="jr-sub">Yours · {poi?.name ?? "Your lamp"} · {CITIES[mine.city as CityId]?.name ?? ""}</span> : null}
                  </span>
                  <span className="jr-val tabular-nums">{mine ? "Owned" : `${shortCoin(OWN_PRICE[t])} ${on ? "▴" : "›"}`}</span>
                </button>
              </li>
              {on ? picker : null}
            </Fragment>
          );
        }
        return (
          <li key={t} className={`hq-row own-row tier-${t}`} data-testid={`own-${t}`}>
            <span className={`own-dot tier-${t}`} aria-hidden />
            <div className="hq-row-copy">
              <p className="hq-row-title">{mine ? `${poi?.name ?? "Your lamp"} · ${CITIES[mine.city as CityId]?.name ?? ""}` : `${TIER_LABEL[t]} lantern`}</p>
              <p className="hq-row-sub tabular-nums">{mine ? `Your ${TIER_LABEL[t]} lantern` : `${OWN_PRICE[t].toLocaleString("en-US")} coins`}</p>
            </div>
            {mine ? null : (
              <button
                type="button"
                className="btn btn-quiet min-h-11 shrink-0 px-3 text-sm"
                aria-expanded={pick === t && !free}
                onClick={() => {
                  sfx.ui();
                  setLine("");
                  setFree(false);
                  setPick(pick === t && !free ? null : t);
                }}
              >
                {pick === t && !free ? "Close" : "Pick a lamp"}
              </button>
            )}
          </li>
        );
      })}
      {owned
        .filter((o) => o.mine && o.free)
        .map((o) => (
          <li key={`free-${o.poi}`} className={`hq-row own-row tier-${o.tier}`} data-testid={`own-free-${o.tier}`}>
            <span className={`own-dot tier-${o.tier}`} aria-hidden />
            <div className="hq-row-copy">
              <p className="hq-row-title">
                {CITIES[o.city as CityId]?.pois.find((p) => p.id === o.poi)?.name ?? "Your lamp"} · {CITIES[o.city as CityId]?.name ?? ""}
              </p>
              <p className="hq-row-sub">Your free {TIER_LABEL[o.tier]} lantern (a gift)</p>
            </div>
          </li>
        ))}
      {gifts.map((t) => (
        <li key={`gift-${t}`} className={`hq-row own-row own-gift tier-${t}`} data-testid={`own-gift-${t}`}>
          <span className={`own-dot tier-${t}`} aria-hidden />
          <div className="hq-row-copy">
            <p className="hq-row-title">Free {TIER_LABEL[t]} lantern: pick a lamp</p>
            <p className="hq-row-sub">A gift. It's extra: you can still buy your own {TIER_LABEL[t]}.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary min-h-11 shrink-0 px-3 text-sm"
            aria-expanded={pick === t && free}
            onClick={() => {
              sfx.ui();
              setLine("");
              const open = pick === t && free;
              setFree(!open);
              setPick(open ? null : t);
            }}
          >
            {pick === t && free ? "Close" : "Pick a lamp"}
          </button>
        </li>
      ))}
      {compact && !free ? null : picker}
      {line ? (
        <li className="hq-row-sub" aria-live="polite">
          {line}
        </li>
      ) : null}
    </>
  );
}

/** The owner's name plate on an owned lamp's card (placeholder look). */
export function OwnerPlate({ poiId }: { poiId: string }) {
  const o = useOwnedLamps().find((x) => x.poi === poiId);
  if (!o) return null;
  return (
    <p className={`own-plate tier-${o.tier}`} data-testid="own-plate">
      {o.mine ? "Your lantern" : `${o.name}'s lantern`}
    </p>
  );
}
