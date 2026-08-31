alter table public.products
  add column if not exists usd_base_price numeric check (usd_base_price is null or usd_base_price >= 0),
  add column if not exists fx_index_enabled boolean not null default true;

alter table public.site_settings
  add column if not exists usd_try_rate numeric check (usd_try_rate is null or usd_try_rate > 0),
  add column if not exists fx_rounding_step integer not null default 100 check (fx_rounding_step in (1,10,50,100,500,1000));

create table if not exists public.price_update_history (
  id uuid primary key default gen_random_uuid(),
  base_rate numeric not null check (base_rate > 0),
  target_rate numeric not null check (target_rate > 0),
  rounding_step integer not null check (rounding_step in (1,10,50,100,500,1000)),
  affected_count integer not null default 0 check (affected_count >= 0),
  changed_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.price_update_history enable row level security;

grant select, insert on table public.price_update_history to authenticated;

create policy "Admins can view price update history"
on public.price_update_history
for select
to authenticated
using ((select private.is_admin()));

create policy "Admins can insert price update history"
on public.price_update_history
for insert
to authenticated
with check ((select private.is_admin()) and changed_by = (select auth.uid()));

create or replace function public.bulk_reindex_product_prices(
  p_base_rate numeric,
  p_target_rate numeric,
  p_rounding_step integer default 100
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer := 0;
begin
  if not (select private.is_admin()) then
    raise exception 'admin access required';
  end if;

  if p_base_rate is null or p_base_rate <= 0 then
    raise exception 'base rate must be greater than zero';
  end if;

  if p_target_rate is null or p_target_rate <= 0 then
    raise exception 'target rate must be greater than zero';
  end if;

  if p_rounding_step not in (1,10,50,100,500,1000) then
    raise exception 'invalid rounding step';
  end if;

  update public.products
  set
    usd_base_price = coalesce(usd_base_price, price / p_base_rate),
    price = round((coalesce(usd_base_price, price / p_base_rate) * p_target_rate) / p_rounding_step) * p_rounding_step,
    updated_at = now()
  where fx_index_enabled = true
    and price is not null;

  get diagnostics v_count = row_count;

  update public.site_settings
  set usd_try_rate = p_target_rate,
      fx_rounding_step = p_rounding_step,
      updated_at = now()
  where id = true;

  insert into public.price_update_history(base_rate, target_rate, rounding_step, affected_count, changed_by)
  values (p_base_rate, p_target_rate, p_rounding_step, v_count, (select auth.uid()));

  return v_count;
end;
$$;

revoke execute on function public.bulk_reindex_product_prices(numeric,numeric,integer) from public, anon;
grant execute on function public.bulk_reindex_product_prices(numeric,numeric,integer) to authenticated;
