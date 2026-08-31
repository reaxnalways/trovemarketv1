create extension if not exists pgcrypto;

create or replace function private.assign_product_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_attempt integer := 0;
begin
  if new.product_code is not null and btrim(new.product_code) <> '' then
    return new;
  end if;

  loop
    v_attempt := v_attempt + 1;
    -- 11 haneli, 1 ile başlayan fakat sıralı olmayan rastgele Trove ürün/barkod kodu.
    v_code := '1' || lpad((floor(random() * 10000000000))::bigint::text, 10, '0');

    exit when not exists (
      select 1 from public.products where product_code = v_code
    );

    if v_attempt >= 25 then
      raise exception 'Benzersiz Trove ürün kodu üretilemedi';
    end if;
  end loop;

  new.product_code := v_code;
  return new;
end;
$$;

revoke all on function private.assign_product_code() from public, anon, authenticated;
