// 0.1.62 city music beds: data, deterministic scheduling, a deck that never stacks, and gating.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CITY_BEDS, CITY_BED_NAME, CITY_CHARACTER, SCOUT_BEDS, deckPrune, deckSwitch, FADE_S, musicAudible, scheduleWindow, stepEvents, wantedBed, type Player } from "./music.ts";
import { CITIES } from "./data.ts";

const ids = Object.keys(CITIES).sort();

test("all 15 cities have a valid, quiet bed with a name and a character line", () => {
  assert.equal(ids.length, 15);
  assert.deepEqual(Object.keys(CITY_BEDS).sort(), ids);
  assert.deepEqual(Object.keys(CITY_CHARACTER).sort(), ids);
  assert.deepEqual(Object.keys(CITY_BED_NAME).sort(), ids);
  const shapes = new Set<string>();
  for (const [id, b] of Object.entries(CITY_BEDS)) {
    assert.ok(b.bpm >= 50 && b.bpm <= 110, `${id} bpm`);
    assert.ok(b.root >= 45 && b.root <= 60, `${id} root`);
    assert.ok(b.scale[0] === 0 && b.scale.every((x, i) => i === 0 || x > b.scale[i - 1]!) && b.scale.at(-1)! < 12, `${id} scale`);
    assert.ok(b.chords.length >= 2 && b.chords.every((c) => c.length >= 2 && c.length <= 4), `${id} chords`);
    assert.ok(b.swing >= 0 && b.swing <= 0.35 && b.cutoff >= 1000 && b.cutoff <= 4000 && b.vinyl === 0, `${id} feel`);
    assert.ok((b.level ?? 1) <= 1.6, `${id} level`);
    if (b.lead) assert.ok(b.lead.vol <= 0.1 && b.lead.steps.every((s) => s >= 0 && s < 16), `${id} lead`);
    // Every event of a full loop is quiet.
    for (let n = 0; n < b.chords.length * 16; n++) for (const e of stepEvents(b, n)) assert.ok(e.vol <= (e.kind === "chord" ? 0.36 : 0.3), `${id} step ${n} ${e.kind}`);
    shapes.add(JSON.stringify([b.bpm, b.scale, b.chords, b.kit]));
  }
  assert.equal(shapes.size, 15, "each city sounds different");
});

test("sparse: no more than a few voices per step, so phones stay cool", () => {
  for (const [id, b] of Object.entries({ ...CITY_BEDS, ...SCOUT_BEDS })) {
    let oscs = 0;
    const loop = b.chords.length * 16;
    for (let n = 0; n < loop; n++) {
      const ev = stepEvents(b, n);
      assert.ok(ev.length <= 6, `${id} step ${n}`);
      for (const e of ev) oscs += e.kind === "chord" ? e.notes.length * (e.voice === "rhodes" ? 2 : 1) : 1;
    }
    const perSec = oscs / (loop * (60 / b.bpm / 4));
    assert.ok(perSec < 14, `${id} starts ${perSec.toFixed(1)} sources/s`);
  }
});

test("scheduler is deterministic, lookahead-bounded, and skips ahead after a stall", () => {
  const b = CITY_BEDS.chicago;
  const run = () => {
    const st = { next: 0.05, step: 0 };
    const got: string[] = [];
    for (let now = 0; now < 8; now += 0.04) for (const w of scheduleWindow(b, st, now)) { assert.ok(w.at < now + 0.12 + 0.2); got.push(`${w.at.toFixed(4)}:${JSON.stringify(w.events)}`); }
    return got;
  };
  assert.deepEqual(run(), run());
  const st = { next: 0.05, step: 0 };
  scheduleWindow(b, st, 0);
  const late = scheduleWindow(b, st, 60); // tab came back after a minute
  assert.ok(late.length <= 3, `burst of ${late.length} steps after a stall`);
});

test("scout beds keep their old sound (no lead/pad extras)", () => {
  for (const b of Object.values(SCOUT_BEDS)) assert.equal(b.lead ?? b.padVoice ?? b.bassLine ?? b.level, undefined);
  const ev = stepEvents(SCOUT_BEDS.raccoon, 0).map((e) => e.kind);
  assert.deepEqual(ev, ["kick", "noise", "chord", "bass"]);
});

test("deck: same bed is a no-op, rapid switching never stacks past two", () => {
  let deck: Player[] = [];
  let id = 1;
  const go = (key: Parameters<typeof deckSwitch>[1], now: number) => {
    const r = deckSwitch(deck, key, now, id);
    if (r.started) id += 1;
    deck = r.deck;
    return r;
  };
  assert.ok(go("city:austin", 0).started);
  assert.equal(go("city:austin", 0.1).started, null);
  for (const [i, c] of (["nyc", "chicago", "nola", "seattle", "denver", "la"] as const).entries()) {
    go(`city:${c}`, 0.2 + i * 0.05);
    assert.ok(deck.length <= 2);
    assert.equal(deck.filter((p) => p.fadingSince === null).length, 1);
  }
  assert.equal(deck.find((p) => p.fadingSince === null)!.key, "city:la");
  deck = deckPrune(deck, 10 + FADE_S).deck;
  assert.deepEqual(deck.map((p) => p.key), ["city:la"]);
});

test("city bed in play, scout bed on the title screen; gating on unlock, toggle, mute and hidden tab", () => {
  assert.equal(wantedBed("raccoon", "chicago"), "city:chicago");
  assert.equal(wantedBed("raccoon", null), "scout:raccoon");
  assert.equal(musicAudible({ unlocked: true, musicOn: true, muted: false, hidden: false }), true);
  for (const k of ["unlocked", "musicOn"] as const) assert.equal(musicAudible({ unlocked: true, musicOn: true, muted: false, hidden: false, [k]: false }), false);
  for (const k of ["muted", "hidden"] as const) assert.equal(musicAudible({ unlocked: true, musicOn: true, muted: false, hidden: false, [k]: true }), false);
  const src = readFileSync(new URL("./audio.ts", import.meta.url), "utf8");
  assert.match(src, /function tick\(\) \{\n {2}if \(!ctx \|\| !musicAudible\(/);
  assert.match(src, /export function startBed[\s\S]*?if \(!ctx \|\| !musicFilter \|\| !musicOn \|\| muted\) return;/);
  assert.match(src, /visibilitychange[\s\S]*ctx\.suspend\(\)/);
  assert.doesNotMatch(src, /requestAnimationFrame/, "no per-frame audio work");
  const pkg = readFileSync(new URL("../../package.json", import.meta.url), "utf8");
  assert.match(pkg, /src\/game\/music\.test\.ts/);
});

test("no constant hiss: every city bed's quiet gaps stay under -70 dBFS (offline render, before any preview gain)", async () => {
  const { render, noiseFloor } = await import("../../scripts/music-render.mts");
  for (const [id, b] of Object.entries(CITY_BEDS)) {
    const nf = noiseFloor(render(b, 10));
    assert.ok(nf < -70, `${id} floor ${nf.toFixed(1)} dBFS`);
  }
});
