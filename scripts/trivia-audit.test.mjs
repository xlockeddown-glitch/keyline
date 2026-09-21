import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  answerInPrompt,
  auditCraft,
  auditMath,
  auditSemantics,
  auditValidity,
  computeMath,
  contentOverlap,
  extractQuestions,
  hashItem,
  isLookupPlate,
  namedDistractor,
  reverseLeak,
  teamCityGiveaway,
} from "./trivia-audit.mjs";

test("extracts q() plates including unicode operators", () => {
  const src = `
    q("What is 8 + 7?", ["13", "14", "15", "16"], "15", 1),
    q("Hello plate?", [
      "A",
      "B",
      "C",
      "D"
    ], "B", 2, "a fact"),
  `;
  const items = extractQuestions(src, "/workspace/src/game/banks/x.ts");
  assert.equal(items.length, 2);
  assert.equal(items[0].answer, "15");
  assert.deepEqual(items[0].choices, ["13", "14", "15", "16"]);
  assert.equal(items[1].diff, 2);
});

test("validity catches answer not on the plate", () => {
  const errors = auditValidity([
    {
      q: "What is the capital of Texas?",
      choices: ["Dallas", "Houston", "Austin", "El Paso"],
      answer: "Waco",
      diff: 1,
      file: "t.ts",
      line: 1,
    },
  ]);
  assert.equal(errors.some((e) => e.kind === "answer"), true);
});

test("validity catches the answer written into the prompt", () => {
  assert.equal(answerInPrompt("The Buffalo Sabres are based in which city?", "Buffalo"), true);
  assert.equal(answerInPrompt("Which NHL team calls Buffalo home?", "Buffalo Sabres"), false);
  assert.equal(answerInPrompt("The Golden State Warriors are based in which city?", "San Francisco"), false);
  assert.equal(teamCityGiveaway("Which NFL team calls Green Bay home?", "Green Bay Packers"), true);
  assert.equal(teamCityGiveaway("Which NBA team calls San Francisco home?", "Golden State Warriors"), false);
  const errors = auditValidity([
    {
      q: "The Buffalo Sabres are based in which city?",
      choices: ["Montreal", "Buffalo", "Dallas", "Salt Lake City"],
      answer: "Buffalo",
      diff: 1,
      file: "sports.ts",
      line: 1,
    },
    {
      q: "Which NFL team calls Green Bay home?",
      choices: ["Indianapolis Colts", "Green Bay Packers", "Seattle Seahawks", "Cincinnati Bengals"],
      answer: "Green Bay Packers",
      diff: 1,
      file: "sports.ts",
      line: 2,
    },
  ]);
  assert.equal(errors.filter((e) => e.kind === "leak").length, 2);
});

test("conflicting answers for the same prompt fail", () => {
  const plate = (answer, line) => ({
    q: "What is the capital of Texas?",
    choices: ["Dallas", "Houston", "Austin", "El Paso"],
    answer,
    diff: 1,
    file: "t.ts",
    line,
  });
  const errors = auditValidity([plate("Austin", 1), plate("Dallas", 2)]);
  assert.equal(errors.some((e) => e.kind === "conflict"), true);
});

test("computes core math plates", () => {
  assert.equal(computeMath("What is 8 + 7?"), "15");
  assert.equal(computeMath("What is 6 × 7?"), "42");
  assert.equal(computeMath("What is 36 ÷ 6?"), "6");
  assert.equal(computeMath("What is 2³ (2 to the third power)?"), "8");
  assert.equal(computeMath("Half of 18 is…"), "9");
  assert.equal(computeMath("10% of 50 is…"), "5");
  assert.equal(computeMath("If 3x + 5 = 20, x is…"), "5");
  assert.equal(computeMath("The area of a 3-by-5 rectangle is…"), "15");
  assert.equal(computeMath("The remainder when 100 is divided by 7 is…"), "2");
  assert.equal(computeMath("5 choose 2 (₅C₂) is…"), "10");
  assert.equal(computeMath("The 10th Fibonacci number (1, 1, 2, 3, 5…) is…"), "55");
});

test("math audit flags a wrong sum", () => {
  const errors = auditMath([
    {
      q: "What is 8 + 7?",
      choices: ["13", "14", "15", "16"],
      answer: "14",
      diff: 1,
      file: "math.ts",
      line: 4,
    },
  ]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].kind, "math");
});

