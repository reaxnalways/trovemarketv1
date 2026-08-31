alter table public.trade_in_devices
  add column if not exists usd_base_market_price_tr numeric check (usd_base_market_price_tr is null or usd_base_market_price_tr >= 0),
  add column if not exists usd_base_market_price_passport numeric check (usd_base_market_price_passport is null or usd_base_market_price_passport >= 0),
  add column if not exists usd_base_market_price_international numeric check (usd_base_market_price_international is null or usd_base_market_price_international >= 0),
  add column if not exists fx_index_enabled boolean not null default true;

alter table public.trade_in_cost_references
  add column if not exists usd_base_amount numeric check (usd_base_amount is null or usd_base_amount >= 0),
  add column if not exists fx_index_enabled boolean not null default true;

alter table public.service_price_references
  add column if not exists usd_base_min_price numeric check (usd_base_min_price is null or usd_base_min_price >= 0),
  add column if not exists usd_base_max_price numeric check (usd_base_max_price is null or usd_base_max_price >= 0),
  add column if not exists fx_index_enabled boolean not null default true;

alter table public.price_update_history
  add column if not exists product_count integer not null default 0 check (product_count >= 0),
  add column if not exists trade_in_device_count integer not null default 0 check (trade_in_device_count >= 0),
  add column if not exists cost_reference_count integer not null default 0 check (cost_reference_count >= 0),
  add column if not exists service_reference_count integer not null default 0 check (service_reference_count >= 0);

create or replace function public.bulk_reindex_all_prices(
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
  v_product_count integer := 0;
  v_trade_in_device_count integer := 0;
  v_cost_reference_count integer := 0;
  v_service_reference_count integer := 0;
  v_total_count integer := 0;
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
  where fx_index_enabled = true and price is not null;
  get diagnostics v_product_count = row_count;

  update public.trade_in_devices
  set
    usd_base_market_price_tr = coalesce(usd_base_market_price_tr, market_price_tr / p_base_rate),
    usd_base_market_price_passport = coalesce(usd_base_market_price_passport, market_price_passport / p_base_rate),
    usd_base_market_price_international = coalesce(usd_base_market_price_international, market_price_international / p_base_rate),
    market_price_tr = round((coalesce(usd_base_market_price_tr, market_price_tr / p_base_rate) * p_target_rate) / p_rounding_step) * p_rounding_step,
    market_price_passport = round((coalesce(usd_base_market_price_passport, market_price_passport / p_base_rate) * p_target_rate) / p_rounding_step) * p_rounding_step,
    market_price_international = round((coalesce(usd_base_market_price_international, market_price_international / p_base_rate) * p_target_rate) / p_rounding_step) * p_rounding_step,
    updated_at = now()
  where fx_index_enabled = true;
  get diagnostics v_trade_in_device_count = row_count;

  update public.trade_in_cost_references
  set
    usd_base_amount = coalesce(usd_base_amount, amount / p_base_rate),
    amount = round((coalesce(usd_base_amount, amount / p_base_rate) * p_target_rate) / p_rounding_step) * p_rounding_step,
    updated_at = now()
  where fx_index_enabled = true;
  get diagnostics v_cost_reference_count = row_count;

  update public.service_price_references
  set
    usd_base_min_price = coalesce(usd_base_min_price, min_price / p_base_rate),
    usd_base_max_price = coalesce(usd_base_max_price, max_price / p_base_rate),
    min_price = round((coalesce(usd_base_min_price, min_price / p_base_rate) * p_target_rate) / p_rounding_step) * p_rounding_step,
    max_price = round((coalesce(usd_base_max_price, max_price / p_base_rate) * p_target_rate) / p_rounding_step) * p_rounding_step,
    updated_at = now()
  where fx_index_enabled = true;
  get diagnostics v_service_reference_count = row_count;

  v_total_count := v_product_count + v_trade_in_device_count + v_cost_reference_count + v_service_reference_count;

  update public.site_settings
  set usd_try_rate = p_target_rate,
      fx_rounding_step = p_rounding_step,
      updated_at = now()
  where id = true;

  insert into public.price_update_history(
    base_rate, target_rate, rounding_step, affected_count, changed_by,
    product_count, trade_in_device_count, cost_reference_count, service_reference_count
  ) values (
    p_base_rate, p_target_rate, p_rounding_step, v_total_count, (select auth.uid()),
    v_product_count, v_trade_in_device_count, v_cost_reference_count, v_service_reference_count
  );

  return v_total_count;
end;
$$;

revoke execute on function public.bulk_reindex_all_prices(numeric,numeric,integer) from public, anon;
grant execute on function public.bulk_reindex_all_prices(numeric,numeric,integer) to authenticated;
