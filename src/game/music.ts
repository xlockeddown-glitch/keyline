/**
 * 0.1.62 music beds as plain data (like sfxPack), plus the pure step scheduler and the deck that
 * crossfades between beds. audio.ts turns events into Web Audio nodes; scripts/music-render.mts
 * renders the same events offline to WAV. Nothing here touches the DOM or Web Audio.
 */
import type { CityId, ScoutId } from "./types";

export type Wave = "sine" | "triangle" | "square" | "sawtooth";
export type Kit = "dust" | "soft" | "none" | "bounce" | "brush" | "shuffle";
/** Chord voice: "rhodes" is the original two-oscillator e-piano; "pad" one slow triangle per note; "organ" one soft square per note. */
export type PadVoice = "rhodes" | "pad" | "organ";
export type Lead = { wave: Wave; steps: number[]; bars: "odd" | "all" | "last"; octave: number; dur: number; vol: number };

export type Bed = {
  bpm: number;
  root: number;
  scale: number[];
  chords: number[][];
  swing: number;
  cutoff: number;
  vinyl: number;
  kit: Kit;
  /** Hat every N sixteenths; 0 = no hats. */
  hats: number;
  melody: boolean;
  pad: boolean;
  /** City extras (scout beds leave these out and sound exactly as before). */
  padVoice?: PadVoice;
  padBars?: number;
  bassLine?: "roots" | "walk" | "pulse" | "none";
  lead?: Lead;
  /** Bed loudness trim, applied to every event (keeps cities level with each other). */
  level?: number;
};

export type MusicEvent =
  | { kind: "kick"; vol: number }
  | { kind: "noise"; dur: number; hp: number; vol: number }
  | { kind: "chord"; notes: number[]; dur: number; vol: number; voice: PadVoice }
  | { kind: "bass"; note: number; dur: number; vol: number }
  | { kind: "lead"; note: number; dur: number; vol: number; wave: Wave };

export const SCOUT_BEDS: Record<ScoutId, Bed> = {
  raccoon: { bpm: 76, root: 50, scale: [0, 2, 3, 5, 7, 9, 10], chords: [[0, 3, 7, 10], [5, 8, 12, 15], [7, 10, 14, 17], [0, 3, 7, 12]], swing: 0.18, cutoff: 2400, vinyl: 0.028, kit: "dust", hats: 2, melody: true, pad: true },
  cat: { bpm: 86, root: 57, scale: [0, 2, 4, 7, 9, 11], chords: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 18], [0, 4, 7, 12]], swing: 0.12, cutoff: 3200, vinyl: 0.016, kit: "soft", hats: 2, melody: true, pad: true },
  turtle: { bpm: 56, root: 48, scale: [0, 3, 5, 7, 10], chords: [[0, 3, 7], [5, 8, 12], [7, 10, 14], [0, 5, 10]], swing: 0.08, cutoff: 1600, vinyl: 0.022, kit: "none", hats: 8, melody: false, pad: true },
  owl: { bpm: 66, root: 54, scale: [0, 2, 3, 5, 7, 8, 10], chords: [[0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15], [0, 3, 7, 12]], swing: 0.16, cutoff: 2800, vinyl: 0.02, kit: "soft", hats: 4, melody: true, pad: true },
  corgi: { bpm: 96, root: 55, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [7, 11, 14], [5, 9, 12], [0, 4, 7, 12]], swing: 0.2, cutoff: 3600, vinyl: 0.014, kit: "bounce", hats: 1, melody: true, pad: false },
  sloth: { bpm: 50, root: 46, scale: [0, 2, 4, 7, 9, 10], chords: [[0, 4, 7, 10], [5, 9, 12], [0, 4, 7], [7, 10, 14]], swing: 0.06, cutoff: 1400, vinyl: 0.03, kit: "none", hats: 8, melody: true, pad: true },
  fox: { bpm: 70, root: 52, scale: [0, 2, 3, 5, 7, 8, 10], chords: [[0, 3, 7, 10], [5, 8, 12, 15], [8, 12, 15, 19], [0, 3, 7, 12]], swing: 0.14, cutoff: 2200, vinyl: 0.024, kit: "dust", hats: 3, melody: true, pad: true },
  // 0.0.51 Giraffe: an easy loping 6-ish swing, major and airy, high root.
  giraffe: { bpm: 72, root: 53, scale: [0, 2, 4, 5, 7, 9], chords: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]], swing: 0.22, cutoff: 3000, vinyl: 0.018, kit: "soft", hats: 3, melody: true, pad: true },
  // 0.1.47 Panda: an unhurried, humming major walk, mellow and round.
  panda: { bpm: 68, root: 50, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7, 11], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 17]], swing: 0.18, cutoff: 2400, vinyl: 0.02, kit: "soft", hats: 3, melody: true, pad: true },
  lynx: { bpm: 64, root: 49, scale: [0, 2, 3, 5, 7, 8, 10], chords: [[0, 3, 7, 10], [5, 8, 12, 15], [8, 12, 15, 19], [0, 3, 7, 12]], swing: 0.1, cutoff: 1800, vinyl: 0.02, kit: "dust", hats: 4, melody: true, pad: true },
};

