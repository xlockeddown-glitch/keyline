import { useEffect, useSyncExternalStore } from "react";
import { shopIsOpen, subscribeShop } from "./dyeWanted";
import { DYE_TARGETS, recolorSheet, type DyeTarget, type SheetKind } from "@/game/dyeRecolor";
import { V2_DEFAULT_COAT, V2_PALETTE, V2_SCOUTS, applyCoatLayer, v2MaskUrl, v2SheetUrl } from "@/game/coatLayer";
import { visibleCoat } from "@/game/paint";
import { ALL_PRINTS, applyPrintLayer } from "@/game/cityPrints";
import { useGame } from "@/game/store";
import { retryingCache } from "@/game/dyeCache";

/**
 * Paints the worn dye onto the walker. The browser mixes it from the scout's own
 * sheets, then a style tag points data-coat="dye-*" at those pictures.
 * 0.0.83: scouts on the redrawn v2 sheets get every print-shop coat and dye this way, recoloured
 * exactly through the sheet's coat mask (src/game/coatLayer.ts); there are no coat PNGs for them.
 */
const KINDS: SheetKind[] = ["walk", "idle", "idle-side"];

/** Same stamp as the sheet URLs in styles.css: a dye is mixed from the current art, not a cached older sheet. */
const ART_STAMP = "k1163a";

function sheetUrl(scout: string, kind: SheetKind): string {
  if (scout === "raccoon") {
    if (kind === "idle") return `/sprites/player-idle.webp?v=${ART_STAMP}`;
    if (kind === "walk") return `/sprites/player-walk.webp?v=${ART_STAMP}`;
    return `/sprites/player-idle-side.webp?v=${ART_STAMP}`;
  }
  return `/sprites/scouts/${scout}-${kind}.png?v=${ART_STAMP}`;
}

async function loadSheet(url: string): Promise<{ data: Uint8ClampedArray; w: number; h: number }> {
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data: image.data, w: canvas.width, h: canvas.height };
}

function paintUrl(sheet: { data: Uint8ClampedArray; w: number; h: number }, scout: string, kind: SheetKind, dye: string): string {
  const tgt = DYE_TARGETS[dye];
  if (!tgt) return "";
  const out = recolorSheet(sheet.data, sheet.w, sheet.h, scout, kind, tgt);
  const canvas = document.createElement("canvas");
  canvas.width = sheet.w;
  canvas.height = sheet.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const image = ctx.createImageData(sheet.w, sheet.h);
  image.data.set(out);
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

const ready = new Map<string, string>();

function publish(css: string) {
  let tag = document.getElementById("dye-sheets");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "dye-sheets";
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}

// ---- 0.1.193: v2 scouts. Until 0.1.192 every print and coat (27 recoloured sheets) was built on the title screen and
// the whole <style> text was rewritten after each one (a 13.8 MB tag by the end; about 8 s of main-thread time on a
// phone-class CPU). Now the worn look is built first, on its own; the rest are built one at a time in idle time once
// play has started, or at once when the print shop opens. Rules are added to the sheet one by one (insertRule), and each
// picture is a blob URL (the PNG is encoded off the main thread) instead of a megabyte data URL inside the stylesheet.
type V2Sheets = { base: Sheet; mask: Sheet; def: DyeTarget };
type Sheet = { data: Uint8ClampedArray; w: number; h: number };

// Memory bounds: only the current scout keeps rules and blob URLs (a scout change revokes the old ones), and the decoded
// base and mask sheets (two RGBA buffers) are held only while a build or a fill for that scout is running.
const v2Loads = retryingCache<V2Sheets>();
type V2Rule = { rule: string; url: string };
const v2Rules = new Map<string, Map<string, V2Rule>>();
const v2Inflight = new Map<string, Promise<boolean>>();
const fillsActive = new Map<string, number>();
const printById = new Map<string, (typeof ALL_PRINTS)[number]>(ALL_PRINTS.map((p) => [p.id, p]));
/** Everything a v2 scout can wear, worn-first order is applied by the callers. */
const V2_IDS: string[] = [...ALL_PRINTS.map((p) => p.id), ...Object.keys(V2_PALETTE)];
let sheetScout = "";
const inSheet = new Set<string>();
let liveScout = "";

function dyeSheet(): CSSStyleSheet | null {
  let tag = document.getElementById("dye-sheets") as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "dye-sheets";
    document.head.appendChild(tag);
  }
  return tag.sheet;
}

