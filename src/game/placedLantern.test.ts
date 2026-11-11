// 0.1.99 placed lantern slice 1. 0.1.119: `plantok` lands on the 10th right red (V) / violet answer; back-fill reads past perfect-Stack prize rows.
import { welcomeClock, lampGiftClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { thanksClock } from "./thanksGift.ts";
thanksClock.cutoff = "2000-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { STACK_ID } from "./data.ts";
const RUN_ID = "__run__"; // 0.1.119: the retired Run's old pseudo-vault id, only in old ledger rows now
import type { GradePay, LocalSnap } from "./wallet.ts";
import { awardGrade, plantUnlocked, syncPlayer } from "./walletApply.ts";
import { PLANT_OK_KEY, PLANT_RED_NEED, findPerfectStack } from "./placedLantern.ts";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}
const mig = (n: string) => readFileSync(new URL(`../../migrations/${n}`, import.meta.url), "utf8");
async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql", "0013_trivia_recent.sql"]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap = (): LocalSnap => ({ coins: 0, keys: { green: 5 }, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } });
const card = (over: Partial<GradePay> & { prevNonce?: string }): GradePay & { prevNonce: string } => ({
  correct: true, elapsedMs: 2000, mult: 1, city: "austin", diff: 2, clearTier: "red", poiTier: "red", poiId: "red-lamp",
  lat: 30.28, lng: -97.74, streak: 0, loot: 1, lucky: false,
  cloth: null, charmDay: "", charmTopics: [], topic: null, dealtAt: Date.UTC(2026, 9, 16, 18), luckyHit: false,
  perfectBlue: false, prevNonce: "", ...over,
});
/** `n` answers at red (V) vaults (right unless `wrong`), each its own nonce. */
async function reds(sql: Sql, who: string, n = PLANT_RED_NEED, over: Partial<GradePay> = {}, tag = "r") {
  for (let i = 0; i < n; i++) await awardGrade(sql, who, `${who}-${tag}-${i}`, card(over));
}
const okRow = async (sql: Sql, who: string) => (await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${who} and op_key = ${PLANT_OK_KEY}`)[0]?.detail ?? null;

test("0.1.119 server: the 10th right red or violet answer writes plantok once; misses, ambers and 9 reds don't", async () => {
  const sql = await db();
  for (const who of ["ace", "nine", "miss", "amb", "vio"]) await syncPlayer(sql, who, snap(), `${who}phone1`);
  await reds(sql, "ace", PLANT_RED_NEED - 1);
  assert.equal(await okRow(sql, "ace"), null, "9 is not enough");
  await reds(sql, "ace", 1, {}, "last");
  const row = await okRow(sql, "ace");
  assert.ok(row, "the 10th right red unlocks");
  assert.match(row!, /"via":"red10"/);
  assert.match(row!, /grade:ace-last-0/);
  await reds(sql, "ace", 3, {}, "more");
  assert.equal(await okRow(sql, "ace"), row, "later reds don't rewrite it");
  await reds(sql, "nine", PLANT_RED_NEED - 1);
  await reds(sql, "miss", PLANT_RED_NEED, { correct: false });
  await reds(sql, "amb", PLANT_RED_NEED, { clearTier: "amber", poiTier: "amber" });
  for (const who of ["nine", "miss", "amb"]) {
    assert.equal(await okRow(sql, who), null, who);
    assert.equal(await plantUnlocked(sql, who), false, who);
  }
  await reds(sql, "vio", 5, { clearTier: "violet", poiTier: "violet" }, "v");
  await reds(sql, "vio", 5, {}, "r");
  assert.ok(await okRow(sql, "vio"), "violet and red count together");
  assert.equal(await plantUnlocked(sql, "ace"), true);
});

test("0.1.119 lazy unlock: 10 right reds already in the ledger unlock on the next status read", async () => {
  const { plantStatus } = await import("./walletApply.ts");
  const sql = await db();
  await syncPlayer(sql, "old", snap(), "oldphone1");
  await syncPlayer(sql, "half", snap(), "halfphone1");
  const row = (g: string, t: string) => JSON.stringify({ coins: 1, keys: {}, boosts: [], g, t, pi: "x" });
  for (let i = 0; i < 10; i++) await sql`insert into wallet_ledger (user_id, op_key, detail) values ('old', ${"grade:o" + i}, ${row(i % 2 ? "great" : "good", i < 6 ? "red" : "violet")})`;
  for (let i = 0; i < 10; i++) await sql`insert into wallet_ledger (user_id, op_key, detail) values ('half', ${"grade:h" + i}, ${row(i < 4 ? "great" : "miss", "red")})`;
  assert.equal(await okRow(sql, "old"), null);
  assert.equal(await plantUnlocked(sql, "old"), true);
  assert.match((await okRow(sql, "old"))!, /"via":"red10"/);
  assert.equal(await plantUnlocked(sql, "half"), false, "misses don't count");
  const st = await plantStatus(sql, "half");
  assert.equal(st.unlocked, false);
  assert.equal(st.red, 4, "the Journal shows progress");
});

test("back-fill: a pre-release perfect-Stack prize row unlocks; a perfect Run prize or plain Stack cards don't", async () => {
  const sql = await db();
  await syncPlayer(sql, "old", snap(), "oldphone1");
  await syncPlayer(sql, "runr", snap(), "runrphone1");
  await sql`insert into wallet_ledger (user_id, op_key, detail) values ('old', 'grade:x4', ${JSON.stringify({ coins: 1, keys: {}, boosts: ["Perfect ladder: red match +400"], g: "perfect", pi: STACK_ID, pv: "x3" })})`;
  await sql`insert into wallet_ledger (user_id, op_key, detail) values ('runr', 'grade:r3', ${JSON.stringify({ coins: 1, keys: {}, boosts: ["Perfect ladder: amber match +150"], g: "perfect", pi: RUN_ID })})`;
  for (let i = 0; i < 4; i++) await sql`insert into wallet_ledger (user_id, op_key, detail) values ('runr', ${"grade:s" + i}, ${JSON.stringify({ coins: 1, keys: {}, boosts: [], g: "perfect", pi: STACK_ID, pv: i ? "s" + (i - 1) : "" })})`;
  assert.equal(await plantUnlocked(sql, "old"), true);
  assert.match((await okRow(sql, "old"))!, /"backfill":1/);
  assert.equal(await plantUnlocked(sql, "runr"), false, "a chain of perfect Stack cards without the prize row is not proof");
  assert.equal(await okRow(sql, "runr"), null);
});

test("findPerfectStack ignores misses, other ladders and junk", () => {
  const prize = (pi: string, g = "perfect") => JSON.stringify({ g, pi, boosts: ["Perfect ladder: violet match +400"] });
  assert.equal(findPerfectStack([{ op_key: "grade:a", detail: prize(STACK_ID) }]), "grade:a");
  assert.equal(findPerfectStack([{ op_key: "grade:a", detail: prize(RUN_ID) }]), null);
  assert.equal(findPerfectStack([{ op_key: "grade:a", detail: prize(STACK_ID, "miss") }]), null);
  assert.equal(findPerfectStack([{ op_key: "own:red", detail: prize(STACK_ID) }]), null);
  assert.equal(findPerfectStack([{ op_key: "grade:a", detail: "not json" }]), null);
});

test("0.1.109 plantRefusal: preset name, exactly 4 distinct fields, near the city, 40 m gap, density cap", async () => {
  const { plantRefusal, PLANT_NAMES } = await import("./placedLantern.ts");
  const spawn = { lat: 42.33, lng: -83.05 };
  const ok = { city: "detroit", lat: 42.331, lng: -83.05, name: 0, cats: ["local", "history", "science", "music"] };
  assert.equal(plantRefusal(ok, spawn, [], []), null);
  assert.equal(plantRefusal({ ...ok, name: PLANT_NAMES.length }, spawn, [], []), "name");
  assert.equal(plantRefusal({ ...ok, name: 1.5 }, spawn, [], []), "name");
  assert.equal(plantRefusal({ ...ok, cats: ["local", "history", "science"] }, spawn, [], []), "cats");
  assert.equal(plantRefusal({ ...ok, cats: ["local", "local", "science", "music"] }, spawn, [], []), "cats");
  assert.equal(plantRefusal({ ...ok, cats: ["local", "history", "science", "cooking"] }, spawn, [], []), "cats");
  assert.equal(plantRefusal({ ...ok, lat: 42.5 }, spawn, [], []), "far");
  // 0.0002° lat ≈ 22 m: too close to a lamp, and to a placed vault; 0.0005° ≈ 56 m is fine.
  assert.equal(plantRefusal(ok, spawn, [{ lat: 42.3312, lng: -83.05 }], []), "close");
  assert.equal(plantRefusal(ok, spawn, [], [{ lat: 42.3312, lng: -83.05 }]), "close");
  assert.equal(plantRefusal(ok, spawn, [{ lat: 42.3315, lng: -83.05 }], []), null);
  const ring = Array.from({ length: 6 }, (_, i) => ({ lat: 42.331 + 0.001 * Math.cos(i), lng: -83.05 + 0.0013 * Math.sin(i) }));
  assert.equal(plantRefusal(ok, spawn, [], ring), "dense");
});

test("0.1.109 server: plant needs the unlock and an unlocked city, holds one per player, keeps the 40 m gap, is permanent", async () => {
  const { applyClientOp, placedIn, plantStatus } = await import("./walletApply.ts");
  const { CITIES } = await import("./data.ts");
  const sql = await db();
  for (const who of ["ace", "nope", "two"]) await syncPlayer(sql, who, snap(), `${who}phone1`);
  await reds(sql, "ace");
  await reds(sql, "two");
  const s = CITIES.austin.spawn;
  const at = { lat: s.lat + 0.004, lng: s.lng + 0.004 };
  const op = { kind: "plant" as const, city: "austin" as const, ...at, name: 0, cats: ["local", "history", "science", "music"] };
  assert.equal((await applyClientOp(sql, "nope", op)).reason, "no-unlock");
  assert.equal((await applyClientOp(sql, "ace", { ...op, city: "detroit" as never, lat: CITIES.detroit.spawn.lat, lng: CITIES.detroit.spawn.lng + 0.004 })).reason, "locked");
  assert.equal((await applyClientOp(sql, "ace", { ...op, cats: ["local", "history", "science"] })).reason, "cats");
  const lamp = CITIES.austin.pois[0]!;
  assert.equal((await applyClientOp(sql, "ace", { ...op, lat: lamp.lat + 0.0001, lng: lamp.lng })).reason, "close");
  assert.deepEqual(await plantStatus(sql, "ace"), { unlocked: true, mine: null });
  const r = await applyClientOp(sql, "ace", op);
  assert.equal(r.ok, true, String(r.reason));
  assert.equal((await applyClientOp(sql, "ace", op)).ok, true, "same request replays");
  assert.equal((await applyClientOp(sql, "ace", { ...op, lat: at.lat + 0.003 })).reason, "placed", "one per player, can't move");
  assert.equal((await applyClientOp(sql, "two", { ...op, lat: at.lat + 0.0002 })).reason, "close", "40 m from another placed vault");
  assert.equal((await applyClientOp(sql, "two", { ...op, lat: at.lat + 0.001 })).ok, true);
  const list = await placedIn(sql, "austin");
  assert.equal(list.length, 2);
  assert.equal((await plantStatus(sql, "ace")).mine?.name, 0);
  const mirror = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = 'ace' and op_key = 'plant'`;
  assert.equal(mirror.length, 1);
});

