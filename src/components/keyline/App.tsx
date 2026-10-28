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
