// 0.1.14: are lanterns, vaults and street matches spread across the play area, or bunched downtown?
// Per city, on two walk graphs: the baked foot routes (what the map has when the live street fetch fails)
// and a synthetic street grid (dense core, sparser outskirts) standing in for live OSM.
// Play area = 3 km around the spawn (the graph the map loads), core = 1 km. Matches <150 = share of new drops landing within 150 m of something already lit. Coverage = share of 600 m cells
// in the play area holding at least one item.
// node --experimental-strip-types scripts/qa-spread.ts [--json] [--no-assert]
import { readFileSync, existsSync } from "node:fs";
import { bindWalkGraph, createGraph, ingestLine, ingestOsmWays, scatterStreetLamps, spreadOnGraph, streetDrop, type Pt } from "../src/game/streets.ts";
import { dest, distM } from "../src/game/geo.ts";
import { CITIES, CITY_LIST } from "../src/game/data.ts";
import { SEED, STREET_DAY_CAP } from "../src/game/streetSpots.ts";

export const PLAY_M = 3000;
export const CORE_M = 1000;
const CELL = 600;

let seed = 7;
Math.random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

type Stats = { n: number; core: number; nnMed: number; nnClose: number; cover: number };

function stats(pts: Pt[], spawn: Pt, cellsOn: Set<string>): Stats {
  const inPlay = pts.filter((p) => distM(p.lat, p.lng, spawn.lat, spawn.lng) <= PLAY_M);
  const core = inPlay.filter((p) => distM(p.lat, p.lng, spawn.lat, spawn.lng) <= CORE_M).length;
  const nn = inPlay.map((p, i) => Math.min(...inPlay.filter((_, j) => j !== i).map((q) => distM(p.lat, p.lng, q.lat, q.lng))));
  nn.sort((a, b) => a - b);
  const hit = new Set<string>();
  for (const p of inPlay) {
    const k = cellKey(p, spawn);
    if (cellsOn.has(k)) hit.add(k);
  }
  return {
    n: inPlay.length,
    core: inPlay.length ? core / inPlay.length : 0,
    nnMed: nn.length ? nn[nn.length >> 1]! : 0,
    nnClose: nn.length ? nn.filter((d) => d < 150).length / nn.length : 0,
    cover: cellsOn.size ? hit.size / cellsOn.size : 0,
  };
}

function cellKey(p: Pt, o: Pt) {
  const n = (p.lat - o.lat) * 111_320;
  const e = (p.lng - o.lng) * 111_320 * Math.cos((o.lat * Math.PI) / 180);
  return `${Math.floor(n / CELL)}:${Math.floor(e / CELL)}`;
}

