-- Battery condition is selected by the customer and priced from admin-managed references.
insert into public.trade_in_cost_references(code,label,amount,category,selectable,sort_order)
values ('battery_good','Pil durumu iyi kesintisi',1000,'system',false,0)
on conflict (code) do nothing;

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
returns table(
  estimate numeric,
  estimate_min numeric,
  estimate_max numeric,
  confidence text,
  market_price numeric,
  margin_amount numeric,
  deductions numeric,
  pricing_region text
)
language plpgsql stable security definer set search_path=''
as $$
declare
  d public.trade_in_devices%rowtype;
  v_market numeric;
  v_margin numeric;
  v_deductions numeric := 0;
  v_raw numeric;
  v_costs jsonb;
  v_region text := lower(trim(coalesce(p_region,'')));
  v_battery text := lower(trim(coalesce(p_battery,'')));
  v_selected numeric;
begin
  select * into d from public.trade_in_devices where id=p_device_id and is_active=true;
  if not found then return; end if;

  select coalesce(jsonb_object_agg(code,amount),'{}'::jsonb) into v_costs
  from public.trade_in_cost_references where is_active=true;

  v_market := case
    when v_region in ('tr','tr cihazı','tr cihaz') then d.market_price_tr
    when v_region in ('passport','yurt dışı - kayıtlı','yurtdışı kayıtlı','yurt disi - kayitli') then d.market_price_passport
    when v_region in ('international','yurt dışı - kayıtsız','yurtdışı kayıtsız','yurt disi - kayitsiz') then d.market_price_international
    else d.market_price_tr end;
  v_margin := round(v_market*d.profit_margin_pct/100.0);

  v_deductions := v_deductions + case lower(trim(coalesce(p_screen,'')))
    when 'çatlak / kırık' then coalesce((v_costs->>'screen_replacement')::numeric,0)
    when 'derin çizik' then coalesce((v_costs->>'screen_deep_scratch')::numeric,0)
    else 0 end;
  v_deductions := v_deductions + case lower(trim(coalesce(p_body,'')))
    when 'hafif izler' then coalesce((v_costs->>'body_marks')::numeric,0)
    when 'çizik / ezik' then coalesce((v_costs->>'body_damage')::numeric,0)
    when 'hasarlı' then coalesce((v_costs->>'body_heavy_damage')::numeric,0)
    else 0 end;
  v_deductions := v_deductions + case lower(trim(coalesce(p_cosmetic,'')))
    when 'iyi' then coalesce((v_costs->>'cosmetic_good')::numeric,0)
    when 'orta' then coalesce((v_costs->>'cosmetic_medium')::numeric,0)
    when 'yıpranmış' then coalesce((v_costs->>'cosmetic_worn')::numeric,0)
    else 0 end;

  v_deductions := v_deductions + case v_battery
    when 'iyi' then coalesce((v_costs->>'battery_good')::numeric,0)
    when 'servis öneriliyor' then coalesce((v_costs->>'battery_replacement')::numeric,0)
    else 0 end;

  v_deductions := v_deductions + case lower(trim(coalesce(p_working,'')))
    when 'kısmi arızalı' then coalesce((v_costs->>'partial_fault')::numeric,0)
    when 'çalışmıyor' then coalesce((v_costs->>'not_working')::numeric,0)
    else 0 end;

  select amount into v_selected from public.trade_in_cost_references
  where code=p_repair_cost_code and is_active=true and selectable=true and category='repair';
  v_deductions := v_deductions + coalesce(v_selected,0);
  v_selected := null;
  select amount into v_selected from public.trade_in_cost_references
  where code=p_accessory_cost_code and is_active=true and selectable=true and category='accessory';
  v_deductions := v_deductions + coalesce(v_selected,0);

  v_raw := greatest(0,v_market-v_margin-v_deductions);
  estimate := round(v_raw/250)*250;
  estimate_min := greatest(0,round((estimate*0.95)/250)*250);
  estimate_max := greatest(estimate_min,round((estimate*1.05)/250)*250);
  confidence := case when p_cosmetic<>'' and p_working<>'' and p_screen<>'' and p_body<>'' and p_region<>'' and p_battery<>'' then 'yüksek' else 'orta' end;
  market_price:=v_market; margin_amount:=v_margin; deductions:=v_deductions; pricing_region:=v_region;
  return next;
end;
$$;

revoke all on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text,text) from public;
grant execute on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text,text) to anon,authenticated;
