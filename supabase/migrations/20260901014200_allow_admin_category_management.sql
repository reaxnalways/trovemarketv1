drop policy if exists "admins manage categories" on public.categories;

create policy "admins manage categories"
on public.categories
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());
