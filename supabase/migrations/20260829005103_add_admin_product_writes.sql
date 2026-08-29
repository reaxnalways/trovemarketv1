create table if not exists private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

revoke all on table private.admin_users from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

grant insert on table public.products to authenticated;

create policy "Admins can view all products"
on public.products
for select
to authenticated
using ((select private.is_admin()));

create policy "Admins can create products"
on public.products
for insert
to authenticated
with check ((select private.is_admin()));
