/** 0.1.154: buy or wear a scout collar. The tap spends 12,000 and puts the scarf on together. */
import { SCOUTS } from "./data";
import { sfx } from "./audio";
import { COLLAR_PRICE, collarPair, isCollarColor, isCollarScout, withCollar, withCollarWorn, withoutCollar, type CollarColor } from "./scoutCollar";
import { useGame } from "./store";
import type { ScoutId } from "./types";
import { commitWallet, walletLive } from "./walletClient";

/** One buy at a time, so a second swatch cannot roll the first back to a stale book. */
let queue: Promise<void> = Promise.resolve();

function toast(msg: string) {
  useGame.setState({ toast: msg });
  window.setTimeout(() => {
    if (useGame.getState().toast === msg) useGame.setState({ toast: null });
  }, 1600);
}

function label(color: CollarColor): string {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

export function buyScoutCollar(scout: string, color: string): Promise<void> {
  const run = queue.then(() => buyScoutCollarNow(scout, color));
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function buyScoutCollarNow(scout: string, color: string): Promise<void> {
  if (!isCollarScout(scout) || !isCollarColor(color)) return;
  const key = collarPair(scout, color);
  const st = useGame.getState();
  if (!st.scouts.includes(scout)) return toast("Hire them first.");
  const book = st.collars;
  const have = book.owned.includes(key);
  if (have) {
    if (book.worn[scout] === color) return;
    const prevWorn = book.worn[scout];
    useGame.getState().setCollars(withCollarWorn(book, scout, color));
    const worn = `${label(color)} collar. It does not change pay.`;
    if (!walletLive()) return toast(worn);
    const r = await commitWallet({ kind: "collarOn", scout, color });
    if (!r?.ok) {
      const cur = useGame.getState().collars;
      const nextWorn = { ...cur.worn };
      if (prevWorn) nextWorn[scout] = prevWorn;
      else delete nextWorn[scout];
      useGame.getState().setCollars({ owned: cur.owned, worn: nextWorn });
      if (r?.view) useGame.getState().adoptWallet(r.view);
      toast(r?.reason === "unowned" ? "Hire them first." : "Couldn't change the collar.");
    } else toast(worn);
    return;
  }
  if (st.points < COLLAR_PRICE) return toast("Need 12,000 coin.");
  sfx.craft();
  useGame.getState().setCollars(withCollar(book, scout as ScoutId, color));
  useGame.getState().keepPoints(st.points - COLLAR_PRICE);
  const paid = `${SCOUTS[scout].name} wears a ${color} collar. It does not change pay.`;
  if (!walletLive()) return toast(paid);
  const r = await commitWallet({ kind: "collar", scout, color });
  if (!r?.ok) {
    useGame.getState().setCollars(withoutCollar(useGame.getState().collars, scout, color));
    if (r?.view) useGame.getState().adoptWallet(r.view);
    else useGame.getState().keepPoints(useGame.getState().points + COLLAR_PRICE);
    toast(r?.reason === "short-coins" ? "Need 12,000 coin." : r?.reason === "unowned" ? "Hire them first." : "Couldn't buy the collar.");
    return;
  }
  toast(paid);
}
