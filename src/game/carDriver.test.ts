import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CARS } from "./cars.ts";
import { V2_SCOUTS } from "./coatLayer.ts";
import { driverCell, driverShows } from "./carDriver.ts";

test("0.1.57: only the open Bel Air shows its driver, for every v2 coat and facing", () => {
  for (const c of CARS) for (const f of ["left", "right", "down", "up"] as const) assert.equal(driverShows(c.id, "raccoon", f), c.id === "belair57", `${c.id} ${f}`);
  for (const s of V2_SCOUTS) assert.equal(driverShows("belair57", s, "right"), true, s);
  assert.equal(driverShows(null, "raccoon", "right"), false, "the city cab");
  assert.equal(driverShows("belair57", "nobody", "right"), false, "no v2 sheet");
});

test("0.1.57: the driver faces the drive (side idle left cols 0-3, right cols 4-7), front idle, back walk", () => {
  assert.deepEqual([driverCell("left").row, driverCell("left").col], [5, 0]);
  assert.deepEqual([driverCell("right").row, driverCell("right").col], [5, 4]);
  assert.deepEqual([driverCell("down").row, driverCell("up").row], [4, 3]);
  assert.equal(driverCell("right").position, "57.1429% 100%");
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /\.pawn\.is-seated\.has-driver \.scout-marker \{[^}]*opacity: 1/, "shown only with has-driver");
  assert.match(css, /\.pawn\.is-seated \.scout-marker \{\s*opacity: 0/, "closed cars still hide the scout");
});
