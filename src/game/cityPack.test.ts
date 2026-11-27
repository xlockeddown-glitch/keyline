// 0.1.180 (CARD-182): the Philly on-demand city pack. Nothing here touches the network: the pack host is a mock that
// serves the vendored pack bytes (src/game/fixtures/packs), and timers are a fake clock.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fetchVerified, PACK_BACKOFF_MS, PACK_TIMEOUT_MS, setPackEnv, verifyPack } from "./packFetch.ts";
import {
  bootstrapDrive,
  bootstrapStreets,
  cityLoadStatus,
  cityPin,
  loadBakedCity,
  nearest,
  PACK_CITIES,
  PackUnavailableError,
  resetCityLoads,
  retryCityLoad,
  routeOnGraph,
  type CityEntry,
} from "./streets.ts";
import { mountCityOverlay, OVERLAY_CLASS } from "./cityOverlay.ts";
import { CITIES } from "./data.ts";

const root = new URL("../../", import.meta.url);
const read = (rel: string) => new Uint8Array(readFileSync(new URL(rel, root)));
const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const manifestText = readFileSync(new URL("public/streets/v2/manifest.json", root), "utf8");
const manifest = JSON.parse(manifestText) as { v: number; cities: Record<string, CityEntry> };
const philly = manifest.cities.philly!;
const PHILLY_SHA = "d659096900a0265dda7f575b0422366ef6cddbdf0112e0e5b53db6535db7f786";
const OVERLAY_SHA = "ac97070fe9b0327736fecfe75398da3bfecf10b15aa654d5fc14839689f34463";
const AUSTIN_OVERLAY_SHA = "21c5b5aba3535dffd0412c7c98ce314cd4ba888ed2786c9e76e4b9ac5a5bc6b9";
const AUSTIN_OVERLAY_BYTES = 259_308;
const NOLA_OVERLAY_SHA = "4f35f29cdf6e2a6989c76891ebcb611d72fd6c984ac729dd45e305ce359bea8e";
const NOLA_OVERLAY_BYTES = 146_432;
const BOSTON_OVERLAY_SHA = "a1e74f0806cc890c13739118279a9d89694c891189bd8f012d76c24a0165afcc";
const BOSTON_OVERLAY_BYTES = 260_158;
const SEATTLE_OVERLAY_SHA = "06129459ebcc2c50ace82b5d5b59c020baa671f987e8a1a4824cae96477462f9";
const SEATTLE_OVERLAY_BYTES = 252_738;
const HOST = "https://xlockeddown-glitch.github.io/keyline-packs/v2/";
const pack = read(`src/game/fixtures/packs/${philly.file}`);
const phillyPin = cityPin(philly)!;

/** Timers fire only when the work under test is parked on one, earliest first; `now` is the virtual clock. */
function fakeClock() {
  type T = { at: number; fn: () => void; dead: boolean };
  const q: T[] = [];
  const clock = {
    now: 0,
    setTimeout: (fn: () => void, ms: number): unknown => {
      const t = { at: clock.now + ms, fn, dead: false };
      q.push(t);
      return t;
    },
    clearTimeout: (h: unknown) => {
      if (h) (h as T).dead = true;
    },
    async run<R>(p: Promise<R>): Promise<R> {
      let done = false;
      p.then(
        () => (done = true),
        () => (done = true),
      );
      const giveUp = Date.now() + 30_000;
      while (!done && Date.now() < giveUp) {
        await new Promise((r) => setImmediate(r));
        if (done) break;
        const next = q.filter((t) => !t.dead).sort((a, b) => a.at - b.at)[0];
        if (!next) {
          await new Promise((r) => globalThis.setTimeout(r, 1)); // real async work (inflate, a Response body) is still running
          continue;
        }
        next.dead = true;
        clock.now = next.at;
        next.fn();
      }
      assert.ok(done, "the work under test settled");
      return p;
    },
  };
  return clock;
}

function fakeCache() {
  const store = new Map<string, Uint8Array>();
  const cache = {
    store,
    async match(url: string) {
      const b = store.get(url);
      return b ? new Response(b.slice()) : undefined;
    },
    async put(url: string, res: Response) {
      store.set(url, new Uint8Array(await res.arrayBuffer()));
    },
    async delete(req: string | { url: string }) {
      return store.delete(typeof req === "string" ? req : req.url);
    },
    async keys() {
      return [...store.keys()].map((url) => ({ url }));
    },
  };
  return cache;
}

type Call = { url: string; init: RequestInit | undefined; at: number };
type Reply = Uint8Array | "down" | "hang" | "hang-body" | 404;
/** A pack reply resolves in microtasks, so the fake clock never fires the 15 s timer ahead of a good download. */
function packReply(r: Reply): Promise<Response> {
  if (r === "hang") return new Promise<Response>(() => {});
  if (r === "down") return Promise.reject(new TypeError("Failed to fetch"));
  if (r === 404) return Promise.resolve({ status: 404, ok: false, arrayBuffer: async () => new ArrayBuffer(0) } as unknown as Response);
  if (r === "hang-body") return Promise.resolve({ status: 200, ok: true, arrayBuffer: () => new Promise<ArrayBuffer>(() => {}) } as unknown as Response);
  return Promise.resolve({ status: 200, ok: true, arrayBuffer: async () => r.slice().buffer } as unknown as Response);
}

