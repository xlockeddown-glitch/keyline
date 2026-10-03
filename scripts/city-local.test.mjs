/**
 * City-local cards belong to their city. Cards are tagged by the block they sit in (cities_part_*.ts
 * keys), so a card pasted into the wrong block plays as the wrong city. Most cards don't name their
 * city at all ("The Red Wings' logo is a…"), so the practical check is the reverse: a city's card
 * must not ask about another game city by name unless it names its own city too.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./ts-resolve-hooks.mjs", import.meta.url);

const { CITY_EXTRA } = await import("../src/game/banks/cities.ts");
const { CITIES } = await import("../src/game/data.ts");

/** Names a prompt would use for each city. */
const ALIASES = {
  nyc: ["NYC", "Manhattan"],
  la: ["L.A."],
  nola: ["NOLA"],
  sf: ["SF"],
};
/** "Temple" is also a word: the Temple of Dendur, a Masonic Temple, Temple Bar. */
const NOT_THE_CITY = /\bTemple (of|in|Bar)\b|Masonic Temple|Greater Grace Temple/g;

function namer(names) {
  const alt = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return new RegExp(`(^|[^A-Za-z])(${alt})(?![A-Za-z])`);
}
const NAMES = Object.fromEntries(Object.keys(CITIES).map((id) => [id, namer([CITIES[id].name, ...(ALIASES[id] ?? [])])]));

function foreignCards() {
  const out = [];
  for (const [cid, cats] of Object.entries(CITY_EXTRA)) {
    for (const [cat, qs] of Object.entries(cats ?? {})) {
      for (const card of qs ?? []) {
        const prompt = String(card.q).replace(NOT_THE_CITY, "");
        if (NAMES[cid].test(prompt)) continue;
        for (const other of Object.keys(NAMES)) {
          if (other !== cid && NAMES[other].test(prompt)) out.push(`${cid}/${cat} asks about ${other}: ${card.q}`);
        }
      }
    }
  }
  return out;
}

test("every city-local block is a game city", () => {
  for (const cid of Object.keys(CITY_EXTRA)) assert.ok(CITIES[cid], `${cid} is not a city`);
});

test("city-local cards don't ask about a different city", () => {
  assert.deepEqual(foreignCards(), []);
});

test("Detroit's local cards hold no Austin cards (0.0.41 check)", () => {
  const austin = /\b(Austin|Texas|Longhorns?|SXSW|Barton Springs|Lady Bird|Zilker|Sixth Street|Lake Travis)\b/;
  const hits = Object.values(CITY_EXTRA.detroit ?? {}).flat().filter((c) => austin.test(`${c.q} ${c.answer}`));
  assert.deepEqual(hits.map((c) => c.q), []);
});

test("the check catches a card in the wrong block", () => {
  const save = CITY_EXTRA.detroit.local;
  CITY_EXTRA.detroit.local = [...save, { q: "Austin's Sixth Street was originally called…", answer: "Pecan Street", choices: [] }];
  try {
    assert.ok(foreignCards().some((s) => s.startsWith("detroit/local asks about austin")));
  } finally {
    CITY_EXTRA.detroit.local = save;
  }
});

test("the 0.0.48 cities (Seattle, Denver, Nashville) each carry a full local deck", () => {
  for (const cid of ["seattle", "denver", "nashville"]) {
    assert.ok(CITIES[cid], `${cid} is a game city`);
    const cards = Object.values(CITY_EXTRA[cid] ?? {}).flat();
    assert.ok(cards.length >= 140, `${cid} has ${cards.length} local cards`);
    const prompts = new Set(cards.map((c) => c.q));
    assert.equal(prompts.size, cards.length, `${cid} has duplicate prompts`);
    for (const c of cards) {
      assert.ok(c.choices.includes(c.answer), `${cid}: answer missing from choices: ${c.q}`);
      assert.doesNotMatch(c.q, /\bplates?\b/i, `${cid}: say trivia cards, not plates: ${c.q}`);
    }
  }
});

test("the 0.0.48 cities' cards don't ask about another city", () => {
  const hits = foreignCards().filter((s) => /^(seattle|denver|nashville)\//.test(s));
  assert.deepEqual(hits, []);
});
