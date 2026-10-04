-- Player links (0.0.54b): one walker, several sign-ins. Better Auth keys a user by email, so signing in with a
-- different method (X instead of Google, another Google account, a Grok viewer identity with no email) makes a
-- brand-new user — and the standings, keyed by user id, show that person once per sign-in.
--
-- A link points an alias user id at the walker's primary (oldest) user id. The public standings read through
-- the *_by_player views below, so linked sign-ins share one row (counts summed, latest update kept). Rows are
-- never rewritten or deleted: unlinking is deleting the link. Links are made only by
--   * 'email': two users whose emails match case-insensitively (the safe automatic data fix, below), or
--   * 'code' : the walker themselves — a one-time code made while signed in on one sign-in and entered while
--              signed in on the other (src/game/playerLinks.ts), so both sides are proven by a live session.
-- 0001–0010 are left as deployed.
create table if not exists player_links (
  alias_id    text primary key,
  primary_id  text not null,
  how         text not null check (how in ('email', 'code', 'admin')),
  linked_at   timestamptz not null default now(),
  check (alias_id <> primary_id)
);
create index if not exists player_links_primary_idx on player_links (primary_id);

-- One-time link codes: made by a signed-in walker, redeemed once by another of their sign-ins within 10 min.
create table if not exists link_codes (
  code        text primary key,
  user_id     text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_by     text,
  used_at     timestamptz
);
create index if not exists link_codes_user_idx on link_codes (user_id, created_at desc);

-- Data fix (safe, automatic): users with the same email (ignoring case/whitespace) are one person. Keep the oldest
-- user id as primary. Better Auth stores emails lower-cased and unique, so on a healthy database this links nobody;
-- it never links users whose emails differ.
insert into player_links (alias_id, primary_id, how)
select id, first_id, 'email'
from (
  select
    u.id,
    first_value(u.id) over (partition by lower(trim(u.email)) order by u."createdAt" asc, u.id asc) as first_id
  from "user" u
) ranked
where id <> first_id
on conflict (alias_id) do nothing;

-- Standings views: every user id folded to its primary.
create or replace view vault_clears_by_player as
select
  coalesce(l.primary_id, v.user_id) as user_id,
  coalesce(
    max(v.display_name) filter (where l.primary_id is null),
    max(v.display_name)
  ) as display_name,
  v.tier,
  sum(v.correct)::int as correct,
  max(v.updated_at) as updated_at
from vault_clears v
left join player_links l on l.alias_id = v.user_id
group by coalesce(l.primary_id, v.user_id), v.tier;

create or replace view plate_events_by_player as
select
  e.id,
  coalesce(l.primary_id, e.user_id) as user_id,
  e.save_id,
  e.plate_id,
  e.shown_at,
  e.answered_at,
  e.latency_ms,
  e.correct,
  e.rarity,
  e.city,
  e.difficulty,
  e.created_at
from plate_events e
left join player_links l on l.alias_id = e.user_id;

-- Daily Lantern Run board: each walker's best finished run per day and city.
create or replace view daily_runs_by_player as
select distinct on (r.day, r.city, coalesce(l.primary_id, r.user_id))
  r.day,
  r.city,
  coalesce(l.primary_id, r.user_id) as user_id,
  r.display_name,
  r.time_ms,
  r.finished_at
from daily_runs r
left join player_links l on l.alias_id = r.user_id
where r.time_ms is not null and not r.voided
order by r.day, r.city, coalesce(l.primary_id, r.user_id), r.time_ms asc, r.finished_at asc;
