-- Canonical technical-service rules: one billable code per physical subsystem.
update public.pricing_fault_rules set is_active=false where service_fault_code in ('display','touch','camera','charge','power','liquid','audio');

with canonical(label,code,pct,minimum,sort_order) as (
 values
 ('Ekran / dokunmatik değişimi','screen',28::numeric,2500::numeric,10),('Batarya değişimi','battery',8::numeric,1200::numeric,20),('Arka cam / arka kapak','rear_glass',10::numeric,1200::numeric,30),('Kamera lens camı','camera_lens',6::numeric,800::numeric,40),('Ön kamera','front_camera',10::numeric,1200::numeric,41),('Arka kamera','rear_camera',15::numeric,1500::numeric,42),('Face ID / yüz tanıma','face_id',14::numeric,1800::numeric,50),('Parmak izi sensörü','fingerprint',10::numeric,1200::numeric,51),('Şarj soketi / portu','charging_port',8::numeric,1000::numeric,60),('Kablosuz şarj','wireless_charging',7::numeric,900::numeric,61),('Güç tuşu','power_button',5::numeric,700::numeric,70),('Ses tuşları','volume_buttons',4::numeric,600::numeric,71),('Hoparlör','speaker',6::numeric,800::numeric,80),('Ahize','earpiece',5::numeric,700::numeric,81),('Mikrofon','microphone',6::numeric,800::numeric,82),('Titreşim motoru','vibration',5::numeric,700::numeric,83),('Wi-Fi / Bluetooth','wireless',12::numeric,1500::numeric,90),('Şebeke / SIM','cellular',16::numeric,2000::numeric,91),('Yakınlık / ışık sensörü','proximity_sensor',5::numeric,700::numeric,92),('Diğer sensör','sensors',8::numeric,900::numeric,93),('Sıvı teması / oksit temizliği','liquid_cleaning',12::numeric,1500::numeric,100),('Anakart onarımı','motherboard',22::numeric,2500::numeric,110),('Açılmıyor / güç arızası','no_power',18::numeric,2000::numeric,111),('Yazılım / sistem onarımı','software',4::numeric,600::numeric,120),('Veri aktarımı / yedekleme','data_transfer',3::numeric,500::numeric,121)
)
update public.pricing_fault_rules r set label=c.label,service_pct=c.pct,min_service_price=c.minimum,sort_order=c.sort_order,is_active=true,updated_at=now() from canonical c where r.service_fault_code=c.code;

with canonical(label,code,pct,minimum,sort_order) as (
 values
 ('Ekran / dokunmatik değişimi','screen',28::numeric,2500::numeric,10),('Batarya değişimi','battery',8::numeric,1200::numeric,20),('Arka cam / arka kapak','rear_glass',10::numeric,1200::numeric,30),('Kamera lens camı','camera_lens',6::numeric,800::numeric,40),('Ön kamera','front_camera',10::numeric,1200::numeric,41),('Arka kamera','rear_camera',15::numeric,1500::numeric,42),('Face ID / yüz tanıma','face_id',14::numeric,1800::numeric,50),('Parmak izi sensörü','fingerprint',10::numeric,1200::numeric,51),('Şarj soketi / portu','charging_port',8::numeric,1000::numeric,60),('Kablosuz şarj','wireless_charging',7::numeric,900::numeric,61),('Güç tuşu','power_button',5::numeric,700::numeric,70),('Ses tuşları','volume_buttons',4::numeric,600::numeric,71),('Hoparlör','speaker',6::numeric,800::numeric,80),('Ahize','earpiece',5::numeric,700::numeric,81),('Mikrofon','microphone',6::numeric,800::numeric,82),('Titreşim motoru','vibration',5::numeric,700::numeric,83),('Wi-Fi / Bluetooth','wireless',12::numeric,1500::numeric,90),('Şebeke / SIM','cellular',16::numeric,2000::numeric,91),('Yakınlık / ışık sensörü','proximity_sensor',5::numeric,700::numeric,92),('Diğer sensör','sensors',8::numeric,900::numeric,93),('Sıvı teması / oksit temizliği','liquid_cleaning',12::numeric,1500::numeric,100),('Anakart onarımı','motherboard',22::numeric,2500::numeric,110),('Açılmıyor / güç arızası','no_power',18::numeric,2000::numeric,111),('Yazılım / sistem onarımı','software',4::numeric,600::numeric,120),('Veri aktarımı / yedekleme','data_transfer',3::numeric,500::numeric,121)
)
insert into public.pricing_fault_rules(label,service_fault_code,service_pct,min_service_price,is_active,sort_order)
select c.label,c.code,c.pct,c.minimum,true,c.sort_order from canonical c where not exists(select 1 from public.pricing_fault_rules r where r.service_fault_code=c.code);

create or replace function private.device_reference_price(p_device_type text,p_brand text,p_model text)
returns numeric language sql stable set search_path to '' as $$
 select avg(d.market_price_tr) from public.trade_in_devices d
 where d.is_active=true and d.market_price_tr>0 and lower(d.device_type)=lower(coalesce(p_device_type,'')) and lower(d.brand)=lower(coalesce(p_brand,'')) and lower(d.model)=lower(coalesce(p_model,''));
$$;

create or replace function public.get_service_price_catalog()
returns table(id uuid,device_type text,brand text,model text,fault_code text,fault_label text,min_price numeric,max_price numeric)
language sql stable security definer set search_path to '' as $$
 select r.id,d.device_type,''::text,''::text,r.service_fault_code,r.label,coalesce(r.min_service_price,0),coalesce(r.max_service_price,0)
 from public.pricing_fault_rules r cross join (select distinct t.device_type from public.trade_in_devices t where t.is_active=true and t.market_price_tr>0) d
 where r.is_active=true and r.service_fault_code is not null and r.service_pct>0 order by d.device_type,r.sort_order,r.label;
$$;
revoke execute on function public.get_service_price_catalog() from public;
grant execute on function public.get_service_price_catalog() to anon,authenticated;