/** Cells of the play area that have street in them (so coverage only counts reachable ground). */
function streetCells(g: ReturnType<typeof createGraph>, spawn: Pt) {
  const on = new Set<string>();
  for (const s of g.segs) {
    const a = g.nodes[s.a]!;
    const b = g.nodes[s.b]!;
    for (const t of [0, 0.5, 1]) {
      const p = { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
      if (distM(p.lat, p.lng, spawn.lat, spawn.lng) <= PLAY_M) on.add(cellKey(p, spawn));
    }
  }
  return on;
}

function gridGraph(spawn: Pt) {
  const g = createGraph(spawn.lat, spawn.lng);
  const lines: Pt[][] = [];
  const add = (step: number, span: number) => {
    for (let x = -span; x <= span; x += step) {
      lines.push([dest(spawn.lat, spawn.lng, -span, x), dest(spawn.lat, spawn.lng, span, x)]);
      lines.push([dest(spawn.lat, spawn.lng, x, -span), dest(spawn.lat, spawn.lng, x, span)]);
    }
  };
  add(160, PLAY_M); // outskirts: 160 m blocks
  add(80, 1200); // downtown: 80 m blocks laid over them, so the core has ~4x the street per km²
  for (const l of lines) {
    const pts: Pt[] = [];
    const [a, b] = l as [Pt, Pt];
    for (let i = 0; i <= 40; i++) pts.push({ lat: a.lat + ((b.lat - a.lat) * i) / 40, lng: a.lng + ((b.lng - a.lng) * i) / 40 });
    ingestLine(g, pts);
  }
  return g;
}

function bakedGraph(id: string, spawn: Pt) {
  const g = createGraph(spawn.lat, spawn.lng);
  const f = `public/streets/${id}.json`;
  if (!existsSync(f)) return null;
  const packed = JSON.parse(readFileSync(f, "utf8")) as { lines: number[][] };
  ingestOsmWays(g, packed.lines.map((line) => ({ geometry: Array.from({ length: line.length / 2 }, (_, i) => ({ lat: line[2 * i]!, lon: line[2 * i + 1]! })) })));
  return g;
}

export type CityRow = { city: string; graph: string; vaults: Stats; lamps: Stats; matches: Stats; all: Stats };

export function measure(): CityRow[] {
  const rows: CityRow[] = [];
  for (const c of CITY_LIST) {
    const city = CITIES[c.id];
    const spawn = city.spawn;
    const start = city.start ?? spawn;
    for (const [name, g] of [["grid", gridGraph(spawn)], ["baked", bakedGraph(c.id, spawn)]] as const) {
      if (!g || !g.segs.length) continue;
      seed = 7;
      bindWalkGraph(g, start);
      const cells = streetCells(g, spawn);
      const vaults = city.pois;
      const lamps = scatterStreetLamps(g, [spawn, ...city.pois], c.id);
      // Opening deal, respread once the ward fills (fillWardLamps), then a day of spawns on a 16-match map.
      const opening = SEED.map((_, i) => streetDrop(spawn, 160 + i * 90, 2100));
      const spread = spreadOnGraph(g, [spawn, ...vaults, ...lamps], opening.length);
      const day: Pt[] = [...spread];
      let map = [...spread].slice(0, 16);
      let crowded = 0;
      const drops = STREET_DAY_CAP - SEED.length;
      for (let i = 0; i < drops; i++) {
        map = map.slice(1); // the oldest gets picked up
        const lit = [...vaults, ...lamps, ...map];
        const p = streetDrop(spawn, 220, 2200, lit);
        if (lit.some((q) => distM(p.lat, p.lng, q.lat, q.lng) < 150)) crowded++;
        map.push(p);
        day.push(p);
      }
      const all = [...vaults, ...lamps, ...map];
      rows.push({
        city: c.id,
        graph: name,
        vaults: stats(vaults, spawn, cells),
        lamps: stats(lamps, spawn, cells),
        matches: { ...stats(day, spawn, cells), nnClose: crowded / drops },
        all: stats(all, spawn, cells),
      });
    }
  }
  return rows;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
function fmt(s: Stats) {
  return `n${s.n} core${pct(s.core)} nn${Math.round(s.nnMed)}m <150:${pct(s.nnClose)} cov${pct(s.cover)}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = measure();
  if (process.argv.includes("--json")) console.log(JSON.stringify(rows));
  else for (const r of rows) console.log(`${r.city.padEnd(9)} ${r.graph.padEnd(5)} | vaults ${fmt(r.vaults)} | lamps ${fmt(r.lamps)} | matches ${fmt(r.matches)} | map ${fmt(r.all)}`);
  const avg = (g: string, k: keyof CityRow, f: keyof Stats) => {
    const xs = rows.filter((r) => r.graph === g).map((r) => (r[k] as Stats)[f]);
    return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  };
  for (const g of ["grid", "baked"]) {
    console.log(`AVG ${g}: vaults core ${pct(avg(g, "vaults", "core"))} nn ${Math.round(avg(g, "vaults", "nnMed"))}m cov ${pct(avg(g, "vaults", "cover"))} | lamps core ${pct(avg(g, "lamps", "core"))} nn ${Math.round(avg(g, "lamps", "nnMed"))}m <150 ${pct(avg(g, "lamps", "nnClose"))} cov ${pct(avg(g, "lamps", "cover"))} | matches core ${pct(avg(g, "matches", "core"))} nn ${Math.round(avg(g, "matches", "nnMed"))}m <150 ${pct(avg(g, "matches", "nnClose"))} cov ${pct(avg(g, "matches", "cover"))} | whole map core ${pct(avg(g, "all", "core"))} cov ${pct(avg(g, "all", "cover"))}`);
  }
  if (!process.argv.includes("--no-assert")) {
    let bad = 0;
    for (const r of rows.filter((x) => x.graph === "grid")) {
      const why: string[] = [];
      if (r.matches.nnClose > 0.05) why.push(`matches landing <150 m of a lit spot ${pct(r.matches.nnClose)}`);
      if (r.lamps.nnClose > 0) why.push(`lamps <150 m apart ${pct(r.lamps.nnClose)}`);
      if (r.matches.core > 0.3) why.push(`matches in the core ${pct(r.matches.core)}`);
      if (r.all.cover < 0.5) why.push(`map coverage ${pct(r.all.cover)}`);
      if (r.vaults.core > 0.85) why.push(`vaults in the core ${pct(r.vaults.core)}`);
      if (r.vaults.n - Math.round(r.vaults.core * r.vaults.n) < 3) why.push("fewer than 3 vaults outside the core");
      if (why.length) {
        bad++;
        console.log(`FAIL ${r.city}: ${why.join(", ")}`);
      }
    }
    if (bad) process.exit(1);
    console.log("qa:spread OK");
  }
}
