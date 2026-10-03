import { useGame } from "@/game/store";
import { TitleScreen } from "./TitleScreen";
import { CitySelect } from "./CitySelect";
import { GameMap } from "./GameMap";
import { RideScreen } from "./RideScreen";
import { WardrobeSync } from "./WardrobeSync";

export function KeylineApp() {
  const screen = useGame((s) => s.screen);
  const view = screen === "title" ? <TitleScreen /> : screen === "cities" ? <CitySelect /> : screen === "ride" ? <RideScreen /> : <GameMap />;
  return (
    <>
      <WardrobeSync />
      {view}
    </>
  );
}
