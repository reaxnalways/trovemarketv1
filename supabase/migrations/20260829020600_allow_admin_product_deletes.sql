grant delete on table public.products to authenticated;

create policy "Admins can delete products"
on public.products
for delete
to authenticated
using ((select private.is_admin()));
