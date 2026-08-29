alter table public.products
  add column if not exists device_region text;

alter table public.products
  drop constraint if exists products_device_region_check;

alter table public.products
  add constraint products_device_region_check
  check (device_region is null or device_region in ('tr','international'));
