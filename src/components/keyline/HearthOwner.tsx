/** 0.1.111: "Your Hearth": the owner's numbers for their placed vault (opens, cut vs the daily cap, V keys, lifetime). */
import { CITIES } from "@/game/data";
import { FACET_COLOR } from "@/game/hearthVaults";
import { hearthPinHtml } from "@/game/pins";
import { HEARTH_CUT, PLANT_NAMES } from "@/game/placedLantern";
import { setPlant, usePlant } from "@/game/plantClient";
import { TRIVIA_CATS } from "@/game/triviaMeta";
import { ItemIcon } from "./ItemIcon";

const n = (x: number) => x.toLocaleString("en-US");

function Bar({ have, need }: { have: number; need: number }) {
  return (
    <span className="ho-bar" role="progressbar" aria-valuenow={have} aria-valuemin={0} aria-valuemax={need}>
      <i style={{ width: `${Math.min(100, Math.round((have / Math.max(1, need)) * 100))}%` }} />
    </span>
  );
}

export function HearthOwner() {
  const p = usePlant();
  const mine = p.me.mine;
  if (!p.ownerOpen || !mine) return null;
  const s = p.me.stats ?? { today: { opens: 0, coin: 0, keys: 0 }, total: { opens: 0, coin: 0, keys: 0 }, cap: 1000 };
  const opensCap = Math.floor(s.cap / HEARTH_CUT);
  const name = PLANT_NAMES[mine.name] ?? "Your vault";
  const city = CITIES[mine.city as keyof typeof CITIES]?.name ?? mine.city;
  const label = (c: string) => TRIVIA_CATS.find((t) => t.id === c)?.label ?? c;
  return (
    <section className="hearth-owner" role="dialog" aria-label="Your Hearth" data-testid="hearth-owner">
      <button type="button" className="ho-x" aria-label="Close" onClick={() => setPlant({ ownerOpen: false })}>
        ×
      </button>
      <div className="ho-head">
        <span className="ho-art" dangerouslySetInnerHTML={{ __html: hearthPinHtml(name, mine.cats, FACET_COLOR) }} />
        <div className="min-w-0">
          <p className="kicker ho-kicker">
            <span className="ho-wide">Your Hearth vault</span>
            <span className="ho-narrow">Your Hearth</span>
          </p>
          <h2 className="ho-title">
            {name}
            <span className="ho-wide"> · {city}</span>
          </h2>
          <p className="ho-sub">
            <span className="ho-wide">Fields: {mine.cats.map(label).join(" · ")}</span>
            <span className="ho-narrow">{city}</span>
          </p>
        </div>
      </div>
      <div className="ho-row">
        <span>
          <span className="ho-wide">Visitor opens today</span>
          <span className="ho-narrow">Opens today</span>
        </span>
        <b className="tabular-nums" data-testid="ho-opens">
          {s.today.opens} / {opensCap}
        </b>
      </div>
      <Bar have={s.today.opens} need={opensCap} />
      <div className="ho-row">
        <span>
          <span className="ho-wide">Your cut today ({HEARTH_CUT} coin each)</span>
          <span className="ho-narrow">Cut today</span>
        </span>
        <b className="tabular-nums" data-testid="ho-cut">
          {n(s.today.coin)} / {n(s.cap)}
          <span className="ho-wide"> coin</span>
        </b>
      </div>
      <Bar have={s.today.coin} need={s.cap} />
      <div className="ho-row">
        <span>
          <span className="ho-wide">V keys from visitors (1 in 10)</span>
          <span className="ho-narrow">V keys today</span>
        </span>
        <b className="ho-keys">
          <ItemIcon item="red" size={18} />×{s.today.keys}
          <span className="ho-wide"> today</span>
        </b>
      </div>
      <div className="ho-row ho-life">
        <span>Lifetime</span>
        <b className="tabular-nums" data-testid="ho-life">
          <span className="ho-wide">
            {n(s.total.opens)} opens · {n(s.total.coin)} coin · {s.total.keys} V keys
          </span>
          <span className="ho-narrow">
            {n(s.total.opens)} · {n(s.total.coin)} · {s.total.keys} V
          </span>
        </b>
      </div>
      <p className="ho-foot ho-wide">
        Your own opens pay normal V pay but no cut. New accounts (under 3 days or 25 right answers) don't pay a cut. One paid open per visitor a day.
      </p>
    </section>
  );
}
