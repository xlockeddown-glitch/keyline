import { r as createServerFn } from "./ssr.mjs";
import { Mt as object, jt as number } from "../_libs/@better-auth/core--chunk.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/streetApi-DWgsgiQ6.js
var HIGHWAY = "primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street|pedestrian|footway|path|steps|cycleway|track|bridleway";
var DRIVE = /* @__PURE__ */ new Set([
	"primary",
	"primary_link",
	"secondary",
	"secondary_link",
	"tertiary",
	"tertiary_link",
	"unclassified",
	"residential",
	"living_street",
	"service"
]);
var ARTERIAL = /* @__PURE__ */ new Set([
	"primary",
	"primary_link",
	"secondary",
	"secondary_link"
]);
var OVERPASS = [
	"https://overpass.openstreetmap.fr/api/interpreter",
	"https://overpass-api.de/api/interpreter",
	"https://overpass.kumi.systems/api/interpreter"
];
var cache = /* @__PURE__ */ new Map();
var Input = object({
	lat: number(),
	lng: number(),
	radius: number().min(200).max(3600)
});
async function postOverpass(url, query) {
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
		body: `data=${encodeURIComponent(query)}`,
		signal: AbortSignal.timeout(18e3)
	});
	if (!res.ok) throw new Error(`overpass ${res.status}`);
	return await res.json();
}
function packLine(geom) {
	const out = [];
	let lastLat = Infinity;
	let lastLon = Infinity;
	for (const p of geom) {
		if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue;
		const dlat = (p.lat - lastLat) * 111320;
		const dlng = (p.lon - lastLon) * 111320 * Math.cos(p.lat * Math.PI / 180);
		if (out.length && Math.hypot(dlat, dlng) < 14) continue;
		out.push(Math.round(p.lat * 1e5) / 1e5, Math.round(p.lon * 1e5) / 1e5);
		lastLat = p.lat;
		lastLon = p.lon;
	}
	if (geom.length >= 2) {
		const last = geom[geom.length - 1];
		const endLat = Math.round(last.lat * 1e5) / 1e5;
		const endLon = Math.round(last.lon * 1e5) / 1e5;
		if (out[out.length - 2] !== endLat || out[out.length - 1] !== endLon) out.push(endLat, endLon);
	}
	return out;
}
var getOsmWays_createServerFn_handler = createServerRpc({
	id: "f7cd8d1fbf6528707df08011a3f0f64c6b758a88772b0f00918984892d1fb4ff",
	name: "getOsmWays",
	filename: "src/game/streetApi.ts"
}, (opts) => getOsmWays.__executeServer(opts));
var getOsmWays = createServerFn({ method: "POST" }).validator((u) => Input.parse(u)).handler(getOsmWays_createServerFn_handler, async ({ data }) => {
	const { lat, lng, radius } = data;
	const key = `${lat.toFixed(3)},${lng.toFixed(3)},${Math.round(radius / 50) * 50}`;
	const hit = cache.get(key);
	if (hit) return hit;
	const q = `[out:json][timeout:25];way["highway"~"^(${HIGHWAY})$"]["area"!="yes"]["access"!="private"]["access"!="no"](around:${Math.round(radius)},${lat.toFixed(5)},${lng.toFixed(5)});out tags geom;`;
	let last = null;
	for (const url of OVERPASS) try {
		const json = await postOverpass(url, q);
		const lines = [];
		const drive = [];
		for (const el of json.elements ?? []) {
			const packed = packLine(el.geometry ?? []);
			if (packed.length < 4) continue;
			lines.push(packed);
			const hw = el.tags?.highway ?? "";
			if (DRIVE.has(hw)) drive.push({
				line: packed,
				arterial: ARTERIAL.has(hw)
			});
		}
		const payload = {
			lines,
			drive
		};
		cache.set(key, payload);
		if (cache.size > 40) {
			const first = cache.keys().next().value;
			if (first) cache.delete(first);
		}
		return payload;
	} catch (err) {
		last = err;
	}
	throw last ?? /* @__PURE__ */ new Error("overpass failed");
});
//#endregion
export { getOsmWays_createServerFn_handler };
