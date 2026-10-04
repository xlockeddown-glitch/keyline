-- 0.0.58: a signed-in walker's recently dealt trivia cards, kept on the server so the anti-repeat memory follows the
-- walker, not the browser. Before, it lived only in each browser's save (seenIds): a second phone, a second tab, a
-- new sign-in or a cleared save dealt cards the walker had just seen (gaps of 1–11 deals in the 0.0.58 repro).
-- One row per (walker, card): written when the card is DEALT (so a walk-away or a lost answer counts too), with
-- the deal time; the deal reads the newest few hundred back. user_id is the walker's primary id (player_links,
-- 0011), so linked sign-ins share one memory. card_id is the bank's raw card id (server-side only).
-- 0001–0012 are left as deployed.
create table if not exists trivia_recent (
  user_id   text not null,
  card_id   text not null,
  dealt_at  timestamptz not null default now(),
  primary key (user_id, card_id)
);
create index if not exists trivia_recent_user_dealt_idx on trivia_recent (user_id, dealt_at desc);
