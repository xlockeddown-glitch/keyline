-- Signed-in wallet (0.0.78). Coins, matches, city unlocks and city passes for one
-- walker. The row is keyed by the player_links primary id (aliases share it).
-- Guests stay in the local save. `migrated` flips once, on the first sync, which
-- keeps the higher of the server and the local save (capped in the app).
-- wallet_ledger makes an award or a spend apply once per op_key: a replayed
-- grade token or a repeated purchase changes nothing.
create table if not exists player_wallets (
  user_id    text primary key,
  coins      bigint not null default 0 check (coins >= 0),
  white      integer not null default 0 check (white >= 0),
  blue       integer not null default 0 check (blue >= 0),
  green      integer not null default 0 check (green >= 0),
  amber      integer not null default 0 check (amber >= 0),
  red        integer not null default 0 check (red >= 0),
  violet     integer not null default 0 check (violet >= 0),
  cities     jsonb not null default '{}'::jsonb,
  meta       jsonb not null default '{}'::jsonb,
  migrated   boolean not null default false,
  version    integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists wallet_ledger (
  user_id    text not null,
  op_key     text not null,
  detail     text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, op_key)
);
