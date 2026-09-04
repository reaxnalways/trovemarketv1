-- Detailed technical-service operation coefficients. Existing rules keep their current values.
insert into public.pricing_fault_rules
  (label, service_fault_code, service_pct, min_service_price, is_active, sort_order)
select v.label, v.code, v.pct, v.minimum, true, v.sort_order
from (values
  ('Ekran görüntü arızası', 'display', 24::numeric, 2200::numeric, 41),
  ('Arka cam / arka kapak değişimi', 'rear_glass', 10::numeric, 1200::numeric, 45),
  ('Kamera lens camı', 'camera_lens', 6::numeric, 800::numeric, 51),
  ('Ön kamera', 'front_camera', 10::numeric, 1200::numeric, 52),
  ('Arka kamera', 'rear_camera', 15::numeric, 1500::numeric, 53),
  ('Face ID / yüz tanıma', 'face_id', 14::numeric, 1800::numeric, 54),
  ('Parmak izi sensörü', 'fingerprint', 10::numeric, 1200::numeric, 55),
  ('Şarj soketi / portu', 'charging_port', 8::numeric, 1000::numeric, 60),
  ('Kablosuz şarj', 'wireless_charging', 7::numeric, 900::numeric, 61),
  ('Güç tuşu', 'power_button', 5::numeric, 700::numeric, 70),
  ('Ses tuşları', 'volume_buttons', 4::numeric, 600::numeric, 71),
  ('Hoparlör', 'speaker', 6::numeric, 800::numeric, 80),
  ('Ahize', 'earpiece', 5::numeric, 700::numeric, 81),
  ('Mikrofon', 'microphone', 6::numeric, 800::numeric, 82),
  ('Titreşim motoru', 'vibration', 5::numeric, 700::numeric, 83),
  ('Wi-Fi / Bluetooth', 'wireless', 12::numeric, 1500::numeric, 90),
  ('Şebeke / SIM', 'cellular', 16::numeric, 2000::numeric, 91),
  ('Yakınlık / ışık sensörü', 'proximity_sensor', 5::numeric, 700::numeric, 92),
  ('Diğer sensörler', 'sensors', 8::numeric, 900::numeric, 93),
  ('Sıvı teması / oksit temizliği', 'liquid_cleaning', 12::numeric, 1500::numeric, 100),
  ('Anakart onarımı', 'motherboard', 22::numeric, 2500::numeric, 110),
  ('Açılmıyor / güç arızası', 'no_power', 18::numeric, 2000::numeric, 111),
  ('Yazılım / sistem onarımı', 'software', 4::numeric, 600::numeric, 120),
  ('Veri aktarımı / yedekleme', 'data_transfer', 3::numeric, 500::numeric, 121)
) as v(label, code, pct, minimum, sort_order)
where not exists (select 1 from public.pricing_fault_rules r where r.service_fault_code=v.code);

create or replace function public.get_service_price_catalog()
returns table(id uuid, device_type text, brand text, model text, fault_code text, fault_label text, min_price numeric, max_price numeric)
language sql stable security definer set search_path to '' as $$
  select r.id,'Telefon'::text,''::text,''::text,r.service_fault_code,r.label,coalesce(r.min_service_price,0),coalesce(r.max_service_price,0)
  from public.pricing_fault_rules r
  where r.is_active=true and r.service_fault_code is not null and r.service_pct>0
  order by r.sort_order,r.label
$$;
revoke all on function public.get_service_price_catalog() from public;
grant execute on function public.get_service_price_catalog() to anon,authenticated;
