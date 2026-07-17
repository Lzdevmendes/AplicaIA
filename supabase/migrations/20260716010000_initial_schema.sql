-- AplicaAI — schema inicial.
-- Todas as tabelas são por usuário e isoladas por RLS (auth.uid() = user_id).

-- ---------------------------------------------------------------- enums

create type application_status as enum (
  'rascunho', 'enviada', 'em_processo', 'entrevista', 'oferta', 'sem_retorno'
);
create type task_status   as enum ('backlog', 'todo', 'doing', 'done');
create type task_color    as enum ('pine', 'amber', 'blue', 'plum', 'clay', 'slate');
create type task_priority as enum ('alta', 'media', 'baixa', 'feito');
create type skill_verdict as enum ('match', 'partial', 'miss');
create type activity_actor as enum ('user', 'ai');

-- ------------------------------------------------------- updated_at helper

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------- perfil

create table profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  headline    text,          -- "Desenvolvedor back-end · Pleno"
  summary     text,
  contract    text,          -- "PJ ou CLT"
  work_model  text,          -- "Remoto"
  salary_range text,         -- "R$ 12–15k"
  seniority   text,          -- "Pleno"
  github      text,
  linkedin    text,
  website     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create table profile_skills (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  skill    text not null,
  position int  not null default 0,
  unique (user_id, skill)
);
create index on profile_skills (user_id);

create table experiences (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  role     text not null,
  company  text,
  period   text,             -- "2022 — atual" (texto livre: o CV nem sempre traz datas parseáveis)
  note     text,
  position int not null default 0
);
create index on experiences (user_id);

create table education (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  course   text not null,
  school   text,
  period   text,
  position int not null default 0
);
create index on education (user_id);

create table certifications (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  name     text not null,
  issuer   text,             -- "Amazon Web Services · 2024"
  position int not null default 0
);
create index on certifications (user_id);

create table cv_files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  filename     text not null,
  size_bytes   bigint not null,
  is_current   boolean not null default true,
  created_at   timestamptz not null default now()
);
create index on cv_files (user_id);
-- Só um CV corrente por usuário (é o que vai anexado no e-mail).
create unique index cv_files_one_current on cv_files (user_id) where is_current;

-- ------------------------------------------------------- candidaturas

create table applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  company       text not null,
  role          text,
  source        text,               -- "LinkedIn", "Gupy", "indicação"
  contact_email text,
  status        application_status not null default 'rascunho',
  job_text      text,
  job_meta      jsonb not null default '{}'::jsonb,
  match_note    text,               -- resumo do match gerado pela IA
  applied_at    timestamptz,
  follow_up_at  timestamptz,
  responded_at  timestamptz,
  position      int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on applications (user_id, status);
create trigger applications_updated_at before update on applications
  for each row execute function set_updated_at();

create table application_emails (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  application_id   uuid not null references applications(id) on delete cascade,
  subject          text not null,
  body             text not null,
  sent_at          timestamptz,
  gmail_message_id text,
  created_at       timestamptz not null default now()
);
create index on application_emails (application_id);

create table skill_matches (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references applications(id) on delete cascade,
  skill          text not null,
  verdict        skill_verdict not null,
  position       int not null default 0
);
create index on skill_matches (application_id);

-- ------------------------------------------------------------ tarefas

create table sprints (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  name      text not null,          -- "Semana 27"
  starts_on date,
  ends_on   date
);
create index on sprints (user_id);

-- Sequência de chaves AP-NN por usuário.
create table task_counters (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  last_seq int not null default 0
);

create table tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  key            text not null,     -- "AP-31", preenchido pelo trigger
  title          text not null,
  status         task_status   not null default 'backlog',
  color          task_color    not null default 'slate',
  label          text,              -- "candidatura", "estudo", "follow-up"
  priority       task_priority not null default 'media',
  due_at         date,
  estimate       text,              -- "3h", "45min"
  sprint_id      uuid references sprints(id) on delete set null,
  description    text,
  application_id uuid references applications(id) on delete set null,
  position       int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, key)
);
create index on tasks (user_id, status);
create trigger tasks_updated_at before update on tasks
  for each row execute function set_updated_at();

