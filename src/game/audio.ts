import type { ScoutId } from "./types";
import { PACK, makeSfxGate, type SfxName } from "./sfxPack";
import { bedFor, deckPrune, deckSwitch, FADE_S, musicAudible, scheduleWindow, wantedBed, type Bed, type BedKey, type MusicEvent, type Player, type SchedState } from "./music";
import type { CityId } from "./types";

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
let clock = 0;
let current: ScoutId | null = null;
/** 0.1.62: the city whose bed plays in play; null on the title screen and city picker. */
let currentCity: CityId | null = null;
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

export const BED_NAME: Record<ScoutId, string> = {
  giraffe: "Over the rooftops",
  raccoon: "Lantern dust",
  cat: "Quiet step",
  turtle: "Shell tide",
  owl: "Night eyes",
  corgi: "Curb bounce",
  sloth: "The long way",
  fox: "Coal dusk",
  lynx: "Through the block",
  panda: "Bamboo hum",
};

function hookVis() {
  if (visHooked) return;
  visHooked = true;
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else {
      void ctx.resume();
      for (const r of runs.values()) r.st.next = ctx.currentTime + 0.05;
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
  if (v) haltBed();
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

const packGate = makeSfxGate();

/** 0.1.54: play one sound-pack recipe. Silent until unlockAudio ran from a tap (iOS/Safari) and while muted. */
function playPack(name: SfxName, key?: string) {
  if (!ctx || !sfxBus || muted) return;
  if (!packGate(name, Date.now(), key)) return;
  const t0 = ctx.currentTime + 0.005;
  const r = PACK[name];
  for (const x of r.tones) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = x.wave;
    osc.frequency.setValueAtTime(x.freq, t0 + x.at);
    if (x.to) osc.frequency.exponentialRampToValueAtTime(x.to, t0 + x.at + x.dur);
    g.gain.setValueAtTime(0.0001, t0 + x.at);
    g.gain.exponentialRampToValueAtTime(x.vol, t0 + x.at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + x.at + x.dur);
    osc.connect(g);
    g.connect(sfxBus);
    osc.start(t0 + x.at);
    osc.stop(t0 + x.at + x.dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }
  for (const p of r.puffs ?? []) {
    if (!noise) break;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = p.lp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0 + p.at);
    g.gain.exponentialRampToValueAtTime(p.vol, t0 + p.at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + p.at + p.dur);
    src.connect(f);
    f.connect(g);
    g.connect(sfxBus);
    src.start(t0 + p.at);
    src.stop(t0 + p.at + p.dur + 0.02);
    src.onended = () => {
      src.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }
}

export const sfx = {
  /** 0.1.54 sound pack. `key` makes a one-off event (a level number, a quest id) play only once. */
  carBuy: () => playPack("carBuy"),
  carStart: () => playPack("carStart"),
  carDoor: () => playPack("carDoor"),
  cityArrive: () => playPack("cityArrive"),
  loopWhoosh: () => playPack("loopWhoosh"),
  levelUp: (key?: string) => playPack("levelUp", key),
  questDone: (key?: string) => playPack("questDone", key),
  crateOpen: (key?: string) => playPack("crateOpen", key),
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
  /** 0.0.92: the wheel pointer clicking past a slice peg. */
  tick: () => beep(1700, 0.022, "square", 0.07),
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

/** One running bed: its own lowpass and fade gain into the shared music filter. */
type Run = { player: Player; bed: Bed; st: SchedState; filter: BiquadFilterNode; gain: GainNode; vinyl: AudioBufferSourceNode | null };
const runs = new Map<number, Run>();
let deck: Player[] = [];
let nextPlayerId = 1;

function burst(out: AudioNode, when: number, dur: number, hp: number, vol: number) {
  if (!ctx || !noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = envGain(when, 0.004, dur, vol);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(when);
  src.stop(when + dur + 0.04);
  src.onended = () => {
    src.disconnect();
    f.disconnect();
    g.disconnect();
  };
}

function kick(out: AudioNode, when: number, vol: number) {
  if (!ctx) return;
  const g = envGain(when, 0.004, 0.18, vol);
  const osc = oscAt("sine", 92, when, 0.18, 38);
  osc.connect(g);
  g.connect(out);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function chord(out: AudioNode, notes: number[], when: number, dur: number, vol: number, voice: "rhodes" | "pad" | "organ") {
  if (!ctx) return;
  for (let i = 0; i < notes.length; i++) {
    const freq = midi(notes[i]!);
    const g = envGain(when, voice === "pad" ? Math.min(0.6, dur / 3) : 0.02, dur, vol / notes.length);
    const a = oscAt(voice === "organ" ? "square" : voice === "pad" ? "triangle" : "sine", freq, when, dur);
    const b = voice === "rhodes" ? oscAt("triangle", freq * 1.003, when, dur) : null;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(voice === "organ" ? 700 + i * 120 : 1200 + i * 180, when);
    a.connect(f);
    b?.connect(f);
    f.connect(g);
    g.connect(out);
    a.onended = () => {
      a.disconnect();
      b?.disconnect();
      f.disconnect();
      g.disconnect();
    };
  }
}

function bass(out: AudioNode, note: number, when: number, dur: number, vol: number) {
  if (!ctx) return;
  const g = envGain(when, 0.01, dur, vol);
  const osc = oscAt("triangle", midi(note), when, dur);
  osc.connect(g);
  g.connect(out);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function lead(out: AudioNode, note: number, when: number, dur: number, vol: number, wave: OscillatorType) {
  if (!ctx) return;
  const g = envGain(when, 0.015, dur, vol);
  const osc = oscAt(wave, midi(note), when, dur);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 1800;
  osc.connect(f);
  f.connect(g);
  g.connect(out);
  osc.onended = () => {
    osc.disconnect();
    f.disconnect();
    g.disconnect();
  };
}

function play(out: AudioNode, e: MusicEvent, when: number) {
  if (e.kind === "kick") kick(out, when, e.vol);
  else if (e.kind === "noise") burst(out, when, e.dur, e.hp, e.vol);
  else if (e.kind === "chord") chord(out, e.notes, when, e.dur, e.vol, e.voice);
  else if (e.kind === "bass") bass(out, e.note, when, e.dur, e.vol);
  else lead(out, e.note, when, e.dur, e.vol, e.wave);
}

function spinVinyl(bed: Bed, out: AudioNode) {
  if (!ctx || !noise || bed.vinyl <= 0) return null;
  const vg = ctx.createGain();
  vg.gain.value = bed.vinyl;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 900;
  f.Q.value = 0.6;
  const v = ctx.createBufferSource();
  v.buffer = noise;
  v.loop = true;
  v.connect(f);
  f.connect(vg);
  vg.connect(out);
  v.start();
  v.onended = () => {
    v.disconnect();
    f.disconnect();
    vg.disconnect();
  };
  return v;
}

function endRun(id: number) {
  const r = runs.get(id);
  if (!r) return;
  runs.delete(id);
  try {
    r.vinyl?.stop();
  } catch {
    /* already stopped */
  }
  // Let notes already scheduled ring out under the faded gain, then let go of the nodes.
  window.setTimeout(() => {
    r.filter.disconnect();
    r.gain.disconnect();
  }, 2500);
}

function haltBed() {
  if (clock) {
    window.clearInterval(clock);
    clock = 0;
  }
  for (const id of [...runs.keys()]) endRun(id);
  deck = [];
}

function startRun(p: Player) {
  if (!ctx || !musicFilter) return;
  const bed = bedFor(p.key);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = bed.cutoff;
  filter.Q.value = 0.7;
  const gain = ctx.createGain();
  const t = ctx.currentTime;
  const first = runs.size === 0;
  gain.gain.setValueAtTime(first ? 1 : 0.0001, t);
  if (!first) gain.gain.exponentialRampToValueAtTime(1, t + FADE_S);
  filter.connect(gain);
  gain.connect(musicFilter);
  runs.set(p.id, { player: p, bed, st: { next: t + 0.05, step: 0 }, filter, gain, vinyl: spinVinyl(bed, filter) });
}

function tick() {
  if (!ctx || !musicAudible({ unlocked: true, musicOn, muted, hidden: document.hidden }) || !current) return;
  const now = ctx.currentTime;
  const pruned = deckPrune(deck, now);
  deck = pruned.deck;
  for (const p of pruned.cut) endRun(p.id);
  for (const r of runs.values()) {
    for (const { at, events } of scheduleWindow(r.bed, r.st, now)) for (const e of events) play(r.filter, e, at);
  }
}

/** Point the deck at the bed we want now (city in play, scout otherwise). Same bed = no-op. */
function switchTo(key: BedKey) {
  if (!ctx || !musicFilter) return;
  const now = ctx.currentTime;
  const r = deckSwitch(deck, key, now, nextPlayerId);
  if (!r.started) return;
  nextPlayerId += 1;
  for (const p of r.cut) endRun(p.id);
  for (const p of r.deck) {
    if (p.fadingSince === now) {
      const run = runs.get(p.id);
      if (run) {
        run.gain.gain.cancelScheduledValues(now);
        run.gain.gain.setValueAtTime(Math.max(0.0001, run.gain.gain.value), now);
        run.gain.gain.exponentialRampToValueAtTime(0.0001, now + FADE_S);
      }
    }
  }
  deck = r.deck;
  startRun(r.started);
}

export function startBed(id: ScoutId) {
  current = id;
  if (!ctx || !musicFilter || !musicOn || muted) return;
  musicFilter.frequency.setValueAtTime(20000, ctx.currentTime);
  switchTo(wantedBed(id, currentCity));
  if (!clock) clock = window.setInterval(tick, 40);
}

/** 0.1.62: the city bed for play (null = back to the scout bed). Crossfades; repeated calls are no-ops. */
export function setCityBed(city: CityId | null) {
  if (currentCity === city) return;
  currentCity = city;
  if (current) startBed(current);
}

export function stopBed() {
  current = null;
  haltBed();
}

export function syncBed(id: ScoutId) {
  startBed(id);
}

/** 0.1.62: what the music deck holds right now (QA and tests). */
export function musicDeck() {
  return { deck: deck.map((p) => ({ key: p.key, fading: p.fadingSince !== null })), runs: runs.size, ticking: clock !== 0, state: ctx?.state ?? "none" };
}
