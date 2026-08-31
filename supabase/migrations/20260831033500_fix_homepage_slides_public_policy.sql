drop policy if exists "Homepage slides are public" on public.homepage_slides;

create policy "Homepage slides are public"
on public.homepage_slides
for select
to anon
using (is_active = true);

create policy "Authenticated users can view homepage slides"
on public.homepage_slides
for select
to authenticated
using (is_active = true or (select private.is_admin()));
