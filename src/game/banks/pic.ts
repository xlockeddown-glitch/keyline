/**
 * 0.1.207 picture-clue lamps — SERVER-ONLY (imported from triviaBank / formats.ts only).
 * 24 opaque stamps (p01–p24), 4 sourced cards each. The client never sees this module.
 * Sources: Wikipedia primary; listed again in docs/trivia-pic-sources.md.
 */
import type { FormatQ, Tier } from "../types.ts";

export type PicRole = "name" | "capital" | "continent" | "extra";

export type PicCard = Extract<FormatQ, { kind: "pic" }>;

type Seed = {
  pic: string;
  role: PicRole;
  q: string;
  choices: [string, string, string, string];
  answer: string;
  fact: string;
  sources: [string, ...string[]];
  rarity: Tier;
};

const W = "white" as const;
const A = "amber" as const;

const SEEDS: Seed[] = [
  // p01 Italy
  { pic: "p01", role: "name", rarity: W, q: "Which country is this?", choices: ["Italy", "Spain", "Greece", "Portugal"], answer: "Italy", fact: "Italy is a peninsula in southern Europe; its distinctive boot shape includes the islands of Sicily and Sardinia.", sources: ["https://en.wikipedia.org/wiki/Italy"] },
  { pic: "p01", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Rome", "Milan", "Naples", "Venice"], answer: "Rome", fact: "Rome is the capital of Italy and its largest city, on the Tiber in the central west of the peninsula.", sources: ["https://en.wikipedia.org/wiki/Rome", "https://en.wikipedia.org/wiki/Italy"] },
  { pic: "p01", role: "continent", rarity: A, q: "On which continent is this country?", choices: ["Europe", "Asia", "Africa", "South America"], answer: "Europe", fact: "Italy lies in southern Europe, on the Mediterranean, with land borders in the Alps.", sources: ["https://en.wikipedia.org/wiki/Italy"] },
  { pic: "p01", role: "extra", rarity: A, q: "Which country shares a land border with this one?", choices: ["Switzerland", "Portugal", "Ireland", "Denmark"], answer: "Switzerland", fact: "Italy shares Alpine land borders with France, Switzerland, Austria and Slovenia, plus two small enclaved states.", sources: ["https://en.wikipedia.org/wiki/Italy"] },

  // p02 Japan
  { pic: "p02", role: "name", rarity: W, q: "Which country is this?", choices: ["Japan", "Philippines", "New Zealand", "Indonesia"], answer: "Japan", fact: "Japan is an island country in East Asia; its four main islands are Hokkaido, Honshu, Shikoku and Kyushu.", sources: ["https://en.wikipedia.org/wiki/Japan"] },
  { pic: "p02", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Tokyo", "Osaka", "Kyoto", "Nagoya"], answer: "Tokyo", fact: "Tokyo is Japan's capital and largest city, on the island of Honshu.", sources: ["https://en.wikipedia.org/wiki/Tokyo", "https://en.wikipedia.org/wiki/Japan"] },
  { pic: "p02", role: "continent", rarity: A, q: "On which continent is this country usually placed?", choices: ["Asia", "Europe", "Africa", "Oceania"], answer: "Asia", fact: "Japan is an island country of East Asia, in the northwest Pacific Ocean.", sources: ["https://en.wikipedia.org/wiki/Japan"] },
  { pic: "p02", role: "extra", rarity: A, q: "Which is the largest of this country's four main islands?", choices: ["Honshu", "Hokkaido", "Kyushu", "Shikoku"], answer: "Honshu", fact: "Honshu is Japan's largest island and holds Tokyo, Osaka and Kyoto.", sources: ["https://en.wikipedia.org/wiki/Honshu", "https://en.wikipedia.org/wiki/Japan"] },

  // p03 Australia
  { pic: "p03", role: "name", rarity: W, q: "Which country is this?", choices: ["Australia", "Indonesia", "India", "Greenland"], answer: "Australia", fact: "Australia is a country occupying the Australian continent's mainland, plus Tasmania and many smaller islands.", sources: ["https://en.wikipedia.org/wiki/Australia"] },
  { pic: "p03", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Canberra", "Sydney", "Melbourne", "Brisbane"], answer: "Canberra", fact: "Canberra, in the Australian Capital Territory, is the capital city of Australia; Sydney is larger but is the capital of New South Wales.", sources: ["https://en.wikipedia.org/wiki/Canberra", "https://en.wikipedia.org/wiki/Australia"] },
  { pic: "p03", role: "continent", rarity: A, q: "On which continent is this country?", choices: ["Oceania", "Asia", "Africa", "South America"], answer: "Oceania", fact: "Australia is the mainland of the Oceania region and is itself also treated as a continent.", sources: ["https://en.wikipedia.org/wiki/Australia", "https://en.wikipedia.org/wiki/Oceania"] },
  { pic: "p03", role: "extra", rarity: A, q: "Which ocean lies off this country's east coast?", choices: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], answer: "Pacific Ocean", fact: "The Pacific Ocean borders Australia's east coast; the Indian Ocean borders the west.", sources: ["https://en.wikipedia.org/wiki/Australia"] },

  // p04 Brazil
  { pic: "p04", role: "name", rarity: W, q: "Which country is this?", choices: ["Brazil", "Argentina", "Colombia", "India"], answer: "Brazil", fact: "Brazil is the largest country in South America, covering about half the continent's land area.", sources: ["https://en.wikipedia.org/wiki/Brazil"] },
  { pic: "p04", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Brasília", "Rio de Janeiro", "São Paulo", "Salvador"], answer: "Brasília", fact: "Brasília has been Brazil's planned capital since 1960, when the seat of government moved inland from Rio de Janeiro.", sources: ["https://en.wikipedia.org/wiki/Bras%C3%ADlia", "https://en.wikipedia.org/wiki/Brazil"] },
  { pic: "p04", role: "continent", rarity: A, q: "On which continent is this country?", choices: ["South America", "Africa", "North America", "Europe"], answer: "South America", fact: "Brazil occupies the eastern bulge of South America and borders every country on the continent except Chile and Ecuador.", sources: ["https://en.wikipedia.org/wiki/Brazil"] },
  { pic: "p04", role: "extra", rarity: A, q: "Which country shares a land border with this one?", choices: ["Argentina", "Chile", "Ecuador", "Mexico"], answer: "Argentina", fact: "Brazil's many land neighbours include Argentina, Uruguay, Paraguay, Bolivia, Peru and Colombia; it does not border Chile or Ecuador.", sources: ["https://en.wikipedia.org/wiki/Brazil"] },

  // p05 France (metropolitan, including Corsica)
  { pic: "p05", role: "name", rarity: W, q: "Which country is this?", choices: ["France", "Spain", "Germany", "Italy"], answer: "France", fact: "Metropolitan France is in western Europe and includes the island of Corsica in the Mediterranean.", sources: ["https://en.wikipedia.org/wiki/France", "https://en.wikipedia.org/wiki/Metropolitan_France"] },
  { pic: "p05", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Paris", "Lyon", "Marseille", "Toulouse"], answer: "Paris", fact: "Paris is the capital and largest city of France, on the river Seine.", sources: ["https://en.wikipedia.org/wiki/Paris", "https://en.wikipedia.org/wiki/France"] },
  { pic: "p05", role: "continent", rarity: A, q: "On which continent is this country?", choices: ["Europe", "Africa", "Asia", "South America"], answer: "Europe", fact: "Metropolitan France is in western Europe; the country also has overseas territories on other continents.", sources: ["https://en.wikipedia.org/wiki/France"] },
  { pic: "p05", role: "extra", rarity: A, q: "Which country shares a land border with this one?", choices: ["Spain", "Portugal", "Ireland", "Sweden"], answer: "Spain", fact: "Metropolitan France shares land borders with Belgium, Luxembourg, Germany, Switzerland, Italy, Spain, Andorra and Monaco.", sources: ["https://en.wikipedia.org/wiki/France"] },

  // p06 Germany
  { pic: "p06", role: "name", rarity: W, q: "Which country is this?", choices: ["Germany", "France", "Poland", "Italy"], answer: "Germany", fact: "Germany is a country in central Europe; its present internationally recognized shape dates from reunification in 1990.", sources: ["https://en.wikipedia.org/wiki/Germany"] },
  { pic: "p06", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Berlin", "Munich", "Hamburg", "Frankfurt"], answer: "Berlin", fact: "Berlin is the capital and largest city of Germany, in the northeast of the country.", sources: ["https://en.wikipedia.org/wiki/Berlin", "https://en.wikipedia.org/wiki/Germany"] },
  { pic: "p06", role: "continent", rarity: A, q: "On which continent is this country?", choices: ["Europe", "Asia", "Africa", "North America"], answer: "Europe", fact: "Germany is in central Europe, with coasts on the North Sea and the Baltic Sea.", sources: ["https://en.wikipedia.org/wiki/Germany"] },
  { pic: "p06", role: "extra", rarity: A, q: "Which country shares a land border with this one?", choices: ["Poland", "Sweden", "Portugal", "Ireland"], answer: "Poland", fact: "Germany's land neighbours include Denmark, Poland, the Czech Republic, Austria, Switzerland, France, Luxembourg, Belgium and the Netherlands.", sources: ["https://en.wikipedia.org/wiki/Germany"] },

  // p07 Sweden
  { pic: "p07", role: "name", rarity: W, q: "Which country is this?", choices: ["Sweden", "Norway", "Finland", "Italy"], answer: "Sweden", fact: "Sweden is a Nordic country on the eastern side of the Scandinavian Peninsula, with a long Baltic coastline.", sources: ["https://en.wikipedia.org/wiki/Sweden"] },
  { pic: "p07", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Stockholm", "Gothenburg", "Oslo", "Copenhagen"], answer: "Stockholm", fact: "Stockholm is the capital and largest city of Sweden, on the country's east coast.", sources: ["https://en.wikipedia.org/wiki/Stockholm", "https://en.wikipedia.org/wiki/Sweden"] },
  { pic: "p07", role: "continent", rarity: A, q: "On which continent is this country?", choices: ["Europe", "Asia", "North America", "Africa"], answer: "Europe", fact: "Sweden is in northern Europe, on the Scandinavian Peninsula.", sources: ["https://en.wikipedia.org/wiki/Sweden"] },
  { pic: "p07", role: "extra", rarity: A, q: "Which country shares a land border with this one?", choices: ["Norway", "Denmark", "Germany", "Poland"], answer: "Norway", fact: "Sweden has land borders only with Norway and Finland; Denmark is reached by the Öresund Bridge, not a land border.", sources: ["https://en.wikipedia.org/wiki/Sweden"] },

  // p08 Portugal
  { pic: "p08", role: "name", rarity: W, q: "Which country is this?", choices: ["Portugal", "Spain", "Italy", "Greece"], answer: "Portugal", fact: "Portugal is the westernmost country of mainland Europe, on the Iberian Peninsula along the Atlantic Ocean.", sources: ["https://en.wikipedia.org/wiki/Portugal"] },
  { pic: "p08", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Lisbon", "Porto", "Madrid", "Barcelona"], answer: "Lisbon", fact: "Lisbon is the capital and largest city of Portugal, on the estuary of the Tagus.", sources: ["https://en.wikipedia.org/wiki/Lisbon", "https://en.wikipedia.org/wiki/Portugal"] },
  { pic: "p08", role: "continent", rarity: A, q: "On which continent is this country?", choices: ["Europe", "Africa", "South America", "Asia"], answer: "Europe", fact: "Mainland Portugal is in southwestern Europe; the country also includes the Atlantic archipelagos of the Azores and Madeira.", sources: ["https://en.wikipedia.org/wiki/Portugal"] },
  { pic: "p08", role: "extra", rarity: A, q: "Which country shares a land border with this one?", choices: ["Spain", "France", "Italy", "Morocco"], answer: "Spain", fact: "Spain is Portugal's only land neighbour, along a long border that crosses the Iberian Peninsula.", sources: ["https://en.wikipedia.org/wiki/Portugal"] },

  // p09 Greece
  { pic: "p09", role: "name", rarity: W, q: "Which country is this?", choices: ["Greece", "Italy", "Spain", "Croatia"], answer: "Greece", fact: "Greece is a country in southeastern Europe, with a long mainland and many islands in the Aegean and Ionian seas, including Crete.", sources: ["https://en.wikipedia.org/wiki/Greece"] },
  { pic: "p09", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Athens", "Thessaloniki", "Sparta", "Heraklion"], answer: "Athens", fact: "Athens is the capital and largest city of Greece, in Attica on the mainland.", sources: ["https://en.wikipedia.org/wiki/Athens", "https://en.wikipedia.org/wiki/Greece"] },
  { pic: "p09", role: "continent", rarity: A, q: "On which continent is this country?", choices: ["Europe", "Asia", "Africa", "Oceania"], answer: "Europe", fact: "Greece is in southeastern Europe, on the southern end of the Balkan Peninsula.", sources: ["https://en.wikipedia.org/wiki/Greece"] },
  { pic: "p09", role: "extra", rarity: A, q: "Which country shares a land border with this one?", choices: ["Bulgaria", "Italy", "Spain", "Romania"], answer: "Bulgaria", fact: "Greece has land borders with Albania, North Macedonia, Bulgaria and Turkey.", sources: ["https://en.wikipedia.org/wiki/Greece"] },

  // p10 Egypt
  { pic: "p10", role: "name", rarity: W, q: "Which country is this?", choices: ["Egypt", "Libya", "Algeria", "Turkey"], answer: "Egypt", fact: "Egypt is a country in North Africa with a land bridge into Asia at the Sinai Peninsula; the Nile runs through it to the Mediterranean.", sources: ["https://en.wikipedia.org/wiki/Egypt"] },
  { pic: "p10", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Cairo", "Alexandria", "Giza", "Luxor"], answer: "Cairo", fact: "Cairo is the capital of Egypt and the country's largest city, on the Nile near the Giza pyramid complex.", sources: ["https://en.wikipedia.org/wiki/Cairo", "https://en.wikipedia.org/wiki/Egypt"] },
  { pic: "p10", role: "continent", rarity: A, q: "On which continent is this country usually placed?", choices: ["Africa", "Asia", "Europe", "South America"], answer: "Africa", fact: "Egypt is a transcontinental country, with most of its land and its capital in North Africa and the Sinai Peninsula in Asia.", sources: ["https://en.wikipedia.org/wiki/Egypt"] },
  { pic: "p10", role: "extra", rarity: A, q: "Which country shares a land border with this one?", choices: ["Libya", "Morocco", "Turkey", "Spain"], answer: "Libya", fact: "Egypt's land neighbours include Libya to the west and Sudan to the south.", sources: ["https://en.wikipedia.org/wiki/Egypt"] },

  // p11 Mexico
  { pic: "p11", role: "name", rarity: W, q: "Which country is this?", choices: ["Mexico", "United States", "Colombia", "Spain"], answer: "Mexico", fact: "Mexico is a country in the southern part of North America, between the United States and Central America.", sources: ["https://en.wikipedia.org/wiki/Mexico"] },
  { pic: "p11", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Mexico City", "Guadalajara", "Monterrey", "Cancún"], answer: "Mexico City", fact: "Mexico City is the capital and largest city of Mexico, in the Valley of Mexico in the centre of the country.", sources: ["https://en.wikipedia.org/wiki/Mexico_City", "https://en.wikipedia.org/wiki/Mexico"] },
  { pic: "p11", role: "continent", rarity: A, q: "On which continent is this country?", choices: ["North America", "South America", "Europe", "Africa"], answer: "North America", fact: "Mexico occupies the southern portion of North America, with coasts on the Pacific and the Gulf of Mexico.", sources: ["https://en.wikipedia.org/wiki/Mexico"] },
  { pic: "p11", role: "extra", rarity: A, q: "Which country shares a land border with this one?", choices: ["United States", "Brazil", "Colombia", "Cuba"], answer: "United States", fact: "Mexico's land neighbours are the United States to the north and Guatemala and Belize to the south-east.", sources: ["https://en.wikipedia.org/wiki/Mexico"] },

  // p12 Madagascar
  { pic: "p12", role: "name", rarity: W, q: "Which country is this?", choices: ["Madagascar", "Australia", "Sri Lanka", "United Kingdom"], answer: "Madagascar", fact: "Madagascar is an island country in the Indian Ocean, off the south-east coast of Africa, and the world's fourth-largest island.", sources: ["https://en.wikipedia.org/wiki/Madagascar"] },
  { pic: "p12", role: "capital", rarity: A, q: "What is the capital of this country?", choices: ["Antananarivo", "Toamasina", "Cape Town", "Nairobi"], answer: "Antananarivo", fact: "Antananarivo is the capital and largest city of Madagascar, in the island's central highlands.", sources: ["https://en.wikipedia.org/wiki/Antananarivo", "https://en.wikipedia.org/wiki/Madagascar"] },
  { pic: "p12", role: "continent", rarity: A, q: "On which continent is this country usually placed?", choices: ["Africa", "Asia", "Oceania", "Europe"], answer: "Africa", fact: "Madagascar is an African island country in the Indian Ocean, separated from mainland Africa by the Mozambique Channel.", sources: ["https://en.wikipedia.org/wiki/Madagascar"] },
  { pic: "p12", role: "extra", rarity: A, q: "Which ocean surrounds this country?", choices: ["Indian Ocean", "Atlantic Ocean", "Pacific Ocean", "Arctic Ocean"], answer: "Indian Ocean", fact: "Madagascar lies in the Indian Ocean, about 400 km off the coast of Mozambique.", sources: ["https://en.wikipedia.org/wiki/Madagascar"] },

  // p13 Eiffel Tower
  { pic: "p13", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Eiffel Tower", "Big Ben", "Leaning Tower of Pisa", "Statue of Liberty"], answer: "Eiffel Tower", fact: "The Eiffel Tower is a wrought-iron tower on the Champ de Mars in Paris, built for the 1889 Exposition Universelle.", sources: ["https://en.wikipedia.org/wiki/Eiffel_Tower"] },
  { pic: "p13", role: "extra", rarity: A, q: "In which city is this landmark?", choices: ["Paris", "London", "Rome", "New York City"], answer: "Paris", fact: "The Eiffel Tower stands on the Champ de Mars in Paris, France.", sources: ["https://en.wikipedia.org/wiki/Eiffel_Tower"] },
  { pic: "p13", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["France", "Italy", "United Kingdom", "United States"], answer: "France", fact: "The Eiffel Tower is in Paris, the capital of France.", sources: ["https://en.wikipedia.org/wiki/Eiffel_Tower"] },
  { pic: "p13", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["Europe", "North America", "Asia", "Africa"], answer: "Europe", fact: "The Eiffel Tower stands in Paris, in western Europe.", sources: ["https://en.wikipedia.org/wiki/Eiffel_Tower"] },

  // p14 Statue of Liberty
  { pic: "p14", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Statue of Liberty", "Christ the Redeemer", "Eiffel Tower", "Big Ben"], answer: "Statue of Liberty", fact: "The Statue of Liberty is a colossal neoclassical sculpture on Liberty Island in New York Harbor, a gift from France dedicated in 1886.", sources: ["https://en.wikipedia.org/wiki/Statue_of_Liberty"] },
  { pic: "p14", role: "extra", rarity: A, q: "In which city is this landmark?", choices: ["New York City", "Boston", "Philadelphia", "Paris"], answer: "New York City", fact: "The Statue of Liberty stands on Liberty Island in New York Harbor, in New York City.", sources: ["https://en.wikipedia.org/wiki/Statue_of_Liberty"] },
  { pic: "p14", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["United States", "France", "Brazil", "United Kingdom"], answer: "United States", fact: "The Statue of Liberty is in the United States; it was a gift from the people of France.", sources: ["https://en.wikipedia.org/wiki/Statue_of_Liberty"] },
  { pic: "p14", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["North America", "Europe", "South America", "Africa"], answer: "North America", fact: "The Statue of Liberty stands in New York Harbor, on the east coast of North America.", sources: ["https://en.wikipedia.org/wiki/Statue_of_Liberty"] },

  // p15 Sydney Opera House
  { pic: "p15", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Sydney Opera House", "Taj Mahal", "Colosseum", "Golden Gate Bridge"], answer: "Sydney Opera House", fact: "The Sydney Opera House is a performing-arts centre at Bennelong Point on Sydney Harbour, known for its shell-like roofs.", sources: ["https://en.wikipedia.org/wiki/Sydney_Opera_House"] },
  { pic: "p15", role: "extra", rarity: A, q: "In which city is this landmark?", choices: ["Sydney", "Melbourne", "Auckland", "Singapore"], answer: "Sydney", fact: "The Sydney Opera House stands at Bennelong Point in Sydney, Australia.", sources: ["https://en.wikipedia.org/wiki/Sydney_Opera_House"] },
  { pic: "p15", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["Australia", "New Zealand", "United Kingdom", "Canada"], answer: "Australia", fact: "The Sydney Opera House is in Sydney, the capital of the state of New South Wales in Australia.", sources: ["https://en.wikipedia.org/wiki/Sydney_Opera_House"] },
  { pic: "p15", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["Oceania", "Asia", "Europe", "North America"], answer: "Oceania", fact: "The Sydney Opera House is in Sydney, Australia, in the Oceania region.", sources: ["https://en.wikipedia.org/wiki/Sydney_Opera_House", "https://en.wikipedia.org/wiki/Oceania"] },

  // p16 Taj Mahal
  { pic: "p16", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Taj Mahal", "Colosseum", "Sydney Opera House", "Machu Picchu"], answer: "Taj Mahal", fact: "The Taj Mahal is an ivory-white marble mausoleum on the Yamuna river in Agra, built by the Mughal emperor Shah Jahan.", sources: ["https://en.wikipedia.org/wiki/Taj_Mahal"] },
  { pic: "p16", role: "extra", rarity: A, q: "In which city is this landmark?", choices: ["Agra", "Delhi", "Jaipur", "Mumbai"], answer: "Agra", fact: "The Taj Mahal stands on the south bank of the Yamuna in Agra, in the Indian state of Uttar Pradesh.", sources: ["https://en.wikipedia.org/wiki/Taj_Mahal"] },
  { pic: "p16", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["India", "Pakistan", "Iran", "Egypt"], answer: "India", fact: "The Taj Mahal is in Agra, in northern India.", sources: ["https://en.wikipedia.org/wiki/Taj_Mahal"] },
  { pic: "p16", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["Asia", "Africa", "Europe", "Oceania"], answer: "Asia", fact: "The Taj Mahal is in Agra, in northern India on the Asian continent.", sources: ["https://en.wikipedia.org/wiki/Taj_Mahal"] },

  // p17 Colosseum
  { pic: "p17", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Colosseum", "Leaning Tower of Pisa", "Taj Mahal", "Parthenon"], answer: "Colosseum", fact: "The Colosseum is an ancient Roman amphitheatre in the centre of Rome, the largest ancient amphitheatre ever built.", sources: ["https://en.wikipedia.org/wiki/Colosseum"] },
  { pic: "p17", role: "extra", rarity: A, q: "In which city is this landmark?", choices: ["Rome", "Athens", "Paris", "Pisa"], answer: "Rome", fact: "The Colosseum stands in the centre of Rome, Italy, just east of the Roman Forum.", sources: ["https://en.wikipedia.org/wiki/Colosseum"] },
  { pic: "p17", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["Italy", "Greece", "France", "Spain"], answer: "Italy", fact: "The Colosseum is in Rome, the capital of Italy.", sources: ["https://en.wikipedia.org/wiki/Colosseum"] },
  { pic: "p17", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["Europe", "Asia", "Africa", "North America"], answer: "Europe", fact: "The Colosseum stands in Rome, in southern Europe.", sources: ["https://en.wikipedia.org/wiki/Colosseum"] },

  // p18 Great Pyramid of Giza
  { pic: "p18", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Great Pyramid of Giza", "Machu Picchu", "Taj Mahal", "Colosseum"], answer: "Great Pyramid of Giza", fact: "The Great Pyramid of Giza is the largest of the pyramids of the Giza pyramid complex, built as a tomb for the pharaoh Khufu.", sources: ["https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza"] },
  { pic: "p18", role: "extra", rarity: A, q: "In which city is this landmark?", choices: ["Giza", "Cairo", "Luxor", "Alexandria"], answer: "Giza", fact: "The Great Pyramid stands in the Giza pyramid complex on the west bank of the Nile, in Giza, Egypt, just south-west of Cairo.", sources: ["https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza"] },
  { pic: "p18", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["Egypt", "Sudan", "Mexico", "Peru"], answer: "Egypt", fact: "The Great Pyramid of Giza is in Egypt, on the west bank of the Nile near Cairo.", sources: ["https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza"] },
  { pic: "p18", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["Africa", "Asia", "South America", "Europe"], answer: "Africa", fact: "The Great Pyramid of Giza stands in Egypt, in North Africa.", sources: ["https://en.wikipedia.org/wiki/Great_Pyramid_of_Giza"] },

  // p19 Christ the Redeemer
  { pic: "p19", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Christ the Redeemer", "Statue of Liberty", "Eiffel Tower", "Big Ben"], answer: "Christ the Redeemer", fact: "Christ the Redeemer is an Art Deco statue of Jesus with outstretched arms on the peak of Corcovado in Rio de Janeiro.", sources: ["https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue)"] },
  { pic: "p19", role: "extra", rarity: A, q: "In which city is this landmark?", choices: ["Rio de Janeiro", "São Paulo", "Brasília", "Lisbon"], answer: "Rio de Janeiro", fact: "Christ the Redeemer stands on Corcovado mountain in Rio de Janeiro, Brazil.", sources: ["https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue)"] },
  { pic: "p19", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["Brazil", "Portugal", "Argentina", "Mexico"], answer: "Brazil", fact: "Christ the Redeemer is in Rio de Janeiro, Brazil.", sources: ["https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue)"] },
  { pic: "p19", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["South America", "North America", "Europe", "Africa"], answer: "South America", fact: "Christ the Redeemer stands in Rio de Janeiro, on the coast of South America.", sources: ["https://en.wikipedia.org/wiki/Christ_the_Redeemer_(statue)"] },

  // p20 Big Ben / Elizabeth Tower
  { pic: "p20", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Big Ben", "Eiffel Tower", "Leaning Tower of Pisa", "Colosseum"], answer: "Big Ben", fact: "Big Ben is the nickname of the Great Bell, and commonly of Elizabeth Tower, the clock tower at the north end of the Palace of Westminster in London.", sources: ["https://en.wikipedia.org/wiki/Big_Ben", "https://en.wikipedia.org/wiki/Elizabeth_Tower"] },
  { pic: "p20", role: "extra", rarity: A, q: "In which city is this landmark?", choices: ["London", "Paris", "Edinburgh", "Dublin"], answer: "London", fact: "Elizabeth Tower, commonly called Big Ben, stands at the Palace of Westminster in London.", sources: ["https://en.wikipedia.org/wiki/Big_Ben"] },
  { pic: "p20", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["United Kingdom", "France", "Ireland", "United States"], answer: "United Kingdom", fact: "Elizabeth Tower stands in London, the capital of the United Kingdom.", sources: ["https://en.wikipedia.org/wiki/Big_Ben"] },
  { pic: "p20", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["Europe", "North America", "Asia", "Africa"], answer: "Europe", fact: "Elizabeth Tower stands in London, in western Europe.", sources: ["https://en.wikipedia.org/wiki/Big_Ben"] },

  // p21 Leaning Tower of Pisa
  { pic: "p21", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Leaning Tower of Pisa", "Big Ben", "Eiffel Tower", "Colosseum"], answer: "Leaning Tower of Pisa", fact: "The Leaning Tower of Pisa is the freestanding bell tower of Pisa Cathedral; it began to lean during construction because of soft ground.", sources: ["https://en.wikipedia.org/wiki/Leaning_Tower_of_Pisa"] },
  { pic: "p21", role: "extra", rarity: A, q: "In which city is this landmark?", choices: ["Pisa", "Rome", "Florence", "Venice"], answer: "Pisa", fact: "The Leaning Tower stands in the Piazza dei Miracoli in Pisa, in the Italian region of Tuscany.", sources: ["https://en.wikipedia.org/wiki/Leaning_Tower_of_Pisa"] },
  { pic: "p21", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["Italy", "France", "Spain", "Greece"], answer: "Italy", fact: "The Leaning Tower of Pisa is in Pisa, in Tuscany, Italy.", sources: ["https://en.wikipedia.org/wiki/Leaning_Tower_of_Pisa"] },
  { pic: "p21", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["Europe", "Asia", "Africa", "North America"], answer: "Europe", fact: "The Leaning Tower of Pisa stands in Italy, in southern Europe.", sources: ["https://en.wikipedia.org/wiki/Leaning_Tower_of_Pisa"] },

  // p22 Mount Fuji
  { pic: "p22", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Mount Fuji", "Mount Everest", "Kilimanjaro", "Mount Rainier"], answer: "Mount Fuji", fact: "Mount Fuji is an active stratovolcano and Japan's highest peak, on the island of Honshu, with a famously symmetric snow-capped cone.", sources: ["https://en.wikipedia.org/wiki/Mount_Fuji"] },
  { pic: "p22", role: "extra", rarity: A, q: "On which of this country's main islands does this mountain stand?", choices: ["Honshu", "Hokkaido", "Kyushu", "Shikoku"], answer: "Honshu", fact: "Mount Fuji stands on Honshu, about 100 km south-west of Tokyo, on the border of Shizuoka and Yamanashi prefectures.", sources: ["https://en.wikipedia.org/wiki/Mount_Fuji"] },
  { pic: "p22", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["Japan", "China", "South Korea", "Indonesia"], answer: "Japan", fact: "Mount Fuji is Japan's highest mountain, on the island of Honshu.", sources: ["https://en.wikipedia.org/wiki/Mount_Fuji"] },
  { pic: "p22", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["Asia", "Europe", "Oceania", "North America"], answer: "Asia", fact: "Mount Fuji is in Japan, in East Asia.", sources: ["https://en.wikipedia.org/wiki/Mount_Fuji"] },

  // p23 Golden Gate Bridge
  { pic: "p23", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Golden Gate Bridge", "Brooklyn Bridge", "Tower Bridge", "Sydney Harbour Bridge"], answer: "Golden Gate Bridge", fact: "The Golden Gate Bridge is a suspension bridge spanning the Golden Gate, the strait between San Francisco Bay and the Pacific Ocean.", sources: ["https://en.wikipedia.org/wiki/Golden_Gate_Bridge"] },
  { pic: "p23", role: "extra", rarity: A, q: "In which city is this landmark?", choices: ["San Francisco", "Los Angeles", "Seattle", "New York City"], answer: "San Francisco", fact: "The Golden Gate Bridge links San Francisco to Marin County, California, across the Golden Gate strait.", sources: ["https://en.wikipedia.org/wiki/Golden_Gate_Bridge"] },
  { pic: "p23", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["United States", "Canada", "United Kingdom", "Australia"], answer: "United States", fact: "The Golden Gate Bridge is in California, in the United States.", sources: ["https://en.wikipedia.org/wiki/Golden_Gate_Bridge"] },
  { pic: "p23", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["North America", "Europe", "Oceania", "South America"], answer: "North America", fact: "The Golden Gate Bridge stands in California, on the west coast of North America.", sources: ["https://en.wikipedia.org/wiki/Golden_Gate_Bridge"] },

  // p24 Machu Picchu
  { pic: "p24", role: "name", rarity: W, q: "Which landmark is this?", choices: ["Machu Picchu", "Great Pyramid of Giza", "Taj Mahal", "Colosseum"], answer: "Machu Picchu", fact: "Machu Picchu is a 15th-century Inca citadel on a mountain ridge in the Eastern Cordillera of southern Peru.", sources: ["https://en.wikipedia.org/wiki/Machu_Picchu"] },
  { pic: "p24", role: "extra", rarity: A, q: "Which city is nearest this landmark?", choices: ["Cusco", "Lima", "Quito", "La Paz"], answer: "Cusco", fact: "Machu Picchu is in the Cusco Region of southern Peru, about 80 km northwest of the city of Cusco.", sources: ["https://en.wikipedia.org/wiki/Machu_Picchu"] },
  { pic: "p24", role: "capital", rarity: A, q: "In which country is this landmark?", choices: ["Peru", "Bolivia", "Chile", "Ecuador"], answer: "Peru", fact: "Machu Picchu is in the Andes of southern Peru.", sources: ["https://en.wikipedia.org/wiki/Machu_Picchu"] },
  { pic: "p24", role: "continent", rarity: A, q: "On which continent is this landmark?", choices: ["South America", "North America", "Africa", "Asia"], answer: "South America", fact: "Machu Picchu stands in the Andes of Peru, in western South America.", sources: ["https://en.wikipedia.org/wiki/Machu_Picchu"] },
];

function check(c: Seed) {
  if (!c.choices.includes(c.answer)) throw new Error(`pic ${c.pic} ${c.role}: answer not in choices`);
  if (new Set(c.choices).size !== 4) throw new Error(`pic ${c.pic} ${c.role}: choices must be unique`);
  if (!c.sources.length || !c.sources.every((s) => s.startsWith("https://en.wikipedia.org/wiki/"))) throw new Error(`pic ${c.pic} ${c.role}: Wikipedia source required`);
  if (!c.fact || c.fact.length < 20) throw new Error(`pic ${c.pic} ${c.role}: fact too short`);
}

for (const s of SEEDS) check(s);

export const PIC_CARDS: PicCard[] = SEEDS.map((s) => ({
  kind: "pic" as const,
  id: `pic-${s.pic}-${s.role}`,
  pic: s.pic,
  role: s.role,
  q: s.q,
  choices: s.choices,
  answer: s.answer,
  fact: s.fact,
  sources: s.sources,
  cat: "geography" as const,
  diff: s.role === "name" ? (1 as const) : (2 as const),
  rarity: s.rarity,
}));

export function picCards(): PicCard[] {
  return PIC_CARDS;
}
