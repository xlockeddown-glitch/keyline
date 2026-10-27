// Renders the 0.1.54 sound pack to WAV for listening: node scripts/sfx-render.mts <outDir>
// Mirrors audio.ts playPack: exp attack 10 ms (puffs 6 ms), exp decay, master gain 0.22 (game default).
import { mkdirSync, writeFileSync } from "node:fs";
import { PACK, recipeLength, type Wave } from "../src/game/sfxPack.ts";

const SR = 44100;
const MASTER = Number(process.env.SFX_MASTER ?? 0.22);
const out = process.argv[2] ?? "/workspace/sfx-preview";
mkdirSync(out, { recursive: true });

function env(t: number, atk: number, dur: number, vol: number) {
  if (t < 0 || t > dur) return 0;
  const lo = 0.0001;
  if (t < atk) return lo * (vol / lo) ** (t / atk);
  return vol * (lo / vol) ** ((t - atk) / (dur - atk));
}
function wave(w: Wave, ph: number) {
  const x = ph - Math.floor(ph);
  if (w === "sine") return Math.sin(2 * Math.PI * x);
  if (w === "square") return x < 0.5 ? 1 : -1;
  if (w === "sawtooth") return 2 * x - 1;
  return 1 - 4 * Math.abs(x - 0.5);
}
const rows: string[] = [];
for (const [name, r] of Object.entries(PACK)) {
  const len = recipeLength(r);
  const n = Math.ceil(len * SR);
  const buf = new Float64Array(n);
  for (const x of r.tones) {
    let ph = 0;
    const s0 = Math.floor(x.at * SR), s1 = Math.min(n, Math.ceil((x.at + x.dur) * SR));
    for (let i = s0; i < s1; i++) {
      const t = i / SR - x.at;
      const f = x.to ? x.freq * (x.to / x.freq) ** (t / x.dur) : x.freq;
      ph += f / SR;
      buf[i]! += wave(x.wave, ph) * env(t, 0.01, x.dur, x.vol);
    }
  }
  for (const p of r.puffs ?? []) {
    let y = 0;
    const a = 1 - Math.exp((-2 * Math.PI * p.lp) / SR);
    const s0 = Math.floor(p.at * SR), s1 = Math.min(n, Math.ceil((p.at + p.dur) * SR));
    for (let i = s0; i < s1; i++) {
      y += a * (Math.random() * 2 - 1 - y);
      buf[i]! += y * env(i / SR - p.at, 0.006, p.dur, p.vol);
    }
  }
  let peak = 0;
  const pcm = Buffer.alloc(44 + n * 2);
  for (let i = 0; i < n; i++) {
    const v = buf[i]! * MASTER;
    peak = Math.max(peak, Math.abs(v));
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2);
  }
  pcm.write("RIFF", 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write("WAVE", 8); pcm.write("fmt ", 12);
  pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(SR, 24);
  pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write("data", 36); pcm.writeUInt32LE(n * 2, 40);
  const file = `${out}/${name}.wav`;
  writeFileSync(file, pcm);
  const pre = buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  rows.push(`${name}\t${len.toFixed(2)} s\tpeak ${(20 * Math.log10(peak)).toFixed(1)} dBFS (pre-master ${(20 * Math.log10(pre)).toFixed(1)} dBFS)\t${file}`);
}
console.log(rows.join("\n"));
