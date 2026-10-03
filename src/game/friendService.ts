import type { Sql } from "../lib/db.ts";
import {
  DAILY_REWARDS,
  DAILY_TICKETS,
  TICKET_TTL_MS,
  answerDecision,
  createDecision,
  deadlineOf,
  dealChoices,
  isToken,
  newToken,
  openDecision,
  pairKey,
  rewardDecision,
  utcDay,
  type RewardWhy,
  type TicketRow,
} from "./friendTicket.ts";
import type { TriviaDiff } from "./types";

/**
 * Friend tickets on Postgres (0.0.50). The server functions in friendApi.ts are thin wrappers over this, so
 * the same code runs against PGLite in friendService.test.ts. Every write is a single guarded statement
 * (claim, answer, cap upserts), so two requests at once can't both win the same ticket or the last slot.
 */
export type FriendCard = { id: string; q: string; choices: readonly string[]; answer: string; fact?: string; diff: TriviaDiff };
export type FriendUser = { id: string; name: string };
export type FriendDeps = {
  sql: Sql;
  now: () => number;
  findCard: (id: string) => FriendCard | null;
  token?: () => string;
  rand?: () => number;
};

type DbRow = {
  token: string;
  sender_id: string;
  sender_name: string;
  card_id: string;
  prompt: string;
  choices: unknown;
  answer: string;
  fact: string | null;
  diff: number;
  created_at: string | Date;
  expires_at: string | Date;
  friend_id: string | null;
  friend_name: string | null;
  opened_at: string | Date | null;
  answered_at: string | Date | null;
  choice: string | null;
  correct: boolean | null;
  rewarded: boolean;
  reward_day: string | null;
  reward_why: string | null;
};

const ms = (v: string | Date) => (v instanceof Date ? v.getTime() : Date.parse(v));
const msOrNull = (v: string | Date | null) => (v == null ? null : ms(v));
const iso = (n: number) => new Date(n).toISOString();
const strs = (v: unknown): string[] => {
  const a = typeof v === "string" ? (JSON.parse(v) as unknown) : v;
  return Array.isArray(a) ? a.map(String) : [];
};

function toRow(r: DbRow): TicketRow {
  return {
    token: r.token,
    senderId: r.sender_id,
    senderName: r.sender_name,
    createdAt: ms(r.created_at),
    expiresAt: ms(r.expires_at),
    friendId: r.friend_id,
    openedAt: msOrNull(r.opened_at),
    answeredAt: msOrNull(r.answered_at),
    correct: r.correct,
    rewarded: Boolean(r.rewarded),
  };
}

async function load(sql: Sql, token: string): Promise<DbRow | null> {
  const rows = await sql<DbRow>`select * from friend_tickets where token = ${token} limit 1`;
  return rows[0] ?? null;
}

// ---------- rate limit ----------

export const RATE = {
  create: { limit: 8, windowMs: 60_000 },
  peek: { limit: 30, windowMs: 60_000 },
  play: { limit: 20, windowMs: 60_000 },
  news: { limit: 20, windowMs: 60_000 },
} as const;

/** Fixed-window counter. True while the bucket is under its limit for this window. */
export async function rateHit(sql: Sql, bucket: string, rule: { limit: number; windowMs: number }, now: number): Promise<boolean> {
  const win = Math.floor(now / rule.windowMs);
  const rows = await sql<{ n: number }>`
    insert into rate_hits (bucket, win, n) values (${bucket}, ${win}, 1)
    on conflict (bucket, win) do update set n = rate_hits.n + 1
    returning n
  `;
  // Now and then, sweep windows older than a day.
  if (Math.random() < 0.02) await sql`delete from rate_hits where win < ${Math.floor((now - 86_400_000) / rule.windowMs)} and bucket like ${bucket.split(":")[0] + ":%"}`;
  return Number(rows[0]?.n ?? 1) <= rule.limit;
}

// ---------- create ----------

export type CreateResult =
  | { ok: true; token: string; expiresAt: number; left: number }
  | { ok: false; reason: "guest" | "daily-cap" | "unknown-card"; left: number };

