import { useState } from "react";
import { LevelPanel } from "./Levels";
import { PrintPanel } from "./Prints";
import { X } from "lucide-react";
import { CHARMS, CITIES, KIND_LABEL, KIOSK, TIER_LABEL, boardLine, cityShop, counterLine } from "@/game/data";
import { CRATE_MAX, nextCrateStreak } from "@/game/crate";
import { blitzDue, blitzTakeLine } from "@/game/dailyBlitz";
import { MATERIAL_LIST } from "@/game/items";
import { INGREDIENTS, cityStaple, isPaintId, type IngredientId } from "@/game/ingredients";
import { LONG_COPY, circuitReady, clothEarn, clothName, clothPerk, clothShelf, longProgress, type ClothId, type LongId, type QuestLog } from "@/game/quests";
import { BANK_DOWN, BANK_UP } from "@/game/rewards";
import { SURVEY_GOALS, surveyHave } from "@/game/survey";
import { sfx } from "@/game/audio";
import { fareDesk } from "@/game/ticket";
import { useGame } from "@/game/store";
import type { CharmId } from "@/game/types";
import { DailyGoals } from "./DailyGoals";
import { ItemIcon } from "./ItemIcon";
import { AuthChip } from "./AuthChip";
import { RollsBoard } from "./RollsBoard";
import { DailyBoard } from "./DailyRun";
import { ScoutRoster } from "./ScoutShop";
import { PrintShop } from "./PrintShop";
import { MarketJournalRow, useMarket } from "./NightMarket";
import { MARKET_TAG } from "@/game/nightMarket";
import { FriendJournalRow } from "./FriendTickets";
import { PlayerLinkRow } from "./PlayerLink";
import { PassProgressRow } from "./CityPass";
import { useSheetOpen } from "./useSheetOpen";

const TABS = ["Places", "Supplies", "Progress", "Leaderboard"] as const;

