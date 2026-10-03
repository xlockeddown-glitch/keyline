/**
 * Client side of the Daily Lantern Run: the walker's progress today, the route toggle, and the
 * server calls that time a signed-in run. Guests run on the local clock and post nothing.
 */
import { create } from "zustand";
import { canLightDaily, checkSplits, dailyRoute, utcDay, type DailyRoute } from "./dailyRun";
import { lightDailyLamp, startDailyRun, type DailyState } from "./dailyApi";
import { useGame } from "./store";
import type { CityId, Tier } from "./types";

const KEY = "keyline-daily-v1";

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

type DailyStore = {
  progress: DailyProgress | null;
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

function load(): DailyProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as DailyProgress;
    if (!p || typeof p.day !== "string" || typeof p.city !== "string") return null;
    return p;
  } catch {
    return null;
  }
}

function save(p: DailyProgress | null) {
  if (typeof window === "undefined") return;
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}

/** Today's run (the one in progress keeps its own day/city until it finishes). */
export function todayRoute(cityId: CityId): DailyRoute {
  return dailyRoute(cityId, utcDay());
}

/** The run that counts for this city right now, or null if none is under way here today. */
export function activeProgress(p: DailyProgress | null, cityId: CityId): DailyProgress | null {
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
  const patch = (fn: (p: DailyProgress) => DailyProgress) => {
    const cur = get().progress;
    if (!cur) return;
    const next = fn(cur);
    set({ progress: next });
    save(next);
  };

  const applyServer = (res: DailyState) => {
    patch((p) => {
      if (res.status === "open") return { ...p, server: "ok", note: res.reason ?? null };
      if (res.status === "done") return { ...p, server: "ok", serverMs: res.timeMs, rank: res.rank, note: null };
      return { ...p, server: "off", note: res.reason ?? (res.status === "void" ? "Today's run was voided." : null) };
    });
    if (res.reason) toast(res.reason);
    const f = get().finish;
    if (f && res.status === "done") set({ finish: { ...f } });
    if (res.status === "done" && typeof window !== "undefined") window.dispatchEvent(new Event("keyline-daily"));
  };

  const serverFail = (err: unknown) => {
    patch((p) => ({ ...p, server: isUnauthorized(err) ? "guest" : "off", note: isUnauthorized(err) ? null : "The run clock didn't answer. This run stays local." }));
  };

  return {
    progress: load(),
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
      let p = activeProgress(get().progress, cityId);
      const day = utcDay();
      if (!p) {
        const prior = get().progress;
        // One run a day: a run already started today in another city holds the day.
        if (prior && prior.day === day && prior.startedAt) return null;
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
        set({ progress: next });
        save(next);
        toast(`Lantern Run · lamp 1 lit · ${lamp.name}. The clock is running.`);
        void queue(() => startDailyRun({ data: { city: p.city, lat: at.lat, lng: at.lng } }))
          .then((res) => {
            applyServer(res);
          })
          .catch(serverFail);
        return 0;
      }
      const split = now - (p.startedAt ?? now);
      const index = p.lit;
      const splits = [...p.splits, split];
      const finished = index === route.lamps.length - 1;
      const spots = [...(p.spots ?? []), at];
      const next: DailyProgress = { ...p, lit: index + 1, splits, spots, timeMs: finished ? split : null };
      set({ progress: next });
      save(next);
      if (p.server === "ok" || p.server === "pending") {
        void queue(() => lightDailyLamp({ data: { index, clientMs: split, lat: at.lat, lng: at.lng } }))
          .then(applyServer)
          .catch(serverFail);
      }
      if (finished) {
        const ok = checkSplits(route, splits, spots.length === route.lamps.length ? spots : undefined).ok;
        const reward = ok ? st.payDailyRun(p.day) : null;
        set({ finish: { day: p.day, city: p.city, timeMs: split, splits, reward, refused: !ok } });
        useGame.setState({ fireworks: { kind: "mini", id: Date.now() } });
      } else {
        toast(`Lantern Run · lamp ${index + 1} of 5 · ${lamp.name}`);
      }
      return index;
    },
  };
});
