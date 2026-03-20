create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'operator')),
  department_key text not null default 'intake_and_pasteurization',
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.departments (key, name)
values ('intake_and_pasteurization', 'INTAKE AND PASTEURIZATION')
on conflict (key) do nothing;

create table if not exists public.production_records (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  record_date date not null,
  offloading_shift text not null,
  pasteurization_shift text not null,
  offloading_operator text not null,
  pasteurization_operator text not null,
  total_milk_offloaded numeric(12,2) not null default 0,
  total_milk_pasteurized numeric(12,2) not null default 0,
  remarks text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.cip_records (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  record_date date not null,
  operator_name text not null,
  cip_type text not null,
  chemical_used text not null,
  caustic_jerrycans_used integer not null default 0,
  nitric_acid_jerrycans_used integer not null default 0,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.production_records enable row level security;
alter table public.cip_records enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "production_records_read_all_authenticated" on public.production_records
for select using (auth.role() = 'authenticated');

create policy "production_records_admin_write" on public.production_records
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "cip_records_read_all_authenticated" on public.cip_records
for select using (auth.role() = 'authenticated');

create policy "cip_records_admin_write" on public.cip_records
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
