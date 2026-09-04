create or replace function public.estimate_service_price(p_device_type text,p_brand text,p_model text,p_fault_codes text[])
returns table(estimate_min numeric,estimate_max numeric)
language sql stable security definer set search_path='' as $$
 with requested as (select unnest(p_fault_codes) fault_code),
 ref as (select private.device_reference_price(p_device_type,p_brand,p_model) value, private.pricing_segment_multiplier(p_model) segment),
 calculated as (
  select q.fault_code,
   coalesce(
    (select o.service_min_price from public.pricing_overrides o where o.is_active=true and lower(o.device_type)=lower(coalesce(p_device_type,'')) and lower(o.brand)=lower(coalesce(p_brand,'')) and lower(o.model)=lower(coalesce(p_model,'')) and o.service_fault_code=q.fault_code order by o.updated_at desc limit 1),
    (select greatest(coalesce(r.min_service_price,0),round(((ref.value*r.service_pct/100.0*ref.segment)*0.90)/100)*100) from public.pricing_fault_rules r,ref where r.is_active=true and r.service_fault_code=q.fault_code and r.service_pct>0 and ref.value is not null and ref.value>0 limit 1),
    (select r.min_price from public.service_price_references r where r.is_active=true and r.device_type=p_device_type and r.fault_code=q.fault_code and (r.brand='' or lower(r.brand)=lower(coalesce(p_brand,''))) and (r.model='' or lower(r.model)=lower(coalesce(p_model,''))) order by case when lower(r.brand)=lower(coalesce(p_brand,'')) and lower(r.model)=lower(coalesce(p_model,'')) then 3 when lower(r.brand)=lower(coalesce(p_brand,'')) and r.model='' then 2 when r.brand='' and r.model='' then 1 else 0 end desc,r.updated_at desc limit 1),0) min_value,
   coalesce(
    (select o.service_max_price from public.pricing_overrides o where o.is_active=true and lower(o.device_type)=lower(coalesce(p_device_type,'')) and lower(o.brand)=lower(coalesce(p_brand,'')) and lower(o.model)=lower(coalesce(p_model,'')) and o.service_fault_code=q.fault_code order by o.updated_at desc limit 1),
    (select case when r.max_service_price is null then round(((ref.value*r.service_pct/100.0*ref.segment)*1.10)/100)*100 else least(r.max_service_price,round(((ref.value*r.service_pct/100.0*ref.segment)*1.10)/100)*100) end from public.pricing_fault_rules r,ref where r.is_active=true and r.service_fault_code=q.fault_code and r.service_pct>0 and ref.value is not null and ref.value>0 limit 1),
    (select r.max_price from public.service_price_references r where r.is_active=true and r.device_type=p_device_type and r.fault_code=q.fault_code and (r.brand='' or lower(r.brand)=lower(coalesce(p_brand,''))) and (r.model='' or lower(r.model)=lower(coalesce(p_model,''))) order by case when lower(r.brand)=lower(coalesce(p_brand,'')) and lower(r.model)=lower(coalesce(p_model,'')) then 3 when lower(r.brand)=lower(coalesce(p_brand,'')) and r.model='' then 2 when r.brand='' and r.model='' then 1 else 0 end desc,r.updated_at desc limit 1),0) max_value
  from requested q
 )
 select coalesce(sum(min_value),0),coalesce(sum(greatest(max_value,min_value)),0) from calculated;
$$;
revoke all on function public.estimate_service_price(text,text,text,text[]) from public;
grant execute on function public.estimate_service_price(text,text,text,text[]) to anon,authenticated;