/** The app's origin (manifest + the 15 bundled cities from public/) plus a scriptable pack host. */
function harness(opts: { manifest?: string } = {}) {
  const clock = fakeClock();
  const cache = fakeCache();
  const calls: Call[] = [];
  const remote = new Map<string, Reply | ((n: number) => Reply)>();
  const seen = new Map<string, number>();
  const fetchMock = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    calls.push({ url, init, at: clock.now });
    if (url === "/streets/v2/manifest.json") return new Response(opts.manifest ?? manifestText, { status: 200 });
    if (url.startsWith("/streets/v2/")) return packReply(read(`public${url}`));
    if (remote.has(url)) {
      const n = seen.get(url) ?? 0;
      seen.set(url, n + 1);
      const r = remote.get(url)!;
      return packReply(typeof r === "function" ? r(n) : r);
    }
    throw new TypeError(`network down: ${url}`); // server fn, Overpass, OSRM, tiles
  }) as typeof fetch;
  const realFetch = globalThis.fetch;
  globalThis.fetch = fetchMock; // osrmRoute / Overpass / the server fn use the global one
  resetCityLoads();
  setPackEnv({
    fetch: fetchMock,
    openCache: async () => cache as unknown as Cache,
    digest: async (b) => sha(b),
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
  });
  return {
    clock,
    cache,
    calls,
    remote,
    to: (url: string) => calls.filter((c) => c.url === url),
    live: () => calls.filter((c) => !c.url.startsWith("/streets/v2/") && !c.url.startsWith(HOST)),
    done() {
      setPackEnv(null);
      resetCityLoads();
      globalThis.fetch = realFetch;
    },
  };
}

function filesUnder(dir: URL): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) out.push(...filesUnder(new URL(`${e.name}/`, dir)));
    else out.push(e.name);
  }
  return out;
}

