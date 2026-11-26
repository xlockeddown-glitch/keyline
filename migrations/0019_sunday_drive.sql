-- Sunday Drive (0.1.181): the daily mileage meter. One row per signed-in player (the player_links primary).
-- last_at is the server's clock at this player's latest ping and prev_at the one before it, so one statement both
-- moves the clock and tells the caller how long the window was (the walk_clock pattern, 0014). day is the
-- America/Chicago calendar day the meters belong to; the meters go back to 0 when a ping arrives on a new day.
-- No coin and no pay count live here: pays are wallet_ledger rows `sd:<day>:<k>` (k = 1..8), and the HUD count is
-- the number of those rows. Additive only and safe to re-run. The op refuses ("unready") while this table is
-- missing, so publishing without running this migration pays nothing and breaks nothing.
-- To undo: drop table if exists sunday_drive; (the ledger rows and the coin already paid stay).
create table if not exists sunday_drive (
  user_id text primary key,
  day     text not null default '',
  meters  integer not null default 0 check (meters >= 0),
  last_at timestamptz not null default now(),
  prev_at timestamptz
);
