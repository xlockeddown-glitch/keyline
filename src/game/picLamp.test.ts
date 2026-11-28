import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PIC_CARDS, picCards, pickPicCard } from "./banks/pic.ts";
import { PIC_IDS } from "./picClue.ts";
import { avoidList, deal, formatFor, grade, nonceRoll, openToken, picShuffled, publicFormatId, resetGradeRing, FORMAT_CHANCE, type TriviaDeps } from "./triviaService.ts";
import { autopilotHit } from "./carPerks.ts";
import type { DealInput } from "./triviaSchema.ts";
import type { Poi, TriviaQ } from "./types.ts";

const root = new URL("../../", import.meta.url);
const WHITE_LAMP: Poi = { id: "lamp-w", name: "Test", kind: "landmark", tier: "white", lat: 0, lng: 0, lore: "" };
const BLUE_LAMP: Poi = { ...WHITE_LAMP, id: "lamp-b", tier: "blue" };
const GREEN_LAMP: Poi = { ...WHITE_LAMP, id: "lamp-g", tier: "green" };
const AMBER_LAMP: Poi = { ...WHITE_LAMP, id: "lamp-a", tier: "amber" };
const RED_LAMP: Poi = { ...WHITE_LAMP, id: "lamp-r", tier: "red" };

const CLASSIC: TriviaQ = {
  id: "classic-1",
  q: "Unused classic fallback?",
  choices: ["A", "B", "C", "D"],
  answer: "A",
  diff: 1,
  rarity: "white",
};

function dealIn(over: Partial<DealInput> = {}): DealInput {
  return {
    city: "denver",
    cat: "geography",
    poiId: WHITE_LAMP.id,
    windowMs: 25000,
    seen: [],
    saveId: "s1",
    formats: ["tf", "near", "order", "pic"],
    ...over,
  };
}

function formatHitNonce(wantHit: boolean, prefix = "pic-n") {
  for (let i = 0; i < 4000; i++) {
    const n = `${prefix}-${i}`;
    if ((nonceRoll("kl-format", n) < FORMAT_CHANCE) === wantHit) return n;
  }
  throw new Error("no nonce");
}

function deps(over: Partial<TriviaDeps> = {}): TriviaDeps {
  return {
    now: () => 1_000_000,
    secret: "test-secret-pic-207",
    pick: () => CLASSIC,
    card: (id) => (id === CLASSIC.id ? CLASSIC : null),
    fmt: (id) => PIC_CARDS.find((c) => c.id === id || publicFormatId(c) === id) ?? null,
    pickFormat: (kind, _cat, tier, avoid, roll, opts) => (kind === "pic" ? pickPicCard(tier, avoid, roll, opts) : null),
    namedPoi: (_city, id) => (id === AMBER_LAMP.id ? AMBER_LAMP : id === RED_LAMP.id ? RED_LAMP : id === GREEN_LAMP.id ? GREEN_LAMP : id === BLUE_LAMP.id ? BLUE_LAMP : WHITE_LAMP),
    nonce: () => formatHitNonce(true),
    ...over,
  };
}

test("0.1.207: 24 stamps × 4 sourced geography cards, unique ids, answer in choices", () => {
  const cards = picCards();
  assert.equal(cards.length, 96);
  assert.equal(new Set(cards.map((c) => c.id)).size, 96);
  assert.equal(new Set(cards.map((c) => c.pic)).size, 24);
  const byPic = new Map<string, typeof cards>();
  for (const c of cards) {
    assert.equal(c.kind, "pic");
    assert.equal(c.cat, "geography");
    assert.ok(PIC_IDS.includes(c.pic as (typeof PIC_IDS)[number]), c.pic);
    assert.ok(c.choices.includes(c.answer), c.id);
    assert.equal(new Set(c.choices).size, 4);
    assert.ok(c.sources.length >= 1, c.id);
    assert.ok(c.sources.every((s) => s.startsWith("https://en.wikipedia.org/wiki/")), c.id);
    assert.ok(c.fact.length >= 20, c.id);
    assert.match(c.id, /^pic-p\d{2}-(name|capital|continent|extra)$/);
    const list = byPic.get(c.pic) ?? [];
    list.push(c);
    byPic.set(c.pic, list);
  }
  for (const [pic, list] of byPic) {
    assert.equal(list.length, 4, pic);
    assert.equal(list.filter((c) => c.role === "name").length, 1, pic);
    assert.ok(list.filter((c) => c.role === "name").every((c) => c.rarity === "white"));
    assert.ok(list.filter((c) => c.role !== "name").every((c) => c.rarity === "amber"));
  }
});

