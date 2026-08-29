create table public.technical_service_records (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (btrim(first_name) <> ''),
  last_name text not null check (btrim(last_name) <> ''),
  phone text not null check (btrim(phone) <> ''),
  damage_cost numeric(12,2) not null check (damage_cost >= 0),
  labor_cost numeric(12,2) not null check (labor_cost >= 0),
  amount_paid numeric(12,2) not null check (amount_paid >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.technical_service_records enable row level security;

revoke all on table public.technical_service_records from public, anon;
grant select, insert on table public.technical_service_records to authenticated;

create policy "Admins can view technical service records"
on public.technical_service_records
for select
to authenticated
using ((select private.is_admin()));

create policy "Admins can create technical service records"
on public.technical_service_records
for insert
to authenticated
with check (
  (select private.is_admin())
  and created_by = (select auth.uid())
);
