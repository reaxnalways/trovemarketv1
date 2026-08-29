create table if not exists public.site_settings (
  id boolean primary key default true check (id = true),
  site_name text not null default 'Trove Teknoloji',
  site_tagline text not null default 'Teknoloji alışverişi ve servis, tek yerde.',
  whatsapp_number text,
  whatsapp_default_message text not null default 'Merhaba Trove Teknoloji, bilgi almak istiyorum.',
  logo_url text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant insert, update on table public.site_settings to authenticated;

create policy "Public can read site settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Admins can insert site settings" on public.site_settings for insert to authenticated with check ((select private.is_admin()));
create policy "Admins can update site settings" on public.site_settings for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-assets', 'brand-assets', true, 1048576, array['image/svg+xml'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can upload brand assets" on storage.objects for insert to authenticated with check (bucket_id = 'brand-assets' and (select private.is_admin()));
create policy "Admins can view brand asset objects" on storage.objects for select to authenticated using (bucket_id = 'brand-assets' and (select private.is_admin()));
create policy "Admins can update brand assets" on storage.objects for update to authenticated using (bucket_id = 'brand-assets' and (select private.is_admin())) with check (bucket_id = 'brand-assets' and (select private.is_admin()));
create policy "Admins can delete brand assets" on storage.objects for delete to authenticated using (bucket_id = 'brand-assets' and (select private.is_admin()));
