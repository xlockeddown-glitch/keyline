import { useEffect } from "react";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { syncWallet, type SyncWire } from "@/game/walletApi";
import { deviceId, setStreetPlayer, setWalletLive } from "@/game/walletClient";
import { useGame, popMatch } from "@/game/store";
import { setDoubleUntil } from "@/game/doubleClient";
import { FARES_CAP } from "@/game/ticket";

function pressStock(pantry: Partial<Record<string, number>>) {
  let n = 0;
  for (const [id, v] of Object.entries(pantry)) {
    if (id.startsWith("paint-")) continue;
    const q = Math.floor(Number(v));
    if (q > 0) n += q;
  }
  return Math.min(24, n);
}

function snapOf() {
  const s = useGame.getState();
  const n = (v: number, cap: number) => Math.min(cap, Math.max(0, Math.floor(v) || 0));
  return {
    coins: s.points,
    keys: s.keys,
    cities: s.cities,
    crateDay: s.lastCrateDay,
    crateStreak: s.crateStreak,
    blitzDay: s.lastBlitzDay,
    blitzStep: s.blitzTake > 0 ? Math.min(6, s.blitzMatches.length) : 0,
    wheel: s.wheelClaimed,
    lucky: s.lucky,
    cloths: s.quests.cloths.slice(0, 18),
    distanceM: Math.min(150_000, Math.max(0, Math.floor(s.distanceM) || 0)),
    fares: n(s.fares, FARES_CAP),
    atlas: Object.keys(s.atlas).slice(0, 640),
    brass: n(s.brass, 48),
    ink: n(s.ink, 32),
    vellum: n(s.vellum, 32),
    schematic: n(s.schematics, 8),
    press: pressStock(s.pantry),
    patterns: n(s.quests.patterns, 4),
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
      setStreetPlayer("");
      setWalletLive(false);
      return;
    }
    let live = true;
    void (async () => {
      try {
        const id = deviceId();
        let r: SyncWire = await syncWallet({ data: { ...snapOf(), deviceId: id } });
        const notes = [...(r.giftNotes ?? [])];
        if (!live) return;
        // Second call only while this device's revise is still open. It reads the pocket as it
        // is now, including anything earned during the first round trip, and then closes the door.
        if (!r.revised) r = await syncWallet({ data: { ...snapOf(), deviceId: id } });
        if (!live) return;
        useGame.getState().adoptWallet(r);
        if (r.owned) useGame.getState().adoptOwned(r.owned);
        void useGame.getState().runLegacy();
        notes.push(...(r.giftNotes ?? []));
        if (notes.length) {
          const text = [...new Set(notes)].join(" ");
          // 0.0.95: the gift note uses the same emblem pop as streaks and the cache (2 red for Amanda's gift).
          const reds = /(\d+) red match/.exec(text);
          const corgi = /Corgi is back/.test(text);
          popMatch({ kind: "gift", big: corgi ? "Corgi restored!" : "A gift!", sub: text, tiers: reds ? Array.from({ length: Number(reds[1]) }, () => "red" as const) : [], coin: 0 });
        }
        // 0.1.44: the new-player double-coin hour, for the HUD note.
        setDoubleUntil(r.doubleUntil ?? 0);
        // 0.1.43: a gift lantern granted on this sync shows up in Journal · Places.
        void import("@/game/ownLampsClient").then((m) => m.refreshOwnedLamps());
        setStreetPlayer(r.playerId);
        setWalletLive(true);
        useGame.getState().bindStreet();
      } catch {
        if (live) {
          setStreetPlayer("");
          setWalletLive(false);
        }
      }
    })();
    return () => {
      live = false;
      setStreetPlayer("");
      setWalletLive(false);
    };
  }, [userId]);

  return null;
}
