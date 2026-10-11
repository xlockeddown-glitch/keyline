import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { CityId } from "./types";
import { useGame } from "./store";
import { postWalk } from "./walkApi";

const FLUSH_MS = 8_000;
/** A single store tick is a few frames. Bigger than this is a save load, not a step. */
const MAX_TICK_M = 80;
const BAG_CAP_M = 20_000;

const bag = new Map<CityId, number>();
let inflight = false;

export function noteWalk(city: CityId, meters: number) {
  if (!(meters > 0) || meters > MAX_TICK_M) return;
  const next = Math.min(BAG_CAP_M, (bag.get(city) ?? 0) + meters);
  bag.set(city, next);
}

export function pendingWalkMetres() {
  let n = 0;
  for (const v of bag.values()) n += v;
  return n;
}

async function sendCity(city: CityId, meters: number): Promise<"ok" | "retry" | "fail"> {
  try {
    const res = await postWalk({ data: { city, meters } });
    if (res.retry || res.accepted <= 0) return "retry";
    return "ok";
  } catch {
    return "fail";
  }
}

/** Push queued foot metres. `min` holds a tiny scrap for the next flush (a hide sends whatever is there). */
export async function flushWalk(opts?: { min?: number }) {
  if (inflight) return;
  const min = opts?.min ?? 30;
  let total = 0;
  for (const v of bag.values()) total += v;
  if (total < min) return;
  const snap: { city: CityId; whole: number }[] = [];
  for (const [city, have] of bag) {
    const whole = Math.floor(have);
    if (whole < 1) continue;
    bag.set(city, have - whole);
    snap.push({ city, whole });
  }
  if (!snap.length) return;
  inflight = true;
  try {
    for (const { city, whole } of snap) {
      const result = await sendCity(city, whole);
      if (result !== "ok") bag.set(city, Math.min(BAG_CAP_M, (bag.get(city) ?? 0) + whole));
    }
  } finally {
    inflight = false;
  }
}

/** While signed in, foot steps queue and post every few seconds. Guests stay on the lantern only. */
export function useWalkPoster() {
  const user = useCurrentUser();
  const signed = useRef(false);
  signed.current = Boolean(user);

  useEffect(() => {
    let last = useGame.getState().distanceM;
    return useGame.subscribe((s) => {
      const next = s.distanceM;
      const d = next - last;
      last = next;
      if (!signed.current || !(d > 0)) return;
      noteWalk(s.cityId, d);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const kick = () => {
      void flushWalk({ min: 1 });
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") kick();
    };
    const id = window.setInterval(() => {
      void flushWalk();
    }, FLUSH_MS);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", kick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", kick);
      kick();
    };
  }, [user]);
}
