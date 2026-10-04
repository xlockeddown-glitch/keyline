-- 0.0.55 data fix: Ryan's three standings rows are one walker (confirmed by Ryan, 2026-10-03). His phone's X sign-ins
-- arrived as new identities and made two extra users. Scoped to exactly these three user ids; does nothing unless
-- the primary user exists. 0001–0011 are left as deployed.
--   primary  MXKB6aZ6GGtB7qQ7jPKiqTnI6FKx1MYH  (the long-standing account)
--   aliases  4JE6EuA7cNIr4G2NpZYnxImNXSb4Lxye, RQMn6dCPkYymhhtf0LexrZ02Ij0lzbDn

-- 1. One standings row: fold both aliases into the primary (player_links, 0011).
insert into player_links (alias_id, primary_id, how)
select a.id, 'MXKB6aZ6GGtB7qQ7jPKiqTnI6FKx1MYH', 'admin'
from (values ('4JE6EuA7cNIr4G2NpZYnxImNXSb4Lxye'), ('RQMn6dCPkYymhhtf0LexrZ02Ij0lzbDn')) as a (id)
where exists (select 1 from "user" where id = 'MXKB6aZ6GGtB7qQ7jPKiqTnI6FKx1MYH')
on conflict (alias_id) do nothing;

-- 2. Sign in as the primary from now on: move the aliases' sign-in identities (their X / Grok-app account rows) onto
--    the primary. Better Auth looks a returning sign-in up by (providerId, accountId) first, so the next X sign-in
--    with either of those identities resolves to the primary. Identities the primary already has are left alone.
update account
set "userId" = 'MXKB6aZ6GGtB7qQ7jPKiqTnI6FKx1MYH', "updatedAt" = now()
where "userId" in ('4JE6EuA7cNIr4G2NpZYnxImNXSb4Lxye', 'RQMn6dCPkYymhhtf0LexrZ02Ij0lzbDn')
  and exists (select 1 from "user" where id = 'MXKB6aZ6GGtB7qQ7jPKiqTnI6FKx1MYH')
  and not exists (
    select 1 from account p
    where p."userId" = 'MXKB6aZ6GGtB7qQ7jPKiqTnI6FKx1MYH'
      and p."providerId" = account."providerId"
      and p."accountId" = account."accountId"
  );

-- 3. End the aliases' open sessions so the phone stops acting as an alias (it signs in again as the primary).
delete from session
where "userId" in ('4JE6EuA7cNIr4G2NpZYnxImNXSb4Lxye', 'RQMn6dCPkYymhhtf0LexrZ02Ij0lzbDn')
  and exists (select 1 from "user" where id = 'MXKB6aZ6GGtB7qQ7jPKiqTnI6FKx1MYH');

-- The alias user rows and their raw scores stay (nothing is deleted); the views fold them into the primary's row.
