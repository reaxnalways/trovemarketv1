update public.products
set barcode = product_code
where barcode is null;

create or replace function private.sync_product_barcode()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.barcode is null or btrim(new.barcode) = '' then
    new.barcode := new.product_code;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_product_barcode() from public, anon, authenticated;

drop trigger if exists products_sync_barcode on public.products;
create trigger products_sync_barcode
before insert or update of product_code, barcode on public.products
for each row execute function private.sync_product_barcode();
