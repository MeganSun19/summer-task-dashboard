-- 双星学习岛 · Supabase 第一阶段云端同步
-- 在 Supabase Dashboard > SQL Editor 中整段执行。

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique check (invite_code ~ '^[A-F0-9]{8}$'),
  parent_pin_hash text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_role text not null default 'device' check (access_role in ('owner', 'device')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

-- 可选的家庭别名层：误建的历史家庭可永久指向一个主家庭；历史状态仍保留。
create table if not exists public.family_redirects (
  source_family_id uuid primary key references public.families(id) on delete restrict,
  target_family_id uuid not null references public.families(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (source_family_id <> target_family_id)
);

-- 迁移阶段的云端事实来源。state 保持和现有 localStorage 相同的数据形状，
-- 后续可在不影响前端的情况下拆分为任务、完成记录、奖励等细粒度表。
create table if not exists public.family_states (
  family_id uuid primary key references public.families(id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create index if not exists family_members_user_id_idx
  on public.family_members(user_id);

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_redirects enable row level security;
alter table public.family_states enable row level security;

create or replace function public.has_family_access(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members
    where family_id = target_family_id
      and user_id = (select auth.uid())
  );
$$;

revoke all on function public.has_family_access(uuid) from public;
grant execute on function public.has_family_access(uuid) to authenticated;

drop policy if exists "Members can read their family" on public.families;
create policy "Members can read their family"
  on public.families for select
  to authenticated
  using (public.has_family_access(id));

drop policy if exists "Members can read family membership" on public.family_members;
create policy "Members can read family membership"
  on public.family_members for select
  to authenticated
  using (public.has_family_access(family_id));

drop policy if exists "Members can read family state" on public.family_states;
create policy "Members can read family state"
  on public.family_states for select
  to authenticated
  using (public.has_family_access(family_id));

-- 写入统一经过 RPC，以便校验成员身份并使用 revision 避免静默覆盖。
create or replace function public.create_family(
  family_name text,
  parent_pin text,
  initial_state jsonb
)
returns table (family_id uuid, invite_code text, revision bigint)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  new_family_id uuid;
  new_invite_code text;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if char_length(trim(family_name)) not between 1 and 40 then
    raise exception 'INVALID_FAMILY_NAME';
  end if;
  if parent_pin !~ '^[0-9]{4,8}$' then
    raise exception 'INVALID_PIN';
  end if;
  if jsonb_typeof(initial_state) <> 'object' then
    raise exception 'INVALID_STATE';
  end if;

  loop
    new_invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.families where families.invite_code = new_invite_code
    );
  end loop;

  insert into public.families (name, invite_code, parent_pin_hash, created_by)
  values (trim(family_name), new_invite_code, crypt(parent_pin, gen_salt('bf')), current_user_id)
  returning id into new_family_id;

  insert into public.family_members (family_id, user_id, access_role)
  values (new_family_id, current_user_id, 'owner');

  insert into public.family_states (family_id, state, revision, updated_by)
  values (new_family_id, initial_state, 1, current_user_id);

  return query select new_family_id, new_invite_code, 1::bigint;
end;
$$;

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
  -- RETURNS TABLE 也声明了名为 family_id 的输出变量。使用约束名可以避免
  -- PL/pgSQL 将 ON CONFLICT 中的 family_id 解析为不明确引用（SQLSTATE 42702）。
  on conflict on constraint family_members_pkey do nothing;

  select family_states.revision into state_revision
  from public.family_states
  where family_states.family_id = effective_family.id;

  return query
    select effective_family.id, effective_family.name, effective_family.invite_code, state_revision;
end;
$$;

create or replace function public.save_family_state(
  target_family_id uuid,
  next_state jsonb,
  expected_revision bigint default null
)
returns table (revision bigint, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not public.has_family_access(target_family_id) then
    raise exception 'ACCESS_DENIED';
  end if;
  if jsonb_typeof(next_state) <> 'object' then
    raise exception 'INVALID_STATE';
  end if;

  return query
    update public.family_states
    set state = next_state,
        revision = family_states.revision + 1,
        updated_by = current_user_id,
        updated_at = now()
    where family_id = target_family_id
      and (expected_revision is null or family_states.revision = expected_revision)
    returning family_states.revision, family_states.updated_at;

  if not found then
    raise exception 'SYNC_CONFLICT';
  end if;
end;
$$;

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

revoke all on function public.create_family(text, text, jsonb) from public;
revoke all on function public.join_family(text, text) from public;
revoke all on function public.save_family_state(uuid, jsonb, bigint) from public;
revoke all on function public.get_my_families() from public;
grant execute on function public.create_family(text, text, jsonb) to authenticated;
grant execute on function public.join_family(text, text) to authenticated;
grant execute on function public.save_family_state(uuid, jsonb, bigint) to authenticated;
grant execute on function public.get_my_families() to authenticated;

-- 允许 Supabase Realtime 推送家庭状态变更；RLS 仍决定谁能收到行。
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'family_states'
  ) then
    alter publication supabase_realtime add table public.family_states;
  end if;
end $$;

-- 家庭私有 Oxford 音频。家庭成员可读取，只有 owner 设备可上传或删除。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('family-audio', 'family-audio', false, 104857600, array['audio/mpeg', 'audio/mp3'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.has_family_audio_access(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where family_members.user_id = (select auth.uid())
      and family_members.family_id::text = split_part(object_name, '/', 1)
  );
$$;

create or replace function public.can_manage_family_audio(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where family_members.user_id = (select auth.uid())
      and family_members.access_role = 'owner'
      and family_members.family_id::text = split_part(object_name, '/', 1)
  );
$$;

revoke all on function public.has_family_audio_access(text) from public;
revoke all on function public.can_manage_family_audio(text) from public;
grant execute on function public.has_family_audio_access(text) to authenticated;
grant execute on function public.can_manage_family_audio(text) to authenticated;

drop policy if exists "Family members can read family audio" on storage.objects;
create policy "Family members can read family audio"
  on storage.objects for select to authenticated
  using (bucket_id = 'family-audio' and public.has_family_audio_access(name));

drop policy if exists "Family owners can upload family audio" on storage.objects;
create policy "Family owners can upload family audio"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'family-audio' and public.can_manage_family_audio(name));

drop policy if exists "Family owners can update family audio" on storage.objects;
create policy "Family owners can update family audio"
  on storage.objects for update to authenticated
  using (bucket_id = 'family-audio' and public.can_manage_family_audio(name))
  with check (bucket_id = 'family-audio' and public.can_manage_family_audio(name));

drop policy if exists "Family owners can delete family audio" on storage.objects;
create policy "Family owners can delete family audio"
  on storage.objects for delete to authenticated
  using (bucket_id = 'family-audio' and public.can_manage_family_audio(name));