export async function createTicket(d: FriendDeps, user: FriendUser | null, cardId: string): Promise<CreateResult> {
  const now = d.now();
  const day = utcDay(now);
  const card = d.findCard(cardId);
  if (!user) return { ok: false, reason: "guest", left: 0 };
  const today = await d.sql<{ created: number }>`select created from friend_ticket_days where sender_id = ${user.id} and day = ${day}`;
  const createdToday = Number(today[0]?.created ?? 0);
  const pre = createDecision({ signedIn: true, createdToday, cardKnown: Boolean(card) });
  if (pre.kind === "reject" || !card) return { ok: false, reason: pre.kind === "reject" ? pre.reason : "unknown-card", left: Math.max(0, DAILY_TICKETS - createdToday) };
  // Take a slot: the guarded upsert only bumps while under the cap.
  const slot = await d.sql<{ created: number }>`
    insert into friend_ticket_days (sender_id, day, created, rewarded) values (${user.id}, ${day}, 1, 0)
    on conflict (sender_id, day) do update set created = friend_ticket_days.created + 1
      where friend_ticket_days.created < ${DAILY_TICKETS}
    returning created
  `;
  if (!slot[0]) return { ok: false, reason: "daily-cap", left: 0 };
  const token = (d.token ?? newToken)();
  const expiresAt = now + TICKET_TTL_MS;
  await d.sql`
    insert into friend_tickets (token, sender_id, sender_name, card_id, prompt, choices, answer, fact, diff, created_at, expires_at)
    values (${token}, ${user.id}, ${user.name}, ${card.id}, ${card.q}, ${JSON.stringify(dealChoices(card.choices, d.rand))}::jsonb,
            ${card.answer}, ${card.fact ?? null}, ${card.diff}, ${iso(now)}, ${iso(expiresAt)})
  `;
  return { ok: true, token, expiresAt, left: Math.max(0, DAILY_TICKETS - Number(slot[0].created)) };
}

// ---------- peek (public: who sent it, is it live; never the card) ----------

export type PeekResult = { status: "live" | "expired" | "used" | "missing"; from: string | null; expiresAt: number | null };

export async function peekTicket(d: FriendDeps, token: string): Promise<PeekResult> {
  if (!isToken(token)) return { status: "missing", from: null, expiresAt: null };
  const r = await load(d.sql, token);
  if (!r) return { status: "missing", from: null, expiresAt: null };
  const row = toRow(r);
  const status = row.friendId ? "used" : d.now() >= row.expiresAt ? "expired" : "live";
  return { status, from: row.senderName, expiresAt: row.expiresAt };
}

// ---------- open (deal the card; the answer stays on the server) ----------

export type Scored = {
  status: "scored";
  from: string;
  correct: boolean;
  answer: string;
  choice: string | null;
  fact: string | null;
  rewarded: boolean;
  why: RewardWhy | null;
};

export type OpenResult =
  | { status: "play"; from: string; q: string; choices: string[]; diff: TriviaDiff; msLeft: number; msTotal: number }
  | { status: "self" | "expired" | "taken" | "missing"; from: string | null }
  | Scored;

function scoredOf(r: DbRow): Scored {
  const why: RewardWhy | null = r.rewarded
    ? null
    : r.reward_why === "pair-cap" || r.reward_why === "sender-cap" || r.reward_why === "late"
      ? r.reward_why
      : r.choice === "__late__"
        ? "late"
        : "wrong";
  return {
    status: "scored",
    from: r.sender_name,
    correct: Boolean(r.correct),
    answer: r.answer,
    choice: r.choice === "__late__" || r.choice === "__timeout__" ? null : r.choice,
    fact: r.fact,
    rewarded: Boolean(r.rewarded),
    why,
  };
}

export async function openTicket(d: FriendDeps, user: FriendUser, token: string): Promise<OpenResult> {
  if (!isToken(token)) return { status: "missing", from: null };
  const now = d.now();
  const r = await load(d.sql, token);
  const dec = openDecision(r ? toRow(r) : null, user.id, now);
  if (!r || dec.kind === "missing") return { status: "missing", from: null };
  const play = (row: DbRow, msLeft: number): OpenResult => ({
    status: "play",
    from: row.sender_name,
    q: row.prompt,
    choices: strs(row.choices),
    diff: (Number(row.diff) || 2) as TriviaDiff,
    msLeft,
    msTotal: deadlineOf(0),
  });
  switch (dec.kind) {
    case "self":
    case "expired":
    case "taken":
      return { status: dec.kind, from: r.sender_name };
    case "done":
      return scoredOf(r);
    case "resume":
      return play(r, dec.msLeft);
    case "lapsed": {
      const lapsed = await answerTicket(d, user, token, "__timeout__");
      return lapsed.status === "scored" ? lapsed : { status: "taken", from: r.sender_name };
    }
    case "claim": {
      // One redemption: only the first friend's claim lands (friend_id is null → this user).
      const won = await d.sql<DbRow>`
        update friend_tickets set friend_id = ${user.id}, friend_name = ${user.name}, pair_key = ${pairKey(r.sender_id, user.id)}, opened_at = ${iso(now)}
        where token = ${token} and friend_id is null and sender_id <> ${user.id} and expires_at > ${iso(now)}
        returning *
      `;
      if (won[0]) return play(won[0], deadlineOf(now) - now);
      const again = await load(d.sql, token);
      const dec2 = openDecision(again ? toRow(again) : null, user.id, now);
      if (again && dec2.kind === "resume") return play(again, dec2.msLeft);
      return { status: dec2.kind === "expired" ? "expired" : "taken", from: r.sender_name };
    }
  }
}

// ---------- answer (scored on the server; caps applied with guarded writes) ----------

export type AnswerResult = Scored | { status: "reject"; reason: "missing" | "self" | "not-yours" | "answered" | "not-open" };

