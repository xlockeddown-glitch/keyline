import { useEffect } from "react";
import { setCityBed } from "@/game/audio";
import { useGame } from "@/game/store";
import { LevelSync } from "./Levels";
import { PrintSync } from "./Prints";
import { TitleScreen } from "./TitleScreen";
import { CitySelect } from "./CitySelect";
import { GameMap } from "./GameMap";
import { RideScreen } from "./RideScreen";
import { LoopScreen } from "./LoopScreen";
import { DyeSync } from "./DyeSync";
import { WardrobeSync } from "./WardrobeSync";
import { WornScoutSync } from "./WornScoutSync";
import { WalletSync } from "./WalletSync";
import { SkinSync } from "./SkinSheet";

export function KeylineApp() {
  const screen = useGame((s) => s.screen);
  const looping = useGame((s) => s.loop !== null);
  const cityId = useGame((s) => s.cityId);
  // 0.1.62: in play each city has its own music bed; the title screen and city picker keep the scout bed.
  const inPlay = screen !== "title" && screen !== "cities";
  useEffect(() => setCityBed(inPlay ? cityId : null), [inPlay, cityId]);
  const view = screen === "title" ? <TitleScreen /> : screen === "cities" ? <CitySelect /> : screen === "ride" ? <RideScreen /> : screen === "loop" && looping ? <LoopScreen /> : <GameMap />;
  return (
    <>
      <WardrobeSync />
      <WornScoutSync />
      <WalletSync />
      <SkinSync />
      <DyeSync />
      <LevelSync />
      <PrintSync />
      {view}
    </>
  );
}
