import type { PlaceTopic, Poi, PoiKind, TriviaCat } from "./types";

const KIND_TOPICS: Record<PoiKind, PlaceTopic[]> = {
  museum: ["art", "history"],
  library: ["library"],
  theatre: ["theatre", "music"],
  stadium: ["sports"],
  food: ["food"],
  civic: ["civic"],
  campus: ["campus"],
  park: ["park", "nature"],
  water: ["water", "nature"],
  station: ["rail"],
  landmark: [],
  shop: [],
};

const NAME_TOPICS: [RegExp, PlaceTopic[]][] = [
  [/raytheon|missile|defense plant|lockheed|northrop|darpa|pentagon/i, ["defense", "aerospace"]],
  [/pima air|air & space|air and space|davis-?monthan|amarg|boneyard|titan missile/i, ["aerospace", "defense"]],
  [/airport|aviation|planetarium|adler|flandrau/i, ["aerospace", "science"]],
  [/blanton|guggenheim|moma|modern art|metropolitan museum|tate|umlauf|ney museum|de young|v&a|victoria and albert|national gallery|contemporary|mexic-arte|art institute|detroit institute of arts|palace of fine arts|heidelberg|museum of art|art museum|\barts?\b/i, ["art"]],
  [/natural history|field museum|academy of sciences|shedd|aquarium|planetarium/i, ["natural-history", "science"]],
  [/science and industry|science center|flandrau/i, ["science"]],
  [/history museum|bullock|british museum|presidio|state museum|ransom/i, ["history"]],
  [/bbq|barbecue|franklin barbecue/i, ["bbq", "food"]],
  [/coney|whole foods|borough market|eastern market|ghirardelli|lafayette/i, ["food"]],
  [/memorial stadium|ford field|arizona stadium|baker field|woodson/i, ["sports", "football"]],
  [/wrigley|comerica|oracle park/i, ["sports", "baseball"]],
  [/mckale|united center|madison square garden|little caesars|moody center/i, ["sports", "basketball"]],
  [/capitol|parliament|westminster|governor|city hall|municipal|courthouse/i, ["capitol", "civic"]],
  [/mission|cathedral|abbey|st\. patrick|saint augustine|dolores/i, ["church"]],
  [/hospital|medical|baylor|scott & white|college of medicine/i, ["medicine"]],
  [/stock exchange|willis tower|875 north michigan/i, ["finance"]],
  [/9\/11|memorial(?! stadium)|cenotaph|spirit of detroit/i, ["memorial"]],
  [/bridge|brooklyn bridge|tower bridge|pfluger/i, ["bridge"]],
  [/hotel|driskill|hotel congress/i, ["hotel"]],
  [/market|mercado|leadenhall|eastern market|borough market/i, ["market", "food"]],
  [/zoo/i, ["zoo", "nature"]],
  [/library|lbj presidential/i, ["library"]],
  [/depot|station|grand central|king's cross|union station|michigan central/i, ["rail"]],
  [/theatre|theater|globe|paramount|fox theatre|rialto|orchestra|lincoln center|acl live|motown/i, ["theatre", "music"]],
  [/university|campus|old main|wayne state|temple college/i, ["campus"]],
];

export const TOPIC_LABEL: Record<PlaceTopic, string> = {
  defense: "defense",
  aerospace: "air & space",
  art: "art",
  history: "history",
  "natural-history": "natural history",
  science: "science",
  library: "libraries",
  campus: "campus",
  medicine: "medicine",
  food: "food",
  bbq: "barbecue",
  sports: "sports",
  football: "football",
  baseball: "baseball",
  basketball: "basketball",
  theatre: "the stage",
  music: "music",
  civic: "civic life",
  capitol: "the capitol",
  park: "parks",
  nature: "the outdoors",
  water: "water",
  zoo: "the zoo",
  rail: "rail",
  airport: "aviation",
  finance: "finance",
  memorial: "memory",
  church: "sacred ground",
  hotel: "hotels",
  bridge: "bridges",
  market: "markets",
};

export const TOPIC_KEYS: Record<PlaceTopic, string[]> = {
  defense: [
    "missile",
    "pentagon",
    "raytheon",
    "defense",
    "patriot",
    "radar",
    "icbm",
    "darpa",
    "amraam",
    "sidewinder",
    "tomahawk",
    "javelin",
    "contractor",
    "department of defense",
    "air force",
    "sam ",
  ],
  aerospace: [
    "aircraft",
    "airplane",
    "aviation",
    "nasa",
    "rocket",
    "orbit",
    "runway",
    "boneyard",
    "amarg",
    "fighter",
    "bomber",
    "spaceship",
    "astronaut",
    "planetarium",
  ],
  art: [
    "paint",
    "museum",
    "sculpture",
    "impressionis",
    "picasso",
    "van gogh",
    "monet",
    "gallery",
    "canvas",
    "portrait",
    "cubis",
    "renaissance",
    "moma",
    "guggenheim",
    "fresco",
    "statue",
  ],
  history: ["war", "treaty", "century", "empire", "independence", "civil war", "amendment", "colony", "ancient"],
  "natural-history": ["dinosaur", "fossil", "mammal", "skeleton", "evolution", "habitat", "species", "geology"],
  science: ["planet", "atom", "element", "gravity", "molecule", "physics", "chemist", "biology", "lab"],
  library: ["book", "library", "archive", "manuscript", "reading"],
  campus: ["university", "college", "campus", "student", "degree"],
  medicine: ["hospital", "surgeon", "medical", "anatomy", "vaccine", "clinic"],
  food: ["cook", "chef", "restaurant", "cuisine", "taco", "chili", "market", "recipe"],
  bbq: ["barbecue", "brisket", "smoke", "pit", "bbq"],
  sports: ["stadium", "team", "coach", "league", "championship", "olympic"],
  football: ["football", "nfl", "quarterback", "touchdown", "wildcat", "longhorn"],
  baseball: ["baseball", "mlb", "inning", "world series", "wrigley", "pitcher"],
  basketball: ["basketball", "nba", "three-pointer", "court"],
  theatre: ["theatre", "theater", "playwright", "broadway", "shakespeare", "stage"],
  music: ["music", "orchestra", "jazz", "opera", "symphony", "motown", "concert"],
  civic: ["mayor", "council", "city hall", "courthouse", "municipal"],
  capitol: ["capitol", "legislature", "parliament", "governor", "congress", "senate"],
  park: ["park", "garden", "lawn", "trail"],
  nature: ["canyon", "desert", "mountain", "forest", "river", "cactus", "saguaro"],
  water: ["lake", "river", "harbor", "aquarium", "bridge over", "canal"],
  zoo: ["zoo", "elephant", "habitat", "enclosure"],
  rail: ["train", "rail", "station", "locomotive", "transit"],
  airport: ["airport", "runway", "airline", "terminal"],
  finance: ["stock", "exchange", "bank", "market crash", "wall street"],
  memorial: ["memorial", "monument", "remembrance", "9/11"],
  church: ["cathedral", "mission", "abbey", "parish", "church", "basilica"],
  hotel: ["hotel", "inn", "lobby"],
  bridge: ["bridge", "span", "suspension"],
  market: ["market", "stall", "vendor"],
};

const TOPIC_CATS: Record<PlaceTopic, TriviaCat[]> = {
  defense: ["science", "political", "history", "local"],
  aerospace: ["science", "history", "local"],
  art: ["arts", "history", "local"],
  history: ["history", "local", "political"],
  "natural-history": ["science", "history", "nature"],
  science: ["science", "math"],
  library: ["arts", "history", "local"],
  campus: ["local", "history", "sports"],
  medicine: ["science", "history"],
  food: ["food", "local"],
  bbq: ["food", "local"],
  sports: ["sports", "local"],
  football: ["sports", "local"],
  baseball: ["sports", "local"],
  basketball: ["sports", "local"],
  theatre: ["arts", "local"],
  music: ["arts", "local"],
  civic: ["political", "local"],
  capitol: ["political", "history", "local"],
  park: ["local", "science", "nature"],
  nature: ["nature", "science", "local"],
  water: ["science", "local", "nature"],
  zoo: ["nature", "science", "local"],
  rail: ["history", "local"],
  airport: ["science", "local"],
  finance: ["political", "history"],
  memorial: ["history", "political", "local"],
  church: ["history", "arts", "local"],
  hotel: ["local", "history"],
  bridge: ["local", "science"],
  market: ["food", "local"],
};

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

export function topicsFor(poi: Poi): PlaceTopic[] {
  const fromName: PlaceTopic[] = [];
  const hay = `${poi.id} ${poi.name}`;
  for (const [re, topics] of NAME_TOPICS) {
    if (re.test(hay)) fromName.push(...topics);
  }
  const kindFallback = fromName.length ? [] : KIND_TOPICS[poi.kind];
  return unique([...fromName, ...kindFallback]);
}

export function topicKeys(poi: Poi): string[] {
  const topics = topicsFor(poi);
  const fromTopics = topics.flatMap((t) => TOPIC_KEYS[t] ?? []);
  const fromName = poi.name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && w !== "with" && w !== "from");
  return unique([...fromTopics, ...fromName, poi.id.replace(/-/g, " ")]);
}

export function aboutTopic(item: { q: string; answer: string; fact?: string }, poi: Poi): boolean {
  const hay = `${item.q} ${item.answer} ${item.fact ?? ""}`.toLowerCase();
  return topicKeys(poi).some((k) => k.length > 2 && hay.includes(k.toLowerCase()));
}

export function placeWeights(tier?: Poi["tier"]): [number, number, number, number] {
  if (tier === "white" || !tier) return [8, 3, 2, 7];
  if (tier === "blue") return [7, 3, 2, 7];
  if (tier === "green") return [6, 3, 2, 7];
  return [5, 3, 3, 7];
}

export function pinCats(poi: Poi): TriviaCat[] {
  const pin: TriviaCat[] = [];
  for (const t of topicsFor(poi)) {
    for (const c of TOPIC_CATS[t] ?? []) if (!pin.includes(c)) pin.push(c);
  }
  return pin;
}

export function placeLine(poi: Poi): string | null {
  const topics = topicsFor(poi);
  if (!topics.length) return null;
  const labels = topics.slice(0, 3).map((t) => TOPIC_LABEL[t]);
  return `This door leans toward ${labels.join(" · ")}.`;
}
