// 0.1.186 Meet you there (CARD-187): a location gift between friends, not a new faucet. A coin or key drop is debited
// from the dropper at leave time into escrow (the meet_drops row, migration 0021), the named friend collects it only
// at that lamp (one atomic gate, one ledger key), and an uncollected drop goes back to the dropper after 24 hours.
// PGlite + the real migrations. Nothing here touches the network.
import { lampGiftClock, welcomeClock, DOUBLE_PREFIXES, doubles } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { CITIES, CITY_LIST } from "./data.ts";
import { DAILY_REACH_M } from "./dailyRun.ts";
import { cometId } from "./eventVault.ts";
import { distM } from "./geo.ts";
import { levelStats } from "./levelsServer.ts";
import { questEvents } from "./questServer.ts";
import { rewardOfRow } from "./recentRewards.ts";
import type { LocalSnap } from "./wallet.ts";
import { syncPlayer } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { cityDay } from "./vaultStack.ts";
import type { Poi } from "./types";
import {
  MEET_COIN, MEET_GUIDE, MEET_ITEM_CAP, MEET_KEY_N, MEET_KEY_TIER, MEET_PENDING_MS, MEET_TTL_MS, MEET_WAVE_CAP,
  meetAmount, meetCap, meetCls, meetCollectInput, meetCollectKey, meetCollectLine, meetIncomingLine, meetLamp, meetLeaveInput, meetLeaveKey, meetLeaveLine, meetRefundKey, meetRefundLine, meetRefusal, meetWhat,
  type MeetKind,
} from "./meetDrop.ts";
import { meetCollect, meetLeave, meetStatus } from "./meetService.ts";
thanksClock.cutoff = "2000-01-01T00:00:00Z";

function sqlOf(db: PGlite): Sql {
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await db.query(text, values)).rows;
  }) as unknown as Sql;
  sql.query = (async (text: string, params: unknown[] = []) => (await db.query(text, params)).rows) as Sql["query"];
  return sql;
}
const mig = (name: string) => readFileSync(new URL(`../../migrations/${name}`, import.meta.url), "utf8");
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const MEET_MIG = "0021_meet_drops.sql";
const opened: PGlite[] = [];
afterEach(async () => {
  for (const pg of opened.splice(0)) await pg.close();
});
async function db(withMeet = true) {
  const pg = new PGlite();
  opened.push(pg);
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql", "0009_friend_tickets.sql"]) await pg.exec(mig(m));
  await pg.exec(`create view plate_events_by_player as select * from plate_events`);
  await pg.exec(`create table "user" (id text primary key, name text)`);
  if (withMeet) {
    await pg.exec(mig(MEET_MIG));
    await pg.exec(mig(MEET_MIG)); // safe to re-run
  }
  return sqlOf(pg);
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };

// 2025-11-25 is Central Standard Time (UTC-6). Austin's local day turns at 06:00 UTC.
const ct = (day: number, h: number, m = 0) => Date.UTC(2025, 10, day, h + 6, m);
const NOON = ct(25, 12);
const HOUR = 60 * 60_000;

/** Austin street lamps a drop can sit at, far enough apart that standing at one is never in reach of another. */
const LAMPS: Poi[] = (() => {
  const out: Poi[] = [];
  for (const p of [...CITIES.austin.pois].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!meetLamp("austin", p.id)) continue;
    if (out.every((q) => distM(p.lat, p.lng, q.lat, q.lng) > DAILY_REACH_M * 3)) out.push(p);
    if (out.length >= 16) break;
  }
  return out;
})();
const at = (p: { lat: number; lng: number }) => ({ lat: p.lat, lng: p.lng });
let seq = 0;
const nonce = () => `meet-nonce-${String(++seq).padStart(5, "0")}`;
const leaveOp = (lamp: Poi, friend: string, kind: MeetKind, n = nonce()) => ({ city: "austin", lamp: lamp.id, ...at(lamp), friend, kind, nonce: n });