const MAJ_PENTA = [0, 2, 4, 7, 9];
const MIN_PENTA = [0, 3, 5, 7, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const MIXO = [0, 2, 4, 5, 7, 9, 10];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11];
const IONIAN = [0, 2, 4, 5, 7, 9, 11];
const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];
const lead = (wave: Wave, steps: number[], bars: Lead["bars"], octave = 12, dur = 0.24, vol = 0.08): Lead => ({ wave, steps, bars, octave, dur, vol });

/** One line each: what the city's bed is going for. */
export const CITY_CHARACTER: Record<CityId, string> = {
  austin: "Laid-back Mixolydian groove, a lazy swung backbeat and a warm Rhodes.",
  temple: "Small-town front porch: slow major pentatonic, brushes, a lot of air.",
  nyc: "Brisk Dorian walk at 104 bpm, tight hats and a walking bass.",
  sf: "Foggy Lydian float, soft pads and a high, far-off lead.",
  london: "Grey drizzle in Aeolian minor, organ chords and a careful kick.",
  chicago: "Slow blues shuffle in minor pentatonic, I-IV-V-ish with a heavy swing.",
  detroit: "Motor City pulse: dusty minor groove, steady bass on every beat.",
  tucson: "Desert dusk: sparse minor pentatonic, open fifths, no drums.",
  toronto: "Clean, polite major-seventh bounce with brushed hats.",
  la: "Sunset Lydian cruise, wide pads and a lazy bounce.",
  boston: "Brick-and-ivy Dorian, an organ and a steady walking bass.",
  nola: "Swung jazz changes (ii-V-I, sevenths) with a walking bass and brushes.",
  seattle: "Rainy ambient pad, minor and slow, no drums, a drip of a lead.",
  denver: "Thin mountain air: bright major pentatonic, open voicings, light hats.",
  nashville: "Twangy major pentatonic, a triangle-wave pick and a two-beat shuffle.",
};