test("0.1.110 visit: a placed Hearth vault deals server-side as red, only from the owner's 4 fields, and spends a red key", async () => {
  const { applyClientOp, placedViews } = await import("./walletApply.ts");
  const { dealFor } = await import("./triviaService.ts");
  const { placedId } = await import("./hearthVaults.ts");
  const { CITIES } = await import("./data.ts");
  const sql = await db();
  await syncPlayer(sql, "ace", snap(), "acephone1");
  await syncPlayer(sql, "vis", { ...snap(), keys: { red: 2 } }, "visphone1");
  await reds(sql, "ace");
  const s = CITIES.austin.spawn;
  const op = { kind: "plant" as const, city: "austin" as const, lat: s.lat + 0.004, lng: s.lng + 0.004, name: 2, cats: ["local", "history", "science", "music"] };
  assert.equal((await applyClientOp(sql, "ace", op)).ok, true);
  const views = await placedViews(sql, "austin", "vis");
  assert.equal(views.length, 1);
  assert.equal(views[0]!.id, placedId("ace"));
  assert.ok(!JSON.stringify(views).includes('"ace"'), "the public list never carries the owner id");
  const card = { id: "c1", q: "Q?", choices: ["a", "b", "c", "d"], answer: "a", diff: 3, rarity: "rare" };
  let pickedTier = "";
  const deps = {
    now: () => Date.now(), secret: "s", rand: () => 0.4,
    pick: (_c: string, _cat: string, _p: unknown, tier: string) => ((pickedTier = tier), card),
    card: () => card, namedPoi: () => null, sql: async () => sql,
  } as never;
  const input = { city: "austin", cat: "local", poiId: views[0]!.id, windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555", blank: { name: "x", kind: "landmark", tier: "white" } } as never;
  const bad = await dealFor(deps, { userId: "vis" } as never, { ...(input as object), cat: "sports" } as never);
  assert.equal(bad.ok, false, "a field the owner didn't pick doesn't deal");
  assert.equal((await dealFor(deps, { userId: "vis" } as never, { ...(input as object), cat: "random" } as never)).ok, false, "0.1.116: no Random at a Hearth vault");
  const r = await dealFor(deps, { userId: "vis" } as never, input);
  assert.equal(r.ok, true);
  assert.equal(pickedTier, "red", "plays as red (the client's blank tier is ignored)");
  const keys = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = 'vis' and op_key like 'deal:%'`;
  assert.equal(keys.length, 1, "spent one red key");
  const unknown = await dealFor(deps, { userId: "vis" } as never, { ...(input as object), poiId: "placed-nope" } as never);
  assert.equal(unknown.ok, false);
});

test("0.1.110: no category-of-the-day bonus on a Hearth vault", async () => {
  const { catBoost, cotdAt } = await import("./carPerks.ts");
  const at = Date.UTC(2026, 10, 2, 18);
  const cat = cotdAt(at);
  assert.ok(catBoost(cat, [], at).x > 1);
  assert.equal(catBoost(cat, [], at, true).x, 1);
});

test("0.1.110: the Hearth owner line has one period after an initial", async () => {
  const { hearthPoi } = await import("./hearthVaults.ts");
  const v = { id: "placed-x", city: "detroit", lat: 0, lng: 0, name: 0, cats: [], by: "Ryan G." } as never;
  assert.equal(hearthPoi(v).lore, "Placed by Ryan G.");
  const src = (await import("node:fs")).readFileSync(new URL("../components/keyline/VaultModal.tsx", import.meta.url), "utf8");
  assert.match(src, /Placed by \{hearth\.by\.replace\(\/\\\.\$\/, ""\)\}\./);
});

test("0.1.111 owner cut: 50 per visitor right answer, once a visitor a day, 1,000/day cap, no self or new-account cut; stats", async () => {
  const { applyClientOp, payHearthOwner, hearthStats, plantStatus } = await import("./walletApply.ts");
  const { placedId } = await import("./hearthVaults.ts");
  const { HEARTH_CUT, hearthCutKey, hearthMatch } = await import("./placedLantern.ts");
  const { CITIES } = await import("./data.ts");
  const sql = await db();
  for (const who of ["ace", "vis", "newb"]) await syncPlayer(sql, who, snap(), `${who}phone1`);
  await reds(sql, "ace");
  const s = CITIES.austin.spawn;
  assert.equal((await applyClientOp(sql, "ace", { kind: "plant", city: "austin", lat: s.lat + 0.004, lng: s.lng + 0.004, name: 0, cats: ["local", "history", "science", "music"] })).ok, true);
  const id = placedId("ace");
  const coins = async (who: string) => Number((await sql<{ coins: unknown }>`select coins from player_wallets where user_id = ${who}`)[0]?.coins ?? 0);
  // Age "vis" past 3 days with 25 right answers; "newb" stays new.
  await sql`update wallet_ledger set created_at = now() - interval '5 days' where user_id = 'vis'`;
  for (let i = 0; i < 25; i++) await sql`insert into wallet_ledger (user_id, op_key, detail) values ('vis', ${"grade:old" + i}, ${JSON.stringify({ g: "great" })})`;
  const before = await coins("ace");
  assert.equal(await payHearthOwner(sql, "ace", "n0", id, "austin"), false, "no cut on the owner's own open");
  assert.equal(await payHearthOwner(sql, "newb", "n1", id, "austin"), false, "new accounts don't pay a cut");
  assert.equal(await payHearthOwner(sql, "vis", "n2", id, "austin"), true);
  assert.equal(await payHearthOwner(sql, "vis", "n3", id, "austin"), false, "one paid open per visitor a day");
  assert.equal((await coins("ace")) - before, HEARTH_CUT);
  const rows = await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where user_id = 'ace' and op_key like 'hcut:%'`;
  assert.equal(rows.length, 1);
  assert.ok(!rows[0]!.op_key.includes("vis") && !rows[0]!.detail.includes("vis"), "the visitor id isn't stored on the owner");
  // Fill today to the cap with other visitors' rows; the next visitor pays nothing.
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  for (let i = 0; i < 19; i++) await sql`insert into wallet_ledger (user_id, op_key, detail) values ('ace', ${hearthCutKey(day, "x" + i)}, ${JSON.stringify({ c: 50, m: 0 })})`;
  await syncPlayer(sql, "vis2", snap(), "vis2phone1");
  await sql`update wallet_ledger set created_at = now() - interval '5 days' where user_id = 'vis2'`;
  for (let i = 0; i < 25; i++) await sql`insert into wallet_ledger (user_id, op_key, detail) values ('vis2', ${"grade:o" + i}, ${JSON.stringify({ g: "good" })})`;
  assert.equal(await payHearthOwner(sql, "vis2", "n4", id, "austin"), false, "1,000 a day cap");
  const st = await hearthStats(sql, "ace");
  assert.deepEqual(st.today, { opens: 20, coin: 1000, keys: 0 });
  assert.equal(st.cap, 1000);
  const ps = await plantStatus(sql, "ace");
  assert.equal(ps.mine?.owner, "", "the owner id isn't sent to the client");
  assert.equal(ps.stats?.today.coin, 1000);
  // About 1 in 10 nonces pay a V key.
  const hits = Array.from({ length: 2000 }, (_, i) => hearthMatch("n" + i)).filter(Boolean).length;
  assert.ok(hits > 150 && hits < 250, String(hits));
});

test("0.1.114: a Hearth card always offers 4 fields; Math's stand-in is a field the owner didn't pick, never Math", async () => {
  const { hearthOffer, hearthCatOk } = await import("./hearthVaults.ts");
  const { keepsMath } = await import("./triviaMeta.ts");
  const withMath = ["local", "history", "math", "music"];
  let skipped = 0;
  for (let n = 0; n < 400; n++) {
    const o = hearthOffer(withMath, "placed-abc", n);
    assert.equal(o.length, 4);
    assert.equal(new Set(o).size, 4);
    if (keepsMath(`placed-abc#${n}`)) assert.deepEqual(o, withMath);
    else {
      skipped++;
      assert.ok(!o.includes("math"));
      assert.deepEqual(o.slice(0, 3), ["local", "history", "music"]);
      assert.ok(!withMath.includes(o[3]!), "the 4th slot is a field the owner did not pick");
      assert.deepEqual(hearthOffer(withMath, "placed-abc", n), o, "same open, same stand-in");
    }
  }
  assert.ok(skipped > 150 && skipped < 300, String(skipped));
  assert.deepEqual(hearthOffer(["local", "history", "science", "music"], "placed-abc", 3), ["local", "history", "science", "music"]);
  // Server rule.
  assert.equal(hearthCatOk(withMath, "math"), true);
  assert.equal(hearthCatOk(withMath, "sports"), true, "a stand-in deals when the owner picked Math");
  assert.equal(hearthCatOk(["local", "history", "science", "music"], "sports"), false, "no stand-ins without Math");
  assert.equal(hearthCatOk(withMath, "cooking"), false);
});

test("0.1.114 server: a Hearth vault with Math deals a stand-in field as red; one without Math refuses it", async () => {
  const { applyClientOp, placedViews } = await import("./walletApply.ts");
  const { dealFor } = await import("./triviaService.ts");
  const { CITIES } = await import("./data.ts");
  const sql = await db();
  for (const who of ["ace", "bee"]) await syncPlayer(sql, who, snap(), `${who}phone1`);
  await syncPlayer(sql, "vis", { ...snap(), keys: { red: 3 } }, "visphone1");
  await reds(sql, "ace");
  await reds(sql, "bee");
  const s = CITIES.austin.spawn;
  const base = { kind: "plant" as const, city: "austin" as const, name: 0 };
  assert.equal((await applyClientOp(sql, "ace", { ...base, lat: s.lat + 0.004, lng: s.lng + 0.004, cats: ["local", "history", "math", "music"] })).ok, true);
  assert.equal((await applyClientOp(sql, "bee", { ...base, lat: s.lat + 0.008, lng: s.lng + 0.004, cats: ["local", "history", "science", "music"] })).ok, true);
  const views = await placedViews(sql, "austin", "vis");
  const withMath = views.find((v) => v.cats.includes("math"))!;
  const noMath = views.find((v) => !v.cats.includes("math"))!;
  const card = { id: "c1", q: "Q?", choices: ["a", "b", "c", "d"], answer: "a", diff: 3, rarity: "rare" };
  let tier = "";
  const deps = { now: () => Date.now(), secret: "s", rand: () => 0.4, pick: (_c: string, _cat: string, _p: unknown, t: string) => ((tier = t), card), card: () => card, namedPoi: () => null, sql: async () => sql } as never;
  const input = (poiId: string, cat: string) => ({ city: "austin", cat, poiId, windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555" }) as never;
  const ok = await dealFor(deps, { userId: "vis" } as never, input(withMath.id, "sports"));
  assert.equal(ok.ok, true);
  assert.equal(tier, "red");
  assert.equal((await dealFor(deps, { userId: "vis" } as never, input(noMath.id, "sports"))).ok, false);
  const spent = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = 'vis' and op_key like 'deal:%'`;
  assert.equal(spent.length, 1, "the stand-in open spent one V key");
});

test("0.1.152: when Math sits out, the 4th slot is an unpicked field and the server deals it", async () => {
  const { dealFor } = await import("./triviaService.ts");
  const { hearthOffer } = await import("./hearthVaults.ts");
  const { keepsMath } = await import("./triviaMeta.ts");
  const { applyClientOp, placedViews } = await import("./walletApply.ts");
  const { CITIES } = await import("./data.ts");
  const sql = await db();
  await syncPlayer(sql, "ace", snap(), "acephone1");
  await syncPlayer(sql, "vis", { ...snap(), keys: { red: 2 } }, "visphone1");
  await reds(sql, "ace");
  const s = CITIES.austin.spawn;
  const cats = ["local", "history", "science", "math"];
  assert.equal((await applyClientOp(sql, "ace", { kind: "plant", city: "austin", lat: s.lat + 0.004, lng: s.lng + 0.004, name: 1, cats })).ok, true);
  const id = (await placedViews(sql, "austin", "vis"))[0]!.id;
  let fourth = "";
  let opens = 0;
  for (let n = 0; n < 40 && !fourth; n++) {
    if (keepsMath(`${id}#${n}`)) continue;
    const offer = hearthOffer(cats, id, n);
    assert.equal(offer.length, 4);
    assert.deepEqual(offer.slice(0, 3), ["local", "history", "science"]);
    assert.ok(!cats.includes(offer[3]!), offer[3]);
    fourth = offer[3]!;
    opens = n;
  }
  assert.ok(fourth, "a skipped Math visit exists in 40 opens");
  const card = { id: "c4", q: "Q?", choices: ["a", "b", "c", "d"], answer: "a", diff: 3, rarity: "rare" };
  const deps = { now: () => Date.now(), secret: "s", rand: () => 0.2, pick: () => card, card: () => card, namedPoi: () => null, sql: async () => sql } as never;
  const dealt = await dealFor(deps, { userId: "vis" } as never, { city: "austin", cat: fourth, poiId: id, windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555" } as never);
  assert.equal(dealt.ok, true, `server refused the 4th slot ${fourth} at open ${opens}`);
});

test("0.1.122 server: one Hearth of each version; a second of the same version is refused; each has its own id, key and stats", async () => {
  const { applyClientOp, payHearthOwner, placedViews, plantStatus } = await import("./walletApply.ts");
  const { placedId } = await import("./hearthVaults.ts");
  const { placedKey } = await import("./placedLantern.ts");
  const { CITIES } = await import("./data.ts");
  const sql = await db();
  for (const who of ["ace", "vis"]) await syncPlayer(sql, who, snap(), `${who}phone1`);
  await reds(sql, "ace");
  const s = CITIES.austin.spawn;
  const op = (v: 1 | 2 | 3, dLat: number) => ({ kind: "plant" as const, city: "austin" as const, lat: s.lat + 0.004 + dLat, lng: s.lng + 0.004, name: v, cats: ["local", "history", "science", "music"], ...(v > 1 ? { v } : {}) });
  assert.equal((await applyClientOp(sql, "ace", op(1, 0))).ok, true);
  assert.equal((await applyClientOp(sql, "ace", op(2, 0.0002))).reason, "close", "40 m between your own Hearths too");
  const d = await applyClientOp(sql, "ace", op(2, 0.001));
  assert.equal(d.ok, true, String(d.reason));
  assert.equal((await applyClientOp(sql, "ace", op(2, 0.001))).ok, true, "same Double replays");
  assert.equal((await applyClientOp(sql, "ace", op(2, 0.002))).reason, "placed", "a second Double is refused");
  assert.equal((await applyClientOp(sql, "ace", op(1, 0.003))).reason, "placed", "a second Single is refused");
  assert.equal((await applyClientOp(sql, "ace", op(3, 0.004))).ok, true);
  assert.equal((await applyClientOp(sql, "ace", op(3, 0.005))).reason, "placed");
  const keys = (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = '~placed' order by op_key`).map((r) => r.op_key);
  assert.deepEqual(keys, [placedKey("ace"), placedKey("ace", 2), placedKey("ace", 3)]);
  const mirrors = (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = 'ace' and op_key like 'plant%' and op_key <> 'plantok' order by op_key`).map((r) => r.op_key);
  assert.deepEqual(mirrors, ["plant", "plant:v2", "plant:v3"]);
  const st = await plantStatus(sql, "ace");
  assert.deepEqual(st.hearths?.map((h) => h.v), [1, 2, 3]);
  const ids = st.hearths!.map((h) => h.id);
  assert.equal(ids[0], placedId("ace"), "the Single keeps the old id");
  assert.equal(new Set(ids).size, 3);
  const views = await placedViews(sql, "austin", "ace");
  assert.deepEqual(views.map((v) => v.id).sort(), [...ids].sort());
  assert.ok(views.every((v) => v.mine));
  // The owner cut is per Hearth: one visitor pays once at each, and each Hearth's stats count only its own.
  await sql`update wallet_ledger set created_at = now() - interval '5 days' where user_id = 'vis'`;
  for (let i = 0; i < 25; i++) await sql`insert into wallet_ledger (user_id, op_key, detail) values ('vis', ${"grade:old" + i}, ${JSON.stringify({ g: "great" })})`;
  assert.equal(await payHearthOwner(sql, "vis", "c1", ids[1]!, "austin"), true);
  assert.equal(await payHearthOwner(sql, "vis", "c2", ids[1]!, "austin"), false);
  assert.equal(await payHearthOwner(sql, "vis", "c3", ids[0]!, "austin"), true);
  const st2 = await plantStatus(sql, "ace");
  assert.deepEqual(st2.hearths!.map((h) => h.stats.total.opens), [1, 1, 0]);
});

test("0.1.122 server: an old pre-0.1.122 row stays valid and holds its own version's slot", async () => {
  const { applyClientOp, plantStatus, placedViews } = await import("./walletApply.ts");
  const { placedId } = await import("./hearthVaults.ts");
  const { placedKey } = await import("./placedLantern.ts");
  const { CITIES } = await import("./data.ts");
  const sql = await db();
  for (const who of ["one", "dbl"]) {
    await syncPlayer(sql, who, snap(), `${who}phone1`);
    await reds(sql, who);
  }
  const s = CITIES.austin.spawn;
  // As written before 0.1.122: on the bare key, no slot. "one" has a Single (no v), "dbl" a Double.
  const old = (owner: string, dLat: number, v?: 2) => ({ owner, city: "austin", lat: s.lat + 0.004 + dLat, lng: s.lng + 0.004, name: 2, cats: ["local", "history", "science", "music"], at: 1, ...(v ? { v } : {}) });
  await sql`insert into wallet_ledger (user_id, op_key, detail) values ('~placed', ${placedKey("one")}, ${JSON.stringify(old("one", 0))})`;
  await sql`insert into wallet_ledger (user_id, op_key, detail) values ('~placed', ${placedKey("dbl")}, ${JSON.stringify(old("dbl", 0.002, 2))})`;
  const st = await plantStatus(sql, "one");
  assert.deepEqual(st.hearths?.map((h) => [h.v, h.id]), [[1, placedId("one")]]);
  assert.equal(st.mine?.name, 2);
  const at = (dLat: number) => ({ kind: "plant" as const, city: "austin" as const, lat: s.lat + 0.004 + dLat, lng: s.lng + 0.004, name: 0, cats: ["local", "history", "science", "music"] });
  assert.equal((await applyClientOp(sql, "one", at(0.006))).reason, "placed", "the old Single holds the Single slot");
  assert.equal((await applyClientOp(sql, "one", { ...at(0.006), v: 3 })).ok, true);
  assert.equal((await applyClientOp(sql, "dbl", { ...at(0.008), v: 2 })).reason, "placed", "the old Double holds the Double slot");
  assert.equal((await applyClientOp(sql, "dbl", at(0.008))).ok, true, "a Single still fits next to an old Double");
  const dst = await plantStatus(sql, "dbl");
  assert.deepEqual(dst.hearths?.map((h) => h.v), [1, 2]);
  assert.equal(dst.hearths!.find((h) => h.v === 2)!.id, placedId("dbl"), "the old Double keeps its id");
  assert.equal(dst.hearths!.find((h) => h.v === 1)!.id, placedId("dbl", 1));
  assert.equal((await sql`select 1 from wallet_ledger where user_id = '~placed' and op_key = ${placedKey("dbl", 1)}`).length, 1);
  assert.equal((await placedViews(sql, "austin", null)).length, 4);
});
