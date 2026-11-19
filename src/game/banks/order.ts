/** SERVER ONLY. Imported by banks/formats and server grading; never by UI code. */
import { createHmac } from "node:crypto";
import type { FormatQ, Tier } from "../types.ts";
export type OrderCard = Extract<FormatQ, { kind: "order" }>;

/** Capitalised name words of a label ("Berlin Wall falls" -> Berlin, Wall), ignoring any "(…)" qualifier. */
function nameWords(label: string): string[] {
  return (label.replace(/\([^)]*\)/g, " ").match(/\p{Lu}[\p{L}\p{N}]{2,}/gu) ?? []);
}
const hasWord = (text: string, word: string) => new RegExp(`(?<![\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "u").test(text);

/**
 * Years: >=10 years apart. Other units: >=5% of the greater absolute magnitude (floor 1).
 * `dropped` are labels authored for the set but not dealt on this card (green deals three of four): the fact shown
 * after grading must not name any of them, nor count more items than the card deals.
 */
export function validateOrder(c: OrderCard, dropped: readonly string[] = []): void {
  if (!["history", "geography", "science", "math"].includes(c.cat)) throw new Error("order field");
  const count = c.rarity === "green" ? 3 : c.rarity === "amber" || c.rarity === "red" ? 4 : 0;
  if (!count || c.items.length !== count || new Set(c.items.map((x) => x.label)).size !== count) throw new Error("order items");
  const keys = c.items.map((x) => x.key).sort((a, b) => a - b);
  if (keys.some((k) => !Number.isFinite(k))) throw new Error("order key");
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]!, b = keys[i]!;
    if (b <= a || b - a < (c.gap === "years" ? 10 : 0.05 * Math.max(1, Math.abs(a), Math.abs(b)))) throw new Error("order gap");
  }
  const dealt = new Set(c.items.flatMap((x) => nameWords(x.label)));
  for (const label of dropped) {
    if (c.items.some((x) => x.label === label)) continue;
    if (c.fact.includes(label) || nameWords(label).some((w) => !dealt.has(w) && hasWord(c.fact, w))) throw new Error("order fact names an item that is not dealt");
  }
  const said = /\b(?:these|all|the) (two|three|four|five|six)\b/i.exec(c.fact)?.[1]?.toLowerCase();
  if (said && ["two", "three", "four", "five", "six"].indexOf(said) + 2 !== count) throw new Error("order fact counts the wrong number of items");
}

/** Secret HMAC of deal nonce + label. No key, position, or answer mapping in the signed deal body. */
export function orderItems(c: OrderCard, secret: string, nonce: string) {
  return c.items.map(({ label }) => ({ label, token: createHmac("sha256", secret).update(JSON.stringify(["order173", nonce, c.id, label])).digest("base64url").slice(0, 24) }));
}
export function orderScore(c: OrderCard, secret: string, nonce: string, submitted: unknown): "exact" | "swap" | "miss" {
  const tokens = orderItems(c, secret, nonce);
  if (!Array.isArray(submitted) || submitted.length !== tokens.length || new Set(submitted).size !== tokens.length || submitted.some((t) => typeof t !== "string" || !tokens.some((x) => x.token === t))) return "miss";
  const correct = [...c.items].sort((a, b) => a.key - b.key).map((x) => tokens.find((t) => t.label === x.label)!.token);
  const wrong = correct.flatMap((t, i) => submitted[i] === t ? [] : [i]);
  if (!wrong.length) return "exact";
  if (wrong.length === 2 && wrong[1] === wrong[0]! + 1 && submitted[wrong[0]!] === correct[wrong[1]!] && submitted[wrong[1]!] === correct[wrong[0]!]) return "swap";
  return "miss";
}
export const orderLabels = (c: OrderCard) => [...c.items].sort((a, b) => a.key - b.key).map((x) => x.label);

type Seed = [string, OrderCard["cat"], string, OrderCard["gap"], [string, number][], string];
const SEEDS: Seed[] = [
  ["documents", "history", "Earliest → latest · US documents", "years", [["Declaration of Independence",1776],["Monroe Doctrine",1823],["Emancipation Proclamation",1863],["Civil Rights Act",1964]], "The Declaration predates the Monroe Doctrine by 47 years."],
  ["amendments", "history", "Earliest → latest · US amendments ratified", "years", [["Bill of Rights",1791],["13th Amendment",1865],["19th Amendment",1920],["26th Amendment",1971]], "The 26th Amendment lowered the voting age to 18."],
  ["space", "history", "Earliest → latest · space milestones", "years", [["Sputnik 1 launch",1957],["Apollo 11 landing",1969],["First Space Shuttle launch",1981],["First ISS crew arrives",2000]], "The first resident ISS crew arrived in November 2000."],
  ["exploration", "history", "Earliest → latest · voyages", "years", [["Columbus reaches the Caribbean",1492],["Magellan expedition returns",1522],["Mayflower reaches New England",1620],["Cook's first voyage begins",1768]], "Magellan died before his expedition completed its circumnavigation."],
  ["inventions", "history", "Earliest → latest · technology milestones", "years", [["Watt's steam-engine patent",1769],["Bell's telephone patent",1876],["Wright brothers' powered flight",1903],["First transistor demonstrated",1947]], "The first transistor was demonstrated at Bell Labs in 1947."],
  ["britain", "history", "Earliest → latest · British history", "years", [["Norman conquest",1066],["Magna Carta sealed",1215],["Great Fire of London",1666],["Battle of Waterloo",1815]], "Magna Carta was sealed at Runnymede in 1215."],
  ["world", "history", "Earliest → latest · world events", "years", [["Fall of Constantinople",1453],["French Revolution begins",1789],["First World War begins",1914],["Berlin Wall falls",1989]], "The French Revolution began 336 years after Constantinople fell."],
  ["us", "history", "Earliest → latest · US milestones", "years", [["Louisiana Purchase",1803],["California becomes a state",1850],["Alaska Purchase",1867],["Hawaii becomes a state",1959]], "Hawaii became the 50th state in 1959."],
  ["transport", "history", "Earliest → latest · transport openings", "years", [["Stockton–Darlington Railway",1825],["London Underground",1863],["Panama Canal",1914],["Channel Tunnel",1994]], "The London Underground opened with steam trains in 1863."],
  ["ancient", "history", "Earliest → latest · ancient Mediterranean", "years", [["First recorded ancient Olympics",-776],["Battle of Marathon",-490],["Alexander dies",-323],["Julius Caesar assassinated",-44]], "BCE dates count down toward the Common Era."],
  ["continents", "geography", "Smallest → largest · continent area", "relative", [["Australia (continent)",7.7],["Antarctica",14.2],["Africa",30.4],["Asia",44.6]], "Asia is the largest continent; these areas are in millions of square kilometres."],
  ["countries", "geography", "Smallest → largest · country total area", "relative", [["Japan",377975],["India",3287263],["Australia (country)",7741220],["Russia",17098242]], "Russia has the world's largest total country area."],
  ["islands", "geography", "Smallest → largest · island area", "relative", [["Great Britain",209331],["Madagascar",587041],["Borneo",743330],["Greenland",2166086]], "Borneo is more than three times the area of Great Britain."],
  ["oceans", "geography", "Smallest → largest · ocean area", "relative", [["Arctic Ocean",15.6],["Indian Ocean",70.6],["Atlantic Ocean",85.1],["Pacific Ocean",168.7]], "The Pacific is the largest ocean; areas here are millions of square kilometres."],
  ["north", "geography", "North → south · capital cities", "relative", [["Reykjavík",-64.15],["London",-51.51],["Cairo",-30.04],["Canberra",35.28]], "Reykjavík lies farthest north; Canberra lies in the Southern Hemisphere."],
  ["equator", "geography", "North → south · world cities", "relative", [["Oslo",-59.91],["Rome",-41.90],["Singapore",-1.35],["Cape Town",33.92]], "Singapore is just north of the equator."],
  ["mountains", "geography", "Lowest → highest · summits above sea level", "relative", [["Ben Nevis",1345],["Mount Fuji",3776],["Kilimanjaro",5895],["Mount Everest",8849]], "Everest's summit is about 8,849 metres above sea level."],
  ["lakes", "geography", "Shallowest → deepest · lake maximum depth", "relative", [["Lake Erie",64],["Lake Superior",406],["Lake Tanganyika",1470],["Lake Baikal",1642]], "Lake Baikal has the greatest maximum depth of any lake."],
  ["rivers", "geography", "Shortest → longest · rivers", "relative", [["Thames",346],["Rhine",1230],["Danube",2850],["Nile",6650]], "River lengths vary by measurement, but these rivers are widely separated."],
  ["states", "geography", "Smallest → largest · US state total area", "relative", [["Rhode Island",4001],["Florida",170312],["Texas",695662],["Alaska",1723337]], "Alaska is more than twice Texas's total area."],
  ["orbits", "science", "Nearest → farthest · planets from the Sun", "relative", [["Mercury",0.387],["Earth",1],["Jupiter",5.203],["Neptune",30.07]], "Mean orbital distances are measured in astronomical units; Earth is about one AU."],
  ["radii", "science", "Smallest → largest · planet mean radius", "relative", [["Mars",3389.5],["Venus",6051.8],["Uranus",25362],["Saturn",58232]], "Uranus's mean radius is more than four times that of Venus."],
  ["years", "science", "Shortest → longest · planetary year", "relative", [["Venus",225],["Mars",687],["Saturn",10759],["Neptune",60190]], "Neptune takes about 165 Earth years to orbit the Sun."],
  ["melting", "science", "Lowest → highest · metal melting point (°C)", "relative", [["Tin",231.93],["Aluminium",660.32],["Copper",1084.62],["Tungsten",3422]], "Tungsten has the highest melting point of any metal."],
  ["atomic", "science", "Smallest → largest · atomic number", "relative", [["Helium",2],["Carbon",6],["Iron",26],["Gold",79]], "Atomic number counts the protons in an atom's nucleus."],
  ["density", "science", "Lowest → highest · metal density", "relative", [["Lithium",0.534],["Magnesium",1.74],["Zinc",7.134],["Osmium",22.587]], "Osmium is among the densest elements; densities here are grams per cubic centimetre."],
  ["boiling", "science", "Lowest → highest · boiling point (K)", "relative", [["Helium (boiling)",4.22],["Nitrogen (boiling)",77.36],["Water (boiling)",373.15],["Iron (boiling)",3134]], "At standard pressure, water boils at 373.15 kelvin."],
  ["moons", "science", "Smallest → largest · moon mean radius", "relative", [["Phobos",11.1],["Europa",1560.8],["Moon",1737.4],["Ganymede",2634.1]], "Earth's Moon is slightly larger than Europa."],
  ["spectrum", "science", "Shortest → longest · electromagnetic wavelength", "relative", [["Gamma rays (representative)",0.0001],["X-rays (representative)",0.1],["Visible light (representative)",500],["Radio waves (representative)",1000000000]], "Gamma rays have shorter wavelengths than X-rays; visible light lies before radio waves."],
  ["masses", "science", "Lightest → heaviest · planet mass", "relative", [["Mercury (mass)",0.0553],["Mars (mass)",0.107],["Earth (mass)",1],["Jupiter (mass)",317.8]], "Jupiter has about 318 times Earth's mass."],
];
export const ORDER_CARDS: OrderCard[] = SEEDS.map(([id, cat, q, gap, pairs, fact], i) => {
  const rarity = (["green", "amber", "red"] as const)[i % 3]!;
  // Green deals the first three authored items; amber and red deal all four.
  const c: OrderCard = { kind: "order", id: `order-${id}`, q, gap, cat, fact, rarity, diff: rarity === "green" ? 1 : rarity === "amber" ? 2 : 3, items: pairs.slice(0, rarity === "green" ? 3 : 4).map(([label, key]) => ({ label, key })) };
  validateOrder(c, pairs.map(([label]) => label));
  return c;
});

/** mulberry32: a small seeded PRNG, so the pool is identical on every server and across restarts. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const MATH_SEED = { green: 0x173a, amber: 0x173b, red: 0x173c } as const;
/** Operand pools per tier: [a low, a high, b low, b high] (inclusive). */
const MATH_POOL = { green: [12, 89, 12, 89], amber: [3, 24, 3, 24], red: [6, 24, 10, 420] } as const;

/** Both operands of a generated label, e.g. "17² − 120" -> [17, 120]. */
export function mathOperands(label: string): [number, number] {
  const m = /^(\d+)(?:²)? [+×−] (\d+)$/.exec(label);
  if (!m) throw new Error("order math label");
  return [Number(m[1]), Number(m[2])];
}
const monotone = (xs: readonly number[]) => xs.every((x, i) => i === 0 || x >= xs[i - 1]!) || xs.every((x, i) => i === 0 || x <= xs[i - 1]!);

/**
 * True when a generated card's answer can be read off one operand: with the items in answer order, the first or
 * the second operands run straight up or straight down. The generator never emits such a card.
 */
export function mathOrderLeaks(c: OrderCard): boolean {
  const ops = [...c.items].sort((x, y) => x.key - y.key).map((x) => mathOperands(x.label));
  return monotone(ops.map((o) => o[0])) || monotone(ops.map((o) => o[1]));
}

/**
 * Deterministic math pool: green sums, amber products, red squares minus an integer. Operands are drawn from seeded
 * pools independently of rank, and a set is kept only when it passes validateOrder and neither operand sorts the
 * answer (mathOrderLeaks). The first `count` cards never depend on `count`.
 */
export function generateOrder(tier: Tier, count = 40): OrderCard[] {
  if (tier !== "green" && tier !== "amber" && tier !== "red") return [];
  const n = tier === "green" ? 3 : 4;
  const [aLo, aHi, bLo, bHi] = MATH_POOL[tier];
  const rand = seeded(MATH_SEED[tier]);
  const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  const used = new Set<string>();
  const out: OrderCard[] = [];
  for (let tries = 0; out.length < count; tries++) {
    if (tries > count * 4000) throw new Error("order math pool exhausted");
    const items: OrderCard["items"] = [];
    for (let j = 0; j < n; j++) {
      const a = int(aLo, aHi), b = int(bLo, bHi);
      items.push(tier === "green" ? { label: `${a} + ${b}`, key: a + b } : tier === "amber" ? { label: `${a} × ${b}`, key: a * b } : { label: `${a}² − ${b}`, key: a * a - b });
    }
    if (items.some((x) => x.key <= 0)) continue;
    const c: OrderCard = { kind: "order", id: `order-math-${tier}-${out.length}`, q: "Smallest → largest", items, gap: "relative", cat: "math", rarity: tier, diff: tier === "green" ? 1 : tier === "amber" ? 2 : 3, fact: "Evaluate each expression first, then compare the values." };
    try {
      validateOrder(c);
    } catch {
      continue;
    }
    if (mathOrderLeaks(c)) continue;
    const sig = items.map((x) => x.label).sort().join("|");
    if (used.has(sig)) continue;
    used.add(sig);
    out.push(c);
  }
  return out;
}
export const generatedOrder = () => (["green", "amber", "red"] as const).flatMap((t) => generateOrder(t));
