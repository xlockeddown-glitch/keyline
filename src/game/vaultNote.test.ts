import assert from "node:assert/strict";
import { test } from "node:test";
import { vaultColorNote } from "./vaultNote.ts";
import type { Poi, Tier } from "./types.ts";

function poi(id: string, tier: Tier, kind: Poi["kind"] = "park"): Poi {
  return { id, name: id, lat: 0, lng: 0, kind, tier, lore: "" };
}

const now = 1_000_000;
const austin = [
  poi("shop", "white", "shop"),
  poi("station", "white", "station"),
  poi("cap", "white", "civic"),
  poi("park", "blue"),
  poi("lib", "blue", "library"),
  poi("muse", "blue", "museum"),
];

test("a match colour counts vaults been to, lit, and recasting — never place names", () => {
  const note = vaultColorNote(
    austin,
    "blue",
    "Austin",
    { park: true, lib: true },
    { lib: { coolUntil: now + 50 }, muse: { coolUntil: now - 50 } },
    now,
  );
  assert.equal(note, "Been to 3 of 3 blue vaults in Austin. 2 lit, 1 recasting.");
  assert.doesNotMatch(note, /park|lib|muse/);
});

test("the outfitter and the station are not vaults", () => {
  assert.equal(
    vaultColorNote(austin, "white", "Austin", { shop: true, station: true, cap: true }, { cap: { coolUntil: 0 } }, now),
    "Been to 1 of 1 white vault in Austin. 1 lit.",
  );
});

test("none visited, and a city with none of that colour", () => {
  assert.equal(vaultColorNote(austin, "blue", "Austin", {}, {}, now), "3 blue vaults in Austin. You haven't been to one.");
  assert.equal(vaultColorNote(austin, "violet", "Austin", {}, {}, now), "No violet vaults in Austin.");
  assert.equal(
    vaultColorNote(austin, "blue", "Austin", { park: true }, {}, now),
    "Been to 1 of 3 blue vaults in Austin. None lit.",
  );
});

test("every lit vault still dark says so", () => {
  assert.equal(
    vaultColorNote(austin, "blue", "Austin", {}, { park: { coolUntil: now + 1 }, lib: { coolUntil: now + 1 } }, now),
    "Been to 2 of 3 blue vaults in Austin. 2 lit, all recasting.",
  );
});
