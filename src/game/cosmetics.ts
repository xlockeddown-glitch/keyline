/**
 * 0.0.45 print shop: cosmetic coats and lantern skins, paid for in white and blue matches.
 *
 * Purely visual. A coat repaints the walker's own coat (scripted palette variants of each character's
 * walk / idle / side-idle sheets, public/sprites/coats); a lantern skin re-cases every street vault in
 * another metal (face, side, trim, bar and bolts — the dial glyph, numeral and key slot keep their tier
 * colour, so a skin never hides which key a vault takes). No perk, no coin, no pace.
 *
 * Prices are matches only, never coin, and are paid in instalments: the print shop keeps what has been
 * paid against each item, so a pocket that tops out at a few matches can still save up for a dear one,
 * and paying in frees the pocket for more street matches. Paid matches stay against their item.
 */
import type { Tier } from "./types";

export type CoatId = "oilskin" | "bottle" | "oxblood" | "plum";
export type LanternSkinId = "copper" | "iron" | "verdigris" | "nickel";
export type CosmeticId = CoatId | LanternSkinId;
export type CosmeticSlot = "coat" | "lantern";
export type Price = { white: number; blue: number; legacy?: boolean };
/** Set on a stored instalment. Missing means it was started before 0.1.137 and finishes at `LEGACY_PRICE`. */
type StoredPrice = Price;

export type Cosmetic = {
  id: CosmeticId;
  slot: CosmeticSlot;
  name: string;
  blurb: string;
  price: Price;
  /** Swatch for the catalogue chip (the coat's mid tone / the skin's cap metal). */
  swatch: string;
};

/** Ladder A coin value (white 30, blue 90) — only used to explain and order prices, never to pay. */
const VALUE: Record<"white" | "blue", number> = { white: 30, blue: 90 };

export const LANTERN_SKINS: Record<LanternSkinId, Cosmetic> = {
  copper: {
    id: "copper",
    slot: "lantern",
    name: "Copper Lamp",
    blurb: "Warm copper on every street vault. The dial, numeral and slot keep the key's color.",
    price: { white: 10, blue: 0 },
    swatch: "#c8754e",
  },
  iron: {
    id: "iron",
    slot: "lantern",
    name: "Wrought Iron",
    blurb: "Blackened iron case and bolts. The dial keeps its color.",
    price: { white: 12, blue: 6 },
    swatch: "#55585e",
  },
  verdigris: {
    id: "verdigris",
    slot: "lantern",
    name: "Verdigris",
    blurb: "Soft green patina on the case. The dial keeps its color.",
    price: { white: 8, blue: 12 },
    swatch: "#5f9e88",
  },
  nickel: {
    id: "nickel",
    slot: "lantern",
    name: "Nickel Plate",
    blurb: "Bright plated case and bolts. The dial keeps its color.",
    price: { white: 0, blue: 20 },
    swatch: "#c4c9cf",
  },
};

export const COATS: Record<CoatId, Cosmetic> = {
  oilskin: {
    id: "oilskin",
    slot: "coat",
    name: "Oilskin Slicker",
    blurb: "Waxed mustard rain gear. Same cut, same pockets, brighter on a gray street.",
    price: { white: 20, blue: 0 },
    swatch: "#a8862a",
  },
  bottle: {
    id: "bottle",
    slot: "coat",
    name: "Bottle-Green Duster",
    blurb: "Deep bottle green, dyed through.",
    price: { white: 12, blue: 10 },
    swatch: "#2f5f45",
  },
  oxblood: {
    id: "oxblood",
    slot: "coat",
    name: "Oxblood Greatcoat",
    blurb: "Dark red wool, the color of an old ledger binding.",
    price: { white: 8, blue: 16 },
    swatch: "#6e2f28",
  },
  plum: {
    id: "plum",
    slot: "coat",
    name: "Plum Frock Coat",
    blurb: "Plum dye, the dearest vat in the shop.",
    price: { white: 0, blue: 24 },
    swatch: "#5a3150",
  },
};

/** Catalogue order: cheapest first in each slot, lantern skins then coats. */
export const CATALOGUE: Cosmetic[] = [
  ...Object.values(LANTERN_SKINS).sort((a, b) => priceCoin(a.price) - priceCoin(b.price)),
  ...Object.values(COATS).sort((a, b) => priceCoin(a.price) - priceCoin(b.price)),
];

export const COSMETIC_IDS = CATALOGUE.map((c) => c.id);

export function cosmetic(id: string): Cosmetic | null {
  return (COATS as Record<string, Cosmetic>)[id] ?? (LANTERN_SKINS as Record<string, Cosmetic>)[id] ?? null;
}

export function isCoat(id: unknown): id is CoatId {
  return typeof id === "string" && id in COATS;
}

export function isLanternSkin(id: unknown): id is LanternSkinId {
  return typeof id === "string" && id in LANTERN_SKINS;
}

