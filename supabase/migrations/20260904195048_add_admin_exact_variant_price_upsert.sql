create or replace function public.upsert_admin_variant_price(p_variant_id uuid,p_market_price_tr numeric,p_market_price_passport numeric default 0,p_market_price_international numeric default 0,p_profit_margin_pct numeric default 15)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare v public.device_model_variants%rowtype; c public.device_model_catalog%rowtype; result_id uuid;
begin
 if not private.is_admin() then raise exception 'not authorized'; end if;
 if p_market_price_tr is null or p_market_price_tr <= 0 then raise exception 'TR price must be positive'; end if;
 if p_market_price_passport < 0 or p_market_price_international < 0 then raise exception 'prices cannot be negative'; end if;
 if p_profit_margin_pct < 0 or p_profit_margin_pct > 60 then raise exception 'invalid margin'; end if;
 select * into v from public.device_model_variants where id=p_variant_id and is_active=true;
 if not found then raise exception 'variant not found'; end if;
 select * into c from public.device_model_catalog where id=v.catalog_id and is_active=true;
 if not found then raise exception 'catalog not found'; end if;
 insert into public.trade_in_devices(device_type,brand,model,storage,color,catalog_id,catalog_variant_id,base_estimate,min_estimate,max_estimate,market_price_tr,market_price_passport,market_price_international,profit_margin_pct,is_active,updated_at)
 values(c.device_type,c.brand,c.model,v.storage,v.color,c.id,v.id,p_market_price_tr,0,greatest(p_market_price_tr,p_market_price_passport,p_market_price_international),p_market_price_tr,p_market_price_passport,p_market_price_international,p_profit_margin_pct,true,now())
 on conflict (catalog_variant_id) where catalog_variant_id is not null do update set
  device_type=excluded.device_type,brand=excluded.brand,model=excluded.model,storage=excluded.storage,color=excluded.color,catalog_id=excluded.catalog_id,
  base_estimate=excluded.base_estimate,max_estimate=excluded.max_estimate,market_price_tr=excluded.market_price_tr,market_price_passport=excluded.market_price_passport,
  market_price_international=excluded.market_price_international,profit_margin_pct=excluded.profit_margin_pct,is_active=true,updated_at=now()
 returning id into result_id;
 return result_id;
end;
$$;
revoke all on function public.upsert_admin_variant_price(uuid,numeric,numeric,numeric,numeric) from public;
grant execute on function public.upsert_admin_variant_price(uuid,numeric,numeric,numeric,numeric) to authenticated;
