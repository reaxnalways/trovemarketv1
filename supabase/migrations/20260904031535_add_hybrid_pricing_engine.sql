create table if not exists public.pricing_fault_rules (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  service_fault_code text,
  trade_in_cost_code text,
  service_pct numeric(7,3) not null default 0 check (service_pct >= 0 and service_pct <= 500),
  trade_in_pct numeric(7,3) not null default 0 check (trade_in_pct >= 0 and trade_in_pct <= 500),
  min_service_price numeric(12,2) check (min_service_price is null or min_service_price >= 0),
  max_service_price numeric(12,2) check (max_service_price is null or max_service_price >= 0),
  min_trade_in_deduction numeric(12,2) check (min_trade_in_deduction is null or min_trade_in_deduction >= 0),
  max_trade_in_deduction numeric(12,2) check (max_trade_in_deduction is null or max_trade_in_deduction >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (coalesce(service_fault_code,'') <> '' or coalesce(trade_in_cost_code,'') <> '')
);
create unique index if not exists pricing_fault_rules_service_uidx on public.pricing_fault_rules(service_fault_code) where service_fault_code is not null;
create unique index if not exists pricing_fault_rules_trade_uidx on public.pricing_fault_rules(trade_in_cost_code) where trade_in_cost_code is not null;

create table if not exists public.pricing_segment_rules (
  code text primary key,
  label text not null,
  multiplier numeric(7,3) not null default 1 check (multiplier > 0 and multiplier <= 5),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_overrides (
  id uuid primary key default gen_random_uuid(),
  device_type text not null,
  brand text not null,
  model text not null,
  service_fault_code text,
  trade_in_cost_code text,
  service_min_price numeric(12,2) check (service_min_price is null or service_min_price >= 0),
  service_max_price numeric(12,2) check (service_max_price is null or service_max_price >= 0),
  trade_in_deduction numeric(12,2) check (trade_in_deduction is null or trade_in_deduction >= 0),
  exclude_from_bulk boolean not null default true,
  is_active boolean not null default true,
  note text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (coalesce(service_fault_code,'') <> '' or coalesce(trade_in_cost_code,'') <> ''),
  check (service_max_price is null or service_min_price is null or service_max_price >= service_min_price)
);
create unique index if not exists pricing_overrides_scope_uidx on public.pricing_overrides(device_type,brand,model,coalesce(service_fault_code,''),coalesce(trade_in_cost_code,''));

create table if not exists public.pricing_bulk_history (
  id uuid primary key default gen_random_uuid(),
  target text not null check (target in ('all','service','trade_in')),
  percentage numeric(8,3) not null,
  include_overrides boolean not null default false,
  rule_count integer not null default 0,
  override_count integer not null default 0,
  snapshot jsonb not null default '{}'::jsonb,
  changed_by uuid,
  created_at timestamptz not null default now(),
  rolled_back_at timestamptz,
  rolled_back_by uuid
);

alter table public.pricing_fault_rules enable row level security;
alter table public.pricing_segment_rules enable row level security;
alter table public.pricing_overrides enable row level security;
alter table public.pricing_bulk_history enable row level security;

grant select,insert,update,delete on public.pricing_fault_rules to authenticated;
grant select,insert,update,delete on public.pricing_segment_rules to authenticated;
grant select,insert,update,delete on public.pricing_overrides to authenticated;
grant select on public.pricing_bulk_history to authenticated;

create policy "Admins manage pricing fault rules" on public.pricing_fault_rules for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "Admins manage pricing segment rules" on public.pricing_segment_rules for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "Admins manage pricing overrides" on public.pricing_overrides for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "Admins read pricing bulk history" on public.pricing_bulk_history for select to authenticated using (private.is_admin());

insert into public.pricing_segment_rules(code,label,multiplier,sort_order) values
 ('compact','Compact / SE / Mini',0.88,10),
 ('standard','Standart',1.00,20),
 ('plus','Plus / Max',1.12,30),
 ('pro','Pro',1.20,40),
 ('pro_max','Pro Max',1.35,50),
 ('ultra_fold','Ultra / Fold',1.38,60)
on conflict(code) do nothing;

insert into public.pricing_fault_rules(label,service_fault_code,trade_in_cost_code,service_pct,trade_in_pct,min_service_price,min_trade_in_deduction,sort_order) values
 ('Ekran değişimi','screen','screen_replacement',28,25,2500,2500,10),
 ('Derin ekran çizikleri',null,'screen_deep_scratch',0,8,null,750,20),
 ('Batarya değişimi','battery','battery_replacement',8,7,1200,1000,30),
 ('Dokunmatik','touch',null,22,0,1800,null,40),
 ('Kamera','camera',null,15,0,1500,null,50),
 ('Şarj soketi','charge',null,8,0,1000,null,60),
 ('Güç / kısmi arıza','power','partial_fault',12,12,1500,1500,70),
 ('Çalışmayan cihaz',null,'not_working',0,35,null,3500,80),
 ('Sıvı teması','liquid',null,16,0,1800,null,90),
 ('Hoparlör / mikrofon','audio',null,7,0,900,null,100),
 ('Kasa hafif izler',null,'body_marks',0,3,null,500,110),
 ('Kasa çizik / ezik',null,'body_damage',0,10,null,1000,120),
 ('Kasa ağır hasar',null,'body_heavy_damage',0,20,null,2000,130),
 ('İyi kozmetik',null,'cosmetic_good',0,2,null,250,140),
 ('Orta kozmetik',null,'cosmetic_medium',0,5,null,500,150),
 ('Yıpranmış kozmetik',null,'cosmetic_worn',0,10,null,1000,160)
on conflict do nothing;

create or replace function private.pricing_segment_code(p_model text)
returns text language sql stable set search_path='' as $$
 select case
   when lower(coalesce(p_model,'')) like '%pro max%' then 'pro_max'
   when lower(coalesce(p_model,'')) like '%ultra%' or lower(coalesce(p_model,'')) like '%fold%' then 'ultra_fold'
   when lower(coalesce(p_model,'')) like '% pro%' then 'pro'
   when lower(coalesce(p_model,'')) like '%plus%' or lower(coalesce(p_model,'')) like '% max%' then 'plus'
   when lower(coalesce(p_model,'')) like '%mini%' or lower(coalesce(p_model,'')) like '% se%' then 'compact'
   else 'standard' end;
$$;

create or replace function private.pricing_segment_multiplier(p_model text)
returns numeric language sql stable set search_path='' as $$
 select coalesce((select s.multiplier from public.pricing_segment_rules s where s.code=private.pricing_segment_code(p_model)),1);
$$;

create or replace function private.device_reference_price(p_device_type text,p_brand text,p_model text)
returns numeric language sql stable set search_path='' as $$
 select avg(d.market_price_tr)
 from public.trade_in_devices d
 where d.is_active=true
   and lower(d.device_type)=lower(coalesce(p_device_type,''))
   and lower(d.brand)=lower(coalesce(p_brand,''))
   and lower(d.model)=lower(coalesce(p_model,''));
$$;

create or replace function private.trade_in_deduction_for(p_device_type text,p_brand text,p_model text,p_cost_code text,p_reference numeric)
returns numeric language plpgsql stable set search_path='' as $$
declare v_override numeric; v_rule public.pricing_fault_rules%rowtype; v_value numeric; v_fallback numeric; v_multiplier numeric;
begin
 select o.trade_in_deduction into v_override from public.pricing_overrides o where o.is_active=true and lower(o.device_type)=lower(coalesce(p_device_type,'')) and lower(o.brand)=lower(coalesce(p_brand,'')) and lower(o.model)=lower(coalesce(p_model,'')) and o.trade_in_cost_code=p_cost_code order by o.updated_at desc limit 1;
 if v_override is not null then return v_override; end if;
 select * into v_rule from public.pricing_fault_rules r where r.is_active=true and r.trade_in_cost_code=p_cost_code limit 1;
 if found and coalesce(v_rule.trade_in_pct,0)>0 and p_reference is not null and p_reference>0 then
   v_multiplier:=private.pricing_segment_multiplier(p_model);
   v_value:=round((p_reference*v_rule.trade_in_pct/100.0*v_multiplier)/50)*50;
   if v_rule.min_trade_in_deduction is not null then v_value:=greatest(v_value,v_rule.min_trade_in_deduction); end if;
   if v_rule.max_trade_in_deduction is not null then v_value:=least(v_value,v_rule.max_trade_in_deduction); end if;
   return greatest(0,v_value);
 end if;
 select c.amount into v_fallback from public.trade_in_cost_references c where c.code=p_cost_code and c.is_active=true;
 return coalesce(v_fallback,0);
end;
$$;

create or replace function public.estimate_service_price(p_device_type text,p_brand text,p_model text,p_fault_codes text[])
returns table(estimate_min numeric,estimate_max numeric)
language sql stable security definer set search_path='' as $$
 with requested as (select unnest(p_fault_codes) fault_code), ref as (select private.device_reference_price(p_device_type,p_brand,p_model) value, private.pricing_segment_multiplier(p_model) segment), calculated as (
  select q.fault_code,
   coalesce((select o.service_min_price from public.pricing_overrides o where o.is_active=true and lower(o.device_type)=lower(coalesce(p_device_type,'')) and lower(o.brand)=lower(coalesce(p_brand,'')) and lower(o.model)=lower(coalesce(p_model,'')) and o.service_fault_code=q.fault_code order by o.updated_at desc limit 1),(select greatest(coalesce(r.min_service_price,0),round(((ref.value*r.service_pct/100.0*ref.segment)*0.90)/100)*100) from public.pricing_fault_rules r,ref where r.is_active=true and r.service_fault_code=q.fault_code and r.service_pct>0 and ref.value is not null limit 1),(select r.min_price from public.service_price_references r where r.is_active=true and r.device_type=p_device_type and r.fault_code=q.fault_code and (r.brand='' or lower(r.brand)=lower(coalesce(p_brand,''))) and (r.model='' or lower(r.model)=lower(coalesce(p_model,''))) order by case when lower(r.brand)=lower(coalesce(p_brand,'')) and lower(r.model)=lower(coalesce(p_model,'')) then 3 when lower(r.brand)=lower(coalesce(p_brand,'')) and r.model='' then 2 when r.brand='' and r.model='' then 1 else 0 end desc,r.updated_at desc limit 1),0) min_value,
   coalesce((select o.service_max_price from public.pricing_overrides o where o.is_active=true and lower(o.device_type)=lower(coalesce(p_device_type,'')) and lower(o.brand)=lower(coalesce(p_brand,'')) and lower(o.model)=lower(coalesce(p_model,'')) and o.service_fault_code=q.fault_code order by o.updated_at desc limit 1),(select case when r.max_service_price is null then round(((ref.value*r.service_pct/100.0*ref.segment)*1.10)/100)*100 else least(r.max_service_price,round(((ref.value*r.service_pct/100.0*ref.segment)*1.10)/100)*100) end from public.pricing_fault_rules r,ref where r.is_active=true and r.service_fault_code=q.fault_code and r.service_pct>0 and ref.value is not null limit 1),(select r.max_price from public.service_price_references r where r.is_active=true and r.device_type=p_device_type and r.fault_code=q.fault_code and (r.brand='' or lower(r.brand)=lower(coalesce(p_brand,''))) and (r.model='' or lower(r.model)=lower(coalesce(p_model,''))) order by case when lower(r.brand)=lower(coalesce(p_brand,'')) and lower(r.model)=lower(coalesce(p_model,'')) then 3 when lower(r.brand)=lower(coalesce(p_brand,'')) and r.model='' then 2 when r.brand='' and r.model='' then 1 else 0 end desc,r.updated_at desc limit 1),0) max_value
  from requested q)
 select coalesce(sum(min_value),0),coalesce(sum(greatest(max_value,min_value)),0) from calculated;
$$;

create or replace function public.estimate_trade_in(p_device_id uuid,p_region text,p_cosmetic text,p_working text,p_screen text default '',p_body text default '',p_battery text default '',p_repair_cost_code text default '',p_accessory_cost_code text default '')
returns table(estimate numeric,estimate_min numeric,estimate_max numeric,confidence text,market_price numeric,margin_amount numeric,deductions numeric,pricing_region text)
language plpgsql stable security definer set search_path='' as $$
declare d public.trade_in_devices%rowtype;v_market numeric;v_margin numeric;v_deductions numeric:=0;v_battery numeric;v_raw numeric;v_region text:=lower(trim(coalesce(p_region,'')));v_selected numeric;v_ref numeric;
begin
 select * into d from public.trade_in_devices where id=p_device_id and is_active=true; if not found then return; end if; v_ref:=d.market_price_tr;
 v_market:=case when v_region in ('tr','tr cihazı','tr cihaz') then d.market_price_tr when v_region in ('passport','yurt dışı - kayıtlı','yurtdışı kayıtlı','yurt disi - kayitli') then d.market_price_passport when v_region in ('international','yurt dışı - kayıtsız','yurtdışı kayıtsız','yurt disi - kayitsiz') then d.market_price_international else d.market_price_tr end;
 v_margin:=round(v_market*d.profit_margin_pct/100.0);
 v_deductions:=v_deductions+case lower(trim(coalesce(p_screen,''))) when 'çatlak / kırık' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'screen_replacement',v_ref) when 'derin çizik' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'screen_deep_scratch',v_ref) else 0 end;
 v_deductions:=v_deductions+case lower(trim(coalesce(p_body,''))) when 'hafif izler' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'body_marks',v_ref) when 'çizik / ezik' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'body_damage',v_ref) when 'hasarlı' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'body_heavy_damage',v_ref) else 0 end;
 v_deductions:=v_deductions+case lower(trim(coalesce(p_cosmetic,''))) when 'iyi' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'cosmetic_good',v_ref) when 'orta' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'cosmetic_medium',v_ref) when 'yıpranmış' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'cosmetic_worn',v_ref) else 0 end;
 begin v_battery:=nullif(regexp_replace(coalesce(p_battery,''),'[^0-9.]','','g'),'')::numeric; exception when others then v_battery:=null; end; if v_battery is not null and v_battery<80 then v_deductions:=v_deductions+private.trade_in_deduction_for(d.device_type,d.brand,d.model,'battery_replacement',v_ref); end if;
 v_deductions:=v_deductions+case lower(trim(coalesce(p_working,''))) when 'kısmi arızalı' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'partial_fault',v_ref) when 'çalışmıyor' then private.trade_in_deduction_for(d.device_type,d.brand,d.model,'not_working',v_ref) else 0 end;
 select amount into v_selected from public.trade_in_cost_references where code=p_repair_cost_code and is_active=true and selectable=true and category='repair';v_deductions:=v_deductions+coalesce(v_selected,0);v_selected:=null;select amount into v_selected from public.trade_in_cost_references where code=p_accessory_cost_code and is_active=true and selectable=true and category='accessory';v_deductions:=v_deductions+coalesce(v_selected,0);
 v_raw:=greatest(0,v_market-v_margin-v_deductions);estimate:=round(v_raw/250)*250;estimate_min:=greatest(0,round((estimate*0.95)/250)*250);estimate_max:=greatest(estimate_min,round((estimate*1.05)/250)*250);confidence:=case when p_cosmetic<>'' and p_working<>'' and p_screen<>'' and p_body<>'' and p_region<>'' then 'yüksek' else 'orta' end;market_price:=v_market;margin_amount:=v_margin;deductions:=v_deductions;pricing_region:=v_region;return next;