test("0.1.207: every stamp is a 480px two-ink lossless WebP at or under 1,536 B with an opaque name", () => {
  const out = execFileSync("python3", ["scripts/qa-pic-stamps.py"], { cwd: fileURLToPath(root), encoding: "utf8" });
  assert.match(out, /ok — 24 stamps/);
});

test("formatFor prefers pic at geography white/blue/green/amber when the client opted in", () => {
  const hit = formatHitNonce(true, "fmt-hit");
  const miss = formatHitNonce(false, "fmt-miss");
  const input = dealIn();
  assert.equal(formatFor(input, WHITE_LAMP, "geography", hit), "pic");
  assert.equal(formatFor(input, BLUE_LAMP, "geography", hit), "pic");
  assert.equal(formatFor(input, GREEN_LAMP, "geography", hit), "pic");
  assert.equal(formatFor(dealIn({ poiId: AMBER_LAMP.id }), AMBER_LAMP, "geography", hit), "pic");
  assert.equal(formatFor(input, WHITE_LAMP, "geography", miss), null);
  assert.notEqual(formatFor(dealIn({ poiId: RED_LAMP.id }), RED_LAMP, "geography", hit), "pic", "pic is not dealt at red");
  assert.equal(formatFor(dealIn({ poiId: RED_LAMP.id, formats: ["pic"] }), RED_LAMP, "geography", hit), null, "pic-only at red falls through");
  assert.equal(formatFor(input, WHITE_LAMP, "history", hit), "tf", "non-geography keeps TF");
  assert.equal(formatFor(dealIn({ formats: ["tf", "near", "order"] }), WHITE_LAMP, "geography", hit), "tf", "no pic opt-in");
  assert.equal(formatFor(dealIn({ spark: true }), WHITE_LAMP, "geography", hit), null);
  assert.equal(formatFor(dealIn({ poiId: "placed-1" }), { ...WHITE_LAMP, id: "placed-1" }, "geography", hit), null);
  assert.equal(formatFor(dealIn({ poiId: "blitz-1" }), { ...WHITE_LAMP, id: "blitz-1" }, "geography", hit), null);
  assert.equal(formatFor(dealIn({ poiId: "flight-1" }), { ...WHITE_LAMP, id: "flight-1" }, "geography", hit), null);
  assert.equal(formatFor(dealIn({ poiId: "comet-denver-1" }), { ...WHITE_LAMP, id: "comet-denver-1" }, "geography", hit), null);
});

test("pickPicCard deals name-it off amber and a derived fact at amber, and rotates stamps via avoidList", () => {
  const name = pickPicCard("white", [], 0);
  assert.ok(name && name.kind === "pic" && name.role === "name");
  const derived = pickPicCard("amber", [], 0);
  assert.ok(derived && derived.kind === "pic" && derived.role !== "name");
  const d = deps();
  const avoid = avoidList(d, [publicFormatId(name!)]);
  assert.ok(avoid.includes(name!.id));
  assert.ok(avoid.includes(name!.pic), "avoidList records the opaque stamp id");
  assert.ok(!avoid.includes(name!.q), "shared prompts are not avoided");
  const next = pickPicCard("white", avoid, 0);
  assert.ok(next && next.kind === "pic" && next.pic !== name!.pic, "rotate to an unused stamp");
  const pinned = pickPicCard("white", [], 0, { pic: "p01" });
  assert.ok(pinned && pinned.kind === "pic" && pinned.pic === "p01" && pinned.role === "name");
});

test("deal shuffles with a secret seed, public card carries the opaque pic id, token has no answer or index", () => {
  const d = deps({ nonce: () => "nonce-pic-deal", forcePic: "p01" });
  const r = deal(d, { userId: null }, dealIn());
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.card.kind, "pic");
  assert.equal(r.card.pic, "p01");
  assert.equal(r.card.rarity, "white");
  assert.equal(r.card.choices.length, 4);
  assert.match(r.card.id, /^f[A-Za-z0-9_-]+$/);
  const body = openToken(d.secret, r.token);
  assert.ok(body);
  assert.equal(body!.f, "pic");
  const raw = Buffer.from(r.token.split(".")[0]!, "base64url").toString("utf8");
  assert.doesNotMatch(raw, /Italy|Rome|Switzerland/);
  assert.doesNotMatch(raw, /"ix"|correctIndex|answer/);
  assert.equal(JSON.stringify(r.card).includes("Italy") && r.card.choices.includes("Italy"), r.card.choices.includes("Italy"));
  // reshuffle of the same nonce matches what the client saw
  const card = PIC_CARDS.find((c) => publicFormatId(c) === r.card.id)!;
  assert.deepEqual(picShuffled(card.choices, d.secret, body!.n), r.card.choices);
});

