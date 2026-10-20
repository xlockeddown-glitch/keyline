import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { rummageHit, scoutOf, shellBackHit, strikeOption } from "./scoutPerks.ts";
import type { Sql } from "../lib/db.ts";
import { loadRecent, noteDealt } from "./triviaRecent.ts";
import { paintsForEvent, shadowPaints } from "./shadowRoll.ts";
import type { PaintId } from "./ingredients.ts";
import type { CityId, Poi, PoiKind, Tier, TriviaCat, TriviaDiff, TriviaQ } from "./types";
import type { DealInput, DealResult, GradeInput, GradeResult, Grade, ServerAward, ServerWallet } from "./triviaSchema";
import { RUN_ID, STACK_ID } from "./data.ts";
import { clampCloth, clampLoot, clampStreak, LUCKY_MATCH_CHANCE, PERFECT_BLUE_CHANCE } from "./wallet.ts";
import { awardGrade, noteBlitzCard, spendDealt } from "./walletApply.ts";
export { DealIn, GradeIn, SEEN_MAX } from "./triviaSchema.ts";
export type { DealInput, DealResult, GradeInput, GradeResult, Grade, PublicCard } from "./triviaSchema";

/**
 * 0.0.53 server-side trivia — SERVER-ONLY (node:crypto, the bank). The browser asks for one card at a time
 * (deal) and sends back the chosen text (grade); the correct answer, its index and the fact never leave the
 * server until the card is graded.
 *
 * - **Deal**: the server picks the card from its own bank (same picker as before: anti-repeat memory from the
 *   save's seen ids, tier/rarity ladder, place topics and door quizzes, the Run/Stack difficulty steps),
 *   shuffles the four choices and returns them with a *public* card id and a signed pending-card token.
 * - **Public id**: `c` + sha256(prompt + sorted choices). The old id is fnv1a(prompt + answer), which a client
 *   holding the four choices could brute-force back to the answer, so the raw id stays on the server. Sorting
 *   the choices means the public id says nothing about which one is right; it is stable across deploys (no
 *   secret), so the save's anti-repeat memory survives restarts.
 * - **Token**: base64url JSON + HMAC-SHA256 (stateless, no migration). It carries the public id, who it was
 *   dealt to (signed-in user or anonymous guest), the server deal time, the answer window, the city, the tier a
 *   right answer clears on the rolls, and a random nonce. Nothing in it reveals the answer.
 * - **Grade**: the server checks the token, looks the card up, compares the chosen text, times the answer on its
 *   own clock (a client can't claim a sub-3 s "perfect" the server didn't see — see `effectiveMs`), grades it
 *   (perfect/great/good and the base coin multiplier) and, for a signed-in walker, writes the result itself:
 *   the plate event (standings/retune stats) and, on a right answer, the +1 clear on the rolls. The client no
 *   longer reports clears or plate events. A token grades once (DB row per nonce for signed-in walkers, an
 *   in-memory ring for guests); a replay gets the first result back and credits nothing.
 */

export const TOKEN_VERSION = 1;
/** Network allowance subtracted from the server-timed answer. A client may claim faster than the server saw by at
 *  most this much, so "perfect" (≤ 3.0 s) needs the server to see the answer within 4.2 s of the deal. */
export const RTT_GRACE_MS = 1200;
/** Past the wick plus this, the card is graded as timed out whatever was chosen. */
export const LATE_GRACE_MS = 2500;
export const PERFECT_MS = 3000;
export const GREAT_MS = 10000;
/** Answer window bounds (25 s wick + scholar 3 s + press pass 5 s + perks; sparks are 20 s). */
export const WINDOW_MIN_MS = 15000;
export const WINDOW_MAX_MS = 40000;

export type Viewer = { userId: string | null };

type TokenBody = {
  v: number;
  /** Public card id. */
  c: string;
  /** Subject: "u:<user id>" or "g" (anonymous guest). */
  s: string;
  /** Server deal time (ms). */
  t: number;
  /** Answer window (ms). */
  w: number;
  city: CityId;
  /** Rarity and difficulty of the dealt card, for the plate event. */
  r: Tier;
  d: TriviaDiff;
  /** Tier a right answer clears on the rolls (null for sparks). */
  k: Tier | null;
  /** 1 when this card can drop paint (a lamp, or the last card of a Run/Stack). */
  pr?: 0 | 1;
  sv: string;
  n: string;
  /**
   * Pay context sealed at deal (0.0.78). The grade recomputes coins from this plus its own clock and rolls.
   * Absent on a token dealt before the wallet moved server-side: that grade pays with the defaults.
   */
  x?: {
    sk: number;
    lt: number;
    lk: 0 | 1;
    cl: string | null;
    cd: string;
    ct: string[];
    la: number;
    ln: number;
    pv: string;
    sy: 0 | 1 | 2;
    ss: number;
    sn: number;
    pt: Tier;
    pi: string;
    cat: string;
    /** 0.0.96: worn coat at deal time. */
    sc?: string;
  };
};

