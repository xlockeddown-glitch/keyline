import type { ScoutId } from "./types";

const PREF_KEY = "keyline-audio";

type Prefs = { muted: boolean; music: boolean };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let musicFilter: BiquadFilterNode | null = null;
let muted = false;
let musicOn = true;
let noise: AudioBuffer | null = null;
let vinyl: AudioBufferSourceNode | null = null;
let vinylGain: GainNode | null = null;
let clock = 0;
let nextNote = 0;
let step = 0;
let current: ScoutId | null = null;
let visHooked = false;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeAudio(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return { muted: false, music: true };
    const p = JSON.parse(raw) as Partial<Prefs>;
    return { muted: Boolean(p.muted), music: p.music !== false };
  } catch {
    return { muted: false, music: true };
  }
}

function savePrefs() {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ muted, music: musicOn } satisfies Prefs));
  } catch {
    /* private mode */
  }
}

const prefs = loadPrefs();
muted = prefs.muted;
musicOn = prefs.music;

function midi(n: number) {
  return 440 * 2 ** ((n - 69) / 12);
}

type Bed = {
  bpm: number;
  root: number;
  scale: number[];
  chords: number[][];
  swing: number;
  cutoff: number;
  vinyl: number;
  kit: "dust" | "soft" | "none" | "bounce";
  hats: number;
  melody: boolean;
  pad: boolean;
};

const BEDS: Record<ScoutId, Bed> = {
  raccoon: {
    bpm: 76,
    root: 50,
    scale: [0, 2, 3, 5, 7, 9, 10],
    chords: [
      [0, 3, 7, 10],
      [5, 8, 12, 15],
      [7, 10, 14, 17],
      [0, 3, 7, 12],
    ],
    swing: 0.18,
    cutoff: 2400,
    vinyl: 0.028,
    kit: "dust",
    hats: 2,
    melody: true,
    pad: true,
  },
  cat: {
    bpm: 86,
    root: 57,
    scale: [0, 2, 4, 7, 9, 11],
    chords: [
      [0, 4, 7, 11],
      [5, 9, 12, 16],
      [7, 11, 14, 18],
      [0, 4, 7, 12],
    ],
    swing: 0.12,
    cutoff: 3200,
    vinyl: 0.016,
    kit: "soft",
    hats: 2,
    melody: true,
    pad: true,
  },
  turtle: {
    bpm: 56,
    root: 48,
    scale: [0, 3, 5, 7, 10],
    chords: [
      [0, 3, 7],
      [5, 8, 12],
      [7, 10, 14],
      [0, 5, 10],
    ],
    swing: 0.08,
    cutoff: 1600,
    vinyl: 0.022,
    kit: "none",
    hats: 8,
    melody: false,
    pad: true,
  },
  owl: {
    bpm: 66,
    root: 54,
    scale: [0, 2, 3, 5, 7, 8, 10],
    chords: [
      [0, 3, 7, 10],
      [8, 12, 15, 19],
      [5, 8, 12, 15],
      [0, 3, 7, 12],
    ],
    swing: 0.16,
    cutoff: 2800,
    vinyl: 0.02,
    kit: "soft",
    hats: 4,
    melody: true,
    pad: true,
  },
  corgi: {
    bpm: 96,
    root: 55,
    scale: [0, 2, 4, 7, 9],
    chords: [
      [0, 4, 7],
      [7, 11, 14],
      [5, 9, 12],
      [0, 4, 7, 12],
    ],
    swing: 0.2,
    cutoff: 3600,
    vinyl: 0.014,
    kit: "bounce",
    hats: 1,
    melody: true,
    pad: false,
  },
  sloth: {
    bpm: 50,
    root: 46,
    scale: [0, 2, 4, 7, 9, 10],
    chords: [
      [0, 4, 7, 10],
      [5, 9, 12],
      [0, 4, 7],
      [7, 10, 14],
    ],
    swing: 0.06,
    cutoff: 1400,
    vinyl: 0.03,
    kit: "none",
    hats: 8,
    melody: true,
    pad: true,
  },
  fox: {
    bpm: 70,
    root: 52,
    scale: [0, 2, 3, 5, 7, 8, 10],
    chords: [
      [0, 3, 7, 10],
      [5, 8, 12, 15],
      [8, 12, 15, 19],
      [0, 3, 7, 12],
    ],
    swing: 0.14,
    cutoff: 2200,
    vinyl: 0.024,
    kit: "dust",
    hats: 3,
    melody: true,
    pad: true,
  },
  lynx: {
    bpm: 64,
    root: 49,
    scale: [0, 2, 3, 5, 7, 8, 10],
    chords: [
      [0, 3, 7, 10],
      [5, 8, 12, 15],
      [8, 12, 15, 19],
      [0, 3, 7, 12],
    ],
    swing: 0.1,
    cutoff: 1800,
    vinyl: 0.02,
    kit: "dust",
    hats: 4,
    melody: true,
    pad: true,
  },
};

