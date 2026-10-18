import { create } from "zustand";
import type { LevelView } from "./levelsServer";

/** 0.0.98: the signed-in player's level, as the server last reported it. Guests stay null. */
export const useLevel = create<{ view: LevelView | null; userId: string | null; nudge: number }>(() => ({ view: null, userId: null, nudge: 0 }));
