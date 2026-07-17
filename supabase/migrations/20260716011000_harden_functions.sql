-- Fecha os apontamentos do linter de segurança do Supabase.
--
-- 1. search_path mutável: sem search_path fixo, quem controlar o search_path da
--    sessão consegue apontar `task_counters` para uma tabela própria e sequestrar
--    a função. Fixamos em '' e qualificamos tudo com o schema.
-- 2. handle_new_user é trigger, mas o PostgREST a expunha em /rest/v1/rpc/ para
--    anon e authenticated por ser SECURITY DEFINER. Revogamos o EXECUTE.

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- security definer: task_counters tem RLS sem policy, então o trigger rodando
-- como `authenticated` levava 42501 e nenhuma tarefa era criada. Só toca o
-- contador do new.user_id, e a linha em tasks já passou pela policy de insert.
create or replace function assign_task_key()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_seq int;
begin
  if new.key is not null and new.key <> '' then
    return new;
  end if;

  insert into public.task_counters (user_id, last_seq)
  values (new.user_id, 1)
  on conflict (user_id) do update set last_seq = public.task_counters.last_seq + 1
  returning last_seq into next_seq;

  new.key = 'AP-' || next_seq;
  return new;
end;
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function set_updated_at() from public, anon, authenticated;
revoke execute on function assign_task_key() from public, anon, authenticated;
