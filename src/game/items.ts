import { TIER_LABEL } from "./data";
import type { Tier } from "./types";

export const TIERS: Tier[] = ["white", "blue", "green", "amber", "red", "violet"];

export type MaterialId = "brass" | "ink" | "vellum" | "schematic";
export type ExtraId = "crate" | "satchel" | "coin";
export type ItemId = Tier | MaterialId | ExtraId;

export const MATERIALS: Record<
  MaterialId,
  { id: MaterialId; name: string; blurb: string; src: string }
> = {
  brass: {
    id: "brass",
    name: "Brass",
    blurb: "Metal from vaults. Spend it at the outfitter shop.",
    src: "/sprites/items/brass.webp",
  },
  ink: {
    id: "ink",
    name: "Ink",
    blurb: "Ink from vaults. Some shop items need it.",
    src: "/sprites/items/ink.webp",
  },
  vellum: {
    id: "vellum",
    name: "Vellum",
    blurb: "Paper from vaults. Some shop items need it.",
    src: "/sprites/items/vellum.webp",
  },
  schematic: {
    id: "schematic",
    name: "Schematic",
    blurb: "A rare plan from vaults. Night glass can use one in place of press stock.",
    src: "/sprites/items/schematic.webp",
  },
};

export const MATERIAL_LIST = Object.values(MATERIALS);

export const KEY_BLURB: Record<Tier, string> = {
  white: "A common key. Opens white vaults — corners, parks, small markers.",
  blue: "The workhorse. Most civic and museum vaults take blue.",
  green: "A verdant key. Theatres, stadiums, and older houses.",
  amber: "Warm stock. High landmarks and the harder questions.",
  red: "Scarce. Civic crowns and capitol granite.",
  violet: "The rarest key. Night marks, if you ever find one.",
};

export function isTier(id: string): id is Tier {
  return (TIERS as string[]).includes(id);
}

export function isMaterial(id: string): id is MaterialId {
  return id in MATERIALS;
}

export function itemSrc(id: ItemId): string {
  if (isTier(id)) return `/sprites/keys/${id}.webp`;
  if (isMaterial(id)) return MATERIALS[id].src;
  if (id === "crate") return "/sprites/items/crate.webp";
  if (id === "coin") return "/sprites/items/coin.webp";
  return "/sprites/items/satchel.webp";
}

export function itemName(id: ItemId): string {
  if (isTier(id)) return `${TIER_LABEL[id]} key`;
  if (isMaterial(id)) return MATERIALS[id].name;
  if (id === "crate") return "Daily crate";
  if (id === "coin") return "Coin";
  return "Satchel";
}

export function itemBlurb(id: ItemId): string {
  if (isTier(id)) return KEY_BLURB[id];
  if (isMaterial(id)) return MATERIALS[id].blurb;
  if (id === "crate") return "A morning box from the print shop. Login days stack to 30. One missed day is forgiven.";
  if (id === "coin") return "Struck for a right answer. The ward pays in brass, not crypto.";
  return "Your field bag. Keys and paint live here.";
}
