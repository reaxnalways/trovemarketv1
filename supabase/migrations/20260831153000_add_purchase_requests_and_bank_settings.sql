alter table public.site_settings
  add column if not exists purchase_enabled boolean not null default false,
  add column if not exists bank_name text,
  add column if not exists bank_account_holder text,
  add column if not exists iban text;

create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  product_code text not null,
  product_title text not null,
  product_price numeric(12,2),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  address_line text not null,
  district text not null,
  city text not null,
  postal_code text,
  invoice_type text not null check (invoice_type in ('individual','company')),
  invoice_name text not null,
  invoice_company text,
  tax_office text,
  tax_number text,
  payment_method text not null default 'bank_transfer' check (payment_method = 'bank_transfer'),
  status text not null default 'new' check (status in ('new','contacted','awaiting_payment','paid','cancelled','completed')),
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.purchase_requests enable row level security;

create policy "Admins can view purchase requests" on public.purchase_requests
for select to authenticated using ((select private.is_admin()));

create policy "Admins can update purchase requests" on public.purchase_requests
for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create or replace function public.submit_purchase_request(
  p_product_code text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_address_line text,
  p_district text,
  p_city text,
  p_postal_code text,
  p_invoice_type text,
  p_invoice_name text,
  p_invoice_company text,
  p_tax_office text,
  p_tax_number text,
  p_customer_note text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_enabled boolean;
  v_id uuid;
begin
  select purchase_enabled into v_enabled from public.site_settings where id = true;
  if coalesce(v_enabled, false) = false then raise exception 'PURCHASE_DISABLED'; end if;

  select * into v_product from public.products
  where product_code = trim(p_product_code)
    and publication_status = 'published'
    and stock_status = 'in_stock'
  limit 1;
  if v_product.id is null then raise exception 'PRODUCT_NOT_AVAILABLE'; end if;

  if length(trim(p_customer_name)) < 3 or length(trim(p_customer_name)) > 120 then raise exception 'INVALID_NAME'; end if;
  if length(regexp_replace(coalesce(p_customer_phone,''),'[^0-9]','','g')) < 10 then raise exception 'INVALID_PHONE'; end if;
  if trim(coalesce(p_customer_email,'')) !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then raise exception 'INVALID_EMAIL'; end if;
  if length(trim(p_address_line)) < 10 or length(trim(p_city)) < 2 or length(trim(p_district)) < 2 then raise exception 'INVALID_ADDRESS'; end if;
  if p_invoice_type not in ('individual','company') then raise exception 'INVALID_INVOICE_TYPE'; end if;
  if p_invoice_type = 'company' and (length(trim(coalesce(p_invoice_company,''))) < 2 or length(trim(coalesce(p_tax_number,''))) < 5) then raise exception 'INVALID_COMPANY_INVOICE'; end if;

  insert into public.purchase_requests (
    product_id, product_code, product_title, product_price,
    customer_name, customer_phone, customer_email,
    address_line, district, city, postal_code,
    invoice_type, invoice_name, invoice_company, tax_office, tax_number,
    customer_note
  ) values (
    v_product.id, v_product.product_code, v_product.title, v_product.price,
    trim(p_customer_name), trim(p_customer_phone), lower(trim(p_customer_email)),
    trim(p_address_line), trim(p_district), trim(p_city), nullif(trim(coalesce(p_postal_code,'')),''),
    p_invoice_type, trim(p_invoice_name), nullif(trim(coalesce(p_invoice_company,'')),''), nullif(trim(coalesce(p_tax_office,'')),''), nullif(trim(coalesce(p_tax_number,'')),''),
    nullif(left(trim(coalesce(p_customer_note,'')),1000),'')
  ) returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.submit_purchase_request(text,text,text,text,text,text,text,text,text,text,text,text,text,text) to anon, authenticated;
