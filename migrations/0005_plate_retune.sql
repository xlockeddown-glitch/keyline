-- Weekly rarity retune: one override per plate, plus the week stamp so reruns no-op.
create table if not exists plate_overrides (
  plate_id       text not null primary key,
  from_rarity    text not null check (from_rarity in ('white', 'blue', 'green', 'amber', 'red', 'violet')),
  to_rarity      text not null check (to_rarity in ('white', 'blue', 'green', 'amber', 'red', 'violet')),
  action         text not null check (action in ('demote', 'promote', 'rewrite')),
  attempts       integer not null,
  correct_count  integer not null,
  rate           double precision not null,
  sum_latency_ms bigint,
  scope          text not null,
  city           text,
  week           text not null,
  snapshot       jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);

create table if not exists plate_retune_meta (
  id     text primary key,
  week   text not null,
  ran_at timestamptz not null default now()
);

-- Volatile-fact tags from the weekly freshness pass. Quarantine hides a plate until rewritten.
create table if not exists plate_freshness (
  plate_id     text not null primary key,
  fresh        text not null check (fresh in ('stable', 'volatile')),
  quarantined  boolean not null default false,
  verified_at  timestamptz,
  reason       text,
  source       text,
  week         text not null,
  updated_at   timestamptz not null default now()
);
