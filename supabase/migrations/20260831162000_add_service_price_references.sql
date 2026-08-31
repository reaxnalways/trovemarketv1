create table if not exists public.service_price_references (
  id uuid primary key default gen_random_uuid(),
  device_type text not null,
  fault_code text not null,
  fault_label text not null,
  min_price numeric(12,2) not null check (min_price >= 0),
  max_price numeric(12,2) not null check (max_price >= min_price),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(device_type, fault_code)
);

alter table public.service_price_references enable row level security;
grant select, insert, update, delete on public.service_price_references to authenticated;

create policy "Admins can read service prices" on public.service_price_references for select to authenticated using (private.is_admin());
create policy "Admins can insert service prices" on public.service_price_references for insert to authenticated with check (private.is_admin());
create policy "Admins can update service prices" on public.service_price_references for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "Admins can delete service prices" on public.service_price_references for delete to authenticated using (private.is_admin());

insert into public.service_price_references(device_type,fault_code,fault_label,min_price,max_price,sort_order) values
('Telefon','screen','Ekran kırık / görüntü sorunu',2500,7000,10),
('Telefon','touch','Dokunmatik çalışmıyor',2000,6000,20),
('Telefon','battery','Batarya hızlı bitiyor / şarj tutmuyor',1500,3500,30),
('Telefon','charge','Şarj olmuyor / şarj soketi sorunu',1200,3000,40),
('Telefon','power','Açılmıyor / güç almıyor',1500,5000,50),
('Telefon','liquid','Sıvı teması',2000,6500,60),
('Telefon','camera','Kamera sorunu',1500,5000,70),
('Telefon','audio','Hoparlör / mikrofon sorunu',1000,3000,80),
('Laptop','screen','Ekran kırık / görüntü sorunu',3000,9000,10),
('Laptop','battery','Batarya hızlı bitiyor / şarj tutmuyor',2000,5500,20),
('Laptop','power','Açılmıyor / güç almıyor',2000,7000,30),
('Laptop','keyboard','Klavye / touchpad sorunu',1200,4500,40),
('Laptop','fan','Fan / ses / ısınma sorunu',1000,3500,50),
('Laptop','storage','Disk / SSD / depolama sorunu',1500,5000,60),
('Laptop','ram','RAM / bellek sorunu',1000,4000,70)
on conflict(device_type,fault_code) do nothing;

create or replace function public.get_service_price_catalog()
returns table(id uuid,device_type text,fault_code text,fault_label text,min_price numeric,max_price numeric)
language sql stable security definer set search_path=''
as $$
 select r.id,r.device_type,r.fault_code,r.fault_label,r.min_price,r.max_price
 from public.service_price_references r where r.is_active=true
 order by r.device_type,r.sort_order,r.fault_label;
$$;

create or replace function public.estimate_service_price(p_device_type text,p_fault_codes text[])
returns table(estimate_min numeric,estimate_max numeric)
language sql stable security definer set search_path=''
as $$
 select coalesce(sum(r.min_price),0),coalesce(sum(r.max_price),0)
 from public.service_price_references r
 where r.is_active=true and r.device_type=p_device_type and r.fault_code=any(p_fault_codes);
$$;

revoke all on function public.get_service_price_catalog() from public;
revoke all on function public.estimate_service_price(text,text[]) from public;
grant execute on function public.get_service_price_catalog() to anon, authenticated;
grant execute on function public.estimate_service_price(text,text[]) to anon, authenticated;
