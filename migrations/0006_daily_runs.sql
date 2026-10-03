-- Daily Lantern Run (0.0.43): one row per signed-in walker per UTC day (the primary key is the
-- one-entry rule). Every time is the server clock: started_at at lamp 1, last_at at the latest lamp,
-- time_ms once lamp 5 lights. last_lat/last_lng is where the latest lamp was lit from (leg floors). Writes are scoped to the verified session user; the ranked read is public.
create table if not exists daily_runs (
  day           text not null,
  user_id       text not null,
  city          text not null,
  display_name  text not null,
  started_at    timestamptz not null,
  last_at       timestamptz not null,
  last_lat      double precision not null,
  last_lng      double precision not null,
  lit           smallint not null default 1 check (lit between 1 and 5),
  splits        jsonb not null default '[]'::jsonb,
  client_splits jsonb not null default '[]'::jsonb,
  finished_at   timestamptz,
  time_ms       integer check (time_ms is null or time_ms > 0),
  strikes       smallint not null default 0,
  voided        boolean not null default false,
  primary key (day, user_id)
);

create index if not exists daily_runs_board_idx
  on daily_runs (day, city, time_ms asc, finished_at asc)
  where time_ms is not null and not voided;