test("manifest: one field shape for all 16 cities; local pins match public/streets/v2; the Philly pin matches the vendored pack; no Philly file in public/", () => {
  const ids = Object.keys(manifest.cities);
  assert.equal(ids.length, 16);
  assert.deepEqual([...ids].sort(), Object.keys(CITIES).sort());
  const shape = ["file", "snapshot", "bytes", "gz", "sha256", "origin", "url", "overlay"];
  const onDisk = readdirSync(new URL("public/streets/v2/", root)).filter((f) => f.endsWith(".json.gz"));
  for (const id of ids) {
    const e = manifest.cities[id]!;
    assert.deepEqual(Object.keys(e), shape, `${id} field shape`);
    assert.match(e.sha256, /^[0-9a-f]{64}$/, `${id} sha256`);
    assert.ok(Number.isInteger(e.gz) && Number.isInteger(e.bytes), `${id} sizes`);
    if (id === "philly") continue;
    assert.equal(e.origin, "local", `${id} is bundled`);
    assert.equal(e.url, `/streets/v2/${e.file}`);
    if (id === "austin" || id === "nola" || id === "boston" || id === "seattle") assert.ok(e.overlay, `${id} pins an overlay: its graph stays bundled, the painted layer is on the pack host`);
    else assert.equal(e.overlay, null, `${id} has no overlay`);
    const bytes = read(`public/streets/v2/${e.file}`);
    assert.equal(bytes.length, e.gz, `${id} gz length`);
    assert.equal(sha(bytes), e.sha256, `${id} sha256 of the file on disk`);
  }
  assert.equal(onDisk.length, 15, "15 bundled city files, nothing stale");
  assert.deepEqual(ids.filter((id) => manifest.cities[id]!.origin === "remote"), [...PACK_CITIES], "PACK_CITIES is the manifest's remote set");

  assert.equal(philly.origin, "remote");
  assert.equal(philly.file, `philly.${PHILLY_SHA}.json.gz`);
  assert.equal(philly.url, `${HOST}philly.${PHILLY_SHA}.json.gz`);
  assert.equal(philly.sha256, PHILLY_SHA);
  assert.equal(philly.gz, 389_472);
  assert.equal(pack.length, philly.gz, "vendored pack length is the pin");
  assert.equal(sha(pack), philly.sha256, "vendored pack sha256 is the pin");
  assert.deepEqual(philly.overlay, {
    url: `${HOST}philly-overlay.${OVERLAY_SHA}.webp`,
    sha256: OVERLAY_SHA,
    bytes: 218_632,
    w: 1571,
    h: 1612,
    bounds: { nw: [39.97751, -75.198], ne: [39.97751, -75.13056], se: [39.92448, -75.13056], sw: [39.92448, -75.198] },
  });

  const stray = filesUnder(new URL("public/", root)).filter((f) => /^philly.*\.json\.gz$/.test(f) || f.startsWith("philly-overlay") || f.startsWith("austin-overlay") || f.startsWith("nola-overlay") || f.startsWith("boston-overlay") || f.startsWith("seattle-overlay"));
  assert.deepEqual(stray, [], "no philly*.json.gz and no philly-/austin-/nola-/boston-/seattle-overlay* anywhere under public/");

  // 0.1.189: Austin keeps its bundled graph (origin local); only the painted overlay is remote.
  const austin = manifest.cities.austin!;
  assert.equal(austin.origin, "local");
  assert.equal(austin.url, `/streets/v2/${austin.file}`);
  assert.deepEqual(austin.overlay, {
    url: `${HOST}austin-overlay.${AUSTIN_OVERLAY_SHA}.webp`,
    sha256: AUSTIN_OVERLAY_SHA,
    bytes: AUSTIN_OVERLAY_BYTES,
    w: 1545,
    h: 3191,
    bounds: { nw: [30.32908, -97.78296], ne: [30.32908, -97.71664], se: [30.21082, -97.71664], sw: [30.21082, -97.78296] },
  });
  assert.ok(austin.overlay!.bytes <= 262_144, "the pack overlay cap (256 KiB) holds for Austin too");

  // 0.1.194: New Orleans keeps its bundled graph (origin local); only the painted overlay is remote.
  const nola = manifest.cities.nola!;
  assert.equal(nola.origin, "local");
  assert.equal(nola.url, `/streets/v2/${nola.file}`);
  assert.deepEqual(nola.overlay, {
    url: `${HOST}nola-overlay.${NOLA_OVERLAY_SHA}.webp`,
    sha256: NOLA_OVERLAY_SHA,
    bytes: NOLA_OVERLAY_BYTES,
    w: 1400,
    h: 1527,
    bounds: { nw: [29.9775, -90.09363], ne: [29.9775, -90.03353], se: [29.92072, -90.03353], sw: [29.92072, -90.09363] },
  });
  assert.ok(nola.overlay!.bytes <= 262_144, "the pack overlay cap (256 KiB) holds for New Orleans too");

  // 0.1.195: Boston keeps its bundled graph (origin local); only the painted overlay is remote.
  const boston = manifest.cities.boston!;
  assert.equal(boston.origin, "local");
  assert.equal(boston.url, `/streets/v2/${boston.file}`);
  assert.deepEqual(boston.overlay, {
    url: `${HOST}boston-overlay.${BOSTON_OVERLAY_SHA}.webp`,
    sha256: BOSTON_OVERLAY_SHA,
    bytes: BOSTON_OVERLAY_BYTES,
    w: 2258,
    h: 1736,
    bounds: { nw: [42.38518, -71.12784], ne: [42.38518, -71.03094], se: [42.33012, -71.03094], sw: [42.33012, -71.12784] },
  });
  assert.ok(boston.overlay!.bytes <= 262_144, "the pack overlay cap (256 KiB) holds for Boston too");

  // 0.1.196: Seattle keeps its bundled graph (origin local); only the painted overlay is remote.
  const seattle = manifest.cities.seattle!;
  assert.equal(seattle.origin, "local");
  assert.equal(seattle.url, `/streets/v2/${seattle.file}`);
  assert.deepEqual(seattle.overlay, {
    url: `${HOST}seattle-overlay.${SEATTLE_OVERLAY_SHA}.webp`,
    sha256: SEATTLE_OVERLAY_SHA,
    bytes: SEATTLE_OVERLAY_BYTES,
    w: 1542,
    h: 1872,
    bounds: { nw: [47.63744, -122.37189], ne: [47.63744, -122.30572], se: [47.58328, -122.30572], sw: [47.58328, -122.37189] },
  });
  assert.ok(seattle.overlay!.bytes <= 262_144, "the pack overlay cap (256 KiB) holds for Seattle too");
});

test("the pack fetch is a simple CORS GET: mode cors, credentials omit, no headers; a bundled city stays a plain same-origin GET", async () => {
  const h = harness();
  try {
    h.remote.set(phillyPin.url, pack);
    const bytes = await h.clock.run(fetchVerified(phillyPin));
    assert.equal(sha(bytes!), PHILLY_SHA);
    const [call] = h.to(phillyPin.url);
    assert.equal(h.to(phillyPin.url).length, 1);
    assert.equal(call!.init?.mode, "cors");
    assert.equal(call!.init?.credentials, "omit");
    assert.equal("headers" in call!.init!, false, "no custom headers (no preflight)");
    assert.equal(call!.init?.method ?? "GET", "GET");
    assert.deepEqual(Object.keys(call!.init!).sort(), ["credentials", "mode", "signal"]);
    assert.ok(call!.init?.signal instanceof AbortSignal, "the attempt can be timed out");

    const temple = cityPin(manifest.cities.temple)!;
    assert.ok(await h.clock.run(fetchVerified(temple)));
    assert.deepEqual(Object.keys(h.to(temple.url)[0]!.init!), ["signal"]);
  } finally {
    h.done();
  }
});

