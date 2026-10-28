/**
 * 0.1.61 map skins (memo section E, the cheap version): a skin swaps the CSS filter on `.atlas-tiles` and a few accent
 * colors (route line, chips). No new animation and no extra layer: the tiles already run one filter, a skin replaces it.
 * Server ledger only, no new table:
 *   skin:<id>       a bought skin (detail { id })
 *   skinon:<ms>     the account's chosen skin (detail { id }); the latest row wins
 * Guests can preview any skin and keep a free one (saved locally); buying needs sign-in.
 */
export type SkinId = "default" | "moonlight" | "mars" | "neon";

export type SkinDef = { id: SkinId; name: string; blurb: string; price: number; swatch: [string, string] };

export const SKINS: readonly SkinDef[] = [
  { id: "default", name: "Lamplight", blurb: "The usual night streets.", price: 0, swatch: ["#2b2f38", "#cba56c"] },
  { id: "moonlight", name: "Moonlight", blurb: "Cool silver-blue streets under a full moon.", price: 0, swatch: ["#26324a", "#b9cdf0"] },
  { id: "mars", name: "Mars", blurb: "Rust dust and red rock. Your city, a long way from Earth.", price: 50_000, swatch: ["#4a2416", "#ff8a4c"] },
  { id: "neon", name: "Neon", blurb: "Electric cyan streets, a city that never sleeps.", price: 50_000, swatch: ["#07303a", "#3ef0ff"] },
];

export function skinOf(id: unknown): SkinDef | null {
  return SKINS.find((s) => s.id === id) ?? null;
}

export function isSkinId(x: unknown): x is SkinId {
  return skinOf(x) !== null;
}

/** Free skins are always owned; paid ones need a `skin:<id>` row. */
export function skinOwned(id: SkinId, owned: readonly string[]): boolean {
  const s = skinOf(id);
  return Boolean(s && (s.price === 0 || owned.includes(id)));
}

/** The skin to draw: the chosen one if owned, else the default. A preview (any skin) wins while it lasts. */
export function skinShown(chosen: unknown, owned: readonly string[], preview?: SkinId | null): SkinId {
  if (preview && isSkinId(preview)) return preview;
  return isSkinId(chosen) && skinOwned(chosen, owned) ? chosen : "default";
}

export function cleanSkins(raw: unknown): SkinId[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter(isSkinId))].filter((id) => skinOf(id)!.price > 0);
}
