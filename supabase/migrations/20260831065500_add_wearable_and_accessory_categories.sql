insert into public.categories (name, slug, code_prefix, description, is_active, sort_order)
select 'Giyilebilir Teknoloji', 'giyilebilir-teknoloji', 'GIY', 'Akıllı saat, kulaklık ve giyilebilir teknoloji ürünleri.', true, 40
where not exists (select 1 from public.categories where slug = 'giyilebilir-teknoloji');

insert into public.categories (name, slug, code_prefix, description, is_active, sort_order)
select 'Aksesuar & Yedek Parça', 'aksesuar-yedek-parca', 'AKS', 'Telefon ve bilgisayar aksesuarları ile yedek parçalar.', true, 50
where not exists (select 1 from public.categories where slug = 'aksesuar-yedek-parca');
