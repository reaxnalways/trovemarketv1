alter table public.products drop constraint if exists products_product_code_check;

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

  insert into private.product_code_counters (category_id, last_value)
  values (new.category_id, 1)
  on conflict (category_id)
  do update set last_value = private.product_code_counters.last_value + 1
  returning last_value into v_next;

  new.product_code := '1' || lpad(v_next::text, 10, '0');
  return new;
end;
$$;

update public.products
set product_code = '1' || lpad(numbered.seq::text, 10, '0'),
    barcode = '1' || lpad(numbered.seq::text, 10, '0')
from (
  select id, row_number() over (order by created_at, id) as seq
  from public.products
) numbered
where public.products.id = numbered.id;

alter table public.products
  add constraint products_product_code_check
  check (product_code ~ '^[0-9]{11}$');

update private.product_code_counters
set last_value = greatest(last_value, (select count(*) from public.products));
