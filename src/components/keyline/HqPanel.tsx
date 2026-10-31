import { Fragment, useState } from "react";
import { LevelPanel } from "./Levels";
import { RecentRewards } from "./RecentRewards";
import { StreakBoardSection } from "./RideBoards";
import { LadderBoardSection } from "./LadderBoard";
import { PrintPanel } from "./Prints";
import { LoopPosters } from "./LoopPosters";
import { MarketLightsPanel } from "./NightMarket";
import { Palette, X } from "lucide-react";
import { CITIES, boardLine, cityShop, counterLine } from "@/game/data";
import { CRATE_MAX, nextCrateStreak } from "@/game/crate";
import { blitzDue, blitzTakeLine } from "@/game/dailyBlitz";
import { clothEarn, clothName, clothPerk, clothShelf, type ClothId, type QuestLog } from "@/game/quests";
import { QuestBoard } from "./QuestBoard";
import { BANK_DOWN, BANK_UP } from "@/game/rewards";
import { SURVEY_GOALS, surveyHave } from "@/game/survey";
import { sfx } from "@/game/audio";
import { fareDesk } from "@/game/ticket";
import { useGame } from "@/game/store";
import { DailyGoals } from "./DailyGoals";
import { ItemIcon } from "./ItemIcon";
import { AuthChip } from "./AuthChip";
import { RollsBoard } from "./RollsBoard";
import { DailyBoard } from "./DailyRun";
import { ScoutRoster } from "./ScoutShop";
import { PrintShop } from "./PrintShop";
import { FriendJournalRow } from "./FriendTickets";
import { PlayerLinkRow } from "./PlayerLink";
import { PassProgressRow } from "./CityPass";
import { useSheetOpen } from "./useSheetOpen";
import { PlacesTab, TapRow } from "./JournalPlaces";

const TABS = ["Places", "Supplies", "Goals", "Progress", "Leaderboard"] as const;