function resetSheet(scout: string) {
  const sh = dyeSheet();
  if (sh) while (sh.cssRules.length) sh.deleteRule(0);
  inSheet.clear();
  sheetScout = scout;
}

function put(scout: string, id: string, rule: string) {
  if (sheetScout !== scout || inSheet.has(id)) return;
  const sh = dyeSheet();
  if (!sh) return;
  try {
    sh.insertRule(rule, sh.cssRules.length);
    inSheet.add(id);
  } catch {
    // a rule the browser refuses is skipped; the walker keeps its default look
  }
}

async function loadSheets(scout: string): Promise<V2Sheets | null> {
  const [base, mask] = await Promise.all([loadSheet(v2SheetUrl(scout)), loadSheet(v2MaskUrl(scout))]);
  const def = V2_DEFAULT_COAT[scout];
  if (!def || base.w !== mask.w || base.h !== mask.h) return null;
  return { base, mask, def };
}

function revokeUrl(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

/** A scout change: drop every other scout's rules (revoking their pictures) and decoded sheets. */
function evictOthers(keep: string) {
  for (const [s, m] of v2Rules) {
    if (s === keep) continue;
    for (const r of m.values()) revokeUrl(r.url);
    v2Rules.delete(s);
  }
  for (const k of v2Loads.keys()) if (k !== keep) v2Loads.delete(k);
}

/** Let go of the decoded sheets once nothing is building or filling for this scout. */
function releaseSheets(scout: string) {
  if (fillsActive.get(scout)) return;
  for (const k of v2Inflight.keys()) if (k.startsWith(`${scout}|`)) return;
  v2Loads.delete(scout);
}

async function blobUrl(data: Uint8ClampedArray, w: number, h: number): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const image = ctx.createImageData(w, h);
  image.data.set(data);
  ctx.putImageData(image, 0, 0);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  return blob ? URL.createObjectURL(blob) : canvas.toDataURL("image/png");
}

/** Build (once) and publish one print or coat for a v2 scout. Never rejects; false means the scout's sheets could not be loaded. */
async function buildOne(scout: string, id: string): Promise<boolean> {
  const have = v2Rules.get(scout)?.get(id);
  if (have) {
    put(scout, id, have.rule);
    return true;
  }
  const key = `${scout}|${id}`;
  let job = v2Inflight.get(key);
  if (!job) {
    job = (async () => {
      try {
        const L = await v2Loads.get(scout, () => loadSheets(scout));
        if (!L) return false;
        const print = printById.get(id);
        const tgt = V2_PALETTE[id];
        if (!print && !tgt) return true;
        if (liveScout !== scout) return true; // evicted while the sheets loaded
        const data = print ? applyPrintLayer(L.base.data, L.mask.data, L.base.w, print, L.def) : applyCoatLayer(L.base.data, L.mask.data, tgt, L.def, L.base.w);
        const url = await blobUrl(data, L.base.w, L.base.h);
        if (!url) return true;
        if (liveScout !== scout) {
          revokeUrl(url); // finished after the scout changed: nothing will use it
          return true;
        }
        const sel = `.scout-marker[data-scout="${scout}"][data-coat="${id}"]`;
        let m = v2Rules.get(scout);
        if (!m) v2Rules.set(scout, (m = new Map()));
        m.set(id, { url, rule: `${sel},${sel}.is-idle,${sel}.is-idle.is-side{background-image:url("${url}")}` });
        return true;
      } catch {
        return true; // one look failed to encode: the rest still build, and this one is tried again next time
      }
    })().finally(() => {
      v2Inflight.delete(key);
      releaseSheets(scout);
    });
    v2Inflight.set(key, job);
  }
  const ok = await job;
  const r = v2Rules.get(scout)?.get(id);
  if (r) put(scout, id, r.rule);
  return ok;
}