export async function answerTicket(d: FriendDeps, user: FriendUser, token: string, choice: string): Promise<AnswerResult> {
  if (!isToken(token)) return { status: "reject", reason: "missing" };
  const now = d.now();
  const r = await load(d.sql, token);
  const dec = answerDecision(r ? toRow(r) : null, user.id, choice, r?.answer ?? "", now);
  if (!r) return { status: "reject", reason: "missing" };
  if (dec.kind === "reject") {
    if (dec.reason === "answered" && r.friend_id === user.id) return scoredOf(r);
    return { status: "reject", reason: dec.reason };
  }
  const stored = dec.late ? "__late__" : choice.slice(0, 200);
  // One answer per ticket: only lands while answered_at is still null.
  const marked = await d.sql<DbRow>`
    update friend_tickets set answered_at = ${iso(now)}, choice = ${stored}, correct = ${dec.correct}
    where token = ${token} and friend_id = ${user.id} and answered_at is null
    returning *
  `;
  if (!marked[0]) {
    const again = await load(d.sql, token);
    return again && again.friend_id === user.id ? scoredOf(again) : { status: "reject", reason: "answered" };
  }
  const day = utcDay(now);
  const pair = pairKey(r.sender_id, user.id);
  const pairToday = await d.sql<{ n: number }>`select count(*)::int as n from friend_tickets where pair_key = ${pair} and reward_day = ${day} and rewarded`;
  const senderToday = await d.sql<{ rewarded: number }>`select rewarded from friend_ticket_days where sender_id = ${r.sender_id} and day = ${day}`;
  const rd = rewardDecision({
    correct: dec.correct,
    late: dec.late,
    senderRewardedToday: Number(senderToday[0]?.rewarded ?? 0),
    pairRewardedToday: Number(pairToday[0]?.n ?? 0),
  });
  const result = (rewarded: boolean, why: RewardWhy | null): Scored => ({
    status: "scored",
    from: r.sender_name,
    correct: dec.correct,
    answer: r.answer,
    choice: dec.late || choice === "__timeout__" ? null : choice,
    fact: r.fact,
    rewarded,
    why,
  });
  const miss = async (why: RewardWhy) => {
    await d.sql`update friend_tickets set reward_why = ${why} where token = ${token}`;
    return result(false, why);
  };
  if (!rd.rewarded) return miss(rd.why);
  // Sender's daily reward slot (guarded upsert: never past DAILY_REWARDS).
  const slot = await d.sql<{ rewarded: number }>`
    insert into friend_ticket_days (sender_id, day, created, rewarded) values (${r.sender_id}, ${day}, 0, 1)
    on conflict (sender_id, day) do update set rewarded = friend_ticket_days.rewarded + 1
      where friend_ticket_days.rewarded < ${DAILY_REWARDS}
    returning rewarded
  `;
  if (!slot[0]) return miss("sender-cap");
  try {
    // The pair's once-a-day rule is a unique index; a racing twin fails here.
    await d.sql`update friend_tickets set rewarded = true, reward_day = ${day} where token = ${token}`;
  } catch {
    await d.sql`update friend_ticket_days set rewarded = greatest(0, rewarded - 1) where sender_id = ${r.sender_id} and day = ${day}`;
    return miss("pair-cap");
  }
  return result(true, null);
}

// ---------- news (rewards waiting to land in a save) ----------

export type NewsItem = { id: string; role: "sender" | "friend"; name: string };

/** Rewarded tickets whose white hasn't been acknowledged by this user's save yet, both roles. */
export async function friendNews(d: FriendDeps, userId: string): Promise<NewsItem[]> {
  const sent = await d.sql<{ token: string; friend_name: string | null }>`
    select token, friend_name from friend_tickets where sender_id = ${userId} and rewarded and not sender_seen order by answered_at asc limit 20
  `;
  const got = await d.sql<{ token: string; sender_name: string }>`
    select token, sender_name from friend_tickets where friend_id = ${userId} and rewarded and not friend_seen order by answered_at asc limit 20
  `;
  return [
    ...sent.map((r) => ({ id: `s:${r.token}`, role: "sender" as const, name: r.friend_name ?? "A friend" })),
    ...got.map((r) => ({ id: `f:${r.token}`, role: "friend" as const, name: r.sender_name })),
  ];
}

/** The save has paid these; stop sending them. Scoped to the caller's own side of each ticket. */
export async function ackNews(d: FriendDeps, userId: string, ids: readonly string[]): Promise<number> {
  let n = 0;
  for (const id of ids.slice(0, 40)) {
    const [role, token] = [id.slice(0, 2), id.slice(2)];
    if (!isToken(token)) continue;
    const rows =
      role === "s:"
        ? await d.sql`update friend_tickets set sender_seen = true where token = ${token} and sender_id = ${userId} and rewarded returning token`
        : role === "f:"
          ? await d.sql`update friend_tickets set friend_seen = true where token = ${token} and friend_id = ${userId} and rewarded returning token`
          : [];
    n += rows.length;
  }
  return n;
}
