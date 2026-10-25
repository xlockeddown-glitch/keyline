// 0.1.22: weekly / monthly quests are counted and paid by the server; the old milestones and charms move once.
import { lampGiftClock, welcomeClock } from "./lampGift.ts";
// 0.1.44: and the new-player welcome pack (welcome.test.ts covers it).
welcomeClock.cutoff = "2999-01-01T00:00:00Z";
// 0.1.43: these tests predate the free lantern gift; keep it out of their wallets (lampGift.test.ts covers it).
lampGiftClock.cutoff = "2000-01-01T00:00:00Z";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../lib/db.ts";
import { freshUnlocks } from "./cityPass.ts";
import { LUCKY_OWNED_COIN, questSet } from "./questBoard.ts";
import { chicagoDay, currentPeriod, dayKey, monthKey, nextMonthKey, previousPeriod, QUEST_GRACE_MS } from "./questPeriods.ts";
import { LEGACY_CHARM_CAP, LEGACY_THANKS_COIN, applyLegacy, claimQuest, luckyLive, questCtx, questStatus } from "./questServer.ts";
import type { GradePay, LocalSnap } from "./wallet.ts";
import { applyClientOp, awardGrade, syncPlayer } from "./walletApply.ts";
import { canonicalWallet } from "./walletSql.ts";
import { thanksClock } from "./thanksGift.ts";

// 0.1.39: keep the thank-you gift (its free house and coin) out of these quest wallets; thanksGift.test.ts covers it.
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

async function db() {
  const pg = new PGlite();
  await pg.exec(`create table if not exists player_links (alias_id text primary key, primary_id text not null, how text not null, linked_at timestamptz not null default now())`);
  await pg.exec(mig("0016_player_wallet.sql"));
  await pg.exec(mig("0003_plate_events.sql"));
  await pg.exec(mig("0014_walk_distance.sql"));
  return sqlOf(pg);
}


/** Each player draws their own set, so a test picks an account name whose set holds the quests it exercises. */
function who(prefix: string, kind: "day" | "week" | "month", keys: string[], ids: string[], house = false): string {
  for (let i = 0; i < 5000; i++) {
    const name = `${prefix}${i}`;
    if (keys.every((k) => ids.every((id) => questSet(kind, name, k, { house }).some((d) => d.id === id)))) return name;
  }
  throw new Error(`no ${prefix} account draws ${ids.join(",")}`);
}
const NOW = Date.now();
const WEEK = currentPeriod("week", NOW).key;
const PREV_WEEK = previousPeriod("week", NOW).key;
const MONTH = currentPeriod("month", NOW).key;
const ann = who("ann", "week", [WEEK], ["w-lamps"]);
const bo = who("bo", "week", [WEEK, PREV_WEEK], ["w-lamps"]);
const cy = who("cy", "week", [PREV_WEEK], ["w-lamps"]);
const di = who("di", "week", [WEEK], ["w-streak"]);
const ed = who("ed", "month", [MONTH], ["m-tour", "m-night", "m-shelf", "m-streak"]);
const fa = who("fa", "month", [MONTH], ["m-tour", "m-night", "m-shelf", "m-streak"]);

const snap = (over: Partial<LocalSnap> = {}): LocalSnap => ({ coins: 0, keys: {}, cities: { ...freshUnlocks(), start: "austin", unlocked: ["austin"], freePick: false }, ...over });

function pay(over: Partial<GradePay> = {}): Omit<GradePay, "prior"> & { prevNonce: string } {
  return {
    correct: true,
    elapsedMs: 5000,
    mult: 1,
    city: "austin",
    diff: 2,
    clearTier: "green",
    poiTier: "green",
    poiId: "zilker",
    lat: 30.27,
    lng: -97.77,
    series: null,
    step: 0,
    steps: 1,
    streak: 0,
    loot: 1,
    lucky: false,
    cloth: null,
    charmDay: "",
    charmTopics: [],
    topic: "science",
    dealtAt: Date.now(),
    luckyHit: false,
    perfectBlue: false,
    prevNonce: "",
    ...over,
  };
}

/** A ledger grade row at a chosen time (what awardGrade writes, minus the pay). */
async function gradeAt(sql: Sql, user: string, key: string, at: number, detail: Record<string, unknown>) {
  await sql`insert into wallet_ledger (user_id, op_key, detail, created_at) values (${user}, ${"grade:" + key}, ${JSON.stringify(detail)}, ${new Date(at).toISOString()})`;
}

