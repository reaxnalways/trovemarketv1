create table if not exists public.pricing_scoped_bulk_history (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('all','category','brand','model','selected_products')),
  category_id uuid references public.categories(id) on delete set null,
  device_type text,
  brand text,
  model text,
  product_ids uuid[] not null default '{}'::uuid[],
  targets text[] not null,
  percentage numeric not null,
  include_protected_overrides boolean not null default false,
  affected_counts jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  changed_by uuid,
  created_at timestamptz not null default now(),
  rolled_back_at timestamptz,
  rolled_back_by uuid
);

alter table public.pricing_scoped_bulk_history enable row level security;
grant select, insert, update on public.pricing_scoped_bulk_history to authenticated;
revoke all on public.pricing_scoped_bulk_history from anon;

create policy "Admins can read scoped pricing history" on public.pricing_scoped_bulk_history for select to authenticated using ((select private.is_admin()));
create policy "Admins can insert scoped pricing history" on public.pricing_scoped_bulk_history for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update scoped pricing history" on public.pricing_scoped_bulk_history for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create or replace function public.preview_scoped_price_adjustment(
  p_scope_type text, p_targets text[], p_percentage numeric,
  p_category_id uuid default null, p_device_type text default null,
  p_brand text default null, p_model text default null,
  p_product_ids uuid[] default '{}'::uuid[], p_include_protected_overrides boolean default false
) returns jsonb language plpgsql set search_path = '' as $$
declare v_product_count integer:=0; v_trade_count integer:=0; v_service_rule_count integer:=0; v_trade_rule_count integer:=0; v_override_count integer:=0; v_samples jsonb:='[]'::jsonb; v_global_scope boolean; v_warning text:=null;
begin
  if not (select private.is_admin()) then raise exception 'admin access required'; end if;
  if p_scope_type not in ('all','category','brand','model','selected_products') then raise exception 'invalid scope'; end if;
  if p_percentage=0 or p_percentage<=-90 or p_percentage>500 then raise exception 'invalid percentage'; end if;
  if p_targets is null or cardinality(p_targets)=0 then raise exception 'at least one target required'; end if;
  if p_targets <@ array['product_price','trade_in_market','service_rules','trade_in_rules','overrides']::text[] is false then raise exception 'invalid target'; end if;
  if p_scope_type='selected_products' and ('product_price' <> all(p_targets)) then raise exception 'selected products scope only supports product prices'; end if;
  v_global_scope := p_scope_type='all' and p_category_id is null and p_device_type is null and nullif(trim(coalesce(p_brand,'')),'') is null and nullif(trim(coalesce(p_model,'')),'') is null and cardinality(coalesce(p_product_ids,'{}'::uuid[]))=0;
  if (('service_rules'=any(p_targets)) or ('trade_in_rules'=any(p_targets))) and not v_global_scope then raise exception 'global pricing rules cannot be scoped by category, brand, model, or selected products'; end if;

  if 'product_price'=any(p_targets) then
    select count(*) into v_product_count from public.products p where p.price is not null and (p_category_id is null or p.category_id=p_category_id) and (nullif(trim(coalesce(p_brand,'')),'') is null or lower(coalesce(p.brand,''))=lower(trim(p_brand))) and (nullif(trim(coalesce(p_model,'')),'') is null or lower(coalesce(p.model,''))=lower(trim(p_model))) and (p_scope_type<>'selected_products' or p.id=any(coalesce(p_product_ids,'{}'::uuid[])));
    select coalesce(jsonb_agg(x),'[]'::jsonb) into v_samples from (select jsonb_build_object('type','product','id',p.id,'label',p.title,'before',p.price,'after',round(p.price*(1+p_percentage/100.0),2)) x from public.products p where p.price is not null and (p_category_id is null or p.category_id=p_category_id) and (nullif(trim(coalesce(p_brand,'')),'') is null or lower(coalesce(p.brand,''))=lower(trim(p_brand))) and (nullif(trim(coalesce(p_model,'')),'') is null or lower(coalesce(p.model,''))=lower(trim(p_model))) and (p_scope_type<>'selected_products' or p.id=any(coalesce(p_product_ids,'{}'::uuid[]))) order by p.updated_at desc nulls last limit 5) s;
  end if;
  if 'trade_in_market'=any(p_targets) then select count(*) into v_trade_count from public.trade_in_devices d where (nullif(trim(coalesce(p_device_type,'')),'') is null or lower(coalesce(d.device_type,''))=lower(trim(p_device_type))) and (nullif(trim(coalesce(p_brand,'')),'') is null or lower(coalesce(d.brand,''))=lower(trim(p_brand))) and (nullif(trim(coalesce(p_model,'')),'') is null or lower(coalesce(d.model,''))=lower(trim(p_model))); end if;
  if 'service_rules'=any(p_targets) then select count(*) into v_service_rule_count from public.pricing_fault_rules where is_active=true and service_fault_code is not null; end if;
  if 'trade_in_rules'=any(p_targets) then select count(*) into v_trade_rule_count from public.pricing_fault_rules where is_active=true and trade_in_cost_code is not null; end if;
  if 'overrides'=any(p_targets) then select count(*) into v_override_count from public.pricing_overrides o where o.is_active=true and (p_include_protected_overrides or o.exclude_from_bulk=false) and (nullif(trim(coalesce(p_device_type,'')),'') is null or lower(coalesce(o.device_type,''))=lower(trim(p_device_type))) and (nullif(trim(coalesce(p_brand,'')),'') is null or lower(coalesce(o.brand,''))=lower(trim(p_brand))) and (nullif(trim(coalesce(p_model,'')),'') is null or lower(coalesce(o.model,''))=lower(trim(p_model))); end if;
  if ('service_rules'=any(p_targets)) and (('product_price'=any(p_targets)) or ('trade_in_market'=any(p_targets))) then v_warning:='Referans fiyatları ve servis katsayıları aynı anda değişirse servis fiyatında birleşik etki oluşabilir.'; elsif ('trade_in_rules'=any(p_targets)) and ('trade_in_market'=any(p_targets)) then v_warning:='Takas piyasa değeri ve takas kesinti katsayıları aynı anda değişirse takas teklifinde birleşik etki oluşabilir.'; end if;
  return jsonb_build_object('counts',jsonb_build_object('products',v_product_count,'trade_in_devices',v_trade_count,'service_rules',v_service_rule_count,'trade_in_rules',v_trade_rule_count,'overrides',v_override_count),'samples',v_samples,'warning',v_warning);