end;
$$;

create or replace function public.apply_pricing_bulk_adjustment(p_target text,p_percentage numeric,p_include_overrides boolean default false)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid:=gen_random_uuid();v_rule_count integer:=0;v_override_count integer:=0;v_snapshot jsonb;
begin
 if not (select private.is_admin()) then raise exception 'admin access required'; end if; if p_target not in ('all','service','trade_in') then raise exception 'invalid target'; end if; if p_percentage=0 or p_percentage <= -90 or p_percentage > 500 then raise exception 'invalid percentage'; end if;
 select jsonb_build_object('rules',coalesce(jsonb_agg(jsonb_build_object('id',r.id,'service_pct',r.service_pct,'trade_in_pct',r.trade_in_pct)),'[]'::jsonb),'overrides',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'service_min_price',o.service_min_price,'service_max_price',o.service_max_price,'trade_in_deduction',o.trade_in_deduction)),'[]'::jsonb) from public.pricing_overrides o where o.is_active=true and p_include_overrides=true and o.exclude_from_bulk=false)) into v_snapshot from public.pricing_fault_rules r where r.is_active=true;
 update public.pricing_fault_rules set service_pct=case when p_target in ('all','service') then round(service_pct*(1+p_percentage/100.0),3) else service_pct end,trade_in_pct=case when p_target in ('all','trade_in') then round(trade_in_pct*(1+p_percentage/100.0),3) else trade_in_pct end,updated_at=now() where is_active=true;get diagnostics v_rule_count=row_count;
 if p_include_overrides then update public.pricing_overrides set service_min_price=case when p_target in ('all','service') and service_min_price is not null then round(service_min_price*(1+p_percentage/100.0),2) else service_min_price end,service_max_price=case when p_target in ('all','service') and service_max_price is not null then round(service_max_price*(1+p_percentage/100.0),2) else service_max_price end,trade_in_deduction=case when p_target in ('all','trade_in') and trade_in_deduction is not null then round(trade_in_deduction*(1+p_percentage/100.0),2) else trade_in_deduction end,updated_at=now() where is_active=true and exclude_from_bulk=false;get diagnostics v_override_count=row_count;end if;
 insert into public.pricing_bulk_history(id,target,percentage,include_overrides,rule_count,override_count,snapshot,changed_by) values(v_id,p_target,p_percentage,p_include_overrides,v_rule_count,v_override_count,coalesce(v_snapshot,'{}'::jsonb),(select auth.uid()));return v_id;
