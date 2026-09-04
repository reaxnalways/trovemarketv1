create or replace function private.normalize_brand_model_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.brand is not null then
    new.brand := private.canonical_brand(new.brand);
  end if;
  if new.model is not null then
    new.model := private.canonical_model(new.brand, new.model);
  end if;
  return new;
end;
$$;

revoke all on function private.normalize_brand_model_row() from public, anon, authenticated;

drop trigger if exists normalize_products_brand_model on public.products;
create trigger normalize_products_brand_model
before insert or update of brand, model on public.products
for each row execute function private.normalize_brand_model_row();

drop trigger if exists normalize_trade_in_brand_model on public.trade_in_devices;
create trigger normalize_trade_in_brand_model
before insert or update of brand, model on public.trade_in_devices
for each row execute function private.normalize_brand_model_row();

drop trigger if exists normalize_pricing_override_brand_model on public.pricing_overrides;
create trigger normalize_pricing_override_brand_model
before insert or update of brand, model on public.pricing_overrides
for each row execute function private.normalize_brand_model_row();
