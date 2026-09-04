create or replace function public.get_trade_in_catalog()
returns table(id uuid, device_type text, brand text, model text, storage text)
language sql
stable security definer
set search_path to ''
as $function$
  select d.id, d.device_type, d.brand, d.model, d.storage
  from public.trade_in_devices d
  where d.is_active = true
    and d.market_price_tr > 0
  order by d.device_type, d.brand, d.model, d.storage;
$function$;

revoke all on function public.get_trade_in_catalog() from public;
grant execute on function public.get_trade_in_catalog() to anon, authenticated;
