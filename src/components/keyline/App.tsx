import { useGame } from "@/game/store";
import { TitleScreen } from "./TitleScreen";
import { CitySelect } from "./CitySelect";
import { GameMap } from "./GameMap";
import { RideScreen } from "./RideScreen";

export function KeylineApp() {
  const screen = useGame((s) => s.screen);
  if (screen === "title") return <TitleScreen />;
  if (screen === "cities") return <CitySelect />;
  if (screen === "ride") return <RideScreen />;
  return <GameMap />;
}
