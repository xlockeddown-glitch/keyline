/** 0.1.109: the Hearth vault on the client: the city's placed list, my state (locked / ready / placed), and the ghost. */
import { useEffect, useSyncExternalStore } from "react";
import { commitWallet, walletLive } from "./walletClient";
import { useGame } from "./store";
import { PLANT_GAP_M, PLANT_NAMES, PLANT_RED_NEED, type HearthStats, type PlacedVault } from "./placedLantern";
import { hearthVersion, type HearthVersion } from "./hearthMulti";
import { VK_NUM } from "./pins";
import { setHearths, type HearthView } from "./hearthVaults";

/** 0.1.122: one of my placed Hearths (Single, Double or Triple). */
export type MyHearth = { v: HearthVersion; id: string; mine: PlacedVault; stats?: HearthStats; polish?: number };
/** My placed Hearths; an old server's lone `mine` counts as its own version. */
export function myHearths(me: PlantState["me"]): MyHearth[] {
  if (me.hearths) return me.hearths;
  return me.mine ? [{ v: hearthVersion(me.mine.v), id: "", mine: me.mine, stats: me.stats }] : [];
}
export const placedVersion = (me: PlantState["me"], v: HearthVersion) => myHearths(me).find((h) => h.v === v) ?? null;
/** 0.1.122: the unlock line, with the real tier labels. */
export const unlockLine = (red?: number) =>
  `Answer ${PLANT_RED_NEED} red (${VK_NUM.red}) or violet (${VK_NUM.violet}) vaults right to unlock${typeof red === "number" ? ` · ${red}/${PLANT_RED_NEED}` : ""}.`;

export type Ghost = { lat: number; lng: number; gap: number; street: boolean };
export type PlantState = {
  city: string | null;
  placed: HearthView[];
  me: { unlocked: boolean; mine: PlacedVault | null; stats?: HearthStats; /** 0.1.119: right red/violet answers toward the unlock (locked only). */ red?: number; /** 0.1.122: one per placed version. */ hearths?: MyHearth[] };
  /** 0.1.111: the "Your Hearth" owner panel is up. */
  ownerOpen?: boolean;
  /** 0.1.122: which of my Hearths the owner panel shows. */
  ownerV?: HearthVersion;
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
    placed: "You've already placed a Hearth of that version.",
    "no-unlock": unlockLine(),
  };
  setPlant({ busy: false, note: why[r?.reason ?? ""] ?? "Couldn't place it. Try again in a moment." });
}

/** 0.1.149: pay 8,000 coin for seven days of brighter trim. The server is the charge. */
export async function polishHearth(id: string): Promise<void> {
  const { HEARTH_POLISH_PRICE, polishLive } = await import("./hearthPolish");
  const h = myHearths(state.me).find((x) => x.id === id);
  const toast = (msg: string) => useGame.setState({ toast: msg });
  if (!h) return;
  if (!walletLive()) return toast("Sign in to polish a Hearth.");
  if (polishLive(h.polish, Date.now())) return toast("This Hearth is already polished.");
  if (useGame.getState().points < HEARTH_POLISH_PRICE) return toast("Need 8,000 coin.");
  if (state.busy) return;
  setPlant({ busy: true });
  const city = useGame.getState().cityId;
  const r = await commitWallet({ kind: "hpolish", id });
  if (r?.view) useGame.getState().adoptWallet(r.view);
  await refreshPlaced(city);
  if (r?.ok) {
    setPlant({ busy: false });
    toast("Polished. Brighter trim for seven days. The cut stays 50 coin.");
    return;
  }
  setPlant({ busy: false });
  toast(r?.reason === "short-coins" ? "Need 8,000 coin." : "Couldn't polish it.");
}

export const plantNowPlaced = () => state.placed;
export const plantNowName = () => state.name;

if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __keylinePlant?: unknown }).__keylinePlant = {
    setPlant,
    setHearths,
    polishHearth,
    plantNow,
    /** Dev/QA: put seeded Hearths on the map and open the owner panel. */
    show(list: HearthView[], me: PlantState["me"], open: boolean) {
      const city = useGame.getState().cityId;
      setHearths(city, list);
      setPlant({ city, placed: list, me, ownerOpen: open, ownerV: 1, placing: false });
      useGame.setState({ hearthGen: (useGame.getState().hearthGen ?? 0) + 1 });
    },
    coins(n: number) {
      useGame.setState({ points: n });
    },
  };
}