export function HqPanel() {
  const hqOpen = useGame((s) => s.hqOpen);
  const toggleHq = useGame((s) => s.toggleHq);
  const cityId = useGame((s) => s.cityId);
  const atlas = useGame((s) => s.atlas);
  const [supOpen, setSupOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Places");
  const points = useGame((s) => s.points);
  const quests = useGame((s) => s.quests);
  const wearCloth = useGame((s) => s.wearCloth);
  const lastCrateDay = useGame((s) => s.lastCrateDay);
  const lastBlitzDay = useGame((s) => s.lastBlitzDay);
  const blitzTake = useGame((s) => s.blitzTake);
  const blitzMatches = useGame((s) => s.blitzMatches);
  const crateStreak = useGame((s) => s.crateStreak);
  const vaultsOpened = useGame((s) => s.vaultsOpened);
  const distanceM = useGame((s) => s.distanceM);
  const bestStreak = useGame((s) => s.bestStreak);
  const fares = useGame((s) => s.fares);
  const toggleGuide = useGame((s) => s.toggleGuide);
  const city = CITIES[cityId];
  const desk = fareDesk(city);
  const survey = useGame((s) => s.survey);
  const today = new Date().toISOString().slice(0, 10);
  const claimed = lastCrateDay === today;
  const crateDay = claimed ? Math.max(1, crateStreak) : nextCrateStreak(lastCrateDay, crateStreak, today);
  const blitzReady = blitzDue(lastBlitzDay, today);

  useSheetOpen(hqOpen);
  if (!hqOpen) return null;

  return (
    <div className="absolute inset-0 z-[700] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div className="panel sheet-bottom flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Journal</p>
            <h2 className="font-display text-xl leading-tight">Notes · {city.name}</h2>
            <button
              type="button"
              className="hq-howto mt-1 inline-flex min-h-8 items-center text-xs text-fg-subtle underline-offset-2 hover:text-fg-muted hover:underline"
              onClick={() => {
                sfx.ui();
                toggleGuide(true);
              }}
            >
              How to play
            </button>
            <button
              type="button"
              data-testid="skins-btn"
              className="btn btn-quiet mt-1 ml-3 inline-flex min-h-11 items-center gap-1.5 px-3 text-xs align-middle"
              aria-label="Map skins"
              onClick={() => {
                sfx.ui();
                toggleHq(false);
                useGame.getState().setSkinsOpen(true);
              }}
            >
              <Palette className="size-4" aria-hidden />
              Map skins
            </button>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            <AuthChip />
            <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => toggleHq(false)} aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="hq-tabs shrink-0" role="tablist" aria-label="Journal sections">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`hq-tab${tab === t ? " is-on" : ""}`}
              onClick={() => {
                sfx.ui();
                setTab(t);
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tab === "Places" ? <PlacesTab /> : null}

          {tab === "Supplies" ? (
            <div className="grid gap-3">
              <ul className="jr-list mt-2">
                <TapRow title="Scouts" sub={`Hire and change coats at ${cityShop(cityId)?.name ?? "the outfitter"}.`} open={supOpen === "scouts"} onTap={() => setSupOpen((o) => (o === "scouts" ? null : "scouts"))} testid="sup-scouts" />
              </ul>
              {supOpen === "scouts" ? <ScoutRoster hire={false} /> : null}
              <ul className="jr-list">
                <TapRow title="Wardrobe" sub={`Printed and worn at ${cityShop(cityId)?.name ?? "the outfitter"}.`} open={supOpen === "wardrobe"} onTap={() => setSupOpen((o) => (o === "wardrobe" ? null : "wardrobe"))} testid="sup-wardrobe" />
              </ul>
              {supOpen === "wardrobe" ? <PrintShop counter={false} /> : null}
              {quests.patterns > 0 && !quests.cloths.includes("night-glass") ? (
                <div className="hq-row">
                  <div className="hq-row-copy">
                    <p className="hq-row-title">Night glass ×{quests.patterns}</p>
                    <p className="hq-row-sub">Print it at {cityShop(cityId)?.name ?? "the outfitter"}. The violet pattern is all it needs.</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "Leaderboard" ? (
            <>
              <DailyBoard city={cityId} />
              <StreakBoardSection />
              <LadderBoardSection />
              <div className="mt-5 border-t border-border pt-4">
                <RollsBoard />
                <PlayerLinkRow />
              </div>
            </>
          ) : null}

          {tab === "Goals" ? (
            <div className="grid gap-4 text-sm">
              <DailyGoals act={false} />
              <div>
                <p className="kicker">Daily Blitz</p>
                <p className="mt-1 text-xs text-fg-muted">
                  {blitzReady
                    ? `Daily Blitz is posted at ${boardLine(cityId)}.`
                    : blitzTake > 0 || blitzMatches.length > 0
                      ? `Blitz today: +${blitzTakeLine(blitzTake, blitzMatches)}.`
                      : "Blitz played today."}
                </p>
              </div>
              <div className="hq-row">
                <ItemIcon item="crate" size={40} />
                <div className="hq-row-copy">
                  <p className="hq-row-title">{claimed ? `Day ${crateDay} claimed` : `Day ${crateDay} crate is at the counter`}</p>
                  <p className="hq-row-sub">
                    At {counterLine(cityId)}. Login streak {crateDay}/{CRATE_MAX}.
                  </p>
                </div>
              </div>
              <QuestDesk act={false} cityId={cityId} quests={quests} onWear={wearCloth} />
              <FriendJournalRow />
              <p className="kicker mt-2">Goals</p>
              <ul className="jr-list" data-testid="survey-goals">
                {SURVEY_GOALS.filter((g) => g.kind !== "ward" || g.cityId === cityId).map((g) => {
                  const have = surveyHave(g, atlas, distanceM);
                  const done = Boolean(survey[g.id]);
                  const pct = done ? 100 : Math.min(100, Math.round((have / g.need) * 100));
                  const k = `goal:${g.id}`;
                  return (
                    <Fragment key={g.id}>
                      <li className="jr-row">
                        <button type="button" className="jr-tap" aria-expanded={supOpen === k} onClick={() => { sfx.ui(); setSupOpen((o) => (o === k ? null : k)); }}>
                          <span className="jr-main">
                            <span className={done ? "jr-title text-fg-muted" : "jr-title"}>{g.label}</span>
                            <span className="print-bar jr-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                              <i style={{ width: `${pct}%` }} />
                            </span>
                          </span>
                          <ItemIcon item={g.reward} size={24} />
                          <span className="jr-val tabular-nums">
                            {done
                              ? "Paid"
                              : g.kind === "walk"
                                ? `${(have / 1000).toFixed(1)}/${(g.need / 1000).toFixed(0)} km`
                                : `${Math.min(have, g.need)}/${g.need}`}
                          </span>
                        </button>
                      </li>
                      {supOpen === k ? <li className="hq-row-sub jr-note">{g.blurb}</li> : null}
                    </Fragment>
                  );
                })}
              </ul>
              <p className="text-xs text-fg-subtle">
                Contracts are taken at {boardLine(cityId)}. The atlas is a record, not a ride. Earn a fare in this city — three lamps — then punch it at{" "}
                {desk.name}.
              </p>
            </div>
          ) : null}

          {tab === "Progress" ? (
            <div className="grid gap-4 text-sm">
              <LevelPanel />
              <PassProgressRow />
              <PrintPanel />
              <LoopPosters />
              <MarketLightsPanel />
              <ul className="hq-stats">
                <li className="hq-row">
                  <ItemIcon item="coin" size={36} />
                  <div className="hq-row-copy">
                    <p className="hq-row-title tabular-nums">{points.toLocaleString()}</p>
                    <p className="hq-row-sub">Coin on the desk.</p>
                  </div>
                </li>
                <li className="hq-row">
                  <div className="hq-row-copy">
                    <p className="hq-row-title tabular-nums">{vaultsOpened}</p>
                    <p className="hq-row-sub">Lamps lit.</p>
                  </div>
                </li>
                <li className="hq-row">
                  <div className="hq-row-copy">
                    <p className="hq-row-title tabular-nums">{bestStreak}</p>
                    <p className="hq-row-sub">Best answer streak.</p>
                  </div>
                </li>
                <li className="hq-row">
                  <div className="hq-row-copy">
                    <p className="hq-row-title tabular-nums">{(distanceM / 1000).toFixed(1)} km</p>
                    <p className="hq-row-sub">Walked on the street.</p>
                  </div>
                </li>
                <li className="hq-row">
                  <div className="hq-row-copy">
                    <p className="hq-row-title tabular-nums">{fares}</p>
                    <p className="hq-row-sub">Tickets. Travel from {desk.name}: the Loop, arrive now, or the train.</p>
                  </div>
                </li>
                <li className="hq-row">
                  <div className="hq-row-copy">
                    <p className="hq-row-title tabular-nums">
                      {city.pois.filter((p) => atlas[p.id]).length}/{city.pois.length}
                    </p>
                    <p className="hq-row-sub">Places in {city.name}. {Object.keys(atlas).length} visited.</p>
                  </div>
                </li>
              </ul>
              <RecentRewards />
              <div>
                <p className="kicker mt-2">Bank</p>
                <p className="mt-1 text-xs text-fg-muted">
                  The exchange is at {counterLine(cityId)}. Craft {BANK_UP} lower → 1 higher, tax. Break 1 higher → {BANK_DOWN} lower.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function QuestDesk({
  act,
  cityId,
  quests,
  onWear,
}: {
  act: boolean;
  cityId: import("@/game/types").CityId;
  quests: QuestLog;
  onWear: (id: ClothId | null) => void;
}) {
  return (
    <div>
      <QuestBoard />
      <p className="kicker mt-4">Cloth</p>
      <p className="mt-1 text-xs text-fg-muted">Wear one to get extra coin each time you light a lamp. It doesn't change how you look.</p>
      <div className="mt-2 grid gap-2">
        {clothShelf(quests, cityId).map((id) => {
          const owned = quests.cloths.includes(id);
          const worn = quests.worn === id;
          return (
            <div key={id} className="hq-row">
              <div className="hq-row-copy">
                <p className="hq-row-title">
                  {clothName(id)}
                  {worn ? " · worn" : ""}
                </p>
                <p className="hq-row-sub">{owned ? clothPerk(id) : clothEarn(id)}</p>
                {owned && act ? (
                  <div className="hq-row-actions">
                    <button
                      type="button"
                      className={`btn px-3 text-xs ${worn ? "btn-primary" : "btn-quiet"}`}
                      onClick={() => onWear(worn ? null : id)}
                    >
                      {worn ? "Take off" : "Wear"}
                    </button>
                  </div>
                ) : (
                  <p className="hq-row-sub">{owned ? (worn ? "Worn." : "In the closet. Put it on at the notice board.") : "Not in the closet."}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
