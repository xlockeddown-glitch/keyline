-- Radio hop (0.1.183): the per-city drive counter. One row per signed-in player (the player_links primary) per city.
-- day is that CITY's local calendar day (cityDay, the same clock as same-lamp rest) of the latest counted ping; the
-- meters go back to 0 when a drive ping arrives on a new city day. Only accepted drive (seated) metres are added,
-- never walk metres. Separate from sunday_drive (0019): its own counter, its own 2,000 m threshold.
-- No coin and no flag live here: the unlock is one zero-delta wallet_ledger row `radio:<city>:<day>`.
-- Additive only and safe to re-run. While this table is missing Sunday Drive works as before and no hop unlocks,
-- so publishing without running this migration breaks nothing.
-- To undo: drop table if exists radio_hop; (the ledger rows stay).
create table if not exists radio_hop (
  user_id text not null,
  city    text not null,
  day     text not null default '',
  meters  integer not null default 0 check (meters >= 0),
  primary key (user_id, city)
);