export function priceCoin(p: Price): number {
  return p.white * VALUE.white + p.blue * VALUE.blue;
}

/**
 * 0.1.137: prices before this retune. An instalment already stored (no `legacy: false`)
 * finishes here. A purchase started after the retune is marked `legacy: false` and uses
 * the catalogue price. Copper did not change.
 */
const LEGACY_PRICE: Partial<Record<CosmeticId, Price>> = {
  iron: { white: 8, blue: 2 },
  verdigris: { white: 6, blue: 4 },
  nickel: { white: 0, blue: 8 },
  oilskin: { white: 15, blue: 0 },
  bottle: { white: 10, blue: 4 },
  oxblood: { white: 8, blue: 6 },
  plum: { white: 4, blue: 10 },
};

function onOldPrice(id: CosmeticId, paid: StoredPrice | undefined): boolean {
  if (!paid || paid.legacy === false || !LEGACY_PRICE[id]) return false;
  return paid.white + paid.blue > 0;
}

/** The price this wardrobe actually owes for `id` (old, if an instalment was already started). */
export function quotePrice(w: Pick<Wardrobe, "paid">, id: CosmeticId): Price {
  const c = cosmetic(id);
  if (!c) return { white: 0, blue: 0 };
  return onOldPrice(id, w.paid[id]) ? LEGACY_PRICE[id]! : c.price;
}

export type Wardrobe = {
  owned: CosmeticId[];
  /** Matches already paid toward items not yet owned. */
  paid: Partial<Record<CosmeticId, Price>>;
  coat: CoatId | null;
  lantern: LanternSkinId | null;
  /** When the equipped pair last changed (ms); the newer side wins a merge. */
  at: number;
};

export const EMPTY_WARDROBE: Wardrobe = { owned: [], paid: {}, coat: null, lantern: null, at: 0 };

/** What is still owed on an item (zero once owned). */
export function owing(w: Wardrobe, id: CosmeticId): Price {
  const c = cosmetic(id);
  if (!c || w.owned.includes(id)) return { white: 0, blue: 0 };
  const price = quotePrice(w, id);
  const p = w.paid[id] ?? { white: 0, blue: 0 };
  return { white: Math.max(0, price.white - p.white), blue: Math.max(0, price.blue - p.blue) };
}

/** What one "Pay in" takes from this pocket right now: as much of what is owed as the pocket holds. */
export function payable(w: Wardrobe, keys: Pick<Record<Tier, number>, "white" | "blue">, id: CosmeticId): Price {
  const o = owing(w, id);
  return { white: Math.min(o.white, Math.max(0, keys.white ?? 0)), blue: Math.min(o.blue, Math.max(0, keys.blue ?? 0)) };
}

export type PayResult = { wardrobe: Wardrobe; keys: Record<Tier, number>; took: Price; done: boolean; left: Price };

/**
 * Pay what the pocket can toward an item. Finishing the price makes it owned and puts it on (the
 * player just bought it to wear it); `at` moves so the new look wins a merge. Null if nothing moves.
 */
export function payIn(w: Wardrobe, keys: Record<Tier, number>, id: CosmeticId, now: number): PayResult | null {
  const c = cosmetic(id);
  if (!c || w.owned.includes(id)) return null;
  const took = payable(w, keys, id);
  if (took.white + took.blue <= 0) return null;
  const before: StoredPrice = w.paid[id] ?? { white: 0, blue: 0 };
  const legacy = onOldPrice(id, before);
  const price = legacy ? LEGACY_PRICE[id]! : c.price;
  const after: StoredPrice = {
    white: before.white + took.white,
    blue: before.blue + took.blue,
    ...(LEGACY_PRICE[id] ? { legacy } : {}),
  };
  const nextKeys = { ...keys, white: keys.white - took.white, blue: keys.blue - took.blue };
  const done = after.white >= price.white && after.blue >= price.blue;
  const paid = { ...w.paid };
  if (done) delete paid[id];
  else paid[id] = after;
  const wardrobe: Wardrobe = done
    ? {
        owned: [...w.owned, id],
        paid,
        coat: c.slot === "coat" ? (id as CoatId) : w.coat,
        lantern: c.slot === "lantern" ? (id as LanternSkinId) : w.lantern,
        at: now,
      }
    : { ...w, paid };
  return { wardrobe, keys: nextKeys, took, done, left: owing(wardrobe, id) };
}

/** Put an owned item on, or take a slot off with null. Null if the item isn't owned or nothing changes. */
export function wear(w: Wardrobe, slot: CosmeticSlot, id: CosmeticId | null, now: number): Wardrobe | null {
  if (id !== null) {
    const c = cosmetic(id);
    if (!c || c.slot !== slot || !w.owned.includes(id)) return null;
  }
  if (slot === "coat") {
    if (w.coat === id) return null;
    return { ...w, coat: id as CoatId | null, at: now };
  }
  if (w.lantern === id) return null;
  return { ...w, lantern: id as LanternSkinId | null, at: now };
}

