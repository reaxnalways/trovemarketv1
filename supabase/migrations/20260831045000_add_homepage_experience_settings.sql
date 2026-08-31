alter table public.site_settings
  add column if not exists announcement_enabled boolean not null default true,
  add column if not exists announcement_items text[] not null default array['Sıfır & ikinci el telefonlar','Laptop & bilgisayar','Bilgisayar parçaları','Hızlı teknik servis','WhatsApp iletişim'],
  add column if not exists announcement_speed_seconds integer not null default 24,
  add column if not exists announcement_pause_on_hover boolean not null default true,
  add column if not exists slider_autoplay boolean not null default true,
  add column if not exists slider_interval_seconds integer not null default 3,
  add column if not exists slider_transition text not null default 'slide',
  add column if not exists slider_reveal_effect text not null default 'rise',
  add column if not exists slider_pause_on_hover boolean not null default true;

alter table public.site_settings
  drop constraint if exists site_settings_announcement_speed_seconds_check,
  add constraint site_settings_announcement_speed_seconds_check check (announcement_speed_seconds between 8 and 120),
  drop constraint if exists site_settings_slider_interval_seconds_check,
  add constraint site_settings_slider_interval_seconds_check check (slider_interval_seconds between 2 and 15),
  drop constraint if exists site_settings_slider_transition_check,
  add constraint site_settings_slider_transition_check check (slider_transition in ('slide','fade','zoom')),
  drop constraint if exists site_settings_slider_reveal_effect_check,
  add constraint site_settings_slider_reveal_effect_check check (slider_reveal_effect in ('rise','fade','zoom','none'));