const walletOf = async (sql: Sql, user: string) => (await canonicalWallet(sql, user)).wallet;
const pocket = async (sql: Sql, user: string) => {
  const w = await walletOf(sql, user);
  return { coins: w.coins, white: w.keys.white ?? 0 };
};
const setPocket = (sql: Sql, user: string, coins: number, white: number) => sql.query(`update player_wallets set coins = $2, white = $3, version = version + 1 where user_id = $1`, [user, coins, white]);
type DropRow = { id: string; dropper_id: string; friend_id: string; kind: string; amount: number; state: string; settled: boolean; day: string; cls: string; slot: number };
const drops = (sql: Sql) => sql.query<DropRow>(`select id, dropper_id, friend_id, kind, amount, state, settled, day, cls, slot from meet_drops order by created_at, id`);
const dropOf = async (sql: Sql, id: string) => (await sql.query<DropRow>(`select id, dropper_id, friend_id, kind, amount, state, settled, day, cls, slot from meet_drops where id = $1`, [id]))[0]!;
const ledger = async (sql: Sql, user: string, like = "meet%") => (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${user} and op_key like ${like} order by op_key`).map((r) => r.op_key);
const ticket = async (sql: Sql, token: string, sender: string, friend: string | null) => {
  const now = new Date().toISOString();
  await sql.query(
    `insert into friend_tickets (token, sender_id, sender_name, card_id, prompt, choices, answer, diff, created_at, expires_at, friend_id, friend_name)
     values ($1, $2, $2, 'c', 'q', '[]'::jsonb, 'a', 2, $3, $3, $4, $4)`,
    [token, sender, now, friend],
  );
};

/**
 * Coin and white keys in every pocket plus what the drops hold. A coin or key drop holds its amount from the
 * moment its debit row exists until it is settled (credited to the friend or refunded to the dropper).
 */
async function totals(sql: Sql, users: readonly string[], withMeet = true) {
  let coins = 0;
  let white = 0;
  for (const u of users) {
    const p = await pocket(sql, u);
    coins += p.coins;
    white += p.white;
  }
  if (!withMeet) return { coins, white };
  const held = await sql.query<{ kind: string; amount: number }>(
    `select d.kind, d.amount from meet_drops d where d.settled = false and d.kind <> 'wave'
     and exists (select 1 from wallet_ledger l where l.user_id = d.dropper_id and l.op_key = 'meet:' || d.id)`,
  );
  for (const h of held) {
    if (h.kind === "coin") coins += Number(h.amount);
    else white += Number(h.amount);
  }
  return { coins, white };
}

const WHO = ["ann", "ben", "cat", "dan"] as const;
/** ann (100 coin, 3 white) is friends with ben and dan; cat is nobody's friend to ann. ann2 is ann's second sign-in. */
async function world(withMeet = true) {
  const sql = await db(withMeet);
  for (const u of WHO) {
    await syncPlayer(sql, u, snap, `${u}-phone1`);
    await sql.query(`insert into "user" (id, name) values ($1, $2)`, [u, `${u[0]!.toUpperCase()}${u.slice(1)} Smith`]);
  }
  await sql.query(`insert into player_links (alias_id, primary_id, how) values ('ann2', 'ann', 'code')`);
  await ticket(sql, "t-ann-ben", "ann", "ben");
  await ticket(sql, "t-dan-ann", "dan", "ann");
  await ticket(sql, "t-ben-cat", "ben", "cat");
  await setPocket(sql, "ann", 100, 3);
  for (const u of ["ben", "cat", "dan"]) await setPocket(sql, u, 10, 1);
  const start = await totals(sql, WHO, withMeet);
  const conserved = async (msg: string) => assert.deepEqual(await totals(sql, WHO, withMeet), start, `nothing minted or lost: ${msg}`);
  return { sql, start, conserved };
}

test("rules: 30 coin, 1 white key, a wave; caps 10 and 5; 24 hours; the lamp rule; plain copy", () => {
  assert.deepEqual([MEET_COIN, MEET_KEY_N, MEET_KEY_TIER, MEET_WAVE_CAP, MEET_ITEM_CAP, MEET_TTL_MS, MEET_PENDING_MS], [30, 1, "white", 10, 5, 24 * HOUR, 5 * 60_000]);
  assert.deepEqual([meetAmount("coin"), meetAmount("key"), meetAmount("wave")], [30, 1, 0]);
  assert.deepEqual([meetCls("coin"), meetCls("key"), meetCls("wave"), meetCap("item"), meetCap("wave")], ["item", "item", "wave", 5, 10]);
  assert.deepEqual([meetWhat("coin"), meetWhat("key"), meetWhat("wave")], ["30 coin", "1 white key", "a wave"]);
  assert.equal(meetIncomingLine("coin", "Ann S."), "Ann S. left you 30 coin here.");
  assert.equal(meetCollectLine("key", "Ann S."), "Ann S. left you 1 white key. It is in your pocket now.");
  assert.equal(meetCollectLine("wave", "Ann S."), "Ann S. waved at you here.");
  assert.match(meetLeaveLine("coin", "Ben S."), /^You left Ben S\. 30 coin here\. It came out of your pocket now\./);
  assert.equal(meetRefundLine("coin"), "Nobody collected your 30 coin. It is back in your pocket.");
  assert.match(meetRefusal("cap", "coin"), /5 keys or coin drops today/);
  assert.match(meetRefusal("cap", "wave"), /10 waves today/);
  assert.match(meetRefusal("open"), /already left one here/);
  assert.match(meetRefusal("far"), /Too far/);
  assert.match(meetRefusal("short", "coin"), /Not enough\. You need 30 coin/);
  assert.match(meetRefusal("whatever"), /Try again/);
  assert.ok(LAMPS.length >= 16, "austin has enough spread street lamps for these tests");
  // City-wide, not the Daily Run's downtown radius: the farthest eligible lamp from spawn still counts.
  const far = [...CITIES.austin.pois].filter((p) => meetLamp("austin", p.id)).sort((a, b) => distM(CITIES.austin.spawn.lat, CITIES.austin.spawn.lng, b.lat, b.lng) - distM(CITIES.austin.spawn.lat, CITIES.austin.spawn.lng, a.lat, a.lng))[0]!;
  assert.ok(meetLamp("austin", far.id));
  assert.equal(meetLamp("austin", LAMPS[0]!.id)?.id, LAMPS[0]!.id);
  assert.equal(meetLamp("nowhere", LAMPS[0]!.id), null);
  assert.equal(meetLamp("chicago", LAMPS[0]!.id), null, "another city's lamp");
  assert.equal(meetLamp("austin", "no-such-lamp"), null);
});

test("meetDrop.ts is pure rules: it imports no client-only module, and the UI adds no art", () => {
  const imports = [...src("./meetDrop.ts").matchAll(/^import [^\n]* from "([^"]+)";$/gm)].map((m) => m[1]);
  assert.deepEqual(imports.sort(), ["./data.ts", "./eventVault.ts", "./types", "zod"]);
  assert.doesNotMatch(src("./meetService.ts"), /from "\.\/(store|walletClient|meetClient)|from "react|from "@\//);
  for (const f of ["../components/keyline/MeetCard.tsx", "../components/keyline/MeetJournal.tsx"]) assert.doesNotMatch(src(f), /<img|<svg|\.webp|\.png|background-image|style=/);
  for (const id of ["meet-card", "meet-collect", "meet-friend", "meet-line"]) assert.match(src("../components/keyline/MeetCard.tsx"), new RegExp(`data-testid="${id}"`));
  assert.match(src("../components/keyline/MeetCard.tsx"), /data-testid=\{`meet-\$\{kind\}`\}/);
  assert.match(src("../components/keyline/MeetCard.tsx"), /Open a friend ticket with someone first/);
  // A friend already standing at the lamp must see a drop that lands later: the card re-asks while at a lamp.
  assert.match(src("../components/keyline/MeetCard.tsx"), /setInterval\(\(\) => void refreshMeet\(\), 15_000\)/);
  assert.match(src("../components/keyline/HqPanel.tsx"), /<WardJournal \/>\n\s*<MeetJournal \/>/);
  assert.match(src("../components/keyline/FieldGuide.tsx"), /<li>\{STRAY_GUIDE\}<\/li>\n\s*<li>\{MEET_GUIDE\}<\/li>/);
  assert.match(MEET_GUIDE, /^Meet you there: signed in, standing at a street lamp, .* a wave, 1 white key or 30 coin\./);
});

test("dropper is debited into escrow at leave time", async () => {
  const { sql, conserved } = await world();
  // 30 coin: out of ann's pocket now, held by the row, ben has nothing yet.
  const coin = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "coin"), NOON);
  assert.equal(coin.ok, true, JSON.stringify(coin));
  assert.deepEqual(await pocket(sql, "ann"), { coins: 70, white: 3 });
  assert.deepEqual(coin.view && { coins: coin.view.coins, white: coin.view.keys.white }, { coins: 70, white: 3 }, "the reply carries the debited pocket");
  assert.deepEqual(await pocket(sql, "ben"), { coins: 10, white: 1 });
  const row = await dropOf(sql, coin.drop!.id);
  assert.deepEqual([row.kind, Number(row.amount), row.state, row.settled, row.dropper_id, row.friend_id, row.day, row.cls], ["coin", 30, "open", false, "ann", "ben", cityDay("austin", NOON), "item"]);
  assert.equal(coin.drop!.expiresAt, NOON + MEET_TTL_MS);
  assert.deepEqual(await ledger(sql, "ann"), [meetLeaveKey(row.id)]);
  // 1 white key: the same, at another lamp.
  const key = await meetLeave(sql, "ann", leaveOp(LAMPS[1]!, "ben", "key"), NOON);
  assert.equal(key.ok, true, JSON.stringify(key));
  assert.deepEqual(await pocket(sql, "ann"), { coins: 70, white: 2 });
  assert.equal(Number((await dropOf(sql, key.drop!.id)).amount), 1);
  await conserved("two leaves");

  // The double-spend case: a 30-coin pocket backs ONE drop. The second leave, at another lamp, is refused short.
  await setPocket(sql, "dan", 30, 1);
  const base = await totals(sql, WHO);
  await ticket(sql, "t-dan-ben", "dan", "ben");
  const one = await meetLeave(sql, "dan", leaveOp(LAMPS[2]!, "ben", "coin"), NOON);
  const two = await meetLeave(sql, "dan", leaveOp(LAMPS[3]!, "ben", "coin"), NOON);
  assert.deepEqual([one.ok, two.ok, two.reason], [true, false, "short"]);
  assert.deepEqual(await pocket(sql, "dan"), { coins: 0, white: 1 });
  const dans = (await drops(sql)).filter((d) => d.dropper_id === "dan");
  assert.equal(dans.length, 1, "the refused leave left no row, so it spent no slot");
  // The same for the one key: the second key leave has nothing behind it.
  assert.equal((await meetLeave(sql, "dan", leaveOp(LAMPS[4]!, "ben", "key"), NOON)).ok, true);
  assert.equal((await meetLeave(sql, "dan", leaveOp(LAMPS[5]!, "ben", "key"), NOON)).reason, "short");
  // Two at once on a 30-coin pocket: at most one opens.
  await setPocket(sql, "cat", 30, 0);
  await ticket(sql, "t-cat-dan", "cat", "dan");
  const race = await Promise.all([6, 7, 8].map((i) => meetLeave(sql, "cat", leaveOp(LAMPS[i]!, "dan", "coin"), NOON)));
  assert.equal(race.filter((r) => r.ok).length, 1, JSON.stringify(race));
  assert.equal((await pocket(sql, "cat")).coins, 0);
  assert.equal((await drops(sql)).filter((d) => d.dropper_id === "cat" && d.state === "open").length, 1);
  assert.deepEqual(await totals(sql, WHO), { coins: base.coins + 20, white: base.white - 1 }, "only the pockets this test set by hand changed the total (cat 10→30 coin, 1→0 key)");
});

test("friend collects at the lamp and the escrow is credited, dropper not debited again", async () => {
  const { sql, conserved } = await world();
  const coin = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "coin"), NOON);
  const key = await meetLeave(sql, "ann", leaveOp(LAMPS[1]!, "ben", "key"), NOON);
  const st = await meetStatus(sql, "ben", NOON + 1000);
  assert.deepEqual(st.incoming.map((d) => [d.id, d.name, d.lamp, d.lampName, d.kind, d.amount]).sort(), [[coin.drop!.id, "Ann S.", LAMPS[0]!.id, LAMPS[0]!.name, "coin", 30], [key.drop!.id, "Ann S.", LAMPS[1]!.id, LAMPS[1]!.name, "key", 1]].sort());
  assert.deepEqual((await meetStatus(sql, "ann", NOON + 1000)).mine.map((d) => [d.id, d.name]).sort(), [[coin.drop!.id, "Ben S."], [key.drop!.id, "Ben S."]].sort());
  const got = await meetCollect(sql, "ben", { id: coin.drop!.id, ...at(LAMPS[0]!) }, NOON + HOUR);
  assert.deepEqual([got.ok, got.replay, got.line], [true, false, "Ann S. left you 30 coin. It is in your pocket now."], JSON.stringify(got));
  assert.deepEqual(await pocket(sql, "ben"), { coins: 40, white: 1 });
  assert.equal(got.view?.coins, 40);
  assert.deepEqual(await pocket(sql, "ann"), { coins: 70, white: 2 }, "the dropper paid at leave and is not debited again");
  const gotKey = await meetCollect(sql, "ben", { id: key.drop!.id, ...at(LAMPS[1]!) }, NOON + HOUR);
  assert.equal(gotKey.ok, true);
  assert.deepEqual(await pocket(sql, "ben"), { coins: 40, white: 2 });
  assert.deepEqual(await pocket(sql, "ann"), { coins: 70, white: 2 });
  for (const id of [coin.drop!.id, key.drop!.id]) assert.deepEqual([(await dropOf(sql, id)).state, (await dropOf(sql, id)).settled], ["collected", true]);
  assert.deepEqual(await ledger(sql, "ann"), [meetLeaveKey(coin.drop!.id), meetLeaveKey(key.drop!.id)].sort());
  assert.deepEqual(await ledger(sql, "ben"), [meetCollectKey(coin.drop!.id), meetCollectKey(key.drop!.id)].sort());
  assert.deepEqual((await meetStatus(sql, "ben", NOON + HOUR)).incoming, []);
  // A later sweep (24 h on) refunds nothing: the escrow is empty.
  await meetStatus(sql, "ann", NOON + 30 * HOUR);
  assert.deepEqual(await pocket(sql, "ann"), { coins: 70, white: 2 });
  await conserved("collects");
});

test("two collect calls credit once", async () => {
  const { sql, conserved } = await world();
  // Sequential: a retry (or the second tab a moment later).
  const a = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "coin"), NOON);
  const c1 = await meetCollect(sql, "ben", { id: a.drop!.id, ...at(LAMPS[0]!) }, NOON + 1000);
  const c2 = await meetCollect(sql, "ben", { id: a.drop!.id, ...at(LAMPS[0]!) }, NOON + 2000);
  assert.deepEqual([c1.ok, c1.replay, c2.ok, c2.replay], [true, false, true, true]);
  assert.deepEqual(await pocket(sql, "ben"), { coins: 40, white: 1 });
  // Two tabs at once.
  const b = await meetLeave(sql, "ann", leaveOp(LAMPS[1]!, "ben", "coin"), NOON);
  const both = await Promise.all([0, 1, 2, 3].map(() => meetCollect(sql, "ben", { id: b.drop!.id, ...at(LAMPS[1]!) }, NOON + 3000)));
  assert.ok(both.some((r) => r.ok), JSON.stringify(both));
  assert.equal(both.filter((r) => r.ok && !r.replay).length, 1, "exactly one call got the row");
  assert.deepEqual(await pocket(sql, "ben"), { coins: 70, white: 1 }, "credited exactly once");
  const k = await meetLeave(sql, "ann", leaveOp(LAMPS[2]!, "ben", "key"), NOON);
  await Promise.all([0, 1].map(() => meetCollect(sql, "ben", { id: k.drop!.id, ...at(LAMPS[2]!) }, NOON + 3000)));
  assert.deepEqual(await pocket(sql, "ben"), { coins: 70, white: 2 });
  assert.equal((await ledger(sql, "ben")).length, 3, "one credit row per drop");
  for (const d of await drops(sql)) assert.deepEqual([d.state, d.settled], ["collected", true], "the escrow is empty");
  await conserved("double collects");
  // A crash after the gate, before the bookkeeping: settled is false but the credit row exists. Finishing pays nothing more.
  await sql.query(`update meet_drops set settled = false where id = $1`, [a.drop!.id]);
  const again = await meetCollect(sql, "ben", { id: a.drop!.id, lat: 0, lng: 0 }, NOON + 4000);
  assert.deepEqual([again.ok, again.replay], [true, true]);
  assert.deepEqual(await pocket(sql, "ben"), { coins: 70, white: 2 });
  assert.equal((await dropOf(sql, a.drop!.id)).settled, true);
  // A crash after the gate, before the credit: the row is collected, nothing was paid. The retry pays it, once.
  const d = await meetLeave(sql, "ann", leaveOp(LAMPS[3]!, "ben", "coin"), NOON);
  await sql.query(`update meet_drops set state = 'collected' where id = $1`, [d.drop!.id]);
  assert.deepEqual(await pocket(sql, "ben"), { coins: 70, white: 2 });
  const fin = await Promise.all([0, 1].map(() => meetCollect(sql, "ben", { id: d.drop!.id, ...at(LAMPS[3]!) }, NOON + 5000)));
  assert.ok(fin.every((r) => r.ok && r.replay), JSON.stringify(fin));
  assert.deepEqual(await pocket(sql, "ben"), { coins: 100, white: 2 });
  await meetCollect(sql, "ben", { id: d.drop!.id, ...at(LAMPS[3]!) }, NOON + 6000);
  await meetStatus(sql, "ben", NOON + 7000);
  assert.deepEqual(await pocket(sql, "ben"), { coins: 100, white: 2 });
  // The sweep finishes such a row too (the friend never comes back to that tab).
  const e = await meetLeave(sql, "ann", leaveOp(LAMPS[4]!, "ben", "key"), NOON);
  await sql.query(`update meet_drops set state = 'collected' where id = $1`, [e.drop!.id]);
  await meetStatus(sql, "ann", NOON + 8000);
  await meetStatus(sql, "ben", NOON + 9000);
  assert.deepEqual(await pocket(sql, "ben"), { coins: 100, white: 3 });
  await conserved("crash recovery");
});

test("a remote collect fails", async () => {
  const { sql, conserved } = await world();
  const a = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "coin"), NOON);
  // Across town, at another lamp, at the city spawn, just out of reach, and with a junk spot.
  const north = { lat: LAMPS[0]!.lat + (DAILY_REACH_M + 15) / 111_320, lng: LAMPS[0]!.lng };
  assert.ok(distM(north.lat, north.lng, LAMPS[0]!.lat, LAMPS[0]!.lng) > DAILY_REACH_M);
  for (const spot of [at(LAMPS[9]!), at(CITIES.chicago.spawn), north, { lat: Number.NaN, lng: 0 }, { lat: 0, lng: 0 }]) {
    const r = await meetCollect(sql, "ben", { id: a.drop!.id, ...spot }, NOON + 1000);
    assert.deepEqual([r.ok, r.reason], [false, "far"], JSON.stringify(spot));
  }
  assert.deepEqual(await pocket(sql, "ben"), { coins: 10, white: 1 });
  assert.deepEqual([(await dropOf(sql, a.drop!.id)).state, await ledger(sql, "ben")], ["open", []]);
  // Inside the reach it works.
  const near = { lat: LAMPS[0]!.lat + (DAILY_REACH_M - 15) / 111_320, lng: LAMPS[0]!.lng };
  assert.equal((await meetCollect(sql, "ben", { id: a.drop!.id, ...near }, NOON + 2000)).ok, true);
  await conserved("remote collect");
});

test("collect from the dropper or a non-named player fails", async () => {
  const { sql, conserved } = await world();
  const a = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "coin"), NOON);
  const here = { id: a.drop!.id, ...at(LAMPS[0]!) };
  for (const who of ["ann", "cat", "dan", "stranger"]) {
    const r = await meetCollect(sql, who, here, NOON + 1000);
    assert.equal(r.ok, false, who);
  }
  assert.equal((await meetCollect(sql, "ben", { id: "no-such-drop-1", ...at(LAMPS[0]!) }, NOON + 1000)).reason, "gone");
  assert.deepEqual([await pocket(sql, "ann"), await pocket(sql, "cat"), await pocket(sql, "dan")], [{ coins: 70, white: 3 }, { coins: 10, white: 1 }, { coins: 10, white: 1 }]);
  assert.equal((await dropOf(sql, a.drop!.id)).state, "open");
  assert.deepEqual((await meetStatus(sql, "cat", NOON)).incoming, [], "a drop is listed to the named friend only");
  await conserved("wrong collectors");
});

test("alt of the dropper cannot collect", async () => {
  const { sql, conserved } = await world();
  // ann2 is ann's second sign-in (player_links): it IS the dropper.
  const a = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "coin"), NOON);
  const r = await meetCollect(sql, "ann2", { id: a.drop!.id, ...at(LAMPS[0]!) }, NOON + 1000);
  assert.equal(r.ok, false);
  assert.deepEqual(await pocket(sql, "ann"), { coins: 70, white: 3 });
  // And a drop cannot be aimed at your own other sign-in, or at yourself.
  for (const self of ["ann2", "ann"]) assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[1]!, self, "coin"), NOON)).reason, "friend");
  assert.equal((await meetLeave(sql, "ann2", leaveOp(LAMPS[1]!, "ann", "wave"), NOON)).reason, "friend");
  // A leave from the alt is the primary's leave: same pocket, same caps, same friend graph.
  const b = await meetLeave(sql, "ann2", leaveOp(LAMPS[2]!, "ben", "coin"), NOON);
  assert.equal(b.ok, true);
  assert.equal((await dropOf(sql, b.drop!.id)).dropper_id, "ann");
  assert.deepEqual(await pocket(sql, "ann"), { coins: 40, white: 3 });
  assert.equal((await drops(sql)).length, 2);
  await conserved("alts");
});

test("a wave leaves no coin", async () => {
  const { sql, conserved } = await world();
  const w = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "wave"), NOON);
  assert.equal(w.ok, true, JSON.stringify(w));
  assert.deepEqual(await pocket(sql, "ann"), { coins: 100, white: 3 });
  assert.deepEqual(await ledger(sql, "ann"), [], "no wallet write at all");
  assert.deepEqual([Number((await dropOf(sql, w.drop!.id)).amount), (await dropOf(sql, w.drop!.id)).state], [0, "open"]);
  // A broke player can still wave.
  await setPocket(sql, "dan", 0, 0);
  assert.equal((await meetLeave(sql, "dan", leaveOp(LAMPS[1]!, "ann", "wave"), NOON)).ok, true);
  await setPocket(sql, "dan", 10, 1);
  const got = await meetCollect(sql, "ben", { id: w.drop!.id, ...at(LAMPS[0]!) }, NOON + 1000);
  assert.deepEqual([got.ok, got.line], [true, "Ann S. waved at you here."]);
  assert.deepEqual(await pocket(sql, "ben"), { coins: 10, white: 1 });
  assert.deepEqual(await ledger(sql, "ben"), []);
  assert.equal((await meetCollect(sql, "ben", { id: w.drop!.id, ...at(LAMPS[0]!) }, NOON + 2000)).replay, true);
  // A wave still needs the lamp.
  const w2 = await meetLeave(sql, "ann", leaveOp(LAMPS[2]!, "ben", "wave"), NOON);
  assert.equal((await meetCollect(sql, "ben", { id: w2.drop!.id, ...at(LAMPS[9]!) }, NOON + 1000)).reason, "far");
  await conserved("waves");
});

test("expiry refunds the escrow to the dropper", async () => {
  const { sql, conserved } = await world();
  const coin = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "coin"), NOON);
  const key = await meetLeave(sql, "ann", leaveOp(LAMPS[1]!, "ben", "key"), NOON);
  const wave = await meetLeave(sql, "ann", leaveOp(LAMPS[2]!, "ben", "wave"), NOON);
  assert.deepEqual(await pocket(sql, "ann"), { coins: 70, white: 2 });
  // One millisecond short of 24 hours: still out.
  await meetStatus(sql, "ann", NOON + MEET_TTL_MS - 1);
  assert.deepEqual(await pocket(sql, "ann"), { coins: 70, white: 2 });
  assert.equal((await meetStatus(sql, "ben", NOON + MEET_TTL_MS - 1)).incoming.length, 3);
  // At 24 hours a collect is too late: the collector gets nothing and the dropper is refunded.
  const late = await meetCollect(sql, "ben", { id: coin.drop!.id, ...at(LAMPS[0]!) }, NOON + MEET_TTL_MS);
  assert.deepEqual([late.ok, late.reason], [false, "gone"]);
  assert.deepEqual(await pocket(sql, "ben"), { coins: 10, white: 1 });
  assert.deepEqual(await pocket(sql, "ann"), { coins: 100, white: 2 });
  // The dropper's next status sweeps the rest: the key comes back, the wave just vanishes.
  const st = await meetStatus(sql, "ann", NOON + MEET_TTL_MS);
  assert.deepEqual(st.mine, []);
  assert.deepEqual(await pocket(sql, "ann"), { coins: 100, white: 3 });
  for (const id of [coin.drop!.id, key.drop!.id, wave.drop!.id]) assert.deepEqual([(await dropOf(sql, id)).state, (await dropOf(sql, id)).settled], ["expired", true]);
  assert.deepEqual(await ledger(sql, "ann"), [meetLeaveKey(coin.drop!.id), meetLeaveKey(key.drop!.id), meetRefundKey(coin.drop!.id), meetRefundKey(key.drop!.id)].sort());
  // Refunded exactly once, however often anyone looks, collects or the bookkeeping is lost.
  await sql.query(`update meet_drops set settled = false`);
  for (let i = 0; i < 3; i++) {
    await meetStatus(sql, "ann", NOON + MEET_TTL_MS + i * HOUR);
    await meetStatus(sql, "ben", NOON + MEET_TTL_MS + i * HOUR);
    await meetLeave(sql, "ann", leaveOp(LAMPS[9]!, "cat", "wave"), NOON + MEET_TTL_MS + i * HOUR);
    for (const d of [coin, key, wave]) assert.equal((await meetCollect(sql, "ben", { id: d.drop!.id, ...at(LAMPS[0]!) }, NOON + MEET_TTL_MS + i * HOUR)).ok, false);
  }
  assert.deepEqual(await pocket(sql, "ann"), { coins: 100, white: 3 });
  assert.deepEqual(await pocket(sql, "ben"), { coins: 10, white: 1 });
  assert.deepEqual(await ledger(sql, "ben"), []);
  await conserved("expiry");
  // The friend looking (not the dropper) also sends an expired drop home.
  const again = await meetLeave(sql, "ann", leaveOp(LAMPS[3]!, "ben", "coin"), NOON + 30 * HOUR);
  assert.equal(again.ok, true);
  assert.equal((await pocket(sql, "ann")).coins, 70);
  assert.deepEqual((await meetStatus(sql, "ben", NOON + 60 * HOUR)).incoming, []);
  assert.equal((await pocket(sql, "ann")).coins, 100);
  // A leave that never finished (slot taken, nothing debited) is cleared after 5 minutes and refunds nothing.
  await sql.query(
    `insert into meet_drops (id, dropper_id, friend_id, city, poi_id, kind, amount, day, cls, slot, state, created_at, expires_at)
     values ('half-done-0001', 'ann', 'ben', 'austin', $1, 'coin', 30, 'x', 'item', 1, 'pending', $2::timestamptz, $3::timestamptz)`,
    [LAMPS[5]!.id, new Date(NOON).toISOString(), new Date(NOON + MEET_PENDING_MS).toISOString()],
  );
  await meetStatus(sql, "ann", NOON + 61 * HOUR);
  assert.deepEqual([(await dropOf(sql, "half-done-0001")).state, (await dropOf(sql, "half-done-0001")).settled], ["expired", true]);
  assert.equal((await pocket(sql, "ann")).coins, 100, "nothing was debited, so nothing comes back");
  await conserved("pending expiry");
});

test("caps hold", async () => {
  const { sql } = await world();
  await setPocket(sql, "ann", 1000, 20);
  const base = await totals(sql, WHO);
  // 5 items (keys and coin share the cap) per city-local day; the 6th is refused and takes nothing.
  for (let i = 0; i < MEET_ITEM_CAP; i++) assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[i]!, "ben", i % 2 ? "key" : "coin"), NOON + i)).ok, true, `item ${i + 1}`);
  const before = await pocket(sql, "ann");
  for (const kind of ["coin", "key"] as const) assert.deepEqual([(await meetLeave(sql, "ann", leaveOp(LAMPS[5]!, "ben", kind), NOON + 10)).reason], ["cap"]);
  assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[5]!, "dan", "coin"), NOON + 10)).reason, "cap", "the cap is the dropper's, not per friend");
  assert.deepEqual(await pocket(sql, "ann"), before);
  // Waves have their own 10.
  for (let i = 0; i < MEET_WAVE_CAP; i++) assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[5 + i]!, "ben", "wave"), NOON + i)).ok, true, `wave ${i + 1}`);
  assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[15]!, "ben", "wave"), NOON + 20)).reason, "cap");
  const rows = (await drops(sql)).filter((d) => d.dropper_id === "ann");
  assert.deepEqual(rows.filter((d) => d.cls === "item").map((d) => d.slot).sort((a, b) => a - b), [1, 2, 3, 4, 5]);
  assert.deepEqual(rows.filter((d) => d.cls === "wave").map((d) => d.slot).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  // Still the same Austin day at 23:59; the next city-local day opens new slots.
  assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[15]!, "ben", "coin"), ct(25, 23, 59))).reason, "cap");
  // The cap is per dropper: dan has his own.
  await ticket(sql, "t-dan-ben", "dan", "ben");
  assert.equal((await meetLeave(sql, "dan", leaveOp(LAMPS[0]!, "ben", "wave"), NOON)).ok, true);
  const next = ct(26, 0, 1);
  assert.notEqual(cityDay("austin", next), cityDay("austin", NOON));
  assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[15]!, "ben", "coin"), next)).ok, true, "a new city day");
  assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[14]!, "ben", "wave"), next)).reason, "open", "yesterday's wave still sits at that lamp");
  await setPocket(sql, "dan", 10, 1);
  assert.deepEqual(await totals(sql, WHO), base);

  // A race of parallel leaves cannot pass either cap.
  const w2 = await world();
  await setPocket(w2.sql, "ann", 1000, 20);
  const waves = await Promise.all(LAMPS.slice(0, 14).map((l) => meetLeave(w2.sql, "ann", leaveOp(l, "ben", "wave"), NOON)));
  assert.equal(waves.filter((r) => r.ok).length, MEET_WAVE_CAP, JSON.stringify(waves.map((r) => r.reason)));
  assert.ok(waves.filter((r) => !r.ok).every((r) => r.reason === "cap"));
  const w3 = await world();
  await setPocket(w3.sql, "ann", 1000, 20);
  const t0 = await totals(w3.sql, WHO);
  const items = await Promise.all(LAMPS.slice(0, 9).map((l, i) => meetLeave(w3.sql, "ann", leaveOp(l, "ben", i % 2 ? "key" : "coin"), NOON)));
  const okN = items.filter((r) => r.ok).length;
  assert.ok(okN >= 1 && okN <= MEET_ITEM_CAP, `${okN} of 9 parallel item leaves opened`);
  const live = (await drops(w3.sql)).filter((d) => d.cls === "item");
  assert.ok(live.length <= MEET_ITEM_CAP);
  assert.equal(live.filter((d) => d.state === "open").length, okN);
  assert.deepEqual(await totals(w3.sql, WHO), t0, "a raced leave is debited exactly when it opens");
  // Top up to the cap, then one more is refused.
  for (let i = 9; i < 16 && (await drops(w3.sql)).filter((d) => d.cls === "item" && d.state === "open").length < MEET_ITEM_CAP; i++) await meetLeave(w3.sql, "ann", leaveOp(LAMPS[i]!, "ben", "coin"), NOON + 1000);
  assert.equal((await drops(w3.sql)).filter((d) => d.cls === "item" && d.state === "open").length, MEET_ITEM_CAP);
  assert.equal((await meetLeave(w3.sql, "ann", leaveOp(LAMPS[15]!, "ben", "coin"), NOON + 2000)).reason, "cap");
  assert.deepEqual(await totals(w3.sql, WHO), t0);
});

test("expired or returned drops do not refund the cap", async () => {
  const { sql } = await world();
  await setPocket(sql, "ann", 1000, 20);
  const base = await totals(sql, WHO);
  const made = [];
  for (let i = 0; i < MEET_ITEM_CAP; i++) made.push(await meetLeave(sql, "ann", leaveOp(LAMPS[i]!, "ben", "coin"), NOON));
  for (let i = 0; i < MEET_WAVE_CAP; i++) await meetLeave(sql, "ann", leaveOp(LAMPS[5 + i]!, "ben", "wave"), NOON);
  // Two collected (returned to play), and the rest expired and refunded, all still inside the same city day.
  for (const i of [0, 1]) assert.equal((await meetCollect(sql, "ben", { id: made[i]!.drop!.id, ...at(LAMPS[i]!) }, NOON + 1000)).ok, true);
  await sql.query(`update meet_drops set expires_at = $1::timestamptz where state = 'open'`, [new Date(NOON + HOUR).toISOString()]);
  const st = await meetStatus(sql, "ann", NOON + 2 * HOUR);
  assert.deepEqual(st.mine, []);
  assert.equal((await pocket(sql, "ann")).coins, 1000 - 2 * MEET_COIN, "three refunds came back");
  assert.deepEqual((await drops(sql)).map((d) => d.state).sort(), [...Array(2).fill("collected"), ...Array(13).fill("expired")]);
  // Every lamp is free again, but today's slots are spent.
  assert.equal(cityDay("austin", NOON + 3 * HOUR), cityDay("austin", NOON));
  for (const kind of ["coin", "key", "wave"] as const) assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", kind), NOON + 3 * HOUR)).reason, "cap", kind);
  assert.equal((await drops(sql)).length, 15);
  assert.equal((await pocket(sql, "ann")).coins, 1000 - 2 * MEET_COIN);
  assert.deepEqual(await totals(sql, WHO), base);
});

test("one uncollected drop per lamp per dropper", async () => {
  const { sql, conserved } = await world();
  const a = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "wave"), NOON);
  assert.equal(a.ok, true);
  for (const [friend, kind] of [["ben", "coin"], ["dan", "wave"], ["dan", "key"]] as const) assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, friend, kind), NOON + 1)).reason, "open");
  assert.deepEqual(await pocket(sql, "ann"), { coins: 100, white: 3 });
  assert.equal((await drops(sql)).length, 1, "a refused leave spends no slot");
  // Another dropper may use the same lamp; ann may use another lamp.
  assert.equal((await meetLeave(sql, "dan", leaveOp(LAMPS[0]!, "ann", "wave"), NOON)).ok, true);
  assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[1]!, "ben", "wave"), NOON)).ok, true);
  // Two at once at one lamp: one opens.
  const race = await Promise.all(["ben", "dan", "ben"].map((f) => meetLeave(sql, "ann", leaveOp(LAMPS[2]!, f, "coin"), NOON)));
  assert.equal(race.filter((r) => r.ok).length, 1, JSON.stringify(race));
  assert.equal((await pocket(sql, "ann")).coins, 70);
  // Once collected, the lamp is free for a new drop.
  assert.equal((await meetCollect(sql, "ben", { id: a.drop!.id, ...at(LAMPS[0]!) }, NOON + 1000)).ok, true);
  assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "key"), NOON + 2000)).ok, true);
  await conserved("one per lamp");
});

test("received transfers do not count as earned coin or keys", async () => {
  const { sql, conserved } = await world();
  assert.equal(doubles(meetCollectKey("x")), false);
  assert.equal(doubles(meetLeaveKey("x")), false);
  assert.equal(doubles(meetRefundKey("x")), false);
  assert.ok(!DOUBLE_PREFIXES.some((p) => p.startsWith("meet")), "meetget is not in DOUBLE_PREFIXES");
  assert.deepEqual([...DOUBLE_PREFIXES], ["grade:", "street:", "ride:", "cache:", "crate:", "quest:", "hook:"]);
  const cat = () => null;
  const stats0 = await levelStats(sql, "ben", cat);
  const quest0 = await questEvents(sql, "ben", 0, Date.now() + HOUR);
  const meta0 = (await walletOf(sql, "ben")).meta;
  // ben is in his first-hour double: a received transfer is still exactly 30, never doubled.
  await sql.query(`insert into wallet_ledger (user_id, op_key, detail) values ('ben', 'gift:welcome-0144', $1) on conflict do nothing`, [JSON.stringify({ start: Date.now() - 1000 })]);
  const coin = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "coin"), NOON);
  const key = await meetLeave(sql, "ann", leaveOp(LAMPS[1]!, "ben", "key"), NOON);
  assert.equal((await meetCollect(sql, "ben", { id: coin.drop!.id, ...at(LAMPS[0]!) }, NOON + 1000)).ok, true);
  assert.equal((await meetCollect(sql, "ben", { id: key.drop!.id, ...at(LAMPS[1]!) }, NOON + 1000)).ok, true);
  assert.deepEqual(await pocket(sql, "ben"), { coins: 40, white: 2 });
  assert.deepEqual(await levelStats(sql, "ben", cat), stats0, "XP inputs and title stats unchanged");
  assert.deepEqual(await questEvents(sql, "ben", 0, Date.now() + HOUR), quest0, "quest progress unchanged");
  assert.deepEqual((await walletOf(sql, "ben")).meta, meta0, "no streak, boost, level or goal field moved");
  assert.deepEqual(await levelStats(sql, "ann", cat), await levelStats(sql, "dan", cat), "leaving earns the dropper nothing either");
  // The Journal's recent list: a plain gift line for what was received; the debit and a refund are not rewards.
  const rows = await sql<{ op_key: string; detail: string }>`select op_key, detail from wallet_ledger where op_key like ${"meet%"}`;
  const of = (k: string) => rewardOfRow(k, rows.find((r) => r.op_key === k)!.detail, 1, () => undefined);
  assert.deepEqual(of(meetCollectKey(coin.drop!.id)), { at: 1, src: "gift", coins: 30, keys: {} });
  assert.deepEqual(of(meetCollectKey(key.drop!.id)), { at: 1, src: "gift", coins: 0, keys: { white: 1 } });
  assert.equal(of(meetLeaveKey(coin.drop!.id)), null);
  assert.equal(rewardOfRow(meetRefundKey("x"), JSON.stringify({ _d: { c: 30, k: {} } }), 1, () => undefined), null, "a refund is not a reward");
  assert.equal(rewardOfRow(meetLeaveKey("x"), JSON.stringify({ _d: { c: 30, k: {} } }), 1, () => undefined), null);
  // No earn-side code reads these rows: only the meet service and the recent-rewards mapping name the prefixes.
  for (const f of ["levelsServer.ts", "questServer.ts", "lampGift.ts", "walletSql.ts", "walletApply.ts", "streakMile.ts", "boosts.ts", "goals.ts", "standings.ts"]) assert.doesNotMatch(src(`./${f}`), /meetget|meetback|"meet:/, f);
  await conserved("received transfers");
});

test("meet-you-there collect cannot be completed from the client without a valid at-lamp check", async () => {
  const { sql, conserved } = await world();
  const a = await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", "coin"), NOON);
  // The wire schema: an id and a spot. Anything else a client adds is stripped before the service sees it.
  const forged = { id: a.drop!.id, lat: 1, lng: 2, amount: 9999, state: "open", atLamp: true, lamp: LAMPS[0]!.id, city: "austin", expiresAt: 1, friend: "cat", now: 5 };
  assert.deepEqual(meetCollectInput.parse(forged), { id: a.drop!.id, lat: 1, lng: 2 });
  for (const bad of [{ id: a.drop!.id }, { id: a.drop!.id, lat: "x", lng: 1 }, { id: a.drop!.id, lat: Infinity, lng: 1 }, { id: "x", lat: 1, lng: 1 }, { lat: 1, lng: 1 }]) assert.throws(() => meetCollectInput.parse(bad));
  // The service itself reads only id, lat, lng: a forged "I am at the lamp" changes nothing.
  const r = await meetCollect(sql, "ben", { ...forged, lat: CITIES.austin.spawn.lat + 1, lng: CITIES.austin.spawn.lng } as never, NOON + 1000);
  assert.deepEqual([r.ok, r.reason], [false, "far"]);
  assert.deepEqual(await pocket(sql, "ben"), { coins: 10, white: 1 });
  // A guest / unsynced session gets nothing and writes nothing.
  await ticket(sql, "t-ann-gus", "ann", "gus");
  const g = await meetLeave(sql, "ann", leaveOp(LAMPS[1]!, "gus", "coin"), NOON);
  assert.equal(g.ok, true);
  const gr = await meetCollect(sql, "gus", { id: g.drop!.id, ...at(LAMPS[1]!) }, NOON + 1000);
  assert.deepEqual([gr.ok, gr.reason], [false, "sync"]);
  assert.deepEqual([(await dropOf(sql, g.drop!.id)).state, await ledger(sql, "gus", "%")], ["open", []]);
  // The server fns: verified session user, the two schemas, the server's own clock, nothing else passed through.
  const api = src("./meetApi.ts");
  assert.equal(api.match(/\.middleware\(\[authMiddleware\]\)/g)?.length, 3);
  assert.match(api, /\.validator\(\(u: unknown\) => meetCollectInput\.parse\(u\)\)/);
  assert.match(api, /\.validator\(\(u: unknown\) => meetLeaveInput\.parse\(u\)\)/);
  assert.match(api, /collect\(await getSql\(\), context\.userId, data, Date\.now\(\)\)/);
  assert.match(api, /leave\(await getSql\(\), context\.userId, data, Date\.now\(\)\)/);
  assert.doesNotMatch(api, /data\.(userId|now|amount)/);
  // The device's own calls send exactly the wire fields, after the Daily Run's at-lamp rule.
  const client = src("./meetClient.ts");
  assert.match(client, /meetCollect\(\{ data: \{ id: drop\.id, lat: pos\.lat, lng: pos\.lng \} \}\)/);
  assert.match(client, /meetLeave\(\{ data: \{ city, lamp: lamp\.id, lat: pos\.lat, lng: pos\.lng, friend, kind, nonce: nonce\(\) \} \}\)/);
  assert.match(client, /canLightDaily\(pos, lamp, curbOf\(lamp\.lat, lamp\.lng\)\)/);
  assert.doesNotMatch(client, /amount|MEET_COIN/);
  await conserved("forged collect");
});

test("client cannot leave", async () => {
  const { sql, conserved } = await world();
  const good = leaveOp(LAMPS[0]!, "ben", "coin");
  // The wire schema strips an amount, state, expiry, day, slot or dropper; a made-up kind or nonce is thrown out.
  const forged = { ...good, amount: 5000, state: "collected", expiresAt: 9e15, expires_at: "2999-01-01", day: "1999-01-01", slot: 99, dropper: "cat", dropper_id: "cat", settled: true, cls: "wave", now: 1 };
  assert.deepEqual(meetLeaveInput.parse(forged), good);
  for (const bad of [{ ...good, kind: "gold" }, { ...good, kind: "coin500" }, { ...good, nonce: "short" }, { ...good, nonce: "has spaces in it" }, { ...good, lat: "30" }, { ...good, lng: Number.NaN }, { ...good, friend: "" }, { ...good, lamp: undefined }]) assert.throws(() => meetLeaveInput.parse(bad));
  // Handed straight to the service, the forged fields are never read: 30 coin, today's day, a real slot, ann's drop.
  const r = await meetLeave(sql, "ann", forged as never, NOON);
  assert.equal(r.ok, true);
  const row = await dropOf(sql, good.nonce);
  assert.deepEqual([Number(row.amount), row.state, row.day, row.slot, row.dropper_id, row.cls], [30, "open", cityDay("austin", NOON), 1, "ann", "item"]);
  assert.equal(r.drop!.expiresAt, NOON + MEET_TTL_MS);
  assert.deepEqual(await pocket(sql, "ann"), { coins: 70, white: 3 });
  await conserved("forged leave");

  // Replay of the same nonce: the same drop, never a second debit.
  for (let i = 0; i < 3; i++) {
    const again = await meetLeave(sql, "ann", good, NOON + 1000 * i);
    assert.deepEqual([again.ok, again.replay, again.drop?.id], [true, true, good.nonce]);
  }
  const par = await Promise.all([0, 1, 2].map(() => meetLeave(sql, "ann", good, NOON)));
  assert.ok(par.every((x) => x.ok && x.replay));
  assert.deepEqual(await pocket(sql, "ann"), { coins: 70, white: 3 });
  assert.equal((await drops(sql)).length, 1);
  // A fresh nonce sent three times at once is still one drop and one debit.
  const fresh = leaveOp(LAMPS[6]!, "ben", "coin");
  const tri = await Promise.all([0, 1, 2].map(() => meetLeave(sql, "ann", fresh, NOON)));
  assert.ok(tri.some((x) => x.ok), JSON.stringify(tri));
  assert.deepEqual(await pocket(sql, "ann"), { coins: 40, white: 3 });
  assert.equal((await drops(sql)).length, 2);
  await meetLeave(sql, "ann", fresh, NOON + 1);
  assert.deepEqual(await pocket(sql, "ann"), { coins: 40, white: 3 });
  // A half-done leave (the slot row exists, the debit never ran) is finished by the replay, once.
  await sql.query(
    `insert into meet_drops (id, dropper_id, friend_id, city, poi_id, kind, amount, day, cls, slot, state, created_at, expires_at)
     values ('half-done-0002', 'ann', 'ben', 'austin', $1, 'key', 1, $2, 'item', 5, 'pending', $3::timestamptz, $4::timestamptz)`,
    [LAMPS[7]!.id, cityDay("austin", NOON), new Date(NOON).toISOString(), new Date(NOON + MEET_PENDING_MS).toISOString()],
  );
  const half = await meetLeave(sql, "ann", { ...leaveOp(LAMPS[7]!, "ben", "key"), nonce: "half-done-0002" }, NOON + 1000);
  assert.deepEqual([half.ok, half.replay, (await dropOf(sql, "half-done-0002")).state], [true, true, "open"]);
  assert.deepEqual(await pocket(sql, "ann"), { coins: 40, white: 2 });
  await meetLeave(sql, "ann", { ...leaveOp(LAMPS[7]!, "ben", "key"), nonce: "half-done-0002" }, NOON + 2000);
  assert.deepEqual(await pocket(sql, "ann"), { coins: 40, white: 2 });
  // The nonce is one drop: not someone else's, and not re-aimed at another lamp, friend or kind.
  await ticket(sql, "t-dan-ben", "dan", "ben");
  assert.equal((await meetLeave(sql, "dan", { ...leaveOp(LAMPS[0]!, "ben", "coin"), nonce: good.nonce }, NOON)).reason, "spent");
  assert.equal((await meetLeave(sql, "ann", { ...leaveOp(LAMPS[8]!, "ben", "coin"), nonce: good.nonce }, NOON)).reason, "spent");
  assert.equal((await meetLeave(sql, "ann", { ...good, friend: "dan" }, NOON)).reason, "spent");
  assert.equal((await meetLeave(sql, "ann", { ...good, kind: "key" }, NOON)).reason, "spent");
  assert.deepEqual([await pocket(sql, "ann"), await pocket(sql, "dan")], [{ coins: 40, white: 2 }, { coins: 10, white: 1 }]);
  await conserved("replays");
  const count = (await drops(sql)).length;

  // Not at the lamp (the server measures it), or not a number.
  for (const spot of [at(LAMPS[9]!), { lat: Number.NaN, lng: 0 }, { lat: LAMPS[10]!.lat + (DAILY_REACH_M + 15) / 111_320, lng: LAMPS[10]!.lng }]) {
    assert.equal((await meetLeave(sql, "ann", { ...leaveOp(LAMPS[10]!, "ben", "coin"), ...spot }, NOON)).reason, "far");
  }
  // Non-friends: a stranger, a friend's friend, an unredeemed ticket, a made-up id.
  await ticket(sql, "t-ann-open", "ann", null);
  for (const f of ["cat", "stranger", "t-ann-open", "'; drop table meet_drops; --"]) assert.equal((await meetLeave(sql, "ann", leaveOp(LAMPS[10]!, f, "wave"), NOON)).reason, "friend", f);
  assert.equal((await meetLeave(sql, "cat", leaveOp(LAMPS[10]!, "ann", "coin"), NOON)).reason, "friend");
  // Guests and unsynced sessions: refused, nothing written.
  await ticket(sql, "t-gus-ben", "gus", "ben");
  for (const kind of ["wave", "coin", "key"] as const) assert.equal((await meetLeave(sql, "gus", leaveOp(LAMPS[10]!, "ben", kind), NOON)).reason, "sync");
  assert.deepEqual(await ledger(sql, "gus", "%"), []);
  assert.equal((await walletOf(sql, "gus")).migrated, false);
  // Ineligible lamps: every outfitter, station, counter, board and print shop in every city, and a comet.
  const kinds = new Set<string>();
  let tried = 0;
  for (const c of CITY_LIST) {
    for (const p of c.pois) {
      const why = p.printShop ? "printShop" : p.kind === "shop" || p.kind === "station" || p.kind === "counter" || p.kind === "board" ? p.kind : null;
      if (!why) continue;
      assert.equal(meetLamp(c.id, p.id), null, `${c.id} ${p.id}`);
      if (kinds.has(`${c.id}|${why}`)) continue;
      kinds.add(`${c.id}|${why}`);
      tried++;
      const res = await meetLeave(sql, "ann", { city: c.id, lamp: p.id, lat: p.lat, lng: p.lng, friend: "ben", kind: "wave", nonce: nonce() }, NOON);
      assert.equal(res.reason, "lamp", `${c.id} ${p.id} (${why})`);
    }
    const comet = cometId(c.id, 3);
    assert.equal(meetLamp(c.id, comet), null);
  }
  assert.ok(tried > 0 && [...kinds].some((k) => k.endsWith("|station")) && [...kinds].some((k) => k.endsWith("|printShop")), [...kinds].join(","));
  for (const id of [cometId("austin", 3), "no-such-lamp", "hearth-austin-1", ""]) assert.equal((await meetLeave(sql, "ann", { ...leaveOp(LAMPS[10]!, "ben", "wave"), lamp: id }, NOON)).reason, "lamp", id);
  assert.equal((await meetLeave(sql, "ann", { ...leaveOp(LAMPS[10]!, "ben", "wave"), city: "atlantis" }, NOON)).reason, "lamp");
  assert.equal((await meetLeave(sql, "ann", { ...leaveOp(LAMPS[10]!, "ben", "wave"), city: "chicago" }, NOON)).reason, "lamp", "a lamp id from another city");
  // A pocket that cannot cover it.
  await setPocket(sql, "dan", 29, 0);
  for (const kind of ["coin", "key"] as const) assert.equal((await meetLeave(sql, "dan", leaveOp(LAMPS[11]!, "ben", kind), NOON)).reason, "short");
  assert.deepEqual(await pocket(sql, "dan"), { coins: 29, white: 0 });
  await setPocket(sql, "dan", 10, 1);
  assert.equal((await drops(sql)).length, count, "every refusal above wrote no drop");
  assert.deepEqual([await pocket(sql, "ann"), await ledger(sql, "cat"), await ledger(sql, "dan")], [{ coins: 40, white: 2 }, [], []]);
  await conserved("refusals");
});

test("migration 0021 not run: every call refuses \"unready\" and nothing else breaks", async () => {
  const { sql, conserved } = await world(false);
  assert.deepEqual(await meetStatus(sql, "ann", NOON), { ready: false, friends: [], incoming: [], mine: [] });
  for (const kind of ["wave", "coin", "key"] as const) assert.deepEqual(await meetLeave(sql, "ann", leaveOp(LAMPS[0]!, "ben", kind), NOON), { ok: false, reason: "unready" });
  assert.deepEqual(await meetCollect(sql, "ben", { id: "some-drop-0001", ...at(LAMPS[0]!) }, NOON), { ok: false, reason: "unready" });
  assert.deepEqual(await pocket(sql, "ann"), { coins: 100, white: 3 });
  assert.deepEqual(await ledger(sql, "ann"), []);
  // The wallet still syncs.
  assert.equal((await syncPlayer(sql, "ann", snap, "ann-phone1")).ok, true);
  await conserved("no table");
  // The migration: additive, re-runnable, and it says how to undo it.
  const m = mig(MEET_MIG);
  assert.match(m, /create table if not exists meet_drops/);
  assert.match(m, /-- To undo: drop table if exists meet_drops;/);
  assert.match(m, /create unique index if not exists meet_drops_slot_uidx on meet_drops \(dropper_id, day, cls, slot\)/);
  assert.match(m, /create unique index if not exists meet_drops_lamp_uidx on meet_drops \(dropper_id, poi_id\) where state in \('pending', 'open'\)/);
  assert.doesNotMatch(m, /drop (table|index|column) (?!if exists meet_drops; \()|alter table|delete from|update /i);
  // The table itself refuses amounts the rules do not have.
  const w = await world();
  const ins = (kind: string, amount: number, cls: string, slot: number) =>
    w.sql.query(`insert into meet_drops (id, dropper_id, friend_id, city, poi_id, kind, amount, day, cls, slot, expires_at) values ($1, 'ann', 'ben', 'austin', 'p', $2, $3, 'd', $4, $5, now())`, [nonce(), kind, amount, cls, slot]);
  await assert.rejects(ins("coin", 31, "item", 1));
  await assert.rejects(ins("coin", 3000, "item", 1));
  await assert.rejects(ins("key", 2, "item", 1));
  await assert.rejects(ins("wave", 30, "wave", 1));
  await assert.rejects(ins("coin", 30, "wave", 1));
  await assert.rejects(ins("coin", 30, "item", 6));
  await assert.rejects(ins("wave", 0, "wave", 11));
  await assert.rejects(w.sql.query(`insert into meet_drops (id, dropper_id, friend_id, city, poi_id, kind, amount, day, cls, slot, expires_at) values ('self-drop-0001', 'ann', 'ann', 'austin', 'p', 'wave', 0, 'd', 'wave', 1, now())`));
});

test("meetStatus: friends from the friend graph, names as the boards show them, read-only apart from the sweep", async () => {
  const { sql, conserved } = await world();
  const st = await meetStatus(sql, "ann", NOON);
  assert.deepEqual(st, { ready: true, friends: [{ id: "ben", name: "Ben S." }, { id: "dan", name: "Dan S." }], incoming: [], mine: [] });
  assert.deepEqual((await meetStatus(sql, "ann2", NOON)).friends, st.friends, "a second sign-in sees the same list");
  assert.deepEqual((await meetStatus(sql, "nobody", NOON)).friends, []);
  assert.equal((await drops(sql)).length, 0);
  assert.deepEqual(await ledger(sql, "ann", "%meet%"), []);
  await conserved("status");
});

test("version: the 0.1.186 / k1186a changelog line, migration 0021, the test entry", () => {
  // 0.1.187: the live version moved on; the current-version pins live in the newest slice's test.
  const v = src("../version.ts");
  assert.match(v, /\n\/\/ 0\.1\.186: Meet you there — [^\n]*\(k1186a\)\.\n/);
  const pkg = JSON.parse(src("../../package.json")) as { version: string; scripts: { test: string } };
  assert.match(pkg.scripts.test, / src\/game\/meetYouThere0186\.test\.ts /);
  assert.match(v, /0\.1\.186: Meet you there — [^\n]*migration 0021/);
});
