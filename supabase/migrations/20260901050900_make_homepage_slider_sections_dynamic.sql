alter table public.homepage_slides drop constraint if exists homepage_slides_section_check;

update public.homepage_slides set section = 'category:telefon' where section = 'phones';
update public.homepage_slides set section = 'category:laptop-bilgisayar' where section = 'computers';
update public.homepage_slides set section = 'category:giyilebilir-teknoloji' where section = 'wearables';
update public.homepage_slides set section = 'category:aksesuar-yedek-parca' where section = 'accessories';

alter table public.homepage_slides
  add constraint homepage_slides_section_check
  check (section = 'campaigns' or section ~ '^category:[a-z0-9]+(?:-[a-z0-9]+)*$');
