-- 双星学习岛：返回当前设备加入过的全部家庭，供前端明确选择主家庭。
-- 此补丁不修改、不合并、也不删除任何家庭或学习数据。

create or replace function public.get_my_families()
returns table (
  family_id uuid,
  family_name text,
  invite_code text,
  access_role text,
  revision bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select f.id, f.name, f.invite_code, m.access_role, s.revision
  from public.family_members m
  join public.families f on f.id = m.family_id
  join public.family_states s on s.family_id = f.id
  where m.user_id = (select auth.uid())
  order by m.joined_at desc;
$$;

revoke all on function public.get_my_families() from public;
grant execute on function public.get_my_families() to authenticated;