export type TriviaDeps = {
  now: () => number;
  /** HMAC key for pending-card tokens. */
  secret: string;
  /** Server picker (trivia.ts pickTrivia). */
  pick: (city: CityId, cat: TriviaCat, poi: Poi, tier: Tier, avoid: readonly string[], want?: TriviaDiff) => TriviaQ;
  /** Card by public id or raw id. */
  card: (id: string) => TriviaQ | null;
  /** A named lamp of this city, or null. */
  namedPoi: (city: CityId, poiId: string) => Poi | null;
  /** The Run / The Stack, by id. */
  series: (poiId: string) => { poi: Poi; cost: Tier; diffs: readonly TriviaDiff[] } | null;
  /** Signed-in writes; absent (or throwing) leaves the grade intact and credits nothing. */
  sql?: () => Promise<Sql>;
  rand?: () => number;
  /** Paint rolls only. Deal shuffle keeps using `rand`, so a test can force a can without reshuffling. */
  roll?: () => number;
  nonce?: () => string;
};

const b64u = (buf: Buffer) => buf.toString("base64url");

/** Public card id: says which card, never which choice is right (choices are sorted before hashing). */
export function publicCardId(card: { q: string; choices: readonly string[] }): string {
  const h = createHash("sha256").update(`kl53\0${card.q}\0${[...card.choices].sort().join("\0")}`).digest();
  return `c${b64u(h).slice(0, 14)}`;
}

function coord(n: number | undefined, lim: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.min(lim, Math.max(-lim, n));
}

function sign(secret: string, body: string) {
  return b64u(createHmac("sha256", secret).update(`kl-trivia\0${body}`).digest());
}

export function sealToken(secret: string, t: TokenBody): string {
  const body = b64u(Buffer.from(JSON.stringify(t), "utf8"));
  return `${body}.${sign(secret, body)}`;
}

export function openToken(secret: string, token: string): TokenBody | null {
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const mac = Buffer.from(token.slice(dot + 1));
  const want = Buffer.from(sign(secret, body));
  if (mac.length !== want.length || !timingSafeEqual(mac, want)) return null;
  try {
    const t = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenBody;
    if (t.v !== TOKEN_VERSION || typeof t.c !== "string" || typeof t.t !== "number" || typeof t.n !== "string") return null;
    return t;
  } catch {
    return null;
  }
}

export function shuffle<T>(xs: readonly T[], rand: () => number = Math.random): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Answer time the grade uses: the client's stopwatch, but never more than RTT_GRACE_MS faster than the server saw. */
export function effectiveMs(clientMs: number, serverMs: number): number {
  return Math.max(0, Math.round(Math.max(clientMs, serverMs - RTT_GRACE_MS)));
}

export function gradeOf(ms: number): { grade: Grade; mult: number } {
  if (ms <= PERFECT_MS) return { grade: "perfect", mult: 1 };
  if (ms <= GREAT_MS) return { grade: "great", mult: 0.7 };
  return { grade: "good", mult: 0.4 };
}

export function clampWindow(ms: number) {
  return Math.min(WINDOW_MAX_MS, Math.max(WINDOW_MIN_MS, Math.round(ms)));
}

/** The save's seen ids (public or raw, oldest first) as the picker's history: ids, then their prompts. */
export function avoidList(deps: Pick<TriviaDeps, "card">, seen: readonly string[]): string[] {
  const ids: string[] = [];
  const qs: string[] = [];
  for (const id of seen) {
    const c = deps.card(id);
    if (!c) {
      ids.push(id);
      continue;
    }
    ids.push(c.id);
    qs.push(c.q);
  }
  return [...ids, ...qs];
}

/**
 * 0.0.58: the deal the API serves. A signed-in walker's anti-repeat memory is kept on the server (triviaRecent.ts):
 * the newest few hundred cards dealt to them, on any device, merged ahead of the save's own seen list; the dealt
 * card is noted at once, so a walk-away, a lost answer or a second tab can't bring it straight back. Guests have
 * only the save's list (sent by the client). A database hiccup falls back to the client's list, never fails the deal.
 */
