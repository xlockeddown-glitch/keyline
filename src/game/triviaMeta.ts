import { pinCats } from "./place";
import type { Poi, TriviaCat } from "./types";

/**
 * 0.0.53: the client-safe half of trivia.ts — field names, labels, multipliers and the per-lamp field offer.
 * No cards and no answers: the bank (trivia.ts, banks/*, doorQuizzes.ts) is server-only now and the browser
 * gets one card at a time from triviaApi.ts. trivia.ts re-exports all of this for the scripts and tests.
 */
export const TRIVIA_CATS: { id: TriviaCat; label: string; blurb: string }[] = [
  { id: "sports", label: "Sports", blurb: "Clubs, stadiums, scores of record." },
  { id: "local", label: "Local", blurb: "This city and its state — streets, landmarks, the ward." },
  { id: "political", label: "Political", blurb: "Capitals, councils, who holds the keys." },
  { id: "food", label: "Food", blurb: "Tables, smoke, the city's appetite." },
  { id: "arts", label: "Arts", blurb: "Stages, walls, songs that stuck." },
  { id: "math", label: "Math", blurb: "Numbers. White is arithmetic. Higher lamps bite." },
  { id: "science", label: "Science", blurb: "Earth, sky, the stuff of the lab." },
  { id: "history", label: "History", blurb: "Years, wars, who wrote the plate." },
  { id: "nature", label: "Nature", blurb: "Woods, water, the living street." },
  {
    id: "games",
    label: "Video games",
    blurb: "Cartridges, consoles, the names on the title screen.",
  },
  { id: "celebrity", label: "Celebrity", blurb: "Screens, stages, the names everyone knows." },
];
export const ALL_CATS: TriviaCat[] = TRIVIA_CATS.map((c) => c.id);
export const DIFF_LABEL = {
  1: "Easy",
  2: "Standard",
  3: "Hard",
};
export const DIFF_MULT = {
  1: 0.7,
  2: 1,
  3: 1.45,
};
/** How many seen card ids a save keeps for anti-repeat (sent to the server with each deal). */
export const ASKED_KEEP = 2400;

export function offerCats(poiId: string, vaultsOpened: number, n = 6, poi?: Poi): TriviaCat[] {
  let h = 2166136261;
  const seed = `${poiId}#${vaultsOpened}`;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const arr = [...ALL_CATS];
  for (let i = arr.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    const j = Math.abs(h) % (i + 1);
    const a = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = a;
  }
  const order = poi ? [...pinCats(poi), ...arr.filter((c) => !pinCats(poi).includes(c))] : arr;
  // 0.0.42: Math is about a quarter of the deck, and left alone it sat on ~44% of lamps. A lamp
  // keeps its Math offer only MATH_OFFER_KEEP of the time (same seed, so the offer never flickers);
  // the next field slides in. Math then comes up on under 20% of lamps, so even a player who picks
  // it every time it's offered gets under 20% math. No cards are removed.
  const drop = !keepsMath(seed);
  return (drop ? order.filter((c) => c !== "math") : order).slice(0, n);
}

/** Share of lamps that keep a Math offer. See offerCats; trivia:quotas checks the result. */
export const MATH_OFFER_KEEP = 0.45;

function keepsMath(seed: string): boolean {
  let h = 0x811c9dc5;
  const s = `${seed}#math`;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296 < MATH_OFFER_KEEP;
}
