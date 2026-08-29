alter table public.products drop constraint if exists products_device_region_check;
alter table public.products
  add constraint products_device_region_check
  check (device_region is null or device_region in ('tr', 'passport', 'international'));

create sequence if not exists private.product_code_seq;

select setval(
  'private.product_code_seq',
  greatest(
    coalesce((
      select max(substring(product_code from 2)::bigint)
      from public.products
      where product_code ~ '^1[0-9]{10}$'
    ), 0),
    1
  ),
  true
);

create or replace function private.assign_product_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_next bigint;
begin
  if new.product_code is not null and btrim(new.product_code) <> '' then
    return new;
  end if;

  v_next := nextval('private.product_code_seq');
  if v_next > 9999999999 then
    raise exception 'Trove ürün kodu aralığı tükendi';
  end if;

  new.product_code := '1' || lpad(v_next::text, 10, '0');
  return new;
end;
$$;

revoke all on sequence private.product_code_seq from public, anon, authenticated;
revoke all on function private.assign_product_code() from public, anon, authenticated;
