// 0.1.183 Radio hop (CARD-184): pure flavor, no coin. 2,000 m of accepted drive metres in one city on that city's
// local day unlocks one hop there (ledger row `radio:<city>:<cityDay>`, migration 0020 radio_hop). The metres are the
// ones Sunday Drive accepted for the same ping; the counter is Radio hop's own. Nothing here touches the network.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { z } from "zod";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { CITY_LIST } from "./data.ts";
import type { LocalSnap } from "./wallet.ts";
import { applyClientOp, sundayPing, syncPlayer, type ClientOp } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";
import { DAILY_JITTER_MS } from "./dailyRun.ts";
import { cityDay } from "./vaultStack.ts";
import { SUNDAY_PING_MAX_M, SUNDAY_SLACK, sundayCeiling } from "./sundayDrive.ts";
import { PACK } from "./sfxPack.ts";
import { RADIO_HOP_GUIDE, RADIO_HOP_M, radioKey, radioUnlocked } from "./radioHop.ts";
thanksClock.cutoff = "2000-01-01T00:00:00Z";

// The fake-sql harness of sundayDrive0181.test.ts (PGlite + the real migrations), plus 0020.
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
const SD_MIG = "0019_sunday_drive.sql";
const RH_MIG = "0020_radio_hop.sql";
const opened: PGlite[] = [];
afterEach(async () => {
  for (const pg of opened.splice(0)) await pg.close();
});
async function db(migs: string[] = [SD_MIG, RH_MIG]) {
  const pg = new PGlite();
  opened.push(pg);
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  for (const m of ["0016_player_wallet.sql", "0003_plate_events.sql", "0014_walk_distance.sql", ...migs]) await pg.exec(mig(m));
  return sqlOf(pg);
}
const snap: LocalSnap = { coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false } };
const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const walletOf = async (sql: Sql, user: string) => (await canonicalWallet(sql, user)).wallet;
const radioRows = async (sql: Sql, user: string) =>
  (await sql<{ op_key: string }>`select op_key from wallet_ledger where user_id = ${(await canonicalWallet(sql, user)).id} and op_key like ${"radio:%"} order by op_key`).map((r) => r.op_key);
const hopOf = async (sql: Sql, user: string, city: string) => (await sql<{ day: string; meters: number }>`select day, meters from radio_hop where user_id = ${user} and city = ${city}`)[0] ?? null;
const sdMeters = async (sql: Sql, user: string) => Number((await sql<{ meters: number }>`select meters from sunday_drive where user_id = ${user}`)[0]?.meters ?? 0);

// 2025-11-25 is Central Standard Time (UTC-6) and GMT in London. Past days on purpose (see sundayDrive0181.test.ts).
const ct = (day: number, h: number, m = 0, s = 0) => Date.UTC(2025, 10, day, h + 6, m, s);
const NOON = ct(25, 12);
const DAY = "2025-11-25";
beforeEach(() => mock.timers.enable({ apis: ["Date"], now: NOON }));
afterEach(() => mock.timers.reset());

/** The wire schema's sunday member, rebuilt from the one source line in walletApi.ts (which cannot be imported here: it pulls in the server framework). */
function wireOp() {
  const line = src("./walletApi.ts").match(/^\s*(z\.object\(\{ kind: z\.literal\("sunday"\)[^\n]*\})\),$/m)?.[1];
  assert.ok(line, "the sunday op line");
  const City = z.enum(CITY_LIST.map((c) => c.id) as [string, ...string[]]);
  return new Function("z", "City", "SUNDAY_PING_MAX_M", `return ${line});`)(z, City, SUNDAY_PING_MAX_M) as z.ZodTypeAny;
}

test("rules: 2,000 whole metres, the ledger key, the Field Guide line", () => {
  assert.equal(RADIO_HOP_M, 2000);
  assert.equal(radioKey("austin", DAY), "radio:austin:2025-11-25");
  assert.deepEqual([radioUnlocked(1999), radioUnlocked(1999.9), radioUnlocked(2000), radioUnlocked(9000), radioUnlocked(Number.NaN)], [false, false, true, true, false]);
  assert.equal(RADIO_HOP_GUIDE, "Radio hop: drive 2 km in a city and the radio gives you a little hop, once per city per day.");
  assert.match(src("../components/keyline/FieldGuide.tsx"), /<li>Sunday Drive:[^\n]*\n\s*<li>\{RADIO_HOP_GUIDE\}<\/li>/);
});

