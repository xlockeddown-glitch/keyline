import type { ClientOp } from "./walletApply";
import type { WalletWire } from "./walletApi";

/**
 * Flips on after a signed-in walker's first sync. Guests, and a signed-in walker whose
 * sync hasn't landed yet, keep the local pocket. The flag is memory only: a reload syncs again.
 */
let live = false;

const DEVICE_KEY = "keyline-device-v1";
const DEVICE_RE = /^[A-Za-z0-9_-]{8,64}$/;

/** Stable id for this browser profile. Each id gets one first-sync merge. */
export function deviceId(): string {
  try {
    const cur = localStorage.getItem(DEVICE_KEY);
    if (cur && DEVICE_RE.test(cur)) return cur;
    const id = globalThis.crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return "device-local";
  }
}

export function walletLive() {
  return live;
}

export function setWalletLive(on: boolean) {
  live = on;
}

/** Send one op and copy the server pocket over the save. Null when this device isn't on the server wallet. */
export async function commitWallet(op: ClientOp): Promise<WalletWire | null> {
  if (!live) return null;
  try {
    const { applyWallet } = await import("./walletApi");
    const { useGame } = await import("./store");
    const r = await applyWallet({ data: op });
    const st = useGame.getState();
    if (r.view) st.adoptWallet(r.view);
    if (r.wardrobe) st.adoptWardrobe(r.wardrobe);
    return r;
  } catch {
    return null;
  }
}
