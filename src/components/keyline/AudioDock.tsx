import { useEffect, useState } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { BED_NAME, isMusicOn, isMuted, subscribeAudio, toggleMusic, toggleMuted, unlockAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import { CITY_BED_NAME } from "@/game/music";
import { SkyToggle } from "./Sky";

export function useAudioUi() {
  const [, setN] = useState(0);
  useEffect(() => subscribeAudio(() => setN((n) => n + 1)), []);
  return { muted: isMuted(), musicOn: isMusicOn() };
}

export function AudioDock() {
  const { muted, musicOn } = useAudioUi();
  const scout = useGame((s) => s.scout);
  const cityId = useGame((s) => s.cityId);
  const inPlay = useGame((s) => s.screen !== "title" && s.screen !== "cities");
  // 0.1.62: in play the music is the city's own bed, so name that one.
  const bed = inPlay ? CITY_BED_NAME[cityId] : BED_NAME[scout];

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="hud-plate is-kit pointer-events-auto size-11 justify-center p-0"
        onClick={() => {
          unlockAudio();
          toggleMusic();
        }}
        aria-label={musicOn ? `Turn off ${bed}` : `Turn on ${bed}`}
        title={musicOn ? `${bed} on` : `${bed} off`}
      >
        {musicOn && !muted ? <Music className="size-4" strokeWidth={1.75} /> : <Music className="size-4 text-fg-muted" strokeWidth={1.75} />}
      </button>
      <button
        type="button"
        className="hud-plate is-kit pointer-events-auto size-11 justify-center p-0"
        onClick={() => {
          unlockAudio();
          toggleMuted();
        }}
        aria-label={muted ? "Unmute audio" : "Mute all audio"}
        title={muted ? "Audio off" : "Audio on"}
      >
        {muted ? <VolumeX className="size-4 text-fg-muted" strokeWidth={1.75} /> : <Volume2 className="size-4" strokeWidth={1.75} />}
      </button>
      <SkyToggle />
    </div>
  );
}
