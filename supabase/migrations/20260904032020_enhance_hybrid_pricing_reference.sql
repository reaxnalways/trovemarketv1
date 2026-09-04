create or replace function private.device_reference_price(p_device_type text,p_brand text,p_model text)
returns numeric language sql stable set search_path='' as $$
 select coalesce(
   (select avg(d.market_price_tr) from public.trade_in_devices d where d.is_active=true and d.market_price_tr>0 and lower(d.device_type)=lower(coalesce(p_device_type,'')) and lower(d.brand)=lower(coalesce(p_brand,'')) and lower(d.model)=lower(coalesce(p_model,''))),
   (select avg(p.price) from public.products p where p.price>0 and p.publication_status='published' and lower(coalesce(p.brand,''))=lower(coalesce(p_brand,'')) and lower(coalesce(p.model,''))=lower(coalesce(p_model,'')))
 );
$$;

create or replace function private.pricing_generation_multiplier(p_brand text,p_model text)
returns numeric language plpgsql immutable set search_path='' as $$
declare v_generation integer;
begin
 if lower(coalesce(p_brand,''))='apple' and lower(coalesce(p_model,'')) like '%iphone%' then
   begin v_generation := (regexp_match(lower(p_model), 'iphone[^0-9]*([0-9]{1,2})'))[1]::integer; exception when others then v_generation := null; end;
   if v_generation is not null then return least(1.80,greatest(0.85,1 + (v_generation-11)*0.10)); end if;
 end if;
 return 1.00;
end;
$$;

create or replace function private.trade_in_deduction_for(p_device_type text,p_brand text,p_model text,p_cost_code text,p_reference numeric)
returns numeric language plpgsql stable set search_path='' as $$
declare v_override numeric; v_rule public.pricing_fault_rules%rowtype; v_value numeric; v_fallback numeric; v_multiplier numeric; v_generation numeric;
begin
 select o.trade_in_deduction into v_override from public.pricing_overrides o where o.is_active=true and lower(o.device_type)=lower(coalesce(p_device_type,'')) and lower(o.brand)=lower(coalesce(p_brand,'')) and lower(o.model)=lower(coalesce(p_model,'')) and o.trade_in_cost_code=p_cost_code order by o.updated_at desc limit 1;
 if v_override is not null then return v_override; end if;
 select * into v_rule from public.pricing_fault_rules r where r.is_active=true and r.trade_in_cost_code=p_cost_code limit 1;
 if found and coalesce(v_rule.trade_in_pct,0)>0 and p_reference is not null and p_reference>0 then
   v_multiplier:=private.pricing_segment_multiplier(p_model); v_generation:=private.pricing_generation_multiplier(p_brand,p_model);
   v_value:=round((p_reference*v_rule.trade_in_pct/100.0*v_multiplier*v_generation)/50)*50;
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
 with requested as (select unnest(p_fault_codes) fault_code),
 ref as (select private.device_reference_price(p_device_type,p_brand,p_model) value, private.pricing_segment_multiplier(p_model) segment, private.pricing_generation_multiplier(p_brand,p_model) generation),
 calculated as (
  select q.fault_code,
   coalesce((select o.service_min_price from public.pricing_overrides o where o.is_active=true and lower(o.device_type)=lower(coalesce(p_device_type,'')) and lower(o.brand)=lower(coalesce(p_brand,'')) and lower(o.model)=lower(coalesce(p_model,'')) and o.service_fault_code=q.fault_code order by o.updated_at desc limit 1),(select greatest(coalesce(r.min_service_price,0),round(((ref.value*r.service_pct/100.0*ref.segment*ref.generation)*0.90)/100)*100) from public.pricing_fault_rules r,ref where r.is_active=true and r.service_fault_code=q.fault_code and r.service_pct>0 and ref.value is not null and ref.value>0 limit 1),(select r.min_price from public.service_price_references r where r.is_active=true and r.device_type=p_device_type and r.fault_code=q.fault_code and (r.brand='' or lower(r.brand)=lower(coalesce(p_brand,''))) and (r.model='' or lower(r.model)=lower(coalesce(p_model,''))) order by case when lower(r.brand)=lower(coalesce(p_brand,'')) and lower(r.model)=lower(coalesce(p_model,'')) then 3 when lower(r.brand)=lower(coalesce(p_brand,'')) and r.model='' then 2 when r.brand='' and r.model='' then 1 else 0 end desc,r.updated_at desc limit 1),0) min_value,
   coalesce((select o.service_max_price from public.pricing_overrides o where o.is_active=true and lower(o.device_type)=lower(coalesce(p_device_type,'')) and lower(o.brand)=lower(coalesce(p_brand,'')) and lower(o.model)=lower(coalesce(p_model,'')) and o.service_fault_code=q.fault_code order by o.updated_at desc limit 1),(select case when r.max_service_price is null then round(((ref.value*r.service_pct/100.0*ref.segment*ref.generation)*1.10)/100)*100 else least(r.max_service_price,round(((ref.value*r.service_pct/100.0*ref.segment*ref.generation)*1.10)/100)*100) end from public.pricing_fault_rules r,ref where r.is_active=true and r.service_fault_code=q.fault_code and r.service_pct>0 and ref.value is not null and ref.value>0 limit 1),(select r.max_price from public.service_price_references r where r.is_active=true and r.device_type=p_device_type and r.fault_code=q.fault_code and (r.brand='' or lower(r.brand)=lower(coalesce(p_brand,''))) and (r.model='' or lower(r.model)=lower(coalesce(p_model,''))) order by case when lower(r.brand)=lower(coalesce(p_brand,'')) and lower(r.model)=lower(coalesce(p_model,'')) then 3 when lower(r.brand)=lower(coalesce(p_brand,'')) and r.model='' then 2 when r.brand='' and r.model='' then 1 else 0 end desc,r.updated_at desc limit 1),0) max_value
  from requested q)
 select coalesce(sum(min_value),0),coalesce(sum(greatest(max_value,min_value)),0) from calculated;
$$;

revoke all on function public.estimate_service_price(text,text,text,text[]) from public;
grant execute on function public.estimate_service_price(text,text,text,text[]) to anon,authenticated;
