import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const HIGHWAY =
  "primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|pedestrian|footway|path|steps|cycleway|track|bridleway";
const DRIVE = new Set([
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "unclassified",
  "residential",
  "living_street",
  "service",
]);
/** Sidewalks and park paths. Long ones in Manhattan are drawn through the block. */
const WALK_SKIP = new Set(["footway", "path", "steps", "cycleway", "track", "bridleway", "corridor", "service"]);
const ARTERIAL = new Set(["primary", "primary_link", "secondary", "secondary_link"]);

const OVERPASS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const cache = new Map<string, { lines: number[][]; drive: { line: number[]; arterial: boolean }[] }>();

const Input = z.object({
  lat: z.number(),
  lng: z.number(),
  radius: z.number().min(200).max(3600),
});

async function postOverpass(url: string, query: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(18000),
  });
  if (!res.ok) throw new Error(`overpass ${res.status}`);
  return (await res.json()) as {
    elements?: { tags?: { highway?: string }; geometry?: { lat: number; lon: number }[] }[];
  };
}

function packLine(geom: { lat: number; lon: number }[]) {
  const out: number[] = [];
  let lastLat = Infinity;
  let lastLon = Infinity;
  for (const p of geom) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
    const dlat = (p.lat - lastLat) * 111320;
    const dlng = (p.lon - lastLon) * 111320 * Math.cos((p.lat * Math.PI) / 180);
    if (out.length && Math.hypot(dlat, dlng) < 14) continue;
    out.push(Math.round(p.lat * 1e5) / 1e5, Math.round(p.lon * 1e5) / 1e5);
    lastLat = p.lat;
    lastLon = p.lon;
  }
  if (geom.length >= 2) {
    const last = geom[geom.length - 1]!;
    const endLat = Math.round(last.lat * 1e5) / 1e5;
    const endLon = Math.round(last.lon * 1e5) / 1e5;
    if (out[out.length - 2] !== endLat || out[out.length - 1] !== endLon) {
      out.push(endLat, endLon);
    }
  }
  return out;
}

export const getOsmWays = createServerFn({ method: "POST" })
  .validator((u) => Input.parse(u))
  .handler(async ({ data }) => {
    const { lat, lng, radius } = data;
    const key = `${lat.toFixed(3)},${lng.toFixed(3)},${Math.round(radius / 50) * 50}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const q = `[out:json][timeout:25];way["highway"~"^(${HIGHWAY})$"]["area"!="yes"]["access"!="private"]["access"!="no"](around:${Math.round(radius)},${lat.toFixed(5)},${lng.toFixed(5)});out tags geom;`;
    let last: Error | null = null;
    for (const url of OVERPASS) {
      try {
        const json = await postOverpass(url, q);
        const lines: number[][] = [];
        const drive: { line: number[]; arterial: boolean }[] = [];
        for (const el of json.elements ?? []) {
          const hw = el.tags?.highway ?? "";
          const packed = packLine(el.geometry ?? []);
          if (packed.length < 4) continue;
          if (!WALK_SKIP.has(hw)) lines.push(packed);
          if (DRIVE.has(hw)) drive.push({ line: packed, arterial: ARTERIAL.has(hw) });
        }
        const payload = { lines, drive };
        cache.set(key, payload);
        if (cache.size > 40) {
          const first = cache.keys().next().value;
          if (first) cache.delete(first);
        }
        return payload;
      } catch (err) {
        last = err as Error;
      }
    }
    throw last ?? new Error("overpass failed");
  });
