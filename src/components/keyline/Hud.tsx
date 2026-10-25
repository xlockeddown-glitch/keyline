import { SkyChip } from "./Sky";
import { useDoubleMinutes } from "@/game/doubleClient";
import { useEffect, useRef, useState } from "react";
import { BookOpen, CircleHelp } from "lucide-react";
import { creditHint } from "@/game/goals";
import { CREDIT_CALM_MS, Calm } from "@/game/calm";
import { LevelHudBadge } from "./Levels";
import { livePois } from "@/game/nightMarket";
import { dealerOf } from "@/game/cars";
import { houseOf, lotOf } from "@/game/houses";
import { CITIES, CLIMB_ID, CLIMB_POI, KIND_LABEL, RUN_ID, RUN_POI, STACK_ID, STACK_POI, TIER_LABEL, interactRadius, isBoard, isCounter, isScoutShop, seriesOf } from "@/game/data";
import { TIERS } from "@/game/items";
import { formatDist } from "@/game/geo";
import { formatCool, isFareDesk, SPARK_DAY, ticketHint, VAULTS_PER_FARE } from "@/game/ticket";
import { blitzDue } from "@/game/dailyBlitz";
import { useGame } from "@/game/store";
import type { Tier } from "@/game/types";
import { ItemIcon } from "./ItemIcon";
import { TouchPad } from "./TouchPad";
import { AudioDock } from "./AudioDock";
import { DailyHudLine, DailyKitButton } from "./DailyRun";
import { MarketHudLine, useMarket } from "./NightMarket";
import { MARKET_TAG, onMarket } from "@/game/nightMarket";

type Props = {
  onVector: (x: number, y: number) => void;
  onInteract: () => void;
  onCab: () => void;
  onTimetable: () => void;
  onDesk: () => void;
  onMarket: () => void;
  onRoute: () => void;
};

function rangePips(dist: number, reachM: number) {
  if (dist <= reachM) return 4;
  if (dist <= reachM * 4) return 3;
  if (dist <= 400) return 2;
  return 1;
}

