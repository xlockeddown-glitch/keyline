import { useEffect, useRef } from "react";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchWornScout, syncWornScout } from "@/game/wornScoutApi";
import { pickWorn, type Worn } from "@/game/wornScoutSql";
import { useGame } from "@/game/store";
import type { ScoutId } from "@/game/types";

/**
 * 0.1.6: the worn scout follows the account (like WardrobeSync does for coats). On sign-in the account's scout
 * wins once this device owns it (WalletSync merges the owned list, which can land a moment later). Each equip is
 * pushed after 700 ms, stamped with the time it was put on, so a retry or a slower device can't undo a newer one.
 * A null answer (signed out server-side, or no worn_scouts table yet) leaves the local save in charge.
 */
export function WornScoutSync() {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const userId = !isPending && user ? user.id : null;
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      synced.current = null;
      return;
    }
    let live = true;
    let timer: number | null = null;
    let pending: Worn | null = null; // the account's scout, waiting for the owned list to include it
    let touched = false; // the walker equipped something here after sign-in: theirs is newer

    const adopt = () => {
      if (!pending || touched) return;
      const st = useGame.getState();
      const pick = pickWorn(st, pending);
      if (pick) {
        synced.current = pick;
        useGame.setState({ scout: pick as ScoutId });
        pending = null;
      } else if (st.scout === pending.scout) {
        synced.current = pending.scout;
        pending = null;
      }
    };
    const push = (scout: string, at: number) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        void syncWornScout({ data: { scout, at } })
          .then((r) => {
            if (live && r) synced.current = r.scout;
          })
          .catch(() => {
            /* offline: the local save has it; the next equip retries */
          });
      }, 700);
    };

    void (async () => {
      try {
        const server = await fetchWornScout();
        if (!live) return;
        if (server) {
          pending = server;
          adopt();
        } else {
          // No row yet (first sign-in on 0.1.6): seed the account with what this device wears.
          const s = useGame.getState().scout;
          push(s, Date.now());
        }
      } catch {
        /* no session server-side yet: stay local */
      }
    })();

    const unsub = useGame.subscribe((s, p) => {
      if (s.scouts !== p.scouts) adopt();
      if (s.scout === p.scout || s.scout === synced.current) return;
      touched = true;
      pending = null;
      push(s.scout, Date.now());
    });
    return () => {
      live = false;
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, [userId]);

  return null;
}