end;
$$;

create or replace function public.rollback_pricing_bulk_adjustment(p_history_id uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare h public.pricing_bulk_history%rowtype;item jsonb;
begin
 if not (select private.is_admin()) then raise exception 'admin access required'; end if;select * into h from public.pricing_bulk_history where id=p_history_id for update;if not found or h.rolled_back_at is not null then return false;end if;
 for item in select * from jsonb_array_elements(coalesce(h.snapshot->'rules','[]'::jsonb)) loop update public.pricing_fault_rules set service_pct=(item->>'service_pct')::numeric,trade_in_pct=(item->>'trade_in_pct')::numeric,updated_at=now() where id=(item->>'id')::uuid;end loop;
 for item in select * from jsonb_array_elements(coalesce(h.snapshot->'overrides','[]'::jsonb)) loop update public.pricing_overrides set service_min_price=nullif(item->>'service_min_price','')::numeric,service_max_price=nullif(item->>'service_max_price','')::numeric,trade_in_deduction=nullif(item->>'trade_in_deduction','')::numeric,updated_at=now() where id=(item->>'id')::uuid;end loop;
 update public.pricing_bulk_history set rolled_back_at=now(),rolled_back_by=(select auth.uid()) where id=p_history_id;return true;
end;
$$;

revoke all on function public.estimate_service_price(text,text,text,text[]) from public;
revoke all on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text,text) from public;
revoke all on function public.apply_pricing_bulk_adjustment(text,numeric,boolean) from public;
revoke all on function public.rollback_pricing_bulk_adjustment(uuid) from public;
grant execute on function public.estimate_service_price(text,text,text,text[]) to anon,authenticated;
grant execute on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text,text) to anon,authenticated;
grant execute on function public.apply_pricing_bulk_adjustment(text,numeric,boolean) to authenticated;
grant execute on function public.rollback_pricing_bulk_adjustment(uuid) to authenticated;
