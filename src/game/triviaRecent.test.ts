// 0.0.58 repeats: one walker's anti-repeat memory follows them across devices (server list for a signed-in walker,
// noted at deal time) and across tabs (the save's list folded in before each deal).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { isSeen, sealPlate, seenSet } from "./rarity.ts";
import { DealIn, dealFor, publicCardId, type TriviaDeps } from "./triviaService.ts";
import { RECENT_KEEP, loadRecent, noteDealt } from "./triviaRecent.ts";
import { mergeSeen, savedSeen } from "./seenMemory.ts";
import type { Sql } from "../lib/db.ts";
import type { Poi, TriviaQ } from "./types";

const migration = (name: string) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8");
function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}
async function db() {
  const pg = new PGlite();
  // Every migration in order, as a deploy applies them (0011's views need the earlier tables).
  const files = readdirSync(new URL("../../migrations/", import.meta.url)).filter((f) => f.endsWith(".sql")).sort();
  for (const m of files) await pg.exec(migration(m));
  return sqlOf(pg);
}

const BANK: TriviaQ[] = Array.from({ length: 80 }, (_, i) =>
  sealPlate({ q: `Card number ${i} asks which lamp?`, choices: [`A${i}`, `B${i}`, `C${i}`, `D${i}`], answer: `A${i}`, diff: 1 }),
);
const LAMP: Poi = { id: "ut-tower", name: "UT Tower", lat: 30.28, lng: -97.74, kind: "campus", tier: "blue", lore: "" };
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function deps(sql?: Sql, fail = false): TriviaDeps {
  const all = new Map<string, TriviaQ>();
  for (const c of BANK) {
    all.set(c.id, c);
    all.set(publicCardId(c), c);
  }
  return {
    now: () => Date.now(),
    secret: "test-secret",
    // Like the real picker: a random unseen card, the oldest-seen when everything is seen.
    pick: (_c, _cat, _p, _t, avoid) => {
      const seen = seenSet(avoid);
      const open = BANK.filter((x) => !isSeen(x, seen));
      return open.length ? open[Math.floor(rand() * open.length)]! : BANK[0]!;
    },
    card: (id) => all.get(id) ?? null,
    namedPoi: (_c, id) => (id === LAMP.id ? LAMP : null),
    series: () => null,
    sql: sql ? async () => (fail ? Promise.reject(new Error("db down")) : sql) : undefined,
  };
}
const input = (seen: string[]) => DealIn.parse({ city: "austin", cat: "local", poiId: LAMP.id, windowMs: 25000, seen, saveId: "s-1" });

function gaps(ids: string[]) {
  let min = Infinity;
  const last = new Map<string, number>();
  ids.forEach((id, k) => {
    if (last.has(id)) min = Math.min(min, k - last.get(id)!);
    last.set(id, k);
  });
  return min;
}

/** Two devices of one walker, each with its own save memory, alternating 50 deals. */
async function twoDevices(d: TriviaDeps, userId: string | null) {
  const mem: string[][] = [[], []];
  const ids: string[] = [];
  for (let i = 0; i < 50; i++) {
    const m = mem[i % 2]!;
    const r = await dealFor(d, { userId }, input(m));
    assert.ok(r.ok);
    m.push(r.card.id);
    ids.push(r.card.id);
  }
  return ids;
}

test("signed in on two devices: no card comes back within 50 deals (server recent list)", async () => {
  const sql = await db();
  const ids = await twoDevices(deps(sql), "ann");
  assert.equal(new Set(ids).size, 50);
  assert.equal(gaps(ids), Infinity);
  assert.equal((await loadRecent(sql, "ann")).length, 50, "every deal noted at deal time");
});

test("without the server list (a guest on two devices) the same walker gets repeats — the bug this fixes", async () => {
  seed = 7;
  const ids = await twoDevices(deps(), null);
  assert.ok(gaps(ids) < 50, `expected a repeat inside 50, shortest gap ${gaps(ids)}`);
});

test("linked sign-ins share one memory; a database hiccup falls back to the save's list", async () => {
  const sql = await db();
  await sql`insert into player_links (alias_id, primary_id, how) values ('ann-x', 'ann', 'code')`;
  const first = await dealFor(deps(sql), { userId: "ann" }, input([]));
  assert.ok(first.ok);
  const raw = BANK.find((c) => publicCardId(c) === first.card.id)!.id;
  assert.deepEqual(await loadRecent(sql, "ann-x"), [raw], "the X sign-in sees Ann's deal");
  const down = await dealFor(deps(sql, true), { userId: "ann" }, input([first.card.id]));
  assert.ok(down.ok && down.card.id !== first.card.id);
});

test("the recent list keeps the newest RECENT_KEEP, oldest first", async () => {
  const sql = await db();
  const t0 = Date.parse("2026-10-04T12:00:00Z");
  for (let i = 0; i < 5; i++) await noteDealt(sql, "bo", `card-${i}`, new Date(t0 + i * 1000), 3);
  assert.deepEqual(await loadRecent(sql, "bo"), ["card-2", "card-3", "card-4"]);
  await noteDealt(sql, "bo", "card-2", new Date(t0 + 9000), 3);
  assert.deepEqual(await loadRecent(sql, "bo"), ["card-3", "card-4", "card-2"], "a re-deal moves to newest");
  assert.ok(RECENT_KEEP >= 50);
});

test("two tabs: the saved list folds into the tab's own (and nothing changes when there's nothing new)", () => {
  const mine = ["a", "b"];
  assert.equal(mergeSeen(["a"], mine, 10), mine);
  assert.deepEqual(mergeSeen(["x", "a", "y"], mine, 10), ["x", "y", "a", "b"]);
  assert.deepEqual(mergeSeen(["x", "y"], mine, 3), ["y", "a", "b"]);
  assert.deepEqual(savedSeen(JSON.stringify({ version: 2, seenIds: ["c1", 4], asked: ["Q?"] })), { seenIds: ["c1"], asked: ["Q?"] });
  assert.equal(savedSeen("{bad"), null);
});

test("wiring: the API deals through dealFor; the store folds other tabs in and marks a card seen when dealt", () => {
  const api = readFileSync(new URL("./triviaApi.ts", import.meta.url), "utf8");
  assert.match(api, /dealFor\(await triviaDeps\(\)/);
  const svc = readFileSync(new URL("./triviaService.ts", import.meta.url), "utf8");
  assert.match(svc, /avoidList\(deps, \[\.\.\.recent, \.\.\.input\.seen\]\)/);
  const store = readFileSync(new URL("./store.ts", import.meta.url), "utf8");
  const dealCard = store.slice(store.indexOf("async function dealCard("), store.indexOf("function postClear("));
  assert.match(dealCard, /foldSavedSeen\(set, get\);/);
  const pick = store.slice(store.indexOf("  pickCategory: (cat, "), store.indexOf("  answer: (choice, now)"));
  assert.match(pick, /\.\.\.markSeen\(get\(\)\.asked, get\(\)\.seenIds, dealt\.card\)/);
  assert.match(store, /const seen = savedSeen\(e\.newValue\);/);
});
