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
    blurb: "Metal from lamps. Spend it at the outfitter shop.",
    src: "/sprites/items/brass.png",
  },
  ink: {
    id: "ink",
    name: "Ink",
    blurb: "Ink from lamps. Some shop items need it.",
    src: "/sprites/items/ink.png",
  },
  vellum: {
    id: "vellum",
    name: "Vellum",
    blurb: "Paper from lamps. Some shop items need it.",
    src: "/sprites/items/vellum.png",
  },
  schematic: {
    id: "schematic",
    name: "Schematic",
    blurb: "A rare plan from lamps. Night glass can use one in place of press stock.",
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

export function isTier(id: string): id is Tier {
  return (TIERS as string[]).includes(id);
}

export function isMaterial(id: string): id is MaterialId {
  return id in MATERIALS;
}

export function itemSrc(id: ItemId): string {
  if (isTier(id)) return `/sprites/matches/${id}.png`;
  if (isMaterial(id)) return MATERIALS[id].src;
  if (id === "crate") return "/sprites/items/crate.png";
  if (id === "coin") return "/sprites/items/coin.png";
  return "/sprites/items/satchel.png";
}

export function itemName(id: ItemId): string {
  if (isTier(id)) return `${TIER_LABEL[id]} match`;
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
  return "Your field bag. Matches and paint live here.";
}
