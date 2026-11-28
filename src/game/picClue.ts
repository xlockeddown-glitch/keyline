/**
 * 0.1.207 picture-clue lamps — CLIENT-SAFE. Opaque stamp ids and the public image path only.
 * No country or landmark names, no answers, no bank. The server deals `pic` only after precache succeeds.
 */
export const PIC_IDS = [
  "p01", "p02", "p03", "p04", "p05", "p06", "p07", "p08",
  "p09", "p10", "p11", "p12", "p13", "p14", "p15", "p16",
  "p17", "p18", "p19", "p20", "p21", "p22", "p23", "p24",
] as const;

export type PicId = (typeof PIC_IDS)[number];

export const PIC_SRC_PREFIX = "/sprites/pic/";

export function isPicId(id: string): id is PicId {
  return (PIC_IDS as readonly string[]).includes(id);
}

export function picSrc(id: string): string {
  if (!isPicId(id)) return `${PIC_SRC_PREFIX}p01.webp`;
  return `${PIC_SRC_PREFIX}${id}.webp`;
}

let ready = false;

/** True only after every stamp image has loaded. Street deals advertise "pic" only then. */
export function picsReady(): boolean {
  return ready;
}

/** Load all 24 stamps ahead of a deal. Resolves false (and leaves the flag off) if any file is missing. */
export function precachePics(): Promise<boolean> {
  if (typeof Image === "undefined") return Promise.resolve(false);
  return Promise.all(
    PIC_IDS.map(
      (id) =>
        new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = picSrc(id);
        }),
    ),
  ).then((ok) => {
    ready = ok.every(Boolean);
    return ready;
  });
}

/** Test hook. */
export function resetPicsReady(value = false) {
  ready = value;
}
