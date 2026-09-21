import { CHARMS, TIER_LABEL } from "./data";
import type { CharmId, Tier } from "./types";

export const TIERS: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];

export type MaterialId = "brass" | "ink" | "vellum" | "schematic";
export type ExtraId = "crate" | "satchel" | "coin";
export type ItemId = Tier | MaterialId | CharmId | ExtraId;

export const MATERIALS: Record<
  MaterialId,
  { id: MaterialId; name: string; blurb: string; src: string }
> = {
  brass: {
    id: "brass",
    name: "Brass",
    blurb: "Stamped blanks from the print shop. Pays for clips, straps, and fittings.",
    src: "/sprites/items/brass.png",
  },
  ink: {
    id: "ink",
    name: "Ink",
    blurb: "Carbon black in a stopper bottle. Recipes that rewrite a lamp need it.",
    src: "/sprites/items/ink.png",
  },
  vellum: {
    id: "vellum",
    name: "Vellum",
    blurb: "Scraped hide, dry and loud. Good for straps and field notes.",
    src: "/sprites/items/vellum.png",
  },
  schematic: {
    id: "schematic",
    name: "Schematic",
    blurb: "A printed working. One per charm. Rare in the higher lamps.",
    src: "/sprites/items/schematic.png",
  },
};

export const MATERIAL_LIST = Object.values(MATERIALS);

export const KEY_BLURB: Record<Tier, string> = {
  white: "A common match. Lights white lamps — corners, parks, small markers.",
  blue: "The workhorse. Most civic and museum lamps take blue.",
  green: "A verdant match. Theatres, stadiums, and older houses.",
  amber: "Warm stock. High landmarks and the harder questions.",
  red: "Scarce. Civic crowns and capitol granite.",
  violet: "The rarest match. Night marks, if you ever find one.",
};

const CHARM_SRC: Record<CharmId, string> = {
  scholar: "/sprites/items/scholar.png",
  sprinter: "/sprites/items/sprinter.png",
  lantern: "/sprites/vault.png",
  lucky: "/sprites/items/lucky.png",
};

export function isTier(id: string): id is Tier {
  return (TIERS as string[]).includes(id);
}

export function isCharm(id: string): id is CharmId {
  return id in CHARMS;
}

export function isMaterial(id: string): id is MaterialId {
  return id in MATERIALS;
}

export function itemSrc(id: ItemId): string {
  if (isTier(id)) return "/sprites/key.png";
  if (isMaterial(id)) return MATERIALS[id].src;
  if (isCharm(id)) return CHARM_SRC[id];
  if (id === "crate") return "/sprites/items/crate.png";
  if (id === "coin") return "/sprites/items/coin.png";
  return "/sprites/items/satchel.png";
}

export function itemName(id: ItemId): string {
  if (isTier(id)) return `${TIER_LABEL[id]} match`;
  if (isMaterial(id)) return MATERIALS[id].name;
  if (isCharm(id)) return CHARMS[id].name;
  if (id === "crate") return "Daily crate";
  if (id === "coin") return "Coin";
  return "Satchel";
}

export function itemBlurb(id: ItemId): string {
  if (isTier(id)) return KEY_BLURB[id];
  if (isMaterial(id)) return MATERIALS[id].blurb;
  if (isCharm(id)) return CHARMS[id].blurb;
  if (id === "crate") return "A morning box from the print shop. Login days stack to 30. One missed day is forgiven.";
  if (id === "coin") return "Struck for a right answer. The ward pays in brass, not crypto.";
  return "Your field bag. Matches, stock, and printed charms live here.";
}
