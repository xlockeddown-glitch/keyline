import { test } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { ORDER_CARDS, generateOrder, mathOperands, mathOrderLeaks, orderItems, orderLabels, orderScore, validateOrder } from "./banks/order.ts";
import { deal, grade, formatFor, gradeOf, nonceRoll, openToken, publicCardId, publicFormatId, resetGradeRing, type TriviaDeps } from "./triviaService.ts";
import { cleanOrder, orderCoins } from "./orderPay.ts";
import { autopilotHit } from "./carPerks.ts";
import { sealPlate } from "./rarity.ts";
import { DealIn, GradeIn } from "./triviaSchema.ts";
import { isClassic } from "./classicKind.ts";
import { offerable, noteAnswered, readRecent } from "./friendOffer.ts";
import { autopilotStrike } from "./carPerks.ts";
import { strikeOption } from "./scoutPerks.ts";
import { emptyWallet, gradeGrant, type GradePay } from "./wallet.ts";
import type { Poi, TriviaQ } from "./types.ts";

const card = ORDER_CARDS.find((c) => c.rarity === "amber")!;
const lamp: Poi = { id: "blank-order-test", name: "Order lamp", kind: "park", tier: "amber", lat: 0, lng: 0, lore: "" };
const input = DealIn.parse({ city: "austin", poiId: lamp.id, cat: "history", formats: ["tf", "near", "order"], windowMs: 25000, saveId: "order-test", seen: [] });
function hit(suffix = "") {
  for (let i = 0; ; i++) if (nonceRoll("kl-format", `order-${suffix}-${i}`) < 0.2) return `order-${suffix}-${i}`;
}
function deps(nonce = hit()): TriviaDeps {
  return { now: () => 10000, nonce: () => nonce, secret: "order-test-secret", namedPoi: () => lamp, pick: () => { throw new Error("four-choice fallback"); }, card: () => null, pickFormat: () => card, fmt: () => card, rand: () => 0.42 };
}
function tokens(nonce = hit()) {
  const items = orderItems(card, "order-test-secret", nonce);
  return orderLabels(card).map((l) => items.find((x) => x.label === l)!.token);
}

test("order score: exact, exactly one adjacent swap, non-adjacent swap, malformed and cross-deal tokens", () => {
  const right = tokens();
  const score = (submission: unknown) => orderScore(card, "order-test-secret", hit(), submission);
  assert.equal(score(right), "exact");
  for (let i = 0; i < right.length - 1; i++) {
    const swap = [...right]; [swap[i], swap[i + 1]] = [swap[i + 1]!, swap[i]!];
    assert.equal(score(swap), "swap");
  }
  const far = [...right]; [far[0], far[2]] = [far[2]!, far[0]!];
  assert.equal(score(far), "miss");
  for (const bad of [null, {}, [], right.slice(1), [...right, "extra"], right.map(() => right[0]), ["foreign", ...right.slice(1)], tokens(hit("other")), [1, 2, 3, 4]]) assert.equal(score(bad), "miss");
});

test("deal has shuffled opaque tokens, no keys/order/answers in either payload or signed token; tokens differ per deal", () => {
  const a = deal(deps(), { userId: null }, input), b = deal(deps(hit("other")), { userId: null }, input);
  assert.ok(a.ok && b.ok);
  assert.equal(a.card.kind, "order");
  assert.deepEqual(a.card.choices, []);
  assert.equal(a.card.struck, undefined);
  assert.equal(a.card.items?.length, 4);
  for (const item of a.card.items!) {
    assert.match(item.token, /^[A-Za-z0-9_-]{24}$/);
    assert.deepEqual(Object.keys(item).sort(), ["label", "token"]);
    assert.notEqual(item.token, b.card.items!.find((x) => x.label === item.label)!.token);
  }
  const body = openToken(deps().secret, a.token)!;
  for (const text of [JSON.stringify(a.card), JSON.stringify(body)]) {
    assert.doesNotMatch(text, /"(?:key|answer|correctOrder|sortedIndex|itemsIndex)"/);
  }
  assert.ok(!JSON.stringify(body).includes(card.items[0]!.label));
  assert.equal(publicFormatId(card), publicFormatId({ ...card, items: [...card.items].reverse() }), "identity is independent of authored item order");
  assert.notDeepEqual(a.card.items!.map((x) => x.label), orderLabels(card));
});

