/**
 * 0.1.54 sound pack: short synthesized effects described as plain data, so the browser
 * (audio.ts) and the offline preview renderer (scripts/sfx-render.mts) play the same recipe.
 */
export type Wave = "sine" | "triangle" | "square" | "sawtooth";
/** A tone: start offset, length (s), start pitch (Hz), optional pitch glide target, peak gain. */
export type Tone = { at: number; dur: number; freq: number; to?: number; wave: Wave; vol: number };
/** A filtered noise puff (door thunk, crate creak, engine chuff). */
export type Puff = { at: number; dur: number; lp: number; vol: number };
export type Recipe = { tones: Tone[]; puffs?: Puff[] };

export type SfxName = "carBuy" | "carStart" | "carDoor" | "cityArrive" | "levelUp" | "questDone" | "crateOpen";

const t = (at: number, dur: number, freq: number, wave: Wave, vol: number, to?: number): Tone => ({ at, dur, freq, wave, vol, ...(to ? { to } : {}) });

export const PACK: Record<SfxName, Recipe> = {
  // Register "ka-ching": two bright bell partials over a tiny drawer thunk.
  carBuy: {
    tones: [t(0, 0.09, 180, "triangle", 0.18, 120), t(0.07, 0.5, 1568, "sine", 0.2), t(0.07, 0.4, 3136, "sine", 0.06), t(0.16, 0.6, 2093, "sine", 0.18), t(0.16, 0.45, 4186, "sine", 0.05)],
    puffs: [{ at: 0, dur: 0.06, lp: 900, vol: 0.12 }],
  },
  // Door thunk, starter whirr, then a low idle catch.
  carStart: {
    tones: [t(0, 0.12, 110, "sine", 0.3, 60), t(0.22, 0.35, 70, "sawtooth", 0.07, 140), t(0.55, 0.5, 55, "triangle", 0.22, 62)],
    puffs: [{ at: 0, dur: 0.09, lp: 600, vol: 0.2 }, { at: 0.55, dur: 0.18, lp: 400, vol: 0.12 }],
  },
  // Stepping out: a single soft door shut.
  carDoor: {
    tones: [t(0, 0.14, 120, "sine", 0.3, 65)],
    puffs: [{ at: 0, dur: 0.08, lp: 700, vol: 0.2 }],
  },
  // Station chime: a three-note "ding-dong-ding" (E5 C5 G5).
  cityArrive: {
    tones: [t(0, 0.4, 659, "sine", 0.22), t(0, 0.3, 1318, "sine", 0.05), t(0.24, 0.4, 523, "sine", 0.22), t(0.48, 0.55, 784, "sine", 0.22), t(0.48, 0.4, 1568, "sine", 0.05)],
  },
  // Rising major arpeggio with a sparkle on top.
  levelUp: {
    tones: [t(0, 0.14, 523, "triangle", 0.2), t(0.09, 0.14, 659, "triangle", 0.2), t(0.18, 0.14, 784, "triangle", 0.2), t(0.27, 0.5, 1047, "triangle", 0.22), t(0.36, 0.4, 2093, "sine", 0.06, 2637)],
  },
  // Quest stamp: a paper thump then a warm two-note resolve (G4 to C5).
  questDone: {
    tones: [t(0, 0.08, 160, "sine", 0.22, 90), t(0.1, 0.18, 392, "triangle", 0.2), t(0.22, 0.4, 523, "triangle", 0.22), t(0.22, 0.4, 784, "sine", 0.07)],
    puffs: [{ at: 0, dur: 0.05, lp: 1200, vol: 0.1 }],
  },
  // Lid creak (a slow pitch bend) and a little shimmer of loot.
  crateOpen: {
    tones: [t(0, 0.22, 300, "triangle", 0.1, 420), t(0.24, 0.12, 1175, "sine", 0.14), t(0.31, 0.12, 1397, "sine", 0.14), t(0.38, 0.35, 1760, "sine", 0.14)],
    puffs: [{ at: 0.2, dur: 0.06, lp: 1000, vol: 0.1 }],
  },
};

/** Seconds until the recipe's last sound ends (plus the tail used by the envelope). */
export function recipeLength(r: Recipe): number {
  const ends = [...r.tones.map((x) => x.at + x.dur), ...(r.puffs ?? []).map((p) => p.at + p.dur)];
  return Math.max(0, ...ends) + 0.03;
}

/**
 * Once-per-event gate. A keyed event (e.g. "level:12") plays at most once ever per session;
 * an unkeyed one is held back if the same effect fired in the last `gapMs` (double taps, re-renders).
 */
export function makeSfxGate(gapMs = 350, keep = 200) {
  const last = new Map<SfxName, number>();
  const seen: string[] = [];
  return (name: SfxName, now: number, key?: string): boolean => {
    if (key) {
      const k = `${name}|${key}`;
      if (seen.includes(k)) return false;
      seen.push(k);
      if (seen.length > keep) seen.shift();
    }
    const prev = last.get(name);
    if (prev !== undefined && now - prev < gapMs) return false;
    last.set(name, now);
    return true;
  };
}
