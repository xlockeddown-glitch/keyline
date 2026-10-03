/**
 * Client side of the Daily Lantern Run: the walker's progress today in each city, the route toggle,
 * and the server calls that time a signed-in run. Guests run on the local clock and post nothing.
 * 0.0.44: one run per city per UTC day — each city keeps its own progress, clock and reward.
 */
import { create } from "zustand";
import { canLightDaily, checkSplits, dailyRoute, utcDay, type DailyRoute } from "./dailyRun";
import { lightDailyLamp, startDailyRun, type DailyState } from "./dailyApi";
import { useGame } from "./store";
import type { CityId, Tier } from "./types";

const KEY = "keyline-daily-v2";
/** 0.0.43 kept a single run (one a day, any city); it loads as that city's entry. */
const LEGACY_KEY = "keyline-daily-v1";

export type ServerMode = "pending" | "ok" | "guest" | "off";

export type DailyProgress = {
  day: string;
  city: CityId;
  /** Lamps lit so far (0..5). */
  lit: number;
  /** Local clock when lamp 1 lit. */
  startedAt: number | null;
  /** Local ms after lamp 1 for lamps 2..5. */
  splits: number[];
  /** Where each lamp was lit from (lamps 1..lit). */
  spots: { lat: number; lng: number }[];
  timeMs: number | null;
  server: ServerMode;
  serverMs: number | null;
  rank: number | null;
  note: string | null;
};

export type DailyFinish = {
  day: string;
  city: CityId;
  timeMs: number;
  splits: number[];
  reward: { added: Partial<Record<Tier, number>>; coins: number } | null;
  /** Local checks refused the time (it was faster than any walker). */
  refused: boolean;
};

/** Each city's run (the latest one per city; a finished run stays until that city's next day starts). */
export type DailyRuns = Partial<Record<CityId, DailyProgress>>;

type DailyStore = {
  runs: DailyRuns;
  /** Route drawn on the map and lamps armed. */
  show: boolean;
  panel: boolean;
  finish: DailyFinish | null;
  seatedWarnAt: number;
  setPanel: (v: boolean) => void;
  setShow: (v: boolean) => void;
  closeFinish: () => void;
  /** Called from the map loop: lights the next lamp when the walker is at it on foot. */
  check: (pos: { lat: number; lng: number }, seated: boolean, curbOf?: (lat: number, lng: number) => { lat: number; lng: number } | null) => number | null;
};

const isProgress = (p: unknown): p is DailyProgress =>
  Boolean(p) && typeof (p as DailyProgress).day === "string" && typeof (p as DailyProgress).city === "string";

/** The 0.0.43 single-run save, if any (also read by the game store to carry over its paid day). */
export function loadLegacyDaily(): DailyProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    const p = raw ? (JSON.parse(raw) as unknown) : null;
    return isProgress(p) ? p : null;
  } catch {
    return null;
  }
}

function load(): DailyRuns {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, unknown>;
      const out: DailyRuns = {};
      for (const [city, p] of Object.entries(obj ?? {})) if (isProgress(p) && p.city === city) out[p.city] = p;
      return out;
    }
    const legacy = loadLegacyDaily();
    return legacy ? { [legacy.city]: legacy } : {};
  } catch {
    return {};
  }
}

function save(runs: DailyRuns) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(runs));
  } catch {
    /* private mode */
  }
}

/** Today's run (the one in progress keeps its own day/city until it finishes). */
export function todayRoute(cityId: CityId): DailyRoute {
  return dailyRoute(cityId, utcDay());
}

/** The run that counts for this city right now, or null if none is under way here today. */
export function activeProgress(runs: DailyRuns, cityId: CityId): DailyProgress | null {
  const p = runs[cityId];
  if (!p) return null;
  const day = utcDay();
  if (p.city !== cityId) return null;
  if (p.day === day) return p;
  // A run started before midnight UTC keeps going on its own day's route.
  if (p.startedAt && p.timeMs == null && Date.now() - p.startedAt < 2 * 60 * 60_000) return p;
  return null;
}

let chain: Promise<unknown> = Promise.resolve();
function queue<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

function isUnauthorized(err: unknown) {
  return err instanceof Error && /unauthori[sz]ed/i.test(err.message);
}

function toast(msg: string, ms = 2200) {
  useGame.setState({ toast: msg });
  window.setTimeout(() => {
    if (useGame.getState().toast === msg) useGame.setState({ toast: null });
  }, ms);
}

