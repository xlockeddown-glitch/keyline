/** 0.1.42: owned lanterns. 0.1.115: no longer for sale; owners keep theirs. */
import { useState } from "react";
import { CITIES, CITY_LIST, TIER_LABEL } from "@/game/data";
import { placeGiftLamp, useLampGifts, useOwnedLamps } from "@/game/ownLampsClient";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import type { CityId, Tier } from "@/game/types";

/** Short coin: 600000 -> 600k, 2000000 -> 2M. */
export const shortCoin = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(n));

/**
 * Journal · Places: your owned vaults. 0.1.115 (Ryan): street vaults can no longer be bought; vaults bought before
 * stay yours (and keep paying), and a gifted free vault can still be placed. Nothing shows when there's nothing owned.
 */
export function OwnLampsSection({ compact = false }: { compact?: boolean } = {}) {
  const owned = useOwnedLamps();
  const cityId = useGame((s) => s.cityId);
  const gifts = useLampGifts();
  const [pick, setPick] = useState<Tier | null>(null);
  const [city, setCity] = useState<CityId>(cityId);
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState("");
  const taken = new Set(owned.map((o) => o.poi));
  const lamps = pick ? CITIES[city].pois.filter((p) => p.tier === pick && p.kind !== "station" && !taken.has(p.id)) : [];
  const mine = owned.filter((o) => o.mine);
  if (!mine.length && !gifts.length) return null;
  const nameOf = (o: (typeof owned)[number]) => CITIES[o.city as CityId]?.pois.find((p) => p.id === o.poi)?.name ?? "Your vault";

  const picker = pick ? (
    <li className="own-pick grid gap-2 rounded-lg border border-border p-3" data-testid="own-pick">
      <p className="hq-row-title">Pick a {TIER_LABEL[pick]} vault · free gift</p>
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
      {lamps.length === 0 ? <p className="hq-row-sub">No free {TIER_LABEL[pick]} vaults in {CITIES[city].name}. Try another city.</p> : null}
      <ul className="grid gap-1">
        {lamps.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 text-sm">{p.name}</span>
            <button
              type="button"
              className="btn min-h-11 shrink-0 px-3 text-sm"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void placeGiftLamp(p.id, pick).then((msg) => {
                  setBusy(false);
                  setLine(msg);
                  if (msg.endsWith("is yours.")) {
                    sfx.craft();
                    setPick(null);
                  }
                });
              }}
            >
              Place
            </button>
          </li>
        ))}
      </ul>
    </li>
  ) : null;

  return (
    <>
      <li className={compact ? "kicker jr-kicker" : "kicker"}>Your vaults</li>
      {compact ? null : <li className="hq-row-sub">When a visitor misses at your vault, you get half its value.</li>}
      {mine.map((o) => (
        <li key={o.poi} className={`hq-row own-row tier-${o.tier}`} data-testid={o.free ? `own-free-${o.tier}` : `own-${o.tier}`}>
          <span className={`own-dot tier-${o.tier}`} aria-hidden />
          <div className="hq-row-copy">
            <p className="hq-row-title">
              {nameOf(o)} · {CITIES[o.city as CityId]?.name ?? ""}
            </p>
            <p className="hq-row-sub">{o.free ? `Your free ${TIER_LABEL[o.tier]} vault (a gift)` : `Your ${TIER_LABEL[o.tier]} vault`}</p>
          </div>
        </li>
      ))}
      {gifts.map((t) => (
        <li key={`gift-${t}`} className={`hq-row own-row own-gift tier-${t}`} data-testid={`own-gift-${t}`}>
          <span className={`own-dot tier-${t}`} aria-hidden />
          <div className="hq-row-copy">
            <p className="hq-row-title">Free {TIER_LABEL[t]} vault: pick one</p>
            <p className="hq-row-sub">A gift. Place it on any free {TIER_LABEL[t]} vault.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary min-h-11 shrink-0 px-3 text-sm"
            aria-expanded={pick === t}
            onClick={() => {
              sfx.ui();
              setLine("");
              setPick(pick === t ? null : t);
            }}
          >
            {pick === t ? "Close" : "Pick a vault"}
          </button>
        </li>
      ))}
      {picker}
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
      {o.mine ? "Your vault" : `Owned by ${o.name}`}
    </p>
  );
}
