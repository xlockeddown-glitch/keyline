// 0.1.99 placed lantern slice 1: the server writes `plantok` on a perfect Stack; back-fill reads past prize rows.
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
import { SERIES, STACK_ID, RUN_ID } from "./data.ts";
import type { GradePay, LocalSnap } from "./wallet.ts";
import { awardGrade, plantUnlocked, syncPlayer } from "./walletApply.ts";
import { PLANT_OK_KEY, findPerfectStack, perfectStackClear } from "./placedLantern.ts";

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
const card = (over: Partial<GradePay> & { prevNonce?: string }): Omit<GradePay, "prior"> & { prevNonce: string } => ({
  correct: true, elapsedMs: 2000, mult: 1, city: "austin", diff: 2, clearTier: null, poiTier: "green", poiId: STACK_ID,
  lat: 30.28, lng: -97.74, series: "stack", step: 0, steps: SERIES.stack.steps, streak: 0, loot: 1, lucky: false,
  cloth: null, charmDay: "", charmTopics: [], topic: null, dealtAt: Date.UTC(2026, 9, 16, 18), luckyHit: false,
  perfectBlue: false, prizeRoll: 0.5, prevNonce: "", ...over,
});
async function ladder(sql: Sql, who: string, ms: number[], series: "stack" | "run" = "stack") {
  let pv = "";
  const steps = SERIES[series].steps;
  for (let i = 0; i < steps; i++) {
    const n = `${who}-${series}-${i}`;
    await awardGrade(sql, who, n, card({ series, poiId: series === "stack" ? STACK_ID : RUN_ID, steps, step: i, elapsedMs: ms[i] ?? 2000, prevNonce: pv, clearTier: i === 0 ? SERIES[series].cost : null }));
    pv = n;
  }
}
const okRow = async (sql: Sql, who: string) => (await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${who} and op_key = ${PLANT_OK_KEY}`)[0]?.detail ?? null;

test("perfectStackClear: only a finished Stack with every card perfect", () => {
  assert.equal(perfectStackClear("stack", 3, 4, ["perfect", "perfect", "perfect", "perfect"]), true);
  assert.equal(perfectStackClear("stack", 3, 4, ["perfect", "great", "perfect", "perfect"]), false);
  assert.equal(perfectStackClear("stack", 2, 4, ["perfect", "perfect", "perfect"]), false, "not the last card");
  assert.equal(perfectStackClear("stack", 3, 4, ["perfect", "perfect", "perfect"]), false, "chain shorter than the ladder");
  assert.equal(perfectStackClear("run", 2, 3, ["perfect", "perfect", "perfect"]), false, "The Run doesn't count");
  assert.equal(perfectStackClear("climb", 2, 3, ["perfect", "perfect", "perfect"]), false);
});

test("server: a perfect Stack writes plantok once; a non-perfect Stack or a perfect Run doesn't", async () => {
  const sql = await db();
  for (const who of ["ace", "slow", "runner"]) await syncPlayer(sql, who, snap(), `${who}phone1`);
  await ladder(sql, "ace", [1000, 1500, 2500, 2900]);
  const row = await okRow(sql, "ace");
  assert.ok(row, "perfect Stack unlocks");
  assert.match(row!, /grade:ace-stack-3/);
  await ladder(sql, "ace", [1000, 1000, 1000, 1000]);
  assert.equal(await okRow(sql, "ace"), row, "a second perfect Stack doesn't rewrite it");
  await ladder(sql, "slow", [1000, 4000, 1000, 1000]);
  assert.equal(await okRow(sql, "slow"), null, "one great card: no unlock");
  await ladder(sql, "runner", [1000, 1000, 1000], "run");
  assert.equal(await okRow(sql, "runner"), null, "The Run is not the green ladder");
  assert.equal(await plantUnlocked(sql, "ace"), true);
  assert.equal(await plantUnlocked(sql, "slow"), false);
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
  await ladder(sql, "ace", [1000, 1000, 1000, 1000]);
  await ladder(sql, "two", [1000, 1000, 1000, 1000]);
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
  await ladder(sql, "ace", [1000, 1000, 1000, 1000]);
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
    card: () => card, namedPoi: () => null, series: () => null, sql: async () => sql,
  } as never;
  const input = { city: "austin", cat: "local", poiId: views[0]!.id, windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555", blank: { name: "x", kind: "landmark", tier: "white" } } as never;
  const bad = await dealFor(deps, { userId: "vis" } as never, { ...(input as object), cat: "sports" } as never);
  assert.equal(bad.ok, false, "a field the owner didn't pick doesn't deal");
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
  await ladder(sql, "ace", [1000, 1000, 1000, 1000]);
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
      const sub = o[2]!;
      assert.ok(!withMath.includes(sub), "the stand-in takes Math's slot and wasn't picked");
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
  await ladder(sql, "ace", [1000, 1000, 1000, 1000]);
  await ladder(sql, "bee", [1000, 1000, 1000, 1000]);
  const s = CITIES.austin.spawn;
  const base = { kind: "plant" as const, city: "austin" as const, name: 0 };
  assert.equal((await applyClientOp(sql, "ace", { ...base, lat: s.lat + 0.004, lng: s.lng + 0.004, cats: ["local", "history", "math", "music"] })).ok, true);
  assert.equal((await applyClientOp(sql, "bee", { ...base, lat: s.lat + 0.008, lng: s.lng + 0.004, cats: ["local", "history", "science", "music"] })).ok, true);
  const views = await placedViews(sql, "austin", "vis");
  const withMath = views.find((v) => v.cats.includes("math"))!;
  const noMath = views.find((v) => !v.cats.includes("math"))!;
  const card = { id: "c1", q: "Q?", choices: ["a", "b", "c", "d"], answer: "a", diff: 3, rarity: "rare" };
  let tier = "";
  const deps = { now: () => Date.now(), secret: "s", rand: () => 0.4, pick: (_c: string, _cat: string, _p: unknown, t: string) => ((tier = t), card), card: () => card, namedPoi: () => null, series: () => null, sql: async () => sql } as never;
  const input = (poiId: string, cat: string) => ({ city: "austin", cat, poiId, windowMs: 25000, seen: [], saveId: "11111111-2222-3333-4444-555555555555" }) as never;
  const ok = await dealFor(deps, { userId: "vis" } as never, input(withMath.id, "sports"));
  assert.equal(ok.ok, true);
  assert.equal(tier, "red");
  assert.equal((await dealFor(deps, { userId: "vis" } as never, input(noMath.id, "sports"))).ok, false);
  const spent = await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = 'vis' and op_key like 'deal:%'`;
  assert.equal(spent.length, 1, "the stand-in open spent one V key");
});
