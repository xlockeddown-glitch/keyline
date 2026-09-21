import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CHARMS, CITIES, KIND_LABEL, KIOSK, TIER_LABEL, cityShop } from "@/game/data";
import { crateLoot, CRATE_MAX, nextCrateStreak } from "@/game/crate";
import { PULSE_POINTS, pulseDue } from "@/game/pulse";
import { MATERIAL_LIST, TIERS } from "@/game/items";
import { SURVEY_GOALS, surveyHave } from "@/game/survey";
import { sfx } from "@/game/audio";
import { fareDesk } from "@/game/ticket";
import { useGame } from "@/game/store";
import type { CharmId } from "@/game/types";
import { CostIcons, ItemIcon } from "./ItemIcon";
import { AuthChip } from "./AuthChip";
import { RollsBoard } from "./RollsBoard";
import { ScoutRoster } from "./ScoutShop";

const TABS = ["Atlas", "Print", "Ledger", "Standings"] as const;

export function HqPanel() {
  const hqOpen = useGame((s) => s.hqOpen);
  const toggleHq = useGame((s) => s.toggleHq);
  const cityId = useGame((s) => s.cityId);
  const atlas = useGame((s) => s.atlas);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Atlas");
  const points = useGame((s) => s.points);
  const brass = useGame((s) => s.brass);
  const ink = useGame((s) => s.ink);
  const vellum = useGame((s) => s.vellum);
  const schematics = useGame((s) => s.schematics);
  const charms = useGame((s) => s.charms);
  const equipped = useGame((s) => s.equipped);
  const craft = useGame((s) => s.craft);
  const equip = useGame((s) => s.equip);
  const buyKiosk = useGame((s) => s.buyKiosk);
  const pressPass = useGame((s) => s.pressPass);
  const keys = useGame((s) => s.keys);
  const claimCrate = useGame((s) => s.claimCrate);
  const claimPulse = useGame((s) => s.claimPulse);
  const lastCrateDay = useGame((s) => s.lastCrateDay);
  const lastPulseDay = useGame((s) => s.lastPulseDay);
  const crateStreak = useGame((s) => s.crateStreak);
  const vaultsOpened = useGame((s) => s.vaultsOpened);
  const distanceM = useGame((s) => s.distanceM);
  const bestStreak = useGame((s) => s.bestStreak);
  const startContract = useGame((s) => s.startContract);
  const contract = useGame((s) => s.contract);
  const fares = useGame((s) => s.fares);
  const replayTutorial = useGame((s) => s.replayTutorial);
  const city = CITIES[cityId];
  const desk = fareDesk(city);
  const survey = useGame((s) => s.survey);
  const today = new Date().toISOString().slice(0, 10);
  const have = { brass, ink, vellum, schematics };
  const stock: Record<string, number> = { brass, ink, vellum, schematic: schematics };
  const claimed = lastCrateDay === today;
  const crateDay = claimed ? Math.max(1, crateStreak) : nextCrateStreak(lastCrateDay, crateStreak, today);
  const loot = crateLoot(crateDay);
  const pulseReady = pulseDue(lastPulseDay, today);

  useEffect(() => {
    if (hqOpen && pulseReady) setTab("Ledger");
  }, [hqOpen, pulseReady]);

  if (!hqOpen) return null;

  return (
    <div className="absolute inset-0 z-[700] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div className="panel flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Headquarters</p>
            <h2 className="font-display text-2xl">Hideout · {city.name}</h2>
            <button
              type="button"
              className="mt-2 text-xs text-fg-subtle underline-offset-2 hover:text-fg-muted hover:underline"
              onClick={() => {
                sfx.ui();
                replayTutorial();
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

        <div className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`shrink-0 min-h-11 px-4 text-sm ${tab === t ? "border-b-2 border-accent text-fg" : "text-fg-muted"}`}
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
          {tab === "Atlas" ? (
            <ul className="grid gap-2">
              {city.pois.map((p) => {
                const known = Boolean(atlas[p.id]);
                return (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-border bg-bg-subtle/50 p-3"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <ItemIcon item={p.tier} size={28} />
                      <div>
                        <p className="kicker">
                          {p.kind === "shop" ? "Outfitter" : `${TIER_LABEL[p.tier]} · ${KIND_LABEL[p.kind]}`}
                          {p.printShop ? " · Print" : ""}
                        </p>
                        <p className="font-medium">{known ? p.name : p.kind === "shop" ? "Undiscovered outfitter" : "Undiscovered lamp"}</p>
                        <p className="mt-1 text-sm text-pretty text-fg-muted">
                          {known ? p.lore : p.kind === "shop" ? "Look for the brass awning on the street." : "Walk up to it to stamp the atlas."}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {tab === "Print" ? (
            <div className="grid gap-3">
              <ul className="flex flex-wrap gap-3">
                {MATERIAL_LIST.map((m) => (
                  <li key={m.id} className="hud-chip px-2 py-1.5">
                    <ItemIcon item={m.id} size={24} />
                    <span className="text-sm tabular-nums">{stock[m.id]}</span>
                    <span className="kicker">{m.name}</span>
                  </li>
                ))}
              </ul>
              <p className="kicker mt-2">Desk tray</p>
              <p className="text-sm text-fg-muted">Coin for the ward — not another coat.</p>
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
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-bg-subtle/50 p-4">
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-tight">{item.name}</p>
                      <p className="text-sm text-pretty text-fg-muted">{item.blurb}</p>
                      {extra ? <p className="mt-1 kicker">{extra}</p> : null}
                    </div>
                    <button
                      type="button"
                      className={`btn shrink-0 px-3 text-xs ${points >= item.cost ? "btn-primary" : "btn-quiet"}`}
                      onClick={() => buyKiosk(item.id)}
                    >
                      <ItemIcon item="coin" size={14} />
                      {item.cost.toLocaleString()}
                    </button>
                  </div>
                );
              })}
              <p className="kicker mt-2">Scouts</p>
              <p className="text-sm text-fg-muted">
                Coats are hired at {cityShop(cityId)?.name ?? "the outfitter"} — the brass awning on the street. You can still change here.
              </p>
              <ScoutRoster hire={false} />
              <p className="kicker mt-2">Charms</p>
              {(Object.keys(CHARMS) as CharmId[]).map((id) => {
                const c = CHARMS[id];
                const owned = charms.includes(id);
                return (
                  <div key={id} className="flex items-start gap-3 rounded-md border border-border bg-bg-subtle/50 p-4">
                    <ItemIcon item={id} size={56} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg leading-tight">{c.name}</p>
                          <p className="text-sm text-pretty text-fg-muted">{c.blurb}</p>
                        </div>
                        {owned ? (
                          <button
                            type="button"
                            className={`btn ${equipped === id ? "btn-primary" : "btn-ghost"} px-3 text-xs`}
                            onClick={() => equip(equipped === id ? null : id)}
                          >
                            {equipped === id ? "Equipped" : "Equip"}
                          </button>
                        ) : (
                          <button type="button" className="btn btn-quiet px-3 text-xs" onClick={() => craft(id)}>
                            Print
                          </button>
                        )}
                      </div>
                      {owned ? null : (
                        <div className="mt-2">
                          <CostIcons cost={c.cost} have={have} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {tab === "Standings" ? <RollsBoard /> : null}

          {tab === "Ledger" ? (
            <div className="grid gap-4 text-sm">
              <div>
                <p className="kicker">Quests</p>
                <button
                  type="button"
                  className="mt-2 flex w-full items-center gap-3 rounded-md border border-border bg-bg-subtle/50 p-3 text-left disabled:opacity-70"
                  disabled={!pulseReady}
                  onClick={() => {
                    sfx.ui();
                    claimPulse();
                  }}
                >
                  <ItemIcon item="coin" size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{pulseReady ? "File City Pulse" : "City Pulse filed"}</p>
                    <p className="text-xs text-fg-muted">
                      Once a day at the desk. {PULSE_POINTS} coin. Separate from the crate streak.
                    </p>
                  </div>
                </button>
              </div>
              <button
                type="button"
                className="flex items-center gap-3 rounded-md border border-border bg-bg-subtle/50 p-3 text-left disabled:opacity-70"
                disabled={claimed}
                onClick={claimCrate}
              >
                <ItemIcon item="crate" size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {claimed ? `Day ${crateDay} claimed` : `Claim day ${crateDay} crate`}
                  </p>
                  <p className="text-xs text-fg-muted">
                    Login streak {crateDay}/{CRATE_MAX}. One missed day is forgiven.
                    {crateDay >= 30 ? " A violet is in the box." : ""}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                    {TIERS.filter((t) => loot[t] > 0).map((t) => (
                      <span key={t} className="inline-flex items-center gap-1">
                        <ItemIcon item={t} size={22} />
                        {loot[t]} {TIER_LABEL[t]}
                      </span>
                    ))}
                  </p>
                </div>
              </button>
              <p>
                <span className="text-fg-muted">Points</span>{" "}
                <span className="tabular-nums">{points.toLocaleString()}</span>
              </p>
              <p>
                <span className="text-fg-muted">Lamps lit</span>{" "}
                <span className="tabular-nums">{vaultsOpened}</span>
              </p>
              <p>
                <span className="text-fg-muted">Best streak</span>{" "}
                <span className="tabular-nums">{bestStreak}</span>
              </p>
              <p>
                <span className="text-fg-muted">Distance walked</span>{" "}
                <span className="tabular-nums">{(distanceM / 1000).toFixed(1)} km</span>
              </p>
              <p>
                <span className="text-fg-muted">Fares</span>{" "}
                <span className="tabular-nums">{fares}</span>
                <span className="text-fg-subtle"> · punch at {desk.name}</span>
              </p>
              <p>
                <span className="text-fg-muted">Atlas</span>{" "}
                {city.pois.filter((p) => atlas[p.id]).length} / {city.pois.length}
                <span className="text-fg-subtle"> · {Object.keys(atlas).length} filed</span>
              </p>
              <p className="kicker mt-2">Survey</p>
              <ul className="grid gap-2">
                {SURVEY_GOALS.filter((g) => g.kind !== "ward" || g.cityId === cityId).map((g) => {
                  const have = surveyHave(g, atlas, distanceM);
                  const done = Boolean(survey[g.id]);
                  return (
                    <li
                      key={g.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-subtle/50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className={done ? "text-fg-muted" : "font-medium"}>{g.label}</p>
                        <p className="text-xs text-fg-muted">{g.blurb}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <ItemIcon item={g.reward} size={22} />
                        <span className="text-xs tabular-nums text-fg-muted">
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
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" className="btn btn-ghost" onClick={startContract}>
                  {contract ? "Reroll contract" : "Take a contract"}
                </button>
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => {
                    toggleHq(false);
                    sfx.ui();
                    useGame.setState({ toast: `Walk to ${desk.name}. Punch a fare there.` });
                  }}
                >
                  Other wards
                </button>
              </div>
              <p className="text-xs text-fg-subtle">
                The atlas is a record, not a ride. Earn a fare in this city — three lamps — then punch it at{" "}
                {desk.name}. The clock runs while you’re away. You walk from the far station. The cab stays.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
