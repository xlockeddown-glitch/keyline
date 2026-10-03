import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CHOICE_LETTERS, choiceButtons, dropStaleFocus } from "./choiceMarkup.ts";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

// The card from the 0.0.52 report (iPhone: option C, the right answer, looked lit before any tap) plus a few more.
const CARDS = [
  {
    id: "tx-panhandle",
    choices: ["Southern tip at Brownsville", "Northern rectangular extension", "Barrier-island chain", "Hill Country core"],
    answer: "Northern rectangular extension",
  },
  { id: "gulf", choices: ["Gulf of Mexico", "Great Lakes", "Chesapeake Bay", "Pacific Ocean"], answer: "Gulf of Mexico" },
  { id: "short", choices: ["1", "2", "3", "4"], answer: "3" },
];

function shuffle<T>(xs: T[], seed: number): T[] {
  const out = [...xs];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

test("choice buttons are identical apart from their text (and slot letter/key) before the answer", () => {
  for (const card of CARDS) {
    for (let seed = 1; seed <= 24; seed++) {
      const order = shuffle(card.choices, seed);
      const buttons = choiceButtons(card.id, order);
      assert.equal(buttons.length, 4);
      assert.deepEqual(buttons.map((b) => b.text), order, "order is the dealt order, untouched");
      // Strip what may differ per slot: the text, the A–D letter and the React key (card id + slot index).
      const shapes = buttons.map(({ text: _t, letter: _l, key: _k, ...rest }) => JSON.stringify(rest));
      assert.equal(new Set(shapes).size, 1, `${card.id}: every choice has the same class/attributes`);
      buttons.forEach((b, i) => {
        assert.equal(b.className, "plate-choice");
        assert.equal(b.letter, CHOICE_LETTERS[i]);
        assert.equal(b.key, `${card.id}:${i}`);
        // Nothing but the text carries the answer.
        // (key and letter are slot-only — checked above — so a one-character answer like "3" can't false-alarm here)
        const { text: _t, key: _k, letter: _l, ...rest } = b;
        assert.ok(!JSON.stringify(rest).includes(card.answer), `${card.id}: answer leaks outside the text`);
      });
    }
  }
});

test("choiceButtons cannot see the answer (takes only the card id and the choices)", () => {
  assert.equal(choiceButtons.length, 2);
});

test("keys change from card to card, so a new card mounts fresh buttons", () => {
  const a = choiceButtons("card-a", CARDS[0]!.choices).map((b) => b.key);
  const b = choiceButtons("card-b", CARDS[0]!.choices).map((b) => b.key);
  assert.ok(a.every((k) => !b.includes(k)));
});

test("dropStaleFocus blurs a focused button and leaves other focus alone", () => {
  let blurred = 0;
  dropStaleFocus({ activeElement: { tagName: "BUTTON", blur: () => blurred++ } });
  assert.equal(blurred, 1);
  dropStaleFocus({ activeElement: { tagName: "DIV", blur: () => blurred++ } });
  dropStaleFocus({ activeElement: null });
  dropStaleFocus(null);
  assert.equal(blurred, 1);
});

test("VaultModal renders the trivia choices through choiceButtons, with nothing tied to the answer", () => {
  const src = read("../components/keyline/VaultModal.tsx");
  assert.match(src, /choiceButtons\(quiz\.id, quiz\.choices\)\.map/);
  const start = src.indexOf('<div className="plate-choices">');
  const end = src.indexOf("A–D or 1–4", start);
  assert.ok(start > 0 && end > start);
  const block = src.slice(start, end);
  assert.doesNotMatch(block, /quiz\.answer|\.answer\b|correct|data-answer|is-answer|is-right/);
  assert.doesNotMatch(src, /autoFocus|\.focus\(/, "no pre-focused button on a lamp card");
  assert.match(src, /dropStaleFocus\(document\)/);
});

test("friend ticket choices only change after a pick, never by the answer", () => {
  const src = read("../routes/t/$token.tsx");
  const line = src.split("\n").find((l) => l.includes('className={`plate-choice'));
  assert.ok(line, "friend ticket choice button found");
  assert.doesNotMatch(line!, /answer|correct/);
  assert.doesNotMatch(src, /autoFocus/);
});

test("answer-button hover styles only apply on devices that really hover", () => {
  const css = read("../styles.css");
  for (const sel of [".plate-choice:hover", ".field-card:hover", ".wh-choice:not(:disabled):hover", ".ms-box:hover"]) {
    const at = css.indexOf(sel);
    assert.ok(at > 0, `${sel} present`);
    // The nearest preceding @media or top-level rule close must be an @media (hover: hover) block.
    const before = css.slice(0, at);
    const media = Math.max(before.lastIndexOf("@media (hover:hover)"), before.lastIndexOf("@media (hover: hover)"));
    assert.ok(media > 0, `${sel} inside @media (hover: hover)`);
    const between = before.slice(media);
    assert.doesNotMatch(between, /\n\}/, `${sel} is still inside that @media block`);
    assert.equal(css.split(sel).length - 1, 1, `${sel} defined once`);
  }
});
