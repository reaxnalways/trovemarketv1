alter table public.site_settings
  add column if not exists legal_company_name text,
  add column if not exists tax_number text,
  add column if not exists mersis_number text,
  add column if not exists kep_address text,
  add column if not exists trade_registry_number text,
  add column if not exists chamber_name text,
  add column if not exists etbis_registered boolean not null default false,
  add column if not exists etbis_site_url text,
  add column if not exists etbis_qr_url text;
