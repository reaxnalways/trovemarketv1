create extension if not exists pg_trgm with schema extensions;

create table if not exists private.brand_canonical (
  canonical_name text primary key,
  normalized_key text not null unique
);
create table if not exists private.brand_alias (
  alias_key text primary key,
  canonical_name text not null references private.brand_canonical(canonical_name) on update cascade on delete cascade
);
create table if not exists private.model_alias (
  brand_name text not null,
  alias_key text not null,
  canonical_model text not null,
  primary key (brand_name, alias_key)
);
revoke all on private.brand_canonical from public, anon, authenticated;
revoke all on private.brand_alias from public, anon, authenticated;
revoke all on private.model_alias from public, anon, authenticated;

create or replace function private.catalog_key(p_value text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(translate(lower(trim(coalesce(p_value, ''))), 'ı', 'i'), '[^a-z0-9]+', '', 'g');
$$;

insert into private.brand_canonical(canonical_name, normalized_key) values
('Apple','apple'),('Samsung','samsung'),('Xiaomi','xiaomi'),('POCO','poco'),('Huawei','huawei'),('Honor','honor'),('Oppo','oppo'),('Vivo','vivo'),('Realme','realme'),('Lenovo','lenovo'),('HP','hp'),('Dell','dell'),('Asus','asus'),('Acer','acer'),('MSI','msi'),('Microsoft','microsoft'),('Google','google'),('OnePlus','oneplus'),('Nothing','nothing'),('Sony','sony')
on conflict (canonical_name) do update set normalized_key = excluded.normalized_key;

insert into private.brand_alias(alias_key, canonical_name) values
('apple','Apple'),('aple','Apple'),('aplee','Apple'),('aplle','Apple'),('appel','Apple'),
('samsung','Samsung'),('samsng','Samsung'),('samsun','Samsung'),('samung','Samsung'),
('xiaomi','Xiaomi'),('xiomi','Xiaomi'),('xioami','Xiaomi'),('mi','Xiaomi'),
('poco','POCO'),('pocco','POCO'),('huawei','Huawei'),('huaweii','Huawei'),
('honor','Honor'),('oppo','Oppo'),('vivo','Vivo'),('realme','Realme'),('lenovo','Lenovo'),
('hp','HP'),('hewlettpackard','HP'),('dell','Dell'),('asus','Asus'),('acer','Acer'),('msi','MSI'),
('microsoft','Microsoft'),('google','Google'),('oneplus','OnePlus'),('nothing','Nothing'),('sony','Sony')
on conflict (alias_key) do update set canonical_name = excluded.canonical_name;

create or replace function private.canonical_brand(p_brand text)
returns text language plpgsql stable set search_path = '' as $$
declare
  v_raw text := trim(coalesce(p_brand, ''));
  v_key text;
  v_exact text;
  v_best text;
  v_best_score real;
  v_second_score real;
begin
  if v_raw = '' then return null; end if;
  v_key := private.catalog_key(v_raw);
  select a.canonical_name into v_exact from private.brand_alias a where a.alias_key = v_key;
  if v_exact is not null then return v_exact; end if;

  select max(case when rn=1 then canonical_name end),
         max(case when rn=1 then score end),
         max(case when rn=2 then score end)
    into v_best, v_best_score, v_second_score
  from (
    select b.canonical_name,
           extensions.similarity(v_key, b.normalized_key) score,
           row_number() over(order by extensions.similarity(v_key, b.normalized_key) desc) rn
    from private.brand_canonical b
  ) s
  where rn <= 2;

  if v_best_score >= 0.72 and (v_second_score is null or v_best_score - v_second_score >= 0.08) then
    return v_best;
  end if;
  return initcap(v_raw);
end;
$$;

create or replace function private.format_known_model(p_brand text, p_model text)
returns text language plpgsql immutable set search_path = '' as $$
declare v text := regexp_replace(trim(coalesce(p_model, '')), '\s+', ' ', 'g');
begin
  if v = '' then return null; end if;
  if p_brand = 'Apple' then
    v := regexp_replace(v, '^[iİ]phone\b', 'iPhone', 'i');
    v := regexp_replace(v, '^ipad\b', 'iPad', 'i');
    v := regexp_replace(v, '^macbook\b', 'MacBook', 'i');
    v := regexp_replace(v, '\bpro max\b', 'Pro Max', 'i');
    v := regexp_replace(v, '\bpro\b', 'Pro', 'i');
    v := regexp_replace(v, '\bplus\b', 'Plus', 'i');
    v := regexp_replace(v, '\bair\b', 'Air', 'i');
    v := regexp_replace(v, '\bmini\b', 'mini', 'i');
  elsif p_brand = 'Samsung' then
    v := regexp_replace(v, '^galaxy\b', 'Galaxy', 'i');
    v := regexp_replace(v, '\bultra\b', 'Ultra', 'i');
    v := regexp_replace(v, '\bplus\b', 'Plus', 'i');
    v := regexp_replace(v, '\bfe\b', 'FE', 'i');
  elsif p_brand in ('Xiaomi','POCO') then
    v := regexp_replace(v, '^redmi\b', 'Redmi', 'i');
    v := regexp_replace(v, '^xiaomi\b', 'Xiaomi', 'i');
    v := regexp_replace(v, '^poco\b', 'POCO', 'i');
    v := regexp_replace(v, '\bpro\b', 'Pro', 'i');
    v := regexp_replace(v, '\bultra\b', 'Ultra', 'i');
  end if;
  return v;
end;
$$;

create or replace function private.canonical_model(p_brand text, p_model text)
returns text language plpgsql stable set search_path = '' as $$
declare
  v_brand text := private.canonical_brand(p_brand);
  v_raw text := private.format_known_model(v_brand, p_model);
  v_key text;
  v_exact text;
begin
  if v_raw is null then return null; end if;
  v_key := private.catalog_key(v_raw);
  select m.canonical_model into v_exact
  from private.model_alias m
  where m.brand_name = v_brand and m.alias_key = v_key;
  if v_exact is not null then return v_exact; end if;
  return v_raw;
end;
$$;

insert into private.model_alias(brand_name, alias_key, canonical_model)
select brand_name, alias_key, canonical_model
from (
  select private.canonical_brand(brand) brand_name,
         private.catalog_key(private.format_known_model(private.canonical_brand(brand), model)) alias_key,
         private.format_known_model(private.canonical_brand(brand), model) canonical_model,
         row_number() over(
           partition by private.canonical_brand(brand), private.catalog_key(private.format_known_model(private.canonical_brand(brand), model))
           order by count(*) desc, private.format_known_model(private.canonical_brand(brand), model)
         ) rn
  from (
    select brand, model from public.products where brand is not null and model is not null
    union all
    select brand, model from public.trade_in_devices where brand is not null and model is not null
  ) s
  group by brand, model
) ranked
where rn=1 and brand_name is not null and alias_key<>''
on conflict (brand_name, alias_key) do update set canonical_model=excluded.canonical_model;

insert into private.model_alias(brand_name, alias_key, canonical_model) values
('Apple','iphone15promax','iPhone 15 Pro Max'),
('Apple','iphone17promax','iPhone 17 Pro Max')
on conflict (brand_name, alias_key) do update set canonical_model=excluded.canonical_model;

create or replace function private.normalize_brand_model_row()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.brand is not null then new.brand := private.canonical_brand(new.brand); end if;
  if new.model is not null then new.model := private.canonical_model(new.brand,new.model); end if;
  return new;
end;
$$;

drop trigger if exists normalize_products_brand_model on public.products;
create trigger normalize_products_brand_model before insert or update of brand,model on public.products
for each row execute function private.normalize_brand_model_row();

drop trigger if exists normalize_trade_in_brand_model on public.trade_in_devices;
create trigger normalize_trade_in_brand_model before insert or update of brand,model on public.trade_in_devices
for each row execute function private.normalize_brand_model_row();

drop trigger if exists normalize_pricing_override_brand_model on public.pricing_overrides;
create trigger normalize_pricing_override_brand_model before insert or update of brand,model on public.pricing_overrides
for each row execute function private.normalize_brand_model_row();

update public.products
set brand=private.canonical_brand(brand), model=private.canonical_model(brand,model)
where brand is not null or model is not null;

update public.pricing_overrides
set brand=private.canonical_brand(brand), model=private.canonical_model(brand,model)
where brand is not null or model is not null;

update public.trade_in_devices t
set brand=private.canonical_brand(t.brand), model=private.canonical_model(t.brand,t.model)
where (t.brand is not null or t.model is not null)
and not exists (
  select 1 from public.trade_in_devices o
  where o.id<>t.id
    and o.device_type=t.device_type
    and private.canonical_brand(o.brand)=private.canonical_brand(t.brand)
    and private.canonical_model(o.brand,o.model)=private.canonical_model(t.brand,t.model)
    and coalesce(o.storage,'')=coalesce(t.storage,'')
);