test("grade only reveals order after submission; swap clears, malformed misses, replay keeps first sequence", async () => {
  for (const mode of ["exact", "swap", "far", "duplicate", "unknown", "short", "other"] as const) {
    resetGradeRing();
    const d = deps(hit(mode));
    let clock = 10000;
    d.now = () => clock;
    const dealt = deal(d, { userId: null }, input); assert.ok(dealt.ok);
    let sequence = tokens(hit(mode));
    if (mode === "swap") [sequence[0], sequence[1]] = [sequence[1]!, sequence[0]!];
    if (mode === "far") [sequence[0], sequence[2]] = [sequence[2]!, sequence[0]!];
    if (mode === "duplicate") sequence[0] = sequence[1]!;
    if (mode === "unknown") sequence[0] = "unknown";
    if (mode === "short") sequence.pop();
    if (mode === "other") sequence = tokens(hit("foreign"));
    const g = await grade(d, { userId: null }, { token: dealt.token, choice: null, clientMs: 2000, order: sequence });
    assert.ok(g.ok);
    assert.equal(g.correct, mode === "exact" || mode === "swap");
    assert.equal(g.order!.result, mode === "exact" ? "exact" : mode === "swap" ? "swap" : "miss");
    assert.deepEqual(g.order!.labels, orderLabels(card));
    if (mode === "swap") {
      const exactDeal = deal(deps(hit("exact-pay")), { userId: null }, input); assert.ok(exactDeal.ok);
      const exact = await grade(deps(hit("exact-pay")), { userId: null }, { token: exactDeal.token, choice: null, clientMs: 2000, order: tokens(hit("exact-pay")) }); assert.ok(exact.ok);
      // One half-coin signal: `order.result`. The graded mult is not halved, and the server names no guest coins.
      assert.equal(exact.order!.result, "exact");
      assert.equal(g.mult, exact.mult);
      assert.equal(g.mult, gradeOf(g.elapsedMs).mult);
      assert.equal(g.order!.coins, 0);
      assert.equal(exact.order!.coins, 0);
    }
    clock += 60000; // Replays must retain the first timing and half-coin result even after the wick expires.
    const again = await grade(d, { userId: null }, { token: dealt.token, choice: null, clientMs: 2000, order: tokens(hit(mode)) }); assert.ok(again.ok);
    assert.equal(again.replay, true);
    assert.deepEqual(again.order, g.order);
  }
  // The schema is bounded and never throws on a bad list: it becomes [] and grades as a miss.
  for (const malformed of [null, {}, 7, "abcd", Array(25).fill("x"), ["x".repeat(65)], [1, 2, 3, 4], [["a"]]]) {
    assert.deepEqual(GradeIn.parse({ token: "test-token-long", choice: null, clientMs: 2000, order: malformed }).order, []);
  }
  assert.deepEqual(GradeIn.parse({ token: "test-token-long", choice: null, clientMs: 2000, order: ["a", "b"] }).order, ["a", "b"]);
  assert.equal(GradeIn.parse({ token: "test-token-long", choice: null, clientMs: 2000 }).order, undefined);
  // The server sanitizes again (a caller that skipped the schema): junk is a miss, never a throw, and is not kept.
  assert.deepEqual(cleanOrder(["a", "b", "c", "d"]), ["a", "b", "c", "d"]);
  for (const junk of [null, undefined, {}, "abcd", Array(5).fill("x"), ["x".repeat(65)], [1, 2, 3, 4], [{ big: "x".repeat(1e5) }]]) assert.deepEqual(cleanOrder(junk), []);
  for (const junk of [{}, "abcd", Array(5000).fill("x".repeat(1000)), [{ big: "x".repeat(1e5) }], tokens(hit("junk")).map((t) => t + "x".repeat(60))]) {
    resetGradeRing();
    const d = deps(hit("junk"));
    const dealt = deal(d, { userId: null }, input); assert.ok(dealt.ok);
    const g = await grade(d, { userId: null }, { token: dealt.token, choice: null, clientMs: 2000, order: junk as unknown as string[] });
    assert.ok(g.ok && !g.correct && !g.timedOut);
    assert.equal(g.order!.result, "miss");
    // The replay answers from the stored outcome, even when the right tokens arrive afterwards.
    const again = await grade(d, { userId: null }, { token: dealt.token, choice: null, clientMs: 2000, order: tokens(hit("junk")) });
    assert.ok(again.ok && again.replay && !again.correct);
    assert.equal(again.order!.result, "miss");
  }
  // No list at all is the wick running out.
  resetGradeRing();
  const dOut = deps(hit("none"));
  const dealtOut = deal(dOut, { userId: null }, input); assert.ok(dealtOut.ok);
  const out = await grade(dOut, { userId: null }, { token: dealtOut.token, choice: null, clientMs: 2000 });
  assert.ok(out.ok && out.timedOut && !out.correct);
  assert.equal(out.order!.result, "miss");
  assert.ok(!("orderHalf" in GradeIn.parse({ token: "test-token-long", choice: null, clientMs: 2000, orderHalf: true })));
});