test("a weekly quest counts only lamps that spent a match, pays once, and sparks never count", async () => {
  const sql = await db();
  await syncPlayer(sql, ann, snap(), "annphone1");
  for (let i = 0; i < 24; i++) await awardGrade(sql, ann, `g${i}`, pay());
  // Sparks: a right answer with no match held (clearTier null). They pay on the device, never on a quest.
  for (let i = 0; i < 6; i++) await awardGrade(sql, ann, `s${i}`, pay({ clearTier: null, poiId: `spark-${i}` }));
  const week = currentPeriod("week", Date.now()).key;
  const early = await claimQuest(sql, ann, week, "w-lamps");
  assert.equal(early.ok, false);
  assert.equal(early.reason, "unproven");
  const st = await questStatus(sql, ann);
  assert.equal(st.periods.find((p) => p.kind === "week")!.rows.find((r) => r.id === "w-lamps")!.have, 24);
  await awardGrade(sql, ann, "g24", pay());
  const before = (await canonicalWallet(sql, ann)).wallet;
  const paid = await claimQuest(sql, ann, week, "w-lamps");
  assert.equal(paid.ok, true);
  assert.equal(paid.replay, false);
  assert.equal(paid.wallet.coins - before.coins, 2_000);
  // The green goes through the pocket rule (a full pocket turns it into credit).
  assert.deepEqual(paid.award?.keys, { green: 1 });
  const greens = (w: typeof before) => w.keys.green + (w.meta.credit.green ?? 0);
  assert.equal(greens(paid.wallet) - greens(before), 1);
  const again = await claimQuest(sql, ann, week, "w-lamps");
  assert.equal(again.replay, true);
  assert.equal(again.wallet.coins, paid.wallet.coins);
  // Through the client op too: same key, so still once.
  const viaOp = await applyClientOp(sql, ann, { kind: "quest", period: week, id: "w-lamps" });
  assert.equal(viaOp.replay, true);
  assert.equal(viaOp.view.coins, paid.wallet.coins);
  const status = await questStatus(sql, ann);
  assert.equal(status.periods.find((p) => p.kind === "week")!.rows.find((r) => r.id === "w-lamps")!.paid, true);
  // A quest from the other period kind, an unknown id, or a malformed period is refused.
  assert.equal((await claimQuest(sql, ann, week, "m-tour")).reason, "unknown");
  assert.equal((await claimQuest(sql, ann, week, "nope")).reason, "unknown");
  assert.equal((await claimQuest(sql, ann, "W2026-10-20", "w-lamps")).reason, "unknown");
});

test("rows before Monday 00:00 CT don't count this week; last week can be collected for 24 h, then it closes", async () => {
  const sql = await db();
  await syncPlayer(sql, bo, snap(), "bophone01");
  const { id } = await canonicalWallet(sql, bo);
  const now = Date.now();
  const cur = currentPeriod("week", now);
  const prev = previousPeriod("week", now);
  for (let i = 0; i < 25; i++) await gradeAt(sql, id, `old${i}`, cur.start - 60_000 - i * 1000, { g: "good", ql: 1, t: "green", c: "austin" });
  const st = await questStatus(sql, bo, now);
  assert.equal(st.periods.find((p) => p.key === cur.key)!.rows.find((r) => r.id === "w-lamps")!.have, 0);
  assert.equal((await claimQuest(sql, bo, cur.key, "w-lamps", now)).reason, "unproven");
  // Inside the grace window after the reset, last week still pays.
  const inGrace = cur.start + QUEST_GRACE_MS - 1;
  const shown = await questStatus(sql, bo, inGrace);
  assert.ok(shown.periods.some((p) => p.key === prev.key && p.grace));
  const late = await claimQuest(sql, bo, prev.key, "w-lamps", inGrace);
  assert.equal(late.ok, true);
  // A fresh account past the grace window: closed.
  await syncPlayer(sql, cy, snap(), "cyphone01");
  const cyId = (await canonicalWallet(sql, cy)).id;
  for (let i = 0; i < 25; i++) await gradeAt(sql, cyId, `old${i}`, cur.start - 60_000 - i * 1000, { g: "good", ql: 1, t: "green" });
  assert.equal((await claimQuest(sql, cy, prev.key, "w-lamps", cur.start + QUEST_GRACE_MS)).reason, "closed");
  // And a future period is never open.
  assert.equal((await claimQuest(sql, cy, currentPeriod("week", cur.end + 1).key, "w-lamps", now)).reason, "closed");
});