const count = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

/** Any stored or posted shape → a valid wardrobe (unknown ids dropped, paid capped at the price). */
export function cleanWardrobe(raw: unknown): Wardrobe {
  if (!raw || typeof raw !== "object") return { ...EMPTY_WARDROBE, paid: {} };
  const r = raw as Partial<Record<keyof Wardrobe, unknown>>;
  const owned = Array.isArray(r.owned) ? [...new Set(r.owned.filter((id): id is CosmeticId => cosmetic(String(id)) !== null))] : [];
  const paid: Wardrobe["paid"] = {};
  if (r.paid && typeof r.paid === "object") {
    for (const [id, p] of Object.entries(r.paid as Record<string, unknown>)) {
      const c = cosmetic(id);
      if (!c || owned.includes(c.id) || !p || typeof p !== "object") continue;
      const raw = p as StoredPrice;
      const legacy = raw.legacy !== false && Boolean(LEGACY_PRICE[c.id]);
      const cap = legacy ? LEGACY_PRICE[c.id]! : c.price;
      const v: StoredPrice = {
        white: count(raw.white, cap.white),
        blue: count(raw.blue, cap.blue),
        ...(LEGACY_PRICE[c.id] ? { legacy } : {}),
      };
      if (v.white + v.blue > 0) paid[c.id] = v;
    }
  }
  const coat = isCoat(r.coat) && owned.includes(r.coat) ? r.coat : null;
  const lantern = isLanternSkin(r.lantern) && owned.includes(r.lantern) ? r.lantern : null;
  return { owned, paid, coat, lantern, at: count(r.at, Number.MAX_SAFE_INTEGER) };
}

/**
 * Two copies of one walker's wardrobe (this device and the server) → one. Ownership only grows
 * (union); instalments keep the larger payment per colour; the equipped pair comes from whichever
 * side changed it last. Commutative, so device and server converge whichever merges first.
 */
export function mergeWardrobe(a: Wardrobe, b: Wardrobe): Wardrobe {
  const A = cleanWardrobe(a);
  const B = cleanWardrobe(b);
  const owned = COSMETIC_IDS.filter((id) => A.owned.includes(id) || B.owned.includes(id));
  const paid: Wardrobe["paid"] = {};
  for (const id of COSMETIC_IDS) {
    if (owned.includes(id)) continue;
    const pa = A.paid[id];
    const pb = B.paid[id];
    if (!pa && !pb) continue;
    const legacy = [pa, pb].some((row) => row && (row as StoredPrice).legacy !== false);
    paid[id] = {
      white: Math.max(pa?.white ?? 0, pb?.white ?? 0),
      blue: Math.max(pa?.blue ?? 0, pb?.blue ?? 0),
      ...(LEGACY_PRICE[id] ? { legacy } : {}),
    };
  }
  // Newer equip wins; a tie is broken on the pair itself, so merge(a, b) and merge(b, a) agree.
  const look = (w: Wardrobe) => `${w.coat ?? ""}|${w.lantern ?? ""}`;
  const pick = A.at > B.at ? A : B.at > A.at ? B : look(A) >= look(B) ? A : B;
  return cleanWardrobe({ owned, paid, coat: pick.coat, lantern: pick.lantern, at: Math.max(A.at, B.at) });
}

/**
 * 0.1.137 wardrobe sync. `recorded` is the row the print op wrote. The device may change
 * what is worn. It cannot add an owned id or raise a paid count. Ids already recorded stay owned.
 * Wearing something the account does not own is ignored. Taking a slot off (null) is allowed.
 */
export function applyWardrobeSync(recorded: Wardrobe, posted: Wardrobe): Wardrobe {
  const server = cleanWardrobe(recorded);
  // Wear is checked against the recorded ownership, not the post's own list. A second
  // device may omit owned ids and still put on something the account already bought.
  const coat = posted.coat === null || (isCoat(posted.coat) && server.owned.includes(posted.coat)) ? posted.coat : server.coat;
  const lantern =
    posted.lantern === null || (isLanternSkin(posted.lantern) && server.owned.includes(posted.lantern)) ? posted.lantern : server.lantern;
  const wore = coat !== server.coat || lantern !== server.lantern;
  return cleanWardrobe({
    owned: server.owned,
    paid: server.paid,
    coat,
    lantern,
    at: wore ? Math.max(server.at + 1, posted.at || 0) : server.at,
  });
}

export function sameWardrobe(a: Wardrobe, b: Wardrobe): boolean {
  return JSON.stringify(cleanWardrobe(a)) === JSON.stringify(cleanWardrobe(b));
}

/** "3 white + 1 blue" / "10 white" / "8 blue". */
export function priceLine(p: Price): string {
  const parts: string[] = [];
  if (p.white) parts.push(`${p.white} white`);
  if (p.blue) parts.push(`${p.blue} blue`);
  return parts.join(" + ") || "nothing";
}
