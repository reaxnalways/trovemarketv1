alter table public.technical_service_records
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id);

create index if not exists technical_service_records_archived_at_idx
  on public.technical_service_records (archived_at);

create index if not exists technical_service_records_archived_by_idx
  on public.technical_service_records (archived_by);

create table if not exists private.technical_service_record_history (
  history_id bigint generated always as identity primary key,
  record_id uuid not null,
  action text not null check (action in ('snapshot','insert','update')),
  first_name text not null,
  last_name text not null,
  phone text not null,
  damage_cost numeric(12,2) not null,
  labor_cost numeric(12,2) not null,
  amount_paid numeric(12,2) not null,
  created_by uuid not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  archived_at timestamptz,
  archived_by uuid,
  captured_at timestamptz not null default now()
);

revoke all on table private.technical_service_record_history from public, anon, authenticated;

insert into private.technical_service_record_history (
  record_id, action, first_name, last_name, phone,
  damage_cost, labor_cost, amount_paid, created_by,
  created_at, updated_at, archived_at, archived_by
)
select
  id, 'snapshot', first_name, last_name, phone,
  damage_cost, labor_cost, amount_paid, created_by,
  created_at, updated_at, archived_at, archived_by
from public.technical_service_records;

create or replace function private.capture_technical_service_record_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.technical_service_record_history (
    record_id, action, first_name, last_name, phone,
    damage_cost, labor_cost, amount_paid, created_by,
    created_at, updated_at, archived_at, archived_by
  ) values (
    new.id,
    case when tg_op = 'INSERT' then 'insert' else 'update' end,
    new.first_name, new.last_name, new.phone,
    new.damage_cost, new.labor_cost, new.amount_paid, new.created_by,
    new.created_at, new.updated_at, new.archived_at, new.archived_by
  );
  return new;
end;
$$;

revoke all on function private.capture_technical_service_record_history() from public, anon, authenticated;

drop trigger if exists technical_service_record_history_trigger on public.technical_service_records;
create trigger technical_service_record_history_trigger
after insert or update on public.technical_service_records
for each row execute function private.capture_technical_service_record_history();

drop policy if exists "Admins can delete technical service records" on public.technical_service_records;
revoke delete on table public.technical_service_records from authenticated;
grant select, insert, update on table public.technical_service_records to authenticated;
