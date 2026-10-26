-- Transportadora Braulio — viagens, entregas e despesas

create extension if not exists "pgcrypto";

create type public.app_role as enum ('motorista', 'admin');
create type public.trip_status as enum (
  'em_andamento',
  'aguardando_conferencia',
  'precisa_correcao',
  'concluida'
);
create type public.delivery_status as enum ('pendente', 'entregue', 'ocorrencia');
create type public.expense_category as enum (
  'combustivel',
  'pedagio',
  'estacionamento',
  'manutencao',
  'outros'
);
create type public.expense_review as enum ('pendente', 'aprovada', 'rejeitada');
create type public.sync_state as enum ('local', 'enviando', 'sincronizado', 'erro');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  matricula text unique,
  role public.app_role not null default 'motorista',
  telefone text,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  model text not null,
  year text,
  driver_id uuid references public.profiles (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles (id),
  vehicle_id uuid not null references public.vehicles (id),
  status public.trip_status not null default 'em_andamento',
  started_at timestamptz not null,
  ended_at timestamptz,
  km_start numeric(12, 1) not null,
  km_end numeric(12, 1),
  distance_km numeric(12, 1),
  correction_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sync_state public.sync_state not null default 'sincronizado'
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  client_id uuid references public.clients (id),
  client_name text not null,
  address text not null,
  order_ref text,
  notes text,
  status public.delivery_status not null default 'pendente',
  occurrence_reason text,
  proof_path text,
  proof_required boolean not null default true,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sync_state public.sync_state not null default 'sincronizado'
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  category public.expense_category not null,
  amount numeric(12, 2) not null check (amount >= 0),
  expense_date date not null default current_date,
  notes text,
  proof_path text,
  proof_pending boolean not null default false,
  review_status public.expense_review not null default 'pendente',
  review_notes text,
  liters numeric(12, 2),
  price_per_liter numeric(12, 3),
  odometer numeric(12, 1),
  station_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_request_id text unique,
  sync_state public.sync_state not null default 'sincronizado'
);

create table public.trip_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index trips_driver_idx on public.trips (driver_id, started_at desc);
create index deliveries_trip_idx on public.deliveries (trip_id);
create index expenses_trip_idx on public.expenses (trip_id);
create index vehicles_driver_idx on public.vehicles (driver_id);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.clients enable row level security;
alter table public.trips enable row level security;
alter table public.deliveries enable row level security;
alter table public.expenses enable row level security;
alter table public.trip_events enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create policy profiles_select_own_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy vehicles_select on public.vehicles
  for select using (driver_id = auth.uid() or public.is_admin());
create policy vehicles_write_admin on public.vehicles
  for all using (public.is_admin());

create policy clients_select on public.clients
  for select using (true);
create policy clients_insert on public.clients
  for insert with check (auth.uid() is not null);

create policy trips_select on public.trips
  for select using (driver_id = auth.uid() or public.is_admin());
create policy trips_insert on public.trips
  for insert with check (driver_id = auth.uid() or public.is_admin());
create policy trips_update on public.trips
  for update using (driver_id = auth.uid() or public.is_admin());

create policy deliveries_all on public.deliveries
  for all using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and (t.driver_id = auth.uid() or public.is_admin())
    )
  );

create policy expenses_all on public.expenses
  for all using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and (t.driver_id = auth.uid() or public.is_admin())
    )
  );

create policy events_select on public.trip_events
  for select using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and (t.driver_id = auth.uid() or public.is_admin())
    )
  );
create policy events_insert on public.trip_events
  for insert with check (auth.uid() is not null);

insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', false)
on conflict (id) do nothing;
