alter table public.site_settings
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists instagram_url text,
  add column if not exists company_address text,
  add column if not exists about_text text;