test("a streak breaks on a miss; the weekly bonus needs all five", async () => {
  const sql = await db();
  await syncPlayer(sql, di, snap(), "diphone01");
  const week = currentPeriod("week", Date.now()).key;
  for (let i = 0; i < 10; i++) await awardGrade(sql, di, `a${i}`, pay());
  await awardGrade(sql, di, "miss", pay({ correct: false }));
  for (let i = 0; i < 14; i++) await awardGrade(sql, di, `b${i}`, pay());
  assert.equal((await claimQuest(sql, di, week, "w-streak")).reason, "unproven");
  assert.equal((await claimQuest(sql, di, week, "w-bonus")).reason, "unproven");
  await awardGrade(sql, di, "b14", pay());
  assert.equal((await claimQuest(sql, di, week, "w-streak")).ok, true);
});

test("guests never collect: an account that never synced is refused", async () => {
  const sql = await db();
  const r = await applyClientOp(sql, "guest-ish", { kind: "quest", period: currentPeriod("week", Date.now()).key, id: "w-lamps" });
  assert.equal(r.ok, false);
  assert.equal(r.reason, "sync");
  assert.equal(r.view.coins, 0);
});

test("all four monthly quests turn Lucky on for next month, or pay 25,000 coin to a Lucky owner", async () => {
  const sql = await db();
  const now = Date.now();
  const month = currentPeriod("month", now);
  const fill = async (user: string) => {
    await syncPlayer(sql, user, snap(), `${user}ph`);
    const { id } = await canonicalWallet(sql, user);
    const cities = ["austin", "nyc", "la", "boston"];
    const cats = ["science", "history", "books", "music"];
    for (let i = 0; i < 64; i++) await gradeAt(sql, id, `m${i}`, Math.max(month.start, now - 3_600_000) + i, { g: "good", ql: 1, t: "blue", c: cities[i % 4], tp: cats[i % 4], ...(i < 12 ? { mk: 1 } : {}) });
    return id;
  };
  await fill(ed);
  for (const q of ["m-tour", "m-night", "m-shelf", "m-streak"]) assert.equal((await claimQuest(sql, ed, month.key, q, now)).ok, true, q);
  const bonus = await claimQuest(sql, ed, month.key, "m-bonus", now);
  assert.equal(bonus.ok, true);
  const next = nextMonthKey(month.key)!;
  assert.equal(bonus.quest?.lucky, next);
  assert.equal(bonus.wallet.meta.luckyMonth, next);
  assert.equal(luckyLive(bonus.wallet.meta, now), false);
  assert.equal(luckyLive(bonus.wallet.meta, currentPeriod("month", month.end + 1).start), true);
  assert.equal(monthKey(month.end + 1), next);
  // Lucky owner: coin instead.
  const fid = await fill(fa);
  const held = (await canonicalWallet(sql, fa)).wallet;
  await sql.query(`update player_wallets set meta = $2::jsonb where user_id = $1`, [fid, JSON.stringify({ ...held.meta, lucky: true })]);
  for (const q of ["m-tour", "m-night", "m-shelf", "m-streak"]) await claimQuest(sql, fa, month.key, q, now);
  const before = (await canonicalWallet(sql, fa)).wallet.coins;
  const owner = await claimQuest(sql, fa, month.key, "m-bonus", now);
  assert.equal(owner.wallet.coins - before, LUCKY_OWNED_COIN);
  assert.equal(owner.wallet.meta.luckyMonth, "");
  // Lucky turned on for NEXT month is not live yet, so a lucky hit this month pays nothing extra.
  const live = await awardGrade(sql, ed, "lk1", pay({ lucky: true, luckyHit: true }));
  const plain = await awardGrade(sql, ed, "lk2", pay({ lucky: true, luckyHit: false }));
  assert.equal(Object.values(live.award?.keys ?? {}).reduce((a, b) => a + (b ?? 0), 0), Object.values(plain.award?.keys ?? {}).reduce((a, b) => a + (b ?? 0), 0));
});

