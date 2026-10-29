// Renders the 0.1.62 city music beds to WAV for listening: node --experimental-strip-types scripts/music-render.mts <outDir> [seconds]
// Mirrors audio.ts: the same stepEvents/scheduleWindow, exp envelopes, per-bed lowpass, music bus 0.7, master 0.22.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { CITY_BEDS, SCOUT_BEDS, scheduleWindow, type Bed, type MusicEvent, type Wave } from "../src/game/music.ts";

const SR = 44100;
const GAIN = 0.7 * 0.22;

let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 2 ** 32) * 2 - 1;
const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);
function env(t: number, atk: number, dur: number, vol: number) {
  if (t < 0 || t > dur) return 0;
  const lo = 0.0001;
  if (t < atk) return lo * (vol / lo) ** (t / atk);
  return vol * (lo / vol) ** ((t - atk) / (dur - atk));
}
function osc(w: Wave, ph: number) {
  const x = ph - Math.floor(ph);
  if (w === "sine") return Math.sin(2 * Math.PI * x);
  if (w === "square") return x < 0.5 ? 1 : -1;
  if (w === "sawtooth") return 2 * x - 1;
  return 1 - 4 * Math.abs(x - 0.5);
}
type BQ = { b0: number; b1: number; b2: number; a1: number; a2: number; x1: number; x2: number; y1: number; y2: number };
function biquad(type: "lowpass" | "highpass" | "bandpass", f: number, q: number): BQ {
  const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR, a = Math.sin(w) / (2 * q), c = Math.cos(w);
  let b0, b1, b2;
  if (type === "lowpass") [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
  else if (type === "highpass") [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
  else [b0, b1, b2] = [a, 0, -a];
  const a0 = 1 + a;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * c) / a0, a2: (1 - a) / a0, x1: 0, x2: 0, y1: 0, y2: 0 };
}
function run(f: BQ, x: number) {
  const y = f.b0 * x + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2;
  f.x2 = f.x1; f.x1 = x; f.y2 = f.y1; f.y1 = y;
  return y;
}
function addTone(buf: Float64Array, at: number, dur: number, wave: Wave, freq: number, atk: number, vol: number, lp?: number, to?: number, detune?: Wave) {
  const s0 = Math.floor(at * SR), s1 = Math.min(buf.length, Math.ceil((at + dur) * SR));
  const f = lp ? biquad("lowpass", lp, 0.7071) : null;
  let ph = 0, ph2 = 0;
  for (let i = s0; i < s1; i++) {
    const t = i / SR - at;
    const fr = to ? freq * (to / freq) ** (t / dur) : freq;
    ph += fr / SR; ph2 += (fr * 1.003) / SR;
    let x = osc(wave, ph) + (detune ? osc(detune, ph2) : 0);
    if (f) x = run(f, x);
    buf[i]! += x * env(t, atk, dur, vol);
  }
}
function addNoise(buf: Float64Array, at: number, dur: number, hp: number, vol: number) {
  const s0 = Math.floor(at * SR), s1 = Math.min(buf.length, Math.ceil((at + dur) * SR));
  const f = biquad("highpass", hp, 0.7071);
  for (let i = s0; i < s1; i++) buf[i]! += run(f, rnd()) * env(i / SR - at, 0.004, dur, vol);
}
function addEvent(buf: Float64Array, e: MusicEvent, at: number) {
  if (e.kind === "kick") addTone(buf, at, 0.18, "sine", 92, 0.004, e.vol, undefined, 38);
  else if (e.kind === "noise") addNoise(buf, at, e.dur, e.hp, e.vol);
  else if (e.kind === "bass") addTone(buf, at, e.dur, "triangle", midi(e.note), 0.01, e.vol);
  else if (e.kind === "lead") addTone(buf, at, e.dur, e.wave, midi(e.note), 0.015, e.vol, 1800);
  else e.notes.forEach((n, i) => {
    const w: Wave = e.voice === "organ" ? "square" : e.voice === "pad" ? "triangle" : "sine";
    addTone(buf, at, e.dur, w, midi(n), e.voice === "pad" ? Math.min(0.6, e.dur / 3) : 0.02, e.vol / e.notes.length, e.voice === "organ" ? 700 + i * 120 : 1200 + i * 180, undefined, e.voice === "rhodes" ? "triangle" : undefined);
  });
}
export function render(bed: Bed, secs: number) {
  const n = Math.ceil(secs * SR);
  const dry = new Float64Array(n + SR * 3);
  const st = { next: 0.05, step: 0 };
  for (let now = 0; now < secs; now += 0.04) for (const { at, events } of scheduleWindow(bed, st, now)) for (const e of events) if (at < secs) addEvent(dry, e, at);
  const vin = biquad("bandpass", 900, 0.6);
  for (let i = 0; i < n; i++) dry[i]! += run(vin, rnd()) * bed.vinyl;
  const lp = biquad("lowpass", bed.cutoff, 0.7);
  const outb = new Float64Array(n);
  for (let i = 0; i < n; i++) outb[i] = run(lp, dry[i]!) * GAIN;
  return outb;
}
function wav(file: string, b: Float64Array) {
  const pcm = Buffer.alloc(44 + b.length * 2);
  for (let i = 0; i < b.length; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, b[i]!)) * 32767), 44 + i * 2);
  pcm.write("RIFF", 0); pcm.writeUInt32LE(36 + b.length * 2, 4); pcm.write("WAVE", 8); pcm.write("fmt ", 12);
  pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24);
  pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write("data", 36); pcm.writeUInt32LE(b.length * 2, 40);
  writeFileSync(file, pcm);
}
/** Noise floor: the RMS of the quietest 5% of 50 ms windows (the gaps between notes), in dBFS. */
export function noiseFloor(b: Float64Array) {
  const win = 2205, vals: number[] = [];
  for (let i = 0; i + win <= b.length; i += win) {
    let sq = 0;
    for (let j = i; j < i + win; j++) sq += b[j]! ** 2;
    vals.push(Math.sqrt(sq / win));
  }
  vals.sort((x, y) => x - y);
  return 20 * Math.log10(Math.max(vals[Math.floor(vals.length / 20)]!, 1e-9));
}
const db = (x: number) => (20 * Math.log10(Math.max(x, 1e-9))).toFixed(1);
function stats(b: Float64Array | Int16Array, scale = 1) {
  let peak = 0, sq = 0, clip = 0;
  for (let i = 0; i < b.length; i++) { const v = Math.abs(b[i]! / scale); peak = Math.max(peak, v); sq += v * v; if (v >= 0.999) clip++; }
  return { peak, rms: Math.sqrt(sq / b.length), clip };
}
if (process.argv[1]?.endsWith("music-render.mts")) {
  const out = process.argv[2] ?? "/workspace/music-preview";
  const SECS = Number(process.argv[3] ?? 30);
  mkdirSync(out, { recursive: true });
  const bad: string[] = [];
  const rows: string[] = [];
  const beds: [string, Bed][] = [...Object.entries(CITY_BEDS), ["scout-raccoon (fallback)", SCOUT_BEDS.raccoon]];
  for (const [name, bed] of beds) {
    const b = render(bed, SECS);
    const s = stats(b);
    if (!name.startsWith("scout")) wav(`${out}/${name}.wav`, b);
    const nf = noiseFloor(b);
    if (nf > -70 && !name.startsWith("scout")) bad.push(`${name} floor ${nf.toFixed(1)}`);
    rows.push(`${name.padEnd(26)} peak ${db(s.peak)} dBFS  rms ${db(s.rms)} dBFS  floor ${nf.toFixed(1)} dBFS  clipped ${s.clip}${name.startsWith("scout") ? "" : `  ${out}/${name}.wav`}`);
  }
  // Sound effects for comparison (their own peaks/RMS over the effect's length).
  try {
    for (const f of readdirSync("/workspace/sfx-preview").filter((x) => x.endsWith(".wav"))) {
      const raw = readFileSync(`/workspace/sfx-preview/${f}`);
      const s = stats(new Int16Array(raw.buffer, raw.byteOffset + 44, (raw.length - 44) >> 1), 32767);
      rows.push(`sfx ${f.padEnd(22)} peak ${db(s.peak)} dBFS  rms ${db(s.rms)} dBFS`);
    }
  } catch { /* no sfx previews */ }
  console.log(rows.join("\n"));
  if (bad.length) {
    console.error("noise floor above -70 dBFS:", bad.join(", "));
    process.exitCode = 1;
  }
}