export async function dealFor(deps: TriviaDeps, viewer: Viewer, input: DealInput): Promise<DealResult> {
  let recent: string[] = [];
  let sql: Sql | null = null;
  if (viewer.userId && deps.sql) {
    try {
      sql = await deps.sql();
      recent = await loadRecent(sql, viewer.userId);
    } catch (e) {
      sql = null;
      console.warn("[trivia] recent list unavailable", e instanceof Error ? e.message : e);
    }
  }
  const r = deal(deps, viewer, input, recent);
  if (!r.ok) return r;
  // A migrated pocket pays its match here, once per token. Guests and a wallet not yet synced still pay on the device.
  const spendTier = !input.spark && (input.step ?? 0) === 0 && !input.poiId.startsWith("blitz-");
  let wallet: ServerWallet | undefined;
  if (r.ok && sql && viewer.userId && spendTier) {
    try {
      const body = openToken(deps.secret, r.token);
      if (body?.k) {
        const spent = await spendDealt(sql, viewer.userId, body.n, body.k);
        if (!spent.skipped && !spent.ok) return { ok: false, reason: "no-match" };
        if (!spent.skipped && spent.ok) wallet = spent.view;
      }
    } catch (e) {
      console.warn("[trivia] match spend failed", e instanceof Error ? e.message : e);
    }
  }
  if (sql && viewer.userId) {
    try {
      const raw = deps.card(r.card.id)?.id ?? r.card.id;
      await noteDealt(sql, viewer.userId, raw, new Date(deps.now()));
    } catch (e) {
      console.warn("[trivia] recent note failed", e instanceof Error ? e.message : e);
    }
  }
  return wallet ? { ...r, wallet } : r;
}

/** Pick, seal and shuffle one card. `recent` is the server's memory for this walker (oldest first), merged before the save's list. */
export function deal(deps: TriviaDeps, viewer: Viewer, input: DealInput, recent: readonly string[] = []): DealResult {
  const series = deps.series(input.poiId);
  let poi: Poi | null;
  let clearTier: Tier | null;
  let want: TriviaDiff | undefined;
  if (series) {
    poi = series.poi;
    clearTier = series.cost;
    want = series.diffs[Math.min(input.step ?? 0, series.diffs.length - 1)];
  } else {
    poi = deps.namedPoi(input.city, input.poiId);
    if (!poi && input.blank) {
      poi = { id: input.poiId, name: input.blank.name, kind: input.blank.kind as PoiKind, tier: input.blank.tier, lat: 0, lng: 0, lore: "" };
    }
    if (!poi) return { ok: false, reason: "unknown-lamp" };
    clearTier = poi.tier;
  }
  if (input.spark) clearTier = null;
  const paintRoll = clearTier != null && (!series || (input.step ?? 0) >= series.diffs.length - 1);
  const plate = deps.pick(input.city, input.cat, poi, poi.tier, avoidList(deps, [...recent, ...input.seen]), want);
  const pub = publicCardId(plate);
  const windowMs = clampWindow(input.windowMs);
  const scout = scoutOf(input.pay?.scout);
  const named = !series ? deps.namedPoi(input.city, input.poiId) : null;
  const pay = input.pay;
  let pv = "";
  if (pay?.prevToken) {
    const prev = openToken(deps.secret, pay.prevToken);
    const subject = viewer.userId ? `u:${viewer.userId}` : "g";
    if (prev && prev.s === subject) pv = prev.n;
  }
  const token = sealToken(deps.secret, {
    v: TOKEN_VERSION,
    c: pub,
    s: viewer.userId ? `u:${viewer.userId}` : "g",
    t: deps.now(),
    w: windowMs,
    city: input.city,
    r: plate.rarity,
    d: plate.diff ?? 2,
    k: clearTier,
    pr: paintRoll ? 1 : 0,
    sv: input.saveId,
    n: deps.nonce?.() ?? b64u(randomBytes(12)),
    x: {
      sk: clampStreak(pay?.streak ?? 0),
      lt: clampLoot(pay?.loot ?? 1),
      lk: pay?.lucky ? 1 : 0,
      cl: clampCloth(pay?.cloth, input.city),
      cd: (pay?.charmDay ?? "").slice(0, 10),
      ct: (pay?.charmTopics ?? []).slice(0, 3),
      la: named ? named.lat : coord(pay?.lat, 90),
      ln: named ? named.lng : coord(pay?.lng, 180),
      pv,
      sy: !series ? 0 : input.poiId === STACK_ID ? 2 : input.poiId === RUN_ID ? 1 : 1,
      ss: Math.min(5, Math.max(0, input.step ?? 0)),
      sn: series?.diffs.length ?? 1,
      pt: poi.tier,
      pi: poi.id,
      cat: input.cat,
      ...(scout ? { sc: scout } : {}),
    },
  });
  // 0.0.96 Fox: the server strikes one wrong option on red/violet lamps (never the answer).
  const struck = series || input.spark ? null : strikeOption(scout, plate.rarity, plate.choices, plate.answer, (deps.rand ?? Math.random)());
  return {
    ok: true,
    token,
    windowMs,
    card: { id: pub, q: plate.q, choices: shuffle(plate.choices, deps.rand), diff: plate.diff ?? 2, rarity: plate.rarity, ...(struck ? { struck } : {}) },
  };
}

