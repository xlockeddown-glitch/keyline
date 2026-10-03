import { q } from "../quiz";
import type { TriviaQ } from "../types";
import { HISTORY_LIFE_PART_A } from "./history_life_part_a";
import { NATURE_LIFE_PART_A } from "./nature_life_part_a";
import { SCIENCE_LIFE_PART_A } from "./science_life_part_a";

/** Weekly topic trivia (2026-09-22 + 2026-09-25). Wired via trivia.ts WEEKLY_* merges. */
export const WEEKLY_NATURE: TriviaQ[] = [
  q("A boxfish's body is protected by…", ["soft scaleless skin like a catfish", "a rigid bony carapace of hexagonal plates", "overlapping scales like a tarpon's", "venomous spines like a lionfish's"], "a rigid bony carapace of hexagonal plates", 3),
  q("Photosynthesis in green plants mainly happens in the…", ["mitochondria", "chloroplasts", "ribosomes", "vacuoles only"], "chloroplasts", 1),
  q("A biome is best described as…", ["a single tree species and its pests", "a large community shaped by climate", "a virus particle and its host cell", "a tectonic plate and its fault lines"], "a large community shaped by climate", 2),
  // v0.0.15 specialty deep-cuts (from orphan part files)
  q("Urticating setae types I–VI are classified by…", ["color under UV light", "structure and how they embed", "length in SI base units", "venom content per hair"], "structure and how they embed", 3),
  q("A spermatheca in a female tarantula stores…", ["silk only", "sperm after mating", "book-lung air", "urticating hairs"], "sperm after mating", 3),
  q("Ephebopus (skeleton tarantulas) kick urticating hairs from…", ["the abdomen only like Theraphosa", "the pedipalps", "the spinnerets", "the fangs"], "the pedipalps", 3),
  q("Avicularia-group Type II hairs are often…", ["kicked as a dense cloud like Type III", "embedded by contact, not flicked", "tipped with venom crystals", "found only on African baboons"], "embedded by contact, not flicked", 3),
  q("Poecilotheria (ornamentals) are Old World arboreals that…", ["kick Type III abdominal clouds as a first defense", "lack urticating hairs and rely on speed and venom", "are desert fossorials of Arizona", "breathe with gills"], "lack urticating hairs and rely on speed and venom", 3),
  q("The foveal 'horn' of some Ceratogyrus sits on the…", ["spinnerets", "carapace", "each tarsus", "egg sac only"], "carapace", 3),
  q("Theraphosa blondi's defensive display often pairs a threat pose with…", ["releasing ink like an octopus", "hissing and kicked urticating hairs", "playing dead for hours", "spraying formic acid like ants"], "hissing and kicked urticating hairs", 3),
  q("A sperm web is where a male tarantula…", ["lays and guards eggs", "charges his palps with sperm", "molts its old carapace", "wraps prey for later"], "charges his palps with sperm", 3),
  q("Mygalomorphae fang orientation is…", ["sideways pincer-style like many araneomorphs", "parallel and striking downward", "backward only into the abdomen", "absent in adults"], "parallel and striking downward", 3),
  q("Book lungs in tarantulas are…", ["tracheal tubes identical to beetles", "lamellate respiratory organs in the abdomen", "gills on the spinnerets", "air sacs in the fangs"], "lamellate respiratory organs in the abdomen", 3),
  q("An exuvium after ecdysis is the…", ["egg sac", "shed exoskeleton", "sperm web", "urticating pellet"], "shed exoskeleton", 3),
  q("Tliltocatl was split from Brachypelma largely on…", ["silk color and web style alone", "a molecular and morphological revision", "CITES trade paperwork and permits", "votes on popular hobby nicknames"], "a molecular and morphological revision", 3),
  // v0.0.16 deep-cut bank (nature_life_part_a)
  ...NATURE_LIFE_PART_A,
];

export const WEEKLY_HISTORY: TriviaQ[] = [
  q("King Charles III was crowned in…", ["2020", "2021", "2023", "2025"], "2023", 2),
  q("The Apollo 11 Moon landing took place in…", ["1965", "1969", "1972", "1981"], "1969", 1),
  // v0.0.16 deep-cut bank (history_life_part_a)
  ...HISTORY_LIFE_PART_A,
];

