/**
 * 0.1.9 car paint. Paint cans are found (one car, one factory colour per can) and spent at a dealership to repaint
 * a car you own, for 10% of its price. Like 0.1.8 cars, the server keeps it all in its ledger, so nothing to migrate:
 *  - can:<source>  a found can, detail {car,color}; source is g:<grade nonce> (amber/red vault) or c:<day> (match cache)
 *  - paint:<can key>  that can spent on its car (detail {car,color}); the newest paint row per car is its colour.
 * The factory colour is the one the base art is painted in (no can needed to own it; a can of it repaints back).
 */
import { CARS, carOf, type CarId } from "./cars.ts";

export type PaintColor = { id: string; name: string; hex: string };

/** Six real factory colours per car; the first is the colour of the base sprite. */
export const CAR_COLORS: Record<CarId, readonly PaintColor[]> = {
  civic: [
    { id: "white", name: "White Orchid Pearl", hex: "#f2f1ec" },
    { id: "black", name: "Crystal Black Pearl", hex: "#1c1d22" },
    { id: "silver", name: "Lunar Silver", hex: "#a9adb2" },
    { id: "red", name: "Rallye Red", hex: "#c0141b" },
    { id: "blue", name: "Aegean Blue", hex: "#1f4f8f" },
    { id: "sig", name: "Energy Green", hex: "#5aa02c" },
  ],
  f150: [
    { id: "white", name: "Oxford White", hex: "#f3f3f0" },
    { id: "black", name: "Agate Black", hex: "#1a1b1e" },
    { id: "silver", name: "Iconic Silver", hex: "#a7abb0" },
    { id: "red", name: "Rapid Red", hex: "#9e1a1f" },
    { id: "blue", name: "Antimatter Blue", hex: "#1d2c4f" },
    { id: "sig", name: "Atlas Blue", hex: "#2e5f9a" },
  ],
  ioniq5: [
    { id: "white", name: "Atlas White", hex: "#eeeeea" },
    { id: "black", name: "Abyss Black Pearl", hex: "#1a1c22" },
    { id: "silver", name: "Cyber Gray", hex: "#8e9297" },
    { id: "red", name: "Ultimate Red", hex: "#a5161d" },
    { id: "blue", name: "Lucid Blue", hex: "#2f5d86" },
    { id: "sig", name: "Gravity Gold Matte", hex: "#a39270" },
  ],
  mustang: [
    { id: "silver", name: "Iconic Silver", hex: "#b4b8bd" },
    { id: "white", name: "Oxford White", hex: "#f3f3f0" },
    { id: "black", name: "Shadow Black", hex: "#18191c" },
    { id: "red", name: "Race Red", hex: "#c8141c" },
    { id: "blue", name: "Velocity Blue", hex: "#1f56b5" },
    { id: "sig", name: "Twister Orange", hex: "#e2581b" },
  ],
  belair57: [
    { id: "turquoise", name: "Tropical Turquoise", hex: "#2fb3ad" },
    { id: "black", name: "Onyx Black", hex: "#17181b" },
    { id: "silver", name: "Inca Silver", hex: "#a9aeb3" },
    { id: "red", name: "Matador Red", hex: "#b3141d" },
    { id: "blue", name: "Larkspur Blue", hex: "#5b86b8" },
    { id: "sig", name: "Coronado Yellow", hex: "#e8cf6a" },
  ],
  model3: [
    { id: "white", name: "Pearl White", hex: "#f2f2ef" },
    { id: "black", name: "Diamond Black", hex: "#16171a" },
    { id: "silver", name: "Quicksilver", hex: "#b8bbbf" },
    { id: "red", name: "Ultra Red", hex: "#b4121b" },
    { id: "blue", name: "Deep Blue Metallic", hex: "#1c3b78" },
    { id: "sig", name: "Stealth Grey", hex: "#4b4f56" },
  ],
  roadster: [
    { id: "white", name: "Arctic White", hex: "#f2f2ef" },
    { id: "black", name: "Obsidian Black", hex: "#17181b" },
    { id: "silver", name: "Silver", hex: "#a8acb1" },
    { id: "red", name: "Fusion Red", hex: "#b5141c" },
    { id: "blue", name: "Electric Blue", hex: "#1e5fc0" },
    { id: "sig", name: "Very Orange", hex: "#f06a12" },
  ],
  roadster2: [
    { id: "white", name: "Pearl White", hex: "#f4f4f2" },
    { id: "black", name: "Solid Black", hex: "#141518" },
    { id: "silver", name: "Quicksilver", hex: "#b9bcc0" },
    { id: "red", name: "Ultra Red", hex: "#b3121a" },
    { id: "blue", name: "Deep Blue", hex: "#1b3a7a" },
    { id: "sig", name: "Stealth Gray", hex: "#4a4e55" },
  ],
};

/** Odds a can drops: right answer on an amber / red vault, and the daily match cache. */
export const CAN_ODDS = { amber: 0.08, red: 0.15, cache: 0.2 } as const;

/** Painting costs 10% of the car's price. */
export function paintPrice(car: CarId): number {
  return Math.round((carOf(car)?.price ?? 0) * 0.1);
}

export function factoryColor(car: CarId): string {
  return CAR_COLORS[car][0]!.id;
}

export function colorOf(car: CarId, color: string): PaintColor | null {
  return CAR_COLORS[car]?.find((c) => c.id === color) ?? null;
}

export type Can = { car: CarId; color: string };

/** A can as one string ("civic:red"), for saves and the wire. */
export const canId = (c: Can) => `${c.car}:${c.color}`;
export function parseCan(s: unknown): Can | null {
  if (typeof s !== "string") return null;
  const [car, color] = s.split(":");
  const c = carOf(car);
  return c && color && colorOf(c.id, color) ? { car: c.id, color } : null;
}

/** One uniform pick over every car's colours (r in [0,1)). */
export function rollCan(r: number): Can {
  const all = CARS.flatMap((c) => CAR_COLORS[c.id].map((p) => ({ car: c.id, color: p.id })));
  return all[Math.min(all.length - 1, Math.floor(r * all.length))]!;
}

/** Sprite for a car in a colour (the factory colour is the base art). */
export function carSprite(car: CarId, view: "side" | "front" | "back", color?: string | null): string {
  return !color || color === factoryColor(car) ? `/sprites/cars/${car}-${view}.png` : `/sprites/cars/paint/${car}-${color}-${view}.png`;
}