test("hop unlocks once per city per city-local day at 2,000 m of drive", async () => {
  const sql = await db();
  await syncPlayer(sql, "ann", snap, "ann-phone");
  // 1,000 + 999 = 1,999 m seated: no hop.
  const a = await sundayPing(sql, "ann", { mode: "drive", meters: 1000, city: "austin" }, NOON);
  const b = await sundayPing(sql, "ann", { mode: "drive", meters: 999, city: "austin" }, NOON + 8000);
  assert.equal(a.radio, undefined);
  assert.equal(b.radio, undefined);
  assert.deepEqual(await hopOf(sql, "ann", "austin"), { day: DAY, meters: 1999 });
  assert.deepEqual(await radioRows(sql, "ann"), []);
  // The metre that makes 2,000 unlocks it (>=, whole metres), with the ledger row.
  const c = await sundayPing(sql, "ann", { mode: "drive", meters: 10, city: "austin" }, NOON + 16_000);
  assert.deepEqual(c.radio, { city: "austin", day: DAY, fresh: true });
  assert.equal(cityDay("austin", NOON), DAY);
  assert.deepEqual(await radioRows(sql, "ann"), [radioKey("austin", DAY)]);
  // Further drive the same day: the meter keeps counting, nothing unlocks or plays again.
  for (let i = 3; i < 8; i++) assert.equal((await sundayPing(sql, "ann", { mode: "drive", meters: 1500, city: "austin" }, NOON + i * 8000)).radio, undefined);
  assert.deepEqual(await hopOf(sql, "ann", "austin"), { day: DAY, meters: 2009 + 5 * 1500 });
  assert.deepEqual(await radioRows(sql, "ann"), [radioKey("austin", DAY)]);
  // One ping that crosses 2,000 counts whole.
  await syncPlayer(sql, "bea", snap, "bea-phone");
  await sundayPing(sql, "bea", { mode: "drive", meters: 1200, city: "austin" }, NOON);
  const big = await sundayPing(sql, "bea", { mode: "drive", meters: 2500, city: "austin" }, NOON + 20_000);
  assert.deepEqual(big.radio, { city: "austin", day: DAY, fresh: true });
  assert.deepEqual(await hopOf(sql, "bea", "austin"), { day: DAY, meters: 3700 });
  // A drive ping with no city label is plain Sunday Drive: no counter, no hop.
  await syncPlayer(sql, "cy", snap, "cy-phone");
  for (let i = 0; i < 3; i++) assert.equal((await sundayPing(sql, "cy", { mode: "drive", meters: 1500 }, NOON + i * 8000)).radio, undefined);
  assert.equal(Number((await sql<{ n: number }>`select count(*)::int as n from radio_hop where user_id = ${"cy"}`)[0]!.n), 0);
  assert.equal(await sdMeters(sql, "cy"), 4500);
});

test("walk never counts", async () => {
  const sql = await db();
  await syncPlayer(sql, "dan", snap, "dan-phone");
  // 10 honest walk pings of 500 m, labelled with the city: 5,000 m on foot.
  for (let i = 0; i < 10; i++) {
    const r = await sundayPing(sql, "dan", { mode: "walk", meters: 500, city: "austin" }, NOON + i * 8000);
    assert.equal(r.ok, true);
    assert.equal(r.radio, undefined);
  }
  assert.equal(await sdMeters(sql, "dan"), 5000, "Sunday Drive counted the walk");
  assert.equal(await hopOf(sql, "dan", "austin"), null, "Radio hop holds no walk metres");
  assert.deepEqual(await radioRows(sql, "dan"), []);
});

