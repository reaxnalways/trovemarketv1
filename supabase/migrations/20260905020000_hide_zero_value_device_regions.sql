drop function if exists public.get_trade_in_catalog();
create function public.get_trade_in_catalog()
returns table(
  id uuid,
  device_type text,
  brand text,
  model text,
  storage text,
  color text,
  has_tr boolean,
  has_passport boolean,
  has_international boolean
)
language sql
stable
security definer
set search_path=''
as $$
  select
    d.id,
    d.device_type,
    d.brand,
    d.model,
    d.storage,
    d.color,
    coalesce(d.market_price_tr,0) > 0 as has_tr,
    coalesce(d.market_price_passport,0) > 0 as has_passport,
    coalesce(d.market_price_international,0) > 0 as has_international
  from public.trade_in_devices d
  where d.is_active=true
    and coalesce(d.market_price_tr,0) > 0
    and d.catalog_variant_id is not null
  order by d.device_type,d.brand,d.model,d.storage,d.color;
$$;
revoke all on function public.get_trade_in_catalog() from public;
grant execute on function public.get_trade_in_catalog() to anon, authenticated;

create or replace function public.estimate_trade_in(p_device_id uuid, p_region text, p_cosmetic text, p_working text, p_screen text default ''::text, p_body text default ''::text, p_battery text default ''::text, p_repair_cost_code text default ''::text, p_accessory_cost_code text default ''::text, p_fault_codes text default ''::text)
returns table(estimate numeric, estimate_min numeric, estimate_max numeric, confidence text, market_price numeric, margin_amount numeric, deductions numeric, pricing_region text)
language plpgsql
stable security definer
set search_path=''
as $$
declare
  d public.trade_in_devices%rowtype;
  v_market numeric;
  v_margin numeric;
  v_deductions numeric:=0;
  v_raw numeric;
  v_region text:=lower(trim(coalesce(p_region,'')));
  v_selected numeric;
  v_ref numeric;
  v_battery_label text:=lower(trim(coalesce(p_battery,'')));
  v_code text;
begin
  select * into d from public.trade_in_devices where id=p_device_id and is_active=true;
  if not found then return; end if;
  v_ref:=d.market_price_tr;
  v_market:=case
    when v_region in ('tr','tr cihazı','tr cihaz') then d.market_price_tr
    when v_region in ('passport','yurt dışı - kayıtlı','yurtdışı kayıtlı','yurt disi - kayitli') then d.market_price_passport
    when v_region in ('international','yurt dışı - kayıtsız','yurtdışı kayıtsız','yurt disi - kayitsiz') then d.market_price_international
    else d.market_price_tr end;
  if coalesce(v_market,0) <= 0 then return; end if;
  v_margin:=round(v_market*d.profit_margin_pct/100.0);

  v_deductions:=v_deductions+case lower(trim(coalesce(p_screen,'')))
    when 'hafif çizik' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'screen_light_scratch',v_ref)
    when 'derin çizik' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'screen_deep_scratch',v_ref)
    when 'çatlak / kırık' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'screen_replacement',v_ref)
    else 0 end;
  v_deductions:=v_deductions+case lower(trim(coalesce(p_body,'')))
    when 'hafif izler' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'body_marks',v_ref)
    when 'çizik / ezik' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'body_damage',v_ref)
    when 'hasarlı' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'body_heavy_damage',v_ref)
    else 0 end;
  v_deductions:=v_deductions+case v_battery_label
    when 'iyi' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'battery_good',v_ref)
    when 'servis öneriliyor' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'battery_replacement',v_ref)
    else 0 end;

  select amount into v_selected from public.trade_in_cost_references where code=p_repair_cost_code and is_active=true and selectable=true and category='repair';
  v_deductions:=v_deductions+coalesce(v_selected,0);

  foreach v_code in array string_to_array(coalesce(p_accessory_cost_code,''),',') loop
    v_code:=trim(v_code);
    if v_code<>'' then
      select amount into v_selected from public.trade_in_cost_references where code=v_code and is_active=true and selectable=true and category='accessory';
      v_deductions:=v_deductions+coalesce(v_selected,0);
      v_selected:=null;
    end if;
  end loop;

  foreach v_code in array string_to_array(coalesce(p_fault_codes,''),',') loop
    v_code:=trim(v_code);
    if v_code<>'' then
      v_deductions:=v_deductions+private.trade_in_deduction_for(d.device_type,d.brand,d.model,v_code,v_ref);
    end if;
  end loop;

  v_raw:=greatest(0,v_market-v_margin-v_deductions);
  estimate:=round(v_raw/250)*250;
  estimate_min:=greatest(0,round((estimate*0.95)/250)*250);
  estimate_max:=greatest(estimate_min,round((estimate*1.05)/250)*250);
  confidence:='yüksek';
  market_price:=v_market;
  margin_amount:=v_margin;
  deductions:=v_deductions;
  pricing_region:=v_region;
  return next;
end;
$$;
