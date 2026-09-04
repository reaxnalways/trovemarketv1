insert into public.pricing_fault_rules (label, trade_in_cost_code, trade_in_pct, min_trade_in_deduction, is_active, sort_order)
select 'Hafif ekran çizikleri', 'screen_light_scratch', 3, 300, true, 15
where not exists (select 1 from public.pricing_fault_rules where trade_in_cost_code='screen_light_scratch');

create or replace function public.estimate_trade_in(
  p_device_id uuid,
  p_region text,
  p_cosmetic text,
  p_working text,
  p_screen text default '',
  p_body text default '',
  p_battery text default '',
  p_repair_cost_code text default '',
  p_accessory_cost_code text default ''
)
returns table(estimate numeric, estimate_min numeric, estimate_max numeric, confidence text, market_price numeric, margin_amount numeric, deductions numeric, pricing_region text)
language plpgsql
stable security definer
set search_path to ''
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
begin
  select * into d from public.trade_in_devices where id=p_device_id and is_active=true;
  if not found then return; end if;
  v_ref:=d.market_price_tr;
  v_market:=case when v_region in ('tr','tr cihazı','tr cihaz') then d.market_price_tr when v_region in ('passport','yurt dışı - kayıtlı','yurtdışı kayıtlı','yurt disi - kayitli') then d.market_price_passport when v_region in ('international','yurt dışı - kayıtsız','yurtdışı kayıtsız','yurt disi - kayitsiz') then d.market_price_international else d.market_price_tr end;
  v_margin:=round(v_market*d.profit_margin_pct/100.0);
  v_deductions:=v_deductions+case lower(trim(coalesce(p_screen,''))) when 'hafif çizik' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'screen_light_scratch',v_ref) when 'derin çizik' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'screen_deep_scratch',v_ref) when 'çatlak / kırık' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'screen_replacement',v_ref) else 0 end;
  v_deductions:=v_deductions+case lower(trim(coalesce(p_body,''))) when 'hafif izler' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'body_marks',v_ref) when 'çizik / ezik' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'body_damage',v_ref) when 'hasarlı' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'body_heavy_damage',v_ref) else 0 end;
  v_deductions:=v_deductions+case lower(trim(coalesce(p_cosmetic,''))) when 'iyi' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'cosmetic_good',v_ref) when 'orta' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'cosmetic_medium',v_ref) when 'yıpranmış' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'cosmetic_worn',v_ref) else 0 end;
  v_deductions:=v_deductions+case v_battery_label when 'iyi' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'battery_good',v_ref) when 'servis öneriliyor' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'battery_replacement',v_ref) else 0 end;
  v_deductions:=v_deductions+case lower(trim(coalesce(p_working,''))) when 'kısmi arızalı' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'partial_fault',v_ref) when 'çalışmıyor' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'not_working',v_ref) else 0 end;
  select amount into v_selected from public.trade_in_cost_references where code=p_repair_cost_code and is_active=true and selectable=true and category='repair'; v_deductions:=v_deductions+coalesce(v_selected,0); v_selected:=null;
  select amount into v_selected from public.trade_in_cost_references where code=p_accessory_cost_code and is_active=true and selectable=true and category='accessory'; v_deductions:=v_deductions+coalesce(v_selected,0);
  v_raw:=greatest(0,v_market-v_margin-v_deductions);
  estimate:=round(v_raw/250)*250;
  estimate_min:=greatest(0,round((estimate*0.95)/250)*250);
  estimate_max:=greatest(estimate_min,round((estimate*1.05)/250)*250);
  confidence:=case when p_cosmetic<>'' and p_working<>'' and p_screen<>'' and p_body<>'' and p_region<>'' then 'yüksek' else 'orta' end;
  market_price:=v_market; margin_amount:=v_margin; deductions:=v_deductions; pricing_region:=v_region;
  return next;
end;
$$;
