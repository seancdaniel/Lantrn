-- ===========================================================================
-- Close a hole in the profile read policy.
--
-- 0001 allowed `id = auth.uid() or leaderboard_visible or is_admin()`. Because
-- leaderboard_visible defaults to true, that middle clause made every profile
-- row world-readable to anyone holding the publishable key — which is in every
-- visitor's browser. Real names and the role column were both exposed.
--
-- Nothing needed that access. The leaderboard reads the `leaderboard` view,
-- which is security_invoker = off and therefore aggregates the underlying rows
-- as its owner. The view exposes a handle and totals; the table behind it does
-- not need to expose anything.
--
-- A profile row is now readable by its owner and by admins, full stop.
-- ===========================================================================

drop policy if exists profiles_read on public.profiles;

create policy profiles_read on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- The view also handed out each member's auth user id, which the interface
-- never uses. Ranking needs a handle and a number, so that is all it returns.
--
-- Dropped rather than replaced: `create or replace view` cannot change a view's
-- column list, and this removes one.
drop view if exists public.leaderboard;

create view public.leaderboard
with (security_invoker = off) as
select
  p.handle,
  p.steps_per_mile,
  coalesce(sum(a.steps), 0)::bigint as lifetime_steps,
  coalesce(sum(a.steps) filter (where a.date > current_date - 7), 0)::bigint  as weekly_steps,
  coalesce(sum(a.steps) filter (where a.date > current_date - 30), 0)::bigint as monthly_steps,
  count(distinct a.date) filter (where a.steps > 0)::integer as walking_days,
  (select count(*) from public.encounters e where e.user_id = p.id)::integer as encounters_logged
from public.profiles p
left join public.activities a on a.user_id = p.id
where p.leaderboard_visible
group by p.id, p.handle, p.steps_per_mile;

grant select on public.leaderboard to anon, authenticated;
