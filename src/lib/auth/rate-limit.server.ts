/**
 * 0.0.84: Better Auth rate-limit storage on the app's own SQL (Neon live, PGLite in dev), table `"rateLimit"`
 * (migration 0017). One atomic upsert per counted request, so serverless instances share the count.
 *
 * Fails soft on purpose: if the table is missing (a deploy whose migration didn't run) or the database hiccups, it
 * logs once and counts in this instance's memory instead. Sign-in with Google / X must never break because a
 * rate-limit row couldn't be written.
 */
import { randomUUID } from "node:crypto";

type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
type Rule = { window: number; max: number };
type Entry = { key: string; count: number; lastRequest: number };

export function authRateLimitStorage(getQuery: () => Promise<Query>, now: () => number = Date.now) {
  const memory = new Map<string, Entry>();
  let warned = false;

  const memoryConsume = (key: string, rule: Rule) => {
    const t = now();
    const ms = rule.window * 1000;
    const e = memory.get(key);
    if (!e || t - e.lastRequest > ms) {
      memory.set(key, { key, count: 1, lastRequest: t });
      if (memory.size > 5000) for (const [k, v] of memory) if (t - v.lastRequest > 3600_000) memory.delete(k);
      return { allowed: true, retryAfter: null };
    }
    if (e.count >= rule.max) return { allowed: false, retryAfter: Math.max(1, Math.ceil((e.lastRequest + ms - t) / 1000)) };
    e.count += 1;
    return { allowed: true, retryAfter: null };
  };

  const soft = (err: unknown) => {
    if (warned) return;
    warned = true;
    console.warn(`[auth] rate limit table unavailable, counting in memory: ${String((err as Error)?.message ?? err).slice(0, 160)}`);
  };

  return {
    async consume(key: string, rule: Rule) {
      const t = now();
      const ms = rule.window * 1000;
      try {
        const q = await getQuery();
        // New key or window elapsed -> 1 with a fresh window; otherwise +1 (denied requests keep counting, so a
        // hammering client stays blocked until the window that started at its first request runs out).
        const rows = await q(
          `insert into "rateLimit" ("id", "key", "count", "lastRequest") values ($1, $2, 1, $3)
           on conflict ("key") do update set
             "count" = case when "rateLimit"."lastRequest" < $3 - $4 then 1 else "rateLimit"."count" + 1 end,
             "lastRequest" = case when "rateLimit"."lastRequest" < $3 - $4 then $3 else "rateLimit"."lastRequest" end
           returning "count", "lastRequest"`,
          [randomUUID(), key, t, ms],
        );
        const count = Number(rows[0]?.count ?? 1);
        const last = Number(rows[0]?.lastRequest ?? t);
        if (count <= rule.max) return { allowed: true, retryAfter: null };
        return { allowed: false, retryAfter: Math.max(1, Math.ceil((last + ms - t) / 1000)) };
      } catch (err) {
        soft(err);
        return memoryConsume(key, rule);
      }
    },
    async get(key: string) {
      try {
        const q = await getQuery();
        const rows = await q(`select "key", "count", "lastRequest" from "rateLimit" where "key" = $1`, [key]);
        const r = rows[0];
        return r ? { key: String(r.key), count: Number(r.count), lastRequest: Number(r.lastRequest) } : null;
      } catch (err) {
        soft(err);
        return memory.get(key) ?? null;
      }
    },
    async set(key: string, value: { count: number; lastRequest: number }) {
      try {
        const q = await getQuery();
        await q(
          `insert into "rateLimit" ("id", "key", "count", "lastRequest") values ($1, $2, $3, $4)
           on conflict ("key") do update set "count" = excluded."count", "lastRequest" = excluded."lastRequest"`,
          [randomUUID(), key, value.count, value.lastRequest],
        );
      } catch (err) {
        soft(err);
        memory.set(key, { key, ...value });
      }
    },
  };
}
