create index if not exists brand_alias_canonical_name_idx on private.brand_alias(canonical_name);
create index if not exists price_update_history_changed_by_idx on public.price_update_history(changed_by);
create index if not exists pricing_scoped_bulk_history_category_id_idx on public.pricing_scoped_bulk_history(category_id);
create index if not exists purchase_requests_product_id_idx on public.purchase_requests(product_id);
create index if not exists purchase_status_history_purchase_request_id_idx on public.purchase_status_history(purchase_request_id);
create index if not exists purchase_status_history_changed_by_idx on public.purchase_status_history(changed_by);