export const CITY_BEDS: Record<CityId, Bed> = {
  austin: { bpm: 80, root: 52, scale: MIXO, chords: [[0, 4, 7, 10], [5, 9, 12, 15], [0, 4, 7, 10], [7, 10, 14, 17]], swing: 0.2, cutoff: 2600, vinyl: 0.018, kit: "dust", hats: 2, melody: true, pad: true, padVoice: "rhodes", bassLine: "roots", lead: lead("triangle", [2, 7, 10], "odd"), level: 0.89 },
  temple: { bpm: 66, root: 55, scale: MAJ_PENTA, chords: [[0, 4, 7], [5, 9, 12], [0, 4, 7], [7, 11, 14]], swing: 0.12, cutoff: 2400, vinyl: 0.02, kit: "brush", hats: 0, melody: true, pad: true, padVoice: "pad", padBars: 1, bassLine: "roots", lead: lead("sine", [4, 12], "odd"), level: 1.15 },
  nyc: { bpm: 104, root: 50, scale: DORIAN, chords: [[0, 3, 7, 10], [5, 9, 12, 15], [0, 3, 7, 10], [7, 10, 14, 17]], swing: 0.08, cutoff: 3200, vinyl: 0.01, kit: "soft", hats: 2, melody: true, pad: false, padVoice: "rhodes", bassLine: "walk", lead: lead("triangle", [2, 6, 14], "odd", 12, 0.16, 0.07), level: 1.11 },
  sf: { bpm: 62, root: 54, scale: LYDIAN, chords: [[0, 4, 7, 11], [2, 6, 9, 14], [0, 4, 7, 11], [7, 11, 14, 18]], swing: 0.06, cutoff: 2200, vinyl: 0.014, kit: "none", hats: 8, melody: true, pad: true, padVoice: "pad", padBars: 1, bassLine: "roots", lead: lead("sine", [6], "all", 24, 0.5, 0.05), level: 1.27 },
  london: { bpm: 72, root: 50, scale: AEOLIAN, chords: [[0, 3, 7], [8, 12, 15], [3, 7, 10], [10, 14, 17]], swing: 0.04, cutoff: 1900, vinyl: 0.022, kit: "soft", hats: 4, melody: true, pad: true, padVoice: "organ", padBars: 1, bassLine: "roots", lead: lead("sine", [8], "odd", 12, 0.4, 0.06), level: 0.81 },
  chicago: { bpm: 70, root: 52, scale: MIN_PENTA, chords: [[0, 4, 7, 10], [5, 9, 12, 15], [0, 4, 7, 10], [7, 11, 14, 17]], swing: 0.33, cutoff: 2200, vinyl: 0.026, kit: "shuffle", hats: 2, melody: true, pad: true, padVoice: "rhodes", bassLine: "walk", lead: lead("triangle", [2, 6, 10], "odd", 12, 0.28, 0.08), level: 0.9 },
  detroit: { bpm: 88, root: 49, scale: DORIAN, chords: [[0, 3, 7, 10], [0, 3, 7, 10], [5, 8, 12, 15], [3, 7, 10, 14]], swing: 0.1, cutoff: 2000, vinyl: 0.024, kit: "dust", hats: 2, melody: false, pad: true, padVoice: "rhodes", padBars: 0.5, bassLine: "pulse" },
  tucson: { bpm: 58, root: 50, scale: MIN_PENTA, chords: [[0, 7, 12], [5, 12, 17], [3, 10, 15], [7, 14, 19]], swing: 0.06, cutoff: 1800, vinyl: 0.016, kit: "none", hats: 0, melody: true, pad: true, padVoice: "pad", padBars: 1, bassLine: "roots", lead: lead("triangle", [4, 11], "last", 12, 0.6, 0.06), level: 1.19 },
  toronto: { bpm: 84, root: 53, scale: IONIAN, chords: [[0, 4, 7, 11], [9, 12, 16, 19], [2, 5, 9, 12], [7, 11, 14, 17]], swing: 0.14, cutoff: 3000, vinyl: 0.012, kit: "brush", hats: 4, melody: true, pad: true, padVoice: "rhodes", bassLine: "roots", lead: lead("sine", [2, 10], "odd"), level: 0.88 },
  la: { bpm: 76, root: 52, scale: LYDIAN, chords: [[0, 4, 7, 11], [2, 6, 9, 13], [0, 4, 7, 11], [11, 14, 18, 21]], swing: 0.16, cutoff: 2800, vinyl: 0.014, kit: "soft", hats: 4, melody: true, pad: true, padVoice: "pad", padBars: 1, bassLine: "roots", lead: lead("sine", [6, 14], "odd", 12, 0.3, 0.06), level: 1.2 },
  boston: { bpm: 82, root: 50, scale: DORIAN, chords: [[0, 3, 7, 10], [5, 9, 12, 15], [10, 14, 17, 21], [7, 10, 14, 17]], swing: 0.12, cutoff: 2400, vinyl: 0.02, kit: "soft", hats: 4, melody: true, pad: true, padVoice: "organ", bassLine: "walk", lead: lead("triangle", [6], "odd", 12, 0.3, 0.06) },
  nola: { bpm: 92, root: 53, scale: MIXO, chords: [[2, 5, 9, 12], [7, 11, 14, 17], [0, 4, 7, 11], [9, 13, 16, 19]], swing: 0.3, cutoff: 2600, vinyl: 0.026, kit: "brush", hats: 2, melody: true, pad: false, padVoice: "rhodes", bassLine: "walk", lead: lead("triangle", [2, 6, 10, 14], "odd", 12, 0.18, 0.07), level: 1.15 },
  seattle: { bpm: 54, root: 49, scale: AEOLIAN, chords: [[0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15], [3, 7, 10, 14]], swing: 0, cutoff: 1500, vinyl: 0.03, kit: "none", hats: 0, melody: true, pad: true, padVoice: "pad", padBars: 1, bassLine: "none", lead: lead("sine", [10], "all", 24, 0.35, 0.04), level: 1.58 },
  denver: { bpm: 86, root: 55, scale: MAJ_PENTA, chords: [[0, 7, 16], [5, 12, 21], [9, 16, 24], [7, 14, 23]], swing: 0.1, cutoff: 3400, vinyl: 0.01, kit: "soft", hats: 4, melody: true, pad: true, padVoice: "pad", padBars: 1, bassLine: "roots", lead: lead("triangle", [2, 6, 12], "odd", 12, 0.18, 0.06), level: 1.11 },
  nashville: { bpm: 96, root: 55, scale: MAJ_PENTA, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], swing: 0.22, cutoff: 3000, vinyl: 0.014, kit: "bounce", hats: 4, melody: true, pad: false, padVoice: "rhodes", bassLine: "pulse", lead: lead("triangle", [0, 3, 6, 10, 12], "odd", 12, 0.14, 0.07), level: 1.04 },
};