end; $$;

create or replace function public.apply_scoped_price_adjustment(
  p_scope_type text, p_targets text[], p_percentage numeric,
  p_category_id uuid default null, p_device_type text default null,
  p_brand text default null, p_model text default null,
  p_product_ids uuid[] default '{}'::uuid[], p_include_protected_overrides boolean default false
) returns uuid language plpgsql set search_path = '' as $$
declare v_id uuid:=gen_random_uuid(); v_products jsonb:='[]'::jsonb; v_trade jsonb:='[]'::jsonb; v_rules jsonb:='[]'::jsonb; v_overrides jsonb:='[]'::jsonb; v_product_count integer:=0; v_trade_count integer:=0; v_service_rule_count integer:=0; v_trade_rule_count integer:=0; v_override_count integer:=0; v_global_scope boolean;
begin
  if not (select private.is_admin()) then raise exception 'admin access required'; end if;
  if p_scope_type not in ('all','category','brand','model','selected_products') then raise exception 'invalid scope'; end if;
  if p_percentage=0 or p_percentage<=-90 or p_percentage>500 then raise exception 'invalid percentage'; end if;
  if p_targets is null or cardinality(p_targets)=0 then raise exception 'at least one target required'; end if;
  if p_targets <@ array['product_price','trade_in_market','service_rules','trade_in_rules','overrides']::text[] is false then raise exception 'invalid target'; end if;
  if p_scope_type='selected_products' and ('product_price' <> all(p_targets)) then raise exception 'selected products scope only supports product prices'; end if;
  v_global_scope:=p_scope_type='all' and p_category_id is null and p_device_type is null and nullif(trim(coalesce(p_brand,'')),'') is null and nullif(trim(coalesce(p_model,'')),'') is null and cardinality(coalesce(p_product_ids,'{}'::uuid[]))=0;
  if (('service_rules'=any(p_targets)) or ('trade_in_rules'=any(p_targets))) and not v_global_scope then raise exception 'global pricing rules cannot be scoped'; end if;

  if 'product_price'=any(p_targets) then
    select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'price',p.price)),'[]'::jsonb),count(*) into v_products,v_product_count from public.products p where p.price is not null and (p_category_id is null or p.category_id=p_category_id) and (nullif(trim(coalesce(p_brand,'')),'') is null or lower(coalesce(p.brand,''))=lower(trim(p_brand))) and (nullif(trim(coalesce(p_model,'')),'') is null or lower(coalesce(p.model,''))=lower(trim(p_model))) and (p_scope_type<>'selected_products' or p.id=any(coalesce(p_product_ids,'{}'::uuid[])));
    update public.products p set price=round(p.price*(1+p_percentage/100.0),2),updated_at=now() where p.price is not null and (p_category_id is null or p.category_id=p_category_id) and (nullif(trim(coalesce(p_brand,'')),'') is null or lower(coalesce(p.brand,''))=lower(trim(p_brand))) and (nullif(trim(coalesce(p_model,'')),'') is null or lower(coalesce(p.model,''))=lower(trim(p_model))) and (p_scope_type<>'selected_products' or p.id=any(coalesce(p_product_ids,'{}'::uuid[])));
  end if;
  if 'trade_in_market'=any(p_targets) then
    select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'tr',d.market_price_tr,'passport',d.market_price_passport,'international',d.market_price_international,'base_estimate',d.base_estimate,'max_estimate',d.max_estimate)),'[]'::jsonb),count(*) into v_trade,v_trade_count from public.trade_in_devices d where (nullif(trim(coalesce(p_device_type,'')),'') is null or lower(coalesce(d.device_type,''))=lower(trim(p_device_type))) and (nullif(trim(coalesce(p_brand,'')),'') is null or lower(coalesce(d.brand,''))=lower(trim(p_brand))) and (nullif(trim(coalesce(p_model,'')),'') is null or lower(coalesce(d.model,''))=lower(trim(p_model)));
    update public.trade_in_devices d set market_price_tr=round(d.market_price_tr*(1+p_percentage/100.0),2),market_price_passport=round(d.market_price_passport*(1+p_percentage/100.0),2),market_price_international=round(d.market_price_international*(1+p_percentage/100.0),2),base_estimate=round(d.base_estimate*(1+p_percentage/100.0),2),max_estimate=round(d.max_estimate*(1+p_percentage/100.0),2),updated_at=now() where (nullif(trim(coalesce(p_device_type,'')),'') is null or lower(coalesce(d.device_type,''))=lower(trim(p_device_type))) and (nullif(trim(coalesce(p_brand,'')),'') is null or lower(coalesce(d.brand,''))=lower(trim(p_brand))) and (nullif(trim(coalesce(p_model,'')),'') is null or lower(coalesce(d.model,''))=lower(trim(p_model)));
  end if;
  if ('service_rules'=any(p_targets)) or ('trade_in_rules'=any(p_targets)) then
    select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'service_pct',r.service_pct,'trade_in_pct',r.trade_in_pct)),'[]'::jsonb) into v_rules from public.pricing_fault_rules r where r.is_active=true;
    if 'service_rules'=any(p_targets) then select count(*) into v_service_rule_count from public.pricing_fault_rules where is_active=true and service_fault_code is not null; end if;
    if 'trade_in_rules'=any(p_targets) then select count(*) into v_trade_rule_count from public.pricing_fault_rules where is_active=true and trade_in_cost_code is not null; end if;
    update public.pricing_fault_rules r set service_pct=case when 'service_rules'=any(p_targets) and r.service_fault_code is not null then round(r.service_pct*(1+p_percentage/100.0),3) else r.service_pct end,trade_in_pct=case when 'trade_in_rules'=any(p_targets) and r.trade_in_cost_code is not null then round(r.trade_in_pct*(1+p_percentage/100.0),3) else r.trade_in_pct end,updated_at=now() where r.is_active=true;
  end if;
  if 'overrides'=any(p_targets) then
    select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'service_min_price',o.service_min_price,'service_max_price',o.service_max_price,'trade_in_deduction',o.trade_in_deduction)),'[]'::jsonb),count(*) into v_overrides,v_override_count from public.pricing_overrides o where o.is_active=true and (p_include_protected_overrides or o.exclude_from_bulk=false) and (nullif(trim(coalesce(p_device_type,'')),'') is null or lower(coalesce(o.device_type,''))=lower(trim(p_device_type))) and (nullif(trim(coalesce(p_brand,'')),'') is null or lower(coalesce(o.brand,''))=lower(trim(p_brand))) and (nullif(trim(coalesce(p_model,'')),'') is null or lower(coalesce(o.model,''))=lower(trim(p_model)));
    update public.pricing_overrides o set service_min_price=case when o.service_min_price is null then null else round(o.service_min_price*(1+p_percentage/100.0),2) end,service_max_price=case when o.service_max_price is null then null else round(o.service_max_price*(1+p_percentage/100.0),2) end,trade_in_deduction=case when o.trade_in_deduction is null then null else round(o.trade_in_deduction*(1+p_percentage/100.0),2) end,updated_at=now() where o.is_active=true and (p_include_protected_overrides or o.exclude_from_bulk=false) and (nullif(trim(coalesce(p_device_type,'')),'') is null or lower(coalesce(o.device_type,''))=lower(trim(p_device_type))) and (nullif(trim(coalesce(p_brand,'')),'') is null or lower(coalesce(o.brand,''))=lower(trim(p_brand))) and (nullif(trim(coalesce(p_model,'')),'') is null or lower(coalesce(o.model,''))=lower(trim(p_model)));
  end if;
  insert into public.pricing_scoped_bulk_history(id,scope_type,category_id,device_type,brand,model,product_ids,targets,percentage,include_protected_overrides,affected_counts,snapshot,changed_by) values(v_id,p_scope_type,p_category_id,nullif(trim(coalesce(p_device_type,'')),''),nullif(trim(coalesce(p_brand,'')),''),nullif(trim(coalesce(p_model,'')),''),coalesce(p_product_ids,'{}'::uuid[]),p_targets,p_percentage,p_include_protected_overrides,jsonb_build_object('products',v_product_count,'trade_in_devices',v_trade_count,'service_rules',v_service_rule_count,'trade_in_rules',v_trade_rule_count,'overrides',v_override_count),jsonb_build_object('products',v_products,'trade_in_devices',v_trade,'rules',v_rules,'overrides',v_overrides),(select auth.uid()));
  return v_id;