test("legacy: verified done-but-unclaimed milestones pay once, unfinished progress pays 1,000 once", async () => {
  const sql = await db();
  await syncPlayer(sql, "gi", snap(), "giphone01");
  const { id } = await canonicalWallet(sql, "gi");
  const t0 = Date.now() - 86_400_000;
  // 100 perfect answers in a row, one of them on a violet lamp (tx-capitol), one on a red (ut-tower).
  for (let i = 0; i < 100; i++) await gradeAt(sql, id, `p${i}`, t0 + i, { g: "perfect", pi: i === 0 ? "tx-capitol" : i === 1 ? "ut-tower" : "zilker" });
  const input = { claimed: ["walk" as const], circuits: ["austin" as const, "nyc" as const], unfinished: true, charms: [] };
  const first = await applyLegacy(sql, "gi", input, { meters: 20_000, visited: new Set() });
  const kinds = first.grants.map((g) => g.kind + ("id" in g ? `:${g.id}` : "")).sort();
  // walk was already claimed on the device: no second Road dust; the red book isn't proven; nyc has no red.
  assert.deepEqual(kinds, ["cloth:scarf-austin", "pattern:violet", "schematic:unbroken", "thanks", "title:hundred"]);
  assert.equal(first.wallet.meta.title, "Clean hundred");
  assert.equal(first.wallet.meta.schematic, 1);
  assert.equal(first.wallet.meta.patterns, 1);
  assert.ok(first.wallet.meta.cloths.includes("scarf-austin"));
  const coins = first.wallet.coins;
  const second = await applyLegacy(sql, "gi", { ...input, claimed: [] }, { meters: 20_000, visited: new Set() });
  // Only the walk (now unclaimed in this call, proven by 20 km) is new; nothing pays twice.
  assert.deepEqual(second.grants.map((g) => g.kind), ["cloth"]);
  assert.equal(second.wallet.coins, coins);
  assert.equal(first.wallet.coins >= LEGACY_THANKS_COIN, true);
  // Unproven milestones pay nothing.
  await syncPlayer(sql, "ha", snap(), "haphone01");
  const none = await applyLegacy(sql, "ha", { claimed: [], circuits: ["austin"], unfinished: false, charms: [] }, { meters: 500, visited: new Set() });
  assert.deepEqual(none.grants, []);
});

test("legacy: retired charms refund their stock and schematic, at most 3 per account; a Lucky bit stays Lucky", async () => {
  const sql = await db();
  await syncPlayer(sql, "jo", snap(), "jophone01");
  const r = await applyLegacy(sql, "jo", { claimed: [], circuits: [], unfinished: false, charms: ["scholar", "sprinter", "lantern", "lucky", "bogus"] }, { meters: 0, visited: new Set() });
  assert.deepEqual(r.grants.map((g) => (g.kind === "refund" ? g.charm : g.kind)).sort(), ["lantern", "lucky", "scholar", "sprinter"]);
  assert.equal(r.wallet.meta.lucky, true);
  assert.equal(r.wallet.meta.brass, 8 + 6 + 10);
  assert.equal(r.wallet.meta.schematic, 3);
  const again = await applyLegacy(sql, "jo", { claimed: [], circuits: [], unfinished: false, charms: ["scholar", "lantern"] }, { meters: 0, visited: new Set() });
  assert.deepEqual(again.grants, []);
  // The cap counts every refund row on the account, so a second device can't stack more.
  await syncPlayer(sql, "ki", snap(), "kiphone01");
  const ki = (await canonicalWallet(sql, "ki")).id;
  await sql`insert into wallet_ledger (user_id, op_key) values (${ki}, ${"legacy:charm:x1"}), (${ki}, ${"legacy:charm:x2"})`;
  const capped = await applyLegacy(sql, "ki", { claimed: [], circuits: [], unfinished: false, charms: ["scholar", "sprinter", "lantern"] }, { meters: 0, visited: new Set() });
  assert.equal(capped.grants.length, LEGACY_CHARM_CAP - 2);
  // Through the client op (signed in): the same one-time grants, nothing new.
  const op = await applyClientOp(sql, "jo", { kind: "legacy", claimed: [], circuits: [], unfinished: true, charms: ["scholar"] });
  assert.deepEqual(op.legacy?.map((g) => g.kind), ["thanks"]);
});

