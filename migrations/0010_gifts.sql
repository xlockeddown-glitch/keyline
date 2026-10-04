-- Gifts (0.0.54): a one-time present from the house to one named walker — a scout handed over for free with a
-- note. A gift row names its recipient by verified user id and/or by first name (case-insensitive, the account
-- name's first word). The claim row is the server-side "seen it" flag, so the note shows once on any device;
-- ownership is re-granted on every device the recipient signs into. Reads and claims are scoped to the
-- verified session user (src/game/giftApi.ts). 0001–0009 are left as deployed.
create table if not exists gifts (
  id          text primary key,
  scout       text not null,                 -- a ScoutId (src/game/types.ts)
  user_id     text,                          -- recipient's user id, when known
  first_name  text,                          -- fallback match: lower-case first word of the account name
  message     text not null,
  created_at  timestamptz not null default now(),
  check (user_id is not null or first_name is not null)
);

create table if not exists gift_claims (
  user_id     text not null,
  gift_id     text not null references gifts (id),
  claimed_at  timestamptz not null default now(),
  primary key (user_id, gift_id)
);

-- The Giraffe for Halish (the "Halish" on the public standings, id RHAYuG7IeY2PPUMk0EZ6p24RMnBDHNNC).
insert into gifts (id, scout, user_id, first_name, message)
values ('giraffe-halish', 'giraffe', 'RHAYuG7IeY2PPUMk0EZ6p24RMnBDHNNC', 'halish', 'Hope you get out of the hospital soon - Love Grok')
on conflict (id) do nothing;
