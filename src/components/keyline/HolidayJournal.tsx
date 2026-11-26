import { CITIES } from "@/game/data";
import { gameNow } from "@/game/gameClock";
import { HOLIDAY_LAMPS, holidayOpen, holidayOrnaments, holidayOwned, holidayProgressLine, holidayRoute } from "@/game/holidayLights";
import { useGame } from "@/game/store";
import type { CityId } from "@/game/types";

/**
 * 0.1.182 Holiday Lights in the Journal: per city with stamps, the city, "N/5" and the stamped ornaments (painted
 * images only: no frame, no overlay, no placeholder for a missing one). Shown while the event is open (signed in)
 * or for good once the player owns an ornament. Everything here is the server's ledger count (store.holiday).
 */
export function HolidayJournal() {
  const holiday = useGame((s) => s.holiday);
  const cityId = useGame((s) => s.cityId);
  const open = holidayOpen(gameNow());
  if (!holiday || !(open || holidayOwned(holiday))) return null;
  const cities = (Object.keys(holiday.stamped) as CityId[]).filter((c) => CITIES[c] && holidayOrnaments(holiday, c).length > 0).sort();
  const here = open && holidayRoute(cityId).length === HOLIDAY_LAMPS ? holidayOrnaments(holiday, cityId).length : null;
  if (!cities.length && here == null) return null;
  return (
    <div data-testid="journal-holiday">
      <p className="kicker">Holiday Lights</p>
      {here != null ? (
        <p className="mt-1 text-xs text-fg-muted" data-testid="holiday-progress">
          {holidayProgressLine(here)}
        </p>
      ) : null}
      {cities.map((c) => {
        const orns = holidayOrnaments(holiday, c);
        return (
          <div key={c} className="mt-2" data-testid={`holiday-city-${c}`}>
            <p className="text-xs text-fg-muted">
              {CITIES[c].name} · <span className="tabular-nums">{orns.length}/{HOLIDAY_LAMPS}</span>
            </p>
            <p className="holiday-orns">
              {orns.map((n) => (
                <img key={n} src={`/sprites/holiday/orn-${n}.webp`} alt={`Ornament ${n}`} data-testid={`holiday-orn-${n}`} draggable={false} />
              ))}
            </p>
          </div>
        );
      })}
    </div>
  );
}
