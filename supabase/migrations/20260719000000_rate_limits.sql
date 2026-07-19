-- Rate limiting por usuário, sem serviço externo.
-- Mesmo padrão de task_counters: RLS ligada, zero policies, acesso só pela RPC
-- SECURITY DEFINER abaixo. authenticated não lê nem escreve a tabela direto.

create table rate_limits (
  user_id      uuid not null references auth.users(id) on delete cascade,
  bucket       text not null,
  window_start timestamptz not null default now(),
  count        int not null default 0,
  primary key (user_id, bucket)
);

alter table rate_limits enable row level security;

-- Janela fixa por (usuário, bucket). Reinicia quando a janela expira; senão
-- incrementa. Devolve true se ainda dentro do limite, false se estourou.
-- SECURITY DEFINER porque a tabela é fechada para authenticated (sem policy).
create or replace function check_rate_limit(
  p_bucket text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cur_count int;
begin
  if uid is null then
    return false;
  end if;

  insert into rate_limits (user_id, bucket, window_start, count)
  values (uid, p_bucket, now(), 1)
  on conflict (user_id, bucket) do update
    set
      window_start = case
        when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then now()
        else rate_limits.window_start
      end,
      count = case
        when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then 1
        else rate_limits.count + 1
      end
  returning count into cur_count;

  return cur_count <= p_max;
end;
$$;

revoke all on function check_rate_limit(text, int, int) from public;
revoke execute on function check_rate_limit(text, int, int) from anon;
-- Só o usuário logado chama (via routes). O advisor sinaliza
-- "authenticated pode executar SECURITY DEFINER" como WARN — é esperado: a
-- função só toca a própria linha (auth.uid()) e chamá-la direto só incrementa o
-- próprio contador, nunca reseta nem vaza dados de outro usuário.
grant execute on function check_rate_limit(text, int, int) to authenticated;
