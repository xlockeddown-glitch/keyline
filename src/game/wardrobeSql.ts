/**
 * The wardrobe upsert (0.0.45), kept apart from the server function so a test can run it on PGLite.
 * Params: $1 user_id, $2 owned (json text), $3 paid (json text), $4 coat, $5 lantern, $6 equip_at.
 * The conflict clause unions ownership in SQL too, so two devices syncing at once can't drop a purchase.
 */
export const WARDROBE_UPSERT = `
  insert into wardrobes (user_id, owned, paid, coat, lantern, equip_at, updated_at)
  values ($1, $2::jsonb, $3::jsonb, $4, $5, $6, now())
  on conflict (user_id) do update set
    owned = (
      select coalesce(jsonb_agg(distinct x order by x), '[]'::jsonb)
      from jsonb_array_elements_text(wardrobes.owned || excluded.owned) as t(x)
    ),
    paid = excluded.paid,
    coat = excluded.coat,
    lantern = excluded.lantern,
    equip_at = excluded.equip_at,
    updated_at = now()
`;
