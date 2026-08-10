-- 清理误把某一天古诗标题固定到长期课程设置中的历史字段。
-- 只删除 poem 的 title/instruction 覆盖；enabled、版本、任务完成与每日内容均保留。

do $$
declare
  target_family_id uuid;
  repaired_state jsonb;
  repaired_releases jsonb;
  repaired_tasks jsonb;
  kid text;
begin
  select f.id, s.state into target_family_id, repaired_state
  from public.families f
  join public.family_states s on s.family_id = f.id
  where f.invite_code = '67690F58'
  for update of s;

  if target_family_id is null then raise exception 'TARGET_FAMILY_NOT_FOUND'; end if;

  repaired_state := repaired_state
    #- '{taskSettings,brother,poem,title}'
    #- '{taskSettings,brother,poem,instruction}'
    #- '{taskSettings,younger,poem,title}'
    #- '{taskSettings,younger,poem,instruction}'
    #- '{coursePlans,drafts,brother,settings,poem,title}'
    #- '{coursePlans,drafts,brother,settings,poem,instruction}'
    #- '{coursePlans,drafts,younger,settings,poem,title}'
    #- '{coursePlans,drafts,younger,settings,poem,instruction}';

  select jsonb_agg(
    release.value
      #- '{settings,poem,title}'
      #- '{settings,poem,instruction}'
    order by ordinality
  ) into repaired_releases
  from jsonb_array_elements(coalesce(repaired_state #> '{coursePlans,releases}', '[]'::jsonb))
    with ordinality release(value, ordinality);

  repaired_state := jsonb_set(
    repaired_state,
    '{coursePlans,releases}',
    coalesce(repaired_releases, '[]'::jsonb),
    false
  );

  -- 当天正文、标签和步骤已经是第11周复习，仅解除错误标题覆盖；完成状态原样保留。
  foreach kid in array array['brother', 'younger'] loop
    select jsonb_agg(
      case when task.value ->> 'id' = 'poem'
        and task.value #>> '{metadata,week}' = '11'
        and task.value #>> '{metadata,type}' = '复习'
        then task.value || jsonb_build_object('title', '古诗背诵 · 第11周复习')
        else task.value end
      order by task.ordinality
    ) into repaired_tasks
    from jsonb_array_elements(repaired_state #> array['days', kid, '2026-08-10', 'tasks'])
      with ordinality task(value, ordinality);

    repaired_state := jsonb_set(
      repaired_state,
      array['days', kid, '2026-08-10', 'tasks'],
      repaired_tasks,
      false
    );
  end loop;
  repaired_state := jsonb_set(repaired_state, '{dynamicContentSettingsVersion}', '1'::jsonb, true);

  update public.family_states
  set state = repaired_state,
      revision = revision + 1,
      updated_at = now()
  where family_id = target_family_id;
end
$$;
