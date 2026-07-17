-- Otimizações apontadas pelo advisor de performance.
--
-- 1. auth_rls_initplan: `auth.uid() = user_id` reavalia auth.uid() por linha.
--    Envolvendo em (select auth.uid()), o Postgres reconhece como constante e
--    avalia uma vez por query — ganho grande em varreduras grandes.
-- 2. unindexed_foreign_keys: índices de cobertura nas FKs que faltavam.

-- Recria as 4 policies por tabela com o auth.uid() otimizado.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'profile_skills', 'experiences', 'education', 'certifications',
    'cv_files', 'applications', 'application_emails', 'skill_matches',
    'sprints', 'tasks', 'subtasks', 'task_tags', 'task_activity'
  ] loop
    execute format('drop policy if exists %1$I_select on %1$I', t);
    execute format('drop policy if exists %1$I_insert on %1$I', t);
    execute format('drop policy if exists %1$I_update on %1$I', t);
    execute format('drop policy if exists %1$I_delete on %1$I', t);

    execute format($f$
      create policy %1$I_select on %1$I for select to authenticated
        using ((select auth.uid()) = user_id);
      create policy %1$I_insert on %1$I for insert to authenticated
        with check ((select auth.uid()) = user_id);
      create policy %1$I_update on %1$I for update to authenticated
        using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
      create policy %1$I_delete on %1$I for delete to authenticated
        using ((select auth.uid()) = user_id);
    $f$, t);
  end loop;
end $$;

-- Índices de cobertura para as FKs sinalizadas.
create index if not exists application_emails_user_id_idx on application_emails (user_id);
create index if not exists skill_matches_user_id_idx      on skill_matches (user_id);
create index if not exists subtasks_user_id_idx           on subtasks (user_id);
create index if not exists task_activity_user_id_idx      on task_activity (user_id);
create index if not exists task_tags_user_id_idx          on task_tags (user_id);
create index if not exists tasks_application_id_idx        on tasks (application_id);
create index if not exists tasks_sprint_id_idx            on tasks (sprint_id);
