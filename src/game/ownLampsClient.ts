/** 0.1.42: owned lanterns on the client: the public list (owner names on lamp cards). 0.1.115: no buying; gift placement only. */
import { useEffect, useSyncExternalStore } from "react";
import type { Tier } from "./types";
import { commitWallet, walletLive } from "./walletClient";
import { useGame } from "./store";
import { TIER_LABEL } from "./data";

export type OwnedLampView = { poi: string; tier: Tier; city: string; name: string; mine: boolean; free?: boolean };

let list: OwnedLampView[] = [];
/** 0.1.43: gift lanterns (white / blue) the signed-in player can still place. */
let gifts: Tier[] = [];
let loading: Promise<void> | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function refreshOwnedLamps(): Promise<void> {
  loading = (async () => {
    try {
      const { fetchOwnedLamps } = await import("./walletApi");
      const got = await fetchOwnedLamps();
      if (got && Array.isArray(got.lamps)) {
        list = got.lamps as OwnedLampView[];
        gifts = (Array.isArray(got.gifts) ? got.gifts : []) as Tier[];
      }
    } catch {
      /* offline: keep the last list */
    }
    emit();
  })();
  return loading;
}

export function useOwnedLamps(): OwnedLampView[] {
  const v = useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => list,
    () => list,
  );
  useEffect(() => {
    if (!loading) void refreshOwnedLamps();
  }, []);
  return v;
}

export function useLampGifts(): Tier[] {
  useOwnedLamps();
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => gifts,
    () => gifts,
  );
}

/** Place a gifted lantern on `poi` (0.1.115: buying is closed). Returns the line to show. */
export async function placeGiftLamp(poi: string, tier: Tier): Promise<string> {
  if (!walletLive()) return "Sign in to place your vault.";
  const r = await commitWallet({ kind: "own", poi, free: true });
  if (!r) return "Couldn't place it. Try again in a moment.";
  if (r.view) useGame.getState().adoptWallet(r.view);
  await refreshOwnedLamps();
  if (r.ok) return `This ${TIER_LABEL[tier]} vault is yours.`;
  if (r.reason === "taken") return "Someone else owns that vault now. Pick another.";
  if (r.reason === "no-gift") return "That free vault isn't yours to place.";
  if (r.reason === "owned") return `You already placed your free ${TIER_LABEL[tier]} vault.`;
  return "Couldn't place it. Try again in a moment.";
}

export function useOwnedPoi(poiId: string | undefined): boolean {
  const list = useOwnedLamps();
  return Boolean(poiId && list.some((x) => x.poi === poiId));
}