test("claims are limited to the player's own set for the period", async () => {
  const sql = await db();
  await syncPlayer(sql, ann, snap(), "annphone2");
  const mine = questSet("week", ann, WEEK, { house: false }).map((d) => d.id);
  const other = ["w-lamps", "w-ladder", "w-streak", "w-out", "w-cache", "w-roam", "w-street", "w-amber"].find((id) => !mine.includes(id))!;
  assert.equal((await claimQuest(sql, ann, WEEK, other)).reason, "not-yours");
  const st = await questStatus(sql, ann);
  const rows = st.periods.find((p) => p.key === WEEK)!.rows.map((r) => r.id);
  assert.deepEqual(rows, [...mine, "w-bonus"]);
  assert.ok(st.periods.some((p) => p.kind === "day" && p.key === dayKey(Date.now())));
});

test("an account draws house quests only once it owns a house", async () => {
  const sql = await db();
  await syncPlayer(sql, "hq1", snap(), "hq1phone");
  const { id } = await canonicalWallet(sql, "hq1");
  assert.deepEqual(await questCtx(sql, id), { house: false });
  await sql`insert into wallet_ledger (user_id, op_key) values (${id}, ${"house:austin:cottage"})`;
  assert.deepEqual(await questCtx(sql, id), { house: true });
});

type Row = { key: string; at: number; detail?: Record<string, unknown> };
const H = 3_600_000;
const lampRow = (i: number, at: number, over: Record<string, unknown> = {}): Row => ({ key: `grade:q${i}`, at, detail: { g: "good", ql: 1, t: "white", c: "austin", tp: "science", ...over } });
const sparkOf = (r: Row): Row => ({ ...r, key: r.key.replace("grade:q", "grade:s"), detail: { ...r.detail, ql: undefined, sp: 1 } });

/** For each new quest: rows that prove it; the same rows as sparks never prove it. Only `grade:` rows have a spark twin. */
const CASES: Array<{ id: string; kind: "day" | "week" | "month"; house?: boolean; rows: (end: number) => Row[] }> = [
  { id: "d-cache", kind: "day", rows: (e) => [{ key: `cache:${chicagoDay(e - H)}`, at: e - H }] },
  { id: "d-street", kind: "day", rows: (e) => [1, 2, 3].map((i) => ({ key: `street:sk:austin:${chicagoDay(e - H)}:${i}`, at: e - H + i })) },
  { id: "d-house", kind: "day", house: true, rows: (e) => [{ key: `hook:austin:${chicagoDay(e - H)}`, at: e - H }] },
  { id: "d-roam", kind: "day", rows: (e) => ["east", "zilker", "downtown"].map((d, i) => lampRow(i, e - H + i, { d })) },
  { id: "d-amber", kind: "day", rows: (e) => [lampRow(0, e - H, { t: "amber" })] },
  { id: "w-cache", kind: "week", rows: (e) => [1, 2, 3, 4].map((i) => ({ key: `cache:${chicagoDay(e - i * 24 * H)}`, at: e - i * 24 * H })) },
  { id: "w-house", kind: "week", house: true, rows: (e) => [1, 2, 3].map((i) => ({ key: `hook:austin:${chicagoDay(e - i * 24 * H)}`, at: e - i * 24 * H })) },
  { id: "w-roam", kind: "week", rows: (e) => Array.from({ length: 10 }, (_, i) => lampRow(i, e - H + i, { d: `d${i}` })) },
  { id: "w-street", kind: "week", rows: (e) => Array.from({ length: 12 }, (_, i) => ({ key: `street:sk:austin:${chicagoDay(e - H)}:${i}`, at: e - H + i })) },
  { id: "w-amber", kind: "week", rows: (e) => Array.from({ length: 5 }, (_, i) => lampRow(i, e - H + i, { t: "amber" })) },
  { id: "m-hop", kind: "month", rows: (e) => ["austin", "nyc", "la"].map((c, i) => lampRow(i, e - H + i, { c, mk: 1 })) },
  { id: "m-streak", kind: "month", rows: (e) => Array.from({ length: 25 }, (_, i) => lampRow(i, e - H + i)) },
  { id: "m-red", kind: "month", rows: (e) => Array.from({ length: 10 }, (_, i) => lampRow(i, e - H + i, { t: "red" })) },
  { id: "m-days", kind: "month", rows: (e) => Array.from({ length: 12 }, (_, i) => lampRow(i, e - H - i * 24 * H)) },
];