test("walk metres in a cab-less city never count", async () => {
  const sql = await db();
  await syncPlayer(sql, "eli", snap, "eli-phone");
  // A city with no cab is walked: those pings are mode "walk" whatever the city, 4,000 m of them.
  for (let i = 0; i < 8; i++) assert.equal((await sundayPing(sql, "eli", { mode: "walk", meters: 500, city: "temple" }, NOON + i * 8000)).radio, undefined);
  assert.equal(await hopOf(sql, "eli", "temple"), null);
  // Then 1,999 m seated there: the counter holds the drive metres only, so still no hop.
  const r1 = await sundayPing(sql, "eli", { mode: "drive", meters: 1000, city: "temple" }, NOON + 72_000);
  const r2 = await sundayPing(sql, "eli", { mode: "drive", meters: 999, city: "temple" }, NOON + 80_000);
  assert.equal(r1.radio, undefined);
  assert.equal(r2.radio, undefined);
  assert.deepEqual(await hopOf(sql, "eli", "temple"), { day: DAY, meters: 1999 });
  assert.equal(await sdMeters(sql, "eli"), 5999);
  assert.deepEqual(await radioRows(sql, "eli"), []);
  // More walking does not tip it over either.
  assert.equal((await sundayPing(sql, "eli", { mode: "walk", meters: 500, city: "temple" }, NOON + 88_000)).radio, undefined);
  assert.deepEqual(await hopOf(sql, "eli", "temple"), { day: DAY, meters: 1999 });
});

