/** 0.1.153: buy this week's press pull. The tap spends the coin and puts the recolor on together. */
import { useGame } from "./store";
import { commitWallet, walletLive } from "./walletClient";
import { PRESS_PULL_PRICE, pressOffer, pullBaseOwned } from "./pressPull";
import type { PaintBench } from "./paint";

function withPull(paints: PaintBench, job: "coat" | "vault", color: PaintBench["coats"][number]): PaintBench {
  if (job === "coat") return { ...paints, coats: paints.coats.includes(color) ? paints.coats : [...paints.coats, color], wornCoat: color };
  return { ...paints, vaults: paints.vaults.includes(color) ? paints.vaults : [...paints.vaults, color], wornVault: color };
}

export async function buyPressPull(): Promise<void> {
  const offer = pressOffer(Date.now());
  const st = useGame.getState();
  const toast = (msg: string) => useGame.setState({ toast: msg });
  if (!pullBaseOwned(st.wardrobe.owned, offer.job)) {
    toast(offer.job === "coat" ? "Own a coat first." : "Own a vault skin first.");
    return;
  }
  const have = (offer.job === "coat" ? st.paints.coats : st.paints.vaults).includes(offer.color);
  if (have) return toast("You already have this week's pull.");
  if (st.points < PRESS_PULL_PRICE) return toast("Need 25,000 coin.");
  const before = st.points;
  const prev = st.paints;
  useGame.setState({ paints: withPull(prev, offer.job, offer.color) });
  useGame.getState().keepPoints(before - PRESS_PULL_PRICE);
  const paid = "This week's pull is yours. It does not change pay.";
  if (!walletLive()) return toast(paid);
  const r = await commitWallet({ kind: "pull" });
  if (!r?.ok) {
    useGame.setState({ paints: prev });
    useGame.getState().keepPoints(before);
    if (r?.view) useGame.getState().adoptWallet(r.view);
    toast(r?.reason === "short-coins" ? "Need 25,000 coin." : r?.reason === "unowned" ? (offer.job === "coat" ? "Own a coat first." : "Own a vault skin first.") : "Couldn't buy this week's pull.");
    return;
  }
  toast(paid);
}
