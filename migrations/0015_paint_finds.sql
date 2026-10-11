-- Shadow pity (0.0.75). One row per signed-in find of a rarer can.
-- `clears` is that walker's correct answers of the colour when the can dropped
-- (the sum of every colour, for prism). `first` is their first of that can —
-- the curve is built from those rows only, and never from the walker being rolled.
-- `event_id` is the plate event (`t:<nonce>`), so a replayed grade returns the
-- same cans and does not roll again. White and blue are not recorded.
create table if not exists paint_finds (
  event_id  text not null,
  user_id   text not null,
  paint     text not null check (paint in ('green', 'amber', 'red', 'violet', 'prism')),
  clears    integer not null check (clears >= 1),
  first     boolean not null,
  found_at  timestamptz not null default now(),
  primary key (event_id, paint)
);

create unique index if not exists paint_finds_one_first
  on paint_finds (user_id, paint)
  where first;

create index if not exists paint_finds_curve_idx
  on paint_finds (paint, user_id)
  where first;
