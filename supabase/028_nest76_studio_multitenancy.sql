-- NEST76 STUDIO: organizations, profile roles, handover org/staff attribution
begin;

-- ---------------------------------------------------------------------------
-- Organizations (UMKM / studio tenant)
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  logo_url text,
  invite_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_invite_code_len check (char_length(invite_code) >= 6)
);

create unique index if not exists organizations_invite_code_unique
  on public.organizations (invite_code);

create index if not exists idx_organizations_owner
  on public.organizations (owner_id);

comment on table public.organizations is 'NEST76 STUDIO tenant (UMKM workspace).';

-- ---------------------------------------------------------------------------
-- Profiles: org membership + role (OWNER = boss, STAFF = employee)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists org_id uuid references public.organizations (id) on delete set null;

alter table public.profiles
  add column if not exists role text;

do $$
begin
  alter table public.profiles
    add constraint profiles_role_check
    check (role is null or role in ('OWNER', 'STAFF'));
exception
  when duplicate_object then null;
end$$;

update public.profiles set role = 'OWNER' where role is null;

-- ---------------------------------------------------------------------------
-- Handovers: org scope + creator (staff) attribution
-- ---------------------------------------------------------------------------
alter table public.handover
  add column if not exists org_id uuid references public.organizations (id) on delete set null;

alter table public.handover
  add column if not exists staff_id uuid references auth.users (id) on delete set null;

create index if not exists idx_handover_org_id
  on public.handover (org_id)
  where org_id is not null;

create index if not exists idx_handover_org_staff
  on public.handover (org_id, staff_id)
  where org_id is not null;

comment on column public.handover.org_id is 'Studio (UMKM) this handover belongs to.';
comment on column public.handover.staff_id is 'User who created the handover (owner or staff).';

commit;