test("grade uses pick index only and ignores choice text; a missing pick is a timeout", async () => {
  resetGradeRing();
  const d = deps({ nonce: () => "nonce-pic-grade", forcePic: "p01" });
  const r = deal(d, { userId: null }, dealIn({ formats: ["tf", "near", "order", "pic"] }));
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const italyAt = r.card.choices.indexOf("Italy");
  assert.ok(italyAt >= 0);
  const right = await grade(d, { userId: null }, { token: r.token, choice: "Spain", clientMs: 1200, pick: italyAt });
  assert.equal(right.ok, true);
  if (right.ok) {
    assert.equal(right.correct, true);
    assert.equal(right.answer, "Italy");
    assert.ok(right.fact);
  }
  resetGradeRing();
  const r2 = deal({ ...d, nonce: () => "nonce-pic-grade-2" }, { userId: null }, dealIn());
  assert.equal(r2.ok, true);
  if (!r2.ok) return;
  const wrongAt = r2.card.choices.indexOf("Spain");
  const miss = await grade(d, { userId: null }, { token: r2.token, choice: "Italy", clientMs: 900, pick: wrongAt });
  assert.equal(miss.ok, true);
  if (miss.ok) {
    assert.equal(miss.correct, false);
    assert.equal(miss.answer, "Italy");
  }
  resetGradeRing();
  const r3 = deal({ ...d, nonce: () => "nonce-pic-grade-3" }, { userId: null }, dealIn());
  assert.equal(r3.ok, true);
  if (!r3.ok) return;
  const late = await grade(d, { userId: null }, { token: r3.token, choice: null, clientMs: 800 });
  assert.equal(late.ok, true);
  if (late.ok) {
    assert.equal(late.correct, false);
    assert.equal(late.timedOut, true);
  }
});

test("publicFormatId differs for two name-it cards that share a prompt, and never hashes the country name", () => {
  const a = PIC_CARDS.find((c) => c.pic === "p01" && c.role === "name")!;
  const b = PIC_CARDS.find((c) => c.pic === "p02" && c.role === "name")!;
  assert.equal(a.q, b.q);
  assert.notEqual(publicFormatId(a), publicFormatId(b));
  const hashed = createHash("sha256").update(`klf158\0pic\0${a.q}`).digest("base64url").slice(0, 14);
  assert.notEqual(publicFormatId(a), `f${hashed}`);
  assert.doesNotMatch(publicFormatId(a), /Italy|p01name/i);
});

test("deal records the lamp tier on a pic card, and Autopilot can strike a wrong option", () => {
  let nonce = "ap-0";
  for (let i = 0; i < 20000; i++) {
    nonce = `ap-${i}`;
    if (autopilotHit("model3", nonce)) break;
  }
  assert.equal(autopilotHit("model3", nonce), true);
  const d = deps({ nonce: () => nonce, forcePic: "p01" });
  const r = deal(d, { userId: null }, dealIn({ poiId: BLUE_LAMP.id }), [], { car: "model3" });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.card.kind, "pic");
  assert.equal(r.card.rarity, "blue", "the public card and token use the lamp tier, not the bank white");
  const body = openToken(d.secret, r.token);
  assert.equal(body?.r, "blue");
  assert.ok(r.card.struck);
  assert.notEqual(r.card.struck, "Italy");
  assert.ok(r.card.choices.includes(r.card.struck!));
  assert.equal(body?.x?.st, 1);
});

test("sources doc lists every card", () => {
  const md = readFileSync(new URL("docs/trivia-pic-sources.md", root), "utf8");
  for (const c of PIC_CARDS) {
    assert.ok(md.includes(c.pic), c.id);
    assert.ok(md.includes(c.answer), c.id);
    assert.ok(md.includes(c.sources[0]!), c.id);
  }
});

// Keep a silent reference so a tree-shaken editor doesn't drop sharp in some runs.
