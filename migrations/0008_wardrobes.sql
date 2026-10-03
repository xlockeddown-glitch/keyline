-- Print shop wardrobe (0.0.45): one row per signed-in walker. Cosmetic coats and lantern skins they own,
-- matches paid so far toward items not yet owned, and what they wear. Purely visual — nothing here pays.
-- Writes are scoped to the verified session user; no public read. 0006/0007 are left as deployed.
create table if not exists wardrobes (
  user_id     text primary key,
  owned       jsonb not null default '[]'::jsonb,
  paid        jsonb not null default '{}'::jsonb,
  coat        text,
  lantern     text,
  equip_at    bigint not null default 0,
  updated_at  timestamptz not null default now()
);
