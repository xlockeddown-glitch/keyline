// 0.1.180: the Philly overlay sits where Leaflet puts it. Real Leaflet maths (L.CRS.EPSG3857, L.latLngBounds, the
// rounding in Map.latLngToLayerPoint and ImageOverlay._reset), no DOM and no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { overlayBounds } from "./cityOverlay.ts";
import { CITIES } from "./data.ts";
import type { CityEntry } from "./streets.ts";

// Leaflet reads a few browser globals as it loads; the projection code needs none of them.
const g = globalThis as Record<string, unknown>;
const el = () => ({ style: {}, setAttribute() {}, getContext: () => null, appendChild() {}, addEventListener() {} });
g.window ??= { devicePixelRatio: 1, screen: {}, addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false }) };
g.document ??= { documentElement: el(), createElement: el, createElementNS: el, addEventListener() {} };
const L = (await import("leaflet")).default;

const root = new URL("../../", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("public/streets/v2/manifest.json", root), "utf8")) as { cities: Record<string, CityEntry> };
type Anchors = { image: { w: number; h: number }; anchors: { name: string; lat: number; lng: number; px: number; py: number }[] };
/** 0.1.189: Austin joins Philly (graph bundled, overlay on the pack host); each city has its own box, anchors and anchor name. */
const CASES = [
  { id: "philly", file: "philly-overlay-anchors.json", main: "Philadelphia City Hall", box: { nw: [39.97751, -75.198], ne: [39.97751, -75.13056], se: [39.92448, -75.13056], sw: [39.92448, -75.198] }, wh: [1571, 1612] },
  { id: "austin", file: "austin-overlay-anchors.json", main: "Texas State Capitol", box: { nw: [30.32908, -97.78296], ne: [30.32908, -97.71664], se: [30.21082, -97.71664], sw: [30.21082, -97.78296] }, wh: [1545, 3191] },
] as const;

/** The default view: where the map opens (GameMap: setView(city.start ?? city.spawn, 16)), on a phone. */
const ZOOM = 16;
const VIEW = L.point(390, 844);

for (const c of CASES) {
  const anchors = JSON.parse(readFileSync(new URL(`src/game/fixtures/packs/${c.file}`, root), "utf8")) as Anchors;
  const overlay = manifest.cities[c.id]!.overlay!;
  const centre = CITIES[c.id].start ?? CITIES[c.id].spawn;

  test(`${c.id} overlay alignment: anchors land within 4 CSS px at the default zoom in a 390x844 viewport`, () => {
    const crs = L.CRS.EPSG3857;
    // Map._getNewPixelOrigin and Map.latLngToContainerPoint, with the map pane at rest.
    const origin = crs.latLngToPoint(L.latLng(centre.lat, centre.lng), ZOOM).subtract(VIEW.divideBy(2)).round();
    const toContainer = (lat: number, lng: number) => crs.latLngToPoint(L.latLng(lat, lng), ZOOM).round().subtract(origin);
    // ImageOverlay._reset: the image box is the rounded NW and SE corners; the browser stretches the image linearly over it.
    const b = L.latLngBounds(overlayBounds(overlay));
    const nw = toContainer(b.getNorth(), b.getWest());
    const se = toContainer(b.getSouth(), b.getEast());
    const size = se.subtract(nw);
    assert.ok(size.x > 0 && size.y > 0);
    // The image is Web Mercator over its bounds, so its pixels are square on screen.
    assert.ok(Math.abs(size.x / size.y - overlay.w / overlay.h) < 0.002, `aspect ${size.x}x${size.y} vs ${overlay.w}x${overlay.h}`);

    assert.deepEqual(anchors.image, { w: overlay.w, h: overlay.h }, "anchors were measured on this image size");
    let within = 0;
    const report: string[] = [];
    for (const a of anchors.anchors) {
      const painted = L.point(nw.x + (a.px / overlay.w) * size.x, nw.y + (a.py / overlay.h) * size.y);
      const real = toContainer(a.lat, a.lng);
      const dx = painted.x - real.x;
      const dy = painted.y - real.y;
      report.push(`${a.name}: dx ${dx.toFixed(2)}, dy ${dy.toFixed(2)}`);
      const ok = Math.abs(dx) <= 4 && Math.abs(dy) <= 4;
      if (ok) within++;
      if (a.name === c.main) assert.ok(ok, `${c.main} is off: ${report.at(-1)}`);
    }
    assert.ok(anchors.anchors.some((a) => a.name === c.main), `${c.main} is an anchor`);
    assert.ok(within >= 3, `${c.main} and at least two more within 4 px: ${report.join("; ")}`);
    console.log(`# ${c.id} overlay anchors @ z${ZOOM}: ${report.join("; ")}`);
  });

  test(`${c.id} overlay bounds are the manifest pin, corner for corner`, () => {
    const pin = c.box;
    assert.deepEqual(overlay.bounds, pin);
    assert.deepEqual(overlayBounds(overlay), [pin.sw, pin.ne], "L.imageOverlay gets [[sw],[ne]]");
    const b = L.latLngBounds(overlayBounds(overlay));
    assert.deepEqual([b.getNorth(), b.getWest()], pin.nw);
    assert.deepEqual([b.getNorth(), b.getEast()], pin.ne);
    assert.deepEqual([b.getSouth(), b.getEast()], pin.se);
    assert.deepEqual([b.getSouth(), b.getWest()], pin.sw);
    assert.deepEqual([overlay.w, overlay.h], c.wh);
    // The start of the first walk is inside the painted box.
    assert.ok(b.contains(L.latLng(centre.lat, centre.lng)));
  });
}
