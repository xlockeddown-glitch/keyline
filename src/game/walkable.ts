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

export function isWalkableWay(tags: WayTags | undefined | null): boolean {
  const hw = tags?.highway ?? "";
  if (!hw || NO_WALK_HIGHWAYS.has(hw) || !WALK_SET.has(hw)) return false;
  if (tags?.area === "yes") return false;
  if (tags?.motorroad === "yes") return false;
  const foot = tags?.foot ?? "";
  if (FOOT_NO.has(foot)) return false;
  if (ACCESS_NO.has(tags?.access ?? "") && !FOOT_OK.has(foot)) return false;
  return true;
}

/** Freeway-class ways — used by tests and QA to check walks never ride along them. */
export function isFreeway(tags: WayTags | undefined | null): boolean {
  const hw = tags?.highway ?? "";
  return hw === "motorway" || hw === "motorway_link" || hw === "trunk" || hw === "trunk_link";
}
