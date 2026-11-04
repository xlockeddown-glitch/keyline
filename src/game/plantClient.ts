/** 0.1.109: the Hearth vault on the client: the city's placed list, my state (locked / ready / placed), and the ghost. */
import { useEffect, useSyncExternalStore } from "react";
import { commitWallet, walletLive } from "./walletClient";
import { useGame } from "./store";
import { PLANT_GAP_M, PLANT_NAMES, type HearthStats, type PlacedVault } from "./placedLantern";
import { setHearths, type HearthView } from "./hearthVaults";

export type Ghost = { lat: number; lng: number; gap: number; street: boolean };
export type PlantState = {
  city: string | null;
  placed: HearthView[];
  me: { unlocked: boolean; mine: PlacedVault | null; stats?: HearthStats };
  /** 0.1.111: the "Your Hearth" owner panel is up. */
  ownerOpen?: boolean;
  /** The placement sheet and ghost are up. */
  placing: boolean;
  ghost: Ghost | null;
  name: number;
  cats: string[];
  /** 0.1.117: the version to place: 1 Single, 2 Double, 3 Triple. */
  v: 1 | 2 | 3;
  busy: boolean;
  note: string | null;
};

let state: PlantState = { city: null, placed: [], me: { unlocked: false, mine: null }, placing: false, ghost: null, name: 0, cats: [], v: 1, busy: false, note: null };
const subs = new Set<() => void>();
export function setPlant(p: Partial<PlantState>) {
  state = { ...state, ...p };
  subs.forEach((f) => f());
}
export const plantNow = () => state;

export async function refreshPlaced(city: string): Promise<void> {
  try {
    const { fetchPlaced } = await import("./walletApi");
    const got = await fetchPlaced({ data: { city } });
    if (got) {
      setHearths(city, got.placed as HearthView[]);
      setPlant({ city, placed: got.placed as HearthView[], me: got.me as PlantState["me"] });
      // Repaint the map pins with the city's Hearth vaults.
      useGame.setState({ hearthGen: (useGame.getState().hearthGen ?? 0) + 1 });
    }
  } catch {
    /* offline: keep the last */
  }
}

export function usePlant(): PlantState {
  const cityId = useGame((s) => s.cityId);
  const v = useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
    () => state,
  );
  useEffect(() => {
    if (state.city !== cityId) void refreshPlaced(cityId);
  }, [cityId]);
  return v;
}

/** The ghost is good to place: on a mapped street and clear of every lamp and vault. */
export const ghostOk = (g: Ghost | null) => Boolean(g && g.street && g.gap >= PLANT_GAP_M);

export async function placeHearth(): Promise<void> {
  const s = state;
  const g = s.ghost;
  if (!walletLive()) return setPlant({ note: "Sign in to place your Hearth vault." });
  if (!g || !ghostOk(g) || s.cats.length !== 4) return;
  setPlant({ busy: true, note: null });
  const city = useGame.getState().cityId;
  const r = await commitWallet({ kind: "plant", city, lat: g.lat, lng: g.lng, name: s.name, cats: s.cats, ...(s.v > 1 ? { v: s.v } : {}) });
  if (r?.view) useGame.getState().adoptWallet(r.view);
  await refreshPlaced(city);
  if (r?.ok) return setPlant({ busy: false, placing: false, ghost: null, note: `${PLANT_NAMES[s.name]} is placed, for good.` });
  const why: Record<string, string> = {
    close: "Too close to another vault. Walk 40 m on.",
    dense: "This block has enough vaults. Try another street.",
    far: "That's outside the city's streets.",
    version: "Pick Single, Double or Triple.",
    locked: "Unlock this city first.",
    placed: "You've already placed your Hearth vault.",
    "no-unlock": "Clear The Stack perfectly to unlock it.",
  };
  setPlant({ busy: false, note: why[r?.reason ?? ""] ?? "Couldn't place it. Try again in a moment." });
}

export const plantNowPlaced = () => state.placed;
export const plantNowName = () => state.name;
