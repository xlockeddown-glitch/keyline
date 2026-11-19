// 0.1.168 Where am I? on the Loop: one clue from a real place in the destination city, four names from that city,
// dealt and graded on the server like a spark (white, Geography), never with the answer before the grade.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CITIES } from "./data.ts";
import { wherePoiId } from "./loop.ts";
import { DealIn, WHERE_PREFIX, dealFor, grade, openToken, publicCardId, resetGradeRing, type TriviaDeps } from "./triviaService.ts";
import { WHERE_CHOICES, cluePool, namesIn, pickWhere, whereCard, whereCards, words } from "./whereAmI.ts";
import type { CityId, TriviaQ } from "./types.ts";

const SAVE = "11111111-2222-3333-4444-555555555555";

test("every city has Where am I? cards, each fair: four names, one answer, a clue that never names it", () => {
  for (const city of Object.values(CITIES)) {
    const cards = whereCards().get(city.id) ?? [];
    assert.ok(cards.length >= 8, `${city.id}: ${cards.length} cards`);
    for (const c of cards) {
      const p = city.pois.find((x) => `where-${x.id}` === c.id)!;
      assert.ok(p, c.id);
      assert.equal(c.q, p.lore.trim(), "the clue is the place's own lore");
      assert.equal(c.answer, p.name);
      assert.equal(c.choices.length, WHERE_CHOICES);
      assert.equal(new Set(c.choices).size, WHERE_CHOICES, `${c.id}: doubled choice`);
      assert.ok(c.choices.includes(c.answer));
      assert.ok(!namesIn(c.q, c.answer), `${c.id}: clue names the answer`);
      for (const ch of c.choices) {
        if (ch === c.answer) continue;
        assert.ok(!namesIn(c.q, ch), `${c.id}: clue names decoy ${ch}`);
        assert.ok(!words(ch).some((w) => words(c.answer).includes(w)), `${c.id}: decoy ${ch} shares a word with the answer`);
        const d = city.pois.find((x) => x.name === ch)!;
        assert.ok(d && !d.noClue && !["shop", "counter", "board"].includes(d.kind), `${c.id}: decoy ${ch} is not a real place`);
      }
    }
  }
});

test("cards are fixed per place, so a public id always grades the same card", () => {
  const city = CITIES.chicago;
  for (const p of cluePool(city.pois)) {
    const a = whereCard(p, city.pois);
    const b = whereCard(p, city.pois);
    assert.deepEqual(a, b);
  }
  assert.ok(cluePool(city.pois).every((p) => !p.noClue && p.kind !== "shop"));
});

test("pickWhere skips cards the walker has seen, then repeats once all are seen", () => {
  const cards = whereCards().get("boston")!;
  const seen = cards.slice(1).map((c) => c.id);
  assert.equal(pickWhere("boston", seen, () => 0.99)!.id, cards[0]!.id);
  assert.equal(pickWhere("boston", cards.slice(1).map((c) => c.q), () => 0)!.id, cards[0]!.id, "a seen prompt counts too");
  assert.ok(pickWhere("boston", cards.map((c) => c.id), () => 0.5), "all seen still deals");
});

test("the Loop's deal id carries the server's Where am I? prefix", () => {
  assert.equal(wherePoiId("austin", "nyc"), "where-austin-nyc");
  assert.ok(wherePoiId("austin", "nyc").startsWith(WHERE_PREFIX));
});

function deps(clock: { t: number }): TriviaDeps {
  const all = new Map<string, TriviaQ>();
  for (const cards of whereCards().values())
    for (const c of cards) {
      all.set(c.id, c);
      all.set(publicCardId(c), c);
    }
  return {
    now: () => clock.t,
    secret: "test-secret",
    pick: () => assert.fail("a Where am I? deal never draws from the bank"),
    card: (id) => all.get(id) ?? null,
    pickWhere,
    namedPoi: () => null,
    rand: () => 0.3,
  };
}

test("server deal: a white Geography spark from the destination, no answer in the reply; grade reveals it", async () => {
  resetGradeRing();
  const clock = { t: 1_800_000_000_000 };
  const d = deps(clock);
  const to: CityId = "nyc";
  // A client claiming a red, non-spark Local card still gets a white Geography spark.
  const input = DealIn.parse({
    city: to,
    cat: "local",
    poiId: wherePoiId("austin", to),
    blank: { name: "x", kind: "museum", tier: "red" },
    windowMs: 19000,
    seen: [],
    saveId: SAVE,
    formats: ["tf", "near"],
  });
  const r = await dealFor(d, { userId: null }, input);
  assert.ok(r.ok);
  const card = d.card(r.card.id)!;
  assert.ok(card.id.startsWith("where-"), "dealt from the city's places");
  assert.ok((whereCards().get(to) ?? []).some((c) => c.id === card.id), "from the destination city");
  assert.equal(r.card.kind, "where", "explicit kind excludes the ride card from classic-only features");
  assert.equal(r.card.struck, undefined);
  assert.equal(r.card.choices.length, 4);
  const wire = JSON.stringify(r.card);
  assert.ok(!/answer/i.test(wire), "no answer key on the wire");
  assert.ok(!wire.includes(card.id), "no raw id (it names the place)");
  const t = openToken("test-secret", r.token)!;
  assert.equal(t.k, null, "a spark spends no key and clears nothing");
  assert.equal(t.x?.pt, "white");
  assert.equal(t.x?.cat, "geography");

  clock.t += 4000;
  const wrong = r.card.choices.find((c) => c !== card.answer)!;
  const g1 = await grade(d, { userId: null }, { token: r.token, choice: wrong, clientMs: 4000 });
  assert.ok(g1.ok && !g1.correct && g1.answer === card.answer);

  const r2 = await dealFor(d, { userId: null }, { ...input, seen: [r.card.id] });
  assert.ok(r2.ok);
  assert.notEqual(r2.card.id, r.card.id, "a seen card is not dealt again");
  const right = d.card(r2.card.id)!.answer;
  const g2 = await grade(d, { userId: null }, { token: r2.token, choice: right, clientMs: 2000 });
  assert.ok(g2.ok && g2.correct);
});

test("the Loop screen asks the server and never imports the card module", () => {
  for (const f of ["../components/keyline/LoopScreen.tsx", "./loop.ts"]) {
    const src = readFileSync(new URL(f, import.meta.url), "utf8");
    assert.ok(!/from "[^"]*(whereAmI|triviaBank|triviaService)[^"]*"/.test(src), `${f} imports server-only cards`);
  }
});