end; $$;

create or replace function public.rollback_scoped_price_adjustment(p_history_id uuid) returns boolean language plpgsql set search_path = '' as $$
declare h public.pricing_scoped_bulk_history%rowtype; item jsonb;
begin
  if not (select private.is_admin()) then raise exception 'admin access required'; end if;
  select * into h from public.pricing_scoped_bulk_history where id=p_history_id for update;
  if not found or h.rolled_back_at is not null then return false; end if;
  for item in select * from jsonb_array_elements(coalesce(h.snapshot->'products','[]'::jsonb)) loop update public.products set price=nullif(item->>'price','')::numeric,updated_at=now() where id=(item->>'id')::uuid; end loop;
  for item in select * from jsonb_array_elements(coalesce(h.snapshot->'trade_in_devices','[]'::jsonb)) loop update public.trade_in_devices set market_price_tr=(item->>'tr')::numeric,market_price_passport=(item->>'passport')::numeric,market_price_international=(item->>'international')::numeric,base_estimate=(item->>'base_estimate')::numeric,max_estimate=(item->>'max_estimate')::numeric,updated_at=now() where id=(item->>'id')::uuid; end loop;
  for item in select * from jsonb_array_elements(coalesce(h.snapshot->'rules','[]'::jsonb)) loop update public.pricing_fault_rules set service_pct=(item->>'service_pct')::numeric,trade_in_pct=(item->>'trade_in_pct')::numeric,updated_at=now() where id=(item->>'id')::uuid; end loop;
  for item in select * from jsonb_array_elements(coalesce(h.snapshot->'overrides','[]'::jsonb)) loop update public.pricing_overrides set service_min_price=nullif(item->>'service_min_price','')::numeric,service_max_price=nullif(item->>'service_max_price','')::numeric,trade_in_deduction=nullif(item->>'trade_in_deduction','')::numeric,updated_at=now() where id=(item->>'id')::uuid; end loop;
  update public.pricing_scoped_bulk_history set rolled_back_at=now(),rolled_back_by=(select auth.uid()) where id=p_history_id;
  return true;
end; $$;

revoke all on function public.preview_scoped_price_adjustment(text,text[],numeric,uuid,text,text,text,uuid[],boolean) from public, anon;
revoke all on function public.apply_scoped_price_adjustment(text,text[],numeric,uuid,text,text,text,uuid[],boolean) from public, anon;
revoke all on function public.rollback_scoped_price_adjustment(uuid) from public, anon;
grant execute on function public.preview_scoped_price_adjustment(text,text[],numeric,uuid,text,text,text,uuid[],boolean) to authenticated;
grant execute on function public.apply_scoped_price_adjustment(text,text[],numeric,uuid,text,text,text,uuid[],boolean) to authenticated;
grant execute on function public.rollback_scoped_price_adjustment(uuid) to authenticated;