test("validator rejects ties, tight relative gaps and nearby dates; all authored and 9000 generated cards pass", () => {
  assert.equal(ORDER_CARDS.length, 30);
  for (const c of ORDER_CARDS) assert.doesNotThrow(() => validateOrder(c), c.id);
  for (const tier of ["green", "amber", "red"] as const) {
    const pool = generateOrder(tier, 3000);
    assert.equal(pool.length, 3000);
    assert.deepEqual(generateOrder(tier, 40), pool.slice(0, 40), "deterministic: the first cards never depend on the count");
    assert.equal(new Set(pool.map((c) => c.id)).size, 3000);
    assert.equal(new Set(pool.map((c) => c.items.map((x) => x.label).sort().join("|"))).size, 3000, "no repeated set");
    for (const c of pool) {
      validateOrder(c);
      assert.equal(c.items.length, tier === "green" ? 3 : 4);
      // The label must not give the order away: in answer order, neither operand runs straight up or down.
      assert.equal(mathOrderLeaks(c), false, c.id);
      const inOrder = [...c.items].sort((a, b) => a.key - b.key);
      for (const side of [0, 1] as const) {
        const ops = inOrder.map((x) => mathOperands(x.label)[side]);
        const up = [...ops].sort((a, b) => a - b), down = [...up].reverse();
        assert.notDeepEqual(ops, up, `${c.id} sorts by operand ${side + 1}`);
        assert.notDeepEqual(ops, down, `${c.id} reverse-sorts by operand ${side + 1}`);
      }
      // And each label really evaluates to its key.
      for (const x of c.items) {
        const [a, b] = mathOperands(x.label);
        assert.equal(x.key, tier === "green" ? a + b : tier === "amber" ? a * b : a * a - b, x.label);
      }
    }
  }
  // The old ladder shape (both operands rising with rank) is exactly what the leak check rejects.
  const ladder = { ...generateOrder("red", 1)[0]!, items: [2, 3, 4, 5].map((b, j) => ({ label: `${42 * (j + 1)}² − ${b}`, key: (42 * (j + 1)) ** 2 - b })) };
  assert.equal(mathOrderLeaks(ladder), true);
  const bad = (keys: number[], gap: "years" | "relative") => ({ ...card, gap, items: keys.map((key, i) => ({ label: `item-${i}`, key })) });
  assert.throws(() => validateOrder(bad([1, 1, 4, 8], "relative")));
  assert.throws(() => validateOrder(bad([100, 104, 200, 300], "relative")));
  assert.throws(() => validateOrder(bad([1900, 1909, 1950, 2000], "years")));
  assert.throws(() => validateOrder(bad([1, NaN, 4, 8], "relative")));
});