export const WEEKLY_SCIENCE: TriviaQ[] = [
  q("An exoplanet is a…", ["moon orbiting Jupiter", "planet orbiting another star", "comet in the Oort cloud", "asteroid of the main belt"], "planet orbiting another star", 2),
  q("In DNA, adenine pairs with…", ["guanine", "thymine", "cytosine", "uracil in DNA's usual pairing"], "thymine", 1),
  q("CRISPR-Cas systems were first characterized as…", ["a rocket fairing latch", "adaptive immune systems in bacteria and archaea", "a SI base unit of luminous intensity", "a tarantula silk gland"], "adaptive immune systems in bacteria and archaea", 3),
  // v0.0.15 specialty deep-cuts (from orphan part files)
  q("Wringing gauge blocks relies on…", ["a thin film of epoxy between faces", "flatness, finish, and molecular attraction", "magnetic clamps holding the faces", "frost from liquid oxygen on the faces"], "flatness, finish, and molecular attraction", 3),
  q("A deadweight tester realizes pressure from…", ["an experienced machinist's opinion", "known masses on a piston of known area", "a tire gauge of unknown accuracy", "the Kessler debris flux in orbit"], "known masses on a piston of known area", 3),
  q("An optical flat checks…", ["book-lung count in a tarantula molt", "surface flatness via interference fringes", "Isp of a thruster via exhaust plumes", "molt timing via cuticle color"], "surface flatness via interference fringes", 3),
  q("CMM in a metrology lab usually means…", ["Crew Meal Module on the ISS", "coordinate measuring machine", "cold molecular mist chamber", "cubesat main mast deployer"], "coordinate measuring machine", 3),
  q("Gauge-block temperature must be controlled because…", ["steel does not expand when warmed", "thermal expansion shifts the length", "wrings fail only above 100 °C", "CMMs cannot measure warm blocks"], "thermal expansion shifts the length", 3),
  q("GSE on a launch pad refers to…", ["ground support equipment", "gauge steel edge", "gimbal slew encoder", "green star ephemeris"], "ground support equipment", 3),
  q("Hold-down clamps release at…", ["T-0, once engines are verified", "only after fairing recovery", "the apogee of the first stage", "when the MLI turns gold"], "T-0, once engines are verified", 3),
  q("Range safety's flight termination system can…", ["increase the Isp of an errant vehicle", "destroy or neutralize an errant vehicle", "wring gauge blocks remotely", "recalibrate a vehicle's IMU in flight"], "destroy or neutralize an errant vehicle", 3),
  q("LOX loading is paced carefully because…", ["oxygen is inert and cannot burn", "cryogenic hazards and frost set the pace", "RP-1 freezes the LOX lines every time", "MLI blankets melt when LOX touches them"], "cryogenic hazards and frost set the pace", 3),
  q("MLI blankets reduce heat transfer mainly by…", ["conduction through thick foam only", "low-emissivity layers blocking radiation", "spinning reaction wheels that shed heat", "absorbing LOX boil-off into the layers"], "low-emissivity layers blocking radiation", 3),
  q("A cubesat's typical form-factor unit (1U) is about…", ["10 cm on a side", "1 m on a side", "a full Falcon fairing", "a gauge-block set"], "10 cm on a side", 3),
  q("Kessler syndrome describes…", ["cascading gauge-block wring failures", "cascading collisions of orbital debris", "LOX boil-off chemistry in tanks", "tarantula stridulation patterns"], "cascading collisions of orbital debris", 3),
  // v0.0.16 deep-cut bank (science_life_part_a)
  ...SCIENCE_LIFE_PART_A,
];

export const WEEKLY_POLITICAL: TriviaQ[] = [
  q("Soft power refers to influence through…", ["tanks, tariffs, and sanctions", "culture, values, and diplomacy", "naval blockades of ports", "currency devaluation"], "culture, values, and diplomacy", 2),
  q("The Bill of Rights is the first…", ["ten amendments to the U.S. Constitution", "ten articles of confederation only", "ten Supreme Court opinions", "ten federal statutes of 1789 only"], "ten amendments to the U.S. Constitution", 1),
  q("A filibuster is a tactic mainly used to…", ["speed a bill to a vote with no debate", "delay or block a bill through prolonged debate", "appoint cabinet secretaries without a vote", "redraw congressional district borders"], "delay or block a bill through prolonged debate", 2),
];
