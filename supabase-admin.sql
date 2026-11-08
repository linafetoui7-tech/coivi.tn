-- =====================================================
-- COIVI.TN - ADMIN PERMISSIONS
-- =====================================================

-- Helper function: checks whether the connected user is an admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.user_roles
        where user_id = auth.uid()
        and role = 'admin'
    );
$$;

grant execute on function public.is_admin() to authenticated;

-- =====================================================
-- ADMIN POLICIES FOR RIDES
-- =====================================================

-- Admin can see all rides, including unavailable ones.
create policy "Admins can view all rides"
on public.rides
for select
to authenticated
using (public.is_admin());

-- Admin can create rides.
create policy "Admins can create rides"
on public.rides
for insert
to authenticated
with check (public.is_admin());

-- Admin can update rides.
create policy "Admins can update rides"
on public.rides
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin can delete rides.
create policy "Admins can delete rides"
on public.rides
for delete
to authenticated
using (public.is_admin());

-- =====================================================
-- ADMIN POLICIES FOR RESERVATIONS
-- =====================================================

-- Admin can see every reservation.
create policy "Admins can view all reservations"
on public.reservations
for select
to authenticated
using (public.is_admin());

-- Admin can update reservation status.
create policy "Admins can update reservations"
on public.reservations
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =====================================================
-- PERMISSIONS
-- =====================================================

grant insert, update, delete
on public.rides
to authenticated;

grant select, update
on public.reservations
to authenticated;