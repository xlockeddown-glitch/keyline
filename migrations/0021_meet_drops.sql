-- Meet you there (0.1.186): a location gift between friends. One row per drop a signed-in player (the player_links
-- primary) leaves at a street lamp for one named friend. Nothing is minted here: a coin or key drop is debited from
-- the dropper's wallet at leave time (wallet_ledger row `meet:<id>`) and the row's amount IS the escrow until the
-- friend collects it at that lamp (`meetget:<id>`) or it expires and goes back to the dropper (`meetback:<id>`).
-- id is the dropper's own nonce, so a retried leave is the same drop.
-- day is the lamp's CITY-local calendar day at leave (cityDay, the same clock as same-lamp rest).
-- (dropper_id, day, cls, slot) unique IS the per-day cap: a leave takes the first free slot (wave 1..10, item 1..5)
-- with insert ... on conflict do nothing, so racing leaves can never pass the cap, and a drop that later expires,
-- is collected or is refunded keeps its slot (the cap is never refunded).
-- Additive only and safe to re-run. While this table is missing every Meet you there call refuses ("unready") and
-- nothing else changes, so publishing without running this migration breaks nothing.
-- To undo: drop table if exists meet_drops; (the ledger rows stay; refund any open coin/key drops first, since an
-- open row's amount is coin or a key already taken from its dropper).
create table if not exists meet_drops (
  id         text primary key,
  dropper_id text not null,
  friend_id  text not null,
  city       text not null,
  poi_id     text not null,
  kind       text not null check (kind in ('wave', 'key', 'coin')),
  amount     integer not null default 0,
  day        text not null,
  cls        text not null check (cls in ('wave', 'item')),
  slot       integer not null check (slot between 1 and 10),
  state      text not null default 'pending' check (state in ('pending', 'open', 'collected', 'expired')),
  settled    boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  settled_at timestamptz,
  check (friend_id <> dropper_id),
  check ((kind = 'wave' and amount = 0 and cls = 'wave') or (kind = 'key' and amount = 1 and cls = 'item') or (kind = 'coin' and amount = 30 and cls = 'item')),
  check (cls = 'wave' or slot <= 5)
);

create unique index if not exists meet_drops_slot_uidx on meet_drops (dropper_id, day, cls, slot);
create unique index if not exists meet_drops_lamp_uidx on meet_drops (dropper_id, poi_id) where state in ('pending', 'open');
create index if not exists meet_drops_friend_idx on meet_drops (friend_id) where state = 'open';
