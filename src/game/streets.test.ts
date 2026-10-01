import assert from "node:assert/strict";
import { test } from "node:test";
import { dest, distM } from "./geo.ts";
import {
  canCutBuildings,
  clearCorner,
  createGraph,
  finishPath,
  ingestLine,
  ingestOsmWays,
  nearest,
  pathLength,
  routeHugsGraph,
  routeDrive,
  routeOnGraph,
  routeWalk,
  stuckNudge,
  type Pt,
} from "./streets.ts";

function blockGraph() {
  const o = { lat: 30.2672, lng: -97.7431 };
  const sw = o;
  const se = dest(o.lat, o.lng, 0, 80);
  const nw = dest(o.lat, o.lng, 80, 0);
  const ne = dest(o.lat, o.lng, 80, 80);
  const g = createGraph(o.lat, o.lng);
  ingestLine(g, [sw, se]);
  ingestLine(g, [se, ne]);
  ingestLine(g, [ne, nw]);
  ingestLine(g, [nw, sw]);
  const west: Pt = dest(o.lat, o.lng, 40, 0);
  const east: Pt = dest(o.lat, o.lng, 40, 80);
  const vault: Pt = dest(o.lat, o.lng, 40, 40);
  return { g, west, east, vault, o };
}

test("route around a block never cuts the interior", () => {
  const { g, west, east, vault } = blockGraph();
  const path = routeOnGraph(g, west, east);
  assert.ok(path && path.length >= 2);
  const len = pathLength(path!);
  assert.ok(len > 100, `around the block should be ~160m, got ${len}`);
  assert.ok(len < 220);
  for (const p of path!) {
    const snap = nearest(g, p.lat, p.lng, 20);
    assert.ok(snap && snap.dist < 8, "path stays on the curb");
    assert.ok(distM(p.lat, p.lng, vault.lat, vault.lng) > 20, "path does not enter the block");
  }
});

test("a stop on a corner rests in the street", () => {
  const { g, o } = blockGraph();
  const rest = clearCorner(g, o.lat, o.lng);
  const along = distM(rest.lat, rest.lng, o.lat, o.lng);
  assert.ok(along > 5 && along < 16, `expected a short step off the corner, got ${along}`);
  const snap = nearest(g, rest.lat, rest.lng, 20);
  assert.ok(snap && snap.dist < 2);
});

test("a footway across the block is a walk edge", () => {
  const { g, o } = blockGraph();
  const sw = o;
  const ne = dest(o.lat, o.lng, 80, 80);
  ingestOsmWays(g, [{ geometry: [{ lat: sw.lat, lon: sw.lng }, { lat: ne.lat, lon: ne.lng }], tags: { highway: "footway" } }]);
  const path = routeOnGraph(g, sw, ne)!;
  assert.ok(path);
  assert.ok(pathLength(path) < 140, `the path should cross the block, got ${pathLength(path)}`);
  assert.equal(routeHugsGraph(g, path), true);
});

test("street-only finishPath will not hop to a vault in the block", () => {
  const { g, west, east, vault } = blockGraph();
  const path = routeOnGraph(g, west, east)!;
  const street = finishPath(path, west, vault);
  assert.ok(street);
  const last = street![street!.length - 1]!;
  assert.ok(distM(last.lat, last.lng, vault.lat, vault.lng) > 20);
  const cut = finishPath(path, west, vault, { cutBuildings: true });
  assert.ok(cut);
  const hop = cut![cut!.length - 1]!;
  assert.ok(distM(hop.lat, hop.lng, vault.lat, vault.lng) < 2);
});

test("a vault door is a short last step, not a cut through the block", () => {
  const { g, west } = blockGraph();
  const path = routeOnGraph(g, west, dest(west.lat, west.lng, 0, 10))!;
  const door = finishPath(path, west, dest(west.lat, west.lng, 0, 28), { door: true });
  const last = door![door!.length - 1]!;
  assert.ok(distM(last.lat, last.lng, west.lat, west.lng) < 40);
  const far = dest(west.lat, west.lng, 0, 150);
  const tooFar = finishPath(path, west, far, { door: true });
  const end = tooFar![tooFar!.length - 1]!;
  assert.ok(distM(end.lat, end.lng, far.lat, far.lng) > 20);
});

test("default scouts cannot cut buildings; Super Legendary can; 18m hop is gated", () => {
  assert.equal(canCutBuildings(), false);
  assert.equal(canCutBuildings("raccoon"), false);
  assert.equal(canCutBuildings("fox"), false);
  assert.equal(canCutBuildings("lynx"), true);
  const from = { lat: 30.2672, lng: -97.7431 };
  const to = dest(from.lat, from.lng, 30, 0);
  assert.equal(stuckNudge(from, to, false), null);
  assert.equal(stuckNudge(from, to, canCutBuildings("fox")), null);
  const hop = stuckNudge(from, to, canCutBuildings("lynx"));
  assert.ok(hop);
  assert.ok(distM(from.lat, from.lng, hop.lat, hop.lng) <= 18.1);
});

test("routeWalk/routeDrive resolve null once aborted, never a stale offline path (map torn down mid-route)", async () => {
  const { g, west, east } = blockGraph();
  const realFetch = globalThis.fetch;
  try {
    // Offline: online router fails, so the graph fallback answers.
    globalThis.fetch = (async () => new Response("", { status: 503 })) as typeof fetch;
    const live = await routeWalk(g, west, east, new AbortController().signal);
    assert.ok(live && live.length >= 2, "fallback still routes while the map is live");
    // Abort while the online request is in flight (what boarding a fare does to the map).
    const ctl = new AbortController();
    globalThis.fetch = ((_u: unknown, init?: RequestInit) =>
      new Promise((_, reject) => {
        const no = () => reject(new DOMException("aborted", "AbortError"));
        if (init?.signal?.aborted) no();
        else init?.signal?.addEventListener("abort", no);
      })) as typeof fetch;
    const walking = routeWalk(g, west, east, ctl.signal);
    const driving = routeDrive(g, west, east, ctl.signal);
    ctl.abort();
    assert.equal(await walking, null);
    assert.equal(await driving, null);
  } finally {
    globalThis.fetch = realFetch;
  }
});