export const CITY_BED_NAME: Record<CityId, string> = {
  austin: "Sixth Street sway", temple: "Porch light", nyc: "Crosstown", sf: "Fog line", london: "Drizzle", chicago: "Lakeshore shuffle",
  detroit: "Motor pulse", tucson: "Saguaro dusk", toronto: "Streetcar", la: "Sunset cruise", boston: "Red brick", nola: "Second line",
  seattle: "Rain on the sound", denver: "Thin air", nashville: "Honky step",
};

/** Seconds per sixteenth. */
export const sixteenth = (bed: Bed) => 60 / bed.bpm / 4;

/** Everything one sixteenth step of a bed plays, in order. Pure and deterministic. */
export function stepEvents(bed: Bed, n: number): MusicEvent[] {
  const out: MusicEvent[] = [];
  const bars = bed.chords.length;
  const bar = Math.floor(n / 16) % bars;
  const s = n % 16;
  const lv = bed.level ?? 1;
  const chord = bed.chords[bar]!.map((iv) => bed.root + iv);
  const kitVol = bed.kit === "bounce" ? 0.22 : bed.kit === "dust" || bed.kit === "shuffle" ? 0.16 : 0.1;
  if (bed.kit === "brush") {
    if (s === 0) out.push({ kind: "kick", vol: kitVol * 0.8 * lv });
    if (s % 4 === 0) out.push({ kind: "noise", dur: 0.11, hp: 3200, vol: kitVol * 0.28 * lv });
  } else if (bed.kit !== "none") {
    if (s === 0 || ((bed.kit === "bounce" || bed.kit === "shuffle") && s === 8)) out.push({ kind: "kick", vol: kitVol * lv });
    if (bed.kit === "dust" && s === 8) out.push({ kind: "kick", vol: kitVol * 0.55 * lv });
    if ((s === 4 || s === 12) && bed.kit !== "soft") out.push({ kind: "noise", dur: 0.08, hp: 1800, vol: kitVol * 0.45 * lv });
    if (bed.kit === "bounce" && (s === 4 || s === 12)) out.push({ kind: "noise", dur: 0.06, hp: 2400, vol: kitVol * 0.4 * lv });
  }
  if (bed.hats > 0 && s % bed.hats === 0) {
    const open = bed.kit === "bounce" && s % 8 === 6;
    out.push({ kind: "noise", dur: open ? 0.12 : 0.035, hp: open ? 5000 : 7000, vol: (open ? 0.07 : 0.045) * (s % 4 === 0 ? 1 : 0.7) * lv });
  }
  if (s === 0) {
    const dur = bed.padBars ? bed.padBars * 16 * sixteenth(bed) : bed.pad ? 1.8 : 0.9;
    out.push({ kind: "chord", notes: chord, dur, vol: (bed.pad ? 0.22 : 0.16) * lv, voice: bed.padVoice ?? "rhodes" });
  }
  const line = bed.bassLine ?? "roots";
  if (line === "roots" && (s === 0 || s === 8)) out.push({ kind: "bass", note: bed.root + (s === 8 ? bed.chords[bar]![0]! : 0), dur: 0.42, vol: 0.2 * lv });
  if (line === "walk" && s % 4 === 0) {
    const c = bed.chords[bar]!;
    const iv = [c[0]!, c[1]!, c[2]!, (c[3] ?? c[0]! + 12) - 12][s / 4]!;
    out.push({ kind: "bass", note: bed.root + (iv % 12) - (iv % 12 > 7 ? 12 : 0), dur: 0.3, vol: 0.18 * lv });
  }
  if (line === "pulse" && s % 4 === 0) out.push({ kind: "bass", note: bed.root + (bed.chords[bar]![0]! % 12), dur: 0.22, vol: 0.17 * lv });
  if (bed.lead) {
    const L = bed.lead;
    const onBar = L.bars === "all" || (L.bars === "odd" && bar % 2 === 1) || (L.bars === "last" && bar === bars - 1);
    if (onBar && L.steps.includes(s)) {
      const deg = bed.scale[(n + bar * 3) % bed.scale.length]!;
      out.push({ kind: "lead", note: bed.root + L.octave + deg, dur: L.dur, vol: L.vol * lv, wave: L.wave });
    }
  } else if (bed.melody && (s === 2 || s === 6 || s === 10 || s === 14) && (bar === 1 || bar === 3)) {
    const deg = bed.scale[(n + bar * 3) % bed.scale.length]!;
    out.push({ kind: "lead", note: bed.root + 12 + deg, dur: 0.22, vol: 0.09 * lv, wave: "sine" });
  }
  return out;
}

