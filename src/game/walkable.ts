/**
 * One rule for "can a person walk here", shared by the street graph, the server OSM fetch,
 * and match/lamp placement. Freeways and their ramps are never walkable, whatever else they're tagged.
 */
export type WayTags = {
  highway?: string;
  foot?: string;
  access?: string;
  motorroad?: string;
  area?: string;
  sidewalk?: string;
  "sidewalk:both"?: string;
  "sidewalk:left"?: string;
  "sidewalk:right"?: string;
  name?: string;
};

/** Highway types a walker may use (indoor corridors excluded — they cut through buildings). */
export const WALK_HIGHWAYS = [
  "pedestrian",
  "footway",
  "path",
  "steps",
  "living_street",
  "residential",
  "unclassified",
  "service",
  "track",
  "cycleway",
  "bridleway",
  "tertiary",
  "tertiary_link",
  "secondary",
  "secondary_link",
  "primary",
  "primary_link",
] as const;

/** Never walk these: motorways, trunk roads, and their ramps. Overpasses are the streets that cross them. */
export const NO_WALK_HIGHWAYS = new Set(["motorway", "motorway_link", "trunk", "trunk_link", "construction", "proposed", "raceway", "bus_guideway", "busway", "corridor"]);

const WALK_SET = new Set<string>(WALK_HIGHWAYS);
const FOOT_OK = new Set(["yes", "designated", "permissive", "official"]);
const FOOT_NO = new Set(["no", "private", "use_sidepath", "discouraged"]);
const ACCESS_NO = new Set(["no", "private"]);

/** Overpass highway regex alternation for walk fetches. */
export const WALK_HIGHWAY_RE = WALK_HIGHWAYS.join("|");

/** Overpass tag filters that drop ways a walker may not use. Keep in step with isWalkableWay. */
export const WALK_OVERPASS_FILTERS = `["area"!="yes"]["foot"!~"^(no|private|use_sidepath)$"]["motorroad"!="yes"]`;

/** Overpass highway alternation for the freeway layer (fetched alongside walk ways so walks can steer clear of it). */
export const FREEWAY_HIGHWAY_RE = "motorway|motorway_link|trunk|trunk_link";

const ARTERIAL_CLASSES = new Set(["primary", "primary_link", "secondary", "secondary_link"]);
const EXPRESSWAY_NAME = /\b(expressway|expwy|expy|freeway|fwy|feeder)\b/i;
const LOCAL_DRIVE_NAME = /\b(service|frontage|access)\b/i;
const SIDEWALK_YES = new Set(["yes", "both", "left", "right", "separate"]);

/**
 * 0.0.52b: an arterial-class way that is really an expressway lane or feeder mapped as primary/secondary
 * ("… Expressway", "… Feeder") with no sidewalk mapped and no foot permission. Service drives and
 * frontage roads ("Fisher Freeway Service Drive", I-35 frontage) keep walking.
 */
export function isExpresswayNamed(tags: WayTags | undefined | null): boolean {
  const hw = tags?.highway ?? "";
  if (!ARTERIAL_CLASSES.has(hw)) return false;
  const name = tags?.name ?? "";
  if (!EXPRESSWAY_NAME.test(name) || LOCAL_DRIVE_NAME.test(name)) return false;
  if (FOOT_OK.has(tags?.foot ?? "")) return false;
  const sw = [tags?.sidewalk, tags?.["sidewalk:both"], tags?.["sidewalk:left"], tags?.["sidewalk:right"]];
  return !sw.some((v) => v && SIDEWALK_YES.has(v));
}

export function isWalkableWay(tags: WayTags | undefined | null): boolean {
  const hw = tags?.highway ?? "";
  if (!hw || NO_WALK_HIGHWAYS.has(hw) || !WALK_SET.has(hw)) return false;
  if (tags?.area === "yes") return false;
  if (tags?.motorroad === "yes") return false;
  if (isExpresswayNamed(tags)) return false;
  const foot = tags?.foot ?? "";
  if (FOOT_NO.has(foot)) return false;
  if (ACCESS_NO.has(tags?.access ?? "") && !FOOT_OK.has(foot)) return false;
  return true;
}

/**
 * Freeway-class ways: motorways, trunks and their ramps/feeders, motorroad=yes, and expressway lanes mapped as
 * arterials. The walk graph keeps these as a no-walk layer (0.0.52b) so off-graph steps, door hops and online
 * routes can be checked against them; tests and QA use the same rule.
 */
export function isFreeway(tags: WayTags | undefined | null): boolean {
  const hw = tags?.highway ?? "";
  if (hw === "motorway" || hw === "motorway_link" || hw === "trunk" || hw === "trunk_link") return true;
  if (!hw || tags?.area === "yes") return false;
  return tags?.motorroad === "yes" || isExpresswayNamed(tags);
}