test("a fact names only items the card deals; green cards deal three of the four authored items", () => {
  const green = ORDER_CARDS.filter((c) => c.rarity === "green");
  assert.equal(green.length, 10);
  for (const c of ORDER_CARDS) assert.equal(c.items.length, c.rarity === "green" ? 3 : 4, c.id);
  const world = ORDER_CARDS.find((c) => c.id === "order-world")!;
  assert.equal(world.items.length, 3);
  const dropped = ["Berlin Wall falls"];
  assert.doesNotThrow(() => validateOrder(world, [...world.items.map((x) => x.label), ...dropped]));
  for (const fact of ["The Berlin Wall opened in November 1989.", "Berlin Wall falls came last.", "These four events span five centuries."]) {
    assert.throws(() => validateOrder({ ...world, fact }, dropped), /order fact/, fact);
  }
  // A word shared with a dealt label is not a dropped item ("Earth" in "Earth (mass)" vs a dropped "Earth").
  assert.doesNotThrow(() => validateOrder({ ...world, fact: "Constantinople fell to the Ottomans." }, ["Constantinople rebuilt"]));
  // The five facts the review flagged no longer name the item that is not dealt.
  for (const [id, gone] of [["world", "Berlin"], ["islands", "Greenland"], ["rivers", "Nile"], ["radii", "Saturn"], ["moons", "Ganymede"]] as const) {
    const c = ORDER_CARDS.find((x) => x.id === `order-${id}`)!;
    assert.ok(!c.fact.includes(gone) && !c.items.some((x) => x.label.includes(gone)), id);
    assert.doesNotMatch(c.fact, /\b(?:these|all|the) four\b/i);
  }
  assert.equal(ORDER_CARDS.find((c) => c.id === "order-countries")!.items.find((x) => x.label === "Australia (country)")!.key, 7741220);
});

test("format slot restricts fields, rarities, specials; TF/near keep their old slot without order opt-in", () => {
  const nonce = hit();
  for (const cat of ["history", "geography", "science", "math"] as const) for (const tier of ["green", "amber", "red"] as const) {
    assert.equal(formatFor({ ...input, formats: ["order"] }, { ...lamp, tier }, cat, nonce), "order");
  }
  for (const cat of ["arts", "nature", "sports", "local"] as const) assert.equal(formatFor({ ...input, formats: ["order"] }, lamp, cat, nonce), null);
  for (const tier of ["white", "blue", "violet"] as const) assert.equal(formatFor({ ...input, formats: ["order"] }, { ...lamp, tier }, "math", nonce), null);
  for (const id of ["placed-x", "blitz-x", "flight-x", "comet-austin-1"]) assert.equal(formatFor(input, { ...lamp, id }, "history", nonce), null);
  assert.equal(formatFor({ ...input, spark: true }, lamp, "history", nonce), null);
  assert.equal(formatFor({ ...input, formats: ["tf", "near"] }, { ...lamp, tier: "green" }, "history", nonce), "tf");
  assert.equal(formatFor({ ...input, formats: ["tf", "near"] }, lamp, "math", nonce), "near");
});

