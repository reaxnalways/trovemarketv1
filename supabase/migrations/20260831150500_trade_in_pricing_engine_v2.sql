alter table public.trade_in_devices
  add column if not exists market_price_tr numeric(12,2),
  add column if not exists market_price_passport numeric(12,2),
  add column if not exists market_price_international numeric(12,2),
  add column if not exists profit_margin_pct numeric(5,2) not null default 15 check (profit_margin_pct >= 0 and profit_margin_pct <= 60);

update public.trade_in_devices
set market_price_tr = coalesce(market_price_tr, base_estimate),
    market_price_passport = coalesce(market_price_passport, round(base_estimate * 0.84)),
    market_price_international = coalesce(market_price_international, round(base_estimate * 0.66));

alter table public.trade_in_devices
  alter column market_price_tr set not null,
  alter column market_price_passport set not null,
  alter column market_price_international set not null;

create table if not exists public.trade_in_cost_references (
  code text primary key,
  label text not null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.trade_in_cost_references(code,label,amount) values
 ('screen_replacement','Ekran değişimi',5000),
 ('screen_deep_scratch','Derin ekran çizikleri',1500),
 ('body_marks','Kasa hafif izler',750),
 ('body_damage','Kasa çizik / ezik',2000),
 ('body_heavy_damage','Kasa ağır hasar',4000),
 ('battery_replacement','Pil değişimi',3000),
 ('partial_fault','Kısmi arıza risk payı',2500),
 ('not_working','Çalışmayan cihaz risk payı',7000),
 ('previous_repair','Onarım / değişen parça riski',1500),
 ('missing_accessories','Kutu / aksesuar eksikliği',500),
 ('cosmetic_good','İyi kozmetik kesintisi',750),
 ('cosmetic_medium','Orta kozmetik kesintisi',1750),
 ('cosmetic_worn','Yıpranmış kozmetik kesintisi',3500)
on conflict (code) do nothing;

alter table public.trade_in_cost_references enable row level security;
grant select, insert, update, delete on public.trade_in_cost_references to authenticated;
create policy "Admins can read trade in costs" on public.trade_in_cost_references for select to authenticated using (private.is_admin());
create policy "Admins can insert trade in costs" on public.trade_in_cost_references for insert to authenticated with check (private.is_admin());
create policy "Admins can update trade in costs" on public.trade_in_cost_references for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "Admins can delete trade in costs" on public.trade_in_cost_references for delete to authenticated using (private.is_admin());

create or replace function public.estimate_trade_in(
  p_device_id uuid,
  p_region text,
  p_cosmetic text,
  p_working text,
  p_screen text default '',
  p_body text default '',
  p_battery text default '',
  p_repairs text default '',
  p_accessories text default ''
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
language plpgsql
stable
security definer
set search_path = ''
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
  function_cost numeric;
begin
  select * into d from public.trade_in_devices where id = p_device_id and is_active = true;
  if not found then return; end if;

  select coalesce(jsonb_object_agg(code, amount), '{}'::jsonb)
  into v_costs from public.trade_in_cost_references where is_active = true;

  v_market := case
    when v_region in ('tr','tr cihazı','tr cihaz') then d.market_price_tr
    when v_region in ('passport','yurt dışı - kayıtlı','yurtdışı kayıtlı','yurt disi - kayitli') then d.market_price_passport
    when v_region in ('international','yurt dışı - kayıtsız','yurtdışı kayıtsız','yurt disi - kayitsiz') then d.market_price_international
    else d.market_price_tr end;

  v_margin := round(v_market * d.profit_margin_pct / 100.0);

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
    v_battery := nullif(regexp_replace(coalesce(p_battery,''), '[^0-9.]', '', 'g'), '')::numeric;
  exception when others then v_battery := null;
  end;
  if v_battery is not null and v_battery < 80 then
    v_deductions := v_deductions + coalesce((v_costs->>'battery_replacement')::numeric,0);
  end if;

  v_deductions := v_deductions + case lower(trim(coalesce(p_working,'')))
    when 'kısmi arızalı' then coalesce((v_costs->>'partial_fault')::numeric,0)
    when 'çalışmıyor' then coalesce((v_costs->>'not_working')::numeric,0)
    else 0 end;

  if length(trim(coalesce(p_repairs,''))) > 0 and lower(trim(p_repairs)) not in ('yok','hayır','yoktur') then
    v_deductions := v_deductions + coalesce((v_costs->>'previous_repair')::numeric,0);
  end if;
  if length(trim(coalesce(p_accessories,''))) = 0 or lower(trim(p_accessories)) in ('yok','hayır','yoktur') then
    v_deductions := v_deductions + coalesce((v_costs->>'missing_accessories')::numeric,0);
  end if;

  v_raw := greatest(0, v_market - v_margin - v_deductions);
  estimate := round(v_raw / 250) * 250;
  estimate_min := greatest(0, round((estimate * 0.95) / 250) * 250);
  estimate_max := greatest(estimate_min, round((estimate * 1.05) / 250) * 250);
  confidence := case when p_cosmetic <> '' and p_working <> '' and p_screen <> '' and p_body <> '' and p_region <> '' then 'yüksek' else 'orta' end;
  market_price := v_market;
  margin_amount := v_margin;
  deductions := v_deductions;
  pricing_region := v_region;
  return next;
end;
$$;

revoke all on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text,text) from public;
grant execute on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text,text) to anon, authenticated;
