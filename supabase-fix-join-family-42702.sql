-- 修复第二台设备加入家庭时的 SQLSTATE 42702：family_id 引用不明确。
-- 在 Supabase SQL Editor 中完整执行本文件即可；不会修改或删除现有家庭数据。

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

  insert into public.family_members (family_id, user_id, access_role)
  values (matched_family.id, current_user_id, 'device')
  on conflict on constraint family_members_pkey do nothing;

  select family_states.revision into state_revision
  from public.family_states
  where family_states.family_id = matched_family.id;

  return query
    select matched_family.id, matched_family.name, matched_family.invite_code, state_revision;
end;
$$;

revoke all on function public.join_family(text, text) from public;
grant execute on function public.join_family(text, text) to authenticated;
