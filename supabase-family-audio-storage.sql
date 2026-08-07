-- 双星学习岛 · 家庭私有音频存储增量补丁
-- 适用于已执行基础 schema 的现有 Supabase 项目；可重复执行。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('family-audio', 'family-audio', false, 104857600, array['audio/mpeg', 'audio/mp3'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 对象固定存放为 <family-id>/assets/<asset-id>.mp3。
create or replace function public.has_family_audio_access(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members
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
    select 1
    from public.family_members
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