test("classic allow-list excludes order, other formats, Where am I and future kinds from friends and picker", async () => {
  register("../../scripts/ts-resolve-hooks.mjs", import.meta.url);
  const { everyCard, everyCardCat, GENERAL, pickTrivia } = await import("./trivia.ts");
  const { cardById } = await import("./friendCards.ts");
  const { pickFormatCard } = await import("./triviaBank.ts");
  const firstMath = pickFormatCard("order", "math", "green", [], 0)!;
  const nextMath = pickFormatCard("order", "math", "green", [firstMath.id, firstMath.q], 0)!;
  assert.notEqual(firstMath.id, nextMath.id, "generic math stem must not exhaust the entire pool");
  assert.ok(everyCard().every(isClassic));
  assert.ok(everyCardCat().every(([c]) => isClassic(c)));
  for (const c of ORDER_CARDS) {
    assert.equal(cardById(c.id), null);
    assert.equal(cardById(publicFormatId(c)), null);
    assert.ok(!everyCard().some((x) => x.id === c.id));
  }
  // Every real four-choice public id (and raw id) stays offerable; format ids never are.
  for (const c of everyCard()) {
    assert.ok(offerable(publicCardId(c)), c.id);
    assert.ok(offerable(publicCardId(c), "classic"));
  }
  assert.ok(everyCard().filter((c) => offerable(c.id)).length > everyCard().length * 0.9, "raw plate ids match too");
  for (const c of ORDER_CARDS) assert.equal(offerable(publicFormatId(c)), false);
  for (const kind of ["order", "tf", "near", "where", "future"]) {
    assert.equal(isClassic({ kind }), false);
    assert.equal(offerable("cFake", kind), false);
  }
  const memory = new Map<string, string>();
  const storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => { memory.set(k, v); } };
  noteAnswered(storage, { id: publicFormatId(card), kind: "order", q: card.q, at: 1 });
  assert.deepEqual(readRecent(storage), []);
  // Poison the actual source pool: the picker and enumerators must exclude by kind, even with choices.
  const poison = { ...card, choices: ["a", "b", "c", "d"], answer: "a" } as unknown as TriviaQ;
  const seenClassics = everyCard().map((c) => c.id);
  GENERAL.history.push(poison);
  try {
    assert.ok(!everyCard().includes(poison));
    assert.ok(!everyCardCat().some(([c]) => c === poison));
    assert.notEqual(pickTrivia("austin", "history", lamp, "amber", seenClassics), poison, "the only unseen injected non-classic must never be picked");
  } finally { GENERAL.history.pop(); }
});

test("no-choice order lamps never receive Fox/Autopilot: the real deal path, with a live classic control", () => {
  for (const choices of [[], ["a", "b", "c", "d"]]) {
    assert.equal(strikeOption("fox", "red", choices, "a", 0, "order"), null);
    assert.equal(autopilotStrike("model3", "test", choices, "a", "order"), null);
  }
  const redLamp: Poi = { ...lamp, id: "blank-order-red", tier: "red" };
  const redOrder = ORDER_CARDS.find((c) => c.rarity === "red")!;
  const classic: TriviaQ = { ...sealPlate({ q: "Which is largest?", choices: ["a", "b", "c", "d"], answer: "a", diff: 3 }), rarity: "red" };
  // A nonce that rolls the format slot and Autopilot at once, so both perks are armed for this deal.
  let nonce = "";
  for (let i = 0; !nonce; i++) if (nonceRoll("kl-format", `perk-${i}`) < 0.2 && autopilotHit("model3", `perk-${i}`)) nonce = `perk-${i}`;
  const pay = { streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], lat: 0, lng: 0, scout: "fox", car: "model3" };
  const redIn = DealIn.parse({ ...input, poiId: redLamp.id, pay });
  const proven = { car: "model3", scout: "fox" } as const;
  const d = (over: Partial<TriviaDeps>): TriviaDeps => ({ ...deps(nonce), namedPoi: () => redLamp, pickFormat: () => redOrder, fmt: () => redOrder, pick: () => classic, rand: () => 0, ...over });

  // Fox scout + Autopilot car on a red order lamp: nothing is struck.
  const order = deal(d({}), { userId: null }, redIn, [], proven);
  assert.ok(order.ok);
  assert.equal(order.card.kind, "order");
  assert.equal(order.card.struck, undefined);
  assert.equal(order.card.items?.length, 4);
  assert.deepEqual(order.card.choices, []);

  // Control: the same lamp, coat, car and nonce on a classic card does strike (the setup is live).
  const four = deal(d({ pickFormat: () => null }), { userId: null }, redIn, [], proven);
  assert.ok(four.ok);
  assert.equal(four.card.kind, undefined);
  assert.ok(four.card.struck && four.card.struck !== "a" && four.card.choices.includes(four.card.struck), "Fox strikes a wrong option on a classic card");
  // Autopilot alone (no Fox) strikes it too.
  const auto = deal(d({ pickFormat: () => null }), { userId: null }, DealIn.parse({ ...input, poiId: redLamp.id, pay: { ...pay, scout: "raccoon" } }), [], { car: "model3" });
  assert.ok(auto.ok && auto.card.struck && auto.card.struck !== "a");

  // The kind reaches both perks at the call site: a non-classic four-choice card is never struck.
  const where = deal(d({ pickFormat: () => null, pick: () => ({ ...classic, kind: "where" }) }), { userId: null }, redIn, [], proven);
  assert.ok(where.ok === false || where.card.struck === undefined);
});

