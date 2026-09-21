import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assignRarity,
  buildReport,
  catalogFromSource,
  checkGeneratorBatch,
  classifyItem,
  compileNichePatterns,
  flagInventory,
  formatReport,
  keyPathByLine,
  loadQuotas,
  matchNiche,
} from "./trivia-balance.mjs";

const Q = loadQuotas();
const NICHES = compileNichePatterns(Q);

const SAMPLE = `
import { q } from "../quiz";
export const GENERAL_BANK = {
  sports: [
    q("The Buffalo Bills are based in which city?", ["Orchard Park", "Cincinnati", "Nashville", "Las Vegas"], "Orchard Park", 1),
  ],
  food: [
    q("A breakfast taco in Austin is often on a…", ["bagel only", "flour tortilla", "baguette", "lettuce wrap only"], "flour tortilla", 1),
  ],
};
export const CITY_EXTRA = {
  austin: {
    local: [
      q("Sixth Street is Austin's famous…", ["river dam", "entertainment strip", "airport runway", "capitol lawn"], "entertainment strip", 1),
    ],
  },
};
export const NATURE_LIFE = [
  q("Urticating hairs are…", ["venom crystals", "barbed defensive bristles", "silk strands", "book-lung plates"], "barbed defensive bristles", 2),
];
`;

test("key path captures cat, city, and bank arrays", () => {
  const paths = keyPathByLine(SAMPLE);
  const sports = [...paths.entries()].find(([, p]) => p.includes("sports"));
  const city = [...paths.entries()].find(([, p]) => p.includes("austin"));
  const life = [...paths.entries()].find(([, p]) => p.includes("NATURE_LIFE"));
  assert.ok(sports);
  assert.ok(city);
  assert.deepEqual(city[1].slice(-2), ["austin", "local"]);
  assert.ok(life);
});

test("catalog classifies topic, city, niche, specialty", () => {
  const rows = catalogFromSource(SAMPLE, "src/game/banks/general.ts", Q);
  const bills = rows.find((r) => r.q.includes("Buffalo Bills"));
  const taco = rows.find((r) => r.q.includes("breakfast taco"));
  const sixth = rows.find((r) => r.q.includes("Sixth Street"));
  const hairs = rows.find((r) => r.q.includes("Urticating"));
  assert.equal(bills.topic, "sports");
  assert.equal(bills.niche, "sports-franchise");
  assert.equal(bills.scope, "general");
  assert.equal(taco.topic, "food");
  assert.equal(sixth.city, "austin");
  assert.equal(sixth.topic, "local");
  assert.equal(sixth.scope, "city");
  assert.equal(hairs.niche, "tarantula");
  assert.equal(hairs.specialty, true);
  assert.equal(hairs.topic, "nature");
});

test("nature_life bank is specialty even without keywords", () => {
  const item = {
    q: "A quiet molt fact",
    answer: "yes",
    diff: 3,
    file: "src/game/banks/nature_life.ts",
    line: 1,
  };
  const row = classifyItem(item, ["NATURE_LIFE"], Q, NICHES);
  assert.equal(row.specialty, true);
  assert.equal(row.scope, "specialty");
  assert.equal(row.topic, "nature");
});

test("rarity is deterministic from prompt id", () => {
  const a = assignRarity({ q: "What is 2 + 2?", answer: "4", diff: 1 });
  const b = assignRarity({ q: "What is 2 + 2?", answer: "4", diff: 1 });
  assert.equal(a, b);
  assert.ok(["white", "blue", "green", "amber", "red", "violet"].includes(a));
});

test("inventory flags over-represented topics and niches", () => {
  const sports = Array.from({ length: 40 }, (_, i) => ({
    topic: "sports",
    niche: "sports-franchise",
    bank: "general",
    specialty: false,
    rarity: "white",
    q: `q${i}`,
  }));
  const other = Array.from({ length: 10 }, (_, i) => ({
    topic: "food",
    niche: null,
    bank: "general",
    specialty: false,
    rarity: "green",
    q: `f${i}`,
  }));
  const flags = flagInventory([...sports, ...other], Q);
  assert.ok(flags.some((f) => f.kind === "over-topic" && f.key === "sports"));
  assert.ok(flags.some((f) => f.kind === "over-niche" && f.key === "sports-franchise"));
});

test("generator bulk rejects specialty flood and easy deep cuts", () => {
  const flood = Array.from({ length: 20 }, (_, i) => ({
    cat: "nature",
    q: `Urticating hairs fact ${i}`,
    answer: "barbed bristles",
    diff: 1,
  }));
  const flags = checkGeneratorBatch(flood, Q, { bank: "general" });
  assert.ok(flags.some((f) => f.kind === "gen-specialty"));
  const deep = Array.from({ length: 12 }, (_, i) => ({
    cat: "science",
    q: `Gauge block wring ${i}`,
    answer: "interference",
    diff: 1,
  }));
  const deepFlags = checkGeneratorBatch(deep, Q, { bank: "science_life" });
  assert.ok(deepFlags.some((f) => f.kind === "gen-deep-easy"));
});

test("balanced bulk passes generator quotas", () => {
  const rows = [];
  for (const cat of ["local", "food", "arts", "political", "sports"]) {
    for (let i = 0; i < 4; i++) {
      rows.push({ cat, q: `${cat} general question ${i} about the world`, answer: "ok", diff: 2 });
    }
  }
  assert.equal(checkGeneratorBatch(rows, Q, { bank: "general" }).length, 0);
});

test("report copy says trivia cards, never plates", () => {
  const catalog = catalogFromSource(SAMPLE, "src/game/banks/general.ts", Q);
  const text = formatReport(buildReport(catalog, Q));
  assert.match(text, /trivia card/i);
  assert.equal(/\bplates?\b/i.test(text), false);
  assert.equal(matchNiche("Green Bay's NFL club is nicknamed the… Packers", NICHES), "sports-franchise");
});

test("python quota helper clamps specialty diffs", async () => {
  const { execFileSync } = await import("node:child_process");
  const { dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const here = dirname(fileURLToPath(import.meta.url));
  const out = execFileSync(
    "python3",
    [
      "-c",
      "from trivia_quota import clamp_diff, is_specialty, check_bulk\nassert is_specialty('Urticating hairs are', 'bristles')\nassert clamp_diff('Urticating hairs are', 'bristles', 1)==3\nflags=check_bulk([('nature','Urticating hairs %d' % i,'x','bristles',1) for i in range(20)], 'general')\nassert flags\nprint('ok')",
    ],
    { encoding: "utf8", cwd: here },
  );
  assert.match(out, /ok/);
});
