-- Testes de isolamento por RLS.
--
-- Formaliza a verificação que garante que um usuário nunca vê, insere, altera
-- ou rouba dados de outro. Estoura (raise exception) no primeiro problema.
--
-- Rodar (local): psql "$DATABASE_URL" -f supabase/tests/rls_isolation.test.sql
-- Tudo roda numa transação e faz rollback no fim — não deixa rastro.

begin;

-- Dois usuários de teste (UUIDs fixos só deste script).
-- As colunas de token precisam ser '' (não NULL) senão o GoTrue quebra depois;
-- aqui não importam, mas mantemos a consistência.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_a@test.local', crypt('x', gen_salt('bf')), now(), now(), now(), '{}', '{}', '', '', '', ''),
  ('bbbbbbbb-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_b@test.local', crypt('x', gen_salt('bf')), now(), now(), now(), '{}', '{}', '', '', '', '');

-- ============================ como usuário A ============================
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

insert into applications (user_id, company, role, status)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Empresa A', 'Dev', 'rascunho');

insert into tasks (user_id, title) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Tarefa 1 do A'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Tarefa 2 do A');

do $$
begin
  -- O trigger deve ter atribuído AP-1 e AP-2 em sequência.
  if (select count(*) from tasks where key in ('AP-1','AP-2')) <> 2 then
    raise exception 'FALHA: trigger AP-NN não gerou as chaves esperadas';
  end if;
end $$;

-- ============================ como usuário B ============================
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}';

do $$
begin
  -- B não vê nada de A.
  if (select count(*) from applications) <> 0 then raise exception 'FALHA: B vê candidaturas de A'; end if;
  if (select count(*) from tasks) <> 0 then raise exception 'FALHA: B vê tarefas de A'; end if;
  if exists (select 1 from profiles where user_id = 'aaaaaaaa-0000-0000-0000-000000000001') then
    raise exception 'FALHA: B vê o perfil de A';
  end if;

  -- B não insere no nome de A.
  begin
    insert into tasks (user_id, title) values ('aaaaaaaa-0000-0000-0000-000000000001', 'forjada');
    raise exception 'FALHA: B inseriu no nome de A';
  exception when insufficient_privilege then null;
  end;

  -- B não rouba candidatura de A por update (não alcança nenhuma linha).
  update applications set user_id = 'bbbbbbbb-0000-0000-0000-000000000002';
  if (select count(*) from applications) <> 0 then
    raise exception 'FALHA: B roubou candidatura de A';
  end if;

  -- B tem a própria sequência de tarefas, independente da de A.
  insert into tasks (user_id, title) values ('bbbbbbbb-0000-0000-0000-000000000002', 'Tarefa do B');
  if (select key from tasks limit 1) <> 'AP-1' then
    raise exception 'FALHA: sequência de chaves de B não é independente';
  end if;
end $$;

-- ==================== rollback transacional do replace_profile ====================
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

-- Estado bom conhecido.
select replace_profile('{
  "full_name":"Estado Bom","headline":"Dev","seniority":"Pleno","summary":"resumo",
  "skills":["Python","Django"],
  "experiences":[{"role":"Dev","company":"Acme","period":"2020","note":"n"}],
  "education":[],"certifications":[]
}'::jsonb);

do $$
declare ok boolean := false;
begin
  -- skills como objeto: estoura DEPOIS dos deletes internos da função.
  begin
    perform replace_profile('{"full_name":"X","skills":{"nao":"array"},"experiences":[],"education":[],"certifications":[]}'::jsonb);
  exception when others then ok := true;
  end;
  if not ok then raise exception 'FALHA: replace_profile não estourou com input inválido'; end if;

  -- O perfil bom tem que estar intacto (rollback funcionou).
  if (select full_name from profiles where user_id='aaaaaaaa-0000-0000-0000-000000000001') <> 'Estado Bom' then
    raise exception 'FALHA: replace_profile não é atômico — perfil corrompido';
  end if;
  if (select count(*) from profile_skills) <> 2 then
    raise exception 'FALHA: skills do perfil bom foram perdidas no erro';
  end if;
end $$;

do $$ begin raise notice 'OK: todos os testes de RLS e integridade passaram'; end $$;

rollback;
