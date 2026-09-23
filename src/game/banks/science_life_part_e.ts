import { q } from "../quiz";
import type { TriviaQ } from "../types";

export const SCIENCE_LIFE_PART_E: TriviaQ[] = [
  q("Ground sample distance in remote sensing is…", ["the SI metre's definition", "how large a pixel is on the Earth", "a mass of a rock", "a pH"], "how large a pixel is on the Earth", 3),
  q("Synthetic aperture radar can image…", ["only in sunlight like a phone camera as SAR's limit", "through clouds, day or night", "only under the sea as a camera", "only stars"], "through clouds, day or night", 2),
  q("A cubesat deployer (P-POD and kin) is a…", ["heat shield", "spring-loaded box that ejects small sats", "main engine", "crew hatch of Orion"], "spring-loaded box that ejects small sats", 3),
  q("The tyranny of the rocket equation is that…", ["engines cannot gimbal", "fuel must lift fuel, so mass ratio explodes with delta-v", "Isp is always 1 s", "staging is illegal"], "fuel must lift fuel, so mass ratio explodes with delta-v", 2),

  // v0.0.14 specialty deep-cut batch (metrology / aerospace-ops)
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
  q("Kessler syndrome describes…", ["gauge-block wring failure", "cascading collisions that multiply orbital debris", "LOX boil-off chemistry", "tarantula stridulation"], "cascading collisions that multiply orbital debris", 3)
];
