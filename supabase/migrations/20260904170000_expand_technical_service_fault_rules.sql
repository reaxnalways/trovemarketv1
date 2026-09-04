-- Detailed technical-service operation coefficients. Existing rules keep their current values.
insert into public.pricing_fault_rules
  (label, service_fault_code, service_pct, min_service_price, is_active, sort_order)
values
  ('Ekran görüntü arızası', 'display', 24, 2200, true, 41),
  ('Arka cam / arka kapak değişimi', 'rear_glass', 10, 1200, true, 45),
  ('Kamera lens camı', 'camera_lens', 6, 800, true, 51),
  ('Ön kamera', 'front_camera', 10, 1200, true, 52),
  ('Arka kamera', 'rear_camera', 15, 1500, true, 53),
  ('Face ID / yüz tanıma', 'face_id', 14, 1800, true, 54),
  ('Parmak izi sensörü', 'fingerprint', 10, 1200, true, 55),
  ('Şarj soketi / portu', 'charging_port', 8, 1000, true, 60),
  ('Kablosuz şarj', 'wireless_charging', 7, 900, true, 61),
  ('Güç tuşu', 'power_button', 5, 700, true, 70),
  ('Ses tuşları', 'volume_buttons', 4, 600, true, 71),
  ('Hoparlör', 'speaker', 6, 800, true, 80),
  ('Ahize', 'earpiece', 5, 700, true, 81),
  ('Mikrofon', 'microphone', 6, 800, true, 82),
  ('Titreşim motoru', 'vibration', 5, 700, true, 83),
  ('Wi-Fi / Bluetooth', 'wireless', 12, 1500, true, 90),
  ('Şebeke / SIM', 'cellular', 16, 2000, true, 91),
  ('Yakınlık / ışık sensörü', 'proximity_sensor', 5, 700, true, 92),
  ('Diğer sensörler', 'sensors', 8, 900, true, 93),
  ('Sıvı teması / oksit temizliği', 'liquid_cleaning', 12, 1500, true, 100),
  ('Anakart onarımı', 'motherboard', 22, 2500, true, 110),
  ('Açılmıyor / güç arızası', 'no_power', 18, 2000, true, 111),
  ('Yazılım / sistem onarımı', 'software', 4, 600, true, 120),
  ('Veri aktarımı / yedekleme', 'data_transfer', 3, 500, true, 121)
on conflict do nothing;
