-- =============================================================================
-- NEST76 STUDIO — Enable RLS
-- Semua akses server (Next.js + Edge Functions) pakai service role → bypass RLS.
-- RLS hanya memblokir akses langsung dari browser (anon/authenticated key).
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. HANDOVER
-- ---------------------------------------------------------------------------
alter table public.handover enable row level security;

-- User bisa lihat handover milik sendiri
create policy "handover_select_own"
  on public.handover for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      org_id is not null
      and org_id in (
        select org_id from public.profiles
        where id = auth.uid() and org_id is not null
      )
    )
  );

-- User hanya bisa insert untuk diri sendiri
create policy "handover_insert_own"
  on public.handover for insert
  to authenticated
  with check (user_id = auth.uid());

-- User hanya bisa update handover milik sendiri
create policy "handover_update_own"
  on public.handover for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- User hanya bisa delete handover milik sendiri
create policy "handover_delete_own"
  on public.handover for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. HANDOVER_ITEMS
-- ---------------------------------------------------------------------------
alter table public.handover_items enable row level security;

-- Items ikut visibility handover
create policy "handover_items_select"
  on public.handover_items for select
  to authenticated
  using (
    handover_id in (
      select id from public.handover
      where user_id = auth.uid()
      or (
        org_id is not null
        and org_id in (
          select org_id from public.profiles
          where id = auth.uid() and org_id is not null
        )
      )
    )
  );

create policy "handover_items_insert"
  on public.handover_items for insert
  to authenticated
  with check (
    handover_id in (
      select id from public.handover where user_id = auth.uid()
    )
  );

create policy "handover_items_update"
  on public.handover_items for update
  to authenticated
  using (
    handover_id in (
      select id from public.handover where user_id = auth.uid()
    )
  );

create policy "handover_items_delete"
  on public.handover_items for delete
  to authenticated
  using (
    handover_id in (
      select id from public.handover where user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. RECEIVE_EVENT
-- ---------------------------------------------------------------------------
alter table public.receive_event enable row level security;

-- Penerima (public/anon) bisa insert — untuk konfirmasi QR scan
create policy "receive_event_insert_public"
  on public.receive_event for insert
  to anon, authenticated
  with check (true);

-- Pengirim bisa lihat receive_event untuk handover miliknya
create policy "receive_event_select_own"
  on public.receive_event for select
  to authenticated
  using (
    handover_id in (
      select id from public.handover
      where user_id = auth.uid()
      or (
        org_id is not null
        and org_id in (
          select org_id from public.profiles
          where id = auth.uid() and org_id is not null
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 4. PROFILES
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- User hanya bisa lihat profil sendiri
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- User hanya bisa update profil sendiri
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Insert profil hanya untuk diri sendiri (handle_new_user trigger pakai service role)
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. ORGANIZATIONS
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;

-- Member bisa lihat org mereka sendiri
create policy "organizations_select_member"
  on public.organizations for select
  to authenticated
  using (
    id in (
      select org_id from public.profiles
      where id = auth.uid() and org_id is not null
    )
  );

-- Hanya owner yang bisa update org
create policy "organizations_update_owner"
  on public.organizations for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Insert org — siapapun yang authenticated bisa buat org baru
create policy "organizations_insert"
  on public.organizations for insert
  to authenticated
  with check (owner_id = auth.uid());

commit;
