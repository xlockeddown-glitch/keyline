/** 0.1.42: owned lanterns on the client: the public list (owner names on lamp cards) and the buy call. */
import { useEffect, useSyncExternalStore } from "react";
import type { Tier } from "./types";
import { commitWallet, walletLive } from "./walletClient";
import { useGame } from "./store";
import { OWN_PRICE } from "./ownLamps";
import { TIER_LABEL } from "./data";

export type OwnedLampView = { poi: string; tier: Tier; city: string; name: string; mine: boolean };

let list: OwnedLampView[] = [];
let loading: Promise<void> | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function refreshOwnedLamps(): Promise<void> {
  loading = (async () => {
    try {
      const { fetchOwnedLamps } = await import("./walletApi");
      const got = await fetchOwnedLamps();
      if (Array.isArray(got)) list = got as OwnedLampView[];
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

/** Buy `poi` (a lamp of `tier`). Returns the line to show. */
export async function buyLamp(poi: string, tier: Tier): Promise<string> {
  if (!walletLive()) return "Sign in to own a lantern.";
  if (useGame.getState().points < OWN_PRICE[tier]) return "Need more coins.";
  const r = await commitWallet({ kind: "own", poi });
  if (!r) return "Couldn't buy it. Try again in a moment.";
  if (r.view) useGame.getState().adoptWallet(r.view);
  await refreshOwnedLamps();
  if (r.ok) return `This ${TIER_LABEL[tier]} lantern is yours.`;
  if (r.reason === "taken") return "Someone else owns that lamp now. Pick another.";
  if (r.reason === "owned") return `You already own a ${TIER_LABEL[tier]} lantern.`;
  if (r.reason === "short-coins") return "Need more coins.";
  return "Couldn't buy it. Try again in a moment.";
}

export function useOwnedPoi(poiId: string | undefined): boolean {
  const list = useOwnedLamps();
  return Boolean(poiId && list.some((x) => x.poi === poiId));
}
