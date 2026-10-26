-- Migração compatível: formulário único "Registrar viagem"
-- Não recria tabelas; apenas adiciona o necessário.

-- Status de rascunho (idempotente em Postgres 15+)
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'trip_status' and e.enumlabel = 'rascunho'
  ) then
    alter type public.trip_status add value 'rascunho' before 'em_andamento';
  end if;
end $$;

alter table public.trips
  add column if not exists trip_date date,
  add column if not exists relato text;

-- Preenche trip_date a partir de started_at quando vazio
update public.trips
set trip_date = (started_at at time zone 'America/Sao_Paulo')::date
where trip_date is null;

alter table public.trips
  alter column km_start drop not null;

create table if not exists public.trip_attachments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  description text,
  file_path text,
  file_data_url text,
  proof_pending boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_request_id text unique,
  sync_state public.sync_state not null default 'sincronizado'
);

create index if not exists trip_attachments_trip_idx
  on public.trip_attachments (trip_id);

alter table public.trip_attachments enable row level security;

drop policy if exists trip_attachments_all on public.trip_attachments;
create policy trip_attachments_all on public.trip_attachments
  for all using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and (t.driver_id = auth.uid() or public.is_admin())
    )
  );
