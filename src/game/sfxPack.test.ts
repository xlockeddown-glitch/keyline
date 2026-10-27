import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PACK, makeSfxGate, recipeLength, type SfxName } from "./sfxPack.ts";

test("every pack effect is short and quiet", () => {
  for (const [name, r] of Object.entries(PACK)) {
    assert.ok(recipeLength(r) < 1.2, `${name} too long`);
    for (const x of r.tones) assert.ok(x.vol <= 0.3, `${name} tone too loud`);
  }
  assert.ok(Object.keys(PACK).length >= 6 && Object.keys(PACK).length <= 8);
});

test("a keyed event plays once, even long after", () => {
  const gate = makeSfxGate();
  assert.equal(gate("levelUp", 0, "level:5"), true);
  assert.equal(gate("levelUp", 10_000, "level:5"), false);
  assert.equal(gate("levelUp", 20_000, "level:6"), true);
});

test("an unkeyed effect is not doubled by a quick repeat", () => {
  const gate = makeSfxGate(350);
  assert.equal(gate("carDoor", 1000), true);
  assert.equal(gate("carDoor", 1100), false);
  assert.equal(gate("carStart", 1100), true);
  assert.equal(gate("carDoor", 1500), true);
});

test("pack playback respects mute and the tap unlock", () => {
  const src = readFileSync(new URL("./audio.ts", import.meta.url), "utf8");
  const body = src.slice(src.indexOf("function playPack"));
  assert.match(body.slice(0, 200), /if \(!ctx \|\| !sfxBus \|\| muted\) return;/);
  const names: SfxName[] = ["carBuy", "carStart", "carDoor", "cityArrive", "levelUp", "questDone", "crateOpen"];
  for (const n of names) assert.match(src, new RegExp(`${n}: \\(.*\\) => playPack\\("${n}"`));
});
