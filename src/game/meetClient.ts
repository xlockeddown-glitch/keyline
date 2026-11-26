import { create } from "zustand";
import { DAILY_REACH_M, canLightDaily } from "./dailyRun";
import { distM } from "./geo";
import { meetRefusal, type MeetDropView, type MeetKind, type MeetStatus } from "./meetDrop";
import { useGame } from "./store";
import { walletLive } from "./walletClient";

// 0.1.186 Meet you there: the device only ever says "I am at this lamp, here, for this friend, this kind" (leave)
// or "I am here, for this drop" (collect). Amounts, caps, expiry and who may collect are the server's; the pocket
// shown after either call is the one the server sent back.
type MeetStore = { status: MeetStatus | null; line: string | null; busy: boolean };
export const useMeet = create<MeetStore>(() => ({ status: null, line: null, busy: false }));

type Spot = { lat: number; lng: number };
type CurbOf = (lat: number, lng: number) => Spot | null;
let here: { pos: Spot; curbOf: CurbOf } | null = null;
/** The map loop's note of where the walker is (no state change, no render). */
export function noteMeetSpot(pos: Spot, curbOf: CurbOf) {
  here = { pos, curbOf };
}

const FETCH_MS = 30_000;
let fetchedAt = 0;
let fetching = false;
/** Ask the server what is waiting: at most once per 30 s unless forced. Signed-in server wallets only. */
export async function refreshMeet(force = false): Promise<void> {
  if (!walletLive()) {
    if (useMeet.getState().status) useMeet.setState({ status: null });
    return;
  }
  const now = Date.now();
  if (fetching || (!force && now - fetchedAt < FETCH_MS)) return;
  fetching = true;
  fetchedAt = now;
  try {
    const { meetStatus } = await import("./meetApi");
    useMeet.setState({ status: await meetStatus() });
  } catch {
    /* offline: the card just stays as it was */
  } finally {
    fetching = false;
  }
}

/** The Daily Run's own at-lamp rule (wardClient.ts), on the device, before anything is sent. The server checks again. */
function atLamp(lamp: Spot): Spot | null {
  if (!here) return null;
  const { pos, curbOf } = here;
  if (distM(pos.lat, pos.lng, lamp.lat, lamp.lng) > DAILY_REACH_M) return null;
  return canLightDaily(pos, lamp, curbOf(lamp.lat, lamp.lng)) ? pos : null;
}

const nonce = () => crypto.randomUUID().replace(/-/g, "");

async function send(kind: MeetKind | undefined, lamp: Spot, call: (pos: Spot) => Promise<{ ok: boolean; reason?: string; line?: string; view?: Parameters<ReturnType<typeof useGame.getState>["adoptWallet"]>[0] }>) {
  if (!walletLive() || useMeet.getState().busy) return;
  const pos = atLamp(lamp);
  if (!pos) {
    useMeet.setState({ line: meetRefusal("far") });
    return;
  }
  useMeet.setState({ busy: true, line: null });
  try {
    const r = await call(pos);
    if (r.view) useGame.getState().adoptWallet(r.view);
    useMeet.setState({ line: r.ok ? (r.line ?? null) : meetRefusal(r.reason, kind) });
  } catch {
    useMeet.setState({ line: meetRefusal(undefined) });
  } finally {
    useMeet.setState({ busy: false });
    void refreshMeet(true);
  }
}

export function leaveMeet(city: string, lamp: Spot & { id: string }, friend: string, kind: MeetKind) {
  return send(kind, lamp, async (pos) => {
    const { meetLeave } = await import("./meetApi");
    return meetLeave({ data: { city, lamp: lamp.id, lat: pos.lat, lng: pos.lng, friend, kind, nonce: nonce() } });
  });
}

export function collectMeet(drop: MeetDropView, lamp: Spot) {
  return send(drop.kind, lamp, async (pos) => {
    const { meetCollect } = await import("./meetApi");
    return meetCollect({ data: { id: drop.id, lat: pos.lat, lng: pos.lng } });
  });
}