for (const c of CASES)
  test(`${c.id}: counted on the server from its own rows, paid once, sparks never count`, async () => {
    const sql = await db();
    // Claim late in the period so every row sits inside it.
    const p = currentPeriod(c.kind, NOW);
    const now = p.end - 30 * 60_000;
    const u = who(`${c.id}-`, c.kind, [p.key], [c.id], c.house ?? false);
    await syncPlayer(sql, u, snap(), `${u}-ph`);
    const { id } = await canonicalWallet(sql, u);
    if (c.house) await sql`insert into wallet_ledger (user_id, op_key, created_at) values (${id}, ${"house:austin:cottage"}, ${new Date(p.start - 86_400_000 * 40).toISOString()})`;
    const rows = c.rows(p.end);
    const ins = async (r: Row) =>
      sql`insert into wallet_ledger (user_id, op_key, detail, created_at) values (${id}, ${r.key}, ${JSON.stringify(r.detail ?? {})}, ${new Date(r.at).toISOString()})`;
    const sparks = rows.filter((r) => r.key.startsWith("grade:")).map(sparkOf);
    for (const r of sparks) await ins(r);
    // Everything but the last proving row: still short.
    for (const r of rows.slice(0, -1)) await ins(r);
    assert.equal((await claimQuest(sql, u, p.key, c.id, now)).reason, "unproven");
    await ins(rows.at(-1)!);
    const before = (await canonicalWallet(sql, u)).wallet.coins;
    const paid = await claimQuest(sql, u, p.key, c.id, now);
    assert.equal(paid.ok, true, paid.reason);
    assert.equal(paid.wallet.coins - before, questSet(c.kind, u, p.key, { house: c.house ?? false }).find((d) => d.id === c.id)!.reward.coins);
    const again = await claimQuest(sql, u, p.key, c.id, now);
    assert.equal(again.replay, true);
    assert.equal(again.wallet.coins, paid.wallet.coins);
  });

test("the day runs Chicago midnight to midnight: a lamp at 11:59 PM CT is yesterday's", async () => {
  const sql = await db();
  const p = currentPeriod("day", NOW);
  const u = who("dd", "day", [p.key], ["d-amber"]);
  await syncPlayer(sql, u, snap(), `${u}-ph`);
  const { id } = await canonicalWallet(sql, u);
  await gradeAt(sql, id, "late", p.start - 60_000, { g: "good", ql: 1, t: "amber", c: "austin" });
  assert.equal((await claimQuest(sql, u, p.key, "d-amber", p.start + H)).reason, "unproven");
  await gradeAt(sql, id, "early", p.start + 60_000, { g: "good", ql: 1, t: "amber", c: "austin" });
  assert.equal((await claimQuest(sql, u, p.key, "d-amber", p.start + H)).ok, true);
});

test("0.1.27: next week's Challenge counts perfect answers on the server; sparks and plain right answers don't", async () => {
  const sql = await db();
  const next = currentPeriod("week", currentPeriod("week", NOW).end + 1);
  const key = next.key >= "W2026-10-26" ? next.key : "W2026-10-26";
  const p = next.key === key ? next : currentPeriod("week", Date.UTC(2026, 9, 27, 12));
  const u = who("wcp", "week", [p.key], ["wc-perfect"]);
  await syncPlayer(sql, u, snap(), `${u}-ph`);
  const { id } = await canonicalWallet(sql, u);
  const at = p.start + 3_600_000;
  for (let i = 0; i < 30; i++) await gradeAt(sql, id, `sp${i}`, at + i, { g: "perfect", sp: 1, t: "white" });
  for (let i = 0; i < 30; i++) await gradeAt(sql, id, `ok${i}`, at + 100 + i, { g: "good", ql: 1, t: "white" });
  for (let i = 0; i < 29; i++) await gradeAt(sql, id, `pf${i}`, at + 200 + i, { g: "perfect", ql: 1, t: "white" });
  const now = at + 7_200_000;
  assert.equal((await claimQuest(sql, u, p.key, "wc-perfect", now)).reason, "unproven");
  await gradeAt(sql, id, "pf29", at + 300, { g: "perfect", ql: 1, t: "white" });
  const before = (await canonicalWallet(sql, u)).wallet.coins;
  const paid = await claimQuest(sql, u, p.key, "wc-perfect", now);
  assert.equal(paid.ok, true, paid.reason);
  assert.equal(paid.wallet.coins - before, 5_000);
  assert.equal((await claimQuest(sql, u, p.key, "wc-perfect", now)).replay, true);
  // The old id is not in a v2 set.
  assert.equal((await claimQuest(sql, u, p.key, "w-lamps", now)).reason, "not-yours");
});
