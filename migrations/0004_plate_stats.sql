-- Global per-plate counters for rarity retune. Incremented with each signed-in event.
create table if not exists plate_stats (
  plate_id     text not null primary key,
  rarity       text not null check (rarity in ('white', 'blue', 'green', 'amber', 'red', 'violet')),
  difficulty   smallint,
  shown        integer not null default 0 check (shown >= 0),
  correct      integer not null default 0 check (correct >= 0),
  latency_sum  bigint not null default 0,
  updated_at   timestamptz not null default now()
);

create index if not exists plate_stats_rarity_idx on plate_stats (rarity, shown desc);
