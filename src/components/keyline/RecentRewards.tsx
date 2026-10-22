import { useEffect, useState } from "react";
import { fetchRecentRewards } from "@/game/walletApi";
import { SOURCE_LABEL, ago, type RecentReward } from "@/game/recentRewards";
import { useGame } from "@/game/store";
import type { Tier } from "@/game/types";
import { walletLive } from "@/game/walletClient";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { ItemIcon } from "./ItemIcon";

/** 0.0.99 Journal · Progress: the last 20 rewards (server ledger when signed in, this device's log for guests). */
export function RecentRewards() {
  const user = useCurrentUser();
  const local = useGame((s) => s.recent);
  const points = useGame((s) => s.points);
  const [server, setServer] = useState<RecentReward[] | null>(null);
  useEffect(() => {
    if (!user || !walletLive()) return setServer(null);
    let live = true;
    void fetchRecentRewards()
      .then((r) => live && setServer(r))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [user, points]);
  const rows = server ?? local;
  const now = Date.now();
  return (
    <div data-testid="recent-rewards">
      <p className="kicker">Recent rewards</p>
      {rows.length ? (
        <ul className="recent-list">
          {rows.map((r, i) => (
            <li key={`${r.at}-${i}`} className="recent-row">
              <span className="recent-emblems">
                {r.coins > 0 ? (
                  <span className="recent-amt">
                    <ItemIcon item="coin" size={18} />+{r.coins}
                  </span>
                ) : null}
                {(Object.entries(r.keys) as [Tier, number][]).map(([t, n]) => (
                  <span key={t} className="recent-amt">
                    <ItemIcon item={t} size={16} />×{n}
                  </span>
                ))}
                {(Object.entries(r.credit ?? {}) as [Tier, number][]).map(([t, n]) => (
                  <span key={`c${t}`} className="recent-amt is-credit" title={`${n} ${t} extra (3 merge into the next color)`}>
                    <ItemIcon item={t} size={14} />+{n}/3
                  </span>
                ))}
                {(Object.entries(r.merged ?? {}) as [Tier, number][]).map(([t, n]) => (
                  <span key={`m${t}`} className="recent-amt is-up" title="3 extras merged">
                    ↑<ItemIcon item={t} size={16} />×{n}
                  </span>
                ))}
              </span>
              <span className="recent-src">
                {SOURCE_LABEL[r.src]}
                {r.where ? ` · ${r.where}` : ""}
              </span>
              <span className="recent-when">{ago(r.at, now)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-fg-subtle">Answer a lamp or pick up a match and it shows here.</p>
      )}
    </div>
  );
}
