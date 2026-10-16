import { useEffect } from "react";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { syncWallet, type SyncWire } from "@/game/walletApi";
import { deviceId, setWalletLive } from "@/game/walletClient";
import { useGame } from "@/game/store";

function snapOf() {
  const s = useGame.getState();
  return {
    coins: s.points,
    keys: s.keys,
    cities: s.cities,
    crateDay: s.lastCrateDay,
    crateStreak: s.crateStreak,
    blitzDay: s.lastBlitzDay,
    blitzStep: s.blitzTake > 0 ? Math.min(6, s.blitzMatches.length) : 0,
    wheel: s.wheelClaimed,
  };
}

/**
 * 0.0.78: a signed-in walker's coins, matches and city passes move to the server on sign-in.
 * Each device gets one merge: the higher of the server and this device, never a lower number.
 * One revise catches a reward that landed while that call was in flight. Guests never get here.
 */
export function WalletSync() {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const userId = !isPending && user ? user.id : null;

  useEffect(() => {
    if (!userId) {
      setWalletLive(false);
      return;
    }
    let live = true;
    void (async () => {
      try {
        const id = deviceId();
        let r: SyncWire = await syncWallet({ data: { ...snapOf(), deviceId: id } });
        if (!live) return;
        // Second call only while this device's revise is still open. It reads the pocket as it
        // is now, including anything earned during the first round trip, and then closes the door.
        if (!r.revised) r = await syncWallet({ data: { ...snapOf(), deviceId: id } });
        if (!live) return;
        useGame.getState().adoptWallet(r);
        setWalletLive(true);
      } catch {
        if (live) setWalletLive(false);
      }
    })();
    return () => {
      live = false;
      setWalletLive(false);
    };
  }, [userId]);

  return null;
}
