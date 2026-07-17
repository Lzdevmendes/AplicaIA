-- Perfil editável: replace_profile passa a gravar os 10 campos escalares e a
-- respeitar semântica key-exists.
--
-- Regra: chave presente no JSON → grava (inclusive limpar para null via string
-- vazia); chave ausente → preserva o valor atual. Isso deixa os dois chamadores
-- controlarem o comportamento sem uma flag:
--   • edição manual envia todos os campos → grava tudo (inclusive limpar);
--   • parse do CV remove os escalares vazios antes de chamar → ausentes ficam
--     preservados (reprocessar um CV sem github não apaga o github manual).
--
-- Listas idem: só substitui skills/experiences/education/certifications se a
-- respectiva chave estiver presente no payload.

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

  -- A linha de profiles sempre existe (trigger no signup), então o caminho é o
  -- ON CONFLICT DO UPDATE; o case-expr aplica o key-exists por campo.
  insert into public.profiles (
    user_id, full_name, headline, seniority, summary,
    contract, work_model, salary_range, github, linkedin, website
  )
  values (
    uid,
    nullif(p_profile ->> 'full_name', ''),
    nullif(p_profile ->> 'headline', ''),
    nullif(p_profile ->> 'seniority', ''),
    nullif(p_profile ->> 'summary', ''),
    nullif(p_profile ->> 'contract', ''),
    nullif(p_profile ->> 'work_model', ''),
    nullif(p_profile ->> 'salary_range', ''),
    nullif(p_profile ->> 'github', ''),
    nullif(p_profile ->> 'linkedin', ''),
    nullif(p_profile ->> 'website', '')
  )
  on conflict (user_id) do update set
    full_name    = case when p_profile ? 'full_name'    then nullif(p_profile ->> 'full_name', '')    else public.profiles.full_name    end,
    headline     = case when p_profile ? 'headline'     then nullif(p_profile ->> 'headline', '')     else public.profiles.headline     end,
    seniority    = case when p_profile ? 'seniority'    then nullif(p_profile ->> 'seniority', '')    else public.profiles.seniority    end,
    summary      = case when p_profile ? 'summary'      then nullif(p_profile ->> 'summary', '')      else public.profiles.summary      end,
    contract     = case when p_profile ? 'contract'     then nullif(p_profile ->> 'contract', '')     else public.profiles.contract     end,
    work_model   = case when p_profile ? 'work_model'   then nullif(p_profile ->> 'work_model', '')   else public.profiles.work_model   end,
    salary_range = case when p_profile ? 'salary_range' then nullif(p_profile ->> 'salary_range', '') else public.profiles.salary_range end,
    github       = case when p_profile ? 'github'       then nullif(p_profile ->> 'github', '')       else public.profiles.github       end,
    linkedin     = case when p_profile ? 'linkedin'     then nullif(p_profile ->> 'linkedin', '')     else public.profiles.linkedin     end,
    website      = case when p_profile ? 'website'      then nullif(p_profile ->> 'website', '')      else public.profiles.website      end;

  if p_profile ? 'skills' then
    delete from public.profile_skills where user_id = uid;
    insert into public.profile_skills (user_id, skill, position)
    select distinct on (skill) uid, skill, ord
    from jsonb_array_elements_text(coalesce(p_profile -> 'skills', '[]'::jsonb))
         with ordinality as t(skill, ord)
    where skill <> ''
    order by skill, ord;
  end if;

  if p_profile ? 'experiences' then
    delete from public.experiences where user_id = uid;
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
  end if;

  if p_profile ? 'education' then
    delete from public.education where user_id = uid;
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
  end if;

  if p_profile ? 'certifications' then
    delete from public.certifications where user_id = uid;
    insert into public.certifications (user_id, name, issuer, position)
    select
      uid,
      c ->> 'name',
      nullif(c ->> 'issuer', ''),
      ord
    from jsonb_array_elements(coalesce(p_profile -> 'certifications', '[]'::jsonb))
         with ordinality as t(c, ord)
    where coalesce(c ->> 'name', '') <> '';
  end if;
end;
$$;

revoke execute on function replace_profile(jsonb) from public, anon;
grant execute on function replace_profile(jsonb) to authenticated;
