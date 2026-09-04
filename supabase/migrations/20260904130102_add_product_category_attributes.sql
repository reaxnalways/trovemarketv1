alter table public.products add column if not exists attributes jsonb not null default '{}'::jsonb;

alter table public.products drop constraint if exists products_attributes_object_check;
alter table public.products add constraint products_attributes_object_check
  check (jsonb_typeof(attributes) = 'object');

comment on column public.products.attributes is
  'Category-specific product attributes stored as a JSON object; common searchable fields remain first-class columns.';
