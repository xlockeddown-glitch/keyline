/**
 * 0.1.154 house dresser. Four furnishings on a house you own, any order, once per city.
 * 15,000 / 30,000 / 60,000 / 100,000. A full door is 205,000. Ledger `decor:<city>:<item>`.
 * Look only. The daily key pays what the tier already pays.
 */
export const DRESS = [
  { id: "lamp", name: "Door lamp", blurb: "A brass lamp by the door, glass warm.", price: 15_000 },
  { id: "rail", name: "Stair rail", blurb: "Iron along the steps, a brass edge.", price: 30_000 },
  { id: "window", name: "Window", blurb: "Cream cloth gathered in the window.", price: 60_000 },
  { id: "plate", name: "Nameplate", blurb: "A small brass plate, engraved.", price: 100_000 },
] as const;

export type DressId = (typeof DRESS)[number]["id"];

export const DRESS_IDS = DRESS.map((d) => d.id) as [DressId, ...DressId[]];

export function dressOf(id: string) {
  return DRESS.find((d) => d.id === id) ?? null;
}

export function isDress(id: string): id is DressId {
  return dressOf(id) !== null;
}

export function dressKey(city: string, item: string): string {
  return `decor:${city}:${item}`;
}

export const DRESS_TOTAL = DRESS.reduce((sum, d) => sum + d.price, 0);

/** The four furnishings, shown only when their id is in data-dress. Positions follow data-tier. */
export function dressMarkup(items: readonly string[] | undefined, tier: string): string {
  const dress = (items ?? []).filter(isDress).join(" ");
  return `<span class="dress-set" data-tier="${tier}" data-dress="${dress}"><i class="dress dress-lamp"><i class="lamp-glow"></i><i class="lamp-cap"></i><i class="lamp-glass"></i><i class="lamp-post"></i></i><i class="dress dress-rail"><i class="rail-brass"></i><i class="post post-a"></i><i class="post post-b"></i><i class="post post-c"></i></i><i class="dress dress-window"><i class="cloth"></i><i class="cloth"></i></i><i class="dress dress-plate"></i></span>`;
}
