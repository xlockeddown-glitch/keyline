import { q } from "../quiz";
import type { TriviaQ } from "../types";
import { HISTORY_LIFE_PART_A } from "./history_life_part_a";
import { NATURE_LIFE_PART_A } from "./nature_life_part_a";
import { SCIENCE_LIFE_PART_A } from "./science_life_part_a";

/** Weekly topic trivia (2026-09-22 + 2026-09-25). Wired via trivia.ts WEEKLY_* merges. */
export const WEEKLY_NATURE: TriviaQ[] = [
  q("A boxfish's body is protected by…", ["only soft skin like a tuna", "a rigid bony carapace of hexagonal plates", "feathers", "book lungs of a tarantula"], "a rigid bony carapace of hexagonal plates", 3),
  q("Photosynthesis in green plants mainly happens in the…", ["mitochondria", "chloroplasts", "ribosomes", "vacuoles only"], "chloroplasts", 1),
  q("A biome is best described as…", ["a single tree species", "a large-scale ecological community shaped by climate", "a virus particle", "a tectonic plate"], "a large-scale ecological community shaped by climate", 2),
  // v0.0.15 specialty deep-cuts (from orphan part files)
  q("Urticating setae types I–VI are classified by…", ["only color under UV", "structure and how they embed in skin or mucosa", "SI base units", "wing venation"], "structure and how they embed in skin or mucosa", 3),
  q("A spermatheca in a female tarantula stores…", ["silk only", "sperm after mating", "book-lung air", "urticating hairs"], "sperm after mating", 3),
  q("Ephebopus (skeleton tarantulas) kick urticating hairs from…", ["the abdomen only like Theraphosa", "the pedipalps", "the spinnerets", "the fangs"], "the pedipalps", 3),
  q("Avicularia-group Type II hairs are often…", ["kicked as a dense cloud like Type III", "embedded by contact rather than flicked in a cloud", "venom crystals", "found only on African baboons"], "embedded by contact rather than flicked in a cloud", 3),
  q("Poecilotheria (ornamentals) are Old World arboreals that…", ["kick Type III abdominal clouds as a first defense", "lack urticating hairs and rely on speed and venom", "are desert fossorials of Arizona", "breathe with gills"], "lack urticating hairs and rely on speed and venom", 3),
  q("The foveal 'horn' of some Ceratogyrus sits on the…", ["spinnerets", "carapace", "each tarsus", "egg sac only"], "carapace", 3),
  q("Theraphosa blondi's defensive display often pairs a threat pose with…", ["ink release", "hissing stridulation and kicked urticating hairs", "playing dead for hours as a rule", "spraying formic acid"], "hissing stridulation and kicked urticating hairs", 3),
  q("A sperm web is where a male tarantula…", ["lays eggs", "deposits and charges sperm into his palpal emboli", "molts the carapace", "builds a bird nest"], "deposits and charges sperm into his palpal emboli", 3),
  q("Mygalomorphae fang orientation is…", ["sideways pincer-style like many araneomorphs", "parallel and striking downward", "backward only into the abdomen", "absent in adults"], "parallel and striking downward", 3),
  q("Book lungs in tarantulas are…", ["tracheal tubes identical to beetles", "lamellate respiratory organs in the abdomen", "gills on the spinnerets", "air sacs in the fangs"], "lamellate respiratory organs in the abdomen", 3),
  q("An exuvium after ecdysis is the…", ["egg sac", "shed exoskeleton", "sperm web", "urticating pellet"], "shed exoskeleton", 3),
  q("Tliltocatl was split from Brachypelma largely on…", ["silk color alone", "molecular and morphological revision of New World theraphosids", "CITES paperwork only", "hobby nickname votes"], "molecular and morphological revision of New World theraphosids", 3),
  // v0.0.16 deep-cut bank (nature_life_part_a)
  ...NATURE_LIFE_PART_A,
];

export const WEEKLY_HISTORY: TriviaQ[] = [
  q("King Charles III was crowned in…", ["2020", "2021", "2023", "2025"], "2023", 2),
  q("Magna Carta was sealed in England in…", ["1066", "1215", "1492", "1776"], "1215", 2),
  q("The Apollo 11 Moon landing took place in…", ["1965", "1969", "1972", "1981"], "1969", 1),
  // v0.0.16 deep-cut bank (history_life_part_a)
  ...HISTORY_LIFE_PART_A,
];