function idleSlot(urgent: boolean): Promise<void> {
  return new Promise((res) => {
    if (!urgent && "requestIdleCallback" in window) (window as unknown as { requestIdleCallback: (cb: () => void, o: { timeout: number }) => void }).requestIdleCallback(() => res(), { timeout: 1500 });
    else setTimeout(res, urgent ? 0 : 50);
  });
}

/** The rest of the wardrobe for a v2 scout, one picture at a time. */
async function fillV2(scout: string, worn: string | null, urgent: boolean, cancel: () => boolean): Promise<void> {
  fillsActive.set(scout, (fillsActive.get(scout) ?? 0) + 1);
  try {
    for (const id of V2_IDS) {
      if (id === worn) continue;
      const have = v2Rules.get(scout)?.get(id);
      if (have) {
        put(scout, id, have.rule);
        continue;
      }
      await idleSlot(urgent);
      if (cancel() || liveScout !== scout) return;
      if (!(await buildOne(scout, id))) return; // no sheets: a later fill tries again
    }
  } finally {
    fillsActive.set(scout, (fillsActive.get(scout) ?? 1) - 1);
    releaseSheets(scout);
  }
}

async function cssFor(scout: string, cancel: () => boolean): Promise<void> {
  const hit = ready.get(scout);
  if (hit) {
    publish(hit);
    return;
  }
  const sheets = await Promise.all(KINDS.map(async (kind) => [kind, await loadSheet(sheetUrl(scout, kind))] as const));
  if (cancel()) return;
  const lines: string[] = [];
  for (const dye of Object.keys(DYE_TARGETS)) {
    await new Promise((r) => setTimeout(r, 0));
    if (cancel()) return;
    const urls: Partial<Record<SheetKind, string>> = {};
    for (const [kind, sheet] of sheets) urls[kind] = paintUrl(sheet, scout, kind, dye);
    const base = `.scout-marker[data-scout="${scout}"][data-coat="${dye}"]`;
    lines.push(`${base}{background-image:url("${urls.walk}")}`);
    lines.push(`${base}.is-idle{background-image:url("${urls.idle}");background-size:200% 200%}`);
    lines.push(`${base}.is-idle.is-side{background-image:url("${urls["idle-side"]}");background-size:200% 200%}`);
    publish(lines.join("\n"));
  }
  ready.set(scout, lines.join("\n"));
}

export function DyeSync() {
  const scout = useGame((s) => s.scout);
  const worn = useGame((s) => s.printWorn ?? visibleCoat(s.paints.wornCoat, s.wardrobe.coat));
  const inPlay = useGame((s) => s.screen !== "title" && s.screen !== "cities");
  const shopOpen = useSyncExternalStore(subscribeShop, shopIsOpen, () => false);
  const v2 = V2_SCOUTS.has(scout);
  // A scout change starts a fresh sheet with whatever is already built for that scout, and drops everything else.
  useEffect(() => {
    liveScout = scout;
    evictOthers(scout);
    if (!v2) return;
    resetSheet(scout);
    for (const [id, r] of v2Rules.get(scout) ?? []) put(scout, id, r.rule);
  }, [scout, v2]);
  // The look being worn comes first, on its own.
  useEffect(() => {
    if (v2 && worn && (printById.has(worn) || V2_PALETTE[worn])) void buildOne(scout, worn).catch(() => {});
  }, [scout, worn, v2]);
  // The rest follow once play has begun, in idle time; at once while the print shop is open (re-run on a scout change).
  useEffect(() => {
    if (!v2 || !(inPlay || shopOpen)) return;
    let dead = false;
    const t = window.setTimeout(() => void fillV2(scout, worn, shopOpen, () => dead).catch(() => {}), shopOpen ? 0 : 2500);
    return () => {
      dead = true;
      window.clearTimeout(t);
    };
  }, [scout, worn, v2, inPlay, shopOpen]);
  // Other scouts keep the old all-at-once build.
  useEffect(() => {
    if (v2) return;
    let dead = false;
    void cssFor(scout, () => dead);
    return () => {
      dead = true;
    };
  }, [scout, v2]);
  return null;
}