test("server wallet halves the complete integer coin grant, rounding down, without reducing clear keys", () => {
  const p: GradePay = { correct: true, elapsedMs: 2000, mult: 1, city: "austin", diff: 2, clearTier: "amber", poiTier: "amber", poiId: lamp.id, lat: 0, lng: 0, streak: 0, loot: 1, lucky: false, cloth: null, charmDay: "", charmTopics: [], topic: "history", dealtAt: 10000, luckyHit: false, perfectBlue: false };
  const full = gradeGrant(emptyWallet(), p), half = gradeGrant(emptyWallet(), { ...p, orderHalf: true });
  assert.ok(full.ok && half.ok);
  assert.equal(half.award!.coins, Math.floor(full.award!.coins / 2));
  assert.equal(half.wallet.coins, half.award!.coins);
  assert.deepEqual(half.award!.keys, full.award!.keys);
  assert.deepEqual(half.wallet.keys, full.wallet.keys);
  // The wallet gains exactly the halved award from any starting pocket, at every grade, streak and tier (odd totals too).
  let odd = 0;
  for (const tier of ["green", "amber", "red"] as const) for (const mult of [1, 0.7, 0.4]) for (const streak of [0, 3, 8]) for (const start of [0, 1, 777, 123_456]) {
    const pay = { ...p, mult, streak, poiTier: tier, clearTier: tier, elapsedMs: mult === 1 ? 2000 : mult === 0.7 ? 6000 : 15000 };
    const w = { ...emptyWallet(), coins: start };
    const f = gradeGrant(w, pay), h = gradeGrant(w, { ...pay, orderHalf: true });
    assert.ok(f.ok && h.ok);
    assert.equal(f.wallet.coins - start, f.award!.coins);
    assert.equal(h.award!.coins, Math.floor(f.award!.coins / 2));
    assert.equal(h.wallet.coins - start, h.award!.coins, "wallet delta equals the halved award");
    assert.deepEqual(h.award!.keys, f.award!.keys);
    if (f.award!.coins % 2) odd++;
  }
  assert.ok(odd > 0, "an odd total was rounded down");
  // A miss pays nothing either way.
  const miss = gradeGrant(emptyWallet(), { ...p, correct: false, mult: 0, orderHalf: true });
  assert.ok(miss.ok);
  assert.equal(miss.wallet.coins, 0);
});

test("guest pay: one half-coin rule shared with the server; the toast and the pocket use the same number", () => {
  assert.equal(orderCoins(101, "swap"), 50);
  assert.equal(orderCoins(100, "swap"), 50);
  assert.equal(orderCoins(1, "swap"), 0);
  assert.equal(orderCoins(0, "swap"), 0);
  assert.equal(orderCoins(-5, "swap"), 0);
  for (const r of ["exact", "miss", null, undefined] as const) assert.equal(orderCoins(101, r), 101);
  // What settleAnswer does for a guest: `total` is the whole local coin grant (vault coin at the graded, unhalved
  // mult, plus tip, key-back and boosts); loot.points is set from orderCoins and the pocket gains loot.points.
  for (const total of [0, 1, 37, 245, 1001]) for (const result of ["exact", "swap"] as const) {
    const pocket = 500;
    const toast = orderCoins(total, result);
    const after = pocket + toast;
    assert.equal(after - pocket, toast);
    assert.equal(toast, result === "swap" ? Math.floor(total / 2) : total);
  }
});
