create table if not exists public.device_model_variants (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.device_model_catalog(id) on delete cascade,
  storage text not null default '',
  color text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (catalog_id, storage, color)
);

alter table public.device_model_variants enable row level security;
revoke all on public.device_model_variants from public, anon, authenticated;
grant select, insert, update, delete on public.device_model_variants to authenticated;

drop policy if exists "Admins can read device model variants" on public.device_model_variants;
create policy "Admins can read device model variants" on public.device_model_variants for select to authenticated using ((select private.is_admin()));
drop policy if exists "Admins can create device model variants" on public.device_model_variants;
create policy "Admins can create device model variants" on public.device_model_variants for insert to authenticated with check ((select private.is_admin()));
drop policy if exists "Admins can update device model variants" on public.device_model_variants;
create policy "Admins can update device model variants" on public.device_model_variants for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "Admins can delete device model variants" on public.device_model_variants;
create policy "Admins can delete device model variants" on public.device_model_variants for delete to authenticated using ((select private.is_admin()));

insert into public.device_model_variants(catalog_id,storage,color)
select c.id, s.storage, k.color
from public.device_model_catalog c
cross join lateral unnest(case when cardinality(c.storage_options)>0 then c.storage_options else array['']::text[] end) s(storage)
cross join lateral unnest(case when cardinality(c.color_options)>0 then c.color_options else array['']::text[] end) k(color)
on conflict (catalog_id,storage,color) do nothing;

alter table public.trade_in_devices add column if not exists color text not null default '';
alter table public.trade_in_devices add column if not exists catalog_variant_id uuid references public.device_model_variants(id) on delete set null;
alter table public.trade_in_devices drop constraint if exists trade_in_devices_device_type_brand_model_storage_key;
drop index if exists public.trade_in_devices_device_type_brand_model_storage_key;
create unique index if not exists trade_in_devices_exact_variant_key on public.trade_in_devices(device_type,brand,model,storage,color);
create unique index if not exists trade_in_devices_catalog_variant_unique on public.trade_in_devices(catalog_variant_id) where catalog_variant_id is not null;

delete from public.trade_in_devices;

drop function if exists public.get_trade_in_catalog();
create function public.get_trade_in_catalog()
returns table(id uuid, device_type text, brand text, model text, storage text, color text)
language sql stable security definer set search_path=''
as $$
  select d.id,d.device_type,d.brand,d.model,d.storage,d.color
  from public.trade_in_devices d
  where d.is_active=true and d.market_price_tr>0 and d.catalog_variant_id is not null
  order by d.device_type,d.brand,d.model,d.storage,d.color;
$$;
revoke all on function public.get_trade_in_catalog() from public;
grant execute on function public.get_trade_in_catalog() to anon, authenticated;

create or replace function private.device_reference_price(p_device_type text,p_brand text,p_model text,p_storage text,p_color text)
returns numeric language sql stable set search_path=''
as $$
 select d.market_price_tr
 from public.trade_in_devices d
 where d.is_active=true and d.market_price_tr>0
   and lower(d.device_type)=lower(coalesce(p_device_type,''))
   and lower(d.brand)=lower(coalesce(p_brand,''))
   and lower(d.model)=lower(coalesce(p_model,''))
   and lower(d.storage)=lower(coalesce(p_storage,''))
   and lower(d.color)=lower(coalesce(p_color,''))
 order by d.updated_at desc limit 1;
$$;

