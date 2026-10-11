import { useEffect } from "react";
import { DYE_TARGETS, recolorSheet, type SheetKind } from "@/game/dyeRecolor";
import { useGame } from "@/game/store";

/**
 * Paints the worn dye onto the walker. The browser mixes it from the scout's own
 * sheets, then a style tag points data-coat="dye-*" at those pictures.
 */
const KINDS: SheetKind[] = ["walk", "idle", "idle-side"];

function sheetUrl(scout: string, kind: SheetKind): string {
  if (scout === "raccoon") {
    if (kind === "idle") return "/sprites/player-idle.png";
    if (kind === "walk") return "/sprites/player-walk.png";
    return "/sprites/player-idle-side.png";
  }
  return `/sprites/scouts/${scout}-${kind}.png`;
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
  useEffect(() => {
    let dead = false;
    void cssFor(scout, () => dead);
    return () => {
      dead = true;
    };
  }, [scout]);
  return null;
}