export function Hud({ onVector, onInteract, onCab, onTimetable, onDesk, onMarket: onMarketWalk, onRoute }: Props) {
  const keys = useGame((s) => s.keys);
  const liveCredit = useGame((s) => s.credit);
  // 0.0.99: the pip shows a credit change once, after the server's pocket has landed (no 1/3 ↔ none flicker).
  const [credit, setCredit] = useState(liveCredit);
  const calm = useRef<Calm<typeof liveCredit> | null>(null);
  if (!calm.current) calm.current = new Calm(liveCredit, CREDIT_CALM_MS, setCredit);
  useEffect(() => calm.current!.push(liveCredit), [liveCredit]);
  useEffect(() => () => calm.current?.stop(), []);
  const points = useGame((s) => s.points);
  const hud = useGame((s) => s.hud);
  const dealerNear = useGame((s) => s.dealerNear);
  const setDealerOpen = useGame((s) => s.setDealerOpen);
  const houseNear = useGame((s) => s.houseNear);
  const setHouseOpen = useGame((s) => s.setHouseOpen);
  const myHouse = useGame((s) => s.houses[s.cityId]);
  const carOn = useGame((s) => s.carOn);
  const cityId = useGame((s) => s.cityId);
  const toggleHq = useGame((s) => s.toggleHq);
  const lastBlitzDay = useGame((s) => s.lastBlitzDay);
  const toggleInv = useGame((s) => s.toggleInv);
  const toggleGuide = useGame((s) => s.toggleGuide);
  const streak = useGame((s) => s.streak);
  const vaults = useGame((s) => s.vaults);
  const busy = useGame((s) => Boolean(s.openVault || s.hqOpen || s.invOpen));
  const city = CITIES[cityId];
  const run = useGame((s) => s.run);
  const stack = useGame((s) => s.stack);
  const runLive = Boolean(run && run.readyAt === 0);
  const stackLive = Boolean(stack && stack.readyAt === 0);
  const climb = useGame((s) => s.climb);
  const climbLive = Boolean(climb && climb.readyAt === 0);
  const seriesNear = seriesOf(hud.nearestId ?? "");
  const blanks = useGame((s) => s.blanks);
  const nearest =
    hud.nearestId === RUN_ID && runLive && run
      ? { ...RUN_POI, lat: run.lat, lng: run.lng }
      : hud.nearestId === STACK_ID && stackLive && stack
        ? { ...STACK_POI, lat: stack.lat, lng: stack.lng }
        : hud.nearestId === CLIMB_ID && climbLive && climb
          ? { ...CLIMB_POI, lat: climb.lat, lng: climb.lng }
          : livePois(city, blanks).find((p) => p.id === hud.nearestId);
  const reachM = interactRadius();
  const service = Boolean(nearest && (isScoutShop(nearest) || isCounter(nearest) || isBoard(nearest)));
  const recasting = Boolean(nearest && !seriesNear && !service && (vaults[nearest.id]?.coolUntil ?? 0) > Date.now());
  const inReach = Boolean(nearest && hud.nearestDist <= reachM);
  const atShop = Boolean(nearest && isScoutShop(nearest) && inReach && !hud.seated);
  const atCounter = Boolean(nearest && isCounter(nearest) && inReach && !hud.seated);
  const atBoard = Boolean(nearest && isBoard(nearest) && inReach && !hud.seated);
  const needTier: Tier | null = nearest && !recasting && !service ? nearest.tier : null;
  const haveKey = Boolean(needTier && keys[needTier] > 0);
  const sparkDay = useGame((s) => s.sparkDay);
  const sparkN = useGame((s) => s.sparkN);
  const sparkLamps = useGame((s) => s.sparkLamps);
  const today = new Date().toISOString().slice(0, 10);
  const blitzReady = blitzDue(lastBlitzDay, today);
  const sparksLeft = (sparkDay === today ? SPARK_DAY - sparkN : SPARK_DAY);
  const sparkedHere = Boolean(nearest && sparkDay === today && sparkLamps.includes(nearest.id));
  const canSpark = Boolean(
    inReach && needTier && !haveKey && !recasting && !seriesNear && !service && sparksLeft > 0 && !sparkedHere,
  );
  const armed = Boolean(atShop || atCounter || atBoard || (inReach && haveKey && !recasting) || canSpark);
  const fares = useGame((s) => s.fares);
  const cityVaults = useGame((s) => s.cityVaults);
  const belt = TIERS.filter((t) => t === "white" || t === "blue" || t === "green" || keys[t] > 0 || needTier === t);
  const pips = nearest ? rangePips(hud.nearestDist, reachM) : 0;
  const { market } = useMarket(cityId);
  const marketHere = Boolean(
    nearest &&
      !service &&
      onMarket(market, seriesNear ? { kind: "series", lat: nearest.lat, lng: nearest.lng } : { kind: "lamp", poiId: nearest.id, lat: nearest.lat, lng: nearest.lng }),
  );

  const atDesk = Boolean(nearest && isFareDesk(nearest) && inReach && !hud.seated);
  const canPunch = atDesk && fares > 0;
  // 0.0.56: the station desk also opens the timetable without a ticket when there's a city to unlock (free pick or a pass).
  const freePick = useGame((s) => s.cities.freePick);
  const passes = useGame((s) => s.cities.passes);
  const canUnlock = atDesk && (freePick || passes > 0);
  const canDesk = canPunch || canUnlock;

  const cabSeat = hud.seated && !hud.ownCar; // 0.1.14: your own car answers lamps; the cab still parks first
  let cue = cabSeat ? "Park at the curb. The door is on foot." : hud.seated ? "Tap a lamp to drive to its curb." : "Click the map to walk.";
  if (nearest) {
    if (cabSeat || (hud.seated && service)) cue = `${formatDist(hud.nearestDist)} · curb, then walk`;
    else if (canPunch) cue = `Board train · T · ${nearest.name}`;
    else if (canUnlock) cue = `Train station · T · unlock a city (${freePick ? "free pick" : `${passes} pass${passes === 1 ? "" : "es"}`})`;
    else if (atDesk && !fares) cue = `Train station. ${ticketHint(cityVaults)}.`;
    else if (atShop) cue = `${nearest.name} · coats for hire · E`;
    else if (atCounter) cue = `${nearest.name} · crate, matches, exchange · E`;
    else if (atBoard) cue = `${nearest.name} · contracts and the blitz · E`;
    else if (nearest && isScoutShop(nearest)) cue = `${formatDist(hud.nearestDist)} · brass awning, coats`;
    else if (nearest && isCounter(nearest)) cue = `${formatDist(hud.nearestDist)} · street counter`;
    else if (nearest && isBoard(nearest)) cue = `${formatDist(hud.nearestDist)} · notice board`;
    else if (seriesNear) {
      if (inReach && !haveKey) cue = `Need a ${TIER_LABEL[seriesNear.cost]} match for ${seriesNear.name}`;
      else if (armed) cue = `${seriesNear.name} · ${seriesNear.steps} trivia cards · E`;
      else cue = `${formatDist(hud.nearestDist)} · ${seriesNear.kicker}`;
    } else if (recasting) {
      const left = (vaults[nearest.id]?.coolUntil ?? 0) - Date.now();
      cue = left > 45 * 60_000 ? `Dark for ${formatCool(left)}` : "Resting. Come back soon to try it again.";
    } else if (inReach && !haveKey) {
      cue = canSpark
        ? `Strike a spark · E — earn a ${TIER_LABEL[nearest.tier]} match`
        : sparkedHere
          ? `Need a ${TIER_LABEL[nearest.tier]} match. Wick is spent here.`
          : sparksLeft < 1
            ? `Need a ${TIER_LABEL[nearest.tier]} match. Sparks are spent today.`
            : `Need a ${TIER_LABEL[nearest.tier]} match`;
    }
    else if (armed) cue = "At the lamp · E or tap";
    else cue = hud.routeStops > 0 ? `${formatDist(hud.nearestDist)} · tap to go there instead` : `${formatDist(hud.nearestDist)} · click to walk`;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[500] flex flex-col justify-between p-3 sm:p-4">
      {/* Phones (<640px): the button row sits on top and the status plate stacks under it at full width
          (side by side, the button row left the plate ~30 px). 640–1023px (phone landscape, tablets): side by side,
          the buttons drop their labels. lg and up (desktop): unchanged. */}
      <div className="hud-top flex flex-col-reverse items-stretch gap-2 pl-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="hud-plate hud-status pointer-events-none min-w-0" data-testid="hud-status">
          <div className="flex items-start gap-3">
            {fares > 0 || hud.routeStops > 0 ? (
              <div className="hud-compass" title={fares > 0 ? `Toward ${hud.deskName}` : "Toward your stop"} aria-hidden>
                <i style={{ transform: `rotate(${hud.aimDeg}deg)` }} />
              </div>
            ) : null}
            <div className="min-w-0">
          <LevelHudBadge />
          <p className="kicker">
            {city.name}
            {fares === 0 ? ` · ticket ${cityVaults}/${VAULTS_PER_FARE}` : ""}
          </p>
          <p className="font-display flex items-center gap-2 text-3xl leading-none tabular-nums">
            <ItemIcon item="coin" size={28} />
            {points.toLocaleString()}
            {streak > 1 ? (
              <span className="align-middle text-sm font-sans text-fg-muted">×{streak}</span>
            ) : null}
          </p>
            </div>
          </div>
          <DoubleNote />
          {hud.routeStops >= 1 || hud.waypoint ? (
            <div className="route-row mt-1">
              <button type="button" className="fare-hint pointer-events-auto" onClick={onRoute}>
                <span className="kicker mr-1.5">Route</span>
                {hud.routeHold ? `Next stop · ${hud.routeStops - 1} left` : hud.routeStops === 1 ? "1 stop" : `${hud.routeStops} stops`}
              </button>
              <button
                type="button"
                className="route-cancel pointer-events-auto"
                data-testid="route-cancel"
                aria-label="Stop walking (cancel route)"
                onClick={() => useGame.getState().cancelRoute()}
              >
                <span aria-hidden>■</span> Stop
              </button>
            </div>
          ) : null}
          {fares > 0 && !canPunch ? (
            <button type="button" className="fare-hint pointer-events-auto mt-1" onClick={onDesk}>
              <span className="kicker mr-1.5">Train</span>
              Walk to {hud.deskName}
              <span className="tabular-nums text-fg-subtle"> · {formatDist(hud.deskDist)}</span>
            </button>
          ) : fares > 0 ? (
            <p className="mt-1 truncate text-xs text-fg-muted">
              <span className="kicker mr-1.5">Train</span>
              {hud.deskName} · T to board
            </p>
          ) : null}
          <DailyHudLine />
          <MarketHudLine onWalk={onMarketWalk} />
          <SkyChip />
        </div>

        <div className="hud-kits flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <AudioDock />
          <DailyKitButton />
          <button
            type="button"
            className="hud-plate is-kit pointer-events-auto"
            onClick={() => toggleGuide(true)}
            aria-label="How to play"
          >
            <CircleHelp className="size-4 text-fg-muted" strokeWidth={1.75} />
            <span className="hidden lg:block">
              <span className="kicker">Help</span>
              <span className="block text-xs text-fg-muted">?</span>
            </span>
          </button>
          <button
            type="button"
            className="hud-plate is-kit pointer-events-auto"
            onClick={() => toggleInv(true)}
            aria-label="Open satchel"
          >
            <span className="relative">
              <ItemIcon item="satchel" size={28} />
            </span>
            <span className="hidden lg:block">
              <span className="kicker">Satchel</span>
              <span className="block text-xs text-fg-muted">I</span>
            </span>
          </button>
          <button
            type="button"
            className="hud-plate is-kit pointer-events-auto relative"
            onClick={() => toggleHq(true)}
            aria-label={blitzReady ? "Open Journal, Daily Blitz waiting" : "Open Journal"}
          >
            <BookOpen className="size-4 text-fg-muted" strokeWidth={1.75} />
            <span className="kicker hidden lg:inline">Journal</span>
            {blitzReady ? <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent" aria-hidden /> : null}
          </button>
        </div>
      </div>

      {busy || !houseNear || hud.seated ? null : (
        // 0.1.12: on foot at the house lot → the house sheet.
        <button type="button" className="dealer-btn pointer-events-auto" data-testid="house-btn" onClick={() => setHouseOpen(true)}>
          {myHouse ? <><span className="kicker">Your door</span> {houseOf(myHouse.tier)?.name}</> : <><span className="kicker">House</span> {lotOf(cityId).name}</>}
        </button>
      )}
      {busy || !dealerNear || hud.seated ? null : (
        // 0.1.8: on foot at the car lot → the showroom.
        <button type="button" className="dealer-btn pointer-events-auto" data-testid="dealer-btn" onClick={() => setDealerOpen(true)}>
          <span className="kicker">Car lot</span> {dealerOf(cityId).name} · Showroom
        </button>
      )}
      {busy ? null : (
        <div className="hud-dock">
          <div className="hud-tools">
            <div className="hud-tool-row">
            <button
              type="button"
              className="key-belt pointer-events-auto"
              onClick={() => toggleInv(true)}
              aria-label="Matches, open satchel"
            >
              {belt.map((t) => (
                <span key={t} className={`key-slot ${needTier === t ? "is-mark" : ""}`} title={creditHint(credit, t) ?? undefined}>
                  <ItemIcon item={t} size={22} />
                  <span className="tabular-nums">{keys[t]}</span>
                  {credit[t] ? <span className="credit-pip" data-testid={`credit-${t}`}>{credit[t]}/3</span> : null}
                </span>
              ))}
              <span
                className={`key-slot ${canPunch || fares > 0 ? "is-mark" : ""}`}
                title={fares > 0 ? `Walk to ${hud.deskName}` : "Train tickets"}
                onClick={(e) => {
                  e.stopPropagation();
                  onDesk();
                }}
              >
                <i className="fare-stub" />
                <span className="tabular-nums">{fares}</span>
              </span>
            </button>
            <button
              type="button"
              className={`cab-chip pointer-events-auto ${hud.seated ? "is-on" : ""}`}
              onClick={onCab}
              aria-label={hud.seated ? (carOn ? "Park car" : "Park cab") : carOn ? "Drive your car" : "Hail cab"}
            >
              <span className="kicker">{hud.seated ? "Park" : carOn ? "Car" : "Cab"}</span>
            </button>
            </div>
            <TouchPad onVector={onVector} />
          </div>

          <button
            type="button"
            className={`sight pointer-events-auto ${armed ? "is-armed" : ""} ${inReach && !haveKey && !recasting && !service ? "is-need" : ""}`}
            onClick={onInteract}
            disabled={!nearest}
            data-testid="hud-sight"
          >
            {nearest ? (
              <>
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="kicker min-w-0 truncate">
                    {seriesNear
                      ? `${seriesNear.name} · ${seriesNear.steps} trivia cards`
                      : isScoutShop(nearest)
                        ? "Outfitter"
                        : isCounter(nearest)
                          ? "Counter"
                          : isBoard(nearest)
                            ? "Notice"
                            : isFareDesk(nearest)
                        ? `Train station · ${KIND_LABEL[nearest.kind]}`
                        : `${TIER_LABEL[nearest.tier]} · ${KIND_LABEL[nearest.kind]}`}
                    {marketHere ? <span className="market-x" data-testid="market-lamp"> · {MARKET_TAG}</span> : null}
                  </p>
                  <span className="range-pips" aria-hidden>
                    {Array.from({ length: 4 }, (_, i) => (
                      <i key={i} className={i < pips ? "on" : ""} />
                    ))}
                  </span>
                </div>
                <p className="sight-name font-display mt-1 truncate text-xl leading-tight">{nearest.name}</p>
                <p className="sight-cue mt-1 text-xs text-fg-muted">{cue}</p>
              </>
            ) : (
              <p className="text-sm text-fg-muted">{cue}</p>
            )}
          </button>

          <button
            type="button"
            className={`act-btn pointer-events-auto ${canDesk ? "is-armed" : armed ? "is-armed" : ""}`}
            onClick={canDesk ? onTimetable : onInteract}
            aria-label={canPunch ? "Board train" : canUnlock ? "Open timetable" : atShop ? "Open outfitter" : atCounter ? "Open counter" : atBoard ? "Open notice" : armed ? "Light lamp" : "Interact"}
          >
            {canDesk ? "T" : "E"}
          </button>
        </div>
      )}
    </div>
  );
}

/** 0.1.44: a new player's first hour pays double coin. */
function DoubleNote() {
  const min = useDoubleMinutes();
  if (!min) return null;
  return (
    <p className="double-note mt-1 text-xs font-semibold" data-testid="double-note">
      Double rewards: {min} min left
    </p>
  );
}
