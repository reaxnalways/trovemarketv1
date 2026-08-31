create table if not exists public.trade_in_devices (
  id uuid primary key default gen_random_uuid(),
  device_type text not null,
  brand text not null,
  model text not null,
  storage text not null default '',
  base_estimate numeric(12,2) not null check (base_estimate >= 0),
  min_estimate numeric(12,2) not null check (min_estimate >= 0),
  max_estimate numeric(12,2) not null check (max_estimate >= min_estimate),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (device_type, brand, model, storage)
);

alter table public.trade_in_devices enable row level security;

grant select, insert, update, delete on public.trade_in_devices to authenticated;

create policy "Admins can read trade in devices" on public.trade_in_devices
for select to authenticated using (private.is_admin());
create policy "Admins can insert trade in devices" on public.trade_in_devices
for insert to authenticated with check (private.is_admin());
create policy "Admins can update trade in devices" on public.trade_in_devices
for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "Admins can delete trade in devices" on public.trade_in_devices
for delete to authenticated using (private.is_admin());

create or replace function public.get_trade_in_catalog()
returns table(id uuid, device_type text, brand text, model text, storage text)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, d.device_type, d.brand, d.model, d.storage
  from public.trade_in_devices d
  where d.is_active = true
  order by d.device_type, d.brand, d.model, d.storage;
$$;

create or replace function public.estimate_trade_in(
  p_device_id uuid,
  p_cosmetic text,
  p_working text,
  p_screen text default '',
  p_body text default '',
  p_battery text default '',
  p_repairs text default '',
  p_accessories text default ''
)
returns table(estimate numeric, estimate_min numeric, estimate_max numeric, confidence text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d public.trade_in_devices%rowtype;
  factor numeric := 1;
  battery_value numeric;
  raw_estimate numeric;
begin
  select * into d from public.trade_in_devices where id = p_device_id and is_active = true;
  if not found then return; end if;

  factor := factor * case lower(coalesce(p_cosmetic,''))
    when 'kusursuz' then 1.00 when 'çok iyi' then 0.96 when 'iyi' then 0.90 when 'orta' then 0.80 when 'yıpranmış' then 0.68 else 0.88 end;
  factor := factor * case lower(coalesce(p_working,''))
    when 'tam çalışıyor' then 1.00 when 'kısmi arızalı' then 0.75 when 'çalışmıyor' then 0.42 else 0.82 end;
  factor := factor * case lower(coalesce(p_screen,''))
    when 'çiziksiz' then 1.00 when 'hafif çizik' then 0.97 when 'derin çizik' then 0.88 when 'çatlak / kırık' then 0.68 else 0.94 end;
  factor := factor * case lower(coalesce(p_body,''))
    when 'temiz' then 1.00 when 'hafif izler' then 0.97 when 'çizik / ezik' then 0.90 when 'hasarlı' then 0.78 else 0.94 end;

  begin
    battery_value := nullif(regexp_replace(coalesce(p_battery,''), '[^0-9.]', '', 'g'), '')::numeric;
  exception when others then battery_value := null;
  end;
  factor := factor * case
    when battery_value is null then 0.94
    when battery_value >= 90 then 1.00
    when battery_value >= 85 then 0.98
    when battery_value >= 80 then 0.95
    when battery_value >= 75 then 0.90
    else 0.84 end;

  if length(trim(coalesce(p_repairs,''))) > 0 and lower(trim(p_repairs)) not in ('yok','hayır','yoktur') then factor := factor * 0.90; end if;
  if length(trim(coalesce(p_accessories,''))) > 0 then factor := factor * 1.01; end if;

  raw_estimate := round(d.base_estimate * factor / 250) * 250;
  estimate := greatest(d.min_estimate, least(d.max_estimate, raw_estimate));
  estimate_min := greatest(d.min_estimate, round((estimate * 0.92) / 250) * 250);
  estimate_max := least(d.max_estimate, round((estimate * 1.08) / 250) * 250);
  confidence := case when p_cosmetic <> '' and p_working <> '' and p_screen <> '' and p_body <> '' then 'yüksek' else 'orta' end;
  return next;
end;
$$;

revoke all on function public.get_trade_in_catalog() from public;
revoke all on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text) from public;
grant execute on function public.get_trade_in_catalog() to anon, authenticated;
grant execute on function public.estimate_trade_in(uuid,text,text,text,text,text,text,text) to anon, authenticated;