export type SchedState = { next: number; step: number };
/** Lookahead scheduler: every step due before `now + ahead`, with swing. Pure. */
export function scheduleWindow(bed: Bed, st: SchedState, now: number, ahead = 0.12): { at: number; events: MusicEvent[] }[] {
  const out: { at: number; events: MusicEvent[] }[] = [];
  const six = sixteenth(bed);
  // After a long stall (hidden tab, slow phone) skip ahead rather than dumping a burst of notes.
  if (st.next < now - 0.25) st.next = now + 0.02;
  while (st.next < now + ahead) {
    const at = st.next + (st.step % 2 === 1 ? six * bed.swing : 0);
    out.push({ at, events: stepEvents(bed, st.step) });
    st.step += 1;
    st.next += six;
  }
  return out;
}

export type BedKey = `city:${CityId}` | `scout:${ScoutId}`;
export function bedFor(key: BedKey): Bed {
  const [kind, id] = key.split(":") as ["city" | "scout", string];
  return kind === "city" ? CITY_BEDS[id as CityId] : SCOUT_BEDS[id as ScoutId];
}
/** In play the city bed wins; the title screen and city picker (no city) keep the scout bed. */
export function wantedBed(scout: ScoutId, city: CityId | null): BedKey {
  return city && CITY_BEDS[city] ? `city:${city}` : `scout:${scout}`;
}

/** Music only makes sound once audio is unlocked, music is on, not muted and the tab is visible. */
export function musicAudible(o: { unlocked: boolean; musicOn: boolean; muted: boolean; hidden: boolean }) {
  return o.unlocked && o.musicOn && !o.muted && !o.hidden;
}

export type Player = { id: number; key: BedKey; fadingSince: number | null };
export const FADE_S = 1.6;
/**
 * The deck holds at most two players: the live bed and one fading out. Switching to the bed that is
 * already live does nothing; switching again mid-fade cuts the older fading bed at once, so rapid
 * city changes never stack.
 */
export function deckSwitch(deck: Player[], key: BedKey, now: number, nextId: number): { deck: Player[]; started: Player | null; cut: Player[] } {
  const live = deck.find((p) => p.fadingSince === null);
  if (live && live.key === key) return { deck, started: null, cut: [] };
  const cut = deck.filter((p) => p.fadingSince !== null);
  const kept: Player[] = live ? [{ ...live, fadingSince: now }] : [];
  const started: Player = { id: nextId, key, fadingSince: null };
  return { deck: [...kept, started], started, cut };
}
export function deckPrune(deck: Player[], now: number): { deck: Player[]; cut: Player[] } {
  const cut = deck.filter((p) => p.fadingSince !== null && now - p.fadingSince >= FADE_S);
  return { deck: deck.filter((p) => !cut.includes(p)), cut };
}
