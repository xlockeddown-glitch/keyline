/**
 * 0.1.180: one verified download path for the city street maps and the Philly overlay. A file is pinned in the core
 * manifest by hashed URL + byte length + sha256; nothing is inflated, cached or used before the bytes match the pin,
 * and a cached copy is checked again on every read.
 */
export type PackPin = {
  url: string;
  sha256: string;
  bytes: number;
  /** Off-origin (the keyline-packs host): a plain CORS GET, no credentials, no custom headers. */
  remote: boolean;
  /**
   * Same-origin files only: the inflated size. A host that serves the .gz with Content-Encoding: gzip hands the
   * browser the decoded JSON, which can't match the gz pin; that exact length (and no gzip magic) is let through.
   */
  decodedBytes?: number;
};

export type PackEnv = {
  fetch: typeof fetch;
  openCache: () => Promise<Cache | null>;
  /** Hex sha256, or null where WebCrypto is missing (an insecure origin). */
  digest: ((bytes: Uint8Array) => Promise<string>) | null;
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
};

/** From request start until the body is fully read. */
export const PACK_TIMEOUT_MS = 15_000;
/** Wait before each attempt: at once, then 1 s, then 4 s. Three attempts in all. */
export const PACK_BACKOFF_MS = [0, 1000, 4000] as const;
/** 0.1.50: the browser cache that keeps visited cities' baked maps (and the last manifest) for offline play. */
export const STREETS_CACHE = "keyline-streets-v2";

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const sum = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource));
  let hex = "";
  for (const b of sum) hex += b.toString(16).padStart(2, "0");
  return hex;
}

let override: Partial<PackEnv> = {};
/** Tests swap fetch, the cache, the digest and the timers here; null restores the browser's own. */
export function setPackEnv(env: Partial<PackEnv> | null) {
  override = env ?? {};
}

/** Resolved per call, so a test that swaps globalThis.fetch or the timers is seen. */
export function packEnv(): PackEnv {
  return {
    fetch: override.fetch ?? ((input, init) => globalThis.fetch(input, init)),
    openCache:
      override.openCache ??
      (async () => {
        try {
          return typeof caches === "undefined" ? null : await caches.open(STREETS_CACHE);
        } catch {
          return null;
        }
      }),
    digest: "digest" in override ? (override.digest ?? null) : globalThis.crypto?.subtle ? sha256Hex : null,
    setTimeout: override.setTimeout ?? ((fn, ms) => globalThis.setTimeout(fn, ms)),
    clearTimeout: override.clearTimeout ?? ((h) => globalThis.clearTimeout(h as ReturnType<typeof globalThis.setTimeout>)),
  };
}

/** Byte length and sha256 against the pin. */
export async function verifyPack(bytes: Uint8Array, pin: PackPin, env: PackEnv = packEnv()): Promise<boolean> {
  if (bytes.byteLength !== pin.bytes) {
    return !pin.remote && pin.decodedBytes === bytes.byteLength && !(bytes[0] === 0x1f && bytes[1] === 0x8b);
  }
  // No WebCrypto (plain http on a LAN address): a same-origin file passes on length; an off-origin pack never does.
  if (!env.digest) return !pin.remote;
  return (await env.digest(bytes)) === pin.sha256;
}

function fileName(url: string): string {
  return (url.split(/[?#]/)[0] ?? "").split("/").pop() ?? "";
}

/** One GET: non-200, a network or CORS error, a body that isn't in within 15 s, or bytes off the pin all throw. */
async function attempt(pin: PackPin, env: PackEnv): Promise<Uint8Array> {
  const ctl = new AbortController();
  let timer: unknown;
  const timeout = new Promise<never>((_, reject) => {
    timer = env.setTimeout(() => {
      ctl.abort();
      reject(new Error("pack timeout"));
    }, PACK_TIMEOUT_MS);
  });
  const get = (async () => {
    const res = await env.fetch(pin.url, pin.remote ? { mode: "cors", credentials: "omit", signal: ctl.signal } : { signal: ctl.signal });
    if (res.status !== 200) throw new Error(`pack ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (!(await verifyPack(bytes, pin, env))) throw new Error("pack integrity");
    return bytes;
  })();
  try {
    return await Promise.race([get, timeout]);
  } finally {
    env.clearTimeout(timer);
  }
}

/**
 * The pinned file's verified bytes, or null. Cache first (hashed URLs never change) but only after the cached bytes
 * pass the pin again; a copy that fails is deleted and fetched anew. Then up to three attempts. A fresh download is
 * stored and older files of the same name stem ("philly", "philly-overlay") are dropped, so a new hashed URL is
 * always fetched and an older entry is never reused.
 */
export async function fetchVerified(pin: PackPin): Promise<Uint8Array | null> {
  const env = packEnv();
  const cache = await env.openCache();
  if (cache) {
    try {
      const hit = await cache.match(pin.url);
      if (hit) {
        const bytes = new Uint8Array(await hit.arrayBuffer());
        if (await verifyPack(bytes, pin, env)) return bytes;
        await cache.delete(pin.url);
      }
    } catch {
      /* an unreadable cache is the same as an empty one */
    }
  }
  for (const wait of PACK_BACKOFF_MS) {
    if (wait > 0) await new Promise<void>((r) => env.setTimeout(r, wait));
    let bytes: Uint8Array;
    try {
      bytes = await attempt(pin, env);
    } catch {
      continue;
    }
    if (cache) {
      try {
        // Stored before it is handed on, so a reload right after finds the file.
        await cache.put(pin.url, new Response(bytes as unknown as BodyInit, { headers: { "content-type": "application/octet-stream" } }));
        const name = fileName(pin.url);
        const stem = name.split(".")[0];
        for (const req of await cache.keys()) {
          const other = fileName(req.url);
          if (other !== name && other !== "manifest.json" && other.split(".")[0] === stem) await cache.delete(req);
        }
      } catch {
        /* storage full or blocked: play on without the offline copy */
      }
    }
    return bytes;
  }
  return null;
}
