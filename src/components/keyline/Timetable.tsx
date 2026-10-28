import { X } from "lucide-react";
import { sfx } from "@/game/audio";
import { fareMs, formatEta, otherWards } from "@/game/ticket";
import { useGame } from "@/game/store";
import type { CityId } from "@/game/types";
import { unlockCost } from "@/game/cityPass";
import { LockNote, PassHelpCard, PassProgressRow } from "./CityPass";
import { useSheetOpen } from "./useSheetOpen";

export type Ride = "skip" | "loop" | "train";
type Props = { onClose: () => void; onPunch: (id: CityId, how: Ride) => void };

export function Timetable({ onClose, onPunch }: Props) {
  const cityId = useGame((s) => s.cityId);
  const fares = useGame((s) => s.fares);
  const seated = useGame((s) => s.hud.seated);
  const cities = useGame((s) => s.cities);
  const unlock = useGame((s) => s.unlockCity);
  useSheetOpen(true);

  function punch(id: CityId, how: Ride) {
    sfx.ui();
    onPunch(id, how);
  }

  return (
    <div className="absolute inset-0 z-[740] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div className="panel sheet-bottom flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Timetable</p>
            <h2 className="font-display text-2xl">Travel</h2>
            <p className="mt-1 text-sm text-fg-muted">
              {seated
                ? "Park first. The window doesn’t take a ticket."
                : fares
                  ? `${fares} ticket${fares === 1 ? "" : "s"} in the pocket. Arrive now, or ride the Loop for a tunnel poster and the odd crate.`
                  : "Need a train ticket. Light 3 lamps in this city."}
            </p>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <ul className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <li className="border-b border-border pb-3">
            {otherWards(cityId).some((c) => unlockCost(cities, c.id) !== "open") ? <PassHelpCard /> : <PassProgressRow compact />}
          </li>
          {[...otherWards(cityId)].sort((a, b) => Number(unlockCost(cities, a.id) !== "open") - Number(unlockCost(cities, b.id) !== "open")).map((c) => {
            const eta = formatEta(fareMs(cityId, c.id));
            const cost = unlockCost(cities, c.id);
            if (cost !== "open") {
              // 0.0.56: a locked city shows the lock, what it needs, and unlocks here (free second pick or a pass).
              return (
                <li key={c.id} className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-0" data-testid={`ward-locked-${c.id}`}>
                  <span className="min-w-0">
                    <span className="font-display text-xl leading-none text-fg-muted">{c.name}</span>
                    <span className="mt-1 block kicker">{c.region}</span>
                    <LockNote id={c.id} short />
                  </span>
                  {cost === "free" || cost === "pass" ? (
                    <button
                      type="button"
                      className={`btn ${cost === "pass" ? "btn-primary" : "btn-quiet"} shrink-0 px-3 text-xs`}
                      data-testid={`unlock-${c.id}`}
                      onClick={() => {
                        sfx.ui();
                        unlock(c.id);
                      }}
                    >
                      {cost === "free" ? "Unlock · free" : "Use pass"}
                    </button>
                  ) : null}
                </li>
              );
            }
            const off = fares < 1 || seated;
            return (
              <li key={c.id} className="border-b border-border py-3 last:border-0" data-testid={`ward-${c.id}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span>
                    <span className="font-display text-xl leading-none">{c.name}</span>
                    <span className="mt-1 block kicker">{c.region}</span>
                  </span>
                  <span className="flex shrink-0 gap-2">
                    <button type="button" className="btn btn-quiet px-3 text-xs" disabled={off} data-testid={`skip-${c.id}`} onClick={() => punch(c.id, "skip")}>
                      Arrive
                    </button>
                    <button type="button" className="btn btn-primary px-3 text-xs" disabled={off} data-testid={`loop-${c.id}`} onClick={() => punch(c.id, "loop")}>
                      Loop
                    </button>
                  </span>
                </div>
                <button type="button" className="mt-1 text-xs text-fg-subtle underline-offset-2 hover:underline disabled:opacity-50" disabled={off} data-testid={`train-${c.id}`} onClick={() => punch(c.id, "train")}>
                  Or take the train · {eta} · games on board
                </button>
              </li>
            );
          })}
        </ul>
        <p className="px-5 py-3 text-xs text-fg-subtle">One ticket either way. The cab stays; you walk from the far station.</p>
      </div>
    </div>
  );
}
