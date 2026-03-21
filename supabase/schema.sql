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

create table if not exists public.operator_daily_entries (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  operator_profile_id uuid references public.profiles(id) on delete set null,
  operator_name text not null,
  entry_date date not null,
  month_key text not null,
  offloading_shift text not null,
  pasteurization_shift text not null,
  milk_offloaded numeric(12,2) not null default 0,
  milk_pasteurized numeric(12,2) not null default 0,
  milk_loss numeric(12,2) generated always as (milk_offloaded - milk_pasteurized) stored,
  loss_percentage numeric(12,4) generated always as (
    case when milk_offloaded = 0 then 0
    else ((milk_offloaded - milk_pasteurized) / milk_offloaded) * 100
    end
  ) stored,
  cip_done boolean not null default false,
  cip_type text,
  caustic_jerrycans_used integer not null default 0,
  nitric_jerrycans_used integer not null default 0,
  notes text,
  status text not null default 'saved' check (status in ('saved', 'pending', 'missing')),
  created_at timestamptz not null default now(),
  unique (department_id, operator_name, entry_date)
);

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
alter table public.operator_daily_entries enable row level security;
alter table public.production_records enable row level security;
alter table public.cip_records enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "operator_daily_entries_read_authenticated" on public.operator_daily_entries
for select using (auth.role() = 'authenticated');

create policy "operator_daily_entries_admin_write" on public.operator_daily_entries
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

create policy "operator_daily_entries_operator_update_own" on public.operator_daily_entries
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'operator' and p.full_name = operator_name
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'operator' and p.full_name = operator_name
  )
);

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
