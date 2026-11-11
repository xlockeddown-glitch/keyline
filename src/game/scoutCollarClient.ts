/** 0.1.154: buy or wear a scout collar. The tap spends 12,000 and puts the scarf on together. */
import { SCOUTS } from "./data";
import { sfx } from "./audio";
import { COLLAR_PRICE, collarPair, isCollarColor, isCollarScout, withCollar, withCollarWorn, type CollarColor } from "./scoutCollar";
import { useGame } from "./store";
import type { ScoutId } from "./types";
import { commitWallet, walletLive } from "./walletClient";

const pending = new Set<string>();

function toast(msg: string) {
  useGame.setState({ toast: msg });
  window.setTimeout(() => {
    if (useGame.getState().toast === msg) useGame.setState({ toast: null });
  }, 1600);
}

function label(color: CollarColor): string {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

export async function buyScoutCollar(scout: string, color: string): Promise<void> {
  if (!isCollarScout(scout) || !isCollarColor(color)) return;
  const key = collarPair(scout, color);
  if (pending.has(key)) return;
  const st = useGame.getState();
  if (!st.scouts.includes(scout)) return toast("Hire them first.");
  const book = st.collars;
  const have = book.owned.includes(key);
  if (have) {
    if (book.worn[scout] === color) return;
    pending.add(key);
    const prev = book;
    useGame.getState().setCollars(withCollarWorn(prev, scout, color));
    const worn = `${label(color)} collar. It does not change pay.`;
    if (!walletLive()) {
      pending.delete(key);
      return toast(worn);
    }
    const r = await commitWallet({ kind: "collarOn", scout, color });
    pending.delete(key);
    if (!r?.ok) {
      useGame.getState().setCollars(prev);
      if (r?.view) useGame.getState().adoptWallet(r.view);
      toast(r?.reason === "unowned" ? "Hire them first." : "Couldn't change the collar.");
    } else toast(worn);
    return;
  }
  if (st.points < COLLAR_PRICE) return toast("Need 12,000 coin.");
  pending.add(key);
  const before = st.points;
  const prev = book;
  sfx.craft();
  useGame.getState().setCollars(withCollar(prev, scout as ScoutId, color));
  useGame.getState().keepPoints(before - COLLAR_PRICE);
  const paid = `${SCOUTS[scout].name} wears a ${color} collar. It does not change pay.`;
  if (!walletLive()) {
    pending.delete(key);
    return toast(paid);
  }
  const r = await commitWallet({ kind: "collar", scout, color });
  pending.delete(key);
  if (!r?.ok) {
    useGame.getState().setCollars(prev);
    useGame.getState().keepPoints(before);
    if (r?.view) useGame.getState().adoptWallet(r.view);
    toast(r?.reason === "short-coins" ? "Need 12,000 coin." : r?.reason === "unowned" ? "Hire them first." : "Couldn't buy the collar.");
    return;
  }
  toast(paid);
}
