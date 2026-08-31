alter table public.homepage_slides
  add column if not exists transition_effect text;

alter table public.homepage_slides
  drop constraint if exists homepage_slides_transition_effect_check,
  add constraint homepage_slides_transition_effect_check
  check (transition_effect is null or transition_effect in ('slide','fade','zoom','flip','blur','stack'));
