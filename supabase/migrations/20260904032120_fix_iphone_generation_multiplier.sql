create or replace function private.pricing_generation_multiplier(p_brand text,p_model text)
returns numeric language plpgsql immutable set search_path='' as $$
declare v_generation integer;
begin
 if lower(coalesce(p_brand,''))='apple' and coalesce(p_model,'') ilike '%phone%' then
   begin v_generation := (regexp_match(coalesce(p_model,''), '([0-9]{1,2})'))[1]::integer; exception when others then v_generation := null; end;
   if v_generation is not null then return least(1.80,greatest(0.85,1 + (v_generation-11)*0.10)); end if;
 end if;
 return 1.00;
end;
$$;
