create table if not exists public.homepage_slides (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('campaigns','phones','computers','wearables','accessories')),
  title text,
  subtitle text,
  image_url text not null,
  link_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_slides_section_order_idx on public.homepage_slides(section, sort_order, created_at);

alter table public.homepage_slides enable row level security;

drop policy if exists "Homepage slides are public" on public.homepage_slides;
create policy "Homepage slides are public" on public.homepage_slides for select to anon, authenticated using (is_active = true or (select private.is_admin()));

drop policy if exists "Admins can insert homepage slides" on public.homepage_slides;
create policy "Admins can insert homepage slides" on public.homepage_slides for insert to authenticated with check ((select private.is_admin()));

drop policy if exists "Admins can update homepage slides" on public.homepage_slides;
create policy "Admins can update homepage slides" on public.homepage_slides for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists "Admins can delete homepage slides" on public.homepage_slides;
create policy "Admins can delete homepage slides" on public.homepage_slides for delete to authenticated using ((select private.is_admin()));

grant select on public.homepage_slides to anon;
grant select, insert, update, delete on public.homepage_slides to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('homepage-slides','homepage-slides',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Admins can upload homepage slides" on storage.objects;
create policy "Admins can upload homepage slides" on storage.objects for insert to authenticated with check (bucket_id='homepage-slides' and (select private.is_admin()));

drop policy if exists "Admins can update homepage slides" on storage.objects;
create policy "Admins can update homepage slides" on storage.objects for update to authenticated using (bucket_id='homepage-slides' and (select private.is_admin())) with check (bucket_id='homepage-slides' and (select private.is_admin()));

drop policy if exists "Admins can delete homepage slides" on storage.objects;
create policy "Admins can delete homepage slides" on storage.objects for delete to authenticated using (bucket_id='homepage-slides' and (select private.is_admin()));
