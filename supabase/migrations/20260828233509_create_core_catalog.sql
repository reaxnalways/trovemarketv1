create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  code_prefix text not null unique check (code_prefix ~ '^[A-Z]{3}$'),
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique check (product_code ~ '^[A-Z]{3}-[0-9]{3,}$'),
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null,
  brand text,
  model text,
  price numeric(12,2) check (price is null or price >= 0),
  condition text check (condition is null or condition in ('new','used','refurbished')),
  storage text,
  color text,
  battery_health smallint check (battery_health is null or battery_health between 0 and 100),
  description text,
  source_url text,
  images text[] not null default '{}',
  barcode text unique,
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock','reserved','sold','out_of_stock')),
  is_featured boolean not null default false,
  publication_status text not null default 'draft' check (publication_status in ('draft','published','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);
create index products_publication_status_idx on public.products(publication_status);
create index products_stock_status_idx on public.products(stock_status);
create index products_featured_idx on public.products(is_featured) where is_featured = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;

revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;

grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;

create policy "active categories are public"
on public.categories for select
to anon, authenticated
using (is_active = true);

create policy "published products are public"
on public.products for select
to anon, authenticated
using (publication_status = 'published');

insert into public.categories (name, slug, code_prefix, sort_order)
values
  ('2. El & Sıfır Telefon', 'telefon', 'TEL', 10),
  ('Teknik Servis', 'teknik-servis', 'SRV', 20),
  ('Laptop & Bilgisayar', 'laptop-bilgisayar', 'LAP', 30),
  ('Bilgisayar Parçaları', 'bilgisayar-parcalari', 'PAR', 40);
