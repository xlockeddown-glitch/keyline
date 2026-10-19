-- Worn scout on the account (0.1.6): one row per signed-in walker, the scout they last put on and when (ms).
-- Purely visual choice; ownership stays in wallet_ledger / gifts. Additive only. The game falls back to the
-- local save when this table is missing, so publishing without running this migration is safe.
create table if not exists worn_scouts (
  user_id     text primary key,
  scout       text not null,
  worn_at     bigint not null default 0,
  updated_at  timestamptz not null default now()
);
