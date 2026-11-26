import { useEffect, useState } from "react";
import { CITIES } from "@/game/data";
import { meetExpiresIn, meetWhat, type MeetDropView } from "@/game/meetDrop";
import { refreshMeet, useMeet } from "@/game/meetClient";
import type { CityId } from "@/game/types";

const cityName = (d: MeetDropView) => (Object.hasOwn(CITIES, d.city) ? CITIES[d.city as CityId].name : d.city);

/**
 * 0.1.186 Meet you there in the Journal's Goals tab: signed in only, plain lines. What friends left for this
 * player (and where to stand to collect it) and what this player has out. Everything here is the server's answer.
 */
export function MeetJournal() {
  const status = useMeet((s) => s.status);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    void refreshMeet();
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  if (!status?.ready || (!status.incoming.length && !status.mine.length && !status.friends.length)) return null;
  return (
    <div data-testid="journal-meet">
      <p className="kicker">Meet you there</p>
      {!status.incoming.length && !status.mine.length ? (
        <p className="mt-1 text-xs text-fg-muted">Stand at a street lamp to leave a friend a wave, a key or coin. Nothing is waiting right now.</p>
      ) : null}
      {status.incoming.map((d) => (
        <p key={d.id} className="mt-1 text-xs text-fg-muted" data-testid="meet-incoming">
          {d.name} left you {meetWhat(d.kind)} at {d.lampName}, {cityName(d)}. Stand at that lamp to collect it ({meetExpiresIn(d.expiresAt, now)}).
        </p>
      ))}
      {status.mine.map((d) => (
        <p key={d.id} className="mt-1 text-xs text-fg-muted" data-testid="meet-mine">
          You left {d.name} {meetWhat(d.kind)} at {d.lampName}, {cityName(d)} ({meetExpiresIn(d.expiresAt, now)}{d.kind === "wave" ? "" : "; refunded to you if nobody collects"}).
        </p>
      ))}
    </div>
  );
}
