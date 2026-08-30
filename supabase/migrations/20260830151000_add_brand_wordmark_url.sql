alter table public.site_settings
  add column if not exists brand_wordmark_url text;

comment on column public.site_settings.brand_wordmark_url is
  'Public URL of the optional SVG wordmark displayed next to the header logo.';
