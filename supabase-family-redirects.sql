-- 双星学习岛：把误建的历史家庭永久收口到唯一主家庭。
-- 历史 family_states 不删除；设备成员被补充到主家庭，旧邀请码只作为入口别名。

create table if not exists public.family_redirects (
  source_family_id uuid primary key references public.families(id) on delete restrict,
  target_family_id uuid not null references public.families(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (source_family_id <> target_family_id)
);

alter table public.family_redirects enable row level security;

-- 先让旧家庭的匿名设备都成为主家庭成员，避免重定向后被 RLS 拒绝。
insert into public.family_members (family_id, user_id, access_role)
select target.id, member.user_id, 'device'
from public.family_members member
join public.families source on source.id = member.family_id
cross join lateral (
  select id from public.families where invite_code = '67690F58'
) target
where source.invite_code in ('AB37C1F7', 'BF332977')
on conflict on constraint family_members_pkey do nothing;

insert into public.family_redirects (source_family_id, target_family_id)
select source.id, target.id
from public.families source
cross join lateral (
  select id from public.families where invite_code = '67690F58'
) target
where source.invite_code in ('AB37C1F7', 'BF332977')
on conflict (source_family_id) do update
set target_family_id = excluded.target_family_id;

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
  select distinct f.id, f.name, f.invite_code, effective_member.access_role, s.revision
  from public.family_members origin_member
  left join public.family_redirects redirect
    on redirect.source_family_id = origin_member.family_id
  join public.families f
    on f.id = coalesce(redirect.target_family_id, origin_member.family_id)
  join public.family_members effective_member
    on effective_member.family_id = f.id
   and effective_member.user_id = origin_member.user_id
  join public.family_states s on s.family_id = f.id
  where origin_member.user_id = (select auth.uid());
$$;

revoke all on function public.get_my_families() from public;
grant execute on function public.get_my_families() to authenticated;

create or replace function public.join_family(
  supplied_invite_code text,
  parent_pin text
)
returns table (family_id uuid, family_name text, invite_code text, revision bigint)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  matched_family public.families%rowtype;
  effective_family public.families%rowtype;
  state_revision bigint;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into matched_family
  from public.families
  where families.invite_code = upper(trim(supplied_invite_code));

  if matched_family.id is null
     or crypt(parent_pin, matched_family.parent_pin_hash) <> matched_family.parent_pin_hash then
    raise exception 'INVALID_INVITE_OR_PIN';
  end if;

  select target.* into effective_family
  from public.family_redirects redirect
  join public.families target on target.id = redirect.target_family_id
  where redirect.source_family_id = matched_family.id;
  if effective_family.id is null then
    effective_family := matched_family;
  end if;

  insert into public.family_members (family_id, user_id, access_role)
  values (effective_family.id, current_user_id, 'device')
  on conflict on constraint family_members_pkey do nothing;

  select family_states.revision into state_revision
  from public.family_states
  where family_states.family_id = effective_family.id;

  return query
    select effective_family.id, effective_family.name, effective_family.invite_code, state_revision;
end;
$$;

revoke all on function public.join_family(text, text) from public;
grant execute on function public.join_family(text, text) to authenticated;
