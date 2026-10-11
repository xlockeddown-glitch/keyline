import { X } from "lucide-react";
import { CITIES, cityBoard } from "@/game/data";
import { BLITZ_FULL, blitzDue, blitzTakeLine } from "@/game/dailyBlitz";
import { INGREDIENTS, cityStaple } from "@/game/ingredients";
import { sfx } from "@/game/audio";
import { useGame } from "@/game/store";
import { ItemIcon } from "./ItemIcon";
import { QuestDesk } from "./HqPanel";
import { useSheetOpen } from "./useSheetOpen";

/** The notice board: the day's blitz, a contract, and quest turn-in. */
export function NoticeBoard() {
  const open = useGame((s) => s.errandOpen === "board");
  const close = useGame((s) => s.closeErrand);
  const cityId = useGame((s) => s.cityId);
  const place = cityBoard(cityId);
  const city = CITIES[cityId];
  const pantry = useGame((s) => s.pantry);
  const quests = useGame((s) => s.quests);
  const charms = useGame((s) => s.charms);
  const distanceM = useGame((s) => s.distanceM);
  const claimErrand = useGame((s) => s.claimErrand);
  const claimCircuit = useGame((s) => s.claimCircuit);
  const claimLongQuest = useGame((s) => s.claimLong);
  const wearCloth = useGame((s) => s.wearCloth);
  const openBlitz = useGame((s) => s.openBlitz);
  const lastBlitzDay = useGame((s) => s.lastBlitzDay);
  const blitzTake = useGame((s) => s.blitzTake);
  const blitzMatches = useGame((s) => s.blitzMatches);
  const startContract = useGame((s) => s.startContract);
  const contract = useGame((s) => s.contract);
  const today = new Date().toISOString().slice(0, 10);
  const blitzReady = blitzDue(lastBlitzDay, today);

  useSheetOpen(open);
  if (!open || !place) return null;

  return (
    <div className="absolute inset-0 z-[700] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div className="panel sheet-bottom flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Notice · {city.name}</p>
            <h2 className="font-display text-2xl">{place.name}</h2>
            <p className="mt-1 text-sm text-pretty text-fg-muted">{place.lore}</p>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => close()} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 text-sm">
            <button
              type="button"
              className="hq-row w-full text-left disabled:opacity-70"
              disabled={!blitzReady}
              onClick={() => {
                sfx.ui();
                close();
                openBlitz();
              }}
            >
              <ItemIcon item="coin" size={40} />
              <div className="hq-row-copy">
                <p className="hq-row-title">{blitzReady ? "Daily Blitz" : "Daily Blitz done"}</p>
                <p className="hq-row-sub">
                  {blitzReady
                    ? `Six lanterns, white to violet. Coin and a match each. A miss keeps both. Full clear ${BLITZ_FULL}.`
                    : blitzTake > 0 || blitzMatches.length > 0
                      ? `+${blitzTakeLine(blitzTake, blitzMatches)} today. The next ladder is tomorrow.`
                      : "Played today. The next ladder is tomorrow."}
                </p>
              </div>
            </button>
            <button type="button" className="btn btn-ghost" onClick={startContract}>
              {contract ? "Reroll contract" : "Take a contract"}
            </button>
            <QuestDesk
              act
              cityId={cityId}
              cityName={city.name}
              staple={pantry[cityStaple(cityId)] ?? 0}
              stapleName={INGREDIENTS[cityStaple(cityId)].name}
              charms={charms.length}
              distanceM={distanceM}
              quests={quests}
              onErrand={claimErrand}
              onCircuit={claimCircuit}
              onLong={claimLongQuest}
              onWear={wearCloth}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