export const WEEKLY_SCIENCE: TriviaQ[] = [
  q("An exoplanet is a…", ["moon of Jupiter only", "planet orbiting a star other than the Sun", "comet in the Oort cloud only", "asteroid of the main belt only"], "planet orbiting a star other than the Sun", 2),
  q("In DNA, adenine pairs with…", ["guanine", "thymine", "cytosine", "uracil in DNA's usual pairing"], "thymine", 1),
  q("Water's chemical formula is…", ["CO2", "H2O", "O2", "NaCl"], "H2O", 1),
  q("CRISPR-Cas systems were first characterized as…", ["a rocket fairing latch", "adaptive immune systems in bacteria and archaea", "a SI base unit of luminous intensity", "a tarantula silk gland"], "adaptive immune systems in bacteria and archaea", 3),
  // v0.0.15 specialty deep-cuts (from orphan part files)
  q("Wringing gauge blocks relies on…", ["epoxy alone", "flatness, surface finish, and molecular attraction between wrung faces", "magnetic clamps only", "LOX frost"], "flatness, surface finish, and molecular attraction between wrung faces", 3),
  q("A deadweight tester realizes pressure from…", ["opinion of a machinist", "known masses on a piston of known area", "a kitchen tire gauge", "Kessler debris flux"], "known masses on a piston of known area", 3),
  q("An optical flat checks…", ["book-lung count", "surface flatness via interference fringes", "Isp of a thruster", "tarantula molt timing"], "surface flatness via interference fringes", 3),
  q("CMM in a metrology lab usually means…", ["Crew Meal Module", "coordinate measuring machine", "cold molecular mist", "cubesat main mast"], "coordinate measuring machine", 3),
  q("Gauge-block temperature must be controlled because…", ["steel does not expand", "thermal expansion shifts length at the micrometre scale", "wrings fail only above 100 °C", "CMMs ignore length"], "thermal expansion shifts length at the micrometre scale", 3),
  q("GSE on a launch pad refers to…", ["ground support equipment", "gauge steel edge", "gimbal slew encoder", "green star ephemeris"], "ground support equipment", 3),
  q("Hold-down clamps release at…", ["T-0 when engines are verified and the vehicle is committed to flight", "only after fairing recovery", "apogee of a cubesat", "when MLI is gold"], "T-0 when engines are verified and the vehicle is committed to flight", 3),
  q("Range safety's flight termination system can…", ["increase Isp", "destroy or neutralize an errant vehicle", "wring gauge blocks remotely", "calibrate a CMM"], "destroy or neutralize an errant vehicle", 3),
  q("LOX loading is paced carefully because…", ["oxygen is inert", "cryogenic densification, frost, and hazard controls dominate the timeline", "RP-1 freezes LOX lines as a rule", "MLI melts in LOX"], "cryogenic densification, frost, and hazard controls dominate the timeline", 3),
  q("MLI blankets reduce heat transfer mainly by…", ["conduction through thick foam only", "many low-emissivity layers that block radiation", "spinning reaction wheels", "absorbing LOX"], "many low-emissivity layers that block radiation", 3),
  q("A cubesat's typical form-factor unit (1U) is about…", ["10 cm on a side", "1 m on a side", "a full Falcon fairing", "a gauge-block set"], "10 cm on a side", 3),
  q("Kessler syndrome describes…", ["gauge-block wring failure", "cascading collisions that multiply orbital debris", "LOX boil-off chemistry", "tarantula stridulation"], "cascading collisions that multiply orbital debris", 3),
  // v0.0.16 deep-cut bank (science_life_part_a)
  ...SCIENCE_LIFE_PART_A,
];

export const WEEKLY_POLITICAL: TriviaQ[] = [
  q("Soft power refers to influence through…", ["only tanks and tariffs", "culture, values, and diplomacy (not just force)", "only blockades", "only currency devaluation"], "culture, values, and diplomacy (not just force)", 2),
  q("How many justices normally sit on the U.S. Supreme Court?", ["7", "9", "11", "13"], "9", 1),
  q("The Bill of Rights is the first…", ["ten amendments to the U.S. Constitution", "ten articles of confederation only", "ten Supreme Court opinions", "ten federal statutes of 1789 only"], "ten amendments to the U.S. Constitution", 1),
  q("A filibuster is a tactic mainly used to…", ["speed a bill to a vote with no debate", "delay or block legislative action through prolonged debate or procedure", "appoint cabinet secretaries", "redraw state borders"], "delay or block legislative action through prolonged debate or procedure", 2),
];
