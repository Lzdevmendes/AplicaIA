-- Troca o perfil inteiro numa transação só.
--
-- A versão anterior fazia delete das listas e depois insert a partir da
-- aplicação: um insert que falhasse no meio deixava o usuário sem perfil, sem
-- volta. Aqui tudo roda numa função, então ou entra tudo ou não entra nada.
--
-- security invoker (o padrão): a RLS de quem chama continua valendo, então
-- esta função não vira um buraco para escrever no perfil dos outros.

create or replace function replace_profile(p_profile jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'sem usuário autenticado';
  end if;

  insert into public.profiles (user_id, full_name, headline, seniority, summary)
  values (
    uid,
    nullif(p_profile ->> 'full_name', ''),
    nullif(p_profile ->> 'headline', ''),
    nullif(p_profile ->> 'seniority', ''),
    nullif(p_profile ->> 'summary', '')
  )
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    headline  = excluded.headline,
    seniority = excluded.seniority,
    summary   = excluded.summary;

  delete from public.profile_skills where user_id = uid;
  delete from public.experiences    where user_id = uid;
  delete from public.education      where user_id = uid;
  delete from public.certifications where user_id = uid;

  -- distinct on: o modelo às vezes repete uma skill, e a unique (user_id, skill)
  -- derrubaria o lote inteiro. O `order by skill, ord` não é decorativo — sem
  -- ele o Postgres escolhe uma duplicata qualquer, e a skill repetida pode
  -- parar no fim da lista em vez da posição em que apareceu primeiro.
  insert into public.profile_skills (user_id, skill, position)
  select distinct on (skill) uid, skill, ord
  from jsonb_array_elements_text(coalesce(p_profile -> 'skills', '[]'::jsonb))
       with ordinality as t(skill, ord)
  where skill <> ''
  order by skill, ord;

  insert into public.experiences (user_id, role, company, period, note, position)
  select
    uid,
    e ->> 'role',
    nullif(e ->> 'company', ''),
    nullif(e ->> 'period', ''),
    nullif(e ->> 'note', ''),
    ord
  from jsonb_array_elements(coalesce(p_profile -> 'experiences', '[]'::jsonb))
       with ordinality as t(e, ord)
  where coalesce(e ->> 'role', '') <> '';

  insert into public.education (user_id, course, school, period, position)
  select
    uid,
    e ->> 'course',
    nullif(e ->> 'school', ''),
    nullif(e ->> 'period', ''),
    ord
  from jsonb_array_elements(coalesce(p_profile -> 'education', '[]'::jsonb))
       with ordinality as t(e, ord)
  where coalesce(e ->> 'course', '') <> '';

  insert into public.certifications (user_id, name, issuer, position)
  select
    uid,
    c ->> 'name',
    nullif(c ->> 'issuer', ''),
    ord
  from jsonb_array_elements(coalesce(p_profile -> 'certifications', '[]'::jsonb))
       with ordinality as t(c, ord)
  where coalesce(c ->> 'name', '') <> '';
end;
$$;

revoke execute on function replace_profile(jsonb) from public, anon;
grant execute on function replace_profile(jsonb) to authenticated;
