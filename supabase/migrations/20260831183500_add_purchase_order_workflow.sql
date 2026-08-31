create sequence if not exists public.purchase_order_number_seq start 1;

alter table public.purchase_requests
  add column if not exists order_number text,
  add column if not exists admin_note text,
  add column if not exists tracking_code text,
  add column if not exists status_changed_at timestamptz not null default now(),
  add column if not exists payment_received_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz;

update public.purchase_requests
set order_number = 'SIP-' || to_char(created_at at time zone 'Europe/Istanbul', 'YYYYMMDD') || '-' || upper(substr(replace(id::text,'-',''),1,6))
where order_number is null;

alter table public.purchase_requests alter column order_number set not null;
create unique index if not exists purchase_requests_order_number_uidx on public.purchase_requests(order_number);

alter table public.purchase_requests drop constraint if exists purchase_requests_status_check;
alter table public.purchase_requests add constraint purchase_requests_status_check
check (status in ('new','contacted','awaiting_payment','paid','preparing','shipped','completed','cancelled'));

create table if not exists public.purchase_status_history (
  id uuid primary key default gen_random_uuid(),
  purchase_request_id uuid not null references public.purchase_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.purchase_status_history enable row level security;

do $$ begin
  create policy "Admins can view purchase status history" on public.purchase_status_history
  for select to authenticated using ((select private.is_admin()));
exception when duplicate_object then null; end $$;

create or replace function public.update_purchase_order_status(
  p_purchase_id uuid,
  p_status text,
  p_admin_note text default null,
  p_tracking_code text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.purchase_requests%rowtype;
  v_conflict boolean;
  v_user uuid := auth.uid();
begin
  if not private.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;
  if p_status not in ('new','contacted','awaiting_payment','paid','preparing','shipped','completed','cancelled') then raise exception 'INVALID_STATUS'; end if;

  select * into v_order from public.purchase_requests where id = p_purchase_id for update;
  if v_order.id is null then raise exception 'ORDER_NOT_FOUND'; end if;

  if p_status in ('awaiting_payment','paid','preparing','shipped','completed') then
    select exists(
      select 1 from public.purchase_requests pr
      where pr.product_id = v_order.product_id
        and pr.id <> v_order.id
        and pr.status in ('awaiting_payment','paid','preparing','shipped','completed')
    ) into v_conflict;
    if v_conflict then raise exception 'PRODUCT_RESERVED_BY_ANOTHER_ORDER'; end if;
  end if;

  if p_status in ('awaiting_payment','paid','preparing','shipped') then
    update public.products set stock_status = 'reserved', updated_at = now()
    where id = v_order.product_id and stock_status in ('in_stock','reserved');
  elsif p_status = 'completed' then
    update public.products set stock_status = 'sold', updated_at = now() where id = v_order.product_id;
  elsif p_status = 'cancelled' and v_order.status in ('awaiting_payment','paid','preparing','shipped') then
    update public.products set stock_status = 'in_stock', updated_at = now()
    where id = v_order.product_id and stock_status = 'reserved';
  end if;

  update public.purchase_requests set
    status = p_status,
    admin_note = nullif(trim(coalesce(p_admin_note,'')),''),
    tracking_code = case when p_status in ('shipped','completed') then nullif(trim(coalesce(p_tracking_code,'')),'') else coalesce(nullif(trim(coalesce(p_tracking_code,'')),''), tracking_code) end,
    status_changed_at = now(),
    payment_received_at = case when p_status in ('paid','preparing','shipped','completed') then coalesce(payment_received_at, now()) else payment_received_at end,
    shipped_at = case when p_status in ('shipped','completed') then coalesce(shipped_at, now()) else shipped_at end,
    completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else completed_at end,
    cancelled_at = case when p_status = 'cancelled' then coalesce(cancelled_at, now()) else cancelled_at end,
    updated_at = now()
  where id = p_purchase_id;

  if v_order.status is distinct from p_status then
    insert into public.purchase_status_history(purchase_request_id, from_status, to_status, note, changed_by)
    values (p_purchase_id, v_order.status, p_status, nullif(trim(coalesce(p_admin_note,'')),''), v_user);
  end if;
end;
$$;

grant execute on function public.update_purchase_order_status(uuid,text,text,text) to authenticated;

create or replace function public.assign_purchase_order_number() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.order_number is null or trim(new.order_number) = '' then
    new.order_number := 'SIP-' || to_char(now() at time zone 'Europe/Istanbul','YYYYMMDD') || '-' || lpad(nextval('public.purchase_order_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_purchase_order_number on public.purchase_requests;
create trigger trg_assign_purchase_order_number before insert on public.purchase_requests
for each row execute function public.assign_purchase_order_number();
