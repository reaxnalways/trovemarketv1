create or replace function private.assign_technical_service_code()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_next bigint; v_prefix text; v_barcode_prefix text;
begin
  if new.service_type not in ('phone','computer','laptop','playstation') then raise exception 'Geçersiz teknik servis türü'; end if;
  if new.service_code is null or btrim(new.service_code) = '' then
    case new.service_type
      when 'phone' then v_next := nextval('private.technical_service_phone_seq'); v_prefix := 'TS-TEL-'; v_barcode_prefix := '21';
      when 'computer' then v_next := nextval('private.technical_service_computer_seq'); v_prefix := 'TS-BIL-'; v_barcode_prefix := '22';
      when 'laptop' then v_next := nextval('private.technical_service_laptop_seq'); v_prefix := 'TS-LAP-'; v_barcode_prefix := '23';
      when 'playstation' then v_next := nextval('private.technical_service_playstation_seq'); v_prefix := 'TS-PS-'; v_barcode_prefix := '24';
    end case;
    new.service_code := v_prefix || lpad(v_next::text, 6, '0');
  end if;
  if new.barcode is null or btrim(new.barcode) = '' then
    if v_next is null then
      v_next := right(new.service_code, 6)::bigint;
      v_barcode_prefix := case new.service_type when 'phone' then '21' when 'computer' then '22' when 'laptop' then '23' when 'playstation' then '24' end;
    end if;
    new.barcode := v_barcode_prefix || lpad(v_next::text, 10, '0');
  end if;
  return new;
end; $$;
revoke all on function private.assign_technical_service_code() from public, anon, authenticated;

update public.technical_service_records
set barcode = case service_type when 'phone' then '21' when 'computer' then '22' when 'laptop' then '23' when 'playstation' then '24' end || lpad(right(service_code, 6), 10, '0');

alter table public.technical_service_records drop constraint if exists technical_service_records_barcode_format_check;
alter table public.technical_service_records add constraint technical_service_records_barcode_format_check check (barcode ~ '^(21|22|23|24)[0-9]{10}$');
