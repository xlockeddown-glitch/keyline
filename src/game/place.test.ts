import assert from "node:assert/strict";
import { test } from "node:test";
import { aboutTopic, pinCats, topicsFor } from "./place.ts";
import type { Poi } from "./types";

function poi(p: Partial<Poi> & Pick<Poi, "id" | "name" | "kind">): Poi {
  return {
    lat: 0,
    lng: 0,
    tier: "white",
    lore: p.lore ?? "",
    ...p,
  };
}

test("Raytheon doors tag defense and aerospace", () => {
  const p = poi({
    id: "raytheon-tucson",
    name: "Raytheon Missiles & Defense",
    kind: "campus",
    lore: "Radar, missiles, a plant that still says Raytheon.",
  });
  const t = topicsFor(p);
  assert.ok(t.includes("defense"));
  assert.ok(t.includes("aerospace"));
  const pin = pinCats(p);
  assert.ok(pin.includes("science"));
  assert.ok(pin.includes("political"));
});

test("an art museum door tags art, not football", () => {
  const p = poi({ id: "blanton", name: "Blanton Museum of Art", kind: "museum" });
  const t = topicsFor(p);
  assert.ok(t.includes("art"));
  assert.equal(t.includes("football"), false);
  assert.ok(pinCats(p).includes("arts"));
});

test("Tucson Museum of Art tags art even when lore mentions the Presidio", () => {
  const p = poi({
    id: "tma",
    name: "Tucson Museum of Art",
    kind: "museum",
    lore: "Art in the Presidio. Historic houses on the block.",
  });
  assert.ok(topicsFor(p).includes("art"));
  assert.ok(pinCats(p).includes("arts"));
});

test("a stadium leans sports", () => {
  const p = poi({ id: "az-stad", name: "Arizona Stadium", kind: "stadium" });
  assert.ok(topicsFor(p).includes("football") || topicsFor(p).includes("sports"));
  assert.ok(pinCats(p).includes("sports"));
});

test("place keyword matching catches missiles on a defense door", () => {
  const p = poi({ id: "raytheon-tucson", name: "Raytheon Missiles & Defense", kind: "campus" });
  assert.equal(
    aboutTopic({ q: "The U.S. Patriot is a surface-to-air missile system", answer: "surface-to-air missile system" }, p),
    true,
  );
  assert.equal(aboutTopic({ q: "What is 8 + 7?", answer: "15" }, p), false);
});
