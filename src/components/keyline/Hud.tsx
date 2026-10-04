import { BookOpen, CircleHelp } from "lucide-react";
import { CITIES, KIND_LABEL, RUN_ID, RUN_POI, STACK_ID, STACK_POI, TIER_LABEL, allPois, interactRadius, isScoutShop, seriesOf } from "@/game/data";
import { TIERS } from "@/game/items";
import { formatDist } from "@/game/geo";
import { nextSurvey } from "@/game/survey";
import { formatCool, isFareDesk, SPARK_DAY, ticketHint, VAULTS_PER_FARE } from "@/game/ticket";
import { pulseDue } from "@/game/pulse";
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
  autoSprint: boolean;
  onAutoSprint: () => void;
  onTimetable: () => void;
  onDesk: () => void;
  onMarket: () => void;
};

function rangePips(dist: number, reachM: number) {
  if (dist <= reachM) return 4;
  if (dist <= reachM * 4) return 3;
  if (dist <= 400) return 2;
  return 1;
}

export function Hud({ onVector, onInteract, onCab, autoSprint, onAutoSprint, onTimetable, onDesk, onMarket: onMarketWalk }: Props) {
  const keys = useGame((s) => s.keys);
  const points = useGame((s) => s.points);
  const hud = useGame((s) => s.hud);
  const cityId = useGame((s) => s.cityId);
  const toggleHq = useGame((s) => s.toggleHq);
  const lastPulseDay = useGame((s) => s.lastPulseDay);
  const toggleInv = useGame((s) => s.toggleInv);
  const replayTutorial = useGame((s) => s.replayTutorial);
  const streak = useGame((s) => s.streak);
  const contract = useGame((s) => s.contract);
  const equipped = useGame((s) => s.equipped);
  const vaults = useGame((s) => s.vaults);
  const busy = useGame((s) => Boolean(s.openVault || s.hqOpen || s.invOpen));
  const city = CITIES[cityId];
  const run = useGame((s) => s.run);
  const stack = useGame((s) => s.stack);
  const runLive = Boolean(run && run.readyAt === 0);
  const stackLive = Boolean(stack && stack.readyAt === 0);
  const seriesNear = seriesOf(hud.nearestId ?? "");
  const blanks = useGame((s) => s.blanks);
  const nearest =
    hud.nearestId === RUN_ID && runLive && run
      ? { ...RUN_POI, lat: run.lat, lng: run.lng }
      : hud.nearestId === STACK_ID && stackLive && stack
        ? { ...STACK_POI, lat: stack.lat, lng: stack.lng }
        : allPois(city, blanks).find((p) => p.id === hud.nearestId);
  const reachM = interactRadius(equipped === "lantern");
  const recasting = Boolean(nearest && !seriesNear && !isScoutShop(nearest) && (vaults[nearest.id]?.coolUntil ?? 0) > Date.now());
  const inReach = Boolean(nearest && hud.nearestDist <= reachM);
  const atShop = Boolean(nearest && isScoutShop(nearest) && inReach && !hud.seated);
  const needTier: Tier | null = nearest && !recasting && !isScoutShop(nearest) ? nearest.tier : null;
  const haveKey = Boolean(needTier && keys[needTier] > 0);
  const sparkDay = useGame((s) => s.sparkDay);
  const sparkN = useGame((s) => s.sparkN);
  const sparkLamps = useGame((s) => s.sparkLamps);
  const today = new Date().toISOString().slice(0, 10);
  const pulseReady = pulseDue(lastPulseDay, today);
  const sparksLeft = (sparkDay === today ? SPARK_DAY - sparkN : SPARK_DAY);
  const sparkedHere = Boolean(nearest && sparkDay === today && sparkLamps.includes(nearest.id));
  const canSpark = Boolean(
    inReach && needTier && !haveKey && !recasting && !seriesNear && !isScoutShop(nearest) && sparksLeft > 0 && !sparkedHere,
  );
  const armed = Boolean(atShop || (inReach && haveKey && !recasting) || canSpark);
  const nextContract = contract?.ids.find((id) => !contract.done.includes(id));
  const nextName = nextContract ? city.pois.find((p) => p.id === nextContract)?.name : null;
  const surveyLine = useGame((s) => nextSurvey(s)?.line ?? null);
  const fares = useGame((s) => s.fares);
  const cityVaults = useGame((s) => s.cityVaults);
  const belt = TIERS.filter((t) => t === "white" || t === "blue" || t === "green" || keys[t] > 0 || needTier === t);
  const pips = nearest ? rangePips(hud.nearestDist, reachM) : 0;
  const { market } = useMarket(cityId);
  const marketHere = Boolean(
    nearest &&
      !isScoutShop(nearest) &&
      onMarket(market, seriesNear ? { kind: "series", lat: nearest.lat, lng: nearest.lng } : { kind: "lamp", poiId: nearest.id, lat: nearest.lat, lng: nearest.lng }),
  );

  const atDesk = Boolean(nearest && isFareDesk(nearest) && inReach && !hud.seated);
  const canPunch = atDesk && fares > 0;
  // 0.0.55: the station desk also opens the timetable without a ticket when there's a city to unlock (free pick or a pass).
  const freePick = useGame((s) => s.cities.freePick);
  const passes = useGame((s) => s.cities.passes);
  const canUnlock = atDesk && (freePick || passes > 0);
  const canDesk = canPunch || canUnlock;

  let cue = hud.seated ? "Park at the curb. The door is on foot." : "Lamps mark the questions. Click the map to walk.";
  if (nearest) {
    if (hud.seated) cue = `${formatDist(hud.nearestDist)} · curb, then walk`;
    else if (canPunch) cue = `Board train · T · ${nearest.name}`;
    else if (canUnlock) cue = `Train station · T · unlock a city (${freePick ? "free pick" : `${passes} pass${passes === 1 ? "" : "es"}`})`;
    else if (atDesk && !fares) cue = `Train station. ${ticketHint(cityVaults)}.`;
    else if (atShop) cue = `${nearest.name} · coats for hire · E`;
    else if (nearest && isScoutShop(nearest)) cue = `${formatDist(hud.nearestDist)} · brass awning, coats`;
    else if (seriesNear) {
      if (inReach && !haveKey) cue = `Need a ${TIER_LABEL[seriesNear.cost]} match for ${seriesNear.name}`;
      else if (armed) cue = `${seriesNear.name} · ${seriesNear.steps} trivia cards · E`;
      else cue = `${formatDist(hud.nearestDist)} · ${seriesNear.kicker}`;
    } else if (recasting) {
      const left = (vaults[nearest.id]?.coolUntil ?? 0) - Date.now();
      cue = left > 45 * 60_000 ? `Dark for ${formatCool(left)}` : "Recasting — come back later";
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
    else cue = `${formatDist(hud.nearestDist)} · click to walk`;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[500] flex flex-col justify-between p-3 sm:p-4">
      {/* Phones (<640px): the button row sits on top and the status plate stacks under it at full width
          (side by side, the button row left the plate ~30 px). 640–1023px (phone landscape, tablets): side by side,
          the buttons drop their labels. lg and up (desktop): unchanged. */}
      <div className="hud-top flex flex-col-reverse items-stretch gap-2 pl-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="hud-plate hud-status pointer-events-none min-w-0" data-testid="hud-status">
          <div className="flex items-start gap-3">
            <div className="hud-compass" title={fares > 0 ? `Toward ${hud.deskName}` : "Toward your waypoint"} aria-hidden>
              <i style={{ transform: `rotate(${hud.aimDeg}deg)` }} />
            </div>
            <div className="min-w-0">
          <p className="kicker">
            {city.name}
            {fares === 0 ? ` · ${cityVaults}/${VAULTS_PER_FARE} ticket` : ""}
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
          {contract && nextName ? (
            <p className="mt-1 truncate text-xs text-fg-muted">
              <span className="kicker mr-1.5">Next</span>
              {nextName}
              <span className="tabular-nums text-fg-subtle">
                {" "}
                {contract.done.length}/{contract.ids.length}
              </span>
            </p>
          ) : null}
          {surveyLine ? (
            <p className="mt-1 truncate text-xs text-fg-muted">
              <span className="kicker mr-1.5">Goals</span>
              {surveyLine}
            </p>
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
          ) : (
            <p className="mt-1 truncate text-xs text-fg-muted">
              <span className="kicker mr-1.5">Train</span>
              {ticketHint(cityVaults)}
            </p>
          )}
          <DailyHudLine />
          <MarketHudLine onWalk={onMarketWalk} />
        </div>

        <div className="hud-kits flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <AudioDock />
          <DailyKitButton />
          <button
            type="button"
            className="hud-plate is-kit pointer-events-auto"
            onClick={() => replayTutorial()}
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
              {equipped ? (
                <span className="absolute -right-1 -bottom-1">
                  <ItemIcon item={equipped} size={16} />
                </span>
              ) : null}
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
            aria-label={pulseReady ? "Open Journal, City Pulse waiting" : "Open Journal"}
          >
            <BookOpen className="size-4 text-fg-muted" strokeWidth={1.75} />
            <span className="kicker hidden lg:inline">Journal</span>
            {pulseReady ? <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent" aria-hidden /> : null}
          </button>
        </div>
      </div>

      {busy ? null : (
        <div className="hud-dock">
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              className="key-belt pointer-events-auto"
              onClick={() => toggleInv(true)}
              aria-label="Matches, open satchel"
            >
              {belt.map((t) => (
                <span key={t} className={`key-slot ${needTier === t ? "is-mark" : ""}`}>
                  <ItemIcon item={t} size={22} />
                  <span className="tabular-nums">{keys[t]}</span>
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
            <TouchPad onVector={onVector} stamina={hud.stamina} />
            <button
              type="button"
              className={`hud-plate is-kit pointer-events-auto ${autoSprint ? "is-on" : ""}`}
              onClick={onAutoSprint}
              aria-pressed={autoSprint}
              aria-label={autoSprint ? "Auto-sprint on" : "Auto-sprint off"}
            >
              <span className="kicker">Run</span>
              <span className="block text-xs text-fg-muted">{autoSprint ? "On" : "Off"}</span>
            </button>
            <button
              type="button"
              className={`hud-plate is-kit pointer-events-auto ${hud.seated ? "is-cab" : ""}`}
              onClick={onCab}
              aria-label={hud.seated ? "Park cab" : "Hail cab"}
            >
              <span className="kicker">{hud.seated ? "Park" : "Cab"}</span>
              <span className="block text-xs text-fg-muted">F</span>
            </button>
          </div>

          <button
            type="button"
            className={`sight pointer-events-auto ${armed ? "is-armed" : ""} ${inReach && !haveKey && !recasting && !isScoutShop(nearest) ? "is-need" : ""}`}
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
            aria-label={canPunch ? "Board train" : canUnlock ? "Open timetable" : atShop ? "Open outfitter" : armed ? "Light lamp" : "Interact"}
          >
            {canDesk ? "T" : "E"}
          </button>
        </div>
      )}
    </div>
  );
}
