alter table public.technical_service_records
  add column if not exists service_type text,
  add column if not exists service_code text,
  add column if not exists barcode text;

create sequence if not exists private.technical_service_phone_seq start 1;
create sequence if not exists private.technical_service_computer_seq start 1;
create sequence if not exists private.technical_service_laptop_seq start 1;
create sequence if not exists private.technical_service_playstation_seq start 1;

create or replace function private.assign_technical_service_code()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_next bigint; v_prefix text;
begin
  if new.service_type not in ('phone','computer','laptop','playstation') then raise exception 'Geçersiz teknik servis türü'; end if;
  if new.service_code is null or btrim(new.service_code) = '' then
    case new.service_type
      when 'phone' then v_next := nextval('private.technical_service_phone_seq'); v_prefix := 'TS-TEL-';
      when 'computer' then v_next := nextval('private.technical_service_computer_seq'); v_prefix := 'TS-BIL-';
      when 'laptop' then v_next := nextval('private.technical_service_laptop_seq'); v_prefix := 'TS-LAP-';
      when 'playstation' then v_next := nextval('private.technical_service_playstation_seq'); v_prefix := 'TS-PS-';
    end case;
    new.service_code := v_prefix || lpad(v_next::text, 6, '0');
  end if;
  if new.barcode is null or btrim(new.barcode) = '' then new.barcode := new.service_code; end if;
  return new;
end; $$;
revoke all on function private.assign_technical_service_code() from public, anon, authenticated;

drop trigger if exists assign_technical_service_code_trigger on public.technical_service_records;
create trigger assign_technical_service_code_trigger before insert on public.technical_service_records for each row execute function private.assign_technical_service_code();

update public.technical_service_records set service_type = coalesce(service_type, 'phone') where service_type is null;
update public.technical_service_records set service_code = 'TS-TEL-' || lpad(nextval('private.technical_service_phone_seq')::text, 6, '0') where service_code is null;
update public.technical_service_records set barcode = service_code where barcode is null;

alter table public.technical_service_records alter column service_type set not null, alter column service_code set not null, alter column barcode set not null;
alter table public.technical_service_records drop constraint if exists technical_service_records_service_type_check;
alter table public.technical_service_records add constraint technical_service_records_service_type_check check (service_type in ('phone','computer','laptop','playstation'));
create unique index if not exists technical_service_records_service_code_key on public.technical_service_records(service_code);
create unique index if not exists technical_service_records_barcode_key on public.technical_service_records(barcode);
create index if not exists technical_service_records_service_type_idx on public.technical_service_records(service_type);

alter table private.technical_service_record_history add column if not exists service_type text, add column if not exists service_code text, add column if not exists barcode text;

create or replace function private.capture_technical_service_record_history()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into private.technical_service_record_history (
    record_id, action, first_name, last_name, phone, damage_cost, labor_cost, amount_paid, created_by,
    created_at, updated_at, archived_at, archived_by, service_type, service_code, barcode
  ) values (
    new.id, case when tg_op = 'INSERT' then 'insert' else 'update' end,
    new.first_name, new.last_name, new.phone, new.damage_cost, new.labor_cost, new.amount_paid, new.created_by,
    new.created_at, new.updated_at, new.archived_at, new.archived_by, new.service_type, new.service_code, new.barcode
  );
  return new;
end; $$;
revoke all on function private.capture_technical_service_record_history() from public, anon, authenticated;
