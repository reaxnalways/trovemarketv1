grant update, delete on table public.technical_service_records to authenticated;

create policy "Admins can update technical service records"
on public.technical_service_records
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins can delete technical service records"
on public.technical_service_records
for delete
to authenticated
using ((select private.is_admin()));

create index if not exists technical_service_records_created_by_idx
on public.technical_service_records(created_by);