test("lookup plates are the ones Wikipedia should see", () => {
  assert.equal(isLookupPlate({ q: "What is the capital of Texas?", answer: "Austin" }), true);
  assert.equal(isLookupPlate({ q: "What is 8 + 7?", answer: "15" }), false);
});

test("hash is stable for a plate", () => {
  const a = hashItem({ q: "x", answer: "y", choices: ["y", "a", "b", "c"] });
  const b = hashItem({ q: "x", answer: "y", choices: ["y", "a", "b", "c"] });
  assert.equal(a, b);
});

test("craft catches language, caps, punctuation, and giveaway overlap", () => {
  assert.equal(contentOverlap("Which NFL team calls Green Bay home?", "Green Bay Packers"), false);
  const { errors, warnings } = auditCraft([
    {
      q: "where do the green back packers call home",
      choices: ["Green Bay", "Chicago", "Detroit", "Dallas"],
      answer: "Green Bay",
      diff: 1,
      file: "sports.ts",
      line: 3,
    },
    {
      q: "Lake Loch Ness is in which region?",
      choices: ["Europe", "Asia", "Africa", "Oceania"],
      answer: "Europe",
      diff: 2,
      file: "nature.ts",
      line: 4,
    },
    {
      q: "The the capitol is where?",
      choices: ["Austin", "Dallas", "Houston", "Waco"],
      answer: "Austin",
      diff: 1,
      file: "local.ts",
      line: 5,
    },
    {
      q: "What is 8 + 7...",
      choices: ["13", "14", "15", "16"],
      answer: "15",
      diff: 1,
      file: "math.ts",
      line: 6,
    },
  ]);
  assert.equal(errors.some((e) => e.kind === "caps"), true);
  assert.equal(errors.some((e) => e.kind === "language" && e.detail.includes("back packers")), true);
  assert.equal(errors.some((e) => e.kind === "language" && e.detail.includes("Loch Ness")), true);
  assert.equal(errors.some((e) => e.kind === "language" && e.detail.includes("the")), true);
  assert.equal(errors.some((e) => e.kind === "punct" && e.q.includes("8 + 7")), true);
  assert.equal(warnings.some((w) => w.detail.includes("ellipsis")), true);
});

test("semantics catches partial-truth distractors and alias pairs", () => {
  assert.equal(namedDistractor("Asia / Europe", ["Europe", "Asia / Europe", "Africa", "Australia"]), "Europe");
  assert.equal(namedDistractor("Lycosidae", ["Theraphosidae", "Lycosidae", "Ixodidae", "Scorpionidae"]), null);
  const { errors, warnings } = auditSemantics([
    {
      q: "Lake Caspian is in which region?",
      choices: ["Europe", "Asia / Europe", "North America", "Australia"],
      answer: "Asia / Europe",
      diff: 2,
      file: "geo.ts",
      line: 1,
    },
    {
      q: "The FIFA World Cup is contested in which sport?",
      choices: ["Rugby", "Soccer", "Football", "Hockey"],
      answer: "Soccer",
      diff: 1,
      file: "sports.ts",
      line: 2,
    },
    {
      q: "Detroit-style pizza is…",
      choices: ["a New York fold", "square and baked in a pan", "Chicago deep-dish as this name", "a cone"],
      answer: "square and baked in a pan",
      diff: 1,
      file: "food.ts",
      line: 3,
    },
  ]);
  assert.equal(errors.some((e) => e.detail.includes("partial truth")), true);
  assert.equal(errors.some((e) => e.detail.includes("Soccer and football")), true);
  assert.equal(errors.some((e) => e.detail.includes("as this name")), true);
});

test("semantics catches reverse leaks without flagging New Mexico", () => {
  assert.equal(
    reverseLeak("Medina", ["Mecca as a leaving of Medina", "Medina", "Jerusalem", "Cairo"]),
    "Mecca as a leaving of Medina",
  );
  assert.equal(reverseLeak("Mexico", ["Mexico", "New Mexico only", "Oklahoma", "Louisiana"]), null);
  assert.equal(reverseLeak("Oxidized", ["Never oxidized", "Oxidized", "Fermented", "Smoked"]), null);
  const { errors } = auditSemantics([
    {
      q: "The Hijra is the move to…",
      choices: ["Mecca as a leaving of Medina", "Medina", "Jerusalem", "Cairo"],
      answer: "Medina",
      diff: 2,
      file: "hist.ts",
      line: 1,
    },
  ]);
  assert.equal(errors.some((e) => e.detail.includes("reverse leak")), true);
});