test("sha256 or length mismatch is rejected and not cached", async () => {
  for (const kind of ["sha256", "length", "longer"] as const) {
    const h = harness();
    try {
      const bad = kind === "sha256" ? pack.slice() : kind === "length" ? pack.slice(0, pack.length - 1) : new Uint8Array([...pack, 0]);
      if (kind === "sha256") bad[1000] = bad[1000]! ^ 0xff; // same length, one byte off
      h.remote.set(phillyPin.url, bad);
      const got = await h.clock.run(fetchVerified(phillyPin));
      assert.equal(got, null, `${kind}: rejected`);
      assert.equal(h.to(phillyPin.url).length, 3, `${kind}: each mismatch is a failed attempt`);
      assert.equal(h.cache.store.size, 0, `${kind}: never cached`);
      // And through the loader: never inflated or used.
      assert.equal(await h.clock.run(loadBakedCity("philly")), null);
      assert.equal(cityLoadStatus("philly"), "failed");
      assert.equal(h.cache.store.has(phillyPin.url), false);
    } finally {
      h.done();
    }
  }
});

test("hashed URL change is fetched, old cache is not reused", async () => {
  const h = harness();
  try {
    // A previous publish's pack sits in the cache under its own hashed URL (and the pre-0.1.180 bundled Philly file).
    const oldUrl = `${HOST}philly.${"0".repeat(64)}.json.gz`;
    const oldBundled = "/streets/v2/philly.950f3989dd.json.gz";
    const oldBytes = new TextEncoder().encode("an older philly pack");
    h.cache.store.set(oldUrl, oldBytes);
    h.cache.store.set(oldBundled, oldBytes);
    h.cache.store.set(`${HOST}philly-overlay.${OVERLAY_SHA}.webp`, new Uint8Array([1])); // another stem: kept
    h.remote.set(phillyPin.url, pack);
    const got = await h.clock.run(fetchVerified(phillyPin));
    assert.equal(sha(got!), PHILLY_SHA, "the new hashed URL's bytes");
    assert.equal(h.to(phillyPin.url).length, 1, "the new hashed URL is fetched");
    assert.equal(h.to(oldUrl).length, 0);
    assert.equal(h.cache.store.has(oldUrl), false, "the older pack is dropped");
    assert.equal(h.cache.store.has(oldBundled), false, "so is the old bundled file");
    assert.equal(sha(h.cache.store.get(phillyPin.url)!), PHILLY_SHA, "the new one is cached");
    assert.ok(h.cache.store.has(`${HOST}philly-overlay.${OVERLAY_SHA}.webp`), "the overlay is its own file family");

    // Host down and only an older pack cached: it is not used.
    const h2 = harness();
    try {
      h2.cache.store.set(oldUrl, oldBytes);
      h2.remote.set(phillyPin.url, "down");
      assert.equal(await h2.clock.run(fetchVerified(phillyPin)), null);
    } finally {
      h2.done();
    }
  } finally {
    h.done();
  }
});

test("a tampered cache entry is discarded and refetched", async () => {
  const h = harness();
  try {
    const bad = pack.slice();
    bad[bad.length - 9] = bad[bad.length - 9]! ^ 0x01;
    h.cache.store.set(phillyPin.url, bad);
    h.remote.set(phillyPin.url, pack);
    const got = await h.clock.run(fetchVerified(phillyPin));
    assert.equal(sha(got!), PHILLY_SHA, "the bytes used are the refetched, verified ones");
    assert.equal(h.to(phillyPin.url).length, 1, "refetched");
    assert.equal(sha(h.cache.store.get(phillyPin.url)!), PHILLY_SHA, "the cache holds the good copy again");

    // Tampered (truncated this time) and the host is down: the entry is deleted and nothing is used.
    const h2 = harness();
    try {
      h2.cache.store.set(phillyPin.url, pack.slice(0, 1000));
      h2.remote.set(phillyPin.url, "down");
      assert.equal(await h2.clock.run(fetchVerified(phillyPin)), null);
      assert.equal(h2.cache.store.has(phillyPin.url), false, "discarded");
      assert.equal(h2.to(phillyPin.url).length, 3);
    } finally {
      h2.done();
    }
  } finally {
    h.done();
  }
});

