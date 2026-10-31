import { useEffect, useState, type ReactNode } from "react";
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
import { HOME_LAMPS } from "@/game/houses";
import { FLIGHT_MIN_MILES } from "@/game/flight";
import { LOOP_CRATE_ONE_IN } from "@/game/loop";
import { SHOP_CAP, SHOP_EVERY_MS, SHOP_NAME, SHOP_PAY, SHOP_PRICE } from "@/game/shop";
import { TITLE_RUNGS } from "@/game/levels";
import { PRINT_GOAL_FIRST } from "@/game/cityPrints";

const fmt = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1000 ? `${n / 1000}k` : String(n));
const TIERS = ["white", "blue", "green", "amber", "red", "violet"] as const;

export function FieldGuide() {
  const open = useGame((s) => s.guideOpen);
  const toggleGuide = useGame((s) => s.toggleGuide);
  const replay = useGame((s) => s.replayTutorial);
  const clears = useGame((s) => s.correctByTier);
  const [askStuck, setAskStuck] = useState(false);
  const [topic, setTopic] = useState<string | null>("play");
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
              How to play
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
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2" data-testid="help-body">
          <ul className="jr-list">
            <li className="kicker jr-kicker">Start here</li>
            <Topic id="play" icon={<span aria-hidden>👆</span>} title="How to play" sub="Walk to a lamp, answer, earn coin." open={topic} set={setTopic} testid="help-hold">
              <li>Tap the map to walk; press and hold (or Shift+click) to add a stop.</li>
              <li>Opening a lamp uses one match of its color.</li>
              <li>Answer right to earn coin. Under 3 seconds pays the most.</li>
              <li>Over 10 seconds pays the least.</li>
            </Topic>
            <Topic id="coin" icon={<ItemIcon item="coin" size={26} />} title="Earning coin" sub="What each lamp color pays" open={topic} set={setTopic}>
              <li className="help-strip-wrap">
                <ul className="help-strip">
                  {rows.map((row) => {
                    const mine = paintFromClears(clears[row.tier] ?? 0, row.paintIn);
                    return (
                      <li key={row.tier} className="help-strip-row">
                        <ItemIcon item={row.tier} size={20} />
                        <span className="help-strip-name">{TIER_LABEL[row.tier]}</span>
                        <span className="help-strip-val tabular-nums">
                          {fmt(row.slow)}–{fmt(row.perfect)}
                        </span>
                        <span className="help-strip-sub">
                          Lights again in {row.recast} · {paintOddsLine(row.tier)} paint{mine ? ` · ${mine}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <More>
                {PAY_NOTES.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </More>
            </Topic>
            <Topic id="lamps" icon={<ItemIcon item="white" size={26} />} title="Lamps & matches" sub="Carry, combine, streaks, badges" open={topic} set={setTopic} testid="help-badges">
              <li>Carry 30 matches of each color; past 30, every 3 more make 1 of the next color.</li>
              <li>A perfect score gives your match back.</li>
              <li>5 right in a row pays a white match, 10 a blue.</li>
              <More>
                <li className="badge-help-row"><span className="emb-badge is-market">🏮 ×2</span><span>Night market: everything on its street pays ×N.</span></li>
                <li className="badge-help-row"><span className="emb-badge is-streak">🔥 5</span><span>Answer streak: right answers in a row.</span></li>
                <li className="badge-help-row"><span className="emb-badge is-boost">⚡2</span><span>Extra rewards from Lucky, a ride or your scout. Tap to see which.</span></li>
                <li className="badge-help-row"><span className="badge-ico"><ItemIcon item="blue" size={22} /><b>↺</b></span><span>Perfect score: your match comes back.</span></li>
                <li className="badge-help-row"><span className="badge-ico"><ItemIcon item="green" size={22} /><b>↑</b></span><span>“2/3” means one more match makes the next color.</span></li>
                <li className="badge-help-row"><span className="badge-ico"><ItemIcon item="coin" size={22} /><b>↺</b></span><span>Violet pocket full: extra violets pay coin instead.</span></li>
                <li className="badge-help-row"><span className="badge-ico"><ItemIcon item="coin" size={20} /><b>+N</b></span><span>Items earned: coin, matches, paint.</span></li>
              </More>
            </Topic>

            <li className="kicker jr-kicker">Getting around</li>
            <Topic id="places" icon={<span aria-hidden>📍</span>} title="Places around town" sub="Outfitter, counter, board, car lot" open={topic} set={setTopic} testid="help-places">
              <li>Outfitter (brass awning): hire scouts, print coats, and mix paint at the vat.</li>
              <li>Street counter: buy from the tray, open your morning crate, and trade matches up or down.</li>
              <li>Notice board: pick up jobs and play the Daily Blitz. Train stops open the station board.</li>
              <li>Car lot: buy a car, repaint it, and pick which one you drive. Journal · Places lists the ones you&apos;ve found.</li>
            </Topic>
            <Topic id="travel" icon={<span aria-hidden>🚆</span>} title="Travel & fly" sub="Train stops, the Loop, flights" open={topic} set={setTopic} testid="help-trains">
              <li>Tap a train stop on foot to open the station board. In a car, park first.</li>
              <li>Tickets come from lighting lamps. Each trip uses one.</li>
              <li>Arrive is instant; the Loop drops a crate about 1 in {LOOP_CRATE_ONE_IN} rides.</li>
              <li>Trips over {FLIGHT_MIN_MILES.toLocaleString("en-US")} miles can fly, with a souvenir from the city you land in.</li>
            </Topic>
            <Topic id="pass" icon={<span aria-hidden>🎟️</span>} title="City passes" sub="1 pass unlocks a new city" open={topic} set={setTopic} testid="help-pass">
              <li>Your second city is free.</li>
              <li>Earn passes from amber, red and violet lamps (1, 4 and 10 points; 10 points = 1 pass).</li>
              <li>Or finish “All of” a city, or do 3 Lantern Runs in one city.</li>
              <li>Spend it at the train station: “Use pass”.</li>
            </Topic>
            <Topic id="cars" icon={<span aria-hidden>🚗</span>} title="Cars" sub="Your own cab, with a perk" open={topic} set={setTopic} testid="help-cars">
              <li>Buy one at a city&apos;s car lot; you keep it in every city.</li>
              <li>Faster than the city cab: 5% (Civic) up to 30% (Roadster 2.0).</li>
              <li>From your car you can open lamps and vaults and grab curb matches.</li>
              <More testid="help-car-perks">
                <li>
                  Perks while you sit in it: {CARS.map((c) => `${c.name.replace(/^Used /, "")}: ${CAR_PERKS[c.id].label.split(" · ").pop()}`).join("; ")}.
                </li>
                <li>
                  The Magnet pulls at most one match every {MAGNET_GAP_MS / 1000} s and {MAGNET_DAY_CAP} a day per city, inside the usual {STREET_DAY_CAP} street matches a day. Vehicle-to-load pays its white match on at most {V2L_DAY_CAP} lamps a day.
                </li>
                <li>Autopilot never stacks on the Fox&apos;s struck option. Road trip pays once per city per day. A coat with the same kind of perk doesn&apos;t add to it.</li>
              </More>
            </Topic>
            <Topic id="keys" icon={<span aria-hidden>⌨️</span>} title="Map controls" sub="Recenter and keyboard keys" open={topic} set={setTopic} testid="help-keys">
              <li>The crosshair under + and − puts the map back on you.</li>
              <li>WASD or arrows walk · E or Space opens the nearest lamp · C centers.</li>
              <li>F cab or car · T train board · I satchel · Tab HQ · Esc closes.</li>
            </Topic>

            <li className="kicker jr-kicker">Spend &amp; own</li>
            <Topic id="houses" icon={<span aria-hidden>🏠</span>} title="Houses & Lantern Shop" sub="Daily house key, shop till" open={topic} set={setTopic} testid="help-houses">
              <li>One house per city, from {fmt(HOUSES[0]!.price)}; stepping up costs only the difference.</li>
              <li>Once a day per city, light {HOME_LAMPS} lamps there and turn the key: {KEY_MATCHES} matches plus coin.</li>
              <li>
                {SHOP_NAME}: {fmt(SHOP_PRICE)}, one per city; pays {SHOP_PAY.toLocaleString("en-US")} every {SHOP_EVERY_MS / 3_600_000} h, and the till holds {SHOP_CAP}.
              </li>
              <More>
                <li>Houses: {HOUSES.map((h) => `${h.name} ${fmt(h.price)} (key ${h.keyCoin.toLocaleString("en-US")})`).join(", ")}.</li>
              </More>
            </Topic>
            <Topic id="own" icon={<ItemIcon item="amber" size={26} />} title="Owned lanterns" sub="Earn when visitors miss" open={topic} set={setTopic} testid="help-own-lamps">
              <li>Buy one lamp of each color in Journal · Places; visitors see your name.</li>
              <li>A visitor&apos;s miss pays you half its coin, plus a 50% chance of a match.</li>
              <li>Up to {OWN_DAILY_CAP} paid misses per lamp a day; your own plays pay nothing.</li>
              <More>
                <li>Prices: {TIERS.map((t) => `${TIER_LABEL[t]} ${fmt(OWN_PRICE[t])}`).join(", ")}. Free gift lanterns don&apos;t count toward the one per color.</li>
              </More>
            </Topic>
            <Topic id="boost" icon={<span aria-hidden>✨</span>} title="Boosts" sub="Coat, car and category of the day" open={topic} set={setTopic} testid="help-categories">
              <li>A right answer in your coat&apos;s or car&apos;s favorite category pays +{Math.round(FAV_BONUS * 100)}% (both: +{Math.round(FAV_BOTH * 100)}%).</li>
              <li>The category of the day pays +{Math.round(COTD_BONUS * 100)}% and is always offered.</li>
              <li>Boosts add up to at most +{Math.round(CAT_BONUS_CAP * 100)}%, on lamp coin only.</li>
              <More testid="help-coat-favs">
                <li>Coat favorites: {SCOUT_LIST.map((s) => `${s.name.replace(/^The /, "")} ${CAT_LABEL[SCOUT_FAV[s.id]]}`).join(", ")}. The Panda&apos;s Bamboo luck pays a right lamp&apos;s coin twice, 1 in 15 lamps.</li>
              </More>
            </Topic>

            <li className="kicker jr-kicker">More</li>
            <Topic id="journal" icon={<span aria-hidden>📒</span>} title="Journal & ladders" sub="Titles, boards, city prints" open={topic} set={setTopic}>
              <li>Each trivia category has titles at {TITLE_RUNGS.map((n) => n.toLocaleString("en-US")).join(", ")} right answers.</li>
              <li>Leaderboard: daily runs, streaks, ladders and more.</li>
              <li>City prints: {PRINT_GOAL_FIRST.correct} right answers plus {PRINT_GOAL_FIRST.meters / 1000} km walked in that city.</li>
            </Topic>
            <Topic id="account" icon={<span aria-hidden>👤</span>} title="Account & new players" sub="Sign in, first-hour bonus" open={topic} set={setTopic} testid="help-welcome">
              <li>Sign in to post times and scores; guests can still read the boards.</li>
              <li>
                A new account gets a Lantern Cottage, {WELCOME_COIN.toLocaleString("en-US")} coins and a free White lantern.
              </li>
              <li>Lamps, street matches, rides, caches, quests and house keys pay double coin for the first hour.</li>
            </Topic>
          </ul>
          {/* 0.1.50: where the streets come from, and how fresh they are. */}
          <p className="mt-4 text-xs text-fg-muted" data-testid="help-map-data">
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

/** 0.1.74: one Help topic as a Journal-style row; tap to show its few bullets (one open at a time). */
function Topic(props: { id: string; icon: ReactNode; title: string; sub: string; open: string | null; set: (id: string | null) => void; testid?: string; children: ReactNode }) {
  const on = props.open === props.id;
  return (
    <li className="help-topic" data-testid={props.testid}>
      <button
        type="button"
        className="jr-tap help-tap"
        aria-expanded={on}
        onClick={() => {
          sfx.ui();
          props.set(on ? null : props.id);
        }}
      >
        <span className="help-ico">{props.icon}</span>
        <span className="jr-main">
          <span className="jr-title">{props.title}</span>
          <span className="jr-sub">{props.sub}</span>
        </span>
        <span className="jr-go">{on ? "▴" : "›"}</span>
      </button>
      {on ? <ul className="help-bullets">{props.children}</ul> : null}
    </li>
  );
}

/** The long lists stay one more tap away. */
function More({ children, testid }: { children: ReactNode; testid?: string }) {
  const [on, setOn] = useState(false);
  return (
    <li className="help-more" data-testid={testid}>
      <button type="button" className="jr-more" aria-expanded={on} onClick={() => setOn((o) => !o)}>
        {on ? "Hide ▴" : "See all ▾"}
      </button>
      {on ? <ul className="help-more-list">{children}</ul> : null}
    </li>
  );
}
