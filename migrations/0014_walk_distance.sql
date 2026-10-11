-- Distance on the leaderboard (0.0.63). Foot metres a signed-in walker posted, per city.
-- The clock is one row per walker: each post moves posted_at forward, and the credit is
-- capped by the gap since the previous post (src/game/walkBoard.ts). A cab never posts.
-- Linked sign-ins fold through walk_distance_by_player, same as the other boards.
create table if not exists walk_distance (
  user_id    text not null,
  city       text not null,
  meters     bigint not null default 0 check (meters >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, city)
);

create index if not exists walk_distance_city_meters_idx
  on walk_distance (city, meters desc);

-- prev_at is the posted_at from before this post, so one statement both moves the clock
-- and tells the caller how long the window was. Posts closer than a second do not move it.
create table if not exists walk_clock (
  user_id   text primary key,
  posted_at timestamptz not null default now(),
  prev_at   timestamptz
);

create or replace view walk_distance_by_player as
select
  coalesce(l.primary_id, w.user_id) as user_id,
  w.city,
  sum(w.meters)::bigint as meters,
  max(w.updated_at) as updated_at
from walk_distance w
left join player_links l on l.alias_id = w.user_id
group by coalesce(l.primary_id, w.user_id), w.city;