/** Guests (and a DB hiccup) fall back to this per-instance ring so a token can't simply be graded twice. */
const RING_MAX = 5000;
const ring = new Map<string, { correct: boolean; elapsedMs: number; timedOut: boolean }>();
function ringPut(nonce: string, v: { correct: boolean; elapsedMs: number; timedOut: boolean }) {
  ring.set(nonce, v);
  if (ring.size > RING_MAX) ring.delete(ring.keys().next().value!);
}
/** Test hook. */
export function resetGradeRing() {
  ring.clear();
}

async function publicName(sql: Sql, userId: string): Promise<string> {
  const { standingName } = await import("./standingName.ts");
  const rows = await sql<{ name: string | null }>`select name from "user" where id = ${userId} limit 1`;
  return standingName(rows[0]?.name);
}

export async function grade(deps: TriviaDeps, viewer: Viewer, input: GradeInput): Promise<GradeResult> {
  const t = openToken(deps.secret, input.token);
  if (!t) return { ok: false, reason: "bad-token" };
  if (t.s !== "g" && t.s !== `u:${viewer.userId ?? ""}`) return { ok: false, reason: "not-yours" };
  const card = deps.card(t.c);
  if (!card) return { ok: false, reason: "unknown-card" };
  const now = deps.now();
  const serverMs = Math.max(0, now - t.t);
  const late = serverMs > t.w + LATE_GRACE_MS;
  const timedOut = input.choice == null || late;
  const elapsedMs = timedOut ? Math.max(serverMs, Math.round(input.clientMs)) : effectiveMs(input.clientMs, serverMs);
  let correct = !timedOut && input.choice === card.answer && elapsedMs <= t.w + LATE_GRACE_MS;
  let replay = false;
  let credited = false;
  let paints: PaintId[] | undefined;
  const paintRoll = t.k != null && t.pr !== 0;
  const eventId = `t:${t.n}`;

  const prior = ring.get(t.n);
  if (prior) {
    replay = true;
    correct = prior.correct;
  }
  // Signed-in, dealt to this walker: the server records the card (and the clear) itself, once per token.
  const signedIn = viewer.userId != null && t.s === `u:${viewer.userId}`;
  if (signedIn && !replay && deps.sql) {
    try {
      const sql = await deps.sql();
      const id = eventId;
      const inserted = await sql<{ id: string }>`
        insert into plate_events (
          id, user_id, save_id, plate_id, shown_at, answered_at, latency_ms, correct, rarity, city, difficulty
        )
        values (
          ${id}, ${viewer.userId}, ${t.sv}, ${card.id}, ${new Date(t.t).toISOString()}::timestamptz,
          ${new Date(now).toISOString()}::timestamptz, ${Math.min(3_600_000, elapsedMs)}, ${correct},
          ${t.r}, ${t.city}, ${t.d}
        )
        on conflict (id) do nothing
        returning id
      `;
      if (!inserted.length) {
        replay = true;
        const first = await sql<{ correct: boolean }>`select correct from plate_events where id = ${id} limit 1`;
        correct = Boolean(first[0]?.correct);
      } else {
        credited = true;
        const blitzPi = t.x?.pi ?? "";
        if (correct && blitzPi.startsWith("blitz-")) {
          const step = Number(/^blitz-(\d+)$/.exec(blitzPi)?.[1]);
          try {
            await noteBlitzCard(sql, viewer.userId!, t.n, step);
          } catch (e) {
            console.warn("[trivia] blitz card note failed", e instanceof Error ? e.message : e);
          }
        }
        await sql`
          insert into plate_stats (plate_id, rarity, difficulty, shown, correct, latency_sum, updated_at)
          values (${card.id}, ${t.r}, ${t.d}, 1, ${correct ? 1 : 0}, ${Math.min(3_600_000, elapsedMs)}, now())
          on conflict (plate_id) do update set
            rarity = excluded.rarity,
            difficulty = excluded.difficulty,
            shown = plate_stats.shown + 1,
            correct = plate_stats.correct + excluded.correct,
            latency_sum = plate_stats.latency_sum + excluded.latency_sum,
            updated_at = now()
        `;
        if (correct && t.k) {
          const name = await publicName(sql, viewer.userId!);
          await sql`
            insert into vault_clears (user_id, display_name, tier, correct, updated_at)
            values (${viewer.userId}, ${name}, ${t.k}, 1, now())
            on conflict (user_id, tier)
            do update set correct = vault_clears.correct + 1, display_name = excluded.display_name, updated_at = now()
          `;
          if (paintRoll) {
            try {
              paints = await shadowPaints(sql, viewer.userId!, t.k!, eventId, deps.roll ?? Math.random);
            } catch (e) {
              console.warn("[trivia] paint roll failed", e instanceof Error ? e.message : e);
            }
          }
        }
      }
    } catch (e) {
      console.warn("[trivia] grade record failed", e instanceof Error ? e.message : e);
    }
  }
  // A replayed token returns the cans the first grade already rolled, and does not roll again.
  if (paints === undefined && replay && signedIn && paintRoll && correct && deps.sql) {
    try {
      paints = await paintsForEvent(await deps.sql(), eventId);
    } catch (e) {
      console.warn("[trivia] paint replay failed", e instanceof Error ? e.message : e);
    }
  }
  if (!prior) ringPut(t.n, { correct, elapsedMs, timedOut });
  const g = correct ? gradeOf(elapsedMs) : null;
  // Blitz pays through its own ladder (bankBlitz), not the street spark formula.
  const blitz = t.x?.pi?.startsWith("blitz-") === true;
  let wallet: ServerWallet | undefined;
  let award: ServerAward | undefined;
  let can: { car: string; color: string } | undefined;
  if (signedIn && (credited || replay) && deps.sql && !blitz) {
    try {
      const sql = await deps.sql();
      const x = t.x;
      const rand = deps.rand ?? Math.random;
      const awarded = await awardGrade(sql, viewer.userId!, t.n, {
        correct,
        elapsedMs,
        mult: g?.mult ?? 0,
        city: t.city,
        diff: t.d,
        clearTier: t.k,
        poiTier: x?.pt ?? t.r,
        poiId: x?.pi ?? "",
        lat: x?.la ?? 0,
        lng: x?.ln ?? 0,
        series: x?.sy === 2 ? "stack" : x?.sy === 1 ? "run" : null,
        step: x?.ss ?? 0,
        steps: x?.sn ?? 1,
        prevNonce: x?.pv ?? "",
        streak: x?.sk ?? 0,
        loot: typeof x?.lt === "number" ? clampLoot(x.lt) : 1,
        lucky: x?.lk === 1,
        cloth: clampCloth(x?.cl, t.city),
        charmDay: x?.cd ?? "",
        charmTopics: Array.isArray(x?.ct) ? (x.ct as TriviaCat[]) : [],
        topic: (x?.cat ?? null) as TriviaCat | null,
        dealtAt: t.t,
        luckyHit: x?.lk === 1 && rand() < LUCKY_MATCH_CHANCE,
        perfectBlue: g?.grade === "perfect" && rand() < PERFECT_BLUE_CHANCE,
        scout: scoutOf(x?.sc),
        rummage: rummageHit(scoutOf(x?.sc), rand()),
        shellBack: shellBackHit(scoutOf(x?.sc), rand()),
        canRoll: [rand(), rand()],
      });
      if (awarded.authoritative) {
        wallet = awarded.view;
        award = awarded.award;
        can = awarded.can;
      }
    } catch (e) {
      console.warn("[trivia] wallet award failed", e instanceof Error ? e.message : e);
    }
  }
  return {
    ok: true,
    correct,
    timedOut,
    answer: card.answer,
    fact: card.fact,
    elapsedMs,
    grade: g?.grade ?? null,
    mult: g?.mult ?? 0,
    clearTier: correct ? t.k : null,
    credited,
    replay,
    ...(paints !== undefined ? { paints } : {}),
    ...(wallet ? { wallet, ...(award ? { award } : {}) } : {}),
    ...(can ? { can } : {}),
  };
}
