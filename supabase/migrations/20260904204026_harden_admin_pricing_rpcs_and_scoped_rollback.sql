revoke execute on function public.get_admin_variant_pricing(text,text,text,integer,integer) from public, anon;
revoke execute on function public.upsert_admin_variant_price(uuid,numeric,numeric,numeric,numeric) from public, anon;
revoke execute on function public.update_purchase_order_status(uuid,text,text,text) from public, anon;
grant execute on function public.get_admin_variant_pricing(text,text,text,integer,integer) to authenticated, service_role;
grant execute on function public.upsert_admin_variant_price(uuid,numeric,numeric,numeric,numeric) to authenticated, service_role;
grant execute on function public.update_purchase_order_status(uuid,text,text,text) to authenticated, service_role;

create or replace function public.rollback_scoped_price_adjustment(p_history_id uuid)
returns boolean
language plpgsql
set search_path to ''
as $function$
declare
  h public.pricing_scoped_bulk_history%rowtype;
  item jsonb;
  v_expected numeric;
  v_current numeric;
begin
  if not (select private.is_admin()) then raise exception 'admin access required'; end if;
  select * into h from public.pricing_scoped_bulk_history where id=p_history_id for update;
  if not found or h.rolled_back_at is not null then return false; end if;

  if 'product_price'=any(h.targets) then
    for item in select * from jsonb_array_elements(coalesce(h.snapshot->'products','[]'::jsonb)) loop
      v_expected := round((item->>'price')::numeric*(1+h.percentage/100.0),2);
      select price into v_current from public.products where id=(item->>'id')::uuid;
      if v_current is distinct from v_expected then raise exception 'ROLLBACK_CONFLICT: product % changed after bulk operation', item->>'id'; end if;
    end loop;
  end if;

  if 'trade_in_market'=any(h.targets) then
    for item in select * from jsonb_array_elements(coalesce(h.snapshot->'trade_in_devices','[]'::jsonb)) loop
      select market_price_tr into v_current from public.trade_in_devices where id=(item->>'id')::uuid;
      v_expected := round((item->>'tr')::numeric*(1+h.percentage/100.0),2);
      if v_current is distinct from v_expected then raise exception 'ROLLBACK_CONFLICT: trade-in device % changed after bulk operation', item->>'id'; end if;
    end loop;
  end if;

  if ('service_rules'=any(h.targets)) or ('trade_in_rules'=any(h.targets)) then
    for item in select * from jsonb_array_elements(coalesce(h.snapshot->'rules','[]'::jsonb)) loop
      if 'service_rules'=any(h.targets) then
        select service_pct into v_current from public.pricing_fault_rules where id=(item->>'id')::uuid;
        v_expected := round((item->>'service_pct')::numeric*(1+h.percentage/100.0),3);
        if v_current is distinct from v_expected then raise exception 'ROLLBACK_CONFLICT: service rule % changed after bulk operation', item->>'id'; end if;
      end if;
      if 'trade_in_rules'=any(h.targets) then
        select trade_in_pct into v_current from public.pricing_fault_rules where id=(item->>'id')::uuid;
        v_expected := round((item->>'trade_in_pct')::numeric*(1+h.percentage/100.0),3);
        if v_current is distinct from v_expected then raise exception 'ROLLBACK_CONFLICT: trade-in rule % changed after bulk operation', item->>'id'; end if;
      end if;
    end loop;
  end if;

  if 'overrides'=any(h.targets) then
    for item in select * from jsonb_array_elements(coalesce(h.snapshot->'overrides','[]'::jsonb)) loop
      if item->>'service_min_price' is not null then
        select service_min_price into v_current from public.pricing_overrides where id=(item->>'id')::uuid;
        v_expected := round((item->>'service_min_price')::numeric*(1+h.percentage/100.0),2);
        if v_current is distinct from v_expected then raise exception 'ROLLBACK_CONFLICT: override % changed after bulk operation', item->>'id'; end if;
      end if;
      if item->>'service_max_price' is not null then
        select service_max_price into v_current from public.pricing_overrides where id=(item->>'id')::uuid;
        v_expected := round((item->>'service_max_price')::numeric*(1+h.percentage/100.0),2);
        if v_current is distinct from v_expected then raise exception 'ROLLBACK_CONFLICT: override % changed after bulk operation', item->>'id'; end if;
      end if;
      if item->>'trade_in_deduction' is not null then
        select trade_in_deduction into v_current from public.pricing_overrides where id=(item->>'id')::uuid;
        v_expected := round((item->>'trade_in_deduction')::numeric*(1+h.percentage/100.0),2);
        if v_current is distinct from v_expected then raise exception 'ROLLBACK_CONFLICT: override % changed after bulk operation', item->>'id'; end if;
      end if;
    end loop;
  end if;

  for item in select * from jsonb_array_elements(coalesce(h.snapshot->'products','[]'::jsonb)) loop
    update public.products set price=nullif(item->>'price','')::numeric, updated_at=now() where id=(item->>'id')::uuid;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(h.snapshot->'trade_in_devices','[]'::jsonb)) loop
    update public.trade_in_devices set market_price_tr=(item->>'tr')::numeric, market_price_passport=(item->>'passport')::numeric, market_price_international=(item->>'international')::numeric, base_estimate=(item->>'base_estimate')::numeric, max_estimate=(item->>'max_estimate')::numeric, updated_at=now() where id=(item->>'id')::uuid;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(h.snapshot->'rules','[]'::jsonb)) loop
    update public.pricing_fault_rules set service_pct=(item->>'service_pct')::numeric, trade_in_pct=(item->>'trade_in_pct')::numeric, updated_at=now() where id=(item->>'id')::uuid;
  end loop;
  for item in select * from jsonb_array_elements(coalesce(h.snapshot->'overrides','[]'::jsonb)) loop
    update public.pricing_overrides set service_min_price=nullif(item->>'service_min_price','')::numeric, service_max_price=nullif(item->>'service_max_price','')::numeric, trade_in_deduction=nullif(item->>'trade_in_deduction','')::numeric, updated_at=now() where id=(item->>'id')::uuid;
  end loop;

  update public.pricing_scoped_bulk_history set rolled_back_at=now(), rolled_back_by=(select auth.uid()) where id=p_history_id;
  return true;
end;
$function$;