create or replace function public.estimate_service_price(p_device_type text,p_brand text,p_model text,p_storage text,p_color text,p_fault_codes text[])
returns table(estimate_min numeric, estimate_max numeric)
language sql stable security definer set search_path=''
as $$
 with requested as (select unnest(p_fault_codes) fault_code),
 ref as (select private.device_reference_price(p_device_type,p_brand,p_model,p_storage,p_color) value, private.pricing_segment_multiplier(p_model) segment, private.pricing_generation_multiplier(p_brand,p_model) generation),
 calculated as (
  select q.fault_code,
   coalesce((select o.service_min_price from public.pricing_overrides o where o.is_active=true and lower(o.device_type)=lower(coalesce(p_device_type,'')) and lower(o.brand)=lower(coalesce(p_brand,'')) and lower(o.model)=lower(coalesce(p_model,'')) and o.service_fault_code=q.fault_code order by o.updated_at desc limit 1),(select greatest(coalesce(r.min_service_price,0),round(((ref.value*r.service_pct/100.0*ref.segment*ref.generation)*0.90)/100)*100) from public.pricing_fault_rules r,ref where r.is_active=true and r.service_fault_code=q.fault_code and r.service_pct>0 and ref.value is not null and ref.value>0 limit 1),0) min_value,
   coalesce((select o.service_max_price from public.pricing_overrides o where o.is_active=true and lower(o.device_type)=lower(coalesce(p_device_type,'')) and lower(o.brand)=lower(coalesce(p_brand,'')) and lower(o.model)=lower(coalesce(p_model,'')) and o.service_fault_code=q.fault_code order by o.updated_at desc limit 1),(select case when r.max_service_price is null then round(((ref.value*r.service_pct/100.0*ref.segment*ref.generation)*1.10)/100)*100 else least(r.max_service_price,round(((ref.value*r.service_pct/100.0*ref.segment*ref.generation)*1.10)/100)*100) end from public.pricing_fault_rules r,ref where r.is_active=true and r.service_fault_code=q.fault_code and r.service_pct>0 and ref.value is not null and ref.value>0 limit 1),0) max_value
  from requested q)
 select coalesce(sum(min_value),0),coalesce(sum(greatest(max_value,min_value)),0) from calculated;
$$;
revoke all on function public.estimate_service_price(text,text,text,text,text,text[]) from public;
grant execute on function public.estimate_service_price(text,text,text,text,text,text[]) to anon, authenticated;

create or replace function public.get_admin_variant_pricing(p_query text default '',p_device_type text default '',p_status text default '',p_offset integer default 0,p_limit integer default 100)
returns table(variant_id uuid,catalog_id uuid,device_type text,category text,sub_category text,brand text,model text,storage text,color text,trade_id uuid,market_price_tr numeric,market_price_passport numeric,market_price_international numeric,profit_margin_pct numeric,total_count bigint)
language plpgsql stable security definer set search_path=''
as $$
begin
 if not private.is_admin() then raise exception 'not authorized'; end if;
 return query
 with filtered as (
  select v.id variant_id,c.id catalog_id,c.device_type,c.category,c.sub_category,c.brand,c.model,v.storage,v.color,
         d.id trade_id,d.market_price_tr,d.market_price_passport,d.market_price_international,d.profit_margin_pct
  from public.device_model_variants v
  join public.device_model_catalog c on c.id=v.catalog_id
  left join public.trade_in_devices d on d.catalog_variant_id=v.id and d.is_active=true
  where v.is_active=true and c.is_active=true
    and (coalesce(trim(p_device_type),'')='' or c.device_type=p_device_type)
    and (coalesce(trim(p_status),'')='' or p_status='all' or (p_status='priced' and d.id is not null and d.market_price_tr>0) or (p_status='unpriced' and (d.id is null or d.market_price_tr<=0)))
    and (coalesce(trim(p_query),'')='' or lower(c.category||' '||c.sub_category||' '||c.brand||' '||c.model||' '||v.storage||' '||v.color) like '%'||lower(trim(p_query))||'%')
 )
 select f.*,count(*) over() from filtered f order by f.device_type,f.brand,f.model,f.storage,f.color offset greatest(p_offset,0) limit least(greatest(p_limit,1),200);
end;
$$;
revoke all on function public.get_admin_variant_pricing(text,text,text,integer,integer) from public;
grant execute on function public.get_admin_variant_pricing(text,text,text,integer,integer) to authenticated;