export const useDaily = create<DailyStore>((set, get) => {
  const put = (p: DailyProgress) => {
    const runs = { ...get().runs, [p.city]: p };
    set({ runs });
    save(runs);
  };

  /** Patch one city's run — answers land on the run they belong to, whichever city the walker is in now. */
  const patch = (city: CityId, day: string, fn: (p: DailyProgress) => DailyProgress) => {
    const cur = get().runs[city];
    if (!cur || cur.day !== day) return;
    put(fn(cur));
  };

  const applyServer = (city: CityId, day: string) => (res: DailyState) => {
    patch(city, day, (p) => {
      if (res.status === "open") return { ...p, server: "ok", note: res.reason ?? null };
      if (res.status === "done") return { ...p, server: "ok", serverMs: res.timeMs, rank: res.rank, note: null };
      return { ...p, server: "off", note: res.reason ?? (res.status === "void" ? "Today's run here was voided." : null) };
    });
    if (res.reason) toast(res.reason);
    const f = get().finish;
    if (f && res.status === "done") set({ finish: { ...f } });
    if (res.status === "done" && typeof window !== "undefined") window.dispatchEvent(new Event("keyline-daily"));
  };

  const serverFail = (city: CityId, day: string) => (err: unknown) => {
    patch(city, day, (p) => ({ ...p, server: isUnauthorized(err) ? "guest" : "off", note: isUnauthorized(err) ? null : "The run clock didn't answer. This run stays local." }));
  };

  return {
    runs: load(),
    show: false,
    panel: false,
    finish: null,
    seatedWarnAt: 0,
    setPanel: (v) => set({ panel: v }),
    setShow: (v) => set({ show: v }),
    closeFinish: () => set({ finish: null }),
    check: (pos, seated, curbOf) => {
      const st = useGame.getState();
      if (!get().show) return null;
      const cityId = st.cityId;
      let p = activeProgress(get().runs, cityId);
      const day = utcDay();
      if (!p) {
        // One run per city per day: a run in another city never blocks this one.
        p = { day, city: cityId, lit: 0, startedAt: null, splits: [], spots: [], timeMs: null, server: "pending", serverMs: null, rank: null, note: null };
      }
      if (p.lit >= 5) return null;
      const route = dailyRoute(p.city, p.day);
      const lamp = route.lamps[p.lit]!;
      if (!canLightDaily(pos, lamp, curbOf ? curbOf(lamp.lat, lamp.lng) : null)) return null;
      if (seated) {
        if (Date.now() - get().seatedWarnAt > 5000) {
          set({ seatedWarnAt: Date.now() });
          toast("Lantern Run lamps light on foot. Park the cab.");
        }
        return null;
      }
      const now = Date.now();
      const at = { lat: pos.lat, lng: pos.lng };
      if (p.lit === 0) {
        const next: DailyProgress = { ...p, lit: 1, startedAt: now, splits: [], spots: [at] };
        put(next);
        toast(`Lantern Run · lamp 1 lit · ${lamp.name}. The clock is running.`);
        void queue(() => startDailyRun({ data: { city: p.city, lat: at.lat, lng: at.lng } }))
          .then(applyServer(p.city, p.day))
          .catch(serverFail(p.city, p.day));
        return 0;
      }
      const split = now - (p.startedAt ?? now);
      const index = p.lit;
      const splits = [...p.splits, split];
      const finished = index === route.lamps.length - 1;
      const spots = [...(p.spots ?? []), at];
      const next: DailyProgress = { ...p, lit: index + 1, splits, spots, timeMs: finished ? split : null };
      put(next);
      if (p.server === "ok" || p.server === "pending") {
        void queue(() => lightDailyLamp({ data: { city: p.city, index, clientMs: split, lat: at.lat, lng: at.lng } }))
          .then(applyServer(p.city, p.day))
          .catch(serverFail(p.city, p.day));
      }
      if (finished) {
        const ok = checkSplits(route, splits, spots.length === route.lamps.length ? spots : undefined).ok;
        // Each city's finish pays its own reward, once per city per UTC day.
        const reward = ok ? st.payDailyRun(p.day, p.city) : null;
        set({ finish: { day: p.day, city: p.city, timeMs: split, splits, reward, refused: !ok } });
        useGame.setState({ fireworks: { kind: "mini", id: Date.now() } });
      } else {
        toast(`Lantern Run · lamp ${index + 1} of 5 · ${lamp.name}`);
      }
      return index;
    },
  };
});
