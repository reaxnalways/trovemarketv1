create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.product_code_counters (
  category_id uuid primary key references public.categories(id) on delete cascade,
  last_value bigint not null default 0 check (last_value >= 0)
);

insert into private.product_code_counters (category_id, last_value)
select id, 0 from public.categories
on conflict (category_id) do nothing;

create or replace function private.assign_product_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text;
  v_next bigint;
begin
  if new.product_code is not null and btrim(new.product_code) <> '' then
    return new;
  end if;

  select c.code_prefix
    into v_prefix
  from public.categories c
  where c.id = new.category_id;

  if v_prefix is null then
    raise exception 'Category not found for product code generation';
  end if;

  insert into private.product_code_counters (category_id, last_value)
  values (new.category_id, 1)
  on conflict (category_id)
  do update set last_value = private.product_code_counters.last_value + 1
  returning last_value into v_next;

  new.product_code := v_prefix || '-' || lpad(v_next::text, 3, '0');
  return new;
end;
$$;

revoke all on function private.assign_product_code() from public, anon, authenticated;

create trigger products_assign_product_code
before insert on public.products
for each row execute function private.assign_product_code();
