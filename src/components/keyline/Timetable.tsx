import { X } from "lucide-react";
import { sfx } from "@/game/audio";
import { fareMs, formatEta, otherWards } from "@/game/ticket";
import { useGame } from "@/game/store";
import type { CityId } from "@/game/types";

type Props = { onClose: () => void; onPunch: (id: CityId) => void };

export function Timetable({ onClose, onPunch }: Props) {
  const cityId = useGame((s) => s.cityId);
  const fares = useGame((s) => s.fares);
  const seated = useGame((s) => s.hud.seated);

  function punch(id: CityId) {
    sfx.ui();
    onPunch(id);
  }

  return (
    <div className="absolute inset-0 z-[740] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6">
      <div className="panel flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Timetable</p>
            <h2 className="font-display text-2xl">Punch a fare</h2>
            <p className="mt-1 text-sm text-fg-muted">
              {seated
                ? "Park first. The window doesn’t take a ticket."
                : fares
                  ? `${fares} fare${fares === 1 ? "" : "s"} in the pocket. Clock runs while you’re away. Matches turn up in the car.`
                  : "Need a fare. Light three lamps in this city."}
            </p>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <ul className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {otherWards(cityId).map((c) => {
            const eta = formatEta(fareMs(cityId, c.id));
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className="flex w-full items-baseline justify-between gap-3 border-b border-border py-3 text-left last:border-0"
                  disabled={fares < 1 || seated}
                  onClick={() => punch(c.id)}
                >
                  <span>
                    <span className="font-display text-xl leading-none">{c.name}</span>
                    <span className="mt-1 block kicker">{c.region}</span>
                  </span>
                  <span className="tabular-nums text-sm text-fg-muted">{eta}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="px-5 py-3 text-xs text-fg-subtle">The cab stays. You walk from the far station.</p>
      </div>
    </div>
  );
}
