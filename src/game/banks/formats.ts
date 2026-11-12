import { generateNear } from "../mathLadder.ts";
import type { FormatQ, Tier, TriviaCat } from "../types.ts";

/**
 * 0.1.158 street-lamp formats — SERVER-ONLY (imported from triviaBank.ts only; qa:no-answers checks the bundle).
 * Kept out of everyCard() on purpose: friend tickets, the audits and the four-choice picker never see these.
 *
 * True/False: 24 statements, 4 in each of six fields, white/blue/green only, always difficulty 1. Each has a fact;
 * sources are in docs/trivia-formats-sources.md. Closest Number: generated estimation sums (amber/red/violet math).
 */
type TfSeed = [id: string, cat: TriviaCat, rarity: Tier, q: string, answer: "True" | "False", fact: string];

const TF_SEED: TfSeed[] = [
  ["tf-sci-boil", "science", "white", "At sea level, pure water boils at about 100 °C.", "True", "At standard sea-level pressure water boils at about 100 °C (212 °F); higher up it boils cooler."],
  ["tf-sci-sound", "science", "white", "Sound travels faster than light.", "False", "Light covers about 300,000 km a second; sound in air manages about 343 metres."],
  ["tf-sci-ag", "science", "blue", "The chemical symbol for gold is Ag.", "False", "Gold is Au, from the Latin aurum. Ag (argentum) is silver."],
  ["tf-sci-venus", "science", "green", "Venus is the hottest planet in the solar system.", "True", "Its thick carbon dioxide atmosphere traps heat, so Venus is hotter than Mercury: over 450 °C at the surface."],

  ["tf-his-titanic", "history", "white", "The Titanic sank on its maiden voyage.", "True", "It struck an iceberg on 14 April 1912, four days out of Southampton, and sank early on 15 April."],
  ["tf-his-moon", "history", "white", "The first crewed Moon landing was in 1969.", "True", "Apollo 11 landed on 20 July 1969; Neil Armstrong and Buzz Aldrin walked on the surface."],
  ["tf-his-wall", "history", "blue", "The Great Wall of China can be seen with the naked eye from the Moon.", "False", "NASA says it can't: from the Moon no single human-made structure is visible to the naked eye."],
  ["tf-his-napoleon", "history", "green", "Napoleon Bonaparte was unusually short for a man of his time.", "False", "He was about 1.69 m (5 ft 7 in), around average; French inches were longer than English ones."],

  ["tf-geo-aus", "geography", "white", "Australia is both a country and a continent.", "True", "Australia is the only country that covers a whole continent's mainland."],
  ["tf-geo-africa", "geography", "white", "Africa is the largest continent by area.", "False", "Asia is the largest, about 44.6 million km²; Africa is second at about 30.4 million km²."],
  ["tf-geo-nile", "geography", "blue", "The Nile flows into the Mediterranean Sea.", "True", "The Nile flows north and empties into the Mediterranean through its delta in Egypt."],
  ["tf-geo-everest", "geography", "green", "Measured from base to peak, Mount Everest is the tallest mountain on Earth.", "False", "Everest is highest above sea level, but Mauna Kea is taller base to peak: over 10,000 m from the sea floor."],

  ["tf-nat-spider", "nature", "white", "A spider is an insect.", "False", "Spiders are arachnids: eight legs and two body parts. Insects have six legs and three."],
  ["tf-nat-octopus", "nature", "blue", "An octopus has three hearts.", "True", "Two hearts pump blood through the gills and a third pumps it round the body."],
  ["tf-nat-penguin", "nature", "blue", "Wild penguins live in the Arctic.", "False", "Wild penguins live in the Southern Hemisphere; only the Galápagos penguin reaches just north of the equator."],
  ["tf-nat-bamboo", "nature", "green", "Bamboo is a kind of grass.", "True", "Bamboos belong to the grass family, Poaceae, and some are among the fastest-growing plants on Earth."],

  ["tf-spo-soccer", "sports", "white", "A soccer team has 11 players on the field at a time.", "True", "Each side fields 11, one of them the goalkeeper (Law 3 of the Laws of the Game)."],
  ["tf-spo-hoop", "sports", "white", "A regulation basketball hoop is 12 feet high.", "False", "The rim is 10 feet (3.05 m) above the floor, in the NBA, NCAA and FIBA alike."],
  ["tf-spo-marathon", "sports", "blue", "A marathon is 26.2 miles long.", "True", "The distance is 42.195 km (26 miles 385 yards): the 1908 London Olympic course, made standard in 1921."],
  ["tf-spo-masters", "sports", "green", "Golf's Masters Tournament is played at St Andrews.", "False", "The Masters is played every April at Augusta National Golf Club in Georgia."],

  ["tf-art-mona", "arts", "white", "Leonardo da Vinci painted the Mona Lisa.", "True", "Leonardo began it in the early 1500s; it hangs in the Louvre in Paris."],
  ["tf-art-starry", "arts", "white", "Pablo Picasso painted The Starry Night.", "False", "Vincent van Gogh painted The Starry Night in 1889; it is at MoMA in New York."],
  ["tf-art-sistine", "arts", "blue", "Michelangelo painted the Sistine Chapel ceiling.", "True", "He painted the ceiling between 1508 and 1512 for Pope Julius II."],
  ["tf-art-monet", "arts", "green", "Claude Monet was a leading painter of Cubism.", "False", "Monet was a founder of Impressionism; Cubism was led by Picasso and Braque."],
];

export const TF_CARDS: Extract<FormatQ, { kind: "tf" }>[] = TF_SEED.map(([id, cat, rarity, q, answer, fact]) => ({ kind: "tf", q, answer, fact, cat, diff: 1, id, rarity }));

/** Closest Number cards per lamp colour (only amber, red and violet math lamps deal them). */
export const NEAR_PER_TIER: Partial<Record<Tier, number>> = { amber: 40, red: 40, violet: 40 };

export function generatedNear(): Extract<FormatQ, { kind: "near" }>[] {
  return (Object.entries(NEAR_PER_TIER) as [Tier, number][]).flatMap(([t, n]) => generateNear(t, n));
}

export function formatCards(): FormatQ[] {
  return [...TF_CARDS, ...generatedNear()];
}
