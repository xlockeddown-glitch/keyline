-- Public per-tier lamp rolls: one row per walker per match colour.
-- Writes are scoped to the verified session user; the ranked read is public.
create table if not exists vault_clears (
  user_id      text not null,
  display_name text not null,
  tier         text not null check (tier in ('white', 'blue', 'green', 'amber', 'red', 'violet')),
  correct      integer not null default 0 check (correct >= 0),
  updated_at   timestamptz not null default now(),
  primary key (user_id, tier)
);

create index if not exists vault_clears_tier_correct_idx
  on vault_clears (tier, correct desc, updated_at asc);
