import { test } from "node:test";
import assert from "node:assert/strict";
import { adoptScout, savedScout } from "./scoutMemory.ts";

const KNOWN = new Set(["raccoon", "cat", "turtle", "owl", "corgi", "sloth", "fox", "lynx", "giraffe", "panda"]);
const known = (x: string) => KNOWN.has(x);
const save = (scout: string, scouts: string[]) => JSON.stringify({ version: 2, scout, scouts, points: 0 });

test("Beth regression: an older tab takes the gifted Corgi another tab put on instead of writing the Raccoon back", () => {
  // Tab A opened before the gift synced: Raccoon worn, Corgi not in its list.
  let tabA = { scout: "raccoon", scouts: ["raccoon"] };
  // Tab B (signed in, synced) owns the gifted Corgi and puts it on; its save fires a storage event in tab A.
  const raw = save("corgi", ["raccoon", "corgi"]);
  const theirs = savedScout(raw, known);
  assert.deepEqual(theirs, { scout: "corgi", scouts: ["raccoon", "corgi"] });
  const patch = adoptScout(tabA, theirs!);
  assert.ok(patch, "tab A must update");
  tabA = patch;
  // Tab A's next timer / hide / pagehide write now carries the Corgi, so a reload keeps it on.
  assert.equal(JSON.parse(save(tabA.scout, tabA.scouts)).scout, "corgi");
  assert.ok(tabA.scouts.includes("corgi"));
  // Its own later write echoing back is a no-op.
  assert.equal(adoptScout(tabA, savedScout(save(tabA.scout, tabA.scouts), known)!), null);
});

test("savedScout rejects unknown ids, other versions and junk", () => {
  assert.equal(savedScout(save("dragon", ["dragon"]), known), null);
  assert.equal(savedScout(JSON.stringify({ version: 3, scout: "corgi", scouts: ["corgi"] }), known), null);
  assert.equal(savedScout("{not json", known), null);
  assert.equal(savedScout(null, known), null);
  assert.deepEqual(savedScout(save("corgi", ["corgi", "dragon", 4 as unknown as string]), known), { scout: "corgi", scouts: ["corgi"] });
});

test("a worn scout neither tab owns is not put on, but owned lists still merge", () => {
  const p = adoptScout({ scout: "corgi", scouts: ["raccoon", "corgi"] }, { scout: "fox", scouts: ["raccoon"] });
  assert.equal(p, null);
  const q = adoptScout({ scout: "corgi", scouts: ["raccoon", "corgi"] }, { scout: "raccoon", scouts: ["raccoon", "owl"] });
  assert.deepEqual(q, { scout: "raccoon", scouts: ["raccoon", "corgi", "owl"] });
});
