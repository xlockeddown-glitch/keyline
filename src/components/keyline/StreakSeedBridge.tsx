import { useEffect, useState } from "react";
import { titleRows } from "@/game/levels";
import { useLevel } from "@/game/levelStore";
import type { LevelView } from "@/game/levelsServer";
import { useGame } from "@/game/store";
import type { CarId } from "@/game/cars";

/**
 * Dev-only handle for local screenshots. It sets the on-screen streak and the Journal
 * title rows. It does not write a wallet, a ledger row, or a coin balance.
 */
export type StreakSeed = {
  run: number;
  lord: boolean;
  /** All-time best the title picker should show. Defaults to the live run. */
  best?: number;
  journal?: boolean;
};

export function StreakSeedBridge() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const seed = (spec: StreakSeed) => {
      const best = spec.best ?? spec.run;
      const rows = titleRows(
        { byCat: {}, marketLamps: 0, bestStreak: best, perfects: 0, violet: 0, cityCorrect: {}, streakLord: spec.lord },
        ["austin"],
      );
      const g = useGame.getState();
      useGame.setState({
        serverStreak: spec.run,
        streakLord: spec.lord,
        bestStreak: Math.max(g.bestStreak, best),
        howtoDone: true,
        tutorial: 4,
        cratePop: null,
        blitzOffer: false,
        carOn: "mustang" as CarId,
        carsOwned: g.carsOwned.includes("mustang") ? g.carsOwned : [...g.carsOwned, "mustang"],
        carCab: false,
        carPaint: { ...g.carPaint, mustang: "red" },
        hqOpen: Boolean(spec.journal),
      });
      if (spec.journal) {
        const view: LevelView = {
          level: 12,
          into: 20,
          need: 80,
          xp: 1200,
          title: spec.lord ? "streak-lord" : "",
          titleName: spec.lord ? "Streak Lord" : null,
          color: "",
          colors: [],
          rows,
          boosts: 0,
          gifts: 0,
          boostUntil: 0,
          paid: [],
          giftsIn: [],
          wallet: { coins: g.points, keys: g.keys },
        };
        useLevel.setState({ view, userId: "seed-local" });
      }
      const broken = spec.lord && spec.run < 250;
      setLabel(
        broken
          ? "SEEDED LOCAL STATE — not a live account. Streak broke. Streak Lord stays. No wallet was paid."
          : `SEEDED LOCAL STATE — not a live account. Answer streak ${spec.run}. No wallet was paid.`,
      );
    };
    (window as Window & { __keylineSeed?: (spec: StreakSeed) => void }).__keylineSeed = seed;
    return () => {
      delete (window as Window & { __keylineSeed?: (spec: StreakSeed) => void }).__keylineSeed;
    };
  }, []);
  if (!label) return null;
  return (
    <p className="seed-live-banner" data-testid="seed-banner">
      {label}
    </p>
  );
}
