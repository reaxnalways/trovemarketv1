alter table public.site_settings
  add column if not exists site_meta_title text,
  add column if not exists site_meta_description text,
  add column if not exists pwa_name text;