export function HqPanel() {
  const hqOpen = useGame((s) => s.hqOpen);
  const toggleHq = useGame((s) => s.toggleHq);
  const cityId = useGame((s) => s.cityId);
  const atlas = useGame((s) => s.atlas);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Places");
  const points = useGame((s) => s.points);
  const brass = useGame((s) => s.brass);
  const ink = useGame((s) => s.ink);
  const vellum = useGame((s) => s.vellum);
  const schematics = useGame((s) => s.schematics);
  const pantry = useGame((s) => s.pantry);
  const quests = useGame((s) => s.quests);
  const claimCircuit = useGame((s) => s.claimCircuit);
  const claimLongQuest = useGame((s) => s.claimLong);
  const wearCloth = useGame((s) => s.wearCloth);
  const charms = useGame((s) => s.charms);
  const equipped = useGame((s) => s.equipped);
  const pressPass = useGame((s) => s.pressPass);
  const keys = useGame((s) => s.keys);
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
  const stock: Record<string, number> = { brass, ink, vellum, schematic: schematics };
  const claimed = lastCrateDay === today;
  const crateDay = claimed ? Math.max(1, crateStreak) : nextCrateStreak(lastCrateDay, crateStreak, today);
  const blitzReady = blitzDue(lastBlitzDay, today);
  const { market } = useMarket(cityId);

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
          {tab === "Places" ? (
            <ul className="grid gap-2">
              <MarketJournalRow />
              {city.pois.map((p) => {
                const known = Boolean(atlas[p.id]);
                return (
                  <li key={p.id} className="hq-row">
                    <ItemIcon item={p.tier} size={36} />
                    <div className="hq-row-copy">
                      <p className="kicker">
                        {p.kind === "shop"
                          ? "Outfitter"
                          : p.kind === "counter"
                            ? "Counter"
                            : p.kind === "board"
                              ? "Notice"
                              : `${TIER_LABEL[p.tier]} · ${KIND_LABEL[p.kind]}`}
                        {p.printShop ? " · Print" : ""}
                        {market?.street.lamps.includes(p.id) ? <span className="market-x"> · {MARKET_TAG}</span> : null}
                      </p>
                      <p className="hq-row-title">
                        {known
                          ? p.name
                          : p.kind === "shop"
                            ? "Undiscovered outfitter"
                            : p.kind === "counter"
                              ? "Undiscovered counter"
                              : p.kind === "board"
                                ? "Undiscovered notice"
                                : "Undiscovered lamp"}
                      </p>
                      <p className="hq-row-sub">
                        {known
                          ? p.lore
                          : p.kind === "shop"
                            ? "Look for the brass awning on the street."
                            : p.kind === "counter"
                              ? "A street counter. Matches, the crate, and the exchange."
                              : p.kind === "board"
                                ? "A notice board. Contracts and the day's blitz."
                                : "Walk up to it to add it to Places."}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {tab === "Supplies" ? (
            <div className="grid gap-3">
              <ul className="grid gap-2 sm:grid-cols-2">
                {MATERIAL_LIST.map((m) => (
                  <li key={m.id} className="hq-row">
                    <ItemIcon item={m.id} size={36} />
                    <div className="hq-row-copy">
                      <p className="hq-row-title">
                        {m.name} <span className="tabular-nums text-fg-muted">×{stock[m.id]}</span>
                      </p>
                      <p className="hq-row-sub">{m.blurb}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="kicker mt-2">Press stock</p>
              <p className="hq-row-sub">Green vaults and up drop this city's ingredient. Print, paint, and charms are at {cityShop(cityId)?.name ?? "the outfitter"}.</p>
              <ul className="grid gap-2">
                {(Object.keys(pantry) as IngredientId[])
                  .filter((id) => (pantry[id] ?? 0) > 0 && !isPaintId(id))
                  .concat((pantry[cityStaple(cityId)] ?? 0) > 0 ? [] : [cityStaple(cityId)])
                  .filter((id, i, arr) => arr.indexOf(id) === i)
                  .map((id) => (
                    <li key={id} className="hq-row">
                      <div className="hq-row-copy">
                        <p className="hq-row-title">
                          {INGREDIENTS[id].name} <span className="tabular-nums text-fg-muted">×{pantry[id] ?? 0}</span>
                        </p>
                        <p className="hq-row-sub">{INGREDIENTS[id].blurb}</p>
                      </div>
                    </li>
                  ))}
              </ul>
              <p className="kicker mt-2">Desk tray</p>
              <p className="text-sm text-fg-muted">Buy these at {counterLine(cityId)}.</p>
              {(Object.values(KIOSK) as (typeof KIOSK)[keyof typeof KIOSK][]).map((item) => {
                const extra =
                  item.id === "pass" && pressPass > 0
                    ? `${pressPass} waiting`
                    : item.id === "fare"
                      ? `${fares} in the pocket`
                      : item.id === "tinder"
                        ? `${keys.white} white`
                        : item.id === "wick"
                          ? `${keys.blue} blue`
                      : item.id === "amber" && keys.amber > 0
                        ? `${keys.amber} amber`
                        : item.id === "oil" && keys.violet > 0
                          ? `${keys.violet} violet`
                          : null;
                return (
                  <div key={item.id} className="hq-row">
                    <ItemIcon item="coin" size={36} />
                    <div className="hq-row-copy">
                      <p className="hq-row-title">{item.name}</p>
                      <p className="hq-row-sub">{item.blurb}</p>
                      {extra ? <p className="hq-row-sub">{extra}</p> : null}
                  </div>
                </div>
                );
              })}
              <p className="kicker mt-2">Scouts</p>
              <p className="text-sm text-fg-muted">
                Hire and change coats at {cityShop(cityId)?.name ?? "the outfitter"}.
              </p>
              <ScoutRoster hire={false} />
              <p className="kicker mt-2">Wardrobe</p>
              <p className="text-sm text-fg-muted">
                Printed and worn at {cityShop(cityId)?.name ?? "the outfitter"}. The journal only keeps the list.
              </p>
              <PrintShop counter={false} />
              <p className="kicker mt-2">Charms</p>
              <p className="text-sm text-fg-muted">Printed at {cityShop(cityId)?.name ?? "the outfitter"}. Equip one from the satchel.</p>
              {quests.patterns > 0 && !quests.cloths.includes("night-glass") ? (
                <div className="hq-row">
                  <div className="hq-row-copy">
                    <p className="hq-row-title">Night glass ×{quests.patterns}</p>
                    <p className="hq-row-sub">Print it at {cityShop(cityId)?.name ?? "the outfitter"}. One {INGREDIENTS[cityStaple(cityId)].name}.</p>
                  </div>
                </div>
              ) : null}
              {(Object.keys(CHARMS) as CharmId[]).map((id) => {
                const c = CHARMS[id];
                const owned = charms.includes(id);
                return (
                  <div key={id} className="hq-row">
                    <ItemIcon item={id} size={40} />
                    <div className="hq-row-copy">
                      <p className="hq-row-title">
                        {c.name}
                        {owned && equipped === id ? " · on" : ""}
                      </p>
                      <p className="hq-row-sub">{owned ? c.blurb : `Not printed. ${c.blurb}`}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {tab === "Leaderboard" ? (
            <>
              <DailyBoard city={cityId} />
              <div className="mt-5 border-t border-border pt-4">
                <RollsBoard />
                <PlayerLinkRow />
              </div>
            </>
          ) : null}

          {tab === "Progress" ? (
            <div className="grid gap-4 text-sm">
              <LevelPanel />
              <PrintPanel />
              <DailyGoals act={false} />
              <div>
                <p className="kicker">Quests</p>
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
              <PassProgressRow />
              <FriendJournalRow />
              <QuestDesk
                act={false}
                cityId={cityId}
                cityName={city.name}
                staple={pantry[cityStaple(cityId)] ?? 0}
                stapleName={INGREDIENTS[cityStaple(cityId)].name}
                charms={charms.length}
                distanceM={distanceM}
                quests={quests}
                onCircuit={claimCircuit}
                onLong={claimLongQuest}
                onWear={wearCloth}
              />
              <div>
                <p className="kicker mt-2">Bank</p>
                <p className="mt-1 text-xs text-fg-muted">
                  The exchange is at {counterLine(cityId)}. Craft {BANK_UP} lower → 1 higher, tax. Break 1 higher → {BANK_DOWN} lower.
                </p>
              </div>
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
                    <p className="hq-row-sub">Train tickets. Board at {desk.name}.</p>
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
              <p className="kicker mt-2">Goals</p>
              <ul className="grid gap-2">
                {SURVEY_GOALS.filter((g) => g.kind !== "ward" || g.cityId === cityId).map((g) => {
                  const have = surveyHave(g, atlas, distanceM);
                  const done = Boolean(survey[g.id]);
                  return (
                    <li key={g.id} className="hq-row">
                      <div className="hq-row-copy">
                        <p className={done ? "hq-row-title text-fg-muted" : "hq-row-title"}>{g.label}</p>
                        <p className="hq-row-sub">{g.blurb}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <ItemIcon item={g.reward} size={28} />
                        <span className="text-sm tabular-nums text-fg-muted">
                          {done
                            ? "Paid"
                            : g.kind === "walk"
                              ? `${(have / 1000).toFixed(1)}/${(g.need / 1000).toFixed(0)} km`
                              : `${Math.min(have, g.need)}/${g.need}`}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-fg-subtle">
                Contracts are taken at {boardLine(cityId)}. The atlas is a record, not a ride. Earn a fare in this city — three lamps — then punch it at{" "}
                {desk.name}.
              </p>
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
  cityName,
  staple,
  stapleName,
  charms,
  distanceM,
  quests,
  onCircuit,
  onLong,
  onWear,
}: {
  act: boolean;
  cityId: import("@/game/types").CityId;
  cityName: string;
  staple: number;
  stapleName: string;
  charms: number;
  distanceM: number;
  quests: QuestLog;
  onCircuit: () => void;
  onLong: (id: LongId) => void;
  onWear: (id: ClothId | null) => void;
}) {
  const circuit = circuitReady(quests, cityId, staple, charms);
  const cityCircuit = quests.circuit[cityId];
  const longs = longProgress(quests, distanceM);
  return (
    <div>
      <p className="kicker mt-2">Milestones</p>
      <div className="mt-2 grid gap-2">
        <div className="hq-row">
          <div className="hq-row-copy">
            <p className="hq-row-title">{cityName} circuit</p>
            <p className="hq-row-sub">
              {cityCircuit?.claimed
                ? "Scarf claimed."
                : `Red ${cityCircuit?.red ? "yes" : "no"} · ward ${cityCircuit?.ward ? "yes" : "no"} · ${stapleName} ${staple}/3 · charm ${cityCircuit?.printed || charms > 0 ? "yes" : "no"}.`}
            </p>
            {cityCircuit?.claimed || !act ? null : (
              <div className="hq-row-actions">
                <button type="button" className="btn btn-quiet px-3 text-xs" disabled={!circuit} onClick={onCircuit}>
                  Claim scarf
                </button>
              </div>
            )}
            {!act && !cityCircuit?.claimed ? (
              <p className="hq-row-sub">{circuit ? "Ready at the notice board." : "Still out."}</p>
            ) : null}
          </div>
        </div>
        {(Object.keys(LONG_COPY) as LongId[]).map((id) => {
          const row = longs[id];
          const copy = LONG_COPY[id];
          const shown = id === "walk" ? `${(row.n / 1000).toFixed(1)}/${(row.need / 1000).toFixed(0)} km` : `${Math.min(row.n, row.need)}/${row.need}`;
          return (
            <div key={id} className="hq-row">
              <div className="hq-row-copy">
                <p className="hq-row-title">{copy.title}</p>
                <p className="hq-row-sub">
                  {copy.sub} {shown}.
                </p>
                {row.done || !act ? null : (
                  <div className="hq-row-actions">
                    <button type="button" className="btn btn-quiet px-3 text-xs" disabled={!row.ready} onClick={() => onLong(id)}>
                      {row.ready ? "Claim" : "In progress"}
                    </button>
                  </div>
                )}
                {!act && !row.done ? <p className="hq-row-sub">{row.ready ? "Ready at the notice board." : "In progress."}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="kicker mt-4">Cloth</p>
      <p className="mt-1 text-xs text-fg-muted">Wear one. The perk is coin on a clear, not a new coat.</p>
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
