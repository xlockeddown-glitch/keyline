-- Daily Lantern Run (0.0.44): one run per walker per city per UTC day (was one per day across all cities).
-- Widens the primary key from (day, user_id) to (day, user_id, city). Every existing row stays valid:
-- rows that were unique on (day, user_id) are unique on (day, user_id, city) too. 0006 is left as deployed.
do $$
declare
  pk text;
begin
  select conname into pk
  from pg_constraint
  where conrelid = 'daily_runs'::regclass and contype = 'p';
  if pk is not null then
    execute format('alter table daily_runs drop constraint %I', pk);
  end if;
end
$$;

alter table daily_runs add constraint daily_runs_pkey primary key (day, user_id, city);

-- The open-run lookup when a lamp lights: this walker's unfinished run in this city.
create index if not exists daily_runs_open_idx
  on daily_runs (user_id, city, started_at desc)
  where time_ms is null and not voided;
