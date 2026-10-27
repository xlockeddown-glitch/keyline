import { useEffect, useState } from "react";
import { bakedSnapshot } from "@/game/streets";
import { CARS } from "@/game/cars";
import { STREET_DAY_CAP } from "@/game/streetSpots";
import { MAGNET_DAY_CAP, MAGNET_GAP_MS, V2L_DAY_CAP, CAR_PERKS, CAT_BONUS_CAP, CAT_LABEL, COTD_BONUS, FAV_BONUS, FAV_BOTH, SCOUT_FAV } from "@/game/carPerks";
import { X } from "lucide-react";
import { SCOUT_LIST, TIER_LABEL } from "@/game/data";
import { PAY_NOTES, lampPayRows, paintFromClears, paintOddsLine } from "@/game/vaultPay";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import { ItemIcon } from "./ItemIcon";
import { useSheetOpen } from "./useSheetOpen";
import { HOUSES, KEY_MATCHES } from "@/game/houses";
import { OWN_DAILY_CAP, OWN_PRICE } from "@/game/ownLamps";
import { WELCOME_COIN } from "@/game/lampGift";

const fmt = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${n / 1000}k` : String(n));
const TIERS = ["white", "blue", "green", "amber", "red", "violet"] as const;

export function FieldGuide() {
  const open = useGame((s) => s.guideOpen);
  const toggleGuide = useGame((s) => s.toggleGuide);
  const replay = useGame((s) => s.replayTutorial);
  const clears = useGame((s) => s.correctByTier);
  const [askStuck, setAskStuck] = useState(false);
  const cityId = useGame((s) => s.cityId);
  const [mapDate, setMapDate] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    let live = true;
    void bakedSnapshot(cityId).then((d) => live && setMapDate(d));
    return () => {
      live = false;
    };
  }, [open, cityId]);
  useSheetOpen(open);
  if (!open) return null;
  const rows = lampPayRows();

  return (
    <div className="absolute inset-0 z-[720] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div
        className="panel sheet-bottom flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl sm:rounded-xl"
        role="dialog"
        aria-labelledby="field-guide-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Help</p>
            <h2 id="field-guide-title" className="font-display text-xl leading-tight">
              What a lamp pays
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-quiet size-11 p-0"
            onClick={() => {
              sfx.ui();
              toggleGuide(false);
            }}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-pretty text-fg-muted">
            Answer right to earn coin. Answer in under 3 seconds for the most coin. Taking over 10 seconds pays the least. Each bar shows a lamp's coin, so you can compare colors.
          </p>
          <ul className="mt-3 grid gap-2">
            {rows.map((row) => {
              const mine = paintFromClears(clears[row.tier] ?? 0, row.paintIn);
              return (
              <li key={row.tier} className="pay-row">
                <div className="flex items-center gap-2">
                  <ItemIcon item={row.tier} size={28} />
                  <p className="min-w-0 flex-1 font-display text-lg leading-tight">{TIER_LABEL[row.tier]}</p>
                  <p className="shrink-0 text-xs text-fg-subtle">Lights again in {row.recast}</p>
                </div>
                <p className="mt-1 text-sm tabular-nums">
                  {row.slow.toLocaleString()}–{row.perfect.toLocaleString()} coin
                  <span className="text-fg-muted"> · {paintOddsLine(row.tier)} chance of paint</span>
                </p>
                <div className="pay-track" aria-hidden>
                  <i
                    className={`pay-range tier-${row.tier}`}
                    style={{ left: `${row.barStart}%`, width: `${row.barWidth}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-pretty text-fg-muted">{row.extra}</p>
                {mine ? <p className="mt-1 text-xs tabular-nums text-fg">{mine}</p> : null}
              </li>
              );
            })}
          </ul>
          <div className="mt-4 grid gap-2">
            {PAY_NOTES.map((note) => (
              <p key={note} className="text-sm text-pretty text-fg-muted">
                {note}
              </p>
            ))}
          </div>
          <p className="mt-4 text-sm text-pretty text-fg" data-testid="help-hold">Tap to walk somewhere; press and hold (or Shift+click) to add a stop.</p>
          {/* 0.1.13: the map's buttons and keys. */}
          <section className="mt-5" data-testid="help-keys">
            <h3 className="font-display text-lg leading-tight">Map controls</h3>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              The crosshair under + and − puts the map back on you. On a keyboard: WASD or arrows to walk, E or Space to open the nearest lamp, C to center on you, F for a cab or your car, T at the station for the train board, I for your satchel, Tab for HQ, Esc to close or cancel a route.
            </p>
          </section>
          {/* 0.0.95: city passes in plain words. */}
          <section className="mt-5" data-testid="help-pass">
            <h3 className="font-display text-lg leading-tight">City passes</h3>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              1 pass unlocks a new city (your second city is free). Earn a pass by lighting amber, red or violet lamps (amber 1 point, red 4, violet 10; 10 points = 1 pass), by finishing “All of” a city, or by doing 3 Lantern Runs in one city. Spend it at the train station: “Use pass”.
            </p>
          </section>
          {/* 0.1.8: cars in plain words. */}
          <section className="mt-5" data-testid="help-cars">
            <h3 className="font-display text-lg leading-tight">Cars</h3>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              Each city has a car lot on the map. Walk in to buy a car with coin. Your car is your own cab: tap Car and it's at the curb, and it drives a little faster than the city cab (5% for the Civic up to 30% for the Roadster 2.0). In your own car you can open lamps and vaults and grab matches from the curb; the city cab parks you first, and shops, the car lot and your house are on foot. You pay once and keep the car in every city.
            </p>
            <p className="mt-1 text-sm text-pretty text-fg-muted" data-testid="help-car-perks">
              Each car has a perk that works while you sit in it: {CARS.map((c) => `${c.name.replace(/^Used /, "")}: ${CAR_PERKS[c.id].label.split(" · ").pop()}`).join("; ")}. The Magnet pulls at most one match every {MAGNET_GAP_MS / 1000} s and {MAGNET_DAY_CAP} a day per city, inside the usual {STREET_DAY_CAP} street matches a day. Vehicle-to-load pays its white match on at most {V2L_DAY_CAP} lamps a day, and Autopilot never stacks on the Fox's struck option. A coat with the same kind of perk doesn't add to it; the better one counts.
            </p>
          </section>
          <section className="mt-5" data-testid="help-categories">
            <h3 className="font-display text-lg leading-tight">Category boosts</h3>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              Every coat and car has a favorite category: a right answer in it pays +{Math.round(FAV_BONUS * 100)}% coin (coats when worn, cars while you sit in them), or +{Math.round(FAV_BOTH * 100)}% when your coat and car both favor it. Each day one category of the day pays +{Math.round(COTD_BONUS * 100)}% and is always offered (gold badge). Boosts add up to at most +{Math.round(CAT_BONUS_CAP * 100)}%, on lamp coin only.
            </p>
            {/* 0.1.47: each coat's favorite, so the Panda (Music) shows up here too. */}
            <p className="mt-1 text-sm text-pretty text-fg-muted" data-testid="help-coat-favs">
              Coat favorites: {SCOUT_LIST.map((s) => `${s.name.replace(/^The /, "")} ${CAT_LABEL[SCOUT_FAV[s.id]]}`).join(", ")}. The Panda's Bamboo luck pays a right lamp's coin twice, 1 in 15 lamps.
            </p>
          </section>
          {/* 0.1.44: houses, owned lanterns, train stops, a new player's first hour. */}
          <section className="mt-5" data-testid="help-houses">
            <h3 className="font-display text-lg leading-tight">Houses</h3>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              Each city has one house lot. Walk in to buy: {HOUSES.map((h) => `${h.name} ${fmt(h.price)}`).join(", ")}. One house per city; stepping up costs only the difference. Once a day per city, light 3 lamps there and turn the key for {KEY_MATCHES} matches of the house's color plus coins ({HOUSES.map((h) => `${h.name} ${h.keyCoin.toLocaleString("en-US")}`).join(", ")}). Journal · Places lists your houses.
            </p>
          </section>
          <section className="mt-5" data-testid="help-own-lamps">
            <h3 className="font-display text-lg leading-tight">Owned lanterns</h3>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              In Journal · Places, buy one lamp of each color: {TIERS.map((t) => `${TIER_LABEL[t]} ${fmt(OWN_PRICE[t])}`).join(", ")}. One owner per lamp, and visitors see your name on it. When a visitor misses there, you get half its coin value plus a 50% chance of one match, up to {OWN_DAILY_CAP} paid misses per lamp a day. Your own plays pay nothing. Free gift lanterns don't count toward the one per color and pay the same.
            </p>
          </section>
          <section className="mt-5" data-testid="help-trains">
            <h3 className="font-display text-lg leading-tight">Train stops</h3>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              Tap a train stop on foot to open the station board. Tickets come from lighting lamps. In a car, park first.
            </p>
          </section>
          <section className="mt-5" data-testid="help-welcome">
            <h3 className="font-display text-lg leading-tight">New players</h3>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              A new account gets a Lantern Cottage in its first city, {WELCOME_COIN.toLocaleString("en-US")} coins and a free White lantern, and lamps, street matches, rides, caches, quests and house keys pay double coin for the first hour.
            </p>
          </section>
          {/* 0.0.95: what the lantern result's badges and emblems mean. */}
          <section className="mt-5" data-testid="help-badges">
            <h3 className="font-display text-lg leading-tight">Prize badges</h3>
            <ul className="badge-help mt-2 grid gap-1.5 text-sm">
              <li><span className="emb-badge is-market">🏮 ×2</span><span>Night market: everything on its street pays ×N.</span></li>
              <li><span className="emb-badge is-streak">🔥 5</span><span>Answer streak: right answers in a row (5 pays a white, 10 a blue).</span></li>
              <li><span className="emb-badge is-boost">⚡2</span><span>Extra rewards you got from Lucky, a ride or your scout. Tap to see which.</span></li>
              <li><span className="badge-ico"><ItemIcon item="blue" size={22} /><b>↺</b></span><span>Perfect score: your match comes back.</span></li>
              <li><span className="badge-ico"><ItemIcon item="green" size={22} /><b>↑</b></span><span>You can carry 30 matches of each color. When you have 30, every 3 more turn into 1 match of the next color (white→blue→green→amber→red→violet). “2/3” means you need one more.</span></li>
              <li><span className="badge-ico"><ItemIcon item="coin" size={22} /><b>↺</b></span><span>Violet pocket full: extra violets pay coin instead.</span></li>
              <li><span className="badge-ico"><ItemIcon item="coin" size={20} /><ItemIcon item="white" size={20} /><ItemIcon item="brass" size={20} /><b>+N</b></span><span>Items earned: coin, matches, brass, ink, vellum, ingredient, paint.</span></li>
            </ul>
          </section>
          {/* 0.1.50: where the streets come from, and how fresh they are. */}
          <p className="mt-5 text-xs text-fg-muted" data-testid="help-map-data">
            {mapDate ? `Street map: OpenStreetMap data from ${mapDate}. ` : "Street map: OpenStreetMap data. "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
              © OpenStreetMap contributors
            </a>
          </p>
        </div>
        <div className="shrink-0 border-t border-border px-5 py-3">
          {askStuck ? (
            <div className="flex items-center gap-2" data-testid="stuck-confirm">
              <p className="flex-1 text-sm">Back to the start? You keep everything.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  sfx.ui();
                  setAskStuck(false);
                  useGame.getState().unstick();
                }}
              >
                Yes
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setAskStuck(false)}>
                No
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost w-full" data-testid="stuck" onClick={() => setAskStuck(true)}>
              I'm stuck
            </button>
          )}
        </div>
        <footer className="flex shrink-0 gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            className="btn btn-ghost flex-1"
            onClick={() => {
              sfx.ui();
              replay();
            }}
          >
            Walkthrough
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => {
              sfx.ui();
              toggleGuide(false);
            }}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
