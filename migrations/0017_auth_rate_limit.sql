-- 0.0.84: Better Auth rate limits stored in Postgres (custom storage, src/lib/auth/rate-limit.server.ts) so every serverless instance
-- shares one count per IP + path. Shape matches Better Auth 1.6's core `rateLimit` model; camelCase stays quoted.
-- Email/password itself needs no schema change: "account"."password" and "verification" already exist (0001).
create table if not exists "rateLimit" (
  "id" text not null primary key,
  "key" text not null unique,
  "count" integer not null,
  "lastRequest" bigint not null
);