-- Atribui AP-NN atomicamente. O upsert trava a linha do contador, então
-- inserts concorrentes do mesmo usuário serializam em vez de colidir na unique.
create or replace function assign_task_key()
returns trigger
language plpgsql
as $$
declare
  next_seq int;
begin
  if new.key is not null and new.key <> '' then
    return new;
  end if;

  insert into task_counters (user_id, last_seq)
  values (new.user_id, 1)
  on conflict (user_id) do update set last_seq = task_counters.last_seq + 1
  returning last_seq into next_seq;

  new.key = 'AP-' || next_seq;
  return new;
end;
$$;

create trigger tasks_assign_key before insert on tasks
  for each row execute function assign_task_key();

create table subtasks (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  task_id  uuid not null references tasks(id) on delete cascade,
  text     text not null,
  done     boolean not null default false,
  position int not null default 0
);
create index on subtasks (task_id);

create table task_tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  tag     text not null,
  unique (task_id, tag)
);
create index on task_tags (task_id);

create table task_activity (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  task_id    uuid not null references tasks(id) on delete cascade,
  actor      activity_actor not null default 'user',
  text       text not null,      -- "criou a tarefa", "moveu para Em progresso"
  created_at timestamptz not null default now()
);
create index on task_activity (task_id, created_at desc);

-- ------------------------------------------------------------- google

-- Sem policies de propósito: RLS ligada + zero policies = negado para anon e
-- authenticated. Só o service_role (server-side) enxerga o refresh token.
create table google_accounts (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  refresh_token text not null,
  scopes        text[] not null default '{}',
  connected_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger google_accounts_updated_at before update on google_accounts
  for each row execute function set_updated_at();

-- ------------------------------------------------------------- RLS

alter table profiles           enable row level security;
alter table profile_skills     enable row level security;
alter table experiences        enable row level security;
alter table education          enable row level security;
alter table certifications     enable row level security;
alter table cv_files           enable row level security;
alter table applications       enable row level security;
alter table application_emails enable row level security;
alter table skill_matches      enable row level security;
alter table sprints            enable row level security;
alter table tasks              enable row level security;
alter table task_counters      enable row level security;
alter table subtasks           enable row level security;
alter table task_tags          enable row level security;
alter table task_activity      enable row level security;
alter table google_accounts    enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'profile_skills', 'experiences', 'education', 'certifications',
    'cv_files', 'applications', 'application_emails', 'skill_matches',
    'sprints', 'tasks', 'subtasks', 'task_tags', 'task_activity'
  ] loop
    execute format($f$
      create policy %1$I_select on %1$I for select to authenticated
        using (auth.uid() = user_id);
      create policy %1$I_insert on %1$I for insert to authenticated
        with check (auth.uid() = user_id);
      create policy %1$I_update on %1$I for update to authenticated
        using (auth.uid() = user_id) with check (auth.uid() = user_id);
      create policy %1$I_delete on %1$I for delete to authenticated
        using (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- task_counters e google_accounts ficam sem policy: uso interno/server-side.

-- ----------------------------------------------------------- métricas

-- security_invoker faz a view respeitar a RLS de quem consulta, em vez de
-- rodar como dona. Sem isso a view vazaria dados entre usuários.
create view application_metrics
with (security_invoker = on)
as
select
  user_id,
  count(*) filter (
    where applied_at >= date_trunc('week', now())
  )::int as week_count,
  count(*) filter (where responded_at is not null)::int as responded_count,
  count(*) filter (where applied_at is not null)::int    as sent_count,
  round(
    100.0 * count(*) filter (where responded_at is not null)
    / nullif(count(*) filter (where applied_at is not null), 0)
  )::int as response_rate_pct,
  round(
    avg(extract(epoch from (responded_at - applied_at)) / 86400.0)
      filter (where responded_at is not null),
    1
  )::numeric as avg_response_days,
  count(*) filter (
    where status in ('enviada', 'em_processo', 'entrevista')
  )::int as in_process_count
from applications
group by user_id;

-- --------------------------------------------- perfil no primeiro login

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
