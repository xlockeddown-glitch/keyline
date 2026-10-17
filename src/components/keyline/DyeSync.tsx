import { useEffect } from "react";
import { DYE_TARGETS, recolorSheet, type SheetKind } from "@/game/dyeRecolor";
import { V2_DEFAULT_COAT, V2_PALETTE, V2_SCOUTS, applyCoatLayer, v2MaskUrl, v2SheetUrl } from "@/game/coatLayer";
import { visibleCoat } from "@/game/paint";
import { useGame } from "@/game/store";

/**
 * Paints the worn dye onto the walker. The browser mixes it from the scout's own
 * sheets, then a style tag points data-coat="dye-*" at those pictures.
 * 0.0.83: scouts on the redrawn v2 sheets get every print-shop coat and dye this way, recoloured
 * exactly through the sheet's coat mask (src/game/coatLayer.ts); there are no coat PNGs for them.
 */
const KINDS: SheetKind[] = ["walk", "idle", "idle-side"];

/** Same stamp as the sheet URLs in styles.css: a dye is mixed from the current art, not a cached older sheet. */
const ART_STAMP = "k81p";

function sheetUrl(scout: string, kind: SheetKind): string {
  if (scout === "raccoon") {
    if (kind === "idle") return `/sprites/player-idle.png?v=${ART_STAMP}`;
    if (kind === "walk") return `/sprites/player-walk.png?v=${ART_STAMP}`;
    return `/sprites/player-idle-side.png?v=${ART_STAMP}`;
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

function toUrl(data: Uint8ClampedArray, w: number, h: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const image = ctx.createImageData(w, h);
  image.data.set(data);
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

async function cssForV2(scout: string, cancel: () => boolean): Promise<void> {
  const [base, mask] = await Promise.all([loadSheet(v2SheetUrl(scout)), loadSheet(v2MaskUrl(scout))]);
  if (cancel()) return;
  const def = V2_DEFAULT_COAT[scout];
  if (!def || base.w !== mask.w || base.h !== mask.h) return;
  const lines: string[] = [];
  // The coat being worn first, so it is on screen in one step; the rest follow for the print shop.
  const worn = visibleCoat(useGame.getState().paints.wornCoat, useGame.getState().wardrobe.coat);
  const order = Object.entries(V2_PALETTE).sort(([a], [b]) => Number(b === worn) - Number(a === worn));
  for (const [coat, tgt] of order) {
    await new Promise((r) => setTimeout(r, 0));
    if (cancel()) return;
    const url = toUrl(applyCoatLayer(base.data, mask.data, tgt, def), base.w, base.h);
    const sel = `.scout-marker[data-scout="${scout}"][data-coat="${coat}"]`;
    lines.push(`${sel},${sel}.is-idle,${sel}.is-idle.is-side{background-image:url("${url}")}`);
    publish(lines.join("\n"));
  }
  ready.set(scout, lines.join("\n"));
}

async function cssFor(scout: string, cancel: () => boolean): Promise<void> {
  const hit = ready.get(scout);
  if (hit) {
    publish(hit);
    return;
  }
  if (V2_SCOUTS.has(scout)) return cssForV2(scout, cancel);
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
  useEffect(() => {
    let dead = false;
    void cssFor(scout, () => dead);
    return () => {
      dead = true;
    };
  }, [scout]);
  return null;
}