export const BED_NAME: Record<ScoutId, string> = {
  raccoon: "Lantern dust",
  cat: "Quiet step",
  turtle: "Shell tide",
  owl: "Night eyes",
  corgi: "Curb bounce",
  sloth: "The long way",
  fox: "Coal dusk",
  lynx: "Through the block",
};

function hookVis() {
  if (visHooked) return;
  visHooked = true;
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else {
      void ctx.resume();
      nextNote = ctx.currentTime;
    }
  });
}

export function unlockAudio() {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!ctx) {
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = "lowpass";
    musicFilter.frequency.value = 2400;
    musicFilter.Q.value = 0.7;
    sfxBus.gain.value = 1;
    musicBus.gain.value = musicOn ? 0.7 : 0;
    master.gain.value = muted ? 0 : 0.22;
    sfxBus.connect(master);
    musicFilter.connect(musicBus);
    musicBus.connect(master);
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  hookVis();
}

function applyGains() {
  if (!ctx || !master || !musicBus) return;
  master.gain.setTargetAtTime(muted ? 0 : 0.22, ctx.currentTime, 0.04);
  musicBus.gain.setTargetAtTime(!musicOn || muted ? 0 : 0.7, ctx.currentTime, 0.06);
}

export function isMuted() {
  return muted;
}

export function isMusicOn() {
  return musicOn;
}

export function setMuted(v: boolean) {
  muted = v;
  applyGains();
  savePrefs();
  notify();
  if (!v && musicOn && current) startBed(current);
}

export function setMusicOn(v: boolean) {
  musicOn = v;
  applyGains();
  savePrefs();
  notify();
  if (v && current) startBed(current);
  if (!v) haltBed();
}

export function toggleMuted() {
  setMuted(!muted);
}

export function toggleMusic() {
  setMusicOn(!musicOn);
}

