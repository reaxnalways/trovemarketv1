alter table public.site_settings
  add column if not exists app_icon_url text;

alter table public.site_settings
  drop constraint if exists site_settings_slider_transition_check,
  add constraint site_settings_slider_transition_check check (slider_transition in ('slide','fade','zoom','flip','blur','stack')),
  drop constraint if exists site_settings_slider_reveal_effect_check,
  add constraint site_settings_slider_reveal_effect_check check (slider_reveal_effect in ('rise','fade','zoom','left','right','blur','tilt','none'));

update storage.buckets
set allowed_mime_types = array['image/svg+xml','image/png']
where id = 'brand-assets';
