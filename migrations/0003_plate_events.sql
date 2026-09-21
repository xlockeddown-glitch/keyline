-- One row per shown-and-answered trivia plate for a signed-in walker.
-- Writes are scoped to the verified session user. Guests stay local-only.
create table if not exists plate_events (
  id           text not null primary key,
  user_id      text not null,
  save_id      text not null,
  plate_id     text not null,
  shown_at     timestamptz not null,
  answered_at  timestamptz not null,
  latency_ms   integer not null check (latency_ms >= 0),
  correct      boolean not null,
  rarity       text not null check (rarity in ('white', 'blue', 'green', 'amber', 'red', 'violet')),
  city         text,
  difficulty   smallint,
  created_at   timestamptz not null default now()
);

create index if not exists plate_events_user_answered_idx
  on plate_events (user_id, answered_at desc);

create index if not exists plate_events_plate_idx
  on plate_events (plate_id);