test("Philly pack host down on first arrival shows retry notice and leaves other cities playable", async () => {
  const h = harness();
  try {
    h.remote.set(phillyPin.url, "down");
    const c = CITIES.philly;
    const at = c.start ?? c.spawn;
    await assert.rejects(h.clock.run(bootstrapStreets("philly", at.lat, at.lng, c.pois)), PackUnavailableError);
    assert.equal(cityLoadStatus("philly"), "failed", "the status the notice shows on");
    assert.deepEqual(h.to(phillyPin.url).map((x) => x.at), [0, 1000, 5000], "three attempts: at once, +1 s, +4 s");
    assert.equal(h.clock.now, 5000, "no infinite spinner: it gives up after the third attempt");
    // No streets from anywhere else while failed: the drive graph is empty and nothing asked Overpass / OSRM.
    const dg = await h.clock.run(bootstrapDrive(at.lat, at.lng, c.pois, undefined, "philly"));
    assert.equal(dg.segs.length, 0, "no roads off the pack");
    assert.equal(h.to(phillyPin.url).length, 3, "the drive setup reuses the failed load, no second round");
    assert.deepEqual(h.live(), [], "no live Overpass, server fetch or OSRM for Philly while failed");

    // Other cities are unaffected: bundled, verified, playable.
    for (const id of ["temple", "nashville"] as const) {
      const o = CITIES[id];
      const g = await h.clock.run(bootstrapStreets(id, o.spawn.lat, o.spawn.lng, o.pois));
      assert.ok(g.segs.length > 1000, `${id} walks`);
      assert.equal(cityLoadStatus(id), "ok");
      assert.ok(nearest(g, o.spawn.lat, o.spawn.lng, 90), `${id} spawn snaps`);
      const d = await h.clock.run(bootstrapDrive(o.spawn.lat, o.spawn.lng, o.pois, undefined, id));
      assert.ok(d.segs.length > 1000, `${id} drives`);
    }
    assert.equal(cityLoadStatus("philly"), "failed", "still failed until a retry");

    // Retry with the host back: three fresh attempts allowed, the first lands, the city bootstraps normally.
    h.remote.set(phillyPin.url, pack);
    const before = h.to(phillyPin.url).length;
    const baked = await h.clock.run(retryCityLoad("philly"));
    assert.ok(baked, "retry loads the pack");
    assert.equal(cityLoadStatus("philly"), "ok");
    assert.equal(h.to(phillyPin.url).length, before + 1);
    const g = await h.clock.run(bootstrapStreets("philly", at.lat, at.lng, c.pois));
    assert.ok(g.segs.length > 1000);
    assert.equal(h.to(phillyPin.url).length, before + 1, "one download per session");
    assert.deepEqual(h.live(), []);
  } finally {
    h.done();
  }

  // The notice itself: Philly-only copy, a Retry button, stable selectors, and the map holds still while it shows.
  const map = readFileSync(new URL("src/components/keyline/GameMap.tsx", root), "utf8");
  assert.match(map, /data-testid="pack-notice"/);
  assert.match(map, /data-testid="pack-retry" onClick=\{retryStreets\}/);
  assert.match(map, /Philadelphia streets couldn't load\. You can retry, or play in another city\./);
  assert.equal(map.match(/if \(err instanceof PackUnavailableError\) packFailed\(\);/g)?.length, 2, "first arrival and Retry both land on the notice");
  assert.match(map, /if \(packDown\.current\) return; \/\/ 0\.1\.180/);
});

test("a retry that fails again gets three more attempts and stays failed", async () => {
  const h = harness();
  try {
    h.remote.set(phillyPin.url, 404);
    assert.equal(await h.clock.run(loadBakedCity("philly")), null);
    assert.equal(await h.clock.run(loadBakedCity("philly")), null);
    assert.equal(h.to(phillyPin.url).length, 3, "a failed load is held, not refetched on every call");
    assert.equal(await h.clock.run(retryCityLoad("philly")), null);
    assert.equal(h.to(phillyPin.url).length, 6, "retry() = three attempts again");
    assert.equal(cityLoadStatus("philly"), "failed");
  } finally {
    h.done();
  }
});

test("cached verified pack is used when the host is down after a prior success", async () => {
  const h = harness();
  try {
    h.remote.set(phillyPin.url, pack);
    assert.ok(await h.clock.run(loadBakedCity("philly")), "first visit, host up");
    assert.equal(sha(h.cache.store.get(phillyPin.url)!), PHILLY_SHA);
    const fetched = h.to(phillyPin.url).length;

    resetCityLoads(); // a new session
    h.remote.set(phillyPin.url, "down");
    const c = CITIES.philly;
    const at = c.start ?? c.spawn;
    const g = await h.clock.run(bootstrapStreets("philly", at.lat, at.lng, c.pois));
    assert.ok(g.segs.length > 1000, "the cached pack is the walk graph");
    assert.equal(cityLoadStatus("philly"), "ok", "no notice");
    assert.equal(h.to(phillyPin.url).length, fetched, "the down host is never asked");
    assert.equal(h.clock.now, 0, "and nothing waits on a backoff");
    assert.deepEqual(h.live(), []);
  } finally {
    h.done();
  }
});

test("a fetch that exceeds the 15 s timeout is a failed attempt and is retried or, after 3 failures, shows the notice", async () => {
  assert.equal(PACK_TIMEOUT_MS, 15_000);
  assert.deepEqual([...PACK_BACKOFF_MS], [0, 1000, 4000]);
  // Retried: the first attempt hangs, the second lands.
  const h = harness();
  try {
    h.remote.set(phillyPin.url, (n) => (n === 0 ? "hang" : pack));
    const got = await h.clock.run(fetchVerified(phillyPin));
    assert.equal(sha(got!), PHILLY_SHA);
    assert.deepEqual(h.to(phillyPin.url).map((x) => x.at), [0, 16_000], "15 s timeout, then the 1 s backoff");
    assert.equal(h.to(phillyPin.url)[0]!.init!.signal!.aborted, true, "the hung request is aborted");
    assert.equal(h.to(phillyPin.url)[1]!.init!.signal!.aborted, false);
  } finally {
    h.done();
  }
  // Headers in time but the body never finishes: the timeout runs until the body is fully read.
  const hb = harness();
  try {
    hb.remote.set(phillyPin.url, (n) => (n < 2 ? "hang-body" : pack));
    assert.ok(await hb.clock.run(fetchVerified(phillyPin)));
    assert.deepEqual(hb.to(phillyPin.url).map((x) => x.at), [0, 16_000, 35_000]);
  } finally {
    hb.done();
  }
  // Three timeouts: failed, and Philly's status is what puts the notice up.
  const h3 = harness();
  try {
    h3.remote.set(phillyPin.url, "hang");
    const c = CITIES.philly;
    await assert.rejects(h3.clock.run(bootstrapStreets("philly", c.spawn.lat, c.spawn.lng, c.pois)), PackUnavailableError);
    assert.deepEqual(h3.to(phillyPin.url).map((x) => x.at), [0, 16_000, 35_000]);
    assert.equal(h3.clock.now, 50_000, "15 + 1 + 15 + 4 + 15 s, then it stops");
    assert.equal(cityLoadStatus("philly"), "failed");
    assert.equal(h3.cache.store.has(phillyPin.url), false);
    assert.deepEqual(h3.live(), []);
  } finally {
    h3.done();
  }
});

test("overlay renders only in Philly, Austin, New Orleans, Boston and Seattle", async () => {
  // The real overlay bytes live on the pack host only; a stand-in file pinned the same way exercises the path.
  const art = new TextEncoder().encode("RIFF....WEBPVP8L stand-in overlay bytes");
  const man = JSON.parse(manifestText) as typeof manifest;
  const o = man.cities.philly!.overlay!;
  o.sha256 = sha(art);
  o.bytes = art.length;
  const oa = man.cities.austin!.overlay!; // 0.1.189
  oa.sha256 = sha(art);
  oa.bytes = art.length;
  const on = man.cities.nola!.overlay!; // 0.1.194
  on.sha256 = sha(art);
  on.bytes = art.length;
  const ob = man.cities.boston!.overlay!; // 0.1.195
  ob.sha256 = sha(art);
  ob.bytes = art.length;
  const os = man.cities.seattle!.overlay!; // 0.1.196
  os.sha256 = sha(art);
  os.bytes = art.length;
  const h = harness({ manifest: JSON.stringify(man) });
  const made: { url: string; bounds: unknown; options: Record<string, unknown>; on: unknown; removed: boolean }[] = [];
  const L = {
    imageOverlay(url: string, bounds: [[number, number], [number, number]], options: Record<string, unknown>) {
      const layer = { url, bounds, options, on: null as unknown, removed: false };
      made.push(layer);
      return { addTo: (m: never) => ((layer.on = m), layer), remove: () => ((layer.removed = true), layer) };
    },
  };
  const map = { id: "map" };
  try {
    h.remote.set(o.url, art);
    for (const id of Object.keys(CITIES)) {
      if (id === "philly" || id === "austin" || id === "nola" || id === "boston" || id === "seattle") continue;
      assert.equal(await h.clock.run(mountCityOverlay(L, map, id)), null, `${id}: no overlay`);
    }
    assert.equal(made.length, 0, "no other city creates an overlay");
    assert.equal(h.to(o.url).length, 0, "or downloads one");
    assert.equal(h.to(oa.url).length, 0);
    assert.equal(h.to(on.url).length, 0);
    assert.equal(h.to(ob.url).length, 0);
    assert.equal(h.to(os.url).length, 0);

    // 0.1.196: Seattle (bundled graph, remote overlay) mounts its own, over its own box.
    h.remote.set(os.url, art);
    const dropS = await h.clock.run(mountCityOverlay(L, map, "seattle"));
    assert.equal(made.length, 1);
    assert.deepEqual(made[0]!.bounds, [[47.58328, -122.37189], [47.63744, -122.30572]]);
    assert.deepEqual(made[0]!.options, { interactive: false, className: "city-overlay", opacity: 0.9, zIndex: -1 });
    dropS!();
    assert.equal(made[0]!.removed, true);
    made.length = 0;

    // 0.1.195: Boston (bundled graph, remote overlay) mounts its own, over its own box.
    h.remote.set(ob.url, art);
    const dropB = await h.clock.run(mountCityOverlay(L, map, "boston"));
    assert.equal(made.length, 1);
    assert.deepEqual(made[0]!.bounds, [[42.33012, -71.12784], [42.38518, -71.03094]]);
    assert.deepEqual(made[0]!.options, { interactive: false, className: "city-overlay", opacity: 0.9, zIndex: -1 });
    dropB!();
    assert.equal(made[0]!.removed, true);
    made.length = 0;

    // 0.1.194: New Orleans (bundled graph, remote overlay) mounts its own, over its own box.
    h.remote.set(on.url, art);
    const dropN = await h.clock.run(mountCityOverlay(L, map, "nola"));
    assert.equal(made.length, 1);
    assert.deepEqual(made[0]!.bounds, [[29.92072, -90.09363], [29.9775, -90.03353]]);
    assert.deepEqual(made[0]!.options, { interactive: false, className: "city-overlay", opacity: 0.9, zIndex: -1 });
    dropN!();
    assert.equal(made[0]!.removed, true);
    made.length = 0;

    // 0.1.189: Austin (bundled graph, remote overlay) mounts its own, over its own box.
    h.remote.set(oa.url, art);
    const dropA = await h.clock.run(mountCityOverlay(L, map, "austin"));
    assert.equal(made.length, 1);
    assert.deepEqual(made[0]!.bounds, [[30.21082, -97.78296], [30.32908, -97.71664]]);
    assert.deepEqual(made[0]!.options, { interactive: false, className: "city-overlay", opacity: 0.9, zIndex: -1 });
    dropA!();
    assert.equal(made[0]!.removed, true);
    made.length = 0;

    const drop = await h.clock.run(mountCityOverlay(L, map, "philly"));
    assert.equal(made.length, 1);
    const layer = made[0]!;
    assert.match(layer.url, /^blob:/, "a blob URL from the verified bytes, never the host URL");
    assert.deepEqual(layer.bounds, [[39.92448, -75.198], [39.97751, -75.13056]], "[[sw],[ne]] from the manifest pin");
    assert.deepEqual(layer.options, { interactive: false, className: "city-overlay", opacity: 0.9, zIndex: -1 });
    assert.equal(layer.on, map);
    const call = h.to(o.url)[0]!;
    assert.equal(call.init?.mode, "cors");
    assert.equal(call.init?.credentials, "omit");
    assert.equal("headers" in call.init!, false);
    assert.equal(sha(h.cache.store.get(o.url)!), o.sha256, "cached once verified");
    drop!();
    assert.equal(layer.removed, true, "removed on leaving Philly");

    // Tampered overlay or a dead host: no layer, no throw (it never blocks play; only the street pack has a notice).
    const bad = art.slice();
    bad[3] = bad[3]! ^ 0xff;
    for (const reply of [bad, "down", "hang"] as const) {
      const h2 = harness({ manifest: JSON.stringify(man) });
      try {
        h2.remote.set(o.url, reply);
        assert.equal(await h2.clock.run(mountCityOverlay(L, map, "philly")), null);
        assert.equal(h2.cache.store.has(o.url), false);
      } finally {
        h2.done();
      }
    }
    assert.equal(made.length, 1);
  } finally {
    h.done();
  }

  // In the map: mounted beside the tile layer, on its own class, and that class carries no CSS filter.
  const src = readFileSync(new URL("src/components/keyline/GameMap.tsx", root), "utf8");
  assert.match(src, /mountCityOverlay\(L, map, id, /);
  assert.equal(src.match(/paintOverlay\(L, (map|m), city\.id\)/g)?.length, 2, "at map setup, and again when a Retry brings the host back");
  assert.match(src, /overlayDrop\.current\?\.\(\);/, "removed with the map on leaving the city");
  assert.equal(OVERLAY_CLASS, "city-overlay");
  assert.notEqual(OVERLAY_CLASS, "atlas-tiles");
  const css = readFileSync(new URL("src/styles.css", root), "utf8");
  assert.equal(/city-overlay[^{}]*\{[^}]*filter/.test(css), false, "the tile filter (and every skin's) is on .atlas-tiles only");
  assert.equal(/leaflet-overlay-pane[^{}]*\{[^}]*filter/.test(css), false);
});

test("all 16 cities load through the verified loader (Philly from the vendored pack bytes) and still snap and route", async () => {
  const h = harness();
  try {
    h.remote.set(phillyPin.url, pack);
    for (const id of Object.keys(CITIES) as (keyof typeof CITIES)[]) {
      const c = CITIES[id];
      const at = c.start ?? c.spawn;
      const g = await h.clock.run(bootstrapStreets(id, at.lat, at.lng, c.pois));
      assert.equal(cityLoadStatus(id), "ok", id);
      assert.ok(g.baked, `${id} is the baked graph`);
      const snap = nearest(g, at.lat, at.lng, 90);
      assert.ok(snap && snap.dist <= 90, `${id} start snaps to the walk`);
    }
    assert.equal(h.to(phillyPin.url).length, 1);
    assert.deepEqual(h.live(), [], "no live street fetch in any baked city");
    const c = CITIES.philly;
    const g = await h.clock.run(bootstrapStreets("philly", c.start!.lat, c.start!.lng, c.pois));
    const hall = c.pois.find((p) => p.id === "phl-cityhall")!;
    const path = routeOnGraph(g, c.start!, hall);
    assert.ok(path && path.length > 10, "6th and Chestnut walks to City Hall on the pack's graph");
  } finally {
    h.done();
  }
});

test("a bundled city served already decoded (Content-Encoding: gzip) passes on the manifest's string length; a remote pack never does", async () => {
  const { gunzipSync } = await import("node:zlib");
  const man = JSON.parse(readFileSync("public/streets/v2/manifest.json", "utf8")) as { cities: Record<string, { file: string; bytes: number; gz: number; sha256: string; url: string; origin: string }> };
  const digest = async (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
  const env = { digest } as unknown as Parameters<typeof verifyPack>[2];
  for (const id of ["austin", "tucson", "nyc"]) {
    const e = man.cities[id]!;
    const decoded = new Uint8Array(gunzipSync(readFileSync(`public/streets/v2/${e.file}`)));
    const pin = { url: e.url, sha256: e.sha256, bytes: e.gz, remote: false, decodedBytes: e.bytes };
    assert.equal(await verifyPack(decoded, pin, env), true, `${id} decoded body accepted`);
    assert.equal(await verifyPack(decoded.subarray(0, decoded.length - 1), pin, env), false, `${id} short decoded body rejected`);
    assert.equal(await verifyPack(decoded, { ...pin, remote: true }, env), false, `${id} remote never accepts a decoded body`);
  }
});

test("0.1.189: the changelog line, and Austin's overlay pin still holds", () => {
  // 0.1.190: the live version moved on; the current-version pins live in the newest slice's test.
  const v = readFileSync(new URL("src/version.ts", root), "utf8");
  assert.match(v, /\n\/\/ 0\.1\.189: Austin city map — [^\n]*\(k1189a\)\.\n/);
  // Austin's graph is still the bundled file and still pinned; only the overlay changed.
  assert.equal(manifest.cities.austin!.file, "austin.ff665e2015.json.gz");
  assert.equal(manifest.cities.austin!.origin, "local");
});

test("0.1.194: the changelog line, and New Orleans' overlay pin still holds", () => {
  // 0.1.195: the live version moved on; the current-version pins live in the newest slice's test.
  const v = readFileSync(new URL("src/version.ts", root), "utf8");
  assert.match(v, /\n\/\/ 0\.1\.194: New Orleans city map — [^\n]*\(k1194a\)\.\n/);
  assert.equal(manifest.cities.nola!.file, "nola.028a3776a2.json.gz");
  assert.equal(manifest.cities.nola!.origin, "local");
  assert.equal(manifest.cities.nola!.overlay!.sha256, NOLA_OVERLAY_SHA);
  assert.equal(manifest.cities.nola!.overlay!.bytes, NOLA_OVERLAY_BYTES);
});

test("0.1.195: the changelog line, and Boston's overlay pin still holds", () => {
  // 0.1.196: the live version moved on; the current-version pins live in the newest slice's test.
  const v = readFileSync(new URL("src/version.ts", root), "utf8");
  assert.match(v, /\n\/\/ 0\.1\.195: Boston city map — [^\n]*\(k1195a\)\.\n/);
  assert.equal(manifest.cities.boston!.file, "boston.ee65ed59d9.json.gz");
  assert.equal(manifest.cities.boston!.origin, "local");
  assert.equal(manifest.cities.boston!.overlay!.sha256, BOSTON_OVERLAY_SHA);
  assert.equal(manifest.cities.boston!.overlay!.bytes, BOSTON_OVERLAY_BYTES);
});

test("0.1.196: version 0.1.196 / k1196a everywhere, and Seattle's overlay is the only new pin", () => {
  const v = readFileSync(new URL("src/version.ts", root), "utf8");
  assert.match(v, /APP_VERSION = "0\.1\.196"/);
  assert.match(v, /PUBLISH_STAMP = "k1196a"/);
  assert.match(v, /\n\/\/ 0\.1\.196: Seattle city map — [^\n]*\(k1196a\)\.\n$/);
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8")) as { version: string };
  assert.equal(pkg.version, "0.1.196");
  const lock = JSON.parse(readFileSync(new URL("package-lock.json", root), "utf8")) as { version: string; packages: Record<string, { version?: string }> };
  assert.equal(lock.version, "0.1.196");
  assert.equal(lock.packages[""]!.version, "0.1.196");
  assert.equal(manifest.cities.seattle!.file, "seattle.fe65f44198.json.gz");
  assert.equal(manifest.cities.seattle!.origin, "local");
  assert.equal(manifest.cities.seattle!.overlay!.sha256, SEATTLE_OVERLAY_SHA);
  assert.equal(manifest.cities.seattle!.overlay!.bytes, SEATTLE_OVERLAY_BYTES);
});
