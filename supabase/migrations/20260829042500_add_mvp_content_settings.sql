alter table public.site_settings
  add column if not exists campaign_title text,
  add column if not exists campaign_text text,
  add column if not exists campaign_url text,
  add column if not exists service_intro text;

update public.site_settings
set service_intro = coalesce(service_intro, 'Telefon, laptop ve bilgisayar servis ihtiyaçların için hızlıca iletişime geç.')
where id = true;