function beep(freq: number, dur: number, type: OscillatorType, vol = 0.4, slide = 0) {
  if (!ctx || !sfxBus || muted) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(sfxBus);
  osc.start(t);
  osc.stop(t + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

export const sfx = {
  pickup: () => {
    beep(880, 0.08, "triangle", 0.35, 220);
    beep(1320, 0.1, "sine", 0.18, 80);
  },
  open: () => {
    beep(220, 0.16, "square", 0.2, 80);
    beep(440, 0.2, "triangle", 0.22, 200);
  },
  correct: () => {
    beep(523, 0.1, "triangle", 0.28);
    setTimeout(() => beep(784, 0.16, "triangle", 0.3), 70);
  },
  perfect: () => {
    beep(659, 0.08, "sine", 0.3);
    setTimeout(() => beep(880, 0.1, "sine", 0.28), 60);
    setTimeout(() => beep(1319, 0.18, "triangle", 0.22), 120);
  },
  wrong: () => {
    beep(180, 0.22, "sawtooth", 0.18, -80);
  },
  craft: () => {
    beep(392, 0.12, "square", 0.2, 120);
    setTimeout(() => beep(523, 0.16, "triangle", 0.22), 90);
  },
  ui: () => beep(640, 0.05, "square", 0.12),
  fireworks: (kind: "mini" | "grand") => {
    if (!ctx || !sfxBus || muted) return;
    const t0 = ctx.currentTime;
    const n = kind === "grand" ? 18 : 7;
    const gap = kind === "grand" ? 0.22 : 0.36;
    if (kind === "grand" && musicBus && musicOn) {
      musicBus.gain.setTargetAtTime(0.28, t0, 0.1);
      musicBus.gain.setTargetAtTime(0.7, t0 + 12, 1.1);
    }
    for (let i = 0; i < n; i++) {
      const when = t0 + 0.12 + i * gap + Math.random() * 0.08;
      const low = 140 + Math.random() * 90;
      beepAt(when, low, 0.22, "sine", kind === "grand" ? 0.28 : 0.2, -90);
      noiseAt(when, 0.12, kind === "grand" ? 0.16 : 0.1);
      if (kind === "grand" && i % 4 === 0) beepAt(when, 62, 0.35, "sine", 0.22, -30);
    }
    if (kind === "grand") {
      const finale = t0 + n * gap + 0.2;
      for (let i = 0; i < 8; i++) {
        const when = finale + i * 0.09;
        beepAt(when, 180 + Math.random() * 120, 0.18, "triangle", 0.24, -70);
        noiseAt(when, 0.1, 0.14);
      }
    }
  },
};

function beepAt(when: number, freq: number, dur: number, type: OscillatorType, vol: number, slide: number) {
  if (!ctx || !sfxBus) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), when + dur);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  g.connect(sfxBus);
  osc.start(when);
  osc.stop(when + dur + 0.03);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function noiseAt(when: number, dur: number, vol: number) {
  if (!ctx || !sfxBus || !noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 900;
  f.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, when + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  src.connect(f);
  f.connect(g);
  g.connect(sfxBus);
  src.start(when);
  src.stop(when + dur + 0.04);
  src.onended = () => {
    src.disconnect();
    f.disconnect();
    g.disconnect();
  };
}

function envGain(when: number, attack: number, dur: number, vol: number) {
  if (!ctx) throw new Error("audio");
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, when + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  return g;
}

function oscAt(type: OscillatorType, freq: number, when: number, dur: number, slide?: number) {
  if (!ctx) throw new Error("audio");
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slide), when + dur);
  osc.start(when);
  osc.stop(when + dur + 0.03);
  return osc;
}

function burst(when: number, dur: number, hp: number, vol: number) {
  if (!ctx || !noise || !musicFilter) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = envGain(when, 0.004, dur, vol);
  src.connect(f);
  f.connect(g);
  g.connect(musicFilter);
  src.start(when);
  src.stop(when + dur + 0.04);
  src.onended = () => {
    src.disconnect();
    f.disconnect();
    g.disconnect();
  };
}

