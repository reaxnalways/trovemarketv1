grant update on table public.products to authenticated;

create policy "Admins can update products"
on public.products
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
