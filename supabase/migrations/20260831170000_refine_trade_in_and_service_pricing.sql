-- Extend trade-in reference costs so admin-created selectable items can feed the pricing engine.
alter table public.trade_in_cost_references
  add column if not exists category text not null default 'system',
  add column if not exists selectable boolean not null default false,
  add column if not exists sort_order integer not null default 0;

update public.trade_in_cost_references
set category = 'repair', selectable = true, sort_order = 10
where code = 'previous_repair';
update public.trade_in_cost_references
set category = 'accessory', selectable = true, sort_order = 10
where code = 'missing_accessories';

insert into public.trade_in_cost_references(code,label,amount,category,selectable,sort_order)
values
  ('repair_none','Onarım / değişen yok',0,'repair',true,0),
  ('accessories_complete','Kutu ve aksesuar tam',0,'accessory',true,0)
on conflict (code) do nothing;

create or replace function public.get_trade_in_selectable_costs()
returns table(code text,label text,amount numeric,category text,sort_order integer)
language sql stable security definer set search_path=''
as $$
  select c.code,c.label,c.amount,c.category,c.sort_order
  from public.trade_in_cost_references c
  where c.is_active=true and c.selectable=true and c.category in ('repair','accessory')
  order by c.category,c.sort_order,c.label;
$$;

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
  v_battery numeric;
  v_raw numeric;
  v_costs jsonb;
  v_region text := lower(trim(coalesce(p_region,'')));
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

  begin
    v_battery := nullif(regexp_replace(coalesce(p_battery,''),'[^0-9.]','','g'),'')::numeric;
  exception when others then v_battery := null;
  end;
  if v_battery is not null and v_battery < 80 then
    v_deductions := v_deductions + coalesce((v_costs->>'battery_replacement')::numeric,0);
  end if;
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
  confidence := case when p_cosmetic<>'' and p_working<>'' and p_screen<>'' and p_body<>'' and p_region<>'' then 'yüksek' else 'orta' end;
  market_price:=v_market; margin_amount:=v_margin; deductions:=v_deductions; pricing_region:=v_region;
  return next;
end;
$$;

revoke all on function public.get_trade_in_selectable_costs() from public;
revoke all on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text,text) from public;
grant execute on function public.get_trade_in_selectable_costs() to anon,authenticated;
grant execute on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text,text) to anon,authenticated;

-- Service prices: optional brand/model scopes. Empty brand/model means a general fallback.
alter table public.service_price_references
  add column if not exists brand text not null default '',
  add column if not exists model text not null default '';

alter table public.service_price_references
  drop constraint if exists service_price_references_device_type_fault_code_key;
create unique index if not exists service_price_references_scope_fault_uidx
  on public.service_price_references(device_type,brand,model,fault_code);

create or replace function public.get_service_price_catalog()
returns table(id uuid,device_type text,brand text,model text,fault_code text,fault_label text,min_price numeric,max_price numeric)
language sql stable security definer set search_path=''
as $$
 select r.id,r.device_type,r.brand,r.model,r.fault_code,r.fault_label,r.min_price,r.max_price
 from public.service_price_references r where r.is_active=true
 order by r.device_type,r.brand,r.model,r.sort_order,r.fault_label;
$$;

create or replace function public.estimate_service_price(
  p_device_type text,
  p_brand text,
  p_model text,
  p_fault_codes text[]
)
returns table(estimate_min numeric,estimate_max numeric)
language sql stable security definer set search_path=''
as $$
  with candidates as (
    select r.*,
      case
        when lower(r.brand)=lower(coalesce(p_brand,'')) and lower(r.model)=lower(coalesce(p_model,'')) then 3
        when lower(r.brand)=lower(coalesce(p_brand,'')) and r.model='' then 2
        when r.brand='' and r.model='' then 1
        else 0
      end as specificity
    from public.service_price_references r
    where r.is_active=true
      and r.device_type=p_device_type
      and r.fault_code=any(p_fault_codes)
      and (r.brand='' or lower(r.brand)=lower(coalesce(p_brand,'')))
      and (r.model='' or lower(r.model)=lower(coalesce(p_model,'')))
  ), ranked as (
    select c.*,row_number() over(partition by c.fault_code order by c.specificity desc,c.updated_at desc) as rn
    from candidates c where c.specificity>0
  )
  select coalesce(sum(min_price),0),coalesce(sum(max_price),0) from ranked where rn=1;
$$;

revoke all on function public.estimate_service_price(text,text,text,text[]) from public;
grant execute on function public.estimate_service_price(text,text,text,text[]) to anon,authenticated;
