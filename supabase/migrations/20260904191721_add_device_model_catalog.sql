create table if not exists public.device_model_catalog (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  sub_category text not null default '',
  device_type text not null,
  brand text not null,
  model text not null,
  storage_options text[] not null default '{}'::text[],
  color_options text[] not null default '{}'::text[],
  reference_price_tr numeric null check (reference_price_tr is null or reference_price_tr >= 0),
  price_status text not null default 'unpriced' check (price_status in ('unpriced','reference','verified','review')),
  source_url text,
  source_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, sub_category, brand, model)
);

alter table public.device_model_catalog enable row level security;
revoke all on public.device_model_catalog from anon, authenticated;
grant select, insert, update, delete on public.device_model_catalog to authenticated;

drop policy if exists "Admins can read device model catalog" on public.device_model_catalog;
create policy "Admins can read device model catalog"
on public.device_model_catalog for select
to authenticated
using ((select private.is_admin()));

drop policy if exists "Admins can create device model catalog" on public.device_model_catalog;
create policy "Admins can create device model catalog"
on public.device_model_catalog for insert
to authenticated
with check ((select private.is_admin()));

drop policy if exists "Admins can update device model catalog" on public.device_model_catalog;
create policy "Admins can update device model catalog"
on public.device_model_catalog for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Admins can delete device model catalog" on public.device_model_catalog;
create policy "Admins can delete device model catalog"
on public.device_model_catalog for delete
to authenticated
using ((select private.is_admin()));

alter table public.trade_in_devices
  add column if not exists catalog_id uuid null references public.device_model_catalog(id) on delete set null;

create index if not exists trade_in_devices_catalog_id_idx on public.trade_in_devices(catalog_id);
create index if not exists device_model_catalog_lookup_idx on public.device_model_catalog(device_type, brand, model);
create index if not exists device_model_catalog_active_idx on public.device_model_catalog(is_active, category, brand);