test("not a second time after reload", async () => {
  const sql = await db();
  await syncPlayer(sql, "fay", snap, "fay-phone");
  const first = await applyClientOp(sql, "fay", { kind: "sunday", mode: "drive", meters: 2400, city: "austin" });
  assert.deepEqual(first.radio, { city: "austin", day: DAY, fresh: true });
  // A reload: a fresh sync (which carries no radio at all), then more driving from the same and another device.
  const sync = await syncPlayer(sql, "fay", snap, "fay-phone");
  assert.equal((sync as Record<string, unknown>).radio, undefined);
  await syncPlayer(sql, "fay", snap, "fay-tablet");
  for (let i = 1; i <= 4; i++) {
    mock.timers.setTime(NOON + i * 8000);
    const again = await applyClientOp(sql, "fay", { kind: "sunday", mode: "drive", meters: 2400, city: "austin" });
    assert.equal(again.ok, true);
    assert.equal(again.radio, undefined);
  }
  assert.deepEqual(await radioRows(sql, "fay"), [radioKey("austin", DAY)], "exactly one row");
  // A linked sign-in is the same player: same counter, same row, no second hop.
  await sql`insert into player_links (alias_id, primary_id, how) values (${"fay-x"}, ${"fay"}, ${"test"})`;
  mock.timers.setTime(NOON + 60_000);
  assert.equal((await applyClientOp(sql, "fay-x", { kind: "sunday", mode: "drive", meters: 2400, city: "austin" })).radio, undefined);
  assert.equal(await hopOf(sql, "fay-x", "austin"), null);
  assert.equal((await radioRows(sql, "fay")).length, 1);
  // The device keeps its own once-per-session guard and nothing else: no save field, no store field.
  const client = src("./walkClient.ts");
  assert.match(client, /if \(r\.radio\?\.fresh\) \{\s*const hop = `\$\{r\.radio\.city\}:\$\{r\.radio\.day\}`;\s*if \(!radioPlayed\.has\(hop\)\) \{\s*radioPlayed\.add\(hop\);\s*sfx\.radioHop\(\);/);
  assert.equal(client.match(/sfx\.radioHop\(\)/g)?.length, 1);
  assert.doesNotMatch(src("./store.ts"), /radio/i);
});

test("the 2,000 m counter is separate from Sunday Drive's meter", async () => {
  const sql = await db();
  await syncPlayer(sql, "gus", snap, "gus-phone");
  const before = await walletOf(sql, "gus");
  // Walk 1,500 m (3 pings), then drive 1,500 m: Sunday Drive has 3,000 m and 3 pays, Radio hop 1,500 m and none.
  let t = NOON;
  for (let i = 0; i < 3; i++, t += 8000) await sundayPing(sql, "gus", { mode: "walk", meters: 500, city: "austin" }, t);
  const d1 = await sundayPing(sql, "gus", { mode: "drive", meters: 1500, city: "austin" }, t);
  assert.deepEqual(d1.sunday, { paid: 3, day: DAY });
  assert.equal(d1.award?.coins, 50, "km 2 and 3, 25 each, on this ping");
  assert.equal(d1.radio, undefined);
  assert.equal(await sdMeters(sql, "gus"), 3000);
  assert.deepEqual(await hopOf(sql, "gus", "austin"), { day: DAY, meters: 1500 });
  assert.equal((await walletOf(sql, "gus")).coins, before.coins + 75);
  // Walk Sunday Drive up to its cap (8 km) before the hop: the cap does not stop the radio counter.
  for (let i = 0; i < 11; i++) await sundayPing(sql, "gus", { mode: "walk", meters: 500, city: "austin" }, (t += 8000));
  assert.equal(await sdMeters(sql, "gus"), 8500);
  assert.equal((await walletOf(sql, "gus")).coins, before.coins + 200, "8 pays of 25");
  const capped = await walletOf(sql, "gus");
  const hop = await sundayPing(sql, "gus", { mode: "drive", meters: 500, city: "austin" }, (t += 8000));
  assert.deepEqual(hop.sunday, { paid: 8, day: DAY });
  assert.deepEqual(hop.radio, { city: "austin", day: DAY, fresh: true });
  assert.equal(hop.award, undefined, "the hop awards nothing");
  assert.deepEqual(await hopOf(sql, "gus", "austin"), { day: DAY, meters: 2000 });
  assert.equal(await sdMeters(sql, "gus"), 9000);
  // No coin, no keys: the wallet is what the 8 Sunday pays left, and the hop's ledger row is a zero delta.
  const after = await walletOf(sql, "gus");
  assert.equal(after.coins, capped.coins);
  assert.deepEqual(after.keys, capped.keys);
  assert.deepEqual(after.keys, before.keys);
  assert.equal(hop.view.coins, capped.coins);
  const row = await sql<{ detail: string }>`select detail from wallet_ledger where user_id = ${"gus"} and op_key = ${radioKey("austin", DAY)}`;
  assert.equal(row[0]!.detail, '{"rh":1}');
  assert.equal(Number((await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where user_id = ${"gus"} and op_key like ${"sd:%"}`)[0]!.n), 8);
  // Hop first, pays after: a pay on the unlocking ping is exactly Sunday Drive's 25 a km, nothing added by the hop.
  await syncPlayer(sql, "hal", snap, "hal-phone");
  const h0 = (await walletOf(sql, "hal")).coins;
  const both = await sundayPing(sql, "hal", { mode: "drive", meters: 2000, city: "austin" }, NOON);
  assert.deepEqual(both.radio, { city: "austin", day: DAY, fresh: true });
  assert.equal(both.award?.coins, 50);
  assert.deepEqual(both.award?.boosts, ["Sunday Drive +50 coin"]);
  assert.equal((await walletOf(sql, "hal")).coins, h0 + 50);
});

test("a second city the same day can hop once", async () => {
  const sql = await db();
  await syncPlayer(sql, "ivy", snap, "ivy-phone");
  assert.deepEqual((await sundayPing(sql, "ivy", { mode: "drive", meters: 2000, city: "austin" }, NOON)).radio, { city: "austin", day: DAY, fresh: true });
  // Austin's metres do not count in Chicago: 1,999 m there is no hop, 2,000 is, and only once.
  assert.equal((await sundayPing(sql, "ivy", { mode: "drive", meters: 1999, city: "chicago" }, NOON + 8000)).radio, undefined);
  assert.deepEqual((await sundayPing(sql, "ivy", { mode: "drive", meters: 10, city: "chicago" }, NOON + 16_000)).radio, { city: "chicago", day: DAY, fresh: true });
  assert.equal((await sundayPing(sql, "ivy", { mode: "drive", meters: 2000, city: "chicago" }, NOON + 24_000)).radio, undefined);
  assert.equal((await sundayPing(sql, "ivy", { mode: "drive", meters: 2000, city: "austin" }, NOON + 32_000)).radio, undefined);
  assert.deepEqual(await radioRows(sql, "ivy"), [radioKey("austin", DAY), radioKey("chicago", DAY)]);
});

test("rolls over at the city's midnight", async () => {
  // 23:30 GMT on the 25th is 17:30 in Austin: one instant, the same date; half an hour later London is on the 26th
  // and Austin is not.
  const lateLondon = Date.UTC(2025, 10, 25, 23, 30);
  const nextLondon = Date.UTC(2025, 10, 26, 0, 0, 10);
  assert.deepEqual([cityDay("london", lateLondon), cityDay("austin", lateLondon)], [DAY, DAY]);
  assert.deepEqual([cityDay("london", nextLondon), cityDay("austin", nextLondon)], ["2025-11-26", DAY]);
  const sql = await db();
  await syncPlayer(sql, "jon", snap, "jon-phone");
  // 1,500 m in each city before London's midnight.
  await sundayPing(sql, "jon", { mode: "drive", meters: 1500, city: "london" }, lateLondon);
  await sundayPing(sql, "jon", { mode: "drive", meters: 1500, city: "austin" }, lateLondon + 8000);
  // After it: London's 1,500 m leftover is dropped (600 m is just 600 m); Austin's day has not turned, so 600 m unlocks.
  const lon = await sundayPing(sql, "jon", { mode: "drive", meters: 600, city: "london" }, nextLondon);
  assert.equal(lon.radio, undefined);
  assert.deepEqual(await hopOf(sql, "jon", "london"), { day: "2025-11-26", meters: 600 });
  const aus = await sundayPing(sql, "jon", { mode: "drive", meters: 600, city: "austin" }, nextLondon + 8000);
  assert.deepEqual(aus.radio, { city: "austin", day: DAY, fresh: true });
  // London's new day is its own: 1,400 m more unlocks the 26th's hop, keyed by London's date.
  const lon2 = await sundayPing(sql, "jon", { mode: "drive", meters: 1400, city: "london" }, nextLondon + 16_000);
  assert.deepEqual(lon2.radio, { city: "london", day: "2025-11-26", fresh: true });
  // Austin's midnight (06:00Z): yesterday's hop does not block today's, and yesterday's metres do not carry.
  const ausNext = ct(26, 0, 0, 10);
  assert.equal((await sundayPing(sql, "jon", { mode: "drive", meters: 1999, city: "austin" }, ausNext)).radio, undefined);
  assert.deepEqual(await hopOf(sql, "jon", "austin"), { day: "2025-11-26", meters: 1999 });
  assert.deepEqual((await sundayPing(sql, "jon", { mode: "drive", meters: 10, city: "austin" }, ausNext + 8000)).radio, { city: "austin", day: "2025-11-26", fresh: true });
  assert.deepEqual(await radioRows(sql, "jon"), ["radio:austin:2025-11-25", "radio:austin:2025-11-26", "radio:london:2025-11-26"]);
});

test("radio-hop flag cannot be set from the client", async () => {
  // The wire schema: a mode, a length and a city label. Zod strips anything else; a bad city is refused.
  const Op = wireOp();
  assert.deepEqual(Op.parse({ kind: "sunday", mode: "drive", meters: 5, city: "austin", radio: true, unlocked: true, fresh: true, total: 2000, metersTotal: 2000, day: "2025-11-24" }), { kind: "sunday", mode: "drive", meters: 5, city: "austin" });
  assert.deepEqual(Op.parse({ kind: "sunday", mode: "walk", meters: 500 }), { kind: "sunday", mode: "walk", meters: 500 }, "a city-less ping is still valid");
  assert.equal(Op.safeParse({ kind: "sunday", mode: "drive", meters: 5, city: "atlantis" }).success, false);
  assert.equal(Op.safeParse({ kind: "sunday", mode: "drive", meters: 5, city: 7 }).success, false);
  assert.equal(Op.safeParse({ kind: "sunday", mode: "fly", meters: 5, city: "austin" }).success, false);
  const api = src("./walletApi.ts");
  assert.match(api, /z\.object\(\{ kind: z\.literal\("sunday"\), city: City\.optional\(\), mode: /);
  assert.match(api, /^const City = z\.enum\(CITIES\);$/m);
  assert.match(api, /\.validator\(\(u: unknown\) => Op\.parse\(u\)\)/);
  // The reply field is only ever what the server computed.
  assert.match(api, /\.\.\.\(r\.radio \? \{ radio: r\.radio \} : \{\}\),/);
  // Handed straight to the apply layer, forged fields do nothing: 500 m is 500 m, no hop, no row.
  const sql = await db();
  await syncPlayer(sql, "kim", snap, "kim-phone");
  const forged = { kind: "sunday", mode: "drive", meters: 500, city: "austin", radio: { city: "austin", day: DAY, fresh: true }, unlocked: true, fresh: true, total: 9999, day: "2025-11-24" } as unknown as ClientOp;
  const r = await applyClientOp(sql, "kim", forged);
  assert.equal(r.ok, true);
  assert.equal(r.radio, undefined);
  assert.deepEqual(await hopOf(sql, "kim", "austin"), { day: DAY, meters: 500 });
  assert.deepEqual(await radioRows(sql, "kim"), []);
  // A city that is not one (or a prototype key) writes no counter row even past the schema.
  for (const [i, city] of ["atlantis", "constructor", "__proto__", ""].entries()) {
    mock.timers.setTime(NOON + (i + 1) * 8000);
    const bad = await applyClientOp(sql, "kim", { kind: "sunday", mode: "drive", meters: 2500, city } as unknown as ClientOp);
    assert.equal(bad.radio, undefined);
  }
  assert.equal(Number((await sql<{ n: number }>`select count(*)::int as n from radio_hop`)[0]!.n), 1);
  // One writer of the key, and it is a zero delta with no award.
  const apply = src("./walletApply.ts");
  assert.equal(apply.match(/radioKey\(/g)?.length, 1, "one writer");
  assert.match(apply, /mutateWallet\(sql, sessionUserId, key, \(w\) => \(\{ \.\.\.applyDelta\(w, \{ coins: 0, keys: \{\} \}\), detail: JSON\.stringify\(\{ rh: 1 \}\) \}\)\);/);
  // The device sends the label and nothing else.
  const client = src("./walkClient.ts");
  assert.match(client, /commitWallet\(\{ kind: "sunday", mode, meters: whole, city \}\)/);
  assert.doesNotMatch(client, /commitWallet\(\{[^}]*(radio|unlocked|fresh|total)/);
});

test("teleport / jitter legs add nothing to radio", async () => {
  const sql = await db();
  await syncPlayer(sql, "lou", snap, "lou-phone");
  await sundayPing(sql, "lou", { mode: "drive", meters: 1900, city: "austin" }, NOON);
  // A leg over the drive ceiling is rejected whole: it would have crossed 2,000 and adds 0.
  const far = Math.floor(((8000 + DAILY_JITTER_MS) / 1000) * sundayCeiling("drive", []) * SUNDAY_SLACK) + 1;
  const tele = await sundayPing(sql, "lou", { mode: "drive", meters: far, city: "austin" }, NOON + 8000);
  assert.equal(tele.ok, true);
  assert.equal(tele.radio, undefined);
  // Jitter under 10 m: nothing, however many.
  for (let i = 2; i < 30; i++) assert.equal((await sundayPing(sql, "lou", { mode: "drive", meters: 9, city: "austin" }, NOON + i * 8000)).radio, undefined);
  // A ping inside a second of the last does not move the clock and adds nothing.
  const fast = await sundayPing(sql, "lou", { mode: "drive", meters: 500, city: "austin" }, NOON + 29 * 8000 + 300);
  assert.equal(fast.reason, "retry");
  assert.equal(fast.radio, undefined);
  assert.deepEqual(await hopOf(sql, "lou", "austin"), { day: DAY, meters: 1900 });
  assert.equal(await sdMeters(sql, "lou"), 1900);
  assert.deepEqual(await radioRows(sql, "lou"), []);
  // An honest leg after them still counts.
  assert.deepEqual((await sundayPing(sql, "lou", { mode: "drive", meters: 100, city: "austin" }, NOON + 300_000)).radio, { city: "austin", day: DAY, fresh: true });
});

test("guest / unsynced pays and writes nothing", async () => {
  const sql = await db();
  for (let i = 0; i < 4; i++) {
    const r = await applyClientOp(sql, "guest", { kind: "sunday", mode: "drive", meters: 2500, city: "austin" });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "sync");
    assert.equal(r.radio, undefined);
    assert.equal(r.award, undefined);
    mock.timers.setTime(NOON + (i + 1) * 8000);
  }
  assert.equal(Number((await sql<{ n: number }>`select count(*)::int as n from radio_hop`)[0]!.n), 0);
  assert.equal(Number((await sql<{ n: number }>`select count(*)::int as n from sunday_drive`)[0]!.n), 0);
  assert.equal(Number((await sql<{ n: number }>`select count(*)::int as n from wallet_ledger where op_key like ${"radio:%"}`)[0]!.n), 0);
  assert.equal((await walletOf(sql, "guest")).coins, 0);
  // The device queues nothing and plays nothing without a live server wallet (the 0.1.181 guard, unchanged).
  const client = src("./walkClient.ts");
  assert.match(client, /if \(!\(meters > 0\) \|\| meters > MAX_TICK_M \|\| !walletLive\(\)\) return;/);
});

test("migration 0020 is additive and safe to run twice; without it Sunday Drive still works and no hop unlocks", async () => {
  const text = mig(RH_MIG);
  assert.match(text, /create table if not exists radio_hop/);
  assert.match(text, /primary key \(user_id, city\)/);
  assert.match(text, /^-- To undo: drop table if exists radio_hop;/m);
  assert.doesNotMatch(text.replace(/^--.*$/gm, ""), /\b(drop|alter|delete|truncate)\b/i);
  const sql = await db([SD_MIG, RH_MIG, RH_MIG]);
  await syncPlayer(sql, "moe", snap, "moe-phone");
  await sundayPing(sql, "moe", { mode: "drive", meters: 1200, city: "austin" }, NOON);
  await sql.query(mig(RH_MIG));
  assert.deepEqual(await hopOf(sql, "moe", "austin"), { day: DAY, meters: 1200 }, "re-running keeps the rows");
  // Published before 0020 ran: the ping is a plain Sunday Drive ping, paid as ever; no hop, no ledger row.
  const bare = await db([SD_MIG]);
  await syncPlayer(bare, "ned", snap, "ned-phone");
  const base = (await walletOf(bare, "ned")).coins;
  const r = await sundayPing(bare, "ned", { mode: "drive", meters: 2500, city: "austin" }, NOON);
  assert.equal(r.ok, true);
  assert.deepEqual(r.sunday, { paid: 2, day: DAY });
  assert.equal(r.award?.coins, 50);
  assert.equal(r.radio, undefined);
  assert.equal((await walletOf(bare, "ned")).coins, base + 50);
  assert.deepEqual(await radioRows(bare, "ned"), []);
});

test("the device labels a drive ping with the city its metres were driven in, and drops the bag at a city change", () => {
  const client = src("./walkClient.ts");
  // The bag remembers its city; a tick in another city empties both counters before it is counted.
  assert.match(client, /const city = useGame\.getState\(\)\.cityId;\s*if \(city !== sundayCity\) \{\s*sundayBag\.walk = 0;\s*sundayBag\.drive = 0;\s*sundayCity = city;\s*\}\s*sundayBag\[mode\] = /);
  // Only a drive ping names its city; a failed send is not put back into another city's bag.
  assert.match(client, /await \(mode === "drive" && city \? commitWallet\(\{ kind: "sunday", mode, meters: whole, city \}\) : commitWallet\(\{ kind: "sunday", mode, meters: whole \}\)\);/);
  assert.match(client, /if \(sundayCity === city\) sundayBag\[mode\] = Math\.min\(SUNDAY_BAG_CAP_M, sundayBag\[mode\] \+ whole\);/);
  // The map loop's call is the 0.1.181 one, untouched.
  assert.match(src("../components/keyline/GameMap.tsx"), /if \(stepped > 0\.2\) noteSunday\(seated \? "drive" : "walk", stepped\);/);
});

test("sfx.radioHop reuses recipes already in the pack: a short duck of the city bed, no new sound data", () => {
  const audio = src("./audio.ts");
  const at = audio.indexOf("  radioHop: () => {");
  assert.ok(at > 0, "sfx.radioHop exists");
  const body = audio.slice(at, audio.indexOf("  fireworks:", at));
  assert.match(body, /if \(!ctx \|\| !sfxBus \|\| muted\) return;/);
  // The bed dips to 0.25 and comes back to its usual level through applyGains (0.7, or 0 if muted meanwhile).
  assert.match(body, /if \(musicBus && musicOn\) \{\s*musicBus\.gain\.setTargetAtTime\(0\.25, ctx\.currentTime, 0\.08\);\s*setTimeout\(applyGains, 2500\);/);
  assert.match(audio, /musicBus\.gain\.setTargetAtTime\(!musicOn \|\| muted \? 0 : 0\.7, ctx\.currentTime, 0\.06\);/);
  // Only pack recipes that already exist, and no oscillator, buffer or file of its own.
  const used = [...body.matchAll(/playPack\("(\w+)"\)/g)].map((m) => m[1]!);
  assert.deepEqual(used, ["loopWhoosh", "cityArrive"]);
  for (const n of used) assert.ok(n in PACK);
  assert.doesNotMatch(body, /createOscillator|createBuffer|beep|noiseAt|new Audio|fetch\(|\.(mp3|ogg|wav|m4a)/);
  // The pack itself did not grow: the same 8 recipes as 0.1.58, none named for the radio.
  assert.deepEqual(Object.keys(PACK).sort(), ["carBuy", "carDoor", "carStart", "cityArrive", "crateOpen", "levelUp", "loopWhoosh", "questDone"]);
  assert.doesNotMatch(src("./sfxPack.ts"), /radio/i);
});
