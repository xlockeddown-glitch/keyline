-- Friend tickets (0.0.50): a signed-in walker sends one trivia card they just answered as a share link
-- (/t/<token>). A signed-in friend answers that exact card, timed on the server clock; a right answer pays
-- both of them one white match. Every rule is checked here on the server; 0001–0008 are left as deployed.
--
-- The card (prompt, choices in their dealt order, answer, fact) is copied from the server's own trivia
-- bank when the ticket is made, so the answer never leaves the server before the friend has answered.
create table if not exists friend_tickets (
  token        text primary key,                 -- 24-char random base64url (144 bits); unguessable
  sender_id    text not null,
  sender_name  text not null,                    -- First L. at send time
  card_id      text not null,
  prompt       text not null,
  choices      jsonb not null,
  answer       text not null,
  fact         text,
  diff         smallint not null default 2,
  created_at   timestamptz not null,
  expires_at   timestamptz not null,             -- created_at + 48 h
  friend_id    text,                             -- set once, when a friend is dealt the card (one redemption)
  friend_name  text,
  pair_key     text,                             -- least(sender, friend) || ':' || greatest(sender, friend)
  opened_at    timestamptz,                      -- the card's clock starts here (server time)
  answered_at  timestamptz,
  choice       text,
  correct      boolean,
  rewarded     boolean not null default false,
  reward_day   text,                             -- UTC day the reward counted against
  reward_why   text,                             -- why a scored answer paid nothing (wrong/late/sender-cap/pair-cap)
  sender_seen  boolean not null default false,   -- the sender's white has landed in their save
  friend_seen  boolean not null default false,   -- the friend's white has landed in their save
  check (friend_id is null or friend_id <> sender_id)
);

create index if not exists friend_tickets_sender_idx on friend_tickets (sender_id, created_at desc);
create index if not exists friend_tickets_news_sender_idx on friend_tickets (sender_id) where rewarded and not sender_seen;
create index if not exists friend_tickets_news_friend_idx on friend_tickets (friend_id) where rewarded and not friend_seen;

-- A friend pair (either direction) is rewarded at most once per UTC day — enforced by the database.
create unique index if not exists friend_tickets_pair_day_uidx on friend_tickets (pair_key, reward_day) where rewarded;

-- Per sender per UTC day: tickets made (cap 5) and rewarded redemptions (cap 3). Bumped with a guarded
-- upsert, so two requests at once can't both take the last slot.
create table if not exists friend_ticket_days (
  sender_id  text not null,
  day        text not null,
  created    smallint not null default 0,
  rewarded   smallint not null default 0,
  primary key (sender_id, day)
);

-- Fixed-window rate limit counters for the friend-ticket endpoints (bucket = endpoint + user or IP).
create table if not exists rate_hits (
  bucket  text not null,
  win     bigint not null,
  n       integer not null default 0,
  primary key (bucket, win)
);