function kick(when: number, vol: number) {
  if (!ctx || !musicFilter) return;
  const g = envGain(when, 0.004, 0.18, vol);
  const osc = oscAt("sine", 92, when, 0.18, 38);
  osc.connect(g);
  g.connect(musicFilter);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function rhodes(notes: number[], when: number, dur: number, vol: number) {
  if (!ctx || !musicFilter) return;
  for (let i = 0; i < notes.length; i++) {
    const freq = midi(notes[i]!);
    const g = envGain(when, 0.02, dur, vol / notes.length);
    const a = oscAt("sine", freq, when, dur);
    const b = oscAt("triangle", freq * 1.003, when, dur);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(1200 + i * 180, when);
    a.connect(f);
    b.connect(f);
    f.connect(g);
    g.connect(musicFilter);
    a.onended = () => {
      a.disconnect();
      b.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }
}

function bass(note: number, when: number, dur: number, vol: number) {
  if (!ctx || !musicFilter) return;
  const g = envGain(when, 0.01, dur, vol);
  const osc = oscAt("triangle", midi(note), when, dur);
  osc.connect(g);
  g.connect(musicFilter);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function lead(note: number, when: number, dur: number, vol: number) {
  if (!ctx || !musicFilter) return;
  const g = envGain(when, 0.015, dur, vol);
  const osc = oscAt("sine", midi(note), when, dur);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 1800;
  osc.connect(f);
  f.connect(g);
  g.connect(musicFilter);
  osc.onended = () => {
    osc.disconnect();
    f.disconnect();
    g.disconnect();
  };
}

function playStep(bed: Bed, n: number, when: number) {
  const bar = Math.floor(n / 16) % 4;
  const s = n % 16;
  const chord = bed.chords[bar]!.map((iv) => bed.root + iv);
  const kitVol = bed.kit === "bounce" ? 0.22 : bed.kit === "dust" ? 0.16 : 0.1;

  if (bed.kit !== "none") {
    if (s === 0 || (bed.kit === "bounce" && s === 8)) kick(when, kitVol);
    if (bed.kit === "dust" && s === 8) kick(when, kitVol * 0.55);
    if ((s === 4 || s === 12) && bed.kit !== "soft") burst(when, 0.08, 1800, kitVol * 0.45);
    if (bed.kit === "bounce" && (s === 4 || s === 12)) burst(when, 0.06, 2400, kitVol * 0.4);
  }
  if (s % bed.hats === 0) {
    const open = bed.kit === "bounce" && s % 8 === 6;
    burst(when, open ? 0.12 : 0.035, open ? 5000 : 7000, (open ? 0.07 : 0.045) * (s % 4 === 0 ? 1 : 0.7));
  }
  if (s === 0) rhodes(chord, when, bed.pad ? 1.8 : 0.9, bed.pad ? 0.22 : 0.16);
  if (s === 0 || s === 8) bass(bed.root + (s === 8 ? bed.chords[bar]![0]! : 0), when, 0.42, 0.2);
  if (bed.melody && (s === 2 || s === 6 || s === 10 || s === 14) && (bar === 1 || bar === 3)) {
    const deg = bed.scale[(n + bar * 3) % bed.scale.length]!;
    lead(bed.root + 12 + deg, when, 0.22, 0.09);
  }
}

function haltBed() {
  if (clock) {
    window.clearInterval(clock);
    clock = 0;
  }
  if (vinyl) {
    try {
      vinyl.stop();
    } catch {
      /* already stopped */
    }
    vinyl.disconnect();
    vinyl = null;
  }
  if (vinylGain) {
    vinylGain.disconnect();
    vinylGain = null;
  }
}

function spinVinyl(bed: Bed) {
  if (!ctx || !noise || !musicFilter || bed.vinyl <= 0) return;
  vinylGain = ctx.createGain();
  vinylGain.gain.value = bed.vinyl;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 900;
  f.Q.value = 0.6;
  vinyl = ctx.createBufferSource();
  vinyl.buffer = noise;
  vinyl.loop = true;
  vinyl.connect(f);
  f.connect(vinylGain);
  vinylGain.connect(musicFilter);
  vinyl.start();
}

function tick() {
  if (!ctx || !musicOn || muted || !current) return;
  const bed = BEDS[current];
  const sixteenth = 60 / bed.bpm / 4;
  const now = ctx.currentTime;
  while (nextNote < now + 0.12) {
    const swung = nextNote + (step % 2 === 1 ? sixteenth * bed.swing : 0);
    playStep(bed, step, swung);
    step += 1;
    nextNote += sixteenth;
  }
}

export function startBed(id: ScoutId) {
  const restart = current !== id || !clock;
  current = id;
  if (!ctx || !musicFilter || !musicOn || muted) return;
  const bed = BEDS[id];
  if (!restart) {
    musicFilter.frequency.setTargetAtTime(bed.cutoff, ctx.currentTime, 0.08);
    return;
  }
  haltBed();
  musicFilter.frequency.setValueAtTime(bed.cutoff, ctx.currentTime);
  nextNote = ctx.currentTime + 0.05;
  step = 0;
  spinVinyl(bed);
  clock = window.setInterval(tick, 40);
}

export function stopBed() {
  current = null;
  haltBed();
}

export function syncBed(id: ScoutId) {
  startBed(id);
}
